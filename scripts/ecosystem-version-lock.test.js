'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  EXPECTED_BINDINGS,
  bindingKey,
  evaluateConsumers,
  findConsumers,
  readBaselines,
  reconcileBindings,
  workspacePackagePaths,
} = require('./ecosystem-version-lock');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

test('workspace discovery includes root and declared workspace packages only', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-version-lock-workspaces-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const rootPackage = { private: true, workspaces: ['packages/*'] };
  writeJson(path.join(root, 'package.json'), rootPackage);
  writeJson(path.join(root, 'packages', 'one', 'package.json'), { name: 'one' });
  writeJson(path.join(root, 'packages', 'two', 'package.json'), { name: 'two' });
  writeJson(path.join(root, 'examples', 'ignored', 'package.json'), { name: 'ignored' });

  assert.deepEqual(
    workspacePackagePaths(root, rootPackage).map((candidate) => path.relative(root, candidate)),
    ['package.json', 'packages/one/package.json', 'packages/two/package.json'],
  );
});

test('schema-2 package records derive Eval and compatibility coordinates without source special cases', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-version-lock-baselines-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, 'ecosystem-manifest.json'), {
    schema_version: 2,
    components: [
      {
        repository: 'aikdna/kdna',
        local_path: '.',
        lifecycle: 'Beta',
        packages: [
          {
            package_json: 'packages/kdna-core/package.json',
            npm_package: '@aikdna/kdna-core',
            version: '0.20.0',
            release_status: 'active',
            dependency_policy: 'current',
          },
          {
            package_json: 'packages/kdna-eval/package.json',
            npm_package: '@aikdna/kdna-eval',
            version: '0.3.2',
            release_status: 'active',
            dependency_policy: 'current',
          },
          {
            package_json: 'packages/kdna/package.json',
            npm_package: '@aikdna/kdna',
            version: '0.13.1',
            release_status: 'compatibility',
            dependency_policy: 'current',
          },
          {
            package_json: 'packages/retired/package.json',
            npm_package: '@aikdna/retired',
            version: '0.1.0',
            release_status: 'deprecated',
            dependency_policy: 'frozen',
          },
        ],
      },
    ],
  });

  const policy = readBaselines(root);
  assert.deepEqual(Object.fromEntries([...policy.baselines].sort()), {
    '@aikdna/kdna': '0.13.1',
    '@aikdna/kdna-core': '0.20.0',
    '@aikdna/kdna-eval': '0.3.2',
  });
  const manifests = policy.manifestsByRepository.get('kdna');
  for (const expected of [
    'packages/kdna-core/package.json',
    'packages/kdna-eval/package.json',
    'packages/kdna/package.json',
  ]) {
    assert.equal(manifests.includes(expected), true);
  }
  assert.equal(manifests.includes('packages/retired/package.json'), false);
});

test('consumer discovery scans workspaces and records explicit legacy exclusions', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-version-lock-consumers-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, 'current', 'package.json'), {
    private: true,
    workspaces: ['packages/*'],
    devDependencies: { '@aikdna/kdna-cli': '0.35.0' },
  });
  writeJson(path.join(root, 'current', 'packages', 'bridge', 'package.json'), {
    dependencies: { '@aikdna/kdna-core': '0.20.0' },
  });
  writeJson(path.join(root, 'legacy', 'package.json'), {
    dependencies: { '@aikdna/kdna-core': '^0.12.3' },
  });

  const result = findConsumers(
    root,
    new Map([
      ['@aikdna/kdna-cli', '0.35.0'],
      ['@aikdna/kdna-core', '0.20.0'],
    ]),
    new Map([
      ['current', 'Beta'],
      ['legacy', 'Legacy'],
    ]),
  );
  assert.deepEqual(result.skipped, [{ repository: 'legacy', lifecycle: 'Legacy' }]);
  assert.deepEqual(
    result.consumers.map((consumer) => [consumer.manifest, consumer.section, consumer.packageName]),
    [
      ['package.json', 'devDependencies', '@aikdna/kdna-cli'],
      ['packages/bridge/package.json', 'dependencies', '@aikdna/kdna-core'],
    ],
  );
});

