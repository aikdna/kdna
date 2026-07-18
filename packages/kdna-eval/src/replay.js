const crypto = require("node:crypto");

const REPLAY_MODES = [
  "repair",
  "holdout",
  "fresh",
  "candidate-sealed",
  "new-sealed",
];

function hashInput(input) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex")
    .slice(0, 16);
}

function createReplayEngine(options) {
  const { store, logger } = options ?? {};
  const runs = [];

  function replayRun(mode, params) {
    if (!REPLAY_MODES.includes(mode)) {
      throw new Error(`Unknown replay mode: ${mode}. Valid: ${REPLAY_MODES.join(", ")}`);
    }

    const { policy, fixtures, previousRun } = params ?? {};
    const inputHash = hashInput({ mode, policy, fixtures });
    const timestamp = new Date().toISOString();
    const results = [];

    if (!fixtures || !Array.isArray(fixtures) || fixtures.length === 0) {
      return {
        mode,
        timestamp,
        inputHash,
        results: [],
        regressionFlags: [],
        summary: { total: 0, passed: 0, failed: 0, regressions: 0 },
      };
    }

    const evaluate = params.evaluate || defaultEvaluate;

    for (const fixture of fixtures) {
      const result = evaluate(fixture, policy, mode, previousRun);
      results.push(result);
    }

    const regressionFlags = detectRegressions(results, previousRun, 0.05);

    const run = {
      mode,
      timestamp,
      inputHash,
      results,
      regressionFlags,
      summary: {
        total: results.length,
        passed: results.filter((r) => r.pass !== false).length,
        failed: results.filter((r) => r.pass === false).length,
        regressions: regressionFlags.length,
      },
    };

    runs.push(run);

    if (store && typeof store.save === "function") {
      try {
        store.save(run);
      } catch (_) {}
    }

    if (logger && typeof logger.info === "function") {
      try {
        logger.info("replayRun complete", {
          mode,
          total: run.summary.total,
          regressions: run.summary.regressions,
        });
      } catch (_) {}
    }

    return run;
  }

  function compareRuns(runA, runB) {
    if (!runA || !runB) return { diff: [], scoreDelta: 0 };

    const diff = [];
    let scoreDelta = 0;
    const maxLen = Math.max(runA.results.length, runB.results.length);

    for (let i = 0; i < maxLen; i++) {
      const a = runA.results[i];
      const b = runB.results[i];
      if (!a && !b) continue;
      if (!a) {
        diff.push({ index: i, kind: "added", a: null, b });
        continue;
      }
      if (!b) {
        diff.push({ index: i, kind: "removed", a, b: null });
        continue;
      }
      const delta = (b.score ?? 0) - (a.score ?? 0);
      scoreDelta += delta;
      if (Math.abs(delta) > 0.001) {
        diff.push({ index: i, kind: "score-change", a, b, delta });
      }
      if (a.pass !== b.pass) {
        diff.push({ index: i, kind: "pass-change", a, b });
      }
    }

    return { diff, scoreDelta };
  }

  function isRegression(current, baseline, tolerance) {
    const t = tolerance ?? 0.05;
    if (!current || !baseline) return false;
    if (current.pass === false && baseline.pass !== false) return true;
    if (current.score != null && baseline.score != null) {
      return current.score < baseline.score - t * baseline.score;
    }
    return false;
  }

  function _getRuns() {
    return runs.slice();
  }

  return { replayRun, compareRuns, isRegression, _getRuns };
}

function defaultEvaluate(fixture, policy, mode, previousRun) {
  const id = fixture.id ?? fixture.input?.id ?? `fixture-${Math.random().toString(36).slice(2, 7)}`;
  const score = fixture.score ?? fixture.expected?.score ?? 50;
  const pass = fixture.pass ?? fixture.expected?.pass ?? true;

  return {
    id,
    score,
    pass,
    dimensions: fixture.dimensions ?? {},
    details: { policy: policy?.id ?? null, mode },
  };
}

function detectRegressions(results, previousRun, tolerance = 0.05) {
  const flags = [];
  if (!previousRun || !previousRun.results) return flags;

  const prevMap = new Map();
  for (const r of previousRun.results) {
    prevMap.set(r.id, r);
  }

  for (const r of results) {
    const prev = prevMap.get(r.id);
    if (!prev) continue;
    if (r.pass === false && prev.pass !== false) {
      flags.push({ id: r.id, kind: "pass-regression", current: r.pass, previous: prev.pass });
    }
    if (r.score != null && prev.score != null) {
      if (r.score < prev.score - tolerance * prev.score) {
        flags.push({
          id: r.id,
          kind: "score-regression",
          current: r.score,
          previous: prev.score,
          delta: r.score - prev.score,
        });
      }
    }
  }

  return flags;
}

module.exports = {
  createReplayEngine,
  REPLAY_MODES,
  hashInput,
  detectRegressions,
};
