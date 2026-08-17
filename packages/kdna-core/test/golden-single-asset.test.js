const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');
const JsonSchema2020 = require('ajv/dist/2020.js');

const core = require('../src');
const fixture = require('./fixtures/golden-single-asset.json');
const minimalFormatFixture = require('./fixtures/core-format-minimal.json');
const officialCreationOutputFixture = require('./fixtures/official-creation-output.json');
const canonicalPayloadSchema = require('../../../schema/payload-profile.schema.json');
const packagedPayloadSchema = require('../schema/payload-profile.schema.json');
const canonicalManifestSchema = require('../../../schema/manifest.schema.json');
const packagedManifestSchema = require('../schema/manifest.schema.json');
const loadContractSchema = require('../../../schema/load-contract.schema.json');

const SCOPED_FIELDS = ['worldview', 'value_order', 'judgment_role'];
const CANONICAL_SCHEMA_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'schema',
  'payload-profile.schema.json',
);
const PACKAGED_SCHEMA_PATH = path.resolve(
  __dirname,
  '..',
  'schema',
  'payload-profile.schema.json',
);
const GOLDEN_PAYLOAD_PATH = path.resolve(
  __dirname,
  'fixtures',
  'golden-single-asset-payload.kdnab',
);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const AUTHORIZATION_FIXTURE_PASSWORD = 'KDNA-AUTHORIZATION-CONFORMANCE-2026';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compileSchema(schema) {
  return new JsonSchema2020({ allErrors: true, strict: false }).compile(schema);
}

function compileManifestSchema(schema) {
  const ajv = new JsonSchema2020({ allErrors: true, strict: false });
  ajv.addSchema(loadContractSchema);
  return ajv.compile(schema);
}

function createAsset(payload = fixture.payload, payloadBytes = null) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-golden-core-'));
  const source = path.join(temporary, 'source');
  const asset = path.join(temporary, 'golden.kdna');
  fs.mkdirSync(source, { recursive: true });
  fs.writeFileSync(path.join(source, 'mimetype'), core.MIMETYPE);
  fs.writeFileSync(path.join(source, 'kdna.json'), JSON.stringify(fixture.manifest));
  fs.writeFileSync(
    path.join(source, 'payload.kdnab'),
    payloadBytes === null ? cbor.encode(payload) : payloadBytes,
  );
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    JSON.stringify(core.buildChecksums(source)),
  );
  core.pack(source, asset);
  return { temporary, asset };
}

