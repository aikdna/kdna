import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const source = load('specs/public-semantic-source.json'),
  module = source.protection_admission;
// Keep the historical registered case name. Its B1 whole-source additive comparison
// was a one-time transition, not an invariant across R2 and RC7. These fixed hashes
// come from the preserved RC6 source, not from the current source under test.
const RC6_SCHEMA_SHA256 = {
  'schema/manifest-container-0.5.0-judgment-0.5.0.schema.json':
    '9544e27d1045bdbb0ecbc01928fecb1ee9e2f6db78c8c627b086c34838af4fae',
  'schema/payload-profile-0.5.schema.json':
    '1b56ea9288f91089500c3d288babd18287fd2db2bfcb127b9821d12add294814',
  'specs/canonical-ir-0.6.schema.json':
    '37aac664a5aeddcb9f133d8f39ee99256517c062af11830cb10e098977d86adb',
  'specs/read-contract-0.6.3.schema.json':
    '8b2b61274fbe504b96e86cb411e33d8790b56fd85f15d389e21969731b09721b',
  'schema/runtime-capsule-0.3.schema.json':
    '10a15aa7dc658128bbb8a3e347e577c780cc7ef93b7b69cc75ebf0fd61c2cdd2',
  'schema/consumption-plan-0.3.schema.json':
    '3c11c3ad1bac8de9952cc2efb7585e5f08a0b8fbb644277d6a698c028943ed09',
  'schema/agent-host-request-0.3.schema.json':
    'af52aca09fc3189070d451daba9fd4f61173a08eaf42b4d49914c90f1e8d770a',
  'schema/agent-host-receipt-0.3.schema.json':
    '9be937673e26341e7a9208dfef9fe822b494a44bb8f9b4bc174a2d960a75a7a1',
  'schema/judgment-trace-0.3.schema.json':
    '9b61a1c034141780c057fa17edec2a1309b8086aec147e05b5813035e925f018',
  'specs/protection-admission-r2-binding-6.schema.json':
    '6872b17f27540fff8d109fe5174d4755b3fd98c6283f51e869f9c2f9ff37b4ea',
  'specs/protected-source-r2-binding-6.schema.json':
    '6128c0eb8ad782b16f3690ee556aaeac9777e3334d0ead1c39b2f64ce675b5ff',
  'specs/external-grant-issuer-r2-binding-6.schema.json':
    '66f03c1ee0a567a7693f6aa6c0c30a6cce368f4beff462ba684ce45677de1a2c',
  'specs/read-transport-admission-0.2.schema.json':
    '5657316ede4018b7cbae1def965426b2d39a1435e23b295a1a5e9f480df4d8a2',
  'specs/package-set-node-0.2.schema.json':
    '425367de91e93bff2c3032811c87f785a8cf95d023b62fb2a6526f5cc07baf18',
};
test('protection definitions preserve all preexisting semantic leaves and absence', () => {
  const crypto = require('node:crypto');
  for (const [file, expected] of Object.entries(RC6_SCHEMA_SHA256)) {
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(root, file)))
        .digest('hex'),
      expected,
      file,
    );
    assert.equal(
      source.historical_artifacts.find((x) => x.path === file)?.sha256,
      expected,
      'Current source must register the unchanged historical artifact ' + file,
    );
  }
  assert.deepEqual(source.versionTuple, {
    container: '0.5.0',
    payload_profile: 'kdna.payload.judgment',
    payload_version: '0.5.1',
    core: 'kdna.core/0.8.2',
    ir: 'kdna.canonical-ir/0.6.1',
    runtime: 'kdna.runtime-capsule/0.3.1',
    plan: 'kdna.consumption-plan/0.3.1',
    host: 'kdna.agent-host/0.3.1',
    trace: 'kdna.judgment-trace/0.3.1',
    read: 'kdna.read/0.6.4',
  });
  assert.equal(source.engineering.package_versions.core, '0.37.1-rc.browser.1');
  assert.equal(source.engineering.package_versions.read, '0.11.2-rc.browser.1');
  assert.deepEqual(source.types.ProtectionEntitlement, {
    type: 'object',
    properties: {
      profile: { type: 'string', enum: ['password', 'account', 'org'] },
      offline: { type: 'boolean' },
      revocable: { type: 'boolean' },
    },
    required: ['profile'],
    additionalProperties: false,
  });
  assert.equal(source.types.Manifest.required.includes('entitlement'), false);
  assert.deepEqual(source.types.Manifest.properties.entitlement, {
    $ref: '#/$defs/ProtectionEntitlement',
  });
  // Literal expectation from RC7-PROOF-REBIND-INDEPENDENT-DECISION-01.
  const reboundScopes = {
    'PROTECTION-PRESENCE': 'current_rc7_independently_reviewed_engineering_enforcement',
    'PROTECTION-DIGESTS': 'current_rc7_independently_reviewed_engineering_enforcement',
    'PROTECTION-AUTHORITY': 'current_rc7_same_instance_and_trusted_host_composition_enforcement',
    'PROTECTION-DELIVERY': 'current_rc7_local_handoff_history_enforcement_not_remote_receipt',
    'PROTECTION-RESULTS': 'current_rc7_independently_reviewed_engineering_enforcement',
  };
  for (const rule of Object.keys(module.rules)) {
    const coverage = module.rule_coverage[rule];
    assert.equal(module.runtime_not_implemented.includes(rule), false);
    assert.deepEqual(module.runtime_enforcement_claims[rule], {
      generator_machine_check: 'none',
      runtime_enforcement: 'full',
    });
    assert.ok(coverage.runtime_units.length);
    assert.deepEqual(coverage.runtime_uncovered, []);
    if (Object.hasOwn(reboundScopes, rule)) assert.equal(coverage.proof_scope, reboundScopes[rule]);
  }
  assert.equal(module.runtime_exports.length, 9);
  assert.equal(module.status, 'B1_IMPLEMENTATION_CANDIDATE_NOT_ACCEPTED');
});
const require = createRequire(import.meta.url),
  Ajv = require('ajv/dist/2020.js');
