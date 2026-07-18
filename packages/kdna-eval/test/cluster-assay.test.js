const { describe, it } = require('node:test');
const assert = require('node:assert');
const BLOCKED_CLUSTER_PLAN = require('../../../conformance/ecosystem-profile-0.9/golden/cluster-blocked-plan.json');
const {
  CLUSTER_COMPARISON_ARMS,
  CLUSTER_GATES,
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
} = require('../src/cluster-assay');

const CANONICAL_MANIFEST = {
  format: 'kdna-cluster',
  format_version: '0.9.0',
  cluster_id: '@aikdna/launch-decision',
  name: 'Launch Decision',
  version: '0.1.0',
  description: 'Coordinates deploy-risk and API-design judgments.',
  type: 'vertical',
  status: 'draft',
  domains: [
    {
      id: '@aikdna/dev-change-risk',
      version: '^0.1.0',
      role: 'primary-candidate',
      required: true,
      load_condition: 'Task involves a deploy decision.',
    },
    {
      id: '@aikdna/dev-api-design',
      version: '^0.1.0',
      role: 'advisor',
      required: false,
      load_condition: 'Task introduces new API.',
      contribution_hypothesis_template: 'API design dimension beyond deploy risk.',
    },
  ],
  composition: {
    strategy: 'signal_based',
    max_active_domains: 3,
    conflict_policy: 'surface',
    primary_selection: 'exactly_one',
    advisor_selection: 'contribution_hypothesis_required',
  },
  budget: { profile: 'interactive', max_tokens: 800, max_assets: 3 },
};

function passingClusterOptions() {
  const fixtures = [
    createClusterFixture({
      task: 'Bound Cluster evidence?',
      expectedPrimary: '@aikdna/dev-change-risk',
      expectedAdvisors: ['@aikdna/dev-api-design'],
      expectedRejected: ['@aikdna/irrelevant'],
      expectedConflicts: 1,
    }),
  ];
  const plan = {
    applicability: { decision: 'applies' },
    selection: {
      primary: { asset_id: '@aikdna/dev-change-risk', selection_reason: 'only primary' },
      advisors: [
        {
          asset_id: '@aikdna/dev-api-design',
          contribution_hypothesis: 'API design review for PATCH semantics',
        },
      ],
      rejected: [{ asset_id: '@aikdna/irrelevant', rejection_reason: 'no task match' }],
    },
    conflicts: [{ conflict_id: 'conflict-1' }],
    budget: { profile: 'interactive', max_tokens: 800, max_assets: 3, assets_consumed: 2 },
  };
  const comparisonArms = CLUSTER_COMPARISON_ARMS.map((arm) => ({
    arm,
    fixture_ids: fixtures.map((fixture) => fixture.fixture_id),
    mean_score: arm === 'bounded_compose' ? 4 : arm === 'primary_only' ? 3 : 3.2,
    result_count: fixtures.length,
    critical_errors: 0,
  }));
  const assetsLoaded = [
    {
      asset_id: '@aikdna/dev-change-risk',
      role: 'primary',
      digest_verified: true,
      authorization: 'public',
    },
    {
      asset_id: '@aikdna/dev-api-design',
      role: 'advisor',
      digest_verified: true,
      authorization: 'public',
    },
  ];
  return {
    manifest: CANONICAL_MANIFEST,
    plan,
    executionCost: { tokens_used: 500, model_calls: 1 },
    comparisonArms,
    fixtures,
    assetsLoaded,
  };
}

// ── Fixtures ──────────────────────────────────────────────────────────

it('creates cluster fixture with required fields', () => {
  const f = createClusterFixture({
    task: 'Deploy to production?',
    taskFamily: 'deploy',
    category: 'target',
    expectedPrimary: '@aikdna/dev-change-risk',
  });
  assert.ok(f.fixture_id.startsWith('cfix_'));
  assert.ok(f.task_hash.startsWith('sha256:'));
  assert.strictEqual(f.category, 'target');
});

