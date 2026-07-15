#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const core = require('../../packages/kdna-core/src');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const CORE_VERSIONS = ['0.1.0'];

function readJson(name) {
  return core.parseRuntimeContractJson(fs.readFileSync(path.join(HERE, name)));
}

function clone(value) {
  return globalThis.structuredClone(value);
}

function equalJson(left, right) {
  return core.canonicalizeJcs(left) === core.canonicalizeJcs(right);
}

const golden = readJson('golden.json');
const negotiationVectors = readJson('negotiation-cases.json');
const negativeVectors = readJson('negative-cases.json');
const auditNegativeVectors = readJson('audit-negative-cases.json');

function assertAuthoritativeCapsuleLineage() {
  const capsuleRoot = path.join(ROOT, 'conformance', 'runtime-capsule');
  const capsuleGolden = core.parseRuntimeContractJson(
    fs.readFileSync(path.join(capsuleRoot, 'golden.json')),
  );
  const capsuleBytes = Buffer.from(
    fs.readFileSync(path.join(capsuleRoot, capsuleGolden.fixture), 'utf8').trim(),
    'base64',
  );
  const capsule = core.loadRuntimeCapsule(capsuleBytes, {
    loadedAt: capsuleGolden.loaded_at,
    profile: 'compact',
    expectedDigests: {
      asset: { value: capsuleGolden.expected.asset, source: 'install_receipt' },
    },
  });
  assert.ok(
    equalJson(capsule, golden.request.capsule),
    'runtime request Capsule must reproduce from authoritative Capsule bytes',
  );
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    const evidence = capsule.digests[name];
    const expected = golden.plan.asset_ref.expected_digests[name];
    assert.equal(evidence.value, capsuleGolden.expected[name], `${name} authoritative digest`);
    assert.deepEqual(expected, {
      value: evidence.value,
      basis: evidence.basis,
      source: evidence.comparison.state === 'matched' ? evidence.comparison.source : 'caller',
      comparison: evidence.comparison.state,
    });
  }
}

function baseContext(overrides = {}) {
  return {
    plan: golden.plan,
    trustedPlanDigest: golden.plan.integrity.plan_digest,
    capabilities: golden.capabilities,
    coreCapsuleVersions: CORE_VERSIONS,
    request: golden.request,
    receipt: golden.receipt,
    trustedDeliveryObservation: 'host_receipt',
    ...overrides,
  };
}

function buildInputForPlan(plan) {
  return {
    plan_id: plan.plan_id,
    created_at: plan.created_at,
    task: plan.task,
    asset_ref: plan.asset_ref,
    projection_profile: plan.projection_request.profile,
    budget: plan.budget,
    constraints: plan.constraints,
    trace_policy: plan.trace_policy,
  };
}

function createHostMismatchReceipt() {
  const receipt = clone(golden.receipt);
  const mismatched = `sha256:${'0'.repeat(64)}`;
  receipt.runtime_receipt.host_recomputed_capsule_delivery_digest = mismatched;
  receipt.runtime_receipt.echoed_capsule_delivery_digest = mismatched;
  receipt.runtime_receipt.capsule_delivery_comparison = 'mismatched';
  receipt.runtime_receipt.provider_execution_status = 'not_started';
  receipt.runtime_receipt.usage = {
    elapsed_ms: 50,
    elapsed_basis: 'host_monotonic',
    tokens_used: null,
    model_calls: null,
    basis: 'not_observed',
  };
  receipt.outcome = null;
  return receipt;
}

function createHostMismatchTrace() {
  const receipt = createHostMismatchReceipt();
  return core.buildJudgmentTrace(
    {
      trace_id: 'trace_fedcba9876543210',
      timestamp: '2026-07-15T00:00:00.500Z',
      overall_status: 'blocked',
      errors: [
        {
          code: 'KDNA_CAPSULE_DELIVERY_DIGEST_MISMATCH',
          message: 'Host recomputed P did not match the sender-declared P.',
          phase: 'delivery',
        },
      ],
    },
    baseContext({ receipt }),
  );
}

