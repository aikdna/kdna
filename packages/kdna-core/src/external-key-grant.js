/**
 * Account/device external key grants (RFC-0019).
 *
 * This module deliberately has no password or license-key fallback. Asset CEKs
 * are derived from an issuer root only in memory, then re-wrapped to one X25519
 * device key by a signed, short-lived grant.
 */

const crypto = require('node:crypto');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const cbor = require('cbor-x');
const { hkdfSha256, aesWrap, aesUnwrap } = require('./crypto-profile');

const EXTERNAL_ENVELOPE_PROFILE = 'kdna-envelope-external-grant-v1';
const EXTERNAL_GRANT_PROFILE = 'kdna-key-grant-v1';
const EXTERNAL_AAD_PROFILE = 'kdna-external-asset-cek-v1';
const DEVICE_KEK_PROFILE = 'kdna-device-grant-kek-v1';
const ENVELOPE_ALG = 'A256GCM';
const GRANT_WRAP_ALG = 'X25519-HKDF-SHA256+A256KW';

const schemaRoot = path.join(__dirname, '..', 'schema');
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validateEnvelopeSchema = ajv.compile(
  require(path.join(schemaRoot, 'kdna-envelope-external-grant-v1.schema.json')),
);
const validateGrantSchema = ajv.compile(
  require(path.join(schemaRoot, 'kdna-key-grant-v1.schema.json')),
);

const verifiedEntitlements = new WeakSet();

class KDNAExternalGrantError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'KDNAExternalGrantError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new KDNAExternalGrantError(code, message);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest();
}

function digest(value) {
  return `sha256:${sha256(value).toString('hex')}`;
}

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function decodeB64url(value, label, expectedLength) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    fail('KDNA_GRANT_FORMAT_INVALID', `${label} is not canonical base64url`);
  }
  const out = Buffer.from(value, 'base64url');
  if (b64url(out) !== value || (expectedLength != null && out.length !== expectedLength)) {
    fail('KDNA_GRANT_FORMAT_INVALID', `${label} has an invalid length or encoding`);
  }
  return out;
}

function prefixedKey(value, prefix, label, expectedLength = 32) {
  if (typeof value !== 'string' || !value.startsWith(`${prefix}:`)) {
    fail('KDNA_GRANT_FORMAT_INVALID', `${label} must use ${prefix}`);
  }
  return decodeB64url(value.slice(prefix.length + 1), label, expectedLength);
}

function canonicalJson(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'number') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  throw new TypeError(`unsupported canonical JSON value: ${typeof value}`);
}

function grantSigningPayload(grant) {
  const unsigned = { ...grant };
  delete unsigned.signature;
  return Buffer.from(canonicalJson(unsigned), 'utf8');
}

function schemaProblems(validator) {
  return (validator.errors || [])
    .slice(0, 4)
    .map((error) => `${error.instancePath || '<root>'} ${error.message}`)
    .join('; ');
}

function validateExternalEnvelope(envelope) {
  if (!validateEnvelopeSchema(envelope)) {
    fail('KDNA_ENVELOPE_FORMAT_INVALID', `external envelope is invalid: ${schemaProblems(validateEnvelopeSchema)}`);
  }
  return envelope;
}

function validateExternalKeyGrant(grant) {
  if (!validateGrantSchema(grant)) {
    fail('KDNA_GRANT_FORMAT_INVALID', `external key grant is invalid: ${schemaProblems(validateGrantSchema)}`);
  }
  const issued = Date.parse(grant.issued_at);
  const refresh = Date.parse(grant.refresh_after);
  const grace = Date.parse(grant.offline_grace_until);
  const expires = Date.parse(grant.expires_at);
  if (!(issued <= refresh && refresh <= grace && grace <= expires)) {
    fail('KDNA_GRANT_TIME_INVALID', 'grant time window is not monotonic');
  }
  return grant;
}

