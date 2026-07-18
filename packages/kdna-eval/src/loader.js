const { readdir, readFile, access } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

const KDNA_DIR = path.join(os.homedir(), ".kdna");

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function failValidation(label, message) {
  throw new Error(`Invalid ${label}: ${message}`);
}

function validateOptionalSource(source, label) {
  if (source === undefined) return;
  if (!isRecord(source)) failValidation(label, "_source must be an object");
  if (typeof source.type !== "string" || source.type.length === 0) {
    failValidation(label, "_source.type must be a non-empty string");
  }
  for (const field of ["path", "id"]) {
    if (source[field] !== undefined && typeof source[field] !== "string") {
      failValidation(label, `_source.${field} must be a string`);
    }
  }
}

function validateOptionalRecord(value, field, label) {
  if (value !== undefined && !isRecord(value)) {
    failValidation(label, `${field} must be an object`);
  }
}

function validateFiniteNumber(value, field, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    failValidation(label, `${field} must be a finite number`);
  }
}

function validateScoringRule(rule, field, label) {
  if (!isRecord(rule)) failValidation(label, `${field} must be an object`);
  if (typeof rule.id !== "string") failValidation(label, `${field}.id must be a string`);
  if (!Array.isArray(rule.dimensions) || !rule.dimensions.every((item) => typeof item === "string")) {
    failValidation(label, `${field}.dimensions must be an array of strings`);
  }
  if (!isRecord(rule.condition)) failValidation(label, `${field}.condition must be an object`);
  if (typeof rule.condition.path !== "string") {
    failValidation(label, `${field}.condition.path must be a string`);
  }
  if (!["eq", "gt", "gte", "lt", "lte", "between"].includes(rule.condition.op)) {
    failValidation(label, `${field}.condition.op is invalid`);
  }
  for (const conditionField of ["min", "max"]) {
    if (rule.condition[conditionField] !== undefined) {
      validateFiniteNumber(rule.condition[conditionField], `${field}.condition.${conditionField}`, label);
    }
  }
  if (!isRecord(rule.effect)) failValidation(label, `${field}.effect must be an object`);
  validateFiniteNumber(rule.effect.value, `${field}.effect.value`, label);
  if (rule.effect.multiplyBy !== undefined && typeof rule.effect.multiplyBy !== "string") {
    failValidation(label, `${field}.effect.multiplyBy must be a string`);
  }
  if (rule.effect.clamp !== undefined) {
    if (!isRecord(rule.effect.clamp)) {
      failValidation(label, `${field}.effect.clamp must be an object`);
    }
    for (const clampField of ["min", "max"]) {
      if (rule.effect.clamp[clampField] !== undefined) {
        validateFiniteNumber(
          rule.effect.clamp[clampField],
          `${field}.effect.clamp.${clampField}`,
          label,
        );
      }
    }
  }
}

function validateOptionalRules(rules, field, label) {
  if (rules === undefined) return;
  if (!Array.isArray(rules)) failValidation(label, `${field} must be an array`);
  rules.forEach((rule, index) => validateScoringRule(rule, `${field}[${index}]`, label));
}

function validateDomain(data, fileName) {
  const label = `domain ${fileName ?? "programmatic"}`;
  if (!isRecord(data)) {
    failValidation(label, "must be an object");
  }
  if (typeof data.id !== "string" || data.id.length === 0) {
    failValidation(label, "id must be a non-empty string");
  }
  validateFiniteNumber(data.schemaVersion, "schemaVersion", label);

  if (data.x_eval !== undefined) {
    if (!isRecord(data.x_eval)) failValidation(label, "x_eval must be an object");
    validateOptionalRules(data.x_eval.rules, "x_eval.rules", label);
    validateOptionalRecord(data.x_eval.thresholds, "x_eval.thresholds", label);
  }
  validateOptionalRules(data.axioms, "axioms", label);
  validateOptionalRecord(data.thresholds, "thresholds", label);
  validateOptionalSource(data._source, label);
  return data;
}

function validatePersona(data) {
  const label = "persona";
  if (!isRecord(data)) failValidation(label, "must be an object");
  for (const field of ["id", "name"]) {
    if (typeof data[field] !== "string" || data[field].length === 0) {
      failValidation(label, `${field} must be a non-empty string`);
    }
  }
  if (typeof data.description !== "string") {
    failValidation(label, "description must be a string");
  }
  validateFiniteNumber(data.schemaVersion, "schemaVersion", label);
  if (!isRecord(data.ruleOfSix)) failValidation(label, "ruleOfSix must be an object");
  for (const [field, value] of Object.entries(data.ruleOfSix)) {
    validateFiniteNumber(value, `ruleOfSix.${field}`, label);
  }
  if (!Array.isArray(data.domains)) failValidation(label, "domains must be an array");
  data.domains.forEach((domain, index) => {
    if (!isRecord(domain)) failValidation(label, `domains[${index}] must be an object`);
    if (typeof domain.id !== "string" || domain.id.length === 0) {
      failValidation(label, `domains[${index}].id must be a non-empty string`);
    }
    validateFiniteNumber(domain.weight, `domains[${index}].weight`, label);
  });
  if (!isRecord(data.preferences)) failValidation(label, "preferences must be an object");
  validateOptionalSource(data._source, label);
  return data;
}

