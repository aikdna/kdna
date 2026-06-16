#!/usr/bin/env node
/**
 * v1-unpack.mjs — extract a .kdna container to a directory.
 *
 * Usage: node scripts/v1-unpack.mjs <input.kdna> [output-dir]
 *
 * Reads the ZIP central directory, extracts every entry, and refuses to
 * write outside the destination. Does NOT auto-execute any entry.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import zlib from 'node:zlib';

function readUInt(buf, off, len) {
  if (len === 2) return buf.readUInt16LE(off);
  if (len === 4) return buf.readUInt32LE(off);
  throw new Error('unsupported');
}

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/v1-unpack.mjs <input.kdna> [output-dir]');
  process.exit(2);
}
const abs = path.resolve(input);
if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
  console.error(`Not a file: ${abs}`);
  process.exit(2);
}
const data = fs.readFileSync(abs);

// Locate EOCD (search from the end).
let eocdOff = -1;
for (let i = data.length - 22; i >= 0 && i >= data.length - 65557; i--) {
  if (data.readUInt32LE(i) === 0x06054b50) { eocdOff = i; break; }
}
if (eocdOff < 0) {
  console.error('No EOCD record found; not a valid ZIP/.kdna file');
  process.exit(1);
}
const totalEntries = readUInt(data, eocdOff + 10, 2);
const cdSize = readUInt(data, eocdOff + 12, 4);
const cdOffset = readUInt(data, eocdOff + 16, 4);

const entries = [];
let p = cdOffset;
for (let i = 0; i < totalEntries; i++) {
  if (readUInt(data, p, 4) !== 0x02014b50) {
    console.error('Bad central directory entry at offset ' + p);
    process.exit(1);
  }
  const method = readUInt(data, p + 10, 2);
  const compSize = readUInt(data, p + 20, 4);
  const uncompSize = readUInt(data, p + 24, 4);
  const nameLen = readUInt(data, p + 28, 2);
  const extraLen = readUInt(data, p + 30, 2);
  const commentLen = readUInt(data, p + 32, 2);
  const localOff = readUInt(data, p + 42, 4);
  const name = data.slice(p + 46, p + 46 + nameLen).toString('utf8');
  entries.push({ name, method, compSize, uncompSize, localOff });
  p += 46 + nameLen + extraLen + commentLen;
}

const outputDir = process.argv[3] || path.join(path.dirname(abs), path.basename(abs, '.kdna') + '_unpacked');
fs.mkdirSync(outputDir, { recursive: true });

for (const e of entries) {
  const local = e.localOff;
  if (readUInt(data, local, 4) !== 0x04034b50) {
    console.error(`Bad local header for ${e.name}`);
    process.exit(1);
  }
  const lNameLen = readUInt(data, local + 26, 2);
  const lExtraLen = readUInt(data, local + 28, 2);
  const compStart = local + 30 + lNameLen + lExtraLen;
  const comp = data.slice(compStart, compStart + e.compSize);
  const out = e.method === 8 ? zlib.inflateRawSync(comp) : comp;
  if (e.method !== 0 && e.method !== 8) {
    console.error(`Unsupported compression method ${e.method} for ${e.name}`);
    process.exit(1);
  }
  const dest = path.join(outputDir, e.name);
  if (path.relative(outputDir, dest).startsWith('..')) {
    console.error(`Refusing to write outside target: ${e.name}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
}

console.log(`Unpacked: ${outputDir}`);
console.log(`Entries: ${entries.length} (${entries.map((e) => e.name).join(', ')})`);
