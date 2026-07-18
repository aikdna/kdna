/**
 * KDNA Cluster Assay — Repeatable quality evaluation for KDNA Clusters.
 *
 * Implements roadmap §7.2: 7 comparison arms, 5-suite replay, structural + behavioral +
 * economics + trust + product gates, and explicit marginal value over primary-only.
 *
 * A Cluster is never promoted by averaging. Every hard gate must pass independently.
 */

const crypto = require('crypto');
const { createReplayEngine, REPLAY_MODES } = require('./replay');
const { createCostTracker, BUDGET_PROFILES } = require('./cost');
const {
  canonicalValidationErrors,
  fingerprintFixtureDataset,
  fingerprintInvalidDataset,
  isPlainObject,
} = require('./evidence-canonical');

// ── Constants ─────────────────────────────────────────────────────────

const CLUSTER_COMPARISON_ARMS = [
  'primary_only', // Only the primary asset — no advisors
  'bounded_compose', // Primary + valid advisors with distinct hypotheses
  'wrong_advisor', // Primary + an intentionally wrong advisor
  'irrelevant_advisor', // Primary + an irrelevant advisor (should be rejected)
  'budget_waste', // Primary + too many advisors (exceeds budget)
  'adversarial', // Primary + adversarial advisor that contradicts
  'no_kdna', // No KDNA at all — raw model
];

const CLUSTER_GATES = [
  'structural', // Does the cluster manifest conform, resolve, compose?
  'behavioral', // Does the cluster improve judgment over primary-only?
  'economics', // Does the cluster justify its asset count with marginal value?
  'trust', // Are integrity, authorization, provenance valid for all assets?
  'product', // Can a user understand, use, disable, and recover?
];

