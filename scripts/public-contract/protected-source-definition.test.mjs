import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const require = createRequire(import.meta.url);
const source = load('specs/public-semantic-source.json');
const module = source.protected_source;
const sha = (value) => 'sha256:' + crypto.createHash('sha256').update(value).digest('hex');
const ordered = (v) =>
  Array.isArray(v)
    ? v.map(ordered)
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, ordered(v[k])]),
        )
      : v;

// L16 / L01: preserve the independent module and callable boundary. RC7 is a
// named binding successor; the original additive source snapshot remains historical.
test('the protected-source definition is an independent additive module', () => {
  assert.equal(module.id, 'kdna.protected-source/1');
  assert.equal(module.version, '1.0.0');
  assert.equal(module.schema_path, 'specs/protected-source-r2-binding-7.schema.json');
  assert.equal(module.schema_id, 'urn:kdna:schema:protected-source:1.0.0:binding:r2:7');
  assert.equal(module.root, 'ProtectedSourceObservation');
  assert.deepEqual(module.runtime_exports, [
    'Core/protected-source-node:getProtectedSourceContract',
    'Core/protected-source-node:createTrustedProtectedSourceHost',
    'Core/protected-source-node:withProtectedSourceNode',
    'Core/protected-source-node:commitProtectedSourceTransport',
    'Core/protected-source-node:previewProtectedSourceRevision',
    'Core/protected-source-node:produceProtectedSourceRevision',
  ]);
  // The protection module keeps its exact nine-entry callable surface.
  assert.equal(source.protection_admission.runtime_exports.length, 9);
  assert.equal(source.protection_admission.status, 'B1_IMPLEMENTATION_CANDIDATE_NOT_ACCEPTED');
  // No source type may collide with a base or protection type.
  for (const name of Object.keys(module.types)) {
    assert.match(name, /^(?:ProtectedSource|Source)[A-Za-z0-9_]*$/);
    assert.equal(Object.hasOwn(source.types, name), false, name);
    assert.equal(Object.hasOwn(source.protection_admission.types, name), false, name);
  }
  assert.equal(source.engineering.package_versions.core, '0.36.0-rc.r2.7');
  assert.equal(source.engineering.package_versions.read, '0.11.0-rc.r2.7');
});

test('the packed module exposes exactly the declared callables in CJS and ESM', async () => {
  const cjs = require('@aikdna/kdna-core/protected-source-node');
  const esm = await import('@aikdna/kdna-core/protected-source-node');
  const names = module.runtime_exports.map((x) => x.split(':')[1]).sort();
  assert.deepEqual(Object.keys(cjs).sort(), names);
  assert.deepEqual(
    Object.keys(esm)
      .filter((k) => k !== 'default')
      .sort(),
    names,
  );
  for (const name of names) assert.equal(typeof esm[name], 'function', name);
  const descriptor = cjs.getProtectedSourceContract();
  assert.equal(
    descriptor.contract.definition_digest,
    'sha256:' +
      crypto
        .createHash('sha256')
        .update(JSON.stringify(ordered(module)))
        .digest('hex'),
  );
  assert.equal(
    descriptor.contract.definition_digest,
    load('packages/kdna-core/src/public-contract/protected-source-contract.generated.json')
      .definition_digest,
  );
});

test('every declared arm is closed and validated by the generated validator', () => {
  const schema = load(module.schema_path);
  assert.equal(schema.$id, module.schema_id);
  const defs = schema.$defs;
  const closed = (name) => {
    const node = defs[name];
    assert.ok(node, name);
    if (node.type === 'object')
      assert.equal(node.additionalProperties, false, name + ' must be closed');
    for (const child of Object.values(node.properties ?? {})) {
      if (child.type === 'object')
        assert.equal(child.additionalProperties, false, name + ' nested must be closed');
    }
  };
  for (const name of [
    'SourceFailed',
    'ProtectedSourceDelivered',
    'ProtectedSourceCatalog',
    'SourceCoreRejected',
    'SourceHostObservation',
    'SourcePreviewValid',
    'SourcePreviewRejected',
    'SourceDiagnostic',
    'SourceCapability',
    'SourcePreviewValidation',
  ])
    closed(name);
  const validator = require(
    path.join(root, 'packages/kdna-core/src/public-contract/source-validators.generated.js'),
  );
  // A conforming delivered arm validates; the same arm with an extra field does not.
  const digest = 'sha256:' + 'a'.repeat(64);
  const delivered = {
    status: 'source_delivered',
    receipt: {
      contract: { id: 'kdna.protection-admission/1', version: '1.0.0', definition_digest: digest },
      operation_id: 'synthetic:observation',
      A: digest,
      C: digest,
      E: digest,
      entry: 'payload.kdnab',
      encryption: null,
      plaintext_digest: null,
      integrity: { checksums: 'absent', signature: 'absent', signature_content_digest: null },
      authorization: { kind: 'none' },
      checked_at_ms: 1,
      proof: 'observation_not_authority',
    },
    disclosure: { kind: 'none', external_commit: { state: 'not_invoked' } },
    source_identity: { A: digest, C: digest, E: digest },
    body: null,
    body_bytes: 0,
  };
  assert.equal(validator.ProtectedSourceObservation(delivered), true);
  assert.equal(validator.ProtectedSourceObservation({ ...delivered, leaked: 'content' }), false);
  const failed = {
    status: 'source_failed',
    diagnostic: { code: 'SOURCE_INPUT_INVALID', stage: 'input' },
    disclosure: delivered.disclosure,
    body: null,
    body_bytes: 0,
  };
  assert.equal(validator.ProtectedSourceObservation(failed), true);
  assert.equal(
    validator.ProtectedSourceObservation({
      ...failed,
      diagnostic: { code: 'SOURCE_INPUT_INVALID', stage: 'input', detail: {} },
    }),
    false,
  );
  const host = {
    context_id: 'context:one',
    epoch: 'epoch:one',
    asset_digest: digest,
    permission: 'allowed',
    scope: 'complete_source',
    current_ms: 1000,
    expires_at_ms: 2000,
    revoked: false,
  };
  assert.equal(validator.SourceHostObservation(host), true);
  assert.equal(validator.SourceHostObservation({ ...host, scope: 'projection' }), false);
  const preview = {
    status: 'preview_valid',
    validation: {
      contract: { id: 'kdna.protection-admission/1', version: '1.0.0', definition_digest: digest },
      implementation: { name: '@aikdna/kdna-core', version: '0.36.0-rc.r2.7' },
      source_A: digest,
      original_payload_digest: digest,
      edits_digest: digest,
      policy_digest: digest,
      semantic_status: 'valid',
      proof: 'semantic_validation_not_ciphertext_admission',
    },
    body: null,
    body_bytes: 0,
  };
  assert.equal(validator.ProtectedSourceRevisionPreviewResult(preview), true);
  const oldPreview = structuredClone(preview);
  oldPreview.validation.implementation.version = '0.35.0-rc.source.1';
  assert.equal(
    validator.ProtectedSourceRevisionPreviewResult(oldPreview),
    false,
    'Old package metadata cannot enter current binding',
  );
  assert.equal(
    validator.ProtectedSourceRevisionPreviewResult({ ...preview, body: 'plaintext' }),
    false,
  );
  assert.equal(
    validator.ProtectedSourceObservation({
      status: 'catalog_only',
      receipt: delivered.receipt,
      disclosure: delivered.disclosure,
      body: null,
      body_bytes: 0,
    }),
    false,
    'Current result union cannot promote historical catalog-only shape',
  );
});
