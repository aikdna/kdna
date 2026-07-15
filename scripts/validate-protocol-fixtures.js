#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const JsonSchema2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_SCHEMA = 'schema/manifest.schema.json';
const PACKAGED_MANIFEST_SCHEMA = 'packages/kdna-core/schema/manifest.schema.json';
const LOAD_CONTRACT_SCHEMA = 'schema/load-contract.schema.json';
const PACKAGED_LOAD_CONTRACT_SCHEMA = 'packages/kdna-core/schema/load-contract.schema.json';

const AUTHORIZATION_FIXTURES = [
  'account-required',
  'expired-entitlement',
  'offline-grace-active',
  'org-required',
  'password-missing',
  'password-valid',
  'public-valid',
  'receipt-missing',
  'receipt-valid',
  'remote-recognized-not-loaded',
  'revoked-entitlement',
  'tampered-payload',
  'unknown-entitlement-profile',
].map((name) => `conformance/authorization/fixtures/${name}/kdna.json`);

const RUNTIME_MANIFEST_FIXTURES = [
  ...AUTHORIZATION_FIXTURES,
  'examples/minimal/kdna.json',
  'templates/minimal-domain/kdna.json',
  'templates/standard-domain/kdna.json',
  'fixtures/expected/manifest_protected.json',
  'fixtures/container/invalid-bad-checksum/kdna.json',
];

const INVALID_RUNTIME_MANIFEST_FIXTURES = [
  'conformance/authorization/fixtures/unknown-access/kdna.json',
  'fixtures/container/invalid-missing-payload/kdna.json',
];

const MANIFEST_SCHEMA_SURFACES = [
  {
    name: 'authoritative root Runtime manifest',
    schema: MANIFEST_SCHEMA,
    dependency: LOAD_CONTRACT_SCHEMA,
  },
  {
    name: 'published Core Runtime manifest',
    schema: PACKAGED_MANIFEST_SCHEMA,
    dependency: PACKAGED_LOAD_CONTRACT_SCHEMA,
  },
];

