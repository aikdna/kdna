'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  installPackedCoreOffline,
  representativeTypesSource,
  runNpmWithCache,
  runTsc,
  withTempNpmCache,
} = require('./package-test-helpers');

const core = require('../src');
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const golden = core.parseExecutionContractJsonV1(
  fs.readFileSync(path.join(REPO_ROOT, 'conformance', 'runtime-contract-v1', 'golden.json')),
);

function context(overrides = {}) {
  return {
    plan: golden.plan,
    trustedPlanDigest: golden.plan.integrity.plan_digest,
    capabilities: golden.capabilities,
    coreCapsuleVersions: ['2.0', '1.0'],
    request: golden.request,
    receipt: golden.receipt,
    trustedDeliveryObservation: 'host_receipt',
    ...overrides,
  };
}

function assertCode(code, callback) {
  assert.throws(callback, (error) => error && error.code === code);
}

test('strict JSON parser matches valid JSON values and preserves protocol number semantics', () => {
  const corpus = [
    '{}',
    '[]',
    'null',
    'true',
    'false',
    '0',
    '-1',
    '1.0',
    '1e+2',
    '1e-2',
    '"\\"\\\\\\/\\b\\f\\n\\r\\t"',
    '"line\u2028paragraph\u2029"',
    '"𝄞"',
    '"\\ud834\\udd1e"',
    '{"outer":{"value":1},"items":[true,null],"same":"same"}',
    ' \t\r\n {"a":1} \n',
  ];
  for (const raw of corpus) {
    assert.deepEqual(core.parseExecutionContractJsonV1(raw), JSON.parse(raw), raw);
  }
  assert.equal(Object.is(core.parseExecutionContractJsonV1('-0'), -0), true);
});

test('strict JSON parser rejects decoded duplicate keys at every object depth', () => {
  const duplicates = [
    '{"a":1,"a":2}',
    '{"a":1,"\\u0061":2}',
    '{"/":1,"\\/":2}',
    '{"𝄞":1,"\\ud834\\udd1e":2}',
    '{"outer":{"a":1,"a":2}}',
    '[{"a":1,"\\u0061":2}]',
  ];
  for (const raw of duplicates) assertCode('KDNA_JSON_DUPLICATE_KEY', () => core.parseExecutionContractJsonV1(raw));
  assert.deepEqual(core.parseExecutionContractJsonV1('{"a":1,"nested":{"a":2}}'), {
    a: 1,
    nested: { a: 2 },
  });
  assert.deepEqual(core.parseExecutionContractJsonV1('{"é":1,"é":2}'), { é: 1, é: 2 });
});

test('strict JSON parser preserves hostile names as own data properties', () => {
  const parsed = core.parseExecutionContractJsonV1(
    '{"__proto__":{"polluted":true},"constructor":1,"prototype":2}',
  );
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype);
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const descriptor = Object.getOwnPropertyDescriptor(parsed, key);
    assert.equal(descriptor.enumerable, true);
    assert.equal(Object.prototype.hasOwnProperty.call(descriptor, 'value'), true);
  }
  assert.equal(parsed.__proto__.polluted, true);
  assert.equal({}.polluted, undefined);
});

