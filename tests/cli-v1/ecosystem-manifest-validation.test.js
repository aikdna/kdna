'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const validator = path.join(repoRoot, 'scripts', 'validate-ecosystem-manifest.js');

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
