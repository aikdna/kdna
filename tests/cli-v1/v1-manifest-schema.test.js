const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv/dist/2020.js');
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..', '..');
const manifestSchema = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'schema', 'kdna-manifest.json'), 'utf8'),
);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateManifest = ajv.compile(manifestSchema);

function trustedManifest(overrides = {}) {
  const { authoring: authoringOverrides = {}, creator: creatorOverrides = {}, ...rest } = overrides;
  return {
    format: 'kdna',
    format_version: '2.0',
    spec_version: '2.0',
    name: '@example/code_review',
    version: '0.1.0',
    judgment_version: '2026.06',
    description: 'Review code behavior and regression risk before style preferences.',
    author: {
      name: 'Example',
      id: 'example',
      pubkey: `ed25519:${'a'.repeat(64)}`,
    },
    creator: {
      creator_id: 'kdna:creator:agent:example',
      creator_type: 'agent',
      display_name: 'Example Agent',
      verified: false,
      ...creatorOverrides,
    },
    license: { type: 'CC-BY-4.0' },
    status: 'experimental',
    quality_badge: 'tested',
    access: 'public',
    languages: ['en'],
    default_language: 'en',
    signature: `ed25519:${'b'.repeat(128)}`,
    authoring: {
      created_by: 'independent-example-exporter',
      compiler: '@example/kdna-exporter',
      compiler_version: '1.0.0',
      compiled_at: '2026-06-20T00:00:00.000Z',
      conformance: {
        passed: true,
        spec_version: '2.0',
        validator: '@aikdna/kdna-conformance',
      },
      human_confirmed: true,
      human_lock_count: 1,
      ...authoringOverrides,
    },
    ...rest,
  };
}

test('manifest schema accepts non-whitelisted authoring source with conformance evidence', () => {
  const manifest = trustedManifest();
  assert.equal(validateManifest(manifest), true, JSON.stringify(validateManifest.errors, null, 2));
});

test('manifest schema rejects trusted quality claims without conformance evidence', () => {
  const manifest = trustedManifest({ authoring: { conformance: undefined } });
  assert.equal(validateManifest(manifest), false);
  assert.ok(
    validateManifest.errors.some((error) => error.instancePath.includes('/authoring')),
    JSON.stringify(validateManifest.errors, null, 2),
  );
});
