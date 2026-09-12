#!/usr/bin/env node
'use strict';
/*
 * Standing negative controls for scripts/check-inventory.cjs.
 *
 * These are what make the inventory gate a gate rather than a decoration:
 *
 *   1. a CLEAN COPY must really run the gate and print its success line;
 *   2. a file that a `.gitignore` pattern swallows, but which is declared
 *      must-track, must be reported RED;
 *   3. an undeclared present-but-untracked file must be RED;
 *   4. a tracked file matching a forbidden-tracked glob (internal material)
 *      must be RED;
 *   5. `--inventory` / `--state` / `--files` (self-reported input) must be
 *      refused with exit status 2;
 *   6. the entry guard must let a symlinked invocation RUN the gate, so a
 *      symlink can never silently exit 0 without checking anything.
 *
 * If the gate is replaced by a stub that prints success and exits 0, cases 2-5
 * fail and this file — which runs inside `npm test` — turns the chain red.
 *
 * Every mutation happens in a throwaway clone under os.tmpdir(); the repository
 * under test is never modified.
 *
 * NOTE: this file deliberately does NOT `require()` the gate. A stub whose
 * top-level code calls `process.exit(0)` would kill the test process during the
 * require and node's runner would then report the file itself as one passing
 * test — a silent false green. Every check below drives the gate as a
 * subprocess instead, which is how it is really used.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const GATE_REL = path.join('scripts', 'check-inventory.cjs');
const MANIFEST_REL = path.join('release-surface', 'inventory.json');

// Contract literals, restated here on purpose so the controls do not depend on
// loading the module they are testing.
const SUCCESS_LINE = 'KDNA-MONOREPO-INVENTORY: MATCH';
const GATE_EXPORTS = [
  'checkInventory',
  'globToRegExp',
  'matchesAny',
  'REQUIRED_MUST_TRACK',
  'FORBIDDEN_TRACKED',
  'REFUSED_INPUT_FLAGS',
  'SUCCESS_LINE',
];
// Any tracked file under one of these prefixes is covered by a declared
// must-track glob, so it is a valid victim for the "swallowed by .gitignore"
// control.
const MUST_TRACK_PREFIXES = [
  'python-sdk/kdna/core/_schemas',
  'packages/kdna-core/schema',
  'schema',
  'packages/kdna-conformance/public-contract',
];
const INTERNAL_VICTIM = 'python-sdk/delivery/current-bindings-20260909/independent-acceptance.md';

let scratch;
let cloneSeq = 0;

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function freshClone(label) {
  const dest = path.join(scratch, `${label}-${++cloneSeq}`);
  execFileSync('git', ['clone', '--quiet', ROOT, dest], { stdio: ['ignore', 'pipe', 'pipe'] });
  return dest;
}

function runGate(cwd, args = []) {
  const r = spawnSync(process.execPath, [path.join(cwd, GATE_REL), ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function loadManifest(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, MANIFEST_REL), 'utf8'));
}

function pickMustTrackVictim(dir) {
  for (const prefix of MUST_TRACK_PREFIXES) {
    const hit = git(dir, ['ls-files', '--', prefix]).split('\n').filter(Boolean)[0];
    if (hit) return hit;
  }
  return null;
}

before(() => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-inventory-negctl-'));
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
  assert.equal(r.status, 0, `expected rc=0 in a clean clone, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.ok(r.stdout.includes(SUCCESS_LINE), `success line "${SUCCESS_LINE}" missing from stdout:\n${r.stdout}`);
  assert.match(r.stdout, /tracked=\d+ \(declared \d+\)/);
});

test('case 2: a must-track file swallowed by .gitignore turns the gate red', () => {
  const dir = freshClone('swallowed');
  const manifest = loadManifest(dir);
  assert.ok(Array.isArray(manifest.must_track_globs) && manifest.must_track_globs.length > 0, 'fixture error: manifest declares no must-track globs');
  // Make a covered file "present but ignored and untracked", exactly the way a
  // broad ignore rule does.
  const victim = pickMustTrackVictim(dir);
  assert.ok(victim, 'fixture error: no tracked file matches a must-track glob');

  git(dir, ['rm', '--cached', '--quiet', '--', victim]);
  fs.appendFileSync(path.join(dir, '.gitignore'), `\n${victim}\n`);
  const ignored = git(dir, ['check-ignore', '--', victim]).trim();
  assert.equal(ignored, victim, 'fixture error: the ignore rule did not take effect');

  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /must-track glob/);
});

test('case 3: an undeclared present-but-untracked file turns the gate red', () => {
  const dir = freshClone('stray');
  fs.writeFileSync(path.join(dir, 'stray-internal-note.md'), 'not declared anywhere\n');
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /present and untracked but is not declared/);
});

test('case 4: internal material forced into the tracked set turns the gate red', () => {
  const dir = freshClone('forced');
  const victim = INTERNAL_VICTIM;
  fs.mkdirSync(path.dirname(path.join(dir, victim)), { recursive: true });
  fs.writeFileSync(path.join(dir, victim), 'internal acceptance record\n');
  // `git add -f` is exactly the back door this check exists to close.
  git(dir, ['add', '-f', '--', victim]);
  git(dir, ['-c', 'user.email=gate@test', '-c', 'user.name=gate', 'commit', '--quiet', '-m', 'force internal material in']);
  const r = runGate(dir);
  assert.equal(r.status, 1, `expected rc=1, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stderr, /forbidden-tracked glob/);
});

test('case 5: self-reported input flags are refused with rc=2', () => {
  const dir = freshClone('flags');
  for (const flag of ['--inventory', '--state', '--files']) {
    const r = runGate(dir, [`${flag}=/tmp/whatever.json`]);
    assert.equal(r.status, 2, `${flag} must be rc=2, got ${r.status}`);
    assert.match(r.stderr, /refusing caller-supplied inventory input/);
  }
  const unknown = runGate(dir, ['--pretend-ok']);
  assert.equal(unknown.status, 2, `unknown flag must be rc=2, got ${unknown.status}`);
});

test('case 6: the realpath entry guard runs the gate through a symlink', () => {
  const dir = freshClone('symlink');
  const link = path.join(scratch, 'symlinked-entry.cjs');
  fs.symlinkSync(path.join(dir, GATE_REL), link);
  const r = spawnSync(process.execPath, [link], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, `symlinked entry must still RUN the gate, got ${r.status}\n${r.stderr}`);
  assert.ok(r.stdout.includes(SUCCESS_LINE), 'symlinked entry did not print the success line');
});

test('case 7: the gate module exposes its documented surface (catches a load-time-exiting stub)', () => {
  const dir = freshClone('exports');
  const code = [
    `const g = require(${JSON.stringify(path.join(dir, GATE_REL))});`,
    `const missing = ${JSON.stringify(GATE_EXPORTS)}.filter((k) => g[k] === undefined);`,
    `if (missing.length) { console.error('missing exports: ' + missing.join(',')); process.exit(3); }`,
    `console.log('KDNA_GATE_EXPORTS_OK');`,
  ].join('\n');
  const r = spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' });
  assert.equal(r.status, 0, `gate module must expose its documented surface, got ${r.status}\n${r.stdout}\n${r.stderr}`);
  assert.match(r.stdout, /KDNA_GATE_EXPORTS_OK/);
});
