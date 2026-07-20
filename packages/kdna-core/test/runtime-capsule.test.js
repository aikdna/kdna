const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JsonSchema2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const core = require('../src');
const digestEvidenceSchema = require('../../../specs/digest-evidence.schema.json');
const runtimeCapsuleSchema = require('../../../specs/runtime-capsule.schema.json');
const packagedDigestEvidenceSchema = require('../schema/digest-evidence.schema.json');
const packagedRuntimeCapsuleSchema = require('../schema/runtime-capsule.schema.json');
const golden = require('../../../conformance/runtime-capsule/golden.json');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE = path.join(ROOT, 'examples', 'minimal');
const GOLDEN_BYTES = Buffer.from(
  fs
    .readFileSync(
      path.join(ROOT, 'conformance', 'runtime-capsule', golden.fixture),
      'utf8',
    )
    .trim(),
  'base64',
);

function validators() {
  const ajv = new JsonSchema2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(digestEvidenceSchema);
  return {
    evidence: ajv.getSchema(digestEvidenceSchema.$id),
    capsule: ajv.compile(runtimeCapsuleSchema),
  };
}

test('Runtime Capsule schemas are synchronized with packaged Core copies', () => {
  assert.deepEqual(packagedDigestEvidenceSchema, digestEvidenceSchema);
  assert.deepEqual(packagedRuntimeCapsuleSchema, runtimeCapsuleSchema);
});

test('committed Runtime Capsule golden freezes A, C, E, Capsule, and P', () => {
  const evidence = core.computeDigestEvidence(GOLDEN_BYTES);
  const capsule = core.loadRuntimeCapsule(GOLDEN_BYTES, {
    loadedAt: golden.loaded_at,
    profile: 'compact',
  });
  const schema = validators();

  assert.equal(evidence.profile, 'kdna.digest-evidence');
  assert.equal(evidence.profile_version, '0.1.0');
  assert.equal(evidence.asset.value, golden.expected.asset);
  assert.equal(evidence.content.value, golden.expected.content);
  assert.equal(evidence.runtime_entry_set.value, golden.expected.runtime_entry_set);
  assert.deepEqual(capsule, golden.runtime_capsule);
  assert.equal(capsule.type, 'kdna.runtime-capsule');
  assert.equal(capsule.contract_version, '0.1.0');
  assert.equal(Object.hasOwn(capsule, 'risk_level'), false);
  assert.equal(core.computeCapsuleDeliveryDigest(capsule), golden.expected.capsule_delivery);
  assert.equal(schema.evidence(evidence), true, JSON.stringify(schema.evidence.errors));
  assert.equal(schema.capsule(capsule), true, JSON.stringify(schema.capsule.errors));
});

test('loadAuthorized and loadRuntimeCapsule expose the same sole public shape', () => {
  const options = { loadedAt: golden.loaded_at, profile: 'compact', as: 'json' };
  assert.deepEqual(
    core.loadAuthorized(GOLDEN_BYTES, options),
    core.loadRuntimeCapsule(GOLDEN_BYTES, options),
  );
  const generationMarker = 'V';
  for (const removedName of [
    ['adaptCapsule', generationMarker, 2, 'To', generationMarker, 1].join(''),
    ['loadCapsule', generationMarker, 2].join(''),
    ['buildCapsule', generationMarker, 2].join(''),
  ]) {
    assert.equal(Object.hasOwn(core, removedName), false);
  }
});

