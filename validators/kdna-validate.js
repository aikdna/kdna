#!/usr/bin/env node
/**
 * kdna-validate — Enhanced KDNA domain validator using JSON Schema.
 *
 * Uses @aikdna/kdna-core validateDomainSchema and validateCrossFile for
 * pure validation logic, handles file I/O here.
 */

const fs = require('fs');
const path = require('path');
const { validateDomainSchema, validateCrossFile } = require('@aikdna/kdna-core');

const domainDir = process.argv[2];
if (!domainDir || domainDir === '--help' || domainDir === '-h') {
  console.log(`kdna-validate — Validate a KDNA domain against JSON Schema.

Usage: kdna-validate <domain-folder>

Checks each KDNA_*.json file against its schema, then runs cross-file validation.

Options:
  -h, --help    Show this help message`);
  process.exit(domainDir ? 0 : 2);
}

if (!fs.existsSync(domainDir) || !fs.statSync(domainDir).isDirectory()) {
  console.error(`Not a directory: ${domainDir}`);
  process.exit(2);
}

const SCHEMA_DIR = path.join(__dirname, '..', 'packages', 'kdna-core', 'schema');

const FILE_MAP = {
  'KDNA_Core.json': 'KDNA_Core.schema.json',
  'KDNA_Patterns.json': 'KDNA_Patterns.schema.json',
  'KDNA_Scenarios.json': 'KDNA_Scenarios.schema.json',
  'KDNA_Cases.json': 'KDNA_Cases.schema.json',
  'KDNA_Reasoning.json': 'KDNA_Reasoning.schema.json',
  'KDNA_Evolution.json': 'KDNA_Evolution.schema.json',
};

// Read all KDNA JSON files
const dataMap = {};
for (const [file] of Object.entries(FILE_MAP)) {
  const filePath = path.join(domainDir, file);
  if (fs.existsSync(filePath)) {
    try {
      dataMap[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      /* skip unparseable files */
    }
  }
}

// Read schemas
const schemaMap = {};
for (const [file, schemaFile] of Object.entries(FILE_MAP)) {
  const schemaPath = path.join(SCHEMA_DIR, schemaFile);
  if (fs.existsSync(schemaPath)) {
    try {
      schemaMap[schemaFile] = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    } catch {
      /* skip unparseable schemas */
    }
  }
}

// Schema validation
const schemaResult = validateDomainSchema(dataMap, schemaMap);

// Cross-file validation
const crossResult = validateCrossFile(dataMap);

// Combine results
const errors = [...schemaResult.errors, ...crossResult.errors];
const warnings = [...schemaResult.warnings, ...crossResult.warnings];

if (warnings.length) {
  console.log('Warnings:');
  warnings.forEach((w) => console.log(`  - ${w}`));
}
if (errors.length) {
  console.error('Errors:');
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}

const validCount = Object.keys(dataMap).length;
console.log(
  `✓ KDNA domain valid (schema): ${domainDir} (${validCount} files passed)`,
);
