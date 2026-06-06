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
  validateWeight
} = require("../src/evaluate.js");

function testDomain(rules) {
  return { id: "test", schemaVersion: 1, x_eval: { rules } };
}

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

test("evaluateAxioms scores with a single rule", () => {
  const rules = [
    { id: "bonus", dimensions: ["story"], condition: { path: "signals.fromTranscript", op: "eq", value: true }, effect: { value: 8 } }
  ];
  const result = evaluateAxioms(
    { text: "hello", signals: { fromTranscript: true } },
    rules,
    { index: 0, dimensionDefaults: { emotion: 50, story: 50 } }
  );
  assert.equal(result.dimensions.story, 58);
  assert.equal(result.triggered[0].id, "bonus");
});

test("evaluateAxioms scores with penalty and multiplyBy", () => {
  const rules = [
    { id: "penalty", dimensions: ["story"], condition: { path: "riskFlags.length", op: "gt", value: 0 }, effect: { value: -12, multiplyBy: "riskFlags.length" } }
  ];
  const result = evaluateAxioms(
    { text: "x", riskFlags: [{ type: "p", severity: "w", reason: "r" }] },
    rules,
    { index: 0, dimensionDefaults: { story: 50 } }
  );
  assert.equal(result.dimensions.story, 38);
});

test("evaluateAxioms clamps dimensions 0-100", () => {
  const rules = [
    { id: "p", dimensions: ["story"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: -200 } },
    { id: "b", dimensions: ["emotion"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: 200 } }
  ];
  const result = evaluateAxioms({ text: "x" }, rules, {
    index: 0, dimensionDefaults: { emotion: 50, story: 50 }
  });
  assert.equal(result.dimensions.story, 0);
  assert.equal(result.dimensions.emotion, 100);
});

test("effect clamp works as min/max", () => {
  const rules = [
    { id: "c", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 0 }, effect: { value: 100, clamp: { max: 30 } } }
  ];
  const result = evaluateAxioms({ text: "hello" }, rules, {
    index: 0, dimensionDefaults: { clarity: 50 }
  });
  assert.equal(result.dimensions.clarity, 80);
});

test("computeComposite with weights", () => {
  assert.equal(computeComposite({ a: 100, b: 0 }, { a: 1, b: 0 }, ["a", "b"]), 100);
  assert.ok(computeComposite({ a: 80, b: 70 }, { a: 0.5, b: 0.5 }, ["a", "b"]) >= 0);
});

test("evaluateCandidates scores with x_eval rules", () => {
  const candidates = [
    { id: "c1", text: "A long and substantive transcript segment", signals: { fromTranscript: true } },
    { id: "c2", text: "short", signals: {} }
  ];
  const domain = testDomain([
    { id: "transcript-bonus", dimensions: ["clarity"], condition: { path: "signals.fromTranscript", op: "eq", value: true }, effect: { value: 8 } },
    { id: "text-length-bonus", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 20 }, effect: { value: 5 } }
  ]);
  const results = evaluateCandidates(candidates, [{ id: "d", data: domain }], {
    dimensionDefaults: { clarity: 50 }
  });
  assert.equal(results.length, 2);
  assert.ok(results[0].score > results[1].score);
});

test("evaluateCandidates returns default when no rules", () => {
  const results = evaluateCandidates([{ id: "c1" }], [{ id: "empty", data: { id: "empty", schemaVersion: 1 } }], {
    dimensionDefaults: { clarity: 50 }
  });
  assert.equal(results[0].score, 50);
});

test("evaluateCandidates validates negative weight", () => {
  assert.throws(() => {
    evaluateCandidates([{ id: "c1" }], [{ id: "d", data: testDomain([{ id: "r", dimensions: ["x"], condition: { path: "text", op: "eq", value: "hi" }, effect: { value: 1 } }]) }], {
      dimensionDefaults: { x: 50 }, weights: new Map([["d", -1]])
    });
  }, /Negative/);
});

test("evaluateCandidates validates NaN weight", () => {
  assert.throws(() => {
    evaluateCandidates([{ id: "c1" }], [{ id: "d", data: testDomain([{ id: "r", dimensions: ["x"], condition: { path: "text", op: "eq", value: "hi" }, effect: { value: 1 } }]) }], {
      dimensionDefaults: { x: 50 }, weights: new Map([["d", NaN]])
    });
  }, /Invalid/);
});

test("createEvaluator with custom dimensions", () => {
  const evaluator = createEvaluator({
    dimensions: ["clarity", "impact"],
    defaults: { clarity: 60, impact: 40 }
  });
  assert.deepEqual(evaluator.dimensions, ["clarity", "impact"]);

  const rules = [{ id: "r", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 10 }, effect: { value: 10 } }];
  const results = evaluator.score(
    [{ text: "hello world here" }],
    [{ id: "d", data: { schemaVersion: 1, id: "d", x_eval: { rules } } }]
  );
  assert.equal(results[0].dimensions.clarity, 70);
});

test("extractRules reads x_eval.rules before axioms", () => {
  const data = { id: "x", schemaVersion: 1, x_eval: { rules: [{ id: "a1", dimensions: [], condition: {}, effect: { value: 0 } }] } };
  assert.equal(extractRules(data).length, 1);
  assert.equal(extractRules({ id: "x", schemaVersion: 1 }).length, 0);
});
