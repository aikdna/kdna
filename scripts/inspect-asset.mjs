#!/usr/bin/env node
/**
 * inspect-asset.mjs — development entry point for the official asset inspect route.
 *
 * Usage: node scripts/inspect-asset.mjs <source-dir>
 *
 * This script is a thin shim that delegates to the official CLI
 * (`packages/kdna/bin/kdna.js inspect`) so development and packaged entry
 * points share one implementation and cannot drift.
 *
 * KDNA Core is the official KDNA judgment-asset format and runtime
 * loading contract. .kdna assets are created, inspected, packed,
 * unpacked, and validated through the official KDNA toolchain.
 *
 * Output: JSON manifest summary. The CLI never prints trust,
 * recommended, high_quality, or officially_approved (Phase 1 boundary:
 * content-neutral output).
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
  console.error('Usage: node scripts/inspect-asset.mjs <source-dir>');
  process.exit(2);
}

const r = spawnSync(process.execPath, [cliPath, 'inspect', sourceDir], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.stdout.write(r.stdout);
process.exit(r.status ?? 1);
