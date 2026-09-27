import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EnvelopeError,
  decryptEnvelope,
  deriveKek,
  getArgon2idCapability,
  unwrapAndDecrypt,
  validateEnvelope,
  validateEnvelopeSchema,
} from './envelope-aead.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vectorDir = path.join(root, 'conformance/envelope-aead');
const load = (name) => JSON.parse(fs.readFileSync(path.join(vectorDir, `envelope-aead-vector-${name}.json`), 'utf8'));
const basic = load('01-scrypt-basic');
const optional = load('03-argon2id-basic');
const multi = load('04-scrypt-multi-slot');
const mixed = load('05-mixed-multi-slot');
const cloned = (vector = basic) => structuredClone(vector.expected.envelope);
const typed = (code) => (error) => error instanceof EnvelopeError && error.code === code;
const bytes = (text) => Buffer.from(text, 'utf8');

function changed(value) {
  const decoded = Buffer.from(value, 'base64');
  decoded[0] ^= 1;
  return decoded.toString('base64');
}

function run(file, args = []) {
  const env = { ...process.env };
  delete env.NODE_PATH;
  return spawnSync(process.execPath, [file, ...args], { cwd: root, encoding: 'utf8', env });
}

function parsedReport(result, expectedExit = 0) {
  assert.equal(result.status, expectedExit, result.stderr || result.stdout);
  assert.equal(result.error, undefined);
  return JSON.parse(result.stdout);
}

function isolatedRunner(t) {
  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-envelope-no-argon-'));
  t.after(() => fs.rmSync(isolated, { recursive: true, force: true }));
  fs.mkdirSync(path.join(isolated, 'conformance'), { recursive: true });
  fs.mkdirSync(path.join(isolated, 'specs'));
  fs.mkdirSync(path.join(isolated, 'node_modules'));
  fs.copyFileSync(path.join(root, 'conformance/envelope-aead.mjs'), path.join(isolated, 'conformance/envelope-aead.mjs'));
  fs.copyFileSync(path.join(root, 'specs/envelope-aead.schema.json'), path.join(isolated, 'specs/envelope-aead.schema.json'));
  fs.cpSync(vectorDir, path.join(isolated, 'conformance/envelope-aead'), { recursive: true });
  fs.symlinkSync(path.dirname(require.resolve('ajv/package.json')), path.join(isolated, 'node_modules/ajv'), 'dir');
  return path.join(isolated, 'conformance/envelope-aead.mjs');
}

test('all six frozen envelope objects validate against the draft-2020 schema', () => {
  const files = fs.readdirSync(vectorDir).filter((name) => /^envelope-aead-vector-\d\d-.+\.json$/.test(name));
  assert.equal(files.length, 5);
  let count = 0;
  for (const file of files) {
    const vector = JSON.parse(fs.readFileSync(path.join(vectorDir, file), 'utf8'));
    const envelopes = vector.expected.envelope ? [vector.expected.envelope] : [vector.expected.envelope_entry_1, vector.expected.envelope_entry_2];
    for (const envelope of envelopes) {
      assert.deepEqual(validateEnvelopeSchema(envelope), { valid: true, errors: [] });
      validateEnvelope(envelope);
      count++;
    }
  }
  assert.equal(count, 6);
});

test('distinct credentials and KEKs recover one CEK through distinct wrapped bytes', () => {
  const results = multi.inputs.credentials.map((password, slotIndex) => {
    const kek = deriveKek(password, multi.expected.envelope.key_slots[slotIndex]);
    assert.equal(kek.toString('base64'), multi.expected.keks[slotIndex]);
    const result = decryptEnvelope(multi.expected.envelope, password, bytes(multi.inputs.aad), { slotIndex });
    assert.equal(result.selection.slotIndex, slotIndex);
    assert.equal(result.cek.toString('base64'), multi.inputs.cek);
    assert.equal(result.plaintext.toString('utf8'), multi.inputs.plaintext);
    return result;
  });
  assert.notEqual(multi.expected.keks[0], multi.expected.keks[1]);
  assert.notEqual(multi.expected.envelope.key_slots[0].wrapped_key, multi.expected.envelope.key_slots[1].wrapped_key);
  assert.deepEqual(results[0].cek, results[1].cek);
  assert.deepEqual(results[0].plaintext, results[1].plaintext);
});

