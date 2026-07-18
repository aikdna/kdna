const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  createReplayEngine,
  REPLAY_MODES,
  hashInput,
  detectRegressions,
} = require("../src/replay");

test("REPLAY_MODES includes all five modes", () => {
  assert.deepEqual(REPLAY_MODES, [
    "repair",
    "holdout",
    "fresh",
    "candidate-sealed",
    "new-sealed",
  ]);
});

test("hashInput produces deterministic output", () => {
  const input = { mode: "repair", policy: { id: "p1" } };
  const h1 = hashInput(input);
  const h2 = hashInput(input);
  assert.equal(h1, h2);
  assert.equal(h1.length, 16);
});

test("hashInput produces different hashes for different inputs", () => {
  const h1 = hashInput({ mode: "repair" });
  const h2 = hashInput({ mode: "holdout" });
  assert.notEqual(h1, h2);
});

test("createReplayEngine returns expected API", () => {
  const engine = createReplayEngine();
  assert.equal(typeof engine.replayRun, "function");
  assert.equal(typeof engine.compareRuns, "function");
  assert.equal(typeof engine.isRegression, "function");
});

test("replayRun with unknown mode throws", () => {
  const engine = createReplayEngine();
  assert.throws(() => {
    engine.replayRun("bogus", { fixtures: [] });
  }, /Unknown replay mode/);
});

test("replayRun with empty fixtures returns empty results", () => {
  const engine = createReplayEngine();
  const run = engine.replayRun("repair", { fixtures: [], policy: { id: "p1" } });
  assert.equal(run.mode, "repair");
  assert.equal(run.results.length, 0);
  assert.equal(run.summary.total, 0);
});

test("replayRun executes fixtures and produces results", () => {
  const fixtures = [
    { id: "f1", text: "hello", score: 75, pass: true },
    { id: "f2", text: "world", score: 60, pass: true },
  ];
  const engine = createReplayEngine();
  const run = engine.replayRun("fresh", { fixtures, policy: { id: "p1" } });
  assert.equal(run.mode, "fresh");
  assert.equal(run.results.length, 2);
  assert.equal(run.results[0].id, "f1");
  assert.equal(run.results[1].id, "f2");
  assert.equal(run.summary.total, 2);
  assert.equal(run.summary.passed, 2);
  assert.equal(run.summary.failed, 0);
});

test("replayRun detects failed fixtures", () => {
  const fixtures = [
    { id: "f1", score: 40, pass: false },
    { id: "f2", score: 80, pass: true },
  ];
  const engine = createReplayEngine();
  const run = engine.replayRun("repair", { fixtures, policy: { id: "p1" } });
  assert.equal(run.summary.passed, 1);
  assert.equal(run.summary.failed, 1);
  assert.equal(run.summary.incomplete, 0);
});

test("replayRun never treats missing or non-boolean pass evidence as success", () => {
  const fixtures = [
    { id: "missing" },
    { id: "null", pass: null },
    { id: "string", pass: "true" },
    { id: "expected", expected: { pass: true } },
  ];
  const engine = createReplayEngine();
  const run = engine.replayRun("fresh", { fixtures });
  assert.equal(run.summary.total, 4);
  assert.equal(run.summary.passed, 1);
  assert.equal(run.summary.failed, 3);
  assert.equal(run.summary.incomplete, 3);
  assert.equal(run.results[0].pass, undefined);
  assert.equal(run.results[1].pass, undefined);
  assert.equal(run.results[2].pass, undefined);
});

test("custom replay evaluation also counts only pass === true", () => {
  const fixtures = [{ id: "true" }, { id: "false" }, { id: "missing" }];
  const engine = createReplayEngine();
  const run = engine.replayRun("fresh", {
    fixtures,
    evaluate: fixture => ({
      id: fixture.id,
      ...(fixture.id === "true" ? { pass: true } : fixture.id === "false" ? { pass: false } : {}),
    }),
  });
  assert.deepEqual(run.summary, { total: 3, passed: 1, failed: 2, incomplete: 1, regressions: 0 });
});

test("replayRun with custom evaluate function uses it", () => {
  const fixtures = [{ input: "test" }];
  const evaluate = (fixture, policy, mode) => ({
    id: "custom-eval",
    score: 42,
    pass: true,
    dimensions: { clarity: 42 },
    details: { policy: policy?.id, mode },
  });
  const engine = createReplayEngine();
  const run = engine.replayRun("fresh", {
    fixtures,
    policy: { id: "p1" },
    evaluate,
  });
  assert.equal(run.results[0].id, "custom-eval");
  assert.equal(run.results[0].score, 42);
  assert.equal(run.results[0].dimensions.clarity, 42);
});

test("compareRuns detects score changes between runs", () => {
  const runA = {
    mode: "repair",
    results: [{ id: "f1", score: 70, pass: true }, { id: "f2", score: 80, pass: true }],
  };
  const runB = {
    mode: "fresh",
    results: [{ id: "f1", score: 65, pass: true }, { id: "f2", score: 90, pass: true }],
  };
  const engine = createReplayEngine();
  const diff = engine.compareRuns(runA, runB);
  assert.equal(diff.scoreDelta, -5 + 10);
  const scoreChanges = diff.diff.filter((d) => d.kind === "score-change");
  assert.equal(scoreChanges.length, 2);
});

