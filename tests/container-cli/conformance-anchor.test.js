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
  const baseTree = git('rev-parse', 'HEAD^{tree}');
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
    baseTree,
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
    { ...f.proof, anchors: {} },
    { ...f.proof, anchors: [null] },
    { ...f.proof, anchors: [f.proof.anchors[0], f.proof.anchors[0]] },
    { ...f.proof, anchors: [{ commit: 'HEAD', tree: f.tree }] },
    { ...f.proof, anchors: [{ commit: f.commit, tree: 'HEAD' }] },
    {
      ...f.proof,
      anchors: [
        { commit: f.commit, tree: f.tree },
        { commit: f.base, tree: 'HEAD' },
      ],
    },
  ])
    assert.throws(() => resolveConformanceAnchor(f.root, f.commit, proof));
});

test('both published registrations resolve by declared commit in either registry order', () => {
  const root = path.resolve(__dirname, '../..');
  const proof = require('../../scripts/conformance-anchors.json');
  const reversed = { ...proof, anchors: [...proof.anchors].reverse() };
  for (const commit of [
    '11eef63bc119b5c79dad6210e5f1740de448a655',
    '41ac52cddaac98e6feb5855fa7f60f5bae9b16ce',
  ]) {
    const anchor = proof.anchors.find((entry) => entry.commit === commit);
    assert.ok(anchor, 'the published source registration must be present');
    const resolved = resolveConformanceAnchor(root, commit, proof);
    assert.equal(resolved.declared_commit, commit);
    assert.equal(resolved.tree, anchor.tree);
    assert.deepEqual(resolveConformanceAnchor(root, commit, reversed), resolved);
  }
});

test('every available registered object must be a commit with its own true tree', (t) => {
  const f = fixture(t);
  for (const bad of [
    { commit: f.base, tree: '0'.repeat(40) },
    { commit: f.tree, tree: f.tree },
  ])
    for (const anchors of [
      [...f.proof.anchors, bad],
      [bad, ...f.proof.anchors],
    ]) {
      assert.throws(
        () => resolveConformanceAnchor(f.root, f.commit, { ...f.proof, anchors }),
        /tree differs|not a commit/u,
      );
    }
});

test('an unknown unreachable commit cannot borrow either registered tree', (t) => {
  const f = fixture(t);
  const proof = { ...f.proof, anchors: [{ commit: f.base, tree: f.baseTree }, ...f.proof.anchors] };
  f.git('checkout', '--quiet', '-b', 'unregistered');
  f.git('commit', '--quiet', '--allow-empty', '-m', 'Unregistered same-tree side commit');
  const side = f.git('rev-parse', 'HEAD');
  assert.equal(f.git('rev-parse', `${side}^{tree}`), f.tree);
  f.git('checkout', '--quiet', 'accepted');
  for (const unknown of [side, '0'.repeat(40)])
    assert.throws(() => resolveConformanceAnchor(f.root, unknown, proof), /no exact tree proof/u);
});

test('a missing selected object recovers only its own tree from the complete HEAD DAG', (t) => {
  const f = fixture(t);
  const proof = { ...f.proof, anchors: [{ commit: f.base, tree: f.baseTree }, ...f.proof.anchors] };
  f.git('commit', '--amend', '--quiet', '-m', 'Rewrite selected source without changing its tree');
  const rewritten = f.git('rev-parse', 'HEAD');
  const fresh = path.join(f.directory, 'head-only');
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
  const git = (...args) =>
    execFileSync('git', args, { cwd: fresh, encoding: 'utf8', stdio: 'pipe' }).trim();
  git('config', 'user.name', 'Synthetic Test Fixture');
  git('config', 'user.email', 'fixture@example.test');
  assert.throws(() => git('cat-file', '-e', f.commit));
  assert.deepEqual(resolveConformanceAnchor(fresh, f.commit, proof), {
    declared_commit: f.commit,
    resolved_commit: rewritten,
    tree: f.tree,
    resolution: 'same-tree-history',
  });
  git('checkout', '--quiet', '--detach', f.base);
  // The equal tree still exists under a side ref and in the object database.
  assert.equal(git('cat-file', '-t', rewritten), 'commit');
  assert.throws(
    () => resolveConformanceAnchor(fresh, f.commit, proof),
    /absent from HEAD history/u,
  );
  git(
    'merge',
    '--quiet',
    '--no-ff',
    '-s',
    'ours',
    'accepted',
    '-m',
    'Merge side history without changing HEAD tree',
  );
  assert.equal(git('rev-parse', 'HEAD^{tree}'), f.baseTree);
  assert.equal(resolveConformanceAnchor(fresh, f.commit, proof).resolved_commit, rewritten);
});

test('a reachable unregistered commit keeps the original-commit ancestry path', (t) => {
  const f = fixture(t);
  const proof = { ...f.proof, anchors: [{ commit: f.base, tree: f.baseTree }, ...f.proof.anchors] };
  f.git(
    'commit',
    '--quiet',
    '--allow-empty',
    '-m',
    'Reachable unregistered source with a registered tree',
  );
  const commit = f.git('rev-parse', 'HEAD');
  assert.deepEqual(resolveConformanceAnchor(f.root, commit, proof), {
    declared_commit: commit,
    resolved_commit: commit,
    tree: f.tree,
    resolution: 'original-commit',
  });
  assert.equal(resolveConformanceAnchor(f.root, f.commit, proof).resolved_commit, f.commit);
});