function externalEnvelopeAad({ manifest, entryName, plaintextDigest, keyRef, issuerKeyId }) {
  const entitlementProfile = manifest?.entitlement?.profile || '';
  const fields = [
    EXTERNAL_ENVELOPE_PROFILE,
    manifest?.asset_uid || '',
    manifest?.asset_id || manifest?.name || '',
    manifest?.version || '',
    entryName,
    plaintextDigest,
    keyRef,
    issuerKeyId,
    manifest?.access || '',
    entitlementProfile,
  ];
  if (fields.some((field) => typeof field !== 'string' || field.length === 0)) {
    fail('KDNA_ENVELOPE_BINDING_INVALID', 'manifest is missing an external envelope binding');
  }
  if (manifest.access !== 'licensed' || !['account', 'org'].includes(entitlementProfile)) {
    fail('KDNA_ENVELOPE_BINDING_INVALID', 'external grants require licensed account or org entitlement');
  }
  return Buffer.from(fields.join('\n'), 'utf8');
}

function normalizeIssuerRoot(value) {
  const root = Buffer.isBuffer(value) ? Buffer.from(value) : decodeB64url(value, 'issuer root', 32);
  if (root.length !== 32) fail('KDNA_ISSUER_ROOT_INVALID', 'issuer root must be 32 bytes');
  return root;
}

function deriveExternalAssetCek({ issuerRootKey, manifest, entryName, plaintextDigest, keyRef, issuerKeyId }) {
  const root = normalizeIssuerRoot(issuerRootKey);
  const aad = externalEnvelopeAad({ manifest, entryName, plaintextDigest, keyRef, issuerKeyId });
  try {
    return hkdfSha256(
      root,
      sha256(aad),
      Buffer.from(`${EXTERNAL_AAD_PROFILE}\n${keyRef}`, 'utf8'),
      32,
    );
  } finally {
    root.fill(0);
  }
}

function encodeExternalEnvelope(envelope) {
  validateExternalEnvelope(envelope);
  return Buffer.from(cbor.encode(envelope));
}

function decodeExternalEnvelope(value) {
  let envelope = value;
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    try {
      envelope = cbor.decode(Buffer.from(value));
    } catch {
      fail('KDNA_ENVELOPE_FORMAT_INVALID', 'external envelope CBOR could not be decoded');
    }
  }
  return validateExternalEnvelope(envelope);
}

function encryptExternalGrantEntry(plaintextValue, options = {}) {
  const plaintext = Buffer.from(plaintextValue);
  const {
    manifest,
    entryName = 'payload.kdnab',
    issuerRootKey,
    keyRef,
    issuerKeyId,
    iv = crypto.randomBytes(12),
  } = options;
  const plaintextDigest = digest(plaintext);
  const aad = externalEnvelopeAad({ manifest, entryName, plaintextDigest, keyRef, issuerKeyId });
  const cek = deriveExternalAssetCek({
    issuerRootKey,
    manifest,
    entryName,
    plaintextDigest,
    keyRef,
    issuerKeyId,
  });
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', cek, Buffer.from(iv));
    cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return {
      profile: EXTERNAL_ENVELOPE_PROFILE,
      alg: ENVELOPE_ALG,
      cek_derivation: 'HKDF-SHA256',
      key_ref: keyRef,
      issuer_key_id: issuerKeyId,
      entry_path: entryName,
      plaintext_digest: plaintextDigest,
      iv: b64url(iv),
      tag: b64url(cipher.getAuthTag()),
      ciphertext: b64url(ciphertext),
    };
  } finally {
    cek.fill(0);
  }
}

function publicKeyFromRaw(crv, value) {
  const x = value.includes(':') ? value.split(':', 2)[1] : value;
  return crypto.createPublicKey({ key: { kty: 'OKP', crv, x }, format: 'jwk' });
}

