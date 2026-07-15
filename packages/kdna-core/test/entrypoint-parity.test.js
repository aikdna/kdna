'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');

const core = require('../src/index.js');
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const TYPES_PATH = path.join(PACKAGE_ROOT, 'src', 'types.d.ts');

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, 'en'));
}

function runTsc(args) {
  return execFileSync(process.execPath, [require.resolve('typescript/lib/tsc.js'), ...args]);
}

function representativeTypesSource(importSpecifier) {
  return [
    `import { ALG, EXTERNAL_AAD_PROFILE, WORK_PACK_SCHEMA, KDNAManifest, KDNAWorkPackManifest, LicensedEntryLegacyEnvelope, encryptLicensedEntry, decryptLicensedEntry, decryptLicensedEntry, encryptProtectedEntry, validateWorkPackManifest, inspectWorkPack, externalEnvelopeAad } from ${JSON.stringify(importSpecifier)};`,
    "const algorithm: 'AES-256-GCM' = ALG;",
    "const aadProfile: 'kdna.key-context.asset-content' = EXTERNAL_AAD_PROFILE;",
    'declare const manifest: KDNAManifest;',
    "const envelope = encryptLicensedEntry('judgment', { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const plaintext: Uint8Array = decryptLicensedEntry(envelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const unifiedV1: Uint8Array = decryptLicensedEntry(envelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const protectedEnvelope = encryptProtectedEntry('judgment', { entryName: 'payload.kdnab', manifest, password: 'password' });",
    "const kdfName: 'Argon2id' = protectedEnvelope.password_kdf.name;",
    'declare const legacyEnvelope: LicensedEntryLegacyEnvelope;',
    "const legacyPlaintext: Uint8Array = decryptLicensedEntry(legacyEnvelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license', machineFingerprint: 'machine' });",
    '// @ts-expect-error legacy envelopes require machineFingerprint',
    "decryptLicensedEntry(legacyEnvelope, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    'declare const unifiedBytes: Uint8Array;',
    "const unifiedPlaintext: Uint8Array = decryptLicensedEntry(unifiedBytes, { entryName: 'payload.kdnab', manifest, licenseKey: 'license', machineFingerprint: 'machine' });",
    '// @ts-expect-error raw unified input may be legacy and requires machineFingerprint',
    "decryptLicensedEntry(unifiedBytes, { entryName: 'payload.kdnab', manifest, licenseKey: 'license' });",
    "const workpack: KDNAWorkPackManifest = { format: 'kdna-workpack', format_version: '0.1', name: 'example', version: '1.0.0', description: 'test', status: 'draft', kdna: { mode: 'single', asset: { name: 'asset', version: '1.0.0', role: 'primary' } } };",
    'const validation: boolean = validateWorkPackManifest(workpack).valid;',
    "const summary: string = inspectWorkPack(workpack, '.').name;",
    "const aad: Uint8Array = externalEnvelopeAad({ manifest, entryName: 'payload.kdnab', plaintextDigest: 'sha256:00', keyRef: 'key', issuerKeyId: 'issuer' });",
    'const schemaTitle: unknown = WORK_PACK_SCHEMA.title;',
    'console.log(algorithm, aadProfile, plaintext, unifiedV1, protectedEnvelope, kdfName, legacyPlaintext, unifiedPlaintext, validation, summary, aad, schemaTitle);',
  ].join('\n');
}

test('CJS and ESM root entrypoints expose identical named values', async () => {
  const esm = await import(pathToFileURL(path.join(PACKAGE_ROOT, 'src', 'index.mjs')).href);
  const cjsNames = sorted(Object.keys(core));
  const esmNames = sorted(Object.keys(esm).filter((name) => name !== 'default'));

  assert.deepEqual(esmNames, cjsNames);
  for (const name of cjsNames) {
    assert.strictEqual(esm[name], core[name], `${name} must be the same public value`);
  }
});

test('TypeScript value declarations exactly match the runtime root API', () => {
  const program = ts.createProgram([TYPES_PATH], {
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.deepEqual(
    diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    [],
  );

  const checker = program.getTypeChecker();
  const source = program.getSourceFile(TYPES_PATH);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const declaredValues = checker
    .getExportsOfModule(moduleSymbol)
    .filter((symbol) => symbol.flags & ts.SymbolFlags.Value)
    .map((symbol) => symbol.name);
  assert.deepEqual(sorted(declaredValues), sorted(Object.keys(core)));
});

test('TypeScript consumes representative crypto, Work Pack, and external-grant APIs', () => {
  const tmp = fs.mkdtempSync(path.join(PACKAGE_ROOT, 'test', 'tmp-types-'));
  try {
    const checkPath = path.join(tmp, 'check.ts');
    fs.writeFileSync(checkPath, representativeTypesSource('../..'));
    runTsc([
      '--noEmit',
      '--strict',
      '--moduleResolution',
      'node16',
      '--module',
      'node16',
      '--target',
      'es2022',
      checkPath,
    ]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
