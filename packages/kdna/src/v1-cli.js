/**
 * v1-cli.js — KDNA Core v1 inspect / validate / pack / unpack for the
 * kdna monorepo CLI shim.
 *
 * KDNA Core is the official KDNA judgment-asset format and runtime
 * loading contract. .kdna assets are created, inspected, packed,
 * unpacked, and validated through the official KDNA toolchain. This
 * module is the v1 component of that toolchain.
 *
 * The KDNA Core v1 file format is documented in docs/core/file-format.md.
 * This module is the shared implementation that:
 *
 *   - packages/kdna/bin/kdna.js uses as a v1-aware router
 *   - scripts/v1-*.mjs delegate to (via child_process) so the legacy
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

const MIMETYPE_V1 = 'application/vnd.kdna.asset';
const MIMETYPE_V2 = 'application/vnd.aikdna.kdna+zip';
const V1_REQUIRED_DIR_ENTRIES = ['mimetype', 'kdna.json', 'payload.kdnab'];
const V1_OPTIONAL_DIR_ENTRIES = ['checksums.json', 'signatures', 'attachments'];

// Words that must never appear in v1 CLI output as positive claims.
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
  const repoRoot = getRepoRoot();
  const schemaDir = path.join(repoRoot, 'schema');
  const manifestSchema = JSON.parse(fs.readFileSync(path.join(schemaDir, 'manifest.schema.json'), 'utf8'));
  const payloadSchema = JSON.parse(
    fs.readFileSync(path.join(schemaDir, 'payload-profile-v1.schema.json'), 'utf8'),
  );
  const checksumsSchema = JSON.parse(
    fs.readFileSync(path.join(schemaDir, 'checksums.schema.json'), 'utf8'),
  );
  const loadContractSchema = JSON.parse(
    fs.readFileSync(path.join(schemaDir, 'load-contract.schema.json'), 'utf8'),
  );
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(loadContractSchema, 'load-contract.schema.json');
  _ajv = ajv;
  _validators = {
    manifest: ajv.compile(manifestSchema),
    payload: ajv.compile(payloadSchema),
    checksums: ajv.compile(checksumsSchema),
  };
  return _validators;
}

// ─── Format detection ──────────────────────────────────────────────────

/**
 * Detect whether a directory is a v1 source layout.
 * Required entries: mimetype, kdna.json, payload.kdnab.
 * mimetype content must equal "application/vnd.kdna.asset".
 */
function isV1SourceDir(absPath) {
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) return false;
  for (const f of V1_REQUIRED_DIR_ENTRIES) {
    if (!fs.existsSync(path.join(absPath, f))) return false;
  }
  const mime = fs.readFileSync(path.join(absPath, 'mimetype'), 'utf8');
  return mime === MIMETYPE_V1;
}

/**
 * Detect whether a file is a v1 .kdna container.
 * Returns 'v1' | 'v2' | null. null = not a .kdna file or unreadable.
 */
function detectContainerFormat(absPath) {
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return null;
  // Quick header check: must look like a ZIP.
  const fd = fs.openSync(absPath, 'r');
  const head = Buffer.alloc(4);
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head[0] !== 0x50 || head[1] !== 0x4b) return null;

  // Read the first entry's name + content. We re-use listZipEntries.
  let entries;
  try {
    entries = listZipEntries(absPath);
  } catch {
    return null;
  }
  if (entries.length === 0) return null;
  const first = entries[0];
  if (first.name !== 'mimetype') return null;
  // The mimetype entry must be STORED (method 0).
  if (first.method !== 0) return null;
  const mime = first.method === 0 ? first.data.toString('utf8') : '';
  if (mime === MIMETYPE_V1) return 'v1';
  if (mime === MIMETYPE_V2) return 'v2';
  return null;
}

// ─── ZIP I/O ────────────────────────────────────────────────────────────

/**
 * Minimal ZIP container entry lister. Returns a list of entries:
 *   { name, method, compressedSize, uncompressedSize, localOffset, data }
 * `data` is already decompressed. Throws on unsupported methods or
 * truncated input.
 */