it('createClusterFixture requires explicit structural evidence', () => {
  assert.throws(() => createClusterFixture(), /options object/);
  assert.throws(
    () => createClusterFixture({ task: '', expectedPrimary: '@aikdna/primary' }),
    /task must be a non-empty string/,
  );
  assert.throws(
    () => createClusterFixture({ task: 'task', expectedPrimary: '' }),
    /expectedPrimary must be a non-empty string/,
  );
  assert.throws(
    () =>
      createClusterFixture({
        task: 'task',
        expectedPrimary: '@aikdna/primary',
        expectedConflicts: -1,
      }),
    /expectedConflicts must be a non-negative integer/,
  );
});

// ── Gates ─────────────────────────────────────────────────────────────

it('structural gate passes for valid plan', () => {
  const plan = {
    applicability: { decision: 'applies' },
    selection: {
      primary: { asset_id: '@aikdna/dev-change-risk', weight: 1 },
      advisors: [
        {
          asset_id: '@aikdna/dev-api-design',
          contribution_hypothesis: 'API design review — PATCH semantics validation',
        },
      ],
      rejected: [{ asset_id: '@aikdna/irrelevant', rejection_reason: 'no match' }],
    },
    conflicts: [],
  };
  const g = structuralGate(plan);
  assert.strictEqual(g.pass, true);
  assert.strictEqual(g.score, 1.0);
});

it('structural gate fails without primary', () => {
  const g = structuralGate({ applicability: { decision: 'applies' }, selection: { advisors: [] } });
  assert.strictEqual(g.pass, false);
});

it('structural gate fails blocked applicability', () => {
  const g = structuralGate(BLOCKED_CLUSTER_PLAN);
  assert.strictEqual(g.pass, false);
  assert.strictEqual(g.details.status, 'blocked');
});

it('behavioral gate returns not_run without data', () => {
  const g = behavioralGate(null, null);
  assert.strictEqual(g.pass, null);
  assert.strictEqual(g.details.status, 'not_run');
});

it('behavioral gate passes with sufficient improvement', () => {
  const g = behavioralGate({ mean_score: 4.2 }, { mean_score: 3.0 });
  assert.strictEqual(g.pass, true);
  assert.ok(g.details.delta >= 0.3);
});

it('behavioral gate fails with insufficient improvement', () => {
  const g = behavioralGate({ mean_score: 3.1 }, { mean_score: 3.0 });
  assert.strictEqual(g.pass, false);
});

it('behavioral gate rejects coercible and hostile comparison evidence', () => {
  const cases = [
    [{ mean_score: '4' }, { mean_score: '3' }],
    [{ mean_score: 4 }, { mean_score: Number.NaN }],
    [42, { mean_score: 3 }],
  ];
  const accessor = {};
  Object.defineProperty(accessor, 'mean_score', { enumerable: true, get() { throw new Error('no'); } });
  cases.push([accessor, { mean_score: 3 }]);

  for (const [cluster, primary] of cases) {
    let result;
    assert.doesNotThrow(() => { result = behavioralGate(cluster, primary); });
    assert.strictEqual(result.pass, false);
    assert.strictEqual(result.details.status, 'invalid_evidence');
  }
});

it('economics gate passes within budget', () => {
  const { plan } = passingClusterOptions();
  const g = economicsGate(plan, { tokens_used: 400, model_calls: 1 });
  assert.strictEqual(g.pass, true);
});

it('economics gate fails over budget', () => {
  const { plan } = passingClusterOptions();
  const g = economicsGate(plan, { tokens_used: 1200, model_calls: 1 });
  assert.strictEqual(g.pass, false);
});

it('standalone economics gate fails closed without explicit evidence', () => {
  assert.strictEqual(economicsGate().pass, false);
  assert.strictEqual(economicsGate({}, {}).pass, false);
  assert.strictEqual(
    economicsGate(BLOCKED_CLUSTER_PLAN, { tokens_used: 0, model_calls: 0 }).pass,
    false,
  );
});