test('strict JSON parser enforces UTF-8, BOM, Unicode scalar, grammar, and finite numbers', () => {
  const invalidUtf8 = [
    [0xc0, 0xaf],
    [0xe2, 0x82],
    [0xed, 0xa0, 0x80],
    [0xf4, 0x90, 0x80, 0x80],
  ];
  for (const bytes of invalidUtf8) {
    assertCode('KDNA_JSON_INVALID_UNICODE', () =>
      core.parseExecutionContractJsonV1(Uint8Array.from(bytes)),
    );
  }
  assertCode('KDNA_JSON_BOM_FORBIDDEN', () =>
    core.parseExecutionContractJsonV1(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])),
  );
  assertCode('KDNA_JSON_BOM_FORBIDDEN', () => core.parseExecutionContractJsonV1('\ufeff{}'));

  for (const raw of ['"\ud800"', '"\udc00"', '"\\ud800"', '"\\udc00"']) {
    assertCode('KDNA_JSON_INVALID_UNICODE', () => core.parseExecutionContractJsonV1(raw));
  }
  for (const code of [0x00, 0x01, 0x1f]) {
    assertCode('KDNA_JSON_SYNTAX_INVALID', () =>
      core.parseExecutionContractJsonV1(`"${String.fromCharCode(code)}"`),
    );
  }
  for (const raw of [
    '',
    '{}{}',
    '{}x',
    '{"a":1,}',
    '[1,]',
    '01',
    '-01',
    '+1',
    '1.',
    '1e',
    'NaN',
    'Infinity',
    '\f{}',
    '\v{}',
    '\u00a0{}',
    '\u0085{}',
  ]) {
    assertCode('KDNA_JSON_SYNTAX_INVALID', () => core.parseExecutionContractJsonV1(raw));
  }
  assertCode('KDNA_JSON_NUMBER_INVALID', () => core.parseExecutionContractJsonV1('1e400'));
  assert.deepEqual(core.parseExecutionContractJsonV1('"\\u0000\\u001f"'), '\u0000\u001f');

  const surrounded = Buffer.from('xx{"a":1}yy');
  assert.deepEqual(core.parseExecutionContractJsonV1(new Uint8Array(surrounded.buffer, surrounded.byteOffset + 2, 7)), { a: 1 });
});

test('strict JSON parser limits bytes and container depth and only allows tightening options', () => {
  const raw = '"你好"';
  assert.equal(Buffer.byteLength(raw), 8);
  assert.equal(core.parseExecutionContractJsonV1(raw, { maxBytes: 8 }), '你好');
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1(raw, { maxBytes: 7 }),
  );
  assert.deepEqual(core.parseExecutionContractJsonV1('[1]', { maxDepth: 1 }), [1]);
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1('[[]]', { maxDepth: 1 }),
  );
  assert.deepEqual(core.parseExecutionContractJsonV1('[[]]', { maxDepth: 2 }), [[]]);
  assertCode('KDNA_JSON_LIMIT_EXCEEDED', () =>
    core.parseExecutionContractJsonV1('[[[]]]', { maxDepth: 2 }),
  );

  for (const options of [
    null,
    { maxBytes: 0 },
    { maxDepth: -1 },
    { maxDepth: 1.5 },
    { maxDepth: '1' },
    { maxDepth: Infinity },
    { maxDepth: 65 },
    { maxBytes: 2 * 1024 * 1024 + 1 },
    { maxByte: 1 },
    Object.create({ maxDepth: 1 }),
  ]) {
    assertCode('KDNA_JSON_OPTIONS_INVALID', () => core.parseExecutionContractJsonV1('{}', options));
  }
  const accessor = {};
  Object.defineProperty(accessor, 'maxDepth', { get() { throw new Error('must not run'); } });
  assertCode('KDNA_JSON_OPTIONS_INVALID', () => core.parseExecutionContractJsonV1('{}', accessor));
});

test('builders reproduce goldens without mutating independent inputs', () => {
  const input = {
    plan_id: golden.plan.plan_id,
    created_at: golden.plan.created_at,
    task: structuredClone(golden.plan.task),
    asset_ref: structuredClone(golden.plan.asset_ref),
    projection_profile: golden.plan.projection_request.profile,
    budget: structuredClone(golden.plan.budget),
    constraints: structuredClone(golden.plan.constraints),
    trace_policy: structuredClone(golden.plan.trace_policy),
  };
  const before = core.canonicalizeJcs(input);
  const plan = core.buildConsumptionPlanV1(input);
  assert.equal(core.canonicalizeJcs(input), before);
  assert.equal(core.canonicalizeJcs(plan), core.canonicalizeJcs(golden.plan));

  const capsule = structuredClone(golden.request.capsule);
  const capsuleBefore = core.canonicalizeJcs(capsule);
  const request = core.buildAgentHost2RequestV1(
    { request_id: golden.request.request_id, capsule },
    context({ plan }),
  );
  assert.equal(core.canonicalizeJcs(capsule), capsuleBefore);
  assert.equal(core.canonicalizeJcs(request), core.canonicalizeJcs(golden.request));

  const trace = core.buildJudgmentTraceV1(
    {
      trace_id: golden.trace.trace_id,
      timestamp: golden.trace.timestamp,
      overall_status: golden.trace.overall_status,
      errors: golden.trace.errors,
      warnings: golden.trace.warnings,
    },
    context({ plan, request }),
  );
  assert.equal(core.canonicalizeJcs(trace), core.canonicalizeJcs(golden.trace));
});

