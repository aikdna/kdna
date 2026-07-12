const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  FIXTURE_CATEGORIES,
  BASELINE_ARMS,
  CLASSIFICATION_LEVELS,
  createAssayProfile,
  validateFixtureSet,
  createFixture,
  createBaselineArm,
  createAllBaselineArms,
  scoreJudgment,
  runAssay,
  detectContamination,
  evaluateNonApplicable,
  classifyAsset,
  generateEvidenceClaim,
} = require('../src/assay');

// ── Profile ───────────────────────────────────────────────────────────

it('creates assay profile with defaults', () => {
  const profile = createAssayProfile({ assetId: 'test.kdna', assetVersion: '0.1.0' });
  assert.strictEqual(profile.profile_version, '0.9.0');
  assert.strictEqual(profile.asset_id, 'test.kdna');
  assert.strictEqual(profile.thresholds.positive_target_min_count, 8);
  assert.strictEqual(profile.thresholds.blind_mean_improvement_min, 0.5);
  assert.strictEqual(profile.thresholds.holdout_required, true);
});

it('creates assay profile with custom thresholds', () => {
  const profile = createAssayProfile({
    assetId: 'custom.kdna',
    thresholds: { positive_target_min_count: 5, blind_mean_improvement_min: 1.0 },
  });
  assert.strictEqual(profile.thresholds.positive_target_min_count, 5);
  assert.strictEqual(profile.thresholds.blind_mean_improvement_min, 1.0);
  // Unspecified thresholds retain defaults
  assert.strictEqual(profile.thresholds.non_applicable_accuracy_min, 0.90);
});

// ── Fixture Categories ────────────────────────────────────────────────

it('FIXTURE_CATEGORIES includes all 6 required categories', () => {
  const required = ['positive_target', 'non_applicable', 'adjacent_ambiguous', 'high_risk_failure', 'regression', 'holdout'];
  for (const cat of required) {
    assert.ok(FIXTURE_CATEGORIES.includes(cat), `Missing category: ${cat}`);
  }
});

it('BASELINE_ARMS includes all 4 required arms', () => {
  const required = ['no_kdna', 'best_ordinary_prompt', 'correct_single_kdna', 'wrong_or_adjacent_kdna'];
  for (const arm of required) {
    assert.ok(BASELINE_ARMS.includes(arm), `Missing arm: ${arm}`);
  }
});

it('CLASSIFICATION_LEVELS includes all 6 levels', () => {
  assert.ok(CLASSIFICATION_LEVELS.includes('conformance_asset'));
  assert.ok(CLASSIFICATION_LEVELS.includes('production_asset'));
  assert.strictEqual(CLASSIFICATION_LEVELS.length, 6);
});

// ── Create Fixture ────────────────────────────────────────────────────

it('creates a valid fixture', () => {
  const f = createFixture({ category: 'positive_target', task: 'Should we deploy this hotfix?' });
  assert.strictEqual(f.category, 'positive_target');
  assert.ok(f.fixture_id.startsWith('fixture_'));
  assert.ok(f.task_hash.startsWith('sha256:'));
});

it('createFixture rejects unknown category', () => {
  assert.throws(() => createFixture({ category: 'invalid_category', task: 'test' }), /Unknown fixture category/);
});

it('createFixture generates unique fixture_ids', () => {
  const f1 = createFixture({ category: 'positive_target', task: 'task A' });
  const f2 = createFixture({ category: 'positive_target', task: 'task B' });
  assert.notStrictEqual(f1.fixture_id, f2.fixture_id);
});

// ── Validate Fixture Set ──────────────────────────────────────────────

it('validates a complete fixture set', () => {
  const fixtures = [
    ...Array.from({ length: 8 }, (_, i) => createFixture({ category: 'positive_target', task: `task ${i}` })),
    ...Array.from({ length: 4 }, (_, i) => createFixture({ category: 'non_applicable', task: `not-in-scope ${i}` })),
    ...Array.from({ length: 4 }, (_, i) => createFixture({ category: 'adjacent_ambiguous', task: `borderline ${i}` })),
    ...Array.from({ length: 2 }, (_, i) => createFixture({ category: 'high_risk_failure', task: `dangerous ${i}` })),
    ...Array.from({ length: 2 }, (_, i) => createFixture({ category: 'regression', task: `regression ${i}` })),
    ...Array.from({ length: 1 }, (_, i) => createFixture({ category: 'holdout', task: `holdout ${i}` })),
  ];
  const profile = createAssayProfile({ assetId: 'test.kdna' });
  const result = validateFixtureSet(fixtures, profile);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.summary.by_category.positive_target, 8);
  assert.strictEqual(result.summary.by_category.non_applicable, 4);
  assert.strictEqual(result.summary.by_category.holdout, 1);
});

