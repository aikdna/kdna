/**
 * Smoke tests for v0.7+ commands: verify, search, diff, project, info.
 * compare is not smoke-tested because it requires an LLM API key and
 * costs money per run; it's exercised manually via demo/build-demo.js.
 *
 * These tests run the CLI as a subprocess and assert exit code +
 * key strings in output. They are not full unit tests — they verify
 * the wiring stays intact across refactors.
 *
 * Run: node --test tests/v07-commands.test.js
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const CLI = path.resolve(__dirname, '..', 'src', 'cli.js');

function run(args, opts = {}) {
  try {
    return {
      ok: true,
      stdout: execFileSync('node', [CLI, ...args], {
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env, ...(opts.env || {}) },
        cwd: opts.cwd || process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    };
  } catch (e) {
    return {
      ok: false,
      code: e.status,
      stdout: (e.stdout || '').toString(),
      stderr: (e.stderr || '').toString(),
    };
  }
}

function ensureWritingInstalled() {
  // These tests assume @aikdna/writing is installed locally. Detect, skip
  // gracefully if not (e.g. on CI without registry network).
  const dir = path.join(os.homedir(), '.kdna', 'domains', '@aikdna', 'writing');
  return fs.existsSync(dir);
}

// ─── kdna help ─────────────────────────────────────────────────────────

test('kdna help mentions v0.7+ commands', () => {
  const r = run(['help']);
  assert.ok(r.ok, `help failed: ${r.stderr}`);
  assert.match(r.stdout, /kdna verify/);
  assert.match(r.stdout, /kdna compare/);
  assert.match(r.stdout, /kdna diff/);
  assert.match(r.stdout, /kdna search/);
  assert.match(r.stdout, /kdna project/);
});

// ─── kdna search ───────────────────────────────────────────────────────

test('kdna search returns matches for a known keyword', () => {
  const r = run(['search', 'writing']);
  assert.ok(r.ok, `search failed: ${r.stderr}`);
  assert.match(r.stdout, /@aikdna\/writing/);
  assert.match(r.stdout, /score:/);
});

test('kdna search reports no-match cleanly', () => {
  const r = run(['search', 'zzzznosuchkeyword']);
  assert.ok(r.ok, `search no-match should still exit 0: ${r.stderr}`);
  assert.match(r.stdout, /No domains match/);
});

// ─── kdna verify ───────────────────────────────────────────────────────

test('kdna verify runs all three layers on an installed domain', { skip: !ensureWritingInstalled() }, () => {
  const r = run(['verify', '@aikdna/writing']);
  assert.ok(r.ok, `verify failed: ${r.stderr || r.stdout}`);
  assert.match(r.stdout, /STRUCTURE/);
  assert.match(r.stdout, /TRUST/);
  assert.match(r.stdout, /JUDGMENT/);
});

test('kdna verify --judgment exits 0 with score line', { skip: !ensureWritingInstalled() }, () => {
  const r = run(['verify', '@aikdna/writing', '--judgment']);
  assert.ok(r.ok, `verify --judgment failed: ${r.stderr || r.stdout}`);
  assert.match(r.stdout, /score:\d+\/\d+/);
});

test('kdna verify on uninstalled domain exits 2', () => {
  const r = run(['verify', '@aikdna/nonexistent_test_xxx']);
  assert.ok(!r.ok, `expected failure but got: ${r.stdout}`);
  assert.equal(r.code, 2);
});

// ─── kdna info ─────────────────────────────────────────────────────────

test('kdna info shows v2.1 governance section', { skip: !ensureWritingInstalled() }, () => {
  const r = run(['info', '@aikdna/writing']);
  assert.ok(r.ok, `info failed: ${r.stderr}`);
  assert.match(r.stdout, /Identity & trust/);
  assert.match(r.stdout, /Judgment surface/);
  assert.match(r.stdout, /governance/);
});

test('kdna info refuses uninstalled domain', () => {
  const r = run(['info', '@aikdna/nonexistent_test_xxx']);
  assert.ok(!r.ok);
});

// ─── kdna project ──────────────────────────────────────────────────────

test('kdna project info reports absence cleanly when no config', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-smoke-'));
  try {
    const r = run(['project', 'info'], { cwd: tmp });
    assert.ok(r.ok, `project info failed: ${r.stderr}`);
    assert.match(r.stdout, /No project-level KDNA config/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('kdna project init creates .kdna/config.json', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-smoke-'));
  try {
    const r = run(['project', 'init', '@aikdna/writing'], { cwd: tmp });
    assert.ok(r.ok, `project init failed: ${r.stderr}`);
    const configPath = path.join(tmp, '.kdna', 'config.json');
    assert.ok(fs.existsSync(configPath), 'config.json was not created');
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.deepEqual(cfg.kdna.domains, ['@aikdna/writing']);
    assert.equal(cfg.kdna.mode, 'auto');
    assert.equal(cfg.kdna.conflict_policy, 'surface');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('kdna project init refuses to overwrite', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-smoke-'));
  try {
    run(['project', 'init'], { cwd: tmp });
    const r = run(['project', 'init'], { cwd: tmp });
    assert.ok(!r.ok, 'second init should fail');
    assert.match(r.stderr, /Already exists/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ─── kdna diff ─────────────────────────────────────────────────────────

test('kdna diff with no args explains usage', () => {
  const r = run(['diff']);
  assert.ok(!r.ok);
  assert.match(r.stderr, /Usage/);
});

// ─── kdna compare ──────────────────────────────────────────────────────

test('kdna compare without --input explains usage', () => {
  const r = run(['compare', '@aikdna/writing']);
  assert.ok(!r.ok);
  assert.match(r.stderr, /--input/);
});

test('kdna compare without API key explains how to configure', () => {
  const r = run(['compare', '@aikdna/writing', '--input', 'test'], {
    env: { ANTHROPIC_API_KEY: '', OPENAI_API_KEY: '', SILICONFLOW_API_KEY: '' },
  });
  // exits non-zero; output explains config
  assert.ok(!r.ok || /API key not found/.test(r.stdout + r.stderr));
});
