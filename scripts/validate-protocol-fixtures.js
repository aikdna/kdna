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
  // Single-format boundary: schema/manifest.schema.json is the authoritative
  // Runtime kdna.json schema. schema/kdna-manifest.json is a legacy authoring
  // schema and must never decide Runtime acceptance.
  const schemaRel = 'schema/manifest.schema.json';
  if (!fs.existsSync(path.join(root, schemaRel))) {
    console.log(`[skip] ${schemaRel} not found; manifest schema check retired.`);
    return;
  }
  const schema = readJson(schemaRel);
  if (!schema) return;
  if (!schema.properties || !hasOwn(schema.properties, 'language')) {
    errors.push(`${schemaRel}: properties.language must remain available`);
  }
  if (!schema.required?.includes('kdna_version')) {
    errors.push(`${schemaRel}: kdna_version must be required`);
  }
  if (schema.required?.includes('format_version')) {
    errors.push(`${schemaRel}: format_version must not be required`);
  }
  if (schema.required?.includes('creator')) {
    errors.push(`${schemaRel}: creator provenance must remain optional`);
  }
  for (const field of ['asset_id', 'asset_uid', 'asset_type', 'title', 'compatibility', 'payload']) {
    if (!schema.required?.includes(field)) errors.push(`${schemaRel}: ${field} must be required`);
  }
}

function checkRegistryFixture() {
  const registry = readJson('registry/domains.json');
  if (!registry) return;
  const domains = registry.domains;
  if (!Array.isArray(domains)) {
    errors.push('registry/domains.json: domains must be an array');
    return;
  }
  // https://github.com/aikdna/kdna/issues/132 — Wave 2.5 cleared deprecated domain entries.
  // The file is a historical artifact; empty domains array is acceptable.
  if (domains.length === 0) {
    console.log('registry/domains.json: domains array empty (deprecated registry — Wave 2.5)');
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