const COMPARISON_ARM_DESCRIPTIONS = {
  primary_only: 'Only the primary-candidate asset — tests whether advisors add value.',
  bounded_compose: 'Primary + valid advisors with distinct contribution hypotheses — target state.',
  wrong_advisor:
    'Primary + intentionally wrong advisor — tests whether cluster rejects bad advice.',
  irrelevant_advisor: 'Primary + advisor that does not match task — tests advisor rejection.',
  budget_waste: 'Primary + too many advisors (exceeds budget) — tests budget enforcement.',
  adversarial: 'Primary + advisor that directly contradicts — tests conflict detection.',
  no_kdna: 'No KDNA assets — raw model baseline.',
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateClusterFixtures(fixtures) {
  const errors = [];
  if (!Array.isArray(fixtures)) {
    return { valid: false, total: 0, errors: ['fixtures must be an array'] };
  }
  if (fixtures.length === 0) errors.push('fixtures must contain at least one fixture');

  const seenIds = new Set();
  const seenTasks = new Set();
  fixtures.forEach((fixture, index) => {
    const label = `fixtures[${index}]`;
    if (!isPlainObject(fixture)) {
      errors.push(`${label} must be a plain object`);
      return;
    }
    const evidenceErrors = canonicalValidationErrors(fixture, label);
    if (evidenceErrors.length) {
      errors.push(...evidenceErrors);
      return;
    }
    if (!isNonEmptyString(fixture.fixture_id)) {
      errors.push(`${label}.fixture_id must be a non-empty string`);
    } else if (seenIds.has(fixture.fixture_id)) {
      errors.push(`${label}.fixture_id duplicates ${fixture.fixture_id}`);
    } else {
      seenIds.add(fixture.fixture_id);
    }
    if (!isNonEmptyString(fixture.task)) {
      errors.push(`${label}.task must be a non-empty string`);
    } else {
      const normalizedTask = fixture.task.trim();
      if (seenTasks.has(normalizedTask))
        errors.push(`${label}.task duplicates another fixture task`);
      seenTasks.add(normalizedTask);
    }
    if (!isNonEmptyString(fixture.expected_primary)) {
      errors.push(`${label}.expected_primary must be a non-empty string`);
    }
    for (const key of ['expected_advisors', 'expected_rejected']) {
      if (!Array.isArray(fixture[key]) || fixture[key].some((value) => !isNonEmptyString(value))) {
        errors.push(`${label}.${key} must be an array of non-empty strings`);
      }
    }
    if (!Number.isInteger(fixture.expected_conflicts) || fixture.expected_conflicts < 0) {
      errors.push(`${label}.expected_conflicts must be a non-negative integer`);
    }
  });

  return { valid: errors.length === 0, total: fixtures.length, errors };
}

function validateReplayResults(replayResults, fixtures) {
  if (!Array.isArray(replayResults) || replayResults.length !== fixtures.length) return false;
  const expectedIds = new Set(fixtures.map((fixture) => fixture.fixture_id));
  const observedIds = new Set();
  for (const result of replayResults) {
    if (
      !isPlainObject(result) ||
      !isNonEmptyString(result.id) ||
      observedIds.has(result.id) ||
      !expectedIds.has(result.id) ||
      typeof result.pass !== 'boolean'
    ) {
      return false;
    }
    observedIds.add(result.id);
  }
  return observedIds.size === expectedIds.size;
}

function sameStringSet(actual, expected) {
  if (actual.length !== expected.length) return false;
  const actualSet = new Set(actual);
  return actualSet.size === actual.length && expected.every((value) => actualSet.has(value));
}

function invalidPlanValidation(errors) {
  return { valid: false, executable: false, status: 'invalid', decision: null, errors };
}

function validateClusterPlan(plan) {
  const errors = [];
  if (!isPlainObject(plan)) return invalidPlanValidation(['plan must be a plain object']);
  const canonicalErrors = canonicalValidationErrors(plan, 'plan');
  if (canonicalErrors.length) return invalidPlanValidation(canonicalErrors);

  if (
    !isPlainObject(plan.applicability) ||
    !['applies', 'blocked'].includes(plan.applicability.decision)
  ) {
    return invalidPlanValidation(['plan.applicability.decision must be applies or blocked']);
  }

  if (plan.applicability.decision === 'blocked') {
    if (plan.selection !== undefined) {
      errors.push('blocked plan must not include selection');
    }
    if (!isPlainObject(plan.budget)) {
      errors.push('blocked plan budget must be a plain object');
    } else {
      if (!isNonEmptyString(plan.budget.profile)) {
        errors.push('blocked plan budget.profile must be a non-empty string');
      }
      if (!Number.isInteger(plan.budget.max_assets) || plan.budget.max_assets <= 0) {
        errors.push('blocked plan budget.max_assets must be a positive integer');
      }
      if (plan.budget.assets_consumed !== 0) {
        errors.push('blocked plan budget.assets_consumed must be 0');
      }
      if (
        plan.budget.max_tokens !== undefined &&
        (!Number.isFinite(plan.budget.max_tokens) || plan.budget.max_tokens < 0)
      ) {
        errors.push(
          'blocked plan budget.max_tokens must be a finite nonnegative number when provided',
        );
      }
    }
    if (errors.length) return invalidPlanValidation(errors);
    return {
      valid: true,
      executable: false,
      status: 'blocked',
      decision: 'blocked',
      errors: [],
    };
  }

  if (!isPlainObject(plan.selection)) {
    errors.push('plan.selection must be a plain object');
    return invalidPlanValidation(errors);
  }
  if (
    !isPlainObject(plan.selection.primary) ||
    !isNonEmptyString(plan.selection.primary.asset_id)
  ) {
    errors.push('plan.selection.primary.asset_id must be a non-empty string');
  }
  for (const key of ['advisors', 'rejected']) {
    if (!Array.isArray(plan.selection[key])) {
      errors.push(`plan.selection.${key} must be an array`);
    }
  }
  if (!Array.isArray(plan.conflicts)) errors.push('plan.conflicts must be an array');

  const allIds = [];
  if (isNonEmptyString(plan.selection.primary?.asset_id))
    allIds.push(plan.selection.primary.asset_id);
  for (const key of ['advisors', 'rejected']) {
    if (!Array.isArray(plan.selection[key])) continue;
    plan.selection[key].forEach((entry, index) => {
      if (!isPlainObject(entry) || !isNonEmptyString(entry.asset_id)) {
        errors.push(`plan.selection.${key}[${index}].asset_id must be a non-empty string`);
      } else {
        allIds.push(entry.asset_id);
      }
      if (
        key === 'rejected' &&
        isPlainObject(entry) &&
        !isNonEmptyString(entry.rejection_reason || entry.reason || entry.rejection_policy)
      ) {
        errors.push(`plan.selection.rejected[${index}] must include a non-empty rejection reason`);
      }
    });
  }
  const duplicateIds = allIds.filter((assetId, index) => allIds.indexOf(assetId) !== index);
  if (duplicateIds.length)
    errors.push(`plan asset IDs must be unique: ${[...new Set(duplicateIds)].join(', ')}`);

  if (errors.length) return invalidPlanValidation(errors);
  return {
    valid: true,
    executable: true,
    status: 'applies',
    decision: 'applies',
    errors: [],
  };
}

function validateFixtureBindings(fixtures, plan) {
  const errors = [];
  const primaryId = plan.selection.primary.asset_id;
  const advisorIds = plan.selection.advisors.map((advisor) => advisor.asset_id);
  const rejectedIds = plan.selection.rejected.map((rejected) => rejected.asset_id);
  fixtures.forEach((fixture, index) => {
    const label = `fixtures[${index}]`;
    if (fixture.expected_primary !== primaryId) {
      errors.push(`${label}.expected_primary must match selected primary ${primaryId}`);
    }
    if (!sameStringSet(fixture.expected_advisors, advisorIds)) {
      errors.push(`${label}.expected_advisors must exactly match selected advisor IDs`);
    }
    if (!sameStringSet(fixture.expected_rejected, rejectedIds)) {
      errors.push(`${label}.expected_rejected must exactly match rejected asset IDs`);
    }
    if (fixture.expected_conflicts !== plan.conflicts.length) {
      errors.push(
        `${label}.expected_conflicts must equal observed conflict count ${plan.conflicts.length}`,
      );
    }
  });
  return { valid: errors.length === 0, errors };
}

function validateComparisonArms(comparisonArms, fixtures) {
  const errors = [];
  if (!Array.isArray(comparisonArms)) {
    return { valid: false, errors: ['comparisonArms must be an array'] };
  }
  if (comparisonArms.length !== CLUSTER_COMPARISON_ARMS.length) {
    errors.push(`comparisonArms must contain exactly ${CLUSTER_COMPARISON_ARMS.length} arms`);
  }
  const expectedFixtureIds = fixtures.map((fixture) => fixture.fixture_id);
  const seenArms = new Set();
  comparisonArms.forEach((record, index) => {
    const label = `comparisonArms[${index}]`;
    if (!isPlainObject(record)) {
      errors.push(`${label} must be a plain object`);
      return;
    }
    const canonicalErrors = canonicalValidationErrors(record, label);
    if (canonicalErrors.length) {
      errors.push(...canonicalErrors);
      return;
    }
    if (!CLUSTER_COMPARISON_ARMS.includes(record.arm)) {
      errors.push(`${label}.arm must be a documented Cluster comparison arm`);
    } else if (seenArms.has(record.arm)) {
      errors.push(`${label}.arm duplicates ${record.arm}`);
    } else {
      seenArms.add(record.arm);
    }
    if (
      !Array.isArray(record.fixture_ids) ||
      record.fixture_ids.some((fixtureId) => !isNonEmptyString(fixtureId)) ||
      !sameStringSet(record.fixture_ids, expectedFixtureIds)
    ) {
      errors.push(`${label}.fixture_ids must exactly match the assay fixture dataset`);
    }
    if (
      typeof record.mean_score !== 'number' ||
      !Number.isFinite(record.mean_score) ||
      record.mean_score < 1 ||
      record.mean_score > 5
    ) {
      errors.push(`${label}.mean_score must be a finite number from 1 to 5`);
    }
    if (!Number.isInteger(record.result_count) || record.result_count !== fixtures.length) {
      errors.push(`${label}.result_count must equal fixture count ${fixtures.length}`);
    }
    if (
      !Number.isInteger(record.critical_errors) ||
      record.critical_errors < 0 ||
      record.critical_errors > record.result_count
    ) {
      errors.push(`${label}.critical_errors must be between 0 and result_count`);
    }
  });
  for (const arm of CLUSTER_COMPARISON_ARMS) {
    if (!seenArms.has(arm)) errors.push(`comparisonArms is missing ${arm}`);
  }
  return { valid: errors.length === 0, errors };
}

function validateLoadedAssets(assetsLoaded, plan) {
  const errors = [];
  if (assetsLoaded === undefined || assetsLoaded === null) {
    return { valid: false, status: 'not_run', errors: ['Loaded-asset evidence was not provided'] };
  }
  if (!Array.isArray(assetsLoaded))
    return { valid: false, status: 'invalid', errors: ['assetsLoaded must be an array'] };
  if (assetsLoaded.length === 0) errors.push('assetsLoaded must contain at least one asset');
  const ids = [];
  const loadedAdvisorIds = [];
  let primaryCount = 0;
  let loadedPrimaryId = null;
  assetsLoaded.forEach((asset, index) => {
    const label = `assetsLoaded[${index}]`;
    if (!isPlainObject(asset)) {
      errors.push(`${label} must be a plain object`);
      return;
    }
    const canonicalErrors = canonicalValidationErrors(asset, label);
    if (canonicalErrors.length) {
      errors.push(...canonicalErrors);
      return;
    }
    if (!isNonEmptyString(asset.asset_id)) {
      errors.push(`${label}.asset_id must be a non-empty string`);
    } else {
      ids.push(asset.asset_id);
    }
    if (!['primary', 'advisor', 'control'].includes(asset.role)) {
      errors.push(`${label}.role must be primary, advisor, or control`);
    }
    if (asset.digest_verified !== true) errors.push(`${label}.digest_verified must be true`);
    if (
      !isNonEmptyString(asset.authorization) ||
      asset.authorization.trim().toLowerCase() === 'blocked'
    ) {
      errors.push(`${label}.authorization must be non-empty and not blocked`);
    }
    if (asset.role === 'primary') {
      primaryCount++;
      loadedPrimaryId = asset.asset_id;
    }
    if (asset.role === 'advisor' && isNonEmptyString(asset.asset_id))
      loadedAdvisorIds.push(asset.asset_id);
  });
  const duplicates = ids.filter((assetId, index) => ids.indexOf(assetId) !== index);
  if (duplicates.length)
    errors.push(`loaded asset IDs must be unique: ${[...new Set(duplicates)].join(', ')}`);
  if (primaryCount !== 1) errors.push('assetsLoaded must contain exactly one primary');
  const selectedPrimaryId = plan?.selection?.primary?.asset_id;
  if (isNonEmptyString(selectedPrimaryId) && loadedPrimaryId !== selectedPrimaryId) {
    errors.push(`loaded primary must match selected primary ${selectedPrimaryId}`);
  }
  if (plan) {
    const selectedAdvisorIds = plan.selection.advisors.map((advisor) => advisor.asset_id);
    if (!sameStringSet(loadedAdvisorIds, selectedAdvisorIds)) {
      errors.push('loaded advisor IDs must exactly match selected advisor IDs');
    }
    const rejectedIds = new Set(plan.selection.rejected.map((rejected) => rejected.asset_id));
    const loadedRejected = ids.filter((assetId) => rejectedIds.has(assetId));
    if (loadedRejected.length) {
      errors.push(`rejected asset IDs must not be loaded: ${loadedRejected.join(', ')}`);
    }
  }
  return { valid: errors.length === 0, status: errors.length ? 'invalid' : 'completed', errors };
}

function validateEconomicsEvidence(plan, executionCost) {
  const errors = [];
  let expectedAssets = null;
  if (!isPlainObject(plan)) {
    errors.push('plan must be a plain object');
  } else if (!isPlainObject(plan.selection) || !Array.isArray(plan.selection.advisors)) {
    errors.push('plan.selection.advisors must be an array');
  } else {
    expectedAssets = 1 + plan.selection.advisors.length;
  }
  if (!isPlainObject(plan?.budget)) {
    errors.push('plan.budget must be a plain object');
  } else {
    if (
      typeof plan.budget.max_tokens !== 'number' ||
      !Number.isFinite(plan.budget.max_tokens) ||
      plan.budget.max_tokens <= 0
    ) {
      errors.push('plan.budget.max_tokens must be a finite positive number');
    }
    if (!Number.isInteger(plan.budget.max_assets) || plan.budget.max_assets <= 0) {
      errors.push('plan.budget.max_assets must be a positive integer');
    }
    if (
      expectedAssets === null ||
      !Number.isInteger(plan.budget.assets_consumed) ||
      plan.budget.assets_consumed !== expectedAssets
    ) {
      errors.push(`plan.budget.assets_consumed must equal selected asset count ${expectedAssets}`);
    }
    if (
      expectedAssets !== null &&
      Number.isInteger(plan.budget.max_assets) &&
      expectedAssets > plan.budget.max_assets
    ) {
      errors.push('selected asset count exceeds plan.budget.max_assets');
    }
  }
  if (!isPlainObject(executionCost)) {
    errors.push('executionCost must be a plain object');
  } else {
    const canonicalErrors = canonicalValidationErrors(executionCost, 'executionCost');
    errors.push(...canonicalErrors);
    if (
      typeof executionCost.tokens_used !== 'number' ||
      !Number.isFinite(executionCost.tokens_used) ||
      executionCost.tokens_used < 0
    ) {
      errors.push('executionCost.tokens_used must be a finite nonnegative number');
    }
    if (!Number.isInteger(executionCost.model_calls) || executionCost.model_calls < 0) {
      errors.push('executionCost.model_calls must be a nonnegative integer');
    }
  }
  return { valid: errors.length === 0, errors };
}

function gateWithEvidence(gate, validation) {
  if (validation.valid) return gate;
  const issues = [...(gate.issues || []), ...validation.errors];
  return { ...gate, pass: false, score: 0, issues };
}

function blockedPlanValidation() {
  return { valid: true, status: 'blocked', errors: [] };
}

function blockedPlanGate(label) {
  return {
    pass: false,
    score: 0,
    issues: [`${label} is blocked because the Cluster plan selected no primary`],
    details: { status: 'blocked', decision: 'blocked' },
  };
}

// ── Fixture Creation ──────────────────────────────────────────────────

/**
 * Create a Cluster Assay fixture.
 */
function createClusterFixture(opts) {
  if (!isPlainObject(opts)) throw new TypeError('createClusterFixture requires an options object');
  const optionErrors = canonicalValidationErrors(opts, 'options');
  if (optionErrors.length)
    throw new TypeError(`Invalid cluster fixture options: ${optionErrors.join('; ')}`);
  if (!isNonEmptyString(opts.task)) throw new TypeError('task must be a non-empty string');
  if (!isNonEmptyString(opts.expectedPrimary)) {
    throw new TypeError('expectedPrimary must be a non-empty string');
  }
  for (const key of ['expectedAdvisors', 'expectedRejected']) {
    if (
      opts[key] !== undefined &&
      (!Array.isArray(opts[key]) || opts[key].some((value) => !isNonEmptyString(value)))
    ) {
      throw new TypeError(`${key} must be an array of non-empty strings when provided`);
    }
  }
  if (
    opts.expectedConflicts !== undefined &&
    (!Number.isInteger(opts.expectedConflicts) || opts.expectedConflicts < 0)
  ) {
    throw new TypeError('expectedConflicts must be a non-negative integer when provided');
  }
  if (opts.taskFamily !== undefined && !isNonEmptyString(opts.taskFamily)) {
    throw new TypeError('taskFamily must be a non-empty string when provided');
  }
  if (opts.category !== undefined && !isNonEmptyString(opts.category)) {
    throw new TypeError('category must be a non-empty string when provided');
  }
  const task = opts.task;
  return {
    fixture_id: `cfix_${crypto.randomBytes(8).toString('hex')}`,
    task,
    task_hash: 'sha256:' + crypto.createHash('sha256').update(task).digest('hex'),
    task_family: opts.taskFamily || 'general',
    expected_primary: opts.expectedPrimary,
    expected_advisors: opts.expectedAdvisors || [],
    expected_rejected: opts.expectedRejected || [],
    expected_conflicts: opts.expectedConflicts || 0,
    category: opts.category || 'general',
    created_at: new Date().toISOString(),
  };
}

// ── Gate: Structural ──────────────────────────────────────────────────

/**
 * Structural gate — does the cluster resolve and compose correctly?
 */
function structuralGate(plan) {
  const planValidation = validateClusterPlan(plan);
  if (!planValidation.valid) {
    return {
      pass: false,
      score: 0,
      issues: planValidation.errors,
      details: { status: 'invalid_plan' },
    };
  }
  if (!planValidation.executable) {
    return {
      pass: false,
      score: 0,
      issues: ['Cluster applicability blocked — no primary matched'],
      details: { status: 'blocked', decision: 'blocked', primary_selected: false },
    };
  }
  const issues = [];
  if (!plan.selection?.primary) issues.push('No primary selected');

  const advisors = plan.selection?.advisors || [];
  for (const a of advisors) {
    if (!a.contribution_hypothesis || a.contribution_hypothesis.length < 10)
      issues.push(`Advisor ${a.asset_id}: missing or trivial contribution hypothesis`);
  }

  const rejected = plan.selection?.rejected || [];
  const validRejections = rejected.filter(
    (r) => r.rejection_reason || r.rejection_policy || r.reason,
  ).length;

  return {
    pass: issues.length === 0,
    score: issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2),
    issues,
    details: {
      primary_selected: !!plan.selection?.primary,
      advisor_count: advisors.length,
      rejected_count: rejected.length,
      valid_rejections: validRejections,
      conflicts: plan.conflicts?.length || 0,
    },
  };
}

