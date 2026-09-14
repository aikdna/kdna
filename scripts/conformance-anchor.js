'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const proof = require('./conformance-anchors.json');

function resolveConformanceAnchor(root, declaredCommit, document = proof) {
  assert.match(declaredCommit, /^[a-f0-9]{40}$/u);
  assert.equal(document.schema_version, '1.0.0');
  assert.equal(document.anchors.length, 1, 'exactly one conformance tree proof is registered');
  const [anchor] = document.anchors;
  assert.match(anchor.commit, /^[a-f0-9]{40}$/u);
  assert.match(anchor.tree, /^[a-f0-9]{40}$/u);
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  let originalReachable = false;
  try {
    assert.equal(git(['cat-file', '-t', declaredCommit]), 'commit');
    git(['merge-base', '--is-ancestor', declaredCommit, 'HEAD']);
    originalReachable = true;
  } catch {
    // A rebase may remove the original object from a fresh main-only clone.
  }
  if (originalReachable) {
    const tree = git(['rev-parse', `${declaredCommit}^{tree}`]);
    if (anchor.commit === declaredCommit)
      assert.equal(tree, anchor.tree, 'recorded conformance tree differs');
    return {
      declared_commit: declaredCommit,
      resolved_commit: declaredCommit,
      tree,
      resolution: 'original-commit',
    };
  }
  assert.equal(
    declaredCommit,
    anchor.commit,
    'unreachable conformance anchor has no exact tree proof',
  );
  // Search only HEAD's complete reachable DAG. An equal tree on another branch
  // or in the object database alone cannot authenticate current ancestry.
  const rows = git(['log', '--full-history', '--format=%H %T', 'HEAD']).split('\n');
  const match = rows.map((row) => row.split(' ')).find(([, tree]) => tree === anchor.tree);
  assert.ok(match, 'recorded conformance tree is absent from HEAD history');
  assert.match(match[0], /^[a-f0-9]{40}$/u);
  return {
    declared_commit: declaredCommit,
    resolved_commit: match[0],
    tree: anchor.tree,
    resolution: 'same-tree-history',
  };
}

module.exports = { resolveConformanceAnchor };