function createBoundaryAsset(definition) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-boundary-core-'));
  const source = path.join(temporary, 'source');
  const asset = path.join(temporary, `${definition.fixture_id}.kdna`);
  fs.mkdirSync(source, { recursive: true });

  const payloadBytes = cbor.encode(definition.payload);
  const manifest = clone(definition.manifest);
  if (definition.writer_profile === 'official-creation-output') {
    manifest.payload.digest =
      `sha256:${crypto.createHash('sha256').update(payloadBytes).digest('hex')}`;
  }

  fs.writeFileSync(path.join(source, 'mimetype'), core.MIMETYPE);
  fs.writeFileSync(path.join(source, 'kdna.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(source, 'payload.kdnab'), payloadBytes);
  if (definition.expected_entry_names.includes('checksums.json')) {
    fs.writeFileSync(
      path.join(source, 'checksums.json'),
      JSON.stringify(core.buildChecksums(source)),
    );
  }
  core.pack(source, asset);
  return { temporary, source, asset, manifest };
}

test('canonical and packaged payload schemas are byte-for-byte identical', () => {
  assert.deepEqual(
    fs.readFileSync(PACKAGED_SCHEMA_PATH),
    fs.readFileSync(CANONICAL_SCHEMA_PATH),
  );
  assert.deepEqual(packagedPayloadSchema, canonicalPayloadSchema);

  const canonicalCore = canonicalPayloadSchema.properties.core.properties;
  const packagedCore = packagedPayloadSchema.properties.core.properties;

  for (const field of SCOPED_FIELDS) {
    assert.deepEqual(packagedCore[field], canonicalCore[field]);
  }

  for (const [name, schema] of [
    ['canonical', canonicalPayloadSchema],
    ['packaged', packagedPayloadSchema],
  ]) {
    const validate = compileSchema(schema);
    assert.equal(validate(fixture.payload), true, `${name}: ${JSON.stringify(validate.errors)}`);
  }
});

test('current manifest schemas reject every legacy asset-signature declaration', () => {
  assert.deepEqual(canonicalManifestSchema, packagedManifestSchema);
  for (const schema of [canonicalManifestSchema, packagedManifestSchema]) {
    const validate = compileManifestSchema(schema);
    for (const field of ['signature', 'signatures']) {
      const manifest = clone(fixture.manifest);
      manifest[field] = field === 'signature' ? 'ed25519:legacy' : ['signatures/legacy.json'];
      assert.equal(validate(manifest), false, `${field}: ${JSON.stringify(validate.errors)}`);
    }
  }
});

test('public container documents keep checksums optional under one authority', () => {
  const specification = fs.readFileSync(path.join(REPO_ROOT, 'SPEC.md'), 'utf8');
  const containerSpec = fs.readFileSync(path.join(REPO_ROOT, 'specs', 'container.md'), 'utf8');
  const creationBoundary = fs.readFileSync(
    path.join(REPO_ROOT, 'specs', 'creation-output-boundary.md'),
    'utf8',
  );
  const importSecurity = fs.readFileSync(
    path.join(REPO_ROOT, 'specs', 'kdna-import-security.md'),
    'utf8',
  );
  const fileFormat = fs.readFileSync(path.join(REPO_ROOT, 'specs', 'kdna-file-format.md'), 'utf8');
  const coreFileFormat = fs.readFileSync(
    path.join(REPO_ROOT, 'docs', 'core', 'file-format.md'),
    'utf8',
  );

  const specificationRequired = specification.match(
    /Required protocol entries are:[\s\S]*?Optional protocol entries are:/,
  );
  assert.ok(specificationRequired);
  assert.doesNotMatch(specificationRequired[0], /`checksums\.json`/);
  assert.match(specification, /The absence of `checksums\.json` is not a format error/);
  assert.match(containerSpec, /### 3\.2 Optional[\s\S]*`checksums\.json`/);
  assert.match(containerSpec, /The absence of `checksums\.json` is not a format error/);
  assert.match(importSecurity, /authoritative current entry classification[\s\S]*container\.md/);
  assert.match(importSecurity, /`checksums\.json` is optional at the protocol layer/);
  assert.match(fileFormat, /`checksums\.json` is optional in the protocol/);
  assert.match(coreFileFormat, /Its absence is\s+not a Core format error/);
  assert.match(creationBoundary, /three required\s+protocol entries/);
  assert.match(creationBoundary, /canonical four-entry baseline/);
});

test('public contracts keep highest_question optional for Core and explicit for official writers', () => {
  const specification = fs.readFileSync(path.join(REPO_ROOT, 'SPEC.md'), 'utf8');
  const containerSpec = fs.readFileSync(path.join(REPO_ROOT, 'specs', 'container.md'), 'utf8');
  const creationBoundary = fs.readFileSync(
    path.join(REPO_ROOT, 'specs', 'creation-output-boundary.md'),
    'utf8',
  );

  assert.match(specification, /`highest_question` is an optional authoring concept/);
  assert.match(containerSpec, /highest_question\?: string/);
  assert.match(creationBoundary, /`core\.highest_question` is also optional for Core format validity/);
  assert.match(creationBoundary, /MUST NOT derive `highest_question` from the first axiom/);
  assert.match(creationBoundary, /Core owns only Format Valid and MUST NOT report/);
  assert.match(creationBoundary, /Judgment Accepted or Application Verified/);
});

test('three-entry fixture without highest_question is Core Format Valid', () => {
  const created = createBoundaryAsset(minimalFormatFixture);
  try {
    const layout = core.readLayout(created.asset);
    assert.deepEqual(
      layout.entries.map((entry) => entry.name).sort(),
      [...minimalFormatFixture.expected_entry_names].sort(),
    );
    assert.equal(Object.hasOwn(layout.map, 'checksums.json'), false);

    const validation = core.validate(created.asset);
    assert.equal(validation.overall_valid, true, validation.problems.join('\n'));
    assert.equal(validation.checksums_valid, true);

    const full = core.loadAuthorized(created.asset, { profile: 'full', as: 'json' });
    assert.equal(
      Object.hasOwn(full.context.payload.core, 'highest_question'),
      false,
    );
    assert.deepEqual(full.context.payload, minimalFormatFixture.payload);
  } finally {
    fs.rmSync(created.temporary, { recursive: true, force: true });
  }
});

test('official Creation Writer fixture emits four entries and explicit scoped semantics', () => {
  const created = createBoundaryAsset(officialCreationOutputFixture);
  try {
    const layout = core.readLayout(created.asset);
    assert.deepEqual(
      layout.entries.map((entry) => entry.name).sort(),
      [...officialCreationOutputFixture.expected_entry_names].sort(),
    );
    assert.equal(core.inspect(created.asset).checksums_present, true);

    const validation = core.validate(created.asset);
    assert.equal(validation.overall_valid, true, validation.problems.join('\n'));

    const full = core.loadAuthorized(created.asset, { profile: 'full', as: 'json' });
    for (const field of [
      'highest_question',
      'worldview',
      'value_order',
      'judgment_role',
      'boundaries',
    ]) {
      assert.deepEqual(
        full.context.payload.core[field],
        officialCreationOutputFixture.payload.core[field],
        field,
      );
    }
    assert.deepEqual(full.context.payload, officialCreationOutputFixture.payload);
    assert.equal(officialCreationOutputFixture.creation_status, 'not-assessed');
    assert.equal(Object.hasOwn(full.context.manifest, 'creation_status'), false);
    assert.equal(
      JSON.stringify(full.context).includes('human_lock'),
      false,
      'synthetic official output must not invent human confirmation',
    );
  } finally {
    fs.rmSync(created.temporary, { recursive: true, force: true });
  }
});

test('payload schemas reject empty judgment shells without requiring a human author', () => {
  const invalidPayloads = [
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: { axioms: [] },
    },
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: { highest_question: '   ', axioms: ['   '] },
    },
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: { axioms: [{ id: 'label-only' }], judgment_role: {} },
    },
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: {
        axioms: ['A statement without a declared scope is insufficient.'],
        judgment_role: { internal_note: 'not a scope declaration' },
      },
    },
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: {
        axioms: ['An arbitrary nonempty object is not a boundary.'],
        boundaries: [{ internal_note: null }],
      },
    },
    {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: {
        axioms: [{
          statement: 'Whitespace is not an applicability boundary.',
          applies_when: ['   '],
        }],
      },
    },
  ];
  const authorNeutralPayload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      axioms: [{
        statement: 'Prefer the reversible option while evidence remains incomplete.',
        applies_when: ['choosing between reversible and irreversible actions'],
      }],
    },
  };

  for (const schema of [canonicalPayloadSchema, packagedPayloadSchema]) {
    const validate = compileSchema(schema);
    for (const payload of invalidPayloads) {
      assert.equal(validate(payload), false, JSON.stringify(validate.errors));
    }
    assert.equal(validate(authorNeutralPayload), true, JSON.stringify(validate.errors));
  }
});

