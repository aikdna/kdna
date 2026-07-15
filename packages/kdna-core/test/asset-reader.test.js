'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

const {
  createKdnaAssetReader,
  createPasswordDecryptEntry,
  decodeRecoveryCode,
  decryptProtectedEntry,
  encryptProtectedEntry,
  generateRecoveryCode,
} = require('../src');

function u16(value) {
  const out = Buffer.alloc(2);
  out.writeUInt16LE(value);
  return out;
}

function u32(value) {
  const out = Buffer.alloc(4);
  out.writeUInt32LE(value);
  return out;
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      nameBytes, data,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));
    offset += local.length;
  }
  const local = Buffer.concat(localParts);
  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    local,
    central,
    u32(0x06054b50), u16(0), u16(0), u16(centralParts.length),
    u16(centralParts.length), u32(central.length), u32(local.length), u16(0),
  ]);
}

function manifest() {
  return {
    format_version: '0.1.0',
    asset_id: 'kdna:test:protected',
    asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000009',
    asset_type: 'fixture',
    title: 'Protected test asset',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    compatibility: {
      min_loader_version: '0.18.1',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
    access: 'licensed',
    entitlement: { profile: 'password' },
    encryption: {
      profile: 'kdna.encryption.password',
      profile_version: '0.1.0',
      encrypted_entries: ['payload.kdnab'],
    },
  };
}

test('asset reader verifies and decrypts the committed password fixture in memory', async () => {
  const fixture = path.resolve(__dirname, '../../../fixtures/test_protected_entry.kdna');
  const expected = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../../fixtures/expected/payload_protected.json'),
    'utf8',
  ));
  const reader = createKdnaAssetReader();
  const asset = await reader.open(fixture);
  assert.match(asset.asset_digest, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(
    await reader.listEntries(asset),
    ['checksums.json', 'kdna.json', 'mimetype', 'payload.kdnab'],
  );

  const assetManifest = await reader.readManifest(asset);
  const decryptEntry = createPasswordDecryptEntry({ password: 'KDNA-TEST-VECTOR-2026' });
  const verification = await reader.verify(asset, { requireDecryption: true, decryptEntry });
  assert.equal(verification.ok, true, verification.errors.join('; '));
  const plaintext = decryptEntry({
    entryName: assetManifest.payload.path,
    ciphertext: await reader.readEntry(asset, assetManifest.payload.path),
    manifest: assetManifest,
  });
  assert.deepEqual(cbor.decode(plaintext), expected);
});

test('encrypted fixture requires an in-memory decrypt hook when decryption is required', async () => {
  const fixture = path.resolve(__dirname, '../../../fixtures/test_protected_entry.kdna');
  const reader = createKdnaAssetReader();
  const verification = await reader.verify(await reader.open(fixture), {
    requireDecryption: true,
  });
  assert.equal(verification.ok, false);
  assert.ok(verification.errors.includes('decryptEntry hook required for encrypted entries'));
});

test('asset reader projects the encrypted fixture through the authorized Runtime path', async () => {
  const fixture = path.resolve(__dirname, '../../../fixtures/test_protected_entry.kdna');
  const reader = createKdnaAssetReader();
  const decryptEntry = createPasswordDecryptEntry({ password: 'KDNA-TEST-VECTOR-2026' });
  const capsule = await reader.loadProfile(await reader.open(fixture), 'compact', {
    password: 'KDNA-TEST-VECTOR-2026',
    decryptEntry,
  });
  assert.equal(capsule.type, 'kdna.runtime-capsule');
  assert.equal(capsule.contract_version, '0.1.0');
  assert.equal(capsule.asset.asset_id, 'kdna:fixture:password-envelope');
  assert.equal(
    capsule.context.highest_question,
    'Can the same protected judgment be recovered across implementations?',
  );
});

test('synchronous reader verification and projection preserve the encrypted fixture contract', () => {
  const fixture = path.resolve(__dirname, '../../../fixtures/test_protected_entry.kdna');
  const reader = createKdnaAssetReader();
  const asset = reader.openSync(fixture);
  const decryptEntry = createPasswordDecryptEntry({ password: 'KDNA-TEST-VECTOR-2026' });
  const verification = reader.verifySync(asset, { requireDecryption: true, decryptEntry });
  assert.equal(verification.ok, true, verification.errors.join('; '));
  const capsule = reader.loadProfileSync(asset, 'compact', {
    password: 'KDNA-TEST-VECTOR-2026',
    decryptEntry,
  });
  assert.equal(capsule.type, 'kdna.runtime-capsule');
  assert.equal(capsule.asset.asset_uid, verification.manifest.asset_uid);
});

