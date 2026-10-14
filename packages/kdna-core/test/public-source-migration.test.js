'use strict';
// M1: the explicit 0.5->0.6 source migration route. It reads exactly the
// current 0.5 generation, writes an admitted 0.6 container with a confirmed
// representation_origin, and refuses everything outside that scope by name
// without degrading silently. Fixtures are the tracked synthetic 0.5 source
// (fixtures/migration-source-0.5.kdna) plus the tracked 0.6 example and the
// 0.1 example assembled in code; crafted negatives are rebuilt in memory.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const coreDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(coreDir, '..', '..');
const req = createRequire(path.join(coreDir, 'package.json'));
const migration = require('../src/public-contract/source-migration-node.js');
const { parseContainer } = require('../src/public-contract/container.js');
const { inflateRawSync } = require('node:zlib');
const { admitPublicBytes } = require('../src/public-contract/source-public-admission.js');
const { admitBytes } = require('@aikdna/kdna-core');
const tuple = require('../src/public-contract/sections/contract.json').module.versionTuple;
const sha256 = bytes => 'sha256:' + crypto.createHash('sha256').update(bytes).digest('hex');

const SOURCE5 = path.join(__dirname, 'fixtures', 'migration-source-0.5.kdna');
const SOURCE6 = path.join(repoRoot, 'examples', 'native-team-update', 'team-update-1.0.0.kdna');
const source5 = fs.readFileSync(SOURCE5);
const A5 = sha256(source5);
const inflate = (b, max) => inflateRawSync(b, { maxOutputLength: max });

function request(overrides = {}) {
  return {
    request_id: 'req:test',
    tuple: structuredClone(tuple),
    operation: 'migrate_public_source',
    source_expected_A: overrides.source_expected_A ?? A5,
    timeout_ms: 60000,
    signature_policy: { requireSignature: false, expectedPublicKeyHex: null },
    ...overrides,
  };
}
const allow = () => migration.createNativeSourceMigrationAuthority(() => true);
const deny = () => migration.createNativeSourceMigrationAuthority(() => false);
async function migrate(bytes, options = {}) {
  const admitted = migration.admitSourceMigrationRequest(request(options.request));
  assert.equal(admitted.status, 'admitted_request');
  return migration.migratePublicSourceNode(bytes, admitted.request, options.authority ?? allow());
}
const failureCode = result => { assert.equal(result.status, 'source_failed'); assert.equal(result.body, null); assert.equal(result.body_bytes, 0); return result.diagnostic.code; };

// In-memory ZIP rebuild (regular files, stored members) for crafted negatives.
function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }
function buildZip(entries) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, value] of entries) {
    const nameBuf = Buffer.from(name), data = Buffer.from(value);
    const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
    let crc = 0xffffffff; for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); crc = (crc ^ 0xffffffff) >>> 0;
    const localHeader = Buffer.concat([u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), nameBuf]);
    locals.push(localHeader, data);
    const central = Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuf]);
    centrals.push(central);
    offset += localHeader.length + data.length;
  }
  const directory = Buffer.concat(centrals);
  const eocd = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(directory.length), u32(offset), u16(0)]);
  return Buffer.concat([...locals, directory, eocd]);
}
function rebuiltFixture(mutateManifest, extraEntries = []) {
  const entries = parseContainer(source5, inflate);
  const manifest = JSON.parse(Buffer.from(entries['kdna.json']).toString('utf8'));
  mutateManifest(manifest);
  const rows = [
    ['mimetype', entries['mimetype']],
    ['kdna.json', Buffer.from(JSON.stringify(manifest))],
    ['payload.kdnab', entries['payload.kdnab']],
    ...extraEntries,
  ];
  return buildZip(rows);
}

test('a current 0.5 source migrates to an admitted 0.6 container with a confirmed origin', async () => {
  const result = await migrate(source5);
  assert.equal(result.status, 'migrated');
  const bytes = Buffer.from(result.bytes);
  const admitted = admitPublicBytes(bytes, { requireSignature: false, expectedPublicKeyHex: null }, 'capture:test', result.observation.request_digest);
  const sourcePayload = parseContainer(source5, inflate);
  assert.equal(admitted.manifest.format_version, '0.6.0');
  assert.equal(admitted.manifest.representation_origin.source_container_digest, A5);
  assert.equal(admitted.manifest.representation_origin.source_format_version, '0.5.0');
  assert.equal(admitted.manifest.representation_origin.source_content_digest, result.observation.source_content_digest);
  const sourceManifest = JSON.parse(Buffer.from(sourcePayload['kdna.json']).toString('utf8'));
  for (const key of ['asset_id', 'asset_uid', 'asset_type', 'title', 'version', 'judgment_version', 'created_at', 'updated_at', 'summary', 'languages', 'history']) {
    assert.deepEqual(admitted.manifest[key], sourceManifest[key], key);
  }
  const actions = result.observation.member_actions;
  assert.ok(actions.some(a => a.name === 'payload.kdnab' && a.action === 'removed'));
  assert.ok(actions.some(a => a.name === 'sections/pack-0.kdnab' && a.action === 'added'));
  assert.ok(actions.some(a => a.name === 'kdna.json' && a.action === 'replaced'));
});

