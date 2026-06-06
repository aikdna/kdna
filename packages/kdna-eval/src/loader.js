const { readdir, readFile, access } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

const KDNA_DIR = path.join(os.homedir(), ".kdna");
const { STORYCUT_DEFAULTS } = require("./defaults/domains");
const { DEFAULT_PERSONAS } = require("./defaults/personas");

const PKG_NAME = "@aikdna/kdna-eval";
const PKG_VERSION = "0.1.0";

function validateDomain(data, fileName) {
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid KDNA domain ${fileName}: must be an object`);
  }
  if (!data.id || !data.schemaVersion) {
    throw new Error(`Invalid KDNA domain ${fileName}: missing id or schemaVersion`);
  }
  return data;
}

function validatePersona(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid KDNA persona: must be an object");
  if (!data.id || !data.schemaVersion) throw new Error("Invalid KDNA persona: missing id or schemaVersion");
  return data;
}

function fallbackProvenance(fileName) {
  return {
    type: "builtin-fallback",
    package: PKG_NAME,
    version: PKG_VERSION,
    id: fileName
  };
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
  const domainDefaults = defaults ?? STORYCUT_DEFAULTS;
  const filePath = path.join(dir, fileName);
  return readFile(filePath, "utf8")
    .then((text) => {
      const parsed = JSON.parse(text);
      const domain = validateDomain(parsed, fileName);
      domain._source = { type: "flat-file", path: filePath };
      return domain;
    })
    .catch((err) => {
      if (err.code === "ENOENT") {
        const fallback = domainDefaults[fileName];
        if (fallback) {
          return {
            ...fallback,
            _source: fallbackProvenance(fileName)
          };
        }
        throw new Error(`KDNA domain ${fileName} not found in ${dir} and no default available`);
      }
      throw err;
    });
}
const loadDomainFromFile = loadFlatDomainFromFile;

function loadFlatDomainFromData(data, fileName) {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  const domain = validateDomain(parsed, fileName ?? parsed.id ?? "programmatic");
  domain._source = domain._source ?? { type: "programmatic" };
  return domain;
}
const loadDomainFromData = loadFlatDomainFromData;

function loadFlatDomains(domainNames, options) {
  const { kdnaDir, defaults } = options ?? {};
  const domainDefaults = defaults ?? STORYCUT_DEFAULTS;

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
  const personaDefaults = defaults ?? DEFAULT_PERSONAS;
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
  const personaDefaults = defaults ?? DEFAULT_PERSONAS;
  const filePath = path.join(personasDir, `${personaId}.json`);
  return readFile(filePath, "utf8")
    .then((text) => {
      const parsed = JSON.parse(text);
      const persona = validatePersona(parsed);
      persona._source = { type: "flat-file", path: filePath };
      return persona;
    })
    .catch((err) => {
      if (err.code === "ENOENT") {
        const fallback = personaDefaults[personaId];
        if (fallback) {
          return {
            ...fallback,
            _source: fallbackProvenance(personaId)
          };
        }
        throw new Error(`Persona ${personaId} not found in ${personasDir} and no default available`);
      }
      throw err;
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
  validatePersona,
  fallbackProvenance
};
