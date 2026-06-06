const { readdir, readFile, access } = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

const KDNA_DIR = path.join(os.homedir(), ".kdna");

function validateDomain(data, fileName) {
  if (!data || typeof data !== "object") {
    throw new Error(`Invalid domain ${fileName}: must be an object`);
  }
  if (!data.id || !data.schemaVersion) {
    throw new Error(`Invalid domain ${fileName}: missing id or schemaVersion`);
  }
  return data;
}

function validatePersona(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid persona: must be an object");
  if (!data.id || !data.schemaVersion) throw new Error("Invalid persona: missing id or schemaVersion");
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
        return { ...defaults[fileName], _source: { type: "builtin-fallback", id: fileName } };
      }
      throw err.code === "ENOENT"
        ? new Error(`Domain ${fileName} not found in ${dir} and no fallback available`)
        : err;
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
        return { ...personaDefaults[personaId], _source: { type: "builtin-fallback", id: personaId } };
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
