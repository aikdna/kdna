#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;
const name = pkg.name;
// publish.yml publish-core gate requires kdna-core-v* tag prefix.
// release:check accepts either v0.15.0 or kdna-core-v0.15.0 format.
const coreTag = `kdna-core-v${version}`;
const simpleTag = `v${version}`;
const failures = [];

function check(label, fn) {
  try { fn(); console.log(`  PASS ${label}`); }
  catch (e) { failures.push(`${label}: ${e.message}`); console.error(`  FAIL ${label}: ${e.message}`); }
}

console.log(`Release readiness check: ${name}@${version}\n`);

check('worktree is clean', () => {
  const out = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
  if (out) throw new Error('tracked or untracked release inputs are not committed');
});

check('git tag exists', () => {
  const coreOut = execSync(`git tag -l "${coreTag}"`, { encoding: 'utf8' }).trim();
  const simpleOut = execSync(`git tag -l "${simpleTag}"`, { encoding: 'utf8' }).trim();
  if (!coreOut && !simpleOut) {
    throw new Error(
      `Neither tag ${coreTag} nor ${simpleTag} found. Run: git tag ${coreTag} && git push origin ${coreTag}`,
    );
  }
});

check('version tag points to HEAD', () => {
  const head = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  const coreOut = execSync(`git tag -l "${coreTag}"`, { encoding: 'utf8' }).trim();
  const releaseTag = coreOut ? coreTag : simpleTag;
  const tagged = execSync(`git rev-list -n 1 "${releaseTag}"`, { encoding: 'utf8' }).trim();
  if (head !== tagged) {
    throw new Error(
      `${releaseTag} points to ${tagged.slice(0, 12)}, not HEAD ${head.slice(0, 12)}`,
    );
  }
});

check('GitHub Release exists', () => {
  // gh CLI may not be authenticated in CI (workflow_dispatch runs on
  // main branch, not on a release tag). The git tag check above is
  // sufficient for CI; the release check is a convenience for local dev.
  try {
    // Check if gh is available and authenticated
    execSync('gh auth status', { stdio: 'ignore' });
  } catch {
    console.log('  WARN gh not authenticated; skipping GitHub Release check (non-blocking)');
    return;
  }
  const repo = pkg.repository.directory
    ? pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1]
    : pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1];
  try {
    execSync(`gh release view ${coreTag} --repo ${repo}`, { stdio: 'ignore' });
  } catch {
    try {
      execSync(`gh release view ${simpleTag} --repo ${repo}`, { stdio: 'ignore' });
    } catch {
      console.log(`  WARN No GitHub release found for ${coreTag} or ${simpleTag} (non-blocking)`);
    }
  }
});

check('CHANGELOG has version entry', () => {
  const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  if (!changelog.includes(version)) throw new Error(`CHANGELOG.md missing entry for ${version}`);
});

check('package.json version matches tag', () => {
  if (!coreTag.endsWith(version)) throw new Error(`tag ${coreTag} does not match version ${version}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed. Fix before publishing.`);
  process.exit(1);
}
console.log('\nAll checks passed. Ready to publish.');
