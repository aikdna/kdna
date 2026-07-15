#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { format } from 'prettier';

const require = createRequire(import.meta.url);
const cbor = require('cbor-x');
const core = require('../packages/kdna-core/src');

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LICENSE_KEY = 'KDNA-TEST-LICENSE-VECTOR-2026';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function formattedJson(value) {
  return format(JSON.stringify(value), { parser: 'json' });
}

function licensedManifest() {
  return {
    format_version: '0.1.0',
    asset_id: 'kdna:fixture:licensed-entry',
    asset_uid: 'urn:uuid:00080000-0000-4000-8000-000000000001',
    asset_type: 'fixture',
    title: 'Licensed Entry Interoperability Fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-07-15T00:00:00Z',
    compatibility: {
      min_loader_version: '0.18.1',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
    access: 'licensed',
    entitlement: { profile: 'account', offline: false, revocable: true },
    encryption: {
      profile: core.LICENSED_ENTRY_PROFILE,
      profile_version: core.ENCRYPTION_PROFILE_VERSION,
      encrypted_entries: ['payload.kdnab'],
    },
  };
}

function deterministicLicensedEnvelope(plaintext, manifest) {
  const cek = Buffer.alloc(32, 0x08);
  const iv = Buffer.from('080706050403020100080706', 'hex');
  const wrappingKey = core.deriveWrappingKey(LICENSE_KEY);
  const cipher = crypto.createCipheriv('aes-256-gcm', cek, iv);
  cipher.setAAD(
    Buffer.from(
      [
        core.LICENSED_ENTRY_PROFILE,
        core.ENCRYPTION_PROFILE_VERSION,
        manifest.asset_id,
        manifest.version,
        manifest.payload.path,
      ].join('\n'),
      'utf8',
    ),
  );
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return {
    profile: core.LICENSED_ENTRY_PROFILE,
    profile_version: core.ENCRYPTION_PROFILE_VERSION,
    alg: core.ALG,
    kdf: core.RFC_KDF,
    key_wrapping: core.RFC_KEY_WRAPPING,
    wrapped_key: core.wrapCEK(cek, wrappingKey).toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

async function generateContainerFixtures(root = SCRIPT_ROOT) {
  const canonicalPayload = fs.readFileSync(path.join(root, 'examples', 'minimal', 'payload.kdnab'));
  const decoded = cbor.decode(canonicalPayload);
  if (decoded?.profile !== 'kdna.payload.judgment' || decoded?.profile_version !== '0.1.0') {
    throw new Error('canonical minimal payload does not use the current profile contract');
  }

  const badChecksumRoot = path.join(root, 'fixtures', 'container', 'invalid-bad-checksum');
  const missingManifestRoot = path.join(root, 'fixtures', 'container', 'invalid-missing-manifest');
  fs.writeFileSync(path.join(badChecksumRoot, 'payload.kdnab'), canonicalPayload);
  fs.writeFileSync(path.join(missingManifestRoot, 'payload.kdnab'), canonicalPayload);

  const badChecksums = core.buildChecksums(badChecksumRoot);
  const deliberateMismatch = '0'.repeat(64);
  badChecksums.payload_digest = `sha256:${deliberateMismatch}`;
  badChecksums.entries['payload.kdnab'].value = deliberateMismatch;
  fs.writeFileSync(path.join(badChecksumRoot, 'checksums.json'), await formattedJson(badChecksums));

  const manifest = licensedManifest();
  const envelope = deterministicLicensedEnvelope(canonicalPayload, manifest);
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-licensed-fixture-'));
  try {
    fs.writeFileSync(path.join(source, 'mimetype'), core.MIMETYPE);
    fs.writeFileSync(path.join(source, 'kdna.json'), json(manifest));
    fs.writeFileSync(path.join(source, 'payload.kdnab'), cbor.encode(envelope));
    fs.writeFileSync(path.join(source, 'checksums.json'), json(core.buildChecksums(source)));
    const destination = path.join(root, 'fixtures', 'test_licensed_entry.kdna');
    core.pack(source, destination);

    const reader = core.createKdnaAssetReader();
    const asset = reader.openSync(destination);
    const runtimeManifest = reader.readManifestSync(asset);
    const plaintext = core.decryptLicensedEntry(
      reader.readEntrySync(asset, runtimeManifest.payload.path),
      {
        entryName: runtimeManifest.payload.path,
        manifest: runtimeManifest,
        licenseKey: LICENSE_KEY,
      },
    );
    if (!plaintext.equals(canonicalPayload)) {
      throw new Error('licensed fixture round-trip did not recover the canonical payload');
    }
  } finally {
    fs.rmSync(source, { recursive: true, force: true });
  }
}

function rootFromArgs(args) {
  if (args.length === 0) return SCRIPT_ROOT;
  if (args.length === 2 && args[0] === '--root') return path.resolve(args[1]);
  throw new Error('usage: generate-container-negative-fixtures.mjs [--root <directory>]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateContainerFixtures(rootFromArgs(process.argv.slice(2)));
  console.log('Container negative and licensed fixtures regenerated');
}

export { generateContainerFixtures };
