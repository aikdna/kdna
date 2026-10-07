'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const F = require('./bytes-fixtures.cjs'),
  B = require('./browser-runtime.cjs');
const { exerciseProtectedBrowser } = require('./protected-browser-exercise.js');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const json = (v) => JSON.stringify(v, null, 2) + '\n';
async function main() {
  const [runtime, toolRoot, out, chrome] = process.argv.slice(2);
  assert.ok(runtime && toolRoot && out && chrome, 'runtime toolRoot output Chrome required');
  fs.mkdirSync(out, { recursive: true });
  const { req, coreDir } = F.runtime(runtime),
    H = require('../../../packages/kdna-core/test/protection-test-helpers.js');
  const core = req('@aikdna/kdna-core/protection-node'),
    tuple = require(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
  const a = H.asset(),
    source = F.encode(a, req),
    password = Buffer.from('synthetic-browser-runtime');
  const produced = await core.protectSourceBytes(
    source,
    {
      kind: 'password',
      asset_uid: a.manifest.asset_uid,
      entitlement: { profile: 'password' },
      slots: [
        { slot: 'primary', kdf_profile: 'scrypt-sha256' },
        { slot: 'recovery', kdf_profile: 'scrypt-sha256' },
      ],
      checksums: true,
      signature: 'ed25519',
    },
    {
      passwords: [
        { slot: 'primary', password },
        { slot: 'recovery', password: Buffer.from('synthetic-recovery') },
      ],
      signingSeed: Buffer.alloc(32, 7),
    },
  );
  assert.equal(produced.status, 'produced', json(produced));
  const parse = require(path.join(coreDir, 'src/public-contract/container.js')).parseContainer;
  const entries = parse(produced.bytes),
    manifest = JSON.parse(Buffer.from(entries['kdna.json']));
  const envelope = require(
    path.join(coreDir, 'src/public-contract/protection-envelope-codec.js'),
  ).decodeEnvelope(entries['payload.kdnab']);
  const plaintext = require(
    path.join(coreDir, 'src/public-contract/protection-crypto.js'),
  ).decryptPassword(envelope, { kind: 'password', password, slotIndex: 0 }, manifest);
  const node = await core.admitProtectedNode(
    produced.bytes,
    {
      credential: { kind: 'password', password },
      signaturePolicy: { requireSignature: true, expectedPublicKeyHex: null },
    },
    { kind: 'local', clock: () => 1000 },
  );
  assert.equal(node.status, 'accepted');
  const nodeRead = req('@aikdna/kdna-read/protection-node');
  const nodeObserve = H.observer(node);
  const nodeHost = nodeRead.createTrustedProtectedHostReadProvider({
    observe: nodeObserve,
    async deliver(_body, token) {
      return (
        (
          await nodeRead.commitProtectedTransport(node.operation, token, {
            observeScope: nodeObserve,
            commit: () => true,
          })
        ).status === 'committed'
      );
    },
  });
  const nodeContents = {};
  for (const mode of ['whole_asset', 'catalog', 'exact_selection']) {
    const got = await nodeRead.readProtectedNode(
      node.operation,
      F.candidate(tuple, a, mode),
      H.control(),
      nodeHost,
    );
    assert.equal(got.status, 'read_result', json(got));
    assert.ok(['ready', 'catalog_only'].includes(got.result.envelope.status), json(got));
    nodeContents[mode] = got.result.envelope.content;
  }
  const nodeHandle = nodeContents.exact_selection.expansion_handles[0];
  assert.ok(nodeHandle);
  const nodeExpanded = await nodeRead.readProtectedNode(
    node.operation,
    { ...F.candidate(tuple, a, 'expand'), handle: nodeHandle },
    H.control(),
    nodeHost,
  );
  assert.equal(nodeExpanded.result?.envelope.status, 'ready', json(nodeExpanded));
  nodeContents.expand = nodeExpanded.result.envelope.content;
  const meta = {
    tuple,
    policy: { requireSignature: true, expectedPublicKeyHex: null },
    observation: {
      kind: 'consumer_unlock_observation',
      proof: 'observation_not_authority',
      checked_at_ms: 1000,
      selection: { slotIndex: 0, slot: 'primary', kdf_profile: 'scrypt-sha256' },
    },
    node_ir: node.snapshot.ir,
    node_contents: nodeContents,
  };
  const rows = Object.entries(entries).map(([name, body]) => ({ name, body }));
  const inputs = [
    { id: 'stored', bytes: produced.bytes },
    {
      id: 'deflate',
      bytes: B.zipRows(rows.map((row) => ({ ...row, method: row.name === 'mimetype' ? 0 : 8 }))),
    },
  ];
  const report = {
    format: 'kdna.protected-browser-runtime/1',
    started_at: new Date().toISOString(),
    runtime,
    node: process.version,
    inputs: [],
    browser: null,
    results: [],
    failures: [],
    limits: [
      'Synthetic embedding authorities, no production authorization evidence.',
      'Headless Chromium is not WKWebView or native Reader acceptance.',
      'WebKit NOT_RUN: local executable unavailable.',
    ],
  };
  const bundleFile = path.join(out, 'browser-bundle.js');
  report.bundle = B.bundle(runtime, bundleFile, [
    '@aikdna/kdna-core/protected-browser',
    '@aikdna/kdna-core/protected-sections-browser',
    '@aikdna/kdna-read/protected-sections-browser',
  ]);
  fs.writeFileSync(path.join(out, 'plain.kdnab'), plaintext);
  const exerciseBytes = fs.readFileSync(path.join(__dirname, 'protected-browser-exercise.js'));
  fs.writeFileSync(path.join(out, 'exercise.js'), exerciseBytes);
  fs.writeFileSync(
    path.join(out, 'config.js'),
    'globalThis.fixtureMetadata=' + JSON.stringify(meta).replaceAll('<', '\\u003c') + ';\n',
  );
  fs.writeFileSync(
    path.join(out, 'harness.js'),
    `'use strict';document.querySelector('#run').addEventListener('click',async()=>{try{const files=[...document.querySelector('#input').files];globalThis.testResult=await exerciseProtectedBrowser(createKDNA(),new Uint8Array(await files[0].arrayBuffer()),new Uint8Array(await files[1].arrayBuffer()),fixtureMetadata,()=>createKDNA());}catch(e){globalThis.testResult={failures:[{message:String(e.stack??e)}]};}});`,
  );
  fs.writeFileSync(
    path.join(out, 'harness.html'),
    `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; connect-src 'none'"><title>Protected browser conformance</title><input type="file" id="input" multiple><button id="run">Run</button><script src="browser-bundle.js"></script><script src="exercise.js"></script><script src="config.js"></script><script src="harness.js"></script>`,
  );
  const save = () => fs.writeFileSync(path.join(out, 'result.json'), json(report));
  save();
  const pw = createRequire(path.join(toolRoot, 'package.json'))('playwright');
  const browser = await pw.chromium.launch({ executablePath: chrome, headless: true });
  const context = await browser.newContext({ serviceWorkers: 'block' }),
    page = await context.newPage();
  const network = [],
    errors = [];
  page.on('request', (r) => {
    if (/^https?:|^wss?:/.test(r.url())) network.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    report.browser = {
      version: browser.version(),
      executable: chrome,
      sha256: sha(fs.readFileSync(chrome)),
      network,
      errors,
    };
    for (const input of inputs) {
      const file = path.join(out, input.id + '.kdna');
      fs.writeFileSync(file, input.bytes);
      report.inputs.push({
        id: input.id,
        path: file,
        bytes: input.bytes.length,
        sha256: sha(input.bytes),
        plaintext_sha256: sha(plaintext),
      });
      await page.goto('file://' + path.join(out, 'harness.html'));
      report.browser.environment = await page.evaluate(() => ({
        Buffer: typeof Buffer,
        process: typeof process,
        require: typeof require,
        secureContext: isSecureContext,
        crypto: typeof crypto.subtle,
        randomUUID: typeof crypto.randomUUID,
        csp: document.querySelector('meta[http-equiv]').content,
      }));
      await page.locator('#input').setInputFiles([file, path.join(out, 'plain.kdnab')]);
      await page.locator('#run').click();
      await page.waitForFunction(() => globalThis.testResult !== undefined, {}, { timeout: 60000 });
      const result = await page.evaluate(() => globalThis.testResult);
      report.results.push({ id: input.id, result });
      report.failures.push(...result.failures.map((f) => ({ fixture: input.id, ...f })));
      save();
    }
    if (network.length || errors.length)
      report.failures.push({ id: 'browser-network-or-script-error', network, errors });
    assert.deepEqual(report.browser.environment.Buffer, 'undefined');
    assert.deepEqual(report.browser.environment.process, 'undefined');
    assert.deepEqual(report.browser.environment.require, 'undefined');
    assert.equal(report.browser.environment.secureContext, true);
  } finally {
    await context.close();
    await browser.close();
    core.disposeProtectionOperation(node.operation);
    report.ended_at = new Date().toISOString();
    save();
  }
  console.log(
    json({
      report: path.join(out, 'result.json'),
      browser: report.browser.version,
      cases: report.results.map((x) => ({
        id: x.id,
        checks: x.result.rows?.length,
        failures: x.result.failures.length,
      })),
      failures: report.failures.length,
    }),
  );
  process.exitCode = report.failures.length ? 1 : 0;
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { main };
