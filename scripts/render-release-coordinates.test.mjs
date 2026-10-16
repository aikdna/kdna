#!/usr/bin/env node
// Reverse cases for the release-coordinate renderer.
//
// The renderer used to be run only by hand, so the entry could drift from the
// matrix without any check noticing. It is now a gate (`--check`); these cases
// keep the gate able to fail: a stale entry, and an entry whose rendered block
// was removed, are both refused. The cases run against a temporary copy of the
// files the renderer owns, so the real entry is never touched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const RENDERER = 'scripts/render-release-coordinates.mjs';
const MATRIX = 'docs/release-coordinates.json';
const SNIPPET = 'docs/release-coordinates.snippet.md';

function rendererCopy({ mutate } = {}) {
  const work = mkdtempSync(join(tmpdir(), 'release-coordinates-'));
  mkdirSync(join(work, 'scripts'), { recursive: true });
  mkdirSync(join(work, 'docs'), { recursive: true });
  cpSync(join(ROOT, RENDERER), join(work, RENDERER));
  for (const file of ['README.md', MATRIX, SNIPPET]) {
    let text = readFileSync(join(ROOT, file), 'utf8');
    if (file === MATRIX && mutate) text = mutate(text);
    writeFileSync(join(work, file), text);
  }
  return { work, entry: join(work, RENDERER) };
}

function runRenderer(entry) {
  try {
    const stdout = execFileSync(process.execPath, [entry, '--check'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output: stdout };
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` };
  }
}

test('the committed entry is in sync with the matrix', () => {
  assert.deepEqual(runRenderer(join(ROOT, RENDERER)), {
    status: 0,
    output: 'release coordinates are in sync with the matrix\n',
  });
});

test('a matrix coordinate that the entry does not state is refused', () => {
  const { entry } = rendererCopy({
    mutate: (text) =>
      text
        .replace('"version": "0.37.7"', '"version": "0.37.8"')
        .replace('"artifact_sha256": "3dd7c560', '"artifact_sha256": "0000000000'),
  });
  const result = runRenderer(entry);
  assert.notEqual(result.status, 0, 'a drifted matrix must fail the check');
  assert.match(result.output, /stale/u);
});

test('an entry with no rendered block is refused instead of silently passing', () => {
  const { work } = rendererCopy();
  writeFileSync(
    join(work, 'README.md'),
    readFileSync(join(ROOT, 'README.md'), 'utf8').replace(
      '<!-- release-coordinates:begin',
      '<!-- release-coordinates-removed',
    ),
  );
  const result = runRenderer(join(work, RENDERER));
  assert.notEqual(result.status, 0);
  assert.match(result.output, /no rendered coordinate block/u);
});

test('the check is wired into the local chain and into CI', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.match(packageJson.scripts.test, /release:coordinates:check/u);
  const workflow = readFileSync(join(ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /release:coordinates:check|render-release-coordinates\.mjs --check/u);
});
