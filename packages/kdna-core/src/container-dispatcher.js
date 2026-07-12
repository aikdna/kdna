'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const MIMETYPE = 'application/vnd.kdna.asset';

/**
 * CanonicalAssetModel — the single internal representation of a KDNA asset,
 * regardless of source (directory or .kdna container).
 *
 * @typedef {object} CanonicalAssetModel
 * @property {'dir'|'file'} sourceKind
 * @property {string}       sourcePath
 * @property {string}       format           — 'dir' | 'kdna'
 * @property {string}       mimetype
 * @property {object}       manifest         — parsed kdna.json
 * @property {Buffer}       payloadRaw       — raw payload.kdnab bytes
 * @property {object|null}  checksums
 * @property {Buffer|null}  assetDigest
 * @property {Buffer|null}  containerBuffer
 * @property {Map<string, Buffer>|null} entries
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
  if (format === 'kdna') {
    return readKdnaContainer(absPath, opts);
  }

  throw Object.assign(
    new Error(`Unknown KDNA container format: ${absPath}`),
    { code: 'KDNA_FORMAT_UNKNOWN' },
  );
}

function detectFormat(absPath) {
  const buf = fs.readFileSync(absPath);
  if (buf.length < 4) {
    throw Object.assign(
      new Error(`File too small to be a KDNA container: ${absPath}`),
      { code: 'KDNA_FORMAT_INVALID' },
    );
  }

  const sig = buf.readUInt32LE(0);
  if (sig !== 0x04034b50) {
    throw Object.assign(
      new Error(`Not a valid ZIP/KDNA container: ${absPath}`),
      { code: 'KDNA_FORMAT_INVALID' },
    );
  }

  const eocdOffset = findEocd(buf);
  let cdOffset = buf.readUInt32LE(eocdOffset + 16);
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

    if (mime === MIMETYPE) return 'kdna';

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

function readSourceDirectory(absPath, _opts) {
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
  if (mimetype !== MIMETYPE) {
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
    format: 'dir',
    mimetype,
    manifest,
    payloadRaw,
    checksums,
    assetDigest: null,
    containerBuffer: null,
    entries,
  };
}

function readKdnaContainer(absPath, _opts) {
  const v1Layout = require('./v1/index.js').readLayout(absPath);
  const containerBuf = fs.readFileSync(absPath);
  const assetDigest = crypto.createHash('sha256').update(containerBuf).digest();

  return {
    sourceKind: 'file',
    sourcePath: absPath,
    format: 'kdna',
    mimetype: MIMETYPE,
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

function getMimetype(asset) {
  return asset.mimetype;
}

function isKdnaSourceDirectory(asset) {
  return asset.sourceKind === 'dir';
}

module.exports = {
  MIMETYPE,
  readAsset,
  detectFormat,
  getMimetype,
  isKdnaSourceDirectory,
};
