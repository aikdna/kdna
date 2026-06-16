#!/usr/bin/env node
/**
 * v1-validate.mjs — validate a .kdna source directory against the Phase 1 schemas.
 *
 * Usage: node scripts/v1-validate.mjs <source-dir>
 *
 * Exits 0 on success, non-zero on any validation failure. Reports each problem
 * with the file:line pointer when available.
 *
 * This script only validates the v1 minimal example shape. It does NOT touch
 * the legacy KDNA_Core/KDNA_Patterns split or the v1-rc domain authoring shape.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const repoRoot = path.resolve(__dirname, '..');
const schemaDir = path.join(repoRoot, 'schema');

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(schemaDir, name), 'utf8'));
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const manifestSchema = loadSchema('manifest.schema.json');
const payloadSchema = loadSchema('payload-profile-v1.schema.json');
const checksumsSchema = loadSchema('checksums.schema.json');
ajv.addSchema(loadSchema('load-contract.schema.json'));

const validateManifest = ajv.compile(manifestSchema);
const validatePayload = ajv.compile(payloadSchema);
const validateChecksums = ajv.compile(checksumsSchema);

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/v1-validate.mjs <source-dir>');
  process.exit(2);
}
const abs = path.resolve(sourceDir);
if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
  console.error(`Not a directory: ${abs}`);
  process.exit(2);
}

const results = {
  format_valid: true,
  schema_valid: true,
  payload_valid: true,
  checksums_valid: true,
};
const problems = [];

// Container format: mimetype, kdna.json, payload.kdnab required.
const required = ['mimetype', 'kdna.json', 'payload.kdnab'];
for (const f of required) {
  if (!fs.existsSync(path.join(abs, f))) {
    results.format_valid = false;
    problems.push(`format: missing required entry ${f}`);
  }
}

if (fs.existsSync(path.join(abs, 'mimetype'))) {
  const mime = fs.readFileSync(path.join(abs, 'mimetype'), 'utf8');
  if (mime !== 'application/vnd.kdna.asset') {
    results.format_valid = false;
    problems.push(`format: mimetype is "${mime}", expected "application/vnd.kdna.asset"`);
  }
}

// Manifest schema.
if (fs.existsSync(path.join(abs, 'kdna.json'))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(abs, 'kdna.json'), 'utf8'));
  if (!validateManifest(manifest)) {
    results.schema_valid = false;
    for (const err of validateManifest.errors) {
      problems.push(`manifest: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }
}

// Payload schema.
if (fs.existsSync(path.join(abs, 'payload.kdnab'))) {
  const payload = JSON.parse(fs.readFileSync(path.join(abs, 'payload.kdnab'), 'utf8'));
  if (!validatePayload(payload)) {
    results.payload_valid = false;
    for (const err of validatePayload.errors) {
      problems.push(`payload: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }
}

// Checksums schema (optional but checked when present).
if (fs.existsSync(path.join(abs, 'checksums.json'))) {
  const checks = JSON.parse(fs.readFileSync(path.join(abs, 'checksums.json'), 'utf8'));
  if (!validateChecksums(checks)) {
    results.checksums_valid = false;
    for (const err of validateChecksums.errors) {
      problems.push(`checksums: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }
}

console.log(JSON.stringify(results, null, 2));
if (problems.length > 0) {
  console.error('\nProblems:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('\nAll Phase 1 schema checks passed.');
