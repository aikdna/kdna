'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { sameFilesystemIdentity } = require('../../scripts/filesystem-identity');
const {
  candidateIncumbentPackages,
  compareStableVersions,
  currentPublishedPackages,
  currentAssetIndexInventory,
  manifestArtifactInventory,
  publishableSourcePackages,
  resolveComponentPath,
} = require('../../scripts/ecosystem-manifest');

test('candidate packages stay outside current-published projections', () => {
  const candidate = packageRecord({
    published_version: '0.9.0',
    lifecycle: 'Legacy',
    release_status: 'candidate',
    legacy_replacement: '@aikdna/replacement',
  });
  assert.deepEqual(
    currentPublishedPackages(
      manifest([component({ repository: 'aikdna/kdna', local_path: '.', packages: [candidate] })]),
    ),
    [],
  );
  assert.equal(
    candidateIncumbentPackages(
      manifest([component({ repository: 'aikdna/kdna', local_path: '.', packages: [candidate] })]),
    )[0].packageRecord.version,
    '0.9.0',
  );
  assert.equal(
    publishableSourcePackages(manifest([component({ packages: [candidate] })])).filter(
      ({ packageRecord }) => packageRecord.npm_package === '@aikdna/fixture-package',
    ).length,
    1,
  );
  assert.equal(compareStableVersions('100000000000000000000.0.0', '99999999999999999999.9.9'), 1);
});

const repoRoot = path.resolve(__dirname, '..', '..');
const validator = path.join(repoRoot, 'scripts', 'validate-ecosystem-manifest.js');

function packageRecord(overrides = {}) {
  return {
    package_json: 'package.json',
    package_name: '@aikdna/fixture-package',
    npm_package: '@aikdna/fixture-package',
    version: '1.0.0',
    lifecycle: 'Pre-release',
    release_status: 'active',
    dependency_policy: 'current',
    known_limitations: [],
    recommended_entrypoint: null,
    legacy_replacement: null,
    ...overrides,
  };
}

function component(overrides = {}) {
  return {
    repository: 'aikdna/fixture-package',
    local_path: '../fixture-package',
    source_commit: '0'.repeat(40),
    conformance_commit: null,
    component_version: null,
    packages: [packageRecord()],
    artifacts: [],
    lifecycle: 'Pre-release',
    supported_kdna_version: '1.0',
    supported_access_modes: [],
    supported_entitlement_profiles: [],
    known_limitations: [],
    recommended_entrypoint: null,
    legacy_replacement: null,
    ...overrides,
  };
}

function manifest(components) {
  const records = components.some((entry) => entry.repository === 'aikdna/kdna')
    ? components
    : [
        JSON.parse(
          fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
        ).components.find((entry) => entry.repository === 'aikdna/kdna'),
        ...components,
      ];
  return {
    schema_version: 2,
    lifecycle_terms: [
      'Pre-release',
      'Experimental',
      'Unassessed',
      'Legacy',
      'Removed',
      'Future',
      'Draft Normative',
    ],
    baseline_statement: 'test-only manifest',
    components: records,
  };
}

