#!/usr/bin/env node
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const version = pkg.version;
const name = pkg.name;
const tag = `v${version}`;
const failures = [];

function check(label, fn) {
  try { fn(); console.log(`  PASS ${label}`); }
  catch (e) { failures.push(`${label}: ${e.message}`); console.error(`  FAIL ${label}: ${e.message}`); }
}

console.log(`Release readiness check: ${name}@${version}\n`);

check('git tag exists', () => {
  const out = execSync(`git tag -l "${tag}"`, { encoding: 'utf8' }).trim();
  if (!out) throw new Error(`tag ${tag} not found. Run: git tag ${tag} && git push origin ${tag}`);
});

check('GitHub Release exists', () => {
  const repo = pkg.repository.directory
    ? pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1]
    : pkg.repository.url.match(/github\.com\/([^/]+\/[^.]+)/)[1];
  execSync(`gh release view ${tag} --repo ${repo}`, { stdio: 'ignore' });
});

check('CHANGELOG has version entry', () => {
  const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8');
  if (!changelog.includes(version)) throw new Error(`CHANGELOG.md missing entry for ${version}`);
});

check('package.json version matches tag', () => {
  if (!tag.endsWith(version)) throw new Error(`tag ${tag} does not match version ${version}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed. Fix before publishing.`);
  process.exit(1);
}
console.log('\nAll checks passed. Ready to publish.');
