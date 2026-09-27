#!/usr/bin/env node
// Runs the current public-contract obligation suites against a runtime root.
//
// Both suites take an absolute isolated runtime root and an absolute report path
// so a third party can point them at its own implementation. This wrapper is the
// repository's own gate: it supplies the runtime, a scratch directory for the
// reports, and fails if either suite reports a failure. The suites are also the
// reason it exists — without a wired entry point, a stale obligation could stay
// green forever without ever running.
//
// The runtime root is the checkout itself when the workspace is installed, and an
// explicit isolated root when it is not (this line is held to a zero-install
// checkout, so adjacency resolution cannot come from a workspace node_modules):
//
//   KDNA_PUBLIC_RUNTIME=/abs/isolated-root node scripts/public-contract/run-obligations.mjs
//
// The child keeps NODE_PATH cleared, so the adjacency dependencies it resolves can
// only come from that runtime root and never from the caller's ambient path.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runtime = path.resolve(
  process.env.KDNA_PUBLIC_RUNTIME ?? process.env.KDNA_RUNTIME_ROOT ?? root,
);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-public-contract-'));
const suites = ['runtime-obligations.cjs', 'package-surfaces.cjs'];
let failed = 0;

console.log(`public-contract obligations: runtime root ${runtime}`);

for (const suite of suites) {
  const script = path.join(root, 'conformance/public-contract/test', suite);
  const report = path.join(scratch, suite.replace(/\.cjs$/u, '.report.json'));
  const child = spawnSync(process.execPath, [script, runtime, report], {
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