// ── Gate: Behavioral ──────────────────────────────────────────────────

/**
 * Behavioral gate — does the cluster improve judgment over primary-only?
 * This is a placeholder that gets populated with real comparison data.
 */
function behavioralGate(clusterResults, primaryOnlyResults) {
  if (!clusterResults || !primaryOnlyResults) {
    return {
      pass: null,
      score: null,
      issues: ['Comparison data not available'],
      details: { status: 'not_run' },
    };
  }

  const errors = [];
  for (const [label, result] of [
    ['clusterResults', clusterResults],
    ['primaryOnlyResults', primaryOnlyResults],
  ]) {
    if (!isPlainObject(result)) {
      errors.push(`${label} must be a plain object`);
      continue;
    }
    const canonicalErrors = canonicalValidationErrors(result, label);
    if (canonicalErrors.length) {
      errors.push(...canonicalErrors);
      continue;
    }
    if (
      typeof result.mean_score !== 'number' ||
      !Number.isFinite(result.mean_score) ||
      result.mean_score < 1 ||
      result.mean_score > 5
    ) {
      errors.push(`${label}.mean_score must be a finite number from 1 to 5`);
    }
  }
  if (errors.length) {
    return {
      pass: false,
      score: 0,
      issues: errors,
      details: { status: 'invalid_evidence' },
    };
  }

  const clusterMean = clusterResults.mean_score;
  const primaryMean = primaryOnlyResults.mean_score;
  const delta = clusterMean - primaryMean;
  const passes = delta >= 0.3;

  return {
    pass: passes,
    score: Math.min(1, Math.max(0, (delta + 0.5) / 2)),
    issues: passes ? [] : [`Cluster improvement (${delta.toFixed(2)}) below threshold (0.30)`],
    details: {
      cluster_mean: Math.round(clusterMean * 100) / 100,
      primary_only_mean: Math.round(primaryMean * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      threshold: 0.3,
    },
  };
}

// ── Gate: Economics ───────────────────────────────────────────────────

/**
 * Economics gate — does the cluster justify its cost?
 */
function economicsGate(plan, executionCost) {
  const planValidation = validateClusterPlan(plan);
  const validation =
    planValidation.valid && planValidation.executable
      ? validateEconomicsEvidence(plan, executionCost)
      : {
          valid: false,
          errors: planValidation.valid
            ? ['Economics evaluation requires an executable applies plan']
            : planValidation.errors,
        };
  if (!validation.valid) {
    return {
      pass: false,
      score: 0,
      issues: validation.errors,
      details: { status: 'invalid_evidence' },
    };
  }
  const assetCount = (plan?.selection?.advisors?.length || 0) + 1;
  const tokensUsed = executionCost.tokens_used;
  const maxTokens = plan.budget.max_tokens;
  const budgetOk = tokensUsed <= maxTokens;

  // Marginal cost: each additional asset should improve judgment by at least 0.15
  const marginalCostPerAsset = assetCount > 1 ? tokensUsed / assetCount : tokensUsed;

  const issues = [];
  if (!budgetOk) issues.push(`Budget exceeded: ${tokensUsed}/${maxTokens} tokens`);
  if (assetCount > 3)
    issues.push(`High asset count (${assetCount}) — marginal value should be proven`);

  return {
    pass: budgetOk && issues.length === 0,
    score: budgetOk ? 1.0 : Math.max(0, 1.0 - (tokensUsed - maxTokens) / maxTokens),
    issues,
    details: {
      assets_consumed: assetCount,
      tokens_used: tokensUsed,
      max_tokens: maxTokens,
      budget_compliant: budgetOk,
      marginal_cost_per_asset: Math.round(marginalCostPerAsset),
    },
  };
}

// ── Gate: Trust ───────────────────────────────────────────────────────

/**
 * Trust gate — are all assets authorized and verified?
 */
function trustGate(assetsLoaded) {
  const validation = validateLoadedAssets(assetsLoaded);
  if (validation.status === 'not_run') {
    return {
      pass: null,
      score: 0,
      issues: ['Trust evidence not provided'],
      details: { status: 'not_run' },
    };
  }
  if (!validation.valid) {
    return { pass: false, score: 0, issues: validation.errors, details: { status: 'invalid' } };
  }

  return {
    pass: true,
    score: 1.0,
    issues: [],
    details: {
      total_assets: assetsLoaded.length,
      verified: assetsLoaded.filter((a) => a.digest_verified).length,
      unverified: assetsLoaded.filter((a) => !a.digest_verified).map((a) => a.asset_id),
    },
  };
}

// ── Gate: Product ─────────────────────────────────────────────────────

/**
 * Product gate — can a user understand and operate this cluster?
 */
function productGate(plan, manifest) {
  const issues = [];
  if (plan !== undefined && plan !== null) {
    if (!isPlainObject(plan)) {
      issues.push('plan must be a plain object when provided');
    } else {
      const planCanonicalErrors = canonicalValidationErrors(plan, 'plan');
      issues.push(...planCanonicalErrors);
      if (planCanonicalErrors.length === 0 &&
        plan.cluster_ref !== undefined &&
        (!isPlainObject(plan.cluster_ref) ||
          (plan.cluster_ref.cluster_id !== undefined &&
            !isNonEmptyString(plan.cluster_ref.cluster_id)))
      ) {
        issues.push('plan.cluster_ref.cluster_id must be a non-empty string when provided');
      }
    }
  }
  if (!isPlainObject(manifest)) {
    issues.push('manifest must be a plain object');
  } else {
    const manifestCanonicalErrors = canonicalValidationErrors(manifest, 'manifest');
    issues.push(...manifestCanonicalErrors);
    if (manifestCanonicalErrors.length === 0) {
      if (manifest.cluster_id !== undefined && !isNonEmptyString(manifest.cluster_id)) {
        issues.push('manifest.cluster_id must be a non-empty string when provided');
      }
      if (manifest.version !== undefined && !isNonEmptyString(manifest.version)) {
        issues.push('manifest.version must be a non-empty string when provided');
      }
      if (typeof manifest.description !== 'string') {
        issues.push('manifest.description must be a string');
      }
      if (!Array.isArray(manifest.domains)) {
        issues.push('manifest.domains must be an array');
      } else {
        manifest.domains.forEach((domain, index) => {
          if (!isPlainObject(domain) || !isNonEmptyString(domain.load_condition)) {
            issues.push(`manifest.domains[${index}].load_condition must be a non-empty string`);
          }
        });
      }
      if (
        !isPlainObject(manifest.composition) ||
        !isNonEmptyString(manifest.composition.strategy)
      ) {
        issues.push('manifest.composition.strategy must be a non-empty string');
      }
    }
  }
  if (issues.length) {
    return {
      pass: false,
      score: 0,
      issues,
      details: { status: 'invalid_evidence' },
    };
  }
  const clusterId = manifest?.cluster_id || plan?.cluster_ref?.cluster_id || 'unknown';

  if (
    !manifest?.description ||
    manifest.description.startsWith('[TODO') ||
    manifest.description.includes('[TODO')
  )
    issues.push('Cluster description is missing or has placeholders');
  if (!manifest?.domains?.length || manifest.domains.length < 2)
    issues.push('Cluster has fewer than 2 domains — may be single-asset disguised as cluster');
  if (!manifest?.composition?.strategy) issues.push('No composition strategy defined');
  if (
    (manifest?.domains || []).some(
      (d) =>
        !d.load_condition ||
        d.load_condition.startsWith('[TODO') ||
        d.load_condition.includes('[TODO'),
    )
  )
    issues.push('Some domains have missing or placeholder load conditions');

  return {
    pass: issues.length === 0,
    score: issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2),
    issues,
    details: {
      has_description: !!(
        manifest?.description &&
        !manifest.description.startsWith('[TODO') &&
        !manifest.description.includes('[TODO')
      ),
      domain_count: manifest?.domains?.length || 0,
      composition_defined: !!manifest?.composition?.strategy,
      load_conditions_complete: (manifest?.domains || []).every(
        (d) =>
          d.load_condition &&
          !d.load_condition.startsWith('[TODO') &&
          !d.load_condition.includes('[TODO'),
      ),
    },
  };
}

