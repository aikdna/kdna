const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv/dist/2020.js');
const addFormats = require('ajv-formats');

const repoRoot = path.resolve(__dirname, '..', '..');
const manifestSchema = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'schema', 'manifest.schema.json'), 'utf8'),
);
const loadContractSchema = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'schema', 'load-contract.schema.json'), 'utf8'),
);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajv.addSchema(loadContractSchema, 'load-contract.schema.json');
const validateManifest = ajv.compile(manifestSchema);

function runtimeManifest(overrides = {}) {
  return {
    format_version: '0.1.0',
    asset_id: 'kdna:example:code-review',
    asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    asset_type: 'domain',
    title: 'Code Review',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    compatibility: {
      min_loader_version: '0.17.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
    language: 'en',
    ...overrides,
  };
}

test('authoritative Runtime manifest schema accepts language and omitted creator provenance', () => {
  const manifest = runtimeManifest();
  assert.equal(validateManifest(manifest), true, JSON.stringify(validateManifest.errors, null, 2));
});

test('authoritative Runtime manifest schema rejects an explicitly empty creator name', () => {
  const manifest = runtimeManifest({ creator: { name: '' } });
  assert.equal(validateManifest(manifest), false);
  assert.ok(
    validateManifest.errors.some((error) => error.instancePath === '/creator/name'),
    JSON.stringify(validateManifest.errors, null, 2),
  );
});

test('authoritative Runtime manifest schema closes the licensed entitlement contract', () => {
  for (const profile of ['password', 'local_receipt', 'account', 'org']) {
    const manifest = runtimeManifest({
      access: 'licensed',
      entitlement: { profile, offline: profile !== 'account', revocable: profile !== 'password' },
    });
    assert.equal(
      validateManifest(manifest),
      true,
      `${profile}: ${JSON.stringify(validateManifest.errors, null, 2)}`,
    );
  }

  assert.equal(validateManifest(runtimeManifest({ access: 'licensed' })), false);
  assert.equal(
    validateManifest(
      runtimeManifest({
        access: 'licensed',
        entitlement: { profile: 'coupon_code' },
      }),
    ),
    false,
  );
  assert.equal(
    validateManifest(
      runtimeManifest({
        access: 'public',
        entitlement: { profile: 'password' },
      }),
    ),
    false,
  );
});

test('authoritative Runtime manifest schema rejects intrinsic assessment fields', async (t) => {
  for (const field of [
    'quality_badge',
    'risk_level',
    'trusted',
    'recommended',
    'high_quality',
    'expert_reviewed',
    'production_ready',
    'officially_approved',
  ]) {
    await t.test(field, () => {
      const manifest = runtimeManifest({ [field]: field === 'risk_level' ? 'R0' : true });
      assert.equal(validateManifest(manifest), false);
      assert.ok(
        validateManifest.errors.some((error) => error.instancePath === `/${field}`),
        JSON.stringify(validateManifest.errors, null, 2),
      );
    });
  }
});

test('legacy source manifest dialect is not accepted as a Runtime manifest', () => {
  const manifest = {
    kdna_version: '1.0',
    name: '@example/code_review',
    version: '1.0.0',
    judgment_version: '1.0.0',
    description: 'Legacy authoring source manifest.',
    author: { name: 'Example', id: 'example' },
    license: { type: 'CC-BY-4.0' },
    status: 'experimental',
    quality_badge: 'untested',
    access: 'public',
    languages: ['en'],
    default_language: 'en',
  };
  assert.equal(validateManifest(manifest), false);
  assert.ok(
    validateManifest.errors.some((error) => error.keyword === 'required'),
    JSON.stringify(validateManifest.errors, null, 2),
  );
});