it('trust gate passes with verified assets', () => {
  const assets = [
    { asset_id: 'a', role: 'primary', digest_verified: true, authorization: 'public' },
    { asset_id: 'b', role: 'advisor', digest_verified: true, authorization: 'public' },
  ];
  const g = trustGate(assets);
  assert.strictEqual(g.pass, true);
});

it('trust gate fails with unverified primary', () => {
  const assets = [
    { asset_id: 'a', role: 'primary', digest_verified: false, authorization: 'public' },
  ];
  const g = trustGate(assets);
  assert.strictEqual(g.pass, false);
});

it('trust gate is not_run when observed load evidence is absent', () => {
  const g = trustGate(null);
  assert.strictEqual(g.pass, null);
  assert.strictEqual(g.details.status, 'not_run');
});

it('trust gate fails when execution observed zero loaded assets', () => {
  const g = trustGate([]);
  assert.strictEqual(g.pass, false);
});

it('product gate passes with complete manifest', () => {
  const g = productGate({}, CANONICAL_MANIFEST);
  assert.strictEqual(g.pass, true);
});

it('product gate fails with TODO description', () => {
  const m = JSON.parse(JSON.stringify(CANONICAL_MANIFEST));
  m.description = '[TODO: fill in]';
  const g = productGate({}, m);
  assert.strictEqual(g.pass, false);
  assert.ok(g.issues.length > 0);
});

it('product gate rejects malformed and hostile manifest fields without throwing', () => {
  const cases = [
    { ...CANONICAL_MANIFEST, composition: { strategy: 42 } },
    { ...CANONICAL_MANIFEST, domains: [{ load_condition: 42 }, { load_condition: 'valid' }] },
    'not-a-manifest',
  ];
  const accessor = {};
  Object.defineProperty(accessor, 'description', { enumerable: true, get() { throw new Error('no'); } });
  cases.push(accessor);

  for (const manifest of cases) {
    let result;
    assert.doesNotThrow(() => { result = productGate({}, manifest); });
    assert.strictEqual(result.pass, false);
    assert.strictEqual(result.details.status, 'invalid_evidence');
  }
  assert.strictEqual(productGate('not-a-plan', CANONICAL_MANIFEST).pass, false);
});

// ── Full Assay ────────────────────────────────────────────────────────

it('runs full cluster assay with valid plan', () => {
  const plan = {
    applicability: { decision: 'applies' },
    selection: {
      primary: { asset_id: '@aikdna/dev-change-risk', weight: 1, selection_reason: 'only primary' },
      advisors: [
        {
          asset_id: '@aikdna/dev-api-design',
          contribution_hypothesis: 'API design review for PATCH semantics',
          accepted: true,
        },
      ],
      rejected: [{ asset_id: '@aikdna/irrelevant', rejection_reason: 'no match' }],
    },
    budget: { profile: 'interactive', max_tokens: 800, assets_consumed: 2 },
    cluster_ref: { cluster_id: '@aikdna/test' },
  };
  const result = runClusterAssay({
    manifest: CANONICAL_MANIFEST,
    plan,
    executionCost: { tokens_used: 500 },
    fixtures: [createClusterFixture({ task: 'test', expectedPrimary: '@aikdna/dev-change-risk' })],
  });
  assert.ok(result.verdict);
  assert.ok(result.gates.structural);
  assert.ok(result.gates.economics);
  assert.ok(result.gates.trust);
  assert.ok(result.gates.product);
  assert.strictEqual(result.cluster_id, '@aikdna/launch-decision');
  assert.strictEqual(result.fixture_count, 1);
  assert.strictEqual(result.fixture_validation.valid, true);
  assert.strictEqual(result.verdict.overall, 'fail');
  assert.strictEqual(result.verdict.all_passed, false);
  assert.ok(result.verdict.failed_gates.includes('behavioral'));
  assert.ok(result.verdict.incomplete_gates.includes('trust'));
});

it('passes only with a fully bound plan, fixtures, seven comparison arms, cost, and loaded assets', () => {
  const result = runClusterAssay(passingClusterOptions());
  assert.strictEqual(result.verdict.overall, 'pass');
  assert.strictEqual(result.verdict.all_passed, true);
  assert.deepStrictEqual(result.verdict.failed_evidence, []);
  assert.ok(Object.values(result.evidence_validation).every((validation) => validation.valid));
  assert.ok(result.comparison_arms.every((arm) => arm.status === 'completed'));
});

