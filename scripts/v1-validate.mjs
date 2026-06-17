#!/usr/bin/env node
/**
 * v1-validate.mjs — reference wrapper around the official kdna CLI for
 * KDNA Core v1 source-directory validation.
 *
 * Usage: node scripts/v1-validate.mjs <source-dir>
 *
 * This script is a thin shim that delegates to the official CLI
 * (`packages/kdna/bin/kdna.js validate`) so the reference scripts and
 * the official entry point share one implementation and cannot drift.
 *
 * Exits 0 on success, non-zero on any validation failure.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'packages', 'kdna', 'bin', 'kdna.js');

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/v1-validate.mjs <source-dir>');
  process.exit(2);
}

const r = spawnSync(process.execPath, [cliPath, 'validate', sourceDir], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.stdout.write(r.stdout);
if (r.status === 0) {
  console.log('\nAll Phase 1 schema checks passed.');
}
process.exit(r.status ?? 1);
