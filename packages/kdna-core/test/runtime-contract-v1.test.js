const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

test('ConsumptionPlan 1.0, Host 2, and JudgmentTrace 1.0 conformance vectors pass', () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT, 'conformance', 'runtime-contract-v1', 'run.mjs')],
    { cwd: ROOT, encoding: 'utf8' },
  );

  assert.match(output, /Runtime contract v1 valid/);
});