it('accepts the canonical blocked plan as a valid diagnostic that can never pass', () => {
  const options = passingClusterOptions();
  options.plan = BLOCKED_CLUSTER_PLAN;
  let result;
  assert.doesNotThrow(() => {
    result = runClusterAssay(options);
  });

  assert.strictEqual(result.plan_status, 'blocked');
  assert.deepStrictEqual(result.evidence_validation.plan, {
    valid: true,
    executable: false,
    status: 'blocked',
    decision: 'blocked',
    errors: [],
  });
  assert.strictEqual(result.verdict.overall, 'fail');
  assert.strictEqual(result.verdict.all_passed, false);
  assert.ok(!result.verdict.failed_evidence.includes('cluster_plan'));
  assert.ok(Object.values(result.gates).every((gate) => gate.pass !== true));
  assert.ok(Object.values(result.gates).every((gate) => gate.details.status === 'blocked'));
  assert.ok(result.comparison_arms.every((arm) => arm.status === 'blocked'));
});

it('rejects blocked plans that contain a selection as malformed evidence', () => {
  const options = passingClusterOptions();
  options.plan = {
    ...BLOCKED_CLUSTER_PLAN,
    selection: { primary: { asset_id: 'must-not-execute' }, advisors: [], rejected: [] },
  };
  const result = runClusterAssay(options);
  assert.strictEqual(result.plan_status, 'invalid');
  assert.strictEqual(result.verdict.overall, 'fail');
  assert.ok(result.verdict.failed_evidence.includes('cluster_plan'));
});

it('empty Cluster Assay calls remain compatible fail diagnostics', () => {
  for (const result of [runClusterAssay(), runClusterAssay({})]) {
    assert.strictEqual(result.verdict.overall, 'fail');
    assert.strictEqual(result.verdict.all_passed, false);
    assert.strictEqual(result.plan_status, 'invalid');
  }
});

it('reproduced empty primary and loaded asset IDs can never pass', () => {
  const emptyPrimary = passingClusterOptions();
  emptyPrimary.plan.selection.primary = {};
  const emptyPrimaryReport = runClusterAssay(emptyPrimary);
  assert.strictEqual(emptyPrimaryReport.verdict.overall, 'fail');
  assert.ok(emptyPrimaryReport.verdict.failed_evidence.includes('cluster_plan'));

  const emptyLoadedId = passingClusterOptions();
  emptyLoadedId.assetsLoaded[0] = {
    role: 'primary',
    digest_verified: true,
    authorization: 'public',
  };
  const emptyLoadedReport = runClusterAssay(emptyLoadedId);
  assert.strictEqual(emptyLoadedReport.verdict.overall, 'fail');
  assert.ok(emptyLoadedReport.verdict.failed_evidence.includes('loaded_assets'));
});

it('loaded assets bind exactly to selected primary, advisors, and rejected IDs', () => {
  const cases = [];
  const mismatchedPrimary = passingClusterOptions();
  mismatchedPrimary.assetsLoaded[0].asset_id = '@aikdna/other-primary';
  cases.push(mismatchedPrimary);
  const duplicate = passingClusterOptions();
  duplicate.assetsLoaded[1].asset_id = duplicate.assetsLoaded[0].asset_id;
  cases.push(duplicate);
  const absentPrimary = passingClusterOptions();
  absentPrimary.assetsLoaded = absentPrimary.assetsLoaded.map((asset) => ({
    ...asset,
    role: 'advisor',
  }));
  cases.push(absentPrimary);
  const missingAdvisor = passingClusterOptions();
  missingAdvisor.assetsLoaded = [missingAdvisor.assetsLoaded[0]];
  cases.push(missingAdvisor);
  const rejectedLoaded = passingClusterOptions();
  rejectedLoaded.assetsLoaded.push({
    asset_id: '@aikdna/irrelevant',
    role: 'control',
    digest_verified: true,
    authorization: 'public',
  });
  cases.push(rejectedLoaded);
  const blocked = passingClusterOptions();
  blocked.assetsLoaded[0].authorization = '  blocked  ';
  cases.push(blocked);
  const unknownRole = passingClusterOptions();
  unknownRole.assetsLoaded[1].role = 'observer';
  cases.push(unknownRole);

  for (const options of cases) {
    const report = runClusterAssay(options);
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.ok(report.verdict.failed_evidence.includes('loaded_assets'));
    assert.strictEqual(report.gates.trust.pass, false);
  }
});

