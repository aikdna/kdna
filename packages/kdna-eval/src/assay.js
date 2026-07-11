/**
 * KDNA Asset Assay — Repeatable quality evaluation for single KDNA assets.
 *
 * Separates structural validity from behavioral quality, trust state,
 * field validation, and product readiness. Implements the roadmap
 * Section 7.1 dataset classes, baselines, and candidate thresholds.
 *
 * A fixture is a { task, expected, category } triple.
 * A baseline is a named comparison arm (no-KDNA, best-prompt, etc.).
 * A threshold is a preregistered pass/fail gate.
 */

const crypto = require('crypto');
const { createReplayEngine } = require('./replay');
const { createMultiGateRunner } = require('./gates');
const { createCostTracker, BUDGET_PROFILES } = require('./cost');

// ── Constants ─────────────────────────────────────────────────────────

const FIXTURE_CATEGORIES = [
  'positive_target',       // task is squarely in the asset's domain
  'non_applicable',        // task is clearly outside scope — asset should skip
  'adjacent_ambiguous',    // task is near the boundary — tests boundary behavior
  'high_risk_failure',     // task where wrong judgment would cause harm
  'regression',            // task derived from a previously observed real failure
  'holdout',               // never used for authoring or repair — independent evaluation
];

const BASELINE_ARMS = [
  'no_kdna',               // runner gets no KDNA — raw judgment quality
  'best_ordinary_prompt',   // runner gets the best non-KDNA prompt under comparable budget
  'correct_single_kdna',    // runner gets the correct KDNA asset
  'wrong_or_adjacent_kdna', // runner gets a wrong or adjacent KDNA asset
];

const CLASSIFICATION_LEVELS = [
  'conformance_asset',
  'benchmark_asset',
  'reference_asset',
  'behavior_evaluated_asset',
  'field_validated_asset',
  'production_asset',
];

// ── Assay Profile ─────────────────────────────────────────────────────

/**
 * Create an Asset Assay profile with preregistered thresholds.
 *
 * @param {object} opts
 * @param {string} opts.assetId
 * @param {string} opts.assetVersion
 * @param {string} opts.assetDigest
 * @param {object} [opts.thresholds] — custom thresholds (overrides defaults)
 * @returns {object} assay profile
 */
function createAssayProfile(opts = {}) {
  return {
    profile_version: '0.9.0',
    asset_id: opts.assetId || 'unknown',
    asset_version: opts.assetVersion || '0.1.0',
    asset_digest: opts.assetDigest || null,
    created_at: new Date().toISOString(),
    thresholds: {
      // Default candidate thresholds per roadmap §7.1
      positive_target_min_count: opts.thresholds?.positive_target_min_count ?? 8,
      non_applicable_min_count: opts.thresholds?.non_applicable_min_count ?? 4,
      adjacent_ambiguous_min_count: opts.thresholds?.adjacent_ambiguous_min_count ?? 4,
      high_risk_failure_min_count: opts.thresholds?.high_risk_failure_min_count ?? 2,
      regression_min_count: opts.thresholds?.regression_min_count ?? 2,
      holdout_required: opts.thresholds?.holdout_required ?? true,

      // Behavioral thresholds
      blind_mean_improvement_min: opts.thresholds?.blind_mean_improvement_min ?? 0.5,
      critical_error_reduction_pct: opts.thresholds?.critical_error_reduction_pct ?? 30,
      non_applicable_accuracy_min: opts.thresholds?.non_applicable_accuracy_min ?? 0.90,
      harmful_contamination_max: opts.thresholds?.harmful_contamination_max ?? 0.05,
      high_risk_harm_zero: opts.thresholds?.high_risk_harm_zero ?? true,
      regression_pass_required: opts.thresholds?.regression_pass_required ?? true,
      min_model_runtime_combinations: opts.thresholds?.min_model_runtime_combinations ?? 2,
      human_review_required: opts.thresholds?.human_review_required ?? true,

      // Gates
      structural_gate: true,
      behavioral_gate: true,
      boundary_gate: true,
      contamination_gate: true,
      trust_gate: false,       // requires signature + authorization infrastructure
      economics_gate: false,   // requires real cost data
      interoperability_gate: false, // requires cross-language evidence
      product_gate: false,     // requires UX + user evidence
    },
  };
}

