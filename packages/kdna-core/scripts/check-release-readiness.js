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

check('git tag exists', () => {
  const coreOut = execSync(`git tag -l "${coreTag}"`, { encoding: 'utf8' }).trim();
  const simpleOut = execSync(`git tag -l "${simpleTag}"`, { encoding: 'utf8' }).trim();
  if (!coreOut && !simpleOut) {
    throw new Error(
      `Neither tag ${coreTag} nor ${simpleTag} found. Run: git tag ${coreTag} && git push origin ${coreTag}`,
    );
  }
});

check('GitHub Release exists', () => {
  const repo = pkg.repository.directory
    ? pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1]
    : pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1];
  // Try core tag first (kdna-core-v*), fall back to simple v*.
  try {
    execSync(`gh release view ${coreTag} --repo ${repo}`, { stdio: 'ignore' });
  } catch {
    try {
      execSync(`gh release view ${simpleTag} --repo ${repo}`, { stdio: 'ignore' });
    } catch {
      throw new Error(`No GitHub release found for ${coreTag} or ${simpleTag}`);
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
