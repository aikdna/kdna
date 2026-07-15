/**
 * KDNA Asset Container inspect / validate / pack / unpack implementation.
 *
 * KDNA Core is the official KDNA judgment-asset format and runtime
 * loading contract. .kdna assets are created, inspected, packed,
 * unpacked, and validated through the official KDNA toolchain. This
 *
 * The KDNA Asset Container is documented in docs/core/file-format.md.
 * This module is the shared implementation that:
 *
 *   - packages/kdna/bin/kdna.js uses as its container router
 *   - compatibility scripts delegate to it so historical tooling
 *     scripts and the official CLI cannot drift
 *
 * Hard rules from the format spec:
 *
 *   - mimetype must equal "application/vnd.kdna.asset" (no trailing newline)
 *   - mimetype must be the first entry in a .kdna container
 *   - mimetype must be STORED (compression method 0) in a .kdna container
 *   - the source directory must contain mimetype, kdna.json, payload.kdnab
 *   - checksums.json and signatures/ are optional
 *   - lineage must be a single object (not an array)
 *   - pack output must be deterministic: same input → same SHA-256
 *
 * Output language must stay content-neutral. We never say "trusted",
 * "recommended", "high_quality", or "officially_approved". We say
 * "format_valid", "schema_valid", "payload_valid", "compatible", etc.
 *
 * Third-party products integrate KDNA through the official SDK, CLI,
 * Loader, or API.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const cbor = require('cbor-x');
const {
  EXTERNAL_ENVELOPE_PROFILE,
  validateExternalEnvelope,
  isVerifiedExternalEntitlement,
} = require('../external-key-grant');

const { readAsset } = (() => {
  try {
    return require('../container-dispatcher.js');
  } catch {
    return { readAsset: null };
  }
})();

const MIMETYPE = 'application/vnd.kdna.asset';
const REQUIRED_DIR_ENTRIES = ['mimetype', 'kdna.json', 'payload.kdnab'];
const OPTIONAL_DIR_ENTRIES = ['checksums.json', 'signatures', 'attachments'];
const ALLOWED_TOP_LEVEL_ENTRIES = new Set([
  ...REQUIRED_DIR_ENTRIES,
  ...OPTIONAL_DIR_ENTRIES,
]);
const FORBIDDEN_LEGACY_TOP_LEVEL = new Set([
  'KDNA_Core.json',
  'KDNA_Patterns.json',
  'KDNA_Scenarios.json',
  'KDNA_Cases.json',
  'KDNA_Reasoning.json',
  'KDNA_Evolution.json',
]);

const DEFAULT_CONTAINER_LIMITS = Object.freeze({
  maxContainerBytes: 25 * 1024 * 1024,
  maxEntries: 128,
  maxEntryBytes: 5 * 1024 * 1024,
  maxTotalUncompressedBytes: 12 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxJsonDepth: 64,
  maxJsonArrayLength: 10000,
  maxJsonStringLength: 1024 * 1024,
});

// Words that must never appear in layout CLI output as positive claims.
// Schema-valid, signature-valid, compatible — those are fine.
// "trusted", "recommended", "high_quality", "officially_approved" — never.
const FORBIDDEN_OUTPUT_TERMS = Object.freeze([
  'trusted',
  'recommended',
  'high_quality',
  'officially_approved',
  'quality_badge',
]);

// ─── Schema loading ─────────────────────────────────────────────────────

let _ajv = null;
let _validators = null;

function loadPackagedSchemas() {
  return {
    manifestSchema: require('../../schema/manifest.schema.json'),
    payloadSchema: require('../../schema/payload-profile.schema.json'),
    bundlePayloadSchema: require('../../schema/bundle-profile.schema.json'),
    checksumsSchema: require('../../schema/checksums.schema.json'),
    loadContractSchema: require('../../schema/load-contract.schema.json'),
  };
}

function getRepoRoot() {
  // Walk up from this file to find the repo root (where schema/ lives).
  // Works whether this module is loaded from packages/kdna/src/ or
  // from a copied/linked location.
  let dir = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'schema', 'manifest.schema.json'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  // Fallback: cwd, useful for installed/linked setups.
  return process.cwd();
}

function loadSchemasFromDisk() {
  const repoRoot = getRepoRoot();
  const schemaDir = path.join(repoRoot, 'schema');
  return {
    manifestSchema: JSON.parse(fs.readFileSync(path.join(schemaDir, 'manifest.schema.json'), 'utf8')),
    payloadSchema: JSON.parse(
      fs.readFileSync(path.join(schemaDir, 'payload-profile.schema.json'), 'utf8'),
    ),
    bundlePayloadSchema: JSON.parse(
      fs.readFileSync(path.join(schemaDir, 'bundle-profile.schema.json'), 'utf8'),
    ),
    checksumsSchema: JSON.parse(
      fs.readFileSync(path.join(schemaDir, 'checksums.schema.json'), 'utf8'),
    ),
    loadContractSchema: JSON.parse(
      fs.readFileSync(path.join(schemaDir, 'load-contract.schema.json'), 'utf8'),
    ),
  };
}

function loadSchemas() {
  if (_validators) return _validators;
  let Ajv;
  let addFormats;
  try {
    Ajv = require('ajv/dist/2020.js');
    addFormats = require('ajv-formats');
  } catch {
    // Ajv is an optional devDependency at the monorepo root. If the
    // CLI is installed elsewhere without it, validation is reduced
    // to structural checks (no JSON-schema enforcement).
    return null;
  }
  let schemas;
  try {
    schemas = loadPackagedSchemas();
  } catch {
    schemas = loadSchemasFromDisk();
  }
  const { manifestSchema, payloadSchema, bundlePayloadSchema, checksumsSchema, loadContractSchema } = schemas;
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(loadContractSchema, 'load-contract.schema.json');
  _ajv = ajv;
  _validators = {
    manifest: ajv.compile(manifestSchema),
    payload: ajv.compile(payloadSchema),
    bundlePayload: ajv.compile(bundlePayloadSchema),
    checksums: ajv.compile(checksumsSchema),
  };
  return _validators;
}

// ─── Format detection ──────────────────────────────────────────────────

/**
 * Detect whether a directory is a KDNA authoring source layout.
 * Required entries: mimetype, kdna.json, payload.kdnab.
 * mimetype content must equal "application/vnd.kdna.asset".
 */
function isKdnaSourceDir(absPath) {
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) return false;
  for (const f of REQUIRED_DIR_ENTRIES) {
    if (!fs.existsSync(path.join(absPath, f))) return false;
  }
  const mime = fs.readFileSync(path.join(absPath, 'mimetype'), 'utf8');
  return mime === MIMETYPE;
}

/**
/**
 * Detect whether a file is a .kdna container.
 * Returns 'kdna' | null. null = not a .kdna file or unreadable.
 */
function detectContainerFormat(absPath) {
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return null;
  const fd = fs.openSync(absPath, 'r');
  const head = Buffer.alloc(4);
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head[0] !== 0x50 || head[1] !== 0x4b) return null;

  let first;
  try {
    first = readFirstZipEntry(absPath);
  } catch {
    return null;
  }
  if (first.name !== 'mimetype') return null;
  if (first.method !== 0) return null;
  const mime = first.method === 0 ? first.data.toString('utf8') : '';
  return (mime === MIMETYPE) ? 'kdna' : null;
}

// ─── ZIP I/O ────────────────────────────────────────────────────────────

/**
 * Minimal ZIP container entry lister. Returns a list of entries:
 *   { name, method, compressedSize, uncompressedSize, localOffset, data }
 * `data` is already decompressed. Throws on unsupported methods or
 * truncated input.
 */
function listZipEntries(absPath, opts = {}) {
  return listZipEntriesFromBuffer(fs.readFileSync(absPath), opts);
}

function listZipEntriesFromBuffer(input, opts = {}) {
  const secure = opts.secure !== false;
  const limits = { ...DEFAULT_CONTAINER_LIMITS, ...(opts.limits || {}) };
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (secure && buf.length > limits.maxContainerBytes) {
    throw new Error(`container exceeds maximum size (${limits.maxContainerBytes} bytes)`);
  }

  // Locate EOCD — search backwards within the 64KiB comment window.
  let eocdOff = -1;
  const minStart = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOff = i;
      break;
    }
  }
  if (eocdOff < 0) throw new Error('not a ZIP/.kdna container (no EOCD)');

  const totalEntries = buf.readUInt16LE(eocdOff + 10);
  const cdOffset = buf.readUInt32LE(eocdOff + 16);
  if (secure && totalEntries > limits.maxEntries) {
    throw new Error(`container has too many entries (${totalEntries} > ${limits.maxEntries})`);
  }

  const entries = [];
  const seenNames = new Set();
  let totalUncompressed = 0;
  let p = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) {
      throw new Error(`bad central-directory entry at offset ${p}`);
    }
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const uncompSize = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const externalAttributes = buf.readUInt32LE(p + 38);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    const normalizedName = secure ? normalizeContainerEntryName(name) : name;

    if (secure) {
      validateContainerEntryMetadata({
        name,
        normalizedName,
        method,
        compressedSize: compSize,
        uncompressedSize: uncompSize,
        externalAttributes,
        seenNames,
        limits,
      });
      totalUncompressed += uncompSize;
      if (totalUncompressed > limits.maxTotalUncompressedBytes) {
        throw new Error(
          `container uncompressed content exceeds maximum (${limits.maxTotalUncompressedBytes} bytes)`,
        );
      }
      seenNames.add(normalizedName);
    }

    if (buf.readUInt32LE(localOff) !== 0x04034b50) {
      throw new Error(`bad local-file-header for entry ${name}`);
    }
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const compStart = localOff + 30 + lNameLen + lExtraLen;
    const comp = buf.slice(compStart, compStart + compSize);

    let data;
    if (method === 0) data = comp;
    else if (method === 8) data = zlib.inflateRawSync(comp);
    else throw new Error(`unsupported compression method ${method} for ${name}`);
    if (secure && data.length !== uncompSize) {
      throw new Error(`entry size mismatch for ${normalizedName}`);
    }

    entries.push({
      name: secure ? normalizedName : name,
      method,
      compressedSize: compSize,
      uncompressedSize: uncompSize,
      localOffset: localOff,
      externalAttributes,
      data,
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readFirstZipEntry(absPath) {
  const buf = fs.readFileSync(absPath);
  let eocdOff = -1;
  const minStart = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minStart; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOff = i;
      break;
    }
  }
  if (eocdOff < 0) throw new Error('not a ZIP/.kdna container (no EOCD)');
  const totalEntries = buf.readUInt16LE(eocdOff + 10);
  if (totalEntries === 0) throw new Error('empty ZIP/.kdna container');
  const cdOffset = buf.readUInt32LE(eocdOff + 16);
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) {
    throw new Error(`bad central-directory entry at offset ${cdOffset}`);
  }
  const method = buf.readUInt16LE(cdOffset + 10);
  const compSize = buf.readUInt32LE(cdOffset + 20);
  const uncompSize = buf.readUInt32LE(cdOffset + 24);
  const nameLen = buf.readUInt16LE(cdOffset + 28);
  const extraLen = buf.readUInt16LE(cdOffset + 30);
  const localOff = buf.readUInt32LE(cdOffset + 42);
  const name = buf.slice(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');
  if (buf.readUInt32LE(localOff) !== 0x04034b50) {
    throw new Error(`bad local-file-header for entry ${name}`);
  }
  const lNameLen = buf.readUInt16LE(localOff + 26);
  const lExtraLen = buf.readUInt16LE(localOff + 28);
  const compStart = localOff + 30 + lNameLen + lExtraLen;
  const comp = buf.slice(compStart, compStart + compSize);
  const data = method === 0 ? comp : method === 8 ? zlib.inflateRawSync(comp) : Buffer.alloc(0);
  return { name, method, compressedSize: compSize, uncompressedSize: uncompSize, localOffset: localOff, extraLen, data };
}

