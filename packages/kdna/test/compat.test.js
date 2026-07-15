'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRequire } = require('node:module');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const validator = path.join(packageRoot, 'bin', 'kdna-validate.js');
const compatRequire = createRequire(path.join(packageRoot, 'package.json'));
const core = compatRequire('@aikdna/kdna-core');
const cliPackageRoot = path.dirname(compatRequire.resolve('@aikdna/kdna-cli/package.json'));
const COMPAT_CORE_LOCK_PATH = 'packages/kdna/node_modules/@aikdna/kdna-core';
const CLI_CORE_LOCK_PATH = 'node_modules/@aikdna/kdna-cli/node_modules/@aikdna/kdna-core';
const RELEASED_CORE_INTEGRITY =
  'sha512-2z8cJX+L39QdtwPoBI4tM0e5o5K7GOBliMeF60Ja3Uv6smJYBLRMSts1sIO/7ECGyk46HCOOs82VvVvLsGPBUQ==';
const PACKABLE_FIXTURE_FILES = ['mimetype', 'kdna.json', 'checksums.json', 'payload.kdnab'];

function assertReleasedCorePair(lock, expectedVersion = '0.18.0') {
  const compatibilityCore = lock.packages[COMPAT_CORE_LOCK_PATH];
  const cliCore = lock.packages[CLI_CORE_LOCK_PATH];
  assert.ok(compatibilityCore, `missing ${COMPAT_CORE_LOCK_PATH}`);
  assert.ok(cliCore, `missing ${CLI_CORE_LOCK_PATH}`);

  for (const [location, node] of [
    [COMPAT_CORE_LOCK_PATH, compatibilityCore],
    [CLI_CORE_LOCK_PATH, cliCore],
  ]) {
    assert.equal(node.version, expectedVersion, `${location} version must match the toolchain`);
    assert.equal(
      node.resolved,
      `https://registry.npmjs.org/@aikdna/kdna-core/-/kdna-core-${expectedVersion}.tgz`,
      `${location} must resolve the released Core tarball`,
    );
    assert.equal(
      node.integrity,
      RELEASED_CORE_INTEGRITY,
      `${location} must bind the released Core integrity`,
    );
  }

  assert.equal(cliCore.version, compatibilityCore.version, 'nested Core versions must match');
  assert.equal(cliCore.resolved, compatibilityCore.resolved, 'nested Core tarballs must match');
  assert.equal(cliCore.integrity, compatibilityCore.integrity, 'nested Core integrity must match');
  assert.deepEqual(cliCore, compatibilityCore, 'nested Core lock metadata must match exactly');

  assert.deepEqual(lock.packages['node_modules/@aikdna/kdna-core'], {
    resolved: 'packages/kdna-core',
    link: true,
  });
  assert.equal(lock.packages['packages/kdna-core'].version, '0.18.1');
}

function discoverPackableFixtures(fixturesRoot) {
  const candidates = fs
    .readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(fixturesRoot, entry.name))
    .filter((directory) =>
      PACKABLE_FIXTURE_FILES.every((file) => {
        try {
          return fs.statSync(path.join(directory, file)).isFile();
        } catch (error) {
          if (error.code === 'ENOENT') return false;
          throw error;
        }
      }),
    )
    .sort();

  assert.ok(candidates.length > 0, `no exact packable fixture found in ${fixturesRoot}`);
  return candidates;
}

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
  assertReleasedCorePair(lock);
});

test('released Core pair gate fails closed on nested lock drift', async (t) => {
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
  for (const [name, mutate] of [
    ['version', (candidate) => (candidate.packages[CLI_CORE_LOCK_PATH].version = '0.18.1')],
    [
      'integrity',
      (candidate) => (candidate.packages[CLI_CORE_LOCK_PATH].integrity = 'sha512-drift'),
    ],
    ['metadata', (candidate) => (candidate.packages[CLI_CORE_LOCK_PATH].license = 'drift')],
    [
      'shared forged integrity',
      (candidate) => {
        candidate.packages[COMPAT_CORE_LOCK_PATH].integrity = 'sha512-shared-forgery';
        candidate.packages[CLI_CORE_LOCK_PATH].integrity = 'sha512-shared-forgery';
      },
    ],
  ]) {
    await t.test(name, () => {
      const drifted = structuredClone(lock);
      mutate(drifted);
      assert.throws(() => assertReleasedCorePair(drifted));
    });
  }
});

test('packable CLI fixture discovery fails closed without an exact candidate', (t) => {
  const emptyFixtures = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-empty-fixtures-'));
  t.after(() => fs.rmSync(emptyFixtures, { force: true, recursive: true }));
  assert.throws(() => discoverPackableFixtures(emptyFixtures), /no exact packable fixture/u);
});

test('kdna-validate delegates released CLI fixtures through the paired toolchain', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-validate-'));
  t.after(() => fs.rmSync(temp, { force: true, recursive: true }));

  assert.equal(compatRequire('@aikdna/kdna-core/package.json').version, '0.18.0');
  assert.equal(compatRequire('@aikdna/kdna-cli/package.json').version, '0.33.0');
  const fixtures = discoverPackableFixtures(path.join(cliPackageRoot, 'fixtures'));

  for (const [index, fixture] of fixtures.entries()) {
    const asset = path.join(temp, `fixture-${index}.kdna`);
    core.pack(fixture, asset);

    const result = spawnSync(process.execPath, [validator, asset, '--json'], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).overall_valid, true);
  }
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
