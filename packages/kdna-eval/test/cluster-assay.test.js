const { describe, it } = require('node:test');
const assert = require('node:assert');
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
  format: 'kdna-cluster', format_version: '0.9.0',
  cluster_id: '@aikdna/launch-decision', name: 'Launch Decision', version: '0.1.0',
  description: 'Coordinates deploy-risk and API-design judgments.',
  type: 'vertical', status: 'draft',
  domains: [
    { id: '@aikdna/dev-change-risk', version: '^0.1.0', role: 'primary-candidate', required: true, load_condition: 'Task involves a deploy decision.' },
    { id: '@aikdna/dev-api-design', version: '^0.1.0', role: 'advisor', required: false, load_condition: 'Task introduces new API.', contribution_hypothesis_template: 'API design dimension beyond deploy risk.' },
  ],
  composition: { strategy: 'signal_based', max_active_domains: 3, conflict_policy: 'surface', primary_selection: 'exactly_one', advisor_selection: 'contribution_hypothesis_required' },
  budget: { profile: 'interactive', max_tokens: 800, max_assets: 3 },
};

// ── Fixtures ──────────────────────────────────────────────────────────

it('creates cluster fixture with required fields', () => {
  const f = createClusterFixture({ task: 'Deploy to production?', taskFamily: 'deploy', category: 'target' });
  assert.ok(f.fixture_id.startsWith('cfix_'));
  assert.ok(f.task_hash.startsWith('sha256:'));
  assert.strictEqual(f.category, 'target');
});

// ── Gates ─────────────────────────────────────────────────────────────

it('structural gate passes for valid plan', () => {
  const plan = {
    applicability: { decision: 'applies' },
    selection: {
      primary: { asset_id: '@aikdna/dev-change-risk', weight: 1 },
      advisors: [{ asset_id: '@aikdna/dev-api-design', contribution_hypothesis: 'API design review — PATCH semantics validation' }],
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
  const g = structuralGate({ applicability: { decision: 'blocked' } });
  assert.strictEqual(g.pass, false);
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

it('economics gate passes within budget', () => {
  const plan = { selection: { advisors: [] }, budget: { max_tokens: 800, assets_consumed: 1 } };
  const g = economicsGate(plan, { tokens_used: 400 });
  assert.strictEqual(g.pass, true);
});

it('economics gate fails over budget', () => {
  const plan = { selection: { advisors: [{ id: 'a1' }] }, budget: { max_tokens: 800, assets_consumed: 2 } };
  const g = economicsGate(plan, { tokens_used: 1200 });
  assert.strictEqual(g.pass, false);
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
  const assets = [{ asset_id: 'a', role: 'primary', digest_verified: false, authorization: 'public' }];
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

// ── Full Assay ────────────────────────────────────────────────────────

it('runs full cluster assay with valid plan', () => {
  const plan = {
    applicability: { decision: 'applies' },
    selection: {
      primary: { asset_id: '@aikdna/dev-change-risk', weight: 1, selection_reason: 'only primary' },
      advisors: [{ asset_id: '@aikdna/dev-api-design', contribution_hypothesis: 'API design review for PATCH semantics', accepted: true }],
      rejected: [{ asset_id: '@aikdna/irrelevant', rejection_reason: 'no match' }],
    },
    budget: { profile: 'interactive', max_tokens: 800, assets_consumed: 2 },
    cluster_ref: { cluster_id: '@aikdna/test' },
  };
  const result = runClusterAssay({
    manifest: CANONICAL_MANIFEST,
    plan,
    executionCost: { tokens_used: 500 },
    fixtures: [createClusterFixture({ task: 'test' })],
  });
  assert.ok(result.verdict);
  assert.ok(result.gates.structural);
  assert.ok(result.gates.economics);
  assert.ok(result.gates.trust);
  assert.ok(result.gates.product);
  assert.strictEqual(result.cluster_id, '@aikdna/launch-decision');
  assert.strictEqual(result.fixture_count, 1);
  assert.strictEqual(result.verdict.overall, 'fail');
  assert.strictEqual(result.verdict.all_passed, false);
  assert.ok(result.verdict.incomplete_gates.includes('behavioral'));
  assert.ok(result.verdict.incomplete_gates.includes('trust'));
});

// ── Advisor Relation Ledger ───────────────────────────────────────────

it('creates advisor relation ledger', () => {
  const plan = {
    cluster_ref: { cluster_id: '@aikdna/test' },
    selection: {
      primary: { asset_id: '@aikdna/primary', selection_reason: 'only primary-candidate' },
      advisors: [{ asset_id: '@aikdna/advisor1', contribution_hypothesis: 'API design review', accepted: true }],
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
  const d = recordAdvisorDecision('@aikdna/advisor1', 'approved', { notes: 'LGTM', reviewedBy: 'expert' });
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
  const decisions = [recordAdvisorDecision('@aikdna/advisor1', 'approved', { notes: 'Valid contribution' })];
  const ledger = createAdvisorRelationLedger(plan, decisions);
  assert.strictEqual(ledger.summary.human_reviewed_count, 1);
  assert.strictEqual(ledger.summary.pending_review_count, 0);
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
    createClusterFixture({ task: 'task A' }),
    createClusterFixture({ task: 'task B' }),
  ];
  const results = runClusterReplay(engine, fixtures, { clusterId: '@aikdna/test' });
  assert.strictEqual(Object.keys(results).length, 5);
  assert.ok(results.repair);
});

console.log('cluster-assay.test.js: all tests complete');
