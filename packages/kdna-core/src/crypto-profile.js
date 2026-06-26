const crypto = require('crypto');

let argon2id;
try {
  ({ argon2id } = require('@noble/hashes/argon2.js'));
} catch {
  // Optional: password-protected assets require @noble/hashes
}

// ── Profile constants ──────────────────────────────────────────────

/**
 * RFC-0008 compliant profile.
 * - HKDF-SHA256 key derivation
 * - AES-256-KW (RFC 3394) content encryption key wrapping
 * - AES-256-GCM content encryption
 * - Random CEK per asset; license key only unwraps CEK, never touches content
 */
const LICENSED_ENTRY_PROFILE = 'kdna-licensed-entry-v1';

/**
 * Pre-RFC legacy profile (now experimental).
 * Uses scrypt-sha256 with concatenated secret (`licenseKey|machineFingerprint`).
 * Retained for backward compatibility only.
 */
const LICENSED_EXPERIMENTAL_PROFILE = 'kdna-licensed-entry-experimental';

/**
 * RFC-0009 compliant profile.
 * - Argon2id password-based key derivation
 * - AES-256-KW content encryption key wrapping
 * - AES-256-GCM content encryption
 * - Dual key slots: password + recovery
 */
const PASSWORD_PROTECTED_PROFILE = 'kdna-password-protected-v1';

const RFC_KDF = 'HKDF-SHA256';
const RFC_KEY_WRAPPING = 'AES-256-KW';
const LEGACY_KDF = 'scrypt-sha256';
const PASSWORD_KDF = 'Argon2id';
const ALG = 'AES-256-GCM';

// ── Helpers ───────────────────────────────────────────────────────

function toBuffer(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') return Buffer.from(value, 'utf8');
  throw new Error(`${label} must be a string, Buffer, or Uint8Array`);
}

function decodeBase64(value, label) {
  if (typeof value !== 'string' || !value) throw new Error(`${label} must be base64`);
  return Buffer.from(value, 'base64');
}

function normalizeEnvelope(value) {
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return JSON.parse(Buffer.from(value).toString('utf8'));
  }
  if (typeof value === 'string') return JSON.parse(value);
  if (value && typeof value === 'object') return value;
  throw new Error('encrypted entry envelope must be JSON');
}

function encryptedEntryAad(entryName, manifest = {}, profile = LICENSED_ENTRY_PROFILE) {
  return Buffer.from(
    [
      profile,
      manifest.name || manifest.asset_id || '',
      manifest.version || '',
      entryName,
    ].join('\n'),
    'utf8',
  );
}

// ── HKDF-SHA256 (RFC 5869) ────────────────────────────────────────

/**
 * HKDF-SHA256 extract-then-expand.
 * @param {Buffer|string} ikm — input keying material (license key)
 * @param {Buffer} [salt] — optional salt (defaults to 32 zero bytes)
 * @param {Buffer|string} [info] — context info
 * @param {number} [length] — output length (default 32)
 */
function hkdfSha256(ikm, salt = null, info = '', length = 32) {
  const ikmBuf = toBuffer(ikm, 'ikm');
  // Extract
  const saltBuf = salt || Buffer.alloc(32, 0);
  const prk = crypto.createHmac('sha256', saltBuf).update(ikmBuf).digest();
  // Expand (single-block expansion for length ≤ 32)
  const t = crypto.createHmac('sha256', prk)
    .update(Buffer.concat([
      toBuffer(info, 'info'),
      // Counter byte 0x01
      Buffer.from([1]),
    ]))
    .digest();
  return t.subarray(0, length);
}

// ── AES-256-KW (RFC 3394) ─────────────────────────────────────────

const AES_BLOCK = 16;
const KW_IV = Buffer.from('a6a6a6a6a6a6a6a6', 'hex'); // RFC 3394 default IV

