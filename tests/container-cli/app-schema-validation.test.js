'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const {
  checks,
  compileSchema,
  dependencySchemas,
  judgmentTraceSchemas,
  publishedDependencySchemas,
  readJson,
  validateJudgmentTraceAuthority,
} = require('../../scripts/validate-app-schemas');

const repoRoot = path.resolve(__dirname, '..', '..');

test('published JudgmentTrace validator registers every referenced schema before compile', () => {
  assert.deepEqual(dependencySchemas, [
    'specs/digest-evidence.schema.json',
    'specs/agent-host-receipt.schema.json',
    'specs/agent-host-capabilities.schema.json',
    'specs/consumption-plan.schema.json',
  ]);
  assert.deepEqual(publishedDependencySchemas, [
    'packages/kdna-core/schema/digest-evidence.schema.json',
    'packages/kdna-core/schema/agent-host-receipt.schema.json',
    'packages/kdna-core/schema/agent-host-capabilities.schema.json',
    'packages/kdna-core/schema/consumption-plan.schema.json',
  ]);
  assert.ok(
    checks
      .filter(({ data }) => data.endsWith('-trace.json'))
      .every(({ schema }) => schema === judgmentTraceSchemas.published),
  );

  const validate = compileSchema(judgmentTraceSchemas.published, {
    dependencySchemas: publishedDependencySchemas,
  });
  const trace = readJson('examples/app-runtime-contract/generic-client-trace.json');
  assert.equal(validate(trace), true, JSON.stringify(validate.errors, null, 2));
});

test('canonical, root mirror, and published JudgmentTrace schemas have one byte authority', () => {
  assert.deepEqual(validateJudgmentTraceAuthority(), []);
});

test('JudgmentTrace authority gate rejects either drifting mirror', async (t) => {
  for (const mirror of [judgmentTraceSchemas.rootMirror, judgmentTraceSchemas.published]) {
    await t.test(mirror, (t) => {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-trace-authority-'));
      t.after(() => fs.rmSync(root, { force: true, recursive: true }));
      for (const relativePath of Object.values(judgmentTraceSchemas)) {
        const target = path.join(root, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(path.join(repoRoot, relativePath), target);
      }
      fs.appendFileSync(path.join(root, mirror), '\n');

      const errors = validateJudgmentTraceAuthority({ root });
      assert.deepEqual(errors, [
        `${mirror}: must be byte-for-byte identical to canonical ${judgmentTraceSchemas.canonical}`,
      ]);
    });
  }
});