function privateKeyFromBundle(crv, bundle) {
  if (bundle && typeof bundle === 'object' && bundle.type === 'private') return bundle;
  if (bundle && bundle.privateKey) return bundle.privateKey;
  const privateValue = bundle?.private_key || bundle?.privateKeyRaw || bundle?.d;
  const publicValue = bundle?.public_key || bundle?.publicKeyRaw || bundle?.x;
  if (!privateValue || !publicValue) {
    fail('KDNA_GRANT_DEVICE_KEY_INVALID', `${crv} private and public key material are required`);
  }
  const d = privateValue.includes(':') ? privateValue.split(':', 2)[1] : privateValue;
  const x = publicValue.includes(':') ? publicValue.split(':', 2)[1] : publicValue;
  decodeB64url(d, `${crv} private key`, 32);
  decodeB64url(x, `${crv} public key`, 32);
  return crypto.createPrivateKey({ key: { kty: 'OKP', crv, d, x }, format: 'jwk' });
}

function generateDeviceKeyPairs() {
  const agreement = crypto.generateKeyPairSync('x25519');
  const signing = crypto.generateKeyPairSync('ed25519');
  const agreementPublic = agreement.publicKey.export({ format: 'jwk' });
  const agreementPrivate = agreement.privateKey.export({ format: 'jwk' });
  const signingPublic = signing.publicKey.export({ format: 'jwk' });
  const signingPrivate = signing.privateKey.export({ format: 'jwk' });
  return {
    agreement: {
      public_key: `x25519:${agreementPublic.x}`,
      private_key: `x25519:${agreementPrivate.d}`,
    },
    signing: {
      public_key: `ed25519:${signingPublic.x}`,
      private_key: `ed25519:${signingPrivate.d}`,
    },
  };
}

function resolveIssuerPublicKey(issuerPublicKeys, keyId) {
  const value = issuerPublicKeys instanceof Map ? issuerPublicKeys.get(keyId) : issuerPublicKeys?.[keyId];
  if (!value) fail('KDNA_GRANT_ISSUER_UNKNOWN', 'grant signing key is not pinned');
  if (value && typeof value === 'object' && value.type === 'public') return value;
  if (typeof value === 'string' && value.startsWith('ed25519:')) {
    try {
      const raw = prefixedKey(value, 'ed25519', 'grant issuer public key');
      return publicKeyFromRaw('Ed25519', `ed25519:${b64url(raw)}`);
    } catch {
      fail('KDNA_GRANT_ISSUER_UNKNOWN', 'grant signing key is invalid');
    }
  }
  try {
    return crypto.createPublicKey(value);
  } catch {
    fail('KDNA_GRANT_ISSUER_UNKNOWN', 'grant signing key is invalid');
  }
}

