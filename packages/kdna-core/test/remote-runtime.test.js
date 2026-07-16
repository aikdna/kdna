'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const core = require('../src');
const container = require('../src/container');
const remoteRuntime = require('../src/remote-runtime');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const PACKAGE_ROOT = path.resolve(__dirname, '..');
const MINIMAL_SOURCE = path.join(REPO_ROOT, 'examples', 'minimal');

function updateManifest(source, update) {
  const manifestPath = path.join(source, 'kdna.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  update(manifest);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function withAsset({
  access = 'remote',
  mutateManifest,
  mutateAfterChecksums,
} = {}) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-remote-runtime-'));
  const source = path.join(temporary, 'source');
  const assetPath = path.join(temporary, 'asset.kdna');
  fs.cpSync(MINIMAL_SOURCE, source, { recursive: true });
  updateManifest(source, (manifest) => {
    manifest.asset_id = `kdna:test:remote-runtime-${access}`;
    manifest.title = `Remote Runtime ${access} fixture`;
    manifest.access = access;
    delete manifest.dependencies;
    delete manifest.extends;
    if (mutateManifest) mutateManifest(manifest);
  });
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    `${JSON.stringify(container.buildChecksums(source), null, 2)}\n`,
  );
  if (mutateAfterChecksums) mutateAfterChecksums(source);
  container.pack(source, assetPath);
  return {
    temporary,
    source,
    assetPath,
    cleanup() {
      fs.rmSync(temporary, { recursive: true, force: true });
    },
  };
}

function assertCode(code) {
  return (error) => error && error.code === code;
}

test('remote Runtime is an explicit package subpath and not a consumer root export', async () => {
  const packageManifest = require('../package.json');
  assert.deepEqual(packageManifest.exports['./remote-runtime'], {
    import: './src/remote-runtime.mjs',
    require: './src/remote-runtime.js',
    types: './src/remote-runtime.d.ts',
  });

  const cjs = require('@aikdna/kdna-core/remote-runtime');
  const esm = await import('@aikdna/kdna-core/remote-runtime');
  assert.deepEqual(Object.keys(cjs), ['loadRemoteRuntimeAsset']);
  assert.deepEqual(
    Object.keys(esm).filter((name) => name !== 'default'),
    ['loadRemoteRuntimeAsset'],
  );
  assert.strictEqual(cjs.loadRemoteRuntimeAsset, remoteRuntime.loadRemoteRuntimeAsset);
  assert.strictEqual(esm.loadRemoteRuntimeAsset, remoteRuntime.loadRemoteRuntimeAsset);

  assert.equal(core.loadRemoteRuntimeAsset, undefined);
  assert.equal(core.loadRemoteRuntimeAssetForServer, undefined);
  assert.equal(core.loadAssetUnsafe, undefined);
  assert.equal(container.loadAssetUnsafe, undefined);
  assert.equal(Object.keys(container).includes('loadRemoteRuntimeAssetForServer'), false);
  assert.throws(
    () => require('@aikdna/kdna-core/src/container/index.js'),
    (error) => error && error.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  );
});

