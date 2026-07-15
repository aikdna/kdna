const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');
const Ajv2020 = require('ajv/dist/2020.js');

const core = require('../src');
const fixture = require('./fixtures/golden-single-asset.json');
const canonicalPayloadSchema = require('../../../schema/payload-profile-v1.schema.json');
const packagedPayloadSchema = require('../schema/payload-profile-v1.schema.json');

const SCOPED_FIELDS = ['worldview', 'value_order', 'judgment_role'];
const CANONICAL_SCHEMA_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'schema',
  'payload-profile-v1.schema.json',
);
const PACKAGED_SCHEMA_PATH = path.resolve(
  __dirname,
  '..',
  'schema',
  'payload-profile-v1.schema.json',
);
const GOLDEN_PAYLOAD_PATH = path.resolve(
  __dirname,
  'fixtures',
  'golden-single-asset-payload.kdnab',
);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function compileSchema(schema) {
  return new Ajv2020({ allErrors: true, strict: false }).compile(schema);
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
      load_contract_valid: true,
      overall_valid: true,
      problems: [],
    });

    const inspected = core.inspect(asset);
    assert.deepEqual(inspected, {
      kdna_version: '1.0',
      asset_id: fixture.manifest.asset_id,
      asset_uid: fixture.manifest.asset_uid,
      asset_type: fixture.manifest.asset_type,
      title: fixture.manifest.title,
      version: fixture.manifest.version,
      judgment_version: fixture.manifest.judgment_version,
      payload: 'payload.kdnab',
      payload_encrypted: false,
      profile: 'judgment-profile-v1',
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
      self_checks: fixture.payload.reasoning.self_check,
      failure_modes: [],
      patterns: [],
    });
    assert.equal(capsule.type, 'kdna.context.capsule');
    assert.equal(capsule.domain, fixture.manifest.asset_id);
    assert.equal(capsule.judgment_version, fixture.manifest.judgment_version);
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
    fixturePayloads.push([
      `authorization/${name}/payload.kdnab`,
      fs.readFileSync(path.join(authorizationRoot, name, 'payload.kdnab')),
    ]);
  }

  const capsuleRoot = path.join(REPO_ROOT, 'conformance', 'capsule-v2');
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

test('compact projection does not trim strings, reorder values, or normalize role shape', () => {
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

  const { temporary, asset } = createAsset(payload);
  try {
    assert.equal(core.validate(asset).overall_valid, true);
    const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
    assert.deepEqual(capsule.context.worldview, payload.core.worldview);
    assert.deepEqual(capsule.context.value_order, payload.core.value_order);
    assert.deepEqual(capsule.context.judgment_role, payload.core.judgment_role);
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
      profile: 'judgment-profile-v1',
      core: { highest_question: '', axioms: [], ...scopedCore },
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
    profile: 'judgment-profile-v1',
    core: { highest_question: '', axioms: [], judgment_role: {} },
  };
  const { temporary, asset } = createAsset(emptyRolePayload);
  try {
    assert.equal(core.validate(asset).overall_valid, true);
    const prompt = core.loadAuthorized(asset, { profile: 'compact', as: 'prompt' });
    assert.ok(prompt.text.includes('No content available'));
    assert.equal(prompt.text.includes('Judgment role:'), false);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
