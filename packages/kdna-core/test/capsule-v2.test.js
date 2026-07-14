const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const core = require('../src');
const digestEvidenceSchema = require('../../../specs/digest-evidence.schema.json');
const capsule1Schema = require('../../../specs/runtime-capsule-1.schema.json');
const capsule2Schema = require('../../../specs/runtime-capsule-2.schema.json');
const packagedDigestEvidenceSchema = require('../schema/digest-evidence.schema.json');
const packagedCapsule1Schema = require('../schema/runtime-capsule-1.schema.json');
const packagedCapsule2Schema = require('../schema/runtime-capsule-2.schema.json');
const golden = require('../../../conformance/capsule-v2/golden.json');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE = path.join(ROOT, 'examples', 'minimal');
const GOLDEN_BYTES = Buffer.from(
  fs.readFileSync(path.join(ROOT, 'conformance', 'capsule-v2', golden.fixture), 'utf8').trim(),
  'base64',
);

function schemaValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(digestEvidenceSchema);
  return {
    evidence: ajv.getSchema(digestEvidenceSchema.$id),
    capsule1: ajv.compile(capsule1Schema),
    capsule2: ajv.compile(capsule2Schema),
  };
}

function sha256(bytes) {
  return `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}

function withModifiedSource(mutator) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-capsule-v2-'));
  const source = path.join(tmp, 'source');
  const assetPath = path.join(tmp, 'asset.kdna');
  fs.cpSync(SOURCE, source, { recursive: true });
  mutator(source);
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    JSON.stringify(core.buildChecksums(source), null, 2),
  );
  core.pack(source, assetPath);
  return {
    assetPath,
    source,
    cleanup() {
      fs.rmSync(tmp, { recursive: true, force: true });
    },
  };
}

test('Capsule schemas are synchronized with the packaged Core copies', () => {
  assert.deepEqual(packagedDigestEvidenceSchema, digestEvidenceSchema);
  assert.deepEqual(packagedCapsule1Schema, capsule1Schema);
  assert.deepEqual(packagedCapsule2Schema, capsule2Schema);
});

test('committed Capsule 2 golden freezes A, C, E, Capsule 2, P, and v2-to-v1 output', () => {
  const evidence = core.computeDigestEvidence(GOLDEN_BYTES);
  const capsule2 = core.loadCapsuleV2(GOLDEN_BYTES, {
    loadedAt: golden.loaded_at,
    profile: 'compact',
  });
  const capsule1 = core.adaptCapsuleV2ToV1(capsule2);
  const validators = schemaValidators();

  assert.equal(evidence.asset.value, golden.expected.asset);
  assert.equal(evidence.content.value, golden.expected.content);
  assert.equal(evidence.runtime_entry_set.value, golden.expected.runtime_entry_set);
  assert.deepEqual(capsule2, golden.capsule_2);
  assert.equal(core.computeCapsuleDeliveryDigest(capsule2), golden.expected.capsule_delivery);
  assert.deepEqual(capsule1, golden.capsule_1);
  assert.equal(validators.evidence(evidence), true, JSON.stringify(validators.evidence.errors));
  assert.equal(validators.capsule2(capsule2), true, JSON.stringify(validators.capsule2.errors));
  assert.equal(validators.capsule1(capsule1), true, JSON.stringify(validators.capsule1.errors));
});

test('explicit Capsule 2 remains opt-in and its adapter equals the direct frozen Capsule 1', () => {
  const direct = core.loadAuthorized(GOLDEN_BYTES, { profile: 'compact', as: 'json' });
  direct.trace.loaded_at = golden.loaded_at;
  const capsule2 = core.loadCapsuleV2(GOLDEN_BYTES, {
    loadedAt: golden.loaded_at,
    profile: 'compact',
  });

  assert.equal(direct.version, '1.0');
  assert.equal(capsule2.version, '2.0');
  assert.deepEqual(core.adaptCapsuleV2ToV1(capsule2), direct);
  assert.equal(direct.asset_digest, capsule2.digests.runtime_entry_set.value);
  assert.notEqual(direct.asset_digest, capsule2.digests.asset.value);
});

test('C entry paths use UTF-8 byte order while JCS object keys retain UTF-16 order', () => {
  const bmpName = '\uE000.txt';
  const astralName = '\u{10000}.txt';
  const values = new Map([
    [astralName, Buffer.from('astral')],
    [bmpName, Buffer.from('bmp')],
  ]);
  const fakeAsset = {
    entries: new Map([...values.keys()].map((name) => [name, {}])),
    readEntry(name) {
      return values.get(name);
    },
  };
  const lines = [
    `${bmpName}:${sha256(values.get(bmpName)).slice('sha256:'.length)}`,
    `${astralName}:${sha256(values.get(astralName)).slice('sha256:'.length)}`,
  ];
  const expectedC = sha256(Buffer.from(lines.join('\n'), 'utf8'));
  const actualC = core.createKdnaAssetReader().contentDigestSync(fakeAsset);

  assert.equal(Buffer.compare(Buffer.from(bmpName), Buffer.from(astralName)) < 0, true);
  assert.equal([bmpName, astralName].sort()[0], astralName);
  assert.equal(actualC, expectedC);

  const vector = golden.jcs_vectors[0];
  assert.equal(core.canonicalizeJcs(vector.value), vector.canonical);
  assert.equal(core.canonicalizeJcs({ value: -0 }), '{"value":0}');
});

test('JCS rejects non-finite numbers, invalid Unicode, cyclic values, and non-JSON objects', () => {
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
  assert.throws(
    () => core.canonicalizeJcs({ date: new Date(0) }),
    (error) => error.code === 'KDNA_JCS_UNSUPPORTED_VALUE',
  );
});

test('external A/C/E mismatches remain evidence and fail with stable blocking codes', () => {
  const wrong = `sha256:${'0'.repeat(64)}`;
  const validators = schemaValidators();
  for (const [name, code] of [
    ['asset', 'KDNA_ASSET_DIGEST_MISMATCH'],
    ['content', 'KDNA_CONTENT_DIGEST_MISMATCH'],
    ['runtime_entry_set', 'KDNA_RUNTIME_ENTRY_SET_DIGEST_MISMATCH'],
  ]) {
    const expectedDigests = {
      [name]: { value: wrong, source: 'install_receipt' },
    };
    const evidence = core.computeDigestEvidence(GOLDEN_BYTES, { expectedDigests });
    assert.equal(evidence[name].comparison.state, 'mismatched');
    assert.equal(evidence[name].comparison.against, 'external_expected');
    assert.equal(validators.evidence(evidence), true, JSON.stringify(validators.evidence.errors));
    assert.throws(
      () => core.loadCapsuleV2(GOLDEN_BYTES, { expectedDigests }),
      (error) => error.code === code,
    );
  }
});

test('successful Capsule 2 schema rejects mismatched/unavailable evidence and v1 digest fields', () => {
  const validators = schemaValidators();
  for (const mutate of [
    (capsule) => {
      capsule.digests.asset.comparison.state = 'mismatched';
    },
    (capsule) => {
      capsule.digests.asset.value = null;
      capsule.digests.asset.comparison.state = 'unavailable';
    },
    (capsule) => {
      capsule.asset_digest = capsule.digests.runtime_entry_set.value;
    },
    (capsule) => {
      capsule.domain = capsule.asset.asset_id;
    },
  ]) {
    const candidate = structuredClone(golden.capsule_2);
    mutate(candidate);
    assert.equal(validators.capsule2(candidate), false);
  }
});

test('legacy digest declaration sources are reported honestly', () => {
  assert.equal(
    core.computeDigestEvidence(GOLDEN_BYTES).runtime_entry_set.comparison.source,
    'checksums.json.asset_digest',
  );

  const fixture = withModifiedSource((source) => {
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.authoring = { content_digest: `sha256:${'0'.repeat(64)}` };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  });
  try {
    fs.rmSync(path.join(fixture.source, 'checksums.json'));
    core.pack(fixture.source, fixture.assetPath);
    const first = core.computeDigestEvidence(fixture.assetPath);
    const manifestPath = path.join(fixture.source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.authoring.content_digest = first.content.value;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    core.pack(fixture.source, fixture.assetPath);

    const evidence = core.computeDigestEvidence(fixture.assetPath);
    assert.equal(evidence.content.comparison.state, 'matched');
    assert.equal(evidence.content.comparison.source, 'kdna.json.authoring.content_digest');
  } finally {
    fixture.cleanup();
  }
});

test('compatibility.capsule_1_domain preserves only a distinct legacy v1 domain', () => {
  const fixture = withModifiedSource((source) => {
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.name = '@legacy/editorial';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  });
  try {
    const capsule2 = core.loadCapsuleV2(fixture.assetPath, {
      loadedAt: golden.loaded_at,
    });
    const capsule1 = core.adaptCapsuleV2ToV1(capsule2);
    assert.equal(capsule2.asset.asset_id, 'kdna:example:agent-project-context');
    assert.deepEqual(capsule2.compatibility, {
      capsule_1_domain: '@legacy/editorial',
    });
    assert.equal(capsule1.domain, '@legacy/editorial');
  } finally {
    fixture.cleanup();
  }
});

test('Capsule 2 rejects authoring directories before projection', () => {
  assert.throws(
    () => core.loadCapsuleV2(SOURCE),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
});