function createHostPNotObservedTrace() {
  return core.buildJudgmentTrace(
    {
      trace_id: 'trace_0011223344556677',
      timestamp: '2026-07-15T00:00:00.500Z',
      overall_status: 'blocked',
      errors: [
        {
          code: 'KDNA_HOST_P_EVIDENCE_NOT_OBSERVED',
          message: 'The Host did not return independently correlated P comparison evidence.',
          phase: 'delivery',
        },
      ],
    },
    baseContext({ receipt: null, trustedDeliveryObservation: 'not_observed' }),
  );
}

const committedTraces = [
  readJson('trace-execution-completed.json'),
  readJson('blocked-source-directory-trace.json'),
  readJson('trace-execution-failed.json'),
  readJson('trace-cancelled.json'),
  readJson('trace-timed-out.json'),
];
const positiveTraces = [
  committedTraces[0],
  committedTraces[1],
  createHostMismatchTrace(),
  createHostPNotObservedTrace(),
  ...committedTraces.slice(2),
];

function contextForTrace(trace) {
  const sourceBlocked =
    trace.overall_status === 'blocked' &&
    trace.capsule_delivery_evidence.host_boundary_comparison === 'unavailable';
  return baseContext({
    request: sourceBlocked ? null : golden.request,
    receipt: trace.host_receipt,
    trustedDeliveryObservation: trace.host_receipt
      ? 'host_receipt'
      : trace.capsule_delivery_evidence.host_boundary_comparison === 'not_observed'
        ? 'not_observed'
        : 'not_delivered',
  });
}

function assertValid(label, result) {
  assert.equal(result.valid, true, `${label}: ${JSON.stringify(result.errors)}`);
}

function failureCode(result) {
  return result.valid ? null : result.code;
}

function applyMutation(input, vector) {
  const output = clone(input);
  const segments = vector.path
    .split('/')
    .slice(1)
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'));
  const key = segments.pop();
  let parent = output;
  for (const segment of segments) parent = parent[segment];
  if (vector.operation === 'remove') delete parent[key];
  else parent[key] = clone(vector.value);
  return output;
}

