#!/usr/bin/env node
/**
 * v1-unpack.mjs — reference wrapper around the official kdna CLI for
 * KDNA Core v1 container unpacking.
 *
 * Usage: node scripts/v1-unpack.mjs <input.kdna> [output-dir]
 *
 * This script is a thin shim that delegates to the official CLI
 * (`packages/kdna/bin/kdna.js unpack`) so the reference scripts and
 * the official entry point share one implementation and cannot drift.
 *
 * Reads the ZIP central directory, extracts every entry, and refuses to
 * write outside the destination. Does NOT auto-execute any entry.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const cliPath = path.join(repoRoot, 'packages', 'kdna', 'bin', 'kdna.js');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/v1-unpack.mjs <input.kdna> [output-dir]');
  process.exit(2);
}

const r = spawnSync(process.execPath, [cliPath, 'unpack', ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.stdout.write(r.stdout);
process.exit(r.status ?? 1);
