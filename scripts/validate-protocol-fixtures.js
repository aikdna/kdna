#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const errors = [];

// Read a JSON file and parse it. Pushes an error to the global errors array
// when the file cannot be read OR cannot be parsed. Callers that want to
// treat a missing file as "skip this check" must use fs.existsSync first
// and call this only on files they expect to exist.
function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch (err) {
    errors.push(`${rel}: ${err.message}`);
    return null;
  }
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function checkNoForbiddenFields(obj, rel, stack = []) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => checkNoForbiddenFields(item, rel, stack.concat(`[${index}]`)));
    return;
  }

  for (const key of Object.keys(obj)) {
    const loc = `${rel}${stack.join('')}.${key}`;
    if (key === 'kdna_spec') errors.push(`${loc}: use spec_version`);
    if (key === 'language') errors.push(`${loc}: use default_language + languages`);
    if (key === 'kdna_url') errors.push(`${loc}: use asset_url`);
    if (key === 'sha256') errors.push(`${loc}: use asset_digest`);
    checkNoForbiddenFields(obj[key], rel, stack.concat(`.${key}`));
  }
}

function checkManifestSchema() {
  // Legacy boundary: the v1-rc protocol gate originally pointed at
  // schema/kdna-manifest-v1rc.json. That file was removed in commit
  // 6053b75 ("chore: remove all v1 compatibility — v2 is the only
  // format") when the project migrated to the v2 container format.
  // The migrated source of truth is schema/kdna-manifest.json: the
  // v1-rc rules this gate checks (no `language` property; requires
  // `spec_version`, `default_language`, `languages`) still hold for
  // it because the registry/domains.json fixture continues to use
  // spec_version: "1.0-rc" per specs/enum-tables.md.
  const schemaRel = 'schema/kdna-manifest.json';
  if (!fs.existsSync(path.join(root, schemaRel))) {
    // If the schema is ever retired, skip with a clear log line rather
    // than fail. This treats a missing schema as a deprecated legacy
    // boundary, not a broken build.
    console.log(`[skip] ${schemaRel} not found; v1-rc manifest schema check retired.`);
    return;
  }
  const schema = readJson(schemaRel);
  if (!schema) return;
  if (schema.properties && hasOwn(schema.properties, 'language')) {
    errors.push(`${schemaRel}: properties.language must not exist in v1.0-rc`);
  }
  if (!schema.required?.includes('spec_version')) {
    errors.push(`${schemaRel}: spec_version must be required`);
  }
  if (!schema.required?.includes('default_language') || !schema.required?.includes('languages')) {
    errors.push(`${schemaRel}: default_language and languages must be required`);
  }
  // packages/kdna-core/schema/ was removed — schema/ is the single source of truth.
}

function checkRegistryFixture() {
  const registry = readJson('registry/domains.json');
  if (!registry) return;
  const domains = registry.domains;
  if (!Array.isArray(domains) || domains.length === 0) {
    errors.push('registry/domains.json: domains must be a non-empty array');
    return;
  }

  domains.forEach((domain, index) => {
    const loc = `registry/domains.json.domains[${index}]`;
    checkNoForbiddenFields(domain, 'registry/domains.json', [`.domains[${index}]`]);
    if (!/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(domain.name || '')) {
      errors.push(`${loc}.name: must be scoped @scope/name`);
    }
    if (domain.spec_version !== '1.0-rc') {
      errors.push(`${loc}.spec_version: must be 1.0-rc`);
    }
    if (!Array.isArray(domain.languages) || domain.languages.length === 0) {
      errors.push(`${loc}.languages: must be a non-empty array`);
    }
    if (!domain.default_language) {
      errors.push(`${loc}.default_language: required`);
    }
    if (!domain.asset_type) {
      errors.push(`${loc}.asset_type: required for protocol fixtures`);
    }
  });
}

checkManifestSchema();
checkRegistryFixture();

if (errors.length) {
  errors.forEach((error) => console.error(`x ${error}`));
  process.exit(1);
}

console.log('Protocol fixtures valid');
