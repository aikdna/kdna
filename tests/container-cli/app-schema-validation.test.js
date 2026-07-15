'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  compileSchema,
  dependencySchemas,
  readJson,
} = require('../../scripts/validate-app-schemas');

test('isolated judgment trace validator registers every referenced schema before compile', () => {
  assert.deepEqual(dependencySchemas, [
    'specs/digest-evidence.schema.json',
    'specs/agent-host-receipt.schema.json',
    'specs/agent-host-capabilities.schema.json',
    'specs/consumption-plan.schema.json',
  ]);
  const validate = compileSchema('schema/judgment-trace.schema.json');
  const trace = readJson('examples/app-runtime-contract/generic-client-trace.json');
  assert.equal(validate(trace), true, JSON.stringify(validate.errors, null, 2));
});
