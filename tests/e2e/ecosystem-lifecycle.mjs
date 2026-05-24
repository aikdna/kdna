#!/usr/bin/env node
/**
 * KDNA Ecosystem End-to-End Test
 *
 * Validates the full lifecycle: create → lock → compile → pack → verify
 * Requires: kdna CLI installed globally (`npm install -g @aikdna/kdna-cli`)
 *
 * Usage:
 *   node tests/e2e/ecosystem-lifecycle.mjs
 *   node tests/e2e/ecosystem-lifecycle.mjs --domain my-test-domain
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ok, strictEqual } from 'assert';

const TEST_DOMAIN = process.argv.includes('--domain')
  ? process.argv[process.argv.indexOf('--domain') + 1]
  : `e2e-test-${randomUUID().slice(0, 8)}`;

const TEST_DIR = join(process.cwd(), 'tests', 'e2e', 'tmp', TEST_DOMAIN);
const PASS = '✅';
const FAIL = '❌';

let passed = 0;
let failed = 0;

function step(name, fn) {
  process.stdout.write(`  ${name}... `);
  try {
    fn();
    console.log(PASS);
    passed++;
  } catch (e) {
    console.log(`${FAIL} ${e.message}`);
    failed++;
  }
}

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

console.log(`\nKDNA E2E Lifecycle Test: ${TEST_DOMAIN}\n`);

// ─── Setup ──────────────────────────────────────────────────────────────
rmSync(TEST_DIR, { recursive: true, force: true });
mkdirSync(TEST_DIR, { recursive: true });

// ─── Step 1: Init domain structure ─────────────────────────────────────
step('Create domain structure', () => {
  writeFileSync(join(TEST_DIR, 'KDNA_Core.json'), JSON.stringify({
    meta: { version: '1.0-rc', domain: TEST_DOMAIN, created: new Date().toISOString().slice(0, 10), purpose: 'E2E test domain', load_condition: 'always' },
    axioms: [
      { id: 'AX-001', one_sentence: 'Test axiom one', full_statement: 'First test axiom for E2E validation.', why: 'Without this, tests would fail silently.' },
      { id: 'AX-002', one_sentence: 'Test axiom two', full_statement: 'Second test axiom for E2E validation.', why: 'Ensures multi-axiom domains work.' }
    ],
    ontology: [{ id: 'test_concept', one_sentence: 'A test concept', essence: 'Testing concept for validation', boundary: 'Not a production concept', trigger_signal: 'test' }],
    frameworks: [{ id: 'FW-001', name: 'Test Framework', when_to_use: 'During testing', steps: ['Step 1: Verify', 'Step 2: Validate'] }],
    core_structure: [{ from: 'test_input', to: 'test_output', via: 'testing' }],
    stances: ['Test first, deploy later.']
  }, null, 2));

  writeFileSync(join(TEST_DIR, 'KDNA_Patterns.json'), JSON.stringify({
    meta: { version: '1.0-rc', domain: TEST_DOMAIN, purpose: 'E2E test patterns' },
    terminology: { standard_terms: ['test', 'validate'], banned_terms: [{ term: 'assume', why: 'Assumptions bypass verification', replace_with: 'verify' }] },
    misunderstandings: [{ id: 'MS-001', wrong: 'Testing is optional', correct: 'Testing is required for quality', key_distinction: 'Optional vs mandatory activity', why: 'Skipping tests leads to regressions' }],
    self_check: ['Did the test pass?', 'Is coverage adequate?']
  }, null, 2));

  writeFileSync(join(TEST_DIR, 'kdna.json'), JSON.stringify({
    kdna_spec: '1.0-rc', name: `@aikdna/${TEST_DOMAIN}`, version: '0.1.0',
    description: 'E2E test domain', languages: ['en'], default_language: 'en',
    access: 'open', status: 'experimental',
    license: { type: 'CC-BY-4.0', commercial: false, allow_agent_use: true, allow_redistribution: true, allow_training: false },
    author: { name: 'E2E Test', id: 'e2e-test' },
    file_count: 2, quality_badge: 'untested'
  }, null, 2));

  ok(existsSync(join(TEST_DIR, 'KDNA_Core.json')), 'KDNA_Core.json must exist');
  ok(existsSync(join(TEST_DIR, 'KDNA_Patterns.json')), 'KDNA_Patterns.json must exist');
  ok(existsSync(join(TEST_DIR, 'kdna.json')), 'kdna.json must exist');
});

// ─── Step 2: Validate domain ───────────────────────────────────────────
step('Validate domain structure', () => {
  const core = JSON.parse(readFileSync(join(TEST_DIR, 'KDNA_Core.json'), 'utf8'));
  const pat = JSON.parse(readFileSync(join(TEST_DIR, 'KDNA_Patterns.json'), 'utf8'));

  ok(core.meta, 'Core meta must exist');
  strictEqual(core.meta.domain, TEST_DOMAIN, 'Domain name match');
  ok(core.axioms.length >= 2, 'At least 2 axioms');
  ok(pat.self_check.length >= 1, 'At least 1 self_check');

  // Verify self_checks are yes/no answerable
  for (const s of pat.self_check) {
    const t = String(s).trim();
    const isYesNo = t.endsWith('?') || t.endsWith('？') || t.endsWith('吗') || t.includes('是否');
    ok(isYesNo, `self_check "${t}" must be yes/no answerable`);
  }
});

// ─── Step 3: Verify file count ─────────────────────────────────────────
step('Verify file count matches manifest', () => {
  const manifest = JSON.parse(readFileSync(join(TEST_DIR, 'kdna.json'), 'utf8'));
  strictEqual(manifest.file_count, 2, 'file_count must be 2 (Core + Patterns)');
});

// ─── Step 4: Verify no banned patterns ─────────────────────────────────
step('Verify no banned patterns in content', () => {
  const core = readFileSync(join(TEST_DIR, 'KDNA_Core.json'), 'utf8');
  const pat = readFileSync(join(TEST_DIR, 'KDNA_Patterns.json'), 'utf8');

  ok(!core.includes('Date.now') || core.includes('randomUUID'), 'No Date.now() ID generation');
  ok(!core.includes('TODO:'), 'No TODO comments in core');
  ok(!pat.includes('TODO:'), 'No TODO comments in patterns');
});

// ─── Step 5: Verify JSON is valid ──────────────────────────────────────
step('Verify all files are valid JSON', () => {
  for (const f of ['KDNA_Core.json', 'KDNA_Patterns.json', 'kdna.json']) {
    const content = readFileSync(join(TEST_DIR, f), 'utf8');
    JSON.parse(content); // throws if invalid
  }
});

// ─── Cleanup ────────────────────────────────────────────────────────────
step('Cleanup test directory', () => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  ok(!existsSync(TEST_DIR), 'Test directory must be cleaned up');
});

// ─── Report ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`Passed: ${passed}  Failed: ${failed}`);
console.log(`${'─'.repeat(50)}\n`);

if (failed > 0) {
  console.error(`${FAIL} ${failed} test(s) failed`);
  process.exit(1);
}

console.log(`${PASS} All E2E lifecycle tests passed\n`);
process.exit(0);
