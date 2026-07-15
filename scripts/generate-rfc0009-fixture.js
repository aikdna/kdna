#!/usr/bin/env node

/** Generate the deterministic password-envelope interoperability fixture. */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');
const core = require('../packages/kdna-core/src');

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');
const EXPECTED_DIR = path.join(FIXTURES_DIR, 'expected');
const TEST_PASSWORD = 'KDNA-TEST-VECTOR-2026';
const TEST_RECOVERY_CODE =
  'kdna-recover-AABB-CCDD-1122-3344-5566-7788-9900-AABB-CCDD-EEFF-0011-2233-4455-6677-8899-AABB';

const payload = {
  profile: 'kdna.payload.judgment',
  profile_version: '0.1.0',
  core: {
    highest_question: 'Can the same protected judgment be recovered across implementations?',
    axioms: [
      {
        id: 'protected_a1',
        one_sentence: 'Cross-implementation decryption must recover identical payload bytes.',
        full_statement:
          'A JavaScript-encrypted payload decrypts identically in every conforming implementation.',
        why: 'Interoperability requires one authenticated wire contract.',
      },
    ],
  },
  patterns: {
    misunderstandings: [
      {
        id: 'protected_m1',
        wrong: 'Each implementation can choose different associated data.',
        correct: 'Every implementation authenticates the same stable manifest coordinates.',
        key_distinction: 'interoperability',
        why: 'Different associated data must fail authentication.',
      },
    ],
  },
  scenarios: [],
  cases: [],
  reasoning: {
    self_check: ['Did decryption recover the exact canonical payload bytes?'],
    failure_modes: [],
  },
};

const manifest = {
  format_version: '0.1.0',
  asset_id: 'kdna:fixture:password-envelope',
  asset_uid: 'urn:uuid:00090000-0000-4000-8000-000000000001',
  asset_type: 'fixture',
  title: 'Password Envelope Interoperability Fixture',
  version: '1.0.0',
  judgment_version: '1.0.0',
  created_at: '2026-06-02T00:00:00Z',
  updated_at: '2026-06-02T00:00:00Z',
  compatibility: {
    min_loader_version: '0.18.1',
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
  },
  payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
  access: 'licensed',
  entitlement: { profile: 'password', offline: true, revocable: false },
  encryption: {
    profile: core.PASSWORD_PROTECTED_PROFILE,
    profile_version: core.ENCRYPTION_PROFILE_VERSION,
    encrypted_entries: ['payload.kdnab'],
  },
};

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function passwordEnvelope(plaintext) {
  const cek = Buffer.from(
    '0909090909090909090909090909090909090909090909090909090909090909',
    'hex',
  );
  const salt = Buffer.from('00090009000900090009000900090009', 'hex');
  const iv = Buffer.from('090807060504030201000908', 'hex');
  const passwordKdf = {
    name: core.PASSWORD_KDF,
    salt: salt.toString('base64'),
    memory_kib: 65536,
    iterations: 3,
    parallelism: 4,
  };
  const passwordKey = core.derivePasswordKey(TEST_PASSWORD, passwordKdf);
  const recoveryKey = core.decodeRecoveryCode(TEST_RECOVERY_CODE);
  const aad = Buffer.from(
    [
      core.PASSWORD_PROTECTED_PROFILE,
      core.ENCRYPTION_PROFILE_VERSION,
      manifest.asset_id,
      manifest.version,
      manifest.payload.path,
    ].join('\n'),
    'utf8',
  );
  const cipher = crypto.createCipheriv('aes-256-gcm', cek, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    profile: core.PASSWORD_PROTECTED_PROFILE,
    profile_version: core.ENCRYPTION_PROFILE_VERSION,
    alg: core.ALG,
    kdf: core.PASSWORD_KDF,
    key_wrapping: core.RFC_KEY_WRAPPING,
    password_kdf: passwordKdf,
    key_slots: [
      {
        slot: 'password',
        wrap: core.RFC_KEY_WRAPPING,
        wrapped_key: core.aesWrap(passwordKey, cek).toString('base64'),
      },
      {
        slot: 'recovery',
        wrap: core.RFC_KEY_WRAPPING,
        wrapped_key: core.aesWrap(recoveryKey, cek).toString('base64'),
      },
    ],
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

const plaintext = Buffer.from(cbor.encode(payload));
const envelope = passwordEnvelope(plaintext);
const encodedEnvelope = Buffer.from(cbor.encode(envelope));
const source = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-password-envelope-'));
const fixturePath = path.join(FIXTURES_DIR, 'test_protected_entry.kdna');

try {
  fs.mkdirSync(EXPECTED_DIR, { recursive: true });
  fs.writeFileSync(path.join(source, 'mimetype'), core.MIMETYPE);
  fs.writeFileSync(path.join(source, 'kdna.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(source, 'payload.kdnab'), encodedEnvelope);
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    JSON.stringify(core.buildChecksums(source)),
  );
  core.pack(source, fixturePath);

  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(fixturePath);
  const runtimeManifest = reader.readManifestSync(asset);
  const decryptEntry = core.createPasswordDecryptEntry({ password: TEST_PASSWORD });
  const decrypted = decryptEntry({
    entryName: runtimeManifest.payload.path,
    ciphertext: reader.readEntrySync(asset, runtimeManifest.payload.path),
    manifest: runtimeManifest,
  });
  if (!decrypted.equals(plaintext)) throw new Error('password fixture round-trip failed');

  fs.writeFileSync(path.join(EXPECTED_DIR, 'payload_protected.json'), json(payload));
  fs.writeFileSync(path.join(EXPECTED_DIR, 'manifest_protected.json'), json(manifest));
  fs.writeFileSync(path.join(EXPECTED_DIR, 'envelope_protected.json'), json(envelope));
} finally {
  fs.rmSync(source, { recursive: true, force: true });
}

console.log(`Password envelope round-trip: OK`);
console.log(`Wrote fixture: ${fixturePath}`);
console.log(`Wrote expected outputs to: ${EXPECTED_DIR}`);
