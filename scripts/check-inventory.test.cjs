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

// The gate declares its own success marker and its hard invariants; read them
// from the module under test so the controls cannot drift away from it.
const gate = require('./check-inventory.cjs');
const SUCCESS_LINE = gate.SUCCESS_LINE;

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
  // Pick a tracked file that a declared must-track glob covers, then make it
  // "present but ignored and untracked" exactly the way a broad ignore rule does.
  const tracked = git(dir, ['ls-files']).split('\n').filter(Boolean);
  const victim = tracked.find((f) => gate.matchesAny(f, manifest.must_track_globs));
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
  const forbidden = gate.FORBIDDEN_TRACKED.find((g) => !g.includes('*') || g.startsWith('python-sdk/delivery'));
  const victim = 'python-sdk/delivery/current-bindings-20260909/independent-acceptance.md';
  fs.mkdirSync(path.dirname(path.join(dir, victim)), { recursive: true });
  fs.writeFileSync(path.join(dir, victim), 'internal acceptance record\n');
  // `git add -f` is exactly the back door this check exists to close.
  git(dir, ['add', '-f', '--', victim]);
  git(dir, ['-c', 'user.email=gate@test', '-c', 'user.name=gate', 'commit', '--quiet', '-m', 'force internal material in']);
  assert.ok(forbidden, 'fixture error: no forbidden glob available');
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