// ── Fixture Classes ───────────────────────────────────────────────────

/**
 * Validate that a fixture set meets the minimum dataset requirements.
 *
 * @param {Array<{category: string, task: string, expected: object}>} fixtures
 * @param {object} profile
 * @returns {{ valid: boolean, summary: object, errors: string[] }}
 */
function validateFixtureSet(fixtures, profile) {
  const counts = {};
  for (const cat of FIXTURE_CATEGORIES) counts[cat] = 0;
  for (const f of fixtures) {
    if (FIXTURE_CATEGORIES.includes(f.category)) counts[f.category]++;
  }

  const errors = [];
  const t = profile.thresholds;

  if (counts.positive_target < t.positive_target_min_count)
    errors.push(`positive_target: ${counts.positive_target} < required ${t.positive_target_min_count}`);
  if (counts.non_applicable < t.non_applicable_min_count)
    errors.push(`non_applicable: ${counts.non_applicable} < required ${t.non_applicable_min_count}`);
  if (counts.adjacent_ambiguous < t.adjacent_ambiguous_min_count)
    errors.push(`adjacent_ambiguous: ${counts.adjacent_ambiguous} < required ${t.adjacent_ambiguous_min_count}`);
  if (counts.high_risk_failure < t.high_risk_failure_min_count)
    errors.push(`high_risk_failure: ${counts.high_risk_failure} < required ${t.high_risk_failure_min_count}`);
  if (counts.regression < t.regression_min_count)
    errors.push(`regression: ${counts.regression} < required ${t.regression_min_count}`);
  if (t.holdout_required && counts.holdout < 1)
    errors.push('holdout: at least 1 holdout fixture required');

  return {
    valid: errors.length === 0,
    summary: {
      total: fixtures.length,
      by_category: counts,
      required_met: !errors.length,
    },
    errors,
  };
}

/**
 * Create an assay fixture.
 *
 * @param {object} opts
 * @param {string} opts.category — one of FIXTURE_CATEGORIES
 * @param {string} opts.task — task description / input
 * @param {object} opts.expected — expected judgment structure
 * @param {object} [opts.metadata]
 * @returns {object} fixture
 */
function createFixture(opts = {}) {
  if (!FIXTURE_CATEGORIES.includes(opts.category))
    throw new Error(`Unknown fixture category: ${opts.category}. Must be one of: ${FIXTURE_CATEGORIES.join(', ')}`);

  const task = opts.task || '';
  return {
    fixture_id: `fixture_${crypto.randomBytes(8).toString('hex')}`,
    category: opts.category,
    task,
    task_hash: `sha256:${crypto.createHash('sha256').update(task).digest('hex')}`,
    expected: opts.expected || {},
    metadata: opts.metadata || {},
    created_at: new Date().toISOString(),
  };
}

// ── Baseline Arms ─────────────────────────────────────────────────────

/**
 * Create a baseline arm definition.
 *
 * @param {string} arm — one of BASELINE_ARMS
 * @param {object} [config]
 * @returns {object} arm definition
 */
function createBaselineArm(arm, config = {}) {
  if (!BASELINE_ARMS.includes(arm))
    throw new Error(`Unknown baseline arm: ${arm}. Must be one of: ${BASELINE_ARMS.join(', ')}`);
  return {
    arm,
    description: ARM_DESCRIPTIONS[arm],
    config,
  };
}

const ARM_DESCRIPTIONS = {
  no_kdna: 'Runner receives no KDNA — raw model judgment quality.',
  best_ordinary_prompt: 'Runner receives the best ordinary prompt under comparable token budget — no KDNA content.',
  correct_single_kdna: 'Runner receives the correct KDNA asset loaded with default projection.',
  wrong_or_adjacent_kdna: 'Runner receives a semantically adjacent but incorrect KDNA asset.',
};

