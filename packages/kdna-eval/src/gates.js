const { types: utilTypes } = require("node:util");

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

function invalidSafeData(path, reason) {
  return { valid: false, error: `${path} ${reason}` };
}

function cloneSafeData(value, path, ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return { valid: true, value };
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { valid: true, value }
      : invalidSafeData(path, "must be a finite number");
  }
  if (typeof value !== "object") {
    return invalidSafeData(path, `must not contain ${typeof value}`);
  }
  if (utilTypes.isProxy(value)) return invalidSafeData(path, "must not be a Proxy");
  if (ancestors.has(value)) return invalidSafeData(path, "must not contain a cycle");

  let prototype;
  let descriptors;
  let symbols;
  try {
    prototype = Object.getPrototypeOf(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
    symbols = Object.getOwnPropertySymbols(value);
  } catch (_) {
    return invalidSafeData(path, "could not be inspected safely");
  }
  if (symbols.length > 0) return invalidSafeData(path, "must not contain symbol keys");

  ancestors.add(value);
  if (Array.isArray(value)) {
    if (prototype !== Array.prototype) {
      ancestors.delete(value);
      return invalidSafeData(path, "must use the standard Array prototype");
    }
    const length = descriptors.length?.value;
    if (!Number.isInteger(length) || length < 0) {
      ancestors.delete(value);
      return invalidSafeData(path, "must have a valid array length");
    }
    const keys = Reflect.ownKeys(descriptors).filter((key) => key !== "length");
    if (
      keys.some(
        (key) =>
          typeof key !== "string" ||
          !/^\d+$/.test(key) ||
          String(Number(key)) !== key ||
          Number(key) >= length,
      )
    ) {
      ancestors.delete(value);
      return invalidSafeData(path, "must not contain named or out-of-range array properties");
    }

    const copy = [];
    for (let index = 0; index < length; index++) {
      const descriptor = descriptors[String(index)];
      if (!descriptor || !descriptor.enumerable || !("value" in descriptor)) {
        ancestors.delete(value);
        return invalidSafeData(`${path}[${index}]`, "must be an own enumerable data property");
      }
      const cloned = cloneSafeData(descriptor.value, `${path}[${index}]`, ancestors);
      if (!cloned.valid) {
        ancestors.delete(value);
        return cloned;
      }
      copy.push(cloned.value);
    }
    ancestors.delete(value);
    return { valid: true, value: copy };
  }

  if (prototype !== Object.prototype && prototype !== null) {
    ancestors.delete(value);
    return invalidSafeData(path, "must be a plain object without a custom prototype");
  }
  const copy = Object.create(prototype === null ? null : Object.prototype);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key];
    if (typeof key !== "string" || !descriptor.enumerable || !("value" in descriptor)) {
      ancestors.delete(value);
      return invalidSafeData(`${path}.${String(key)}`, "must be an own enumerable data property");
    }
    const cloned = cloneSafeData(descriptor.value, `${path}.${key}`, ancestors);
    if (!cloned.valid) {
      ancestors.delete(value);
      return cloned;
    }
    Object.defineProperty(copy, key, {
      value: cloned.value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  ancestors.delete(value);
  return { valid: true, value: copy };
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
  const cloned = cloneSafeData(result, "gate result");
  if (!cloned.valid) {
    return invalidGateResult(fallbackGate, [cloned.error]);
  }
  const safeResult = cloned.value;
  if (!isPlainObject(safeResult)) {
    return invalidGateResult(fallbackGate, ["gate result must be a plain object"]);
  }
  const requiredFields = ["gate", "pass", "score", "details", "errors"];
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(safeResult, field)) {
      errors.push(`gate result.${field} must be an own enumerable data property`);
    }
  }
  if (errors.length) return invalidGateResult(fallbackGate, errors);
  if (typeof safeResult.gate !== "string" || safeResult.gate.trim().length === 0) {
    errors.push("gate result.gate must be a non-empty string");
  }
  if (![true, false, null].includes(safeResult.pass)) {
    errors.push("gate result.pass must be true, false, or null");
  }
  if (
    safeResult.score !== null &&
    (typeof safeResult.score !== "number" || !Number.isFinite(safeResult.score))
  ) {
    errors.push("gate result.score must be a finite number or null");
  }
  if (!isPlainObject(safeResult.details)) {
    errors.push("gate result.details must be a plain object");
  }
  if (
    !Array.isArray(safeResult.errors) ||
    safeResult.errors.some((error) => typeof error !== "string")
  ) {
    errors.push("gate result.errors must be a string array");
  }
  return errors.length ? invalidGateResult(fallbackGate, errors) : safeResult;
}

function normalizeGateResults(results) {
  const normalized = [];
  for (let index = 0; index < results.length; index++) {
    normalized.push(normalizeGateResult(results[index], `gate-${index + 1}`));
  }
  return normalized;
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
  const normalizedResults = normalizeGateResults(results);

  for (const r of normalizedResults) {
    if (r.pass === false) {
      failed.push(r.gate);
    } else if (r.pass === true) {
      passed.push(r.gate);
    } else {
      blocked.push(r.gate);
    }
  }

  return {
    overall: normalizedResults.every((result) => result.pass === true) ? "pass" : "fail",
    blocked_gates: blocked,
    passed_gates: passed,
    failed_gates: failed,
    result_count: normalizedResults.length,
    results: normalizedResults,
  };
}

function gateFromArray(results) {
  if (!Array.isArray(results) || results.length === 0) return false;
  return normalizeGateResults(results).every((result) => result.pass === true);
}

module.exports = { createMultiGateRunner, aggregateGates, gateFromArray, GATE_NAMES };
