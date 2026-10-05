#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

// These exact paths have an existing byte owner. Ordinary adjacent source stays
// under Prettier. Expanding this list requires identifying and checking its owner.
const OWNED_PATHS = Object.freeze([
  'conformance/envelope-aead/envelope-aead-vector-04-scrypt-multi-slot.json',
  'conformance/envelope-aead/envelope-aead-vector-05-mixed-multi-slot.json',
  'scripts/public-contract/cross-entry-check.mjs',
  'scripts/public-contract/proof-inventory.mjs',
  'scripts/public-contract/selected-context.mjs',
  'specs/canonical-ir-0.6.1.schema.json',
  'specs/canonical-ir-0.6.schema.json',
  'specs/checksums-document-1.schema.json',
  'specs/envelope-aead.schema.json',
  'specs/external-grant-issuer-r2-binding-1.schema.json',
  'specs/external-grant-issuer-r2-binding-2.schema.json',
  'specs/external-grant-issuer-r2-binding-3.schema.json',
  'specs/external-grant-issuer-r2-binding-4.schema.json',
  'specs/external-grant-issuer-r2-binding-5.schema.json',
  'specs/external-grant-issuer-r2-binding-6.schema.json',
  'specs/external-grant-issuer-r2-binding-7.schema.json',
  'specs/external-grant-issuer.d.ts',
  'specs/external-grant-issuer.schema.json',
  'specs/package-set-node-0.2.1.schema.json',
  'specs/package-set-node-0.2.schema.json',
  'specs/package-set-node.d.ts',
  'specs/package-set-node.schema.json',
  'specs/protected-source-r2-binding-1.schema.json',
  'specs/protected-source-r2-binding-2.schema.json',
  'specs/protected-source-r2-binding-3.schema.json',
  'specs/protected-source-r2-binding-4.schema.json',
  'specs/protected-source-r2-binding-5.schema.json',
  'specs/protected-source-r2-binding-6.schema.json',
  'specs/protected-source-r2-binding-7.schema.json',
  'specs/protected-source.d.ts',
  'specs/protected-source.schema.json',
  'specs/protection-admission-r2-binding-1.schema.json',
  'specs/protection-admission-r2-binding-2.schema.json',
  'specs/protection-admission-r2-binding-3.schema.json',
  'specs/protection-admission-r2-binding-4.schema.json',
  'specs/protection-admission-r2-binding-5.schema.json',
  'specs/protection-admission-r2-binding-6.schema.json',
  'specs/protection-admission-r2-binding-7.schema.json',
  'specs/protection-admission.d.ts',
  'specs/protection-admission.schema.json',
  'specs/public-diagnostics.json',
  'specs/read-contract-0.6.1.schema.json',
  'specs/read-contract-0.6.2.schema.json',
  'specs/read-contract-0.6.3.schema.json',
  'specs/read-contract-0.6.4.schema.json',
  'specs/read-contract-0.6.schema.json',
  'specs/read-transport-admission-0.2.1.schema.json',
  'specs/read-transport-admission-0.2.schema.json',
]);
const AEAD_VECTORS = new Set([
  'conformance/envelope-aead/envelope-aead-vector-04-scrypt-multi-slot.json',
  'conformance/envelope-aead/envelope-aead-vector-05-mixed-multi-slot.json',
]);
const BASE_PATTERNS = Object.freeze([
  'node_modules/',
  '*.md',
  '.github/',
  'examples/',
  'schema/',
  'packages/',
  'benchmarks/raw/',
  'docs/inspector/index.html',
  'python-sdk/',
  'specs/public-semantic-source.json',
  'specs/public-contract-decisions.json',
  'specs/canonical-ir.schema.json',
  'specs/read-contract.schema.json',
  'specs/read-transport-admission.schema.json',
  'specs/public-vocabulary.json',
  'conformance/public-contract-decision-vectors.json',
  'conformance/public-contract/vectors.generated.json',
  'conformance/public-contract/ir-retention-vectors.generated.json',
  'conformance/public-contract/adapter-contract.json',
  'scripts/public-contract/generate.mjs',
  'scripts/public-contract/verify.mjs',
]);
const BEGIN = '# BEGIN checked byte ownership';
const END = '# END checked byte ownership';
const ROOT = path.resolve(__dirname, '..');

function regular(relative) {
  const file = path.join(ROOT, relative);
  assert.ok(
    fs.lstatSync(file).isFile() && !fs.lstatSync(file).isSymbolicLink(),
    `format owner requires a regular file: ${relative}`,
  );
  return fs.readFileSync(file);
}
function json(relative) {
  return JSON.parse(regular(relative));
}
function check() {
  assert.equal(process.argv.length, 2, 'format ownership check accepts no arguments');
  const ignore = regular('.prettierignore').toString('utf8');
  const sections = ignore.split(BEGIN);
  assert.equal(sections.length, 2, 'format ownership block must occur once');
  const prefix = sections[0]
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(prefix, BASE_PATTERNS, 'preexisting format exclusion set differs');
  const endings = sections[1].split(END);
  assert.equal(endings.length, 2, 'format ownership end must occur once');
  assert.equal(endings[1].trim(), '', 'undeclared exclusions after ownership block');
  const declared = endings[0]
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.deepEqual(declared, OWNED_PATHS, 'format ownership exact path set differs');

  const manifest = json('specs/public-generation-manifest.json');
  const source = json('specs/public-semantic-source.json');
  const records = [
    ...manifest.historical_artifacts,
    ...manifest.derived,
    ...manifest.integration,
    ...manifest.scripts,
    ...source.protection_admission.legacy_inputs,
  ];
  for (const relative of OWNED_PATHS) {
    if (AEAD_VECTORS.has(relative)) continue;
    const owners = records.filter((row) => row.path === relative);
    assert.ok(owners.length > 0, `format path has no authoritative byte owner: ${relative}`);
    const bytes = regular(relative);
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    for (const owner of owners) {
      assert.equal(bytes.length, owner.bytes, `format-owned byte length differs: ${relative}`);
      assert.equal(digest, owner.sha256, `format-owned digest differs: ${relative}`);
    }
  }
  // This checks actual generated bytes against the single semantic source too;
  // matching a modified file to a modified manifest alone cannot satisfy the gate.
  const generated = JSON.parse(
    execFileSync(
      process.execPath,
      [
        path.join(ROOT, 'scripts/public-contract/generate.mjs'),
        '--source',
        path.join(ROOT, 'specs/public-semantic-source.json'),
        '--root',
        ROOT,
        '--out-dir',
        ROOT,
        '--dependency-root',
        ROOT,
        '--check',
      ],
      { cwd: ROOT, encoding: 'utf8', timeout: 60000, maxBuffer: 4 * 1024 * 1024 },
    ),
  );
  assert.equal(generated.status, 'CHECK_MATCH');
  assert.equal(generated.writes, 0);
  execFileSync(
    process.execPath,
    [path.join(ROOT, 'conformance/envelope-aead/generate-multislot.mjs'), '--check'],
    { cwd: ROOT, encoding: 'utf8', timeout: 30000 },
  );
  console.log(
    `FORMAT-OWNERSHIP: MATCH (${OWNED_PATHS.length} exact paths; public generator and AEAD vectors checked)`,
  );
}

try {
  check();
} catch (error) {
  console.error(`FORMAT-OWNERSHIP: FAIL: ${error.message}`);
  process.exitCode = 1;
}
