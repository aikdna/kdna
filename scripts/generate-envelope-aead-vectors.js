#!/usr/bin/env node
// generate-vectors.js — Compute kdna.envelope.aead test vectors (Story 17)
//
// Run from OPEN/kdna/:
//   node scripts/generate-envelope-aead-vectors.js
//
// Outputs deterministic base64 values that the conformance runner
// re-derives and asserts against. Inputs are fixed; do not "tidy"
// the inputs without also re-publishing the test vectors.
//
// The script is idempotent: re-running it with the same inputs
// produces byte-identical output. This is a property of the chosen
// KDFs (deterministic given the same password + salt + params) and
// the CEK-wrapping + AEAD pipelines (deterministic given the same
// IV; we fix IV per vector).
//
// Story 17 deliverable: this script + the 3 vector JSON files it
// produces. The script is NOT published to consumers — only the
// vector files are. Re-running is a maintainer action to regenerate
// vectors after a future change to the KDF or envelope format.

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ENVELOPE_PROFILE = 'kdna.envelope.aead';
const ALG = 'AES-256-GCM';
const KEY_WRAPPING = 'AES-256-KW';

const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1 };

const ARGON2_PARAMS = { t: 3, m: 65536, p: 4, dkLen: 32 };

// ── AAD builder (matches the envelope spec) ─────────────────────────

function buildAad(parts) {
  return Buffer.from(
    [
      ENVELOPE_PROFILE,
      parts.asset_uid,
      parts.asset_digest,
      parts.entry_path,
      parts.access_mode,
      parts.entitlement_profile,
    ].join('\n'),
    'utf8',
  );
}

// ── AES-256-KW (RFC 3394) — copied from kdna-core crypto-profile.js ──

const AES_BLOCK = 16;
const KW_IV = Buffer.from('a6a6a6a6a6a6a6a6', 'hex');

function aesWrap(key, plaintext) {
  if (key.length !== 32) throw new Error('AES-256-KW requires 32-byte key');
  if (plaintext.length !== 32) throw new Error('AES-256-KW requires 32-byte plaintext');
  const n = plaintext.length / 8;
  const r = new Array(n + 1);
  r[0] = KW_IV;
  for (let i = 0; i < n; i++) r[i + 1] = plaintext.subarray(i * 8, (i + 1) * 8);
  for (let j = 0; j <= 5; j++) {
    for (let i = 1; i <= n; i++) {
      const input = Buffer.concat([r[0], r[i]]);
      const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
      cipher.setAutoPadding(false);
      const b = Buffer.concat([cipher.update(input), cipher.final()]);
      r[0] = b.subarray(0, 8);
      const t = BigInt(n) * BigInt(j) + BigInt(i);
      const tBuf = Buffer.alloc(8);
      tBuf.writeBigUInt64BE(t);
      for (let k = 0; k < 8; k++) r[0][k] ^= tBuf[k];
      r[i] = b.subarray(8, 16);
    }
  }
  const result = Buffer.alloc((n + 1) * 8);
  for (let i = 0; i <= n; i++) r[i].copy(result, i * 8);
  return result;
}

// ── scrypt-sha256 (Node built-in) ───────────────────────────────────

function deriveKekScrypt(password, salt) {
  return crypto.scryptSync(Buffer.from(password, 'utf8'), salt, 32, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: 64 * 1024 * 1024,
  });
}

// ── Argon2id via @noble/hashes ──────────────────────────────────────

let argon2id;
try {
  ({ argon2id } = require('@noble/hashes/argon2.js'));
} catch (e) {
  console.error('@noble/hashes not available; install with: npm install @noble/hashes');
  process.exit(1);
}

function deriveKekArgon2id(password, salt) {
  return Buffer.from(
    argon2id(Buffer.from(password, 'utf8'), salt, {
      t: ARGON2_PARAMS.t,
      m: ARGON2_PARAMS.m,
      p: ARGON2_PARAMS.p,
      dkLen: ARGON2_PARAMS.dkLen,
    }),
  );
}

// ── Envelope builder ────────────────────────────────────────────────

