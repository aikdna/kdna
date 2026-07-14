#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const require = createRequire(import.meta.url);
const core = require('../../packages/kdna-core/src');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const SPECS = path.join(ROOT, 'specs');

const golden = readJson('golden.json');
const positiveTraces = [
  readJson('trace-execution-completed.json'),
  readJson('blocked-source-directory-trace.json'),
  createHostMismatchTrace(),
  createHostPNotObservedTrace(),
  readJson('trace-execution-failed.json'),
  readJson('trace-cancelled.json'),
  readJson('trace-timed-out.json'),
];
const negotiationVectors = readJson('negotiation-cases.json');
const negativeVectors = readJson('negative-cases.json');
const auditNegativeVectors = readJson('audit-negative-cases.json');

const schemaFiles = [
  'digest-evidence.schema.json',
  'runtime-capsule-2.schema.json',
  'consumption-plan-1.schema.json',
  'agent-host-capabilities-1.schema.json',
  'agent-host-2-request.schema.json',
  'agent-host-2-receipt.schema.json',
  'judgment-trace-1.schema.json',
];

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schemas = new Map();
for (const file of schemaFiles) {
  const schema = JSON.parse(fs.readFileSync(path.join(SPECS, file), 'utf8'));
  schemas.set(file, schema);
  ajv.addSchema(schema);
}

const validators = {
  plan: ajv.getSchema(schemas.get('consumption-plan-1.schema.json').$id),
  capabilities: ajv.getSchema(schemas.get('agent-host-capabilities-1.schema.json').$id),
  request: ajv.getSchema(schemas.get('agent-host-2-request.schema.json').$id),
  receipt: ajv.getSchema(schemas.get('agent-host-2-receipt.schema.json').$id),
  trace: ajv.getSchema(schemas.get('judgment-trace-1.schema.json').$id),
};

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(HERE, name), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function createHostMismatchTrace() {
  const trace = structuredClone(golden.trace);
  const mismatched = `sha256:${'0'.repeat(64)}`;
  trace.trace_id = 'trace_fedcba9876543210';
  trace.overall_status = 'blocked';
  trace.capsule_delivery_evidence.host_recomputed = mismatched;
  trace.capsule_delivery_evidence.host_echoed = mismatched;
  trace.capsule_delivery_evidence.host_boundary_comparison = 'mismatched';
  trace.host_receipt.runtime_receipt.host_recomputed_capsule_delivery_digest = mismatched;
  trace.host_receipt.runtime_receipt.echoed_capsule_delivery_digest = mismatched;
  trace.host_receipt.runtime_receipt.capsule_delivery_comparison = 'mismatched';
  trace.host_receipt.runtime_receipt.provider_execution_status = 'not_started';
  trace.host_receipt.runtime_receipt.usage = {
    elapsed_ms: 50,
    elapsed_basis: 'host_monotonic',
    tokens_used: null,
    model_calls: null,
    basis: 'not_observed',
  };
  trace.host_receipt.outcome = null;
  trace.execution.delivery_status = 'rejected_before_execution';
  trace.execution.execution_status = 'not_started';
  trace.budget.actual.elapsed_ms = 50;
  trace.budget.actual.elapsed_basis = 'host_monotonic';
  trace.result_ref = null;
  trace.errors = [
    {
      code: 'KDNA_CAPSULE_DELIVERY_DIGEST_MISMATCH',
      message: 'Host recomputed P did not match the sender-declared P.',
      phase: 'delivery',
    },
  ];
  return trace;
}

function createHostPNotObservedTrace() {
  const trace = createHostMismatchTrace();
  trace.trace_id = 'trace_0011223344556677';
  trace.capsule_delivery_evidence.host_recomputed = null;
  trace.capsule_delivery_evidence.host_echoed = null;
  trace.capsule_delivery_evidence.host_boundary_comparison = 'not_observed';
  trace.host_receipt = null;
  trace.budget.actual.elapsed_ms = null;
  trace.budget.actual.elapsed_basis = 'not_observed';
  trace.budget.comparison.elapsed_ms = 'not_observed';
  trace.budget.comparison.overall = 'not_observed';
  trace.errors = [
    {
      code: 'KDNA_HOST_P_EVIDENCE_NOT_OBSERVED',
      message: 'The Host did not return independently correlated P comparison evidence.',
      phase: 'delivery',
    },
  ];
  return trace;
}

function equalJson(left, right) {
  return core.canonicalizeJcs(left) === core.canonicalizeJcs(right);
}

function digestJcs(value) {
  return `sha256:${crypto
    .createHash('sha256')
    .update(Buffer.from(core.canonicalizeJcs(value), 'utf8'))
    .digest('hex')}`;
}