function listDomains(kdnaDir) {
  const dir = kdnaDir ?? KDNA_DIR;
  const extensions = [".kdna", ".json"];
  return access(dir)
    .then(() => readdir(dir, { withFileTypes: true }))
    .then((entries) =>
      entries
        .filter((e) => e.isFile() && extensions.some((ext) => e.name.endsWith(ext)))
        .map((e) => e.name)
    )
    .catch(() => []);
}

function loadFlatDomainFromFile(fileName, kdnaDir, defaults) {
  const dir = kdnaDir ?? KDNA_DIR;
  const filePath = path.join(dir, fileName);
  return readFile(filePath, "utf8")
    .then((text) => {
      const parsed = JSON.parse(text);
      const domain = validateDomain(parsed, fileName);
      domain._source = { type: "flat-file", path: filePath };
      return domain;
    })
    .catch((err) => {
      if (err.code === "ENOENT" && defaults?.[fileName]) {
        const domain = validateDomain(defaults[fileName], fileName);
        return { ...domain, _source: { type: "builtin-fallback", id: fileName } };
      }
      throw err.code === "ENOENT"
        ? new Error(`Domain ${fileName} not found in ${dir} and no fallback available`)
        : err;
    });
}
const loadDomainFromFile = loadFlatDomainFromFile;

function loadFlatDomainFromData(data, fileName) {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  const parsedId = isRecord(parsed) ? parsed.id : undefined;
  const domain = validateDomain(parsed, fileName ?? parsedId ?? "programmatic");
  domain._source = domain._source ?? { type: "programmatic" };
  return domain;
}
const loadDomainFromData = loadFlatDomainFromData;

function loadFlatDomains(domainNames, options) {
  const { kdnaDir, defaults } = options ?? {};
  const domainDefaults = defaults ?? {};

  const results = domainNames.map((name) =>
    loadFlatDomainFromFile(name, kdnaDir, domainDefaults)
      .then((domain) => ({ ok: true, id: domain.id, data: domain }))
      .catch((err) => ({ ok: false, id: name, reason: err.message }))
  );

  return Promise.all(results).then((items) => {
    const loaded = items.filter((r) => r.ok).map((r) => ({ id: r.id, data: r.data }));
    const skipped = items.filter((r) => !r.ok).map((r) => ({ id: r.id, reason: r.reason }));
    return { loaded, skipped };
  });
}
const loadDomains = loadFlatDomains;

function listPersonas(kdnaDir, defaults) {
  const dir = kdnaDir ?? KDNA_DIR;
  const personasDir = path.join(dir, "personas");
  const personaDefaults = defaults ?? {};
  return access(personasDir)
    .then(() => readdir(personasDir, { withFileTypes: true }))
    .then((entries) => {
      const fileIds = entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map((e) => e.name.replace(/\.json$/, ""));
      const builtinIds = Object.keys(personaDefaults).filter((id) => !fileIds.includes(id));
      return [...fileIds, ...builtinIds];
    })
    .catch(() => Object.keys(personaDefaults));
}

function loadPersona(personaId, options) {
  const { kdnaDir, defaults } = options ?? {};
  const dir = kdnaDir ?? KDNA_DIR;
  const personasDir = path.join(dir, "personas");
  const personaDefaults = defaults ?? {};
  const filePath = path.join(personasDir, `${personaId}.json`);
  return readFile(filePath, "utf8")
    .then((text) => {
      const parsed = JSON.parse(text);
      const persona = validatePersona(parsed);
      persona._source = { type: "flat-file", path: filePath };
      return persona;
    })
    .catch((err) => {
      if (err.code === "ENOENT" && personaDefaults[personaId]) {
        const persona = validatePersona(personaDefaults[personaId]);
        return { ...persona, _source: { type: "builtin-fallback", id: personaId } };
      }
      throw err.code === "ENOENT"
        ? new Error(`Persona ${personaId} not found in ${personasDir} and no fallback available`)
        : err;
    });
}

module.exports = {
  KDNA_DIR,
  listDomains,
  loadFlatDomainFromFile,
  loadFlatDomainFromData,
  loadFlatDomains,
  loadDomainFromFile,
  loadDomainFromData,
  loadDomains,
  listPersonas,
  loadPersona,
  validateDomain,
  validatePersona
};
