#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const errors = [];

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
  const schema = readJson('schema/kdna-manifest-v1rc.json');
  if (!schema) return;
  if (schema.properties && hasOwn(schema.properties, 'language')) {
    errors.push('schema/kdna-manifest-v1rc.json: properties.language must not exist in v1.0-rc');
  }
  if (!schema.required?.includes('spec_version')) {
    errors.push('schema/kdna-manifest-v1rc.json: spec_version must be required');
  }
  if (!schema.required?.includes('default_language') || !schema.required?.includes('languages')) {
    errors.push('schema/kdna-manifest-v1rc.json: default_language and languages must be required');
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