test('remote Runtime subpath types expose one packaged input and no policy options', () => {
  const temporary = fs.mkdtempSync(path.join(PACKAGE_ROOT, 'test', 'tmp-remote-runtime-types-'));
  try {
    const checkPath = path.join(temporary, 'check.ts');
    fs.writeFileSync(
      checkPath,
      [
        "import { loadRemoteRuntimeAsset, KDNARemoteRuntimeInput } from '@aikdna/kdna-core/remote-runtime';",
        "import type { KDNARuntimeCapsule } from '@aikdna/kdna-core';",
        'declare const input: KDNARemoteRuntimeInput;',
        'const capsule: KDNARuntimeCapsule = loadRemoteRuntimeAsset(input);',
        '// @ts-expect-error Remote Runtime callers cannot override projection policy',
        "loadRemoteRuntimeAsset(input, { profile: 'compact', as: 'prompt' });",
        'console.log(capsule);',
      ].join('\n'),
    );
    execFileSync(process.execPath, [
      require.resolve('typescript/lib/tsc.js'),
      '--noEmit',
      '--strict',
      '--moduleResolution',
      'node16',
      '--module',
      'node16',
      '--target',
      'es2022',
      checkPath,
    ], { stdio: 'pipe' });
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('server-side loader emits one full remote Runtime Capsule from path and bytes', () => {
  const fixture = withAsset();
  try {
    const bytes = fs.readFileSync(fixture.assetPath);
    for (const input of [fixture.assetPath, bytes, new Uint8Array(bytes)]) {
      const capsule = remoteRuntime.loadRemoteRuntimeAsset(input);
      assert.equal(capsule.type, 'kdna.runtime-capsule');
      assert.equal(capsule.contract_version, '0.1.0');
      assert.equal(capsule.asset.asset_id, 'kdna:test:remote-runtime-remote');
      assert.equal(capsule.access, 'remote');
      assert.equal(capsule.profile, 'full');
      assert.equal(capsule.trace.profile, 'full');
      assert.equal(capsule.context.manifest.access, 'remote');
      assert.equal(capsule.context.manifest.asset_id, capsule.asset.asset_id);
      assert.equal(capsule.context.payload.profile, 'kdna.payload.judgment');
      assert.equal(capsule.trace.input_kind, typeof input === 'string' ? 'packaged_file' : 'packaged_bytes');
    }
  } finally {
    fixture.cleanup();
  }
});

test('server-side path authorization and projection use one immutable byte snapshot', () => {
  const remote = withAsset();
  const publicAsset = withAsset({ access: 'public' });
  const originalReadFile = fs.readFileSync;
  const remoteBytes = originalReadFile(remote.assetPath);
  const publicBytes = originalReadFile(publicAsset.assetPath);
  let reads = 0;
  fs.readFileSync = function mutateAfterSnapshot(file, ...args) {
    const bytes = originalReadFile.call(this, file, ...args);
    if (path.resolve(String(file)) === path.resolve(remote.assetPath)) {
      reads += 1;
      if (reads === 1) fs.writeFileSync(remote.assetPath, publicBytes);
    }
    return bytes;
  };
  try {
    const capsule = remoteRuntime.loadRemoteRuntimeAsset(remote.assetPath);
    assert.equal(capsule.asset.asset_id, 'kdna:test:remote-runtime-remote');
    assert.equal(capsule.access, 'remote');
    assert.equal(reads, 1);
    assert.equal(
      capsule.digests.asset.value,
      core.computeDigestEvidence(remoteBytes).asset.value,
    );
  } finally {
    fs.readFileSync = originalReadFile;
    remote.cleanup();
    publicAsset.cleanup();
  }
});

test('ordinary consumer loaders continue to deny remote assets', () => {
  const fixture = withAsset();
  try {
    const bytes = fs.readFileSync(fixture.assetPath);
    const loaders = [
      ['loadAuthorized', core.loadAuthorized],
      ['load', core.load],
      ['loadAsset', core.loadAsset],
      ['loadRuntimeCapsule', core.loadRuntimeCapsule],
    ];
    for (const input of [fixture.assetPath, bytes]) {
      for (const [name, load] of loaders) {
        assert.throws(
          () => load(input, { profile: 'full', as: 'json' }),
          (error) => {
            assert.equal(error.code, 'KDNA_AUTH_REMOTE_RUNTIME_REQUIRED', name);
            assert.equal(error.plan.state, 'needs_runtime', name);
            assert.equal(error.plan.required_action, 'connect_runtime', name);
            assert.equal(error.plan.can_load_now, false, name);
            return true;
          },
        );
      }
    }
  } finally {
    fixture.cleanup();
  }
});

test('remote Runtime callers cannot override access, profile, or output shape', () => {
  const fixture = withAsset();
  try {
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(fixture.assetPath, {
        access: 'public',
        profile: 'compact',
        as: 'prompt',
      }),
      assertCode('KDNA_REMOTE_RUNTIME_OPTIONS_FORBIDDEN'),
    );
    const capsule = remoteRuntime.loadRemoteRuntimeAsset(fixture.assetPath);
    assert.equal(capsule.access, 'remote');
    assert.equal(capsule.profile, 'full');
    assert.equal(typeof capsule.context, 'object');
  } finally {
    fixture.cleanup();
  }
});

test('remote Runtime loader rejects non-remote, source, invalid, and incompatible inputs', () => {
  const remote = withAsset();
  const publicAsset = withAsset({ access: 'public' });
  const licensed = withAsset({
    access: 'licensed',
    mutateManifest(manifest) {
      manifest.entitlement = { profile: 'local_receipt', offline: true, revocable: true };
    },
  });
  const badChecksum = withAsset({
    mutateAfterChecksums(source) {
      updateManifest(source, (manifest) => {
        manifest.description = 'changed after checksums';
      });
    },
  });
  const incompatible = withAsset({
    mutateManifest(manifest) {
      manifest.compatibility.min_loader_version = '99.0.0';
    },
  });
  try {
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(publicAsset.assetPath),
      assertCode('KDNA_REMOTE_RUNTIME_ACCESS_REQUIRED'),
    );
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(licensed.assetPath),
      assertCode('KDNA_REMOTE_RUNTIME_ACCESS_REQUIRED'),
    );
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(remote.source),
      assertCode('KDNA_ASSET_FILE_REQUIRED'),
    );
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(Buffer.from('not a KDNA asset')),
      assertCode('KDNA_FORMAT_INVALID'),
    );
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(badChecksum.assetPath),
      assertCode('KDNA_INTEGRITY_DIGEST_FAILED'),
    );
    assert.throws(
      () => remoteRuntime.loadRemoteRuntimeAsset(incompatible.assetPath),
      assertCode('KDNA_LOADER_VERSION_UNSUPPORTED'),
    );
  } finally {
    remote.cleanup();
    publicAsset.cleanup();
    licensed.cleanup();
    badChecksum.cleanup();
    incompatible.cleanup();
  }
});

test('remote Runtime loader rejects dependencies and extends until authorization is defined', () => {
  const dependency = withAsset({
    mutateManifest(manifest) {
      manifest.dependencies = { '@test/dependency': '^1.0.0' };
    },
  });
  const inheritance = withAsset({
    mutateManifest(manifest) {
      manifest.extends = '@test/base@^1.0.0';
    },
  });
  try {
    for (const assetPath of [dependency.assetPath, inheritance.assetPath]) {
      assert.throws(
        () => remoteRuntime.loadRemoteRuntimeAsset(assetPath),
        (error) => {
          assert.equal(error.code, 'KDNA_REMOTE_RUNTIME_COMPOSITION_UNSUPPORTED');
          assert.equal(error.plan.state, 'invalid');
          assert.equal(error.plan.required_action, 'block');
          assert.equal(error.plan.can_load_now, false);
          return true;
        },
      );
    }
  } finally {
    dependency.cleanup();
    inheritance.cleanup();
  }
});