function writeManifest(root, components) {
  const manifestPath = path.join(root, 'ecosystem-manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest(components), null, 2)}\n`);
  return manifestPath;
}

function runValidator(manifestPath, reposRoot) {
  return spawnSync(process.execPath, [validator], {
    encoding: 'utf8',
    env: {
      ...process.env,
      KDNA_ECOSYSTEM_MANIFEST_PATH: manifestPath,
      ...(reposRoot ? { KDNA_ECOSYSTEM_REPOS_ROOT: reposRoot } : {}),
    },
  });
}

function git(root, args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function initRepository(root, files) {
  fs.mkdirSync(root, { recursive: true });
  for (const [relativePath, bytes] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, bytes);
  }
  git(root, ['init']);
  git(root, ['config', 'user.name', 'KDNA Test']);
  git(root, ['config', 'user.email', 'test@invalid.example']);
  git(root, ['add', '.']);
  git(root, ['commit', '-m', 'fixture']);
  return git(root, ['rev-parse', 'HEAD']);
}

test('Windows repository aliases compare by canonical filesystem identity', () => {
  const shortPath = String.raw`C:\Users\RUNNER~1\work\kdna-cli`;
  const longPath = String.raw`c:/users/runneradmin/work/kdna-cli/`;
  const realpath = (input) => {
    if (input === shortPath || input === longPath) {
      return String.raw`C:\Users\RunnerAdmin\work\kdna-cli`;
    }
    return input;
  };
  assert.equal(sameFilesystemIdentity(shortPath, longPath, { platform: 'win32', realpath }), true);
});

test('Windows identity comparison does not collapse a nested repository path', () => {
  assert.equal(
    sameFilesystemIdentity(String.raw`C:\work\outer`, String.raw`C:\work\outer\nested`, {
      platform: 'win32',
      realpath: (input) => input,
    }),
    false,
  );
});

test('explicit ecosystem checkout root is authoritative over a sibling checkout', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-resolver-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const controlRoot = path.join(root, 'control', 'kdna');
  const siblingRoot = path.join(root, 'control', 'fixture-package');
  const explicitRoot = path.join(root, 'verified');
  const explicitRepo = path.join(explicitRoot, 'fixture-package');
  fs.mkdirSync(controlRoot, { recursive: true });
  fs.mkdirSync(siblingRoot, { recursive: true });
  fs.mkdirSync(explicitRepo, { recursive: true });

  const record = component();
  assert.equal(
    resolveComponentPath(controlRoot, record, { reposRoot: explicitRoot }),
    explicitRepo,
  );
  assert.equal(
    resolveComponentPath(controlRoot, record, { reposRoot: path.join(root, 'missing') }),
    null,
  );
});

test('canonical schema-2 manifest inventories every public repository, co-located package, and reference asset', () => {
  const canonical = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  assert.equal(canonical.schema_version, 2);
  assert.equal(
    canonical.components.some((entry) => entry.repository === 'aikdna/kdna-releases'),
    false,
  );
  const core = canonical.components.find((entry) => entry.repository === 'aikdna/kdna');
  assert.deepEqual(
    new Set(core.packages.map((entry) => entry.npm_package)),
    new Set([
      '@aikdna/kdna-core',
      '@aikdna/kdna-eval',
      '@aikdna/kdna',
      '@aikdna/agent',
      '@aikdna/kdna-artifact-engine',
      '@aikdna/kdna-fidelity-core',
    ]),
  );
  const assets = canonical.components.find((entry) => entry.repository === 'aikdna/kdna-assets');
  assert.equal(assets.packages.length, 0);
  assert.equal(assets.artifacts.length, 2);
  assert.deepEqual(
    new Set(
      canonical.components
        .filter((entry) => entry.local_path !== null)
        .map((entry) => entry.repository),
    ),
    new Set([
      'aikdna/create-kdna-web-app',
      'aikdna/kdna',
      'aikdna/kdna-activation-server',
      'aikdna/kdna-app-shared',
      'aikdna/kdna-assets',
      'aikdna/kdna-cli',
      'aikdna/kdna-core-swift',
      'aikdna/kdna-demo-web-viewer',
      'aikdna/kdna-react',
      'aikdna/kdna-remote-server',
      'aikdna/kdna-skills',
      'aikdna/kdna-studio-cli',
      'aikdna/kdna-studio-core',
      'aikdna/kdna-studio-swift',
      'aikdna/kdna-vscode',
      'aikdna/kdna-web-client',
      'aikdna/kdna-web-server',
    ]),
  );
  assert.deepEqual(
    canonical.components
      .filter((entry) => entry.release_tag)
      .map((entry) => [entry.repository, entry.component_version, entry.release_tag]),
    [
      ['aikdna/kdna-core-swift', '0.20.0', 'v0.20.0'],
      ['aikdna/kdna-app-shared', '0.5.0', '0.5.0'],
      ['aikdna/kdna-studio-swift', '0.4.0', '0.4.0'],
    ],
  );
});

