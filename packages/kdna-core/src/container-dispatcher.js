'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { v1 } = require('../v1/index.js');
const { createKdnaAssetReader } = require('../asset-reader.js');

const MIMETYPE_V1 = 'application/vnd.kdna.asset';
const MIMETYPE_V2 = 'application/vnd.aikdna.kdna+zip';

/**
 * CanonicalAssetModel — the single internal representation of any KDNA asset,
 * regardless of whether it came from a source directory, Container v1,
 * or Canonical Distribution Container (Container v2 / SPEC 2.0).
 *
 * All downstream code (planLoad, loadAuthorized, decrypt, loadV1Unsafe)
 * operates on this model. No consumer should check container format directly.
 *
 * @typedef {object} CanonicalAssetModel
 * @property {'dir'|'file'} sourceKind       — original input type
 * @property {string}       sourcePath       — resolved absolute path
 * @property {string}       format           — 'v1-dir' | 'v1-container' | 'v2-container'
 * @property {string}       mimetype         — normalized mimetype
 * @property {object}       manifest         — parsed kdna.json
 * @property {Buffer}       payloadRaw       — raw payload.kdnab bytes (CBOR/JSON)
 * @property {object|null}  checksums        — parsed checksums.json, or null
 * @property {Buffer|null}  assetDigest      — SHA-256 of entire container (file only)
 * @property {Buffer|null}  containerBuffer  — full container bytes (for ZIP inputs, may be null for dirs)
 * @property {Map<string, Buffer>|null} entries — raw entry map (for v1 dir layout; null for v2/container)
 */

/**
 * Read any KDNA asset into a CanonicalAssetModel.
 *
 * Handles:
 *   - Source directories (mimetype + kdna.json + payload.kdnab on disk)
 *   - Container v1 (.kdna ZIP with application/vnd.kdna.asset mimetype)
 *   - Canonical containers (.kdna ZIP with application/vnd.aikdna.kdna+zip mimetype)
 *
 * @param {string} inputPath - absolute path to asset file or directory
 * @param {object} [opts]
 * @param {object} [opts.limits] - container size/entry limits
 * @returns {CanonicalAssetModel}
 */
function readAsset(inputPath, opts = {}) {
  const absPath = path.resolve(inputPath);
  const stat = fs.statSync(absPath);

  if (stat.isDirectory()) {
    return readSourceDirectory(absPath, opts);
  }

  if (!stat.isFile()) {
    throw Object.assign(
      new Error(`Not a file or directory: ${absPath}`),
      { code: 'KDNA_PATH_NOT_FOUND' },
    );
  }

  const format = detectFormat(absPath);
  if (format === 'v1-container') {
    return readV1Container(absPath, opts);
  }
  if (format === 'v2-container') {
    return readV2Container(absPath, opts);
  }

  throw Object.assign(
    new Error(`Unknown KDNA container format: ${absPath}`),
    { code: 'KDNA_FORMAT_UNKNOWN' },
  );
}

/**
 * Detect the container format of a .kdna file.
 * Returns 'v1-container', 'v2-container', or throws.
 */
function detectFormat(absPath) {
  const buf = fs.readFileSync(absPath);
  if (buf.length < 4) {
    throw Object.assign(
      new Error(`File too small to be a KDNA container: ${absPath}`),
      { code: 'KDNA_FORMAT_INVALID' },
    );
  }

  // Must be a ZIP (PK signature)
  const sig = buf.readUInt32LE(0);
  if (sig !== 0x04034b50) {
    throw Object.assign(
      new Error(`Not a valid ZIP/KDNA container: ${absPath}`),
      { code: 'KDNA_FORMAT_INVALID' },
    );
  }

  // Read the mimetype from the first entry (central directory first entry)
  const eocdOffset = findEocd(buf);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  const cdEntryCount = buf.readUInt16LE(eocdOffset + 10);

  for (let i = 0; i < cdEntryCount; i++) {
    const entryOffset = cdOffset;
    const nameLen = buf.readUInt16LE(entryOffset + 28);
    const extraLen = buf.readUInt16LE(entryOffset + 30);
    const commentLen = buf.readUInt16LE(entryOffset + 32);
    const name = buf.toString('utf8', entryOffset + 46, entryOffset + 46 + nameLen);

    if (name !== 'mimetype') {
      cdOffset = entryOffset + 46 + nameLen + extraLen + commentLen;
      continue;
    }

    const method = buf.readUInt16LE(entryOffset + 10);
    if (method !== 0) {
      throw Object.assign(
        new Error('mimetype entry must be stored (no compression)'),
        { code: 'KDNA_FORMAT_INVALID' },
      );
    }

    const localOffset = buf.readUInt32LE(entryOffset + 42);
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLen + localExtraLen;
    const compressedSize = buf.readUInt32LE(entryOffset + 20);
    const mime = buf.toString('utf8', dataOffset, dataOffset + compressedSize).trim();

    if (mime === MIMETYPE_V1) return 'v1-container';
    if (mime === MIMETYPE_V2) return 'v2-container';

    throw Object.assign(
      new Error(`Unknown KDNA mimetype: ${mime}`),
      { code: 'KDNA_FORMAT_UNKNOWN' },
    );
  }

  throw Object.assign(
    new Error('No mimetype entry found in KDNA container'),
    { code: 'KDNA_FORMAT_INVALID' },
  );
}

