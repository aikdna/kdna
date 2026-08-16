/**
 * KDNA asset signatures — RFC-0021 M1 (`kdsig.ed25519`).
 *
 * A `.kdna` container carries an optional top-level `signature.kdsig` entry:
 * a JSON signature bundle whose Ed25519 signature covers a deterministic
 * signing payload derived from the asset's canonical content digest
 * (docs/CANONICALIZATION.md). Verification is offline and fail-closed: any
 * malformed, unsupported, or unverifiable bundle rejects the asset.
 *
 * A signature proves integrity and provenance only. It never proves
 * expertise, truthfulness, safety, or fitness for purpose.
 */

'use strict';

const crypto = require('crypto');

const KDSIG_PROFILE = 'kdsig.ed25519';
const KDSIG_PROFILE_VERSION = '0.1.0';
const KDSIG_ALGORITHM = 'ed25519';
const SIGNATURE_ENTRY_NAME = 'signature.kdsig';

const RAW_PUBLIC_KEY_HEX_LENGTH = 64;
const RAW_SIGNATURE_HEX_LENGTH = 128;
const SHA256_HEX_LENGTH = 64;

// RFC 8410 DER prefixes for raw Ed25519 key material.
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
const SPKI_ED25519_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

const BUNDLE_FIELDS = Object.freeze([
  'algorithm',
  'content_digest',
  'profile',
  'profile_version',
  'public_key',
  'signature',
]);

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function signatureError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isLowercaseHex(value, length) {
  return typeof value === 'string' && value.length === length && /^[0-9a-f]+$/.test(value);
}