function aesWrap(key, plaintext) {
  // key = 32 bytes, plaintext = 32 bytes (single CEK)
  if (key.length !== 32) throw new Error('AES-256-KW requires 32-byte key');
  if (plaintext.length !== 32) throw new Error('AES-256-KW requires 32-byte plaintext');

  const n = plaintext.length / 8; // = 4 for 256-bit CEK
  const r = new Array(n + 1);
  r[0] = KW_IV;
  for (let i = 0; i < n; i++) r[i + 1] = plaintext.subarray(i * 8, (i + 1) * 8);

  for (let j = 0; j <= 5; j++) {
    for (let i = 1; i <= n; i++) {
      const input = Buffer.concat([r[0], r[i]]); // 16 bytes
      const cipher = crypto.createCipheriv('aes-256-ecb', key, null);
      cipher.setAutoPadding(false);
      const b = Buffer.concat([cipher.update(input), cipher.final()]);
      r[0] = b.subarray(0, 8);
      // XOR t = (n * j) + i as big-endian 64-bit
      const t = BigInt(n) * BigInt(j) + BigInt(i);
      const tBuf = Buffer.alloc(8);
      tBuf.writeBigUInt64BE(t);
      for (let k = 0; k < 8; k++) r[0][k] ^= tBuf[k];
      r[i] = b.subarray(8, 16);
    }
  }

  const result = Buffer.alloc((n + 1) * 8);
  for (let i = 0; i <= n; i++) r[i].copy(result, i * 8);
  return result; // 40 bytes
}

function aesUnwrap(key, ciphertext) {
  if (key.length !== 32) throw new Error('AES-256-KW requires 32-byte key');
  if (ciphertext.length !== 40) throw new Error('AES-256-KW ciphertext must be 40 bytes');

  const n = (ciphertext.length / 8) - 1; // = 4
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
  return result; // 32 bytes
}

// ── RFC-0008 compliant encryption ─────────────────────────────────

/**
 * Derive a key-wrapping key (KWK) from a license key via HKDF-SHA256.
 */
function deriveWrappingKey(licenseKey, info = 'kdna-licensed-entry-v1-kwk') {
  return hkdfSha256(licenseKey, null, info, 32);
}

/**
 * Generate a random content encryption key (CEK).
 */
function generateCEK() {
  return crypto.randomBytes(32);
}

/**
 * Wrap a CEK with a key-wrapping key.
 */
function wrapCEK(cek, wrappingKey) {
  return aesWrap(wrappingKey, cek);
}

/**
 * Unwrap a CEK from its wrapped form.
 */
function unwrapCEK(wrappedCek, wrappingKey) {
  return aesUnwrap(wrappingKey, wrappedCek);
}

/**
 * Encrypt a licensed entry using the RFC-0008 compliant model.
 *
 * 1. Generate random CEK
 * 2. Derive KWK from license key + machine fingerprint via HKDF
 * 3. Encrypt content with CEK (AES-256-GCM)
 * 4. Wrap CEK with KWK (AES-256-KW)
 * 5. Store wrapped_key in envelope
 */
function encryptLicensedEntryV1(plaintext, options = {}) {
  const { entryName, manifest = {}, licenseKey } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!licenseKey) throw new Error('licenseKey is required for RFC-0008 encryption');

  const cek = generateCEK();
  const wrappingKey = deriveWrappingKey(licenseKey);
  const wrappedKey = wrapCEK(cek, wrappingKey);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', cek, iv);
  cipher.setAAD(encryptedEntryAad(entryName, manifest));
  const ciphertext = Buffer.concat([cipher.update(toBuffer(plaintext, 'plaintext')), cipher.final()]);

  return {
    profile: LICENSED_ENTRY_PROFILE,
    alg: ALG,
    kdf: RFC_KDF,
    key_wrapping: RFC_KEY_WRAPPING,
    wrapped_key: wrappedKey.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/**
 * Decrypt a licensed entry encoded with the RFC-0008 compliant profile.
 *
 * 1. Derive KWK from license key via HKDF
 * 2. Unwrap CEK from wrapped_key (AES-256-KW)
 * 3. Decrypt content with CEK (AES-256-GCM)
 */
function decryptLicensedEntryV1(envelopeValue, options = {}) {
  const { entryName, manifest = {}, licenseKey } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!licenseKey) throw new Error('licenseKey is required for RFC-0008 decryption');

  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile !== LICENSED_ENTRY_PROFILE) {
    throw new Error(`unsupported encrypted entry profile: ${envelope.profile || 'unknown'} (expected ${LICENSED_ENTRY_PROFILE})`);
  }
  if (envelope.alg !== ALG) throw new Error(`unsupported encrypted entry alg: ${envelope.alg}`);
  if (envelope.kdf !== RFC_KDF) throw new Error(`unsupported encrypted entry kdf: ${envelope.kdf}`);
  if (envelope.key_wrapping !== RFC_KEY_WRAPPING) throw new Error(`unsupported encrypted entry key_wrapping: ${envelope.key_wrapping}`);

  const wrappingKey = deriveWrappingKey(licenseKey);
  const cek = unwrapCEK(decodeBase64(envelope.wrapped_key, 'wrapped_key'), wrappingKey);

  const decipher = crypto.createDecipheriv('aes-256-gcm', cek, decodeBase64(envelope.iv, 'iv'));
  decipher.setAAD(encryptedEntryAad(entryName, manifest));
  decipher.setAuthTag(decodeBase64(envelope.tag, 'tag'));
  return Buffer.concat([
    decipher.update(decodeBase64(envelope.ciphertext, 'ciphertext')),
    decipher.final(),
  ]);
}