test('ecosystem workflow checkouts stay pinned to schema-2 source commits', () => {
  const canonical = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  const components = canonical.components.filter(
    (entry) => entry.local_path && entry.local_path !== '.' && entry.source_commit,
  );

  for (const workflowName of ['core-smoke.yml', 'publish.yml']) {
    const workflow = fs.readFileSync(
      path.join(repoRoot, '.github', 'workflows', workflowName),
      'utf8',
    );
    for (const entry of components) {
      const repositoryMarker = `repository: ${entry.repository}`;
      let offset = 0;
      let occurrences = 0;
      while ((offset = workflow.indexOf(repositoryMarker, offset)) >= 0) {
        const nextStep = workflow.indexOf('\n      - ', offset);
        const checkoutBlock = workflow.slice(offset, nextStep >= 0 ? nextStep : workflow.length);
        assert.match(
          checkoutBlock,
          new RegExp(`^\\s*ref: ${entry.source_commit}\\s*$`, 'mu'),
          `${workflowName} must check out ${entry.repository} at its schema-2 source commit`,
        );
        occurrences += 1;
        offset += repositoryMarker.length;
      }
      assert.equal(
        occurrences,
        1,
        `${workflowName} must check out ${entry.repository} exactly once`,
      );
    }
  }
});

test('candidate Core conformance anchor carries the declared candidate package version', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-core-anchor-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const canonical = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  const core = canonical.components.find((entry) => entry.repository === 'aikdna/kdna');
  const corePackage = core.packages.find((entry) => entry.npm_package === '@aikdna/kdna-core');
  const oldAnchor = git(repoRoot, ['rev-list', '-n', '1', corePackage.published_version]);
  for (const entry of canonical.components) {
    if (entry.conformance_commit === core.conformance_commit) {
      entry.conformance_commit = oldAnchor;
    }
    for (const artifact of entry.artifacts) {
      if (artifact.conformance_commit === core.conformance_commit) {
        artifact.conformance_commit = oldAnchor;
      }
    }
  }
  const manifestPath = path.join(root, 'ecosystem-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(canonical));
  const result = runValidator(manifestPath);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /conformance_commit package version mismatch/u);
});

test('asset inventory is an exact two-way projection of index/current.json', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-asset-inventory-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const assetRoot = path.join(root, 'kdna-assets');
  const assetBytes = fs.readFileSync(path.join(repoRoot, 'fixtures', 'test_protected_entry.kdna'));
  const assetHash = crypto.createHash('sha256').update(assetBytes).digest('hex');
  const artifactPath = 'references/public/fixture/fixture-1.0.0.kdna';
  const index = {
    assets: [
      {
        version: '1.0.0',
        digest: { value: assetHash },
        artifact: { path: artifactPath },
        download: {
          url: 'https://github.com/aikdna/kdna-assets/releases/download/1.0.0/fixture-1.0.0.kdna',
        },
      },
    ],
    clusters: [],
  };
  const commit = initRepository(assetRoot, {
    [artifactPath]: assetBytes,
    'index/current.json': JSON.stringify(index),
  });
  git(assetRoot, ['tag', '1.0.0']);
  const currentConformanceCommit = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  ).components.find((entry) => entry.repository === 'aikdna/kdna').conformance_commit;
  const artifact = {
    path: artifactPath,
    version: '1.0.0',
    sha256: assetHash,
    release_tag: '1.0.0',
    release_commit: commit,
    conformance_commit: currentConformanceCommit,
    kind: 'kdna-asset',
    lifecycle: 'Experimental',
    known_limitations: [],
    recommended_entrypoint: 'inspect then load',
  };
  const assets = component({
    repository: 'aikdna/kdna-assets',
    local_path: '../kdna-assets',
    source_commit: commit,
    conformance_commit: currentConformanceCommit,
    packages: [],
    artifacts: [artifact],
    lifecycle: 'Experimental',
  });
  const manifestPath = writeManifest(root, [assets]);
  const indexPath = path.join(assetRoot, 'index', 'current.json');

  assert.deepEqual(manifestArtifactInventory(assets), currentAssetIndexInventory(index));
  let result = runValidator(manifestPath, root);
  assert.equal(result.status, 0, `stdout=${result.stdout}\nstderr=${result.stderr}`);

  for (const hostileIndex of [
    { ...index, assets: [] },
    {
      ...index,
      assets: [
        ...index.assets,
        {
          ...index.assets[0],
          artifact: { path: 'references/public/extra/extra-1.0.0.kdna' },
          download: {
            url: 'https://github.com/aikdna/kdna-assets/releases/download/1.0.0/extra-1.0.0.kdna',
          },
        },
      ],
    },
  ]) {
    fs.writeFileSync(indexPath, JSON.stringify(hostileIndex));
    result = runValidator(manifestPath, root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /artifact inventory differs/u);
  }

  fs.writeFileSync(indexPath, JSON.stringify({ ...index, clusters: [{ id: 'fixture' }] }));
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /clusters require an ecosystem manifest schema extension/u);
});

