'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const VECTORS_ROOT = path.join(PACKAGE_ROOT, 'vectors');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function listFilesRecursive(root) {
  const out = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...listFilesRecursive(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

test('packaged vector manifest binds every packaged file by exact bytes', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(VECTORS_ROOT, 'manifest.json'), 'utf8'));
  assert.ok(manifest.vector_set_version, 'manifest names a vector set version');
  assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0);

  const packaged = listFilesRecursive(VECTORS_ROOT)
    .map((full) => path.relative(VECTORS_ROOT, full).split(path.sep).join('/'))
    .filter((relative) => relative !== 'manifest.json')
    .sort();
  assert.deepEqual(
    manifest.files.map((entry) => entry.path).sort(),
    packaged,
    'manifest file set must equal the packaged file set',
  );

  for (const entry of manifest.files) {
    const bytes = fs.readFileSync(path.join(VECTORS_ROOT, entry.path));
    assert.equal(bytes.length, entry.bytes, `${entry.path} byte count drifted`);
    assert.equal(sha256(bytes), entry.sha256, `${entry.path} hash drifted`);
  }
});

test('packaged vectors are byte-identical to the canonical conformance tree', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, 'scripts', 'sync-conformance-vectors.js'), '--check'],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