/**
 * Create all required baseline arms.
 *
 * @returns {Array<object>}
 */
function createAllBaselineArms() {
  return BASELINE_ARMS.map(arm => createBaselineArm(arm));
}

// ── Judgment Scoring ──────────────────────────────────────────────────

/**
 * Score a single judgment result on a 5-point scale.
 *
 * Scale:
 *   5 — Excellent: judgment correctly identifies situation, applies all relevant
 *       axioms, respects boundaries, identifies risks, actionable recommendation.
 *   4 — Good: correct classification, most axioms applied, minor omissions.
 *   3 — Adequate: broadly correct but misses key nuance or boundary.
 *   2 — Poor: partially correct but significant gaps or wrong classification.
 *   1 — Harmful: wrong judgment that could lead to harmful action.
 *
 * @param {object} result — runner result
 * @param {object} expected — expected judgment
 * @param {object} [criteria]
 * @returns {{ score: number, dimensions: object, notes: string[] }}
 */
function scoreJudgment(result, expected, criteria = {}) {
  const notes = [];
  let totalScore = 3; // start at adequate, adjust up/down
  const dimensions = {
    classification: 3,
    axiom_application: 3,
    boundary_respect: 3,
    risk_awareness: 3,
    actionable: 3,
  };

  // Check result against expected
  const answer = result?.answer || result?.result?.answer || '';
  const expectedAnswer = expected?.answer || expected?.result?.answer || '';

  if (!answer) {
    notes.push('No answer in result');
    dimensions.classification = 1;
    dimensions.actionable = 1;
    totalScore = 1;
    return { score: totalScore, dimensions, notes };
  }

  // Classification match
  if (expectedAnswer && answer.toLowerCase().includes(expectedAnswer.toLowerCase())) {
    dimensions.classification = 5;
    notes.push('Classification matches expected');
  } else if (expectedAnswer) {
    dimensions.classification = 2;
    notes.push(`Classification differs from expected: "${expectedAnswer}"`);
  }

  // Check for reasoning depth
  const reasoning = result?.reasoning || result?.result?.reasoning || [];
  if (Array.isArray(reasoning) && reasoning.length > 0) {
    dimensions.axiom_application = Math.min(5, 3 + reasoning.length);
    notes.push(`${reasoning.length} reasoning steps`);
  }

  // Check for source attribution (axiom references)
  const sources = result?.sources || result?.result?.sources || [];
  if (sources.length > 0) {
    const operationalized = sources.filter(s => s.transfer_level === 'operationalized').length;
    if (operationalized > 0) {
      dimensions.axiom_application = Math.min(5, dimensions.axiom_application + 1);
      notes.push(`${operationalized} axioms operationalized`);
    }
  }

  // Check alternatives (boundary awareness)
  const alternatives = result?.alternatives || result?.result?.alternatives || [];
  if (alternatives.length > 0) {
    dimensions.boundary_respect = 4;
    notes.push(`${alternatives.length} alternatives considered`);
  }

  // Check self-checks
  const selfChecks = result?.self_checks || result?.evaluation?.self_checks || [];
  if (selfChecks.length > 0) {
    const passed = selfChecks.filter(c => c.passed).length;
    const allPassed = passed === selfChecks.length;
    dimensions.risk_awareness = allPassed ? 5 : (passed > 0 ? 3 : 2);
    notes.push(`Self-checks: ${passed}/${selfChecks.length} passed`);
  }

  // Confidence
  const confidence = result?.confidence || 'medium';
  dimensions.actionable = confidence === 'high' ? 5 : confidence === 'medium' ? 3 : 2;

  // Compute weighted total
  const weights = criteria.weights || { classification: 0.3, axiom_application: 0.25, boundary_respect: 0.2, risk_awareness: 0.15, actionable: 0.1 };
  totalScore = Object.entries(weights).reduce((sum, [dim, w]) => sum + (dimensions[dim] || 3) * w, 0);

  return {
    score: Math.round(totalScore * 10) / 10,
    dimensions,
    notes,
  };
}

