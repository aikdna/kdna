const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createConsumptionRunner } = require("../src/consume");

const samplePolicies = {
  review: {
    operation: "review",
    loadProfile: "compact",
    domains: [{ id: "content-review", weight: 1 }],
  },
};

test("route gate with policies returns primary domain", () => {
  const runner = createConsumptionRunner({ policies: samplePolicies });
  const result = runner.route({ id: "test-asset" }, { task: "review" });
  assert.equal(result.gate, "route");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
  assert.equal(result.details.primary, "content-review");
  assert.equal(result.details.operation, "review");
  assert.equal(result.details.loadProfile, "compact");
  assert.deepEqual(result.details.selectedDomains, ["content-review"]);
  assert.deepEqual(result.details.rejected, []);
  assert.equal(result.details.confidence, "high");
  assert.equal(result.details.abstainReason, null);
});

test("route gate with no policies returns pass: null", () => {
  const runner = createConsumptionRunner({});
  const result = runner.route({ id: "test-asset" }, { task: "review" });
  assert.equal(result.gate, "route");
  assert.equal(result.pass, null);
  assert.equal(result.score, null);
  assert.match(result.details.note, /no policies/);
});

test("route gate with unknown operation returns pass: false", () => {
  const runner = createConsumptionRunner({ policies: samplePolicies });
  const result = runner.route({ id: "test-asset" }, { task: "unknown-op" });
  assert.equal(result.gate, "route");
  assert.equal(result.pass, false);
  assert.equal(result.score, 0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /Unknown operation/);
});

test("route gate uses context.task over context.operation", () => {
  const runner = createConsumptionRunner({ policies: samplePolicies });
  const result = runner.route({ id: "test-asset" }, { task: "review", operation: "unknown" });
  assert.equal(result.pass, true);
  assert.equal(result.details.operation, "review");
});

test("route gate falls back to context.operation when task is absent", () => {
  const runner = createConsumptionRunner({ policies: samplePolicies });
  const result = runner.route({ id: "test-asset" }, { operation: "review" });
  assert.equal(result.pass, true);
  assert.equal(result.details.operation, "review");
});

test("cost gate returns pass: true when under budget", () => {
  const runner = createConsumptionRunner({ budgetProfile: "interactive" });
  const result = runner.cost(
    { id: "asset-1", text: "small content", estimatedTokens: 50 },
    {}
  );
  assert.equal(result.gate, "cost");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
  assert.equal(result.details.over_budget, false);
  assert.equal(result.errors.length, 0);
});

test("cost gate returns pass: false when over budget (chars)", () => {
  const runner = createConsumptionRunner({ budgetProfile: "interactive" });
  const longText = "x".repeat(3000);
  const result = runner.cost(
    { id: "asset-1", text: longText },
    {}
  );
  assert.equal(result.gate, "cost");
  assert.equal(result.pass, false);
  assert.equal(result.score, 0.0);
  assert.equal(result.details.over_budget, true);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors[0], /Budget exceeded/);
});

test("cost gate tracks advisors from context", () => {
  const runner = createConsumptionRunner({ budgetProfile: "interactive" });
  const result = runner.cost({ id: "asset-1", text: "x".repeat(1200) }, {
    advisors: [{ id: "a1", content: "x".repeat(1400), estimatedTokens: 100 }],
  });
  assert.equal(result.gate, "cost");
  assert.equal(result.pass, false);
  assert.equal(result.details.over_budget, true);
  assert.equal(result.details.consumed.assets, 2);
  assert.equal(result.details.asset_details[1].type, "advisor");
});

test("cost gate with no asset still returns report", () => {
  const runner = createConsumptionRunner({ budgetProfile: "code-review" });
  const result = runner.cost(null, {});
  assert.equal(result.gate, "cost");
  assert.equal(result.pass, true);
  assert.equal(result.details.consumed.tokens, 0);
  assert.equal(result.details.consumed.chars, 0);
  assert.equal(result.details.consumed.assets, 0);
});

