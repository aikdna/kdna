#!/usr/bin/env node
/**
 * Validate the 3 RFC-0013 new schema files against their example files,
 * and validate that each example's source IDs are internally consistent
 * (e.g., SAG precedence_order references valid source ids).
 *
 * Usage: node scripts/validate-rfc0013-schemas.js
 * Exit code 0 = all pass, 1 = at least one failure.
 *
 * Follows the ajv + ajv-formats pattern from scripts/validate-app-schemas.js.
 */
const fs = require('fs');
const path = require('path');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ROOT = path.resolve(__dirname, '..');

const CHECKS = [
  {
    name: 'Source Authority Graph',
    schema: 'schema/source_authority.schema.json',
    data: 'examples/source-authority/example.json',
  },
  {
    name: 'Truth Charter',
    schema: 'schema/truth_charter.schema.json',
    data: 'examples/truth-charter/example.json',
  },
  {
    name: 'Module Manifest',
    schema: 'schema/module_manifest.schema.json',
    data: 'examples/module-manifest/example.json',
  },
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

let failures = 0;

for (const check of CHECKS) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = readJson(check.schema);
  const data = readJson(check.data);
  const validate = ajv.compile(schema);
  const ok = validate(data);

  if (!ok) {
    failures += 1;
    console.error(`FAIL ${check.name}: ${check.data}`);
    for (const err of validate.errors || []) {
      console.error(`  ${err.instancePath || '/'} ${err.message}`);
    }
    continue;
  }

  console.log(`OK   ${check.name}: ${check.data}`);
}

// Internal consistency: SAG precedence_order entries must all be source ids.
console.log('');
console.log('=== Cross-check: SAG precedence_order ===');
try {
  const sag = readJson('examples/source-authority/example.json');
  const sourceIds = new Set(sag.sources.map((s) => s.id));
  const missing = (sag.precedence_order || []).filter((id) => !sourceIds.has(id));
  if (missing.length > 0) {
    failures += 1;
    console.error(`FAIL SAG precedence_order references unknown source ids: ${missing.join(', ')}`);
  } else {
    console.log(`OK   SAG precedence_order entries all reference valid source ids (${sag.precedence_order.length} entries)`);
  }
  // current_highest sources should be can_override=true
  for (const src of sag.sources) {
    if (src.authority === 'current_highest' && src.can_override !== true) {
      failures += 1;
      console.error(`FAIL SAG source ${src.id}: authority=current_highest but can_override != true`);
    }
    if (src.authority === 'deprecated' && src.status !== 'deprecated') {
      failures += 1;
      console.error(`FAIL SAG source ${src.id}: authority=deprecated but status != 'deprecated'`);
    }
  }
  console.log('OK   SAG authority/status internal consistency');
} catch (e) {
  failures += 1;
  console.error(`FAIL cross-check: ${e.message}`);
}

if (failures > 0) {
  console.error('');
  console.error(`RFC-0013 schema validation: ${failures} failure(s)`);
  process.exit(1);
}

console.log('');
console.log('RFC-0013 schema validation: all checks passed');