test('validator rejects schema 1, mixed legacy fields, and unknown fields', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-schema-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  for (const candidate of [
    { ...manifest([component()]), schema_version: 1 },
    {
      ...manifest([component({ npm_package: '@aikdna/old-shape' })]),
    },
    { ...manifest([component()]), unknown: true },
    manifest([component({ packages: [packageRecord({ version: '1.0.0-01' })] })]),
    manifest([component({ packages: [packageRecord({ version: '1.0.0-a..b' })] })]),
    manifest([
      component({
        packages: [
          packageRecord({
            release_status: 'candidate',
            lifecycle: 'Legacy',
            legacy_replacement: '@aikdna/replacement',
          }),
        ],
      }),
    ]),
    manifest([
      component({
        packages: [
          packageRecord({
            version: '1.0.1-rc.1',
            published_version: '1.0.0',
            release_status: 'candidate',
          }),
        ],
      }),
    ]),
    manifest([
      component({
        packages: [
          packageRecord({
            version: '1.0.1',
            published_version: '1.0.0+candidate',
            release_status: 'candidate',
          }),
        ],
      }),
    ]),
    manifest([component({ packages: [packageRecord({ published_version: '0.9.0' })] })]),
  ]) {
    const manifestPath = path.join(root, 'ecosystem-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(candidate));
    const result = runValidator(manifestPath, root);
    assert.equal(result.status, 1, `stdout=${result.stdout}\nstderr=${result.stderr}`);
    assert.match(result.stderr, /manifest schema/u);
  }
});

test('validator fails closed for a live component without evidence or checkout', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-no-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const manifestPath = writeManifest(root, [
    component({
      repository: 'aikdna/does-not-exist',
      local_path: '../does-not-exist',
      source_commit: null,
      packages: [],
    }),
  ]);
  const result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /repository checkout is unavailable|source_commit|no package/u);
});

test('validator rejects unavailable or unreadable current package evidence', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-package-evidence-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const missingRoot = path.join(root, 'fixture-package');
  const missingCommit = initRepository(missingRoot, { 'README.md': 'missing package' });
  let manifestPath = writeManifest(root, [component({ source_commit: missingCommit })]);
  let result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /package evidence is unavailable/u);

  fs.rmSync(missingRoot, { recursive: true, force: true });
  const brokenRoot = path.join(root, 'fixture-package');
  const brokenCommit = initRepository(brokenRoot, { 'package.json': '{not-json' });
  manifestPath = writeManifest(root, [component({ source_commit: brokenCommit })]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /package evidence is unreadable/u);
});