// ── Contamination Detection ───────────────────────────────────────────

/**
 * Check a result for harmful contamination — banned terms, boundary
 * violations, risk triggers.
 *
 * @param {object} result
 * @param {object} asset — asset metadata with banned_terms, boundaries
 * @returns {{ contaminated: boolean, issues: Array<object>, contamination_rate: number }}
 */
function detectContamination(result, asset = {}) {
  const issues = [];
  const answer = result?.answer || result?.result?.answer || '';
  const reasoning = Array.isArray(result?.reasoning) ? result.reasoning.join(' ') :
    (typeof result?.reasoning === 'string' ? result.reasoning : '');
  const fullText = (answer + ' ' + reasoning).toLowerCase();

  // Check banned terms
  const bannedTerms = asset.banned_terms || [];
  for (const term of bannedTerms) {
    if (fullText.includes(term.toLowerCase())) {
      issues.push({ type: 'banned_term_used', term, severity: 'warning' });
    }
  }

  // Check boundary violations
  const doesNotApply = asset.does_not_apply_when || [];
  for (const boundary of doesNotApply) {
    if (fullText.includes(boundary.toLowerCase())) {
      issues.push({ type: 'boundary_crossed', boundary, severity: 'error' });
    }
  }

  // Check for risk triggers (vague/unsafe language)
  const riskPhrases = ['always safe', 'never fails', 'guaranteed', '100% sure', 'no risk', 'completely safe'];
  for (const phrase of riskPhrases) {
    if (fullText.includes(phrase)) {
      issues.push({ type: 'risk_triggered', phrase, severity: 'warning' });
    }
  }

  // Count violations
  const errors = issues.filter(i => i.severity === 'error').length;
  const totalTokens = fullText.split(/\s+/).length || 1;
  const contaminationRate = issues.length / Math.max(totalTokens, 10);

  return {
    contaminated: issues.length > 0,
    issues,
    contamination_rate: Math.round(contaminationRate * 1000) / 1000,
    error_count: errors,
    warning_count: issues.length - errors,
  };
}

// ── Non-Applicable Behavior ───────────────────────────────────────────

/**
 * Evaluate non-applicable behavior — did the asset correctly refuse/skip?
 *
 * @param {object} result — runner result for a non_applicable fixture
 * @param {object} expected — expected behavior { should_skip: true, reason: "..." }
 * @returns {{ correct: boolean, skipped: boolean, reason: string }}
 */
function evaluateNonApplicable(result, expected = {}) {
  const answer = (result?.answer || result?.result?.answer || '').toLowerCase();
  const confidence = (result?.confidence || result?.result?.confidence || '').toLowerCase();
  const decision = result?.applicability?.decision || result?.result?.decision || result?.decision || '';

  const skipSignals = [
    'does not apply', 'not applicable', 'out of scope', 'not in scope',
    'cannot judge', 'insufficient', 'not covered', 'outside',
    '不在范围内', '不适用', '超出范围',
  ];

  const didSkip = skipSignals.some(s => answer.includes(s)) ||
    decision === 'does_not_apply' ||
    decision === 'skip';

  return {
    correct: didSkip,
    skipped: didSkip,
    reason: didSkip ? 'asset correctly identified task as non-applicable' : 'asset attempted to judge a non-applicable task',
  };
}

// ── Assay Runner ──────────────────────────────────────────────────────

/**
 * Run an Asset Assay against a set of fixtures and baselines.
 *
 * @param {object} opts
 * @param {object} opts.profile — assay profile from createAssayProfile()
 * @param {Array<object>} opts.fixtures — assay fixtures
 * @param {function} opts.runner — async (fixture, baselineArm, context) => result
 * @param {object} opts.asset — asset metadata (banned_terms, boundaries, etc.)
 * @param {object} [opts.context] — additional context
 * @returns {Promise<object>} assay results
 */