// ── Cluster Assay Runner ──────────────────────────────────────────────

/**
 * Run a Cluster Assay against a manifest and optional execution data.
 *
 * @param {object} opts
 * @param {object} opts.manifest — cluster manifest
 * @param {object} [opts.plan] — cluster ConsumptionPlan (from generateClusterPlan)
 * @param {object} [opts.executionCost] — {tokens_used, model_calls}
 * @param {Array<object>} [opts.comparisonArms] — per-arm results
 * @param {Array<object>} [opts.fixtures] — assay fixtures
 * @returns {object} assay results
 */
function runClusterAssay(opts = {}) {
  if (!isPlainObject(opts)) throw new TypeError('runClusterAssay options must be a plain object');
  const { manifest, plan, executionCost, comparisonArms = [], fixtures = [] } = opts;
  validateClusterAssayManifest(manifest);
  const startTime = Date.now();
  const fixtureValidation = validateClusterFixtures(fixtures);
  const planValidation = validateClusterPlan(plan);
  const planBlocked = planValidation.valid && !planValidation.executable;
  const planExecutable = planValidation.valid && planValidation.executable;
  const fixtureBindingValidation = planBlocked
    ? blockedPlanValidation()
    : fixtureValidation.valid && planExecutable
      ? validateFixtureBindings(fixtures, plan)
      : {
          valid: false,
          errors: ['Fixture expectations require a valid fixture dataset and Cluster plan'],
        };
  const comparisonValidation = planBlocked
    ? blockedPlanValidation()
    : fixtureValidation.valid
      ? validateComparisonArms(comparisonArms, fixtures)
      : { valid: false, errors: ['Comparison arms require a valid fixture dataset'] };
  const loadedAssets =
    opts.assetsLoaded !== undefined
      ? opts.assetsLoaded
      : planExecutable
        ? plan.assets_loaded
        : undefined;
  const loadedAssetValidation = planBlocked
    ? blockedPlanValidation()
    : validateLoadedAssets(loadedAssets, planExecutable ? plan : null);
  const economicsValidation = planBlocked
    ? blockedPlanValidation()
    : planExecutable
      ? validateEconomicsEvidence(plan, executionCost)
      : { valid: false, errors: ['Economics evidence requires a valid Cluster plan'] };

  // Structural gate
  const structural = planBlocked
    ? structuralGate(plan)
    : gateWithEvidence(structuralGate(plan), fixtureBindingValidation);

  // Behavioral gate
  const primaryOnly = comparisonValidation.valid
    ? comparisonArms.find((a) => a.arm === 'primary_only') || null
    : null;
  const boundedCompose = comparisonValidation.valid
    ? comparisonArms.find((a) => a.arm === 'bounded_compose') || null
    : null;
  const behavioral = planBlocked
    ? blockedPlanGate('Behavioral evaluation')
    : comparisonValidation.valid
      ? behavioralGate(boundedCompose, primaryOnly)
      : {
          pass: false,
          score: 0,
          issues: comparisonValidation.errors,
          details: { status: 'invalid_evidence' },
        };

  // Economics gate
  const economics = planBlocked
    ? blockedPlanGate('Economics evaluation')
    : planExecutable && economicsValidation.valid
      ? economicsGate(plan, executionCost)
      : {
          pass: false,
          score: 0,
          issues: [...planValidation.errors, ...economicsValidation.errors],
          details: { status: 'invalid_evidence' },
        };

  // Trust gate — asset-loading evidence is required for evaluation.
  // Plan selection alone is NOT trust evidence. The gate returns null
  // (not evaluated) when no observed trust data is available.
  const trust = planBlocked
    ? blockedPlanGate('Trust evaluation')
    : loadedAssetValidation.status === 'not_run'
      ? trustGate(null)
      : loadedAssetValidation.valid
        ? trustGate(loadedAssets)
        : {
            pass: false,
            score: 0,
            issues: loadedAssetValidation.errors,
            details: { status: 'invalid' },
          };

  // Product gate
  const product = planBlocked
    ? blockedPlanGate('Product promotion')
    : productGate(planExecutable ? plan : null, manifest);

  // Comparison arm results
  const comparisonArmResults = CLUSTER_COMPARISON_ARMS.map((arm) => {
    const armData = comparisonValidation.valid ? comparisonArms.find((a) => a.arm === arm) : null;
    return {
      arm,
      description: COMPARISON_ARM_DESCRIPTIONS[arm],
      score: armData?.mean_score ?? null,
      critical_errors: armData?.critical_errors ?? null,
      result_count: armData?.result_count ?? null,
      fixture_ids: armData?.fixture_ids || [],
      status: planBlocked ? 'blocked' : comparisonValidation.valid ? 'completed' : 'invalid',
    };
  });

  const gates = { structural, behavioral, economics, trust, product };
  // Promotion is fail-closed: a hard gate that was not run is not a pass.
  const allGatesPassed = Object.values(gates).every((g) => g.pass === true);
  const allPassed = fixtureValidation.valid && planExecutable && allGatesPassed;
  const blocked =
    Object.values(gates).filter((g) => g.pass === false).length + (fixtureValidation.valid ? 0 : 1);
  const passed = Object.values(gates).filter((g) => g.pass === true).length;
  const notRun = Object.values(gates).filter((g) => g.pass === null).length;

  return {
    assay_version: '0.9.0',
    cluster_id: manifest?.cluster_id || 'unknown',
    cluster_version: manifest?.version || '0.1.0',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    fixture_count: Array.isArray(fixtures) ? fixtures.length : 0,
    plan_status: planValidation.status,
    fixture_validation: fixtureValidation,
    comparison_arms: comparisonArmResults,
    gates,
    verdict: {
      overall: allPassed ? 'pass' : 'fail',
      passed,
      blocked,
      not_run: notRun,
      all_passed: allPassed,
      failed_gates: Object.entries(gates)
        .filter(([, g]) => g.pass === false)
        .map(([name]) => name),
      incomplete_gates: Object.entries(gates)
        .filter(([, g]) => g.pass === null)
        .map(([name]) => name),
      failed_evidence: [
        ...(!fixtureValidation.valid ? ['fixture_dataset'] : []),
        ...(!planValidation.valid ? ['cluster_plan'] : []),
        ...(!fixtureBindingValidation.valid ? ['fixture_expectations'] : []),
        ...(!comparisonValidation.valid ? ['comparison_arms'] : []),
        ...(!loadedAssetValidation.valid ? ['loaded_assets'] : []),
        ...(!economicsValidation.valid ? ['economics'] : []),
      ],
    },
    evidence_validation: {
      plan: planValidation,
      fixture_expectations: fixtureBindingValidation,
      comparison_arms: comparisonValidation,
      loaded_assets: loadedAssetValidation,
      economics: economicsValidation,
    },
    marginal_value: {
      primary_only_score: primaryOnly?.mean_score ?? null,
      cluster_score: boundedCompose?.mean_score ?? null,
      delta:
        comparisonValidation.valid && !planBlocked
          ? boundedCompose.mean_score - primaryOnly.mean_score
          : 0,
      threshold_met:
        comparisonValidation.valid &&
        !planBlocked &&
        boundedCompose.mean_score - primaryOnly.mean_score >= 0.3,
      threshold: 0.3,
    },
    dataset_fingerprint: fixtureValidation.valid
      ? fingerprintFixtureDataset(fixtures, 'cluster-assay')
      : fingerprintInvalidDataset(fixtureValidation.errors, 'cluster-assay'),
  };
}

