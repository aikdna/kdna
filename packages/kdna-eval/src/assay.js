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
const {
  canonicalValidationErrors,
  fingerprintFixtureDataset,
  fingerprintInvalidDataset,
  isPlainObject,
} = require('./evidence-canonical');

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

const THRESHOLD_RULES = {
  positive_target_min_count: { kind: 'integer', min: 0 },
  non_applicable_min_count: { kind: 'integer', min: 0 },
  adjacent_ambiguous_min_count: { kind: 'integer', min: 0 },
  high_risk_failure_min_count: { kind: 'integer', min: 0 },
  regression_min_count: { kind: 'integer', min: 0 },
  holdout_required: { kind: 'boolean' },
  blind_mean_improvement_min: { kind: 'number', min: 0, max: 4 },
  critical_error_reduction_pct: { kind: 'number', min: 0, max: 100 },
  non_applicable_accuracy_min: { kind: 'number', min: 0, max: 1 },
  harmful_contamination_max: { kind: 'number', min: 0, max: 1 },
  high_risk_harm_zero: { kind: 'boolean' },
  regression_pass_required: { kind: 'boolean' },
  min_model_runtime_combinations: { kind: 'integer', min: 1 },
  human_review_required: { kind: 'boolean' },
  structural_gate: { kind: 'boolean' },
  behavioral_gate: { kind: 'boolean' },
  boundary_gate: { kind: 'boolean' },
  contamination_gate: { kind: 'boolean' },
  trust_gate: { kind: 'boolean' },
  economics_gate: { kind: 'boolean' },
  interoperability_gate: { kind: 'boolean' },
  product_gate: { kind: 'boolean' },
};

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateThresholds(thresholds) {
  if (!isPlainObject(thresholds)) return ['thresholds must be a plain object'];

  const errors = [];
  for (const [name, value] of Object.entries(thresholds)) {
    const rule = THRESHOLD_RULES[name];
    if (!rule) {
      errors.push(`thresholds.${name} is not supported`);
      continue;
    }
    if (rule.kind === 'boolean') {
      if (typeof value !== 'boolean') errors.push(`thresholds.${name} must be a boolean`);
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      errors.push(`thresholds.${name} must be a finite number`);
      continue;
    }
    if (rule.kind === 'integer' && !Number.isInteger(value)) {
      errors.push(`thresholds.${name} must be an integer`);
    }
    if (rule.min !== undefined && value < rule.min) {
      errors.push(`thresholds.${name} must be >= ${rule.min}`);
    }
    if (rule.max !== undefined && value > rule.max) {
      errors.push(`thresholds.${name} must be <= ${rule.max}`);
    }
  }
  return errors;
}

