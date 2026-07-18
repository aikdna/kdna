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

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function invalidReplayResult(fallbackId, validationIssues) {
  return {
    id: fallbackId,
    pass: undefined,
    details: {
      status: "invalid_result",
      validation_issues: validationIssues,
    },
  };
}

function normalizeReplayResult(result, fallbackId) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    return invalidReplayResult(fallbackId, ["evaluator result must be a plain object"]);
  }

  const issues = [];
  const normalized = { ...result };
  if (!isNonEmptyString(result.id)) {
    issues.push("result.id must be a non-empty string");
    normalized.id = fallbackId;
  }
  if (result.score !== undefined &&
      (typeof result.score !== "number" || !Number.isFinite(result.score))) {
    issues.push("result.score must be a finite number when provided");
    delete normalized.score;
  }
  if (result.pass !== undefined && typeof result.pass !== "boolean") {
    issues.push("result.pass must be boolean when provided");
  }
  if (result.dimensions !== undefined &&
      (!result.dimensions || typeof result.dimensions !== "object" || Array.isArray(result.dimensions))) {
    issues.push("result.dimensions must be an object when provided");
    delete normalized.dimensions;
  }
  if (result.details !== undefined &&
      (!result.details || typeof result.details !== "object" || Array.isArray(result.details))) {
    issues.push("result.details must be an object when provided");
  }

  if (issues.length) {
    normalized.pass = undefined;
    normalized.details = {
      ...(result.details && typeof result.details === "object" && !Array.isArray(result.details)
        ? result.details
        : {}),
      status: "invalid_result",
      validation_issues: issues,
    };
  }
  return normalized;
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
        summary: { total: 0, passed: 0, failed: 0, incomplete: 0, regressions: 0 },
      };
    }

    const evaluate = params.evaluate || defaultEvaluate;

    for (const [index, fixture] of fixtures.entries()) {
      const fallbackId = `fixture-${inputHash}-${index + 1}`;
      let result;
      try {
        result = normalizeReplayResult(
          evaluate(fixture, policy, mode, previousRun, fallbackId),
          fallbackId,
        );
      } catch (error) {
        let message;
        try {
          message = error instanceof Error ? error.message : String(error);
        } catch (_) {
          message = "unprintable evaluator failure";
        }
        result = invalidReplayResult(fallbackId, [`evaluator failed: ${message}`]);
      }
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
        passed: results.filter((r) => r.pass === true).length,
        failed: results.filter((r) => r.pass !== true).length,
        incomplete: results.filter((r) => typeof r.pass !== "boolean").length,
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

function defaultEvaluate(fixture, policy, mode, previousRun, fallbackId) {
  const fixtureId = isNonEmptyString(fixture?.id) ? fixture.id : null;
  const inputId = isNonEmptyString(fixture?.input?.id) ? fixture.input.id : null;
  const id = fixtureId ?? inputId ?? fallbackId;
  const score = fixture?.score ?? fixture?.expected?.score ?? 50;
  const pass = typeof fixture?.pass === "boolean"
    ? fixture.pass
    : (typeof fixture?.expected?.pass === "boolean" ? fixture.expected.pass : undefined);

  return {
    id,
    score,
    pass,
    dimensions: fixture?.dimensions ?? {},
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
