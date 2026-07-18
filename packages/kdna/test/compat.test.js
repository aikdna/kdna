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
const ROOT_CORE_LOCK_PATH = 'node_modules/@aikdna/kdna-core';
const CLI_LOCK_PATH = 'node_modules/@aikdna/kdna-cli';
const PACKABLE_FIXTURE_FILES = ['mimetype', 'kdna.json', 'checksums.json', 'payload.kdnab'];
const EXPECTED_PACKABLE_FIXTURE_COUNT = 2;

function assertCurrentToolchainLock(lock) {
  assert.deepEqual(lock.packages[ROOT_CORE_LOCK_PATH], {
    resolved: 'packages/kdna-core',
    link: true,
  });
  assert.equal(lock.packages['packages/kdna-core'].version, '0.20.0');
  assert.deepEqual(
    Object.keys(lock.packages).filter((location) => location.endsWith('/@aikdna/kdna-core')),
    [ROOT_CORE_LOCK_PATH],
    'the workspace lock must resolve one Core package',
  );

  const cli = lock.packages[CLI_LOCK_PATH];
  assert.equal(cli.version, '0.35.1');
  assert.equal(
    cli.resolved,
    'https://registry.npmjs.org/@aikdna/kdna-cli/-/kdna-cli-0.35.1.tgz',
  );
  assert.equal(
    cli.integrity,
    'sha512-eAdceLAmQceS2/o7RPg2RB71ikd3g1xB85Fw9WJgPcvekBGriDti7XC0b4+LS7fZJdlokiz9tj7WsxlOTdP3Aw==',
  );
  assert.deepEqual(cli.dependencies, {
    '@aikdna/kdna-core': '0.20.0',
    '@aikdna/kdna-eval': '0.3.2',
  });
}

function discoverPackableFixtures(fixturesRoot) {
  const directories = fs
    .readdirSync(fixturesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(fixturesRoot, entry.name))
    .sort();

  assert.equal(
    directories.length,
    EXPECTED_PACKABLE_FIXTURE_COUNT,
    `${fixturesRoot} must contain exactly ${EXPECTED_PACKABLE_FIXTURE_COUNT} fixture directories`,
  );
  for (const directory of directories) {
    for (const file of PACKABLE_FIXTURE_FILES) {
      assert.equal(
        fs.lstatSync(path.join(directory, file)).isFile(),
        true,
        `${path.join(directory, file)} must be a regular file`,
      );
    }
  }
  return directories;
}

test('compatibility manifest pins one released toolchain without claiming the current CLI binary', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '0.13.2');
  assert.deepEqual(pkg.dependencies, {
    '@aikdna/kdna-cli': '0.35.1',
    '@aikdna/kdna-core': '0.20.0',
  });
  assert.deepEqual(pkg.engines, { node: '>=20' });
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

  assert.equal(rootPackage.devDependencies['@aikdna/kdna-cli'], '0.35.1');
  assert.deepEqual(lock.packages['packages/kdna'].dependencies, {
    '@aikdna/kdna-cli': '0.35.1',
    '@aikdna/kdna-core': '0.20.0',
  });
  assert.equal(lock.packages['packages/kdna'].version, '0.13.2');
  assertCurrentToolchainLock(lock);
});

test('current toolchain lock gate fails closed on source or topology drift', async (t) => {
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
  for (const [name, mutate] of [
    ['CLI version', (candidate) => (candidate.packages[CLI_LOCK_PATH].version = '0.35.0')],
    ['CLI source', (candidate) => (candidate.packages[CLI_LOCK_PATH].resolved = 'forged')],
    ['CLI integrity', (candidate) => (candidate.packages[CLI_LOCK_PATH].integrity = 'forged')],
    [
      'CLI Core binding',
      (candidate) => (candidate.packages[CLI_LOCK_PATH].dependencies['@aikdna/kdna-core'] = '0.19.0'),
    ],
    ['workspace Core version', (candidate) => (candidate.packages['packages/kdna-core'].version = '0.19.0')],
    ['workspace Core link', (candidate) => (candidate.packages[ROOT_CORE_LOCK_PATH].link = false)],
    [
      'nested Core copy',
      (candidate) =>
        (candidate.packages['node_modules/@aikdna/kdna-cli/node_modules/@aikdna/kdna-core'] = {
          version: '0.20.0',
        }),
    ],
  ]) {
    await t.test(name, () => {
      const drifted = structuredClone(lock);
      mutate(drifted);
      assert.throws(() => assertCurrentToolchainLock(drifted));
    });
  }
});

test('packable CLI fixture inventory fails closed on directory or file drift', async (t) => {
  const fixturesRoot = path.join(cliPackageRoot, 'fixtures');
  const fixtureNames = discoverPackableFixtures(fixturesRoot).map((fixture) => path.basename(fixture));

  for (const [name, mutate] of [
    [
      'deleted directory',
      (candidate) =>
        fs.rmSync(path.join(candidate, fixtureNames[0]), { force: true, recursive: true }),
    ],
    [
      'missing payload',
      (candidate) => fs.rmSync(path.join(candidate, fixtureNames[0], 'payload.kdnab')),
    ],
    [
      'added directory',
      (candidate) => fs.mkdirSync(path.join(candidate, 'unexpected-fixture')),
    ],
  ]) {
    await t.test(name, (t) => {
      const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-fixtures-'));
      t.after(() => fs.rmSync(temp, { force: true, recursive: true }));
      const candidate = path.join(temp, 'fixtures');
      fs.cpSync(fixturesRoot, candidate, { recursive: true });
      mutate(candidate);
      assert.throws(() => discoverPackableFixtures(candidate));
    });
  }
});

test('kdna-validate delegates released CLI fixtures through the paired toolchain', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-validate-'));
  t.after(() => fs.rmSync(temp, { force: true, recursive: true }));

  assert.equal(compatRequire('@aikdna/kdna-core/package.json').version, '0.20.0');
  assert.equal(compatRequire('@aikdna/kdna-cli/package.json').version, '0.35.1');
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
