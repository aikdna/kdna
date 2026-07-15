#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalTag, validateReleaseContext } = require('./release-policy');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');

function git(args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');
  const tag = canonicalTag(pkg.version);
  const context = validateReleaseContext({
    pkg,
    changelog,
    env: process.env,
    git: {
      status: git(['status', '--porcelain=v1', '--untracked-files=all']),
      head: git(['rev-parse', 'HEAD']),
      tagCommit: git(['rev-parse', `${tag}^{commit}`]),
    },
  });
  console.log(
    `Compatibility release context verified: ${context.name}@${context.version} ${context.commit}`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility release context rejected: ${error.message}`);
    process.exitCode = 1;
  }
}