function jcsCharacterCount(value) {
  return [...core.canonicalizeJcs(value)].length;
}

export function computePlanDigest(plan) {
  const projection = clone(plan);
  delete projection.integrity;
  return digestJcs(projection);
}

export function negotiateExecutionPair(input) {
  const hasCapsule =
    input.plan_capsule_versions.includes('2.0') &&
    input.core_capsule_versions.includes('2.0') &&
    input.capabilities.capsule_versions.includes('2.0');
  if (!hasCapsule) return blocked('KDNA_CAPSULE_VERSION_UNSUPPORTED');

  const hasProtocol =
    input.plan_host_protocols.includes('kdna.agent-host/2') &&
    input.capabilities.host_protocols.includes('kdna.agent-host/2');
  if (!hasProtocol) return blocked('KDNA_HOST_PROTOCOL_UNSUPPORTED');

  const hasVerifiablePair =
    input.capabilities.capability_basis === 'registered_descriptor' &&
    input.capabilities.capsule_digest_profiles.includes('kdna-capsule-jcs-v1');
  if (!hasVerifiablePair) return blocked('KDNA_HOST_CAPSULE_PAIR_UNSUPPORTED');

  return {
    state: 'selected',
    capsule_version: '2.0',
    host_protocol: 'kdna.agent-host/2',
    issue_code: null,
  };
}

function blocked(issueCode) {
  return {
    state: 'blocked',
    capsule_version: null,
    host_protocol: null,
    issue_code: issueCode,
  };
}

function validatePlanSemantics(plan, trustedPlanDigest = null) {
  const computed = computePlanDigest(plan);
  if (computed !== plan.integrity.plan_digest) return 'KDNA_PLAN_DIGEST_MISMATCH';
  if (trustedPlanDigest !== null && computed !== trustedPlanDigest) {
    return 'KDNA_TRUSTED_PLAN_DIGEST_MISMATCH';
  }
  return null;
}

function expectedAgainst(source) {
  if (source === 'kdna.json.content_digest') return 'manifest_declaration';
  if (source === 'checksums.json.entry_set_digest' || source === 'checksums.json.asset_digest') {
    return 'checksum_declaration';
  }
  return 'external_expected';
}

function validateExpectedDigests(expectedDigests, capsuleDigests) {
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    const expected = expectedDigests[name];
    if (expected === null) continue;
    const observed = capsuleDigests[name];
    if (observed.value !== expected.value || observed.basis !== expected.basis) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
    if (observed.comparison.state !== expected.comparison) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
    if (expected.comparison === 'matched') {
      if (
        observed.comparison.expected !== expected.value ||
        observed.comparison.source !== expected.source ||
        observed.comparison.against !== expectedAgainst(expected.source)
      ) {
        return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
      }
    } else if (
      observed.comparison.expected !== null ||
      observed.comparison.source !== null ||
      observed.comparison.against !== null
    ) {
      return 'KDNA_HOST_DIGEST_EXPECTATION_MISMATCH';
    }
  }
  return null;
}