test('every strict Plan 1 chain requires a non-null matching trusted Plan digest', () => {
  const wrongDigest = `sha256:${'0'.repeat(64)}`;
  for (const [trustedPlanDigest, expectedCode] of [
    [null, 'KDNA_VALIDATION_CONTEXT_INVALID'],
    ['not-a-digest', 'KDNA_VALIDATION_CONTEXT_INVALID'],
    [wrongDigest, 'KDNA_TRUSTED_PLAN_DIGEST_MISMATCH'],
  ]) {
    assert.equal(
      core.validateConsumptionPlanV1(golden.plan, { trustedPlanDigest }).code,
      expectedCode,
    );
    assert.equal(
      core.negotiateExecutionPairV1(golden.plan, {
        trustedPlanDigest,
        capabilities: golden.capabilities,
        coreCapsuleVersions: ['2.0', '1.0'],
      }).issue_code,
      expectedCode,
    );
    assert.equal(
      core.validateAgentHost2RequestV1(
        golden.request,
        context({ trustedPlanDigest }),
      ).code,
      expectedCode,
    );
    assert.equal(
      core.validateJudgmentTraceV1(golden.trace, context({ trustedPlanDigest })).code,
      expectedCode,
    );
    assertCode(expectedCode, () =>
      core.deriveBudgetEvidenceV1(golden.plan, {
        trustedPlanDigest,
        request: golden.request,
        receipt: golden.receipt,
      }),
    );
  }
});