test("createConsumptionRunner with code-review profile uses correct budget", () => {
  const runner = createConsumptionRunner({ budgetProfile: "code-review" });
  const asset = { id: "asset-1", text: "x".repeat(3400) };
  const result = runner.cost(asset, {});
  assert.equal(result.gate, "cost");
  assert.equal(result.pass, true);
  assert.equal(result.details.profile, "code-review");
  assert.equal(result.details.limits.maxChars, 3500);
});

test("createConsumptionRunner defaults budget to interactive", () => {
  const runner = createConsumptionRunner();
  const asset = { id: "asset-1", text: "x".repeat(2600) };
  const result = runner.cost(asset, {});
  assert.equal(result.pass, false);
  assert.equal(result.details.profile, "interactive");
  assert.equal(result.details.limits.maxChars, 2500);
});

test("compose gate with primary and advisors within hardmax returns pass: true", () => {
  const runner = createConsumptionRunner();
  const result = runner.compose(null, {
    primary: "domain-a",
    advisors: ["domain-b", "domain-c"],
    sourceHardmax: 4,
  });
  assert.equal(result.gate, "compose");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
  assert.equal(result.details.primary.domain_id, "domain-a");
  assert.equal(result.details.advisors.length, 2);
  assert.equal(result.details.sources_used, 3);
  assert.equal(result.details.rejected_advisors.length, 0);
});

test("compose gate with advisors exceeding hardmax rejects extras", () => {
  const runner = createConsumptionRunner();
  const result = runner.compose(null, {
    primary: "domain-a",
    advisors: ["domain-b", "domain-c", "domain-d"],
    sourceHardmax: 3,
  });
  assert.equal(result.pass, true);
  assert.equal(result.details.advisors.length, 2);
  assert.equal(result.details.rejected_advisors.length, 1);
  assert.equal(result.details.rejected_advisors[0].domain_id, "domain-d");
  assert.match(result.details.rejected_advisors[0].reason, /hardmax/);
});

test("compose gate with no primary returns pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.compose(null, {
    advisors: ["domain-b"],
  });
  assert.equal(result.gate, "compose");
  assert.equal(result.pass, false);
  assert.equal(result.score, 0.0);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /requires a primary/);
});

test("compose gate detects conflicts with overlapping weights", () => {
  const policies = {
    review: {
      operation: "review",
      loadProfile: "compact",
      domains: [
        { id: "domain-a", weight: 1 },
        { id: "domain-b", weight: 0.9 },
      ],
    },
  };
  const runner = createConsumptionRunner({ policies });
  const result = runner.compose(null, {
    primary: "domain-a",
    advisors: ["domain-b"],
    sourceHardmax: 3,
    policies,
  });
  assert.equal(result.pass, true);
  assert.ok(result.details.conflicts.length > 0);
  assert.equal(result.details.conflicts[0].domain_a, "domain-a");
  assert.equal(result.details.conflicts[0].domain_b, "domain-b");
});

test("compose gate attribution fields are populated", () => {
  const runner = createConsumptionRunner();
  const result = runner.compose(null, {
    primary: "domain-a",
    advisors: ["domain-b"],
    primaryReason: "user specified",
  });
  assert.equal(result.details.primary.reason, "user specified");
  assert.equal(result.details.advisors[0].role, "advisor");
  assert.ok(result.details.advisors[0].attribution);
});

test("promotion gate with legal source + human_reviewed + all suites pass → pass: true", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "human_reviewed",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: true },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: true },
    },
  });
  assert.equal(result.gate, "promotion");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
  assert.ok(result.details.suiteResults);
  assert.equal(result.details.suiteResults.length, 5);
});