it('fixture expectations bind exact selected, rejected, and conflict evidence', () => {
  const mutations = [
    (fixture) => {
      fixture.expected_primary = '@aikdna/other-primary';
    },
    (fixture) => {
      fixture.expected_advisors = [];
    },
    (fixture) => {
      fixture.expected_rejected = [];
    },
    (fixture) => {
      fixture.expected_conflicts = 0;
    },
  ];
  for (const mutate of mutations) {
    const options = passingClusterOptions();
    mutate(options.fixtures[0]);
    const report = runClusterAssay(options);
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.ok(report.verdict.failed_evidence.includes('fixture_expectations'));
    assert.strictEqual(report.gates.structural.pass, false);
  }
  const missingReason = passingClusterOptions();
  delete missingReason.plan.selection.rejected[0].rejection_reason;
  const missingReasonReport = runClusterAssay(missingReason);
  assert.strictEqual(missingReasonReport.verdict.overall, 'fail');
  assert.ok(missingReasonReport.verdict.failed_evidence.includes('cluster_plan'));
});

it('all seven comparison arms must be unique, finite, and bound to the exact fixture set', () => {
  const cases = [];
  const missing = passingClusterOptions();
  missing.comparisonArms.pop();
  cases.push(missing);
  const duplicate = passingClusterOptions();
  duplicate.comparisonArms[6] = { ...duplicate.comparisonArms[0] };
  cases.push(duplicate);
  const unknown = passingClusterOptions();
  unknown.comparisonArms[0].arm = 'unknown';
  cases.push(unknown);
  const unbound = passingClusterOptions();
  unbound.comparisonArms[0].fixture_ids = ['other-fixture'];
  cases.push(unbound);
  const missingCount = passingClusterOptions();
  missingCount.comparisonArms[0].result_count = 0;
  cases.push(missingCount);
  const invalidScore = passingClusterOptions();
  invalidScore.comparisonArms[0].mean_score = Infinity;
  cases.push(invalidScore);

  for (const options of cases) {
    const report = runClusterAssay(options);
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.ok(report.verdict.failed_evidence.includes('comparison_arms'));
    assert.strictEqual(report.gates.behavioral.pass, false);
    assert.ok(
      report.comparison_arms.every(
        (arm) => arm.status === 'invalid' && arm.score === null && arm.fixture_ids.length === 0,
      ),
    );
  }
});

it('missing or malformed economics evidence cannot synthesize zero cost', () => {
  const cases = [];
  const missingCost = passingClusterOptions();
  delete missingCost.executionCost;
  cases.push(missingCost);
  const missingBudget = passingClusterOptions();
  delete missingBudget.plan.budget;
  cases.push(missingBudget);
  const wrongConsumed = passingClusterOptions();
  wrongConsumed.plan.budget.assets_consumed = 1;
  cases.push(wrongConsumed);
  const overAssetBudget = passingClusterOptions();
  overAssetBudget.plan.budget.max_assets = 1;
  cases.push(overAssetBudget);
  const invalidTokens = passingClusterOptions();
  invalidTokens.executionCost.tokens_used = -1;
  cases.push(invalidTokens);
  const invalidCalls = passingClusterOptions();
  invalidCalls.executionCost.model_calls = 0.5;
  cases.push(invalidCalls);

  for (const options of cases) {
    const report = runClusterAssay(options);
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.ok(report.verdict.failed_evidence.includes('economics'));
    assert.strictEqual(report.gates.economics.pass, false);
  }
});