test('public Runtime Capsule builder accepts only the stable responsibility shape', () => {
  const loaded = core.loadRuntimeCapsule(GOLDEN_BYTES, {
    loadedAt: golden.loaded_at,
    profile: 'compact',
  });
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(GOLDEN_BYTES);
  const manifest = reader.readManifestSync(asset);
  const built = core.buildRuntimeCapsule({
    projection: {
      profile: loaded.profile,
      content: loaded.context,
      projection_report: loaded.trace.projection_report,
    },
    manifest,
    digests: loaded.digests,
    signature: loaded.signature,
    inputKind: 'packaged_bytes',
    loadedAt: golden.loaded_at,
    schemaValid: true,
  });
  assert.deepEqual(built, loaded);

  const manifestWithoutAccess = structuredClone(manifest);
  delete manifestWithoutAccess.access;
  const builtWithoutAccess = core.buildRuntimeCapsule({
    projection: { profile: loaded.profile, content: loaded.context },
    manifest: manifestWithoutAccess,
    digests: loaded.digests,
    signature: loaded.signature,
    inputKind: 'packaged_bytes',
    loadedAt: golden.loaded_at,
    schemaValid: true,
  });
  assert.equal(builtWithoutAccess.access, 'public');

  assert.throws(
    () => core.buildRuntimeCapsule({
      projection: { profile: loaded.profile, content: loaded.context },
      manifest,
      digests: loaded.digests,
      signature: { state: 'verified', issuer: 'legacy-key' },
      inputKind: 'packaged_bytes',
      loadedAt: golden.loaded_at,
      schemaValid: true,
    }),
    (error) => error.code === 'KDNA_ASSET_SIGNATURE_UNSUPPORTED',
  );

  for (const invalidAccess of ['', null, false, 0]) {
    assert.throws(
      () => core.buildRuntimeCapsule({
        projection: { profile: loaded.profile, content: loaded.context },
        manifest: { ...manifest, access: invalidAccess },
        digests: loaded.digests,
        signature: loaded.signature,
        inputKind: 'packaged_bytes',
        loadedAt: golden.loaded_at,
        schemaValid: true,
      }),
      (error) => error.code === 'KDNA_RUNTIME_CAPSULE_BUILD_INVALID',
    );
  }

  assert.throws(
    () => core.buildRuntimeCapsule({ manifest, digests: loaded.digests }),
    (error) => error.code === 'KDNA_RUNTIME_CAPSULE_BUILD_INVALID',
  );
});

test('Runtime Capsule schema rejects old generation and compatibility fields', () => {
  const validate = validators().capsule;
  for (const mutate of [
    (value) => {
      value.type = 'kdna.context.capsule';
    },
    (value) => {
      value.version = '2.0';
    },
    (value) => {
      value.compatibility = { legacy: true };
    },
    (value) => {
      value.risk_level = 'R0';
    },
    (value) => {
      value.digests.profile_version = '1.0.0';
    },
  ]) {
    const candidate = structuredClone(golden.runtime_capsule);
    mutate(candidate);
    assert.equal(validate(candidate), false);
  }
});

test('external A/C/E mismatches remain evidence and fail with stable blocking codes', () => {
  const wrong = `sha256:${'0'.repeat(64)}`;
  const schema = validators();
  for (const [name, code] of [
    ['asset', 'KDNA_ASSET_DIGEST_MISMATCH'],
    ['content', 'KDNA_CONTENT_DIGEST_MISMATCH'],
    ['runtime_entry_set', 'KDNA_RUNTIME_ENTRY_SET_DIGEST_MISMATCH'],
  ]) {
    const expectedDigests = { [name]: { value: wrong, source: 'install_receipt' } };
    const evidence = core.computeDigestEvidence(GOLDEN_BYTES, { expectedDigests });
    assert.equal(evidence[name].comparison.state, 'mismatched');
    assert.equal(schema.evidence(evidence), true, JSON.stringify(schema.evidence.errors));
    assert.throws(
      () => core.loadRuntimeCapsule(GOLDEN_BYTES, { expectedDigests }),
      (error) => error.code === code,
    );
  }
});

test('JCS follows RFC 8785 and rejects values outside the JSON data model', () => {
  const vector = golden.jcs_vectors[0];
  assert.equal(core.canonicalizeJcs(vector.value), vector.canonical);
  assert.equal(core.canonicalizeJcs({ value: -0 }), '{"value":0}');
  assert.throws(
    () => core.canonicalizeJcs({ number: Number.NaN }),
    (error) => error.code === 'KDNA_JCS_NON_FINITE_NUMBER',
  );
  assert.throws(
    () => core.canonicalizeJcs({ text: '\ud800' }),
    (error) => error.code === 'KDNA_JCS_INVALID_UNICODE',
  );
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(
    () => core.canonicalizeJcs(cyclic),
    (error) => error.code === 'KDNA_JCS_CYCLIC_VALUE',
  );
});

test('Runtime Capsule rejects authoring directories before projection', () => {
  assert.throws(
    () => core.loadRuntimeCapsule(SOURCE),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
});
