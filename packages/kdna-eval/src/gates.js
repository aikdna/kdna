const GATE_NAMES = ["route", "compose", "projection", "cost", "quality", "promotion"];

function createMultiGateRunner(gates) {
  const gateList = gates ?? GATE_NAMES;

  function runGate(gate, context) {
    if (typeof gate === "function") {
      try {
        return gate(context);
      } catch (e) {
        return {
          gate: gate.name || "anonymous",
          pass: false,
          score: 0,
          details: {},
          errors: [e.message],
        };
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
