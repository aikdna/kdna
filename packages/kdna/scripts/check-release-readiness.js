#!/usr/bin/env node
'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
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

function gitIsAncestor(ancestor, descendant) {
  const result = spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw new Error('git merge-base ancestry verification failed');
}

function main() {
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(PACKAGE_ROOT, 'CHANGELOG.md'), 'utf8');
  const tag = canonicalTag(pkg.version);
  const head = git(['rev-parse', 'HEAD']);
  const mainCommit = git(['rev-parse', 'refs/remotes/origin/main']);
  const context = validateReleaseContext({
    pkg,
    changelog,
    env: process.env,
    git: {
      status: git(['status', '--porcelain', '--untracked-files=all']),
      head,
      tagCommit: git(['rev-parse', `${tag}^{commit}`]),
      mainCommit,
      mainContainsHead: gitIsAncestor(head, mainCommit),
    },
  });
  console.log(
    `Compatibility release context verified: ${context.name}@${context.version} ${context.commit}`,
  );
}

module.exports = { gitIsAncestor };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility release context rejected: ${error.message}`);
    process.exitCode = 1;
  }
}
