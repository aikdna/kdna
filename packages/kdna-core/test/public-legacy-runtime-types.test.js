'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { installPackedCoreOffline, runTsc, REPO_ROOT } = require('./package-test-helpers');
const container = require('../src/container');

function consumerSource() {
  return [
    "import { admitBytes } from '@aikdna/kdna-core';",
    "import { loadRemoteRuntimeAsset, type KDNARemoteRuntimeInput } from '@aikdna/kdna-core/remote-runtime';",
    'declare const input: KDNARemoteRuntimeInput;',
    'const capsule = loadRemoteRuntimeAsset(input);',
    "const type: 'kdna.runtime-capsule' = capsule.type;",
    "const version: '0.1.0' = capsule.contract_version;",
    "const digestProfile: 'kdna.digest-evidence' = capsule.digests.profile;",
    "const comparison: 'matched' | 'mismatched' | 'not_compared' | 'unavailable' = capsule.digests.content.comparison.state;",
    "const runtimeEligible: true = capsule.trace.runtime_eligible;",
    "if (capsule.signature.state === 'verified') { const fingerprint: string = capsule.signature.key_fingerprint; console.log(fingerprint); }",
    '// @ts-expect-error remote callers cannot pass projection policy options',
    "loadRemoteRuntimeAsset(input, { profile: 'compact' });",
    '// @ts-expect-error a legacy capsule is not an execution 0.2 capsule',
    "const wrongVersion: '0.2.0' = capsule.contract_version;",
    '// @ts-expect-error the current public root does not export the legacy capsule',
    "import type { KDNARuntimeCapsule } from '@aikdna/kdna-core';",
    '// @ts-expect-error the current public root does not restore old execution APIs',
    "import { parseRuntimeContractJson } from '@aikdna/kdna-core';",
    'console.log(admitBytes(new Uint8Array()).status, type, version, digestProfile, comparison, runtimeEligible);',
  ].join('\n');
}

function compile(checkPath, cwd) {
  return runTsc([
    '--noEmit', '--strict', '--moduleResolution', 'node16', '--module', 'node16',
    '--target', 'es2022', checkPath,
  ], { cwd, stdio: 'pipe', env: { ...process.env, NODE_OPTIONS: '' } });
}

test('offline packed remote-runtime has a complete type closure and preserves its legacy runtime boundary', { timeout: 120000 }, () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-public-remote-types-'));
  try {
    installPackedCoreOffline(temporary);
    const packedRoot = path.join(temporary, 'node_modules/@aikdna/kdna-core');
    const legacyTypes = path.join(packedRoot, 'src/legacy-runtime-types.d.ts');
    assert.equal(fs.existsSync(legacyTypes), true);
    assert.equal(fs.existsSync(path.join(packedRoot, 'src/types.d.ts')), false);
    assert.equal(fs.realpathSync(legacyTypes), path.join(fs.realpathSync(temporary), 'node_modules/@aikdna/kdna-core/src/legacy-runtime-types.d.ts'));

    const source = path.join(temporary, 'remote-source');
    fs.cpSync(path.join(REPO_ROOT, 'examples/minimal'), source, { recursive: true });
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.access = 'remote';
    delete manifest.dependencies;
    delete manifest.extends;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    fs.writeFileSync(path.join(source, 'checksums.json'), JSON.stringify(container.buildChecksums(source)));
    container.pack(source, path.join(temporary, 'remote.kdna'));
    execFileSync(process.execPath, ['-e', [
      "const assert = require('node:assert/strict');",
      "const fs = require('node:fs');",
      "const core = require('@aikdna/kdna-core');",
      "const remote = require('@aikdna/kdna-core/remote-runtime');",
      "assert.equal(typeof core.admitBytes, 'function');",
      "assert.equal(core.parseRuntimeContractJson, undefined);",
      "assert.equal(core.loadRemoteRuntimeAsset, undefined);",
      "for (const input of ['remote.kdna', new Uint8Array(fs.readFileSync('remote.kdna'))]) {",
      '  const capsule = remote.loadRemoteRuntimeAsset(input);',
      "  assert.equal(capsule.contract_version, '0.1.0');",
      "  assert.equal(capsule.access, 'remote');",
      "  assert.equal(capsule.profile, 'full');",
      "  assert.equal(capsule.context.manifest.format_version, '0.1.0');",
      '}',
      "import('@aikdna/kdna-core/remote-runtime').then(esm => {",
      "  assert.deepEqual(Object.keys(esm).filter(name => name !== 'default'), ['loadRemoteRuntimeAsset']);",
      '  assert.equal(esm.loadRemoteRuntimeAsset, remote.loadRemoteRuntimeAsset);',
      '}).catch(error => { console.error(error); process.exitCode = 1; });',
    ].join('\n')], { cwd: temporary, stdio: 'pipe', env: { ...process.env, NODE_OPTIONS: '' } });

    for (const extension of ['ts', 'mts']) {
      const checkPath = path.join(temporary, 'check.' + extension);
      fs.writeFileSync(checkPath, consumerSource());
      compile(checkPath, temporary);
    }
    // A deliberate missing-member control proves the compiler is using this
    // installed package's closure, not the development source tree's types.
    const savedTypes = fs.readFileSync(legacyTypes);
    fs.unlinkSync(legacyTypes);
    try {
      assert.throws(() => compile(path.join(temporary, 'check.ts'), temporary), error => {
        assert.equal(error.status, 2);
        assert.match(String(error.stdout), /TS2307.*legacy-runtime-types/);
        return true;
      });
    } finally {
      fs.writeFileSync(legacyTypes, savedTypes);
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
