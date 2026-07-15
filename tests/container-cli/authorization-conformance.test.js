/**
 * Authorization conformance tests for KDNA Core container.
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
const os = require('node:os');
const path = require('node:path');
const Ajv = require('ajv/dist/2020.js');

const container = require('../../packages/kdna-core/src/container');

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

function withPackedFixture(fixturePath, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-auth-conformance-'));
  const assetPath = path.join(tmp, 'fixture.kdna');
  try {
    container.pack(fixturePath, assetPath);
    return fn(assetPath);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
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
    withPackedFixture(fixturePath, (assetPath) => {
      const actual = normalizePlan(container.planLoad(assetPath, testCase.options), testCase);
      assertValidLoadPlan(actual);
      assert.deepEqual(actual, golden);
    });
  });

  if (Array.isArray(testCase.cli_args)) {
    test(`authorization conformance: CLI matches ${testCase.id}`, () => {
      const fixturePath = path.join(authRoot, 'fixtures', testCase.fixture);
      const golden = JSON.parse(fs.readFileSync(path.join(authRoot, testCase.golden), 'utf8'));
      withPackedFixture(fixturePath, (assetPath) => {
        const r = runCli(['plan-load', assetPath, ...testCase.cli_args]);
        const actual = normalizePlan(JSON.parse(r.stdout), testCase);
        assertValidLoadPlan(actual);
        assert.deepEqual(actual, golden);
        const expectedStatus =
          golden.state === 'invalid' ? 1 : golden.can_load_now === true ? 0 : 3;
        assert.equal(r.status, expectedStatus, r.stderr);
      });
    });
  }
}
