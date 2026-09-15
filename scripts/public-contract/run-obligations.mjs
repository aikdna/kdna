#!/usr/bin/env node
// Runs the current public-contract obligation suites against this checkout.
//
// Both suites take an absolute isolated runtime root and an absolute report path
// so a third party can point them at its own implementation. This wrapper is the
// repository's own gate: it supplies this checkout as the runtime and a scratch
// directory for the reports, and fails if either suite reports a failure. The
// suites are also the reason it exists — without a wired entry point, a stale
// obligation could stay green forever without ever running.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-public-contract-'));
const suites = ['runtime-obligations.cjs', 'package-surfaces.cjs'];
let failed = 0;

for (const suite of suites) {
  const script = path.join(root, 'conformance/public-contract/test', suite);
  const report = path.join(scratch, suite.replace(/\.cjs$/u, '.report.json'));
  const child = spawnSync(process.execPath, [script, root, report], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_PATH: '' },
  });
  if (child.status !== 0) failed += 1;
  else console.log(`${suite}: report ${report}`);
}

if (failed > 0) {
  console.error(`public-contract obligations: ${failed} of ${suites.length} suites failed`);
  process.exitCode = 1;
}
