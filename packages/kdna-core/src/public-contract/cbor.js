'use strict';

const { reject, scalarString, MAX_PAYLOAD_BYTES } = require('./strict-input.js');
const decoder = new TextDecoder('utf-8', { fatal: true });
let _cborDecoder = null;
const getCborDecoder = () => _cborDecoder ?? (_cborDecoder = new (require('cbor-x/decode-no-eval').Decoder)({ useRecords: false, mapsAsObjects: true, structuredClone: false }));

function exactInteger(integer) {
  const number = Number(integer);
  if (!Number.isFinite(number) || BigInt(number) !== integer) reject('READ_CORE_INVALID');
  return number;
}

function decodePayload(bytes) {
  // CAPACITY FIX: the payload's own byte length is the capacity measure. The previous
  // per-value counters (100,000 visits in the raw walk and again in the codec
  // normalization) were the same "count visits instead of measuring the payload" defect
  // as strict-input's MAX_VALUES; the raw walk and the normalization are still bounded
  // because each visited CBOR item consumes at least one input byte.
  if (bytes.length > MAX_PAYLOAD_BYTES) reject('READ_CORE_INVALID');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0, saw64BitInt = false;
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
      saw64BitInt = true;
      const n = view.getBigUint64(take(8)), value = Number(n);
      if (BigInt(value) !== n) reject('READ_CORE_INVALID');
      return value;
    }
    reject('READ_CORE_INVALID');
  }
  function value(depth) {
    if (depth > 64) reject('READ_CORE_INVALID');
    const initial = view.getUint8(take(1)), major = initial >> 5, info = initial & 31;
    if (major === 0 || major === 1) {
      if (info === 27) {
        saw64BitInt = true;
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
        keys.add(key);
        const v = value(depth + 1);
        if (key === '__proto__') Object.defineProperty(object, key, { value: v, enumerable: true, writable: true, configurable: true });
        else object[key] = v;
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
  // Keep the codec's exact signed BigInt until its final value is known. Its
  // int64AsNumber option can round a major-1 argument before subtracting one.
  // Only this fresh codec result is normalized; copyJson remains unchanged.
  function normalizeCodecIntegers(value, depth = 0) {
    if (depth > 64) reject('READ_CORE_INVALID');
    if (typeof value === 'bigint') return exactInteger(value);
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const next = normalizeCodecIntegers(value[i], depth + 1);
        if (next !== value[i]) value[i] = next;
      }
      return value;
    }
    if (value !== null && typeof value === 'object') {
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key === '__proto__') {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject('READ_CORE_INVALID');
          const next = normalizeCodecIntegers(descriptor.value, depth + 1);
          if (next !== descriptor.value) Object.defineProperty(value, key, { ...descriptor, value: next });
        } else {
          const cur = value[key], next = normalizeCodecIntegers(cur, depth + 1);
          if (next !== cur) value[key] = next;
        }
      }
    }
    return value;
  }
  const decoded = getCborDecoder().decode(bytes);
  const rawDecoded = saw64BitInt ? normalizeCodecIntegers(decoded) : decoded;
  if (JSON.stringify(inspected) !== JSON.stringify(rawDecoded)) reject('READ_CORE_INVALID');
  return inspected;
}
module.exports = { decodePayload };
