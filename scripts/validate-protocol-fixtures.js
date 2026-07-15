#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_SCHEMA = 'schema/manifest.schema.json';
const PACKAGED_MANIFEST_SCHEMA = 'packages/kdna-core/schema/manifest.schema.json';

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function validateProtocolFixtures(options = {}) {
  const root = options.root || ROOT;
  const logger = options.logger || console;
  const errors = [];

  function error(message) {
    errors.push(message);
  }

  function readJson(relativePath) {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
    } catch (readError) {
      error(`${relativePath}: ${readError.message}`);
      return null;
    }
  }

  function checkNoForbiddenFields(object, relativePath, stack = []) {
    if (!object || typeof object !== 'object') return;
    if (Array.isArray(object)) {
      object.forEach((item, index) =>
        checkNoForbiddenFields(item, relativePath, stack.concat(`[${index}]`)),
      );
      return;
    }

    for (const key of Object.keys(object)) {
      const location = `${relativePath}${stack.join('')}.${key}`;
      if (key === 'kdna_spec') error(`${location}: use spec_version`);
      if (key === 'language') error(`${location}: use default_language + languages`);
      if (key === 'kdna_url') error(`${location}: use asset_url`);
      if (key === 'sha256') error(`${location}: use asset_digest`);
      checkNoForbiddenFields(object[key], relativePath, stack.concat(`.${key}`));
    }
  }

  function checkManifestSchema() {
    const schema = readJson(MANIFEST_SCHEMA);
    const packagedSchema = readJson(PACKAGED_MANIFEST_SCHEMA);
    if (!schema || !packagedSchema) return;

    const rootBytes = fs.readFileSync(path.join(root, MANIFEST_SCHEMA));
    const packagedBytes = fs.readFileSync(path.join(root, PACKAGED_MANIFEST_SCHEMA));
    if (!rootBytes.equals(packagedBytes)) {
      error(`${PACKAGED_MANIFEST_SCHEMA}: must be byte-for-byte identical to ${MANIFEST_SCHEMA}`);
    }

    if (schema.$id !== 'https://github.com/aikdna/kdna/schema/manifest.schema.json') {
      error(`${MANIFEST_SCHEMA}: unexpected authoritative $id`);
    }
    if (hasOwn(schema.properties, 'kdna_version') || schema.required?.includes('kdna_version')) {
      error(`${MANIFEST_SCHEMA}: kdna_version must not be part of the Runtime manifest`);
    }
    if (schema.properties?.format_version?.const !== '0.1.0') {
      error(`${MANIFEST_SCHEMA}: format_version const must be 0.1.0`);
    }
    if (schema.required?.includes('creator')) {
      error(`${MANIFEST_SCHEMA}: creator provenance must remain optional`);
    }

    for (const field of [
      'format_version',
      'asset_id',
      'asset_uid',
      'asset_type',
      'title',
      'version',
      'judgment_version',
      'created_at',
      'updated_at',
      'compatibility',
      'payload',
    ]) {
      if (!schema.required?.includes(field)) error(`${MANIFEST_SCHEMA}: ${field} must be required`);
    }

    const compatibility = schema.properties?.compatibility;
    for (const field of ['min_loader_version', 'profile', 'profile_version']) {
      if (!compatibility?.required?.includes(field)) {
        error(`${MANIFEST_SCHEMA}: compatibility.${field} must be required`);
      }
    }
    if (compatibility?.properties?.profile_version?.const !== '0.1.0') {
      error(`${MANIFEST_SCHEMA}: compatibility.profile_version const must be 0.1.0`);
    }

    const payload = schema.properties?.payload;
    for (const field of ['path', 'encoding', 'encrypted']) {
      if (!payload?.required?.includes(field)) {
        error(`${MANIFEST_SCHEMA}: payload.${field} must be required`);
      }
    }
  }

  function checkRegistryFixture() {
    const registry = readJson('registry/domains.json');
    if (!registry) return;
    const domains = registry.domains;
    if (!Array.isArray(domains)) {
      error('registry/domains.json: domains must be an array');
      return;
    }
    if (domains.length === 0) {
      logger.log('registry/domains.json: domains array empty (deprecated registry — Wave 2.5)');
      return;
    }

    domains.forEach((domain, index) => {
      const location = `registry/domains.json.domains[${index}]`;
      checkNoForbiddenFields(domain, 'registry/domains.json', [`.domains[${index}]`]);
      if (!/^@[a-z][a-z0-9-]*\/[a-z][a-z0-9_]*$/.test(domain.name || '')) {
        error(`${location}.name: must be scoped @scope/name`);
      }
      if (domain.spec_version !== '1.0-rc') {
        error(`${location}.spec_version: must be 1.0-rc`);
      }
      if (!Array.isArray(domain.languages) || domain.languages.length === 0) {
        error(`${location}.languages: must be a non-empty array`);
      }
      if (!domain.default_language) error(`${location}.default_language: required`);
      if (!domain.asset_type) error(`${location}.asset_type: required for protocol fixtures`);
    });
  }

  checkManifestSchema();
  checkRegistryFixture();
  return errors;
}

function main() {
  const errors = validateProtocolFixtures();
  if (errors.length > 0) {
    errors.forEach((error) => console.error(`x ${error}`));
    process.exitCode = 1;
    return;
  }
  console.log('Protocol fixtures valid');
}

if (require.main === module) main();

module.exports = {
  MANIFEST_SCHEMA,
  PACKAGED_MANIFEST_SCHEMA,
  validateProtocolFixtures,
};