// ── RFC-0009: Password-protected encryption ───────────────────────

function ensureArgon2id() {
  if (!argon2id) {
    throw new Error(
      'password-protected assets require @noble/hashes. Install: npm install @noble/hashes',
    );
  }
}

function derivePasswordKey(password, params = {}) {
  ensureArgon2id();
  const {
    salt,
    memory_kib = 65536,
    iterations = 3,
    parallelism = 4,
  } = params;
  if (!salt) throw new Error('salt is required for Argon2id');
  const saltBuf = decodeBase64(salt, 'salt');
  const passwordBuf = toBuffer(password, 'password');
  const key = argon2id(passwordBuf, saltBuf, {
    t: iterations,
    m: memory_kib,
    p: parallelism,
    dkLen: 32,
  });
  return Buffer.from(key);
}

function generateRecoveryCode() {
  const raw = crypto.randomBytes(32); // 256 bits
  const hex = raw.toString('hex').toUpperCase();
  const groups = hex.match(/.{4}/g);
  return `kdna-recover-${groups.join('-')}`;
}

function decodeRecoveryCode(code) {
  if (typeof code !== 'string' || !code.startsWith('kdna-recover-')) {
    throw new Error('recovery code must start with "kdna-recover-"');
  }
  const hex = code.slice('kdna-recover-'.length).replace(/-/g, '');
  if (!/^[0-9A-Fa-f]{64}$/.test(hex)) {
    throw new Error('recovery code format is invalid');
  }
  return Buffer.from(hex, 'hex');
}

