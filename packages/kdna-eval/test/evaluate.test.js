const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeComposite,
  createEvaluator,
  evaluateAxioms,
  evaluateCandidates,
  evaluateCondition,
  extractRules,
  getPath,
  RULE_OF_SIX_DEFAULTS,
  validateWeight
} = require("../src/evaluate.js");
const { DEFAULT_SEGMENT_SELECTION } = require("../src/defaults/domains.js");

test("getPath navigates dot-separated path", () => {
  assert.equal(getPath({ a: { b: { c: 42 } } }, "a.b.c"), 42);
  assert.equal(getPath({ a: { b: { c: 42 } } }, "x.y.z"), undefined);
});

test("evaluateCondition eq matches exact value", () => {
  const c = { text: "hello", signals: { fromTranscript: true } };
  assert.ok(evaluateCondition(c, { path: "text", op: "eq", value: "hello" }));
  assert.ok(!evaluateCondition(c, { path: "text", op: "eq", value: "world" }));
  assert.ok(evaluateCondition(c, { path: "signals.fromTranscript", op: "eq", value: true }));
});

test("evaluateCondition gt/gte/lt/lte numeric comparisons", () => {
  const c = { text: "abcdefghijklmnopqrstuvwxyz" };
  assert.ok(evaluateCondition(c, { path: "text.length", op: "gt", value: 20 }));
  assert.ok(evaluateCondition(c, { path: "text.length", op: "gte", value: 26 }));
  assert.ok(evaluateCondition(c, { path: "text.length", op: "lt", value: 30 }));
  assert.ok(evaluateCondition(c, { path: "text.length", op: "lte", value: 26 }));
});

test("evaluateCondition between checks range", () => {
  const c = { outSec: 30, inSec: 10 };
  assert.ok(evaluateCondition(c, { path: "duration", op: "between", min: 5, max: 45 }));
  assert.ok(!evaluateCondition(c, { path: "duration", op: "between", min: 25, max: 45 }));
});

test("evaluateCondition supports index from context", () => {
  assert.ok(evaluateCondition({}, { path: "index", op: "gte", value: 0 }, { index: 0 }));
});

test("evaluateAxioms scores candidate with a single rule (x_eval format)", () => {
  const rules = [
    { id: "transcript-bonus", dimensions: ["story"], condition: { path: "signals.fromTranscript", op: "eq", value: true }, effect: { value: 8 } }
  ];
  const result = evaluateAxioms(
    { text: "hello", signals: { fromTranscript: true } },
    rules,
    { index: 0, dimensionDefaults: { emotion: 50, story: 50 } }
  );
  assert.equal(result.dimensions.story, 58);
  assert.equal(result.triggered.length, 1);
  assert.equal(result.triggered[0].id, "transcript-bonus");
});

test("evaluateAxioms scores with penalty and multiplyBy", () => {
  const rules = [
    { id: "risk-penalty", dimensions: ["story"], condition: { path: "riskFlags.length", op: "gt", value: 0 }, effect: { value: -12, multiplyBy: "riskFlags.length" } }
  ];
  const result = evaluateAxioms(
    { text: "x", riskFlags: [{ type: "p", severity: "w", reason: "r" }] },
    rules,
    { index: 0, dimensionDefaults: { emotion: 50, story: 50 } }
  );
  assert.equal(result.dimensions.story, 38);
  assert.equal(result.triggered[0].delta, -12);
});

test("evaluateAxioms clamps dimensions 0-100 by default", () => {
  const rules = [
    { id: "penalty", dimensions: ["story"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: -200 } },
    { id: "bonus", dimensions: ["emotion"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: 200 } }
  ];
  const result = evaluateAxioms({ text: "x" }, rules, {
    index: 0,
    dimensionDefaults: { emotion: 50, story: 50 }
  });
  assert.equal(result.dimensions.story, 0);
  assert.equal(result.dimensions.emotion, 100);
});

test("effect clamp works as min/max", () => {
  const rules = [
    { id: "clamped", dimensions: ["story"], condition: { path: "text.length", op: "gt", value: 0 }, effect: { value: 100, clamp: { max: 30 } } }
  ];
  const result = evaluateAxioms({ text: "hello" }, rules, {
    index: 0,
    dimensionDefaults: { story: 50 }
  });
  assert.equal(result.dimensions.story, 80);
});

test("computeComposite returns weighted score", () => {
  const score = computeComposite({ emotion: 80, story: 70, rhythm: 60, eyeTrace: 50, twoD: 50, threeD: 50 });
  assert.ok(score >= 0 && score <= 100);
});

test("computeComposite custom weights", () => {
  assert.equal(computeComposite({ emotion: 100, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 }, { emotion: 1, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 }), 100);
});

test("evaluateCandidates scores with x_eval rules", () => {
  const candidates = [
    { id: "c1", text: "A long and substantive transcript segment", signals: { fromTranscript: true } },
    { id: "c2", text: "short", signals: {} }
  ];
  const results = evaluateCandidates(candidates, [{ id: "seg", data: DEFAULT_SEGMENT_SELECTION }]);
  assert.equal(results.length, 2);
  assert.ok(results[0].score > results[1].score);
});

test("evaluateCandidates returns default when no rules", () => {
  const results = evaluateCandidates([{ id: "c1" }], [{ id: "empty", data: { id: "empty", schemaVersion: 1 } }]);
  assert.equal(results[0].score, 50);
});

test("evaluateCandidates validates negative weight", () => {
  assert.throws(() => {
    evaluateCandidates([{ id: "c1" }], [{ id: "seg", data: DEFAULT_SEGMENT_SELECTION }], { weights: new Map([["seg", -1]]) });
  }, /Negative/);
});

test("evaluateCandidates validates NaN weight", () => {
  assert.throws(() => {
    evaluateCandidates([{ id: "c1" }], [{ id: "seg", data: DEFAULT_SEGMENT_SELECTION }], { weights: new Map([["seg", NaN]]) });
  }, /Invalid/);
});

test("createEvaluator with custom dimensions", () => {
  const evaluator = createEvaluator({
    dimensions: ["clarity", "impact"],
    defaults: { clarity: 60, impact: 40 }
  });
  assert.deepEqual(evaluator.dimensions, ["clarity", "impact"]);
  assert.equal(evaluator.defaults.clarity, 60);

  const rules = [
    { id: "r1", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 10 }, effect: { value: 10 } }
  ];
  const domain = { schemaVersion: 1, id: "d", x_eval: { rules } };
  const results = evaluator.score(
    [{ text: "hello world here" }],
    [{ id: "d", data: domain }]
  );
  assert.equal(results[0].dimensions.clarity, 70);
});

test("extractRules reads x_eval.rules before axioms", () => {
  const data = { id: "x", schemaVersion: 1, x_eval: { rules: [{ id: "a1", dimensions: [], condition: {}, effect: { value: 0 } }] } };
  assert.equal(extractRules(data).length, 1);
  assert.equal(extractRules(data)[0].id, "a1");
  assert.equal(extractRules({ id: "x", schemaVersion: 1 }).length, 0);
});
