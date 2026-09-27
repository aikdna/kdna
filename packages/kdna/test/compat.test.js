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
const CLI_NESTED_CORE_LOCK_PATH = 'node_modules/@aikdna/kdna-cli/node_modules/@aikdna/kdna-core';
const COMPAT_NESTED_CORE_LOCK_PATH = 'packages/kdna/node_modules/@aikdna/kdna-core';
const CONFORMANCE_NESTED_CORE_LOCK_PATH =
  'packages/kdna-conformance/node_modules/@aikdna/kdna-core';
const COMPAT_NESTED_CLI_LOCK_PATH = 'packages/kdna/node_modules/@aikdna/kdna-cli';
const PACKABLE_FIXTURE_FILES = ['mimetype', 'kdna.json', 'checksums.json', 'payload.kdnab'];
const EXPECTED_PACKABLE_FIXTURE_COUNT = 2;
const workspaceCore = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'packages/kdna-core/package.json'), 'utf8'),
);
const ecosystemManifest = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
);

function manifestPackage(manifest, repository, packageName, packageJson) {
  const components = manifest.components.filter((entry) => entry.repository === repository);
  assert.equal(components.length, 1, `manifest must identify exactly one ${repository}`);
  const packages = components[0].packages.filter(
    (entry) => entry.package_name === packageName || entry.package_json === packageJson,
  );
  assert.equal(packages.length, 1, `manifest must identify exactly one ${packageName}`);
  assert.equal(packages[0].package_name, packageName);
  assert.equal(packages[0].npm_package, packageName);
  assert.equal(packages[0].package_json, packageJson);
  return packages[0];
}

