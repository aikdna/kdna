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

test('non-minimal Capsule 1 extensions survive build and adapter parity exactly', () => {
  const direct = core.loadAuthorized(GOLDEN_BYTES, { profile: 'compact', as: 'json' });
  direct.trace.loaded_at = golden.loaded_at;
  direct.extends_chain = [
    { name: '@example/base', version: '1.2.3', path: '/fixtures/base.kdna' },
  ];
  direct.inheritance_applied = true;
  direct.resolved_dependencies = [
    {
      name: '@example/reference',
      version: '2.0.0',
      path: '/fixtures/reference.kdna',
      rag_namespace: '@example/reference@2.0.0',
      status: 'loaded',
      profile: 'compact',
      content: { axioms: [{ id: 'dep-1', one_sentence: 'Dependency judgment.' }] },
    },
  ];
  direct.rag_isolation_policy = {
    default: 'fenced',
    cross_namespace_blocked: true,
    namespaces: ['@example/reference@2.0.0'],
  };

  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(GOLDEN_BYTES);
  const capsule2 = core.buildCapsuleV2({
    capsule1: direct,
    manifest: reader.readManifestSync(asset),
    digests: core.computeDigestEvidence(GOLDEN_BYTES),
    inputKind: 'packaged_bytes',
    loadedAt: golden.loaded_at,
  });
  const validators = schemaValidators();

  assert.deepEqual(capsule2.compatibility.capsule_1_extensions, {
    extends_chain: direct.extends_chain,
    inheritance_applied: direct.inheritance_applied,
    resolved_dependencies: direct.resolved_dependencies,
    rag_isolation_policy: direct.rag_isolation_policy,
  });
  assert.deepEqual(core.adaptCapsuleV2ToV1(capsule2), direct);
  assert.equal(validators.capsule2(capsule2), true, JSON.stringify(validators.capsule2.errors));
});

test('all frozen Capsule 1 access aliases survive adapter parity without changing Capsule 2 access', () => {
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(GOLDEN_BYTES);
  const baseManifest = reader.readManifestSync(asset);
  const digests = core.computeDigestEvidence(GOLDEN_BYTES);
  const base = core.loadAuthorized(GOLDEN_BYTES, { profile: 'compact', as: 'json' });
  base.trace.loaded_at = golden.loaded_at;

  for (const [alias, canonical] of [
    ['open', 'public'],
    ['protected', 'licensed'],
    ['runtime', 'remote'],
  ]) {
    const direct = structuredClone(base);
    direct.access = alias;
    const manifest = { ...baseManifest, access: alias };
    const capsule2 = core.buildCapsuleV2({
      capsule1: direct,
      manifest,
      digests,
      inputKind: 'packaged_bytes',
      loadedAt: golden.loaded_at,
    });

    assert.equal(capsule2.access, canonical);
    assert.equal(capsule2.compatibility.capsule_1_access, alias);
    assert.deepEqual(core.adaptCapsuleV2ToV1(capsule2), direct);
  }
});

test('adapter rejects Capsule 1 access aliases paired with the wrong canonical access', () => {
  for (const [canonical, alias] of [
    ['public', 'protected'],
    ['licensed', 'runtime'],
    ['remote', 'open'],
  ]) {
    const candidate = structuredClone(golden.capsule_2);
    candidate.access = canonical;
    candidate.compatibility = {
      ...(candidate.compatibility || {}),
      capsule_1_access: alias,
    };

    assert.throws(
      () => core.adaptCapsuleV2ToV1(candidate),
      (error) => error.code === 'KDNA_CAPSULE_ADAPTER_INPUT_INVALID',
    );
  }
});

