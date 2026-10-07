'use strict';
// These are isolated Node module-instance checks of the browser entries. They do
// not claim an actual browser, WebKit, or production authorization acceptance.
const test = require('node:test');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const H = require('./protection-test-helpers.js');
const { assert, path, F, req, coreDir, core, tuple } = H;
const { readDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const runtime = process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..');
const names = {
  admission: '@aikdna/kdna-core/protected-browser',
  core: '@aikdna/kdna-core/protected-sections-browser',
  read: '@aikdna/kdna-read/protected-sections-browser',
};
const load = resolve => ({ B: resolve(names.admission), C: resolve(names.core), R: resolve(names.read) });
const original = load(req);
const observation = { kind: 'consumer_unlock_observation', proof: 'observation_not_authority', checked_at_ms: 1000,
  selection: { slotIndex: 0, slot: 'primary', kdf_profile: 'scrypt-sha256' } };
let fixturePromise;
async function fixture() {
  if (!fixturePromise) fixturePromise = (async () => {
    const asset = H.asset(1), password = new TextEncoder().encode('synthetic-browser-installation');
    const produced = await core.protectSourceBytes(F.encode(asset, req), { kind: 'password', asset_uid: asset.manifest.asset_uid,
      entitlement: { profile: 'password' }, slots: [{ slot: 'primary', kdf_profile: 'scrypt-sha256' }], checksums: false, signature: 'none' },
    { passwords: [{ slot: 'primary', password }] });
    assert.equal(produced.status, 'produced');
    const entries = require(path.join(coreDir, 'src/public-contract/container.js')).parseContainer(produced.bytes);
    const manifest = JSON.parse(new TextDecoder().decode(entries['kdna.json']));
    const envelope = require(path.join(coreDir, 'src/public-contract/protection-envelope-codec.js')).decodeEnvelope(entries['payload.kdnab']);
    const plaintext = require(path.join(coreDir, 'src/public-contract/protection-crypto.js')).decryptPassword(envelope,
      { kind: 'password', password, slotIndex: 0 }, manifest);
    return { bytes: produced.bytes, plaintext };
  })();
  return fixturePromise;
}
function requestJson() {
  return JSON.stringify({ request_id: 'request:browser-installation', tuple, budget_bytes: 1000000,
    mode: 'catalog', selection: null, handle: null });
}
function independent(patch = () => {}) {
  // As with the existing duplicate-Core test, only package instances are copied.
  // Their real transitive dependencies resolve through the selected runtime.
  const folder = fs.mkdtempSync(path.join(runtime, 'protected-browser-instance-'));
  const copiedCore = path.join(folder, 'node_modules/@aikdna/kdna-core');
  const copiedRead = path.join(folder, 'node_modules/@aikdna/kdna-read');
  try {
    fs.mkdirSync(path.dirname(copiedCore), { recursive: true });
    fs.cpSync(coreDir, copiedCore, { recursive: true });
    fs.cpSync(readDir, copiedRead, { recursive: true });
    patch({ core: copiedCore, read: copiedRead });
    return { ...load(createRequire(path.join(folder, 'entry.cjs'))),
      close: () => fs.rmSync(folder, { recursive: true, force: true }) };
  } catch (error) {
    fs.rmSync(folder, { recursive: true, force: true });
    throw error;
  }
}
function patchJson(file, change) {
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  change(value);
  fs.writeFileSync(file, JSON.stringify(value));
}
async function open(api, effects) {
  const f = await fixture();
  const admitted = await api.B.admitProtectedBrowser({ bytes: f.bytes, plaintextPayload: f.plaintext, observation },
    { kind: 'local', clock: () => 1000 });
  assert.equal(admitted.status, 'accepted', JSON.stringify(admitted));
  const authority = api.C.createProtectedPayloadReadAuthorityJson(() => { effects.authority++; return true; });
  const start = await api.C.admitProtectedSectionBrowser(admitted.snapshot,
    api.C.admitProtectedPayloadRequestJson(requestJson()).request, authority);
  assert.equal(start.status, 'accepted', JSON.stringify(start));
  return { ...start, authority };
}
function observe(context) {
  const b = context.binding;
  return JSON.stringify({ host_id: 'host:installation', host_epoch: 'epoch:1', decision_id: 'decision:1',
    ...Object.fromEntries(['operation_id', 'capture_id', 'request_digest', 'read_intent_digest', 'request_id', 'snapshot_id', 'A', 'C', 'E', 'tuple', 'asset'].map(key => [key, b[key]])),
    scope: context.projection_scope, issued_at: 900, expires_at: 2000, current_ms: 1000,
    decision: 'allow', policy_id: 'policy:installation' });
}
const counters = () => ({ authority: 0, observed: 0, delivered: 0, sink: 0 });
function hostFor(api, start, effects, deliver) {
  return api.R.createTrustedProtectedPayloadHostJson(context => { effects.observed++; return observe(context); },
    async (body, token) => {
      effects.delivered++;
      if (deliver) return deliver(body, token);
      const committed = await api.R.commitProtectedSectionTransport(start.operation, token, observe,
        () => { effects.sink++; return true; });
      assert.equal(committed.status, 'committed', JSON.stringify(committed));
      return true;
    });
}
function protectionFailure(out, code = 'PROTECTION_OPERATION_UNTRUSTED') {
  assert.equal(out.status, 'protection_failed', JSON.stringify(out));
  assert.equal(out.diagnostic.code, code);
  assert.deepEqual(Object.keys(out).sort(), ['body', 'body_bytes', 'diagnostic', 'disclosure', 'status']);
  assert.equal(out.body, null);
  assert.equal(out.body_bytes, 0);
  assert.deepEqual(out.disclosure, { kind: 'none', external_commit: { state: 'not_invoked' } });
}

test('same-version browser instances reject foreign request, authority, Host, operation and delivery token before effects', async t => {
  const foreign = independent(), aEffects = counters(), bEffects = counters();
  let a, b;
  try {
    assert.notEqual(original.C.inspectProtectedPayloadRequest, foreign.C.inspectProtectedPayloadRequest);
    assert.notEqual(original.R.readProtectedSectionBrowser, foreign.R.readProtectedSectionBrowser);
    a = await open(original, aEffects); b = await open(foreign, bEffects);
    const aHost = hostFor(original, a, aEffects), bHost = hostFor(foreign, b, bEffects);
    const read = (operation, request, authority, host) => original.R.readProtectedSectionBrowser(operation, request, authority, host);
    for (const [boundary, operation, request, authority, host] of [
      ['request', a.operation, b.request, a.authority, aHost],
      ['authority', a.operation, a.request, b.authority, aHost],
      ['Host', a.operation, a.request, a.authority, bHost],
      ['operation', b.operation, a.request, a.authority, aHost],
    ]) await t.test('foreign ' + boundary, async () => {
      const before = { a: { ...aEffects }, b: { ...bEffects } };
      const out = await read(operation, request, authority, host);
      if (boundary === 'Host') {
        assert.equal(out.status, 'delivery_failed');
        assert.equal(out.reason, 'host_callback_failed');
        assert.equal(out.body, null); assert.equal(out.body_bytes, 0);
        assert.deepEqual(out.disclosure, { kind: 'none', external_commit: { state: 'not_invoked' } });
      } else protectionFailure(out);
      assert.deepEqual(aEffects, before.a); assert.deepEqual(bEffects, before.b);
      assert.equal(aEffects.sink + bEffects.sink, 0);
    });
    await t.test('foreign delivery token and operation never reserve a genuine delivery', async () => {
      let invalidObserved = 0, invalidSink = 0;
      const host = hostFor(original, a, aEffects, async (_body, token) => {
        const invalidObserve = context => { invalidObserved++; return observe(context); };
        const invalidCommit = () => { invalidSink++; return true; };
        protectionFailure(await foreign.R.commitProtectedSectionTransport(a.operation, token, invalidObserve, invalidCommit));
        protectionFailure(await original.R.commitProtectedSectionTransport(b.operation, token, invalidObserve, invalidCommit));
        protectionFailure(await original.R.commitProtectedSectionTransport(a.operation, structuredClone(token), invalidObserve, invalidCommit));
        assert.equal(invalidObserved, 0); assert.equal(invalidSink, 0);
        const valid = await original.R.commitProtectedSectionTransport(a.operation, token, observe,
          () => { aEffects.sink++; return true; });
        assert.equal(valid.status, 'committed', JSON.stringify(valid));
        return true;
      });
      assert.equal((await read(a.operation, a.request, a.authority, host)).status, 'read_result');
      assert.equal(invalidObserved, 0); assert.equal(invalidSink, 0); assert.equal(aEffects.sink, 1);
    });
    // Foreign disposal cannot revoke the genuine instance, and the foreign
    // installation itself is capable of a normal read with its own tokens.
    foreign.C.disposeProtectedSectionOperation(a.operation);
    assert.ok(original.C.inspectProtectedPayloadSnapshot(a.snapshot));
    assert.equal(foreign.C.inspectProtectedPayloadSnapshot(a.snapshot), null);
    assert.equal(foreign.C.inspectProtectedPayloadRequest(a.request), null);
    assert.equal((await read(a.operation, a.request, a.authority, aHost)).status, 'read_result');
    assert.equal((await foreign.R.readProtectedSectionBrowser(b.operation, b.request, b.authority, bHost)).status, 'read_result');
    assert.equal(aEffects.sink, 2); assert.equal(bEffects.sink, 1);
  } finally {
    if (a) original.C.disposeProtectedSectionOperation(a.operation);
    if (b) foreign.C.disposeProtectedSectionOperation(b.operation);
    foreign.close();
  }
});

for (const [boundary, patch] of [
  ['Core package version', dirs => patchJson(path.join(dirs.core, 'package.json'), value => { value.version = '0.0.0-installation-probe'; })],
  ['Read package version', dirs => patchJson(path.join(dirs.read, 'package.json'), value => { value.version = '0.0.0-installation-probe'; })],
  ['Read Core peer version', dirs => patchJson(path.join(dirs.read, 'package.json'), value => { value.peerDependencies['@aikdna/kdna-core'] = '0.0.0-installation-probe'; })],
  ['Read definition descriptor', dirs => patchJson(path.join(dirs.read, 'src/protected-browser-contract.json'), value => { value.definition_digest = 'sha256:' + '0'.repeat(64); })],
  ['Core definition with unchanged package versions', dirs => patchJson(path.join(dirs.core, 'src/public-contract/protected-browser-contract/contract.json'), value => { value.module.version = '0.0.0-installation-probe'; })],
]) test('browser read rejects mismatched ' + boundary + ' before authority, Host or sink', async () => {
  const api = independent(patch), effects = counters(); let start;
  try {
    start = await open(api, effects);
    const host = hostFor(api, start, effects), before = { ...effects };
    const out = await api.R.readProtectedSectionBrowser(start.operation, start.request, start.authority, host);
    protectionFailure(out, 'READ_CORE_CAPABILITY_UNAVAILABLE');
    assert.deepEqual(effects, before);
    assert.equal(effects.sink, 0);
  } finally {
    if (start) api.C.disposeProtectedSectionOperation(start.operation);
    api.close();
  }
});