test('validator binds external packages to the accepted source snapshot without reinterpreting current checkout state', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-package-commit-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'fixture-package');
  const commit = initRepository(packageRoot, {
    'package.json': JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }),
  });
  const manifestPath = writeManifest(root, [component({ source_commit: commit })]);

  const clean = runValidator(manifestPath, root);
  assert.equal(clean.status, 0, `stdout=${clean.stdout}\nstderr=${clean.stderr}`);

  writeManifest(root, [component({ source_commit: '0'.repeat(40) })]);
  const mismatched = runValidator(manifestPath, root);
  assert.equal(mismatched.status, 1);
  assert.match(mismatched.stderr, /accepted source snapshot is unreadable/u);

  writeManifest(root, [component({ source_commit: commit })]);
  fs.writeFileSync(path.join(packageRoot, 'untracked.txt'), 'dirty');
  fs.writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: '@aikdna/fixture-package', version: '2.0.0' }),
  );
  const advancedCheckout = runValidator(manifestPath, root);
  assert.equal(
    advancedCheckout.status,
    0,
    `stdout=${advancedCheckout.stdout}\nstderr=${advancedCheckout.stderr}`,
  );
});

test('validator requires a candidate stable version newer than the incumbent', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-candidate-order-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'fixture-package');
  const commit = initRepository(packageRoot, {
    'package.json': JSON.stringify({ name: '@aikdna/fixture-package', version: '0.13.0' }),
  });
  const candidate = packageRecord({
    version: '0.13.0',
    published_version: '0.13.1',
    release_status: 'candidate',
  });
  const manifestPath = writeManifest(root, [
    component({ source_commit: commit, packages: [candidate] }),
  ]);
  const result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /candidate version must be greater/u);
});

test('validator rejects manifest path escape and does not follow a current-checkout symlink past an immutable source pin', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-paths-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'fixture-package');
  const outside = path.join(root, 'outside-package.json');
  fs.writeFileSync(outside, JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }));
  const commit = initRepository(packageRoot, {
    'package.json': JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }),
  });

  let manifestPath = writeManifest(root, [component({ local_path: '../../fixture-package' })]);
  let result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /manifest schema/u);

  manifestPath = writeManifest(root, [component({ local_path: '../different-repository' })]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /local_path must be/u);

  manifestPath = writeManifest(root, [
    component({ local_path: '.', source_commit: null, packages: [] }),
  ]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /only aikdna\/kdna may use/u);

  manifestPath = writeManifest(root, [
    component({
      source_commit: commit,
      packages: [packageRecord({ package_json: '../outside-package.json' })],
    }),
  ]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /manifest schema/u);

  fs.unlinkSync(path.join(packageRoot, 'package.json'));
  fs.symlinkSync(outside, path.join(packageRoot, 'package.json'));
  manifestPath = writeManifest(root, [component({ source_commit: commit })]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 0, `stdout=${result.stdout}\nstderr=${result.stderr}`);
});

test('validator rejects duplicate repository, package source, package name, and npm coordinate', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-duplicates-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  const candidates = [
    [component(), component()],
    [component({ packages: [packageRecord(), packageRecord()] })],
    [
      component({
        packages: [
          packageRecord(),
          packageRecord({
            package_json: 'other/package.json',
            package_name: '@aikdna/fixture-package',
            npm_package: '@aikdna/other',
          }),
        ],
      }),
    ],
    [
      component({
        packages: [
          packageRecord(),
          packageRecord({
            package_json: 'other/package.json',
            package_name: '@aikdna/other',
            npm_package: '@aikdna/fixture-package',
          }),
        ],
      }),
    ],
  ];

  for (const components of candidates) {
    const manifestPath = writeManifest(root, components);
    const result = runValidator(manifestPath, root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /duplicate/u);
  }
});

test('validator enforces deprecated package source and publication boundaries', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-deprecated-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const packageRoot = path.join(root, 'fixture-package');
  const commit = initRepository(packageRoot, {
    'package.json': JSON.stringify({
      name: '@aikdna/fixture-package',
      version: '1.0.0',
      scripts: { prepublishOnly: 'exit 0' },
    }),
  });
  const deprecated = packageRecord({
    lifecycle: 'Legacy',
    release_status: 'deprecated',
    dependency_policy: 'frozen',
    legacy_replacement: '@aikdna/replacement',
  });
  const manifestPath = writeManifest(root, [
    component({
      source_commit: commit,
      lifecycle: 'Legacy',
      packages: [deprecated],
      legacy_replacement: '@aikdna/replacement',
    }),
  ]);
  const result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /deprecated package source must be private|must not expose/u);
});

