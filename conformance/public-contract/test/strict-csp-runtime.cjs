'use strict';
// Direct regression tool. Internal handoff/validator access below is test-only;
// it exposes no new package export and never replaces the public bytes/Read path.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { createRequire } = require('node:module');
const B = require('./browser-runtime.cjs'),
  F = require('./bytes-fixtures.cjs');
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
async function exercise(api, config, origin) {
  const rows = [],
    copy = (v) => JSON.parse(JSON.stringify(v)),
    jcs = (v) =>
      v && typeof v === 'object'
        ? Array.isArray(v)
          ? '[' + v.map(jcs).join(',') + ']'
          : '{' +
            Object.keys(v)
              .sort()
              .map((k) => JSON.stringify(k) + ':' + jcs(v[k]))
              .join(',') +
            '}'
        : JSON.stringify(v);
  const bytes = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
  const check = (id, matched, detail) => {
    rows.push({ id, matched, detail });
  };
  for (const f of config.assets) {
    const result = api.admit(bytes(f.base64));
    check(
      f.id,
      result.status === f.status && (f.reason === undefined || result.reason === f.reason),
      {
        status: result.status,
        reason: result.reason ?? null,
        diagnostics: result.diagnostics ?? [],
      },
    );
  }
  for (const c of config.schemaCases) {
    const fn = api.test[c.group][c.name] ?? api.test[c.group],
      value = copy(c.data),
      valid = fn(value),
      errors = copy(fn.errors ?? []);
    check(
      'schema:' + c.id,
      valid === c.valid && JSON.stringify(errors) === JSON.stringify(c.errors),
      { valid, errors },
    );
  }
  const accepted = api.admit(bytes(config.assets[0].base64)),
    v = api.boundary.inspectSnapshot(accepted.snapshot);
  if (!v) throw Error('Valid fixture did not produce a private snapshot');
  let seq = 0;
  const control = api.embed.createTrustedReadControlProvider(() => ({
    admission_response_limit_bytes: 4096,
  }));
  const host = api.embed.createTrustedHostReadProvider({
    observe: ({ request, snapshot }) => {
      const view = api.boundary.inspectSnapshot(snapshot),
        now = Date.now();
      return {
        host_id: 'host:strict-csp',
        host_epoch: 'epoch:1',
        decision_id: 'decision:' + ++seq,
        request_id: request.request_id,
        snapshot_id: view.snapshot_id,
        A: view.digests.A.observed,
        C: view.digests.C.observed,
        scope: view.ir.nodes.map((n) => n.id),
        issued_at: now,
        expires_at: now + 60000,
        current_ms: now,
        decision: 'allow',
        policy_id: 'policy:strict-csp',
      };
    },
    deliver: () => true,
  });
  const candidate = {
    request_id: 'csp:exact',
    tuple: v.tuple,
    budget_bytes: 1000000,
    mode: 'exact_selection',
    selection: { ...v.asset, judgment_id: v.ir.nodes.find((n) => n.role === 'judgment').value.id },
    handle: null,
  };
  delete candidate.selection.judgment_version;
  const read = await api.read(accepted.snapshot, candidate, control, host);
  check('local-read', read.envelope?.status === 'ready', {
    status: read.envelope?.status,
    diagnostics: read.envelope?.diagnostics,
  });
  if (read.envelope?.status !== 'ready') throw Error('Read not ready');
  const cloned = await api.read(copy(accepted.snapshot), candidate, control, host);
  check('snapshot-clone-rejected', cloned.envelope?.content === null, {
    diagnostics: cloned.envelope?.diagnostics,
  });
  const plan = {
    contract: v.tuple.plan,
    finite_test_stage_observation: 'independently admitted opaque plan premise',
  };
  const handoff = {
    contract: 'kdna.package-set-handoff/0.1.0',
    tuple: v.tuple,
    set_id: 'set:1',
    members: [
      {
        member_id: 'member:1',
        asset_id: v.asset.asset_id,
        asset_version: v.asset.asset_version,
        A: v.digests.A.observed,
        C: v.digests.C.observed,
        snapshot_id: v.snapshot_id,
      },
    ],
    selection: candidate.selection,
    closure_digest: api.test.digests.capsuleDigest(read.envelope.content.closure),
    read_receipt_id: read.envelope.receipt.receipt_id,
    plan_digest: api.test.digests.capsuleDigest(plan),
    host_id: read.envelope.receipt.host_id,
    host_epoch: read.envelope.receipt.host_epoch,
  };
  const context = {
    snapshots: [{ member_id: 'member:1', snapshot: accepted.snapshot }],
    deliveredRead: read,
    observeAdmittedPlan: () => plan,
  };
  for (const [id, h, c, expected] of [
    ['valid', handoff, context, true],
    ['unknown-field', { ...handoff, extra: true }, context, false],
    ['receipt', { ...handoff, read_receipt_id: 'wrong' }, context, false],
    ['closure', { ...handoff, closure_digest: 'sha256:' + '0'.repeat(64) }, context, false],
    [
      'plan',
      handoff,
      { ...context, observeAdmittedPlan: () => ({ ...plan, changed: true }) },
      false,
    ],
    [
      'snapshot',
      handoff,
      { ...context, snapshots: [{ member_id: 'member:1', snapshot: copy(accepted.snapshot) }] },
      false,
    ],
  ]) {
    const actual = api.test.handoff.verifyHandoffBindings(h, c);
    check('handoff:' + id, actual === expected, { actual });
  }
  const base = read.envelope;
  function recount(body) {
    body.budget.actual_bytes = body.budget.required_bytes = '0000000000000000';
    const n = new TextEncoder().encode(jcs(body)).length;
    body.budget.actual_bytes = body.budget.required_bytes = String(n).padStart(16, '0');
    return jcs(body);
  }
  const variants = [
    ['valid', copy(base), 'accepted'],
    ['catalog', copy(base), 'rejected'],
    ['owner', copy(base), 'rejected'],
    ['schema', copy(base), 'rejected'],
    ['context', copy(base), 'rejected'],
  ];
  variants[1][1].content.catalog[0].node_ref = 'node:missing';
  variants[2][1].content.closure.find(
    (n) => n.id === base.content.catalog[0].node_ref,
  ).owner_judgment_id = 'judgment:wrong';
  variants[3][1].extra = true;
  for (const [id, body, expected] of variants) {
    const endpoint = origin + '/echo',
      c = {
        association_id: 'csp:' + id + ':' + crypto.randomUUID(),
        endpoint_id: 'endpoint:csp',
        session_id: 'session:csp',
        endpoint_url: endpoint,
        issued_at_ms: Date.now() - 5,
        expires_at_ms: Date.now() + 60000,
        outbound_request_json: JSON.stringify(candidate),
        correlation: { state: 'validated', request_id: candidate.request_id },
        expected_tuple: base.tuple,
        expected_asset: base.asset,
        expected_digests: Object.fromEntries(
          ['A', 'C', 'E'].map((k) => [k, base.digests[k].observed]),
        ),
        expected_snapshot_id: base.snapshot_id,
        max_response_bytes: 1000000,
        max_read_ms: 2000,
        admission_response_limit_bytes: 4096,
      };
    if (id === 'context') c.extra = true;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: recount(body),
      }),
      result = await api.transport(response, c);
    check(
      'transport:' + id,
      result.status === expected && (expected !== 'rejected' || result.response === null),
      { status: result.status, code: result.rejection?.code ?? null, proof: result.proof_scope },
    );
  }
  return rows;
}
async function main() {
  const [runtime, root, out] = process.argv.slice(2);
  for (const p of [runtime, root, out]) assert(path.isAbsolute(p));
  fs.mkdirSync(out, { recursive: true });
  const req = createRequire(path.join(runtime, 'package.json')),
    coreDir = path.join(runtime, 'node_modules/@aikdna/kdna-core'),
    readDir = path.join(runtime, 'node_modules/@aikdna/kdna-read');
  const old = createRequire(path.join(root, 'baseline-runtime/package.json')),
    Ajv = old('ajv/dist/2020.js');
  const original = fs.readFileSync(path.join(root, 'fixtures/one.kdna')),
    tuple = require(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
  const assets = [{ id: 'one.kdna', base64: original.toString('base64'), status: 'accepted' }];
  for (const [id, mutate] of [
    [
      'manifest-unknown',
      (a) => {
        a.manifest.extra = true;
      },
    ],
    [
      'payload-unknown',
      (a) => {
        a.payload.extra = true;
      },
    ],
    [
      'payload-missing',
      (a) => {
        delete a.payload.asset;
      },
    ],
  ]) {
    const a = F.blank(tuple);
    mutate(a);
    assets.push({
      id,
      base64: F.encode(a, req).toString('base64'),
      status: 'rejected',
      reason: 'READ_CORE_INVALID',
    });
  }
  assets.push({
    id: 'malformed-container',
    base64: 'AQID',
    status: 'rejected',
    reason: 'READ_CORE_INVALID',
  });
  const v = req('@aikdna/kdna-core/read-boundary').inspectSnapshot(
      req('@aikdna/kdna-core/browser').admitBrowser(original).snapshot,
    ),
    sample = F.blank(tuple),
    schemaCases = [];
  const configs = [
    ['validators', 'Manifest', 'schema/manifest-0.2.schema.json', sample.manifest],
    ['validators', 'Payload', 'schema/payload-profile-0.2.schema.json', sample.payload],
    ['validators', 'CanonicalIR', 'schema/canonical-ir-0.1.schema.json', v.ir],
  ];
  for (const [group, name, file, good] of configs) {
    const oracle = new Ajv({
      strict: true,
      strictTypes: false,
      strictRequired: false,
      allErrors: true,
      validateFormats: false,
    }).compile(JSON.parse(fs.readFileSync(path.join(coreDir, file))));
    for (const [label, data] of [
      ['valid', good],
      ['empty', {}],
      ['null', null],
      ['extra', { ...good, unexpected: 1 }],
    ]) {
      const valid = oracle(data);
      schemaCases.push({
        id: name + ':' + label,
        group,
        name,
        data,
        valid,
        errors: JSON.parse(JSON.stringify(oracle.errors ?? [])),
      });
    }
  }
  const config = { assets, schemaCases },
    extras = {
      handoff: './node_modules/@aikdna/kdna-core/src/public-contract/package-set.js',
      digests: './node_modules/@aikdna/kdna-core/src/public-contract/digests.js',
      validators: './node_modules/@aikdna/kdna-core/src/public-contract/validators.generated.js',
    };
  const bundle = B.bundle(runtime, path.join(out, 'bundle.js'), [
    '@aikdna/kdna-read/transport',
    ...Object.values(extras),
  ]);
  let code = fs.readFileSync(bundle.path, 'utf8');
  const marker = 'return {transport:entries[';
  assert(code.includes(marker));
  code = code.replace(
    marker,
    'return {test:{' +
      Object.entries(extras)
        .map(([k, s]) => JSON.stringify(k) + ':load(entries[' + JSON.stringify(s) + '])')
        .join(',') +
      '},transport:entries[',
  );
  fs.writeFileSync(bundle.path, code);
  bundle.bytes = Buffer.byteLength(code);
  bundle.sha256 = hash(Buffer.from(code));
  assert(
    !bundle.modules.some((m) => /\/ajv\/dist\/(compile|core\.js|2020\.js)/.test(m.path)),
    'Runtime compiler entered browser graph',
  );
  assert(
    !/\bnew\s+Function\s*\(|\beval\s*\(/.test(code),
    'Runtime code generation source entered graph',
  );
  const result = {
    runtime,
    started_at: new Date().toISOString(),
    bundle,
    config,
    node: [],
    browsers: [],
    traffic: [],
    csp: "default-src 'none'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'",
  };
  const save = () =>
    fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  const probe = `'use strict'; window.observation={violations:[],errors:[]}; document.addEventListener('securitypolicyviolation',e=>observation.violations.push({effectiveDirective:e.effectiveDirective,blockedURI:e.blockedURI,disposition:e.disposition,sourceFile:e.sourceFile,lineNumber:e.lineNumber,originalPolicy:e.originalPolicy})); (${exercise.toString()})(createKDNA(),${JSON.stringify(config)},location.origin).then(async rows=>{await new Promise(r=>setTimeout(r,50));observation.rows=rows;observation.done=true}).catch(e=>{observation.errors.push({name:e.name,message:e.message,stack:e.stack});observation.done=true});`;
  fs.writeFileSync(path.join(out, 'probe.js'), probe);
  const server = http.createServer((request, response) => {
    result.traffic.push({ url: request.url, method: request.method });
    response.setHeader('Content-Security-Policy', result.csp);
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/echo') {
      const chunks = [];
      request.on('data', (b) => chunks.push(b));
      request.on('end', () => {
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.setHeader('x-kdna-channel', 'read_envelope');
        response.end(Buffer.concat(chunks));
      });
    } else if (request.url === '/bundle.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(fs.readFileSync(path.join(out, 'bundle.js')));
    } else if (request.url === '/probe.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(fs.readFileSync(path.join(out, 'probe.js')));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        '<!doctype html><script defer src="/bundle.js"></script><script defer src="/probe.js"></script>Strict CSP regression',
      );
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const origin = 'http://127.0.0.1:' + server.address().port;
  result.origin = origin;
  try {
    const api = {
      admit: req('@aikdna/kdna-core/browser').admitBrowser,
      boundary: req('@aikdna/kdna-core/read-boundary'),
      read: req('@aikdna/kdna-read/browser').readBrowser,
      embed: req('@aikdna/kdna-read/embedding'),
      transport: req('@aikdna/kdna-read/transport').admitReadTransportResponse,
      test: Object.fromEntries(
        Object.entries(extras).map(([k, s]) => [k, require(path.resolve(runtime, s))]),
      ),
    };
    const oldCore = path.join(root, 'baseline-runtime/node_modules/@aikdna/kdna-core');
    const oracleValidators = Object.fromEntries(
      configs.map(([group, name, file]) => [
        name,
        new Ajv({
          strict: true,
          strictTypes: false,
          strictRequired: false,
          allErrors: true,
          validateFormats: false,
        }).compile(JSON.parse(fs.readFileSync(path.join(oldCore, file)))),
      ]),
    );
    const oldApi = {
      admit: old('@aikdna/kdna-core/browser').admitBrowser,
      boundary: old('@aikdna/kdna-core/read-boundary'),
      read: old('@aikdna/kdna-read/browser').readBrowser,
      embed: old('@aikdna/kdna-read/embedding'),
      transport: old('@aikdna/kdna-read/transport').admitReadTransportResponse,
      test: {
        validators: oracleValidators,
        handoff: require(path.join(oldCore, 'src/public-contract/package-set.js')),
        digests: require(path.join(oldCore, 'src/public-contract/digests.js')),
      },
    };
    result.baselineNode = await exercise(oldApi, config, origin);
    result.node = await exercise(api, config, origin);
    assert.equal(
      JSON.stringify(result.node),
      JSON.stringify(result.baselineNode),
      'Old exact Node behavior/diagnostic parity',
    );
    save();
    const pw = require(path.join(root, 'tools/node_modules/playwright'));
    for (const name of ['chromium', 'webkit']) {
      const row = {
        name,
        console: [],
        page_errors: [],
        requests: [],
        started_at: new Date().toISOString(),
      };
      result.browsers.push(row);
      let browser, context;
      try {
        browser = await pw[name].launch({
          headless: true,
          ...(name === 'chromium'
            ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
            : {}),
          downloadsPath: path.join(out, 'downloads-' + name),
        });
        row.version = browser.version();
        context = await browser.newContext();
        await context.route('**/*', (r) =>
          r
            .request()
            .url()
            .startsWith(origin + '/')
            ? r.continue()
            : r.abort(),
        );
        const page = await context.newPage();
        page.on('console', (m) => row.console.push({ type: m.type(), text: m.text() }));
        page.on('pageerror', (e) =>
          row.page_errors.push({ name: e.name, message: e.message, stack: e.stack }),
        );
        page.on('request', (r) => row.requests.push(r.url()));
        const response = await page.goto(origin);
        row.headers = await response.allHeaders();
        await page.waitForFunction(() => window.observation?.done, {}, { timeout: 20000 });
        row.observation = await page.evaluate(() => window.observation);
      } finally {
        if (context) await context.close();
        if (browser) await browser.close();
        row.closed = true;
        row.closed_at = new Date().toISOString();
        save();
      }
    }
    const reference = JSON.stringify(result.node);
    for (const b of result.browsers) {
      assert.equal(b.observation.errors.length, 0);
      assert.equal(b.observation.violations.length, 0);
      assert.equal(b.page_errors.length, 0);
      assert.equal(
        JSON.stringify(b.observation.rows),
        reference,
        'Node/browser complete observation parity',
      );
    }
    assert(
      result.node.every((x) => x.matched),
      JSON.stringify(result.node.filter((x) => !x.matched)),
    );
    result.status = 'MATCH';
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
    result.server_closed = true;
    result.ended_at = new Date().toISOString();
    save();
  }
  console.log(
    JSON.stringify({
      status: result.status,
      cases: result.node.length,
      total: result.node.length * 3,
      browsers: result.browsers.map((b) => ({
        name: b.name,
        version: b.version,
        CSP: b.observation.violations.length,
        closed: b.closed,
      })),
      out,
    }),
  );
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
