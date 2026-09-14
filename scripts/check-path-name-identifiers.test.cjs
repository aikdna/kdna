#!/usr/bin/env node
'use strict';
/*
 * Standing negative controls for scripts/check-path-name-identifiers.cjs.
 *
 * These are what make the path-name gate a gate rather than a decoration:
 *
 *   1. a CLEAN COPY must really run the gate and print its success line;
 *   2. re-adding the exact 2026-09-13 defect — a lowercase work-order path
 *      name like `pd275-…` — must turn the gate RED;
 *   3. the ruler must be case-insensitive and `-`/`_` tolerant, so `PD-275`,
 *      `pd_278` and `ir_retention_pd273` are the same defect;
 *   4. a present-but-unignored path name (never `git add`-ed) must be RED too,
 *      because the leak is a path on disk, not only a path in the index;
 *   5. `--paths` / `--files` / `--list` / `--allow` / `--ignore`
 *      (self-reported input) must be refused with exit status 2;
 *   6. the entry guard must let a symlinked invocation RUN the gate, so a
 *      symlink can never silently exit 0 without checking anything;
 *   7. the gate module must expose its documented surface and its ruler must
 *      classify the known-bad and known-good names the way the contract says.
 *
 * If the gate is replaced by a stub that prints success and exits 0, cases 2-5
 * and 7 fail and this file — which runs inside `npm test` — turns the chain red.
 *
 * Every mutation happens in a throwaway clone under os.tmpdir(); the repository
 * under test is never modified.
 *
 * NOTE: this file deliberately does NOT `require()` the gate at the top level.
 * A stub whose top-level code calls `process.exit(0)` would kill the test
 * process during the require and node's runner would then report the file
 * itself as one passing test — a silent false green. Every check below drives
 * the gate as a subprocess instead, which is how it is really used.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const GATE_REL = path.join('scripts', 'check-path-name-identifiers.cjs');

// Contract literals, restated here on purpose so the controls do not depend on
// loading the module they are testing.
const SUCCESS_LINE = 'KDNA-PATH-NAME-IDENTIFIERS: CLEAN';
const GATE_EXPORTS = [
  'checkPathNames',
  'presentPaths',
  'scanPathNames',
  'REFUSED_INPUT_FLAGS',
  'SUCCESS_LINE',
  'WORK_ORDER_PATH_PATTERN',
];
const KNOWN_BAD = [
  'pd275-inexact-0.kdna',
  'fixtures/pd278-json-node-frozen.json',
  'PD-275-notes.md',
  'docs/pd_278_case.md',
  'specs/ir_retention_pd273.json',
  'PD251_receipt_sha256.json',
];
const KNOWN_GOOD = [
  'number-inexact-0.kdna',
  'fixtures/json-node-frozen.json',
  'README.md',
  'scripts/check-path-name-identifiers.cjs',
  'packages/kdna-core/src/public-contract/generated-contract.json',
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

function addTrackedPath(dir, relativePath) {
  const absolute = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, 'defect fixture\n');
  git(dir, ['add', '--', relativePath]);
}

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-pathname-negctl-'));
});

after(() => {
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

test('case 1: a clean copy really runs the gate and prints its success line', () => {
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
  assert.match(r.stdout, /scanned=\d+ present path names/);
});

test('case 2: re-adding a lowercase work-order path name turns the gate red', () => {
  const dir = freshClone('readd');
  // This is the exact 2026-09-13 defect: a tracked file whose name carries the
  // work-order identifier in lowercase.
  addTrackedPath(dir, 'pd275-inexact-0.kdna');
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /PATH-NAME FAIL/);
  assert.match(r.stderr, /pd275-inexact-0\.kdna/);
});

test('case 3: the ruler is case-insensitive and -/_ tolerant', () => {
  const variants = ['PD-275-notes.md', 'docs/pd_278_case.md', 'specs/ir_retention_pd273.json'];
  for (const variant of variants) {
    const dir = freshClone('variant');
    addTrackedPath(dir, variant);
    const r = runGate(dir);
    assert.equal(r.status, 1, `${variant} must be rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert.match(r.stderr, /PATH-NAME FAIL/);
  }
});

test('case 4: a present-but-unignored path name is red even without `git add`', () => {
  const dir = freshClone('untracked');
  fs.writeFileSync(path.join(dir, 'pd278-loose.json'), 'present only\n');
  const status = git(dir, ['status', '--porcelain', '--', 'pd278-loose.json']).trim();
  assert.equal(status.startsWith('??'), true, 'fixture error: file is not present-and-unignored');
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /pd278-loose\.json/);
});

test('case 5: self-reported input flags are refused with rc=2', () => {
  const dir = freshClone('flags');
  for (const flag of ['--paths', '--files', '--list', '--allow', '--ignore']) {
    const r = runGate(dir, [`${flag}=/tmp/whatever.txt`]);
    assert.equal(r.status, 2, `${flag} must be rc=2, got ${r.status}`);
    assert.match(r.stderr, /refusing caller-supplied path input/);
  }
  const unknown = runGate(dir, ['--pretend-ok']);
  assert.equal(unknown.status, 2, `unknown flag must be rc=2, got ${unknown.status}`);
});

test('case 6: the realpath entry guard runs the gate through a symlink', () => {
  const dir = freshClone('symlink');
  const link = path.join(scratch, 'symlinked-pathname-entry.cjs');
  fs.symlinkSync(path.join(dir, GATE_REL), link);
  const r = spawnSync(process.execPath, [link], { cwd: dir, encoding: 'utf8' });
  assert.equal(
    r.status,
    0,
    `symlinked entry must still RUN the gate, got ${r.status}\n${r.stderr}`,
  );
  assert.ok(r.stdout.includes(SUCCESS_LINE), 'symlinked entry did not print the success line');
});

test('case 7: the gate module exposes its documented surface and ruler behaviour', () => {
  const dir = freshClone('exports');
  const code = [
    `const g = require(${JSON.stringify(path.join(dir, GATE_REL))});`,
    `const missing = ${JSON.stringify(GATE_EXPORTS)}.filter((k) => g[k] === undefined);`,
    `if (missing.length) { console.error('missing exports: ' + missing.join(',')); process.exit(3); }`,
    `const bad = ${JSON.stringify(KNOWN_BAD)}.filter((p) => !g.WORK_ORDER_PATH_PATTERN.test(p));`,
    `const good = ${JSON.stringify(KNOWN_GOOD)}.filter((p) => g.WORK_ORDER_PATH_PATTERN.test(p));`,
    `if (bad.length || good.length) { console.error('ruler mismatch bad=' + bad + ' good=' + good); process.exit(4); }`,
    `console.log('KDNA_PATH_NAME_GATE_EXPORTS_OK');`,
  ].join('\n');
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' });
  assert.equal(
    r.status,
    0,
    `gate module must expose its documented surface, got ${r.status}\n${r.stdout}\n${r.stderr}`,
  );
  assert.match(r.stdout, /KDNA_PATH_NAME_GATE_EXPORTS_OK/);
});