function normalizeContainerEntryName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('container entry has an empty name');
  }
  const normalized = name.normalize('NFC');
  if (normalized !== name) {
    throw new Error(`container entry uses a non-canonical Unicode name: ${name}`);
  }
  if (normalized.includes('\\')) {
    throw new Error(`container entry uses backslash path separators: ${name}`);
  }
  if (normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) {
    throw new Error(`container entry uses an absolute path: ${name}`);
  }
  const parts = normalized.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) {
    throw new Error(`container entry uses an unsafe relative path: ${name}`);
  }
  return normalized;
}

function validateContainerEntryMetadata(entry) {
  const {
    name,
    normalizedName,
    method,
    compressedSize,
    uncompressedSize,
    externalAttributes,
    seenNames,
    limits,
  } = entry;

  if (seenNames.has(normalizedName)) {
    throw new Error(`container has duplicate entry: ${normalizedName}`);
  }
  const topLevel = normalizedName.split('/')[0];
  if (!ALLOWED_TOP_LEVEL_ENTRIES.has(topLevel)) {
    if (FORBIDDEN_LEGACY_TOP_LEVEL.has(topLevel)) {
      throw new Error(`container includes forbidden top-level source entry: ${topLevel}`);
    }
    throw new Error(`container includes unsupported top-level entry: ${topLevel}`);
  }
  if ((topLevel === 'signatures' || topLevel === 'attachments') && normalizedName === topLevel) {
    throw new Error(`container directory entry is not supported: ${name}`);
  }
  if (method !== 0 && method !== 8) {
    throw new Error(`unsupported compression method ${method} for ${normalizedName}`);
  }
  if (uncompressedSize > limits.maxEntryBytes) {
    throw new Error(`container entry ${normalizedName} exceeds maximum size (${limits.maxEntryBytes} bytes)`);
  }
  if (compressedSize > 0 && uncompressedSize / compressedSize > limits.maxCompressionRatio) {
    throw new Error(`container entry ${normalizedName} exceeds maximum compression ratio`);
  }

  const mode = externalAttributes >>> 16;
  const type = mode & 0o170000;
  const symlink = type === 0o120000;
  const deviceOrSpecial = type === 0o020000 || type === 0o060000 || type === 0o010000 || type === 0o140000;
  if (symlink || deviceOrSpecial) {
    throw new Error(`container entry ${normalizedName} has unsupported file attributes`);
  }
}

/**
 * CRC-32 (IEEE 802.3) used by ZIP.
 */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ZIP epoch: 1980-01-01 00:00:00 — fixed so pack is deterministic.
const DOS_EPOCH = Object.freeze({ time: 0, date: 1 });

function buildLocalHeader(nameBytes, data, method) {
  const compressed = method === 8 ? zlib.deflateRawSync(data) : data;
  const crc = crc32(data);
  const { time, date } = DOS_EPOCH;
  const local = Buffer.alloc(30 + nameBytes.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(0, 28);
  nameBytes.copy(local, 30);
  return { local, compressed, crc, time, date, dataLength: data.length };
}

function buildCentral(entry, nameBytes) {
  const c = Buffer.alloc(46 + nameBytes.length);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0, 8);
  c.writeUInt16LE(entry.method, 10);
  c.writeUInt16LE(entry.time, 12);
  c.writeUInt16LE(entry.date, 14);
  c.writeUInt32LE(entry.crc, 16);
  c.writeUInt32LE(entry.compressed.length, 20);
  c.writeUInt32LE(entry.dataLength, 24);
  c.writeUInt16LE(nameBytes.length, 28);
  c.writeUInt16LE(0, 30);
  c.writeUInt16LE(0, 32);
  c.writeUInt16LE(0, 34);
  c.writeUInt16LE(0, 36);
  c.writeUInt32LE(0, 38);
  c.writeUInt32LE(entry.offset, 42);
  nameBytes.copy(c, 46);
  return c;
}

/**
 * Collect a directory's files deterministically. Skips junk like
 * .DS_Store, .git, node_modules, the user's own output dir, etc.
 */
function listSourceDir(dir, opts = {}) {
  const skip = new Set(['.DS_Store', '.git', '.gitignore', 'node_modules', 'Thumbs.db']);
  if (opts.skipNames) for (const n of opts.skipNames) skip.add(n);
  const out = [];
  function walk(base) {
    for (const name of fs.readdirSync(base)) {
      if (skip.has(name)) continue;
      const full = path.join(base, name);
      const rel = path.relative(dir, full).split(path.sep).join('/');
      if (rel.startsWith('..')) continue; // defensive
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (st.isFile()) {
        out.push({ rel, full });
      }
    }
  }
  walk(dir);
  out.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  return out;
}

// ─── Read layout from either source dir or container ───────────────────────

/**
 * Read a layout layout (source dir or .kdna container) and return a single
 * normalized map of { mimetype, kdna.json, payload.kdnab, checksums.json? }.
 * `where` describes the origin for error messages.
 *
 * Throws an Error with a clear, content-neutral message if the layout
 * is malformed (missing entry, wrong mimetype, etc.).
 */
function readLayout(absPath) {
  let stat;
  try {
    stat = fs.statSync(absPath);
  } catch {
    throw new Error(`path not found: ${absPath}`);
  }

  const map = {};
  let entries = null; // ZIP entries if container
  let kind; // 'dir' | 'file'
  let containerBytes = null;

  if (stat.isDirectory()) {
    kind = 'dir';
    for (const f of REQUIRED_DIR_ENTRIES) {
      const full = path.join(absPath, f);
      if (!fs.existsSync(full)) {
        throw new Error(`not a KDNA authoring source directory: missing ${f}`);
      }
      if (fs.lstatSync(full).isSymbolicLink()) {
        throw new Error(`not a KDNA authoring source directory: ${f} must not be a symlink`);
      }
    }
    for (const f of [...REQUIRED_DIR_ENTRIES, ...OPTIONAL_DIR_ENTRIES]) {
      const full = path.join(absPath, f);
      if (fs.existsSync(full)) {
        if (fs.statSync(full).isFile()) {
          map[f] = fs.readFileSync(full);
        } else {
          // subdirectory like signatures/ — record its presence but not contents here
          map[f] = null;
        }
      }
    }
  } else if (stat.isFile()) {
    kind = 'file';
    // Open once so parsing and the whole-file digest come from the same
    // immutable snapshot, without a path-level TOCTOU window.
    containerBytes = fs.readFileSync(absPath);
    entries = listZipEntriesFromBuffer(containerBytes);
    for (const e of entries) {
      // We only need the well-known entries; signatures/ attachments/ etc.
      // are passed through unchanged by the loader but not parsed here.
      if (
        e.name === 'mimetype' ||
        e.name === 'kdna.json' ||
        e.name === 'payload.kdnab' ||
        e.name === 'checksums.json'
      ) {
        map[e.name] = e.data;
      }
    }
  } else {
    throw new Error(`not a file or directory: ${absPath}`);
  }

  const containerDigest = kind === 'file'
    ? `sha256:${crypto.createHash('sha256').update(containerBytes).digest('hex')}`
    : null;

  return finalizeV1Layout({ kind, map, entries, containerDigest });
}

function finalizeV1Layout({ kind, map, entries, containerDigest }) {
  if (kind !== 'dir' && (!entries || entries.length === 0 || entries[0].name !== 'mimetype')) {
    throw new Error('not a KDNA Asset Container: first entry is not mimetype');
  }
  if (kind !== 'dir' && entries[0].method !== 0) {
    throw new Error('not a KDNA Asset Container: mimetype must be uncompressed');
  }
  for (const required of REQUIRED_DIR_ENTRIES) {
    if (!map[required]) {
      const source = kind === 'dir' ? 'KDNA authoring source directory' : 'KDNA Asset Container';
      throw new Error(`not a ${source}: missing ${required}`);
    }
  }

  const mime = map.mimetype.toString('utf8');
  if (mime !== MIMETYPE) {
    throw new Error(`not a KDNA layout: mimetype is "${mime}", expected "${MIMETYPE}"`);
  }

  let manifest;
  try {
    manifest = parseJsonEntry('kdna.json', map['kdna.json']);
  } catch (e) {
    throw new Error(`kdna.json is not valid JSON: ${e.message}`, { cause: e });
  }
  if (manifest.lineage !== undefined && Array.isArray(manifest.lineage)) {
    throw new Error('kdna.json.lineage must be an object, not an array');
  }

  return { kind, map, manifest, entries, containerDigest };
}

function readLayoutBytes(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const entries = listZipEntriesFromBuffer(bytes);
  const map = {};
  for (const entry of entries) {
    if (
      entry.name === 'mimetype' ||
      entry.name === 'kdna.json' ||
      entry.name === 'payload.kdnab' ||
      entry.name === 'checksums.json'
    ) {
      map[entry.name] = entry.data;
    }
  }
  return finalizeV1Layout({
    kind: 'memory',
    map,
    entries,
    containerDigest: `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`,
  });
}

function readInputLayout(input) {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return readLayoutBytes(input);
  }
  return readLayout(path.resolve(input));
}

function snapshotPackagedInput(input) {
  if (Buffer.isBuffer(input) || input instanceof Uint8Array) {
    return Buffer.from(input);
  }
  if (typeof input !== 'string') return input;
  const resolved = path.resolve(input);
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch {
    return input;
  }
  // Authoring directories remain available to inspect/validate. Runtime
  // wrappers reject them; this helper only freezes packaged-file loads.
  return stat.isFile() ? fs.readFileSync(resolved) : input;
}

function inputSource(input, kind) {
  return {
    kind,
    path: typeof input === 'string' ? path.resolve(input) : null,
  };
}

function parseJsonEntry(name, bytes, opts = {}) {
  if (!Buffer.isBuffer(bytes)) {
    throw new Error(`${name} is not a file entry`);
  }
  const limits = { ...DEFAULT_CONTAINER_LIMITS, ...(opts.limits || {}) };
  if (bytes.length > limits.maxEntryBytes) {
    throw new Error(`${name} exceeds maximum size (${limits.maxEntryBytes} bytes)`);
  }
  const parsed = JSON.parse(bytes.toString('utf8'));
  assertJsonWithinLimits(parsed, name, limits);
  return parsed;
}

function assertJsonWithinLimits(value, name, limits) {
  function walk(node, depth) {
    if (depth > limits.maxJsonDepth) {
      throw new Error(`${name} exceeds maximum JSON depth (${limits.maxJsonDepth})`);
    }
    if (typeof node === 'string') {
      if (node.length > limits.maxJsonStringLength) {
        throw new Error(`${name} contains a string exceeding ${limits.maxJsonStringLength} characters`);
      }
      return;
    }
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      if (node.length > limits.maxJsonArrayLength) {
        throw new Error(`${name} contains an array exceeding ${limits.maxJsonArrayLength} items`);
      }
      for (const item of node) walk(item, depth + 1);
      return;
    }
    for (const child of Object.values(node)) walk(child, depth + 1);
  }
  walk(value, 0);
}