const ajv = new Ajv({
  strict: true,
  strictTypes: false,
  strictRequired: false,
  allErrors: true,
  validateFormats: false,
});
const manifestSchema = load(source.r2_semantics.schema_paths.Manifest),
  protectionSchema = load(module.schema_path),
  checksumsSchema = load(module.checksums.schema_path);
assert.equal(
  manifestSchema.$id,
  'urn:kdna:schema:manifest:container:0.5.0:profile:kdna.payload.judgment:0.5.1',
);
assert.equal(protectionSchema.$id, 'urn:kdna:schema:protection-admission:1.0.0:binding:r2:8');
ajv.addSchema(manifestSchema);
ajv.addSchema(protectionSchema);
ajv.addSchema(checksumsSchema);
const validManifest = ajv.getSchema(manifestSchema.$id),
  validChecksum = ajv.getSchema(checksumsSchema.$id);
const definition = (name) => ajv.getSchema(protectionSchema.$id + '#/$defs/' + name);
// Change only the obsolete, unrelated authored prerequisites. Entitlement/access,
// encryption and encrypted flags stay byte-for-byte equivalent to each original row.
function currentManifest(historical) {
  const value = structuredClone(historical);
  value.compatibility.profile_version = '0.5.1';
  value.summary = 'Isolated schema-only protection declaration fixture.';
  value.languages = ['en'];
  value.history = {
    coverage: 'complete',
    statement: 'Engineering fixture, not a protection operation.',
    entries: [],
  };
  return value;
}
test('all declaration matrix vectors are schema-only and preserve ordinary absence with no invented defaults', () => {
  const vectors = load('conformance/public-contract/protection-definition-cases.json');
  assert.equal(vectors.cases.length, 128);
  assert.equal(new Set(vectors.cases.map((c) => c.id)).size, 128);
  assert.equal(vectors.cases.filter((c) => c.schema_valid).length, 112);
  const negativeCodes = [];
  for (const c of vectors.cases) {
    const original = structuredClone(c.manifest),
      current = currentManifest(c.manifest),
      before = structuredClone(current);
    for (const key of ['access', 'entitlement', 'encryption'])
      assert.deepEqual(current[key], original[key], c.id + ': preserve ' + key);
    assert.deepEqual(current.payload, original.payload, c.id + ': preserve encrypted flag');
    assert.equal(
      validManifest(current),
      c.schema_valid,
      c.id + JSON.stringify(validManifest.errors),
    );
    if (!c.schema_valid) {
      // All sixteen original negatives are encrypted:true without an encryption declaration.
      assert.equal(current.payload.encrypted, true);
      assert.equal(Object.hasOwn(current, 'encryption'), false);
      assert.ok(
        validManifest.errors.some(
          (e) => e.keyword === 'required' && e.params.missingProperty === 'encryption',
        ),
        c.id + ' must reach encryption-presence rule',
      );
      negativeCodes.push(c.id);
    }
    assert.deepEqual(c.manifest, original);
    assert.deepEqual(current, before);
    assert.equal(c.runtime_status, 'NOT_EXECUTED');
  }
  assert.equal(negativeCodes.length, 16);
  const valid = currentManifest(
    vectors.cases.find((c) => c.id === 'licensed-True-password-canonical').manifest,
  );
  assert.equal(
    validManifest(valid),
    true,
    'The base row is genuinely current before entitlement negatives',
  );
  for (const entitlement of [
    null,
    {},
    { profile: 'unknown' },
    { profile: 'password', extra: true },
    { profile: 'password', offline: null },
    { profile: 'password', revocable: 'true' },
  ]) {
    assert.equal(validManifest({ ...valid, entitlement }), false);
    assert.ok(
      validManifest.errors.some((e) => e.instancePath.startsWith('/entitlement')),
      'Must reject the entitlement field',
    );
  }
  for (const flags of [
    {},
    { offline: false },
    { offline: true },
    { revocable: false },
    { revocable: true },
    { offline: true, revocable: true },
  ])
    assert.equal(
      validManifest({ ...valid, entitlement: { profile: 'password', ...flags } }),
      true,
      'Shape does not prove capability compatibility.',
    );
  const absence = currentManifest(
    vectors.cases.find((c) => c.id === 'absent-False-absent-absent').manifest,
  );
  assert.equal(validManifest(absence), true);
  assert.equal(Object.hasOwn(absence, 'entitlement'), false);
  assert.equal(Object.hasOwn(absence, 'access'), false);
});
const digest = 'sha256:' + 'a'.repeat(64);
const receipt = {
  contract: { id: 'kdna.protection-admission/1', version: '1.0.0', definition_digest: digest },
  operation_id: 'synthetic:observation',
  A: digest,
  C: digest,
  E: digest,
  entry: 'payload.kdnab',
  encryption: null,
  plaintext_digest: null,
  integrity: { checksums: 'absent', signature: 'absent', signature_content_digest: null },
  authorization: { kind: 'none' },
  checked_at_ms: 1,
  proof: 'observation_not_authority',
};
test('closed result observations cannot carry plaintext, promote stages or mint opaque operations', () => {
  const observation = definition('ProtectedAdmissionObservation');
  for (const value of [
    { status: 'accepted', snapshot_id: 'synthetic:snapshot', receipt },
    {
      status: 'core_rejected',
      stage: 'interpretation',
      core: require('../../packages/kdna-core/src/public-contract/admit.js').rejected(
        'READ_UNSUPPORTED_CRITICAL',
      ),
    },
    {
      status: 'protection_failed',
      diagnostic: { code: 'PROTECTION_AUTHENTICATION_FAILED', stage: 'authentication' },
    },
  ]) {
    assert.equal(observation(value), true, JSON.stringify(observation.errors));
    assert.equal(observation({ ...value, body: 'secret' }), false);
  }
  const historicalCatalog = { status: 'catalog_only', carrier_id: 'synthetic:catalog', receipt };
  const historicalSchema = load('specs/protection-admission.schema.json');
  const historicalObservation = new Ajv({ strict: false, validateFormats: false }).compile({
    $schema: historicalSchema.$schema,
    $ref: '#/$defs/ProtectedAdmissionObservation',
    $defs: historicalSchema.$defs,
  });
  assert.equal(
    historicalObservation(historicalCatalog),
    true,
    'Historical catalog-only observation remains representable only under its old schema',
  );
  assert.equal(
    observation(historicalCatalog),
    false,
    'Current result cannot promote the historical catalog-only arm',
  );
  assert.equal(definition('ProtectionOperation')({}), false);
  assert.equal(definition('ProtectionPreparedDelivery')({}), false);
  assert.equal(
    definition('ProtectedAdmissionResult')({
      status: 'accepted',
      snapshot: {},
      operation: {},
      receipt,
    }),
    false,
  );
  assert.equal(
    definition('ProtectedAdmissionCatalogOnly')({
      status: 'catalog_only',
      catalog: {},
      operation: {},
      receipt,
    }),
    false,
  );
  assert.equal(
    definition('ProtectedAdmissionFailed')({
      status: 'protection_failed',
      diagnostic: { code: 'PROTECTION_AUTHENTICATION_FAILED', stage: 'authentication' },
      core: { status: 'accepted' },
    }),
    false,
  );
  assert.equal(
    definition('ProtectionDiagnostic')({
      code: 'PROTECTION_AUTHENTICATION_FAILED',
      stage: 'manifest',
    }),
    false,
  );
  for (const name of ['ProtectedReadFailed', 'ProtectedReadDeliveryFailed']) {
    const value = {
      status: name === 'ProtectedReadFailed' ? 'protection_failed' : 'delivery_failed',
      ...(name === 'ProtectedReadFailed'
        ? { diagnostic: { code: 'PROTECTION_AUTHORIZATION_EXPIRED', stage: 'transport_commit' } }
        : { reason: 'transport_commit_failed' }),
      disclosure: { kind: 'trusted_host', at_ms: 1, external_commit: { state: 'not_invoked' } },
      body: null,
      body_bytes: 0,
    };
    assert.equal(definition(name)(value), true, JSON.stringify(definition(name).errors));
    assert.equal(definition(name)({ ...value, body: 'old prepared body' }), false);
    assert.equal(definition(name)({ ...value, result: {} }), false);
  }
});
test('checksums document has its own closed identity and bounded row representation', () => {
  const c = {
    profile: 'kdna.checksums.document/1',
    profile_version: '1.0.0',
    algorithm: 'sha256',
    digest_profile: 'kdna.digest-basis.runtime-entry-set',
    digest_profile_version: '0.2.0',
    covered_entries: ['kdna.json', 'payload.kdnab'],
    entries: [
      { name: 'kdna.json', bytes: 10, digest },
      { name: 'payload.kdnab', bytes: 20, digest },
    ],
    entry_set_digest: digest,
  };
  assert.equal(validChecksum(c), true, JSON.stringify(validChecksum.errors));
  for (const mutation of [
    (x) => (x.profile_version = '0.1.0'),
    (x) => (x.digest_profile_version = '0.1.0'),
    (x) => (x.entries = {}),
    (x) => (x.entries[0].bytes = 8388609),
    (x) => (x.entries[0].digest = 'a'.repeat(64)),
    (x) => (x.entries[0].plaintext_digest = digest),
    (x) => (x.A = digest),
    (x) => x.covered_entries.push('kdna.json'),
    (x) => (x.entries.length = 0),
    (x) => (x.entries = Array(129).fill(x.entries[0])),
  ]) {
    const bad = structuredClone(c);
    mutation(bad);
    assert.equal(validChecksum(bad), false);
  }
  // Name equality, raw JSON duplicate keys, byte sums and actual digests are non-schema B1 obligations.
  const repeated = structuredClone(c);
  repeated.entries[1] = repeated.entries[0];
  assert.equal(
    validChecksum(repeated),
    true,
    'Do not pretend shape validates unique row names or their byte preimages.',
  );
});
test('legacy profiles and preimages remain exact pinned independent inputs', () => {
  const crypto = require('node:crypto');
  for (const pin of module.legacy_inputs) {
    const b = fs.readFileSync(path.join(root, pin.path));
    assert.equal(b.length, pin.bytes);
    assert.equal(crypto.createHash('sha256').update(b).digest('hex'), pin.sha256, pin.path);
  }
  assert.equal(
    fs.readFileSync(path.join(root, 'packages/kdna-core/schema/envelope-aead.schema.json'), 'utf8'),
    fs.readFileSync(path.join(root, 'specs/envelope-aead.schema.json'), 'utf8'),
  );
  const vectors = load('conformance/signature/vectors.json'),
    entries = Object.fromEntries(
      Object.entries(vectors.asset.entries).map(([name, hex]) => [name, Buffer.from(hex, 'hex')]),
    );
  const legacy = require('../../packages/kdna-core/src/asset-reader.js'),
    signature = require('../../packages/kdna-core/src/signature.js');
  assert.equal(legacy.contentDigestFromEntryBuffers(entries), vectors.expected.content_digest);
  assert.equal(
    signature.buildSigningPayload(vectors.expected.content_digest).toString('hex'),
    vectors.expected.signing_payload_hex,
  );
  const old = load('schema/checksums.schema.json');
  assert.equal(old.properties.digest_profile_version.const, '0.1.0');
});
test('path definitions distinguish pure transforms, trusted callback disclosure and later external commit', () => {
  const paths = module.paths;
  for (const fragment of [
    'inspectSnapshot',
    'Read root project',
    'ordinary readBrowser(snapshot)',
    'ConsumptionPlan',
    'RuntimeCapsule',
    'AgentHost',
    'expand handle',
    'unknown critical semantics in all four modes',
    'commitProtectedTransport',
  ])
    assert.ok(
      paths.some((p) => p.path.includes(fragment)),
      fragment,
    );
  for (const name of ['inspectSnapshot', 'Read root project'])
    assert.match(
      paths.find((p) => p.path === name).current_authorization,
      /no clock\/store\/network/,
    );
  const critical = paths.find((p) => p.path === 'unknown critical semantics in all four modes');
  assert.match(
    critical.private_guard,
    /READ_UNSUPPORTED_CRITICAL with no snapshot or catalog-only carrier/,
  );
  assert.match(
    critical.disclosure,
    /no IR, snapshot, selected body, expansion handle or successful catalog-only envelope/,
  );
  assert.match(module.rules['PROTECTION-DELIVERY'], /callback invocation discloses/);
  assert.match(module.rules['PROTECTION-DELIVERY'], /cannot erase/);
  assert.deepEqual(
    Object.keys(require('../../packages/kdna-core/package.json').exports).filter((k) =>
      k.includes('protection'),
    ),
    ['./protection-node'],
  );
  assert.deepEqual(
    Object.keys(require('../../packages/kdna-read/package.json').exports).filter((k) =>
      k.includes('protection'),
    ),
    ['./protection-node'],
  );
});