function encryptProtectedEntry(plaintext, options = {}) {
  const { entryName, manifest = {}, password, includeRecovery = true, recoveryCode } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!password) throw new Error('password is required for protected encryption');

  const cek = generateCEK();

  // Password slot
  const salt = crypto.randomBytes(16);
  const passwordKdf = {
    name: PASSWORD_KDF,
    salt: salt.toString('base64'),
    memory_kib: 65536,
    iterations: 3,
    parallelism: 4,
  };
  const passwordKey = derivePasswordKey(password, passwordKdf);
  const passwordWrappedKey = wrapCEK(cek, passwordKey);

  const keySlots = [
    {
      slot: 'password',
      wrap: RFC_KEY_WRAPPING,
      wrapped_key: passwordWrappedKey.toString('base64'),
    },
  ];

  // Recovery slot
  if (includeRecovery) {
    const recoveryKey = recoveryCode ? decodeRecoveryCode(recoveryCode) : crypto.randomBytes(32);
    const recoveryWrappedKey = wrapCEK(cek, recoveryKey);
    keySlots.push({
      slot: 'recovery',
      wrap: RFC_KEY_WRAPPING,
      wrapped_key: recoveryWrappedKey.toString('base64'),
    });
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', cek, iv);
  cipher.setAAD(encryptedEntryAad(entryName, manifest, PASSWORD_PROTECTED_PROFILE));
  const ciphertext = Buffer.concat([cipher.update(toBuffer(plaintext, 'plaintext')), cipher.final()]);

  return {
    profile: PASSWORD_PROTECTED_PROFILE,
    alg: ALG,
    kdf: PASSWORD_KDF,
    key_wrapping: RFC_KEY_WRAPPING,
    password_kdf: passwordKdf,
    key_slots: keySlots,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptProtectedEntry(envelopeValue, options = {}) {
  const { entryName, manifest = {}, password, recoveryCode } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!password && !recoveryCode) {
    throw new Error('password or recoveryCode is required for protected decryption');
  }

  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile !== PASSWORD_PROTECTED_PROFILE) {
    throw new Error(
      `unsupported encrypted entry profile: ${envelope.profile || 'unknown'} (expected ${PASSWORD_PROTECTED_PROFILE})`,
    );
  }
  if (envelope.alg !== ALG) throw new Error(`unsupported encrypted entry alg: ${envelope.alg}`);
  if (envelope.kdf !== PASSWORD_KDF) throw new Error(`unsupported encrypted entry kdf: ${envelope.kdf}`);
  if (envelope.key_wrapping !== RFC_KEY_WRAPPING) {
    throw new Error(`unsupported encrypted entry key_wrapping: ${envelope.key_wrapping}`);
  }

  let cek;
  if (password) {
    const passwordKey = derivePasswordKey(password, envelope.password_kdf);
    const passwordSlot = envelope.key_slots.find((s) => s.slot === 'password');
    if (!passwordSlot) throw new Error('password slot missing from envelope');
    cek = unwrapCEK(decodeBase64(passwordSlot.wrapped_key, 'wrapped_key'), passwordKey);
  } else {
    const recoveryKey = decodeRecoveryCode(recoveryCode);
    const recoverySlot = envelope.key_slots.find((s) => s.slot === 'recovery');
    if (!recoverySlot) throw new Error('recovery slot missing from envelope');
    cek = unwrapCEK(decodeBase64(recoverySlot.wrapped_key, 'wrapped_key'), recoveryKey);
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', cek, decodeBase64(envelope.iv, 'iv'));
  decipher.setAAD(encryptedEntryAad(entryName, manifest, PASSWORD_PROTECTED_PROFILE));
  decipher.setAuthTag(decodeBase64(envelope.tag, 'tag'));
  return Buffer.concat([
    decipher.update(decodeBase64(envelope.ciphertext, 'ciphertext')),
    decipher.final(),
  ]);
}

function createPasswordDecryptEntry(options = {}) {
  const { password } = options;
  return ({ entryName, ciphertext, manifest }) =>
    decryptProtectedEntry(ciphertext, { entryName, manifest, password });
}

function createRecoveryDecryptEntry(options = {}) {
  const { recoveryCode } = options;
  return ({ entryName, ciphertext, manifest }) =>
    decryptProtectedEntry(ciphertext, { entryName, manifest, recoveryCode });
}

// ── B2: scrypt-based password profile (v0.1 write profile) ─────────
// Uses Node built-in crypto.scryptSync — zero additional dependencies.
// v0.2 will promote the Argon2id profile (above) as the default write
// profile; this scrypt profile will remain a read-only legacy profile.

const PASSWORD_PROTECTED_SCRYPT_PROFILE = 'kdna-password-protected-v1-scrypt';
const SCRYPT_KDF = 'scrypt-sha256';

function derivePasswordKeyScrypt(password, params = {}) {
  const { salt, N = 32768, r = 8, p = 1 } = params;
  if (!salt) throw new Error('salt is required for scrypt KDF');
  const saltBuf = decodeBase64(salt, 'salt');
  const passwordBuf = toBuffer(password, 'password');
  // N=32768, r=8, p=1 → 32 MiB memory. Default maxmem is 32 MiB exactly;
  // bump to 64 MiB to avoid boundary rejection on some Node versions.
  return crypto.scryptSync(passwordBuf, saltBuf, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
}

/**
 * Encrypt a protected entry using the scrypt-based password profile.
 *
 * 1. Generate random CEK (32 bytes)
 * 2. Derive KEK from password via scrypt-sha256
 * 3. Encrypt content with CEK (AES-256-GCM)
 * 4. Wrap CEK with KEK (AES-256-KW)
 * 5. Store wrapped_key in envelope (single password slot, no recovery)
 */
function encryptProtectedEntryScrypt(plaintext, options = {}) {
  const { entryName, manifest = {}, password } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!password) throw new Error('password is required for scrypt encryption');

  const cek = generateCEK();

  // Password slot
  const salt = crypto.randomBytes(16);
  const passwordKey = derivePasswordKeyScrypt(password, { salt: salt.toString('base64') });
  const passwordWrappedKey = wrapCEK(cek, passwordKey);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', cek, iv);
  cipher.setAAD(encryptedEntryAad(entryName, manifest, PASSWORD_PROTECTED_SCRYPT_PROFILE));
  const ciphertext = Buffer.concat([cipher.update(toBuffer(plaintext, 'plaintext')), cipher.final()]);

  return {
    profile: PASSWORD_PROTECTED_SCRYPT_PROFILE,
    alg: ALG,
    kdf: SCRYPT_KDF,
    key_wrapping: RFC_KEY_WRAPPING,
    scrypt_params: {
      N: 32768,
      r: 8,
      p: 1,
      salt: salt.toString('base64'),
    },
    key_slots: [
      {
        slot: 'password',
        wrap: RFC_KEY_WRAPPING,
        wrapped_key: passwordWrappedKey.toString('base64'),
      },
    ],
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/**
 * Decrypt a protected entry encoded with the scrypt-based password profile.
 *
 * 1. Derive KEK from password via scrypt-sha256
 * 2. Unwrap CEK from password slot's wrapped_key (AES-256-KW)
 * 3. Decrypt content with CEK (AES-256-GCM)
 */
function decryptProtectedEntryScrypt(envelopeValue, options = {}) {
  const { entryName, manifest = {}, password } = options;
  if (!entryName) throw new Error('entryName is required');
  if (!password) throw new Error('password is required for scrypt decryption');

  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile !== PASSWORD_PROTECTED_SCRYPT_PROFILE) {
    throw new Error(
      `unsupported encrypted entry profile: ${envelope.profile || 'unknown'} (expected ${PASSWORD_PROTECTED_SCRYPT_PROFILE})`,
    );
  }
  if (envelope.alg !== ALG) throw new Error(`unsupported encrypted entry alg: ${envelope.alg}`);
  if (envelope.kdf !== SCRYPT_KDF) throw new Error(`unsupported encrypted entry kdf: ${envelope.kdf}`);
  if (envelope.key_wrapping !== RFC_KEY_WRAPPING) {
    throw new Error(`unsupported encrypted entry key_wrapping: ${envelope.key_wrapping}`);
  }

  const passwordKey = derivePasswordKeyScrypt(password, {
    salt: envelope.scrypt_params.salt,
  });
  const passwordSlot = envelope.key_slots.find((s) => s.slot === 'password');
  if (!passwordSlot) throw new Error('password slot missing from envelope');

  const cek = unwrapCEK(decodeBase64(passwordSlot.wrapped_key, 'wrapped_key'), passwordKey);

  const decipher = crypto.createDecipheriv('aes-256-gcm', cek, decodeBase64(envelope.iv, 'iv'));
  decipher.setAAD(encryptedEntryAad(entryName, manifest, PASSWORD_PROTECTED_SCRYPT_PROFILE));
  decipher.setAuthTag(decodeBase64(envelope.tag, 'tag'));
  return Buffer.concat([
    decipher.update(decodeBase64(envelope.ciphertext, 'ciphertext')),
    decipher.final(),
  ]);
}

function createPasswordDecryptEntryScrypt(options = {}) {
  const { password } = options;
  return ({ entryName, ciphertext, manifest }) =>
    decryptProtectedEntryScrypt(ciphertext, { entryName, manifest, password });
}

// ── Legacy / experimental profile (pre-RFC, backward compat) ───────

function deriveLicensedEntryKeyLegacy(options = {}) {
  const { licenseKey, machineFingerprint, salt, keyLength = 32 } = options;
  if (!licenseKey) throw new Error('licenseKey is required');
  if (!machineFingerprint) throw new Error('machineFingerprint is required');
  const saltBuffer = Buffer.isBuffer(salt) || salt instanceof Uint8Array
    ? Buffer.from(salt)
    : decodeBase64(salt, 'salt');
  const secret = `${licenseKey}|${machineFingerprint}`;
  return crypto.scryptSync(secret, saltBuffer, keyLength);
}

function encryptLicensedEntryLegacy(plaintext, options = {}) {
  const { entryName, manifest = {}, licenseKey, machineFingerprint } = options;
  if (!entryName) throw new Error('entryName is required');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveLicensedEntryKeyLegacy({ licenseKey, machineFingerprint, salt });
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(encryptedEntryAad(entryName, manifest, LICENSED_EXPERIMENTAL_PROFILE));
  const ciphertext = Buffer.concat([cipher.update(toBuffer(plaintext, 'plaintext')), cipher.final()]);
  return {
    profile: LICENSED_EXPERIMENTAL_PROFILE,
    alg: ALG,
    kdf: LEGACY_KDF,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptLicensedEntryLegacy(envelopeValue, options = {}) {
  const { entryName, manifest = {}, licenseKey, machineFingerprint } = options;
  if (!entryName) throw new Error('entryName is required');
  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile !== LICENSED_EXPERIMENTAL_PROFILE) {
    throw new Error(`unsupported encrypted entry profile: ${envelope.profile || 'unknown'}`);
  }
  if (envelope.alg !== ALG) throw new Error(`unsupported encrypted entry alg: ${envelope.alg}`);
  if (envelope.kdf !== LEGACY_KDF) throw new Error(`unsupported encrypted entry kdf: ${envelope.kdf}`);
  const key = deriveLicensedEntryKeyLegacy({
    licenseKey,
    machineFingerprint,
    salt: envelope.salt,
  });
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, decodeBase64(envelope.iv, 'iv'));
  decipher.setAAD(encryptedEntryAad(entryName, manifest, LICENSED_EXPERIMENTAL_PROFILE));
  decipher.setAuthTag(decodeBase64(envelope.tag, 'tag'));
  return Buffer.concat([
    decipher.update(decodeBase64(envelope.ciphertext, 'ciphertext')),
    decipher.final(),
  ]);
}

// ── Unified entry points (auto-detect profile) ────────────────────

function encryptLicensedEntry(plaintext, options = {}) {
  return encryptLicensedEntryV1(plaintext, options);
}

function decryptLicensedEntry(envelopeValue, options = {}) {
  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile === LICENSED_ENTRY_PROFILE) {
    return decryptLicensedEntryV1(envelopeValue, options);
  }
  if (envelope.profile === LICENSED_EXPERIMENTAL_PROFILE) {
    return decryptLicensedEntryLegacy(envelopeValue, options);
  }
  throw new Error(`unsupported encrypted entry profile: ${envelope.profile || 'unknown'}`);
}

function createLicensedDecryptEntry(options = {}) {
  const { licenseKey, machineFingerprint } = options;
  return ({ entryName, ciphertext, manifest }) =>
    decryptLicensedEntry(ciphertext, { entryName, manifest, licenseKey, machineFingerprint });
}

module.exports = {
  // Profiles
  LICENSED_ENTRY_PROFILE,
  LICENSED_EXPERIMENTAL_PROFILE,
  PASSWORD_PROTECTED_PROFILE,
  PASSWORD_PROTECTED_SCRYPT_PROFILE,
  ALG,
  RFC_KDF,
  RFC_KEY_WRAPPING,
  LEGACY_KDF,
  PASSWORD_KDF,
  SCRYPT_KDF,

  // RFC-0008 compliant
  deriveWrappingKey,
  generateCEK,
  wrapCEK,
  unwrapCEK,
  encryptLicensedEntryV1,
  decryptLicensedEntryV1,

  // RFC-0009 compliant (Argon2id)
  derivePasswordKey,
  generateRecoveryCode,
  decodeRecoveryCode,
  encryptProtectedEntry,
  decryptProtectedEntry,
  createPasswordDecryptEntry,
  createRecoveryDecryptEntry,

  // B2 scrypt password profile (v0.1 write profile)
  derivePasswordKeyScrypt,
  encryptProtectedEntryScrypt,
  decryptProtectedEntryScrypt,
  createPasswordDecryptEntryScrypt,

  // Legacy
  deriveLicensedEntryKey: deriveLicensedEntryKeyLegacy,
  encryptLicensedEntryLegacy,
  decryptLicensedEntryLegacy,

  // Unified
  encryptLicensedEntry,
  decryptLicensedEntry,
  createLicensedDecryptEntry,

  // Low-level
  hkdfSha256,
  aesWrap,
  aesUnwrap,
};