function findEocd(buf) {
  const maxSearch = Math.min(buf.length, 65557);
  for (let i = buf.length - 22; i >= buf.length - maxSearch && i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      return i;
    }
  }
  throw Object.assign(
    new Error('EOCD record not found in ZIP container'),
    { code: 'KDNA_FORMAT_INVALID' },
  );
}

/**
 * Read a source directory into CanonicalAssetModel.
 */
function readSourceDirectory(absPath, opts) {
  const mimetypePath = path.join(absPath, 'mimetype');
  const manifestPath = path.join(absPath, 'kdna.json');
  const payloadPath = path.join(absPath, 'payload.kdnab');
  const checksumsPath = path.join(absPath, 'checksums.json');

  if (!fs.existsSync(mimetypePath) || !fs.existsSync(manifestPath) || !fs.existsSync(payloadPath)) {
    throw Object.assign(
      new Error(`Source directory missing required entries: ${absPath}`),
      { code: 'KDNA_FORMAT_INVALID' },
    );
  }

  const mimetype = fs.readFileSync(mimetypePath, 'utf8').trim();
  if (![MIMETYPE_V1, MIMETYPE_V2].includes(mimetype)) {
    throw Object.assign(
      new Error(`Unknown mimetype in source directory: ${mimetype}`),
      { code: 'KDNA_FORMAT_UNKNOWN' },
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    throw Object.assign(
      new Error(`Invalid kdna.json in source directory: ${e.message}`),
      { code: 'KDNA_MANIFEST_PARSE_ERROR' },
    );
  }

  const payloadRaw = fs.readFileSync(payloadPath);
  const checksums = fs.existsSync(checksumsPath)
    ? JSON.parse(fs.readFileSync(checksumsPath, 'utf8'))
    : null;

  const entries = new Map();
  for (const entryName of fs.readdirSync(absPath)) {
    const entryPath = path.join(absPath, entryName);
    if (fs.statSync(entryPath).isFile()) {
      entries.set(entryName, fs.readFileSync(entryPath));
    }
  }

  return {
    sourceKind: 'dir',
    sourcePath: absPath,
    format: 'v1-dir',
    mimetype,
    manifest,
    payloadRaw,
    checksums,
    assetDigest: null,
    containerBuffer: null,
    entries,
  };
}

/**
 * Read a Container v1 (.kdna with v1 mimetype) into CanonicalAssetModel.
 */
function readV1Container(absPath, opts) {
  // Delegate to the existing v1 layout reader for validation
  const v1Layout = require('../v1/index.js').readV1Layout(absPath);

  const containerBuf = fs.readFileSync(absPath);
  const assetDigest = crypto.createHash('sha256').update(containerBuf).digest();

  return {
    sourceKind: 'file',
    sourcePath: absPath,
    format: 'v1-container',
    mimetype: MIMETYPE_V1,
    manifest: v1Layout.manifest,
    payloadRaw: v1Layout.map['payload.kdnab'] || null,
    checksums: v1Layout.map['checksums.json']
      ? (() => { try { return JSON.parse(v1Layout.map['checksums.json'].toString('utf8')); } catch { return null; } })()
      : null,
    assetDigest,
    containerBuffer: containerBuf,
    entries: new Map(Object.entries(v1Layout.map)),
  };
}

/**
 * Read a Canonical Container (v2 mimetype) into CanonicalAssetModel.
 * Uses the existing KdnaAssetReader for ZIP parsing.
 */
function readV2Container(absPath, opts) {
  const reader = createKdnaAssetReader();
  const asset = reader.openSync(absPath);

  const manifest = reader.readManifestSync(asset);
  const payloadRaw = reader.readEntrySync(asset, 'payload.kdnab');
  const checksums = (() => {
    try {
      const raw = reader.readEntrySync(asset, 'checksums.json');
      return raw ? JSON.parse(raw.toString('utf8')) : null;
    } catch {
      return null;
    }
  })();

  return {
    sourceKind: 'file',
    sourcePath: absPath,
    format: 'v2-container',
    mimetype: MIMETYPE_V2,
    manifest,
    payloadRaw,
    checksums,
    assetDigest: Buffer.from(asset.asset_digest.replace(/^sha256:/, ''), 'hex'),
    containerBuffer: fs.readFileSync(absPath),
    entries: null, // v2 uses lazy reads, not pre-loaded map
  };
}

/**
 * Extract the mimetype from a CanonicalAssetModel.
 */
function getMimetype(asset) {
  return asset.mimetype;
}

/**
 * Determine if a CanonicalAssetModel represents a source directory.
 */
function isSourceDirectory(asset) {
  return asset.sourceKind === 'dir';
}

module.exports = {
  MIMETYPE_V1,
  MIMETYPE_V2,
  readAsset,
  detectFormat,
  getMimetype,
  isSourceDirectory,
};
