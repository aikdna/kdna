#!/usr/bin/env node
const fs = require('fs');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

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
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

let failures = 0;

for (const check of checks) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(readJson(check.schema));
  const ok = validate(readJson(check.data));

  if (ok) {
    console.log(`OK ${check.data}`);
    continue;
  }

  failures += 1;
  console.error(`FAIL ${check.data}`);
  for (const error of validate.errors || []) {
    console.error(`  ${error.instancePath || '/'} ${error.message}`);
  }
}

if (failures) {
  console.error(`Schema validation failed: ${failures} file(s)`);
  process.exit(1);
}

console.log('App runtime schema validation passed');
