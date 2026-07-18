const crypto = require("node:crypto");

const VOLATILE_FIXTURE_FIELDS = new Set(["created_at", "task_hash"]);

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function canonicalValidationErrors(value, rootPath = "value") {
  const errors = [];
  const ancestors = new Set();

  function visit(current, currentPath) {
    if (current === null || typeof current === "string" || typeof current === "boolean") return;
    if (typeof current === "number") {
      if (!Number.isFinite(current)) errors.push(`${currentPath} must contain only finite numbers`);
      return;
    }
    if (["undefined", "function", "symbol", "bigint"].includes(typeof current)) {
      errors.push(`${currentPath} contains unsupported ${typeof current} evidence`);
      return;
    }
    if (ancestors.has(current)) {
      errors.push(`${currentPath} contains a cycle`);
      return;
    }
    if (!Array.isArray(current) && !isPlainObject(current)) {
      errors.push(`${currentPath} must contain only arrays and plain objects`);
      return;
    }

    const symbols = Object.getOwnPropertySymbols(current);
    if (symbols.length > 0) errors.push(`${currentPath} must not contain symbol keys`);
    const descriptors = Object.getOwnPropertyDescriptors(current);
    const accessorKeys = new Set();
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (Array.isArray(current) && key === "length") continue;
      if (Array.isArray(current) &&
          (!/^\d+$/.test(key) || String(Number(key)) !== key || Number(key) >= current.length)) {
        errors.push(`${currentPath}.${key} is an unsupported named array property`);
      }
      if (!descriptor.enumerable) errors.push(`${currentPath}.${key} must be enumerable`);
      if (descriptor.get || descriptor.set) {
        errors.push(`${currentPath}.${key} must not be an accessor`);
        accessorKeys.add(key);
      }
    }

    ancestors.add(current);
    if (Array.isArray(current)) {
      for (let index = 0; index < current.length; index++) {
        if (!Object.prototype.hasOwnProperty.call(current, index)) {
          errors.push(`${currentPath}[${index}] must not be a sparse array entry`);
        } else if (!accessorKeys.has(String(index))) {
          visit(current[index], `${currentPath}[${index}]`);
        }
      }
    } else {
      for (const key of Object.keys(current)) {
        if (!accessorKeys.has(key)) visit(current[key], `${currentPath}.${key}`);
      }
    }
    ancestors.delete(current);
  }

  visit(value, rootPath);
  return errors;
}

function canonicalStringify(value) {
  const errors = canonicalValidationErrors(value);
  if (errors.length) throw new TypeError(`Evidence is not canonical JSON: ${errors.join("; ")}`);

  function encode(current) {
    if (current === null || typeof current !== "object") return JSON.stringify(current);
    if (Array.isArray(current)) return `[${current.map(encode).join(",")}]`;
    return `{${Object.keys(current).sort().map(key => `${JSON.stringify(key)}:${encode(current[key])}`).join(",")}}`;
  }

  return encode(value);
}

function fixtureEvidenceRecord(fixture) {
  if (!isPlainObject(fixture)) return fixture;
  return Object.fromEntries(
    Object.entries(fixture).filter(([key]) => !VOLATILE_FIXTURE_FIELDS.has(key)),
  );
}

function fingerprintFixtureDataset(fixtures, namespace) {
  const evidence = {
    namespace,
    fixtures: fixtures.map(fixtureEvidenceRecord),
  };
  return `sha256:${crypto.createHash("sha256").update(canonicalStringify(evidence)).digest("hex").slice(0, 32)}`;
}

function fingerprintInvalidDataset(errors, namespace) {
  return `sha256:${crypto.createHash("sha256").update(canonicalStringify({ namespace, invalid: true, errors })).digest("hex").slice(0, 32)}`;
}

module.exports = {
  canonicalValidationErrors,
  fingerprintFixtureDataset,
  fingerprintInvalidDataset,
  isPlainObject,
};