function assertCurrentToolchainLock(
  lock,
  corePackage = workspaceCore,
  manifest = ecosystemManifest,
) {
  const candidateCore = manifestPackage(
    manifest,
    'aikdna/kdna',
    '@aikdna/kdna-core',
    'packages/kdna-core/package.json',
  );
  const releasedCli = manifestPackage(
    manifest,
    'aikdna/kdna-cli',
    '@aikdna/kdna-cli',
    'package.json',
  );
  assert.equal(corePackage.name, candidateCore.package_name);
  assert.equal(
    corePackage.version,
    candidateCore.version,
    'workspace Core must match current manifest',
  );
  assert.equal(lock.packages['packages/kdna-core'].name, candidateCore.package_name);
  assert.equal(
    lock.packages['packages/kdna-core'].version,
    candidateCore.version,
    'workspace Core lock must match current manifest',
  );
  assert.equal(releasedCli.version, '0.36.1', 'published compatibility CLI remains pinned');
  assert.equal(releasedCli.published_version, '0.36.1');
  assert.deepEqual(lock.packages[ROOT_CORE_LOCK_PATH], {
    resolved: 'packages/kdna-core',
    link: true,
  });
  // The lock carries the candidate Core link, the Core nested under the
  // published CLI, and one released Core for each workspace package that still
  // pins the published Core instead of the candidate: the compatibility
  // package and kdna-conformance. An extra, missing or renamed Core copy means
  // the pair drifted apart again.
  assert.deepEqual(
    Object.keys(lock.packages)
      .filter((location) => location.endsWith('/@aikdna/kdna-core'))
      .sort(),
    [
      CLI_NESTED_CORE_LOCK_PATH,
      COMPAT_NESTED_CORE_LOCK_PATH,
      CONFORMANCE_NESTED_CORE_LOCK_PATH,
      ROOT_CORE_LOCK_PATH,
    ].sort(),
    'the workspace lock must resolve the candidate Core link plus the released Core for the CLI and for every package that still pins the published Core',
  );
  for (const releasedCorePath of [
    COMPAT_NESTED_CORE_LOCK_PATH,
    CONFORMANCE_NESTED_CORE_LOCK_PATH,
  ]) {
    const releasedCore = lock.packages[releasedCorePath];
    assert.equal(releasedCore.version, '0.22.0');
    assert.equal(
      releasedCore.resolved,
      'https://registry.npmjs.org/@aikdna/kdna-core/-/kdna-core-0.22.0.tgz',
    );
    assert.equal(
      releasedCore.integrity,
      'sha512-LPKWe/jf6Shbt2NrBxuumqPWcUREocRXprRib/V/QSC+B3HqUoeUeHbxWT6iZN42NSJcLlc4P0bWvHTZ8dA7/A==',
    );
  }

  assert.deepEqual(
    Object.keys(lock.packages)
      .filter((location) => location.endsWith('/@aikdna/kdna-cli'))
      .sort(),
    [CLI_LOCK_PATH],
    'the workspace lock must contain exactly one released CLI at its root location',
  );
  const cli = lock.packages[CLI_LOCK_PATH];
  assert.equal(cli.version, '0.36.1');
  assert.equal(cli.resolved, 'https://registry.npmjs.org/@aikdna/kdna-cli/-/kdna-cli-0.36.1.tgz');
  assert.equal(
    cli.integrity,
    'sha512-NuvkDxnDvN6ttm3+kh9PRKkCcjyQahGUH3ZTi8qYoduJXXLE8RUxR2rid/tEG3ZiX41bM3DABEqWSiC5fVuseg==',
  );
  // The published CLI 0.36.1 is bound to the published Core 0.21.0. During
  // the 0.22.0 release window the lock carries that registry Core nested
  // under the CLI while the workspace Core moves ahead; the wave re-binds
  // the CLI in a follow-up release.
  assert.deepEqual(cli.dependencies, {
    '@aikdna/kdna-core': '0.21.0',
    'cbor-x': '1.6.4',
  });
  const nestedCore = lock.packages[CLI_NESTED_CORE_LOCK_PATH];
  assert.equal(nestedCore.version, '0.21.0');
  assert.equal(
    nestedCore.resolved,
    'https://registry.npmjs.org/@aikdna/kdna-core/-/kdna-core-0.21.0.tgz',
  );
  assert.equal(
    nestedCore.integrity,
    'sha512-y4AC4LlNvKsKxvIO/y14Bl62eRb0BupzvLGbXATXHX4ZUCmYhdlh6U1OL7WF+i0lCAyVJcIE7SKwhQR3uL5uxg==',
  );

  // The compatibility package declares the same CLI 0.36.1 as the root
  // devDependency, so the lock dedupes to one exact CLI entry. A nested
  // compat CLI would mean the pair drifted apart again.
  assert.equal(
    lock.packages[COMPAT_NESTED_CLI_LOCK_PATH],
    undefined,
    'the compatibility package must resolve the root CLI entry, not a nested drift',
  );
  assert.deepEqual(lock.packages['packages/kdna'].dependencies, {
    '@aikdna/kdna-cli': '0.36.1',
    '@aikdna/kdna-core': '0.22.0',
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
  assert.equal(pkg.version, '0.14.0');
  assert.deepEqual(pkg.dependencies, {
    '@aikdna/kdna-cli': '0.36.1',
    '@aikdna/kdna-core': '0.22.0',
  });
  assert.deepEqual(pkg.engines, { node: '>=22' });
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

  assert.equal(rootPackage.devDependencies['@aikdna/kdna-cli'], '0.36.1');
  assert.deepEqual(lock.packages['packages/kdna'].dependencies, {
    '@aikdna/kdna-cli': '0.36.1',
    '@aikdna/kdna-core': '0.22.0',
  });
  assert.equal(lock.packages['packages/kdna'].version, '0.14.0');
  assertCurrentToolchainLock(lock);
  const rootRequire = createRequire(path.join(repoRoot, 'package.json'));
  const cliRequire = createRequire(path.join(cliPackageRoot, 'package.json'));
  const conformanceRequire = createRequire(
    path.join(repoRoot, 'packages/kdna-conformance/package.json'),
  );
  for (const [resolve, name, expected] of [
    [rootRequire, '@aikdna/kdna-core', 'packages/kdna-core'],
    [rootRequire, '@aikdna/kdna-cli', CLI_LOCK_PATH],
    [compatRequire, '@aikdna/kdna-cli', CLI_LOCK_PATH],
    [compatRequire, '@aikdna/kdna-core', COMPAT_NESTED_CORE_LOCK_PATH],
    [cliRequire, '@aikdna/kdna-core', CLI_NESTED_CORE_LOCK_PATH],
    [conformanceRequire, '@aikdna/kdna-core', CONFORMANCE_NESTED_CORE_LOCK_PATH],
  ]) {
    assert.equal(
      fs.realpathSync(resolve.resolve(`${name}/package.json`)),
      fs.realpathSync(path.join(repoRoot, expected, 'package.json')),
      `${name} must resolve to the exact locked physical location`,
    );
    const expectedVersion =
      expected === 'packages/kdna-core' ? workspaceCore.version : lock.packages[expected].version;
    assert.equal(resolve(`${name}/package.json`).version, expectedVersion);
  }
});

test('current toolchain lock gate fails closed on source or topology drift', async (t) => {
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
  // A broken positive gate must never make every mutation appear to pass.
  assertCurrentToolchainLock(lock);
  for (const [name, mutate] of [
    ['CLI version', (candidate) => (candidate.packages[CLI_LOCK_PATH].version = '0.35.1')],
    ['CLI source', (candidate) => (candidate.packages[CLI_LOCK_PATH].resolved = 'forged')],
    ['CLI integrity', (candidate) => (candidate.packages[CLI_LOCK_PATH].integrity = 'forged')],
    [
      'CLI Core binding',
      (candidate) =>
        (candidate.packages[CLI_LOCK_PATH].dependencies['@aikdna/kdna-core'] = '0.19.0'),
    ],
    [
      'workspace Core version',
      (candidate) => (candidate.packages['packages/kdna-core'].version = '0.19.0'),
    ],
    [
      'retired workspace Core version',
      (candidate) =>
        (candidate.packages['packages/kdna-core'].version = '0.24.0-rc.component-semantics.2'),
    ],
    [
      'workspace Core name',
      (candidate) => (candidate.packages['packages/kdna-core'].name = '@aikdna/forged'),
    ],
    ['missing root CLI', (candidate) => delete candidate.packages[CLI_LOCK_PATH]],
    [
      'unexpected extra CLI copy',
      (candidate) =>
        (candidate.packages['packages/kdna-read/node_modules/@aikdna/kdna-cli'] = structuredClone(
          candidate.packages[CLI_LOCK_PATH],
        )),
    ],
    ['workspace Core link', (candidate) => (candidate.packages[ROOT_CORE_LOCK_PATH].link = false)],
    [
      'workspace Core path',
      (candidate) => (candidate.packages[ROOT_CORE_LOCK_PATH].resolved = 'forged'),
    ],
    [
      'compat CLI version',
      (candidate) =>
        (candidate.packages['packages/kdna'].dependencies['@aikdna/kdna-cli'] = '0.36.0'),
    ],
    [
      'compat CLI Core binding',
      (candidate) =>
        (candidate.packages['packages/kdna'].dependencies['@aikdna/kdna-core'] = '0.19.0'),
    ],
    [
      'compat nested CLI drift',
      (candidate) => (candidate.packages[COMPAT_NESTED_CLI_LOCK_PATH] = { version: '0.36.1' }),
    ],
    [
      'unexpected extra Core copy',
      (candidate) =>
        (candidate.packages['packages/kdna-read/node_modules/@aikdna/kdna-core'] = {
          version: '0.22.0',
        }),
    ],
    [
      'released Core copy dropped',
      (candidate) => delete candidate.packages[CONFORMANCE_NESTED_CORE_LOCK_PATH],
    ],
  ]) {
    await t.test(name, () => {
      const drifted = structuredClone(lock);
      mutate(drifted);
      assert.throws(() => assertCurrentToolchainLock(drifted));
    });
  }
});

test('workspace identity gate rejects stale or ambiguous manifest authority', async (t) => {
  const lock = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package-lock.json'), 'utf8'));
  assertCurrentToolchainLock(lock);
  for (const [name, mutate] of [
    ['workspace package mismatch', (pkg) => (pkg.version = '0.24.0-rc.component-semantics.2')],
    ['workspace package name', (pkg) => (pkg.name = '@aikdna/forged')],
    [
      'stale manifest and lock agree but disagree with workspace',
      (_pkg, manifest, candidate) => {
        manifestPackage(
          manifest,
          'aikdna/kdna',
          '@aikdna/kdna-core',
          'packages/kdna-core/package.json',
        ).version = '0.24.0-rc.component-semantics.2';
        candidate.packages['packages/kdna-core'].version = '0.24.0-rc.component-semantics.2';
      },
    ],
    [
      'duplicate Core manifest entry',
      (_pkg, manifest) => {
        const root = manifest.components.find((entry) => entry.repository === 'aikdna/kdna');
        root.packages.push(
          structuredClone(
            root.packages.find((entry) => entry.package_name === '@aikdna/kdna-core'),
          ),
        );
      },
    ],
    [
      'mislocated Core manifest entry',
      (_pkg, manifest) => {
        manifestPackage(
          manifest,
          'aikdna/kdna',
          '@aikdna/kdna-core',
          'packages/kdna-core/package.json',
        ).package_json = 'forged/package.json';
      },
    ],
    [
      'duplicate CLI manifest entry',
      (_pkg, manifest) => {
        const cli = manifest.components.find((entry) => entry.repository === 'aikdna/kdna-cli');
        cli.packages.push(
          structuredClone(cli.packages.find((entry) => entry.package_name === '@aikdna/kdna-cli')),
        );
      },
    ],
  ]) {
    await t.test(name, () => {
      const pkg = structuredClone(workspaceCore);
      const manifest = structuredClone(ecosystemManifest);
      const candidate = structuredClone(lock);
      mutate(pkg, manifest, candidate);
      assert.throws(() => assertCurrentToolchainLock(candidate, pkg, manifest), {
        code: 'ERR_ASSERTION',
      });
    });
  }
});

test('packable CLI fixture inventory fails closed on directory or file drift', async (t) => {
  const fixturesRoot = path.join(cliPackageRoot, 'fixtures');
  const fixtureNames = discoverPackableFixtures(fixturesRoot).map((fixture) =>
    path.basename(fixture),
  );

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
    ['added directory', (candidate) => fs.mkdirSync(path.join(candidate, 'unexpected-fixture'))],
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

  assert.equal(compatRequire('@aikdna/kdna-core/package.json').version, '0.22.0');
  assert.equal(compatRequire('@aikdna/kdna-cli/package.json').version, '0.36.1');
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
