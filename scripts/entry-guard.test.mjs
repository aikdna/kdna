#!/usr/bin/env node
/*
 * Regression test for the entry guards of this repository's commands.
 *
 * The defect it pins: an entry guard decided "am I the command-line entry point?"
 * by comparing `process.argv[1]` with the module's own path using `path.resolve`.
 * `path.resolve` does not resolve symlinks, so an invocation through an aliased
 * directory (macOS `/var` -> `/private/var`, a symlinked checkout, a linked
 * working copy) made the comparison false. The main function then never ran and
 * the process exited 0 with no output: a user's "the command succeeded" proved
 * nothing about the gate.
 *
 * What is pinned here, for every guard repaired in this change:
 *   1. the canonical path RUNS the command (and fails, non-zero, on a
 *      deliberately invalid argument);
 *   2. an aliased path produces exactly the same run, never a silent exit 0;
 *   3. importing the module executes nothing and still exits 0.
 */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Commands that reject unknown arguments: the canonical and the aliased run must
// fail identically instead of one of them exiting 0 without doing anything.
const INVALID_ARGUMENT_ENTRIES = [
  {
    file: 'scripts/public-contract/verify.mjs',
    args: ['--nonsense-flag'],
    expected: /ARGUMENT/,
  },
  {
    file: 'scripts/public-contract/generate.mjs',
    args: ['--nonsense-flag'],
    expected: /unknown argument/,
  },
];

// Commands that take no arguments: the aliased run must do the same work as the
// canonical one, so its verdict has to appear on stdout in both cases.
const RUNS_ENTRIES = [
  { file: 'scripts/check-public-narrative-boundaries.mjs', args: [] },
  { file: 'conformance/envelope-aead.mjs', args: [] },
];

// Every repaired guard. Importing any of them must not run the main function,
// whether or not the file is also exercised as a command above.
const IMPORT_ONLY_ENTRIES = [
  'scripts/check-post-cutover-naming.mjs',
  'scripts/publish-health.mjs',
  'scripts/generate-post-cutover-token-authority.mjs',
  'scripts/check-scoped-release-readiness.mjs',
  'scripts/generate-container-negative-fixtures.mjs',
];

const ALL_ENTRIES = [
  ...INVALID_ARGUMENT_ENTRIES.map((entry) => entry.file),
  ...RUNS_ENTRIES.map((entry) => entry.file),
  ...IMPORT_ONLY_ENTRIES,
];

function runFile(file, args) {
  return spawnSync(process.execPath, [file, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

function runImportProbe(file) {
  const url = pathToFileURL(path.join(ROOT, file)).href;
  const code =
    `import(${JSON.stringify(url)}).then(() => {}, ` +
    `(error) => { console.error(String(error)); process.exitCode = 1; });`;
  return spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });
}

// A directory symlink to this repository. Returns null when the platform refuses
// to create one; the caller reports the skip instead of asserting silently.
function aliasDirectory(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-entry-guard-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const alias = path.join(root, 'kdna-alias');
  try {
    fs.symlinkSync(fs.realpathSync(ROOT), alias, 'dir');
  } catch (error) {
    if (['EACCES', 'ENOTSUP', 'EPERM'].includes(error.code)) {
      t.diagnostic(`aliased-directory half skipped: symlink creation failed with ${error.code}`);
      return null;
    }
    throw error;
  }
  return alias;
}

for (const entry of INVALID_ARGUMENT_ENTRIES) {
  test(`${entry.file} runs and fails non-zero on an invalid argument, also through an alias`, (t) => {
    const canonical = runFile(path.join(ROOT, entry.file), entry.args);
    assert.notEqual(canonical.status, 0, 'the canonical run must fail on an invalid argument');
    assert.match(`${canonical.stdout}${canonical.stderr}`, entry.expected);

    const alias = aliasDirectory(t);
    if (alias === null) return;
    const aliased = runFile(path.join(alias, entry.file), entry.args);
    assert.notEqual(aliased.status, 0, 'the aliased run must fail, not exit 0');
    assert.equal(aliased.status, canonical.status);
    assert.equal(aliased.stdout, canonical.stdout);
    assert.equal(aliased.stderr, canonical.stderr);
  });
}

for (const entry of RUNS_ENTRIES) {
  test(`${entry.file} does the same work through an alias`, (t) => {
    const canonical = runFile(path.join(ROOT, entry.file), entry.args);
    assert.equal(canonical.status, 0);
    assert.notEqual(canonical.stdout.trim(), '', 'the canonical run must print its verdict');

    const alias = aliasDirectory(t);
    if (alias === null) return;
    const aliased = runFile(path.join(alias, entry.file), entry.args);
    assert.equal(aliased.status, 0);
    assert.notEqual(
      aliased.stdout.trim(),
      '',
      'the aliased run must not exit 0 having done nothing',
    );
    assert.equal(aliased.stdout, canonical.stdout);
  });
}

for (const file of ALL_ENTRIES) {
  test(`${file} does not execute anything when imported`, () => {
    const probe = runImportProbe(file);
    assert.equal(probe.status, 0, `importing ${file} must not fail: ${probe.stderr}`);
    assert.equal(probe.stdout, '', `importing ${file} must not run the main function`);
    assert.equal(probe.stderr, '', `importing ${file} must not write to stderr`);
  });
}
