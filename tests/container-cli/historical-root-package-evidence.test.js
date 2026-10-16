'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { historicalRootPackageReader } = require('../../scripts/historical-root-package-evidence');
const proof = require('../../scripts/historical-root-package-evidence.json');
const repoRoot = path.resolve(__dirname, '..', '..');
const canonical = JSON.parse(fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json')));
const component = canonical.components.find((entry) => entry.repository === 'aikdna/kdna');
const git = (root, args) =>
  execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

test('historical root proof binds all eight package inputs independently of the current checkout', () => {
  const read = historicalRootPackageReader(repoRoot);
  assert.equal(proof.packages.length, 8);
  assert.notEqual(proof.package_source_commit, component.source_commit);
  for (const record of component.packages) {
    const pkg = read(component, record);
    assert.equal(pkg.name, record.package_name);
    assert.equal(pkg.version, record.version);
  }
  const core = component.packages.find((entry) => entry.package_name === '@aikdna/kdna-core');
  // The proof reads an exact commit, never the checkout. While the live tree is
  // exactly the accepted release the two versions coincide, so the property that
  // matters is the source of the bytes: each evidence entry must be the blob that
  // commit carries at that path, and the entries stay bound to
  // package_source_commit rather than to the manifest's own source_commit.
  const coreEvidence = proof.packages.find((entry) => entry.package_name === '@aikdna/kdna-core');
  assert.equal(
    git(repoRoot, ['rev-parse', `${proof.package_source_commit}:${core.package_json}`]),
    coreEvidence.blob,
  );
  assert.notEqual(proof.package_source_commit, component.source_commit);
  assert.throws(
    () => read({ ...component, source_commit: proof.package_source_commit }, core),
    /manifest source_commit differs/u,
  );
  assert.throws(
    () => read(component, { ...core, package_json: 'package.json' }),
    /unregistered historical root package path/u,
  );
});

test('historical root proof rejects altered pins, bytes, membership and versions', async (t) => {
  const cases = [
    [
      'wrong manifest SHA',
      (p) => {
        p.manifest_sha256 = '0'.repeat(64);
      },
      /manifest SHA-256 differs/u,
    ],
    [
      'wrong declared source',
      (p) => {
        p.manifest_source_commit = '0'.repeat(40);
      },
      /manifest source_commit differs/u,
    ],
    [
      'wrong package source',
      (p) => {
        p.package_source_commit = '0'.repeat(40);
      },
      /git/u,
    ],
    [
      'wrong tree',
      (p) => {
        p.package_source_tree = '0'.repeat(40);
      },
      /source tree differs/u,
    ],
    [
      'wrong blob',
      (p) => {
        p.packages[0].blob = '0'.repeat(40);
      },
      /blob or exact path differs/u,
    ],
    [
      'wrong bytes SHA',
      (p) => {
        p.packages[0].sha256 = '0'.repeat(64);
      },
      /package SHA-256 differs/u,
    ],
    [
      'extra package',
      (p) => {
        p.packages.push({ ...p.packages[0], package_json: 'package.json' });
      },
      /coverage differs/u,
    ],
    [
      'extra path',
      (p) => {
        p.packages[0].package_json = 'package.json';
      },
      /unregistered historical root package path/u,
    ],
    [
      'duplicate path',
      (p) => {
        p.packages[1] = { ...p.packages[0] };
      },
      /duplicate historical root package path/u,
    ],
    [
      'fake version',
      (p) => {
        p.packages[0].version = '999.0.0';
      },
      /package version differs/u,
    ],
    [
      'acceptance claim',
      (p) => {
        p.current_source_accepted = true;
      },
      /evidence keys differ/u,
    ],
  ];
  for (const [name, mutate, diagnostic] of cases) {
    await t.test(name, () => {
      const changed = structuredClone(proof);
      mutate(changed);
      assert.throws(() => historicalRootPackageReader(repoRoot, changed), diagnostic);
    });
  }
});

test('a historical package object outside current HEAD ancestry is insufficient', (t) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-root-evidence-'));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  git(fixture, ['init']);
  git(fixture, ['config', 'user.name', 'KDNA Test']);
  git(fixture, ['config', 'user.email', 'test@invalid.example']);
  const objectPath = git(repoRoot, [
    'rev-parse',
    '--path-format=absolute',
    '--git-path',
    'objects',
  ]);
  fs.writeFileSync(path.join(fixture, '.git', 'objects', 'info', 'alternates'), `${objectPath}\n`);
  fs.copyFileSync(
    path.join(repoRoot, 'ecosystem-manifest.json'),
    path.join(fixture, 'ecosystem-manifest.json'),
  );
  git(fixture, ['add', 'ecosystem-manifest.json']);
  git(fixture, ['commit', '-m', 'independent fixture root']);
  assert.equal(git(fixture, ['cat-file', '-t', proof.package_source_commit]), 'commit');
  assert.throws(() => historicalRootPackageReader(fixture), /not an ancestor of current HEAD/u);
  fs.appendFileSync(path.join(fixture, 'ecosystem-manifest.json'), '\n');
  assert.throws(() => historicalRootPackageReader(fixture), /manifest SHA-256 differs/u);
});
