'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const cbor = require('cbor-x');

const core = require('../src');
const container = require('../src/container');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const generator = path.join(repoRoot, 'scripts', 'generate-container-negative-fixtures.mjs');
const licenseKey = 'KDNA-TEST-LICENSE-VECTOR-2026';

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function generatedHashes(root) {
  return [
    'fixtures/container/invalid-bad-checksum/checksums.json',
    'fixtures/container/invalid-bad-checksum/payload.kdnab',
    'fixtures/container/invalid-missing-manifest/payload.kdnab',
    'fixtures/test_licensed_entry.kdna',
  ].map((relativePath) => [relativePath, sha256(path.join(root, relativePath))]);
}

function validationChecks(validation) {
  return {
    format_valid: validation.format_valid,
    schema_valid: validation.schema_valid,
    payload_valid: validation.payload_valid,
    checksums_valid: validation.checksums_valid,
    load_contract_valid: validation.load_contract_valid,
    overall_valid: validation.overall_valid,
  };
}

test('licensed interoperability fixture uses the current encrypted payload contract', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_licensed_entry.kdna');
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(fixture);
  const manifest = reader.readManifestSync(asset);

  assert.equal(manifest.format_version, '0.1.0');
  assert.equal(manifest.payload.path, 'payload.kdnab');
  assert.equal(manifest.payload.encrypted, true);
  assert.equal(manifest.encryption.profile, core.LICENSED_ENTRY_PROFILE);
  assert.equal(manifest.encryption.profile_version, core.ENCRYPTION_PROFILE_VERSION);
  assert.deepEqual(manifest.encryption.encrypted_entries, ['payload.kdnab']);
  assert.deepEqual(reader.listEntriesSync(asset), [
    'checksums.json',
    'kdna.json',
    'mimetype',
    'payload.kdnab',
  ]);

  const plaintext = core.decryptLicensedEntry(
    reader.readEntrySync(asset, manifest.payload.path),
    { entryName: manifest.payload.path, manifest, licenseKey },
  );
  const canonical = fs.readFileSync(path.join(repoRoot, 'examples', 'minimal', 'payload.kdnab'));
  assert.deepEqual(cbor.decode(plaintext), cbor.decode(canonical));
});

test('bad-checksum fixture has one current-contract digest failure and no structural failures', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'container', 'invalid-bad-checksum');
  const manifest = JSON.parse(fs.readFileSync(path.join(fixture, 'kdna.json'), 'utf8'));
  const payloadPath = path.join(fixture, 'payload.kdnab');
  const payload = cbor.decode(fs.readFileSync(payloadPath));
  const checksums = JSON.parse(fs.readFileSync(path.join(fixture, 'checksums.json'), 'utf8'));

  assert.equal(manifest.format_version, '0.1.0');
  assert.equal(manifest.compatibility.profile, 'kdna.payload.judgment');
  assert.equal(manifest.compatibility.profile_version, '0.1.0');
  assert.equal(payload.profile, 'kdna.payload.judgment');
  assert.equal(payload.profile_version, '0.1.0');

  const declared = checksums.payload_digest.replace(/^sha256:/u, '');
  const actual = sha256(payloadPath);
  const expectedProblem = `checksums: payload_digest mismatch (declared ${declared.slice(0, 8)}..., actual ${actual.slice(0, 8)}...)`;
  const validation = container.validate(fixture);
  assert.deepEqual(validationChecks(validation), {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: false,
    load_contract_valid: true,
    overall_valid: false,
  });
  assert.deepEqual(validation.problems, [expectedProblem]);

  const plan = container.planLoad(fixture);
  assert.deepEqual(plan.checks, validationChecks(validation));
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_INTEGRITY_DIGEST_FAILED',
      severity: 'blocking',
      message: expectedProblem,
    },
  ]);
});

test('missing-manifest fixture carries an independently valid current payload', (t) => {
  const fixture = path.join(repoRoot, 'fixtures', 'container', 'invalid-missing-manifest');
  const payloadPath = path.join(fixture, 'payload.kdnab');
  const payload = cbor.decode(fs.readFileSync(payloadPath));
  assert.equal(payload.profile, 'kdna.payload.judgment');
  assert.equal(payload.profile_version, '0.1.0');

  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-missing-manifest-payload-'));
  t.after(() => fs.rmSync(source, { recursive: true, force: true }));
  for (const entry of ['mimetype', 'kdna.json']) {
    fs.copyFileSync(path.join(repoRoot, 'examples', 'minimal', entry), path.join(source, entry));
  }
  fs.copyFileSync(payloadPath, path.join(source, 'payload.kdnab'));
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    `${JSON.stringify(container.buildChecksums(source), null, 2)}\n`,
  );
  const payloadValidation = container.validate(source);
  assert.deepEqual(validationChecks(payloadValidation), {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: true,
    load_contract_valid: true,
    overall_valid: true,
  });
  assert.deepEqual(payloadValidation.problems, []);

  assert.throws(
    () => container.validate(fixture),
    (error) => error.message === 'not a KDNA authoring source directory: missing kdna.json',
  );
  const plan = container.planLoad(fixture);
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_FORMAT_INVALID',
      severity: 'blocking',
      message: `Source directory missing required entries: ${fixture}`,
    },
  ]);
});

test('container fixture generator is byte-stable and preserves each negative intent', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-container-fixtures-'));
  t.after(() => fs.rmSync(root, { force: true, recursive: true }));

  for (const relativePath of [
    'examples/minimal',
    'fixtures/container/invalid-bad-checksum',
    'fixtures/container/invalid-missing-manifest',
  ]) {
    fs.cpSync(path.join(repoRoot, relativePath), path.join(root, relativePath), {
      recursive: true,
    });
  }

  const run = () =>
    spawnSync(process.execPath, [generator, '--root', root], {
      encoding: 'utf8',
    });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const firstHashes = generatedHashes(root);
  assert.deepEqual(firstHashes, generatedHashes(repoRoot));
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(generatedHashes(root), firstHashes);

  const badRoot = path.join(root, 'fixtures', 'container', 'invalid-bad-checksum');
  const badChecksums = JSON.parse(fs.readFileSync(path.join(badRoot, 'checksums.json'), 'utf8'));
  assert.notEqual(
    badChecksums.payload_digest,
    `sha256:${sha256(path.join(badRoot, 'payload.kdnab'))}`,
  );
  assert.equal(
    fs.existsSync(
      path.join(root, 'fixtures', 'container', 'invalid-missing-manifest', 'kdna.json'),
    ),
    false,
  );
});
