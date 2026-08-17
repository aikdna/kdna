#!/usr/bin/env node
'use strict';

/*
 * Sync the canonical byte-level interop vectors (conformance/) into the
 * published @aikdna/kdna-conformance package surface
 * (packages/kdna-conformance/vectors/) and regenerate the vector-set
 * manifest with per-file sha256 and byte counts.
 *
 * The canonical vectors are generated only by their dedicated generators
 * (scripts/generate-signature-vectors.mjs, generate-envelope-aead-vectors.js,
 * generate-authorization-conformance.mjs). This script copies; it never
 * creates or edits vector content. It fails closed if a canonical source
 * file is missing.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const CANONICAL_ROOT = path.join(REPO_ROOT, 'conformance');
const PACKAGE_VECTORS_ROOT = path.join(REPO_ROOT, 'packages', 'kdna-conformance', 'vectors');
const VECTOR_SET_VERSION = '0.2.0';

const VECTOR_SETS = [
  { source: 'signature/vectors.json', target: 'signature/vectors.json' },
  {
    source: 'envelope-aead/envelope-aead-vector-01-scrypt-basic.json',
    target: 'envelope-aead/envelope-aead-vector-01-scrypt-basic.json',
  },
  {
    source: 'envelope-aead/envelope-aead-vector-02-scrypt-multi-entry-aad.json',
    target: 'envelope-aead/envelope-aead-vector-02-scrypt-multi-entry-aad.json',
  },
  {
    source: 'envelope-aead/envelope-aead-vector-03-argon2id-basic.json',
    target: 'envelope-aead/envelope-aead-vector-03-argon2id-basic.json',
  },
  { source: 'authorization/cases.json', target: 'authorization/cases.json' },
  { source: 'authorization/cases.schema.json', target: 'authorization/cases.schema.json' },
];

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

function collectVectorFiles() {
  const files = [...VECTOR_SETS];
  for (const subdir of ['authorization/goldens', 'authorization/fixtures']) {
    const absolute = path.join(CANONICAL_ROOT, subdir);
    if (!fs.existsSync(absolute)) {
      throw new Error(`canonical vector directory missing: ${subdir}`);
    }
    for (const full of listFilesRecursive(absolute)) {
      const relative = path.relative(CANONICAL_ROOT, full).split(path.sep).join('/');
      files.push({ source: relative, target: relative });
    }
  }
  return files;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const files = collectVectorFiles();
  const manifestFiles = [];
  const staged = new Map();

  for (const { source, target } of files) {
    const sourcePath = path.join(CANONICAL_ROOT, source);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`canonical vector file missing: ${source}`);
    }
    const bytes = fs.readFileSync(sourcePath);
    staged.set(target, bytes);
    manifestFiles.push({
      path: target,
      sha256: sha256(bytes),
      bytes: bytes.length,
    });
  }
  manifestFiles.sort((a, b) => a.path.localeCompare(b.path));

  const manifest = {
    vector_set_version: VECTOR_SET_VERSION,
    description:
      'Byte-level KDNA interop vectors packaged from the canonical conformance/ tree. ' +
      'Verify an implementation against these vectors plus the RFCs to claim interop.',
    sets: {
      'signature/vectors.json': 'kdsig.ed25519 signature vectors (RFC-0021 M1)',
      'envelope-aead/': 'password-envelope AEAD vectors (scrypt and Argon2id)',
      'authorization/': 'authorization LoadPlan cases with fixtures and goldens (RFC-0014)',
    },
    files: manifestFiles,
  };
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);

  if (checkOnly) {
    let drift = 0;
    for (const [target, bytes] of staged) {
      const packagedPath = path.join(PACKAGE_VECTORS_ROOT, target);
      if (!fs.existsSync(packagedPath) || !fs.readFileSync(packagedPath).equals(bytes)) {
        console.error(`drift: ${target}`);
        drift += 1;
      }
    }
    const manifestPath = path.join(PACKAGE_VECTORS_ROOT, 'manifest.json');
    if (!fs.existsSync(manifestPath) || !fs.readFileSync(manifestPath).equals(manifestBytes)) {
      console.error('drift: manifest.json');
      drift += 1;
    }
    if (drift > 0) {
      throw new Error(`${drift} packaged vector file(s) drifted; run scripts/sync-conformance-vectors.mjs`);
    }
    console.log(`conformance vectors in sync: ${manifestFiles.length} files`);
    return;
  }

  // Remove stale packaged files not in the current set before writing.
  if (fs.existsSync(PACKAGE_VECTORS_ROOT)) {
    for (const full of listFilesRecursive(PACKAGE_VECTORS_ROOT)) {
      const relative = path.relative(PACKAGE_VECTORS_ROOT, full).split(path.sep).join('/');
      if (relative !== 'manifest.json' && !staged.has(relative)) {
        fs.rmSync(full);
      }
    }
  }
  for (const [target, bytes] of staged) {
    const targetPath = path.join(PACKAGE_VECTORS_ROOT, target);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, bytes);
  }
  fs.writeFileSync(path.join(PACKAGE_VECTORS_ROOT, 'manifest.json'), manifestBytes);
  console.log(`synced ${manifestFiles.length} vector files -> packages/kdna-conformance/vectors/`);
}

main();
