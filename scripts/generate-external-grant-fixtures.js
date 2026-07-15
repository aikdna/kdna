#!/usr/bin/env node

/** Generates deterministic, public test-only RFC-0019 fixtures. */

const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');
const core = require('../packages/kdna-core/src');

const outDir = path.join(__dirname, '..', 'conformance', 'external-grant');
const negativeDir = path.join(outDir, 'negative');

function privateKeyFromSeed(type, seedByte) {
  const oid = type === 'ed25519' ? '2b6570' : '2b656e';
  const prefix = Buffer.from(`302e02010030050603${oid}04220420`, 'hex');
  return crypto.createPrivateKey({
    key: Buffer.concat([prefix, Buffer.alloc(32, seedByte)]),
    format: 'der',
    type: 'pkcs8',
  });
}

function keyPair(type, seedByte) {
  const privateKey = privateKeyFromSeed(type, seedByte);
  return { privateKey, publicKey: crypto.createPublicKey(privateKey) };
}

function write(name, value) {
  fs.writeFileSync(path.join(outDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function writeNegative(name, value) {
  fs.writeFileSync(path.join(negativeDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

fs.mkdirSync(negativeDir, { recursive: true });

const manifest = {
  format_version: '0.1.0',
  asset_id: 'kdna:fixture:external-grant',
  asset_uid: 'urn:uuid:00190000-0000-4000-8000-000000000001',
  asset_type: 'fixture',
  title: 'External Grant Fixture',
  version: '1.0.0',
  judgment_version: '1.0.0',
  created_at: '2026-07-13T00:00:00Z',
  updated_at: '2026-07-13T00:00:00Z',
  creator: { name: 'KDNA Conformance' },
  compatibility: {
    min_loader_version: '0.18.1',
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
  },
  payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
  access: 'licensed',
  entitlement: { profile: 'account', offline: true, revocable: true },
  encryption: {
    profile: core.EXTERNAL_ENVELOPE_PROFILE,
    profile_version: core.EXTERNAL_GRANT_CONTRACT_VERSION,
    encrypted_entries: ['payload.kdnab'],
    key_grant_profile: core.EXTERNAL_GRANT_PROFILE,
  },
};
const plaintext = Buffer.from(
  cbor.encode({
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: { highest_question: 'Can this device decrypt?', axioms: [] },
  }),
);
const root = Buffer.alloc(32, 0x19);
const deviceAgreement = keyPair('x25519', 0x21);
const deviceSigning = keyPair('ed25519', 0x22);
const ephemeral = keyPair('x25519', 0x23);
const issuerSigning = keyPair('ed25519', 0x24);
const agreementPublic = deviceAgreement.publicKey.export({ format: 'jwk' }).x;
const agreementPrivate = deviceAgreement.privateKey.export({ format: 'jwk' }).d;
const deviceSigningPublic = deviceSigning.publicKey.export({ format: 'jwk' }).x;
const issuerSigningPublic = issuerSigning.publicKey.export({ format: 'jwk' }).x;
const envelope = core.encryptExternalGrantEntry(plaintext, {
  manifest,
  issuerRootKey: root,
  keyRef: 'assetkey:fixture:external-grant:1.0.0',
  issuerKeyId: 'fixture-asset-root',
  iv: Buffer.alloc(12, 0x25),
});
const encodedEnvelope = core.encodeExternalEnvelope(envelope);
const manifestBytes = Buffer.from(JSON.stringify(manifest));
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-external-grant-fixture-'));
const assetPath = path.join(fixtureDir, 'external-grant.kdna');
fs.writeFileSync(path.join(fixtureDir, 'mimetype'), core.MIMETYPE);
fs.writeFileSync(path.join(fixtureDir, 'kdna.json'), manifestBytes);
fs.writeFileSync(path.join(fixtureDir, 'payload.kdnab'), encodedEnvelope);
const checksums = core.buildChecksums(fixtureDir);
fs.writeFileSync(path.join(fixtureDir, 'checksums.json'), JSON.stringify(checksums));
core.pack(fixtureDir, assetPath);
const expectedAssetDigest = core.computeAssetDigest(fs.readFileSync(assetPath));
fs.rmSync(fixtureDir, { recursive: true, force: true });

function makeGrant(overrides = {}) {
  return core.createExternalKeyGrant({
    issuerRootKey: root,
    issuerSigningPrivateKey: issuerSigning.privateKey,
    signingKeyId: 'fixture-grant-signing',
    issuer: 'https://fixture.invalid',
    entitlementId: 'ent_fixture_01',
    accountId: 'acct_fixture_01',
    deviceId: 'dev_fixture_01',
    devicePublicKey: `x25519:${agreementPublic}`,
    deviceSigningPublicKey: `ed25519:${deviceSigningPublic}`,
    manifest,
    envelope,
    assetDigest: expectedAssetDigest,
    issuedAt: new Date('2026-07-13T00:00:00Z'),
    refreshAfter: new Date('2026-07-14T00:00:00Z'),
    offlineGraceUntil: new Date('2026-07-20T00:00:00Z'),
    expiresAt: new Date('2026-07-21T00:00:00Z'),
    grantId: overrides.grantId || 'grt_fixture_01',
    status: overrides.status || 'active',
    ephemeralKeyPair: ephemeral,
    wrapSalt: Buffer.alloc(16, overrides.saltByte || 0x26),
  });
}

const grant = makeGrant();
write('golden.json', {
  note: 'All key material in this fixture is deterministic and test-only.',
  manifest,
  plaintext_cbor: plaintext.toString('base64url'),
  envelope,
  envelope_cbor: encodedEnvelope.toString('base64url'),
  checksums,
  expected_asset_digest: expectedAssetDigest,
  grant,
  test_keys: {
    issuer_root: root.toString('base64url'),
    issuer_signing_public_key: `ed25519:${issuerSigningPublic}`,
    device_agreement_public_key: `x25519:${agreementPublic}`,
    device_agreement_private_key: `x25519:${agreementPrivate}`,
    device_signing_public_key: `ed25519:${deviceSigningPublic}`,
  },
});

writeNegative('tampered-signature.json', {
  expected_error: 'KDNA_GRANT_SIGNATURE_INVALID',
  grant: { ...grant, account_id: 'acct_tampered' },
});
writeNegative('revoked.json', {
  expected_error: 'KDNA_GRANT_REVOKED',
  grant: makeGrant({ status: 'revoked', grantId: 'grt_fixture_revoked', saltByte: 0x27 }),
});
writeNegative('asset-version-mismatch.json', {
  expected_error: 'KDNA_GRANT_ASSET_MISMATCH',
  manifest: { ...manifest, version: '1.0.1' },
  grant,
});
writeNegative('asset-digest-mismatch.json', {
  expected_error: 'KDNA_GRANT_DIGEST_MISMATCH',
  expected_asset_digest: `sha256:${'0'.repeat(64)}`,
  grant,
});
writeNegative('device-mismatch.json', {
  expected_error: 'KDNA_GRANT_DEVICE_MISMATCH',
  expected_device_id: 'dev_other',
  grant,
});

execFileSync(
  process.execPath,
  [
    require.resolve('prettier/bin/prettier.cjs'),
    '--write',
    path.join(outDir, 'golden.json'),
    ...fs
      .readdirSync(negativeDir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => path.join(negativeDir, name)),
  ],
  { stdio: 'ignore' },
);
