#!/usr/bin/env node
/**
 * kdna-validate — Enhanced KDNA domain validator using JSON Schema.
 *
 * Validates KDNA files against their JSON Schema definitions.
 * Requires ajv and ajv-formats as optional dependencies.
 */

const fs = require('fs');
const path = require('path');

const domainDir = process.argv[2];
if (!domainDir) {
  console.error('Usage: node validators/kdna-validate.js <domain-folder>');
  process.exit(2);
}

if (!fs.existsSync(domainDir) || !fs.statSync(domainDir).isDirectory()) {
  console.error(`Not a directory: ${domainDir}`);
  process.exit(2);
}

// Check for optional dependencies
let ajv, addFormats;
try {
  ajv = require('ajv');
  try {
    addFormats = require('ajv-formats');
  } catch {
    addFormats = null;
  }
} catch {
  console.error('ajv is required for schema validation. Install with: npm install ajv ajv-formats');
  process.exit(2);
}

const SCHEMA_DIR = path.join(__dirname, '..', 'schema');

const schemaMap = {
  'KDNA_Core.json': 'KDNA_Core.schema.json',
  'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
  'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
  'KDNA_Cases.json': 'KDNA_Cases.schema.json',
  'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
  'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
};

const errors = [];
const warnings = [];
let validCount = 0;
let failCount = 0;

// Validate each JSON file against its schema
for (const [file, schemaFile] of Object.entries(schemaMap)) {
  const filePath = path.join(domainDir, file);
  const schemaPath = path.join(SCHEMA_DIR, schemaFile);

  if (!fs.existsSync(filePath)) continue;
  if (!fs.existsSync(schemaPath)) {
    warnings.push(`${file}: no schema found at ${schemaFile}`);
    continue;
  }

  let data, schema;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${e.message})`);
    failCount++;
    continue;
  }

  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    // Remove $schema ref so AJV doesn't try to fetch the meta-schema
    delete schema.$schema;
  } catch (e) {
    errors.push(`${schemaFile}: invalid schema JSON (${e.message})`);
    continue;
  }

  const ajvInstance = new ajv({ allErrors: true, strict: false });
  if (addFormats) addFormats(ajvInstance);
  // Add draft-2020-12 meta-schema support
  try {
    ajvInstance.addMetaSchema(require('ajv/dist/refs/json-schema-2020-12.json'));
  } catch {
    /* meta-schema already available or not needed */
  }
  const validate = ajvInstance.compile(schema);
  const valid = validate(data);

  if (valid) {
    validCount++;
  } else {
    failCount++;
    for (const err of validate.errors || []) {
      const instancePath = err.instancePath || '/';
      errors.push(`${file}${instancePath}: ${err.message} (${err.keyword})`);
    }
  }
}

// Cross-file checks
const allData = {};
for (const [file] of Object.entries(schemaMap)) {
  const filePath = path.join(domainDir, file);
  if (fs.existsSync(filePath)) {
    try {
      allData[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      /* skip unparseable files */
    }
  }
}

// Domain name consistency
let domainName = null;
for (const [file, data] of Object.entries(allData)) {
  if (data.meta && data.meta.domain) {
    if (domainName === null) {
      domainName = data.meta.domain;
    } else if (data.meta.domain !== domainName) {
      errors.push(
        `${file}: domain name "${data.meta.domain}" does not match "${domainName}" from other files`,
      );
    }
  }
}

// Version consistency
let version = null;
for (const [file, data] of Object.entries(allData)) {
  if (data.meta && data.meta.version) {
    if (version === null) {
      version = data.meta.version;
    } else if (data.meta.version !== version) {
      warnings.push(
        `${file}: version "${data.meta.version}" differs from "${version}" in other files`,
      );
    }
  }
}

// Output results
if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}
if (errors.length) {
  console.error('Errors:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

console.log(
  `✓ KDNA domain valid (schema): ${domainDir} (${validCount} files passed${failCount ? `, ${failCount} failed` : ''})`,
);