test('the default slot is primary and a recovery password cannot trigger fallback', () => {
  assert.throws(() => decryptEnvelope(multi.expected.envelope, multi.inputs.credentials[1], bytes(multi.inputs.aad)), typed('KDNA_KW_INTEGRITY'));
  assert.throws(() => decryptEnvelope(multi.expected.envelope, multi.inputs.credentials[0], bytes(multi.inputs.aad), { slotIndex: 1 }), typed('KDNA_KW_INTEGRITY'));
  const result = decryptEnvelope(multi.expected.envelope, multi.inputs.credentials[1], bytes(multi.inputs.aad), { slotIndex: 1 });
  assert.equal(result.selection.slotIndex, 1);
});

test('copying wrapped bytes into another KEK slot fails KW integrity', () => {
  const envelope = cloned(multi);
  envelope.key_slots[1].wrapped_key = envelope.key_slots[0].wrapped_key;
  assert.throws(() => decryptEnvelope(envelope, multi.inputs.credentials[1], bytes(multi.inputs.aad), { slotIndex: 1 }), typed('KDNA_KW_INTEGRITY'));
});

test('a separately valid wrapped key for a different CEK fails GCM authentication', () => {
  const envelope = cloned(multi);
  const kek = Buffer.from(multi.expected.keks[1], 'base64');
  const wrap = crypto.createCipheriv('id-aes256-wrap', kek, Buffer.from('a6a6a6a6a6a6a6a6', 'hex'));
  envelope.key_slots[1].wrapped_key = Buffer.concat([wrap.update(Buffer.alloc(32, 0x99)), wrap.final()]).toString('base64');
  assert.throws(() => unwrapAndDecrypt(envelope, kek, bytes(multi.inputs.aad), { slotIndex: 1 }), typed('KDNA_GCM_AUTH_FAILED'));
});

for (const field of ['wrapped_key', 'iv', 'tag', 'ciphertext']) {
  test(`tampered ${field} is rejected with the appropriate integrity error`, () => {
    const envelope = cloned();
    const target = field === 'wrapped_key' ? envelope.key_slots[0] : envelope;
    target[field] = changed(target[field]);
    assert.throws(() => unwrapAndDecrypt(envelope, Buffer.from(basic.expected.kek, 'base64'), bytes(basic.inputs.aad)), typed(field === 'wrapped_key' ? 'KDNA_KW_INTEGRITY' : 'KDNA_GCM_AUTH_FAILED'));
  });
}

test('every one of the eight AAD binding lines is authenticated', () => {
  for (let line = 0; line < 8; line++) {
    const aad = basic.inputs.aad.split('\n');
    aad[line] += '-changed';
    assert.throws(() => unwrapAndDecrypt(basic.expected.envelope, Buffer.from(basic.expected.kek, 'base64'), bytes(aad.join('\n'))), typed('KDNA_GCM_AUTH_FAILED'), `AAD line ${line + 1}`);
  }
});

test('empty plaintext is accepted and authenticated as empty ciphertext', () => {
  const envelope = cloned();
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(basic.inputs.cek, 'base64'), Buffer.alloc(12, 0xab));
  cipher.setAAD(bytes(basic.inputs.aad));
  envelope.iv = Buffer.alloc(12, 0xab).toString('base64');
  envelope.ciphertext = Buffer.concat([cipher.update(Buffer.alloc(0)), cipher.final()]).toString('base64');
  envelope.tag = cipher.getAuthTag().toString('base64');
  assert.equal(envelope.ciphertext, '');
  assert.equal(validateEnvelopeSchema(envelope).valid, true);
  assert.equal(unwrapAndDecrypt(envelope, Buffer.from(basic.expected.kek, 'base64'), bytes(basic.inputs.aad)).plaintext.length, 0);
});

