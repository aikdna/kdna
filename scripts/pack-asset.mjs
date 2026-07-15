#!/usr/bin/env node
/**
 * pack-asset.mjs — development entry point for the official asset pack route.
 *
 * Usage: node scripts/pack-asset.mjs <source-dir> [output-path]
 *
 * This script is a thin shim that delegates to the official CLI
 * (`packages/kdna/bin/kdna.js pack`) so development and packaged entry
 * points share one implementation and cannot drift.
 *
 * KDNA Core is the official KDNA judgment-asset format and runtime
 * loading contract. .kdna assets are created, inspected, packed,
 * unpacked, and validated through the official KDNA toolchain.
 *
 * Output: a deterministic ZIP-compatible .kdna container with mimetype
 * as the first entry (uncompressed). Packing the same source directory
 * twice produces byte-identical output, so the SHA-256 is stable.
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
  console.error('Usage: node scripts/pack-asset.mjs <source-dir> [output-path]');
  process.exit(2);
}

const r = spawnSync(process.execPath, [cliPath, 'pack', ...args], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});
process.stdout.write(r.stdout);
process.exit(r.status ?? 1);