test('an asset without checksums still emits Capsule 1 E and has exact adapter parity', () => {
  const fixture = withModifiedSource(() => {});
  try {
    fs.rmSync(path.join(fixture.source, 'checksums.json'));
    core.pack(fixture.source, fixture.assetPath);
    const bytes = fs.readFileSync(fixture.assetPath);
    const reader = core.createKdnaAssetReader();
    const asset = reader.openSync(bytes);
    const expectedE = core.computeRuntimeEntrySetDigest(
      asset.readEntry('kdna.json'),
      asset.readEntry('payload.kdnab'),
    );
    const direct = core.loadAuthorized(bytes, { profile: 'compact', as: 'json' });
    direct.trace.loaded_at = golden.loaded_at;
    const capsule2 = core.loadCapsuleV2(bytes, {
      loadedAt: golden.loaded_at,
      profile: 'compact',
    });

    assert.equal(direct.asset_digest, expectedE);
    assert.equal(capsule2.digests.runtime_entry_set.value, expectedE);
    assert.equal(capsule2.digests.runtime_entry_set.comparison.state, 'not_compared');
    assert.deepEqual(core.adaptCapsuleV2ToV1(capsule2), direct);
  } finally {
    fixture.cleanup();
  }
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

test('JCS follows the RFC 8785 number and string serialization examples', () => {
  assert.equal(
    core.canonicalizeJcs({
      numbers: [333333333.33333329, 1e30, 4.5, 2e-3, 1e-27],
      literals: [null, true, false],
    }),
    '{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27]}',
  );
  assert.equal(
    core.canonicalizeJcs({ string: '\u000f\n"\\€' }),
    '{"string":"\\u000f\\n\\"\\\\€"}',
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

test('correct external C cannot hide a wrong internal C declaration', () => {
  const wrong = `sha256:${'0'.repeat(64)}`;
  const fixture = withModifiedSource((source) => {
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.content_digest = wrong;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  });
  try {
    const observed = core.computeDigestEvidence(fixture.assetPath);
    const expectedDigests = {
      content: { value: observed.content.value, source: 'install_receipt' },
    };
    const evidence = core.computeDigestEvidence(fixture.assetPath, { expectedDigests });
    assert.equal(evidence.content.comparison.state, 'mismatched');
    assert.equal(evidence.content.comparison.against, 'manifest_declaration');
    assert.throws(
      () => core.loadCapsuleV2(fixture.assetPath, { expectedDigests }),
      (error) => error.code === 'KDNA_CONTENT_DIGEST_MISMATCH',
    );
  } finally {
    fixture.cleanup();
  }
});

test('conflicting top-level and authoring C declarations fail closed', () => {
  const fixture = withModifiedSource((source) => {
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.content_digest = `sha256:${'0'.repeat(64)}`;
    manifest.authoring = {
      ...(manifest.authoring || {}),
      content_digest: `sha256:${'1'.repeat(64)}`,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  });
  try {
    assert.throws(
      () => core.computeDigestEvidence(fixture.assetPath),
      (error) => error.code === 'KDNA_CONTENT_DIGEST_DECLARATION_CONFLICT',
    );
  } finally {
    fixture.cleanup();
  }
});

test('correct external E cannot hide a wrong checksum declaration or alias conflict', () => {
  const wrong = `sha256:${'0'.repeat(64)}`;
  const fixture = withModifiedSource(() => {});
  try {
    const checksumPath = path.join(fixture.source, 'checksums.json');
    const checksums = JSON.parse(fs.readFileSync(checksumPath, 'utf8'));
    checksums.entry_set_digest = wrong;
    checksums.asset_digest = wrong;
    fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));
    core.pack(fixture.source, fixture.assetPath);

    const observed = core.computeDigestEvidence(fixture.assetPath);
    const expectedDigests = {
      runtime_entry_set: {
        value: observed.runtime_entry_set.value,
        source: 'install_receipt',
      },
    };
    const evidence = core.computeDigestEvidence(fixture.assetPath, { expectedDigests });
    assert.equal(evidence.runtime_entry_set.comparison.state, 'mismatched');
    assert.equal(evidence.runtime_entry_set.comparison.against, 'checksum_declaration');
    assert.throws(
      () => core.loadCapsuleV2(fixture.assetPath, { expectedDigests }),
      (error) => error.code === 'KDNA_CAPSULE_2_ASSET_INVALID',
    );

    checksums.entry_set_digest = observed.runtime_entry_set.value;
    checksums.asset_digest = wrong;
    fs.writeFileSync(checksumPath, JSON.stringify(checksums, null, 2));
    core.pack(fixture.source, fixture.assetPath);
    assert.throws(
      () => core.computeDigestEvidence(fixture.assetPath, { expectedDigests }),
      (error) => error.code === 'KDNA_RUNTIME_ENTRY_SET_DIGEST_DECLARATION_CONFLICT',
    );
  } finally {
    fixture.cleanup();
  }
});

test('external digest expectations reject internal declaration source labels', () => {
  const evidence = core.computeDigestEvidence(GOLDEN_BYTES);
  assert.throws(
    () => core.computeDigestEvidence(GOLDEN_BYTES, {
      expectedDigests: {
        asset: {
          value: evidence.asset.value,
          source: 'kdna.json.content_digest',
        },
      },
    }),
    (error) => error.code === 'KDNA_DIGEST_EXPECTATION_INVALID',
  );
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

test('public Capsule 2 builder and adapter reject incomplete success invariants', () => {
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(GOLDEN_BYTES);
  const manifest = reader.readManifestSync(asset);
  const digests = core.computeDigestEvidence(GOLDEN_BYTES);
  const direct = core.loadAuthorized(GOLDEN_BYTES, { profile: 'compact', as: 'json' });
  direct.trace.loaded_at = golden.loaded_at;
  const build = (candidate) => core.buildCapsuleV2({
    capsule1: candidate,
    manifest,
    digests,
    inputKind: 'packaged_bytes',
    loadedAt: golden.loaded_at,
  });

  for (const mutate of [
    (capsule) => { capsule.trace.schema_valid = false; },
    (capsule) => { capsule.trace.signature_state = 'not_checked'; },
    (capsule) => { capsule.profile = 'unknown'; },
    (capsule) => { capsule.access = 'secret'; },
  ]) {
    const candidate = structuredClone(direct);
    mutate(candidate);
    assert.throws(
      () => build(candidate),
      (error) => error.code === 'KDNA_CAPSULE_2_BUILD_INVALID',
    );
  }

  const capsule2 = core.loadCapsuleV2(GOLDEN_BYTES, {
    loadedAt: golden.loaded_at,
    profile: 'compact',
  });
  capsule2.trace.signature_state = 'not_checked';
  assert.throws(
    () => core.adaptCapsuleV2ToV1(capsule2),
    (error) => error.code === 'KDNA_CAPSULE_ADAPTER_INPUT_INVALID',
  );
});

test('Capsule 2 builder rejects Capsule 1 values unrelated to manifest identity, access, or E', () => {
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(GOLDEN_BYTES);
  const manifest = reader.readManifestSync(asset);
  const digests = core.computeDigestEvidence(GOLDEN_BYTES);
  const direct = core.loadAuthorized(GOLDEN_BYTES, { profile: 'compact', as: 'json' });
  direct.trace.loaded_at = golden.loaded_at;
  const build = (candidate) => core.buildCapsuleV2({
    capsule1: candidate,
    manifest,
    digests,
    inputKind: 'packaged_bytes',
    loadedAt: golden.loaded_at,
  });

  for (const mutate of [
    (capsule) => { capsule.domain = '@wrong/domain'; },
    (capsule) => { capsule.judgment_version = '9.9.9'; },
    (capsule) => { capsule.asset_digest = `sha256:${'0'.repeat(64)}`; },
    (capsule) => { capsule.access = 'licensed'; },
  ]) {
    const candidate = structuredClone(direct);
    mutate(candidate);
    assert.throws(
      () => build(candidate),
      (error) => error.code === 'KDNA_CAPSULE_2_BUILD_INVALID',
    );
  }
});

test('Capsule 2 rejects authoring directories before projection', () => {
  assert.throws(
    () => core.loadCapsuleV2(SOURCE),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
});
