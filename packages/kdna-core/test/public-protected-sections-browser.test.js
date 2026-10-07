'use strict';
const test = require('node:test');
const H = require('./protection-test-helpers.js');
const { assert, req, F, core, asset, tuple, path, coreDir } = H;
const C = req('@aikdna/kdna-core/protected-sections-browser');
const B = req('@aikdna/kdna-core/protected-browser');
const R = req('@aikdna/kdna-read/protected-sections-browser');
const observation = { kind: 'consumer_unlock_observation', proof: 'observation_not_authority', checked_at_ms: 1000,
  selection: { slotIndex: 0, slot: 'primary', kdf_profile: 'scrypt-sha256' } };
const crypto = require(path.join(coreDir, 'src/public-contract/protection-crypto.js'));
let fixturePromise;
async function fixture() {
  if (!fixturePromise) fixturePromise = (async () => {
    const a = asset(), source = F.encode(a, req), password = Buffer.from('synthetic-browser-test');
    const produced = await core.protectSourceBytes(source, { kind: 'password', asset_uid: a.manifest.asset_uid,
      entitlement: { profile: 'password' }, slots: [{ slot: 'primary', kdf_profile: 'scrypt-sha256' }], checksums: true, signature: 'none' },
    { passwords: [{ slot: 'primary', password }] });
    assert.equal(produced.status, 'produced');
    const entries = require(path.join(coreDir, 'src/public-contract/container.js')).parseContainer(produced.bytes);
    const manifest = JSON.parse(Buffer.from(entries['kdna.json']));
    const envelope = require(path.join(coreDir, 'src/public-contract/protection-envelope-codec.js')).decodeEnvelope(entries['payload.kdnab']);
    const plaintext = crypto.decryptPassword(envelope, { kind: 'password', password, slotIndex: 0 }, manifest);
    return { bytes: produced.bytes, plaintext, source, password };
  })();
  return fixturePromise;
}
function request(mode = 'whole_asset', selection = null, handle = null, extra = {}) {
  return JSON.stringify({ request_id: 'request:test', tuple, budget_bytes: 1000000, mode, selection, handle, ...extra });
}
async function open(callback = () => true, clock = () => 1000) {
  const f = await fixture(), original = await B.admitProtectedBrowser({ bytes: f.bytes, plaintextPayload: f.plaintext, observation }, { kind: 'local', clock });
  assert.equal(original.status, 'accepted', JSON.stringify(original));
  const authority = C.createProtectedPayloadReadAuthorityJson(callback);
  const admitted = C.admitProtectedPayloadRequestJson(request());
  const start = await C.admitProtectedSectionBrowser(original.snapshot, admitted.request, authority);
  assert.equal(start.status, 'accepted', JSON.stringify(start));
  return { original, authority, ...start };
}
function observe(context, extra = {}) {
  const b = context.binding;
  return JSON.stringify({ host_id: 'host:test', host_epoch: 'epoch:1', decision_id: 'decision:1',
    ...Object.fromEntries(['operation_id', 'capture_id', 'request_digest', 'read_intent_digest', 'request_id', 'snapshot_id', 'A', 'C', 'E', 'tuple', 'asset'].map(k => [k, b[k]])),
    scope: context.projection_scope, issued_at: 900, expires_at: 2000, current_ms: 1000, decision: 'allow', policy_id: 'policy:test', ...extra });
}
function hostFor(start, options = {}) {
  const effects = { sink: 0, commits: [] };
  const host = R.createTrustedProtectedPayloadHostJson(options.observe ?? observe, async (body, token) => {
    if (options.deliver) return options.deliver(body, token, effects);
    const committed = await R.commitProtectedSectionTransport(start.operation, token, options.observeScope ?? observe,
      () => { effects.sink++; return options.ack === undefined ? true : options.ack; });
    effects.commits.push(committed);
    return committed.status === 'committed';
  });
  return { host, effects };
}
async function read(start, host, token = start.request) { return R.readProtectedSectionBrowser(start.operation, token, start.authority, host); }
test('browser retained whole/catalog/set/expand preserve base tuple and honest provenance', async () => {
  const start = await open(), { host, effects } = hostFor(start);
  const whole = await read(start, host);
  assert.equal(whole.result.envelope.status, 'ready', JSON.stringify(whole));
  assert.deepEqual(whole.result.envelope.tuple, tuple);
  assert.equal(whole.result.envelope.verification.physical_reads, 'none');
  assert.equal(whole.result.envelope.verification.integrity_and_semantics.disclosure.provenance, 'host_supplied_triple');
  const catalog = C.bindProtectedPayloadRequest(start.operation, request('catalog'));
  assert.equal((await read(start, host, catalog.request)).result.envelope.status, 'catalog_only');
  const { asset_id, asset_version } = whole.result.envelope.asset;
  const selection = { asset_id, asset_version, judgment_ids: ['j:1', 'j:0', 'j:0'] };
  const exact = C.bindProtectedPayloadRequest(start.operation, request('exact_selection', selection));
  assert.deepEqual(C.inspectProtectedPayloadRequest(exact.request).selection.judgment_ids, ['j:0', 'j:1']);
  const selected = await read(start, host, exact.request);
  assert.equal(selected.result.envelope.status, 'ready', JSON.stringify(selected));
  const single = C.bindProtectedPayloadRequest(start.operation, request('exact_selection', { ...selection, judgment_ids: ['j:0'] }));
  const one = await read(start, host, single.request);
  const handle = one.result.envelope.content.expansion_handles[0];
  assert.ok(handle);
  const expand = C.bindProtectedPayloadRequest(start.operation, request('expand', handle.anchor.selection, handle));
  const expanded = await read(start, host, expand.request);
  assert.equal(expanded.result.envelope.status, 'ready', JSON.stringify(expanded));
  assert.equal(effects.sink, 5);
  C.disposeProtectedSectionOperation(start.operation);
  assert.equal(C.inspectProtectedPayloadSnapshot(start.snapshot), null);
  assert.equal(C.inspectProtectedPayloadRequest(start.request), null);
  assert.equal((await read(start, host)).status, 'protection_failed');
});
test('only a same-instance genuine unconsumed protected origin can start an operation', async () => {
  const start = await open(), q = C.admitProtectedPayloadRequestJson(request());
  assert.equal((await C.admitProtectedSectionBrowser(start.original.snapshot, q.request, start.authority)).status, 'protection_failed');
  assert.equal((await C.admitProtectedSectionBrowser(structuredClone(start.original.snapshot), q.request, start.authority)).status, 'protection_failed');
  const f = await fixture(), ordinary = req('@aikdna/kdna-core/node').admitNode(f.source);
  assert.equal((await C.admitProtectedSectionBrowser(ordinary.snapshot, q.request, start.authority)).status, 'protection_failed');
  let hook = 0;
  const candidate = new Proxy({}, { get() { hook++; throw Error(); }, ownKeys() { hook++; throw Error(); } });
  assert.equal(C.admitProtectedPayloadRequestJson(candidate).channel, 'admission_rejection');
  assert.equal(hook, 0);
  const invalid = JSON.parse(request()); invalid.tuple.container = '0.6.0';
  assert.equal(C.admitProtectedPayloadRequestJson(JSON.stringify(invalid)).envelope.diagnostics[0].code, 'READ_MIXED_VERSION_TUPLE');
  assert.equal(C.admitProtectedPayloadRequestJson(request().replace('"mode":', '"mode":"whole_asset","mode":')).channel, 'admission_rejection');
  C.disposeProtectedSectionOperation(start.operation);
});
for (const policy of ['deny', 'bad-json', 'scope', 'epoch', 'expired']) test('Host '+policy+' never reaches sink', async () => {
  const start = await open(); let n = 0;
  const { host, effects } = hostFor(start, { observe: c => {
    n++;
    if (policy === 'bad-json') return {};
    return observe(c, policy === 'deny' ? { decision: 'deny' } : policy === 'scope' ? { scope: [] } : policy === 'epoch' ? { host_epoch: 'epoch:'+n } : policy === 'expired' ? { current_ms: 2000 } : {});
  } });
  const out = await read(start, host);
  assert.equal(out.result.envelope.status, 'rejected', JSON.stringify(out));
  assert.equal(effects.sink, 0);
  C.disposeProtectedSectionOperation(start.operation);
});
test('commit reserves once before await and ignores duplicate/reentrant attempts', async () => {
  const start = await open(); let calls = 0, nested;
  const { host } = hostFor(start, { deliver: async (_body, token) => {
    const commit = () => { calls++; nested = R.commitProtectedSectionTransport(start.operation, token, observe, () => { calls++; return true; }); return true; };
    const pair = await Promise.all([R.commitProtectedSectionTransport(start.operation, token, observe, commit), R.commitProtectedSectionTransport(start.operation, token, observe, commit)]);
    assert.equal(pair.filter(x => x.status === 'committed').length, 1);
    assert.equal((await nested).status, 'delivery_failed'); return true;
  } });
  assert.equal((await read(start, host)).status, 'read_result');
  assert.equal(calls, 1);
  C.disposeProtectedSectionOperation(start.operation);
});
for (const boundary of ['authority', 'host', 'transport']) test('dispose while awaiting '+boundary+' prevents late disclosure', async () => {
  let release, entered;
  const waiting = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  let closed = false;
  const start = await open(async c => { if (closed && boundary === 'authority') { entered(); await gate; } return true; });
  const { host, effects } = hostFor(start, {
    observe: async c => { if (boundary === 'host') { entered(); await gate; } return observe(c); },
    observeScope: async c => { if (boundary === 'transport') { entered(); await gate; } return observe(c); }
  });
  closed = true;
  const pending = read(start, host); await waiting;
  C.disposeProtectedSectionOperation(start.operation); release();
  const out = await pending;
  assert.ok(['protection_failed', 'delivery_failed'].includes(out.status), JSON.stringify(out));
  assert.equal(effects.sink, 0);
});
test('unawaited pending commit is closed when deliver returns', async () => {
  const start = await open(); let release, entered, pending, sink = 0;
  const waiting = new Promise(resolve => { entered = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  const { host } = hostFor(start, { deliver: async (_body, token) => {
    pending = R.commitProtectedSectionTransport(start.operation, token, async c => { entered(); await gate; return observe(c); }, () => { sink++; return true; });
    await waiting; return true;
  } });
  const out = await read(start, host);
  assert.equal(out.status, 'delivery_failed'); release();
  assert.equal((await pending).status, 'delivery_failed');
  assert.equal(sink, 0);
  C.disposeProtectedSectionOperation(start.operation);
});
test('unknown acknowledgement retains effect history and cannot register handles', async () => {
  for (const ack of [false, Promise.resolve(true), { then() { throw Error('not to be assimilated'); } }]) {
    const start = await open(), { host, effects } = hostFor(start, { ack });
    const out = await read(start, host);
    assert.equal(out.status, 'delivery_failed', JSON.stringify(out));
    assert.equal(out.disclosure.external_commit.state, 'outcome_unknown');
    assert.equal(effects.sink, 1);
    C.disposeProtectedSectionOperation(start.operation);
  }
});
for (const boundary of ['host_handoff', 'read_return']) test('microtask dispose between checkpoint and '+boundary+' continuation', async () => {
  let phase = '', ticks = 0, start, delivered = 0;
  start = await open(c => { phase = c.read_intent.operation; ticks = 0; return true; }, () => {
    if (phase === boundary && ++ticks === 2) queueMicrotask(() => C.disposeProtectedSectionOperation(start.operation));
    return 1000;
  });
  const { host } = hostFor(start, { deliver: () => { delivered++; return true; } });
  const out = await read(start, host);
  assert.equal(out.status, 'protection_failed', JSON.stringify(out));
  assert.equal(out.diagnostic.code, 'PROTECTION_OPERATION_DISPOSED');
  assert.equal(delivered, boundary === 'host_handoff' ? 0 : 1);
});
for (const boundary of ['host_handoff', 'transport_commit', 'read_return']) test('catalog with zero handles must remain inside Host TTL at '+boundary, async () => {
  let now = 1000;
  const start = await open(c => { if (c.read_intent.operation === boundary && boundary !== 'transport_commit') now = 3000; return true; }, () => now);
  const token = C.bindProtectedPayloadRequest(start.operation, request('catalog')).request;
  const { host, effects } = hostFor(start, { observeScope: c => { if (boundary === 'transport_commit') now = 3000; return observe(c); } });
  const out = await read(start, host, token);
  if (boundary === 'host_handoff') assert.equal(out.result.envelope.diagnostics[0].code, 'READ_HOST_CONTEXT_EXPIRED');
  else assert.ok(['delivery_failed', 'protection_failed'].includes(out.status), JSON.stringify(out));
  assert.equal(effects.sink, boundary === 'read_return' ? 1 : 0);
  if (boundary === 'read_return') assert.equal(out.disclosure.external_commit.state, 'confirmed');
  C.disposeProtectedSectionOperation(start.operation);
});
test('stricter current authority rejects an unsigned origin with the precise code', async () => {
  const start = await open(), strictAuthority = C.createProtectedPayloadReadAuthorityJson(() => true, JSON.stringify({ requireSignature: true, expectedPublicKeyHex: null }));
  const { host, effects } = hostFor(start);
  const out = await R.readProtectedSectionBrowser(start.operation, start.request, strictAuthority, host);
  assert.equal(out.result.envelope.diagnostics[0].code, 'READ_CORE_INVALID');
  assert.equal(effects.sink, 0);
  C.disposeProtectedSectionOperation(start.operation);
});
test('admission allocates plaintext only after every caller metadata access and clears all owned copies', async () => {
  const fs = require('node:fs'), vm = require('node:vm'), { createRequire } = require('node:module');
  const file = path.join(coreDir, 'src/public-contract/protection-admission-browser.js');
  for (const variant of ['provider', 'clock', 'metadata-throws', 'container']) {
    const copies = [], Native = Uint8Array;
    class TrackedBytes extends Native {
      static [Symbol.hasInstance](v) { return v instanceof Native; }
      constructor(v) { super(v); if (v instanceof Native && v.length === 3) copies.push(this); }
    }
    const sandbox = { module: { exports: {} }, require: createRequire(file), Uint8Array: TrackedBytes, TextDecoder, TextEncoder, crypto: globalThis.crypto };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
    const plain = new Native([7,8,9]), before = Array.from(plain);
    let reads = 0;
    const selection = variant === 'metadata-throws' ? new Proxy({ slotIndex: 0, slot: 'primary', kdf_profile: 'scrypt-sha256' }, { get(target, key) { if (key === 'slotIndex' && ++reads === 2) throw Error('synthetic metadata'); return target[key]; } }) : observation.selection;
    const provider = variant === 'provider' ? undefined : variant === 'clock' ? { kind: 'local' } : { kind: 'local', clock: () => 1000 };
    const out = await sandbox.module.exports.admitProtectedBrowser({ bytes: new Native([1,2]), plaintextPayload: plain, observation: { ...observation, selection } }, provider);
    assert.notEqual(out.status, 'accepted');
    assert.equal(copies.length, variant === 'container' ? 1 : 0, variant);
    assert.ok(copies.every(copy => copy.every(value => value === 0)), variant);
    assert.deepEqual(Array.from(plain), before);
  }
});