function validateRequestSemantics(request, plan = golden.plan, enforceBudget = true) {
  if (
    request.plan_ref.plan_id !== plan.plan_id ||
    request.plan_ref.plan_digest_profile !== plan.integrity.profile ||
    request.plan_ref.plan_digest !== plan.integrity.plan_digest ||
    computePlanDigest(plan) !== plan.integrity.plan_digest
  ) {
    return 'KDNA_HOST_PLAN_REF_MISMATCH';
  }
  if (!equalJson(request.task, plan.task)) return 'KDNA_HOST_TASK_MISMATCH';
  if (request.authority.asset_id !== plan.asset_ref.asset_id) {
    return 'KDNA_HOST_ASSET_ID_MISMATCH';
  }

  const expectedRequestAsset = {
    ...plan.asset_ref,
    role: 'primary',
  };
  if (!equalJson(request.asset, expectedRequestAsset)) return 'KDNA_HOST_ASSET_REF_MISMATCH';

  const capsuleAsset = request.capsule.asset;
  for (const field of ['asset_id', 'asset_uid', 'version', 'judgment_version']) {
    if (capsuleAsset[field] !== plan.asset_ref[field]) return 'KDNA_HOST_ASSET_REF_MISMATCH';
  }
  if (request.capsule.access !== plan.asset_ref.access) return 'KDNA_HOST_ASSET_REF_MISMATCH';

  if (
    request.runtime_contract.capsule_version !== request.capsule.version ||
    request.capsule.version !== '2.0'
  ) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }
  if (
    request.runtime_contract.capsule_digest_profile !== 'kdna-capsule-jcs-v1' ||
    request.capsule.digests.profile !== plan.projection_request.required_digest_profile
  ) {
    return 'KDNA_HOST_PROJECTION_CONTRACT_MISMATCH';
  }

  const expectedProjectionContract = {
    profile: plan.projection_request.profile,
    required_digest_profile: plan.projection_request.required_digest_profile,
    require_packaged_asset: plan.projection_request.require_packaged_asset,
  };
  if (
    !equalJson(request.projection_contract, expectedProjectionContract) ||
    request.capsule.profile !== request.projection_contract.profile
  ) {
    return 'KDNA_HOST_PROJECTION_CONTRACT_MISMATCH';
  }
  if (!equalJson(request.result_contract, plan.result_request)) {
    return 'KDNA_HOST_RESULT_CONTRACT_MISMATCH';
  }
  if (!equalJson(request.budget, plan.budget)) return 'KDNA_HOST_BUDGET_MISMATCH';
  if (!equalJson(request.constraints, plan.constraints)) return 'KDNA_HOST_CONSTRAINTS_MISMATCH';
  if (
    enforceBudget &&
    (jcsCharacterCount(request.capsule) > request.budget.max_projection_chars ||
      jcsCharacterCount(request.task) > request.budget.max_task_chars)
  ) {
    return 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED';
  }

  const digestError = validateExpectedDigests(
    plan.asset_ref.expected_digests,
    request.capsule.digests,
  );
  if (digestError) return digestError;

  if (digestJcs(request.capsule) !== request.runtime_contract.capsule_delivery_digest) {
    return 'KDNA_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  return null;
}

function validateReceiptSemantics(receipt, request) {
  if (receipt.protocol !== request.protocol || receipt.request_id !== request.request_id) {
    return 'KDNA_HOST_REQUEST_ID_MISMATCH';
  }
  const runtimeReceipt = receipt.runtime_receipt;
  const senderP = request.runtime_contract.capsule_delivery_digest;
  const recomputedP = digestJcs(request.capsule);
  if (
    runtimeReceipt.sender_capsule_delivery_digest !== senderP ||
    runtimeReceipt.echoed_capsule_delivery_digest !==
      runtimeReceipt.host_recomputed_capsule_delivery_digest
  ) {
    return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }

  if (runtimeReceipt.capsule_delivery_comparison === 'mismatched') {
    if (
      runtimeReceipt.host_recomputed_capsule_delivery_digest === senderP ||
      runtimeReceipt.provider_execution_status !== 'not_started' ||
      receipt.outcome !== null
    ) {
      return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
    }
  } else if (
    runtimeReceipt.capsule_delivery_comparison !== 'matched' ||
    runtimeReceipt.provider_execution_status === 'not_started' ||
    runtimeReceipt.host_recomputed_capsule_delivery_digest !== recomputedP
  ) {
    return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (
    runtimeReceipt.capsule_version !== request.runtime_contract.capsule_version ||
    runtimeReceipt.capsule_digest_profile !== request.runtime_contract.capsule_digest_profile
  ) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }

  const outcomeUsage = receipt.outcome?.usage ?? null;
  const observed = runtimeReceipt.usage;
  if (receipt.outcome === null) return null;
  if (outcomeUsage === null) {
    if (
      observed.basis !== 'not_observed' ||
      observed.tokens_used !== null ||
      observed.model_calls !== null
    ) {
      return 'KDNA_HOST_USAGE_MISMATCH';
    }
  } else if (
    observed.basis !== 'host_reported' ||
    observed.tokens_used !== outcomeUsage.tokens_used ||
    observed.model_calls !== outcomeUsage.model_calls
  ) {
    return 'KDNA_HOST_USAGE_MISMATCH';
  }
  return null;
}

function compareObserved(value, limit, unobserved = 'not_observed') {
  if (limit === null) return 'not_limited';
  if (value === null) return unobserved;
  return value <= limit ? 'within_limit' : 'exceeded';
}

