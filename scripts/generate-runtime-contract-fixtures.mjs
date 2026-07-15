#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const require = createRequire(import.meta.url);
const core = require('../packages/kdna-core/src');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPSULE_ROOT = path.join(ROOT, 'conformance', 'runtime-capsule');
const OUTPUT_ROOT = path.join(ROOT, 'conformance', 'runtime-contract');
const CORE_CAPSULE_VERSIONS = ['0.1.0'];

function json(value) {
  return prettier.format(JSON.stringify(value), {
    parser: 'json',
    printWidth: 100,
    tabWidth: 2,
    endOfLine: 'lf',
  });
}

function readJson(file) {
  return core.parseRuntimeContractJson(fs.readFileSync(file));
}

function equalJson(left, right) {
  return core.canonicalizeJcs(left) === core.canonicalizeJcs(right);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertValid(label, result) {
  if (!result.valid) throw new Error(`${label}: ${JSON.stringify(result.errors)}`);
}

function expectedDigest(evidence, label) {
  assert(
    evidence.comparison.state === 'matched' || evidence.comparison.state === 'not_compared',
    `${label} digest must be matched or explicitly not compared`,
  );
  const source = evidence.comparison.state === 'matched' ? evidence.comparison.source : 'caller';
  assert(typeof source === 'string', `${label} digest source is missing`);
  return {
    value: evidence.value,
    basis: evidence.basis,
    source,
    comparison: evidence.comparison.state,
  };
}

function buildReceipt(request, providerExecutionStatus, elapsedMs, outcome = null) {
  const capsuleDeliveryDigest = request.runtime_contract.capsule_delivery_digest;
  const receipt = {
    protocol: request.protocol,
    protocol_version: request.protocol_version,
    request_id: request.request_id,
    runtime_receipt: {
      type: 'kdna.agent-host.runtime-receipt',
      contract_version: '0.1.0',
      capsule_version: request.runtime_contract.capsule_version,
      capsule_digest_profile: request.runtime_contract.capsule_digest_profile,
      capsule_digest_profile_version: request.runtime_contract.capsule_digest_profile_version,
      sender_capsule_delivery_digest: capsuleDeliveryDigest,
      host_recomputed_capsule_delivery_digest: core.computeCapsuleDeliveryDigest(request.capsule),
      echoed_capsule_delivery_digest: capsuleDeliveryDigest,
      capsule_delivery_comparison: 'matched',
      capsule_schema_validation: 'passed',
      asset_id_correlation: 'matched',
      provider_execution_status: providerExecutionStatus,
      semantic_consumption: { state: 'not_observed', basis: null },
      model_identity: { value: null, basis: 'not_observed' },
      usage: {
        elapsed_ms: elapsedMs,
        elapsed_basis: 'host_monotonic',
        tokens_used: null,
        model_calls: null,
        basis: 'not_observed',
      },
    },
    outcome,
  };
  assertValid(
    `${providerExecutionStatus} Host receipt`,
    core.validateAgentHostReceipt(receipt, { request }),
  );
  return receipt;
}

async function buildFixtures() {
  const capsuleGolden = readJson(path.join(CAPSULE_ROOT, 'golden.json'));
  const capsuleBytes = Buffer.from(
    fs.readFileSync(path.join(CAPSULE_ROOT, capsuleGolden.fixture), 'utf8').trim(),
    'base64',
  );
  const canonicalCapsule = core.loadRuntimeCapsule(capsuleBytes, {
    loadedAt: capsuleGolden.loaded_at,
    profile: 'compact',
  });
  assert(
    equalJson(canonicalCapsule, capsuleGolden.runtime_capsule),
    'official Capsule bytes do not reproduce the committed Capsule fixture',
  );

  const capsule = core.loadRuntimeCapsule(capsuleBytes, {
    loadedAt: capsuleGolden.loaded_at,
    profile: 'compact',
    expectedDigests: {
      asset: { value: capsuleGolden.expected.asset, source: 'install_receipt' },
    },
  });
  for (const name of ['asset', 'content', 'runtime_entry_set']) {
    assert(
      capsule.digests[name].value === capsuleGolden.expected[name],
      `official ${name} digest does not match Capsule conformance`,
    );
  }

  const expectedDigests = {
    asset: expectedDigest(capsule.digests.asset, 'asset'),
    content: expectedDigest(capsule.digests.content, 'content'),
    runtime_entry_set: expectedDigest(capsule.digests.runtime_entry_set, 'runtime entry set'),
  };
  const plan = core.buildConsumptionPlan({
    plan_id: 'plan_0123456789abcdef',
    created_at: '2026-07-15T00:00:00.000Z',
    task: {
      summary: 'Apply the packaged judgment asset to this fixture decision.',
      task_family: null,
      context: {},
    },
    asset_ref: {
      ...capsule.asset,
      access: capsule.access,
      expected_digests: expectedDigests,
    },
    projection_profile: capsule.profile,
    budget: {
      max_projection_chars: 12000,
      max_task_chars: 1000,
      deadline_ms: 30000,
      max_tokens: null,
      max_model_calls: null,
    },
    constraints: { enforce_before_host: true, reject_on_exceed: true },
    trace_policy: { emit: true, storage: 'session' },
  });
  const capabilities = {
    type: 'kdna.agent-host-capabilities',
    protocol_version: '0.1.0',
    capability_basis: 'registered_descriptor',
    host_protocols: ['kdna.agent-host'],
    capsule_versions: ['0.1.0'],
    capsule_digest_profiles: ['kdna.canonicalization.runtime-capsule-jcs'],
    capsule_digest_profile_versions: ['0.1.0'],
  };
  const context = {
    plan,
    trustedPlanDigest: plan.integrity.plan_digest,
    capabilities,
    coreCapsuleVersions: CORE_CAPSULE_VERSIONS,
  };
  const request = core.buildAgentHostRequest(
    { request_id: 'host_0123456789abcdef01234567', capsule },
    context,
  );
  const outcome = {
    judgment: {
      answer: 'The fixture demonstrates a correlated Agent Host boundary.',
      reasoning: [],
      confidence: null,
    },
    usage: null,
  };
  const receipts = {
    completed: buildReceipt(request, 'completed', 1000, outcome),
    failed: buildReceipt(request, 'failed', 1200),
    cancelled: buildReceipt(request, 'cancelled', 800),
    timed_out: buildReceipt(request, 'timed_out', 31000),
  };

  function trace(input, receipt, observation = 'host_receipt') {
    return core.buildJudgmentTrace(input, {
      ...context,
      request: receipt === undefined ? null : request,
      receipt: receipt ?? null,
      trustedDeliveryObservation: observation,
    });
  }

  const traces = {
    completed: trace(
      {
        trace_id: 'trace_0123456789abcdef',
        timestamp: '2026-07-15T00:00:01.000Z',
        overall_status: 'execution_completed',
        result_stored: true,
        errors: [],
        warnings: [],
      },
      receipts.completed,
    ),
    sourceBlocked: trace(
      {
        trace_id: 'trace_fedcba9876543210',
        timestamp: '2026-07-15T00:00:00.500Z',
        overall_status: 'blocked',
        errors: [
          {
            code: 'KDNA_ASSET_FILE_REQUIRED',
            message: 'Runtime execution requires a packaged .kdna asset, not a source directory.',
            phase: 'load',
          },
        ],
        warnings: [],
      },
      undefined,
      'not_delivered',
    ),
    failed: trace(
      {
        trace_id: 'trace_1111111111111111',
        timestamp: '2026-07-15T00:00:02.200Z',
        overall_status: 'execution_failed',
        errors: [
          {
            code: 'KDNA_HOST_EXECUTION_FAILED',
            message: 'The Host reported provider execution failure.',
            phase: 'execution',
          },
        ],
        warnings: [],
      },
      receipts.failed,
    ),
    cancelled: trace(
      {
        trace_id: 'trace_2222222222222222',
        timestamp: '2026-07-15T00:00:01.800Z',
        overall_status: 'cancelled',
        errors: [
          {
            code: 'KDNA_EXECUTION_CANCELLED',
            message: 'Execution was cancelled after the Host accepted the Capsule.',
            phase: 'execution',
          },
        ],
        warnings: [],
      },
      receipts.cancelled,
    ),
    timedOut: trace(
      {
        trace_id: 'trace_3333333333333333',
        timestamp: '2026-07-15T00:00:32.000Z',
        overall_status: 'timed_out',
        errors: [
          {
            code: 'KDNA_EXECUTION_TIMED_OUT',
            message: 'Execution exceeded the planned deadline.',
            phase: 'execution',
          },
        ],
        warnings: [],
      },
      receipts.timed_out,
    ),
  };

  const golden = {
    profile_ids: {
      plan: core.PLAN_DIGEST_PROFILE,
      asset: capsuleGolden.profile_ids.asset,
      content: capsuleGolden.profile_ids.content,
      runtime_entry_set: capsuleGolden.profile_ids.runtime_entry_set,
      capsule_delivery: core.CAPSULE_DIGEST_PROFILE,
      result: 'kdna.canonicalization.result-jcs',
    },
    plan,
    capabilities,
    request,
    receipt: receipts.completed,
    trace: traces.completed,
  };

  return new Map([
    ['golden.json', await json(golden)],
    ['trace-execution-completed.json', await json(traces.completed)],
    ['blocked-source-directory-trace.json', await json(traces.sourceBlocked)],
    ['trace-execution-failed.json', await json(traces.failed)],
    ['trace-cancelled.json', await json(traces.cancelled)],
    ['trace-timed-out.json', await json(traces.timedOut)],
  ]);
}

function modeFromArguments() {
  const argumentsList = process.argv.slice(2);
  if (
    argumentsList.length === 0 ||
    (argumentsList.length === 1 && argumentsList[0] === '--check')
  ) {
    return 'check';
  }
  if (argumentsList.length === 1 && argumentsList[0] === '--write') return 'write';
  throw new Error('usage: generate-runtime-contract-fixtures.mjs [--check|--write]');
}

const mode = modeFromArguments();
const fixtures = await buildFixtures();
if (mode === 'write') {
  for (const [name, contents] of fixtures) {
    fs.writeFileSync(path.join(OUTPUT_ROOT, name), contents);
  }
  console.log('runtime contract fixtures regenerated from authoritative Capsule bytes');
} else {
  const stale = [];
  for (const [name, contents] of fixtures) {
    const file = path.join(OUTPUT_ROOT, name);
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== contents) stale.push(name);
  }
  if (stale.length > 0) {
    throw new Error(
      `runtime contract fixtures are stale: ${stale.join(', ')}; run with --write to rebuild`,
    );
  }
  console.log('runtime contract fixtures match authoritative Capsule bytes');
}