async function runAssay(opts = {}) {
  const { profile, fixtures, runner, asset = {}, context = {} } = opts;
  if (!runner || typeof runner !== 'function')
    throw new Error('runAssay requires a runner function: async (fixture, baselineArm, context) => result');

  const baselineArms = opts.baselineArms || createAllBaselineArms();
  const results = [];
  const startTime = Date.now();

  // Validate fixture set
  const fixtureValidation = validateFixtureSet(fixtures, profile);

  // Run each fixture against each baseline arm
  for (const fixture of fixtures) {
    for (const arm of baselineArms) {
      try {
        const result = await runner(fixture, arm, { ...context, profile, asset });
        results.push({
          fixture_id: fixture.fixture_id,
          fixture_category: fixture.category,
          baseline_arm: arm.arm,
          result,
          error: null,
        });
      } catch (e) {
        results.push({
          fixture_id: fixture.fixture_id,
          fixture_category: fixture.category,
          baseline_arm: arm.arm,
          result: null,
          error: e.message,
        });
      }
    }
  }

  // Group results by baseline arm for comparison
  const byArm = {};
  for (const arm of baselineArms) {
    const armResults = results.filter(r => r.baseline_arm === arm.arm);
    const scores = armResults
      .filter(r => r.result && !r.error)
      .map(r => scoreJudgment(r.result, r.result?.expected || fixtureFor(r.fixture_id, fixtures), { arm: arm.arm }));
    const skipped = armResults.filter(r => r.result?.skipped || r.result?.decision === 'does_not_apply').length;
    const errors = armResults.filter(r => r.error).length;
    byArm[arm.arm] = {
      count: armResults.length,
      scores,
      mean_score: scores.length > 0 ? scores.reduce((s, sc) => s + sc.score, 0) / scores.length : 0,
      skipped,
      errors,
      error_rate: armResults.length > 0 ? errors / armResults.length : 0,
    };
  }

  // Compute thresholds
  const noKdnaScore = byArm['no_kdna']?.mean_score || 0;
  const correctKdnaScore = byArm['correct_single_kdna']?.mean_score || 0;

  // Non-applicable accuracy
  const naFixtures = fixtures.filter(f => f.category === 'non_applicable');
  const naResults = results.filter(r => r.fixture_category === 'non_applicable' && r.baseline_arm === 'correct_single_kdna');
  const naCorrect = naResults.filter(r => r.result && evaluateNonApplicable(r.result).correct).length;
  const naAccuracy = naResults.length > 0 ? naCorrect / naResults.length : 1;

  // Contamination check
  const positiveResults = results.filter(r => r.fixture_category === 'positive_target' && r.baseline_arm === 'correct_single_kdna');
  const contaminationResults = positiveResults.map(r => r.result ? detectContamination(r.result, asset) : { contaminated: false, issues: [], contamination_rate: 0, error_count: 0, warning_count: 0 });
  const contaminatedCount = contaminationResults.filter(c => c.contaminated).length;
  const contaminationRate = positiveResults.length > 0 ? contaminatedCount / positiveResults.length : 0;

  // High-risk: zero harm
  const hrFixtures = fixtures.filter(f => f.category === 'high_risk_failure');
  const hrResults = results.filter(r => r.fixture_category === 'high_risk_failure' && r.baseline_arm === 'correct_single_kdna');
  const hrContaminationResults = hrResults.map(r => r.result ? detectContamination(r.result, asset) : { error_count: 0 });
  const hrHarmfulCount = hrContaminationResults.filter(c => c.error_count > 0).length;

  // Regression check
  const regFixtures = fixtures.filter(f => f.category === 'regression');
  const regResults = results.filter(r => r.fixture_category === 'regression' && r.baseline_arm === 'correct_single_kdna');
  const regScores = regResults
    .filter(r => r.result)
    .map(r => scoreJudgment(r.result, {}, { arm: 'regression' }));
  const regPassed = regScores.filter(s => s.score >= 4).length;
  const regAllPassed = regResults.length > 0 ? regScores.every(s => s.score >= 4) : true;

  // Compute pass/fail against thresholds
  const t = profile.thresholds;
  const meanImprovement = correctKdnaScore - noKdnaScore;
  const criticalErrorReduction = noKdnaScore > 0 ?
    ((correctKdnaScore - noKdnaScore) / noKdnaScore) * 100 : 0;

  const thresholdResults = {
    fixture_dataset: { pass: fixtureValidation.valid, detail: fixtureValidation.summary },
    blind_improvement: {
      pass: meanImprovement >= t.blind_mean_improvement_min,
      detail: { mean_improvement: Math.round(meanImprovement * 100) / 100, threshold: t.blind_mean_improvement_min },
    },
    non_applicable_accuracy: {
      pass: naAccuracy >= t.non_applicable_accuracy_min,
      detail: { accuracy: Math.round(naAccuracy * 100) / 100, threshold: t.non_applicable_accuracy_min, correct: naCorrect, total: naResults.length },
    },
    contamination: {
      pass: contaminationRate <= t.harmful_contamination_max,
      detail: { contamination_rate: Math.round(contaminationRate * 1000) / 1000, threshold: t.harmful_contamination_max, contaminated: contaminatedCount, total: positiveResults.length },
    },
    high_risk_harm: {
      pass: !t.high_risk_harm_zero || hrHarmfulCount === 0,
      detail: { harmful_count: hrHarmfulCount, total: hrResults.length },
    },
    regression: {
      pass: !t.regression_pass_required || regAllPassed,
      detail: { passed: regPassed, total: regResults.length, all_passed: regAllPassed },
    },
  };

  const allPassed = Object.values(thresholdResults).every(tr => tr.pass);
  const durationMs = Date.now() - startTime;

  return {
    assay_version: '0.9.0',
    profile,
    fixture_validation: fixtureValidation,
    results_by_arm: byArm,
    results: results.slice(0, 100), // summary; full results may be large
    result_count: results.length,
    threshold_results: thresholdResults,
    overall_verdict: allPassed ? 'pass' : 'fail',
    failed_thresholds: Object.entries(thresholdResults).filter(([, tr]) => !tr.pass).map(([name]) => name),
    duration_ms: durationMs,
    dataset_fingerprint: `sha256:${crypto.createHash('sha256').update(JSON.stringify(fixtures.map(f => f.fixture_id))).digest('hex').slice(0, 32)}`,
  };
}