function expectedBudgetEvidence(plan, request, receipt) {
  const projectionChars = request === null ? null : jcsCharacterCount(request.capsule);
  const taskChars = jcsCharacterCount(plan.task);
  const usage = receipt?.runtime_receipt.usage ?? {
    elapsed_ms: null,
    elapsed_basis: 'not_observed',
    tokens_used: null,
    model_calls: null,
    basis: 'not_observed',
  };
  const actual = {
    projection_chars: projectionChars,
    task_chars: taskChars,
    elapsed_ms: usage.elapsed_ms,
    elapsed_basis: usage.elapsed_basis,
    tokens_used: usage.tokens_used,
    model_calls: usage.model_calls,
    usage_basis: usage.basis,
  };
  const comparison = {
    projection_chars: compareObserved(projectionChars, plan.budget.max_projection_chars),
    task_chars: compareObserved(taskChars, plan.budget.max_task_chars),
    elapsed_ms: compareObserved(actual.elapsed_ms, plan.budget.deadline_ms),
    tokens_used: compareObserved(usage.tokens_used, plan.budget.max_tokens),
    model_calls: compareObserved(usage.model_calls, plan.budget.max_model_calls),
  };
  const dimensionStates = Object.values(comparison);
  comparison.overall = dimensionStates.includes('exceeded')
    ? 'exceeded'
    : dimensionStates.includes('not_observed')
      ? 'not_observed'
      : 'within_limit';
  return { limits: plan.budget, actual, comparison };
}

function validateTerminalState(trace, receipt) {
  const table = {
    execution_completed: ['completed', 'completed', true, 0],
    execution_failed: ['failed', 'failed', false, 1],
    cancelled: ['cancelled', 'cancelled', false, 1],
    timed_out: ['timed_out', 'timed_out', false, 1],
  };

  if (trace.overall_status === 'blocked') {
    if (
      trace.result_ref !== null ||
      trace.execution.execution_status !== 'not_started' ||
      trace.errors.length < 1
    ) {
      return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
    }
    return null;
  }

  const expected = table[trace.overall_status];
  if (!expected || receipt === null) return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  const [providerStatus, executionStatus, hasResult, minimumErrors] = expected;
  if (
    receipt.runtime_receipt.provider_execution_status !== providerStatus ||
    trace.execution.execution_status !== executionStatus ||
    trace.execution.delivery_status !== 'correlated_response' ||
    (trace.result_ref !== null) !== hasResult ||
    trace.errors.length < minimumErrors
  ) {
    return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  }
  if (trace.overall_status === 'execution_completed' && trace.errors.length !== 0) {
    return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
  }
  return null;
}

