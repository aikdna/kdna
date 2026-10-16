#!/usr/bin/env node
// Reverse cases and wiring proof for the release-coordinate matrix gate.
//
// Two kinds of drift are refused: a published coordinate the registry does not
// serve, and a current-state field (a Git-channel main commit, an MCP release
// version) that no longer matches its live source. The pure evaluator cases run
// offline; the live ones prove the wired command really leaves zero.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateCurrentState } from './check-published-coordinates.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = 'scripts/check-published-coordinates.mjs';

function baseMatrix() {
  return {
    git_only: [
      {
        name: 'aikdna/kdna-skills',
        main_commit: '0a4cfeb2edfaa56e74c2101eb037e9e86bc2f8ee',
        mcp_version: '0.8.0-rc.native-sections.3',
      },
    ],
  };
}

test('a current-state row that matches its live source has no finding', () => {
  assert.deepEqual(
    evaluateCurrentState({
      matrix: baseMatrix(),
      skillsMainCommit: '0a4cfeb2edfaa56e74c2101eb037e9e86bc2f8ee',
      mcpReleaseVersions: ['0.8.0-rc.native-sections.3', '0.8.0-rc.native-sections.2'],
    }),
    [],
  );
});

test('a Git-channel main commit that moved is refused', () => {
  const findings = evaluateCurrentState({
    matrix: baseMatrix(),
    skillsMainCommit: 'ffffffffffffffffffffffffffffffffffffffff',
    mcpReleaseVersions: ['0.8.0-rc.native-sections.3'],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /declared main_commit 0a4cfeb2/u);
  assert.match(findings[0], /live main is ffff/u);
});

test('an MCP release that moved past the declared version is refused', () => {
  const findings = evaluateCurrentState({
    matrix: baseMatrix(),
    skillsMainCommit: '0a4cfeb2edfaa56e74c2101eb037e9e86bc2f8ee',
    mcpReleaseVersions: ['0.8.0-rc.native-sections.4', '0.8.0-rc.native-sections.3'],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /newest MCP release is 0\.8\.0-rc\.native-sections\.4/u);
});

test('no observed MCP release is a finding, never a silent pass', () => {
  const findings = evaluateCurrentState({
    matrix: baseMatrix(),
    skillsMainCommit: '0a4cfeb2edfaa56e74c2101eb037e9e86bc2f8ee',
    mcpReleaseVersions: [],
  });
  assert.equal(findings.length, 1);
  assert.match(findings[0], /no MCP release was observed/u);
});

// The command is also exercised end to end against a mutated matrix, so the
// wiring cannot be satisfied by a function that nothing calls. A GitHub API
// refusal (for example a rate limit) also exits non-zero, which is the point:
// this gate may never pass because it could not read the truth.
test('the wired command leaves zero for a mutated current-state field', () => {
  const work = mkdtempSync(join(tmpdir(), 'coordinates-drift-'));
  mkdirSync(join(work, 'scripts'), { recursive: true });
  mkdirSync(join(work, 'docs'), { recursive: true });
  cpSync(join(ROOT, SCRIPT), join(work, SCRIPT));
  const matrix = JSON.parse(readFileSync(join(ROOT, 'docs', 'release-coordinates.json'), 'utf8'));
  matrix.git_only[0].main_commit = 'ffffffffffffffffffffffffffffffffffffffff';
  writeFileSync(join(work, 'docs', 'release-coordinates.json'), JSON.stringify(matrix, null, 2));
  let status = 0;
  let output = '';
  try {
    output = execFileSync(process.execPath, [join(work, SCRIPT)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
  } catch (error) {
    status = error.status ?? 1;
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  assert.notEqual(status, 0, 'a mutated current-state field must fail the wired command');
  assert.match(output, /main_commit|unreadable/u);
});

test('the matrix gate is wired into the daily job, not only into a manual script', () => {
  const workflow = readFileSync(
    join(ROOT, '.github', 'workflows', 'publish-health-cron.yml'),
    'utf8',
  );
  assert.match(workflow, /node scripts\/check-published-coordinates\.mjs --bytes/u);
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(
    packageJson.scripts['check:published-coordinates'],
    'node scripts/check-published-coordinates.mjs',
  );
});