function assertContentDigestShape(value) {
  if (
    typeof value !== 'string'
    || !value.startsWith('sha256:')
    || !isLowercaseHex(value.slice('sha256:'.length), SHA256_HEX_LENGTH)
  ) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `signature bundle content_digest must be "sha256:<64 lowercase hex>", got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Build the exact bytes that Ed25519 signs. The payload is domain-separated by
 * the profile coordinate and binds the asset's canonical content digest, so a
 * signature can never be replayed across profiles, versions, or assets.
 */
function buildSigningPayload(contentDigest) {
  assertContentDigestShape(contentDigest);
  return Buffer.from(`${KDSIG_PROFILE}:${KDSIG_PROFILE_VERSION}:${contentDigest}`, 'utf8');
}

function privateKeyObjectFromSeed(seedHex) {
  if (!isLowercaseHex(seedHex, RAW_PUBLIC_KEY_HEX_LENGTH)) {
    throw signatureError(
      'KDNA_SIGNATURE_KEY_INVALID',
      'Ed25519 private key must be a 32-byte seed encoded as 64 lowercase hex characters',
    );
  }
  const der = Buffer.concat([PKCS8_ED25519_PREFIX, Buffer.from(seedHex, 'hex')]);
  try {
    return crypto.createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  } catch (e) {
    throw signatureError('KDNA_SIGNATURE_KEY_INVALID', `invalid Ed25519 private key: ${e.message}`);
  }
}

function publicKeyObjectFromRaw(publicKeyHex) {
  if (!isLowercaseHex(publicKeyHex, RAW_PUBLIC_KEY_HEX_LENGTH)) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      'signature bundle public_key must be a 32-byte Ed25519 key encoded as 64 lowercase hex characters',
    );
  }
  const der = Buffer.concat([SPKI_ED25519_PREFIX, Buffer.from(publicKeyHex, 'hex')]);
  try {
    return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
  } catch (e) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `signature bundle public_key is not a valid Ed25519 key: ${e.message}`,
    );
  }
}

function rawPublicKeyHexFromObject(keyObject) {
  const spki = keyObject.export({ format: 'der', type: 'spki' });
  return spki.subarray(SPKI_ED25519_PREFIX.length).toString('hex');
}

/**
 * Generate a new Ed25519 signing key pair. The private key is returned as the
 * raw 32-byte seed in lowercase hex; custody is the signer's responsibility.
 */
function generateSigningKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  const pkcs8 = privateKey.export({ format: 'der', type: 'pkcs8' });
  const seedHex = pkcs8.subarray(PKCS8_ED25519_PREFIX.length).toString('hex');
  return {
    algorithm: KDSIG_ALGORITHM,
    private_key: seedHex,
    public_key: rawPublicKeyHexFromObject(publicKey),
  };
}

/**
 * Fingerprint of a raw Ed25519 public key: sha256 over the 32 key bytes.
 */
function keyFingerprint(publicKeyHex) {
  if (!isLowercaseHex(publicKeyHex, RAW_PUBLIC_KEY_HEX_LENGTH)) {
    throw signatureError(
      'KDNA_SIGNATURE_KEY_INVALID',
      'keyFingerprint expects a 32-byte Ed25519 public key encoded as 64 lowercase hex characters',
    );
  }
  return `sha256:${sha256Hex(Buffer.from(publicKeyHex, 'hex'))}`;
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Serialize a signature bundle to its canonical wire bytes (sorted keys, no
 * insignificant whitespace). Verification accepts any JSON encoding of the
 * same fields; canonical bytes are what signers and vectors pin.
 */
function serializeSignatureBundle(bundle) {
  return Buffer.from(`${stableStringify(bundle)}\n`, 'utf8');
}

function parseSignatureBundle(bytes) {
  let text;
  try {
    text = Buffer.isBuffer(bytes) ? bytes.toString('utf8') : String(bytes);
  } catch (e) {
    throw signatureError('KDNA_INTEGRITY_SIGNATURE_FAILED', `signature bundle is not UTF-8: ${e.message}`);
  }
  let bundle;
  try {
    bundle = JSON.parse(text);
  } catch (e) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `signature.kdsig is not valid JSON: ${e.message}`,
    );
  }
  if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
    throw signatureError('KDNA_INTEGRITY_SIGNATURE_FAILED', 'signature bundle must be a JSON object');
  }
  for (const field of BUNDLE_FIELDS) {
    if (typeof bundle[field] !== 'string') {
      throw signatureError(
        'KDNA_INTEGRITY_SIGNATURE_FAILED',
        `signature bundle is missing required string field: ${field}`,
      );
    }
  }
  const extra = Object.keys(bundle).filter((key) => !BUNDLE_FIELDS.includes(key));
  if (extra.length) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `signature bundle carries unsupported fields: ${extra.sort().join(', ')}`,
    );
  }
  if (bundle.profile !== KDSIG_PROFILE) {
    throw signatureError(
      'KDNA_SIGNATURE_PROFILE_UNSUPPORTED',
      `signature bundle profile ${JSON.stringify(bundle.profile)} is not supported (supported: ${KDSIG_PROFILE})`,
    );
  }
  if (bundle.profile_version !== KDSIG_PROFILE_VERSION) {
    throw signatureError(
      'KDNA_SIGNATURE_VERSION_UNSUPPORTED',
      `signature bundle profile_version ${JSON.stringify(bundle.profile_version)} is not supported (supported: ${KDSIG_PROFILE_VERSION})`,
    );
  }
  if (bundle.algorithm !== KDSIG_ALGORITHM) {
    throw signatureError(
      'KDNA_SIGNATURE_PROFILE_UNSUPPORTED',
      `signature bundle algorithm ${JSON.stringify(bundle.algorithm)} is not supported (supported: ${KDSIG_ALGORITHM})`,
    );
  }
  assertContentDigestShape(bundle.content_digest);
  if (!isLowercaseHex(bundle.public_key, RAW_PUBLIC_KEY_HEX_LENGTH)) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      'signature bundle public_key must be 64 lowercase hex characters',
    );
  }
  if (!isLowercaseHex(bundle.signature, RAW_SIGNATURE_HEX_LENGTH)) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      'signature bundle signature must be 128 lowercase hex characters',
    );
  }
  return {
    profile: bundle.profile,
    profile_version: bundle.profile_version,
    algorithm: bundle.algorithm,
    content_digest: bundle.content_digest,
    public_key: bundle.public_key,
    signature: bundle.signature,
  };
}

/**
 * Sign a canonical content digest with an Ed25519 seed (64 lowercase hex).
 * Returns the bundle object; serialize with serializeSignatureBundle().
 */
function signContentDigest(contentDigest, privateKeySeedHex) {
  assertContentDigestShape(contentDigest);
  const privateKey = privateKeyObjectFromSeed(privateKeySeedHex);
  const publicKeyHex = rawPublicKeyHexFromObject(crypto.createPublicKey(privateKey));
  const signatureBytes = crypto.sign(null, buildSigningPayload(contentDigest), privateKey);
  return {
    algorithm: KDSIG_ALGORITHM,
    content_digest: contentDigest,
    profile: KDSIG_PROFILE,
    profile_version: KDSIG_PROFILE_VERSION,
    public_key: publicKeyHex,
    signature: signatureBytes.toString('hex'),
  };
}

/**
 * Verify a parsed bundle against a canonical content digest. Fail-closed:
 * every mismatch throws with a stable error code. Returns verification
 * evidence on success.
 */
function verifySignatureBundle(bundle, contentDigest, options = {}) {
  const parsed = parseSignatureBundle(bundle);
  assertContentDigestShape(contentDigest);
  if (parsed.content_digest !== contentDigest) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `signature bundle content_digest ${parsed.content_digest} does not match the asset content_digest ${contentDigest}`,
    );
  }
  if (
    typeof options.expectedPublicKey === 'string'
    && options.expectedPublicKey.toLowerCase() !== parsed.public_key
  ) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      'signature bundle public_key does not match the expected pinned key',
    );
  }
  const publicKey = publicKeyObjectFromRaw(parsed.public_key);
  const signatureBytes = Buffer.from(parsed.signature, 'hex');
  let valid;
  try {
    valid = crypto.verify(null, buildSigningPayload(contentDigest), publicKey, signatureBytes);
  } catch (e) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      `Ed25519 verification error: ${e.message}`,
    );
  }
  if (valid !== true) {
    throw signatureError(
      'KDNA_INTEGRITY_SIGNATURE_FAILED',
      'Ed25519 signature verification failed: signature does not match the canonical signing payload',
    );
  }
  return {
    state: 'verified',
    profile: parsed.profile,
    profile_version: parsed.profile_version,
    algorithm: parsed.algorithm,
    content_digest: parsed.content_digest,
    public_key: parsed.public_key,
    key_fingerprint: keyFingerprint(parsed.public_key),
  };
}

module.exports = {
  KDSIG_PROFILE,
  KDSIG_PROFILE_VERSION,
  KDSIG_ALGORITHM,
  SIGNATURE_ENTRY_NAME,
  buildSigningPayload,
  generateSigningKeyPair,
  keyFingerprint,
  parseSignatureBundle,
  serializeSignatureBundle,
  signContentDigest,
  verifySignatureBundle,
};