const envelopeFailures = [
  ['profile', (e) => { e.profile = 'kdna.encryption.password'; }, 'KDNA_ENVELOPE_PROFILE_UNSUPPORTED'],
  ['version', (e) => { e.profile_version = '9.0.0'; }, 'KDNA_ENVELOPE_VERSION_UNSUPPORTED'],
  ['algorithm', (e) => { e.alg = 'AES-128-GCM'; }, 'KDNA_ENVELOPE_ALG_UNSUPPORTED'],
  ['wrapping algorithm', (e) => { e.key_wrapping = 'AES-128-KW'; }, 'KDNA_ENVELOPE_WRAP_UNSUPPORTED'],
  ['slot wrapping algorithm', (e) => { e.key_slots[0].wrap = 'AES-128-KW'; }, 'KDNA_ENVELOPE_WRAP_UNSUPPORTED'],
  ['empty slots', (e) => { e.key_slots = []; }, 'KDNA_ENVELOPE_NO_SLOTS'],
  ['unknown KDF', (e) => { e.key_slots[0].kdf_profile = 'unknown'; }, 'KDNA_KDF_UNSUPPORTED'],
  ['unknown top-level KDF', (e) => { e.kdf_profile = 'unknown'; }, 'KDNA_KDF_UNSUPPORTED'],
  ['primary mismatch', (e) => { e.kdf_profile = 'argon2id'; }, 'KDNA_ENVELOPE_KDF_MISMATCH'],
  ['extra envelope field', (e) => { e.extra = true; }, 'KDNA_ENVELOPE_SHAPE_INVALID'],
  ['empty slot name', (e) => { e.key_slots[0].slot = ''; }, 'KDNA_ENVELOPE_SHAPE_INVALID'],
  ['extra slot field', (e) => { e.key_slots[0].extra = true; }, 'KDNA_ENVELOPE_SHAPE_INVALID'],
];
for (const [name, mutate, code] of envelopeFailures) {
  test(`${name} is rejected before any scrypt allocation`, (t) => {
    const kdf = t.mock.method(crypto, 'scryptSync', () => { throw new Error('KDF must not run'); });
    const envelope = cloned();
    mutate(envelope);
    assert.throws(() => decryptEnvelope(envelope, basic.inputs.password, bytes(basic.inputs.aad)), typed(code));
    assert.equal(kdf.mock.callCount(), 0);
    if (code !== 'KDNA_ENVELOPE_KDF_MISMATCH') assert.equal(validateEnvelopeSchema(envelope).valid, false);
  });
}

for (const [field, length] of [['iv', 12], ['tag', 16], ['wrapped_key', 40]]) {
  test(`${field} validates both canonical base64 and decoded byte length`, () => {
    for (const value of [Buffer.alloc(length - 1).toString('base64'), Buffer.alloc(length + 1).toString('base64'), '***', 'AQ==garbage']) {
      const envelope = cloned();
      (field === 'wrapped_key' ? envelope.key_slots[0] : envelope)[field] = value;
      assert.throws(() => validateEnvelope(envelope), (error) => typed('KDNA_ENVELOPE_FIELD_LENGTH')(error) && error.field === field);
    }
  });
}

test('invalid selected indices have a named no-slots error', () => {
  for (const slotIndex of [-1, 1, 1.5, '0', NaN, Infinity]) {
    assert.throws(() => validateEnvelope(basic.expected.envelope, { slotIndex }), typed('KDNA_ENVELOPE_NO_SLOTS'));
  }
});

