'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const F = require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const { req, coreDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const { openSourceBytes, packSourceBytes } = req('@aikdna/kdna-core/authoring-node');
const tuple = require(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
const { createHash } = require('node:crypto');
const sha = bytes => 'sha256:' + createHash('sha256').update(bytes).digest('hex');
function modes(bytes, assignments) {
  const result = Buffer.from(bytes); let at = result.readUInt32LE(result.length - 6);
  while (result.readUInt32LE(at) === 0x02014b50) {
    const n = result.readUInt16LE(at + 28), extra = result.readUInt16LE(at + 30), comment = result.readUInt16LE(at + 32);
    const name = result.toString('utf8', at + 46, at + 46 + n);
    if (Object.hasOwn(assignments, name)) result.writeUInt32LE((assignments[name] * 65536) >>> 0, at + 38);
    at += 46 + n + extra + comment;
  }
  return result;
}
function fixture() {
  const asset = F.blank(tuple, 2);
  return { asset, bytes: modes(F.encode(asset, req, { deflate: true, entries: {
    'attachments/许可.txt': Buffer.from('Keep this license exactly.\n'),
    'attachments/image.bin': Buffer.from([0, 255, 1, 3, 0, 7]),
    'attachments/empty': Buffer.alloc(0),
  } }), { 'attachments/许可.txt': 0o100640, 'attachments/image.bin': 0o100755 }) };
}
function rejected(result, reason) {
  assert.equal(result.status, 'rejected'); if (reason) assert.equal(result.reason, reason);
  assert.equal(Object.hasOwn(result, 'source'), false); assert.equal(Object.hasOwn(result, 'bytes'), false);
  assert.deepEqual(Object.keys(result).sort(), ['component_failure', 'diagnostics', 'reason', 'states', 'status']);
}

test('producer opens complete independent source copies with exact inventory', () => {
  const { asset, bytes } = fixture(), retained = Buffer.from(bytes), result = openSourceBytes(bytes);
  assert.equal(result.status, 'accepted'); assert.deepEqual(result.source.manifest, asset.manifest); assert.deepEqual(result.source.payload, asset.payload);
  assert.equal(result.source.artifact_digest, sha(bytes)); assert.equal(result.source.members.length, 6);
  for (const member of result.source.members) assert.deepEqual(result.source.inventory.find(row => row.name === member.name), { name: member.name, type: 'file', mode: member.mode, size: member.bytes.length, sha256: sha(member.bytes) });
  result.source.members.find(row => row.name === 'payload.kdnab').bytes.fill(0);
  assert.deepEqual(result.source.payload, asset.payload);
  result.source.payload.judgments[0].focus = 'mutated detached view';
  assert.deepEqual(bytes, retained); assert.deepEqual(openSourceBytes(bytes).source.payload, asset.payload);
  bytes.fill(0); assert.equal(result.source.manifest.title, asset.manifest.title);
});

test('no-edit repack preserves every decoded member byte, name, type and mode', () => {
  const { bytes } = fixture(), before = openSourceBytes(bytes), result = packSourceBytes(bytes, {});
  assert.equal(result.status, 'accepted'); assert.deepEqual(result.source.inventory, before.source.inventory);
  assert.deepEqual(result.source.payload, before.source.payload);
  assert.deepEqual(result.source.members, before.source.members);
  assert.notEqual(sha(result.bytes), sha(bytes));
});

test('explicit Payload edit preserves every other node, attachment and original bytes', () => {
  const { asset, bytes } = fixture(), retained = Buffer.from(bytes), payload = structuredClone(asset.payload);
  payload.judgments[0].result.value.value = 'Explicitly edited result';
  const result = packSourceBytes(bytes, { payload }), before = openSourceBytes(bytes);
  assert.equal(result.status, 'accepted'); assert.deepEqual(result.source.payload, payload); assert.deepEqual(bytes, retained);
  const restored = structuredClone(result.source.payload); restored.judgments[0].result.value.value = asset.payload.judgments[0].result.value.value;
  assert.deepEqual(restored, asset.payload);
  assert.deepEqual(result.source.inventory.filter(row => row.name !== 'payload.kdnab'), before.source.inventory.filter(row => row.name !== 'payload.kdnab'));
});

test('Payload re-encoding preserves negative zero and exact finite numeric values', () => {
  const asset = F.blank(tuple), numbers = [-0, 0, 9007199254740992, -18446744073709551616, Number.MIN_VALUE, Number.MAX_VALUE];
  asset.payload.extensions = numbers.map((value, i) => ({ id: 'ext:number:' + i, critical: false, definition: 'Numeric preservation fixture', value: { kind: 'number', value } }));
  const { Encoder } = req('cbor-x/index-no-eval');
  const bytes = F.encode(asset, req, { rawPayload: new Encoder({ useRecords: false, mapsAsObjects: true, alwaysUseFloat: true }).encode(asset.payload) });
  const payload = structuredClone(asset.payload); payload.judgments[0].focus = 'Edited other node';
  const result = packSourceBytes(bytes, { payload }); assert.equal(result.status, 'accepted'); assert.deepEqual(result.source.payload, payload);
  assert.equal(Object.is(result.source.payload.extensions[0].value.value, -0), true);
});

test('producer output remains accepted by ordinary consumer surfaces', async () => {
  const { asset, bytes } = fixture(), manifest = { ...asset.manifest, summary: 'Explicit summary' }, result = packSourceBytes(bytes, { manifest });
  assert.equal(result.status, 'accepted');
  for (const admission of [req('@aikdna/kdna-core').admitBytes(result.bytes), req('@aikdna/kdna-core/browser').admitBrowser(result.bytes), await req('@aikdna/kdna-core/node').admitNode(result.bytes)]) {
    assert.equal(admission.status, 'accepted'); assert.deepEqual(Object.keys(admission).sort(), ['snapshot', 'status']);
    assert.equal('payload' in req('@aikdna/kdna-core/read-boundary').inspectSnapshot(admission.snapshot), false);
  }
});

test('unsupported signed, checksummed and encrypted predecessors never disclose raw source', () => {
  for (const name of ['signature.kdsig', 'checksums.json']) {
    const bytes = F.encode(F.blank(tuple), req, { entries: { [name]: Buffer.from('{}') } });
    rejected(openSourceBytes(bytes), 'READ_CORE_CAPABILITY_UNAVAILABLE'); rejected(packSourceBytes(bytes, {}), 'READ_CORE_CAPABILITY_UNAVAILABLE');
  }
  const asset = F.blank(tuple); asset.manifest.payload.encrypted = true;
  asset.manifest.encryption = { profile: 'encryption:unsupported', profile_version: '1.0.0', encrypted_entries: ['payload.kdnab'] };
  const bytes = F.encode(asset, req); rejected(openSourceBytes(bytes), 'READ_CORE_CAPABILITY_UNAVAILABLE'); rejected(packSourceBytes(bytes, {}), 'READ_CORE_CAPABILITY_UNAVAILABLE');
});

test('unknown entries, symlinks, damaged CRC and malformed bytes never disclose source', () => {
  const unknown = F.encode(F.blank(tuple), req, { entries: { 'new-source.json': Buffer.from('{}') } });
  const link = modes(fixture().bytes, { 'attachments/image.bin': 0o120777 });
  const corrupt = F.encode(F.blank(tuple), req); corrupt[14] ^= 1;
  for (const bytes of [unknown, link, corrupt, Buffer.from('invalid')]) { rejected(openSourceBytes(bytes), 'READ_CORE_INVALID'); rejected(packSourceBytes(bytes, {}), 'READ_CORE_INVALID'); }
});

test('unknown edits and accessor input are rejected without execution', () => {
  const { bytes } = fixture(); let executed = false;
  const edits = {}; Object.defineProperty(edits, 'manifest', { enumerable: true, get() { executed = true; throw Error('never'); } });
  for (const bad of [undefined, null, [], { members: [] }, { attachments: [] }, edits]) rejected(packSourceBytes(bytes, bad), 'READ_INPUT_INVALID');
  assert.equal(executed, false); rejected(openSourceBytes('/path.kdna'), 'READ_INPUT_INVALID');
});

test('edited unknown Manifest/Payload fields and invalid references use Core rejection', () => {
  const { asset, bytes } = fixture();
  rejected(packSourceBytes(bytes, { manifest: { ...asset.manifest, unknown: true } }), 'READ_CORE_INVALID');
  rejected(packSourceBytes(bytes, { payload: { ...asset.payload, unknown: true } }), 'READ_CORE_INVALID');
  const payload = structuredClone(asset.payload); payload.judgments[0].result.contract_ref = 'missing:contract';
  rejected(packSourceBytes(bytes, { payload }), 'READ_CORE_INVALID');
  const manifest = structuredClone(asset.manifest); manifest.runtime.mandatory_entries = ['attachments/missing.bin'];
  rejected(packSourceBytes(bytes, { manifest }), 'READ_CORE_INVALID');
});

test('unsupported critical extensions withhold every body and invalid edited binding remain rejected', () => {
  const { asset, bytes } = fixture(), payload = structuredClone(asset.payload);
  payload.extensions = [{ id: 'ext:unknown', critical: true, definition: 'Unsupported declared meaning', value: { kind: 'text', value: 'opaque' } }];
  // R2 rejects unknown critical semantics and grants no edited bytes or source.
  const carrier = packSourceBytes(bytes, { payload });
  assert.equal(carrier.status, 'rejected');
  assert.equal(carrier.reason, 'READ_UNSUPPORTED_CRITICAL');
  assert.deepEqual(carrier.states, { core: 'valid', interpretation: 'blocked' });
  assert.equal(carrier.diagnostics.length, 1);
  assert.equal(carrier.diagnostics[0].code, 'READ_UNSUPPORTED_CRITICAL');
  assert.equal(Object.hasOwn(carrier, 'source'), false);
  assert.equal(carrier.snapshot, undefined);
  rejected(packSourceBytes(bytes, { manifest: { ...asset.manifest, content_digest: 'malformed' } }), 'READ_CORE_INVALID');
  rejected(packSourceBytes(bytes, { manifest: { ...asset.manifest, authoring: { content_digest: 'malformed' } } }), 'READ_CORE_INVALID');
});

test('oversized source edits reject before unbounded codec allocation', () => {
  const { asset, bytes } = fixture(), payload = structuredClone(asset.payload);
  payload.extensions = Array.from({ length: 9 }, (_, i) => ({ id: 'ext:' + i, critical: false, definition: 'Size boundary', value: { kind: 'text', value: 'x'.repeat(1024 * 1024) } }));
  rejected(packSourceBytes(bytes, { payload }), 'READ_CORE_INVALID');
});

test('existing C self bindings refresh without deleting any other authored fields', () => {
  const asset = F.blank(tuple); asset.manifest.content_digest = 'sha256:' + '0'.repeat(64); asset.manifest.authoring = { content_digest: asset.manifest.content_digest };
  const { parseContainer } = require(path.join(coreDir, 'src/public-contract/container.js'));
  const { digest, contentTreePreimage } = require(path.join(coreDir, 'src/public-contract/digests.js'));
  const C = digest(contentTreePreimage(parseContainer(F.encode(asset, req))));
  asset.manifest.content_digest = C; asset.manifest.authoring.content_digest = C;
  const bytes = F.encode(asset, req), payload = structuredClone(asset.payload); payload.judgments[0].focus = 'Changed focus';
  assert.equal(openSourceBytes(bytes).status, 'accepted');
  const result = packSourceBytes(bytes, { payload }); assert.equal(result.status, 'accepted');
  assert.notEqual(result.source.manifest.content_digest, C); assert.equal(result.source.manifest.content_digest, result.source.manifest.authoring.content_digest);
  const expected = structuredClone(asset.manifest); expected.content_digest = result.source.manifest.content_digest; expected.authoring.content_digest = expected.content_digest;
  assert.deepEqual(result.source.manifest, expected);
});
