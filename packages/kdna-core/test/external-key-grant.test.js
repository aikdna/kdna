const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

const core = require('../src');

const NOW = new Date('2026-07-13T00:00:00Z');

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-external-grant-'));
  const manifest = {
    kdna_version: '1.0',
    asset_id: 'kdna:fixture:external-grant',
    asset_uid: 'urn:uuid:18a3b84e-d8a9-4e22-b486-3d15132d389e',
    name: '@fixture/external-grant',
    asset_type: 'domain',
    title: 'External Grant Fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-13T00:00:00Z',
    updated_at: '2026-07-13T00:00:00Z',
    creator: { name: 'Fixture Publisher' },
    compatibility: { min_loader_version: '0.16.0', profile: 'judgment-profile-v1' },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
    access: 'licensed',
    entitlement: { profile: 'account', offline: true, revocable: true },
    encryption: {
      profile: core.EXTERNAL_ENVELOPE_PROFILE,
      encrypted_entries: ['payload.kdnab'],
      key_grant_profile: core.EXTERNAL_GRANT_PROFILE,
    },
  };
  const payload = {
    profile: 'judgment-profile-v1',
    core: {
      highest_question: 'How can I create room to choose before reacting?',
      axioms: [{ id: 'A1', one_sentence: 'Pause before choosing.' }],
      boundaries: ['Not medical care.'],
    },
    patterns: [],
    scenarios: [],
    cases: [],
    reasoning: { self_check: ['Am I trying to control another person?'], failure_modes: [] },
  };
  const plaintext = Buffer.from(cbor.encode(payload));
  const issuerRoot = Buffer.alloc(32, 0x42);
  const envelope = core.encryptExternalGrantEntry(plaintext, {
    manifest,
    entryName: 'payload.kdnab',
    issuerRootKey: issuerRoot,
    keyRef: 'assetkey:fixture:external-grant:1.0.0',
    issuerKeyId: 'fixture-asset-root-test-v1',
    iv: Buffer.alloc(12, 0x24),
  });
  const encodedEnvelope = core.encodeExternalEnvelope(envelope);
  fs.writeFileSync(path.join(tmp, 'mimetype'), core.MIMETYPE);
  fs.writeFileSync(path.join(tmp, 'kdna.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(tmp, 'payload.kdnab'), encodedEnvelope);
  const checksums = core.buildChecksums(tmp);
  fs.writeFileSync(path.join(tmp, 'checksums.json'), JSON.stringify(checksums));

  const device = core.generateDeviceKeyPairs();
  const signing = crypto.generateKeyPairSync('ed25519');
  const signingPublic = signing.publicKey.export({ format: 'jwk' });
  const grant = core.createExternalKeyGrant({
    issuerRootKey: issuerRoot,
    issuerSigningPrivateKey: signing.privateKey,
    signingKeyId: 'fixture-grant-test-v1',
    issuer: 'https://issuer.example',
    entitlementId: 'ent_test_01',
    accountId: 'acct_test_01',
    deviceId: 'dev_test_01',
    devicePublicKey: device.agreement.public_key,
    deviceSigningPublicKey: device.signing.public_key,
    manifest,
    envelope,
    assetDigest: checksums.asset_digest,
    issuedAt: NOW,
    refreshAfter: new Date('2026-07-14T00:00:00Z'),
    offlineGraceUntil: new Date('2026-07-20T00:00:00Z'),
    expiresAt: new Date('2026-07-21T00:00:00Z'),
    grantId: 'grt_test_01',
  });
  return {
    tmp,
    manifest,
    plaintext,
    envelope,
    encodedEnvelope,
    issuerRoot,
    checksums,
    device,
    grant,
    signing,
    issuerPublicKeys: { 'fixture-grant-test-v1': `ed25519:${signingPublic.x}` },
  };
}

function authorize(f, overrides = {}) {
  return core.authorizeExternalKeyGrant({
    grant: f.grant,
    issuerPublicKeys: f.issuerPublicKeys,
    manifest: f.manifest,
    checksums: f.checksums,
    envelope: f.encodedEnvelope,
    deviceAgreementKey: f.device.agreement,
    expectedAccountId: 'acct_test_01',
    expectedDeviceId: 'dev_test_01',
    expectedDeviceSigningPublicKey: f.device.signing.public_key,
    now: NOW,
    networkAvailable: false,
    allowOffline: true,
    ...overrides,
  });
}

test('external grant decrypts only after signed account/device authorization', () => {
  const f = fixture();
  try {
    const session = authorize(f);
    assert.equal(session.entitlement.status, 'active');
    assert.deepEqual(
      session.decryptEntry({
        entryName: 'payload.kdnab',
        ciphertext: f.encodedEnvelope,
        manifest: f.manifest,
      }),
      f.plaintext,
    );

    const plan = core.planLoad(f.tmp, { entitlement: session.entitlement });
    assert.equal(plan.state, 'ready');
    assert.equal(plan.can_load_now, true);

    const capsule = core.loadAuthorized(f.tmp, {
      profile: 'compact',
      as: 'json',
      entitlement: session.entitlement,
      decryptEntry: session.decryptEntry,
    });
    assert.equal(capsule.type, 'kdna.context.capsule');
    assert.equal(capsule.version, '1.0');
    assert.equal(capsule.domain, f.manifest.name);
    assert.equal(JSON.stringify(capsule).includes('wrapped_cek'), false);
    session.dispose();
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('plain active status cannot authorize an account asset', () => {
  const f = fixture();
  try {
    const plan = core.planLoad(f.tmp, { entitlement: { status: 'active' } });
    assert.equal(plan.state, 'needs_account');
    assert.equal(plan.can_load_now, false);
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('offline grace is explicit and hard expiry fails closed', () => {
  const f = fixture();
  try {
    const offline = authorize(f, { now: new Date('2026-07-16T00:00:00Z') });
    assert.equal(offline.entitlement.status, 'offline_grace');
    assert.equal(core.planLoad(f.tmp, { entitlement: offline.entitlement }).state, 'offline_grace');
    offline.dispose();
    assert.throws(
      () => authorize(f, { now: new Date('2026-07-22T00:00:00Z') }),
      (error) => error.code === 'KDNA_GRANT_EXPIRED',
    );
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('invalid time windows and status rollback fail closed', () => {
  const f = fixture();
  try {
    assert.throws(
      () => authorize(f, { minimumStatusVersion: 2 }),
      (error) => error.code === 'KDNA_GRANT_ROLLBACK_DETECTED',
    );
    assert.throws(
      () => core.createExternalKeyGrant({
        issuerRootKey: f.issuerRoot,
        issuerSigningPrivateKey: f.signing.privateKey,
        signingKeyId: 'fixture-grant-test-v1',
        issuer: 'https://issuer.example',
        entitlementId: 'ent_test_01',
        accountId: 'acct_test_01',
        deviceId: 'dev_test_01',
        devicePublicKey: f.device.agreement.public_key,
        deviceSigningPublicKey: f.device.signing.public_key,
        manifest: f.manifest,
        envelope: f.envelope,
        assetDigest: f.checksums.asset_digest,
        issuedAt: NOW,
        refreshAfter: new Date('2026-07-16T00:00:00Z'),
        offlineGraceUntil: new Date('2026-07-15T00:00:00Z'),
        expiresAt: new Date('2026-07-21T00:00:00Z'),
      }),
      (error) => error.code === 'KDNA_GRANT_TIME_INVALID',
    );
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('tampered, revoked, digest, version, and device mismatches fail closed', () => {
  const f = fixture();
  try {
    const revokedGrant = core.createExternalKeyGrant({
      issuerRootKey: f.issuerRoot,
      issuerSigningPrivateKey: f.signing.privateKey,
      signingKeyId: 'fixture-grant-test-v1',
      issuer: 'https://issuer.example',
      entitlementId: 'ent_test_01',
      accountId: 'acct_test_01',
      deviceId: 'dev_test_01',
      devicePublicKey: f.device.agreement.public_key,
      deviceSigningPublicKey: f.device.signing.public_key,
      manifest: f.manifest,
      envelope: f.envelope,
      assetDigest: f.checksums.asset_digest,
      status: 'revoked',
      issuedAt: NOW,
      refreshAfter: new Date('2026-07-14T00:00:00Z'),
      offlineGraceUntil: new Date('2026-07-20T00:00:00Z'),
      expiresAt: new Date('2026-07-21T00:00:00Z'),
      grantId: 'grt_revoked_01',
    });
    const cases = [
      {
        expected: 'KDNA_GRANT_SIGNATURE_INVALID',
        overrides: { grant: { ...f.grant, account_id: 'acct_attacker' } },
      },
      {
        expected: 'KDNA_GRANT_REVOKED',
        overrides: { grant: revokedGrant },
      },
      {
        expected: 'KDNA_GRANT_DIGEST_MISMATCH',
        overrides: {
          checksums: { ...f.checksums, asset_digest: `sha256:${'0'.repeat(64)}` },
        },
      },
      {
        expected: 'KDNA_GRANT_ASSET_MISMATCH',
        overrides: { manifest: { ...f.manifest, version: '1.0.1' } },
      },
      {
        expected: 'KDNA_GRANT_DEVICE_MISMATCH',
        overrides: { deviceAgreementKey: core.generateDeviceKeyPairs().agreement },
      },
    ];
    for (const item of cases) {
      assert.throws(
        () => authorize(f, item.overrides),
        (error) => error.code === item.expected,
        item.expected,
      );
    }
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});