test("promotion gate sealed-derived source → pass: false, promotionBlocked: true", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "sealed-derived",
    reviewStatus: "trusted_runtime",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: true },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: true },
    },
  });
  assert.equal(result.pass, false);
  assert.equal(result.score, 0.0);
  assert.equal(result.details.promotionBlocked, true);
  assert.match(result.details.blockReason, /sealed-derived/);
});

test("promotion gate review_status below human_reviewed → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "lint_repaired",
    replayResults: {},
  });
  assert.equal(result.pass, false);
  assert.match(result.details.blockReason, /below minimum/);
});

test("promotion gate a required suite fails → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "human_reviewed",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: false },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: true },
    },
  });
  assert.equal(result.pass, false);
  assert.match(result.details.blockReason, /failed: holdout/);
});

test("promotion gate eval_candidate + all pass + non-sealed → pass: true", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "eval_candidate",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: true },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: true },
    },
  });
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
});

test("promotion details contain suiteResults with passed flags", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "human_reviewed",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: false },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: true },
    },
  });
  const sr = result.details.suiteResults;
  assert.ok(Array.isArray(sr));
  const repair = sr.find((s) => s.suite === "repair");
  assert.equal(repair.passed, true);
  const holdout = sr.find((s) => s.suite === "holdout");
  assert.equal(holdout.passed, false);
});

test("projection gate valid shape → pass: true", () => {
  const runner = createConsumptionRunner();
  const result = runner.projection(null, { shape: "answer-pattern", budget: "interactive" });
  assert.equal(result.gate, "projection");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
  assert.equal(result.details.shapeMismatch, false);
});

test("projection gate invalid shape → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.projection(null, { shape: "unknown-shape" });
  assert.equal(result.pass, false);
  assert.match(result.errors[0], /Unknown projection shape/);
});

test("projection gate shape mismatch → score < 1.0", () => {
  const runner = createConsumptionRunner();
  const result = runner.projection(null, { shape: "compact", budget: "interactive" });
  assert.equal(result.pass, true);
  assert.ok(result.score < 1.0);
  assert.equal(result.details.shapeMismatch, true);
});

test("quality gate all checks passed → pass: true, score: 1.0", () => {
  const runner = createConsumptionRunner();
  const result = runner.quality(null, {
    primary: "domain-a",
    advisors: ["domain-b"],
    rejected: [],
    conflicts: [],
  });
  assert.equal(result.gate, "quality");
  assert.equal(result.pass, true);
  assert.equal(result.score, 1.0);
});

test("quality gate has conflicts → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.quality(null, {
    primary: "domain-a",
    advisors: ["domain-b"],
    conflicts: [
      { domain_a: "domain-a", domain_b: "domain-b", description: "overlap" },
    ],
  });
  assert.equal(result.pass, false);
  assert.ok(result.details.checks.find((c) => c.check === "no_conflicts").passed === false);
});

test("quality gate no primary → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.quality(null, {});
  assert.equal(result.pass, false);
  const primaryCheck = result.details.checks.find((c) => c.check === "primary_selected");
  assert.equal(primaryCheck.passed, false);
});

test("quality gate high rejection rate → pass: false", () => {
  const runner = createConsumptionRunner();
  const result = runner.quality(null, {
    primary: "domain-a",
    advisors: ["domain-b"],
    rejected: ["r1", "r2", "r3"],
  });
  const rejectCheck = result.details.checks.find(
    (c) => c.check === "acceptable_rejection_rate"
  );
  assert.equal(rejectCheck.passed, false);
});

test("promotion gate 4/5 suites pass → pass: false (fail closed)", () => {
  const runner = createConsumptionRunner();
  const result = runner.promotion(null, {
    source: "experiment-derived",
    reviewStatus: "eval_candidate",
    replayResults: {
      repair: { pass: true },
      holdout: { pass: true },
      fresh: { pass: true },
      "candidate-sealed": { pass: true },
      "new-sealed": { pass: false },
    },
  });
  assert.equal(result.pass, false);
  assert.match(result.errors[0], /Missing\/failed: new-sealed/);
});