function validateClusterAssayManifest(manifest) {
  if (manifest === undefined || manifest === null) return;
  if (!isPlainObject(manifest))
    throw new TypeError('manifest must be a plain object when provided');
  const manifestErrors = canonicalValidationErrors(manifest, 'manifest');
  if (manifestErrors.length)
    throw new TypeError(`Invalid Cluster Assay manifest: ${manifestErrors.join('; ')}`);
  if (manifest.cluster_id !== undefined && !isNonEmptyString(manifest.cluster_id)) {
    throw new TypeError('manifest.cluster_id must be a non-empty string when provided');
  }
  if (manifest.version !== undefined && !isNonEmptyString(manifest.version)) {
    throw new TypeError('manifest.version must be a non-empty string when provided');
  }
  if (manifest.description !== undefined && typeof manifest.description !== 'string') {
    throw new TypeError('manifest.description must be a string when provided');
  }
  if (manifest.domains !== undefined) {
    if (!Array.isArray(manifest.domains))
      throw new TypeError('manifest.domains must be an array when provided');
    manifest.domains.forEach((domain, index) => {
      if (!isPlainObject(domain))
        throw new TypeError(`manifest.domains[${index}] must be a plain object`);
      if (domain.load_condition !== undefined && typeof domain.load_condition !== 'string') {
        throw new TypeError(
          `manifest.domains[${index}].load_condition must be a string when provided`,
        );
      }
    });
  }
  if (manifest.composition !== undefined) {
    if (!isPlainObject(manifest.composition)) {
      throw new TypeError('manifest.composition must be a plain object when provided');
    }
    if (
      manifest.composition.strategy !== undefined &&
      !isNonEmptyString(manifest.composition.strategy)
    ) {
      throw new TypeError('manifest.composition.strategy must be a non-empty string when provided');
    }
  }
}

