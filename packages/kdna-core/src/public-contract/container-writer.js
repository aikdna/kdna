'use strict';
const { crc32, LIMITS } = require('./container.js');
const { reject } = require('./strict-input.js');
// This encoder receives only the admitted predecessor's existing members.
// The parser and final Core admission remain the only container/semantic gate.
function encodeStored(members) {
  const parts = [], centralParts = []; let offset = 0, total = 0;
  for (const { name, mode, bytes } of members) {
    if (bytes.length > LIMITS.entry || (total += bytes.length) > LIMITS.total) reject('READ_CORE_INVALID');
    const n = Buffer.from(name, 'utf8'), crc = crc32(bytes), local = Buffer.alloc(30), central = Buffer.alloc(46);
    local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(bytes.length, 18); local.writeUInt32LE(bytes.length, 22); local.writeUInt16LE(n.length, 26);
    central.writeUInt32LE(0x02014b50); central.writeUInt16LE(0x0314, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(bytes.length, 20); central.writeUInt32LE(bytes.length, 24); central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE((mode * 65536) >>> 0, 38); central.writeUInt32LE(offset, 42);
    parts.push(local, n, bytes); centralParts.push(central, n); offset += local.length + n.length + bytes.length;
  }
  const central = Buffer.concat(centralParts), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50); end.writeUInt16LE(members.length, 8); end.writeUInt16LE(members.length, 10);
  end.writeUInt32LE(central.length, 12); end.writeUInt32LE(offset, 16);
  if (offset + central.length + end.length > LIMITS.container) reject('READ_CORE_INVALID');
  return new Uint8Array(Buffer.concat([...parts, central, end]));
}

module.exports = { encodeStored };
