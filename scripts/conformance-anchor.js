'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const proof = require('./conformance-anchors.json');

function resolveConformanceAnchor(root, declaredCommit, document = proof) {
  assert.match(declaredCommit, /^[a-f0-9]{40}$/u);
  assert.equal(document.schema_version, '1.0.0');
  assert.ok(
    Array.isArray(document.anchors) && document.anchors.length > 0,
    'at least one conformance tree proof must be registered',
  );
  const commits = new Set();
  for (const entry of document.anchors) {
    assert.ok(entry && typeof entry === 'object' && !Array.isArray(entry));
    assert.match(entry.commit, /^[a-f0-9]{40}$/u);
    assert.match(entry.tree, /^[a-f0-9]{40}$/u);
    assert.ok(!commits.has(entry.commit), 'duplicate conformance commit registration');
    commits.add(entry.commit);
  }
  const anchor = document.anchors.find((entry) => entry.commit === declaredCommit);
  const git = (args, input) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      input,
      stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
      maxBuffer: 32 * 1024 * 1024,
    }).trim();
  const objectType = (commit) => {
    const type = git(['cat-file', '--batch-check=%(objecttype)'], `${commit}\n`);
    return type === `${commit} missing` ? null : type;
  };
  // A missing historical object can be recovered by its exact registered tree.
  // An available object must authenticate its own type and tree, including when
  // this call selects another registration.
  for (const entry of document.anchors) {
    const type = objectType(entry.commit);
    if (type === null) continue;
    assert.equal(type, 'commit', 'registered conformance object is not a commit');
    assert.equal(
      git(['rev-parse', `${entry.commit}^{tree}`]),
      entry.tree,
      'recorded conformance tree differs',
    );
  }
  let originalReachable = false;
  if (objectType(declaredCommit) === 'commit') {
    try {
      git(['merge-base', '--is-ancestor', declaredCommit, 'HEAD']);
      originalReachable = true;
    } catch (error) {
      // Exit 1 means the genuine original commit is outside HEAD ancestry.
      // Repository or Git failures must not become permission to use a proof.
      if (error.status !== 1) throw error;
    }
  }
  if (originalReachable) {
    const tree = git(['rev-parse', `${declaredCommit}^{tree}`]);
    return {
      declared_commit: declaredCommit,
      resolved_commit: declaredCommit,
      tree,
      resolution: 'original-commit',
    };
  }
  assert.ok(anchor, 'unreachable conformance anchor has no exact tree proof');
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
