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

// ── Constants ─────────────────────────────────────────────────────────

const CLUSTER_COMPARISON_ARMS = [
  'primary_only',       // Only the primary asset — no advisors
  'bounded_compose',    // Primary + valid advisors with distinct hypotheses
  'wrong_advisor',      // Primary + an intentionally wrong advisor
  'irrelevant_advisor', // Primary + an irrelevant advisor (should be rejected)
  'budget_waste',       // Primary + too many advisors (exceeds budget)
  'adversarial',        // Primary + adversarial advisor that contradicts
  'no_kdna',            // No KDNA at all — raw model
];

const CLUSTER_GATES = [
  'structural',     // Does the cluster manifest conform, resolve, compose?
  'behavioral',     // Does the cluster improve judgment over primary-only?
  'economics',      // Does the cluster justify its asset count with marginal value?
  'trust',          // Are integrity, authorization, provenance valid for all assets?
  'product',        // Can a user understand, use, disable, and recover?
];

const COMPARISON_ARM_DESCRIPTIONS = {
  primary_only: 'Only the primary-candidate asset — tests whether advisors add value.',
  bounded_compose: 'Primary + valid advisors with distinct contribution hypotheses — target state.',
  wrong_advisor: 'Primary + intentionally wrong advisor — tests whether cluster rejects bad advice.',
  irrelevant_advisor: 'Primary + advisor that does not match task — tests advisor rejection.',
  budget_waste: 'Primary + too many advisors (exceeds budget) — tests budget enforcement.',
  adversarial: 'Primary + advisor that directly contradicts — tests conflict detection.',
  no_kdna: 'No KDNA assets — raw model baseline.',
};

// ── Fixture Creation ──────────────────────────────────────────────────

/**
 * Create a Cluster Assay fixture.
 */
function createClusterFixture(opts = {}) {
  const task = opts.task || '';
  return {
    fixture_id: `cfix_${crypto.randomBytes(8).toString('hex')}`,
    task,
    task_hash: 'sha256:' + crypto.createHash('sha256').update(task).digest('hex'),
    task_family: opts.taskFamily || 'general',
    expected_primary: opts.expectedPrimary || null,
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
  const issues = [];
  if (!plan) return { pass: false, score: 0, issues: ['No plan produced'] };

  if (plan.applicability?.decision === 'blocked')
    issues.push('Cluster applicability blocked — no primary matched');
  if (!plan.selection?.primary)
    issues.push('No primary selected');

  const advisors = plan.selection?.advisors || [];
  for (const a of advisors) {
    if (!a.contribution_hypothesis || a.contribution_hypothesis.length < 10)
      issues.push(`Advisor ${a.asset_id}: missing or trivial contribution hypothesis`);
  }

  const rejected = plan.selection?.rejected || [];
  const validRejections = rejected.filter(r =>
    r.rejection_reason || r.rejection_policy || r.reason
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
    return { pass: null, score: null, issues: ['Comparison data not available'], details: { status: 'not_run' } };
  }

  const clusterMean = clusterResults.mean_score || 0;
  const primaryMean = primaryOnlyResults.mean_score || 0;
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
      threshold: 0.30,
    },
  };
}

// ── Gate: Economics ───────────────────────────────────────────────────

/**
 * Economics gate — does the cluster justify its cost?
 */