function validateTraceSemantics(
  trace,
  plan,
  request,
  receipt,
  capabilities = golden.capabilities,
  coreCapsuleVersions = ['2.0', '1.0'],
) {
  if (
    trace.plan_ref.plan_id !== plan.plan_id ||
    trace.plan_ref.plan_digest_profile !== plan.integrity.profile ||
    trace.plan_ref.plan_digest !== plan.integrity.plan_digest ||
    trace.plan_ref.plan_digest !== computePlanDigest(plan)
  ) {
    return 'KDNA_TRACE_PLAN_REF_MISMATCH';
  }
  const runtime = trace.runtime_contract;
  if (
    !equalJson(runtime.plan_capsule_versions, plan.projection_request.accepted_capsule_versions) ||
    !equalJson(runtime.plan_host_protocols, plan.host_request.accepted_protocols) ||
    !equalJson(runtime.core_capsule_versions, coreCapsuleVersions) ||
    !equalJson(runtime.host_capabilities, capabilities)
  ) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }

  if (!equalJson(trace.asset_identity, withoutExpectedDigests(plan.asset_ref))) {
    return 'KDNA_TRACE_ASSET_IDENTITY_MISMATCH';
  }
  if (!equalJson(trace.budget.limits, plan.budget)) return 'KDNA_TRACE_BUDGET_MISMATCH';

  if (trace.overall_status === 'blocked') {
    if (!equalJson(trace.host_receipt, receipt)) {
      return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';
    }
    if (request !== null) {
      if (validateRequestSemantics(request, plan, false) !== null) {
        return 'KDNA_TRACE_REQUEST_MISMATCH';
      }
      const negotiation = negotiateExecutionPair({
        plan_capsule_versions: runtime.plan_capsule_versions,
        plan_host_protocols: runtime.plan_host_protocols,
        core_capsule_versions: runtime.core_capsule_versions,
        capabilities: runtime.host_capabilities,
      });
      if (
        negotiation.state !== 'selected' ||
        runtime.negotiation_state !== 'selected' ||
        runtime.selected_capsule_version !== negotiation.capsule_version ||
        runtime.selected_host_protocol !== negotiation.host_protocol ||
        runtime.issue_code !== null
      ) {
        return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
      }
      if (
        !equalJson(trace.asset_identity, withoutExpectedDigests(request.asset)) ||
        !equalJson(trace.digest_evidence, request.capsule.digests)
      ) {
        return 'KDNA_TRACE_DIGEST_EVIDENCE_MISMATCH';
      }
      const p = request.runtime_contract.capsule_delivery_digest;
      const delivery = trace.capsule_delivery_evidence;
      const projectionMismatch =
        trace.projection_actual.profile !== request.projection_contract.profile ||
        trace.projection_actual.capsule_delivery_digest !== p ||
        trace.projection_actual.profile_deviated_from_plan !== false;
      if (delivery.observed !== p || delivery.sender_computed !== true || projectionMismatch) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }

      if (delivery.host_boundary_comparison === 'mismatched') {
        if (
          receipt === null ||
          validateReceiptSemantics(receipt, request) !== null ||
          receipt.runtime_receipt.capsule_delivery_comparison !== 'mismatched' ||
          delivery.host_recomputed !==
            receipt.runtime_receipt.host_recomputed_capsule_delivery_digest ||
          delivery.host_echoed !== receipt.runtime_receipt.echoed_capsule_delivery_digest ||
          delivery.host_recomputed === p ||
          delivery.delivered_capsule_version !== '2.0' ||
          delivery.request_id !== request.request_id ||
          trace.execution.delivery_status !== 'rejected_before_execution'
        ) {
          return 'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH';
        }
      } else if (delivery.host_boundary_comparison === 'not_observed') {
        if (
          receipt !== null ||
          delivery.host_recomputed !== null ||
          delivery.host_echoed !== null ||
          delivery.delivered_capsule_version !== '2.0' ||
          delivery.request_id !== request.request_id ||
          trace.execution.delivery_status !== 'rejected_before_execution'
        ) {
          return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
        }
      } else if (
        receipt !== null ||
        delivery.host_recomputed !== null ||
        delivery.host_echoed !== null ||
        delivery.delivered_capsule_version !== null ||
        delivery.host_boundary_comparison !== 'not_delivered' ||
        delivery.request_id !== null ||
        trace.execution.delivery_status !== 'not_delivered'
      ) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }

      const expectedBudget = expectedBudgetEvidence(plan, request, receipt);
      if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
      return validateTerminalState(trace, null);
    }

    if (
      runtime.selected_capsule_version !== null ||
      runtime.selected_host_protocol !== null ||
      !['not_started', 'blocked'].includes(runtime.negotiation_state) ||
      trace.capsule_delivery_evidence.host_recomputed !== null ||
      trace.capsule_delivery_evidence.host_echoed !== null ||
      trace.capsule_delivery_evidence.host_boundary_comparison !== 'unavailable' ||
      trace.projection_actual.profile !== null ||
      trace.projection_actual.capsule_delivery_digest !== null ||
      trace.projection_actual.profile_deviated_from_plan !== null
    ) {
      return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
    }
    for (const name of ['asset', 'content', 'runtime_entry_set']) {
      if (
        trace.digest_evidence[name].value !== null ||
        trace.digest_evidence[name].comparison.state !== 'unavailable'
      ) {
        return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
      }
    }
    if (runtime.negotiation_state === 'not_started' && runtime.issue_code !== null) {
      return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
    }
    if (runtime.negotiation_state === 'blocked') {
      const negotiation = negotiateExecutionPair({
        plan_capsule_versions: runtime.plan_capsule_versions,
        plan_host_protocols: runtime.plan_host_protocols,
        core_capsule_versions: runtime.core_capsule_versions,
        capabilities: runtime.host_capabilities,
      });
      if (negotiation.state !== 'blocked' || runtime.issue_code !== negotiation.issue_code) {
        return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
      }
    }
    if (receipt !== null || trace.execution.delivery_status !== 'not_delivered') {
      return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
    }
    const expectedBudget = expectedBudgetEvidence(plan, null, null);
    if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
    return validateTerminalState(trace, null);
  }

  if (request === null || receipt === null) return 'KDNA_TRACE_TERMINAL_STATE_MISMATCH';

  const requestError = validateRequestSemantics(request, plan);
  if (requestError === 'KDNA_HOST_BUDGET_LIMIT_EXCEEDED') {
    return 'KDNA_TRACE_BUDGET_LIMIT_VIOLATION';
  }
  if (requestError !== null) return 'KDNA_TRACE_REQUEST_MISMATCH';
  if (validateReceiptSemantics(receipt, request) !== null) {
    return 'KDNA_TRACE_HOST_RECEIPT_MISMATCH';
  }

  const negotiation = negotiateExecutionPair({
    plan_capsule_versions: runtime.plan_capsule_versions,
    plan_host_protocols: runtime.plan_host_protocols,
    core_capsule_versions: runtime.core_capsule_versions,
    capabilities: runtime.host_capabilities,
  });
  if (
    negotiation.state !== 'selected' ||
    runtime.negotiation_state !== negotiation.state ||
    runtime.selected_capsule_version !== negotiation.capsule_version ||
    runtime.selected_host_protocol !== negotiation.host_protocol ||
    runtime.issue_code !== null
  ) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }
  if (!runtime.core_capsule_versions.includes(runtime.selected_capsule_version)) {
    return 'KDNA_TRACE_NEGOTIATION_EVIDENCE_MISMATCH';
  }
  if (!equalJson(trace.asset_identity, withoutExpectedDigests(request.asset))) {
    return 'KDNA_TRACE_ASSET_IDENTITY_MISMATCH';
  }
  if (!equalJson(trace.digest_evidence, request.capsule.digests)) {
    return 'KDNA_TRACE_DIGEST_EVIDENCE_MISMATCH';
  }

  const p = request.runtime_contract.capsule_delivery_digest;
  const delivery = trace.capsule_delivery_evidence;
  const runtimeReceipt = receipt.runtime_receipt;
  if (
    delivery.observed !== p ||
    delivery.host_boundary_comparison !== 'matched' ||
    delivery.host_recomputed !== runtimeReceipt.host_recomputed_capsule_delivery_digest ||
    delivery.host_recomputed !== p ||
    delivery.host_echoed !== runtimeReceipt.echoed_capsule_delivery_digest ||
    delivery.host_echoed !== p ||
    delivery.delivered_capsule_version !== request.runtime_contract.capsule_version ||
    delivery.request_id !== request.request_id ||
    trace.projection_actual.profile !== request.projection_contract.profile ||
    trace.projection_actual.capsule_delivery_digest !== p ||
    trace.projection_actual.profile_deviated_from_plan !== false
  ) {
    return 'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (!equalJson(trace.host_receipt, receipt)) return 'KDNA_TRACE_HOST_RECEIPT_MISMATCH';
  if (
    !equalJson(trace.execution.semantic_consumption, runtimeReceipt.semantic_consumption) ||
    !equalJson(trace.execution.model_identity, runtimeReceipt.model_identity)
  ) {
    return 'KDNA_TRACE_EXECUTION_EVIDENCE_MISMATCH';
  }

  const expectedBudget = expectedBudgetEvidence(plan, request, receipt);
  if (!equalJson(trace.budget, expectedBudget)) return 'KDNA_TRACE_BUDGET_MISMATCH';
  if (trace.overall_status !== 'timed_out' && expectedBudget.comparison.overall === 'exceeded') {
    return 'KDNA_TRACE_BUDGET_LIMIT_VIOLATION';
  }
  if (trace.overall_status === 'timed_out' && expectedBudget.comparison.elapsed_ms !== 'exceeded') {
    return 'KDNA_TRACE_BUDGET_MISMATCH';
  }

  if (trace.result_ref !== null) {
    if (
      trace.result_ref.shape !== request.result_contract.shape ||
      receipt.outcome === null ||
      trace.result_ref.result_digest !== digestJcs(receipt.outcome)
    ) {
      return 'KDNA_TRACE_RESULT_DIGEST_MISMATCH';
    }
  } else if (receipt.outcome !== null) {
    return 'KDNA_TRACE_RESULT_DIGEST_MISMATCH';
  }
  return validateTerminalState(trace, receipt);
}