test("compareRuns detects pass/fail changes", () => {
  const runA = {
    mode: "repair",
    results: [{ id: "f1", score: 70, pass: true }],
  };
  const runB = {
    mode: "fresh",
    results: [{ id: "f1", score: 70, pass: false }],
  };
  const engine = createReplayEngine();
  const diff = engine.compareRuns(runA, runB);
  const passChanges = diff.diff.filter((d) => d.kind === "pass-change");
  assert.equal(passChanges.length, 1);
});

test("compareRuns handles different result lengths", () => {
  const runA = { results: [{ id: "f1", score: 70, pass: true }] };
  const runB = { results: [{ id: "f1", score: 70, pass: true }, { id: "f2", score: 80, pass: true }] };
  const engine = createReplayEngine();
  const diff = engine.compareRuns(runA, runB);
  const added = diff.diff.filter((d) => d.kind === "added");
  assert.ok(added.length > 0);
});

test("isRegression detects pass regression", () => {
  const engine = createReplayEngine();
  const current = { id: "f1", score: 70, pass: false };
  const baseline = { id: "f1", score: 70, pass: true };
  assert.equal(engine.isRegression(current, baseline, 0.05), true);
});

test("isRegression returns false when no regression", () => {
  const engine = createReplayEngine();
  const current = { id: "f1", score: 75, pass: true };
  const baseline = { id: "f1", score: 70, pass: true };
  assert.equal(engine.isRegression(current, baseline, 0.05), false);
});

test("isRegression detects score regression beyond tolerance", () => {
  const engine = createReplayEngine();
  const current = { id: "f1", score: 60, pass: true };
  const baseline = { id: "f1", score: 100, pass: true };
  assert.equal(engine.isRegression(current, baseline, 0.05), true);
});

test("detectRegressions catches pass regressions against previous run", () => {
  const results = [{ id: "f1", score: 70, pass: false }];
  const previousRun = { results: [{ id: "f1", score: 70, pass: true }] };
  const flags = detectRegressions(results, previousRun, 0.05);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].kind, "pass-regression");
});

test("detectRegressions catches score regressions", () => {
  const results = [{ id: "f1", score: 50, pass: true }];
  const previousRun = { results: [{ id: "f1", score: 100, pass: true }] };
  const flags = detectRegressions(results, previousRun, 0.05);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].kind, "score-regression");
});

test("detectRegressions defaults to a five-percent score tolerance", () => {
  const results = [{ id: "f1", score: 50, pass: true }];
  const previousRun = { results: [{ id: "f1", score: 100, pass: true }] };
  const flags = detectRegressions(results, previousRun);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].kind, "score-regression");
});

test("detectRegressions returns empty when no previous run", () => {
  const results = [{ id: "f1", score: 50, pass: true }];
  const flags = detectRegressions(results, null, 0.05);
  assert.equal(flags.length, 0);
});

test("replayRun with regression detection uses previousRun", () => {
  const fixtures = [
    { id: "f1", score: 45, pass: false },
  ];
  const previousRun = {
    results: [{ id: "f1", score: 80, pass: true }],
  };
  const engine = createReplayEngine();
  const run = engine.replayRun("repair", {
    fixtures,
    policy: { id: "p1" },
    previousRun,
  });
  assert.ok(run.regressionFlags.length > 0);
  assert.equal(run.summary.regressions, 2);
});

test("all five replay modes can be executed", () => {
  const fixtures = [{ id: "f1", score: 70, pass: true }];
  const engine = createReplayEngine();
  for (const mode of REPLAY_MODES) {
    const run = engine.replayRun(mode, { fixtures, policy: { id: "p1" } });
    assert.equal(run.mode, mode);
    assert.equal(run.results.length, 1);
    assert.ok(run.timestamp);
    assert.ok(run.inputHash);
  }
});

test("replayRun with store calls store.save", () => {
  let saved = null;
  const store = { save: (run) => { saved = run; } };
  const engine = createReplayEngine({ store });
  engine.replayRun("fresh", {
    fixtures: [{ id: "f1", score: 70, pass: true }],
    policy: { id: "p1" },
  });
  assert.ok(saved);
  assert.equal(saved.mode, "fresh");
});

test("replayRun with logger calls logger.info", () => {
  let logged = null;
  const logger = { info: (msg, data) => { logged = { msg, data }; } };
  const engine = createReplayEngine({ logger });
  engine.replayRun("fresh", {
    fixtures: [{ id: "f1", score: 70, pass: true }],
    policy: { id: "p1" },
  });
  assert.ok(logged);
  assert.ok(logged.msg.includes("replayRun"));
});

test("compareRuns handles null inputs", () => {
  const engine = createReplayEngine();
  const diff = engine.compareRuns(null, null);
  assert.equal(diff.diff.length, 0);
  assert.equal(diff.scoreDelta, 0);
});

test("isRegression returns false for null inputs", () => {
  const engine = createReplayEngine();
  assert.equal(engine.isRegression(null, null), false);
});

test("_getRuns returns all recorded runs", () => {
  const engine = createReplayEngine();
  engine.replayRun("fresh", {
    fixtures: [{ id: "f1", score: 70, pass: true }],
    policy: { id: "p1" },
  });
  engine.replayRun("holdout", {
    fixtures: [{ id: "f2", score: 80, pass: true }],
    policy: { id: "p1" },
  });
  const runs = engine._getRuns();
  assert.equal(runs.length, 2);
  assert.equal(runs[0].mode, "fresh");
  assert.equal(runs[1].mode, "holdout");
});
