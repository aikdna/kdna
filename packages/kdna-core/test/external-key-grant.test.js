const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

const core = require('../src');

const NOW = new Date('2026-07-13T00:00:00Z');
const CONFORMANCE_ROOT = path.join(__dirname, '..', '..', '..', 'conformance', 'external-grant');

function conformanceJson(...parts) {
  return JSON.parse(fs.readFileSync(path.join(CONFORMANCE_ROOT, ...parts), 'utf8'));
}

function authorizeConformanceFixture(golden, overrides = {}) {
  return core.authorizeExternalKeyGrant({
    grant: golden.grant,
    issuerPublicKeys: {
      [golden.grant.signing_key_id]: golden.test_keys.issuer_signing_public_key,
    },
    manifest: golden.manifest,
    expectedAssetDigest: golden.expected_asset_digest,
    envelope: Buffer.from(golden.envelope_cbor, 'base64url'),
    deviceAgreementKey: {
      public_key: golden.test_keys.device_agreement_public_key,
      private_key: golden.test_keys.device_agreement_private_key,
    },
    expectedAccountId: golden.grant.account_id,
    expectedDeviceId: golden.grant.device_id,
    expectedDeviceSigningPublicKey: golden.test_keys.device_signing_public_key,
    now: NOW,
    networkAvailable: false,
    allowOffline: true,
    ...overrides,
  });
}

function fixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-external-grant-'));
  const source = path.join(tmp, 'source');
  const assetFile = path.join(tmp, 'external-grant.kdna');
  fs.mkdirSync(source, { recursive: true });
  const manifest = {
    format_version: '0.1.0',
    asset_id: 'kdna:fixture:external-grant',
    asset_uid: 'urn:uuid:18a3b84e-d8a9-4e22-b486-3d15132d389e',
    asset_type: 'domain',
    title: 'External Grant Fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-13T00:00:00Z',
    updated_at: '2026-07-13T00:00:00Z',
    creator: { name: 'Fixture Publisher' },
    compatibility: {
      min_loader_version: '0.19.0',
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
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
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
    issuerKeyId: 'fixture-asset-root-test',
    iv: Buffer.alloc(12, 0x24),
  });
  const encodedEnvelope = core.encodeExternalEnvelope(envelope);
  fs.writeFileSync(path.join(source, 'mimetype'), core.MIMETYPE);
  fs.writeFileSync(path.join(source, 'kdna.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(source, 'payload.kdnab'), encodedEnvelope);
  const checksums = core.buildChecksums(source);
  fs.writeFileSync(path.join(source, 'checksums.json'), JSON.stringify(checksums));
  core.pack(source, assetFile);
  const assetDigest = core.computeAssetDigest(fs.readFileSync(assetFile));

  const device = core.generateDeviceKeyPairs();
  const signing = crypto.generateKeyPairSync('ed25519');
  const signingPublic = signing.publicKey.export({ format: 'jwk' });
  const grant = core.createExternalKeyGrant({
    issuerRootKey: issuerRoot,
    issuerSigningPrivateKey: signing.privateKey,
    signingKeyId: 'fixture-grant-test',
    issuer: 'https://issuer.example',
    entitlementId: 'ent_test_01',
    accountId: 'acct_test_01',
    deviceId: 'dev_test_01',
    devicePublicKey: device.agreement.public_key,
    deviceSigningPublicKey: device.signing.public_key,
    manifest,
    envelope,
    assetDigest,
    issuedAt: NOW,
    refreshAfter: new Date('2026-07-14T00:00:00Z'),
    offlineGraceUntil: new Date('2026-07-20T00:00:00Z'),
    expiresAt: new Date('2026-07-21T00:00:00Z'),
    grantId: 'grt_test_01',
  });
  return {
    tmp,
    source,
    assetFile,
    manifest,
    plaintext,
    envelope,
    encodedEnvelope,
    issuerRoot,
    checksums,
    assetDigest,
    device,
    grant,
    signing,
    issuerPublicKeys: { 'fixture-grant-test': `ed25519:${signingPublic.x}` },
  };
}

function authorize(f, overrides = {}) {
  return core.authorizeExternalKeyGrant({
    grant: f.grant,
    issuerPublicKeys: f.issuerPublicKeys,
    manifest: f.manifest,
    expectedAssetDigest: f.assetDigest,
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
    assert.equal(Object.isFrozen(session.entitlement), true);
    assert.equal(Object.isFrozen(session.entitlement.asset), true);
    assert.deepEqual(
      session.decryptEntry({
        entryName: 'payload.kdnab',
        ciphertext: f.encodedEnvelope,
        manifest: f.manifest,
      }),
      f.plaintext,
    );

    const plan = core.planLoad(f.assetFile, { entitlement: session.entitlement });
    assert.equal(plan.state, 'ready', JSON.stringify(plan.issues));
    assert.equal(plan.can_load_now, true);

    const capsule = core.loadAuthorized(f.assetFile, {
      profile: 'compact',
      as: 'json',
      entitlement: session.entitlement,
      decryptEntry: session.decryptEntry,
    });
    assert.equal(capsule.type, 'kdna.runtime-capsule');
    assert.equal(capsule.contract_version, '0.1.0');
    assert.equal(capsule.asset.asset_id, f.manifest.asset_id);
    assert.equal(JSON.stringify(capsule).includes('wrapped_cek'), false);
    session.dispose();
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('verified external grant cannot bypass malformed encryption declarations', () => {
  const f = fixture();
  const session = authorize(f);
  const cases = [
    ['missing', (manifest) => { delete manifest.encryption; }],
    [
      'unrelated-entry',
      (manifest) => { manifest.encryption.encrypted_entries = ['other.bin']; },
    ],
    [
      'additional-entry',
      (manifest) => {
        manifest.encryption.encrypted_entries = ['payload.kdnab', 'other.bin'];
      },
    ],
  ];

  try {
    for (const [name, mutate] of cases) {
      const source = path.join(f.tmp, `source-${name}`);
      const assetFile = path.join(f.tmp, `${name}.kdna`);
      fs.mkdirSync(source);
      for (const entry of fs.readdirSync(f.source)) {
        fs.copyFileSync(path.join(f.source, entry), path.join(source, entry));
      }
      const manifestPath = path.join(source, 'kdna.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      mutate(manifest);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      fs.writeFileSync(
        path.join(source, 'checksums.json'),
        JSON.stringify(core.buildChecksums(source)),
      );
      core.pack(source, assetFile);

      const validation = core.validate(assetFile);
      assert.equal(validation.schema_valid, false, name);
      assert.equal(validation.overall_valid, false, name);
      const plan = core.planLoad(assetFile, { entitlement: session.entitlement });
      assert.equal(plan.state, 'invalid', name);
      assert.ok(
        plan.issues.some((issue) => issue.code === 'KDNA_FORMAT_INVALID'),
        `${name}: ${JSON.stringify(plan.issues)}`,
      );
      assert.throws(
        () => core.loadAuthorized(assetFile, {
          profile: 'compact',
          as: 'json',
          entitlement: session.entitlement,
          decryptEntry: session.decryptEntry,
        }),
        /LoadPlan denied loading/u,
        name,
      );
    }
  } finally {
    session.dispose();
    fs.rmSync(f.tmp, { recursive: true, force: true });
  }
});

test('a verified entitlement cannot make a different asset plan ready', () => {
  const f = fixture();
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-external-other-'));
  try {
    for (const name of fs.readdirSync(f.source)) {
      fs.copyFileSync(path.join(f.source, name), path.join(other, name));
    }
    const manifestPath = path.join(other, 'kdna.json');
    const otherManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    otherManifest.asset_id = 'kdna:fixture:different-external-grant';
    otherManifest.asset_uid = 'urn:uuid:18a3b84e-d8a9-4e22-b486-3d15132d3999';
    otherManifest.version = '2.0.0';
    fs.writeFileSync(manifestPath, JSON.stringify(otherManifest));
    fs.writeFileSync(
      path.join(other, 'checksums.json'),
      JSON.stringify(core.buildChecksums(other)),
    );

    const otherAsset = path.join(other, 'different-external-grant.kdna');
    core.pack(other, otherAsset);
    const session = authorize(f);
    const plan = core.planLoad(otherAsset, { entitlement: session.entitlement });
    assert.equal(plan.state, 'invalid');
    assert.equal(plan.can_load_now, false);
    assert.ok(plan.issues.some((issue) => issue.code === 'KDNA_GRANT_ASSET_MISMATCH'));
    session.dispose();
  } finally {
    fs.rmSync(f.tmp, { recursive: true, force: true });
    fs.rmSync(other, { recursive: true, force: true });
  }
});

test('plain active status cannot authorize an account asset', () => {
  const f = fixture();
  try {
    const plan = core.planLoad(f.assetFile, { entitlement: { status: 'active' } });
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
    const offlinePlan = core.planLoad(f.assetFile, { entitlement: offline.entitlement });
    assert.equal(offlinePlan.state, 'offline_grace', JSON.stringify(offlinePlan.issues));
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
        signingKeyId: 'fixture-grant-test',
        issuer: 'https://issuer.example',
        entitlementId: 'ent_test_01',
        accountId: 'acct_test_01',
        deviceId: 'dev_test_01',
        devicePublicKey: f.device.agreement.public_key,
        deviceSigningPublicKey: f.device.signing.public_key,
        manifest: f.manifest,
        envelope: f.envelope,
        assetDigest: f.assetDigest,
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
      signingKeyId: 'fixture-grant-test',
      issuer: 'https://issuer.example',
      entitlementId: 'ent_test_01',
      accountId: 'acct_test_01',
      deviceId: 'dev_test_01',
      devicePublicKey: f.device.agreement.public_key,
      deviceSigningPublicKey: f.device.signing.public_key,
      manifest: f.manifest,
      envelope: f.envelope,
      assetDigest: f.assetDigest,
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
        overrides: { expectedAssetDigest: `sha256:${'0'.repeat(64)}` },
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

test('published external-grant golden verifies signature, unwraps CEK, and decrypts ciphertext', () => {
  const golden = conformanceJson('golden.json');
  assert.equal(core.validateExternalEnvelope(golden.envelope), golden.envelope);
  assert.equal(core.validateExternalKeyGrant(golden.grant), golden.grant);
  assert.equal(golden.envelope.contract_version, core.EXTERNAL_GRANT_CONTRACT_VERSION);
  assert.equal(golden.grant.contract_version, core.EXTERNAL_GRANT_CONTRACT_VERSION);
  assert.equal(golden.grant.asset.digest, golden.expected_asset_digest);

  const session = authorizeConformanceFixture(golden);
  try {
    const plaintext = session.decryptEntry({
      entryName: golden.manifest.payload.path,
      ciphertext: Buffer.from(golden.envelope_cbor, 'base64url'),
      manifest: golden.manifest,
    });
    assert.equal(plaintext.toString('base64url'), golden.plaintext_cbor);
  } finally {
    session.dispose();
  }
});

test('external envelope AAD binds the stable contract coordinate and asset release', () => {
  const golden = conformanceJson('golden.json');
  assert.deepEqual(
    core.externalEnvelopeAad({
      manifest: golden.manifest,
      entryName: golden.envelope.entry_path,
      plaintextDigest: golden.envelope.plaintext_digest,
      keyRef: golden.envelope.key_ref,
      issuerKeyId: golden.envelope.issuer_key_id,
    }).toString('utf8').split('\n'),
    [
      core.EXTERNAL_ENVELOPE_PROFILE,
      core.EXTERNAL_GRANT_CONTRACT_VERSION,
      golden.manifest.asset_uid,
      golden.manifest.asset_id,
      golden.manifest.version,
      golden.envelope.entry_path,
      golden.envelope.plaintext_digest,
      golden.envelope.key_ref,
      golden.envelope.issuer_key_id,
      golden.manifest.access,
      golden.manifest.entitlement.profile,
    ],
  );
  assert.notEqual(golden.expected_asset_digest, golden.checksums.entry_set_digest);
  assert.equal(golden.grant.asset.digest, golden.expected_asset_digest);
});

test('published external-grant negative fixtures fail with their declared error codes', () => {
  const golden = conformanceJson('golden.json');
  const cases = [
    ['tampered-signature.json', (fixture) => ({ grant: fixture.grant })],
    ['revoked.json', (fixture) => ({ grant: fixture.grant })],
    ['asset-version-mismatch.json', (fixture) => ({ manifest: fixture.manifest })],
    [
      'asset-digest-mismatch.json',
      (fixture) => ({ expectedAssetDigest: fixture.expected_asset_digest }),
    ],
    ['device-mismatch.json', (fixture) => ({ expectedDeviceId: fixture.expected_device_id })],
  ];
  for (const [filename, overrides] of cases) {
    const fixture = conformanceJson('negative', filename);
    assert.throws(
      () => authorizeConformanceFixture(golden, overrides(fixture)),
      (error) => error.code === fixture.expected_error,
      filename,
    );
  }
});