function createExternalKeyGrant(options = {}) {
  const {
    issuerRootKey,
    issuerSigningPrivateKey,
    signingKeyId,
    issuer,
    entitlementId,
    accountId,
    deviceId,
    devicePublicKey,
    deviceSigningPublicKey,
    manifest,
    envelope: envelopeValue,
    assetDigest,
    status = 'active',
    statusVersion = 1,
    issuedAt = new Date(),
    refreshAfter = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000),
    offlineGraceUntil = new Date(issuedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    expiresAt = new Date(issuedAt.getTime() + 8 * 24 * 60 * 60 * 1000),
    grantId = `grt_${crypto.randomBytes(16).toString('base64url')}`,
    ephemeralKeyPair = null,
    wrapSalt = null,
  } = options;
  const envelope = decodeExternalEnvelope(envelopeValue);
  const deviceRaw = prefixedKey(devicePublicKey, 'x25519', 'device public key');
  prefixedKey(deviceSigningPublicKey, 'ed25519', 'device signing public key');
  const cek = deriveExternalAssetCek({
    issuerRootKey,
    manifest,
    entryName: envelope.entry_path,
    plaintextDigest: envelope.plaintext_digest,
    keyRef: envelope.key_ref,
    issuerKeyId: envelope.issuer_key_id,
  });
  let shared = null;
  let kek = null;
  try {
    const ephemeral = ephemeralKeyPair || crypto.generateKeyPairSync('x25519');
    const ephemeralJwk = ephemeral.publicKey.export({ format: 'jwk' });
    const deviceKey = publicKeyFromRaw('X25519', `x25519:${b64url(deviceRaw)}`);
    shared = crypto.diffieHellman({ privateKey: ephemeral.privateKey, publicKey: deviceKey });
    const salt = wrapSalt ? Buffer.from(wrapSalt) : crypto.randomBytes(16);
    if (salt.length !== 16) fail('KDNA_GRANT_FORMAT_INVALID', 'grant wrap salt must be 16 bytes');
    kek = hkdfSha256(shared, salt, Buffer.from(`${DEVICE_KEK_PROFILE}\n${grantId}`, 'utf8'), 32);
    const grant = {
      profile: EXTERNAL_GRANT_PROFILE,
      grant_id: grantId,
      issuer,
      signing_key_id: signingKeyId,
      entitlement_id: entitlementId,
      account_id: accountId,
      device_id: deviceId,
      device_public_key: devicePublicKey,
      device_signing_public_key: deviceSigningPublicKey,
      asset: {
        asset_id: manifest.asset_id || manifest.name,
        asset_uid: manifest.asset_uid,
        version: manifest.version,
        digest: assetDigest,
        entry_path: envelope.entry_path,
        ciphertext_digest: digest(Buffer.from(envelope.ciphertext, 'base64url')),
        key_ref: envelope.key_ref,
        issuer_key_id: envelope.issuer_key_id,
      },
      issued_at: new Date(issuedAt).toISOString(),
      refresh_after: new Date(refreshAfter).toISOString(),
      offline_grace_until: new Date(offlineGraceUntil).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
      status,
      status_version: statusVersion,
      wrap: {
        alg: GRANT_WRAP_ALG,
        ephemeral_public_key: `x25519:${ephemeralJwk.x}`,
        salt: b64url(salt),
        wrapped_cek: b64url(aesWrap(kek, cek)),
      },
    };
    validateExternalKeyGrant({ ...grant, signature: `ed25519:${'A'.repeat(86)}` });
    const signature = crypto.sign(null, grantSigningPayload(grant), issuerSigningPrivateKey);
    return { ...grant, signature: `ed25519:${b64url(signature)}` };
  } finally {
    cek.fill(0);
    if (shared) shared.fill(0);
    if (kek) kek.fill(0);
  }
}

function grantState(grant, now, networkAvailable, allowOffline) {
  const time = now instanceof Date ? now.getTime() : new Date(now || Date.now()).getTime();
  const issued = Date.parse(grant.issued_at);
  const refresh = Date.parse(grant.refresh_after);
  const grace = Date.parse(grant.offline_grace_until);
  const expires = Date.parse(grant.expires_at);
  if (
    ![time, issued, refresh, grace, expires].every(Number.isFinite) ||
    issued > refresh || refresh > grace || grace > expires
  ) fail('KDNA_GRANT_TIME_INVALID', 'external key grant time window is invalid');
  if (time + 5 * 60 * 1000 < issued) fail('KDNA_GRANT_TIME_INVALID', 'external key grant is not valid yet');
  if (grant.status === 'revoked') fail('KDNA_GRANT_REVOKED', 'external key grant is revoked');
  if (grant.status !== 'active') fail('KDNA_GRANT_EXPIRED', 'external key grant is not active');
  if (time > expires) fail('KDNA_GRANT_EXPIRED', 'external key grant has expired');
  if (time <= refresh) return 'active';
  if (networkAvailable) fail('KDNA_GRANT_SYNC_REQUIRED', 'external key grant must be synchronized');
  if (!allowOffline || time > grace) {
    fail('KDNA_GRANT_EXPIRED', 'external key grant offline grace has expired');
  }
  return 'offline_grace';
}