// ── Advisor Relation Ledger ───────────────────────────────────────────

/**
 * Create a human-reviewed advisor relation ledger.
 * Tracks: which advisors were proposed, accepted, rejected, and why.
 *
 * @param {object} plan — cluster ConsumptionPlan
 * @param {Array<object>} decisions — human decisions
 * @returns {object} ledger
 */
function createAdvisorRelationLedger(plan, decisions = []) {
  if (plan !== undefined && plan !== null && !isPlainObject(plan)) {
    throw new TypeError('plan must be a plain object, null, or undefined');
  }
  if (!Array.isArray(decisions)) throw new TypeError('decisions must be an array');
  const clusterId = plan?.cluster_ref?.cluster_id;
  if (clusterId !== undefined && !isNonEmptyString(clusterId)) {
    throw new TypeError('plan.cluster_ref.cluster_id must be a non-empty string when provided');
  }
  const advisors = plan?.selection?.advisors || [];
  const rejected = plan?.selection?.rejected || [];
  const primary = plan?.selection?.primary;

  for (const [label, entries] of [
    ['advisors', advisors],
    ['rejected', rejected],
  ]) {
    if (!Array.isArray(entries)) throw new TypeError(`plan.selection.${label} must be an array`);
    entries.forEach((entry, index) => {
      if (!isPlainObject(entry) || !isNonEmptyString(entry.asset_id)) {
        throw new TypeError(
          `plan.selection.${label}[${index}].asset_id must be a non-empty string`,
        );
      }
    });
  }
  if (
    primary !== undefined &&
    primary !== null &&
    (!isPlainObject(primary) || !isNonEmptyString(primary.asset_id))
  ) {
    throw new TypeError('plan.selection.primary.asset_id must be a non-empty string');
  }
  decisions.forEach((decision, index) => {
    if (!isPlainObject(decision) || !isNonEmptyString(decision.asset_id)) {
      throw new TypeError(`decisions[${index}].asset_id must be a non-empty string`);
    }
    if (
      !['approved', 'approved_with_changes', 'rejected', 'needs_revision'].includes(
        decision.decision,
      )
    ) {
      throw new TypeError(`decisions[${index}].decision is invalid`);
    }
  });

  const entries = [];

  // Primary entry
  if (primary) {
    entries.push({
      relation_type: 'primary',
      asset_id: primary.asset_id,
      role: 'primary',
      selection_reason: primary.selection_reason,
      human_reviewed: false,
      human_decision: null,
      review_notes: null,
    });
  }

  // Advisor entries
  for (const a of advisors) {
    const decision = decisions.find((d) => d.asset_id === a.asset_id);
    entries.push({
      relation_type: 'advisor',
      asset_id: a.asset_id,
      role: 'advisor',
      contribution_hypothesis: a.contribution_hypothesis,
      accepted: a.accepted !== false,
      human_reviewed: !!decision,
      human_decision: decision?.decision || null,
      review_notes: decision?.notes || null,
      reviewed_at: decision?.reviewed_at || null,
      reviewed_by: decision?.reviewed_by || null,
    });
  }

  // Rejected entries
  for (const r of rejected) {
    entries.push({
      relation_type: 'rejected',
      asset_id: r.asset_id,
      role: r.role || 'rejected',
      rejection_reason: r.rejection_reason || r.reason,
      human_reviewed: false,
      human_decision: null,
    });
  }

  return {
    ledger_version: '0.9.0',
    cluster_id: clusterId || 'unknown',
    created_at: new Date().toISOString(),
    entries,
    summary: {
      total_entries: entries.length,
      primary_count: entries.filter((e) => e.relation_type === 'primary').length,
      advisor_count: entries.filter((e) => e.relation_type === 'advisor').length,
      rejected_count: entries.filter((e) => e.relation_type === 'rejected').length,
      human_reviewed_count: entries.filter((e) => e.human_reviewed).length,
      pending_review_count: entries.filter(
        (e) => e.relation_type === 'advisor' && !e.human_reviewed,
      ).length,
    },
  };
}

