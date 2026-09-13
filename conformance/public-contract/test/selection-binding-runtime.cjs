'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const { createRequire } = require('node:module'),
  { pathToFileURL } = require('node:url');
const B = require('./browser-runtime.cjs');
const jcs = (v) =>
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
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const copy = (v) => JSON.parse(JSON.stringify(v));
function recount(body) {
  body.budget.actual_bytes = '0000000000000000';
  body.budget.required_bytes = '0000000000000000';
  const n = Buffer.byteLength(jcs(body));
  body.budget.actual_bytes = body.budget.required_bytes = String(n).padStart(16, '0');
  return Buffer.from(jcs(body));
}
async function receiveAll(admit, base, fixtures) {
  const rows = [];
  for (const fixture of fixtures) {
    const context = {
      ...fixture.context,
      association_id: 'binding:' + Math.random(),
      endpoint_url: base + '/case/' + fixture.id,
      issued_at_ms: Date.now() - 5,
      expires_at_ms: Date.now() + 60000,
    };
    const response = await fetch(context.endpoint_url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: context.outbound_request_json,
    });
    const result = await admit(response, context),
      matched =
        fixture.expected === 'accepted'
          ? result.status === 'accepted'
          : result.status === 'rejected' &&
            result.rejection?.code === 'READ_TRANSPORT_BINDING_MISMATCH' &&
            result.response === null &&
            result.proof_scope.observable_bindings === false;
    rows.push({
      id: fixture.id,
      expected: fixture.expected,
      matched,
      context,
      http: { status: response.status, headers: Object.fromEntries(response.headers) },
      result,
    });
  }
  return rows;
}
async function main() {
  const [runtime, roleRoot, output] = process.argv.slice(2);
  for (const p of [runtime, roleRoot, output]) assert.ok(path.isAbsolute(p));
  fs.mkdirSync(output, { recursive: true });
  const req = createRequire(path.join(runtime, 'package.json')),
    boundary = req('@aikdna/kdna-core/read-boundary'),
    embed = req('@aikdna/kdna-read/embedding'),
    read = req('@aikdna/kdna-read/browser').readBrowser,
    admit = req('@aikdna/kdna-read/transport').admitReadTransportResponse;
  const { readResultResponse } = await import(
    pathToFileURL(
      path.join(roleRoot, 'host-runtime/node_modules/@aikdna/kdna-web-server/src/index.js'),
    )
  );
  const local = req('@aikdna/kdna-core/browser').admitBrowser(
    new Uint8Array(fs.readFileSync(path.join(roleRoot, 'inputs/optional.kdna'))),
  );
  assert.equal(local.status, 'accepted');
  const view = boundary.inspectSnapshot(local.snapshot);
  let seq = 0;
  const control = embed.createTrustedReadControlProvider(() => ({
      admission_response_limit_bytes: 4096,
    })),
    host = embed.createTrustedHostReadProvider({
      observe: ({ request, snapshot }) => {
        const v = boundary.inspectSnapshot(snapshot),
          now = Date.now();
        return {
          host_id: 'host:binding-fixture',
          host_epoch: 'epoch:1',
          decision_id: 'decision:' + ++seq,
          request_id: request.request_id,
          snapshot_id: v.snapshot_id,
          A: v.digests.A.observed,
          C: v.digests.C.observed,
          scope: v.ir.nodes.map((n) => n.id),
          issued_at: now,
          expires_at: now + 60000,
          current_ms: now,
          decision: 'allow',
          policy_id: 'policy:binding-fixture',
        };
      },
      deliver: () => true,
    });
  const selection = {
      asset_id: view.asset.asset_id,
      asset_version: view.asset.asset_version,
      judgment_id: 'j:0',
    },
    candidate = {
      request_id: 'binding:exact',
      tuple: view.tuple,
      budget_bytes: 1000000,
      mode: 'exact_selection',
      selection,
      handle: null,
    };
  const exact = await read(local.snapshot, candidate, control, host);
  assert.equal(exact.envelope?.status, 'ready');
  const fixtures = [];
  function context(request, body) {
    return {
      association_id: 'placeholder',
      endpoint_id: 'endpoint:binding-fixture',
      session_id: 'session:binding',
      endpoint_url: 'http://127.0.0.1/placeholder',
      issued_at_ms: 0,
      expires_at_ms: 1,
      outbound_request_json: JSON.stringify(request),
      correlation: { state: 'validated', request_id: request.request_id },
      expected_tuple: body.tuple,
      expected_asset: body.asset,
      expected_digests: Object.fromEntries(
        ['A', 'C', 'E'].map((k) => [k, body.digests[k].observed]),
      ),
      expected_snapshot_id: body.snapshot_id,
      max_response_bytes: 1000000,
      max_read_ms: 2000,
      admission_response_limit_bytes: 4096,
    };
  }
  async function addActual(id, request, result) {
    assert.equal(result.envelope?.status, 'ready', id);
    const response = readResultResponse(result),
      bytes = Buffer.from(await response.arrayBuffer());
    fixtures.push({
      id,
      expected: 'accepted',
      context: context(request, result.envelope),
      body_base64: bytes.toString('base64'),
      bytes: bytes.length,
      sha256: sha(bytes),
      headers: Object.fromEntries(response.headers),
      status: response.status,
      provenance:
        'Actual public Core/browser snapshot and local Read/browser with explicit fixture Host; accepted Host0.3.1 wire encoder; transported over loopback HTTP.',
    });
  }
  await addActual('normal-exact', candidate, exact);
  for (const mode of ['catalog', 'whole_asset']) {
    const c = { ...candidate, request_id: 'binding:' + mode, mode, selection: null };
    await addActual('normal-' + mode, c, await read(local.snapshot, c, control, host));
  }
  const handle = exact.envelope.content.expansion_handles[0];
  assert.ok(handle);
  const expand = { ...candidate, request_id: 'binding:expand', mode: 'expand', handle };
  const expanded = await read(local.snapshot, expand, control, host);
  assert.equal(expanded.envelope?.status, 'ready');
  const targetOnly = !expanded.envelope.content.closure.some(
    (n) => n.role === 'judgment' && n.value.id === selection.judgment_id,
  );
  await addActual('normal-expand-actual-Core', expand, expanded);
  // Public R03 does not require every expand response to disclose the selected
  // judgment. This is a remote contract-shape fixture, not a claimed Core grant.
  const targetBody = copy(expanded.envelope),
    targetRequest = copy(expand);
  const selectedRef = targetBody.content.catalog[0].node_ref;
  targetBody.content.closure = targetBody.content.closure.filter((n) => n.id !== selectedRef);
  targetBody.content.references = targetBody.content.references.filter(
    (r) => r.source_node !== selectedRef && r.target_node !== selectedRef,
  );
  targetRequest.handle.scope = targetBody.content.closure.map((n) => n.id);
  const targetBytes = recount(targetBody);
  fixtures.push({
    id: 'normal-expand-target-only-contract-shape',
    expected: 'accepted',
    context: context(targetRequest, targetBody),
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-kdna-channel': 'read_envelope',
    },
    body_base64: targetBytes.toString('base64'),
    bytes: targetBytes.length,
    sha256: sha(targetBytes),
    provenance:
      'Explicit remote contract-shape compatibility fixture: no selected judgment is disclosed and requested handle scope matches received nodes. NOT a claim of current Core whitelist admission or Host authorization.',
  });
  const base = fixtures[0];
  function negative(id, mutate) {
    const body = copy(exact.envelope);
    mutate(body);
    const bytes = recount(body);
    fixtures.push({
      ...base,
      id,
      expected: 'rejected',
      body_base64: bytes.toString('base64'),
      bytes: bytes.length,
      sha256: sha(bytes),
      provenance:
        'Single received selection-identity mutation; counts recomputed without changing schema or expected public meaning.',
    });
  }
  const selected = (body) =>
    body.content.closure.find((n) => n.id === body.content.catalog[0].node_ref);
  negative('catalog-node-missing', (b) => {
    b.content.catalog[0].node_ref = 'judgment:missing';
  });
  negative('catalog-node-not-judgment', (b) => {
    b.content.catalog[0].node_ref = b.content.closure.find((n) => n.role !== 'judgment').id;
  });
  negative('selected-owner-wrong', (b) => {
    selected(b).owner_judgment_id = 'j:wrong';
  });
  negative('selected-value-id-wrong', (b) => {
    selected(b).value.id = 'j:wrong';
  });
  negative('duplicate-identical-node-ref', (b) => {
    b.content.closure.push(copy(selected(b)));
  });
  negative('ambiguous-node-ref-other-role', (b) => {
    const other = copy(b.content.closure.find((n) => n.role !== 'judgment'));
    other.id = b.content.catalog[0].node_ref;
    b.content.closure.push(other);
  });
  negative('selected-node-absent', (b) => {
    b.content.closure = b.content.closure.filter((n) => n.id !== b.content.catalog[0].node_ref);
  });
  const counterexamples = JSON.parse(
    fs.readFileSync(path.join(roleRoot, 'e-inputs/minimal-counterexamples.json')),
  );
  for (const item of counterexamples) {
    const bytes = Buffer.from(jcs(item.tampered));
    assert.equal(sha(bytes), item.received_sha256);
    assert.equal(bytes.length, item.received_bytes);
    fixtures.push({
      id: 'E-' + item.engine + '-' + item.case,
      expected: 'rejected',
      context: item.context,
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-kdna-channel': 'read_envelope',
      },
      body_base64: bytes.toString('base64'),
      bytes: bytes.length,
      sha256: sha(bytes),
      provenance:
        'Exact archived E response bytes; only current association URL/ID/lifetime are rebound. Original context is retained in the fixture.',
    });
  }
  const Ajv = req('ajv/dist/2020.js'),
    schema = JSON.parse(
      fs.readFileSync(
        path.join(
          runtime,
          'node_modules/@aikdna/kdna-read/schema/read-transport-admission-0.1.schema.json',
        ),
      ),
    ),
    ajv = new Ajv({
      strict: true,
      strictTypes: false,
      strictRequired: false,
      validateFormats: false,
      allErrors: true,
    });
  ajv.addSchema(schema);
  const validEnvelope = ajv.getSchema(schema.$id + '#/$defs/ReadEnvelope'),
    validResult = ajv.getSchema(schema.$id);
  for (const f of fixtures) {
    assert.ok(
      validEnvelope(JSON.parse(Buffer.from(f.body_base64, 'base64'))),
      f.id + JSON.stringify(validEnvelope.errors),
    );
  }
  const bundle = B.bundle(runtime, path.join(output, 'browser.js'), [
      '@aikdna/kdna-read/transport',
    ]),
    traffic = [],
    serverErrors = [];
  const server = http.createServer(async (q, r) => {
    try {
      if (q.url === '/') {
        r.setHeader('content-type', 'text/html');
        r.end(
          '<!doctype html><title>Selection binding verification</title><script src="/browser.js"></script>',
        );
        return;
      }
      if (q.url === '/browser.js') {
        r.setHeader('content-type', 'text/javascript');
        r.end(fs.readFileSync(path.join(output, 'browser.js')));
        return;
      }
      const f = fixtures.find((x) => '/case/' + x.id === q.url);
      if (!f) {
        r.writeHead(404);
        r.end();
        return;
      }
      const chunks = [];
      for await (const chunk of q) chunks.push(chunk);
      const sent = Buffer.concat(chunks).toString();
      assert.equal(sent, f.context.outbound_request_json);
      const bytes = Buffer.from(f.body_base64, 'base64');
      traffic.push({
        path: q.url,
        sent_request_json: sent,
        response_sha256: sha(bytes),
        response_bytes: bytes.length,
      });
      r.writeHead(f.status, { ...f.headers, 'content-length': String(bytes.length) });
      r.end(bytes);
    } catch (e) {
      serverErrors.push(String(e));
      r.destroy();
    }
  });
  const result = {
    status: 'RUNNING',
    started_at: new Date().toISOString(),
    runtime,
    fixtures,
    bundle,
    actual_Core_expand_contains_selected: !targetOnly,
    target_only_expand_is_remote_contract_shape: true,
    node: [],
    browsers: [],
    traffic,
    server_errors: serverErrors,
    proof_limits:
      'Finite received-field identity binding. Fixture Host policies are explicit test authority; replaying E bytes does not claim fresh remote identity, permission or Core revalidation.',
  };
  try {
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    const baseURL = 'http://127.0.0.1:' + server.address().port;
    result.base = baseURL;
    result.node = await receiveAll(admit, baseURL, fixtures);
    const pw = require(path.join(roleRoot, 'tools/node_modules/playwright'));
    for (const [name, type, options] of [
      [
        'chrome',
        pw.chromium,
        { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
      ],
      ['webkit', pw.webkit, {}],
    ]) {
      const browser = await type.launch({
          headless: true,
          ...options,
          downloadsPath: path.join(output, 'downloads-' + name),
        }),
        ctx = await browser.newContext({ serviceWorkers: 'block' }),
        network = [];
      try {
        await ctx.route('**/*', (route) =>
          route
            .request()
            .url()
            .startsWith(baseURL + '/')
            ? route.continue()
            : route.abort(),
        );
        const page = await ctx.newPage();
        page.on('request', (r) => network.push(r.url()));
        await page.goto(baseURL);
        const rows = await page.evaluate(
          async ({ code, base, fixtures }) =>
            (0, eval)('(' + code + ')')(createKDNA().transport, base, fixtures),
          { code: receiveAll.toString(), base: baseURL, fixtures },
        );
        result.browsers.push({ name, version: browser.version(), rows, network });
      } finally {
        await ctx.close();
        await browser.close();
      }
    }
  } finally {
    server.closeAllConnections();
    await new Promise((ok) => server.close(ok));
    result.closed = true;
    result.ended_at = new Date().toISOString();
  }
  const all = [
    ...result.node.map((x) => ({ engine: 'node', ...x })),
    ...result.browsers.flatMap((b) => b.rows.map((x) => ({ engine: b.name, ...x }))),
  ];
  for (const x of all) {
    assert.ok(validResult(x.result), x.id + JSON.stringify(validResult.errors));
  }
  result.result_schema_valid = all.length;
  result.failures = all.filter((x) => !x.matched);
  result.status = result.failures.length || serverErrors.length ? 'FAIL' : 'MATCH';
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: result.status,
      fixtures: fixtures.length,
      total: all.length,
      result_schema_valid: all.length,
      failures: result.failures.map((x) => ({
        engine: x.engine,
        id: x.id,
        actual: x.result.status,
        code: x.result.rejection?.code,
      })),
      output: path.join(output, 'result.json'),
    }),
  );
  process.exitCode = result.status === 'MATCH' ? 0 : 1;
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