test('public Host 2 request validation cannot disable pre-Host budget enforcement', () => {
  const plan = structuredClone(golden.plan);
  plan.budget.max_projection_chars = 1;
  plan.integrity.plan_digest = core.computeConsumptionPlanDigestV1(plan);
  const request = structuredClone(golden.request);
  request.plan_ref.plan_digest = plan.integrity.plan_digest;
  request.budget.max_projection_chars = 1;
  const result = core.validateAgentHost2RequestV1(
    request,
    context({
      plan,
      trustedPlanDigest: plan.integrity.plan_digest,
      request,
    }),
    { enforceBudget: false },
  );
  assert.equal(result.code, 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED');
});

test('pre-Host budget block preserves projected A/C/E/P and exact exceeded evidence without a request', () => {
  const capsule = structuredClone(golden.request.capsule);
  const projectionChars = [...core.canonicalizeJcs(capsule)].length;
  const plan = structuredClone(golden.plan);
  plan.budget.max_projection_chars = projectionChars - 1;
  plan.integrity.plan_digest = core.computeConsumptionPlanDigestV1(plan);
  const executionContext = context({
    plan,
    trustedPlanDigest: plan.integrity.plan_digest,
  });

  assertCode('KDNA_HOST_BUDGET_LIMIT_EXCEEDED', () =>
    core.buildAgentHost2RequestV1(
      { request_id: golden.request.request_id, capsule },
      executionContext,
    ),
  );

  const trace = core.buildPreHostBudgetBlockedTraceV1(
    {
      trace_id: 'trace_abcdef0123456789',
      timestamp: '2026-07-15T00:00:00.500Z',
      capsule,
    },
    executionContext,
  );
  const p = core.computeCapsuleDeliveryDigest(capsule);
  assert.equal(Object.hasOwn(trace, 'request'), false);
  assert.equal(Object.hasOwn(trace, 'capsule'), false);
  assert.deepEqual(trace.digest_evidence, capsule.digests);
  assert.deepEqual(trace.projection_actual, {
    profile: plan.projection_request.profile,
    capsule_delivery_digest: p,
    profile_deviated_from_plan: false,
  });
  assert.deepEqual(trace.capsule_delivery_evidence, {
    basis: 'kdna-capsule-jcs-v1',
    observed: p,
    sender_computed: true,
    host_recomputed: null,
    host_echoed: null,
    delivered_capsule_version: null,
    host_boundary_comparison: 'not_delivered',
    request_id: null,
  });
  assert.equal(trace.budget.actual.projection_chars, projectionChars);
  assert.equal(trace.budget.actual.elapsed_ms, null);
  assert.equal(trace.budget.actual.elapsed_basis, 'not_observed');
  assert.equal(trace.budget.actual.tokens_used, null);
  assert.equal(trace.budget.actual.model_calls, null);
  assert.equal(trace.budget.actual.usage_basis, 'not_observed');
  assert.equal(trace.budget.comparison.projection_chars, 'exceeded');
  assert.equal(trace.budget.comparison.overall, 'exceeded');
  assert.equal(trace.host_receipt, null);
  assert.equal(trace.execution.delivery_status, 'not_delivered');
  assert.equal(trace.execution.execution_status, 'not_started');
  assert.deepEqual(trace.execution.semantic_consumption, { state: 'not_observed', basis: null });
  assert.deepEqual(trace.execution.model_identity, { value: null, basis: 'not_observed' });
  assert.equal(trace.overall_status, 'blocked');
  assert.deepEqual(trace.errors, [
    {
      code: 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED',
      message: 'Pre-Host projection or task budget exceeded.',
      phase: 'budget',
    },
  ]);
  assert.equal(
    core.validatePreHostBudgetBlockedTraceV1(trace, {
      ...executionContext,
      capsule,
    }).valid,
    true,
  );

  const replacementCapsule = structuredClone(capsule);
  replacementCapsule.context.highest_question = 'A different independently supplied Capsule.';
  assert.equal(
    core.validatePreHostBudgetBlockedTraceV1(trace, {
      ...executionContext,
      capsule: replacementCapsule,
    }).valid,
    false,
  );

  const tamperCases = [
    ['P', (value) => (value.capsule_delivery_evidence.observed = `sha256:${'0'.repeat(64)}`)],
    ['projection actual', (value) => (value.budget.actual.projection_chars -= 1)],
    ['task actual', (value) => (value.budget.actual.task_chars -= 1)],
    ['model calls', (value) => (value.budget.actual.model_calls = 0)],
    ['A', (value) => (value.digest_evidence.asset.value = `sha256:${'0'.repeat(64)}`)],
    ['profile', (value) => (value.projection_actual.profile = 'full')],
    [
      'model identity',
      (value) => (value.execution.model_identity = { value: 'invented', basis: 'host_reported' }),
    ],
    [
      'delivery state',
      (value) => (value.capsule_delivery_evidence.host_boundary_comparison = 'unavailable'),
    ],
  ];
  for (const [label, mutate] of tamperCases) {
    const tampered = structuredClone(trace);
    mutate(tampered);
    assert.equal(
      core.validatePreHostBudgetBlockedTraceV1(tampered, {
        ...executionContext,
        capsule,
      }).valid,
      false,
      label,
    );
  }
});

test('pre-Host budget block supports task overflow but cannot be used within limits', () => {
  const capsule = structuredClone(golden.request.capsule);
  assertCode('KDNA_PRE_HOST_BUDGET_NOT_EXCEEDED', () =>
    core.buildPreHostBudgetBlockedTraceV1(
      {
        trace_id: 'trace_abcdef0123456789',
        timestamp: '2026-07-15T00:00:00.500Z',
        capsule,
      },
      context(),
    ),
  );
  assert.equal(
    core.validatePreHostBudgetBlockedTraceV1(golden.trace, {
      ...context(),
      capsule,
    }).code,
    'KDNA_PRE_HOST_BUDGET_NOT_EXCEEDED',
  );

  const plan = structuredClone(golden.plan);
  plan.budget.max_task_chars = 1;
  plan.integrity.plan_digest = core.computeConsumptionPlanDigestV1(plan);
  const executionContext = context({
    plan,
    trustedPlanDigest: plan.integrity.plan_digest,
  });
  const trace = core.buildPreHostBudgetBlockedTraceV1(
    {
      trace_id: 'trace_0123456789abcdef',
      timestamp: '2026-07-15T00:00:00.500Z',
      capsule,
    },
    executionContext,
  );
  assert.equal(trace.budget.comparison.task_chars, 'exceeded');
  assert.equal(trace.budget.comparison.projection_chars, 'within_limit');
  assert.equal(
    core.validatePreHostBudgetBlockedTraceV1(trace, {
      ...executionContext,
      capsule,
    }).valid,
    true,
  );

  const forged = structuredClone(trace);
  forged.errors = [{ code: 'OTHER', message: 'Not a budget error.', phase: 'budget' }];
  assert.equal(
    core.validatePreHostBudgetBlockedTraceV1(forged, {
      ...executionContext,
      capsule,
    }).code,
    'KDNA_TRACE_PRE_HOST_BUDGET_MISMATCH',
  );
  assertCode('KDNA_INPUT_INVALID', () =>
    core.buildPreHostBudgetBlockedTraceV1(
      {
        trace_id: 'trace_0123456789abcdef',
        timestamp: '2026-07-15T00:00:00.500Z',
        capsule,
        errors: [{ code: 'OTHER', message: 'Caller error.', phase: 'budget' }],
      },
      executionContext,
    ),
  );
});

test('pre-Host budget block rejects mismatched Capsules and hostile builder inputs', () => {
  const plan = structuredClone(golden.plan);
  plan.budget.max_projection_chars = 1;
  plan.integrity.plan_digest = core.computeConsumptionPlanDigestV1(plan);
  const executionContext = context({
    plan,
    trustedPlanDigest: plan.integrity.plan_digest,
  });
  const mismatchedCapsule = structuredClone(golden.request.capsule);
  mismatchedCapsule.profile = 'full';
  assertCode('KDNA_HOST_PROJECTION_CONTRACT_MISMATCH', () =>
    core.buildPreHostBudgetBlockedTraceV1(
      {
        trace_id: 'trace_abcdef0123456789',
        timestamp: '2026-07-15T00:00:00.500Z',
        capsule: mismatchedCapsule,
      },
      executionContext,
    ),
  );

  let getterRuns = 0;
  const hostileInput = {
    trace_id: 'trace_abcdef0123456789',
    timestamp: '2026-07-15T00:00:00.500Z',
  };
  Object.defineProperty(hostileInput, 'capsule', {
    enumerable: true,
    get() {
      getterRuns += 1;
      return golden.request.capsule;
    },
  });
  assertCode('KDNA_INPUT_INVALID', () =>
    core.buildPreHostBudgetBlockedTraceV1(hostileInput, executionContext),
  );
  assert.equal(getterRuns, 0);
});

test('matched Host receipt requires sender, Host, echo, and actual Capsule P to agree', () => {
  const request = structuredClone(golden.request);
  const receipt = structuredClone(golden.receipt);
  const forgedSenderP = `sha256:${'0'.repeat(64)}`;
  request.runtime_contract.capsule_delivery_digest = forgedSenderP;
  receipt.runtime_receipt.sender_capsule_delivery_digest = forgedSenderP;
  assert.equal(
    core.validateAgentHost2ReceiptV1(receipt, { request }).code,
    'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH',
  );
});

test('Trace builder distinguishes explicit not-delivered and not-observed evidence', () => {
  const errors = [
    {
      code: 'KDNA_HOST_RESPONSE_UNAVAILABLE',
      message: 'The Host response was unavailable.',
      phase: 'delivery',
    },
  ];
  const notDeliveredContext = context({
    receipt: null,
    trustedDeliveryObservation: 'not_delivered',
  });
  const notDelivered = core.buildJudgmentTraceV1(
    {
      trace_id: 'trace_4444444444444444',
      timestamp: '2026-07-15T00:00:00.500Z',
      overall_status: 'blocked',
      errors,
    },
    notDeliveredContext,
  );
  assert.equal(notDelivered.capsule_delivery_evidence.host_boundary_comparison, 'not_delivered');
  assert.equal(notDelivered.capsule_delivery_evidence.delivered_capsule_version, null);
  assert.equal(notDelivered.capsule_delivery_evidence.request_id, null);
  assert.equal(notDelivered.execution.delivery_status, 'not_delivered');
  assert.equal(core.validateJudgmentTraceV1(notDelivered, notDeliveredContext).valid, true);

  const notObservedContext = context({
    receipt: null,
    trustedDeliveryObservation: 'not_observed',
  });
  const notObserved = core.buildJudgmentTraceV1(
    {
      trace_id: 'trace_5555555555555555',
      timestamp: '2026-07-15T00:00:00.500Z',
      overall_status: 'blocked',
      errors,
    },
    notObservedContext,
  );
  assert.equal(notObserved.capsule_delivery_evidence.host_boundary_comparison, 'not_observed');
  assert.equal(notObserved.capsule_delivery_evidence.delivered_capsule_version, '2.0');
  assert.equal(notObserved.capsule_delivery_evidence.request_id, golden.request.request_id);
  assert.equal(notObserved.execution.delivery_status, 'rejected_before_execution');
  assert.equal(core.validateJudgmentTraceV1(notObserved, notObservedContext).valid, true);
});

test('object validators snapshot context and reject getters or custom prototypes', () => {
  let getterRuns = 0;
  const planContext = {};
  Object.defineProperty(planContext, 'trustedPlanDigest', {
    enumerable: true,
    get() {
      getterRuns += 1;
      return golden.plan.integrity.plan_digest;
    },
  });
  assert.equal(
    core.validateConsumptionPlanV1(golden.plan, planContext).code,
    'KDNA_VALIDATION_CONTEXT_INVALID',
  );

  const requestContext = Object.assign(Object.create({ hostile: true }), context());
  assert.equal(
    core.validateAgentHost2RequestV1(golden.request, requestContext).code,
    'KDNA_VALIDATION_CONTEXT_INVALID',
  );

  const receiptContext = {};
  Object.defineProperty(receiptContext, 'request', {
    enumerable: true,
    get() {
      getterRuns += 1;
      return golden.request;
    },
  });
  assert.equal(
    core.validateAgentHost2ReceiptV1(golden.receipt, receiptContext).code,
    'KDNA_VALIDATION_CONTEXT_INVALID',
  );

  const traceContext = context();
  const hostileCapabilities = structuredClone(golden.capabilities);
  delete hostileCapabilities.host_protocols;
  Object.defineProperty(hostileCapabilities, 'host_protocols', {
    enumerable: true,
    get() {
      getterRuns += 1;
      return ['kdna.agent-host/2'];
    },
  });
  traceContext.capabilities = hostileCapabilities;
  assert.equal(
    core.validateJudgmentTraceV1(golden.trace, traceContext).code,
    'KDNA_VALIDATION_CONTEXT_INVALID',
  );
  assert.equal(getterRuns, 0);
});

test('object validators fail closed with stable codes instead of leaking TypeError', () => {
  const cyclic = {};
  cyclic.self = cyclic;
  const getter = {};
  Object.defineProperty(getter, 'type', { enumerable: true, get() { throw new Error('no'); } });
  const values = [null, undefined, [], cyclic, getter, { value: Number.NaN }, new Date()];
  for (const value of values) {
    const results = [
      core.validateConsumptionPlanV1(value, { trustedPlanDigest: null }),
      core.validateAgentHost2RequestV1(value, context()),
      core.validateAgentHost2ReceiptV1(value, { request: golden.request }),
      core.validateJudgmentTraceV1(value, context()),
    ];
    for (const result of results) {
      assert.equal(result.valid, false);
      assert.equal(typeof result.code, 'string');
    }
  }
  assertCode('KDNA_VALIDATION_CONTEXT_INVALID', () =>
    core.buildJudgmentTraceV1(
      { trace_id: 'trace_0123456789abcdef', timestamp: new Date().toISOString(), overall_status: 'blocked' },
      context({ request: null, receipt: golden.receipt }),
    ),
  );
});

test('all 17 candidate exports are symmetric across CJS, ESM, and declarations', async () => {
  const esm = await import('../src/index.mjs');
  const exports = {
    KDNAExecutionContractError: 'function',
    PLAN_DIGEST_PROFILE: 'string',
    HOST_PROTOCOL: 'string',
    DEFAULT_CORE_CAPSULE_VERSIONS: 'object',
    parseExecutionContractJsonV1: 'function',
    computeConsumptionPlanDigestV1: 'function',
    buildConsumptionPlanV1: 'function',
    validateConsumptionPlanV1: 'function',
    negotiateExecutionPairV1: 'function',
    buildAgentHost2RequestV1: 'function',
    validateAgentHost2RequestV1: 'function',
    validateAgentHost2ReceiptV1: 'function',
    deriveBudgetEvidenceV1: 'function',
    buildPreHostBudgetBlockedTraceV1: 'function',
    validatePreHostBudgetBlockedTraceV1: 'function',
    buildJudgmentTraceV1: 'function',
    validateJudgmentTraceV1: 'function',
  };
  const declarations = fs.readFileSync(path.join(PACKAGE_ROOT, 'src', 'types.d.ts'), 'utf8');
  assert.equal(Object.keys(exports).length, 17);
  for (const [name, type] of Object.entries(exports)) {
    assert.equal(typeof core[name], type, `CJS ${name}`);
    assert.equal(typeof esm[name], type, `ESM ${name}`);
    assert.match(declarations, new RegExp(`(?:function|class|const) ${name}\\b`));
  }
  const cacheProbe = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-cache-probe-'));
  const fakeHome = path.join(cacheProbe, 'home');
  const forbiddenUserCache = path.join(fakeHome, '.npm');
  fs.mkdirSync(fakeHome, { recursive: true });
  let dryRun;
  try {
    dryRun = withTempNpmCache((cache) => JSON.parse(runNpmWithCache(
      ['pack', '--dry-run', '--json'],
      cache,
      {
        cwd: PACKAGE_ROOT,
        encoding: 'utf8',
        env: {
          HOME: fakeHome,
          USERPROFILE: fakeHome,
          npm_config_cache: forbiddenUserCache,
          NPM_CONFIG_CACHE: forbiddenUserCache,
        },
      },
    ))[0]);
    assert.equal(fs.existsSync(forbiddenUserCache), false, 'npm must not write the user cache');
  } finally {
    fs.rmSync(cacheProbe, { recursive: true, force: true });
  }
  const files = new Set(dryRun.files.map((file) => file.path));
  assert.equal(files.has('src/execution-contract-v1.js'), true);
  for (const schema of [
    'consumption-plan-1.schema.json',
    'agent-host-capabilities-1.schema.json',
    'agent-host-2-request.schema.json',
    'agent-host-2-receipt.schema.json',
    'judgment-trace-1.schema.json',
  ]) {
    assert.equal(files.has(`schema/${schema}`), true, schema);
  }
});

test('TypeScript declarations compile for Plan 1 and Host 2 public calls', () => {
  const tmp = fs.mkdtempSync(path.join(PACKAGE_ROOT, 'test', 'tmp-execution-types-'));
  try {
    fs.writeFileSync(
      path.join(tmp, 'check.ts'),
      [
        "import { parseExecutionContractJsonV1, validateConsumptionPlanV1, buildPreHostBudgetBlockedTraceV1, validatePreHostBudgetBlockedTraceV1, KDNAConsumptionPlanV1, KDNAJudgmentTraceV1, KDNAExecutionPairContextV1, KDNAHost2ValidationContextV1, KDNARuntimeCapsuleV2 } from '../..';",
        'const value = parseExecutionContractJsonV1("{}");',
        'declare const plan: KDNAConsumptionPlanV1;',
        'declare const trace: KDNAJudgmentTraceV1;',
        'declare const executionContext: KDNAExecutionPairContextV1;',
        'declare const hostContext: KDNAHost2ValidationContextV1;',
        'declare const capsule: KDNARuntimeCapsuleV2;',
        'const result = validateConsumptionPlanV1(plan, { trustedPlanDigest: plan.integrity.plan_digest });',
        "const blocked = buildPreHostBudgetBlockedTraceV1({ trace_id: 'trace_0123456789abcdef', timestamp: '2026-07-15T00:00:00.000Z', capsule }, hostContext);",
        'const blockedValidation = validatePreHostBudgetBlockedTraceV1(blocked, { ...hostContext, capsule });',
        '// @ts-expect-error caller errors cannot replace the canonical budget error',
        "buildPreHostBudgetBlockedTraceV1({ trace_id: 'trace_0123456789abcdef', timestamp: '2026-07-15T00:00:00.000Z', capsule, errors: [] }, hostContext);",
        'const selected: "2.0" | null = trace.runtime_contract.selected_capsule_version;',
        'const delivery: "matched" | "mismatched" | "not_delivered" | "not_observed" | "unavailable" = trace.capsule_delivery_evidence.host_boundary_comparison;',
        'const versions: readonly string[] = executionContext.coreCapsuleVersions;',
        'if (!result.valid) console.log(result.code, value, blockedValidation, selected, delivery, versions);',
      ].join('\n'),
    );
    runTsc([
      '--noEmit',
      '--strict',
      '--skipLibCheck',
      '--moduleResolution',
      'node16',
      '--module',
      'node16',
      '--target',
      'es2022',
      path.join(tmp, 'check.ts'),
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('npm pack cold install validates Plan 1, entrypoints, and types while offline', { timeout: 120000 }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-cold-'));
  try {
    installPackedCoreOffline(tmp);
    assert.equal(fs.existsSync(path.join(tmp, 'install-cache')), false);
    assert.equal(
      fs.readdirSync(tmp).some((name) => name.startsWith('pack-cache-')),
      false,
    );
    assert.equal(
      fs.readdirSync(tmp).some((name) => name.startsWith('dependency-staging-')),
      false,
    );
    fs.writeFileSync(
      path.join(tmp, 'golden.json'),
      JSON.stringify(golden),
    );
    const verify = [
      "const assert = require('node:assert/strict');",
      "const fs = require('node:fs');",
      "const core = require('@aikdna/kdna-core');",
      "const raw = fs.readFileSync('golden.json');",
      'const golden = core.parseExecutionContractJsonV1(raw);',
      'const result = core.validateConsumptionPlanV1(golden.plan, { trustedPlanDigest: golden.plan.integrity.plan_digest });',
      "if (!result.valid) throw new Error(result.code);",
      "if (core.computeConsumptionPlanDigestV1(golden.plan) !== golden.plan.integrity.plan_digest) throw new Error('digest mismatch');",
      'const limitedPlan = structuredClone(golden.plan);',
      'limitedPlan.budget.max_projection_chars = 1;',
      'limitedPlan.integrity.plan_digest = core.computeConsumptionPlanDigestV1(limitedPlan);',
      "const executionContext = { plan: limitedPlan, trustedPlanDigest: limitedPlan.integrity.plan_digest, capabilities: golden.capabilities, coreCapsuleVersions: ['2.0', '1.0'] };",
      "const blocked = core.buildPreHostBudgetBlockedTraceV1({ trace_id: 'trace_0123456789abcdef', timestamp: '2026-07-15T00:00:00.000Z', capsule: golden.request.capsule }, executionContext);",
      "if (blocked.budget.comparison.projection_chars !== 'exceeded' || blocked.capsule_delivery_evidence.request_id !== null || blocked.host_receipt !== null) throw new Error('packed pre-Host budget evidence mismatch');",
      'const blockedResult = core.validatePreHostBudgetBlockedTraceV1(blocked, { ...executionContext, capsule: golden.request.capsule });',
      "if (!blockedResult.valid) throw new Error(blockedResult.code);",
      "import('@aikdna/kdna-core').then((esm) => {",
      "  const cjsNames = Object.keys(core).sort();",
      "  const esmNames = Object.keys(esm).filter((name) => name !== 'default').sort();",
      "  if (JSON.stringify(cjsNames) !== JSON.stringify(esmNames)) throw new Error('installed CJS/ESM names differ');",
      "  for (const name of cjsNames) {",
      "    if (typeof core[name] === 'function') {",
      "      assert.equal(typeof esm[name], 'function', `installed export type differs: ${name}`);",
      "      assert.equal(esm[name].name, core[name].name, `installed export name differs: ${name}`);",
      "      assert.equal(esm[name].length, core[name].length, `installed export arity differs: ${name}`);",
      "      assert.equal(Function.prototype.toString.call(esm[name]), Function.prototype.toString.call(core[name]), `installed export implementation differs: ${name}`);",
      '    } else {',
      "      assert.deepStrictEqual(esm[name], core[name], `installed export differs: ${name}`);",
      '    }',
      '  }',
      '}).catch((error) => { console.error(error); process.exitCode = 1; });',
    ].join('\n');
    execFileSync(process.execPath, ['-e', verify], { cwd: tmp, stdio: 'pipe' });
    const checkPath = path.join(tmp, 'check.ts');
    fs.writeFileSync(checkPath, representativeTypesSource('@aikdna/kdna-core'));
    runTsc([
      '--noEmit',
      '--strict',
      '--moduleResolution',
      'node16',
      '--module',
      'node16',
      '--target',
      'es2022',
      checkPath,
    ], { cwd: tmp, stdio: 'pipe' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
