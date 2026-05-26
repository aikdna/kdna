const crypto = require('crypto');

const LICENSED_ENTRY_PROFILE = 'kdna-licensed-entry-v1';
const KDF = 'scrypt-sha256';
const ALG = 'AES-256-GCM';

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

function deriveLicensedEntryKey(options = {}) {
  const { licenseKey, machineFingerprint, salt, keyLength = 32 } = options;
  if (!licenseKey) throw new Error('licenseKey is required');
  if (!machineFingerprint) throw new Error('machineFingerprint is required');
  const saltBuffer = Buffer.isBuffer(salt) || salt instanceof Uint8Array
    ? Buffer.from(salt)
    : decodeBase64(salt, 'salt');
  const secret = `${licenseKey}|${machineFingerprint}`;
  return crypto.scryptSync(secret, saltBuffer, keyLength);
}

function encryptedEntryAad(entryName, manifest = {}) {
  return Buffer.from(
    [
      LICENSED_ENTRY_PROFILE,
      manifest.name || manifest.asset_id || '',
      manifest.version || '',
      entryName,
    ].join('\n'),
    'utf8',
  );
}

function encryptLicensedEntry(plaintext, options = {}) {
  const { entryName, manifest = {}, licenseKey, machineFingerprint } = options;
  if (!entryName) throw new Error('entryName is required');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveLicensedEntryKey({ licenseKey, machineFingerprint, salt });
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(encryptedEntryAad(entryName, manifest));
  const ciphertext = Buffer.concat([cipher.update(toBuffer(plaintext, 'plaintext')), cipher.final()]);
  return {
    profile: LICENSED_ENTRY_PROFILE,
    alg: ALG,
    kdf: KDF,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptLicensedEntry(envelopeValue, options = {}) {
  const { entryName, manifest = {}, licenseKey, machineFingerprint } = options;
  if (!entryName) throw new Error('entryName is required');
  const envelope = normalizeEnvelope(envelopeValue);
  if (envelope.profile !== LICENSED_ENTRY_PROFILE) {
    throw new Error(`unsupported encrypted entry profile: ${envelope.profile || 'unknown'}`);
  }
  if (envelope.alg !== ALG) throw new Error(`unsupported encrypted entry alg: ${envelope.alg}`);
  if (envelope.kdf !== KDF) throw new Error(`unsupported encrypted entry kdf: ${envelope.kdf}`);
  const key = deriveLicensedEntryKey({
    licenseKey,
    machineFingerprint,
    salt: envelope.salt,
  });
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, decodeBase64(envelope.iv, 'iv'));
  decipher.setAAD(encryptedEntryAad(entryName, manifest));
  decipher.setAuthTag(decodeBase64(envelope.tag, 'tag'));
  return Buffer.concat([
    decipher.update(decodeBase64(envelope.ciphertext, 'ciphertext')),
    decipher.final(),
  ]);
}

function createLicensedDecryptEntry(options = {}) {
  const { licenseKey, machineFingerprint } = options;
  return ({ entryName, ciphertext, manifest }) =>
    decryptLicensedEntry(ciphertext, { entryName, manifest, licenseKey, machineFingerprint });
}

module.exports = {
  LICENSED_ENTRY_PROFILE,
  deriveLicensedEntryKey,
  encryptLicensedEntry,
  decryptLicensedEntry,
  createLicensedDecryptEntry,
};