function fixtureFor(fixtureId, fixtures) {
  return fixtures.find(f => f.fixture_id === fixtureId)?.expected || {};
}

// ── Asset Classification ──────────────────────────────────────────────

/**
 * Classify an asset based on evidence.
 *
 * Classification is independent — an asset can be behavior_evaluated
 * AND reference_asset. No level implies higher levels.
 *
 * @param {object} evidence — accumulated evidence claims for this asset
 * @returns {object} classification
 */
function classifyAsset(evidence = {}) {
  const classification = {
    levels: [],
    highest_level: 'unclassified',
    evidence_summary: {},
  };

  // Conformance Asset: format validates and loads
  if (evidence.format_valid === true && evidence.loads === true) {
    classification.levels.push('conformance_asset');
    classification.highest_level = 'conformance_asset';
  }

  // Benchmark Asset: named benchmark role + reproducible tasks
  if (evidence.benchmark_role && evidence.benchmark_tasks?.length > 0) {
    classification.levels.push('benchmark_asset');
    classification.highest_level = 'benchmark_asset';
  }

  // Reference Asset: public-safe authoring explanation + boundary examples
  if (evidence.has_authoring_explanation && evidence.has_boundary_examples) {
    classification.levels.push('reference_asset');
    classification.highest_level = 'reference_asset';
  }

  // Behavior-Evaluated Asset: controlled baseline comparison + regression report
  if (evidence.assay_passed === true && evidence.comparison_arms_run >= 4) {
    classification.levels.push('behavior_evaluated_asset');
    classification.highest_level = 'behavior_evaluated_asset';
  }

  // Field-Validated Asset: real users, real tasks, documented limitations
  if (evidence.field_users >= 10 && evidence.field_tasks >= 20) {
    classification.levels.push('field_validated_asset');
    classification.highest_level = 'field_validated_asset';
  }

  // Production Asset: all gates passed
  if (evidence.all_gates_passed === true &&
      classification.levels.includes('behavior_evaluated_asset') &&
      classification.levels.includes('field_validated_asset')) {
    classification.levels.push('production_asset');
    classification.highest_level = 'production_asset';
  }

  // Explicit non-claims
  classification.explicitly_not = {
    load_ready_only: classification.highest_level === 'conformance_asset',
    not_behavior_evaluated: !classification.levels.includes('behavior_evaluated_asset'),
    not_field_validated: !classification.levels.includes('field_validated_asset'),
    not_production: !classification.levels.includes('production_asset'),
  };

  return classification;
}