const parameterFailures = [
  ['scrypt lower N', basic, (p) => { p.N = 16384; }],
  ['scrypt enormous N', basic, (p) => { p.N = 2 ** 30; }],
  ['scrypt r', basic, (p) => { p.r = 1; }],
  ['scrypt p', basic, (p) => { p.p = 16; }],
  ['missing scrypt parameter', basic, (p) => { delete p.N; }],
  ['extra scrypt parameter', basic, (p) => { p.dkLen = 32; }],
  ['non-numeric scrypt parameter', basic, (p) => { p.N = '32768'; }],
  ['argon lower memory', optional, (p) => { p.m = 32768; }],
  ['argon enormous memory', optional, (p) => { p.m = 2 ** 30; }],
  ['argon time', optional, (p) => { p.t = 4; }],
  ['argon lanes', optional, (p) => { p.p = 1; }],
  ['argon key length', optional, (p) => { p.dkLen = 16; }],
  ['missing argon key length', optional, (p) => { delete p.dkLen; }],
  ['extra argon parameter', optional, (p) => { p.N = 32768; }],
  ['short salt', basic, (p) => { p.salt = Buffer.alloc(15).toString('base64'); }],
  ['noncanonical salt', optional, (p) => { p.salt = 'AAAAAAAAAAAAAAAAAAAAAB=='; }],
];
for (const [name, vector, mutate] of parameterFailures) {
  test(`${name} fails schema and parameter admission before KDF execution`, (t) => {
    const kdf = t.mock.method(crypto, 'scryptSync', () => { throw new Error('KDF must not run'); });
    const envelope = cloned(vector);
    mutate(envelope.key_slots[0].kdf_params);
    assert.equal(validateEnvelopeSchema(envelope).valid, false);
    assert.throws(() => decryptEnvelope(envelope, vector.inputs.password, bytes(vector.inputs.aad), { argon2id: 'disabled' }), typed('KDNA_KDF_PARAMS_INVALID'));
    assert.equal(kdf.mock.callCount(), 0);
  });
}

test('a KDF token cannot use the other KDF parameter shape', () => {
  for (const [vector, other] of [[basic, optional], [optional, basic]]) {
    const envelope = cloned(vector);
    envelope.key_slots[0].kdf_params = structuredClone(other.expected.envelope.key_slots[0].kdf_params);
    assert.equal(validateEnvelopeSchema(envelope).valid, false);
    assert.throws(() => validateEnvelope(envelope), typed('KDNA_KDF_PARAMS_INVALID'));
  }
});

test('disabled Argon2id rejects the selected primary even when a usable scrypt slot exists', () => {
  assert.deepEqual(getArgon2idCapability('disabled'), { supported: false, reason: 'DISABLED' });
  assert.throws(() => decryptEnvelope(optional.expected.envelope, optional.inputs.password, bytes(optional.inputs.aad), { argon2id: 'disabled' }), typed('KDNA_KDF_UNSUPPORTED'));
  assert.throws(() => decryptEnvelope(mixed.expected.envelope, mixed.inputs.credentials[1], bytes(mixed.inputs.aad), { argon2id: 'disabled' }), typed('KDNA_KDF_UNSUPPORTED'));
  const result = decryptEnvelope(mixed.expected.envelope, mixed.inputs.credentials[1], bytes(mixed.inputs.aad), { slotIndex: 1, argon2id: 'disabled' });
  assert.equal(result.selection.slotIndex, 1);
  assert.equal(result.cek.toString('base64'), mixed.inputs.cek);
  assert.equal(result.plaintext.toString(), mixed.inputs.plaintext);
});