function withoutExpectedDigests(asset) {
  const value = clone(asset);
  delete value.expected_digests;
  delete value.role;
  return value;
}

function assertSchema(label, validator, value) {
  assert.equal(validator(value), true, `${label}: ${JSON.stringify(validator.errors)}`);
}

function schemaFailureCode(testCase, validator) {
  if (testCase.expected_code === 'KDNA_ASSET_FILE_REQUIRED') {
    const hasConstFailure = (validator.errors || []).some(
      (error) =>
        error.keyword === 'const' &&
        error.instancePath === '/projection_request/require_packaged_asset',
    );
    if (hasConstFailure) return 'KDNA_ASSET_FILE_REQUIRED';
  }
  return 'SCHEMA_INVALID';
}

function semanticFailureCode(base, value) {
  if (base === 'plan') return validatePlanSemantics(value);
  if (base === 'request') return validateRequestSemantics(value);
  if (base === 'receipt') return validateReceiptSemantics(value, golden.request);
  if (base === 'trace') {
    return validateTraceSemantics(value, golden.plan, golden.request, golden.receipt);
  }
  return null;
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
  assertSchema('ConsumptionPlan 1.0', validators.plan, golden.plan);
  assertSchema('Host capabilities 1.0', validators.capabilities, golden.capabilities);
  assertSchema('Host 2 request', validators.request, golden.request);
  assertSchema('Host 2 receipt', validators.receipt, golden.receipt);
  for (const trace of positiveTraces) {
    assertSchema(`JudgmentTrace 1.0 ${trace.overall_status}`, validators.trace, trace);
  }

  for (const trace of positiveTraces.filter((value) => value.overall_status !== 'blocked')) {
    const invalid = clone(trace);
    invalid.capsule_delivery_evidence.host_boundary_comparison = 'mismatched';
    assert.equal(
      validators.trace(invalid),
      false,
      `${trace.overall_status} must reject P mismatched outside the blocked terminal`,
    );
  }

  const limitedPlan = clone(golden.plan);
  const limitedRequest = clone(golden.request);
  const limitedTrace = clone(golden.trace);
  limitedPlan.budget.max_tokens = 1;
  limitedPlan.integrity.plan_digest = computePlanDigest(limitedPlan);
  limitedRequest.plan_ref.plan_digest = limitedPlan.integrity.plan_digest;
  limitedRequest.budget.max_tokens = 1;
  limitedTrace.plan_ref.plan_digest = limitedPlan.integrity.plan_digest;
  limitedTrace.budget.limits.max_tokens = 1;
  limitedTrace.budget.comparison.tokens_used = 'not_observed';
  limitedTrace.budget.comparison.overall = 'not_observed';
  assertSchema('finite unobserved token limit Trace', validators.trace, limitedTrace);
  assert.equal(
    validateTraceSemantics(limitedTrace, limitedPlan, limitedRequest, golden.receipt),
    null,
    'a finite unobserved limit must remain explicitly not_observed',
  );

  assert.equal(validatePlanSemantics(golden.plan, golden.plan.integrity.plan_digest), null);
  assert.equal(validateRequestSemantics(golden.request), null);
  assert.equal(validateReceiptSemantics(golden.receipt, golden.request), null);

  for (const trace of positiveTraces) {
    const isSourceBlocked =
      trace.overall_status === 'blocked' &&
      trace.capsule_delivery_evidence.host_boundary_comparison === 'unavailable';
    const receipt = trace.host_receipt;
    assert.equal(
      validateTraceSemantics(trace, golden.plan, isSourceBlocked ? null : golden.request, receipt),
      null,
      trace.overall_status,
    );
  }

  assert.throws(
    () => core.loadCapsuleV2(path.join(ROOT, 'examples', 'minimal')),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
    'the real source-directory entry must fail before Capsule 2 construction',
  );
}