function expectEqual(actual, expected, code, label) {
  if (expected == null || actual !== expected) fail(code, `${label} mismatch`);
}

function authorizeExternalKeyGrant(options = {}) {
  const {
    grant,
    issuerPublicKeys,
    manifest,
    checksums,
    envelope: envelopeValue,
    deviceAgreementKey,
    expectedAccountId,
    expectedDeviceId,
    expectedDeviceSigningPublicKey,
    minimumStatusVersion = null,
    now = new Date(),
    networkAvailable = false,
    allowOffline = true,
  } = options;
  validateExternalKeyGrant(grant);
  if (minimumStatusVersion != null && (
    !Number.isInteger(minimumStatusVersion) || grant.status_version < minimumStatusVersion
  )) fail('KDNA_GRANT_ROLLBACK_DETECTED', 'external key grant status version rolled back');
  const issuerKey = resolveIssuerPublicKey(issuerPublicKeys, grant.signing_key_id);
  const signature = prefixedKey(grant.signature, 'ed25519', 'grant signature', 64);
  if (signature.length !== 64 || !crypto.verify(null, grantSigningPayload(grant), issuerKey, signature)) {
    fail('KDNA_GRANT_SIGNATURE_INVALID', 'external key grant signature is invalid');
  }
  const state = grantState(grant, now, networkAvailable, allowOffline);
  const envelope = decodeExternalEnvelope(envelopeValue);

  expectEqual(grant.account_id, expectedAccountId, 'KDNA_GRANT_ACCOUNT_MISMATCH', 'grant account');
  expectEqual(grant.device_id, expectedDeviceId, 'KDNA_GRANT_DEVICE_MISMATCH', 'grant device');
  expectEqual(
    grant.device_signing_public_key,
    expectedDeviceSigningPublicKey,
    'KDNA_GRANT_DEVICE_MISMATCH',
    'device signing key',
  );
  expectEqual(grant.asset.asset_id, manifest.asset_id || manifest.name, 'KDNA_GRANT_ASSET_MISMATCH', 'asset ID');
  expectEqual(grant.asset.asset_uid, manifest.asset_uid, 'KDNA_GRANT_ASSET_MISMATCH', 'asset UID');
  expectEqual(grant.asset.version, manifest.version, 'KDNA_GRANT_ASSET_MISMATCH', 'asset version');
  expectEqual(grant.asset.digest, checksums?.asset_digest, 'KDNA_GRANT_DIGEST_MISMATCH', 'asset digest');
  expectEqual(grant.asset.entry_path, envelope.entry_path, 'KDNA_GRANT_ASSET_MISMATCH', 'entry path');
  expectEqual(grant.asset.key_ref, envelope.key_ref, 'KDNA_GRANT_ASSET_MISMATCH', 'key reference');
  expectEqual(grant.asset.issuer_key_id, envelope.issuer_key_id, 'KDNA_GRANT_ASSET_MISMATCH', 'issuer asset key');
  expectEqual(
    grant.asset.ciphertext_digest,
    digest(Buffer.from(envelope.ciphertext, 'base64url')),
    'KDNA_GRANT_DIGEST_MISMATCH',
    'ciphertext digest',
  );

  const privateKey = privateKeyFromBundle('X25519', deviceAgreementKey);
  const localPublic = deviceAgreementKey.public_key || deviceAgreementKey.publicKeyRaw || deviceAgreementKey.x;
  expectEqual(grant.device_public_key, localPublic, 'KDNA_GRANT_DEVICE_MISMATCH', 'device agreement key');
  const ephemeralRaw = prefixedKey(grant.wrap.ephemeral_public_key, 'x25519', 'ephemeral public key');
  const ephemeralKey = publicKeyFromRaw('X25519', `x25519:${b64url(ephemeralRaw)}`);
  const shared = crypto.diffieHellman({ privateKey, publicKey: ephemeralKey });
  const salt = decodeB64url(grant.wrap.salt, 'grant wrap salt', 16);
  const kek = hkdfSha256(shared, salt, Buffer.from(`${DEVICE_KEK_PROFILE}\n${grant.grant_id}`, 'utf8'), 32);
  let cek;
  try {
    cek = aesUnwrap(kek, decodeB64url(grant.wrap.wrapped_cek, 'wrapped CEK', 40));
  } catch {
    fail('KDNA_GRANT_DEVICE_MISMATCH', 'device could not unwrap the external key grant');
  } finally {
    shared.fill(0);
    kek.fill(0);
  }

  const entitlement = {
    status: state,
    profile: EXTERNAL_GRANT_PROFILE,
    grant_id: grant.grant_id,
    entitlement_id: grant.entitlement_id,
    account_id: grant.account_id,
    device_id: grant.device_id,
    refresh_after: grant.refresh_after,
    offline_grace_until: grant.offline_grace_until,
    expires_at: grant.expires_at,
  };
  verifiedEntitlements.add(entitlement);

  const decryptEntry = ({ entryName, ciphertext, manifest: runtimeManifest }) => {
    const runtimeEnvelope = decodeExternalEnvelope(ciphertext);
    if (entryName !== envelope.entry_path) fail('KDNA_GRANT_ASSET_MISMATCH', 'encrypted entry path mismatch');
    if (digest(Buffer.from(runtimeEnvelope.ciphertext, 'base64url')) !== grant.asset.ciphertext_digest) {
      fail('KDNA_GRANT_DIGEST_MISMATCH', 'encrypted entry digest mismatch');
    }
    const aad = externalEnvelopeAad({
      manifest: runtimeManifest,
      entryName,
      plaintextDigest: runtimeEnvelope.plaintext_digest,
      keyRef: runtimeEnvelope.key_ref,
      issuerKeyId: runtimeEnvelope.issuer_key_id,
    });
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        cek,
        decodeB64url(runtimeEnvelope.iv, 'envelope IV', 12),
      );
      decipher.setAAD(aad);
      decipher.setAuthTag(decodeB64url(runtimeEnvelope.tag, 'envelope tag', 16));
      const plaintext = Buffer.concat([
        decipher.update(decodeB64url(runtimeEnvelope.ciphertext, 'envelope ciphertext')),
        decipher.final(),
      ]);
      if (digest(plaintext) !== runtimeEnvelope.plaintext_digest) {
        fail('KDNA_GRANT_DIGEST_MISMATCH', 'decrypted entry digest mismatch');
      }
      return plaintext;
    } catch (error) {
      if (error instanceof KDNAExternalGrantError) throw error;
      fail('KDNA_GRANT_TAMPERED', 'external envelope authentication failed');
    }
  };

  return {
    entitlement,
    decryptEntry,
    dispose() {
      if (cek) cek.fill(0);
      cek = null;
    },
  };
}

function isVerifiedExternalEntitlement(value) {
  return !!value && verifiedEntitlements.has(value);
}

module.exports = {
  EXTERNAL_ENVELOPE_PROFILE,
  EXTERNAL_GRANT_PROFILE,
  EXTERNAL_AAD_PROFILE,
  DEVICE_KEK_PROFILE,
  KDNAExternalGrantError,
  canonicalJson,
  grantSigningPayload,
  validateExternalEnvelope,
  validateExternalKeyGrant,
  externalEnvelopeAad,
  deriveExternalAssetCek,
  encodeExternalEnvelope,
  decodeExternalEnvelope,
  encryptExternalGrantEntry,
  generateDeviceKeyPairs,
  createExternalKeyGrant,
  authorizeExternalKeyGrant,
  isVerifiedExternalEntitlement,
};
