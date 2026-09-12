'use strict';

const { entryName, reject } = require('./strict-input.js');
const decoder = new TextDecoder('utf-8', { fatal: true });
const LIMITS = Object.freeze({ container: 25 * 1024 * 1024, entries: 128, entry: 5 * 1024 * 1024, total: 12 * 1024 * 1024, ratio: 100 });
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) { let n = 0xffffffff; for (const b of bytes) n = CRC_TABLE[(n ^ b) & 255] ^ (n >>> 8); return (n ^ 0xffffffff) >>> 0; }
function parseContainer(bytes, inflate) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 22 || bytes.length > LIMITS.container) reject('READ_CORE_INVALID');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const need = (at, count) => { if (!Number.isSafeInteger(at) || at < 0 || at + count > bytes.length) reject('READ_CORE_INVALID'); };
  const u16 = at => { need(at, 2); return view.getUint16(at, true); };
  const u32 = at => { need(at, 4); return view.getUint32(at, true); };
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(i) === 0x06054b50 && i + 22 + u16(i + 20) === bytes.length) { end = i; break; }
  }
  if (end < 0 || u16(end + 4) || u16(end + 6) || u16(end + 8) !== u16(end + 10)) reject('READ_CORE_INVALID');
  const count = u16(end + 10), centralSize = u32(end + 12), centralStart = u32(end + 16);
  if (!count || count > LIMITS.entries || centralStart + centralSize !== end) reject('READ_CORE_INVALID');
  const entries = Object.create(null), ranges = []; let offset = centralStart, total = 0;
  for (let i = 0; i < count; i++) {
    need(offset, 46); if (u32(offset) !== 0x02014b50) reject('READ_CORE_INVALID');
    const flags = u16(offset + 8), method = u16(offset + 10), crc = u32(offset + 16), compressed = u32(offset + 20), size = u32(offset + 24);
    const length = u16(offset + 28), extra = u16(offset + 30), comment = u16(offset + 32), mode = u32(offset + 38) >>> 16, local = u32(offset + 42);
    need(offset + 46, length + extra + comment);
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + length), name = decoder.decode(nameBytes);
    if (!entryName(name) || Object.hasOwn(entries, name) || flags & ~0x0800 || u16(offset + 34) !== 0) reject('READ_CORE_INVALID');
    const type = mode & 0o170000;
    if (type && type !== 0o100000) reject('READ_CORE_INVALID');
    if (!['mimetype', 'kdna.json', 'payload.kdnab', 'checksums.json', 'signature.kdsig'].includes(name) && !name.startsWith('attachments/')) reject('READ_CORE_INVALID');
    if (size > LIMITS.entry || (compressed === 0 && size !== 0) || (compressed && size / compressed > LIMITS.ratio) || (total += size) > LIMITS.total) reject('READ_CORE_INVALID');
    need(local, 30); if (u32(local) !== 0x04034b50 || u16(local + 6) !== flags || u16(local + 8) !== method || u32(local + 14) !== crc || u32(local + 18) !== compressed || u32(local + 22) !== size || u16(local + 26) !== length) reject('READ_CORE_INVALID');
    const start = local + 30 + length + u16(local + 28); need(local + 30, length); need(start, compressed);
    if (start + compressed > centralStart || ranges.some(([a, b]) => local < b && start + compressed > a)) reject('READ_CORE_INVALID');
    ranges.push([local, start + compressed]);
    if (nameBytes.some((b, j) => bytes[local + 30 + j] !== b)) reject('READ_CORE_INVALID');
    const encoded = bytes.subarray(start, start + compressed); let decoded;
    if (method === 0) decoded = new Uint8Array(encoded);
    else if (method === 8 && typeof inflate === 'function') decoded = new Uint8Array(inflate(encoded, LIMITS.entry));
    else reject('READ_CORE_CAPABILITY_UNAVAILABLE');
    if (decoded.length !== size || crc32(decoded) !== crc) reject('READ_CORE_INVALID');
    if (i === 0 && (name !== 'mimetype' || local !== 0 || method !== 0)) reject('READ_CORE_INVALID');
    entries[name] = decoded; offset += 46 + length + extra + comment;
  }
  ranges.sort((a,b)=>a[0]-b[0]);
  let physicalEnd=0;
  for(const [start,end] of ranges){if(start!==physicalEnd)reject('READ_CORE_INVALID');physicalEnd=end;}
  if(physicalEnd!==centralStart)reject('READ_CORE_INVALID');
  if (offset !== end || decoder.decode(entries.mimetype) !== 'application/vnd.kdna.asset' || !entries['kdna.json'] || !entries['payload.kdnab']) reject('READ_CORE_INVALID');
  return entries;
}
module.exports = { parseContainer, crc32, LIMITS };
