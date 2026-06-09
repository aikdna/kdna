import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const root = path.dirname(fileURLToPath(import.meta.url));
const specsDir = path.join(root, '..', 'specs');

const SCHEMAS = {
  'artifact-envelope': path.join(specsDir, 'artifact-envelope.schema.json'),
  'stage-definition': path.join(specsDir, 'stage-definition.schema.json'),
  'fidelity-result': path.join(specsDir, 'fidelity-result.schema.json'),
  'product-runtime': path.join(specsDir, 'product-runtime.schema.json'),
};

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateFixture(schemaName, fixturePath, expectValid) {
  const schemaPath = SCHEMAS[schemaName];
  const schema = loadJson(schemaPath);
  const fixture = loadJson(fixturePath);

  const { $schema: _, ...fixtureData } = fixture;

  const ajv = new Ajv({ allErrors: true, strict: false, validateSchema: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(fixtureData);

  const fixtureName = path.basename(fixturePath);
  const label = `${schemaName}/${fixtureName}`;

  if (expectValid) {
    assert.equal(valid, true, `${label}: expected valid but got errors:\n${ajv.errorsText(validate.errors)}`);
  } else {
    assert.equal(valid, false, `${label}: expected invalid but passed validation`);
  }
}

export function runPhase2Conformance() {
  const artifactsDir = path.join(root, 'artifact-envelope');
  const fidelityDir = path.join(root, 'fidelity-result');
  const productDir = path.join(root, 'product-runtime');
  const stageDir = path.join(root, 'stage-definition');

  // Artifact Envelope (RFC-0009)
  validateFixture('artifact-envelope', path.join(artifactsDir, 'valid-minimal.json'), true);
  validateFixture('artifact-envelope', path.join(artifactsDir, 'valid-full.json'), true);
  validateFixture('artifact-envelope', path.join(artifactsDir, 'invalid-missing-required.json'), false);
  validateFixture('artifact-envelope', path.join(artifactsDir, 'invalid-bad-enum.json'), false);
  validateFixture('artifact-envelope', path.join(artifactsDir, 'invalid-bad-linkage.json'), false);

  // Fidelity Result (RFC-0010)
  validateFixture('fidelity-result', path.join(fidelityDir, 'valid-minimal.json'), true);
  validateFixture('fidelity-result', path.join(fidelityDir, 'valid-full.json'), true);
  validateFixture('fidelity-result', path.join(fidelityDir, 'invalid-missing-required.json'), false);
  validateFixture('fidelity-result', path.join(fidelityDir, 'invalid-bad-enum.json'), false);

  // Product Runtime (RFC-0011)
  validateFixture('product-runtime', path.join(productDir, 'valid-minimal.json'), true);
  validateFixture('product-runtime', path.join(productDir, 'valid-full.json'), true);
  validateFixture('product-runtime', path.join(productDir, 'invalid-missing-required.json'), false);
  validateFixture('product-runtime', path.join(productDir, 'invalid-bad-enum.json'), false);

  // Stage Definition (RFC-0009)
  validateFixture('stage-definition', path.join(stageDir, 'valid-minimal.json'), true);
  validateFixture('stage-definition', path.join(stageDir, 'valid-full.json'), true);
  validateFixture('stage-definition', path.join(stageDir, 'invalid-missing-required.json'), false);

  console.log('KDNA Phase 2 protocol conformance passed (16 fixtures, 4 schemas)');
}
