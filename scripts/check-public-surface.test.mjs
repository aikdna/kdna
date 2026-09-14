#!/usr/bin/env node
/*
 * Standing controls for scripts/check-public-surface.mjs.
 *
 * These are what make the public-surface gate a gate rather than a decoration,
 * and they exist because a 2026-09-13 review found a real hole: injecting the
 * internal commercial product name into a tracked file left this gate GREEN,
 * because the name was absent from the marker set. Only the one copy that
 * happened to sit inside a byte-pinned design input was ever covered.
 *
 *   1. a CLEAN COPY must really run the gate, print its success line, and carry
 *      no exception note (nothing is exempt);
 *   2. injecting the internal product name into an ordinary tracked file must
 *      turn the gate RED (the sensitivity control that used to fail);
 *   3. injecting the pre-existing redact literal must still turn it RED;
 *   4. re-introducing the internal product name into the file that used to be
 *      exempt must now turn the gate RED, exactly like any other file;
 *   5. the entry guard must let a symlinked invocation RUN the gate;
 *   6. the module must expose its documented surface, its marker set must
 *      actually classify the internal product name, and its exception tuple set
 *      must be EMPTY and digest-pinned so an exception cannot be added silently.
 *
 * This file deliberately does not contain the guarded names in the clear — the
 * gate scans tracked files, including this one — so they are assembled from
 * fragments at run time.
 *
 * Every mutation happens in a throwaway clone under os.tmpdir(); the repository
 * under test is never modified.
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after, before } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GATE_REL = path.join('scripts', 'check-public-surface.mjs');

// Contract literals and guarded names, assembled so this file never carries
// them literally.
const SUCCESS_LINE = 'public-surface check passed';
const REDACTED_LITERAL = ['RE', 'DACTED'].join('');
const INTERNAL_PRODUCT_NAME = ['kdna', 'work'].join('');
const FORMER_EXCEPTED_PATH = 'rfcs/RFC-0020-minimal-projection-profile.md';
const PRODUCT_NAME_LABEL = 'internal product name';
const INJECTION_VICTIM = 'docs/getting-started.md';
const GATE_EXPORTS = [
  'ALLOWLIST_PATHS',
  'FORBIDDEN_EXCEPTIONS',
  'FORBIDDEN_EXCEPTIONS_DIGEST',
  'FORBIDDEN_HASHES',
  'SUCCESS_LINE',
  'forbiddenExceptionDigest',
  'forbiddenLabelsFor',
  'isAllowlisted',
  'main',
  'scanContent',
  'validateForbiddenExceptions',
];

let scratch;
let cloneSeq = 0;

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function freshClone(label) {
  const dest = path.join(scratch, `${label}-${++cloneSeq}`);
  execFileSync('git', ['clone', '--quiet', ROOT, dest], { stdio: ['ignore', 'pipe', 'pipe'] });
  return dest;
}

function runGate(cwd, args = []) {
  const r = spawnSync(process.execPath, [path.join(cwd, GATE_REL), ...args], {
    cwd,
    encoding: 'utf8',
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function appendLine(dir, relativePath, text) {
  fs.appendFileSync(path.join(dir, relativePath), `\n${text}\n`);
}

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-public-surface-negctl-'));
});

after(() => {
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

test('case 1: a clean copy runs the gate, prints the success line, and exempts nothing', () => {
  const dir = freshClone('clean');
  const r = runGate(dir);
  assert.equal(
    r.status,
    0,
    `expected rc=0 in a clean clone, got ${r.status}\n${r.stdout}\n${r.stderr}`,
  );
  assert.ok(
    r.stdout.includes(SUCCESS_LINE),
    `success line "${SUCCESS_LINE}" missing from stdout:\n${r.stdout}`,
  );
  assert.match(r.stdout, /files scanned, 0 violations/);
  // Nothing is exempt any more: a clean run must carry no exception note.
  assert.doesNotMatch(r.stdout, /declared forbidden-name exception/);
});

test('case 2: injecting the internal product name into an ordinary tracked file turns the gate red', () => {
  const dir = freshClone('productname');
  const tracked = git(dir, ['ls-files', '--', INJECTION_VICTIM]).trim();
  assert.equal(tracked, INJECTION_VICTIM, 'fixture error: injection victim is not tracked');
  appendLine(dir, INJECTION_VICTIM, `produced by ${INTERNAL_PRODUCT_NAME}`);
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /public-surface check failed/);
  assert.match(r.stderr, /forbidden-name:internal product name/);
});

test('case 3: the pre-existing redact-literal rule still bites', () => {
  const dir = freshClone('redacted');
  appendLine(dir, INJECTION_VICTIM, `${REDACTED_LITERAL}`);
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, new RegExp(`${REDACTED_LITERAL}-literal`));
});

test('case 4: re-introducing the internal product name into the once-exempt file turns the gate red', () => {
  const dir = freshClone('reintroduce');
  const tracked = git(dir, ['ls-files', '--', FORMER_EXCEPTED_PATH]).trim();
  assert.equal(tracked, FORMER_EXCEPTED_PATH, 'fixture error: path is not tracked');
  appendLine(dir, FORMER_EXCEPTED_PATH, `produced by ${INTERNAL_PRODUCT_NAME}`);
  const r = runGate(dir);
  assert.equal(
    r.status,
    1,
    `expected rc=1 once the name is back in that file, got ${r.status}\n${r.stdout}\n${r.stderr}`,
  );
  assert.match(r.stderr, /forbidden-name:internal product name/);
  assert.match(r.stderr, /RFC-0020-minimal-projection-profile\.md/);
});

test('case 5: the realpath entry guard runs the gate through a symlink', () => {
  const dir = freshClone('symlink');
  const link = path.join(scratch, 'symlinked-public-surface.mjs');
  fs.symlinkSync(path.join(dir, GATE_REL), link);
  const r = spawnSync(process.execPath, [link], { cwd: dir, encoding: 'utf8' });
  assert.equal(
    r.status,
    0,
    `symlinked entry must still RUN the gate, got ${r.status}\n${r.stderr}`,
  );
  assert.ok(r.stdout.includes(SUCCESS_LINE), 'symlinked entry did not print the success line');
});

test('case 6: the marker set is real and the exception set is empty but still digest-pinned', () => {
  const dir = freshClone('exports');
  const gateUrl = new URL(`file://${path.join(dir, GATE_REL)}`).href;
  const code = [
    `const g = await import(${JSON.stringify(gateUrl)});`,
    `const missing = ${JSON.stringify(GATE_EXPORTS)}.filter((k) => g[k] === undefined);`,
    `if (missing.length) { console.error('missing exports: ' + missing.join(',')); process.exit(3); }`,
    `const name = ${JSON.stringify(INTERNAL_PRODUCT_NAME)};`,
    `if (!g.forbiddenLabelsFor('produced by ' + name).includes(${JSON.stringify(PRODUCT_NAME_LABEL)})) {`,
    `  console.error('marker set does not classify the internal product name'); process.exit(4);`,
    `}`,
    `if (g.FORBIDDEN_EXCEPTIONS.length !== 0) {`,
    `  console.error('the exception set must be empty: nothing is exempt'); process.exit(5);`,
    `}`,
    `if (g.forbiddenExceptionDigest(g.FORBIDDEN_EXCEPTIONS) !== g.FORBIDDEN_EXCEPTIONS_DIGEST) {`,
    `  console.error('empty exception digest mismatch'); process.exit(6);`,
    `}`,
    `const widened = [{ path: ${JSON.stringify(FORMER_EXCEPTED_PATH)}, label: ${JSON.stringify(PRODUCT_NAME_LABEL)}, reason: 'A silently re-widened exception that must not be accepted by the pinned empty digest.' }];`,
    `if (g.forbiddenExceptionDigest(widened) === g.FORBIDDEN_EXCEPTIONS_DIGEST) {`,
    `  console.error('adding an exception did not change the digest'); process.exit(7);`,
    `}`,
    `console.log('KDNA_PUBLIC_SURFACE_GATE_EXPORTS_OK');`,
  ].join('\n');
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8' });
  assert.equal(
    r.status,
    0,
    `gate module contract check failed, got ${r.status}\n${r.stdout}\n${r.stderr}`,
  );
  assert.match(r.stdout, /KDNA_PUBLIC_SURFACE_GATE_EXPORTS_OK/);
});

test('case 7: read-only scanning ignores hostile Git controls and needs no private temp root', () => {
  const dir = freshClone('hostile-env');
  const temp = path.join(scratch, 'read-only-temp');
  fs.mkdirSync(temp);
  fs.chmodSync(temp, 0o777);
  const r = spawnSync(process.execPath, [path.join(dir, GATE_REL)], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: temp,
      TMPDIR: temp,
      TMP: temp,
      TEMP: temp,
      GIT_DIR: path.join(temp, 'absent-repository'),
      GIT_INDEX_FILE: path.join(temp, 'absent-index'),
      GIT_OBJECT_DIRECTORY: path.join(temp, 'absent-objects'),
      GIT_ALTERNATE_OBJECT_DIRECTORIES: path.join(temp, 'absent-alternate'),
      GIT_CONFIG_GLOBAL: path.join(temp, 'absent-config'),
      GIT_CONFIG_SYSTEM: path.join(temp, 'absent-system-config'),
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.bare',
      GIT_CONFIG_VALUE_0: 'true',
    },
  });
  assert.equal(r.status, 0, `read-only scan failed: ${r.stdout}\n${r.stderr}`);
  assert.ok(r.stdout.includes(SUCCESS_LINE));
  assert.match(r.stdout, /files scanned, 0 violations/);
});