// ── Human Decision Format ─────────────────────────────────────────────

/**
 * Record a human decision about an advisor relation.
 */
function recordAdvisorDecision(assetId, decision, opts = {}) {
  const valid = ['approved', 'approved_with_changes', 'rejected', 'needs_revision'];
  if (!isNonEmptyString(assetId)) throw new TypeError('assetId must be a non-empty string');
  if (!isPlainObject(opts)) throw new TypeError('options must be a plain object');
  if (!valid.includes(decision))
    throw new Error(`Invalid decision: ${decision}. Must be: ${valid.join(', ')}`);

  return {
    asset_id: assetId,
    decision,
    notes: opts.notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: opts.reviewedBy || 'human-reviewer',
    changes_requested: opts.changesRequested || [],
    contribution_accepted: decision === 'approved' || decision === 'approved_with_changes',
  };
}

// ── Replay Integration ────────────────────────────────────────────────

/**
 * Run the five-suite replay for a cluster across all comparison arms.
 *
 * @param {object} engine — replay engine from createReplayEngine()
 * @param {Array<object>} fixtures — cluster assay fixtures
 * @param {object} opts — {clusterPlan, manifest}
 * @returns {object} replay results per suite
 */
function runClusterReplay(engine, fixtures, opts = {}) {
  const fixtureValidation = validateClusterFixtures(fixtures);
  const results = {};
  if (!engine || typeof engine.replayRun !== 'function') {
    for (const mode of REPLAY_MODES) {
      results[mode] = { status: 'failed', error: 'Replay engine must provide replayRun' };
    }
    return results;
  }
  if (!fixtureValidation.valid) {
    for (const mode of REPLAY_MODES) {
      results[mode] = { status: 'failed', error: 'Invalid cluster fixture dataset' };
    }
    return results;
  }
  for (const mode of REPLAY_MODES) {
    try {
      const run = engine.replayRun(mode, {
        fixtures: fixtures.map((f) => ({ id: f.fixture_id, task: f.task, expected: f })),
        policy: { cluster_id: opts.clusterId || 'unknown' },
      });
      if (validateReplayResults(run?.results, fixtures)) {
        const passed = run.results.filter((r) => r.pass === true).length;
        results[mode] = {
          status: 'completed',
          total: run.results.length,
          passed,
          failed: run.results.length - passed,
          pass_rate: run.results.length > 0 ? passed / run.results.length : 0,
        };
      } else {
        results[mode] = {
          status: 'failed',
          error: 'Invalid or incomplete results from replay engine',
        };
      }
    } catch (e) {
      results[mode] = { status: 'error', error: e.message };
    }
  }
  return results;
}

module.exports = {
  CLUSTER_COMPARISON_ARMS,
  CLUSTER_GATES,
  COMPARISON_ARM_DESCRIPTIONS,
  createClusterFixture,
  structuralGate,
  behavioralGate,
  economicsGate,
  trustGate,
  productGate,
  runClusterAssay,
  createAdvisorRelationLedger,
  recordAdvisorDecision,
  runClusterReplay,
};
