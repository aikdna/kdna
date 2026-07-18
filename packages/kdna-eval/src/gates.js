const GATE_NAMES = ["route", "compose", "projection", "cost", "quality", "promotion"];

function normalizeThrownValue(value) {
  try {
    const message = value instanceof Error ? value.message : String(value);
    return typeof message === "string" ? message : String(message);
  } catch (_) {
    return "unprintable thrown value";
  }
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function invalidGateResult(gate, errors) {
  return {
    gate,
    pass: false,
    score: 0,
    details: { status: "invalid_result" },
    errors,
  };
}

function gateName(gate) {
  try {
    return typeof gate.name === "string" && gate.name.trim().length > 0 ? gate.name : "anonymous";
  } catch (_) {
    return "anonymous";
  }
}

function normalizeGateResult(result, fallbackGate) {
  const errors = [];
  if (!isPlainObject(result)) {
    return invalidGateResult(fallbackGate, ["gate result must be a plain object"]);
  }
  if (typeof result.gate !== "string" || result.gate.trim().length === 0) {
    errors.push("gate result.gate must be a non-empty string");
  }
  if (![true, false, null].includes(result.pass)) {
    errors.push("gate result.pass must be true, false, or null");
  }
  if (result.score !== null &&
      (typeof result.score !== "number" || !Number.isFinite(result.score))) {
    errors.push("gate result.score must be a finite number or null");
  }
  if (!isPlainObject(result.details)) {
    errors.push("gate result.details must be a plain object");
  }
  if (!Array.isArray(result.errors) || result.errors.some((error) => typeof error !== "string")) {
    errors.push("gate result.errors must be a string array");
  }
  return errors.length ? invalidGateResult(fallbackGate, errors) : result;
}

function createMultiGateRunner(gates) {
  const gateList = gates ?? GATE_NAMES;

  function runGate(gate, context) {
    if (typeof gate === "function") {
      const name = gateName(gate);
      try {
        return normalizeGateResult(gate(context), name);
      } catch (e) {
        const message = normalizeThrownValue(e);
        return invalidGateResult(name, [message]);
      }
    }

    if (typeof gate === "string") {
      return {
        gate,
        pass: null,
        score: null,
        details: { note: `gate "${gate}" has no implementation registered` },
        errors: [],
      };
    }

    return {
      gate: "unknown",
      pass: false,
      score: 0,
      details: {},
      errors: ["invalid gate type"],
    };
  }

  function runGates(context) {
    const results = [];
    for (const g of gateList) {
      const result = runGate(g, context);
      results.push(result);
    }
    return results;
  }

  function runAll(context) {
    const results = runGates(context);
    return aggregateGates(results);
  }

  function hasGate(name) {
    return gateList.some((g) =>
      typeof g === "string" ? g === name : g.name === name
    );
  }

  return { runGates, runAll, hasGate };
}

function aggregateGates(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return {
      overall: "no-results",
      blocked_gates: [],
      passed_gates: [],
      failed_gates: [],
      result_count: 0,
      results: [],
    };
  }

  const blocked = [];
  const passed = [];
  const failed = [];

  for (const r of results) {
    if (r.pass === false) {
      failed.push(r.gate);
    } else if (r.pass === true) {
      passed.push(r.gate);
    } else {
      blocked.push(r.gate);
    }
  }

  return {
    overall: gateFromArray(results) ? "pass" : "fail",
    blocked_gates: blocked,
    passed_gates: passed,
    failed_gates: failed,
    result_count: results.length,
    results,
  };
}

function gateFromArray(results) {
  if (!Array.isArray(results) || results.length === 0) return false;
  return results.every((r) => r.pass === true);
}

module.exports = { createMultiGateRunner, aggregateGates, gateFromArray, GATE_NAMES };
