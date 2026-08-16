'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

const core = require('../src');
const container = require('../src/container');
const signature = require('../src/signature');

const FIXTURE_MANIFEST = {
  format_version: '0.1.0',
  asset_id: 'kdna:test:signature',
  asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000512',
  asset_type: 'fixture',
  title: 'Signature Test Fixture',
  version: '1.0.0',
  judgment_version: '1.0.0',
  created_at: '2026-08-16T00:00:00Z',
  updated_at: '2026-08-16T00:00:00Z',
  compatibility: {
    min_loader_version: '0.20.0',
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
  },
  payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
  access: 'public',
};

const FIXTURE_PAYLOAD = {
  profile: 'kdna.payload.judgment',
  profile_version: '0.1.0',
  core: {
    axioms: [
      {
        statement: 'Signatures bind bytes, not truth.',
        applies_when: ['verifying a signed KDNA asset'],
      },
    ],
  },
};

function unsignedEntryMap(overrides = {}) {
  return {
    mimetype: Buffer.from(core.MIMETYPE, 'utf8'),
    'kdna.json': Buffer.from(`${JSON.stringify({ ...FIXTURE_MANIFEST, ...(overrides.manifest || {}) }, null, 2)}\n`, 'utf8'),
    'payload.kdnab': Buffer.from(cbor.encode(overrides.payload || FIXTURE_PAYLOAD)),
    ...(overrides.extra || {}),
  };
}

function signEntries(entries, keyPair = core.generateSigningKeyPair()) {
  const unsigned = core.packEntryMap(entries);
  const signed = core.signContainerBytes(unsigned, keyPair.private_key);
  return { keyPair, unsigned, signed };
}