test('payload schemas reject malformed scoped judgment field shapes', () => {
  const invalidCases = [
    ['worldview is not an array', (payload) => { payload.core.worldview = 'facts'; }],
    ['worldview contains a non-string', (payload) => { payload.core.worldview[1] = 4; }],
    ['value_order is not an array', (payload) => { payload.core.value_order = {}; }],
    ['value_order contains a non-string', (payload) => { payload.core.value_order[1] = false; }],
    ['judgment_role is not an object', (payload) => { payload.core.judgment_role = []; }],
    ['acts_as is not a string', (payload) => { payload.core.judgment_role.acts_as = 3; }],
    [
      'does_not_act_as contains a non-string',
      (payload) => { payload.core.judgment_role.does_not_act_as[1] = false; },
    ],
    [
      'responsibility is not a string',
      (payload) => { payload.core.judgment_role.responsibility = []; },
    ],
  ];

  for (const [schemaName, schema] of [
    ['canonical', canonicalPayloadSchema],
    ['packaged', packagedPayloadSchema],
  ]) {
    const validate = compileSchema(schema);
    for (const [caseName, mutate] of invalidCases) {
      const payload = clone(fixture.payload);
      mutate(payload);
      assert.equal(
        validate(payload),
        false,
        `${schemaName} schema accepted invalid case: ${caseName}`,
      );
    }
  }
});

