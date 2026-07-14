#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');

function normalizeCommandOutput(output) {
  return typeof output === 'string' ? output.trim() : '';
}

function run(command, args, options = {}) {
  const output = execFileSync(command, args, {
    cwd: path.resolve(PACKAGE_ROOT, '..', '..'),
    encoding: 'utf8',
    ...options,
  });
  return normalizeCommandOutput(output);
}

function canonicalCoreTag(version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(`invalid Core package version: ${version || '<missing>'}`);
  }
  return `kdna-core-v${version}`;
}

function assertCanonicalTagExists({ expectedTag, listedTag }) {
  if (listedTag !== expectedTag) {
    throw new Error(
      `Canonical tag ${expectedTag} not found. Run: git tag ${expectedTag} && git push origin ${expectedTag}`,
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

function observeGithubRelease({ coreTag, repo, runGh, log = console.log }) {
  try {
    runGh(['auth', 'status']);
  } catch {
    log(`  SKIP GitHub Release observation for ${coreTag}: gh is not authenticated (not a publish gate)`);
    return 'skipped';
  }
  try {
    runGh(['release', 'view', coreTag, '--repo', repo]);
    log(`  OBSERVED GitHub Release ${coreTag}`);
    return 'observed';
  } catch {
    log(`  SKIP GitHub Release observation for ${coreTag}: release not found (not a publish gate)`);
    return 'skipped';
  }
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const version = pkg.version;
  const name = pkg.name;
  const coreTag = canonicalCoreTag(version);
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

  console.log(`Release readiness check: ${name}@${version}\n`);

  check('worktree is clean', () => {
    const status = run('git', ['status', '--porcelain']);
    if (status) throw new Error('tracked or untracked release inputs are not committed');
  });

  check(`canonical tag ${coreTag} exists`, () => {
    const listedTag = run('git', ['tag', '--list', coreTag]);
    assertCanonicalTagExists({ expectedTag: coreTag, listedTag });
  });

  check('canonical version tag points to the workflow commit', () => {
    const headCommit = run('git', ['rev-parse', 'HEAD']);
    const taggedCommit = run('git', ['rev-list', '-n', '1', coreTag]);
    const githubSha = process.env.GITHUB_SHA || null;
    if (process.env.GITHUB_ACTIONS === 'true' && githubSha === null) {
      throw new Error('GITHUB_SHA is required in GitHub Actions');
    }
    if (githubSha !== null && !/^[0-9a-f]{40}$/u.test(githubSha)) {
      throw new Error('GITHUB_SHA must be a full lowercase 40-character commit SHA');
    }
    assertTagCommit({ expectedTag: coreTag, taggedCommit, headCommit, githubSha });
  });

  check('CHANGELOG has version entry', () => {
    const changelog = fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');
    if (!changelog.includes(version)) throw new Error(`CHANGELOG.md missing entry for ${version}`);
  });

  const repositoryMatch = pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/u);
  observeGithubRelease({
    coreTag,
    repo: repositoryMatch ? repositoryMatch[1] : 'aikdna/kdna',
    runGh: (args) => run('gh', args, { stdio: 'ignore' }),
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
  assertTagCommit,
  canonicalCoreTag,
  normalizeCommandOutput,
  observeGithubRelease,
};
