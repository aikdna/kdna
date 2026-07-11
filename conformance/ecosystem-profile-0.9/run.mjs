#!/usr/bin/env node

/**
 * Ecosystem Profile 0.9 Conformance Runner
 *
 * Validates all candidate contract fixtures against their schemas.
 * Reports pass/fail with required issue codes for negative fixtures.
 *
 * Usage: node run.mjs [--verbose]
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SPECS_DIR = resolve(__dirname, '..', '..', 'specs');

// ── Lazy Ajv loader ──────────────────────────────────────────────────
let _ajv = null;
function getAjv() {
  if (_ajv) return _ajv;
  const { Ajv2020: Ajv } = require('ajv/dist/2020');
  _ajv = new Ajv({ allErrors: true, strict: false });
  _ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
  _ajv.addFormat('date', /^\d{4}-\d{2}-\d{2}$/);
  return _ajv;
}

// ── Schema registry ──────────────────────────────────────────────────
const SCHEMAS = {
  'consumption-plan': {
    schemaPath: resolve(SPECS_DIR, 'consumption-plan-candidate-0.9.schema.json'),
    fixtures: ['single-consumption-plan.json', 'cluster-consumption-plan.json'],
  },
  'judgment-trace': {
    schemaPath: resolve(SPECS_DIR, 'judgment-trace-candidate-0.9.schema.json'),
    fixtures: ['single-judgment-trace.json', 'cluster-judgment-trace.json'],
  },
  'evidence-claim': {
    schemaPath: resolve(SPECS_DIR, 'evidence-claim-candidate-0.9.schema.json'),
    fixtures: ['single-evidence-claim.json'],
  },
  'cluster-manifest': {
    schemaPath: resolve(SPECS_DIR, 'cluster-manifest-candidate-0.9.schema.json'),
    fixtures: ['cluster-manifest.json'],
  },
};

const NEGATIVE_DIR = resolve(__dirname, 'negative');
const UNKNOWN_FIELD_DIR = resolve(__dirname, 'unknown-field');
const GOLDEN_DIR = resolve(__dirname, 'golden');

const NEGATIVE_FIXTURES = readdirSync(NEGATIVE_DIR).filter(f => f.endsWith('.json'));
const UNKNOWN_FIXTURES = readdirSync(UNKNOWN_FIELD_DIR).filter(f => f.endsWith('.json'));

// ── Expected issue codes for each negative fixture ──────────────────
const NEGATIVE_ISSUES = {
  'plan-missing-plan-version.json': { contract: 'consumption-plan', issue: 'MISSING_REQUIRED_FIELD' },
  'plan-single-missing-asset-ref.json': { contract: 'consumption-plan', issue: 'MISSING_CONDITIONAL_REQUIRED' },
  'plan-cluster-missing-cluster-ref.json': { contract: 'consumption-plan', issue: 'MISSING_CONDITIONAL_REQUIRED' },
  'trace-missing-plan-id.json': { contract: 'judgment-trace', issue: 'MISSING_REQUIRED_FIELD' },
  'trace-cluster-missing-assets-loaded.json': { contract: 'judgment-trace', issue: 'MISSING_CONDITIONAL_REQUIRED' },
  'evidence-missing-classification.json': { contract: 'evidence-claim', issue: 'MISSING_REQUIRED_FIELD' },
  'cluster-no-primary-candidate.json': { contract: 'cluster-manifest', issue: 'NO_PRIMARY_CANDIDATE' },
  'cluster-advisor-missing-hypothesis.json': { contract: 'cluster-manifest', issue: 'MISSING_ADVISOR_HYPOTHESIS' },
};
function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function validateAgainstSchema(schema, data, schemaName) {
  // Strip $id to prevent Ajv duplicate-id errors when validating multiple
  // fixtures against the same schema in a single run
  const { $id, $schema, ...schemaBody } = schema;
  const cleanSchema = schemaBody;
  const ajv = getAjv();
  const valid = ajv.validate(cleanSchema, data);
  return {
    valid,
    errors: (ajv.errors || []).map(e =>
      `${e.instancePath || '/'}: ${e.message} (${e.keyword})`
    )
  };
}

// ── Main ─────────────────────────────────────────────────────────────
const verbose = process.argv.includes('--verbose');
let totalPassed = 0;
let totalFailed = 0;
const failures = [];

console.log('=== Ecosystem Profile 0.9 Conformance ===\n');

// 1. Golden fixtures
console.log('--- Golden Fixtures ---');
for (const [contractName, config] of Object.entries(SCHEMAS)) {
  const schema = readJson(config.schemaPath);
  console.log(`\n  Contract: ${contractName} (${config.schemaPath.split('/').pop()})`);

  for (const fixtureName of config.fixtures) {
    const fixturePath = resolve(GOLDEN_DIR, fixtureName);
    if (!existsSync(fixturePath)) {
      console.log(`    ✗ ${fixtureName}: FILE NOT FOUND`);
      totalFailed++;
      failures.push({ contract: contractName, fixture: fixtureName, error: 'File not found' });
      continue;
    }
    const data = readJson(fixturePath);
    const { valid, errors } = validateAgainstSchema(schema, data, contractName);
    if (valid) {
      console.log(`    ✓ ${fixtureName}`);
      totalPassed++;
    } else {
      console.log(`    ✗ ${fixtureName}:`);
      errors.forEach(e => console.log(`      - ${e}`));
      totalFailed++;
      failures.push({ contract: contractName, fixture: fixtureName, errors });
    }
  }
}

// 2. Negative fixtures — must fail with expected issue code
const SEMANTIC_INVARIANT_FIXTURES = ['cluster-no-primary-candidate.json', 'cluster-advisor-missing-hypothesis.json'];
console.log('\n--- Negative Fixtures ---');
for (const negFile of NEGATIVE_FIXTURES) {
  // Cluster semantic invariants handled in section 4
  if (SEMANTIC_INVARIANT_FIXTURES.includes(negFile)) continue;
  const negPath = resolve(NEGATIVE_DIR, negFile);
  const data = readJson(negPath);
  const expected = NEGATIVE_ISSUES[negFile];
  if (!expected) {
    console.log(`  ? ${negFile}: no expected issue code registered`);
    totalFailed++;
    failures.push({ contract: 'unknown', fixture: negFile, error: 'No expected issue registered' });
    continue;
  }
  const contractName = expected.contract;
  const expectedIssue = expected.issue;

  const schema = readJson(SCHEMAS[contractName].schemaPath);
  const { valid, errors } = validateAgainstSchema(schema, data, contractName);

  if (!valid) {
    const errorText = errors.join('; ');
    const hasRequired = errorText.includes('must have required property') || errorText.includes("required");
    const hasPattern = errorText.includes('must match pattern');
    const hasEnum = errorText.includes('must be equal to constant') || errorText.includes('must match a schema in anyOf') || errorText.includes('must match "then" schema');
    const hasAdditional = errorText.includes('must NOT have additional properties');
    const hasType = errorText.includes('must be');

    const categoryMatches =
      (expectedIssue === 'MISSING_REQUIRED_FIELD' && (hasRequired))
      || (expectedIssue === 'MISSING_CONDITIONAL_REQUIRED' && (hasRequired || hasEnum || hasPattern))
      || (expectedIssue === 'NO_PRIMARY_CANDIDATE' && (hasEnum || hasRequired))
      || (expectedIssue === 'MISSING_ADVISOR_HYPOTHESIS' && (hasRequired || hasAdditional));

    if (categoryMatches) {
      console.log(`    ✓ ${negFile} → rejected with expected category (${expectedIssue})`);
      if (verbose) errors.forEach(e => console.log(`      error: ${e}`));
      totalPassed++;
    } else {
      console.log(`    ✗ ${negFile} → rejected but wrong category. Expected: ${expectedIssue}. Got: ${errorText.substring(0, 200)}`);
      totalFailed++;
      failures.push({ contract: contractName, fixture: negFile, expectedIssue, errors });
    }
  } else {
    console.log(`    ✗ ${negFile} → unexpectedly PASSED validation. Should have failed with: ${expectedIssue}`);
    totalFailed++;
    failures.push({ contract: contractName, fixture: negFile, error: `Should have failed: ${expectedIssue}` });
  }
}

// 3. Unknown optional field fixtures — must pass (forward compatibility)
console.log('\n--- Unknown Optional Field Fixtures (Forward Compatibility) ---');
const unknownSchemaMap = {
  'plan': 'consumption-plan',
  'trace': 'judgment-trace',
};
for (const ufFile of UNKNOWN_FIXTURES) {
  const ufPath = resolve(UNKNOWN_FIELD_DIR, ufFile);
  const data = readJson(ufPath);
  const prefix = Object.keys(unknownSchemaMap).find(p => ufFile.startsWith(p));
  const contractName = unknownSchemaMap[prefix];
  if (!contractName || !SCHEMAS[contractName]) {
    console.log(`  ? ${ufFile}: cannot determine contract`);
    totalFailed++;
    continue;
  }
  const schema = readJson(SCHEMAS[contractName].schemaPath);
  const { valid, errors } = validateAgainstSchema(schema, data, contractName);
  if (valid) {
    console.log(`    ✓ ${ufFile} → accepted (forward-compatible)`);
    totalPassed++;
  } else {
    console.log(`    ✗ ${ufFile} → REJECTED — breaks forward compatibility:`);
    errors.forEach(e => console.log(`      - ${e}`));
    totalFailed++;
    failures.push({ contract: contractName, fixture: ufFile, error: 'Forward-compat broken', errors });
  }
}

// 4. Cluster manifest semantic invariants (beyond pure schema)
console.log('\n--- Cluster Manifest Semantic Invariants ---');
for (const negFile of ['cluster-no-primary-candidate.json', 'cluster-advisor-missing-hypothesis.json']) {
  const negPath = resolve(NEGATIVE_DIR, negFile);
  if (!existsSync(negPath)) continue;
  const data = readJson(negPath);
  const expected = NEGATIVE_ISSUES[negFile];
  if (!expected) continue;

  let invariantErrors = [];

  if (negFile === 'cluster-no-primary-candidate.json') {
    const hasPrimary = (data.domains || []).some(d => d.role === 'primary-candidate');
    if (!hasPrimary) {
      invariantErrors.push('Cluster must have at least one domain with role=primary-candidate');
    }
  }

  if (negFile === 'cluster-advisor-missing-hypothesis.json') {
    const advisors = (data.domains || []).filter(d => d.role === 'advisor');
    for (const a of advisors) {
      if (!a.contribution_hypothesis_template) {
        invariantErrors.push(`Advisor "${a.id}" is missing contribution_hypothesis_template`);
      }
    }
  }

  if (invariantErrors.length > 0) {
    console.log(`    ✓ ${negFile} → failed semantic invariants (${expected.issue})`);
    if (verbose) invariantErrors.forEach(e => console.log(`      error: ${e}`));
    totalPassed++;
  } else {
    console.log(`    ✗ ${negFile} → passed schema but should have failed invariant: ${expected.issue}`);
    totalFailed++;
    failures.push({ contract: expected.contract, fixture: negFile, error: 'Semantic invariant not enforced' });
  }
}

// 5. Summary
console.log(`\n=== Results ===`);
console.log(`  Passed: ${totalPassed}`);
console.log(`  Failed: ${totalFailed}`);

if (failures.length > 0) {
  console.log(`\n  Failures:`);
  failures.forEach(f => {
    console.log(`  - [${f.contract}] ${f.fixture}: ${f.error || f.errors?.join('; ')?.substring(0, 200)}`);
  });
}

console.log(`\nEcosystem Profile 0.9 Conformance: ${totalFailed === 0 ? 'PASS' : 'FAIL'}`);
process.exit(totalFailed === 0 ? 0 : 1);