test('payload schemas reject deprecated or malformed self-check fields', () => {
  const invalidCases = [
    [
      'deprecated plural field',
      (payload) => {
        payload.reasoning = { self_checks: ['Did I use the deprecated field?'] };
      },
    ],
    ['singular field is not an array', (payload) => { payload.reasoning.self_check = {}; }],
    ['singular field contains a number', (payload) => { payload.reasoning.self_check = [42]; }],
    [
      'structured question is missing question',
      (payload) => { payload.reasoning.self_check = [{ failure_risk: 'missing question' }]; },
    ],
    [
      'structured question is not a string',
      (payload) => { payload.reasoning.self_check = [{ question: 42 }]; },
    ],
  ];

  for (const [schemaName, schema] of [
    ['canonical', canonicalPayloadSchema],
    ['packaged', packagedPayloadSchema],
  ]) {
    const validate = compileSchema(schema);
    for (const [caseName, mutate] of invalidCases) {
      const payload = clone(fixture.payload);
      mutate(payload);
      assert.equal(
        validate(payload),
        false,
        `${schemaName} schema accepted invalid case: ${caseName}`,
      );
    }
  }
});

test('Core validation and loading fail closed for deprecated or malformed self-checks', () => {
  const invalidCases = [
    (payload) => {
      payload.reasoning = { self_checks: ['Did I use the deprecated field?'] };
    },
    (payload) => { payload.reasoning.self_check = [42]; },
    (payload) => { payload.reasoning.self_check = [{ question: 42 }]; },
  ];

  for (const mutate of invalidCases) {
    const payload = clone(fixture.payload);
    mutate(payload);
    const { temporary, asset } = createAsset(payload);
    try {
      const validation = core.validate(asset);
      assert.equal(validation.payload_valid, false);
      assert.equal(validation.overall_valid, false);
      assert.throws(
        () => core.loadAuthorized(asset, { profile: 'compact', as: 'json' }),
        /LoadPlan denied loading/u,
      );
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
});

test('committed CBOR validates and loads exact self-check shapes without silent loss', () => {
  const goldenPayloadBytes = fs.readFileSync(GOLDEN_PAYLOAD_PATH);
  assert.deepEqual(cbor.decode(goldenPayloadBytes), fixture.payload);

  const { temporary, asset } = createAsset(fixture.payload, goldenPayloadBytes);
  try {
    const validation = core.validate(asset);
    assert.deepEqual(validation, {
      format_valid: true,
      schema_valid: true,
      payload_valid: true,
      checksums_valid: true,
      signature_valid: true,
      signature_state: 'absent',
      signature_evidence: null,
      load_contract_valid: true,
      loader_version: '0.22.0',
      min_loader_version: '0.20.0',
      loader_compatible: true,
      overall_valid: true,
      problems: [],
    });

    const inspected = core.inspect(asset);
    assert.deepEqual(inspected, {
      format_version: '0.1.0',
      asset_id: fixture.manifest.asset_id,
      asset_uid: fixture.manifest.asset_uid,
      asset_type: fixture.manifest.asset_type,
      title: fixture.manifest.title,
      version: fixture.manifest.version,
      judgment_version: fixture.manifest.judgment_version,
      payload: 'payload.kdnab',
      payload_encrypted: false,
      profile: 'kdna.payload.judgment',
      loader_version: '0.22.0',
      min_loader_version: '0.20.0',
      loader_compatible: true,
      load_contract_default_profile: 'compact',
      checksums_present: true,
    });
    for (const field of ['highest_question', ...SCOPED_FIELDS, 'axioms']) {
      assert.equal(Object.hasOwn(inspected, field), false);
    }

    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    const [axiom] = fixture.payload.core.axioms;
    assert.deepEqual(capsule.context, {
      highest_question: fixture.payload.core.highest_question,
      worldview: fixture.payload.core.worldview,
      value_order: fixture.payload.core.value_order,
      judgment_role: fixture.payload.core.judgment_role,
      axioms: [
        {
          type: 'axiom_applicability',
          id: axiom.id,
          statement: axiom.one_sentence,
          one_sentence: axiom.one_sentence,
          applies_when: axiom.applies_when,
          does_not_apply_when: axiom.does_not_apply_when,
          failure_risk: axiom.failure_risk,
        },
      ],
      boundaries: fixture.payload.core.boundaries,
      core_structure: [],
      self_checks: fixture.payload.reasoning.self_check,
      failure_modes: [],
      patterns: [],
    });
    assert.equal(capsule.type, 'kdna.runtime-capsule');
    assert.equal(capsule.contract_version, '0.1.0');
    assert.equal(capsule.asset.asset_id, fixture.manifest.asset_id);
    assert.equal(capsule.asset.judgment_version, fixture.manifest.judgment_version);
    assert.equal(capsule.trace.schema_valid, true);

    const full = core.loadAuthorized(asset, { profile: 'full', as: 'json' });
    assert.deepEqual(full.context.payload, fixture.payload);

    const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
    assert.ok(prompt.text.includes(fixture.payload.core.highest_question));
    for (const value of [
      ...fixture.payload.core.worldview,
      ...fixture.payload.core.value_order,
      fixture.payload.core.judgment_role.acts_as,
      ...fixture.payload.core.judgment_role.does_not_act_as,
      fixture.payload.core.judgment_role.responsibility,
      fixture.payload.reasoning.self_check[0],
      fixture.payload.reasoning.self_check[1].question,
    ]) {
      assert.ok(prompt.text.includes(value), `prompt omitted declared value: ${value}`);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('committed cross-language payload fixtures use only the canonical self-check field', () => {
  const fixturePayloads = [
    [
      'examples/minimal/payload.kdnab',
      fs.readFileSync(path.join(REPO_ROOT, 'examples', 'minimal', 'payload.kdnab')),
    ],
    ['golden-single-asset-payload.kdnab', fs.readFileSync(GOLDEN_PAYLOAD_PATH)],
  ];
  const authorizationRoot = path.join(
    REPO_ROOT,
    'conformance',
    'authorization',
    'fixtures',
  );
  for (const name of fs.readdirSync(authorizationRoot).sort()) {
    const fixtureRoot = path.join(authorizationRoot, name);
    const manifest = JSON.parse(fs.readFileSync(path.join(fixtureRoot, 'kdna.json'), 'utf8'));
    let encoded = fs.readFileSync(path.join(fixtureRoot, manifest.payload.path));
    if (manifest.payload.encrypted === true) {
      encoded = core.decryptProtectedEntry(cbor.decode(encoded), {
        entryName: manifest.payload.path,
        manifest,
        password: AUTHORIZATION_FIXTURE_PASSWORD,
      });
    }
    fixturePayloads.push([
      `authorization/${name}/payload.kdnab`,
      encoded,
    ]);
  }

  const capsuleRoot = path.join(REPO_ROOT, 'conformance', 'runtime-capsule');
  const capsuleGolden = JSON.parse(
    fs.readFileSync(path.join(capsuleRoot, 'golden.json'), 'utf8'),
  );
  const capsuleBytes = Buffer.from(
    fs.readFileSync(path.join(capsuleRoot, capsuleGolden.fixture), 'utf8').trim(),
    'base64',
  );
  const asset = core.createKdnaAssetReader().openSync(capsuleBytes);
  fixturePayloads.push(['capsule fixture payload', asset.readEntry('payload.kdnab')]);

  for (const [name, encoded] of fixturePayloads) {
    const payload = cbor.decode(encoded);
    assert.equal(Object.hasOwn(payload.reasoning, 'self_checks'), false, name);
    assert.equal(Object.hasOwn(payload.reasoning, 'self_check'), true, name);
    assert.equal(Array.isArray(payload.reasoning.self_check), true, name);
  }

  const capsule = core.loadAuthorized(capsuleBytes, { profile: 'compact', as: 'json' });
  assert.equal(Object.hasOwn(capsule.context, 'self_checks'), true);
  assert.equal(Object.hasOwn(capsule.context, 'self_check'), false);
});

test('compact projection preserves scoped fields and closed public relation order/shape', () => {
  const payloadProfile = fs.readFileSync(
    path.join(REPO_ROOT, 'docs', 'core', 'payload-profile.md'),
    'utf8',
  );
  const runtimeProjection = fs.readFileSync(
    path.join(REPO_ROOT, 'specs', 'kdna-runtime-projection.md'),
    'utf8',
  );
  assert.match(
    payloadProfile,
    /compact` projection preserves relation order and the closed\s+public shape/,
  );
  assert.match(
    runtimeProjection,
    /compact` profile[\s\S]*preserves the declared\s+order and closed public fields of `payload\.core\.core_structure`/,
  );

  const payload = clone(fixture.payload);
  payload.core.worldview = ['  Preserve declared spacing.  '];
  payload.core.value_order = [
    'second-looking value remains first',
    'first-looking value remains second',
  ];
  payload.core.judgment_role = {
    acts_as: '  a deliberately spaced authority  ',
    does_not_act_as: '  a single declared exclusion  ',
    responsibility: '  retain exact declared strings  ',
  };
  payload.core.core_structure = [
    {
      from: 'axiom-primary',
      to: 'axiom-secondary',
      via: 'priority',
    },
    {
      from: 'boundary-exception',
      to: 'axiom-primary',
      via: 'exception',
    },
  ];

  const { temporary, asset } = createAsset(payload);
  try {
    assert.equal(core.validate(asset).overall_valid, true);
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    assert.deepEqual(capsule.context.worldview, payload.core.worldview);
    assert.deepEqual(capsule.context.value_order, payload.core.value_order);
    assert.deepEqual(capsule.context.judgment_role, payload.core.judgment_role);
    assert.deepEqual(capsule.context.core_structure, payload.core.core_structure);
    assert.equal(
      capsule.trace.projection_report.omitted.some(
        (entry) => entry.path.startsWith('/core/core_structure'),
      ),
      false,
    );

    const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
    assert.match(prompt.text, /Judgment relations:/);
    assert.match(prompt.text, /axiom-primary --priority--> axiom-secondary/);
    assert.match(prompt.text, /boundary-exception --exception--> axiom-primary/);
    assert.doesNotMatch(prompt.text, /private relation (?:reason|resolution)/i);

    const full = core.loadAuthorized(asset, { profile: 'full', as: 'json' });
    assert.deepEqual(
      full.context.payload.core.core_structure,
      payload.core.core_structure,
    );
    for (const relation of [
      ...full.context.payload.core.core_structure,
      ...capsule.context.core_structure,
    ]) {
      assert.equal(Object.hasOwn(relation, 'rationale'), false);
      assert.equal(Object.hasOwn(relation, 'resolution'), false);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('private Creation fields cannot enter a Runtime relation', () => {
  const hostileFields = {
    id: 'private-relation-id',
    rationale: 'PRIVATE RELATION REASON MUST NOT ENTER RUNTIME',
    resolution: 'PRIVATE RELATION RESOLUTION MUST NOT ENTER RUNTIME',
    creation_mode: 'human-confirmed',
    confirmation_receipt_ids: ['receipt-private'],
    private_creation_state: { accepted: true },
  };
  for (const [field, value] of Object.entries(hostileFields)) {
    const payload = clone(fixture.payload);
    payload.core.core_structure = [{
      from: 'axiom-primary',
      to: 'axiom-secondary',
      via: 'priority',
      [field]: value,
    }];
    const { temporary, asset } = createAsset(payload);
    try {
      const validation = core.validate(asset);
      assert.equal(validation.overall_valid, false, field);
      assert.equal(validation.payload_valid, false, field);
      assert.match(
        validation.problems.join('\n'),
        /core_structure.*must NOT have additional properties/,
        field,
      );
      for (const request of [
        { profile: 'full', as: 'json' },
        { profile: 'compact', as: 'json' },
        { profile: 'compact', as: 'prompt' },
      ]) {
        assert.throws(
          () => core.loadAuthorized(asset, request),
          /LoadPlan denied loading/i,
          `${field}:${request.profile}:${request.as}`,
        );
      }
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
});

test('unknown Runtime relation values fail closed before every projection', () => {
  const payload = clone(fixture.payload);
  payload.core.core_structure = [{
    from: 'axiom-primary',
    to: 'axiom-secondary',
    via: 'support',
  }];
  const { temporary, asset } = createAsset(payload);
  try {
    const validation = core.validate(asset);
    assert.equal(validation.overall_valid, false);
    assert.equal(validation.payload_valid, false);
    assert.match(
      validation.problems.join('\n'),
      /core_structure.*must be equal to one of the allowed values/,
    );
    for (const request of [
      { profile: 'full', as: 'json' },
      { profile: 'compact', as: 'json' },
      { profile: 'compact', as: 'prompt' },
    ]) {
      assert.throws(
        () => core.loadAuthorized(asset, request),
        /LoadPlan denied loading/i,
      );
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('prompt treats each scoped field as content but does not render an empty role', () => {
  const variants = [
    [
      'worldview',
      { worldview: ['Scoped worldview remains available.'] },
      'Scoped worldview remains available.',
    ],
    [
      'value_order',
      { value_order: ['first declared value', 'second declared value'] },
      'first declared value',
    ],
    [
      'judgment_role',
      { judgment_role: { responsibility: 'Resolve the scoped tradeoff.' } },
      'Resolve the scoped tradeoff.',
    ],
  ];

  for (const [name, scopedCore, expectedText] of variants) {
    const payload = {
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
      core: {
        highest_question: 'Which scoped choice applies?',
        axioms: ['Prefer the declared scoped choice.'],
        ...scopedCore,
      },
    };
    const { temporary, asset } = createAsset(payload);
    try {
      assert.equal(core.validate(asset).overall_valid, true, name);
      const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
      assert.equal(prompt.text.includes('No content available'), false, name);
      assert.ok(prompt.text.includes(expectedText), name);
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }

  const emptyRolePayload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      axioms: ['A statement without scope is not enough for this payload.'],
      judgment_role: {},
    },
  };
  const { temporary, asset } = createAsset(emptyRolePayload);
  try {
    assert.equal(core.validate(asset).overall_valid, false);
    assert.throws(
      () => core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' }),
      /LoadPlan denied loading/,
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('compact projection preserves every declared pattern', () => {
  const payload = clone(fixture.payload);
  payload.patterns = [1, 2, 3, 4, 5].map((number) => ({
    type: 'pattern',
    text: `Pattern ${number}`,
  }));
  const { temporary, asset } = createAsset(payload);
  try {
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    assert.equal(capsule.context.patterns.length, 5);
    assert.deepEqual(capsule.context.patterns, payload.patterns);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('compact projection reports every non-empty omitted payload path and count', () => {
  const payload = clone(fixture.payload);
  payload.core.ontology = [{ id: 'concept-1' }, { id: 'concept-2' }];
  payload.core.risk_model = {
    risks: [{ id: 'risk-1' }, { id: 'risk-2' }],
  };
  payload.reasoning.reasoning_chains = [{ id: 'chain-1' }];
  payload.scenarios = [{ id: 'scenario-1' }, { id: 'scenario-2' }];
  payload.cases = [{ id: 'case-1' }];
  payload.evolution = {
    changelog: [{ version: '1.0.0' }],
    version_notes: ['note one', 'note two'],
  };

  const { temporary, asset } = createAsset(payload);
  try {
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    const report = capsule.trace.projection_report;
    assert.equal(report.status, 'partial');
    assert.deepEqual(Object.fromEntries(report.omitted.map(({ path: itemPath, count }) => [itemPath, count])), {
      '/cases': 1,
      '/core/axioms/*/confidence': 1,
      '/core/axioms/*/full_statement': 1,
      '/core/axioms/*/why': 1,
      '/core/ontology': 2,
      '/core/risk_model/risks': 2,
      '/evolution/changelog': 1,
      '/evolution/version_notes': 2,
      '/reasoning/reasoning_chains': 1,
      '/scenarios': 2,
    });
    assert.equal(report.omitted_total, 14);

    const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
    assert.match(prompt.text, /Projection completeness: partial/);
    for (const entry of report.omitted) {
      assert.ok(prompt.text.includes(`${entry.path} (${entry.count})`), entry.path);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('compact projection declares structural omission and never trims axiom applicability text', () => {
  const fullStatement = `Keep every declared character ${'x'.repeat(180)}`;
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'What must remain exact?',
      axioms: [{
        full_statement: fullStatement,
        applies_when: ['first condition', 'second condition', 'third condition'],
        does_not_apply_when: ['first exclusion', 'second exclusion', 'third exclusion'],
      }],
    },
    patterns: [],
    reasoning: { self_check: [], failure_modes: [] },
  };

  const { temporary, asset } = createAsset(payload);
  try {
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    assert.equal(capsule.context.axioms[0].one_sentence, fullStatement);
    assert.deepEqual(capsule.trace.projection_report, {
      status: 'partial',
      omitted: [{ path: '/core/axioms/*/full_statement', count: 1 }],
      omitted_total: 1,
    });

    const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
    assert.ok(prompt.text.includes(fullStatement));
    assert.ok(prompt.text.includes('third condition'));
    assert.ok(prompt.text.includes('third exclusion'));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('compact projection explicitly reports complete when it omits no non-empty content path', () => {
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'What is the smallest complete projection?',
      axioms: ['Preserve the declared compact judgment.'],
    },
    patterns: [],
    reasoning: { self_check: [], failure_modes: [] },
    evolution: { changelog: [], version_notes: [] },
  };

  const { temporary, asset } = createAsset(payload);
  try {
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    assert.deepEqual(capsule.trace.projection_report, {
      status: 'complete',
      omitted: [],
      omitted_total: 0,
    });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