test('consumer discovery reads an explicit nested manifest without a root package', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-version-lock-nested-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, 'kdna-skills', 'mcp-server', 'package.json'), {
    dependencies: { '@aikdna/kdna-core': '0.20.0' },
  });

  const result = findConsumers(
    root,
    new Map([['@aikdna/kdna-core', '0.20.0']]),
    new Map([['kdna-skills', 'Experimental']]),
    new Map([['kdna-skills', ['mcp-server/package.json']]]),
    { controlRoot: path.join(root, 'missing-control-root') },
  );
  assert.deepEqual(result.consumers, [
    {
      repository: 'kdna-skills',
      manifest: 'mcp-server/package.json',
      section: 'dependencies',
      packageName: '@aikdna/kdna-core',
      declared: '0.20.0',
      expected: '0.20.0',
    },
  ]);
});

test('consumer discovery keeps peer and development declarations distinct', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-version-lock-sections-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  writeJson(path.join(root, 'server', 'package.json'), {
    devDependencies: { '@aikdna/kdna-core': '0.20.0' },
    peerDependencies: { '@aikdna/kdna-core': '^0.19.0' },
  });

  const result = findConsumers(
    root,
    new Map([['@aikdna/kdna-core', '0.20.0']]),
    new Map([['server', 'Experimental']]),
    new Map(),
    { controlRoot: path.join(root, 'missing-control-root') },
  );
  assert.deepEqual(
    result.consumers.map(({ section, declared }) => [section, declared]),
    [
      ['devDependencies', '0.20.0'],
      ['peerDependencies', '^0.19.0'],
    ],
  );
});

test('explicit policy contains 34 unique current managed dependency declarations', () => {
  assert.equal(EXPECTED_BINDINGS.length, 34);
  assert.equal(new Set(EXPECTED_BINDINGS.map(bindingKey)).size, EXPECTED_BINDINGS.length);
});

test('reconciliation fails closed when an expected repository, manifest, or dependency vanishes', () => {
  const expectedBindings = [
    {
      repository: 'one',
      manifest: 'package.json',
      section: 'dependencies',
      packageName: '@aikdna/kdna-core',
    },
    {
      repository: 'two',
      manifest: 'app/package.json',
      section: 'dependencies',
      packageName: '@aikdna/kdna-core',
    },
  ];
  const reconciled = reconcileBindings(
    [
      {
        ...expectedBindings[0],
        declared: '0.20.0',
        expected: '0.20.0',
      },
    ],
    new Map([['@aikdna/kdna-core', '0.20.0']]),
    expectedBindings,
  );
  assert.deepEqual(
    evaluateConsumers(reconciled).map((result) => result.ok),
    [true, false],
  );
  assert.match(reconciled[1].error, /expected managed binding is missing/u);
});

test('reconciliation rejects an unreviewed managed dependency binding', () => {
  const reconciled = reconcileBindings(
    [
      {
        repository: 'new-consumer',
        manifest: 'package.json',
        section: 'dependencies',
        packageName: '@aikdna/kdna-core',
        declared: '0.20.0',
        expected: '0.20.0',
      },
    ],
    new Map([['@aikdna/kdna-core', '0.20.0']]),
    [],
  );
  assert.equal(evaluateConsumers(reconciled)[0].ok, false);
  assert.match(reconciled[0].error, /unexpected managed binding/u);
});

test('only exact current coordinates pass', () => {
  const results = evaluateConsumers([
    { declared: '0.20.0', expected: '0.20.0' },
    { declared: '^0.20.0', expected: '0.20.0' },
    { declared: '0.19.0', expected: '0.20.0' },
    { error: 'invalid JSON' },
  ]);
  assert.deepEqual(
    results.map((result) => result.ok),
    [true, false, false, false],
  );
});