function validateNegotiationVectors() {
  for (const vector of negotiationVectors.cases) {
    assertSchema(`${vector.name} capabilities`, validators.capabilities, vector.capabilities);
    assert.deepEqual(negotiateExecutionPair(vector), vector.expected, vector.name);
  }
}

function validateNegativeVectors() {
  for (const vector of negativeVectors.cases) {
    const value = applyMutation(golden[vector.base], vector);
    const validator = validators[vector.base];
    assert.ok(validator, `${vector.name}: unknown base ${vector.base}`);
    const schemaValid = validator(value);
    if (vector.expected_phase === 'schema') {
      assert.equal(schemaValid, false, `${vector.name}: unexpectedly passed schema validation`);
      assert.equal(schemaFailureCode(vector, validator), vector.expected_code, vector.name);
      continue;
    }

    assert.equal(
      schemaValid,
      true,
      `${vector.name}: semantic vector must first pass schema: ${JSON.stringify(validator.errors)}`,
    );
    assert.equal(semanticFailureCode(vector.base, value), vector.expected_code, vector.name);
  }
}

function validateAuditNegativeVectors() {
  const scenarios = {
    'plan-accepts-capsule-1'() {
      const plan = clone(golden.plan);
      plan.projection_request.accepted_capsule_versions = ['2.0', '1.0'];
      return validators.plan(plan) ? null : 'SCHEMA_INVALID';
    },
    'legacy-descriptor-selected-for-plan-1'() {
      return negotiateExecutionPair({
        plan_capsule_versions: ['2.0'],
        plan_host_protocols: ['kdna.agent-host/2'],
        core_capsule_versions: ['2.0'],
        capabilities: {
          type: 'kdna.agent-host.capabilities',
          version: '1.0',
          capability_basis: 'legacy_assumption',
          host_protocols: ['kdna.agent-host/2'],
          capsule_versions: ['2.0'],
          capsule_digest_profiles: ['kdna-capsule-jcs-v1'],
        },
      }).issue_code;
    },
    'request-without-plan-ref'() {
      const request = clone(golden.request);
      delete request.plan_ref;
      return validators.request(request) ? null : 'SCHEMA_INVALID';
    },
    'coordinated-asset-substitution'() {
      const plan = clone(golden.plan);
      plan.asset_ref.asset_id = 'kdna:example:coordinated-substitution';
      plan.integrity.plan_digest = computePlanDigest(plan);
      return validatePlanSemantics(plan, golden.plan.integrity.plan_digest);
    },
    'trace-host-descriptor-substitution'() {
      const trace = clone(golden.trace);
      trace.runtime_contract.host_capabilities.host_protocols = ['kdna.agent-host/2'];
      return validateTraceSemantics(
        trace,
        golden.plan,
        golden.request,
        golden.receipt,
        golden.capabilities,
      );
    },
    'forged-budget-actual'() {
      const trace = clone(golden.trace);
      trace.budget.actual.projection_chars = 1;
      return validateTraceSemantics(trace, golden.plan, golden.request, golden.receipt);
    },
    'terminal-status-receipt-mismatch'() {
      const trace = clone(golden.trace);
      trace.overall_status = 'execution_failed';
      trace.execution.execution_status = 'failed';
      trace.result_ref = null;
      trace.errors = [
        { code: 'KDNA_HOST_EXECUTION_FAILED', message: 'Forged failure.', phase: 'execution' },
      ];
      return validators.trace(trace)
        ? validateTraceSemantics(trace, golden.plan, golden.request, golden.receipt)
        : 'SCHEMA_INVALID';
    },
    'completed-over-projection-budget'() {
      const plan = clone(golden.plan);
      const request = clone(golden.request);
      const trace = clone(golden.trace);
      plan.budget.max_projection_chars = 1000;
      plan.integrity.plan_digest = computePlanDigest(plan);
      request.plan_ref.plan_digest = plan.integrity.plan_digest;
      request.budget.max_projection_chars = 1000;
      trace.plan_ref.plan_digest = plan.integrity.plan_digest;
      trace.budget.limits.max_projection_chars = 1000;
      trace.budget.comparison.projection_chars = 'exceeded';
      trace.budget.comparison.overall = 'exceeded';
      return validateTraceSemantics(trace, plan, request, golden.receipt);
    },
    'trace-elapsed-self-rewrite'() {
      const trace = clone(golden.trace);
      trace.budget.actual.elapsed_ms = 1;
      trace.budget.comparison.elapsed_ms = 'within_limit';
      trace.budget.comparison.overall = 'within_limit';
      return validateTraceSemantics(trace, golden.plan, golden.request, golden.receipt);
    },
    'finite-token-limit-unobserved-overall'() {
      const plan = clone(golden.plan);
      const request = clone(golden.request);
      const trace = clone(golden.trace);
      plan.budget.max_tokens = 1;
      plan.integrity.plan_digest = computePlanDigest(plan);
      request.plan_ref.plan_digest = plan.integrity.plan_digest;
      request.budget.max_tokens = 1;
      trace.plan_ref.plan_digest = plan.integrity.plan_digest;
      trace.budget.limits.max_tokens = 1;
      trace.budget.comparison.tokens_used = 'not_observed';
      trace.budget.comparison.overall = 'within_limit';
      return validateTraceSemantics(trace, plan, request, golden.receipt);
    },
    'p-mismatch-provider-execution'() {
      const trace = createHostMismatchTrace();
      trace.host_receipt.runtime_receipt.provider_execution_status = 'completed';
      return validators.trace(trace) ? null : 'SCHEMA_INVALID';
    },
    'p-mismatch-equal-values'() {
      const trace = createHostMismatchTrace();
      const p = golden.request.runtime_contract.capsule_delivery_digest;
      trace.capsule_delivery_evidence.host_recomputed = p;
      trace.capsule_delivery_evidence.host_echoed = p;
      trace.host_receipt.runtime_receipt.host_recomputed_capsule_delivery_digest = p;
      trace.host_receipt.runtime_receipt.echoed_capsule_delivery_digest = p;
      return validateTraceSemantics(trace, golden.plan, golden.request, trace.host_receipt);
    },
  };

  for (const vector of auditNegativeVectors.cases) {
    assert.ok(scenarios[vector.scenario], `${vector.name}: unknown audit scenario`);
    assert.equal(scenarios[vector.scenario](), vector.expected_code, vector.name);
  }
}

validateGoldens();
validateNegotiationVectors();
validateNegativeVectors();
validateAuditNegativeVectors();

console.log(
  `Runtime contract v1 valid: ${positiveTraces.length} terminal traces, ${negotiationVectors.cases.length} negotiation vectors, ${negativeVectors.cases.length + auditNegativeVectors.cases.length} negative vectors`,
);