it('explicit observed zero-token cost is preserved', () => {
  const options = passingClusterOptions();
  options.executionCost.tokens_used = 0;
  const report = runClusterAssay(options);
  assert.strictEqual(report.verdict.overall, 'pass');
  assert.strictEqual(report.gates.economics.details.tokens_used, 0);
});

// ── Advisor Relation Ledger ───────────────────────────────────────────

it('creates advisor relation ledger', () => {
  const plan = {
    cluster_ref: { cluster_id: '@aikdna/test' },
    selection: {
      primary: { asset_id: '@aikdna/primary', selection_reason: 'only primary-candidate' },
      advisors: [
        {
          asset_id: '@aikdna/advisor1',
          contribution_hypothesis: 'API design review',
          accepted: true,
        },
      ],
      rejected: [{ asset_id: '@aikdna/rejected1', rejection_reason: 'no match' }],
    },
  };
  const ledger = createAdvisorRelationLedger(plan);
  assert.strictEqual(ledger.summary.primary_count, 1);
  assert.strictEqual(ledger.summary.advisor_count, 1);
  assert.strictEqual(ledger.summary.rejected_count, 1);
  assert.strictEqual(ledger.summary.pending_review_count, 1);
});

it('records advisor decision', () => {
  const d = recordAdvisorDecision('@aikdna/advisor1', 'approved', {
    notes: 'LGTM',
    reviewedBy: 'expert',
  });
  assert.strictEqual(d.decision, 'approved');
  assert.strictEqual(d.contribution_accepted, true);
});

it('recordAdvisorDecision rejects invalid decision', () => {
  assert.throws(() => recordAdvisorDecision('x', 'maybe'), /Invalid decision/);
});

it('ledger with human decisions updates correctly', () => {
  const plan = {
    cluster_ref: { cluster_id: '@aikdna/test' },
    selection: {
      primary: { asset_id: '@aikdna/primary', selection_reason: 'only' },
      advisors: [{ asset_id: '@aikdna/advisor1', contribution_hypothesis: 'test', accepted: true }],
      rejected: [],
    },
  };
  const decisions = [
    recordAdvisorDecision('@aikdna/advisor1', 'approved', { notes: 'Valid contribution' }),
  ];
  const ledger = createAdvisorRelationLedger(plan, decisions);
  assert.strictEqual(ledger.summary.human_reviewed_count, 1);
  assert.strictEqual(ledger.summary.pending_review_count, 0);
});

it('advisor ledger rejects non-string cluster and asset identifiers', () => {
  assert.throws(
    () => createAdvisorRelationLedger({ cluster_ref: { cluster_id: 42 } }),
    /cluster_id must be a non-empty string/,
  );
  assert.throws(
    () => createAdvisorRelationLedger({ selection: { primary: { asset_id: 42 } } }),
    /primary.asset_id must be a non-empty string/,
  );
  assert.throws(
    () => createAdvisorRelationLedger({ selection: { advisors: [{ asset_id: 42 }] } }),
    /advisors\[0\].asset_id must be a non-empty string/,
  );
  assert.throws(() => recordAdvisorDecision(42, 'approved'), /assetId must be a non-empty string/);
});

// ── Constants ─────────────────────────────────────────────────────────

it('CLUSTER_COMPARISON_ARMS has 7 arms', () => {
  assert.strictEqual(CLUSTER_COMPARISON_ARMS.length, 7);
  assert.ok(CLUSTER_COMPARISON_ARMS.includes('primary_only'));
  assert.ok(CLUSTER_COMPARISON_ARMS.includes('adversarial'));
});

it('CLUSTER_GATES has 5 gates', () => {
  assert.strictEqual(CLUSTER_GATES.length, 5);
  assert.ok(CLUSTER_GATES.includes('structural'));
  assert.ok(CLUSTER_GATES.includes('behavioral'));
});

// ── Replay ────────────────────────────────────────────────────────────