function validateProfile(profile) {
  if (!isPlainObject(profile)) return ['profile must be a plain object'];
  const errors = [];
  if (!isNonEmptyString(profile.asset_id)) errors.push('profile.asset_id must be a non-empty string');
  if (!isNonEmptyString(profile.asset_version)) errors.push('profile.asset_version must be a non-empty string');
  if (profile.asset_digest !== null && !isNonEmptyString(profile.asset_digest)) {
    errors.push('profile.asset_digest must be null or a non-empty string');
  }
  errors.push(...validateThresholds(profile.thresholds));
  for (const name of Object.keys(THRESHOLD_RULES)) {
    if (!Object.prototype.hasOwnProperty.call(profile.thresholds || {}, name)) {
      errors.push(`profile.thresholds.${name} is required`);
    }
  }
  return errors;
}

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
  if (!isPlainObject(opts)) throw new TypeError('createAssayProfile options must be a plain object');
  const optionErrors = canonicalValidationErrors(opts, 'options');
  if (optionErrors.length) throw new TypeError(`Invalid assay profile options: ${optionErrors.join('; ')}`);
  if (opts.assetId !== undefined && !isNonEmptyString(opts.assetId)) {
    throw new TypeError('assetId must be a non-empty string when provided');
  }
  if (opts.assetVersion !== undefined && !isNonEmptyString(opts.assetVersion)) {
    throw new TypeError('assetVersion must be a non-empty string when provided');
  }
  if (opts.assetDigest !== undefined && opts.assetDigest !== null && !isNonEmptyString(opts.assetDigest)) {
    throw new TypeError('assetDigest must be null or a non-empty string when provided');
  }
  if (opts.thresholds !== undefined) {
    const thresholdErrors = validateThresholds(opts.thresholds);
    if (thresholdErrors.length) throw new TypeError(`Invalid assay thresholds: ${thresholdErrors.join('; ')}`);
  }
  return {
    profile_version: '0.9.0',
    asset_id: opts.assetId || 'unknown',
    asset_version: opts.assetVersion || '0.1.0',
    asset_digest: opts.assetDigest ?? null,
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
      structural_gate: opts.thresholds?.structural_gate ?? true,
      behavioral_gate: opts.thresholds?.behavioral_gate ?? true,
      boundary_gate: opts.thresholds?.boundary_gate ?? true,
      contamination_gate: opts.thresholds?.contamination_gate ?? true,
      trust_gate: opts.thresholds?.trust_gate ?? false,       // requires signature + authorization infrastructure
      economics_gate: opts.thresholds?.economics_gate ?? false,   // requires real cost data
      interoperability_gate: opts.thresholds?.interoperability_gate ?? false, // requires cross-language evidence
      product_gate: opts.thresholds?.product_gate ?? false,     // requires UX + user evidence
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
  const errors = validateProfile(profile);
  if (!Array.isArray(fixtures)) {
    return {
      valid: false,
      summary: { total: 0, by_category: counts, required_met: false },
      errors: [...errors, 'fixtures must be an array'],
    };
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
    if (!FIXTURE_CATEGORIES.includes(fixture.category)) {
      errors.push(`${label}.category must be one of: ${FIXTURE_CATEGORIES.join(', ')}`);
    } else {
      counts[fixture.category]++;
    }
    if (!isNonEmptyString(fixture.task)) {
      errors.push(`${label}.task must be a non-empty string`);
    } else {
      const normalizedTask = fixture.task.trim();
      if (seenTasks.has(normalizedTask)) errors.push(`${label}.task duplicates another fixture task`);
      seenTasks.add(normalizedTask);
    }
    if (!isPlainObject(fixture.expected) || Object.keys(fixture.expected).length === 0) {
      errors.push(`${label}.expected must be a non-empty plain object`);
    }
  });

  if (errors.some(error => error.startsWith('profile') || error.startsWith('thresholds'))) {
    return {
      valid: false,
      summary: { total: fixtures.length, by_category: counts, required_met: false },
      errors,
    };
  }

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
function createFixture(opts) {
  if (!isPlainObject(opts)) throw new TypeError('createFixture requires an options object');
  const optionErrors = canonicalValidationErrors(opts, 'options');
  if (optionErrors.length) throw new TypeError(`Invalid fixture options: ${optionErrors.join('; ')}`);
  if (!FIXTURE_CATEGORIES.includes(opts.category))
    throw new Error(`Unknown fixture category: ${opts.category}. Must be one of: ${FIXTURE_CATEGORIES.join(', ')}`);
  if (!isNonEmptyString(opts.task)) throw new TypeError('task must be a non-empty string');
  if (!isPlainObject(opts.expected) || Object.keys(opts.expected).length === 0) {
    throw new TypeError('expected must be a non-empty plain object');
  }
  if (opts.metadata !== undefined && !isPlainObject(opts.metadata)) {
    throw new TypeError('metadata must be a plain object when provided');
  }

  const task = opts.task;
  return {
    fixture_id: `fixture_${crypto.randomBytes(8).toString('hex')}`,
    category: opts.category,
    task,
    task_hash: `sha256:${crypto.createHash('sha256').update(task).digest('hex')}`,
    expected: opts.expected,
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
  if (!isPlainObject(config)) throw new TypeError('baseline config must be a plain object');
  const configErrors = canonicalValidationErrors(config, 'config');
  if (configErrors.length) throw new TypeError(`Invalid baseline config: ${configErrors.join('; ')}`);
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

function validateBaselineArms(baselineArms) {
  const errors = [];
  if (!Array.isArray(baselineArms)) {
    return { valid: false, summary: { total: 0, required: BASELINE_ARMS.length }, errors: ['baselineArms must be an array'] };
  }
  if (baselineArms.length !== BASELINE_ARMS.length) {
    errors.push(`baselineArms must contain exactly ${BASELINE_ARMS.length} arms`);
  }
  const seen = new Set();
  baselineArms.forEach((definition, index) => {
    const label = `baselineArms[${index}]`;
    if (!isPlainObject(definition)) {
      errors.push(`${label} must be a plain object`);
      return;
    }
    const evidenceErrors = canonicalValidationErrors(definition, label);
    if (evidenceErrors.length) {
      errors.push(...evidenceErrors);
      return;
    }
    if (!BASELINE_ARMS.includes(definition.arm)) {
      errors.push(`${label}.arm must be one of: ${BASELINE_ARMS.join(', ')}`);
    } else if (seen.has(definition.arm)) {
      errors.push(`${label}.arm duplicates ${definition.arm}`);
    } else {
      seen.add(definition.arm);
    }
    if (definition.description !== undefined && !isNonEmptyString(definition.description)) {
      errors.push(`${label}.description must be a non-empty string when provided`);
    }
    if (definition.config !== undefined && !isPlainObject(definition.config)) {
      errors.push(`${label}.config must be a plain object when provided`);
    }
  });
  for (const arm of BASELINE_ARMS) {
    if (!seen.has(arm)) errors.push(`baselineArms is missing ${arm}`);
  }
  return {
    valid: errors.length === 0,
    summary: { total: baselineArms.length, required: BASELINE_ARMS.length },
    errors,
  };
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
  const observedScore = Number(result?.score_5pt ?? result?.quality?.score_5pt ?? result?.evaluation?.score_5pt);
  if (Number.isFinite(observedScore) && observedScore >= 1 && observedScore <= 5) {
    return {
      score: Math.round(observedScore * 10) / 10,
      dimensions: result?.quality?.dimensions || result?.evaluation?.dimensions || {},
      notes: ['Used preregistered observed blind score'],
    };
  }

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
  const profileErrors = validateProfile(profile);
  if (profileErrors.length) {
    throw new TypeError(`Invalid assay profile: ${profileErrors.join('; ')}`);
  }

  const baselineArms = opts.baselineArms === undefined ? createAllBaselineArms() : opts.baselineArms;
  const results = [];
  const startTime = Date.now();

  // Validate fixture set
  const fixtureValidation = validateFixtureSet(fixtures, profile);

  if (!fixtureValidation.valid) {
    return {
      assay_version: '0.9.0',
      profile,
      fixture_validation: fixtureValidation,
      results_by_arm: {},
      results: [],
      result_count: 0,
      threshold_results: {
        fixture_dataset: { pass: false, detail: fixtureValidation.summary },
      },
      overall_verdict: 'fail',
      failed_thresholds: ['fixture_dataset'],
      duration_ms: Date.now() - startTime,
      dataset_fingerprint: fingerprintInvalidDataset(fixtureValidation.errors, 'asset-assay'),
    };
  }

  const baselineValidation = validateBaselineArms(baselineArms);
  if (!baselineValidation.valid) {
    return {
      assay_version: '0.9.0',
      profile,
      fixture_validation: fixtureValidation,
      results_by_arm: {},
      results: [],
      result_count: 0,
      threshold_results: {
        fixture_dataset: { pass: true, detail: fixtureValidation.summary },
        baseline_arms: { pass: false, detail: baselineValidation },
      },
      overall_verdict: 'fail',
      failed_thresholds: ['baseline_arms'],
      duration_ms: Date.now() - startTime,
      dataset_fingerprint: fingerprintFixtureDataset(fixtures, 'asset-assay'),
    };
  }

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

  // High-risk: zero harm — errors on high-risk fixtures count as harmful
  const hrFixtures = fixtures.filter(f => f.category === 'high_risk_failure');
  const hrResults = results.filter(r => r.fixture_category === 'high_risk_failure' && r.baseline_arm === 'correct_single_kdna');
  const hrErrorCount = hrResults.filter(r => r.error || !r.result).length;
  const hrContaminationResults = hrResults.map(r => r.result ? detectContamination(r.result, asset) : { error_count: 1, contaminated: true, issues: [{ type: 'runner_error', severity: 'error', term: r.error || 'no result' }] });
  const hrHarmfulCount = hrContaminationResults.filter(c => c.error_count > 0).length;

  // Regression check — errors on regression fixtures count as failures
  const regFixtures = fixtures.filter(f => f.category === 'regression');
  const regResults = results.filter(r => r.fixture_category === 'regression' && r.baseline_arm === 'correct_single_kdna');
  const regErrorCount = regResults.filter(r => r.error || !r.result).length;
  const regScores = regResults
    .filter(r => r.result && !r.error)
    .map(r => scoreJudgment(r.result, {}, { arm: 'regression' }));
  // Error fixtures score as 1 (failed) for pass/fail counting
  const regPassed = regScores.filter(s => s.score >= 4).length;
  const regAllPassed = regResults.length > 0 && regErrorCount === 0 && regScores.every(s => s.score >= 4);

  // Compute pass/fail against thresholds
  const t = profile.thresholds;
  const meanImprovement = correctKdnaScore - noKdnaScore;
  const countCriticalErrors = (armName) => results
    .filter(r => r.baseline_arm === armName)
    .reduce((sum, row) => sum + Number(
      row.result?.critical_errors ??
      (row.result?.critical_error === true || row.result?.harmful === true ? 1 : 0)
    ), 0);
  const noKdnaCriticalErrors = countCriticalErrors('no_kdna');
  const correctKdnaCriticalErrors = countCriticalErrors('correct_single_kdna');
  const criticalErrorReduction = noKdnaCriticalErrors > 0
    ? ((noKdnaCriticalErrors - correctKdnaCriticalErrors) / noKdnaCriticalErrors) * 100
    : 0;

  const thresholdResults = {
    fixture_dataset: { pass: fixtureValidation.valid, detail: fixtureValidation.summary },
    baseline_arms: { pass: baselineValidation.valid, detail: baselineValidation.summary },
    blind_improvement: {
      pass: meanImprovement >= t.blind_mean_improvement_min || criticalErrorReduction >= t.critical_error_reduction_pct,
      detail: {
        mean_improvement: Math.round(meanImprovement * 100) / 100,
        mean_threshold: t.blind_mean_improvement_min,
        critical_error_reduction_pct: Math.round(criticalErrorReduction * 100) / 100,
        critical_error_reduction_threshold_pct: t.critical_error_reduction_pct,
        no_kdna_critical_errors: noKdnaCriticalErrors,
        correct_kdna_critical_errors: correctKdnaCriticalErrors,
        rule: 'mean improvement OR critical error reduction',
      },
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
      pass: !t.high_risk_harm_zero || (hrHarmfulCount === 0 && hrErrorCount === 0),
      detail: { harmful_count: hrHarmfulCount, errors: hrErrorCount, total: hrResults.length },
    },
    regression: {
      pass: !t.regression_pass_required || (regAllPassed && regErrorCount === 0),
      detail: { passed: regPassed, errors: regErrorCount, total: regResults.length, all_passed: regAllPassed },
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
    dataset_fingerprint: fingerprintFixtureDataset(fixtures, 'asset-assay'),
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
      runtime: opts.runtime || 'kdna-eval 0.3.2',
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
