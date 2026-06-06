const test = require("node:test");
const assert = require("node:assert/strict");
const {
  computeComposite,
  evaluateAxioms,
  evaluateCandidates,
  evaluateCondition,
  getPath,
  RULE_OF_SIX_DEFAULTS
} = require("../src/evaluate.js");
const { DEFAULT_SEGMENT_SELECTION } = require("../src/defaults/domains.js");

test("getPath navigates dot-separated path", () => {
  const obj = { a: { b: { c: 42 } } };
  assert.equal(getPath(obj, "a.b.c"), 42);
  assert.equal(getPath(obj, "x.y.z"), undefined);
  assert.equal(getPath(obj, "a"), obj.a);
});

test("evaluateCondition eq matches exact value", () => {
  const candidate = { text: "hello", signals: { fromTranscript: true } };
  assert.ok(evaluateCondition(candidate, { path: "text", op: "eq", value: "hello" }));
  assert.ok(!evaluateCondition(candidate, { path: "text", op: "eq", value: "world" }));
  assert.ok(evaluateCondition(candidate, { path: "signals.fromTranscript", op: "eq", value: true }));
});

test("evaluateCondition gt/gte/lt/lte numeric comparisons", () => {
  const candidate = { text: "abcdefghijklmnopqrstuvwxyz" }; // 26 chars
  assert.ok(evaluateCondition(candidate, { path: "text.length", op: "gt", value: 20 }));
  assert.ok(evaluateCondition(candidate, { path: "text.length", op: "gte", value: 26 }));
  assert.ok(evaluateCondition(candidate, { path: "text.length", op: "lt", value: 30 }));
  assert.ok(evaluateCondition(candidate, { path: "text.length", op: "lte", value: 26 }));
});

test("evaluateCondition between checks range", () => {
  const candidate = { outSec: 30, inSec: 10 }; // duration = 20
  assert.ok(evaluateCondition(candidate, { path: "duration", op: "between", min: 5, max: 45 }));
  assert.ok(!evaluateCondition(candidate, { path: "duration", op: "between", min: 25, max: 45 }));
});

test("evaluateCondition supports index from context", () => {
  const candidate = {};
  assert.ok(evaluateCondition(candidate, { path: "index", op: "gte", value: 0 }, { index: 0 }));
  assert.ok(!evaluateCondition(candidate, { path: "index", op: "eq", value: 3 }, { index: 0 }));
});

test("evaluateAxioms scores candidate with a single axiom", () => {
  const candidate = {
    text: "This is a long enough transcript segment for bonus",
    signals: { fromTranscript: true }
  };
  const axioms = [
    { id: "transcript-bonus", dimensions: ["story"], condition: { path: "signals.fromTranscript", op: "eq", value: true }, effect: { value: 8 } }
  ];
  const result = evaluateAxioms(candidate, axioms, { index: 0 });
  assert.equal(result.dimensions.story, 58);
  assert.equal(result.dimensions.emotion, 50);
  assert.equal(result.triggered.length, 1);
  assert.equal(result.triggered[0].id, "transcript-bonus");
});

test("evaluateAxioms scores with penalty axiom", () => {
  const candidate = {
    text: "short",
    riskFlags: [{ type: "profanity", severity: "warning", reason: "contains profanity" }]
  };
  const axioms = [
    { id: "risk-penalty", dimensions: ["story"], condition: { path: "riskFlags.length", op: "gt", value: 0 }, effect: { value: -12, multiplyBy: "riskFlags.length" } }
  ];
  const result = evaluateAxioms(candidate, axioms, { index: 0 });
  assert.equal(result.dimensions.story, 38);
  assert.equal(result.triggered[0].delta, -12);
});

test("evaluateAxioms clamps dimensions 0-100", () => {
  const candidate = { text: "x" };
  const axioms = [
    { id: "extreme-penalty", dimensions: ["story"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: -200 } },
    { id: "extreme-bonus", dimensions: ["emotion"], condition: { path: "text.length", op: "lt", value: 5 }, effect: { value: 200 } }
  ];
  const result = evaluateAxioms(candidate, axioms, { index: 0 });
  assert.equal(result.dimensions.story, 0);
  assert.equal(result.dimensions.emotion, 100);
});

test("computeComposite returns weighted score", () => {
  const dim = { emotion: 80, story: 70, rhythm: 60, eyeTrace: 50, twoD: 50, threeD: 50 };
  const score = computeComposite(dim);
  assert.ok(score >= 0 && score <= 100);
  assert.equal(typeof score, "number");
});

test("computeComposite respects custom weights", () => {
  const dim = { emotion: 100, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 };
  const weights = { emotion: 1.0, story: 0, rhythm: 0, eyeTrace: 0, twoD: 0, threeD: 0 };
  const score = computeComposite(dim, weights);
  assert.equal(score, 100);
});

test("evaluateCandidates scores multiple candidates across domains", () => {
  const candidates = [
    { id: "c1", text: "A long and substantive transcript segment about technology", signals: { fromTranscript: true } },
    { id: "c2", text: "short", signals: {} }
  ];
  const domains = [{ id: "segment_selection.kdna", data: DEFAULT_SEGMENT_SELECTION }];
  const results = evaluateCandidates(candidates, domains);
  assert.equal(results.length, 2);
  assert.ok(results[0].score > results[1].score);
  assert.equal(results[0].index, 0);
  assert.equal(results[1].index, 1);
  assert.ok(results[0].triggered.length > 0);
});

test("evaluateCandidates returns default when no domains have axioms", () => {
  const candidates = [{ id: "c1" }];
  const domains = [{ id: "empty.kdna", data: { id: "empty.kdna", schemaVersion: 1 } }];
  const results = evaluateCandidates(candidates, domains);
  assert.equal(results.length, 1);
  assert.equal(results[0].score, 50);
});

test("RULE_OF_SIX_DEFAULTS sums to 1", () => {
  const sum = Object.values(RULE_OF_SIX_DEFAULTS).reduce((a, b) => a + b, 0);
  assert.equal(sum, 1);
});

test("evaluateCandidates accepts domain weights", () => {
  const candidates = [
    { id: "c1", text: "abcdefghijklmnopqrstuvwxyz0123456789AB", signals: { fromTranscript: true } }
  ];
  const domains = [{ id: "seg.kdna", data: DEFAULT_SEGMENT_SELECTION }];
  const weights = new Map([["seg.kdna", 2]]);
  const results = evaluateCandidates(candidates, domains, { weights });
  assert.equal(results.length, 1);
  assert.ok(results[0].score !== 50);
});