test('wrong password hook cannot verify the encrypted fixture', async () => {
  const fixture = path.resolve(__dirname, '../../../fixtures/test_protected_entry.kdna');
  const reader = createKdnaAssetReader();
  const decryptEntry = createPasswordDecryptEntry({ password: 'wrong-password' });
  const verification = await reader.verify(await reader.open(fixture), {
    requireDecryption: true,
    decryptEntry,
  });
  assert.equal(verification.ok, false);
  assert.ok(verification.errors.some((error) => /integrity check failed|unwrap/i.test(error)));
});

test('asset verification rejects an archive without the KDNA mimetype marker', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-missing-marker-'));
  try {
    const assetPath = path.join(temporary, 'invalid.kdna');
    fs.writeFileSync(assetPath, makeZip({
      'kdna.json': JSON.stringify(manifest()),
      'payload.kdnab': cbor.encode({
        profile: 'kdna.payload.judgment',
        profile_version: '0.1.0',
        core: { highest_question: 'Q', axioms: [] },
      }),
    }));
    const reader = createKdnaAssetReader();
    const verification = await reader.verify(await reader.open(assetPath));
    assert.equal(verification.ok, false);
    assert.ok(verification.errors.includes('required entry missing: mimetype'));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('asset verification rejects top-level authoring source entries', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-source-entry-'));
  try {
    const assetPath = path.join(temporary, 'invalid.kdna');
    const sourceEntry = ['KDNA', 'Core.json'].join('_');
    fs.writeFileSync(assetPath, makeZip({
      mimetype: 'application/vnd.kdna.asset',
      'kdna.json': JSON.stringify(manifest()),
      'payload.kdnab': cbor.encode({
        profile: 'kdna.payload.judgment',
        profile_version: '0.1.0',
        core: { highest_question: 'Q', axioms: [] },
      }),
      [sourceEntry]: '{}',
    }));
    const reader = createKdnaAssetReader();
    const verification = await reader.verify(await reader.open(assetPath));
    assert.equal(verification.ok, false);
    assert.ok(verification.errors.some((error) => error.includes('forbidden top-level source entry')));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('password envelope round-trips with the stable profile coordinate', () => {
  const assetManifest = manifest();
  const plaintext = cbor.encode({ secret: 'protected judgment' });
  const envelope = encryptProtectedEntry(plaintext, {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'correct-password',
  });
  assert.equal(envelope.profile, 'kdna.encryption.password');
  assert.equal(envelope.profile_version, '0.1.0');
  assert.equal(envelope.alg, 'AES-256-GCM');
  assert.deepEqual(
    decryptProtectedEntry(envelope, {
      entryName: assetManifest.payload.path,
      manifest: assetManifest,
      password: 'correct-password',
    }),
    plaintext,
  );
});

test('recovery code unwraps the same password envelope CEK', () => {
  const assetManifest = manifest();
  const recoveryCode = generateRecoveryCode();
  assert.equal(decodeRecoveryCode(recoveryCode).length, 32);
  const plaintext = Buffer.from('recoverable protected judgment');
  const envelope = encryptProtectedEntry(plaintext, {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'correct-password',
    recoveryCode,
  });
  assert.deepEqual(
    decryptProtectedEntry(envelope, {
      entryName: assetManifest.payload.path,
      manifest: assetManifest,
      recoveryCode,
    }),
    plaintext,
  );
});

test('wrong password fails closed', () => {
  const assetManifest = manifest();
  const envelope = encryptProtectedEntry(Buffer.from('secret'), {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'correct-password',
  });
  assert.throws(() => decryptProtectedEntry(envelope, {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'wrong-password',
  }), /integrity check failed|AES-256-KW unwrap/);
});

test('tampered password-envelope ciphertext fails authentication', () => {
  const assetManifest = manifest();
  const envelope = encryptProtectedEntry(Buffer.from('secret'), {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'correct-password',
  });
  const bytes = Buffer.from(envelope.ciphertext, 'base64');
  bytes[0] ^= 0xff;
  envelope.ciphertext = bytes.toString('base64');
  assert.throws(() => decryptProtectedEntry(envelope, {
    entryName: assetManifest.payload.path,
    manifest: assetManifest,
    password: 'correct-password',
  }));
});