function economicsGate(plan, executionCost) {
  const assetCount = (plan?.selection?.advisors?.length || 0) + 1;
  const tokensUsed = executionCost?.tokens_used || plan?.budget?.assets_consumed * 400 || 0;
  const maxTokens = plan?.budget?.max_tokens || 800;
  const budgetOk = tokensUsed <= maxTokens;

  // Marginal cost: each additional asset should improve judgment by at least 0.15
  const marginalCostPerAsset = assetCount > 1 ? tokensUsed / assetCount : tokensUsed;

  const issues = [];
  if (!budgetOk) issues.push(`Budget exceeded: ${tokensUsed}/${maxTokens} tokens`);
  if (assetCount > 3) issues.push(`High asset count (${assetCount}) — marginal value should be proven`);

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
  if (assetsLoaded == null) {
    return { pass: null, score: 0, issues: ['Trust evidence not provided'], details: { status: 'not_run' } };
  }
  if (!assetsLoaded.length) {
    return { pass: false, score: 0, issues: ['No assets loaded'], details: {} };
  }

  const issues = [];
  for (const a of assetsLoaded) {
    if (!a.digest_verified) issues.push(`${a.asset_id}: digest not verified`);
    if (a.authorization === 'blocked') issues.push(`${a.asset_id}: authorization blocked`);
  }

  const primaryAsset = assetsLoaded.find(a => a.role === 'primary');
  if (primaryAsset && !primaryAsset.digest_verified) {
    issues.push('Primary asset digest not verified — blocking');
  }

  return {
    pass: issues.length === 0,
    score: issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.25),
    issues,
    details: {
      total_assets: assetsLoaded.length,
      verified: assetsLoaded.filter(a => a.digest_verified).length,
      unverified: assetsLoaded.filter(a => !a.digest_verified).map(a => a.asset_id),
    },
  };
}

// ── Gate: Product ─────────────────────────────────────────────────────

/**
 * Product gate — can a user understand and operate this cluster?
 */
