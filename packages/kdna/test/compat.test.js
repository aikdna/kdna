'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const core = require('@aikdna/kdna-core');
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const validator = path.join(packageRoot, 'bin', 'kdna-validate.js');

test('compatibility manifest pins one released toolchain without claiming the current CLI binary', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '0.13.0');
  assert.deepEqual(pkg.dependencies, {
    '@aikdna/kdna-cli': '0.33.0',
    '@aikdna/kdna-core': '0.18.0',
  });
  assert.deepEqual(pkg.bin, {
    'kdna-lint': 'bin/kdna-lint.js',
    'kdna-validate': 'bin/kdna-validate.js',
  });
  assert.equal(pkg.bin.kdna, undefined);
  assert.equal(pkg.main, undefined);
  assert.equal(pkg.exports, undefined);
});

test('root lock resolves the compatibility package to one exact Core and CLI pair', () => {
  const rootPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));

  assert.equal(rootPackage.devDependencies['@aikdna/kdna-cli'], '0.33.0');
  assert.deepEqual(lock.packages['packages/kdna'].dependencies, {
    '@aikdna/kdna-cli': '0.33.0',
    '@aikdna/kdna-core': '0.18.0',
  });
  assert.equal(lock.packages['packages/kdna'].version, '0.13.0');
  assert.equal(lock.packages['node_modules/@aikdna/kdna-cli'].version, '0.33.0');
  assert.equal(
    lock.packages['node_modules/@aikdna/kdna-cli'].resolved,
    'https://registry.npmjs.org/@aikdna/kdna-cli/-/kdna-cli-0.33.0.tgz',
  );
  assert.equal(
    lock.packages['node_modules/@aikdna/kdna-cli'].integrity,
    'sha512-A8bbemlQhRzmpY/c395X2HXFBElYsViLeuwHq0JZE0dxOKOKdWUPUXm5jb4HioGchSyrm7gRv0UQUSxcWzhZxA==',
  );
  assert.equal(
    lock.packages['node_modules/@aikdna/kdna-cli'].dependencies['@aikdna/kdna-core'],
    '0.18.0',
  );
  assert.deepEqual(lock.packages['node_modules/@aikdna/kdna-core'], {
    resolved: 'packages/kdna-core',
    link: true,
  });
  assert.equal(lock.packages['packages/kdna-core'].version, '0.18.1');
  assert.equal(lock.packages['packages/kdna/node_modules/@aikdna/kdna-core'], undefined);
  assert.equal(lock.packages['node_modules/@aikdna/kdna-cli/node_modules/@aikdna/kdna-core'], undefined);
});

test('kdna-validate delegates packaged assets to the current CLI', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-validate-'));
  const asset = path.join(temp, 'minimal.kdna');
  core.pack(path.join(repoRoot, 'examples', 'minimal'), asset);

  const result = spawnSync(process.execPath, [validator, asset, '--json'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).overall_valid, true);
});

test('kdna-validate fails closed for a non-KDNA file', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-reject-'));
  const invalid = path.join(temp, 'invalid.kdna');
  fs.writeFileSync(invalid, 'not a KDNA asset');

  const result = spawnSync(process.execPath, [validator, invalid, '--json'], {
    encoding: 'utf8',
  });
  assert.notEqual(result.status, 0);
});
