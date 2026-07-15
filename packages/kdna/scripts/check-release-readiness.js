#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');

function normalizeCommandOutput(output) {
  return typeof output === 'string' ? output.trim() : '';
}

function run(command, args, options = {}) {
  return normalizeCommandOutput(
    execFileSync(command, args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      ...options,
    }),
  );
}

function canonicalCompatTag(version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(`invalid compatibility package version: ${version || '<missing>'}`);
  }
  return `kdna-v${version}`;
}

function assertCanonicalTagExists({ expectedTag, listedTag }) {
  if (listedTag !== expectedTag) {
    throw new Error(
      `Canonical tag ${expectedTag} not found. Run: git tag ${expectedTag} && git push origin ${expectedTag}`,
    );
  }
}

function assertCanonicalWorkflowRef({ expectedTag, githubRef }) {
  const expectedRef = `refs/tags/${expectedTag}`;
  if (githubRef !== expectedRef) {
    throw new Error(
      `GITHUB_REF ${githubRef || '<missing>'} does not exactly match package version tag ${expectedRef}`,
    );
  }
}

function assertTagCommit({ expectedTag, taggedCommit, headCommit, githubSha }) {
  if (taggedCommit !== headCommit) {
    throw new Error(
      `${expectedTag} points to ${taggedCommit.slice(0, 12)}, not HEAD ${headCommit.slice(0, 12)}`,
    );
  }
  if (githubSha !== null && githubSha !== headCommit) {
    throw new Error(
      `GITHUB_SHA ${githubSha.slice(0, 12)} does not match tagged HEAD ${headCommit.slice(0, 12)}`,
    );
  }
}

function assertChangelogEntry({ changelog, version }) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  if (!new RegExp(`^## ${escaped} \\(\\d{4}-\\d{2}-\\d{2}\\)$`, 'mu').test(changelog)) {
    throw new Error(`CHANGELOG.md is missing an exact dated heading for ${version}`);
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  const tag = canonicalCompatTag(version);
  const failures = [];

  function check(label, fn) {
    try {
      fn();
      console.log(`  PASS ${label}`);
    } catch (error) {
      failures.push(`${label}: ${error.message}`);
      console.error(`  FAIL ${label}: ${error.message}`);
    }
  }

  console.log(`Release readiness check: ${pkg.name}@${version}\n`);

  check('worktree is clean', () => {
    if (run('git', ['status', '--porcelain'])) {
      throw new Error('tracked or untracked release inputs are not committed');
    }
  });

  check(`canonical tag ${tag} exists`, () => {
    assertCanonicalTagExists({ expectedTag: tag, listedTag: run('git', ['tag', '--list', tag]) });
  });

  if (process.env.GITHUB_ACTIONS === 'true' || process.env.GITHUB_REF) {
    check('workflow ref exactly matches the package version tag', () => {
      assertCanonicalWorkflowRef({ expectedTag: tag, githubRef: process.env.GITHUB_REF });
    });
  } else {
    console.log('  SKIP workflow release-ref gate: not running in GitHub Actions');
  }

  check('canonical version tag points to the workflow commit', () => {
    const headCommit = run('git', ['rev-parse', 'HEAD']);
    const taggedCommit = run('git', ['rev-list', '-n', '1', tag]);
    const githubSha = process.env.GITHUB_SHA || null;
    if (process.env.GITHUB_ACTIONS === 'true' && githubSha === null) {
      throw new Error('GITHUB_SHA is required in GitHub Actions');
    }
    if (githubSha !== null && !/^[0-9a-f]{40}$/u.test(githubSha)) {
      throw new Error('GITHUB_SHA must be a full lowercase 40-character commit SHA');
    }
    assertTagCommit({ expectedTag: tag, taggedCommit, headCommit, githubSha });
  });

  check('CHANGELOG has an exact dated version entry', () => {
    assertChangelogEntry({
      changelog: fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8'),
      version,
    });
  });

  if (failures.length > 0) {
    console.error(`\n${failures.length} required check(s) failed. Fix before publishing.`);
    process.exitCode = 1;
    return;
  }
  console.log('\nAll required checks passed. Ready to publish.');
}

if (require.main === module) main();

module.exports = {
  assertCanonicalTagExists,
  assertCanonicalWorkflowRef,
  assertChangelogEntry,
  assertTagCommit,
  canonicalCompatTag,
  normalizeCommandOutput,
};
