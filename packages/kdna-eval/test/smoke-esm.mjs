import assert from "node:assert/strict";
import { createEvaluator, evaluateCandidates, RULE_OF_SIX_DEFAULTS } from "../src/index.mjs";
import { loadFlatDomains } from "../src/loader.mjs";
import { resolveDomains } from "../src/route.mjs";
import { STORYCUT_DEFAULTS } from "../src/storycut.mjs";

assert.ok(typeof createEvaluator === "function");
assert.ok(typeof evaluateCandidates === "function");
assert.ok(typeof RULE_OF_SIX_DEFAULTS === "object");
assert.ok(typeof loadFlatDomains === "function");
assert.ok(typeof resolveDomains === "function");
assert.ok(typeof STORYCUT_DEFAULTS === "object");
assert.ok(STORYCUT_DEFAULTS["segment_selection.kdna"]);

const evaluator = createEvaluator({ dimensions: ["clarity", "impact"] });
const results = evaluator.score(
  [{ text: "hello world here" }],
  [{ id: "d", data: { schemaVersion: 1, id: "d", x_eval: { rules: [{ id: "r", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 3 }, effect: { value: 10 } }] } } }]
);
assert.equal(results[0].dimensions.clarity, 60);

console.log("ESM smoke: all exports OK");
