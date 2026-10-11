'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const registeredProof = require('./historical-root-package-evidence.json');

// This separately named evidence preserves the frozen manifest's historical
// root package inputs. It neither aliases its source_commit nor accepts the
// current checkout, registry, consumers, or release artifacts.
function historicalRootPackageReader(root, proof = registeredProof) {
  const exactKeys = (value, keys) => {
    assert.ok(value && typeof value === 'object' && !Array.isArray(value));
    assert.deepEqual(
      Object.keys(value).sort(),
      [...keys].sort(),
      'historical root evidence keys differ',
    );
  };
  const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    });
  exactKeys(proof, [
    'schema_version',
    'scope',
    'repository',
    'manifest_sha256',
    'manifest_source_commit',
    'package_source_commit',
    'package_source_tree',
    'packages',
  ]);
  assert.equal(proof.schema_version, '1.0.0');
  assert.equal(proof.scope, 'historical-root-package-inputs');
  assert.equal(proof.repository, 'aikdna/kdna');
  for (const key of ['manifest_source_commit', 'package_source_commit', 'package_source_tree']) {
    assert.match(proof[key], /^[a-f0-9]{40}$/u, `historical root evidence ${key} is not exact`);
  }
  assert.match(proof.manifest_sha256, /^[a-f0-9]{64}$/u);
  const manifestBytes = fs.readFileSync(path.join(root, 'ecosystem-manifest.json'));
  assert.equal(
    sha256(manifestBytes),
    proof.manifest_sha256,
    'historical root manifest SHA-256 differs',
  );
  const manifest = JSON.parse(manifestBytes);
  const components = manifest.components.filter((entry) => entry.repository === proof.repository);
  assert.equal(components.length, 1, 'historical root component must be unique');
  const component = components[0];
  assert.equal(component.local_path, '.');
  assert.equal(
    component.source_commit,
    proof.manifest_source_commit,
    'historical root manifest source_commit differs',
  );
  assert.equal(git(['cat-file', '-t', proof.package_source_commit]).toString().trim(), 'commit');
  assert.equal(
    git(['rev-parse', `${proof.package_source_commit}^{tree}`])
      .toString()
      .trim(),
    proof.package_source_tree,
    'historical root package source tree differs',
  );
  try {
    git(['merge-base', '--is-ancestor', proof.package_source_commit, 'HEAD']);
  } catch {
    throw new Error('historical root package source is not an ancestor of current HEAD');
  }
  assert.ok(Array.isArray(proof.packages));
  assert.equal(
    proof.packages.length,
    component.packages.length,
    'historical root package coverage differs',
  );
  const expected = new Map(component.packages.map((entry) => [entry.package_json, entry]));
  assert.equal(expected.size, component.packages.length, 'duplicate historical root manifest path');
  const packages = new Map();
  for (const row of proof.packages) {
    exactKeys(row, ['package_json', 'package_name', 'version', 'blob', 'sha256']);
    assert.equal(typeof row.package_json, 'string');
    assert.ok(
      !path.isAbsolute(row.package_json) &&
        !row.package_json.includes('\\') &&
        row.package_json.split('/').every((part) => part && part !== '.' && part !== '..'),
      'historical root package path is invalid',
    );
    assert.ok(expected.has(row.package_json), 'unregistered historical root package path');
    assert.ok(!packages.has(row.package_json), 'duplicate historical root package path');
    const record = expected.get(row.package_json);
    assert.equal(row.package_name, record.package_name, 'historical root package name differs');
    assert.equal(row.version, record.version, 'historical root package version differs');
    assert.match(row.blob, /^[a-f0-9]{40}$/u);
    assert.match(row.sha256, /^[a-f0-9]{64}$/u);
    const entry = git([
      'ls-tree',
      '-z',
      proof.package_source_commit,
      '--',
      row.package_json,
    ]).toString();
    assert.equal(
      entry,
      `100644 blob ${row.blob}\t${row.package_json}\0`,
      'historical root package blob or exact path differs',
    );
    const bytes = git(['cat-file', 'blob', row.blob]);
    assert.equal(sha256(bytes), row.sha256, 'historical root package SHA-256 differs');
    const pkg = JSON.parse(bytes);
    assert.equal(pkg.name, record.package_name, 'historical root package bytes name differs');
    assert.equal(pkg.version, record.version, 'historical root package bytes version differs');
    packages.set(row.package_json, pkg);
  }
  return (requestedComponent, record) => {
    assert.equal(
      requestedComponent.repository,
      proof.repository,
      'historical root repository differs',
    );
    assert.equal(requestedComponent.local_path, '.', 'historical root local_path differs');
    assert.equal(
      requestedComponent.source_commit,
      proof.manifest_source_commit,
      'historical root manifest source_commit differs',
    );
    assert.ok(packages.has(record.package_json), 'unregistered historical root package path');
    return structuredClone(packages.get(record.package_json));
  };
}

module.exports = { historicalRootPackageReader };