// ── Evidence Claim Generator ──────────────────────────────────────────

/**
 * Generate a machine-readable evidence claim from assay results.
 *
 * @param {object} assayOutput — output from runAssay()
 * @param {object} opts
 * @returns {object} evidence claim (conforms to evidence-claim-candidate-0.9 schema)
 */
function generateEvidenceClaim(assayOutput, opts = {}) {
  const { profile, threshold_results, overall_verdict, result_count } = assayOutput;

  return {
    evidence_version: '0.9.0',
    claim_id: `claim_${crypto.randomBytes(8).toString('hex')}`,
    trace_id: opts.traceId || null,
    plan_id: opts.planId || null,
    claim_type: 'comparison_assay',
    asset_ref: {
      asset_id: profile.asset_id,
      version: profile.asset_version,
      digest: profile.asset_digest,
    },
    scope: {
      task_family: opts.taskFamily || 'asset_assay',
      task_hash: assayOutput.dataset_fingerprint,
      model: opts.model || 'unknown',
      runtime: opts.runtime || 'kdna-eval 0.2.0',
      dataset_fingerprint: assayOutput.dataset_fingerprint,
      evaluator: 'deterministic',
    },
    judgment_quality: {
      axiom_coverage: {
        triggered: result_count,
        available: assayOutput.fixture_validation?.summary?.total || 0,
        coverage_ratio: assayOutput.fixture_validation?.summary?.total > 0 ?
          result_count / assayOutput.fixture_validation.summary.total : 0,
      },
    },
    comparison_arms: Object.fromEntries(
      Object.entries(assayOutput.results_by_arm || {}).map(([arm, data]) => [
        arm,
        { score: Math.round(data.mean_score * 100) / 100, status: 'completed', arm },
      ])
    ),
    marginal_value: {
      baseline_score: assayOutput.results_by_arm?.['no_kdna']?.mean_score || null,
      target_score: assayOutput.results_by_arm?.['correct_single_kdna']?.mean_score || null,
      delta: null,
      threshold_met: overall_verdict === 'pass',
      threshold_name: '+0.5 mean vs no-KDNA or -30% critical errors',
      evidence_produced: true,
    },
    limitations: [
      `Automated assay — ${result_count} fixture × baseline arm combinations evaluated`,
      `Thresholds passed: ${Object.values(threshold_results).filter(t => t.pass).length}/${Object.values(threshold_results).length}`,
      `Failed thresholds: ${assayOutput.failed_thresholds.join(', ') || 'none'}`,
    ],
    classification: {
      level: overall_verdict === 'pass' ? 'behavior_evaluated' : 'usage_evidence',
      not_behavior_evaluated: overall_verdict !== 'pass',
      not_field_validated: true,
      not_production: true,
      load_ready_only: false,
    },
    provenance: {
      generated_by: 'kdna-eval assay',
      generated_at: new Date().toISOString(),
    },
  };
}

module.exports = {
  FIXTURE_CATEGORIES,
  BASELINE_ARMS,
  CLASSIFICATION_LEVELS,
  createAssayProfile,
  validateFixtureSet,
  createFixture,
  createAllBaselineArms,
  createBaselineArm,
  scoreJudgment,
  detectContamination,
  evaluateNonApplicable,
  runAssay,
  classifyAsset,
  generateEvidenceClaim,
};