it('rejects insufficient fixture counts', () => {
  const fixtures = [
    createFixture({ category: 'positive_target', task: 'only one task' }),
  ];
  const profile = createAssayProfile({ assetId: 'test.kdna' });
  const result = validateFixtureSet(fixtures, profile);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.length > 0);
});

it('rejects missing holdout when required', () => {
  const fixtures = [
    ...Array.from({ length: 8 }, (_, i) => createFixture({ category: 'positive_target', task: `task ${i}` })),
    ...Array.from({ length: 4 }, (_, i) => createFixture({ category: 'non_applicable', task: `na ${i}` })),
    ...Array.from({ length: 4 }, (_, i) => createFixture({ category: 'adjacent_ambiguous', task: `adj ${i}` })),
    ...Array.from({ length: 2 }, (_, i) => createFixture({ category: 'high_risk_failure', task: `hr ${i}` })),
    ...Array.from({ length: 2 }, (_, i) => createFixture({ category: 'regression', task: `reg ${i}` })),
  ];
  const profile = createAssayProfile({ assetId: 'test.kdna' });
  const result = validateFixtureSet(fixtures, profile);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('holdout')));
});

// ── Baseline Arms ─────────────────────────────────────────────────────

it('creates all 4 baseline arms', () => {
  const arms = createAllBaselineArms();
  assert.strictEqual(arms.length, 4);
  const armNames = arms.map(a => a.arm);
  assert.ok(armNames.includes('no_kdna'));
  assert.ok(armNames.includes('best_ordinary_prompt'));
  assert.ok(armNames.includes('correct_single_kdna'));
  assert.ok(armNames.includes('wrong_or_adjacent_kdna'));
});

it('createBaselineArm rejects unknown arm', () => {
  assert.throws(() => createBaselineArm('invalid_arm'), /Unknown baseline arm/);
});

it('createBaselineArm returns valid arm definition', () => {
  const arm = createBaselineArm('no_kdna', { budget: 'interactive' });
  assert.strictEqual(arm.arm, 'no_kdna');
  assert.ok(arm.description.length > 0);
  assert.strictEqual(arm.config.budget, 'interactive');
});

// ── Score Judgment ────────────────────────────────────────────────────

it('scores judgment with correct classification', () => {
  const result = {
    answer: 'Deploy now with monitoring',
    reasoning: ['auth change is high risk per AX-risk-001', 'rollback plan needed per AX-risk-002'],
    sources: [{ axiom_id: 'AX-risk-001', transfer_level: 'operationalized' }],
    alternatives: [{ option: 'Wait until Monday', rejected_because: 'bug affects users' }],
    confidence: 'medium',
  };
  const expected = { answer: 'Deploy now' };
  const score = scoreJudgment(result, expected);
  assert.ok(score.score >= 3, `score ${score.score} should be at least adequate`);
  assert.ok(score.dimensions.classification >= 4);
  assert.ok(score.notes.length > 0);
});

it('scores poor judgment (missing answer)', () => {
  const score = scoreJudgment({}, { answer: 'expected' });
  assert.strictEqual(score.score, 1);
  assert.strictEqual(score.dimensions.classification, 1);
});

it('uses preregistered blind score when an observation provides score_5pt', () => {
  const score = scoreJudgment({ answer: 'Observed answer', score_5pt: 4.7 }, {});
  assert.strictEqual(score.score, 4.7);
  assert.ok(score.notes.some(note => note.includes('observed blind score')));
});

it('behavioral gate accepts a 30% critical-error reduction when mean scores tie', async () => {
  const profile = createAssayProfile({
    assetId: 'critical-error-test',
    thresholds: {
      positive_target_min_count: 0,
      non_applicable_min_count: 0,
      adjacent_ambiguous_min_count: 0,
      high_risk_failure_min_count: 0,
      regression_min_count: 0,
      holdout_required: false,
      non_applicable_accuracy_min: 0,
      regression_pass_required: false,
    },
  });
  const fixtures = [createFixture({ category: 'positive_target', task: 'test', expected: {} })];
  const assay = await runAssay({
    profile,
    fixtures,
    runner: async (_fixture, arm) => ({
      answer: 'Same mean quality',
      score_5pt: 3,
      critical_errors: arm.arm === 'no_kdna' ? 2 : 0,
    }),
  });
  assert.strictEqual(assay.threshold_results.blind_improvement.pass, true);
  assert.strictEqual(assay.threshold_results.blind_improvement.detail.mean_improvement, 0);
  assert.strictEqual(assay.threshold_results.blind_improvement.detail.critical_error_reduction_pct, 100);
});

