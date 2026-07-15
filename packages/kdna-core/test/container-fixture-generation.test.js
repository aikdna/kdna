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