it('cluster replay runs all 5 suites', () => {
  const { createReplayEngine } = require('../src/replay');
  const engine = createReplayEngine();
  const fixtures = [
    createClusterFixture({ task: 'task A', expectedPrimary: '@aikdna/primary' }),
    createClusterFixture({ task: 'task B', expectedPrimary: '@aikdna/primary' }),
  ];
  const results = runClusterReplay(engine, fixtures, { clusterId: '@aikdna/test' });
  assert.strictEqual(Object.keys(results).length, 5);
  assert.ok(results.repair);
});

it('cluster replay rejects invalid evidence before invoking the engine', () => {
  let calls = 0;
  const engine = {
    replayRun: () => {
      calls++;
      return { results: [] };
    },
  };
  const fixture = createClusterFixture({ task: 'task', expectedPrimary: '@aikdna/primary' });
  for (const fixtures of [
    [],
    [{ ...fixture, task: '' }],
    [fixture, { ...fixture, task: 'duplicate' }],
    [fixture, { ...fixture, fixture_id: 'different-id' }],
  ]) {
    const results = runClusterReplay(engine, fixtures);
    assert.strictEqual(calls, 0);
    assert.ok(Object.values(results).every((result) => result.status === 'failed'));
  }
});

it('cluster replay requires complete explicit boolean pass evidence', () => {
  const fixtures = [
    createClusterFixture({ task: 'task A', expectedPrimary: '@aikdna/primary' }),
    createClusterFixture({ task: 'task B', expectedPrimary: '@aikdna/primary' }),
  ];
  const incompleteEngine = {
    replayRun: () => ({
      results: fixtures.map((fixture) => ({ id: fixture.fixture_id, score: 100 })),
    }),
  };
  const incomplete = runClusterReplay(incompleteEngine, fixtures);
  assert.ok(Object.values(incomplete).every((result) => result.status === 'failed'));

  const explicitEngine = {
    replayRun: () => ({
      results: fixtures.map((fixture, index) => ({ id: fixture.fixture_id, pass: index === 0 })),
    }),
  };
  const explicit = runClusterReplay(explicitEngine, fixtures);
  assert.ok(Object.values(explicit).every((result) => result.status === 'completed'));
  assert.ok(Object.values(explicit).every((result) => result.passed === 1 && result.failed === 1));
});

it('official replay engine cannot synthesize a cluster pass without observed pass evidence', () => {
  const { createReplayEngine } = require('../src/replay');
  const fixture = createClusterFixture({ task: 'task', expectedPrimary: '@aikdna/primary' });
  const results = runClusterReplay(createReplayEngine(), [fixture]);
  assert.ok(Object.values(results).every((result) => result.status === 'failed'));
  assert.ok(Object.values(results).every((result) => result.passed === undefined));
});

it('cluster assay cannot pass with zero, malformed, or duplicate fixtures', () => {
  const plan = {
    applicability: { decision: 'applies' },
    selection: { primary: { asset_id: '@aikdna/primary' }, advisors: [], rejected: [] },
    budget: { max_tokens: 800, assets_consumed: 1 },
  };
  const options = {
    manifest: CANONICAL_MANIFEST,
    plan,
    executionCost: { tokens_used: 400 },
    comparisonArms: [
      { arm: 'primary_only', mean_score: 3 },
      { arm: 'bounded_compose', mean_score: 4 },
    ],
    assetsLoaded: [
      {
        asset_id: '@aikdna/primary',
        role: 'primary',
        digest_verified: true,
        authorization: 'public',
      },
    ],
  };
  const fixture = createClusterFixture({ task: 'task', expectedPrimary: '@aikdna/primary' });
  for (const fixtures of [
    [],
    [{ ...fixture, expected_primary: '' }],
    [fixture, { ...fixture, task: 'duplicate' }],
    [fixture, { ...fixture, fixture_id: 'different-id' }],
  ]) {
    const report = runClusterAssay({ ...options, fixtures });
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.strictEqual(report.verdict.all_passed, false);
    assert.ok(report.verdict.failed_evidence.includes('fixture_dataset'));
  }
});