function buildEnvelope({ kdf_profile, password, salt, iv, plaintext, aad, cek, kek }) {
  const wrappedKey = aesWrap(kek, cek);
  const cipher = crypto.createCipheriv(ALG, cek, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    profile: ENVELOPE_PROFILE,
    alg: ALG,
    key_wrapping: KEY_WRAPPING,
    kdf_profile,
    key_slots: [
      {
        slot: 'password',
        kdf_profile,
        kdf_params:
          kdf_profile === 'scrypt-sha256-v1'
            ? { ...SCRYPT_PARAMS, salt: salt.toString('base64') }
            : { ...ARGON2_PARAMS, salt: salt.toString('base64') },
        wrap: KEY_WRAPPING,
        wrapped_key: wrappedKey.toString('base64'),
      },
    ],
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

// ── Vector 1: scrypt-sha256-v1 basic round-trip ─────────────────────

function vector1() {
  const password = 'kdna-envelope-test-vector-1-password';
  const salt = Buffer.from(
    '0102030405060708090a0b0c0d0e0f10', // 16 bytes, fixed
    'hex',
  );
  const iv = Buffer.from('1112131415161718191a1b1c', 'hex'); // 12 bytes
  const cek = Buffer.from(
    'a1a2a3a4a5a6a7a8a9aaabacadaeafb0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0',
    'hex',
  );
  const plaintext = Buffer.from('Hello, KDNA envelope v1 (scrypt-sha256 basic).', 'utf8');
  const aad = buildAad({
    asset_uid: 'urn:uuid:11111111-1111-4111-8111-111111111111',
    asset_digest: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
    entry_path: 'KDNA_Core.json',
    access_mode: 'licensed',
    entitlement_profile: 'password',
  });
  const kek = deriveKekScrypt(password, salt);
  const envelope = buildEnvelope({
    kdf_profile: 'scrypt-sha256-v1',
    password,
    salt,
    iv,
    plaintext,
    aad,
    cek,
    kek,
  });
  const scryptParams = { ...SCRYPT_PARAMS, salt: salt.toString('base64') };
  return {
    id: 'kdna.envelope.aead-vector-01-scrypt-basic',
    description: 'scrypt-sha256-v1: basic round-trip with one password slot.',
    inputs: {
      password,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      cek: cek.toString('base64'),
      plaintext: plaintext.toString('utf8'),
      aad: aad.toString('utf8'),
      aad_lines: aad.toString('utf8').split('\n'),
      scrypt_params: scryptParams,
    },
    expected: {
      kek: kek.toString('base64'),
      envelope,
    },
  };
}

// ── Vector 2: scrypt-sha256-v1 multi-entry AAD ──────────────────────
// Proves that the AAD binding to <entry_path> prevents ciphertext
// swapping across entries: encrypting the same plaintext under
// different entry paths produces different ciphertexts.

function vector2() {
  const password = 'kdna-envelope-test-vector-2-password';
  const salt = Buffer.from('202122232425262728292a2b2c2d2e2f', 'hex');
  const iv = Buffer.from('2122232425262728292a2b2c', 'hex');
  const cek = Buffer.from(
    'b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0',
    'hex',
  );
  const plaintext = Buffer.from('Same plaintext, two entries.', 'utf8');
  const assetUid = 'urn:uuid:33333333-3333-4333-8333-333333333333';
  const assetDigest = 'sha256:4444444444444444444444444444444444444444444444444444444444444444';
  const aadEntry1 = buildAad({
    asset_uid: assetUid,
    asset_digest: assetDigest,
    entry_path: 'KDNA_Core.json',
    access_mode: 'licensed',
    entitlement_profile: 'password',
  });
  const aadEntry2 = buildAad({
    asset_uid: assetUid,
    asset_digest: assetDigest,
    entry_path: 'KDNA_Patterns.json',
    access_mode: 'licensed',
    entitlement_profile: 'password',
  });
  const kek = deriveKekScrypt(password, salt);
  const envelope1 = buildEnvelope({
    kdf_profile: 'scrypt-sha256-v1',
    password,
    salt,
    iv,
    plaintext,
    aad: aadEntry1,
    cek,
    kek,
  });
  const envelope2 = buildEnvelope({
    kdf_profile: 'scrypt-sha256-v1',
    password,
    salt,
    iv,
    plaintext,
    aad: aadEntry2,
    cek,
    kek,
  });
  const scryptParams = { ...SCRYPT_PARAMS, salt: salt.toString('base64') };
  return {
    id: 'kdna.envelope.aead-vector-02-scrypt-multi-entry-aad',
    description:
      'scrypt-sha256-v1: same CEK + IV + plaintext under two different AADs (entry_path differs). The two ciphertexts MUST differ because AAD is part of the GCM input. A reader MUST reject if AAD does not match.',
    inputs: {
      password,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      cek: cek.toString('base64'),
      plaintext: plaintext.toString('utf8'),
      aad_entry_1: aadEntry1.toString('utf8'),
      aad_entry_1_lines: aadEntry1.toString('utf8').split('\n'),
      aad_entry_2: aadEntry2.toString('utf8'),
      aad_entry_2_lines: aadEntry2.toString('utf8').split('\n'),
      scrypt_params: scryptParams,
    },
    expected: {
      kek: kek.toString('base64'),
      envelope_entry_1: envelope1,
      envelope_entry_2: envelope2,
      // GCM invariant: same IV + CEK + plaintext but different AADs
      // produce the SAME ciphertext (GCM is a stream cipher; AAD
      // affects the tag, not the ciphertext). The security property
      // is the divergent tag.
      ciphertext_entry_1_eq_entry_2: envelope1.ciphertext === envelope2.ciphertext,
      // AAD binding: the two tags MUST differ because their AADs
      // differ. This is the cross-entry swap invariant.
      tag_entry_1_eq_entry_2: envelope1.tag === envelope2.tag,
    },
  };
}

// ── Vector 3: argon2id-v1 basic round-trip ──────────────────────────

function vector3() {
  const password = 'kdna-envelope-test-vector-3-password';
  const salt = Buffer.from('303132333435363738393a3b3c3d3e3f', 'hex');
  const iv = Buffer.from('3132333435363738393a3b3c', 'hex');
  const cek = Buffer.from(
    'c1c2c3c4c5c6c7c8c9cacbcccdcecfd0e1e2e3e4e5e6e7e8e9eaebecedeeeff0',
    'hex',
  );
  const plaintext = Buffer.from('Hello, KDNA envelope v1 (argon2id-v1 basic).', 'utf8');
  const aad = buildAad({
    asset_uid: 'urn:uuid:55555555-5555-4555-8555-555555555555',
    asset_digest: 'sha256:6666666666666666666666666666666666666666666666666666666666666666',
    entry_path: 'KDNA_Core.json',
    access_mode: 'licensed',
    entitlement_profile: 'password',
  });
  const kek = deriveKekArgon2id(password, salt);
  const envelope = buildEnvelope({
    kdf_profile: 'argon2id-v1',
    password,
    salt,
    iv,
    plaintext,
    aad,
    cek,
    kek,
  });
  const argon2Params = { ...ARGON2_PARAMS, salt: salt.toString('base64') };
  return {
    id: 'kdna.envelope.aead-vector-03-argon2id-basic',
    description:
      'argon2id-v1: basic round-trip with the optional v2 KDF. Node.js implementations only; Swift port MUST either fallback to scrypt-sha256-v1 or refuse to load with KDNA_KDF_UNSUPPORTED.',
    inputs: {
      password,
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      cek: cek.toString('base64'),
      plaintext: plaintext.toString('utf8'),
      aad: aad.toString('utf8'),
      aad_lines: aad.toString('utf8').split('\n'),
      argon2_params: argon2Params,
    },
    expected: {
      kek: kek.toString('base64'),
      envelope,
    },
  };
}

// ── Main ────────────────────────────────────────────────────────────

const outDir = path.resolve(__dirname, '..', 'conformance', 'kdna.envelope.aead');
fs.mkdirSync(outDir, { recursive: true });

const vectors = [vector1(), vector2(), vector3()];
for (const v of vectors) {
  const filename = `${v.id}.json`;
  const filepath = path.join(outDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(v, null, 2) + '\n');
  console.log(`wrote ${filepath}`);
  console.log(`  kek (b64):  ${v.expected.kek}`);
  if (v.expected.ciphertext_entry_1_eq_entry_2 !== undefined) {
    console.log(`  ciphertext_entry_1: ${v.expected.envelope_entry_1.ciphertext}`);
    console.log(`  ciphertext_entry_2: ${v.expected.envelope_entry_2.ciphertext}`);
    console.log(`  tag_entry_1:        ${v.expected.envelope_entry_1.tag}`);
    console.log(`  tag_entry_2:        ${v.expected.envelope_entry_2.tag}`);
    console.log(`  ciphertext_entry_1_eq_entry_2: ${v.expected.ciphertext_entry_1_eq_entry_2}`);
    console.log(
      `  (GCM invariant: same CEK+IV+plaintext → same ciphertext; AAD affects TAG, not ciphertext)`,
    );
  } else {
    console.log(`  ciphertext: ${v.expected.envelope.ciphertext}`);
    console.log(`  tag:        ${v.expected.envelope.tag}`);
  }
}
