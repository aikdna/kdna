'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const validator = path.join(repoRoot, 'scripts', 'validate-ecosystem-manifest.js');

function liveComponent(overrides = {}) {
  return {
    repository: 'aikdna/fixture-package',
    local_path: '../fixture-package',
    npm_package: '@aikdna/fixture-package',
    package_json: '../fixture-package/package.json',
    current_version: '1.0.0',
    lifecycle: 'Beta',
    supported_kdna_version: '1.0',
    supported_access_modes: [],
    supported_entitlement_profiles: [],
    conformance_commit: '0'.repeat(40),
    known_limitations: [],
    recommended_entrypoint: null,
    legacy_replacement: null,
    ...overrides,
  };
}

function writeManifest(root, component) {
  const manifestPath = path.join(root, 'ecosystem-manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({
      lifecycle_terms: ['Stable', 'Beta', 'Experimental', 'Legacy', 'Removed'],
      components: [component],
    }),
  );
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

test('ecosystem manifest does not claim the nonexistent kdna-releases repository', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  assert.equal(
    manifest.components.some((component) => component.repository === 'aikdna/kdna-releases'),
    false,
  );
});

test('ecosystem validator fails closed for a live repo without package, artifact, or checkout', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-ecosystem-manifest-'));
  try {
    const manifestPath = path.join(tmp, 'ecosystem-manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        lifecycle_terms: ['Stable', 'Beta', 'Experimental', 'Legacy', 'Removed'],
        components: [
          {
            repository: 'aikdna/does-not-exist',
            local_path: '../does-not-exist',
            npm_package: null,
            package_json: null,
            current_version: null,
            lifecycle: 'Beta',
            supported_kdna_version: '1.0',
            supported_access_modes: [],
            supported_entitlement_profiles: [],
            conformance_commit: null,
            known_limitations: [],
            recommended_entrypoint: null,
            legacy_replacement: null,
          },
        ],
      }),
    );

    const result = spawnSync(process.execPath, [validator], {
      encoding: 'utf8',
      env: { ...process.env, KDNA_ECOSYSTEM_MANIFEST_PATH: manifestPath },
    });
    assert.equal(result.status, 1, `stdout=${result.stdout}\nstderr=${result.stderr}`);
    assert.match(result.stderr, /repository checkout is unavailable/);
    assert.doesNotMatch(result.stdout, /validation passed/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ecosystem validator rejects unavailable or unreadable live package evidence', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-live-package-evidence-'));
  try {
    const missing = writeManifest(
      tmp,
      liveComponent({
        repository: 'aikdna/definitely-missing-package-proof',
        local_path: '../definitely-missing-package-proof',
        package_json: '../definitely-missing-package-proof/package.json',
      }),
    );
    const missingResult = runValidator(missing, tmp);
    assert.equal(missingResult.status, 1);
    assert.match(missingResult.stderr, /live package evidence is unavailable/u);

    const brokenRoot = path.join(tmp, 'broken-package-proof');
    fs.mkdirSync(brokenRoot);
    fs.writeFileSync(path.join(brokenRoot, 'package.json'), '{not-json');
    const broken = writeManifest(
      tmp,
      liveComponent({
        repository: 'aikdna/broken-package-proof',
        local_path: '../broken-package-proof',
        package_json: '../broken-package-proof/package.json',
      }),
    );
    const brokenResult = runValidator(broken, tmp);
    assert.equal(brokenResult.status, 1);
    assert.match(brokenResult.stderr, /package evidence is unreadable/u);
    assert.doesNotMatch(brokenResult.stdout, /validation passed/u);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ecosystem validator binds every external live package checkout to its manifest commit', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-live-package-commit-'));
  try {
    const packageRoot = path.join(tmp, 'fixture-package');
    fs.mkdirSync(packageRoot);
    fs.writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }),
    );
    for (const args of [
      ['init'],
      ['config', 'user.name', 'KDNA Test'],
      ['config', 'user.email', 'test@invalid.example'],
      ['add', 'package.json'],
      ['commit', '-m', 'fixture'],
    ]) {
      const result = spawnSync('git', args, { cwd: packageRoot, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }

    const manifestPath = writeManifest(tmp, liveComponent());
    const result = runValidator(manifestPath, tmp);
    assert.equal(result.status, 1, `stdout=${result.stdout}\nstderr=${result.stderr}`);
    assert.match(result.stderr, /checkout commit mismatch/u);
    assert.doesNotMatch(result.stdout, /validation passed/u);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ecosystem validator accepts only the exact clean package repository root', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-live-package-clean-root-'));
  try {
    const packageRoot = path.join(tmp, 'fixture-package');
    fs.mkdirSync(packageRoot);
    fs.writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }),
    );
    for (const args of [
      ['init'],
      ['config', 'user.name', 'KDNA Test'],
      ['config', 'user.email', 'test@invalid.example'],
      ['add', 'package.json'],
      ['commit', '-m', 'fixture'],
    ]) {
      const result = spawnSync('git', args, { cwd: packageRoot, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    const commit = spawnSync('git', ['rev-parse', 'HEAD'], {
      cwd: packageRoot,
      encoding: 'utf8',
    }).stdout.trim();
    const manifestPath = writeManifest(tmp, liveComponent({ conformance_commit: commit }));

    const clean = runValidator(manifestPath, tmp);
    assert.equal(clean.status, 0, `stdout=${clean.stdout}\nstderr=${clean.stderr}`);
    assert.match(clean.stdout, /validation passed/u);

    fs.writeFileSync(path.join(packageRoot, 'untracked.txt'), 'dirty');
    const dirty = runValidator(manifestPath, tmp);
    assert.equal(dirty.status, 1, `stdout=${dirty.stdout}\nstderr=${dirty.stderr}`);
    assert.match(dirty.stderr, /checkout is dirty/u);
    assert.doesNotMatch(dirty.stdout, /validation passed/u);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('ecosystem validator rejects a package directory nested in some other repository', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-live-package-nested-root-'));
  try {
    for (const args of [
      ['init'],
      ['config', 'user.name', 'KDNA Test'],
      ['config', 'user.email', 'test@invalid.example'],
    ]) {
      const result = spawnSync('git', args, { cwd: tmp, encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
    }
    const packageRoot = path.join(tmp, 'fixture-package');
    fs.mkdirSync(packageRoot);
    fs.writeFileSync(
      path.join(packageRoot, 'package.json'),
      JSON.stringify({ name: '@aikdna/fixture-package', version: '1.0.0' }),
    );
    const manifestPath = writeManifest(tmp, liveComponent());
    const result = runValidator(manifestPath, tmp);
    assert.equal(result.status, 1, `stdout=${result.stdout}\nstderr=${result.stderr}`);
    assert.match(result.stderr, /not a repository root/u);
    assert.doesNotMatch(result.stdout, /validation passed/u);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