it('cluster assay rejects malformed manifest fields before producing a typed report', () => {
  const fixture = createClusterFixture({
    task: 'manifest task',
    expectedPrimary: '@aikdna/primary',
  });
  assert.throws(
    () => runClusterAssay({ manifest: { cluster_id: 42 }, fixtures: [fixture] }),
    /manifest.cluster_id must be a non-empty string/,
  );
  assert.throws(
    () => runClusterAssay({ manifest: { version: 7 }, fixtures: [fixture] }),
    /manifest.version must be a non-empty string/,
  );
  assert.throws(
    () => runClusterAssay({ manifest: { description: 42 }, fixtures: [fixture] }),
    /manifest.description must be a string/,
  );
  assert.throws(
    () => runClusterAssay({ manifest: { domains: [{ load_condition: 42 }] }, fixtures: [fixture] }),
    /load_condition must be a string/,
  );
  assert.throws(
    () => runClusterAssay({ manifest: { composition: { strategy: 42 } }, fixtures: [fixture] }),
    /composition.strategy must be a non-empty string/,
  );
  const compatible = runClusterAssay({ fixtures: [fixture] });
  assert.strictEqual(compatible.cluster_id, 'unknown');
  assert.strictEqual(compatible.cluster_version, '0.1.0');
});

it('cluster fixtures reject non-canonical evidence before replay engine invocation', () => {
  const base = createClusterFixture({
    task: 'canonical cluster task',
    expectedPrimary: '@aikdna/primary',
  });
  const cycle = {};
  cycle.self = cycle;
  const invalidFixtures = [
    { ...base, evidence: cycle },
    { ...base, evidence: { value: 1n } },
    { ...base, evidence: { value: undefined } },
    { ...base, evidence: { value: () => true } },
    { ...base, evidence: { value: new Date() } },
  ];
  for (const fixture of invalidFixtures) {
    let calls = 0;
    const replay = runClusterReplay(
      {
        replayRun: () => {
          calls++;
          return { results: [] };
        },
      },
      [fixture],
    );
    assert.strictEqual(calls, 0);
    assert.ok(Object.values(replay).every((result) => result.status === 'failed'));
    const report = runClusterAssay({ manifest: CANONICAL_MANIFEST, fixtures: [fixture] });
    assert.strictEqual(report.verdict.overall, 'fail');
    assert.strictEqual(report.fixture_validation.valid, false);
  }
});

it('cluster dataset fingerprint is key-order stable and content-sensitive', () => {
  const created = createClusterFixture({
    task: 'cluster fingerprint task',
    taskFamily: 'release',
    category: 'target',
    expectedPrimary: '@aikdna/primary',
    expectedAdvisors: ['@aikdna/advisor'],
    expectedRejected: ['@aikdna/rejected'],
    expectedConflicts: 1,
  });
  const base = { ...created, evidence: { alpha: 1, beta: 2 } };
  const reordered = {
    evidence: { beta: 2, alpha: 1 },
    category: base.category,
    expected_conflicts: base.expected_conflicts,
    expected_rejected: base.expected_rejected,
    expected_advisors: base.expected_advisors,
    expected_primary: base.expected_primary,
    task_family: base.task_family,
    task_hash: base.task_hash,
    task: base.task,
    fixture_id: base.fixture_id,
    created_at: 'different volatile timestamp',
  };
  const run = (fixtures) => runClusterAssay({ manifest: CANONICAL_MANIFEST, fixtures });
  const original = run([base]);
  const sameSemantics = run([reordered]);
  const changedTask = run([{ ...base, task: 'mutated cluster fingerprint task' }]);
  const changedExpected = run([{ ...base, expected_primary: '@aikdna/other-primary' }]);
  assert.strictEqual(original.dataset_fingerprint, sameSemantics.dataset_fingerprint);
  assert.notStrictEqual(original.dataset_fingerprint, changedTask.dataset_fingerprint);
  assert.notStrictEqual(original.dataset_fingerprint, changedExpected.dataset_fingerprint);
});

console.log('cluster-assay.test.js: all tests complete');