function validateGoldens() {
  assertAuthoritativeCapsuleLineage();
  assertValid(
    'ConsumptionPlan',
    core.validateConsumptionPlan(golden.plan, {
      trustedPlanDigest: golden.plan.integrity.plan_digest,
    }),
  );
  assert.equal(core.computeConsumptionPlanDigest(golden.plan), golden.plan.integrity.plan_digest);

  const builtPlan = core.buildConsumptionPlan(buildInputForPlan(golden.plan));
  assert.ok(equalJson(builtPlan, golden.plan), 'ConsumptionPlan builder must reproduce golden');

  const pair = core.negotiateRuntimePair(golden.plan, baseContext());
  assert.equal(pair.state, 'selected');

  assertValid('Agent Host request', core.validateAgentHostRequest(golden.request, baseContext()));
  const builtRequest = core.buildAgentHostRequest(
    { request_id: golden.request.request_id, capsule: golden.request.capsule },
    baseContext(),
  );
  assert.ok(equalJson(builtRequest, golden.request), 'Agent Host builder must reproduce golden');

  assertValid(
    'Agent Host receipt',
    core.validateAgentHostReceipt(golden.receipt, { request: golden.request }),
  );
  assert.ok(
    equalJson(
      core.deriveBudgetEvidence(golden.plan, {
        trustedPlanDigest: golden.plan.integrity.plan_digest,
        request: golden.request,
        receipt: golden.receipt,
      }),
      golden.trace.budget,
    ),
    'budget builder must reproduce golden',
  );

  const preHostPlan = clone(golden.plan);
  preHostPlan.budget.max_projection_chars = 1;
  preHostPlan.integrity.plan_digest = core.computeConsumptionPlanDigest(preHostPlan);
  const preHostContext = baseContext({
    plan: preHostPlan,
    trustedPlanDigest: preHostPlan.integrity.plan_digest,
  });
  assert.throws(
    () =>
      core.buildAgentHostRequest(
        { request_id: golden.request.request_id, capsule: golden.request.capsule },
        preHostContext,
      ),
    (error) => error?.code === 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED',
  );
  const preHostTrace = core.buildPreHostBudgetBlockedTrace(
    {
      trace_id: 'trace_abcdef0123456789',
      timestamp: '2026-07-15T00:00:00.500Z',
      capsule: golden.request.capsule,
    },
    preHostContext,
  );
  assert.equal(preHostTrace.capsule_delivery_evidence.host_boundary_comparison, 'not_delivered');
  assert.equal(preHostTrace.capsule_delivery_evidence.request_id, null);
  assert.equal(preHostTrace.host_receipt, null);
  assert.equal(preHostTrace.execution.execution_status, 'not_started');
  assert.equal(preHostTrace.budget.comparison.projection_chars, 'exceeded');
  assertValid(
    'pre-Host budget-blocked Trace',
    core.validatePreHostBudgetBlockedTrace(preHostTrace, {
      ...preHostContext,
      capsule: golden.request.capsule,
    }),
  );
  assert.throws(
    () =>
      core.buildPreHostBudgetBlockedTrace(
        {
          trace_id: 'trace_abcdef0123456789',
          timestamp: '2026-07-15T00:00:00.500Z',
          capsule: golden.request.capsule,
        },
        baseContext(),
      ),
    (error) => error?.code === 'KDNA_PRE_HOST_BUDGET_NOT_EXCEEDED',
  );

  for (const trace of positiveTraces) {
    const context = contextForTrace(trace);
    assertValid(trace.overall_status, core.validateJudgmentTrace(trace, context));
    const builtTrace = core.buildJudgmentTrace(
      {
        trace_id: trace.trace_id,
        timestamp: trace.timestamp,
        parent_trace_id: trace.parent_trace_id,
        overall_status: trace.overall_status,
        result_stored: trace.result_ref?.stored,
        errors: trace.errors,
        warnings: trace.warnings,
      },
      context,
    );
    assert.ok(equalJson(builtTrace, trace), `${trace.trace_id}: builder must reproduce Trace`);
  }

  for (const trace of positiveTraces.filter((value) => value.overall_status !== 'blocked')) {
    const invalid = clone(trace);
    invalid.capsule_delivery_evidence.host_boundary_comparison = 'mismatched';
    assert.equal(
      failureCode(core.validateJudgmentTrace(invalid, contextForTrace(trace))),
      'SCHEMA_INVALID',
      `${trace.overall_status} must reject P mismatched outside blocked`,
    );
  }

  const limitedPlan = clone(golden.plan);
  limitedPlan.budget.max_tokens = 1;
  limitedPlan.integrity.plan_digest = core.computeConsumptionPlanDigest(limitedPlan);
  const limitedRequest = clone(golden.request);
  limitedRequest.plan_ref.plan_digest = limitedPlan.integrity.plan_digest;
  limitedRequest.budget.max_tokens = 1;
  const limitedTrace = clone(golden.trace);
  limitedTrace.plan_ref.plan_digest = limitedPlan.integrity.plan_digest;
  limitedTrace.budget.limits.max_tokens = 1;
  limitedTrace.budget.comparison.tokens_used = 'not_observed';
  limitedTrace.budget.comparison.overall = 'not_observed';
  assertValid(
    'finite unobserved token limit',
    core.validateJudgmentTrace(
      limitedTrace,
      baseContext({
        plan: limitedPlan,
        trustedPlanDigest: limitedPlan.integrity.plan_digest,
        request: limitedRequest,
      }),
    ),
  );

  assert.throws(
    () => core.loadRuntimeCapsule(path.join(ROOT, 'examples', 'minimal')),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
}

function validateNegotiationVectors() {
  for (const vector of negotiationVectors.cases) {
    const plan = clone(golden.plan);
    plan.projection_request.accepted_capsule_versions = clone(vector.plan_capsule_versions);
    plan.host_request.accepted_protocols = clone(vector.plan_host_protocols);
    plan.integrity.plan_digest = core.computeConsumptionPlanDigest(plan);
    assert.deepEqual(
      core.negotiateRuntimePair(plan, {
        trustedPlanDigest: plan.integrity.plan_digest,
        capabilities: vector.capabilities,
        coreCapsuleVersions: vector.core_capsule_versions,
      }),
      vector.expected,
      vector.name,
    );
  }
}

function validateMutated(base, value) {
  if (base === 'plan') {
    return core.validateConsumptionPlan(value, {
      trustedPlanDigest: golden.plan.integrity.plan_digest,
    });
  }
  if (base === 'capabilities') {
    const pair = core.negotiateRuntimePair(golden.plan, {
      trustedPlanDigest: golden.plan.integrity.plan_digest,
      capabilities: value,
      coreCapsuleVersions: CORE_VERSIONS,
    });
    return pair.state === 'selected'
      ? { valid: true, code: null }
      : { valid: false, code: pair.issue_code };
  }
  if (base === 'request') return core.validateAgentHostRequest(value, baseContext());
  if (base === 'receipt') {
    return core.validateAgentHostReceipt(value, { request: golden.request });
  }
  if (base === 'trace') return core.validateJudgmentTrace(value, baseContext());
  throw new Error(`unknown vector base ${base}`);
}

function validateNegativeVectors() {
  for (const vector of negativeVectors.cases) {
    const value = applyMutation(golden[vector.base], vector);
    assert.equal(
      failureCode(validateMutated(vector.base, value)),
      vector.expected_code,
      vector.name,
    );
  }
}

function validateAuditNegativeVectors() {
  const scenarios = {
    'plan-advertises-multiple-capsule-contracts'() {
      const plan = clone(golden.plan);
      plan.projection_request.accepted_capsule_versions = ['0.1.0', '9.9.9'];
      return failureCode(
        core.validateConsumptionPlan(plan, {
          trustedPlanDigest: golden.plan.integrity.plan_digest,
        }),
      );
    },
    'unregistered-descriptor-selected-for-stable-plan'() {
      return core.negotiateRuntimePair(golden.plan, {
        trustedPlanDigest: golden.plan.integrity.plan_digest,
        coreCapsuleVersions: ['0.1.0'],
        capabilities: {
          type: 'kdna.agent-host-capabilities',
          protocol_version: '0.1.0',
          capability_basis: 'legacy_assumption',
          host_protocols: ['kdna.agent-host'],
          capsule_versions: ['0.1.0'],
          capsule_digest_profiles: ['kdna.canonicalization.runtime-capsule-jcs'],
          capsule_digest_profile_versions: ['0.1.0'],
        },
      }).issue_code;
    },
    'request-without-plan-ref'() {
      const request = clone(golden.request);
      delete request.plan_ref;
      return failureCode(core.validateAgentHostRequest(request, baseContext()));
    },
    'coordinated-asset-substitution'() {
      const plan = clone(golden.plan);
      plan.asset_ref.asset_id = 'kdna:example:coordinated-substitution';
      plan.integrity.plan_digest = core.computeConsumptionPlanDigest(plan);
      return failureCode(
        core.validateConsumptionPlan(plan, {
          trustedPlanDigest: golden.plan.integrity.plan_digest,
        }),
      );
    },
    'trace-host-descriptor-substitution'() {
      const trace = clone(golden.trace);
      trace.runtime_contract.host_capabilities.capability_basis = 'legacy_assumption';
      return failureCode(core.validateJudgmentTrace(trace, baseContext()));
    },
    'forged-budget-actual'() {
      const trace = clone(golden.trace);
      trace.budget.actual.projection_chars = 1;
      return failureCode(core.validateJudgmentTrace(trace, baseContext()));
    },
    'terminal-status-receipt-mismatch'() {
      const trace = clone(golden.trace);
      trace.overall_status = 'execution_failed';
      trace.execution.execution_status = 'failed';
      trace.result_ref = null;
      trace.errors = [
        { code: 'KDNA_HOST_EXECUTION_FAILED', message: 'Forged failure.', phase: 'execution' },
      ];
      return failureCode(core.validateJudgmentTrace(trace, baseContext()));
    },
    'completed-over-projection-budget'() {
      const plan = clone(golden.plan);
      plan.budget.max_projection_chars = 1000;
      plan.integrity.plan_digest = core.computeConsumptionPlanDigest(plan);
      const request = clone(golden.request);
      request.plan_ref.plan_digest = plan.integrity.plan_digest;
      request.budget.max_projection_chars = 1000;
      const trace = clone(golden.trace);
      trace.plan_ref.plan_digest = plan.integrity.plan_digest;
      trace.budget.limits.max_projection_chars = 1000;
      trace.budget.comparison.projection_chars = 'exceeded';
      trace.budget.comparison.overall = 'exceeded';
      return failureCode(
        core.validateJudgmentTrace(
          trace,
          baseContext({
            plan,
            trustedPlanDigest: plan.integrity.plan_digest,
            request,
          }),
        ),
      );
    },
    'trace-elapsed-self-rewrite'() {
      const trace = clone(golden.trace);
      trace.budget.actual.elapsed_ms = 1;
      return failureCode(core.validateJudgmentTrace(trace, baseContext()));
    },
    'finite-token-limit-unobserved-overall'() {
      const plan = clone(golden.plan);
      plan.budget.max_tokens = 1;
      plan.integrity.plan_digest = core.computeConsumptionPlanDigest(plan);
      const request = clone(golden.request);
      request.plan_ref.plan_digest = plan.integrity.plan_digest;
      request.budget.max_tokens = 1;
      const trace = clone(golden.trace);
      trace.plan_ref.plan_digest = plan.integrity.plan_digest;
      trace.budget.limits.max_tokens = 1;
      trace.budget.comparison.tokens_used = 'not_observed';
      trace.budget.comparison.overall = 'within_limit';
      return failureCode(
        core.validateJudgmentTrace(
          trace,
          baseContext({
            plan,
            trustedPlanDigest: plan.integrity.plan_digest,
            request,
          }),
        ),
      );
    },
    'p-mismatch-provider-execution'() {
      const trace = createHostMismatchTrace();
      trace.host_receipt.runtime_receipt.provider_execution_status = 'completed';
      return failureCode(
        core.validateJudgmentTrace(trace, baseContext({ receipt: trace.host_receipt })),
      );
    },
    'p-mismatch-equal-values'() {
      const receipt = createHostMismatchReceipt();
      const p = golden.request.runtime_contract.capsule_delivery_digest;
      receipt.runtime_receipt.host_recomputed_capsule_delivery_digest = p;
      receipt.runtime_receipt.echoed_capsule_delivery_digest = p;
      const trace = createHostMismatchTrace();
      trace.capsule_delivery_evidence.host_recomputed = p;
      trace.capsule_delivery_evidence.host_echoed = p;
      trace.host_receipt = receipt;
      return failureCode(core.validateJudgmentTrace(trace, baseContext({ receipt })));
    },
  };

  for (const vector of auditNegativeVectors.cases) {
    assert.ok(scenarios[vector.scenario], `${vector.name}: unknown audit scenario`);
    assert.equal(scenarios[vector.scenario](), vector.expected_code, vector.name);
  }
}

function validateRawJsonBoundary() {
  assert.deepEqual(core.parseRuntimeContractJson('{"outer":{"value":1},"items":[true,null]}'), {
    outer: { value: 1 },
    items: [true, null],
  });
  assert.throws(
    () => core.parseRuntimeContractJson('{"a":1,"\\u0061":2}'),
    (error) => error.code === 'KDNA_JSON_DUPLICATE_KEY',
  );
  assert.throws(
    () => core.parseRuntimeContractJson(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])),
    (error) => error.code === 'KDNA_JSON_BOM_FORBIDDEN',
  );
  const proto = core.parseRuntimeContractJson('{"__proto__":{"polluted":true}}');
  assert.equal(Object.prototype.hasOwnProperty.call(proto, '__proto__'), true);
  assert.equal(Object.getPrototypeOf(proto), Object.prototype);
  assert.equal({}.polluted, undefined);
}

validateGoldens();
validateNegotiationVectors();
validateNegativeVectors();
validateAuditNegativeVectors();
validateRawJsonBoundary();

console.log(
  `Runtime contract valid through @aikdna/kdna-core: ${positiveTraces.length} terminal traces, ${negotiationVectors.cases.length} negotiation vectors, ${negativeVectors.cases.length + auditNegativeVectors.cases.length} negative vectors`,
);
