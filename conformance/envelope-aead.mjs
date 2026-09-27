/**
 * RFC-0018 draft envelope conformance, using local Node.js algorithms only.
 * This is not a Core consumer, container admission, or account-service test.
 *
 * node conformance/envelope-aead.mjs --argon2id=auto|disabled|required
 * The JSON report separates decryption, expected rejection, schema validation,
 * and operations not run. Optional-algorithm absence never counts as decryption.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv2020 = require('ajv/dist/2020');
const root = path.dirname(fileURLToPath(import.meta.url));
const vectorsDir = path.join(root, 'envelope-aead');
const schemaPath = path.join(root, '..', 'specs', 'envelope-aead.schema.json');
const validateSchema = new Ajv2020({ allErrors: true, strict: false }).compile(
  JSON.parse(fs.readFileSync(schemaPath, 'utf8')),
);
const KDF_PROFILES = ['scrypt-sha256', 'argon2id'];
const KW_IV = Buffer.from('a6a6a6a6a6a6a6a6', 'hex');

export class EnvelopeError extends Error {
  constructor(code, message, field) {
    super(message);
    this.name = 'EnvelopeError';
    this.code = code;
    if (field !== undefined) this.field = field;
  }
}

function fail(code, message, field) {
  throw new EnvelopeError(code, message, field);
}

function checkMode(mode) {
  if (!['auto', 'required', 'disabled'].includes(mode)) {
    fail('KDNA_CONFORMANCE_ARGUMENT', 'argon2id must be auto, required, or disabled');
  }
}

let optionalArgon2id;
let argon2idProbed = false;
function probeArgon2id() {
  if (!argon2idProbed) {
    try {
      ({ argon2id: optionalArgon2id } = require('@noble/hashes/argon2.js'));
      if (typeof optionalArgon2id !== 'function') {
        throw new Error('@noble/hashes/argon2.js does not export argon2id');
      }
    } catch (error) {
      // Only absence of the optional module is an unsupported capability.
      // Broken installed modules must fail the run, not turn into a skip.
      if (error.code !== 'MODULE_NOT_FOUND' ||
          !error.message.includes("Cannot find module '@noble/hashes/argon2.js'")) {
        throw error;
      }
    }
    argon2idProbed = true;
  }
  return optionalArgon2id;
}

export function getArgon2idCapability(mode = 'auto') {
  checkMode(mode);
  if (mode === 'disabled') return { supported: false, reason: 'DISABLED' };
  return probeArgon2id()
    ? { supported: true, reason: 'DEPENDENCY_AVAILABLE' }
    : { supported: false, reason: 'DEPENDENCY_MISSING' };
}

function decodedBase64(value, field, length, code = 'KDNA_ENVELOPE_FIELD_LENGTH') {
  const bytes = typeof value === 'string' ? Buffer.from(value, 'base64') : null;
  if (!bytes || bytes.toString('base64') !== value ||
      (length !== undefined && bytes.length !== length)) {
    fail(code, `${field} must be canonical base64${length === undefined ? '' : ` of ${length} bytes`}`, field);
  }
  return bytes;
}

function checkKdfProfile(profile) {
  if (!KDF_PROFILES.includes(profile)) {
    fail('KDNA_KDF_UNSUPPORTED', `Unsupported KDF profile: ${String(profile)}`);
  }
}

function validateKdfParams(slot) {
  checkKdfProfile(slot?.kdf_profile);
  const params = slot.kdf_params;
  const fixed = slot.kdf_profile === 'scrypt-sha256'
    ? { N: 32768, r: 8, p: 1 }
    : { t: 3, m: 65536, p: 4, dkLen: 32 };
  const fields = [...Object.keys(fixed), 'salt'];
  if (!params || typeof params !== 'object' || Array.isArray(params) ||
      Object.keys(params).length !== fields.length ||
      Object.keys(params).some((key) => !fields.includes(key)) ||
      Object.entries(fixed).some(([key, value]) => params[key] !== value)) {
    fail('KDNA_KDF_PARAMS_INVALID', `Invalid fixed parameters for ${slot.kdf_profile}`);
  }
  decodedBase64(params.salt, 'salt', 16, 'KDNA_KDF_PARAMS_INVALID');
}

export function validateEnvelopeSchema(envelope) {
  return {
    valid: validateSchema(envelope),
    errors: structuredClone(validateSchema.errors ?? []),
  };
}

// All envelope and parameter checks happen before either KDF allocates memory.
// Both known KDFs are shape-checked even if this build disables Argon2id.
export function validateEnvelope(envelope, { slotIndex = 0 } = {}) {
  if (envelope?.profile !== 'kdna.envelope.aead') {
    fail('KDNA_ENVELOPE_PROFILE_UNSUPPORTED', `Unsupported profile: ${String(envelope?.profile)}; supported: kdna.envelope.aead`);
  }
  if (envelope.profile_version !== '0.1.0') {
    fail('KDNA_ENVELOPE_VERSION_UNSUPPORTED', `Unsupported profile version: ${String(envelope.profile_version)}; supported: 0.1.0`);
  }
  if (envelope.alg !== 'AES-256-GCM') {
    fail('KDNA_ENVELOPE_ALG_UNSUPPORTED', 'Only AES-256-GCM is supported');
  }
  if (envelope.key_wrapping !== 'AES-256-KW') {
    fail('KDNA_ENVELOPE_WRAP_UNSUPPORTED', 'Only AES-256-KW is supported');
  }
  if (!Array.isArray(envelope.key_slots) || envelope.key_slots.length === 0 ||
      !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= envelope.key_slots.length) {
    fail('KDNA_ENVELOPE_NO_SLOTS', 'No key slot exists at the selected index');
  }
  checkKdfProfile(envelope.kdf_profile);
  for (const slot of envelope.key_slots) checkKdfProfile(slot?.kdf_profile);
  if (envelope.kdf_profile !== envelope.key_slots[0].kdf_profile) {
    fail('KDNA_ENVELOPE_KDF_MISMATCH', 'Envelope KDF must match the primary key slot');
  }
  decodedBase64(envelope.iv, 'iv', 12);
  decodedBase64(envelope.tag, 'tag', 16);
  decodedBase64(envelope.ciphertext, 'ciphertext');
  for (const slot of envelope.key_slots) {
    if (slot.wrap !== 'AES-256-KW') {
      fail('KDNA_ENVELOPE_WRAP_UNSUPPORTED', 'Only AES-256-KW slot wrapping is supported');
    }
    decodedBase64(slot.wrapped_key, 'wrapped_key', 40);
    validateKdfParams(slot);
  }
  if (!validateEnvelopeSchema(envelope).valid) {
    fail('KDNA_ENVELOPE_SHAPE_INVALID', 'Envelope does not match the RFC-0018 schema');
  }
  const slot = envelope.key_slots[slotIndex];
  return { slot, selection: { slotIndex, slot: slot.slot, kdf_profile: slot.kdf_profile } };
}

export function deriveKek(password, slot, { argon2id = 'auto' } = {}) {
  checkMode(argon2id);
  validateKdfParams(slot);
  if (typeof password !== 'string') {
    fail('KDNA_KDF_PARAMS_INVALID', 'The supplied password must be a UTF-8 string');
  }
  const params = slot.kdf_params;
  const passwordBytes = Buffer.from(password, 'utf8');
  const salt = Buffer.from(params.salt, 'base64');
  if (slot.kdf_profile === 'scrypt-sha256') {
    return crypto.scryptSync(passwordBytes, salt, 32, {
      N: params.N, r: params.r, p: params.p, maxmem: 128 * 1024 * 1024,
    });
  }
  const capability = getArgon2idCapability(argon2id);
  if (!capability.supported) {
    fail('KDNA_KDF_UNSUPPORTED', `argon2id is unsupported: ${capability.reason}`);
  }
  return Buffer.from(probeArgon2id()(passwordBytes, salt, {
    t: params.t, m: params.m, p: params.p, dkLen: params.dkLen,
  }));
}

function aesKwUnwrap(key, ciphertext) {
  if (!Buffer.isBuffer(key) || key.length !== 32) {
    fail('KDNA_ENVELOPE_FIELD_LENGTH', 'KEK must be 32 bytes', 'kek');
  }
  const n = ciphertext.length / 8 - 1;
  const blocks = Array.from({ length: n + 1 }, (_, i) => Buffer.from(ciphertext.subarray(i * 8, (i + 1) * 8)));
  for (let j = 5; j >= 0; j--) {
    for (let i = n; i >= 1; i--) {
      const tBuf = Buffer.alloc(8);
      tBuf.writeBigUInt64BE(BigInt(n * j + i));
      for (let k = 0; k < 8; k++) blocks[0][k] ^= tBuf[k];
      const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);
      decipher.setAutoPadding(false);
      const b = Buffer.concat([decipher.update(Buffer.concat([blocks[0], blocks[i]])), decipher.final()]);
      blocks[0] = b.subarray(0, 8);
      blocks[i] = b.subarray(8, 16);
    }
  }
  if (!crypto.timingSafeEqual(blocks[0], KW_IV)) {
    fail('KDNA_KW_INTEGRITY', 'AES-256-KW integrity check failed');
  }
  return Buffer.concat(blocks.slice(1));
}

export function unwrapAndDecrypt(envelope, kek, aad, { slotIndex = 0 } = {}) {
  const { slot, selection } = validateEnvelope(envelope, { slotIndex });
  const cek = aesKwUnwrap(kek, Buffer.from(slot.wrapped_key, 'base64'));
  let plaintext;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', cek, Buffer.from(envelope.iv, 'base64'));
    decipher.setAAD(aad);
    decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
    plaintext = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
  } catch {
    fail('KDNA_GCM_AUTH_FAILED', 'AES-256-GCM authentication failed');
  }
  return { cek, plaintext, selection };
}

export function decryptEnvelope(envelope, password, aad, { slotIndex = 0, argon2id = 'auto' } = {}) {
  const { slot } = validateEnvelope(envelope, { slotIndex });
  const kek = deriveKek(password, slot, { argon2id });
  return unwrapAndDecrypt(envelope, kek, aad, { slotIndex });
}

function loadVector(number) {
  const names = fs.readdirSync(vectorsDir).filter((name) => name.startsWith(`envelope-aead-vector-${number}-`) && name.endsWith('.json'));
  assert.equal(names.length, 1, `expected exactly one vector ${number}`);
  return JSON.parse(fs.readFileSync(path.join(vectorsDir, names[0]), 'utf8'));
}

function tamperBase64(value) {
  const bytes = Buffer.from(value, 'base64');
  bytes[0] ^= 1;
  return bytes.toString('base64');
}

export function runKdnaEnvelopeAeadConformance({ argon2id = 'auto' } = {}) {
  checkMode(argon2id);
  const capability = getArgon2idCapability(argon2id);
  const vectors = ['01', '02', '03', '04', '05'].map(loadVector);
  const [basic, aadVector, optional, multi, mixed] = vectors;
  const results = [];

  function expectReject(id, attempt, code, selection) {
    assert.throws(attempt, (error) => error instanceof EnvelopeError && error.code === code, id);
    results.push({ id, status: 'REJECTED_EXPECTED', code, ...(selection ? { selection } : {}) });
  }
  function checkDecrypt(id, vector, envelope, password, aad, expectedKek, slotIndex = 0) {
    const { slot, selection } = validateEnvelope(envelope, { slotIndex });
    if (slot.kdf_profile === 'argon2id' && !capability.supported) {
      results.push({ id, status: 'NOT_RUN', reason: capability.reason, selection });
      expectReject(`${id}:unsupported`, () => decryptEnvelope(envelope, password, Buffer.from(aad), { slotIndex, argon2id }), 'KDNA_KDF_UNSUPPORTED', selection);
      return;
    }
    const kek = deriveKek(password, slot, { argon2id });
    assert.ok(kek.toString('base64') === expectedKek, `${id}: derived KEK mismatch`);
    const result = unwrapAndDecrypt(envelope, kek, Buffer.from(aad), { slotIndex });
    assert.ok(result.cek.toString('base64') === vector.inputs.cek, `${id}: unwrapped CEK mismatch`);
    assert.ok(result.plaintext.toString('utf8') === vector.inputs.plaintext, `${id}: plaintext mismatch`);
    results.push({ id, status: 'DECRYPTED', selection });
  }

  for (const vector of vectors) {
    const envelopes = vector.expected.envelope
      ? [vector.expected.envelope]
      : [vector.expected.envelope_entry_1, vector.expected.envelope_entry_2];
    for (const [index, envelope] of envelopes.entries()) {
      const schema = validateEnvelopeSchema(envelope);
      assert.equal(schema.valid, true, `${vector.id}[${index}]: ${JSON.stringify(schema.errors)}`);
      validateEnvelope(envelope);
      results.push({ id: `${vector.id}:schema:${index}`, status: 'VALIDATED' });
    }
  }
  checkDecrypt(basic.id, basic, basic.expected.envelope, basic.inputs.password, basic.inputs.aad, basic.expected.kek);
  for (const index of [1, 2]) {
    checkDecrypt(`${aadVector.id}:entry:${index}`, aadVector, aadVector.expected[`envelope_entry_${index}`], aadVector.inputs.password, aadVector.inputs[`aad_entry_${index}`], aadVector.expected.kek);
  }
  assert.equal(aadVector.expected.envelope_entry_1.ciphertext, aadVector.expected.envelope_entry_2.ciphertext);
  assert.notEqual(aadVector.expected.envelope_entry_1.tag, aadVector.expected.envelope_entry_2.tag);
  assert.equal(aadVector.expected.ciphertext_entry_1_eq_entry_2, true);
  assert.equal(aadVector.expected.tag_entry_1_eq_entry_2, false);
  expectReject('vector-02:cross-entry-AAD', () => decryptEnvelope(aadVector.expected.envelope_entry_1, aadVector.inputs.password, Buffer.from(aadVector.inputs.aad_entry_2)), 'KDNA_GCM_AUTH_FAILED');
  checkDecrypt(optional.id, optional, optional.expected.envelope, optional.inputs.password, optional.inputs.aad, optional.expected.kek);
  for (const vector of [multi, mixed]) {
    assert.equal(vector.expected.envelope.key_slots.length, 2);
    assert.ok(vector.expected.keks[0] !== vector.expected.keks[1], `${vector.id}: expected distinct KEKs`);
    assert.notEqual(vector.expected.envelope.key_slots[0].wrapped_key, vector.expected.envelope.key_slots[1].wrapped_key, `${vector.id}: distinct wraps of the same CEK`);
    for (const slotIndex of [0, 1]) {
      checkDecrypt(`${vector.id}:slot:${slotIndex}`, vector, vector.expected.envelope, vector.inputs.credentials[slotIndex], vector.inputs.aad, vector.expected.keks[slotIndex], slotIndex);
    }
  }

  const envelope = multi.expected.envelope;
  const aad = Buffer.from(multi.inputs.aad);
  const password = multi.inputs.credentials[0];
  expectReject('multi-slot:wrong-password', () => decryptEnvelope(envelope, `${password}-wrong`, aad), 'KDNA_KW_INTEGRITY');
  expectReject('multi-slot:wrong-slot-credential', () => decryptEnvelope(envelope, password, aad, { slotIndex: 1 }), 'KDNA_KW_INTEGRITY');
  const copied = structuredClone(envelope);
  copied.key_slots[1].wrapped_key = copied.key_slots[0].wrapped_key;
  expectReject('multi-slot:copied-wrapped-bytes', () => decryptEnvelope(copied, multi.inputs.credentials[1], aad, { slotIndex: 1 }), 'KDNA_KW_INTEGRITY');
  for (const field of ['wrapped_key', 'tag', 'ciphertext', 'iv']) {
    const tampered = structuredClone(envelope);
    const target = field === 'wrapped_key' ? tampered.key_slots[0] : tampered;
    target[field] = tamperBase64(target[field]);
    expectReject(`multi-slot:tampered-${field}`, () => decryptEnvelope(tampered, password, aad), field === 'wrapped_key' ? 'KDNA_KW_INTEGRITY' : 'KDNA_GCM_AUTH_FAILED');
  }
  expectReject('multi-slot:tampered-AAD', () => decryptEnvelope(envelope, password, Buffer.from(`${multi.inputs.aad}-wrong`)), 'KDNA_GCM_AUTH_FAILED');
  expectReject('argon2id:disabled-single-slot', () => decryptEnvelope(optional.expected.envelope, optional.inputs.password, Buffer.from(optional.inputs.aad), { argon2id: 'disabled' }), 'KDNA_KDF_UNSUPPORTED', { slotIndex: 0 });
  expectReject('argon2id:disabled-primary-no-fallback', () => decryptEnvelope(mixed.expected.envelope, mixed.inputs.credentials[1], Buffer.from(mixed.inputs.aad), { argon2id: 'disabled' }), 'KDNA_KDF_UNSUPPORTED', { slotIndex: 0 });
  const explicit = decryptEnvelope(mixed.expected.envelope, mixed.inputs.credentials[1], Buffer.from(mixed.inputs.aad), { slotIndex: 1, argon2id: 'disabled' });
  assert.ok(explicit.cek.toString('base64') === mixed.inputs.cek, 'explicit secondary: CEK mismatch');
  assert.ok(explicit.plaintext.toString('utf8') === mixed.inputs.plaintext, 'explicit secondary: plaintext mismatch');
  results.push({ id: 'argon2id:disabled-explicit-secondary', status: 'DECRYPTED', selection: explicit.selection });

  const counts = Object.fromEntries(['DECRYPTED', 'REJECTED_EXPECTED', 'NOT_RUN', 'VALIDATED'].map((status) => [status, results.filter((result) => result.status === status).length]));
  return {
    scope: 'LOCAL_ALGORITHM_ONLY',
    profile: 'kdna.envelope.aead',
    profile_version: '0.1.0',
    mode: argon2id,
    capabilities: { 'scrypt-sha256': true, argon2id: capability.supported, argon2idReason: capability.reason },
    baseConformance: 'PASS',
    argon2idConformance: capability.supported ? 'PASS' : 'NOT_RUN',
    ok: argon2id !== 'required' || capability.supported,
    ...(argon2id === 'required' && !capability.supported ? { error: 'KDNA_KDF_UNSUPPORTED' } : {}),
    counts,
    results,
    limits: [
      'No Core canonical consumer or container admission is exercised.',
      'Vector 02 reuses a nonce for an analytical AAD counterexample; it is not production encryption guidance.',
      'NOT_RUN is not a successful decryption or an Argon2id conformance result.',
    ],
  };
}

// Compare real paths so aliased CLI invocations execute, while imports stay quiet.
function entryGuardOutcome() {
  if (!process.argv[1]) return 'import';
  const selfPath = fileURLToPath(import.meta.url);
  let invokedReal = null;
  let selfReal = null;
  try { invokedReal = fs.realpathSync(process.argv[1]); } catch { invokedReal = null; }
  try { selfReal = fs.realpathSync(selfPath); } catch { selfReal = null; }
  if (invokedReal && selfReal && invokedReal === selfReal) return 'entry';
  if (path.resolve(process.argv[1]) === path.resolve(selfPath)) return 'unresolved-entry';
  return 'import';
}

const entryGuard = entryGuardOutcome();
if (entryGuard === 'unresolved-entry') {
  console.error('KDNA_ENVELOPE_AEAD_ENTRY_GUARD_FAILED: refusing to run under an unresolved entry path');
  process.exitCode = 2;
}
if (entryGuard === 'entry') {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && !args[0].startsWith('--argon2id='))) {
      fail('KDNA_CONFORMANCE_ARGUMENT', 'Usage: node conformance/envelope-aead.mjs [--argon2id=auto|disabled|required]');
    }
    const report = runKdnaEnvelopeAeadConformance({ argon2id: args[0]?.slice('--argon2id='.length) ?? 'auto' });
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    console.error(JSON.stringify({ scope: 'LOCAL_ALGORITHM_ONLY', ok: false, error: error.code ?? 'KDNA_CONFORMANCE_FAILED', message: error.message }));
    process.exitCode = 1;
  }
}
