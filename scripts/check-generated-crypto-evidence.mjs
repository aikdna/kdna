#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUTS = Object.freeze([
  'conformance/envelope-aead/envelope-aead-vector-01-scrypt-basic.json',
  'conformance/envelope-aead/envelope-aead-vector-02-scrypt-multi-entry-aad.json',
  'conformance/envelope-aead/envelope-aead-vector-03-argon2id-basic.json',
  'conformance/external-grant/golden.json',
  'conformance/external-grant/negative/asset-digest-mismatch.json',
  'conformance/external-grant/negative/asset-version-mismatch.json',
  'conformance/external-grant/negative/device-mismatch.json',
  'conformance/external-grant/negative/revoked.json',
  'conformance/external-grant/negative/tampered-signature.json',
]);
const GENERATORS = Object.freeze([
  'scripts/generate-envelope-aead-vectors.js',
  'scripts/generate-external-grant-fixtures.js',
]);

function hashOutputs(root) {
  return Object.fromEntries(
    OUTPUTS.map((relativePath) => {
      const bytes = fs.readFileSync(path.join(root, relativePath));
      return [relativePath, crypto.createHash('sha256').update(bytes).digest('hex')];
    }),
  );
}

function assertSame(left, right, label) {
  for (const relativePath of OUTPUTS) {
    if (left[relativePath] !== right[relativePath]) {
      throw new Error(
        `${label}: ${relativePath} changed (${left[relativePath]} -> ${right[relativePath]})`,
      );
    }
  }
}

function runGenerators(root) {
  for (const generator of GENERATORS) {
    execFileSync(process.execPath, [generator], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'ignore', 'pipe'],
    });
  }
}

function main() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-crypto-evidence-'));
  try {
    const archivePath = path.join(temporaryRoot, 'source.tar');
    const checkoutRoot = path.join(temporaryRoot, 'checkout');
    fs.mkdirSync(checkoutRoot);
    const archive = execFileSync('git', ['archive', '--format=tar', 'HEAD'], {
      cwd: ROOT,
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    fs.writeFileSync(archivePath, archive);
    execFileSync('tar', ['-xf', archivePath, '-C', checkoutRoot], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(checkoutRoot, 'node_modules'), 'dir');

    const committed = hashOutputs(checkoutRoot);
    runGenerators(checkoutRoot);
    const generatedOnce = hashOutputs(checkoutRoot);
    assertSame(committed, generatedOnce, 'committed evidence is not generator-authoritative');
    runGenerators(checkoutRoot);
    const generatedTwice = hashOutputs(checkoutRoot);
    assertSame(generatedOnce, generatedTwice, 'crypto evidence generator is not idempotent');

    const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    console.log(
      `Generated crypto evidence passed: ${OUTPUTS.length} files, committed -> generation one -> generation two byte-identical at ${commit}.`,
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

main();
