'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const { resolveConformanceAnchor } = require('../../scripts/conformance-anchor');

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'conformance-tree-test-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'source');
  fs.mkdirSync(root);
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--quiet', '--initial-branch=main');
  git('config', 'user.name', 'Synthetic Test Fixture');
  git('config', 'user.email', 'fixture@example.test');
  fs.writeFileSync(path.join(root, 'package.json'), '{"version":"1.0.0"}\n');
  git('add', '.');
  git('commit', '--quiet', '-m', 'Create synthetic published baseline');
  const base = git('rev-parse', 'HEAD');
  git('checkout', '--quiet', '-b', 'accepted');
  fs.writeFileSync(path.join(root, 'package.json'), '{"version":"1.1.0"}\n');
  git('commit', '--quiet', '-am', 'Record synthetic candidate source');
  const commit = git('rev-parse', 'HEAD');
  const tree = git('rev-parse', 'HEAD^{tree}');
  return {
    directory,
    root,
    git,
    base,
    commit,
    tree,
    proof: { schema_version: '1.0.0', anchors: [{ commit, tree }] },
  };
}

test('a recorded full conformance tree resolves after rewriting and a fresh single-branch clone', (t) => {
  const f = fixture(t);
  assert.deepEqual(resolveConformanceAnchor(f.root, f.commit, f.proof), {
    declared_commit: f.commit,
    resolved_commit: f.commit,
    tree: f.tree,
    resolution: 'original-commit',
  });
  const wrong = { ...f.proof, anchors: [{ commit: f.commit, tree: '0'.repeat(40) }] };
  assert.throws(() => resolveConformanceAnchor(f.root, f.commit, wrong), /tree differs/u);
  f.git('commit', '--amend', '--quiet', '-m', 'Rewrite synthetic candidate commit');
  const rewritten = f.git('rev-parse', 'HEAD');
  assert.notEqual(rewritten, f.commit);
  const fresh = path.join(f.directory, 'main-only');
  f.git(
    'clone',
    '--quiet',
    '--no-local',
    '--no-tags',
    '--single-branch',
    '--branch',
    'accepted',
    f.root,
    fresh,
  );
  assert.throws(() =>
    execFileSync('git', ['cat-file', '-e', f.commit], { cwd: fresh, stdio: 'pipe' }),
  );
  assert.deepEqual(resolveConformanceAnchor(fresh, f.commit, f.proof), {
    declared_commit: f.commit,
    resolved_commit: rewritten,
    tree: f.tree,
    resolution: 'same-tree-history',
  });
  assert.throws(
    () => resolveConformanceAnchor(fresh, '0'.repeat(40), f.proof),
    /no exact tree proof/u,
  );
  assert.throws(
    () => resolveConformanceAnchor(fresh, f.commit, wrong),
    /absent from HEAD history/u,
  );
  assert.throws(() => resolveConformanceAnchor(fresh, f.tree, f.proof), /no exact tree proof/u);
});

test('an original dangling object and equal unmerged side tree cannot bypass HEAD ancestry', (t) => {
  const f = fixture(t);
  f.git('commit', '--amend', '--quiet', '-m', 'Rewrite accepted side commit');
  const rewritten = f.git('rev-parse', 'HEAD');
  f.git('checkout', '--quiet', 'main');
  assert.equal(f.git('cat-file', '-t', f.commit), 'commit');
  assert.throws(() => resolveConformanceAnchor(f.root, f.commit, f.proof), /HEAD history/u);
  f.git(
    'merge',
    '--quiet',
    '--no-ff',
    '-s',
    'ours',
    'accepted',
    '-m',
    'Merge exact side tree history',
  );
  assert.equal(resolveConformanceAnchor(f.root, f.commit, f.proof).resolved_commit, rewritten);
  assert.equal(f.git('rev-parse', 'HEAD^{tree}'), f.git('rev-parse', `${f.base}^{tree}`));
});

test('conformance tree proof rejects ambiguous and malformed registrations', (t) => {
  const f = fixture(t);
  for (const proof of [
    { ...f.proof, anchors: [] },
    { ...f.proof, anchors: [f.proof.anchors[0], f.proof.anchors[0]] },
    { ...f.proof, anchors: [{ commit: f.commit, tree: 'HEAD' }] },
  ])
    assert.throws(() => resolveConformanceAnchor(f.root, f.commit, proof));
});
