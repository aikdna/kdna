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
const LICENSED_FIXTURE_ENTRIES = Object.freeze([
  'mimetype',
  'checksums.json',
  'kdna.json',
  'payload.kdnab',
]);
const ZIP_VERSION_NEEDED = 20;
const ZIP_VERSION_MADE_BY = (3 << 8) | ZIP_VERSION_NEEDED;
const ZIP_UTF8_FLAG = 0x0800;
const ZIP_STORED_METHOD = 0;
const ZIP_DOS_TIME = 0;
const ZIP_DOS_DATE = 1;
const ZIP_REGULAR_0644 = (0o100644 * 0x10000) >>> 0;

// This fixture is hash-pinned across operating systems. Core pack intentionally
// uses DEFLATE for general assets, but zlib output bytes can vary by platform
// version. The restricted fixture writer stores four exact entries and owns
// every ZIP metadata field so compression libraries and filesystem metadata
// cannot change the interoperability vector.

const CRC32_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function buildDeterministicLicensedFixtureZip(entries) {
  const keys = Object.keys(entries).sort();
  if (JSON.stringify(keys) !== JSON.stringify([...LICENSED_FIXTURE_ENTRIES].sort())) {
    throw new Error('licensed fixture ZIP entries are not exact');
  }
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const name of LICENSED_FIXTURE_ENTRIES) {
    const data = entries[name];
    if (!Buffer.isBuffer(data)) throw new Error(`licensed fixture entry is not bytes: ${name}`);
    const nameBytes = Buffer.from(name, 'utf8');
    const checksum = crc32(data);
    const local = Buffer.alloc(30 + nameBytes.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(ZIP_VERSION_NEEDED, 4);
    local.writeUInt16LE(ZIP_UTF8_FLAG, 6);
    local.writeUInt16LE(ZIP_STORED_METHOD, 8);
    local.writeUInt16LE(ZIP_DOS_TIME, 10);
    local.writeUInt16LE(ZIP_DOS_DATE, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    nameBytes.copy(local, 30);
    localParts.push(local, data);

    const central = Buffer.alloc(46 + nameBytes.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(ZIP_VERSION_MADE_BY, 4);
    central.writeUInt16LE(ZIP_VERSION_NEEDED, 6);
    central.writeUInt16LE(ZIP_UTF8_FLAG, 8);
    central.writeUInt16LE(ZIP_STORED_METHOD, 10);
    central.writeUInt16LE(ZIP_DOS_TIME, 12);
    central.writeUInt16LE(ZIP_DOS_DATE, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(ZIP_REGULAR_0644, 38);
    central.writeUInt32LE(offset, 42);
    nameBytes.copy(central, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((total, entry) => total + entry.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(LICENSED_FIXTURE_ENTRIES.length, 8);
  end.writeUInt16LE(LICENSED_FIXTURE_ENTRIES.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

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
    fs.writeFileSync(
      destination,
      buildDeterministicLicensedFixtureZip(
        Object.fromEntries(
          LICENSED_FIXTURE_ENTRIES.map((entry) => [
            entry,
            fs.readFileSync(path.join(source, entry)),
          ]),
        ),
      ),
    );

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
