#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const JsonSchema2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..');

const dependencySchemas = [
  'specs/digest-evidence.schema.json',
  'specs/agent-host-receipt.schema.json',
  'specs/agent-host-capabilities.schema.json',
  'specs/consumption-plan.schema.json',
];

const checks = [
  {
    schema: 'schema/judgment-trace.schema.json',
    data: 'examples/app-runtime-contract/generic-client-trace.json',
  },
  {
    schema: 'schema/judgment-trace.schema.json',
    data: 'examples/app-runtime-contract/generic-workbench-trace.json',
  },
  {
    schema: 'schema/feedback-event.schema.json',
    data: 'examples/app-runtime-contract/generic-client-feedback.json',
  },
  {
    schema: 'schema/feedback-event.schema.json',
    data: 'examples/app-runtime-contract/generic-workbench-feedback.json',
  },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(repoRoot, file), 'utf8'));
}

function compileSchema(schemaPath) {
  const ajv = new JsonSchema2020({ allErrors: true, strict: false });
  addFormats(ajv);
  for (const dependency of dependencySchemas) {
    ajv.addSchema(readJson(dependency));
  }
  return ajv.compile(readJson(schemaPath));
}

function validateChecks(checksToRun = checks, logger = console) {
  let failures = 0;

  for (const check of checksToRun) {
    const validate = compileSchema(check.schema);
    const ok = validate(readJson(check.data));

    if (ok) {
      logger.log(`OK ${check.data}`);
      continue;
    }

    failures += 1;
    logger.error(`FAIL ${check.data}`);
    for (const error of validate.errors || []) {
      logger.error(`  ${error.instancePath || '/'} ${error.message}`);
    }
  }

  return failures;
}

function main() {
  const failures = validateChecks();
  if (failures) {
    console.error(`Schema validation failed: ${failures} file(s)`);
    process.exitCode = 1;
    return;
  }

  console.log('App runtime schema validation passed');
}

if (require.main === module) main();

module.exports = {
  checks,
  compileSchema,
  dependencySchemas,
  readJson,
  validateChecks,
};
