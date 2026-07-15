/**
 * Generate a cross-language RFC-0009 test fixture.
 *
 * Usage: node scripts/generate-rfc0009-fixture.js
 *
 * Outputs:
 *   fixtures/test_protected_entry.kdna
 *   fixtures/expected/KDNA_Core.json
 *   fixtures/expected/KDNA_Patterns.json
 *   fixtures/expected/manifest.json
 */

const fs = require('fs');
const path = require('path');
const {
  encryptProtectedEntry,
  createPasswordDecryptEntry,
} = require('../packages/kdna-core/src/crypto-profile');
const { createKdnaAssetReader } = require('../packages/kdna-core/src/asset-reader');

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const EXPECTED_DIR = path.join(FIXTURES_DIR, 'expected');

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, value] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ]);
    localParts.push(local);

    centralParts.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(data.length),
        u32(data.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ]),
    );
    offset += local.length;
  }

  const central = Buffer.concat(centralParts);
  const local = Buffer.concat(localParts);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(centralParts.length),
    u16(centralParts.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);
  return Buffer.concat([local, central, eocd]);
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

// ─── Reference vectors (must match RFC-0009 test vectors) ───────────

const TEST_PASSWORD = 'KDNA-TEST-VECTOR-2026';
const TEST_RECOVERY_CODE =
  'kdna-recover-AABB-CCDD-1122-3344-5566-7788-9900-AABB-CCDD-EEFF-0011-2233-4455-6677-8899-AABB';

const core = {
  meta: {
    domain: 'protected_test',
    version: '0.1.0',
    created: '2026-06-02',
    purpose: 'test',
    load_condition: 'always',
  },
  stances: ['Protected judgment decrypts correctly across languages.'],
  axioms: [
    {
      id: 'protected_a1',
      one_sentence: 'Cross-language decryption works.',
      full_statement: 'A JS-encrypted entry decrypts identically in Swift.',
      why: 'RFC-0009 interoperability.',
    },
  ],
  ontology: [],
};

const patterns = {
  meta: {
    domain: 'protected_test',
    version: '0.1.0',
    created: '2026-06-02',
    purpose: 'test',
    load_condition: 'always',
  },
  misunderstandings: [
    {
      id: 'protected_m1',
      wrong: 'Different language decryption.',
      correct: 'Identical plaintext.',
      key_distinction: 'interoperability',
      why: 'Same algorithms produce same results.',
    },
  ],
  self_check: ['Does JS ciphertext decrypt in Swift?'],
};

const manifest = {
  kdna_version: '1.0',
  name: '@aikdna/protected_test',
  version: '0.1.0',
  judgment_version: '2026.06',
  access: 'protected',
  status: 'experimental',
  quality_badge: 'untested',
  description: 'RFC-0009 cross-language test asset',
  author: { name: 'Test', id: 'test' },
  languages: ['en'],
  default_language: 'en',
  encryption: {
    profile: 'kdna.encryption.password',
    encrypted_entries: ['KDNA_Core.json', 'KDNA_Patterns.json'],
  },
};

// ─── Build encrypted entries ────────────────────────────────────────

const coreEnvelope = encryptProtectedEntry(Buffer.from(json(core), 'utf8'), {
  entryName: 'KDNA_Core.json',
  manifest,
  password: TEST_PASSWORD,
  includeRecovery: true,
  recoveryCode: TEST_RECOVERY_CODE,
});

const patternsEnvelope = encryptProtectedEntry(Buffer.from(json(patterns), 'utf8'), {
  entryName: 'KDNA_Patterns.json',
  manifest,
  password: TEST_PASSWORD,
  includeRecovery: true,
  recoveryCode: TEST_RECOVERY_CODE,
});

// ─── Assemble ZIP ──────────────────────────────────────────────────

const zipBuffer = buildZip({
  mimetype: 'application/vnd.kdna.asset',
  'kdna.json': json(manifest),
  'KDNA_Core.json': json(coreEnvelope),
  'KDNA_Patterns.json': json(patternsEnvelope),
});

// ─── Verify round-trip in JS before writing ────────────────────────

const reader = createKdnaAssetReader();
const asset = reader.openSync(zipBuffer);
const decryptEntry = createPasswordDecryptEntry({ password: TEST_PASSWORD });

const coreDecrypted = decryptEntry({
  entryName: 'KDNA_Core.json',
  ciphertext: reader.readEntrySync(asset, 'KDNA_Core.json'),
  manifest: reader.readManifestSync(asset),
});
const patternsDecrypted = decryptEntry({
  entryName: 'KDNA_Patterns.json',
  ciphertext: reader.readEntrySync(asset, 'KDNA_Patterns.json'),
  manifest: reader.readManifestSync(asset),
});

const coreParsed = JSON.parse(coreDecrypted.toString('utf8'));
const patternsParsed = JSON.parse(patternsDecrypted.toString('utf8'));

if (coreParsed.axioms[0].id !== 'protected_a1') {
  throw new Error('JS round-trip verification failed');
}
if (patternsParsed.misunderstandings[0].id !== 'protected_m1') {
  throw new Error('JS round-trip verification failed');
}

console.log('JS round-trip: OK');

// ─── Write outputs ──────────────────────────────────────────────────

if (!fs.existsSync(EXPECTED_DIR)) {
  fs.mkdirSync(EXPECTED_DIR, { recursive: true });
}

fs.writeFileSync(path.join(FIXTURES_DIR, 'test_protected_entry.kdna'), zipBuffer);
fs.writeFileSync(path.join(EXPECTED_DIR, 'KDNA_Core_protected.json'), json(core));
fs.writeFileSync(path.join(EXPECTED_DIR, 'KDNA_Patterns_protected.json'), json(patterns));
fs.writeFileSync(path.join(EXPECTED_DIR, 'manifest_protected.json'), json(manifest));

console.log(`Wrote fixture: ${path.join(FIXTURES_DIR, 'test_protected_entry.kdna')}`);
console.log(`Wrote expected outputs to: ${EXPECTED_DIR}`);
