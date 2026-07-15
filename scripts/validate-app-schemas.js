#!/usr/bin/env node

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const JsonSchema2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..');

const judgmentTraceSchemas = {
  canonical: 'specs/judgment-trace.schema.json',
  rootMirror: 'schema/judgment-trace.schema.json',
  published: 'packages/kdna-core/schema/judgment-trace.schema.json',
};

const dependencySchemas = [
  'specs/digest-evidence.schema.json',
  'specs/agent-host-receipt.schema.json',
  'specs/agent-host-capabilities.schema.json',
  'specs/consumption-plan.schema.json',
];

const publishedDependencySchemas = [
  'packages/kdna-core/schema/digest-evidence.schema.json',
  'packages/kdna-core/schema/agent-host-receipt.schema.json',
  'packages/kdna-core/schema/agent-host-capabilities.schema.json',
  'packages/kdna-core/schema/consumption-plan.schema.json',
];

const checks = [
  ...['generic-client', 'generic-authoring', 'generic-workbench'].map((prefix) => ({
    schema: judgmentTraceSchemas.published,
    dependencySchemas: publishedDependencySchemas,
    data: `examples/app-runtime-contract/${prefix}-trace.json`,
  })),
  ...['generic-client', 'generic-authoring', 'generic-workbench'].map((prefix) => ({
    schema: 'schema/feedback-event.schema.json',
    data: `examples/app-runtime-contract/${prefix}-feedback.json`,
  })),
];

function readBytes(file, options = {}) {
  const root = options.root || repoRoot;
  const readFile = options.readFile || fs.readFileSync;
  return readFile(path.resolve(root, file));
}

function readJson(file, options = {}) {
  return JSON.parse(readBytes(file, options).toString('utf8'));
}

function validateJudgmentTraceAuthority(options = {}) {
  const errors = [];
  let canonical;
  try {
    canonical = readBytes(judgmentTraceSchemas.canonical, options);
  } catch (readError) {
    return [`${judgmentTraceSchemas.canonical}: unable to read: ${readError.message}`];
  }

  for (const mirror of [judgmentTraceSchemas.rootMirror, judgmentTraceSchemas.published]) {
    try {
      if (!canonical.equals(readBytes(mirror, options))) {
        errors.push(
          `${mirror}: must be byte-for-byte identical to canonical ${judgmentTraceSchemas.canonical}`,
        );
      }
    } catch (readError) {
      errors.push(`${mirror}: unable to read: ${readError.message}`);
    }
  }
  return errors;
}

function compileSchema(schemaPath, options = {}) {
  const dependencies = options.dependencySchemas || dependencySchemas;
  const ajv = new JsonSchema2020({ allErrors: true, strict: false, loadSchema: undefined });
  addFormats(ajv);
  for (const dependency of dependencies) ajv.addSchema(readJson(dependency, options));
  return ajv.compile(readJson(schemaPath, options));
}

function validateChecks(checksToRun = checks, logger = console) {
  let failures = 0;

  for (const authorityError of validateJudgmentTraceAuthority()) {
    failures += 1;
    logger.error(`FAIL ${authorityError}`);
  }

  for (const check of checksToRun) {
    let validate;
    try {
      validate = compileSchema(check.schema, {
        dependencySchemas: check.dependencySchemas || dependencySchemas,
      });
    } catch (compileError) {
      failures += 1;
      logger.error(`FAIL ${check.schema}: unable to compile: ${compileError.message}`);
      continue;
    }

    let data;
    try {
      data = readJson(check.data);
    } catch (readError) {
      failures += 1;
      logger.error(`FAIL ${check.data}: unable to read: ${readError.message}`);
      continue;
    }

    if (validate(data)) {
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
    console.error(`Schema validation failed: ${failures} issue(s)`);
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
  judgmentTraceSchemas,
  publishedDependencySchemas,
  readJson,
  validateChecks,
  validateJudgmentTraceAuthority,
};
