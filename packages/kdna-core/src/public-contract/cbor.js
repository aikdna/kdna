'use strict';

const { reject, scalarString, copyJson } = require('./strict-input.js');
const decoder = new TextDecoder('utf-8', { fatal: true });

function exactInteger(integer) {
  const number = Number(integer);
  if (!Number.isFinite(number) || BigInt(number) !== integer) reject('READ_CORE_INVALID');
  return number;
}

function decodePayload(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0, count = 0;
  function take(length) {
    if (!Number.isSafeInteger(length) || length < 0 || offset + length > bytes.length) reject('READ_CORE_INVALID');
    const start = offset; offset += length; return start;
  }
  function argument(info) {
    if (info < 24) return info;
    if (info === 24) return view.getUint8(take(1));
    if (info === 25) return view.getUint16(take(2));
    if (info === 26) return view.getUint32(take(4));
    if (info === 27) {
      const n = view.getBigUint64(take(8)), value = Number(n);
      if (BigInt(value) !== n) reject('READ_CORE_INVALID');
      return value;
    }
    reject('READ_CORE_INVALID');
  }
  function value(depth) {
    if (depth > 64 || ++count > 100000) reject('READ_CORE_INVALID');
    const initial = view.getUint8(take(1)), major = initial >> 5, info = initial & 31;
    if (major === 0 || major === 1) {
      if (info === 27) {
        const integer = view.getBigUint64(take(8));
        // For major 1, the encoded argument is not the resulting number.
        // Keep -1-n exact before testing binary64 representability.
        return exactInteger(major === 0 ? integer : -1n - integer);
      }
      const n = argument(info), result = major === 0 ? n : -1 - n;
      if (major === 1 && BigInt(result) !== -1n - BigInt(n)) reject('READ_CORE_INVALID');
      return result;
    }
    if (major === 2 || major === 3) {
      const length = argument(info); if (length > 1024 * 1024) reject('READ_CORE_INVALID');
      const begin = take(length), data = bytes.subarray(begin, offset);
      if (major === 2) reject('READ_CORE_INVALID'); // Public payload values are the typed JSON-domain graph.
      const text = decoder.decode(data); if (!scalarString(text)) reject('READ_CORE_INVALID'); return text;
    }
    if (major === 4 || major === 5) {
      const length = argument(info); if (length > 10000) reject('READ_CORE_INVALID');
      if (major === 4) return Array.from({ length }, () => value(depth + 1));
      const object = {}, keys = new Set();
      for (let i = 0; i < length; i++) {
        const key = value(depth + 1); if (typeof key !== 'string' || keys.has(key)) reject('READ_CORE_INVALID');
        keys.add(key); Object.defineProperty(object, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
      }
      return object;
    }
    if (major === 7) {
      if (info === 20) return false;
      if (info === 21) return true;
      if (info === 22) return null;
      let number;
      if (info === 25) {
        const n = view.getUint16(take(2)), sign = n & 0x8000 ? -1 : 1, exponent = (n >> 10) & 31, fraction = n & 1023;
        number = sign * (exponent === 0 ? 2 ** -14 * fraction / 1024 : exponent === 31 ? Infinity : 2 ** (exponent - 15) * (1 + fraction / 1024));
      } else if (info === 26) number = view.getFloat32(take(4));
      else if (info === 27) number = view.getFloat64(take(8));
      else reject('READ_CORE_INVALID');
      if (!Number.isFinite(number)) reject('READ_CORE_INVALID'); return number;
    }
    reject('READ_CORE_INVALID');
  }
  const inspected = value(0); if (offset !== bytes.length) reject('READ_CORE_INVALID');
  // The production CBOR codec independently decodes after raw duplicate/limit checks.
  const { Decoder } = require('cbor-x/decode-no-eval');
  // Keep the codec's exact signed BigInt until its final value is known. Its
  // int64AsNumber option can round a major-1 argument before subtracting one.
  // Only this fresh codec result is normalized; copyJson remains unchanged.
  let codecValues = 0;
  function normalizeCodecIntegers(value, depth = 0) {
    if (depth > 64 || ++codecValues > 100000) reject('READ_CORE_INVALID');
    if (typeof value === 'bigint') return exactInteger(value);
    if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject('READ_CORE_INVALID');
        Object.defineProperty(value, key, { ...descriptor, value: normalizeCodecIntegers(descriptor.value, depth + 1) });
      }
    }
    return value;
  }
  const decoded = copyJson(normalizeCodecIntegers(new Decoder({ useRecords: false, mapsAsObjects: true, structuredClone: false }).decode(bytes)));
  if (JSON.stringify(inspected) !== JSON.stringify(decoded)) reject('READ_CORE_INVALID');
  return decoded;
}
module.exports = { decodePayload };
