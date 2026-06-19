/**
 * Authorization conformance tests for KDNA Core v1.
 *
 * The fixtures and goldens in conformance/authorization are the shared
 * contract that other implementations, including Swift Core and Chat,
 * should consume. This test proves the JS Core and CLI shim stay aligned
 * with that contract.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv/dist/2020.js');

const v1 = require('../../packages/kdna-core/src/v1');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliBin = path.join(repoRoot, 'packages', 'kdna', 'bin', 'kdna.js');
const authRoot = path.join(repoRoot, 'conformance', 'authorization');
const caseIndex = JSON.parse(fs.readFileSync(path.join(authRoot, 'cases.json'), 'utf8'));
const cases = caseIndex.cases;
const casesSchema = JSON.parse(fs.readFileSync(path.join(authRoot, 'cases.schema.json'), 'utf8'));
const loadPlanSchema = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'schema', 'load-plan.schema.json'), 'utf8'),
);
const ajv = new Ajv({ allErrors: true, strict: false });
const validateCasesSchema = ajv.compile(casesSchema);
const validateLoadPlanSchema = ajv.compile(loadPlanSchema);

function normalizePlan(plan, testCase) {
  return {
    ...plan,
    source: {
      ...plan.source,
      path: `<fixture:${testCase.fixture}>`,
    },
  };
}

function assertValidLoadPlan(plan) {
  assert.equal(
    validateLoadPlanSchema(plan),
    true,
    JSON.stringify(validateLoadPlanSchema.errors, null, 2),
  );
}

function runCli(args) {
  return spawnSync(process.execPath, [cliBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

test('authorization conformance: cases index matches schema', () => {
  assert.equal(
    validateCasesSchema(caseIndex),
    true,
    JSON.stringify(validateCasesSchema.errors, null, 2),
  );
});

for (const testCase of cases) {
  test(`authorization conformance: JS Core matches ${testCase.id}`, () => {
    const fixturePath = path.join(authRoot, 'fixtures', testCase.fixture);
    const golden = JSON.parse(fs.readFileSync(path.join(authRoot, testCase.golden), 'utf8'));
    const actual = normalizePlan(v1.planLoad(fixturePath, testCase.options), testCase);
    assertValidLoadPlan(actual);
    assert.deepEqual(actual, golden);
  });

  if (Array.isArray(testCase.cli_args)) {
    test(`authorization conformance: CLI matches ${testCase.id}`, () => {
      const fixturePath = path.join(authRoot, 'fixtures', testCase.fixture);
      const golden = JSON.parse(fs.readFileSync(path.join(authRoot, testCase.golden), 'utf8'));
      const r = runCli(['plan-load', fixturePath, ...testCase.cli_args]);
      const actual = normalizePlan(JSON.parse(r.stdout), testCase);
      assertValidLoadPlan(actual);
      assert.deepEqual(actual, golden);
      assert.equal(r.status, golden.state === 'invalid' ? 1 : 0, r.stderr);
    });
  }
}
