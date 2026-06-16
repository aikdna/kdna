#!/usr/bin/env node
/**
 * v1-pack.mjs — pack a .kdna source directory into a .kdna container.
 *
 * Usage: node scripts/v1-pack.mjs <source-dir> [output-path]
 *
 * The output is a deterministic ZIP-compatible container with:
 *   - mimetype as the first entry, stored uncompressed
 *   - kdna.json, payload.kdnab, checksums.json (if present)
 *   - any signatures/ and attachments/ subdirectories
 *   - all ZIP entry timestamps fixed to 1980-01-01 (ZIP epoch), so
 *     packing the same source directory twice produces byte-identical
 *     output. This is a Phase 1 baseline requirement: later phases
 *     will derive digests and signatures from the container bytes, so
 *     non-determinism in the packer would invalidate those primitives.
 *
 * Output defaults to <source-dir>/../<basename>.kdna
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';

// Minimal ZIP writer. We avoid external dependencies so this script runs
// without `npm install` against a fresh checkout. The output is a STORED
// (uncompressed) ZIP — this matches the spec rule that mimetype must be
// the first entry and uncompressed.
//
// Format reference: APPNOTE.TXT. Central directory + End-of-central-directory
// records are written at the end with a 4-byte comment-free EOCD.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Fixed DOS timestamp. ZIP stores MS-DOS-style date/time fields per entry;
// using a clock-derived value here would make the same source directory
// produce different bytes on every pack. Phase 1 requires deterministic
// output, so every entry uses the ZIP epoch (1980-01-01 00:00:00).
// Encoded as: time=0 (midnight), date=1 (1 Jan 1980).
const DOS_EPOCH = Object.freeze({ time: 0, date: 1 });
function dosTime() {
  return DOS_EPOCH;
}

function buildEntry(nameBytes, data, method) {
  const compressed = method === 8 ? zlib.deflateRawSync(data) : data;
  const crc = crc32(data);
  const { time, date } = dosTime();
  const local = Buffer.alloc(30 + nameBytes.length);
  local.writeUInt32LE(0x04034b50, 0); // local file header signature
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0, 6); // flags
  local.writeUInt16LE(method, 8); // method (0=stored, 8=deflate)
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22); // uncompressed size
  local.writeUInt16LE(nameBytes.length, 26);
  local.writeUInt16LE(0, 28); // extra length
  nameBytes.copy(local, 30);
  return { local, compressed, crc, time, date };
}

function buildCentral(entry, nameBytes) {
  const c = Buffer.alloc(46 + nameBytes.length);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4); // version made by
  c.writeUInt16LE(20, 6); // version needed
  c.writeUInt16LE(0, 8);
  c.writeUInt16LE(entry.method || 0, 10);
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
  c.writeUInt32LE(entry.offset >>> 0, 42);
  nameBytes.copy(c, 46);
  return c;
}

function listEntries(dir, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(base, full).split(path.sep).join('/');
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      out.push(...listEntries(full, base));
    } else {
      out.push({ rel, full });
    }
  }
  return out;
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: node scripts/v1-pack.mjs <source-dir> [output-path]');
  process.exit(2);
}
const abs = path.resolve(sourceDir);
if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
  console.error(`Not a directory: ${abs}`);
  process.exit(2);
}

const required = ['mimetype', 'kdna.json', 'payload.kdnab'];
for (const f of required) {
  if (!fs.existsSync(path.join(abs, f))) {
    console.error(`Cannot pack: missing required entry ${f}`);
    process.exit(1);
  }
}

const outputPath = process.argv[3] || path.join(path.dirname(abs), `${path.basename(abs)}.kdna`);

// Collect entries in a deterministic order. mimetype MUST be first.
const collected = listEntries(abs);
const idx = new Map(collected.map((e) => [e.rel, e]));
const order = [
  'mimetype',
  ...collected
    .map((e) => e.rel)
    .filter((n) => n !== 'mimetype')
    .sort(),
];

const localChunks = [];
const centralChunks = [];
let offset = 0;
for (const rel of order) {
  const e = idx.get(rel);
  if (!e) continue;
  const data = fs.readFileSync(e.full);
  const nameBytes = Buffer.from(rel, 'utf8');
  // mimetype is stored uncompressed; everything else deflate.
  const method = rel === 'mimetype' ? 0 : 8;
  const built = buildEntry(nameBytes, data, method);
  localChunks.push(built.local, built.compressed);
  centralChunks.push(
    buildCentral(
      {
        method,
        crc: built.crc,
        time: built.time,
        date: built.date,
        compressed: built.compressed,
        dataLength: data.length,
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

fs.writeFileSync(outputPath, Buffer.concat([...localChunks, ...centralChunks, eocd]));
console.log(`Packed: ${outputPath}`);
console.log(`Entries: ${order.length} (${order.join(', ')})`);