test('disabled CLI distinguishes NOT_RUN from successful decryption', () => {
  const report = parsedReport(run(path.join(root, 'conformance/envelope-aead.mjs'), ['--argon2id=disabled']));
  assert.equal(report.scope, 'LOCAL_ALGORITHM_ONLY');
  assert.equal(report.baseConformance, 'PASS');
  assert.equal(report.argon2idConformance, 'NOT_RUN');
  assert.equal(report.capabilities.argon2id, false);
  assert.equal(report.counts.NOT_RUN, 2);
  assert.equal(report.counts.DECRYPTED, 7);
  assert.equal(report.counts.VALIDATED, 6);
  for (const result of report.results.filter((r) => r.status === 'NOT_RUN')) {
    assert.equal(result.reason, 'DISABLED');
    assert.ok(report.results.some((r) => r.id === `${result.id}:unsupported` && r.status === 'REJECTED_EXPECTED' && r.code === 'KDNA_KDF_UNSUPPORTED'));
  }
});

test('required CLI proves Argon2id decryption when the dependency is installed', (t) => {
  if (!getArgon2idCapability().supported) {
    t.skip('Optional dependency is absent; required-missing and auto-missing paths are exercised separately');
    return;
  }
  const report = parsedReport(run(path.join(root, 'conformance/envelope-aead.mjs'), ['--argon2id=required']));
  assert.equal(report.argon2idConformance, 'PASS');
  assert.equal(report.counts.NOT_RUN, 0);
  assert.equal(report.counts.DECRYPTED, 9);
  assert.equal(report.results.filter((r) => r.status === 'DECRYPTED' && r.selection.kdf_profile === 'argon2id').length, 2);
});

test('physically missing optional module: auto proves rejection; required exits nonzero', (t) => {
  const entry = isolatedRunner(t);
  const auto = parsedReport(run(entry, ['--argon2id=auto']));
  assert.equal(auto.capabilities.argon2idReason, 'DEPENDENCY_MISSING');
  assert.equal(auto.baseConformance, 'PASS');
  assert.equal(auto.argon2idConformance, 'NOT_RUN');
  assert.equal(auto.counts.NOT_RUN, 2);
  assert.equal(auto.counts.DECRYPTED, 7);
  assert.ok(auto.results.some((r) => r.id.includes('05-') && r.id.endsWith(':unsupported') && r.code === 'KDNA_KDF_UNSUPPORTED'));
  const required = parsedReport(run(entry, ['--argon2id=required']), 1);
  assert.equal(required.ok, false);
  assert.equal(required.error, 'KDNA_KDF_UNSUPPORTED');
  assert.equal(required.argon2idConformance, 'NOT_RUN');
  assert.deepEqual(required.counts, auto.counts);
});

test('conformance assertion failures never print CEK, KEK, or plaintext values', (t) => {
  const entry = isolatedRunner(t);
  const fixture = path.join(path.dirname(entry), 'envelope-aead/envelope-aead-vector-01-scrypt-basic.json');
  for (const kind of ['kek', 'cek', 'plaintext']) {
    const vector = structuredClone(basic);
    const replacement = kind === 'plaintext' ? 'CONFIDENTIAL-PLAINTEXT-SENTINEL' : Buffer.alloc(32, 0xee).toString('base64');
    if (kind === 'kek') vector.expected.kek = replacement;
    else vector.inputs[kind] = replacement;
    fs.writeFileSync(fixture, JSON.stringify(vector));
    const result = run(entry, ['--argon2id=disabled']);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error, 'ERR_ASSERTION');
    for (const forbidden of [replacement, basic.expected.kek, basic.inputs.cek, basic.inputs.plaintext]) {
      assert.equal(`${result.stdout}${result.stderr}`.includes(forbidden), false, `${kind} failure exposed a protected value`);
    }
  }
});

test('invalid CLI capabilities cannot silently run another mode', () => {
  for (const args of [['--argon2id=maybe'], ['--nonsense'], ['--argon2id=disabled', '--argon2id=required']]) {
    const result = run(path.join(root, 'conformance/envelope-aead.mjs'), args);
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error, 'KDNA_CONFORMANCE_ARGUMENT');
  }
});
