const { readdir, readFile, access } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

const KDNA_DIR = path.join(os.homedir(), ".kdna");
const { STORYCUT_DEFAULTS } = require("./defaults/domains");
const { DEFAULT_PERSONAS } = require("./defaults/personas");

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
  if (!data || typeof data !== "object") {
    throw new Error("Invalid KDNA persona: must be an object");
  }
  if (!data.id || !data.schemaVersion) {
    throw new Error("Invalid KDNA persona: missing id or schemaVersion");
  }
  return data;
}

function listDomains(kdnaDir) {
  const dir = kdnaDir ?? KDNA_DIR;
  return access(dir)
    .then(() => readdir(dir, { withFileTypes: true }))
    .then((entries) =>
      entries
        .filter((e) => e.isFile() && e.name.endsWith(".kdna"))
        .map((e) => e.name)
    )
    .catch(() => []);
}

function loadDomainFromFile(fileName, kdnaDir, defaults) {
  const dir = kdnaDir ?? KDNA_DIR;
  const domainDefaults = defaults ?? STORYCUT_DEFAULTS;
  const filePath = path.join(dir, fileName);

  return readFile(filePath, "utf8")
    .then((text) => {
      const parsed = JSON.parse(text);
      return validateDomain(parsed, fileName);
    })
    .catch((err) => {
      if (err.code === "ENOENT") {
        const fallback = domainDefaults[fileName];
        if (fallback) return { ...fallback, _fallback: true };
        throw new Error(
          `KDNA domain ${fileName} not found in ${dir} and no default available`
        );
      }
      throw new Error(`Failed to load KDNA domain ${fileName}: ${err.message}`);
    });
}

function loadDomainFromData(data, fileName) {
  const parsed = typeof data === "string" ? JSON.parse(data) : data;
  return validateDomain(parsed, fileName ?? parsed.id ?? "programmatic");
}

function loadDomains(domainNames, options) {
  const { kdnaDir, defaults } = options ?? {};
  const loaded = [];
  const skipped = [];

  return Promise.all(
    domainNames.map((name) =>
      loadDomainFromFile(name, kdnaDir, defaults)
        .then((domain) => {
          loaded.push({ id: domain.id, data: domain });
        })
        .catch((err) => {
          skipped.push({ id: name, reason: err.message });
        })
    )
  ).then(() => ({ loaded, skipped }));
}

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
      const builtinIds = Object.keys(personaDefaults).filter(
        (id) => !fileIds.includes(id)
      );
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
      return validatePersona(parsed);
    })
    .catch((err) => {
      if (err.code === "ENOENT") {
        const fallback = personaDefaults[personaId];
        if (fallback) return { ...fallback, _fallback: true };
        throw new Error(
          `Persona ${personaId} not found in ${personasDir} and no default available`
        );
      }
      throw new Error(`Failed to load persona ${personaId}: ${err.message}`);
    });
}

module.exports = {
  KDNA_DIR,
  listDomains,
  loadDomainFromFile,
  loadDomainFromData,
  loadDomains,
  listPersonas,
  loadPersona,
  validateDomain,
  validatePersona
};