function parsePayloadEntry(name, bytes, opts = {}) {
  if (!Buffer.isBuffer(bytes)) {
    throw new Error(`${name} is not a file entry`);
  }
  const limits = { ...DEFAULT_CONTAINER_LIMITS, ...(opts.limits || {}) };
  if (bytes.length > limits.maxEntryBytes) {
    throw new Error(`${name} exceeds maximum size (${limits.maxEntryBytes} bytes)`);
  }
  let parsed;
  try {
    parsed = cbor.decode(bytes);
  } catch {
    throw new Error(`${name}: not valid CBOR. payload.kdnab must be CBOR-encoded (format 0.1.0).`);
  }
  assertJsonWithinLimits(parsed, name, limits);
  return parsed;
}

// ─── inspect ───────────────────────────────────────────────────────────

/**
 * Print a content-neutral manifest summary. Always JSON. Never emits
 * the words trusted / recommended / high_quality / officially_approved.
 */
function buildInspectOutput(container) {
  const m = container.manifest;
  const out = {
    format_version: m.format_version ?? null,
    asset_id: m.asset_id ?? null,
    asset_uid: m.asset_uid ?? null,
    asset_type: m.asset_type ?? null,
    title: m.title ?? null,
    version: m.version ?? null,
    judgment_version: m.judgment_version ?? null,
    payload: m.payload ? m.payload.path : null,
    payload_encrypted: m.payload ? m.payload.encrypted : null,
    profile: m.compatibility ? m.compatibility.profile : null,
    load_contract_default_profile: m.load_contract ? m.load_contract.default_profile : null,
  };
  if (m.signatures !== undefined) out.signature_count = Array.isArray(m.signatures) ? m.signatures.length : 0;
  if (container.map['checksums.json']) out.checksums_present = true;
  return out;
}

// ─── validate ──────────────────────────────────────────────────────────

/**
 * Run structural + JSON-Schema checks. Returns a result object that
 * reports each gate independently. Never includes trust / recommended
 * / high_quality / officially_approved as a positive claim.
 */
