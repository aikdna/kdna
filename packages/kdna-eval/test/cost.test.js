const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createCostTracker, BUDGET_PROFILES } = require("../src/cost");

test("createCostTracker with string profile defaults correctly", () => {
  const t = createCostTracker("interactive");
  const report = t.getCostReport();
  assert.equal(report.profile, "interactive");
  assert.equal(report.limits.maxTokens, 800);
  assert.equal(report.limits.maxChars, 2500);
  assert.equal(report.limits.maxAssets, 3);
});

test("createCostTracker with object profile uses custom limits", () => {
  const t = createCostTracker({ maxTokens: 100, maxChars: 200, maxAssets: 5 });
  const report = t.getCostReport();
  assert.equal(report.profile, "custom");
  assert.equal(report.limits.maxTokens, 100);
});

test("createCostTracker defaults to interactive for unknown profile", () => {
  const t = createCostTracker("nonexistent");
  const report = t.getCostReport();
  assert.equal(report.profile, "interactive");
});

test("trackAsset tracks tokens, chars, and asset count", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ id: "a1", type: "domain", tokens: 400, chars: 300 });
  const report = t.getCostReport();
  assert.equal(report.consumed.tokens, 400);
  assert.equal(report.consumed.chars, 300);
  assert.equal(report.consumed.assets, 1);
  assert.equal(report.asset_details.length, 1);
  assert.equal(report.asset_details[0].id, "a1");
});

test("trackAsset with missing tokens defaults to 0", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ id: "a2", type: "domain" });
  const report = t.getCostReport();
  assert.equal(report.consumed.tokens, 0);
  assert.equal(report.consumed.chars, 0);
  assert.equal(report.consumed.assets, 1);
});

test("trackAsset uses text.length for chars when chars not provided", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ id: "a3", type: "domain", text: "hello world" });
  const report = t.getCostReport();
  assert.equal(report.consumed.chars, 11);
});

test("trackAdvisor tracks advisor cost", () => {
  const t = createCostTracker("interactive");
  t.trackAdvisor({ id: "advisor-1", tokens: 2000, chars: 1500 });
  const report = t.getCostReport();
  assert.equal(report.consumed.tokens, 2000);
  assert.equal(report.consumed.chars, 1500);
  assert.equal(report.asset_details.length, 1);
  assert.equal(report.asset_details[0].type, "advisor");
});

test("isOverBudget returns false when under budget", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ tokens: 100, chars: 50 });
  assert.equal(t.isOverBudget(), false);
});

test("isOverBudget returns true when tokens exceed budget", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ tokens: 900, chars: 50 });
  assert.equal(t.isOverBudget(), true);
  const report = t.getCostReport();
  assert.equal(report.over_budget, true);
  assert.ok(report.over_budget_reasons.includes("tokens"));
});

test("isOverBudget returns true when chars exceed budget", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ tokens: 100, chars: 2600 });
  assert.equal(t.isOverBudget(), true);
  assert.ok(t.getCostReport().over_budget_reasons.includes("chars"));
});

test("isOverBudget returns true when assets exceed budget", () => {
  const t = createCostTracker("interactive");
  for (let i = 0; i < 5; i++) {
    t.trackAsset({ id: `a${i}`, tokens: 1, chars: 1 });
  }
  assert.equal(t.isOverBudget(), true);
  assert.ok(t.getCostReport().over_budget_reasons.includes("assets"));
});

test("multiple assets accumulate correctly", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ tokens: 100, chars: 100 });
  t.trackAsset({ tokens: 200, chars: 200 });
  t.trackAdvisor({ tokens: 300, chars: 300 });
  const report = t.getCostReport();
  assert.equal(report.consumed.tokens, 600);
  assert.equal(report.consumed.chars, 600);
  assert.equal(report.consumed.assets, 3);
});

test("BUDGET_PROFILES has all expected profiles", () => {
  assert.ok(BUDGET_PROFILES["interactive"]);
  assert.ok(BUDGET_PROFILES["code-review"]);
  assert.ok(BUDGET_PROFILES["offline-audit"]);
});

test("code-review profile has more maxAssets than interactive", () => {
  assert.ok(
    BUDGET_PROFILES["code-review"].maxAssets > BUDGET_PROFILES["interactive"].maxAssets
  );
});

test("_reset clears all state", () => {
  const t = createCostTracker("interactive");
  t.trackAsset({ tokens: 500, chars: 400 });
  t._reset();
  const report = t.getCostReport();
  assert.equal(report.consumed.tokens, 0);
  assert.equal(report.consumed.chars, 0);
  assert.equal(report.consumed.assets, 0);
  assert.equal(report.asset_details.length, 0);
});

test("offline-audit zero-limit does not trigger tokens/chars over-budget", () => {
  const t = createCostTracker("offline-audit");
  t.trackAsset({ tokens: 500000, chars: 500000 });
  assert.equal(t.isOverBudget(), false);
});

test("offline-audit asset limit is still enforced as safety net", () => {
  const t = createCostTracker("offline-audit");
  for (let i = 0; i < 25; i++) {
    t.trackAsset({ id: `a${i}`, tokens: 1, chars: 1 });
  }
  assert.equal(t.isOverBudget(), true);
  assert.ok(t.getCostReport().over_budget_reasons.includes("assets"));
});

test("code-review budget has correct roadmap-aligned limits", () => {
  const t = createCostTracker("code-review");
  const report = t.getCostReport();
  assert.equal(report.limits.maxChars, 3500);
  assert.equal(report.limits.maxTokens, 1200);
  assert.equal(report.limits.maxAssets, 8);
});

test("README cost tracker example stays executable and within its stated budget", () => {
  const tracker = createCostTracker("code-review");
  tracker.trackAsset({ id: "domain-1", tokens: 700, chars: 1000 });
  tracker.trackAdvisor({ id: "system", tokens: 200, content: "..." });
  const report = tracker.getCostReport();

  assert.deepEqual(report.consumed, { tokens: 900, chars: 1003, assets: 2 });
  assert.equal(report.over_budget, false);
});