function listZipEntries(absPath) {
  const buf = fs.readFileSync(absPath);

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

  const entries = [];
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
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');

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

    entries.push({
      name,
      method,
      compressedSize: compSize,
      uncompressedSize: uncompSize,
      localOffset: localOff,
      data,
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
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

// ─── Read v1 from either source dir or container ───────────────────────

/**
 * Read a v1 layout (source dir or .kdna container) and return a single
 * normalized map of { mimetype, kdna.json, payload.kdnab, checksums.json? }.
 * `where` describes the origin for error messages.
 *
 * Throws an Error with a clear, content-neutral message if the layout
 * is malformed (missing entry, wrong mimetype, etc.).
 */
function readV1Layout(absPath) {
  let stat;
  try {
    stat = fs.statSync(absPath);
  } catch (e) {
    throw new Error(`path not found: ${absPath}`);
  }

  let map = {};
  let entries = null; // ZIP entries if container
  let kind = null; // 'dir' | 'file'

  if (stat.isDirectory()) {
    kind = 'dir';
    for (const f of V1_REQUIRED_DIR_ENTRIES) {
      const full = path.join(absPath, f);
      if (!fs.existsSync(full)) {
        throw new Error(`not a KDNA v1 source dir: missing ${f}`);
      }
    }
    for (const f of [...V1_REQUIRED_DIR_ENTRIES, ...V1_OPTIONAL_DIR_ENTRIES]) {
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
    entries = listZipEntries(absPath);
    if (entries.length === 0 || entries[0].name !== 'mimetype') {
      throw new Error('not a KDNA v1 container: first entry is not mimetype');
    }
    if (entries[0].method !== 0) {
      throw new Error('not a KDNA v1 container: mimetype must be uncompressed');
    }
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
    for (const f of V1_REQUIRED_DIR_ENTRIES) {
      if (!map[f]) {
        throw new Error(`not a KDNA v1 container: missing ${f}`);
      }
    }
  } else {
    throw new Error(`not a file or directory: ${absPath}`);
  }

  // mimetype content must equal the literal v1 media type.
  const mime = map.mimetype.toString('utf8');
  if (mime !== MIMETYPE_V1) {
    throw new Error(
      `not a KDNA v1 layout: mimetype is "${mime}", expected "${MIMETYPE_V1}"`,
    );
  }

  // Lineage must be a single object, not an array. (Format rule from
  // docs/core/manifest.md / schema/manifest.schema.json.)
  let manifest;
  try {
    manifest = JSON.parse(map['kdna.json'].toString('utf8'));
  } catch (e) {
    throw new Error(`kdna.json is not valid JSON: ${e.message}`);
  }
  if (manifest.lineage !== undefined && Array.isArray(manifest.lineage)) {
    throw new Error('kdna.json.lineage must be an object, not an array');
  }

  return { kind, map, manifest, entries };
}

// ─── inspect ───────────────────────────────────────────────────────────

/**
 * Print a content-neutral manifest summary. Always JSON. Never emits
 * the words trusted / recommended / high_quality / officially_approved.
 */
function buildInspectOutput(v1) {
  const m = v1.manifest;
  const out = {
    kdna_version: m.kdna_version ?? null,
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
  if (v1.map.checksums) out.checksums_present = true;
  return out;
}

// ─── validate ──────────────────────────────────────────────────────────

/**
 * Run structural + JSON-Schema checks. Returns a result object that
 * reports each gate independently. Never includes trust / recommended
 * / high_quality / officially_approved as a positive claim.
 */
function runValidate(v1) {
  const result = {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: true,
    load_contract_valid: true,
  };
  const problems = [];

  // format gate — already proven by readV1Layout, but we re-state the gates
  // so the report matches the spec.
  for (const f of V1_REQUIRED_DIR_ENTRIES) {
    if (!v1.map[f]) {
      result.format_valid = false;
      problems.push(`format: missing required entry ${f}`);
    }
  }
  if (v1.map.mimetype && v1.map.mimetype.toString('utf8') !== MIMETYPE_V1) {
    result.format_valid = false;
    problems.push(`format: mimetype is not ${MIMETYPE_V1}`);
  }

  // schema gate — kdna.json against manifest.schema.json
  const validators = loadSchemas();
  if (!validators) {
    result.schema_valid = false;
    problems.push(
      'schema: ajv not available (install ajv + ajv-formats in the consumer env to enable JSON-Schema validation)',
    );
    return finalizeValidate(result, problems);
  }
  if (!validators.manifest(v1.manifest)) {
    result.schema_valid = false;
    for (const err of validators.manifest.errors) {
      problems.push(`manifest: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }

  // payload gate — payload.kdnab against payload-profile-v1.schema.json
  let payload;
  try {
    payload = JSON.parse(v1.map['payload.kdnab'].toString('utf8'));
  } catch (e) {
    result.payload_valid = false;
    problems.push(`payload: not valid JSON (${e.message})`);
    return finalizeValidate(result, problems);
  }
  if (!validators.payload(payload)) {
    result.payload_valid = false;
    for (const err of validators.payload.errors) {
      problems.push(`payload: ${err.instancePath || '<root>'} ${err.message}`);
    }
  }

  // checksums gate — checksums.json against checksums.schema.json
  if (v1.map.checksums) {
    let checks;
    try {
      checks = JSON.parse(v1.map.checksums.toString('utf8'));
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
  }

  // load_contract gate — only if manifest references a load_contract block
  if (v1.manifest.load_contract) {
    const lc = v1.manifest.load_contract;
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

// ─── pack ──────────────────────────────────────────────────────────────

/**
 * Pack a v1 source directory into a .kdna container. Output is
 * deterministic: the same source directory packed twice produces
 * byte-identical output (fixed DOS timestamps, fixed entry order,
 * mimetype first).
 */
function pack(sourceDir, outputPath) {
  const absSrc = path.resolve(sourceDir);
  if (!fs.existsSync(absSrc) || !fs.statSync(absSrc).isDirectory()) {
    throw new Error(`not a directory: ${absSrc}`);
  }
  for (const f of V1_REQUIRED_DIR_ENTRIES) {
    if (!fs.existsSync(path.join(absSrc, f))) {
      throw new Error(`cannot pack: missing required entry ${f}`);
    }
  }
  const mime = fs.readFileSync(path.join(absSrc, 'mimetype'), 'utf8');
  if (mime !== MIMETYPE_V1) {
    throw new Error(`cannot pack: mimetype is "${mime}", expected "${MIMETYPE_V1}"`);
  }

  // Collect deterministically; mimetype is forced first.
  const collected = listSourceDir(absSrc);
  const order = ['mimetype', ...collected.map((e) => e.rel).filter((n) => n !== 'mimetype')];

  // Build the ZIP body.
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  for (const rel of order) {
    let data;
    if (rel === 'mimetype') {
      data = Buffer.from(MIMETYPE_V1, 'utf8');
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
 * Unpack a v1 .kdna container to a directory. Refuses path traversal.
 * Does not auto-execute any entry.
 */
function unpack(inputPath, outputDir) {
  const absIn = path.resolve(inputPath);
  if (!fs.existsSync(absIn) || !fs.statSync(absIn).isFile()) {
    throw new Error(`not a file: ${absIn}`);
  }
  const entries = listZipEntries(absIn);
  // Sanity: v1 container must have mimetype as first entry with the v1 media type.
  if (entries.length === 0 || entries[0].name !== 'mimetype') {
    throw new Error('not a KDNA v1 container: first entry is not mimetype');
  }
  if (entries[0].method !== 0) {
    throw new Error('not a KDNA v1 container: mimetype must be uncompressed');
  }
  if (entries[0].data.toString('utf8') !== MIMETYPE_V1) {
    throw new Error(
      `not a KDNA v1 container: mimetype is "${entries[0].data.toString('utf8')}", expected "${MIMETYPE_V1}"`,
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

function inspect(inputPath, opts = {}) {
  const v1 = readV1Layout(path.resolve(inputPath));
  const out = buildInspectOutput(v1);
  // Guard against accidental forbidden wording in any future field additions.
  assertNoForbiddenTerms(out);
  return out;
}

function validate(inputPath, opts = {}) {
  const v1 = readV1Layout(path.resolve(inputPath));
  return runValidate(v1);
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
      `internal: v1 inspect output contains forbidden terms: ${[...seen].join(', ')}`,
    );
  }
}

module.exports = {
  MIMETYPE: MIMETYPE_V1,
  MIMETYPE_V1,
  MIMETYPE_V2,
  V1_REQUIRED_DIR_ENTRIES,
  isV1SourceDir,
  detectContainerFormat,
  readV1Layout,
  inspect,
  validate,
  pack,
  unpack,
  FORBIDDEN_OUTPUT_TERMS,
};