test('migrating the same source twice produces byte-identical containers', async () => {
  const first = await migrate(source5);
  const second = await migrate(source5);
  assert.ok(Buffer.from(first.bytes).equals(Buffer.from(second.bytes)));
});

test('a historical generation refuses by name before any classic validation', async () => {
  const minimal = path.join(repoRoot, 'examples', 'minimal');
  const historical = buildZip([
    ['mimetype', fs.readFileSync(path.join(minimal, 'mimetype'))],
    ['kdna.json', fs.readFileSync(path.join(minimal, 'kdna.json'))],
    ['payload.kdnab', fs.readFileSync(path.join(minimal, 'payload.kdnab'))],
  ]);
  const result = await migrate(historical, { request: { source_expected_A: sha256(historical) } });
  assert.equal(failureCode(result), 'MIGRATION_SOURCE_UNSUPPORTED_VERSION');
  assert.equal(result.diagnostic.stage, 'input');
});

test('a protected 0.5 source refuses by name and never converts the encrypted bytes', async () => {
  const protectedBytes = rebuiltFixture(manifest => { manifest.payload.encrypted = true; });
  const result = await migrate(protectedBytes, { request: { source_expected_A: sha256(protectedBytes) } });
  assert.equal(failureCode(result), 'MIGRATION_SOURCE_PROTECTED_UNSUPPORTED');
});

test('checksum or signature members refuse by name and are never dropped', async () => {
  const withChecksums = rebuiltFixture(() => {}, [['checksums.json', Buffer.from('{}')]]);
  const result = await migrate(withChecksums, { request: { source_expected_A: sha256(withChecksums) } });
  assert.equal(failureCode(result), 'MIGRATION_SOURCE_EXTENSION_UNSUPPORTED');
});

test('an unclassifiable or already-0.6 source refuses as input-invalid', async () => {
  const future = rebuiltFixture(manifest => { manifest.format_version = '0.7.0'; });
  const futureResult = await migrate(future, { request: { source_expected_A: sha256(future) } });
  assert.equal(failureCode(futureResult), 'SOURCE_INPUT_INVALID');
  const six = fs.readFileSync(SOURCE6);
  const sixResult = await migrate(six, { request: { source_expected_A: sha256(six) } });
  assert.equal(failureCode(sixResult), 'SOURCE_INPUT_INVALID');
});

test('denied authority and a binding mismatch leave no output and use named codes', async () => {
  const admitted = migration.admitSourceMigrationRequest(request());
  assert.equal(admitted.status, 'admitted_request');
  const denied = await migration.migratePublicSourceNode(source5, admitted.request, deny());
  assert.equal(failureCode(denied), 'SOURCE_PERMISSION_REJECTED');
  const mismatched = await migrate(source5, { request: { source_expected_A: 'sha256:' + '0'.repeat(64) } });
  assert.equal(failureCode(mismatched), 'SOURCE_EXPECTED_ASSET_MISMATCH');
});

test('the classic stack still refuses the migrated container and the 0.6 route still reads it', async () => {
  const result = await migrate(source5);
  const classic = admitBytes(new Uint8Array(result.bytes));
  assert.equal(classic.status, 'rejected');
  // The in-repo classic path cannot parse the sections container at all and
  // reports READ_CORE_INVALID; the published CLI's section classifier reports
  // READ_UNSUPPORTED_VERSION for the same bytes. Both are refusals; neither
  // admission path converts or dual-reads.
  assert.ok(['READ_UNSUPPORTED_VERSION', 'READ_MIXED_VERSION_TUPLE', 'READ_CORE_INVALID'].includes(classic.reason), classic.reason);
  const six = fs.readFileSync(SOURCE6);
  const sixAdmitted = admitPublicBytes(new Uint8Array(six), { requireSignature: false, expectedPublicKeyHex: null }, 'capture:test6', 'sha256:' + '0'.repeat(64));
  assert.equal(sixAdmitted.manifest.format_version, '0.6.0');
  assert.equal(Object.hasOwn(sixAdmitted.manifest, 'representation_origin'), false);
});

test('the public subpath export exposes the same route instance', () => {
  assert.equal(req('@aikdna/kdna-core/source-migration-node'), migration);
});