it('scores judgment with 5 operationalized axioms', () => {
  const result = {
    answer: 'Deploy after pre-check',
    reasoning: ['step1', 'step2', 'step3', 'step4', 'step5'],
    sources: Array.from({ length: 5 }, (_, i) => ({ axiom_id: `AX-00${i}`, transfer_level: 'operationalized' })),
    alternatives: [{ option: 'Delay' }, { option: 'Delegate' }],
    confidence: 'high',
    self_checks: [{ check_id: 'SC-1', passed: true }, { check_id: 'SC-2', passed: true }],
  };
  const expected = { answer: 'Deploy' };
  const score = scoreJudgment(result, expected);
  assert.ok(score.score >= 4, `score ${score.score} should be good or excellent`);
  assert.strictEqual(score.dimensions.risk_awareness, 5);
});

// ── Contamination Detection ───────────────────────────────────────────

it('detects banned terms in result', () => {
  const result = { answer: 'This change is risky but should be fine.', reasoning: 'Probably ok to deploy.' };
  const asset = { banned_terms: ['risky', 'should be fine', 'probably ok', 'YOLO'] };
  const report = detectContamination(result, asset);
  assert.strictEqual(report.contaminated, true);
  assert.ok(report.issues.length >= 2);
  assert.ok(report.issues.some(i => i.term === 'risky'));
});

it('detects risk triggers', () => {
  const result = { answer: 'This is always safe and guaranteed to work.' };
  const report = detectContamination(result, {});
  assert.strictEqual(report.contaminated, true);
  assert.ok(report.issues.some(i => i.type === 'risk_triggered'));
});

it('clean result has no contamination', () => {
  const result = { answer: 'Deploy with rollback plan and monitoring.', reasoning: 'Auth changes have elevated risk.' };
  const asset = { banned_terms: ['YOLO', 'should be fine'] };
  const report = detectContamination(result, asset);
  assert.strictEqual(report.contaminated, false);
  assert.strictEqual(report.issues.length, 0);
});

it('detects boundary crossing', () => {
  const result = { answer: 'This is purely architectural discussion without a concrete deploy, so no production risk.' };
  const asset = { does_not_apply_when: ['purely architectural discussion without a concrete deploy'] };
  const report = detectContamination(result, asset);
  assert.ok(report.contaminated);
  assert.ok(report.issues.some(i => i.type === 'boundary_crossed'));
});

// ── Non-Applicable Behavior ───────────────────────────────────────────

it('evaluates correct non-applicable skip', () => {
  const result = { answer: 'This task does not apply. The asset covers deploy decisions, not architecture discussions.' };
  const evaluation = evaluateNonApplicable(result, { should_skip: true });
  assert.strictEqual(evaluation.correct, true);
  assert.strictEqual(evaluation.skipped, true);
});

it('evaluates failure to skip on non-applicable task', () => {
  const result = { answer: 'Proceed with the launch. Risk is low.' };
  const evaluation = evaluateNonApplicable(result, { should_skip: true });
  assert.strictEqual(evaluation.correct, false);
  assert.strictEqual(evaluation.skipped, false);
  assert.ok(evaluation.reason.includes('attempted to judge'));
});

it('evaluates skip by decision field', () => {
  const result = { decision: 'does_not_apply', answer: '' };
  const evaluation = evaluateNonApplicable(result);
  assert.strictEqual(evaluation.correct, true);
});

it('evaluates explicit skip decision', () => {
  const result = { answer: 'does not apply', decision: 'skip' };
  const evaluation = evaluateNonApplicable(result);
  assert.strictEqual(evaluation.correct, true);
  assert.strictEqual(evaluation.skipped, true);
});

// ── Asset Classification ──────────────────────────────────────────────

it('classifies conformance_only asset', () => {
  const classification = classifyAsset({ format_valid: true, loads: true });
  assert.ok(classification.levels.includes('conformance_asset'));
  assert.strictEqual(classification.highest_level, 'conformance_asset');
  assert.strictEqual(classification.explicitly_not.load_ready_only, true);
  assert.strictEqual(classification.explicitly_not.not_behavior_evaluated, true);
});

