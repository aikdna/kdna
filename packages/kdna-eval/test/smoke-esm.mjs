import assert from "node:assert/strict";
import { createEvaluator, evaluateCandidates, createReplayEngine, createMultiGateRunner, createCostTracker } from "../src/index.mjs";
import { loadFlatDomains } from "../src/loader.mjs";
import { resolveDomains } from "../src/route.mjs";

assert.ok(typeof createEvaluator === "function");
assert.ok(typeof evaluateCandidates === "function");
assert.ok(typeof loadFlatDomains === "function");
assert.ok(typeof resolveDomains === "function");
assert.ok(typeof createReplayEngine === "function");
assert.ok(typeof createMultiGateRunner === "function");
assert.ok(typeof createCostTracker === "function");

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

console.log("ESM smoke: all exports OK");