test('signing payload is domain-separated by the profile coordinate', () => {
  const digest = `sha256:${'a'.repeat(64)}`;
  const payload = signature.buildSigningPayload(digest);
  assert.equal(
    payload.toString('utf8'),
    `${signature.KDSIG_PROFILE}:${signature.KDSIG_PROFILE_VERSION}:${digest}`,
  );
  assert.throws(() => signature.buildSigningPayload('sha256:ZZZ'), (e) => e.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED');
  assert.throws(() => signature.buildSigningPayload(digest.toUpperCase()), (e) => e.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED');
});

test('bundle parser is strict and fail-closed', () => {
  const digest = `sha256:${'b'.repeat(64)}`;
  const keyPair = core.generateSigningKeyPair();
  const bundle = signature.signContentDigest(digest, keyPair.private_key);
  const bytes = signature.serializeSignatureBundle(bundle);
  assert.equal(signature.parseSignatureBundle(bytes).signature, bundle.signature);

  const reject = (mutate, code = 'KDNA_INTEGRITY_SIGNATURE_FAILED') => {
    const copy = { ...bundle, ...(typeof mutate === 'function' ? {} : mutate) };
    if (typeof mutate === 'function') mutate(copy);
    assert.throws(
      () => signature.parseSignatureBundle(signature.serializeSignatureBundle(copy)),
      (error) => error.code === code,
    );
  };
  reject({ profile: 'kdsig.example' }, 'KDNA_SIGNATURE_PROFILE_UNSUPPORTED');
  reject({ profile_version: '9.9.9' }, 'KDNA_SIGNATURE_VERSION_UNSUPPORTED');
  reject({ algorithm: 'rsa' }, 'KDNA_SIGNATURE_PROFILE_UNSUPPORTED');
  reject((copy) => delete copy.public_key);
  reject({ public_key: 'ZZ'.repeat(32) });
  reject({ signature: bundle.signature.slice(0, 127) });
  reject({ content_digest: 'md5:' + '0'.repeat(64) });
  reject({ issuer: 'extra' });
  assert.throws(() => signature.parseSignatureBundle(Buffer.from('[1]')), (e) => e.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED');
  assert.throws(() => signature.parseSignatureBundle(Buffer.from('{bad')), (e) => e.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED');
});

test('key utilities fail closed on malformed material', () => {
  assert.throws(() => signature.keyFingerprint('nothex'), (e) => e.code === 'KDNA_SIGNATURE_KEY_INVALID');
  const digest = `sha256:${'c'.repeat(64)}`;
  assert.throws(() => signature.signContentDigest(digest, 'short'), (e) => e.code === 'KDNA_SIGNATURE_KEY_INVALID');
  const keyPair = core.generateSigningKeyPair();
  assert.match(keyPair.public_key, /^[0-9a-f]{64}$/);
  assert.match(keyPair.private_key, /^[0-9a-f]{64}$/);
  assert.equal(signature.keyFingerprint(keyPair.public_key), `sha256:${crypto.createHash('sha256').update(Buffer.from(keyPair.public_key, 'hex')).digest('hex')}`);
});

test('signed container verifies, loads, and reports verified capsule evidence', () => {
  const { keyPair, signed } = signEntries(unsignedEntryMap());
  const validation = core.validate(signed.containerBytes);
  assert.equal(validation.overall_valid, true);
  assert.equal(validation.signature_state, 'verified');
  assert.equal(validation.signature_evidence.public_key, keyPair.public_key);

  const evidence = core.verifyKDNASignatureSync(signed.containerBytes);
  assert.equal(evidence.state, 'verified');
  assert.equal(evidence.content_digest, signed.content_digest);

  const capsule = core.loadKDNASync(signed.containerBytes, { profile: 'compact' });
  assert.equal(capsule.signature.state, 'verified');
  assert.equal(capsule.signature.profile, signature.KDSIG_PROFILE);
  assert.equal(capsule.signature.profile_version, signature.KDSIG_PROFILE_VERSION);
  assert.equal(capsule.signature.content_digest, signed.content_digest);
  assert.equal(capsule.trace.signature_state, 'verified');
});

test('signature covers attachments and every canonical entry', () => {
  const entries = unsignedEntryMap({
    extra: { 'attachments/notes.txt': Buffer.from('attachment-bytes\n') },
  });
  const { signed } = signEntries(entries);
  assert.equal(core.verifyKDNASignatureSync(signed.containerBytes).state, 'verified');

  const layout = core.readLayoutBytes(signed.containerBytes);
  const tampered = core.fullEntryBufferMap(layout);
  tampered['attachments/notes.txt'] = Buffer.from('tampered-bytes\n');
  tampered[signature.SIGNATURE_ENTRY_NAME] = layout.map[signature.SIGNATURE_ENTRY_NAME];
  const tamperedBytes = core.packEntryMap(tampered);
  assert.throws(
    () => core.verifyKDNASignatureSync(tamperedBytes),
    (error) => error.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED',
  );
  assert.throws(() => core.loadKDNASync(tamperedBytes, { profile: 'compact' }));
});

test('re-signing replaces a stale bundle and never certifies broken content', () => {
  const entries = unsignedEntryMap();
  const first = signEntries(entries);
  const resigned = core.signContainerBytes(first.signed.containerBytes, first.keyPair.private_key);
  assert.equal(core.verifyKDNASignatureSync(resigned.containerBytes).state, 'verified');

  const layout = core.readLayoutBytes(first.signed.containerBytes);
  const broken = core.fullEntryBufferMap(layout);
  const manifest = JSON.parse(broken['kdna.json'].toString('utf8'));
  delete manifest.asset_id;
  broken['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  delete broken[signature.SIGNATURE_ENTRY_NAME];
  assert.throws(
    () => core.signContainerBytes(core.packEntryMap(broken), first.keyPair.private_key),
    (error) => error.code === 'KDNA_SIGNATURE_INPUT_INVALID',
  );
});

test('signature.kdsig is excluded from the content digest it signs', () => {
  const entries = unsignedEntryMap();
  const unsignedDigest = core.contentDigestFromEntryBuffers(entries);
  const { signed } = signEntries(entries);
  const layout = core.readLayoutBytes(signed.containerBytes);
  assert.equal(core.contentDigestFromEntryBuffers(core.fullEntryBufferMap(layout)), unsignedDigest);
  assert.equal(signed.content_digest, unsignedDigest);
});

test('verifyKDNASignature honors required and pinned-key options', () => {
  const { keyPair, unsigned, signed } = signEntries(unsignedEntryMap());
  assert.deepEqual(core.verifyKDNASignatureSync(unsigned), { state: 'absent' });
  assert.throws(
    () => core.verifyKDNASignatureSync(unsigned, { required: true }),
    (error) => error.code === 'KDNA_SIGNATURE_ABSENT',
  );
  const foreign = core.generateSigningKeyPair();
  assert.throws(
    () => core.verifyKDNASignatureSync(signed.containerBytes, { expectedPublicKey: foreign.public_key }),
    (error) => error.code === 'KDNA_INTEGRITY_SIGNATURE_FAILED',
  );
  assert.equal(
    core.verifyKDNASignatureSync(signed.containerBytes, { expectedPublicKey: keyPair.public_key }).state,
    'verified',
  );
});

test('reader verify supports requireSignature against the current contract', () => {
  const { signed, unsigned } = signEntries(unsignedEntryMap());
  const reader = core.createKdnaAssetReader();

  const signedAsset = reader.openSync(signed.containerBytes);
  const signedVerification = reader.verifySync(signedAsset, { requireSignature: true });
  assert.equal(signedVerification.ok, true, JSON.stringify(signedVerification.errors));

  const unsignedAsset = reader.openSync(unsigned);
  const unsignedVerification = reader.verifySync(unsignedAsset, { requireSignature: true });
  assert.equal(unsignedVerification.ok, false);
  assert.ok(
    unsignedVerification.errors.some((message) => message.includes('required asset signature is absent')),
  );

  const plainVerification = reader.verifySync(unsignedAsset);
  assert.equal(plainVerification.ok, true, JSON.stringify(plainVerification.errors));
});

test('source directories may carry signature.kdsig through pack and validate', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-signature-source-'));
  try {
    const source = path.join(temporary, 'source');
    fs.mkdirSync(source);
    const entries = unsignedEntryMap();
    fs.writeFileSync(path.join(source, 'mimetype'), entries.mimetype);
    fs.writeFileSync(path.join(source, 'kdna.json'), entries['kdna.json']);
    fs.writeFileSync(path.join(source, 'payload.kdnab'), entries['payload.kdnab']);

    const packedPath = path.join(temporary, 'unsigned.kdna');
    container.pack(source, packedPath);
    const keyPair = core.generateSigningKeyPair();
    const signed = core.signContainerBytes(fs.readFileSync(packedPath), keyPair.private_key);

    fs.writeFileSync(path.join(source, 'signature.kdsig'), signed.bundleBytes);
    const signedPath = path.join(temporary, 'signed.kdna');
    container.pack(source, signedPath);

    const validation = container.validate(signedPath);
    assert.equal(validation.overall_valid, true, JSON.stringify(validation.problems));
    assert.equal(validation.signature_state, 'verified');

    const plan = container.planLoad(signedPath);
    assert.equal(plan.can_load_now, true, JSON.stringify(plan.issues));
    assert.equal(plan.signature_state, 'verified');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('legacy manifest signature declarations remain rejected', () => {
  for (const field of ['signature', 'signatures']) {
    const manifest = { ...FIXTURE_MANIFEST };
    manifest[field] = field === 'signature' ? 'ed25519:legacy' : ['signatures/legacy.json'];
    const bytes = core.packEntryMap(unsignedEntryMap({ manifest }));
    const validation = core.validate(bytes);
    assert.equal(validation.schema_valid, false, field);
    assert.equal(validation.overall_valid, false, field);
  }
});