function discoverRuntimeManifestInventory(root = ROOT) {
  const discovered = [];
  const scopedDirectories = [
    'conformance/authorization/fixtures',
    'templates',
    'fixtures/container',
  ];
  for (const relativeDirectory of scopedDirectories) {
    const directory = path.join(root, relativeDirectory);
    const pending = [directory];
    while (pending.length > 0) {
      const current = pending.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) {
          pending.push(absolute);
        } else if (entry.isFile() && entry.name === 'kdna.json') {
          discovered.push(path.relative(root, absolute).split(path.sep).join('/'));
        }
      }
    }
  }
  for (const relativePath of [
    'examples/minimal/kdna.json',
    'fixtures/expected/manifest_protected.json',
  ]) {
    if (fs.existsSync(path.join(root, relativePath))) discovered.push(relativePath);
  }
  return discovered.sort();
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function validateProtocolFixtures(options = {}) {
  const root = options.root || ROOT;
  const logger = options.logger || console;
  const readFile = options.readFile || fs.readFileSync;
  const runtimeFixtures = options.runtimeFixtures || RUNTIME_MANIFEST_FIXTURES;
  const invalidRuntimeFixtures =
    options.invalidRuntimeFixtures || INVALID_RUNTIME_MANIFEST_FIXTURES;
  const errors = [];

  function error(message) {
    errors.push(message);
  }

  function readBytes(relativePath) {
    try {
      return readFile(path.join(root, relativePath));
    } catch (readError) {
      error(`${relativePath}: unable to read: ${readError.message}`);
      return null;
    }
  }

  function readJson(relativePath) {
    const bytes = readBytes(relativePath);
    if (!bytes) return null;
    try {
      return JSON.parse(bytes.toString('utf8'));
    } catch (parseError) {
      error(`${relativePath}: invalid JSON: ${parseError.message}`);
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

  function requireByteParity(canonical, mirror) {
    const canonicalBytes = readBytes(canonical);
    const mirrorBytes = readBytes(mirror);
    if (canonicalBytes && mirrorBytes && !canonicalBytes.equals(mirrorBytes)) {
      error(`${mirror}: must be byte-for-byte identical to ${canonical}`);
    }
  }

  function compileManifestSurface(surface) {
    const schema = readJson(surface.schema);
    const dependency = readJson(surface.dependency);
    if (!schema || !dependency) return null;
    try {
      const ajv = new JsonSchema2020({ allErrors: true, strict: false, loadSchema: undefined });
      addFormats(ajv);
      ajv.addSchema(dependency);
      return ajv.compile(schema);
    } catch (compileError) {
      error(`${surface.schema}: unable to compile ${surface.name}: ${compileError.message}`);
      return null;
    }
  }

  function formatSchemaErrors(validate) {
    return (validate.errors || [])
      .map((schemaError) => `${schemaError.instancePath || '/'} ${schemaError.message}`)
      .join('; ');
  }

  function checkManifestSchemaContract(schema) {
    if (!schema) return;
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

  function checkRuntimeFixtures(validators) {
    for (const relativePath of runtimeFixtures) {
      const fixture = readJson(relativePath);
      if (!fixture) continue;
      for (const { surface, validate } of validators) {
        if (!validate(fixture)) {
          error(
            `${relativePath}: invalid against ${surface.name}: ${formatSchemaErrors(validate)}`,
          );
        }
      }
    }

    for (const relativePath of invalidRuntimeFixtures) {
      const fixture = readJson(relativePath);
      if (!fixture) continue;
      for (const { surface, validate } of validators) {
        if (validate(fixture)) {
          error(`${relativePath}: must be rejected by ${surface.name}`);
        }
      }
    }
  }

  function checkRuntimeFixtureInventory() {
    let discovered;
    try {
      discovered = discoverRuntimeManifestInventory(root);
    } catch (inventoryError) {
      error(`Runtime manifest inventory: unable to enumerate: ${inventoryError.message}`);
      return;
    }
    const declared = [...runtimeFixtures, ...invalidRuntimeFixtures].sort();
    for (const relativePath of discovered.filter((file) => !declared.includes(file))) {
      error(`Runtime manifest inventory: unclassified fixture ${relativePath}`);
    }
    for (const relativePath of declared.filter((file) => !discovered.includes(file))) {
      error(`Runtime manifest inventory: listed fixture is missing ${relativePath}`);
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

  requireByteParity(MANIFEST_SCHEMA, PACKAGED_MANIFEST_SCHEMA);
  requireByteParity(LOAD_CONTRACT_SCHEMA, PACKAGED_LOAD_CONTRACT_SCHEMA);
  checkManifestSchemaContract(readJson(MANIFEST_SCHEMA));
  checkRuntimeFixtureInventory();

  const validators = MANIFEST_SCHEMA_SURFACES.map((surface) => ({
    surface,
    validate: compileManifestSurface(surface),
  })).filter(({ validate }) => validate);
  if (validators.length === MANIFEST_SCHEMA_SURFACES.length) checkRuntimeFixtures(validators);

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
  console.log(
    `Protocol fixtures valid: ${RUNTIME_MANIFEST_FIXTURES.length} Runtime manifests, ` +
      `${INVALID_RUNTIME_MANIFEST_FIXTURES.length} negative manifests`,
  );
}

if (require.main === module) main();

module.exports = {
  discoverRuntimeManifestInventory,
  INVALID_RUNTIME_MANIFEST_FIXTURES,
  LOAD_CONTRACT_SCHEMA,
  MANIFEST_SCHEMA,
  MANIFEST_SCHEMA_SURFACES,
  PACKAGED_LOAD_CONTRACT_SCHEMA,
  PACKAGED_MANIFEST_SCHEMA,
  RUNTIME_MANIFEST_FIXTURES,
  validateProtocolFixtures,
};