it('classifies behavior_evaluated asset', () => {
  const classification = classifyAsset({
    format_valid: true,
    loads: true,
    assay_passed: true,
    comparison_arms_run: 4,
  });
  assert.ok(classification.levels.includes('behavior_evaluated_asset'));
  assert.strictEqual(classification.highest_level, 'behavior_evaluated_asset');
  assert.strictEqual(classification.explicitly_not.not_field_validated, true);
});

it('classifies production asset', () => {
  const classification = classifyAsset({
    format_valid: true,
    loads: true,
    assay_passed: true,
    comparison_arms_run: 4,
    field_users: 15,
    field_tasks: 25,
    all_gates_passed: true,
  });
  assert.ok(classification.levels.includes('production_asset'));
  assert.strictEqual(classification.highest_level, 'production_asset');
  assert.strictEqual(classification.explicitly_not.not_production, false);
});

it('does not inflate classification', () => {
  const classification = classifyAsset({ format_valid: true, loads: true });
  assert.ok(!classification.levels.includes('production_asset'));
  assert.ok(!classification.levels.includes('behavior_evaluated_asset'));
});

// ── Evidence Claim Generator ──────────────────────────────────────────

it('generates evidence claim from assay results', () => {
  const assayOutput = {
    profile: { asset_id: 'test.kdna', asset_version: '0.1.0', asset_digest: 'sha256:abc123' },
    fixture_validation: { valid: true, summary: { total: 21 } },
    results_by_arm: {
      no_kdna: { mean_score: 2.5 },
      correct_single_kdna: { mean_score: 4.2 },
    },
    threshold_results: {
      fixture_dataset: { pass: true },
      blind_improvement: { pass: true, detail: { mean_improvement: 1.7 } },
      non_applicable_accuracy: { pass: true, detail: { accuracy: 0.95 } },
      contamination: { pass: true, detail: { contamination_rate: 0.02 } },
      high_risk_harm: { pass: true },
      regression: { pass: true },
    },
    overall_verdict: 'pass',
    failed_thresholds: [],
    result_count: 84,
    dataset_fingerprint: 'sha256:test123',
  };
  const claim = generateEvidenceClaim(assayOutput, { taskFamily: 'deploy_risk', model: 'claude-sonnet-5' });
  assert.strictEqual(claim.evidence_version, '0.9.0');
  assert.strictEqual(claim.claim_type, 'comparison_assay');
  assert.strictEqual(claim.classification.level, 'behavior_evaluated');
  assert.strictEqual(claim.marginal_value.evidence_produced, true);
  assert.ok(claim.claim_id.startsWith('claim_'));
});

it('generates evidence claim for failed assay', () => {
  const assayOutput = {
    profile: { asset_id: 'test.kdna', asset_version: '0.1.0' },
    fixture_validation: { valid: true, summary: { total: 21 } },
    results_by_arm: { no_kdna: { mean_score: 2.0 }, correct_single_kdna: { mean_score: 2.1 } },
    threshold_results: {
      fixture_dataset: { pass: true },
      blind_improvement: { pass: false, detail: { mean_improvement: 0.1 } },
      non_applicable_accuracy: { pass: true },
      contamination: { pass: true },
      high_risk_harm: { pass: true },
      regression: { pass: true },
    },
    overall_verdict: 'fail',
    failed_thresholds: ['blind_improvement'],
    result_count: 84,
    dataset_fingerprint: 'sha256:test123',
  };
  const claim = generateEvidenceClaim(assayOutput);
  assert.strictEqual(claim.classification.level, 'usage_evidence');
  assert.strictEqual(claim.classification.not_behavior_evaluated, true);
  assert.strictEqual(claim.marginal_value.threshold_met, false);
});

// ── CJS exports ───────────────────────────────────────────────────────

it('assay module exports via CJS', () => {
  const assay = require('../src/assay');
  assert.ok(assay.createAssayProfile);
  assert.ok(assay.validateFixtureSet);
  assert.ok(assay.createFixture);
  assert.ok(assay.scoreJudgment);
  assert.ok(assay.detectContamination);
  assert.ok(assay.evaluateNonApplicable);
  assert.ok(assay.runAssay);
  assert.ok(assay.classifyAsset);
  assert.ok(assay.generateEvidenceClaim);
  assert.ok(assay.FIXTURE_CATEGORIES);
  assert.ok(assay.BASELINE_ARMS);
  assert.ok(assay.CLASSIFICATION_LEVELS);
});

console.log('assay.test.js: all tests complete');