function runValidate(layout) {
  const result = {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: true,
    load_contract_valid: true,
  };
  const problems = [];

  // format gate — already proven by readLayout, but we re-state the gates
  // so the report matches the spec.
  for (const f of REQUIRED_DIR_ENTRIES) {
    if (!layout.map[f]) {
      result.format_valid = false;
      problems.push(`format: missing required entry ${f}`);
    }
  }
  if (layout.map.mimetype) {
    const mimeStr = layout.map.mimetype.toString('utf8');
    if (mimeStr !== MIMETYPE) {
      result.format_valid = false;
      problems.push(`format: mimetype is not ${MIMETYPE}`);
    }
  }

  // schema gate — kdna.json against manifest.schema.json
  const validators = loadSchemas();
  if (!validators) {
    result.schema_valid = false;
    problems.push(
      'schema: KDNA Core requires ajv and ajv-formats for JSON-Schema validation. Run: npm install ajv ajv-formats (or: npm install -g ajv ajv-formats for global CLI users)',
    );
    return finalizeValidate(result, problems);
  }
  if (!validators.manifest(layout.manifest)) {
    result.schema_valid = false;
    for (const err of validators.manifest.errors) {
      problems.push(`manifest: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }

  // Known pre-1.0 aliases are not extension fields. Rejecting them here keeps
  // the current layout validator as the single manifest authority while allowing
  // genuinely namespaced/forward-compatible manifest extensions.
  const removedAliases = {
    kdna_spec: 'format_version',
    kdna_version: 'format_version',
    spec_version: 'format_version',
  };
  for (const [field, replacement] of Object.entries(removedAliases)) {
    if (Object.prototype.hasOwnProperty.call(layout.manifest, field)) {
      result.schema_valid = false;
      problems.push(`kdna.json: ${field} is not allowed. Use ${replacement}.`);
    }
  }

  // payload gate — payload.kdnab against payload-profile.schema.json
  // For actually encrypted payloads (envelopes), skip schema validation.
  let payload;
  try {
    payload = parsePayloadEntry("payload.kdnab", layout.map['payload.kdnab']);
  } catch (e) {
    result.payload_valid = false;
    problems.push(`payload: not valid KDNA payload (${e.message})`);
    return finalizeValidate(result, problems);
  }

  const isEncryptedPayload = payload.profile
    && payload.ciphertext
    && (layout.manifest.payload?.encrypted || layout.manifest.encryption?.encrypted_entries?.includes('payload.kdnab'));

  if (isEncryptedPayload) {
    // Encrypted payload — verify it's a proper encryption envelope, not plaintext.
    const encProfile = layout.manifest.encryption?.profile;
    if (encProfile && payload.profile !== encProfile) {
      result.payload_valid = false;
      problems.push(`payload: encrypted envelope profile ${payload.profile || 'unknown'} does not match manifest encryption profile ${encProfile}`);
    }
    let hasKeyMaterial = !!payload.wrapped_key || (Array.isArray(payload.key_slots) && payload.key_slots.length > 0);
    if (payload.profile === EXTERNAL_ENVELOPE_PROFILE) {
      try {
        validateExternalEnvelope(payload);
        hasKeyMaterial = true;
      } catch (error) {
        result.payload_valid = false;
        problems.push(`payload: ${error.message}`);
      }
    }
    if (!payload.profile || !payload.ciphertext || !hasKeyMaterial) {
      result.payload_valid = false;
      problems.push('payload: encrypted envelope missing required fields (profile/ciphertext/key material)');
    }
    // Encrypted payload passes payload gate if envelope is structurally valid.
  } else {
    // Plaintext payload — full schema validation.
    const isBundleProfile = layout.manifest.compatibility?.profile === 'kdna.payload.bundle' || layout.manifest.asset_type === 'bundle';
    const payloadValidator = isBundleProfile ? validators.bundlePayload : validators.payload;
    if (!payloadValidator(payload)) {
      result.payload_valid = false;
      for (const err of payloadValidator.errors) {
        problems.push(`payload: ${err.instancePath || '<root>'} ${err.message}`);
      }
    }
  }

  // checksums gate — checksums.json against checksums.schema.json
  if (layout.map['checksums.json']) {
    let checks;
    try {
      checks = parseJsonEntry('checksums.json', layout.map['checksums.json']);
    } catch (e) {
      result.checksums_valid = false;
      problems.push(`checksums: not valid JSON (${e.message})`);
    }
    if (checks && !validators.checksums(checks)) {
      result.checksums_valid = false;
      for (const err of validators.checksums.errors) {
        problems.push(`checksums: ${err.instancePath || '<root>'} ${err.message}`);
      }
    }
    // Digest matching verification — compute actual hashes and compare.
    if (checks) {
      result.checksums_valid = verifyDigests(checks, layout.map, problems, result);
    }
  }

  // load_contract gate — only if manifest references a load_contract block
  if (layout.manifest.load_contract) {
    const lc = layout.manifest.load_contract;
    const validLc = _ajv.getSchema('load-contract.schema.json');
    if (validLc && !validLc(lc)) {
      result.load_contract_valid = false;
      for (const err of validLc.errors) {
        problems.push(`load_contract: ${err.instancePath || '<root>'} ${err.message}`);
      }
    }
  } else {
    // No load_contract → nothing to validate. We don't fail the gate.
    result.load_contract_valid = true;
  }

  return finalizeValidate(result, problems);
}

function verifyDigests(checksums, map, problems, result) {
  const digestMetadataPresent =
    checksums.digest_profile !== undefined ||
    checksums.digest_profile_version !== undefined ||
    checksums.covered_entries !== undefined;
  if (digestMetadataPresent) {
    const requiredDigestFields = [
      'digest_profile',
      'digest_profile_version',
      'covered_entries',
      'manifest_digest',
      'payload_digest',
      'entry_set_digest',
    ];
    const missingDigestFields = requiredDigestFields.filter(
      (field) => checksums[field] === undefined,
    );
    if (missingDigestFields.length) {
      problems.push(
        `checksums: kdna.digest-basis.runtime-entry-set metadata requires ${missingDigestFields.join(', ')}`,
      );
      result.checksums_valid = false;
      return false;
    }
    if (checksums.digest_profile !== 'kdna.digest-basis.runtime-entry-set') {
      problems.push('checksums: unsupported digest_profile (expected kdna.digest-basis.runtime-entry-set)');
      result.checksums_valid = false;
      return false;
    }
    if (checksums.digest_profile_version !== '0.1.0') {
      problems.push('checksums: unsupported digest_profile_version (expected 0.1.0)');
      result.checksums_valid = false;
      return false;
    }
    const coveredEntries = checksums.covered_entries;
    if (
      !Array.isArray(coveredEntries)
      || coveredEntries.length !== 2
      || coveredEntries[0] !== 'kdna.json'
      || coveredEntries[1] !== 'payload.kdnab'
    ) {
      problems.push('checksums: covered_entries does not match kdna.digest-basis.runtime-entry-set');
      result.checksums_valid = false;
      return false;
    }
  }
  const algo = checksums.algorithm || 'sha256';
  if (algo !== 'sha256') {
    problems.push(`checksums: unsupported digest algorithm ${algo} (supported: sha256)`);
    result.checksums_valid = false;
    return;
  }
  const entryMap = {
    manifest_digest: 'kdna.json',
    payload_digest: 'payload.kdnab',
  };
  const entryDigests = {};
  let stillValid = true;
  for (const [digestKey, entryName] of Object.entries(entryMap)) {
    const declared = checksums[digestKey];
    if (!declared) continue;
    if (!map[entryName]) {
      problems.push(`checksums: ${digestKey} references missing entry ${entryName}`);
      stillValid = false;
      continue;
    }
    const entryBytes = map[entryName];
    const actual = crypto.createHash('sha256').update(entryBytes).digest('hex');
    entryDigests[entryName] = actual;
    const expected = declared.replace(/^sha256:/, '');
    if (actual !== expected) {
      problems.push(`checksums: ${digestKey} mismatch (declared ${expected.slice(0, 8)}..., actual ${actual.slice(0, 8)}...)`);
      stillValid = false;
    }
  }
  const declaredEntrySetDigest = checksums.entry_set_digest;
  if (declaredEntrySetDigest) {
    const expectedEntrySetDigest = declaredEntrySetDigest.replace(/^sha256:/, '');
    const missingAssetInputs = ['kdna.json', 'payload.kdnab'].filter((entryName) => !entryDigests[entryName]);
    if (missingAssetInputs.length) {
      problems.push(`checksums: entry_set_digest cannot be verified without ${missingAssetInputs.join(', ')}`);
      stillValid = false;
    } else {
      const actualEntrySetDigest = computeRuntimeEntrySetDigest(
        map['kdna.json'],
        map['payload.kdnab'],
      ).slice('sha256:'.length);
      if (actualEntrySetDigest !== expectedEntrySetDigest) {
        problems.push(
          `checksums: entry_set_digest mismatch (declared ${expectedEntrySetDigest.slice(0, 8)}..., actual ${actualEntrySetDigest.slice(0, 8)}...)`,
        );
        stillValid = false;
      }
    }
  }
  if (!stillValid) result.checksums_valid = false;
  return stillValid;
}

function finalizeValidate(result, problems) {
  result.overall_valid =
    result.format_valid &&
    result.schema_valid &&
    result.payload_valid &&
    result.checksums_valid &&
    result.load_contract_valid;
  result.problems = problems;
  return result;
}

function digestEntry(sourceDir, entry) {
  const entryPath = path.join(sourceDir, entry);
  if (!fs.existsSync(entryPath)) {
    throw new Error(`cannot build checksums: missing required entry ${entry}`);
  }
  const bytes = fs.readFileSync(entryPath);
  return {
    algorithm: 'sha256',
    value: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
}

function computeRuntimeEntrySetDigest(manifestBytes, payloadBytes) {
  if (
    (!Buffer.isBuffer(manifestBytes) && !(manifestBytes instanceof Uint8Array))
    || (!Buffer.isBuffer(payloadBytes) && !(payloadBytes instanceof Uint8Array))
  ) {
    const error = new Error(
      'E requires raw uncompressed kdna.json and payload.kdnab bytes.',
    );
    error.code = 'KDNA_DIGEST_INPUT_INVALID';
    throw error;
  }
  const entries = {
    'kdna.json': crypto.createHash('sha256').update(manifestBytes).digest('hex'),
    'payload.kdnab': crypto.createHash('sha256').update(payloadBytes).digest('hex'),
  };
  const combined = Object.keys(entries)
    .sort()
    .map((name) => `${name}:${entries[name]}`)
    .join('\n');
  return `sha256:${crypto.createHash('sha256').update(combined).digest('hex')}`;
}

function buildChecksums(sourceDir) {
  const absSrc = path.resolve(sourceDir);
  if (!fs.existsSync(absSrc) || !fs.statSync(absSrc).isDirectory()) {
    throw new Error(`not a directory: ${absSrc}`);
  }

  const entries = {
    'kdna.json': digestEntry(absSrc, 'kdna.json'),
    'payload.kdnab': digestEntry(absSrc, 'payload.kdnab'),
  };
  const entrySetDigest = computeRuntimeEntrySetDigest(
    fs.readFileSync(path.join(absSrc, 'kdna.json')),
    fs.readFileSync(path.join(absSrc, 'payload.kdnab')),
  );
  return {
    digest_profile: 'kdna.digest-basis.runtime-entry-set',
    digest_profile_version: '0.1.0',
    covered_entries: ['kdna.json', 'payload.kdnab'],
    algorithm: 'sha256',
    manifest_digest: `sha256:${entries['kdna.json'].value}`,
    payload_digest: `sha256:${entries['payload.kdnab'].value}`,
    entry_set_digest: entrySetDigest,
    entries,
  };
}

// ─── pack ──────────────────────────────────────────────────────────────

/**
 * Pack an authoring source directory into a .kdna asset. Output is
 * deterministic: the same source directory packed twice produces
 * byte-identical output (fixed DOS timestamps, fixed entry order,
 * mimetype first).
 */
function pack(sourceDir, outputPath) {
  const absSrc = path.resolve(sourceDir);
  if (!fs.existsSync(absSrc) || !fs.statSync(absSrc).isDirectory()) {
    throw new Error(`not a directory: ${absSrc}`);
  }
  for (const f of REQUIRED_DIR_ENTRIES) {
    if (!fs.existsSync(path.join(absSrc, f))) {
      throw new Error(`cannot pack: missing required entry ${f}`);
    }
  }
  const mime = fs.readFileSync(path.join(absSrc, 'mimetype'), 'utf8');
  if (mime !== MIMETYPE) {
    throw new Error(`cannot pack: mimetype is "${mime}", expected "${MIMETYPE}"`);
  }

  // Collect deterministically; mimetype is forced first.
  const collected = listSourceDir(absSrc);
  for (const entry of collected) {
    const normalizedName = normalizeContainerEntryName(entry.rel);
    const topLevel = normalizedName.split('/')[0];
    if (!ALLOWED_TOP_LEVEL_ENTRIES.has(topLevel)) {
      if (FORBIDDEN_LEGACY_TOP_LEVEL.has(topLevel)) {
        throw new Error(`cannot pack forbidden top-level source entry: ${topLevel}`);
      }
      throw new Error(`cannot pack unsupported top-level entry: ${topLevel}`);
    }
  }
  const order = ['mimetype', ...collected.map((e) => e.rel).filter((n) => n !== 'mimetype')];

  // Build the ZIP body.
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  for (const rel of order) {
    let data;
    if (rel === 'mimetype') {
      data = Buffer.from(MIMETYPE, 'utf8');
    } else {
      const found = collected.find((e) => e.rel === rel);
      if (!found) continue;
      data = fs.readFileSync(found.full);
    }
    const nameBytes = Buffer.from(rel, 'utf8');
    const method = rel === 'mimetype' ? 0 : 8;
    const built = buildLocalHeader(nameBytes, data, method);
    localChunks.push(built.local, built.compressed);
    centralChunks.push(
      buildCentral(
        {
          method,
          crc: built.crc,
          time: built.time,
          date: built.date,
          compressed: built.compressed,
          dataLength: built.dataLength,
          offset,
        },
        nameBytes,
      ),
    );
    offset += built.local.length + built.compressed.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(order.length, 8);
  eocd.writeUInt16LE(order.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralOffset, 16);
  eocd.writeUInt16LE(0, 20);

  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.concat([...localChunks, ...centralChunks, eocd]));
  return { outputPath, entries: order };
}

// ─── unpack ────────────────────────────────────────────────────────────

/**
 * Unpack a layout .kdna container to a directory. Refuses path traversal.
 * Does not auto-execute any entry.
 */
function unpack(inputPath, outputDir) {
  const absIn = path.resolve(inputPath);
  if (!fs.existsSync(absIn) || !fs.statSync(absIn).isFile()) {
    throw new Error(`not a file: ${absIn}`);
  }
  const entries = listZipEntries(absIn);
  // Sanity: the asset must have mimetype as its first, uncompressed entry.
  if (entries.length === 0 || entries[0].name !== 'mimetype') {
    throw new Error('not a KDNA container: first entry is not mimetype');
  }
  if (entries[0].method !== 0) {
    throw new Error('not a KDNA container: mimetype must be uncompressed');
  }
  const mime = entries[0].data.toString('utf8');
  if (mime !== MIMETYPE) {
    throw new Error(
      `not a KDNA container: mimetype is "${mime}", expected "${MIMETYPE}"`,
    );
  }
  const absOut = path.resolve(outputDir);
  fs.mkdirSync(absOut, { recursive: true });
  const written = [];
  for (const e of entries) {
    const dest = path.join(absOut, e.name);
    const rel = path.relative(absOut, dest);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new Error(`refusing to write outside target: ${e.name}`);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, e.data);
    written.push(e.name);
  }
  return { outputDir: absOut, entries: written };
}

// ─── Public router entry points ────────────────────────────────────────

function inspect(inputPath, _opts = {}) {
  const layout = readInputLayout(inputPath);
  const out = buildInspectOutput(layout);
  // Guard against accidental forbidden wording in any future field additions.
  assertNoForbiddenTerms(out);
  return out;
}

function validate(inputPath, _opts = {}) {
  const layout = readInputLayout(inputPath);
  return runValidate(layout);
}

function normalizeAccess(access) {
  const value = access || 'public';
  if (value === 'open') return { access: 'public', alias: value };
  if (value === 'protected') return { access: 'licensed', alias: value };
  if (value === 'runtime') return { access: 'remote', alias: value };
  return { access: value, alias: null };
}

function inferEntitlementProfile(manifest) {
  if (manifest.entitlement && typeof manifest.entitlement.profile === 'string') {
    return manifest.entitlement.profile;
  }
  if (manifest.encryption && manifest.encryption.profile === 'kdna.encryption.password') {
    return 'password';
  }
  if (manifest.encryption && manifest.encryption.profile === 'kdna.encryption.password.scrypt') {
    return 'password';
  }
  if (manifest.access === 'protected') return 'password';
  return null;
}

function buildLoadPlanIssue(code, severity, message) {
  return { code, severity, message };
}

function validationProblemCode(problem) {
  if (/checksums?:/i.test(problem)) return 'KDNA_INTEGRITY_DIGEST_FAILED';
  if (/signature/i.test(problem)) return 'KDNA_INTEGRITY_SIGNATURE_FAILED';
  if (/payload:/i.test(problem)) return 'KDNA_FORMAT_INVALID';
  if (/manifest:/i.test(problem)) return 'KDNA_FORMAT_INVALID';
  if (/load_contract:/i.test(problem)) return 'KDNA_FORMAT_INVALID';
  return 'KDNA_FORMAT_INVALID';
}

function finalizeLoadPlan(plan) {
  assertNoForbiddenTerms(plan);
  return plan;
}

function computeSourceFingerprint(_inputPath, layout) {
  // Fingerprint the logical entries, not the transport ZIP bytes. DEFLATE
  // output can differ between zlib versions and operating systems even when
  // every uncompressed KDNA entry is identical. LoadPlan conformance must be
  // stable across JS, Swift, CI runners, and repackaging transports.
  const hash = crypto.createHash('sha256');
  for (const name of Object.keys(layout.map).sort()) {
    const bytes = layout.map[name];
    hash.update(name);
    hash.update('\0');
    hash.update(String(bytes.length));
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
}

function inputFingerprint(inputPath, layout, opts = {}) {
  const allowedEntitlement = new Set(['active', 'expired', 'revoked', 'offline_grace']);
  const entitlementInput = (
    opts.entitlement && allowedEntitlement.has(opts.entitlement.status)
  ) ? opts.entitlement.status : null;

  return {
    has_password_input: opts.hasPassword === true,
    entitlement_input: entitlementInput,
    source_fingerprint: computeSourceFingerprint(inputPath, layout),
  };
}

function baseLoadPlan(inputPath, layout, validation, opts = {}) {
  const manifest = layout.manifest;
  const accessInfo = normalizeAccess(manifest.access);
  const entitlementProfile = inferEntitlementProfile(manifest);
  const asset = {
    asset_id: manifest.asset_id || null,
    asset_uid: manifest.asset_uid || null,
    title: manifest.title || null,
    version: manifest.version || null,
    judgment_version: manifest.judgment_version || null,
  };

  const plan = {
    format_version: manifest.format_version || null,
    asset,
    access: accessInfo.access,
    access_alias: accessInfo.alias,
    entitlement_profile: entitlementProfile,
    state: 'invalid',
    required_action: 'block',
    can_load_now: false,
    projection_policy: 'none',
    input_fingerprint: inputFingerprint(inputPath, layout, opts),
    checks: {
      format_valid: validation.format_valid,
      schema_valid: validation.schema_valid,
      payload_valid: validation.payload_valid,
      checksums_valid: validation.checksums_valid,
      load_contract_valid: validation.load_contract_valid,
      overall_valid: validation.overall_valid,
    },
    issues: [],
    source: {
      kind: layout.kind,
      path: typeof inputPath === 'string' ? path.resolve(inputPath) : null,
    },
  };

  if (accessInfo.alias) {
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_ACCESS_ALIAS',
      'info',
      `Access value "${accessInfo.alias}" is treated as "${accessInfo.access}".`,
    ));
  }

  return plan;
}

// ─── B1: Unified container model → legacy layout layout ─────────────────────

function canonicalToContainerLayout(asset) {
  const map = {};
  if (asset.entries) {
    for (const [name, buf] of asset.entries) {
      map[name] = buf;
    }
  } else {
    map['mimetype'] = Buffer.from(asset.mimetype || '', 'utf8');
    if (asset.manifest) {
      map['kdna.json'] = Buffer.from(JSON.stringify(asset.manifest), 'utf8');
    }
    if (asset.payloadRaw) {
      map['payload.kdnab'] = asset.payloadRaw;
    }
    if (asset.checksums) {
      map['checksums.json'] = Buffer.from(JSON.stringify(asset.checksums), 'utf8');
    }
  }
  return {
    kind: asset.sourceKind,
    map,
    manifest: asset.manifest,
    entries: Object.keys(map),
    containerDigest: asset.containerDigest || null,
  };
}

/**
 * Plan a KDNA runtime load without decrypting or emitting judgment content.
 * Product consumers such as Chat should render authorization UI from this
 * result instead of parsing manifest fields directly.
 */
function planLoad(inputPath, opts = {}) {
  let layout;

  if (Buffer.isBuffer(inputPath) || inputPath instanceof Uint8Array) {
    try {
      layout = readInputLayout(inputPath);
    } catch (e) {
      return finalizeLoadPlan({
        format_version: null,
        asset: { asset_id: null, asset_uid: null, title: null, version: null, judgment_version: null },
        access: null, access_alias: null, entitlement_profile: null,
        state: 'invalid', required_action: 'block', can_load_now: false, projection_policy: 'none',
        input_fingerprint: null,
        checks: { format_valid: false, schema_valid: false, payload_valid: false, checksums_valid: false, load_contract_valid: false, overall_valid: false },
        issues: [buildLoadPlanIssue('KDNA_FORMAT_INVALID', 'blocking', e.message)],
        source: inputSource(inputPath, 'memory'),
      });
    }
  }

  // Try the unified container dispatcher first; the internal compatibility
  // reader below remains available only for authoring and migration tooling.
  if (!layout && readAsset !== null) {
    try {
      const asset = readAsset(path.resolve(inputPath));
      layout = canonicalToContainerLayout(asset);
    } catch (e) {
      // If dispatcher fails, fall back to legacy readLayout for backward compat
      if (e.code === 'KDNA_FORMAT_UNKNOWN' || e.code === 'KDNA_PATH_NOT_FOUND') {
        // let the legacy path handle it
      } else {
        return finalizeLoadPlan({
          format_version: null,
          asset: { asset_id: null, asset_uid: null, title: null, version: null, judgment_version: null },
          access: null, access_alias: null, entitlement_profile: null,
          state: 'invalid', required_action: 'block', can_load_now: false, projection_policy: 'none',
          input_fingerprint: null,
          checks: { format_valid: false, schema_valid: false, payload_valid: false, checksums_valid: false, load_contract_valid: false, overall_valid: false },
          issues: [buildLoadPlanIssue(
            e.code === 'KDNA_FORMAT_UNKNOWN' ? 'KDNA_FORMAT_UNKNOWN' : 'KDNA_FORMAT_INVALID',
            'blocking', e.message,
          )],
          source: inputSource(inputPath, null),
        });
      }
    }
  }

  if (!layout) {
    try {
      layout = readInputLayout(inputPath);
    } catch (e) {
      return finalizeLoadPlan({
        format_version: null,
        asset: { asset_id: null, asset_uid: null, title: null, version: null, judgment_version: null },
        access: null, access_alias: null, entitlement_profile: null,
        state: 'invalid', required_action: 'block', can_load_now: false, projection_policy: 'none',
        input_fingerprint: null,
        checks: { format_valid: false, schema_valid: false, payload_valid: false, checksums_valid: false, load_contract_valid: false, overall_valid: false },
        issues: [buildLoadPlanIssue('KDNA_FORMAT_INVALID', 'blocking', e.message)],
        source: inputSource(inputPath, null),
      });
    }
  }

  const validation = runValidate(layout);
  const plan = baseLoadPlan(inputPath, layout, validation, opts);

  if (!validation.overall_valid) {
    plan.state = 'invalid';
    plan.required_action = 'block';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    for (const problem of validation.problems) {
      plan.issues.push(buildLoadPlanIssue(validationProblemCode(problem), 'blocking', problem));
    }
    return finalizeLoadPlan(plan);
  }

  const manifest = layout.manifest;

  function externalEntitlementMatchesCurrentAsset(entitlement) {
    if (!isVerifiedExternalEntitlement(entitlement) || !entitlement.asset) return false;
    let checksums;
    try {
      checksums = layout.map['checksums.json']
        ? parseJsonEntry('checksums.json', layout.map['checksums.json'])
        : null;
    } catch {
      return false;
    }
    return entitlement.asset.asset_id === (manifest.asset_id || manifest.name)
      && entitlement.asset.asset_uid === manifest.asset_uid
      && entitlement.asset.version === manifest.version
      && entitlement.asset.digest === checksums?.entry_set_digest
      && entitlement.asset.entry_path === manifest.payload?.path;
  }

  function rejectExternalEntitlementMismatch() {
    plan.state = 'invalid';
    plan.required_action = 'block';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_GRANT_ASSET_MISMATCH',
      'blocking',
      'The verified account/device grant is bound to a different asset, version, digest, or encrypted entry.',
    ));
    return finalizeLoadPlan(plan);
  }

  // Resolve dependencies if declared (Story 6)
  const resolvedDeps = [];
  if (manifest.dependencies && typeof manifest.dependencies === 'object' && Object.keys(manifest.dependencies).length > 0) {
    if (typeof opts.resolveAsset === 'function') {
      try {
        const resolved = resolveDependencies(manifest, opts.resolveAsset);
        resolvedDeps.push(...resolved);
      } catch (err) {
        plan.state = 'invalid';
        plan.required_action = 'block';
        plan.can_load_now = false;
        plan.issues.push(buildLoadPlanIssue(
          'KDNA_DEPENDENCY_RESOLUTION_FAILED',
          'blocking',
          err.message
        ));
        return finalizeLoadPlan(plan);
      }
    } else {
      plan.state = 'invalid';
      plan.required_action = 'block';
      plan.can_load_now = false;
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_DEPENDENCY_RESOLVER_MISSING',
        'blocking',
        'Asset has dependencies but no dependency resolver callback was provided.'
      ));
      return finalizeLoadPlan(plan);
    }
  }

  // Resolve extends chain if declared (Story 12)
  // 'extends' is single-inheritance: child overrides parent's cards with same ID.
  // Distinct from 'dependencies' (peer composition).
  if (manifest.extends) {
    const extendsDecl = manifest.extends;
    const extendsName = typeof extendsDecl === 'string'
      ? extendsDecl.replace(/@[^@]+$/, '') || extendsDecl  // strip @version for resolver key
      : extendsDecl.name;
    const extendsVersion = typeof extendsDecl === 'string'
      ? (extendsDecl.match(/@([^@]+)$/) || [])[1] || '*'
      : (extendsDecl.version || '*');

    if (typeof opts.resolveAsset === 'function') {
      try {
        const baseAsset = opts.resolveAsset(extendsName);
        if (!baseAsset) {
          plan.issues.push(buildLoadPlanIssue(
            'KDNA_EXTENDS_NOT_FOUND',
            'warning',
            `Base asset "${extendsName}" declared in 'extends' could not be resolved. Inheritance chain incomplete.`
          ));
        } else if (baseAsset.manifest && !satisfies(baseAsset.version, extendsVersion)) {
          plan.issues.push(buildLoadPlanIssue(
            'KDNA_EXTENDS_VERSION_MISMATCH',
            'warning',
            `Base asset "${extendsName}@${baseAsset.version}" does not satisfy extends range "${extendsVersion}".`
          ));
        } else if (baseAsset.path) {
          plan.extends_chain = [
            { name: extendsName, version: baseAsset.version || extendsVersion, path: baseAsset.path },
          ];
        }
      } catch (err) {
        plan.issues.push(buildLoadPlanIssue(
          'KDNA_EXTENDS_RESOLUTION_FAILED',
          'warning',
          `extends resolution failed: ${err.message}`
        ));
      }
    } else {
      // No resolver: extends chain unresolvable — warn, don't block
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_EXTENDS_RESOLVER_MISSING',
        'warning',
        `Asset declares 'extends: ${JSON.stringify(manifest.extends)}' but no resolver was provided. Inheritance chain will not be applied.`
      ));
    }
  }

  if (resolvedDeps.length > 0) {
    plan.resolved_dependencies = resolvedDeps.map(dep => ({
      name: dep.name,
      version: dep.version,
      path: dep.path
    }));
  }

  const payloadDeclaredEncrypted =
    manifest.payload && manifest.payload.encrypted === true;
  const encryptedEntries = Array.isArray(manifest.encryption && manifest.encryption.encrypted_entries)
    ? manifest.encryption.encrypted_entries
    : [];
  const hasEncryptedPayload = payloadDeclaredEncrypted || encryptedEntries.length > 0;

  if (!['public', 'licensed', 'remote'].includes(plan.access)) {
    const unknownAccess = plan.access;
    plan.access = null;
    plan.state = 'invalid';
    plan.required_action = 'block';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_ACCESS_MODE_UNKNOWN',
      'blocking',
      `Unknown access value "${unknownAccess}".`,
    ));
    return finalizeLoadPlan(plan);
  }

  if (plan.access === 'remote') {
    plan.state = 'needs_runtime';
    plan.required_action = 'connect_runtime';
    plan.can_load_now = false;
    plan.projection_policy = 'remote';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_REMOTE_RUNTIME_REQUIRED',
      'blocking',
      'Remote assets require a runtime projection endpoint.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (plan.access === 'licensed') {
    const knownProfiles = new Set([
      'password',
      'local_receipt',
      'account',
      'org',
      'purchase_receipt',
      'device_bound',
    ]);
    if (plan.entitlement_profile && !knownProfiles.has(plan.entitlement_profile)) {
      plan.state = 'invalid';
      plan.required_action = 'block';
      plan.can_load_now = false;
      plan.projection_policy = 'none';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_ENTITLEMENT_PROFILE_UNKNOWN',
        'blocking',
        `Unknown entitlement profile "${plan.entitlement_profile}".`,
      ));
      return finalizeLoadPlan(plan);
    }

    if (plan.entitlement_profile === 'password') {
      if (opts.password || opts.hasPassword === true) {
        if (opts.hasPassword === true && !opts.password) {
          plan.issues.push(buildLoadPlanIssue(
            'KDNA_AUTH_PASSWORD_DIAGNOSTIC',
            'info',
            'hasPassword is a diagnostic credential-presence signal only; it does not verify the password.',
          ));
        }
        plan.state = 'ready';
        plan.required_action = 'load';
        plan.can_load_now = true;
        plan.projection_policy = 'minimal';
      } else {
        plan.state = 'needs_password';
        plan.required_action = 'enter_password';
        plan.can_load_now = false;
        plan.projection_policy = 'none';
        plan.issues.push(buildLoadPlanIssue(
          'KDNA_AUTH_PASSWORD_REQUIRED',
          'blocking',
          'A password is required before this asset can be loaded.',
        ));
      }
      return finalizeLoadPlan(plan);
    }

    if (plan.entitlement_profile === 'account') {
      if (isVerifiedExternalEntitlement(opts.entitlement)) {
        if (!externalEntitlementMatchesCurrentAsset(opts.entitlement)) {
          return rejectExternalEntitlementMismatch();
        }
        plan.state = opts.entitlement.status === 'offline_grace' ? 'offline_grace' : 'ready';
        plan.required_action = opts.entitlement.status === 'offline_grace' ? 'sync' : 'load';
        plan.can_load_now = true;
        plan.projection_policy = 'minimal';
        if (opts.entitlement.status === 'offline_grace') {
          plan.issues.push(buildLoadPlanIssue(
            'KDNA_AUTH_OFFLINE_GRACE_ACTIVE',
            'warning',
            'The verified device grant can load offline but must sync before grace expires.',
          ));
        }
        return finalizeLoadPlan(plan);
      }
      plan.state = 'needs_account';
      plan.required_action = 'sign_in_or_activate';
      plan.can_load_now = false;
      plan.projection_policy = 'none';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_AUTH_ACCOUNT_REQUIRED',
        'blocking',
        'Account authorization is required before this asset can be loaded.',
      ));
      return finalizeLoadPlan(plan);
    }

    if (plan.entitlement_profile === 'org') {
      if (isVerifiedExternalEntitlement(opts.entitlement)) {
        if (!externalEntitlementMatchesCurrentAsset(opts.entitlement)) {
          return rejectExternalEntitlementMismatch();
        }
        plan.state = opts.entitlement.status === 'offline_grace' ? 'offline_grace' : 'ready';
        plan.required_action = opts.entitlement.status === 'offline_grace' ? 'sync' : 'load';
        plan.can_load_now = true;
        plan.projection_policy = 'minimal';
        return finalizeLoadPlan(plan);
      }
      plan.state = 'needs_org_auth';
      plan.required_action = 'sign_in_or_activate';
      plan.can_load_now = false;
      plan.projection_policy = 'none';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_AUTH_ORG_REQUIRED',
        'blocking',
        'Organization authorization is required before this asset can be loaded.',
      ));
      return finalizeLoadPlan(plan);
    }

    if (opts.entitlement && opts.entitlement.status === 'active') {
      plan.state = 'ready';
      plan.required_action = 'load';
      plan.can_load_now = true;
      plan.projection_policy = 'minimal';
      return finalizeLoadPlan(plan);
    }

    if (opts.entitlement && opts.entitlement.status === 'expired') {
      plan.state = 'expired_grace';
      plan.required_action = 'renew_entitlement';
      plan.can_load_now = false;
      plan.projection_policy = 'none';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_AUTH_EXPIRED',
        'blocking',
        'The entitlement is expired.',
      ));
      return finalizeLoadPlan(plan);
    }

    if (opts.entitlement && opts.entitlement.status === 'revoked') {
      plan.state = 'denied';
      plan.required_action = 'contact_issuer';
      plan.can_load_now = false;
      plan.projection_policy = 'none';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_AUTH_REVOKED',
        'blocking',
        'The entitlement has been revoked.',
      ));
      return finalizeLoadPlan(plan);
    }

    if (opts.entitlement && opts.entitlement.status === 'offline_grace') {
      plan.state = 'offline_grace';
      plan.required_action = 'sync';
      plan.can_load_now = true;
      plan.projection_policy = 'minimal';
      plan.issues.push(buildLoadPlanIssue(
        'KDNA_AUTH_OFFLINE_GRACE_ACTIVE',
        'warning',
        'The entitlement can load during offline grace but must sync before grace expires.',
      ));
      return finalizeLoadPlan(plan);
    }

    plan.state = 'needs_license';
    plan.required_action = plan.entitlement_profile === 'local_receipt' ? 'install_receipt' : 'sign_in_or_activate';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_ENTITLEMENT_REQUIRED',
      'blocking',
      'A valid entitlement is required before this asset can be loaded.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (hasEncryptedPayload) {
    plan.state = 'invalid';
    plan.required_action = 'block';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_CRYPTO_PROFILE_UNSUPPORTED',
      'blocking',
      'Encrypted entries require licensed access.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (opts.entitlement && opts.entitlement.status === 'expired') {
    plan.state = 'expired_grace';
    plan.required_action = 'renew_entitlement';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_EXPIRED',
      'blocking',
      'The entitlement is expired.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (opts.entitlement && opts.entitlement.status === 'revoked') {
    plan.state = 'denied';
    plan.required_action = 'contact_issuer';
    plan.can_load_now = false;
    plan.projection_policy = 'none';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_REVOKED',
      'blocking',
      'The entitlement has been revoked.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (opts.entitlement && opts.entitlement.status === 'offline_grace') {
    plan.state = 'offline_grace';
    plan.required_action = 'sync';
    plan.can_load_now = true;
    plan.projection_policy = 'minimal';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_OFFLINE_GRACE_ACTIVE',
      'warning',
      'The entitlement can load during offline grace but must sync before grace expires.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (opts.entitlement && opts.entitlement.status === 'active') {
    plan.state = 'ready';
    plan.required_action = 'load';
    plan.can_load_now = true;
    plan.projection_policy = 'minimal';
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_ACTIVE_DIAGNOSTIC',
      'info',
      'Entitlement active diagnostic signal acknowledged.',
    ));
    return finalizeLoadPlan(plan);
  }

  if (opts.hasPassword === true && !opts.password) {
    plan.issues.push(buildLoadPlanIssue(
      'KDNA_AUTH_PASSWORD_DIAGNOSTIC',
      'info',
      'hasPassword is a diagnostic credential-presence signal only; it does not verify the password.',
    ));
  }

  plan.state = 'ready';
  plan.required_action = 'load';
  plan.can_load_now = true;
  plan.projection_policy = 'minimal';
  return finalizeLoadPlan(plan);
}

function assertNoForbiddenTerms(obj) {
  const seen = new Set();
  function walk(o) {
    if (o === null || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    for (const k of Object.keys(o)) {
      if (FORBIDDEN_OUTPUT_TERMS.includes(k)) seen.add(k);
      walk(o[k]);
    }
  }
  walk(obj);
  if (seen.size > 0) {
    throw new Error(
      `internal: layout inspect output contains forbidden terms: ${[...seen].join(', ')}`,
    );
  }
}

module.exports = {
  MIMETYPE,
  REQUIRED_DIR_ENTRIES,
  isKdnaSourceDir,
  detectContainerFormat,
  readLayout: readLayout,
  inspect,
  validate,
  planLoad,
  loadAuthorized,
  buildChecksums: buildChecksums,
  computeRuntimeEntrySetDigest,
  pack,
  unpack,
  load: loadAsset,
  loadAsset: loadAsset,
  FORBIDDEN_OUTPUT_TERMS,
  parseSemver,
  compareSemver,
  satisfies,
};

// ─── loadAsset — layout runtime loading / load contract ──────────────────────

function renderPromptItem(item) {
  if (item === undefined || item === null) return '';
  if (typeof item === 'string') return item;
  if (typeof item !== 'object') return String(item);

  if (item.type === 'axiom_applicability' && item.one_sentence) {
    const parts = [item.one_sentence];
    if (Array.isArray(item.applies_when) && item.applies_when.length) {
      parts.push(`applies when: ${item.applies_when.slice(0, 2).join('; ')}`);
    }
    if (Array.isArray(item.does_not_apply_when) && item.does_not_apply_when.length) {
      parts.push(`does not apply when: ${item.does_not_apply_when.slice(0, 2).join('; ')}`);
    }
    if (item.failure_risk) parts.push(`failure risk: ${item.failure_risk}`);
    return parts.join(' — ');
  }
  // Boundary card: kdna-studio writes { id, scope, out_of_scope,
  // acceptable_exceptions }. Render the scope/out-of-scope rule
  // instead of falling through to the UUID `id` (which was the
  // v0.15.0 behavior and made boundaries unreadable in
  // `kdna load --as=prompt`).
  if (
    item.type === 'boundary' ||
    (item.scope !== undefined && item.out_of_scope !== undefined)
  ) {
    const parts = [];
    if (item.scope) parts.push(`in scope: ${sanitizePrompt(item.scope)}`);
    if (item.out_of_scope) parts.push(`out of scope: ${sanitizePrompt(item.out_of_scope)}`);
    if (Array.isArray(item.acceptable_exceptions) && item.acceptable_exceptions.length) {
      parts.push(`exceptions: ${item.acceptable_exceptions.map(sanitizePrompt).join('; ')}`);
    }
    if (parts.length === 0) {
      // Boundary card with empty scope/out_of_scope: surface as
      // "(boundary card with empty scope)" instead of falling through
      // to the UUID `id`. The author should fill in scope/out_of_scope
      // before publishing.
      return '(boundary card with empty scope)';
    }
    return parts.join('; ');
  }
  if (item.boundary && item.one_sentence) return `${item.one_sentence}: ${item.boundary}`;
  if (item.stance) return item.stance;
  if (item.statement) return item.statement;
  if (item.term && item.definition) return `${item.term}: ${item.definition}`;
  if (item.term && item.why) return `${item.term}: ${item.why}`;
  if (item.wrong && item.correct) return `${item.wrong} -> ${item.correct}`;
  if (item.mode && item.correct) return `${item.mode} -> ${item.correct}`;
  // Failure-mode entries from audit fixtures carry `mode` and `correct`
  // but may be one-sided (only `mode`, only `correct`, only `why`).
  // Fall through to a single-side render so the prompt never has
  // `(unrendered card: ...)` for a card that has at least one
  // populated judgment field. Bug (#61).
  if (item.mode) return `failure mode: ${item.mode}`;
  if (item.correct) return `correct: ${item.correct}`;
  if (item.key_distinction) return item.key_distinction;
  if (item.why) return `because: ${item.why}`;
  if (item.name && item.description) return `${item.name}: ${item.description}`;
  if (item.name) return item.name;
  if (item.one_sentence) return item.one_sentence;
  if (item.essence) return item.essence;
  if (item.question) return item.question;
  // Self-check entries are sometimes stored as plain strings, sometimes
  // as { question: "..." } objects, sometimes as { one_sentence: "..." }.
  // The buildPayload path emits `one_sentence` for self_check, so
  // try that before the last-resort fall-through. Bug (#61).
  if (item.text) return item.text;
  // Last-resort fall-through. Returning the id (e.g. "bo_xxxx-...") makes
  // the output unreadable; prefer a note that the card is unrecognized.
  return `(unrendered card: ${item.type || 'unknown'})`;
}

function sanitizePrompt(s) {
  if (s === undefined || s === null) return '';
  if (typeof s === 'string') return s;
  if (Array.isArray(s)) return s.map(sanitizePrompt).join('; ');
  return String(s);
}

function loadAuthorized(inputPath, opts = {}) {
  // A packaged path is read exactly once. Authorization and projection must
  // operate on the same immutable byte snapshot even if the path changes
  // while this synchronous call is in progress.
  const inputKind = typeof inputPath === 'string' ? 'packaged_file' : 'packaged_bytes';
  const inputSnapshot = snapshotPackagedInput(inputPath);
  const plan = planLoad(inputSnapshot, opts);
  if (plan.can_load_now !== true) {
    const issueCodes = Array.isArray(plan.issues)
      ? plan.issues.map((issue) => issue.code).filter(Boolean)
      : [];
    const err = new Error(
      `LoadPlan denied loading: state=${plan.state || 'invalid'} required_action=${plan.required_action || 'block'}`,
    );
    err.code = issueCodes[0] || 'KDNA_LOAD_NOT_AUTHORIZED';
    err.plan = plan;
    throw err;
  }
  const mergedOpts = {
    ...opts,
    resolvedDependencies: plan.resolved_dependencies,
    extendsChain: plan.extends_chain || [],
    _validation: {
      schema_valid: plan.checks && plan.checks.overall_valid === true,
      signature_valid: plan.signature_valid === true,
    },
    _runtimeAssetBytes: inputSnapshot,
    _runtimeInputKind: inputKind,
  };
  return loadAssetUnsafe(inputSnapshot, mergedOpts);
}

function loadAsset(inputPath, opts = {}) {
  return loadAuthorized(inputPath, opts);
}

function normalizeTextList(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function normalizeCompactAxiom(axiom) {
  if (typeof axiom === 'string') {
    return {
      type: 'axiom_applicability',
      statement: axiom,
      one_sentence: axiom,
      applies_when: [],
      does_not_apply_when: [],
      failure_risk: null,
    };
  }
  if (!axiom || typeof axiom !== 'object') return null;
  const statement = axiom.statement || axiom.one_sentence || axiom.full_statement || axiom.id || null;
  if (!statement) return null;
  const oneSentence = (axiom.one_sentence && !String(axiom.one_sentence).startsWith('<TBD')) ? axiom.one_sentence : (typeof axiom.full_statement === 'string' && axiom.full_statement.length > 0 ? axiom.full_statement.substring(0, 120) + (axiom.full_statement.length > 120 ? '…' : '') : statement);
  return {
    type: 'axiom_applicability',
    id: axiom.id || null,
    statement,
    one_sentence: oneSentence,
    applies_when: normalizeTextList(axiom.applies_when),
    does_not_apply_when: normalizeTextList(axiom.does_not_apply_when),
    failure_risk: axiom.failure_risk || null,
  };
}

function judgmentRoleExclusions(role) {
  if (!role || typeof role !== 'object' || Array.isArray(role)) return [];
  if (Array.isArray(role.does_not_act_as)) return role.does_not_act_as;
  return role.does_not_act_as ? [role.does_not_act_as] : [];
}

function hasStandardJudgmentRoleContent(role) {
  if (!role || typeof role !== 'object' || Array.isArray(role)) return false;
  return Boolean(
    role.acts_as || judgmentRoleExclusions(role).length || role.responsibility,
  );
}

function hasCompactPromptContent(content) {
  if (!content) return false;
  return Boolean(
    content.highest_question ||
      (Array.isArray(content.worldview) && content.worldview.length > 0) ||
      (Array.isArray(content.value_order) && content.value_order.length > 0) ||
      hasStandardJudgmentRoleContent(content.judgment_role) ||
      (Array.isArray(content.axioms) && content.axioms.length > 0) ||
      (Array.isArray(content.boundaries) && content.boundaries.length > 0) ||
      (Array.isArray(content.self_checks) && content.self_checks.length > 0) ||
      (Array.isArray(content.failure_modes) && content.failure_modes.length > 0) ||
      (Array.isArray(content.patterns) && content.patterns.length > 0)
  );
}

function loadAssetUnsafe(inputPath, opts = {}) {
  const layout = readInputLayout(inputPath);
  const m = layout.manifest;
  const profile = opts.profile || (m.load_contract ? m.load_contract.default_profile : 'compact') || 'compact';
  const as = opts.as || 'json';

  let payload;
  try {
    const rawPayload = layout.map['payload.kdnab'];
    payload = parsePayloadEntry("payload.kdnab", rawPayload);
  } catch (e) {
    throw new Error(`payload.kdnab is not valid KDNA payload: ${e.message}`, { cause: e });
  }

  if (payload.profile && payload.ciphertext && (m.payload?.encrypted || m.encryption?.encrypted_entries?.includes('payload.kdnab'))) {
    // B4: Attempt decryption when password or decrypt hook is available.
    if (opts.decryptEntry) {
      // Consumer-provided decrypt hook (e.g., licensed entry key)
      try {
        const decrypted = opts.decryptEntry({
          asset: { entries: layout.map, manifest: m },
          manifest: m,
          entryName: 'payload.kdnab',
          ciphertext: layout.map['payload.kdnab'],
        });
        const decryptedBuf = typeof decrypted === 'string'
          ? Buffer.from(decrypted, 'utf8')
          : Buffer.from(decrypted);
        payload = parsePayloadEntry('payload.kdnab', decryptedBuf);
      } catch (e) {
        const err = new Error(`Decryption failed: ${e.message}`);
        err.code = e.code || 'KDNA_DECRYPT_FAILED';
        throw err;
      }
    } else if (opts.password) {
      // Password-based decryption via kdna.encryption.password*
      // profiles. Detects Argon2id vs scrypt from the envelope profile.
      try {
        const {
          decryptProtectedEntry,
          decryptProtectedEntryScrypt,
          PASSWORD_PROTECTED_SCRYPT_PROFILE,
        } = require('../crypto-profile.js');
        const encryptedEnvelope = layout.map['payload.kdnab'];
        let envelope;
        try { envelope = cbor.decode(Buffer.isBuffer(encryptedEnvelope) ? encryptedEnvelope : Buffer.from(encryptedEnvelope)); }
        catch { throw new Error('Cannot decode encrypted envelope: payload.kdnab must be CBOR-encoded (format 0.1.0)'); }
        const decryptFn = (envelope.profile === PASSWORD_PROTECTED_SCRYPT_PROFILE)
          ? decryptProtectedEntryScrypt
          : decryptProtectedEntry;
        const decryptedBuf = decryptFn(encryptedEnvelope, {
          entryName: 'payload.kdnab',
          manifest: m,
          password: opts.password,
        });
        payload = parsePayloadEntry('payload.kdnab', decryptedBuf);
      } catch (e) {
        const err = new Error(`Decryption failed with provided password: ${e.message}`);
        err.code = 'KDNA_DECRYPT_FAILED';
        throw err;
      }
    } else {
      const isExternal = payload.profile === EXTERNAL_ENVELOPE_PROFILE;
      const err = new Error(
        isExternal
          ? 'payload requires a verified account/device external key grant'
          : 'payload is encrypted and cannot be decrypted without an authorized credential',
      );
      err.code = isExternal ? 'KDNA_AUTH_ACCOUNT_REQUIRED' : 'KDNA_AUTH_PASSWORD_REQUIRED';
      throw err;
    }
  }

  // Digest verification — refuse to load if checksums.json is present and digests mismatch.
  if (layout.map['checksums.json']) {
    try {
      const checks = parseJsonEntry('checksums.json', layout.map['checksums.json']);
      const problems = [];
      const ok = verifyDigests(checks, layout.map, problems, {});
      if (!ok) {
        const err = new Error(`checksum verification failed: ${problems.join('; ')}`);
        err.code = 'checksum_mismatch';
        throw err;
      }
    } catch (e) {
      if (e.code === 'checksum_mismatch') throw e;
      // Invalid JSON — already caught by validate, but still refuse to load.
      const err = new Error(`checksums.json is not valid: ${e.message}`);
      err.code = 'checksum_parse_error';
      throw err;
    }
  }

  function availableProfiles() {
    const profiles = [];
    const core = payload.core || {};
    const hasJudgment = (core.axioms && core.axioms.length > 0)
      || (core.boundaries && core.boundaries.length > 0)
      || Boolean(core.highest_question)
      || (Array.isArray(core.worldview) && core.worldview.length > 0)
      || (Array.isArray(core.value_order) && core.value_order.length > 0)
      || hasStandardJudgmentRoleContent(core.judgment_role)
      || (payload.patterns && payload.patterns.length > 0)
      || (payload.reasoning && ((payload.reasoning.self_check && payload.reasoning.self_check.length > 0) || (payload.reasoning.failure_modes && payload.reasoning.failure_modes.length > 0)));
    profiles.push('index');
    if (hasJudgment) profiles.push('compact');
    if (payload.scenarios && payload.scenarios.length > 0) profiles.push('scenario');
    profiles.push('full');
    return profiles;
  }

  const profiles = availableProfiles();
  const result = {
    status: 'loaded',
    profile,
    profile_available: profiles.includes(profile),
    available_profiles: profiles,
    asset_id: m.asset_id,
    title: m.title,
  };

  if (profile === 'index') {
    let maxTokensHint = undefined;
    if (m.load_contract && m.load_contract.profiles && m.load_contract.profiles.compact && m.load_contract.profiles.compact.max_tokens_hint) {
      maxTokensHint = m.load_contract.profiles.compact.max_tokens_hint;
    }
    result.content = { asset_id: m.asset_id, asset_uid: m.asset_uid, title: m.title, version: m.version, judgment_version: m.judgment_version, asset_type: m.asset_type, summary: m.summary || null, language: m.language || null, keywords: m.keywords || [], profiles_available: m.load_contract ? Object.keys(m.load_contract.profiles || {}) : [], max_tokens_hint: maxTokensHint };
  } else if (profile === 'compact') {
    const core = payload.core || {};
    const normalizeList = (items) => (items || []).map((item) => {
      if (typeof item === 'string') return { type: 'text', text: item };
      if (item && typeof item === 'object') return item;
      return null;
    }).filter(Boolean);
    const preserveDeclaredList = (items) => (
      Array.isArray(items)
        ? items.map((item) => (
          typeof item === 'string' ? item : globalThis.structuredClone(item)
        ))
        : []
    );
    result.content = {
      highest_question: core.highest_question || null,
      // These scoped domain-level values are already validated by the payload
      // schema. Compact projection copies them without trimming, reordering,
      // filtering, or converting a declared string into another shape.
      worldview: Array.isArray(core.worldview) ? [...core.worldview] : [],
      value_order: Array.isArray(core.value_order) ? [...core.value_order] : [],
      judgment_role:
        core.judgment_role &&
        typeof core.judgment_role === 'object' &&
        !Array.isArray(core.judgment_role)
          ? JSON.parse(JSON.stringify(core.judgment_role))
          : null,
      axioms: (core.axioms || []).map(normalizeCompactAxiom).filter(Boolean),
      boundaries: normalizeList(core.boundaries),
      // Payload uses the singular field name while Runtime Capsule uses the
      // plural collection name. Preserve every validated item and its shape;
      // strings remain strings and structured questions remain objects.
      self_checks: preserveDeclaredList(payload.reasoning && payload.reasoning.self_check),
      failure_modes: normalizeList(payload.reasoning && payload.reasoning.failure_modes),
      patterns: normalizeList(payload.patterns).slice(0, 3),
    };
    if (m.load_contract && m.load_contract.profiles && m.load_contract.profiles.compact && m.load_contract.profiles.compact.max_tokens_hint) {
      result.max_tokens_hint = m.load_contract.profiles.compact.max_tokens_hint;
    }
  } else if (profile === 'scenario') {
    result.content = { scenarios: payload.scenarios || [] };
  } else if (profile === 'full') {
    result.content = { manifest: m, payload };
  } else {
    throw new Error(`unknown load profile: ${profile}`);
  }

  // Asset inheritance (Story 12): if the manifest declares 'extends' and
  // the plan resolved an extends_chain, load the base asset and merge its
  // content with the child's content. Child cards with the same ID override
  // the parent's; parent cards not overridden are inherited.
  if (opts.extendsChain && opts.extendsChain.length > 0 && result.content) {
    try {
      const base = opts.extendsChain[0];
      const baseLoaded = loadAssetUnsafe(base.path, {
        ...opts,
        resolvedDependencies: [],
        extendsChain: [],
      });
      const baseContent = baseLoaded && (baseLoaded.content || baseLoaded.context);
      if (baseContent) {
        const bc = baseContent;
        const cc = result.content;
        // Merge axioms: child overrides by id; parent axioms not in child are added
        if (bc.axioms || cc.axioms) {
          const childIds = new Set((cc.axioms || []).map((a) => a.id).filter(Boolean));
          const inheritedAxioms = (bc.axioms || []).filter((a) => a.id && !childIds.has(a.id));
          cc.axioms = [...inheritedAxioms, ...(cc.axioms || [])];
        }
        // Merge boundaries: child overrides by scope text; parent not overridden are inherited
        if (bc.boundaries || cc.boundaries) {
          const childScopes = new Set(
            (cc.boundaries || []).map((b) => (b.scope || '').toLowerCase().trim()),
          );
          const inheritedBoundaries = (bc.boundaries || []).filter(
            (b) => !childScopes.has((b.scope || '').toLowerCase().trim()),
          );
          cc.boundaries = [...inheritedBoundaries, ...(cc.boundaries || [])];
        }
        // Inherit highest_question from parent if child doesn't declare one
        if (!cc.highest_question && bc.highest_question) {
          cc.highest_question = bc.highest_question;
        }
        result.extends_chain = opts.extendsChain.map((e) => ({
          name: e.name,
          version: e.version,
          path: e.path,
        }));
        result.inheritance_applied = true;
      }
    } catch {
      // extends merge is best-effort — never block load
      result.inheritance_applied = false;
    }
  }

   if (opts.resolvedDependencies && opts.resolvedDependencies.length > 0) {
    result.resolved_dependencies = opts.resolvedDependencies.map(dep => {
      const depLoaded = loadAssetUnsafe(dep.path, { ...opts, resolvedDependencies: [] });
      // RAG namespace (Story 11): scoped identifier for namespace isolation.
      // Format: name@version (or just name when version is absent).
      const ragNamespace = dep.name
        ? (dep.version ? `${dep.name}@${dep.version}` : dep.name)
        : null;
      return {
        name: dep.name,
        version: dep.version,
        path: dep.path,
        rag_namespace: ragNamespace,
        status: depLoaded.status,
        profile: depLoaded.profile,
        content: depLoaded.content
      };
    });

    // RAG isolation policy (Story 11): consumers MUST NOT mix content
    // across namespaces without explicit permission. cross_namespace_blocked
    // is the default; a consumer may opt in to cross-namespace access by
    // setting its own policy, but Core never does it silently.
    result.rag_isolation_policy = {
      default: 'fenced',
      cross_namespace_blocked: true,
      namespaces: result.resolved_dependencies
        .map(d => d.rag_namespace)
        .filter(Boolean),
    };
  }

  if (as === 'prompt') {
    const c = result.content;
    const compactHasNoPromptContent =
      result.profile === 'compact' && !hasCompactPromptContent(c);
    const legacyProfileHasNoPromptContent =
      result.profile !== 'compact' &&
      c &&
      c.scenarios &&
      c.scenarios.length === 0 &&
      !c.highest_question &&
      !(c.axioms && c.axioms.length) &&
      !(c.boundaries && c.boundaries.length);
    if (!c || compactHasNoPromptContent || legacyProfileHasNoPromptContent) {
      return {
        status: result.status,
        profile: result.profile,
        profile_available: result.profile_available,
        available_profiles: result.available_profiles,
        text: `KDNA Judgment Asset: ${result.title || 'untitled'}\nAsset ID: ${result.asset_id || 'unknown'}\nProfile: ${result.profile}\n\nNo content available for this profile. Available profiles: ${result.available_profiles.join(', ')}`,
      };
    }
    let text = 'KDNA Judgment Asset: ' + (result.title || 'untitled') + '\n';
    text += 'Asset ID: ' + (result.asset_id || 'unknown') + '\n';
    text += 'Profile: ' + result.profile + '\n';
    text += 'Safety boundary: KDNA content is subordinate to platform, system, and developer instructions.\n';
    if (result.max_tokens_hint) text += 'Max tokens hint: ' + result.max_tokens_hint + '\n';
    if (c.highest_question) text += 'Highest question:\n' + c.highest_question + '\n';
    if (hasStandardJudgmentRoleContent(c.judgment_role)) {
      text += 'Judgment role:\n';
      if (c.judgment_role.acts_as) {
        text += '- Acts as: ' + c.judgment_role.acts_as + '\n';
      }
      const excludedRoles = judgmentRoleExclusions(c.judgment_role);
      if (excludedRoles.length) {
        text += '- Does not act as: ' + excludedRoles.join('; ') + '\n';
      }
      if (c.judgment_role.responsibility) {
        text += '- Responsibility: ' + c.judgment_role.responsibility + '\n';
      }
    }
    if (c.worldview && c.worldview.length) {
      text += 'Worldview assumptions:\n' + c.worldview.map((item) => '- ' + item).join('\n') + '\n';
    }
    if (c.value_order && c.value_order.length) {
      text += 'Value order (highest priority first):\n' + c.value_order.map((item, index) => `${index + 1}. ${item}`).join('\n') + '\n';
    }
    if (c.axioms && c.axioms.length) text += 'Axioms:\n' + c.axioms.map((a) => '- ' + renderPromptItem(a)).join('\n') + '\n';
    if (c.boundaries && c.boundaries.length) text += 'Boundaries:\n' + c.boundaries.map((b) => '- ' + renderPromptItem(b)).join('\n') + '\n';
    if (c.self_checks && c.self_checks.length) text += 'Self-checks:\n' + c.self_checks.map((s) => '- ' + renderPromptItem(s)).join('\n') + '\n';
    if (c.failure_modes && c.failure_modes.length) text += 'Failure modes:\n' + c.failure_modes.map((f) => '- ' + renderPromptItem(f)).join('\n') + '\n';
    if (c.patterns && c.patterns.length) text += 'Patterns:\n' + c.patterns.map((p) => '- ' + renderPromptItem(p)).join('\n') + '\n';
    if (c.note) text += 'Note: ' + c.note + '\n';
    
    let textOut = text.trim();
   if (opts.resolvedDependencies && opts.resolvedDependencies.length > 0) {
      for (const dep of opts.resolvedDependencies) {
        const depLoaded = loadAssetUnsafe(dep.path, { ...opts, resolvedDependencies: [] });
        if (depLoaded.text) {
          // Namespace header (Story 11): each component section is prefixed
          // with [NAMESPACE: id] so consumers can isolate RAG content per source.
          const ns = dep.name
            ? (dep.version ? `${dep.name}@${dep.version}` : dep.name)
            : null;
          const nsHeader = ns ? `[NAMESPACE: ${ns}]\n` : '';
          textOut += '\n\n---\n\n' + nsHeader + depLoaded.text;
        }
      }
    }
    return { status: result.status, profile: result.profile, text: textOut };
  }

  if (as === 'prompt') {
    return result;
  }

  return wrapAsCapsule(result, layout, profile, { ...opts, as });
}

function wrapAsCapsule(result, layout, profile, opts) {
  if (opts.as === 'json') {
    return buildRuntimeCapsuleProjection(result, layout, profile, opts);
  }
  return result;
}

function buildRuntimeCapsuleProjection(loadResult, layout, profile, opts = {}) {
  const m = layout.manifest;
  const val = opts._validation || {};
  const pubkey = (m.creator && m.creator.pubkey) || null;
  const sigVerified = val.signature_valid === true;
  const runtimeCapsule = require('../runtime-capsule');
  const digests = runtimeCapsule.computeDigestEvidence(opts._runtimeAssetBytes, {
    expectedDigests: opts.expectedDigests,
  });
  return runtimeCapsule.buildRuntimeCapsule({
    projection: loadResult,
    manifest: m,
    digests,
    signature: pubkey
      ? { state: sigVerified ? 'verified' : 'not_checked', issuer: pubkey }
      : { state: 'absent' },
    inputKind: opts._runtimeInputKind,
    loadedAt: opts.loadedAt,
    schemaValid: val.schema_valid === true,
    profile,
  });
}

// ─── Semver & Dependency Resolution (Story 6) ─────────────────────────

function parseSemver(v) {
  if (!v) return null;
  const match = v.trim().match(/^v?([0-9]+)\.([0-9]+)\.([0-9]+)(?:-[a-zA-Z0-9.]+)?/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

function compareSemver(leftVersion, rightVersion) {
  const p1 = parseSemver(leftVersion);
  const p2 = parseSemver(rightVersion);
  if (!p1 || !p2) return 0;
  if (p1.major !== p2.major) return p1.major - p2.major;
  if (p1.minor !== p2.minor) return p1.minor - p2.minor;
  return p1.patch - p2.patch;
}

function satisfies(version, range) {
  if (!range || range === '*' || range.trim() === '') return true;
  const r = range.trim();
  
  // Specific version comparison (e.g. "1.2.3")
  if (/^[0-9]/.test(r)) {
    return compareSemver(version, r) === 0;
  }
  
  // ^ range comparison (e.g. "^1.2.3")
  if (r.startsWith('^')) {
    const min = r.slice(1);
    const parsedMin = parseSemver(min);
    if (!parsedMin) return false;
    const parsedVer = parseSemver(version);
    if (!parsedVer) return false;
    // same major, and version >= min
    if (parsedVer.major !== parsedMin.major) return false;
    return compareSemver(version, min) >= 0;
  }
  
  // ~ range comparison (e.g. "~1.2.3")
  if (r.startsWith('~')) {
    const min = r.slice(1);
    const parsedMin = parseSemver(min);
    if (!parsedMin) return false;
    const parsedVer = parseSemver(version);
    if (!parsedVer) return false;
    // same major, same minor, and version >= min
    if (parsedVer.major !== parsedMin.major || parsedVer.minor !== parsedMin.minor) return false;
    return compareSemver(version, min) >= 0;
  }
  
  // Custom ranges like ">=1.0.0 <2.0.0"
  if (r.includes(' ')) {
    const parts = r.split(/\s+/);
    return parts.every(part => satisfies(version, part));
  }
  
  if (r.startsWith('>=')) {
    return compareSemver(version, r.slice(2)) >= 0;
  }
  if (r.startsWith('>')) {
    return compareSemver(version, r.slice(1)) > 0;
  }
  if (r.startsWith('<=')) {
    return compareSemver(version, r.slice(2)) <= 0;
  }
  if (r.startsWith('<')) {
    return compareSemver(version, r.slice(1)) < 0;
  }
  
  return false;
}

function resolveDependencies(manifest, resolveAssetCallback, seen = new Set(), stack = []) {
  const resolved = [];
  const deps = manifest.dependencies || {};
  
  for (const [name, range] of Object.entries(deps)) {
    if (stack.includes(name)) {
      throw new Error(`Circular dependency detected: ${stack.join(' -> ')} -> ${name}`);
    }
    
    if (seen.has(name)) continue;
    
    // Resolve the dependency using the callback
    const depAsset = resolveAssetCallback(name);
    if (!depAsset) {
      throw new Error(`Dependency not satisfied: "${name}" matching "${range}" is not installed.`);
    }
    
    // Check if the resolved version satisfies the range
    if (!satisfies(depAsset.version, range)) {
      throw new Error(`Dependency mismatch: installed "${name}" version "${depAsset.version}" does not satisfy range "${range}".`);
    }
    
    // Recurse
    stack.push(name);
    const subResolved = resolveDependencies(depAsset.manifest, resolveAssetCallback, seen, stack);
    stack.pop();
    
    resolved.push(...subResolved);
    resolved.push({
      name,
      version: depAsset.version,
      path: depAsset.path,
      manifest: depAsset.manifest
    });
    seen.add(name);
  }
  
  return resolved;
}
