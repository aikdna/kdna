'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { validateReleaseEvidence } = require('./release-evidence');
const { canonicalTag, validateReleaseContext } = require('./release-policy');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateCurrentReleaseBinding({ evidence: rawEvidence, pkg, changelog, env, git }) {
  const evidence = validateReleaseEvidence(rawEvidence);
  const context = validateReleaseContext({ pkg, changelog, env, git });
  assert(evidence.package.name === context.name, 'release evidence name is stale');
  assert(evidence.package.version === context.version, 'release evidence version is stale');
  assert(evidence.source.ref === context.ref, 'release evidence ref is stale');
  assert(evidence.source.commit === context.commit, 'release evidence commit is stale');
  return evidence;
}

function readCurrentReleaseBinding({ root, evidence, env = process.env }) {
  function git(args) {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  }
  function gitIsAncestor(ancestor, descendant) {
    const result = spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });
    if (result.error) throw result.error;
    if (result.status === 0) return true;
    if (result.status === 1) return false;
    throw new Error('git merge-base ancestry verification failed');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'packages', 'kdna', 'package.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(root, 'packages', 'kdna', 'CHANGELOG.md'), 'utf8');
  const tag = canonicalTag(pkg.version);
  const head = git(['rev-parse', 'HEAD']);
  const mainCommit = git(['rev-parse', 'refs/remotes/origin/main']);
  return validateCurrentReleaseBinding({
    evidence,
    pkg,
    changelog,
    env,
    git: {
      status: git(['status', '--porcelain', '--untracked-files=all']),
      head,
      tagCommit: git(['rev-parse', `${tag}^{commit}`]),
      mainCommit,
      mainContainsHead: gitIsAncestor(head, mainCommit),
    },
  });
}

module.exports = { readCurrentReleaseBinding, validateCurrentReleaseBinding };