function productGate(plan, manifest) {
  const issues = [];
  const clusterId = manifest?.cluster_id || plan?.cluster_ref?.cluster_id || 'unknown';

  if (!manifest?.description || manifest.description.startsWith('[TODO') || manifest.description.includes('[TODO'))
    issues.push('Cluster description is missing or has placeholders');
  if (!manifest?.domains?.length || manifest.domains.length < 2)
    issues.push('Cluster has fewer than 2 domains — may be single-asset disguised as cluster');
  if (!manifest?.composition?.strategy)
    issues.push('No composition strategy defined');
  if ((manifest?.domains || []).some(d => !d.load_condition || d.load_condition.startsWith('[TODO') || d.load_condition.includes('[TODO')))
    issues.push('Some domains have missing or placeholder load conditions');

  return {
    pass: issues.length === 0,
    score: issues.length === 0 ? 1.0 : Math.max(0, 1.0 - issues.length * 0.2),
    issues,
    details: {
      has_description: !!(manifest?.description && !manifest.description.startsWith('[TODO') && !manifest.description.includes('[TODO')),
      domain_count: manifest?.domains?.length || 0,
      composition_defined: !!manifest?.composition?.strategy,
      load_conditions_complete: (manifest?.domains || []).every(d => d.load_condition && !d.load_condition.startsWith('[TODO') && !d.load_condition.includes('[TODO')),
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
  const { manifest, plan, executionCost, comparisonArms = [], fixtures = [] } = opts;
  const startTime = Date.now();

  // Structural gate
  const structural = structuralGate(plan);

  // Behavioral gate
  const primaryOnly = comparisonArms.find(a => a.arm === 'primary_only') || null;
  const boundedCompose = comparisonArms.find(a => a.arm === 'bounded_compose') || null;
  const behavioral = behavioralGate(boundedCompose, primaryOnly);

  // Economics gate
  const economics = economicsGate(plan, executionCost);

  // Trust gate — asset-loading evidence is required for evaluation.
  // Plan selection alone is NOT trust evidence. The gate returns null
  // (not evaluated) when no observed trust data is available.
  const trust = (plan?.assets_loaded?.length || opts?.assetsLoaded?.length)
    ? trustGate(opts.assetsLoaded || plan.assets_loaded)
    : trustGate(null);

  // Product gate
  const product = productGate(plan, manifest);

  // Comparison arm results
  const comparisonArmResults = CLUSTER_COMPARISON_ARMS.map(arm => {
    const armData = comparisonArms.find(a => a.arm === arm);
    return {
      arm,
      description: COMPARISON_ARM_DESCRIPTIONS[arm],
      score: armData?.mean_score || null,
      critical_errors: armData?.critical_errors || null,
      status: armData ? 'completed' : 'not_run',
    };
  });

  const gates = { structural, behavioral, economics, trust, product };
  // Promotion is fail-closed: a hard gate that was not run is not a pass.
  const allPassed = Object.values(gates).every(g => g.pass === true);
  const blocked = Object.values(gates).filter(g => g.pass === false).length;
  const passed = Object.values(gates).filter(g => g.pass === true).length;
  const notRun = Object.values(gates).filter(g => g.pass === null).length;

  return {
    assay_version: '0.9.0',
    cluster_id: manifest?.cluster_id || 'unknown',
    cluster_version: manifest?.version || '0.1.0',
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    fixture_count: fixtures.length,
    comparison_arms: comparisonArmResults,
    gates,
    verdict: {
      overall: allPassed ? 'pass' : 'fail',
      passed,
      blocked,
      not_run: notRun,
      all_passed: allPassed,
      failed_gates: Object.entries(gates).filter(([, g]) => g.pass === false).map(([name]) => name),
      incomplete_gates: Object.entries(gates).filter(([, g]) => g.pass === null).map(([name]) => name),
    },
    marginal_value: {
      primary_only_score: primaryOnly?.mean_score || null,
      cluster_score: boundedCompose?.mean_score || null,
      delta: (boundedCompose?.mean_score || 0) - (primaryOnly?.mean_score || 0),
      threshold_met: ((boundedCompose?.mean_score || 0) - (primaryOnly?.mean_score || 0)) >= 0.3,
      threshold: 0.30,
    },
    dataset_fingerprint: 'sha256:' + crypto.createHash('sha256')
      .update(JSON.stringify(fixtures.map(f => f.fixture_id || ''))).digest('hex').slice(0, 32),
  };
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
  const advisors = plan?.selection?.advisors || [];
  const rejected = plan?.selection?.rejected || [];
  const primary = plan?.selection?.primary;

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
    const decision = decisions.find(d => d.asset_id === a.asset_id);
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
    cluster_id: plan?.cluster_ref?.cluster_id || 'unknown',
    created_at: new Date().toISOString(),
    entries,
    summary: {
      total_entries: entries.length,
      primary_count: entries.filter(e => e.relation_type === 'primary').length,
      advisor_count: entries.filter(e => e.relation_type === 'advisor').length,
      rejected_count: entries.filter(e => e.relation_type === 'rejected').length,
      human_reviewed_count: entries.filter(e => e.human_reviewed).length,
      pending_review_count: entries.filter(e => e.relation_type === 'advisor' && !e.human_reviewed).length,
    },
  };
}

// ── Human Decision Format ─────────────────────────────────────────────

/**
 * Record a human decision about an advisor relation.
 */
function recordAdvisorDecision(assetId, decision, opts = {}) {
  const valid = ['approved', 'approved_with_changes', 'rejected', 'needs_revision'];
  if (!valid.includes(decision)) throw new Error(`Invalid decision: ${decision}. Must be: ${valid.join(', ')}`);

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
  const results = {};
  for (const mode of REPLAY_MODES) {
    try {
      const run = engine.replayRun(mode, {
        fixtures: fixtures.map(f => ({ id: f.fixture_id, task: f.task, expected: f })),
        policy: { cluster_id: opts.clusterId || 'unknown' },
      });
      if (run?.results) {
        const passed = run.results.filter(r => r.pass !== false).length;
        results[mode] = {
          status: 'completed',
          total: run.results.length,
          passed,
          failed: run.results.length - passed,
          pass_rate: run.results.length > 0 ? passed / run.results.length : 0,
        };
      } else {
        results[mode] = { status: 'failed', error: 'No results from replay engine' };
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
