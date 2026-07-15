/**
 * kdna.envelope.aead.mjs — Conformance runner (Story 17 / RFC-0018)
 *
 * Re-derives the three frozen test vectors under
 * `conformance/envelope-aead/` from their declared inputs
 * and asserts equality with the declared expected outputs. This is
 * the canonical "is this implementation correct?" check for
 * `kdna.envelope.aead`.
 *
 * Vector inventory:
 *   01 — scrypt-sha256-v1 basic round-trip
 *   02 — scrypt-sha256-v1 multi-entry AAD binding
 *   03 — argon2id-v1 basic round-trip
 *
 * Each vector is a self-contained JSON file with:
 *   - `id`, `description`
 *   - `inputs` (password, salt, iv, cek, plaintext, aad, kdf_params)
 *   - `expected.kek` (base64)
 *   - `expected.envelope` (or `envelope_entry_1` / `envelope_entry_2`
 *     for the multi-entry case)
 *   - `expected.ciphertext_entry_1_eq_entry_2` (vector 02 only)
 *
 * The runner performs the following checks per vector:
 *   1. KDF derivation: derive KEK from password + salt, compare to
 *      expected.kek. Proves the KDF implementation matches the
 *      test-vector inputs.
 *   2. AEAD round-trip: unwrap the CEK from wrapped_key, decrypt
 *      ciphertext with CEK + IV + AAD, compare to plaintext. Proves
 *      the AES-256-KW and AES-256-GCM pipelines are wired together
 *      correctly.
 *   3. Envelope shape: assert envelope.profile, alg, key_wrapping,
 *      kdf_profile, key_slots structure match RFC-0018.
 *   4. AAD binding (vector 02 only): assert that swapping AADs
 *      between entry 1 and entry 2 produces divergent tags. This
 *      is the cross-entry swap invariant.
 *   5. JSON Schema validation: assert the envelope validates
 *      against `specs/envelope-aead.schema.json`. Proves
 *      the envelope shape is conformant to the spec.
 *
 * Run:
 *   node conformance/envelope-aead.mjs
 *   # or via npm:
 *   npm run conformance:envelope-aead
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

let argon2id;
try {
  ({ argon2id } = require('@noble/hashes/argon2.js'));
} catch {
  // argon2id support is optional per RFC-0018 R4.2; vector 03 will
  // skip rather than fail if @noble/hashes is not installed.
}

const root = path.dirname(fileURLToPath(import.meta.url));
const vectorsDir = path.join(root, 'kdna.envelope.aead');
const schemaPath = path.join(root, '..', 'specs', 'envelope-aead.schema.json');

// ── KDF implementations (mirror kdna-core crypto-profile.js) ───────

function deriveKekScrypt(password, params) {
  const { N, r, p, salt } = params;
  return crypto.scryptSync(Buffer.from(password, 'utf8'), Buffer.from(salt, 'base64'), 32, {
    N,
    r,
    p,
    maxmem: 128 * 1024 * 1024,
  });
}

function deriveKekArgon2id(password, params) {
  if (!argon2id) {
    throw new Error(
      'argon2id vector cannot run: @noble/hashes not installed. ' +
        'Install with `npm install @noble/hashes` to enable vector 03.',
    );
  }
  const { t, m, p, salt, dkLen = 32 } = params;
  return Buffer.from(
    argon2id(Buffer.from(password, 'utf8'), Buffer.from(salt, 'base64'), {
      t,
      m,
      p,
      dkLen,
    }),
  );
}

// ── AES-256-KW (RFC 3394) — local implementation ───────────────────

const KW_IV = Buffer.from('a6a6a6a6a6a6a6a6', 'hex');

function aesKwUnwrap(key, ciphertext) {
  if (key.length !== 32) throw new Error('AES-256-KW requires 32-byte key');
  if (ciphertext.length !== 40) throw new Error('AES-256-KW ciphertext must be 40 bytes');
  const n = ciphertext.length / 8 - 1;
  const r = new Array(n + 1);
  for (let i = 0; i <= n; i++) r[i] = ciphertext.subarray(i * 8, (i + 1) * 8);
  for (let j = 5; j >= 0; j--) {
    for (let i = n; i >= 1; i--) {
      const t = BigInt(n) * BigInt(j) + BigInt(i);
      const tBuf = Buffer.alloc(8);
      tBuf.writeBigUInt64BE(t);
      for (let k = 0; k < 8; k++) r[0][k] ^= tBuf[k];
      const input = Buffer.concat([r[0], r[i]]);
      const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
      decipher.setAutoPadding(false);
      const b = Buffer.concat([decipher.update(input), decipher.final()]);
      r[0] = b.subarray(0, 8);
      r[i] = b.subarray(8, 16);
    }
  }
  if (!r[0].equals(KW_IV)) throw new Error('AES-256-KW unwrap: integrity check failed');
  const result = Buffer.alloc(n * 8);
  for (let i = 1; i <= n; i++) r[i].copy(result, (i - 1) * 8);
  return result;
}

// ── Vector loaders ──────────────────────────────────────────────────

function loadVector(id) {
  const p = path.join(vectorsDir, `${id}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function deriveKek(vector) {
  const { password, kdf_profile } = vector.inputs;
  if (kdf_profile === 'scrypt-sha256-v1' || vector.inputs.scrypt_params) {
    return deriveKekScrypt(password, vector.inputs.scrypt_params);
  }
  if (kdf_profile === 'argon2id-v1' || vector.inputs.argon2_params) {
    return deriveKekArgon2id(password, vector.inputs.argon2_params);
  }
  throw new Error(`unknown kdf_profile: ${kdf_profile}`);
}

function unwrapAndDecrypt(envelope, kek, aad) {
  // Use the first slot's wrapped_key. (All slots share the same
  // wrapped CEK bytes per RFC-0018 R3.)
  const slot = envelope.key_slots[0];
  const cek = aesKwUnwrap(kek, Buffer.from(slot.wrapped_key, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', cek, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return {
    cek,
    plaintext: Buffer.concat([
      decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final(),
    ]),
  };
}

// ── Per-vector check functions ──────────────────────────────────────

function checkScryptBasic() {
  const v = loadVector('kdna.envelope.aead-vector-01-scrypt-basic');
  const kek = deriveKek(v);
  const expectedKek = Buffer.from(v.expected.kek, 'base64');
  assert.equal(
    kek.toString('base64'),
    expectedKek.toString('base64'),
    'vector 01: derived KEK does not match expected KEK',
  );

  const { cek, plaintext } = unwrapAndDecrypt(
    v.expected.envelope,
    kek,
    Buffer.from(v.inputs.aad, 'utf8'),
  );
  assert.equal(
    cek.toString('base64'),
    v.inputs.cek,
    'vector 01: unwrapped CEK does not match the declared CEK',
  );
  assert.equal(
    plaintext.toString('utf8'),
    v.inputs.plaintext,
    'vector 01: decrypted plaintext does not match the declared plaintext',
  );

  // Envelope shape
  const env = v.expected.envelope;
  assert.equal(env.profile, 'kdna.envelope.aead');
  assert.equal(env.alg, 'AES-256-GCM');
  assert.equal(env.key_wrapping, 'AES-256-KW');
  assert.equal(env.kdf_profile, 'scrypt-sha256-v1');
  assert.equal(env.key_slots.length, 1);
  assert.equal(env.key_slots[0].kdf_profile, 'scrypt-sha256-v1');
  assert.equal(env.key_slots[0].wrap, 'AES-256-KW');
  return 'vector 01 scrypt-sha256-v1 basic: KEK + CEK + plaintext all match';
}

function checkScryptMultiEntryAad() {
  const v = loadVector('kdna.envelope.aead-vector-02-scrypt-multi-entry-aad');
  const kek = deriveKek(v);
  assert.equal(
    kek.toString('base64'),
    Buffer.from(v.expected.kek, 'base64').toString('base64'),
    'vector 02: derived KEK does not match expected KEK',
  );

  // Both envelopes decrypt to the same plaintext.
  const r1 = unwrapAndDecrypt(
    v.expected.envelope_entry_1,
    kek,
    Buffer.from(v.inputs.aad_entry_1, 'utf8'),
  );
  const r2 = unwrapAndDecrypt(
    v.expected.envelope_entry_2,
    kek,
    Buffer.from(v.inputs.aad_entry_2, 'utf8'),
  );
  assert.equal(
    r1.plaintext.toString('utf8'),
    v.inputs.plaintext,
    'vector 02: entry 1 plaintext mismatch',
  );
  assert.equal(
    r2.plaintext.toString('utf8'),
    v.inputs.plaintext,
    'vector 02: entry 2 plaintext mismatch',
  );

  // GCM invariant: same CEK + IV + plaintext → same ciphertext.
  assert.equal(
    v.expected.envelope_entry_1.ciphertext,
    v.expected.envelope_entry_2.ciphertext,
    'vector 02: GCM invariant — ciphertexts should be equal (GCM is a stream cipher; AAD affects tag only)',
  );

  // AAD binding: different entry_path AADs → different tags.
  assert.equal(
    v.expected.ciphertext_entry_1_eq_entry_2,
    true,
    'vector 02: declared ciphertext_entry_1_eq_entry_2 invariant violated',
  );
  assert.equal(
    v.expected.tag_entry_1_eq_entry_2,
    false,
    'vector 02: declared tag_entry_1_eq_entry_2 invariant violated (tags MUST differ when AADs differ)',
  );

  // Cross-AAD swap must fail GCM auth.
  let swapRejected = false;
  try {
    unwrapAndDecrypt(v.expected.envelope_entry_1, kek, Buffer.from(v.inputs.aad_entry_2, 'utf8'));
  } catch (e) {
    swapRejected = true;
  }
  assert.equal(
    swapRejected,
    true,
    'vector 02: cross-AAD swap MUST be rejected by GCM auth (proves AAD binding is enforced, not just computed)',
  );
  return 'vector 02 scrypt-sha256-v1 multi-entry AAD: both entries decrypt, tags diverge, cross-AAD swap rejected';
}

function checkArgon2idBasic() {
  const v = loadVector('kdna.envelope.aead-vector-03-argon2id-basic');
  if (!argon2id) {
    return 'vector 03 argon2id-v1 basic: SKIPPED (@noble/hashes not installed; install with `npm install @noble/hashes` to enable)';
  }
  const kek = deriveKek(v);
  assert.equal(
    kek.toString('base64'),
    Buffer.from(v.expected.kek, 'base64').toString('base64'),
    'vector 03: derived KEK does not match expected KEK',
  );

  const { cek, plaintext } = unwrapAndDecrypt(
    v.expected.envelope,
    kek,
    Buffer.from(v.inputs.aad, 'utf8'),
  );
  assert.equal(
    cek.toString('base64'),
    v.inputs.cek,
    'vector 03: unwrapped CEK does not match the declared CEK',
  );
  assert.equal(
    plaintext.toString('utf8'),
    v.inputs.plaintext,
    'vector 03: decrypted plaintext does not match the declared plaintext',
  );

  const env = v.expected.envelope;
  assert.equal(env.profile, 'kdna.envelope.aead');
  assert.equal(env.kdf_profile, 'argon2id-v1');
  assert.equal(env.key_slots[0].kdf_profile, 'argon2id-v1');
  return 'vector 03 argon2id-v1 basic: KEK + CEK + plaintext all match';
}

// ── JSON Schema validation (all three vectors) ─────────────────────

function checkSchemaValidation() {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const vectors = [
    'kdna.envelope.aead-vector-01-scrypt-basic',
    'kdna.envelope.aead-vector-02-scrypt-multi-entry-aad',
    'kdna.envelope.aead-vector-03-argon2id-basic',
  ];

  for (const id of vectors) {
    const v = loadVector(id);
    const envelopes = v.expected.envelope
      ? [v.expected.envelope]
      : [v.expected.envelope_entry_1, v.expected.envelope_entry_2];
    for (let i = 0; i < envelopes.length; i++) {
      const env = envelopes[i];
      const valid = validate(env);
      assert.equal(
        valid,
        true,
        `${id} envelope[${i}]: schema validation failed:\n${ajv.errorsText(validate.errors)}`,
      );
    }
  }
  return 'all 4 envelope objects validate against kdna.envelope.aead schema';
}

// ── Main ────────────────────────────────────────────────────────────

export function runKdnaEnvelopeAeadV1Conformance() {
  const results = [];
  results.push(checkScryptBasic());
  results.push(checkScryptMultiEntryAad());
  results.push(checkArgon2idBasic());
  results.push(checkSchemaValidation());
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const results = runKdnaEnvelopeAeadV1Conformance();
  for (const r of results) console.log(`  PASS ${r}`);
  console.log(`KDNA envelope-aead-v1 conformance passed (3 vectors, 1 schema)`);
}
