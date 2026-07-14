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
const blockedSourceDirectoryTrace = readJson('blocked-source-directory-trace.json');
const negotiationVectors = readJson('negotiation-cases.json');
const negativeVectors = readJson('negative-cases.json');

const schemaFiles = [
  'digest-evidence.schema.json',
  'runtime-capsule-1.schema.json',
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

function digestJcs(value) {
  return `sha256:${crypto
    .createHash('sha256')
    .update(Buffer.from(core.canonicalizeJcs(value), 'utf8'))
    .digest('hex')}`;
}

export function computePlanDigest(plan) {
  const projection = clone(plan);
  delete projection.integrity;
  return digestJcs(projection);
}

export function negotiateExecutionPair(input) {
  const capsuleIntersection = input.plan_capsule_versions.filter(
    (version) =>
      input.core_capsule_versions.includes(version) &&
      input.capabilities.capsule_versions.includes(version),
  );
  if (capsuleIntersection.length === 0) {
    return blocked('KDNA_CAPSULE_VERSION_UNSUPPORTED');
  }

  const protocolIntersection = input.plan_host_protocols.filter((protocol) =>
    input.capabilities.host_protocols.includes(protocol),
  );
  if (protocolIntersection.length === 0) {
    return blocked('KDNA_HOST_PROTOCOL_UNSUPPORTED');
  }

  const protocolRank = ['kdna.agent-host/2', 'kdna.agent-host/1'];
  const pairs = new Map([
    ['2.0', 'kdna.agent-host/2'],
    ['1.0', 'kdna.agent-host/1'],
  ]);

  for (const capsuleVersion of capsuleIntersection) {
    const requiredProtocol = pairs.get(capsuleVersion);
    const compatibleProtocols = protocolRank.filter(
      (protocol) => protocolIntersection.includes(protocol) && protocol === requiredProtocol,
    );
    if (compatibleProtocols.length === 0) continue;
    const hostProtocol = compatibleProtocols[0];
    return {
      state: 'selected',
      capsule_version: capsuleVersion,
      host_protocol: hostProtocol,
      adapter:
        input.source_capsule_version === '2.0' && capsuleVersion === '1.0'
          ? 'kdna-capsule-2-to-1/v1'
          : null,
      issue_code: null,
    };
  }

  return blocked('KDNA_HOST_CAPSULE_PAIR_UNSUPPORTED');
}

function blocked(issueCode) {
  return {
    state: 'blocked',
    capsule_version: null,
    host_protocol: null,
    adapter: null,
    issue_code: issueCode,
  };
}

function validatePlanSemantics(plan) {
  if (computePlanDigest(plan) !== plan.integrity.plan_digest) {
    return 'KDNA_PLAN_DIGEST_MISMATCH';
  }
  return null;
}

function validateRequestSemantics(request, plan = golden.plan) {
  if (core.canonicalizeJcs(request.task) !== core.canonicalizeJcs(plan.task)) {
    return 'KDNA_HOST_TASK_MISMATCH';
  }
  const ids = [request.authority.asset_id, request.asset.asset_id, request.capsule.asset.asset_id];
  if (!ids.every((value) => value === ids[0])) return 'KDNA_HOST_ASSET_ID_MISMATCH';
  if (
    request.runtime_contract.capsule_version !== request.capsule.version ||
    request.capsule.version !== '2.0'
  ) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }
  if (digestJcs(request.capsule) !== request.runtime_contract.capsule_delivery_digest) {
    return 'KDNA_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  return null;
}

function validateReceiptSemantics(receipt, request) {
  if (receipt.request_id !== request.request_id) return 'KDNA_HOST_REQUEST_ID_MISMATCH';
  const runtimeReceipt = receipt.runtime_receipt;
  const senderP = request.runtime_contract.capsule_delivery_digest;
  const recomputedP = digestJcs(request.capsule);
  if (
    runtimeReceipt.sender_capsule_delivery_digest !== senderP ||
    runtimeReceipt.host_recomputed_capsule_delivery_digest !== recomputedP ||
    runtimeReceipt.echoed_capsule_delivery_digest !== recomputedP
  ) {
    return 'KDNA_HOST_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (runtimeReceipt.capsule_version !== request.runtime_contract.capsule_version) {
    return 'KDNA_HOST_CAPSULE_VERSION_MISMATCH';
  }
  return null;
}

function validateTraceSemantics(trace, plan, request, receipt) {
  if (trace.plan_id !== plan.plan_id) return 'KDNA_TRACE_PLAN_ID_MISMATCH';
  if (
    trace.plan_integrity.plan_digest !== plan.integrity.plan_digest ||
    trace.plan_integrity.plan_digest !== computePlanDigest(plan)
  ) {
    return 'KDNA_TRACE_PLAN_DIGEST_MISMATCH';
  }
  if (trace.asset_identity.asset_id !== plan.asset_ref.asset_id) {
    return 'KDNA_TRACE_ASSET_ID_MISMATCH';
  }

  if (!request || !receipt) {
    if (
      trace.host_receipt !== null ||
      trace.capsule_delivery_evidence.host_recomputed !== null ||
      trace.capsule_delivery_evidence.host_echoed !== null
    ) {
      return 'KDNA_TRACE_UNDELIVERED_HOST_EVIDENCE';
    }
    return null;
  }

  const p = request.runtime_contract.capsule_delivery_digest;
  const delivery = trace.capsule_delivery_evidence;
  const runtimeReceipt = receipt.runtime_receipt;
  if (
    trace.runtime_contract.selected_capsule_version !== request.runtime_contract.capsule_version ||
    trace.runtime_contract.selected_host_protocol !== request.protocol
  ) {
    return 'KDNA_TRACE_RUNTIME_CONTRACT_MISMATCH';
  }
  if (
    core.canonicalizeJcs(trace.digest_evidence) !== core.canonicalizeJcs(request.capsule.digests)
  ) {
    return 'KDNA_TRACE_DIGEST_EVIDENCE_MISMATCH';
  }
  if (
    delivery.observed !== p ||
    delivery.host_recomputed !== runtimeReceipt.host_recomputed_capsule_delivery_digest ||
    delivery.host_echoed !== runtimeReceipt.echoed_capsule_delivery_digest ||
    trace.projection_actual.capsule_delivery_digest !== p
  ) {
    return 'KDNA_TRACE_CAPSULE_DELIVERY_DIGEST_MISMATCH';
  }
  if (
    delivery.request_id !== request.request_id ||
    trace.host_receipt.request_id !== request.request_id
  ) {
    return 'KDNA_TRACE_REQUEST_ID_MISMATCH';
  }
  if (core.canonicalizeJcs(trace.host_receipt) !== core.canonicalizeJcs(receipt)) {
    return 'KDNA_TRACE_HOST_RECEIPT_MISMATCH';
  }
  if (
    core.canonicalizeJcs(trace.execution.model_identity) !==
    core.canonicalizeJcs(runtimeReceipt.model_identity)
  ) {
    return 'KDNA_TRACE_MODEL_IDENTITY_MISMATCH';
  }
  if (trace.result_ref.result_digest !== digestJcs(receipt.outcome)) {
    return 'KDNA_TRACE_RESULT_DIGEST_MISMATCH';
  }
  return null;
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
  assertSchema('JudgmentTrace 1.0 success', validators.trace, golden.trace);
  assertSchema(
    'JudgmentTrace 1.0 source-directory block',
    validators.trace,
    blockedSourceDirectoryTrace,
  );

  assert.equal(validatePlanSemantics(golden.plan), null);
  assert.equal(validateRequestSemantics(golden.request), null);
  assert.equal(validateReceiptSemantics(golden.receipt, golden.request), null);
  assert.equal(
    validateTraceSemantics(golden.trace, golden.plan, golden.request, golden.receipt),
    null,
  );
  assert.equal(validateTraceSemantics(blockedSourceDirectoryTrace, golden.plan, null, null), null);
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

validateGoldens();
validateNegotiationVectors();
validateNegativeVectors();

console.log(
  `Runtime contract v1 valid: 2 positive traces, ${negotiationVectors.cases.length} negotiation vectors, ${negativeVectors.cases.length} negative vectors`,
);
