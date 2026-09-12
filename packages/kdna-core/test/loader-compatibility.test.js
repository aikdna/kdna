'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const core = require('../src');
const compatibility = require('../src/loader-compatibility');
const packageMetadata = require('../package.json');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const SOURCE_FIXTURE = path.join(REPO_ROOT, 'examples', 'minimal');

// The release triple of the current loader package coordinate. The prerelease
// or build suffix is deliberately excluded: by the load contract only these
// three numeric components take part in a compatibility comparison.
const LOADER_NUMERIC = packageMetadata.version
  .split(/[-+]/u)[0]
  .split('.')
  .map((part) => Number(part));
const LOADER_RELEASE_TRIPLE = LOADER_NUMERIC.join('.');

function withAsset(minLoaderVersion, callback) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-loader-compatibility-'));
  try {
    const source = path.join(root, 'source');
    fs.cpSync(SOURCE_FIXTURE, source, { recursive: true });
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.compatibility.min_loader_version = minLoaderVersion;
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(
      path.join(source, 'checksums.json'),
      `${JSON.stringify(core.buildChecksums(source), null, 2)}\n`,
    );
    const assetPath = path.join(root, 'asset.kdna');
    core.pack(source, assetPath);
    callback(assetPath);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('the loader package coordinate is the current package version and may carry a suffix', () => {
  assert.equal(core.KDNA_LOADER_VERSION, packageMetadata.version);
  assert.deepEqual(
    compatibility.parseLoaderCoordinate(core.KDNA_LOADER_VERSION),
    LOADER_NUMERIC.map((part) => String(part)),
  );
  assert.deepEqual(compatibility.parseLoaderCoordinate('0.19.0'), ['0', '19', '0']);
  assert.deepEqual(core.parseLoaderVersion('0.19.0'), ['0', '19', '0']);
});

test('strict loader comparison handles lower, equal, higher, and arbitrary-size components', () => {
  assert.equal(core.compareLoaderVersions('0.18.999999999999999999999', '0.19.0'), -1);
  assert.equal(core.compareLoaderVersions('0.19.0', '0.19.0'), 0);
  assert.equal(core.compareLoaderVersions('0.19.1', '0.19.0'), 1);
  assert.equal(
    core.compareLoaderVersions('999999999999999999999.0.0', '0.19.0'),
    1,
  );
});

test('strict loader parser rejects leading zeros, prefixes, prereleases, build metadata, and whitespace', () => {
  for (const value of [
    '00.19.0',
    '0.019.0',
    '0.19.00',
    'v0.19.0',
    '0.19.0-alpha.1',
    '0.19.0+build.1',
    ' 0.19.0',
    '0.19.0 ',
    '0.19',
    '0.19.0.0',
  ]) {
    assert.equal(core.parseLoaderVersion(value), null, value);
    assert.equal(
      core.assessLoaderCompatibility({ compatibility: { min_loader_version: value } })
        .loader_compatible,
      null,
      value,
    );
  }
});

test('loader package coordinate may carry a prerelease or build suffix, its three numbers may not be lax', () => {
  assert.deepEqual(compatibility.parseLoaderCoordinate('0.24.0-rc.component-semantics.2'), ['0', '24', '0']);
  assert.deepEqual(compatibility.parseLoaderCoordinate('0.24.0+build.7'), ['0', '24', '0']);
  assert.deepEqual(compatibility.parseLoaderCoordinate('0.24.0-rc.1+build.7'), ['0', '24', '0']);
  for (const value of [
    '00.24.0-rc.1',
    '0.024.0-rc.1',
    '0.24.00-rc.1',
    'v0.24.0-rc.1',
    '0.24-rc.1',
    '0.24.0.1-rc.1',
    ' 0.24.0-rc.1',
    '0.24.0-rc.1 ',
    '0.24.0-',
    '0.24.0+',
  ]) {
    assert.equal(compatibility.parseLoaderCoordinate(value), null, value);
  }
});

test('compatibility compares the three numeric components only, so a suffix never lowers the loader', () => {
  // plain SemVer precedence would sort the prerelease below its own release and
  // make the loader fail a requirement it satisfies
  assert.equal(core.compareLoaderVersions('0.24.0', '0.24.0-rc.component-semantics.2'), 0);
  assert.equal(core.compareLoaderVersions('0.24.1', '0.24.0-rc.1'), 1);
  assert.equal(core.compareLoaderVersions('0.23.999999999999999999999', '0.24.0-rc.1'), -1);

  const satisfied = core.assessLoaderCompatibility({
    compatibility: { min_loader_version: LOADER_RELEASE_TRIPLE },
  });
  assert.equal(satisfied.loader_version, packageMetadata.version);
  assert.equal(satisfied.min_loader_version, LOADER_RELEASE_TRIPLE);
  assert.equal(satisfied.loader_compatible, true);
  const blocked = core.assessLoaderCompatibility({
    compatibility: { min_loader_version: `${LOADER_NUMERIC[0]}.${LOADER_NUMERIC[1]}.${LOADER_NUMERIC[2] + 1}` },
  });
  assert.equal(blocked.loader_compatible, false);
});

test('a suffixed min_loader_version stays a schema failure, not a compatibility result', () => {
  for (const value of [`${LOADER_RELEASE_TRIPLE}-rc.1`, `${LOADER_RELEASE_TRIPLE}+build.7`, 'v0.24.0', '00.24.0']) {
    assert.equal(core.parseLoaderVersion(value), null, value);
    const assessed = core.assessLoaderCompatibility({
      compatibility: { min_loader_version: value },
    });
    assert.equal(assessed.min_loader_version, value);
    assert.equal(assessed.loader_compatible, null, value);
  }
});

test('inspect, validate, default verify, plan, and load agree on loader compatibility', () => {
  const vectors = [
    { required: '0.18.999999999999999999999', compatible: true },
    { required: LOADER_RELEASE_TRIPLE, compatible: true },
    {
      required: `${LOADER_NUMERIC[0]}.${LOADER_NUMERIC[1]}.${LOADER_NUMERIC[2] + 1}`,
      compatible: false,
    },
    { required: '999999999999999999999.0.0', compatible: false },
  ];
  for (const vector of vectors) {
    withAsset(vector.required, (assetPath) => {
      const inspected = core.inspect(assetPath);
      assert.equal(inspected.loader_version, packageMetadata.version);
      assert.equal(inspected.min_loader_version, vector.required);
      assert.equal(inspected.loader_compatible, vector.compatible);

      const validation = core.validate(assetPath);
      assert.equal(validation.overall_valid, true, validation.problems.join('; '));
      assert.equal(validation.loader_compatible, vector.compatible);

      const reader = core.createKdnaAssetReader();
      const verification = reader.verifySync(reader.openSync(assetPath));
      assert.equal(verification.ok, vector.compatible, verification.errors.join('; '));

      const plan = core.planLoad(assetPath);
      assert.equal(plan.checks.overall_valid, true);
      assert.equal(plan.can_load_now, vector.compatible);
      if (vector.compatible) {
        assert.equal(plan.state, 'ready');
        assert.equal(core.load(assetPath).type, 'kdna.runtime-capsule');
      } else {
        assert.equal(plan.state, 'invalid');
        assert.equal(plan.required_action, 'block');
        assert.deepEqual(plan.issues.map((issue) => issue.code), [
          'KDNA_LOADER_VERSION_UNSUPPORTED',
        ]);
        assert.ok(
          verification.errors.some((message) =>
            message.startsWith('KDNA_LOADER_VERSION_UNSUPPORTED:'),
          ),
        );
        assert.throws(
          () => core.load(assetPath),
          (error) => error.code === 'KDNA_LOADER_VERSION_UNSUPPORTED',
        );
      }
    });
  }
});

test('malformed loader requirements remain schema failures, not compatibility failures', () => {
  for (const required of ['01.0.0', '0.19.0-alpha', '0.19.0+build']) {
    withAsset(required, (assetPath) => {
      const inspected = core.inspect(assetPath);
      assert.equal(inspected.loader_compatible, null);

      const validation = core.validate(assetPath);
      assert.equal(validation.schema_valid, false);
      assert.equal(validation.overall_valid, false);
      assert.equal(validation.loader_compatible, null);

      const reader = core.createKdnaAssetReader();
      assert.equal(reader.verifySync(reader.openSync(assetPath)).ok, false);

      const plan = core.planLoad(assetPath);
      assert.equal(plan.checks.schema_valid, false);
      assert.equal(plan.can_load_now, false);
      assert.ok(plan.issues.some((issue) => issue.code === 'KDNA_FORMAT_INVALID'));
      assert.ok(!plan.issues.some((issue) => issue.code === 'KDNA_LOADER_VERSION_UNSUPPORTED'));
      assert.throws(
        () => core.load(assetPath),
        (error) => error.code === 'KDNA_FORMAT_INVALID',
      );
    });
  }
});