test('validator binds a live package-less component to an exact release tag and commit', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-component-release-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const swiftRoot = path.join(root, 'fixture-swift');
  const commit = initRepository(swiftRoot, { 'Package.swift': '// swift fixture\n' });
  git(swiftRoot, ['tag', '0.5.0']);
  const released = component({
    repository: 'aikdna/fixture-swift',
    local_path: '../fixture-swift',
    source_commit: commit,
    component_version: '0.5.0',
    release_tag: '0.5.0',
    release_commit: commit,
    packages: [],
  });
  const manifestPath = writeManifest(root, [released]);

  let result = runValidator(manifestPath, root);
  assert.equal(result.status, 0, `stdout=${result.stdout}\nstderr=${result.stderr}`);

  writeManifest(root, [{ ...released, release_commit: '0'.repeat(40) }]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /component release tag mismatch|release Git evidence/u);

  const { release_tag: ignoredTag, release_commit: ignoredCommit, ...unbound } = released;
  writeManifest(root, [unbound]);
  result = runValidator(manifestPath, root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must bind its current release tag and commit/u);
});

test('validator binds every artifact path, digest, version, release tag, and release commit', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-manifest-artifact-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const assetBytes = fs.readFileSync(path.join(repoRoot, 'fixtures', 'test_protected_entry.kdna'));
  const assetHash = crypto.createHash('sha256').update(assetBytes).digest('hex');
  const currentConformanceCommit = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  ).components.find((entry) => entry.repository === 'aikdna/kdna').conformance_commit;
  const assetRoot = path.join(root, 'fixture-assets');
  const commit = initRepository(assetRoot, { 'release.kdna': assetBytes });
  git(assetRoot, ['tag', '1.0.0']);
  const artifact = {
    path: 'release.kdna',
    version: '1.0.0',
    sha256: assetHash,
    release_tag: '1.0.0',
    release_commit: commit,
    conformance_commit: currentConformanceCommit,
    kind: 'kdna-asset',
    lifecycle: 'Experimental',
    known_limitations: [],
    recommended_entrypoint: 'inspect then load',
  };
  const manifestPath = writeManifest(root, [
    component({
      repository: 'aikdna/fixture-assets',
      local_path: '../fixture-assets',
      source_commit: commit,
      conformance_commit: currentConformanceCommit,
      packages: [],
      artifacts: [artifact],
    }),
  ]);

  const valid = runValidator(manifestPath, root);
  assert.equal(valid.status, 0, `stdout=${valid.stdout}\nstderr=${valid.stderr}`);

  writeManifest(root, [
    component({
      repository: 'aikdna/fixture-assets',
      local_path: '../fixture-assets',
      source_commit: commit,
      conformance_commit: currentConformanceCommit,
      packages: [],
      artifacts: [{ ...artifact, sha256: '0'.repeat(64) }],
    }),
  ]);
  const mismatched = runValidator(manifestPath, root);
  assert.equal(mismatched.status, 1);
  assert.match(mismatched.stderr, /SHA-256 mismatch/u);

  writeManifest(root, [
    component({
      repository: 'aikdna/fixture-assets',
      local_path: '../fixture-assets',
      source_commit: commit,
      packages: [],
      artifacts: [
        {
          ...artifact,
          conformance_commit: git(repoRoot, ['rev-parse', `${currentConformanceCommit}^`]),
        },
      ],
    }),
  ]);
  const unboundConformance = runValidator(manifestPath, root);
  assert.equal(unboundConformance.status, 1);
  assert.match(unboundConformance.stderr, /artifact conformance_commit differs/u);
});