test('external commit observations survive later failure and distinguish unknown from confirmed handoff', () => {
  const unknown = {
    kind: 'trusted_host',
    at_ms: 10,
    external_commit: {
      state: 'outcome_unknown',
      attempt_id: 'synthetic:attempt',
      attempted_at_ms: 11,
    },
  };
  const confirmed = {
    kind: 'trusted_host',
    at_ms: 10,
    external_commit: {
      state: 'confirmed',
      attempt_id: 'synthetic:attempt',
      attempted_at_ms: 11,
      confirmed_at_ms: 11,
    },
  };
  const before = { kind: 'trusted_host', at_ms: 10, external_commit: { state: 'not_invoked' } };
  for (const disclosure of [
    before,
    unknown,
    confirmed,
    { ...confirmed, external_commit: { ...confirmed.external_commit, confirmed_at_ms: null } },
  ]) {
    const failure = {
      status: 'delivery_failed',
      reason: 'host_callback_failed',
      disclosure,
      body: null,
      body_bytes: 0,
    };
    assert.equal(
      definition('ProtectedReadDeliveryFailed')(failure),
      true,
      JSON.stringify(definition('ProtectedReadDeliveryFailed').errors),
    );
    assert.equal(
      definition('ProtectedReadFailed')({
        status: 'protection_failed',
        diagnostic: { code: 'PROTECTION_AUTHORIZATION_EXPIRED', stage: 'transport_commit' },
        disclosure,
        body: null,
        body_bytes: 0,
      }),
      true,
    );
    assert.equal(
      definition('ProtectedReadDeliveryFailed')({ ...failure, body: 'previously sent' }),
      false,
    );
  }
  const committed = {
    status: 'committed',
    operation_id: 'synthetic:operation',
    committed_at_ms: 11,
    disclosure: confirmed,
  };
  assert.equal(definition('ProtectedTransportCommitted')(committed), true);
  for (const disclosure of [
    before,
    unknown,
    { ...confirmed, external_commit: { ...confirmed.external_commit, confirmed_at_ms: null } },
  ])
    assert.equal(definition('ProtectedTransportCommitted')({ ...committed, disclosure }), false);
  for (const value of [
    { kind: 'none' },
    { kind: 'none', external_commit: unknown.external_commit },
    { kind: 'trusted_host', at_ms: 10 },
    { ...unknown, external_commit: { state: 'outcome_unknown' } },
    { ...confirmed, external_commit: { ...confirmed.external_commit, body: 'leak' } },
  ])
    assert.equal(definition('ProtectionDisclosure')(value), false);
  assert.equal(
    definition('ProtectionDisclosure')({ kind: 'none', external_commit: { state: 'not_invoked' } }),
    true,
  );
  // Schema expresses the observations, not event ordering, side effects or unforgeable history.
  const backwards = {
    ...confirmed,
    external_commit: { ...confirmed.external_commit, confirmed_at_ms: 9 },
  };
  assert.equal(
    definition('ProtectionDisclosure')(backwards),
    true,
    'Time monotonicity remains a named runtime obligation, not a schema claim.',
  );
  assert.match(
    module.delivery_history.transition,
    /before calling the transport side-effect callback/,
  );
  assert.match(
    module.delivery_history.reentrancy,
    /reservation.*before calling any external provider/,
  );
  assert.match(module.delivery_history.acknowledgement, /False\/throw\/thenable/);
  assert.match(module.delivery_history.monotonicity, /Never downgrade/);
  assert.match(module.delivery_history.limits, /not confirmed remote receipt/);
});
test('binding-only clock failure preserves closed public result isolation', () => {
  const v = {
    status: 'protection_failed',
    diagnostic: { code: 'PROTECTION_AUTHORIZATION_EXPIRED', stage: 'transport_commit' },
    checked_at_ms: 2000,
  };
  for (const time of [null, 0, 2000])
    assert.equal(definition('ProtectionCurrentFailure')({ ...v, checked_at_ms: time }), true);
  for (const bad of [
    { ...v, checked_at_ms: -1 },
    { ...v, checked_at_ms: '2000' },
    { ...v, body: 'leak' },
    { status: v.status, diagnostic: v.diagnostic },
  ])
    assert.equal(definition('ProtectionCurrentFailure')(bad), false);
  assert.equal(definition('ProtectedAdmissionFailed')(v), false);
  assert.equal(
    definition('ProtectedReadFailed')({
      ...v,
      disclosure: { kind: 'none', external_commit: { state: 'not_invoked' } },
      body: null,
      body_bytes: 0,
    }),
    false,
  );
});
