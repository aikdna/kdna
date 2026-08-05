#!/usr/bin/env node
// Fails closed when docs/inspector/index.html is stale relative to the pinned
// @aikdna/kdna-web-client devDependency or the template. Rebuilds into a temp
// copy and byte-compares; never rewrites the committed file.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(ROOT, 'docs', 'inspector', 'index.html');

if (!fs.existsSync(OUT_PATH)) {
  console.error(
    'check:asset-inspector: docs/inspector/index.html is missing; run npm run build:asset-inspector',
  );
  process.exit(1);
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-inspector-check-'));
const tmpOut = path.join(tmpDir, 'index.html');
try {
  // Rebuild against a scratch output by temporarily pointing the builder at a
  // copy of the template dir; simplest correct route is to rebuild in place to
  // a sibling file and compare, so we invoke the builder with an env override.
  const result = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts', 'build-asset-inspector.mjs')],
    {
      cwd: ROOT,
      env: { ...process.env, KDNA_INSPECTOR_OUT: tmpOut },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    console.error('check:asset-inspector: rebuild failed');
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  const committed = fs.readFileSync(OUT_PATH);
  const rebuilt = fs.readFileSync(tmpOut);
  if (!committed.equals(rebuilt)) {
    console.error(
      'check:asset-inspector: docs/inspector/index.html is stale; ' +
        'run "npm run build:asset-inspector" and commit the result.',
    );
    process.exit(1);
  }
  console.log('check:asset-inspector: index.html matches the pinned kdna-web-client build');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
