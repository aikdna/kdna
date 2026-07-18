import assert from "node:assert/strict";
import { DEFAULT_SCORE, SCORE_MIN, SCORE_MAX, createEvaluator, evaluateCandidates, createReplayEngine, createMultiGateRunner, createCostTracker, createAssayProfile, createFixture, validateFixtureSet, scoreJudgment } from "../src/index.mjs";
import { loadFlatDomains } from "../src/loader.mjs";
import { resolveDomains } from "../src/route.mjs";

assert.ok(typeof createEvaluator === "function");
assert.ok(typeof evaluateCandidates === "function");
assert.ok(typeof loadFlatDomains === "function");
assert.ok(typeof resolveDomains === "function");
assert.ok(typeof createReplayEngine === "function");
assert.ok(typeof createMultiGateRunner === "function");
assert.ok(typeof createCostTracker === "function");
assert.equal(DEFAULT_SCORE, 50);
assert.equal(SCORE_MIN, 0);
assert.equal(SCORE_MAX, 100);

const evaluator = createEvaluator({ dimensions: ["clarity", "impact"] });
const results = evaluator.score(
  [{ text: "hello world here" }],
  [{ id: "d", data: { schemaVersion: 1, id: "d", x_eval: { rules: [{ id: "r", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 3 }, effect: { value: 10 } }] } } }]
);
assert.equal(results[0].dimensions.clarity, 60);

// Quick smoke test for new modules
const engine = createReplayEngine();
const run = engine.replayRun("fresh", { fixtures: [{ id: "f1", score: 70, pass: true }], policy: { id: "p1" } });
assert.equal(run.results.length, 1);

const runner = createMultiGateRunner([() => ({ gate: "test", pass: true, score: 1, details: {}, errors: [] })]);
const gateResults = runner.runGates({});
assert.equal(gateResults[0].pass, true);

const tracker = createCostTracker("interactive");
tracker.trackAsset({ tokens: 100, chars: 50 });
const costReport = tracker.getCostReport();
assert.equal(costReport.consumed.tokens, 100);

// Smoke test assay module
const profile = createAssayProfile({ assetId: 'smoke-test.kdna' });
assert.equal(profile.profile_version, '0.9.0');
const fixture = createFixture({
  category: 'positive_target',
  task: 'smoke test task',
  expected: { answer: 'smoke test answer' },
});
assert.equal(fixture.category, 'positive_target');
const validation = validateFixtureSet([fixture], profile);
assert.equal(validation.valid, false); // insufficient count
const scored = scoreJudgment({ answer: 'test answer' }, { answer: 'test answer' });
assert.ok(scored.score >= 3);

console.log("ESM smoke: all exports OK");
