'use strict';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const MAX_DEPTH = 64;
// Limit authored payloads to the declared entry-byte bound.
// Charge canonical JSON bytes once per distinct object in the derived graph.
// Depth, string, property, scalar and array checks remain independent.





















const MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;
// Fixed graph-byte limit; the production bound is independent of environment variables.





const MAX_GRAPH_BYTES = 256 * 1024 * 1024;
const MAX_STRING_BYTES = 1024 * 1024;

function reject(reason = 'READ_INPUT_INVALID', diagnostic = null) {
  if (typeof process === 'object' && process !== null && process.env?.CX_TRACE_REJECT) console.error('DEBUG_REJECT ' + reason + ' :: ' + new Error().stack.split('\n').slice(1, 7).join(' | '));
  const error=Object.assign(new Error(reason), { reason, diagnostic });
  require('./failure-state.js').register(error,reason,diagnostic,'strict');
  throw error;
}

// Canonical-JSON byte cost of one scalar. Byte equality with canonicalJson() is a hard
// requirement elsewhere in this package, so the meter uses the same serialization.
function scalarBytes(value) {
  return encoder.encode(JSON.stringify(value)).length;
}

function scalarString(value, maximum = MAX_STRING_BYTES, controls = true) {
  if (typeof value !== 'string') return false;
  for (let i = 0; i < value.length; i++) {
    const n = value.charCodeAt(i);
    if (n >= 0xd800 && n <= 0xdbff) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (n >= 0xdc00 && n <= 0xdfff) return false;
    if (!controls && (n <= 0x1f || (n >= 0x7f && n <= 0x9f))) return false;
  }
  return encoder.encode(value).length <= maximum;
}

function identifier(value) {
  return typeof value === 'string' && value.length > 0 && scalarString(value, 256, false);
}

function entryName(value) {
  return typeof value === 'string' && value.length > 0 && scalarString(value, 4096, false)
    && !value.includes('\\') && !value.startsWith('/') && !/^[A-Za-z]:/.test(value)
    && value.split('/').every(part => part !== '' && part !== '.' && part !== '..');
}

function uint(value) { return Number.isSafeInteger(value) && value >= 0; }
function utf8(value) { if (!scalarString(value)) reject(); return encoder.encode(value); }
function compareUtf8(left, right) {
  const a = encoder.encode(left), b = encoder.encode(right);
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

// Parse tokens before JSON.parse can discard duplicate-key evidence.
function parseJson(input) {
  const text = typeof input === 'string' ? input : decoder.decode(input);
  if (encoder.encode(text).length > MAX_PAYLOAD_BYTES) reject();
  let position = 0;
  // JSON whitespace is exactly space, tab, LF, and CR. This is a character
  // membership test, not a control-character regex.
  function whitespace() { while (position < text.length && ' \t\n\r'.includes(text[position])) position++; }
  function string() {
    const start = position++;
    for (;;) {
      if (position >= text.length) reject();
      const ch = text[position++];
      if (ch === '"') break;
      if (ch === '\\') position++;
      else if (ch.charCodeAt(0) < 32) reject();
    }
    const value = JSON.parse(text.slice(start, position));
    if (!scalarString(value)) reject();
    return value;
  }
  function value(depth) {
    if (depth > MAX_DEPTH) reject();
    whitespace();
    const ch = text[position];
    if (ch === '"') return string();
    if (ch === '{') {
      position++; whitespace();
      const object = {}, seen = new Set();
      if (text[position] === '}') { position++; return object; }
      for (;;) {
        whitespace(); if (text[position] !== '"') reject();
        const key = string(); if (seen.has(key)) reject(); seen.add(key);
        whitespace(); if (text[position++] !== ':') reject();
        Object.defineProperty(object, key, { value: value(depth + 1), enumerable: true, writable: true, configurable: true });
        whitespace(); const end = text[position++];
        if (end === '}') return object;
        if (end !== ',') reject();
      }
    }
    if (ch === '[') {
      position++; whitespace(); const array = [];
      if (text[position] === ']') { position++; return array; }
      for (;;) {
        if (array.length >= 10000) reject();
        array.push(value(depth + 1)); whitespace(); const end = text[position++];
        if (end === ']') return array;
        if (end !== ',') reject();
      }
    }
    for (const [token, result] of [['true', true], ['false', false], ['null', null]]) {
      if (text.startsWith(token, position)) { position += token.length; return result; }
    }
    const token = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(position));
    if (!token) reject();
    position += token[0].length; const number = Number(token[0]);
    if (!Number.isFinite(number)) reject(); return number;
  }
  const result = value(0); whitespace(); if (position !== text.length) reject(); return result;
}

function copyJson(input) {
  const seen = new Set(); let bytes = 0;
  const charge = cost => { bytes += cost; if (bytes > MAX_GRAPH_BYTES) reject(); };
  function copy(value, depth) {
    if (depth > MAX_DEPTH) reject();
    if (value === null || typeof value === 'boolean') { charge(scalarBytes(value)); return value; }
    if (typeof value === 'number') { if (!Number.isFinite(value)) reject(); charge(scalarBytes(value)); return value; }
    if (typeof value === 'string') { if (!scalarString(value)) reject(); charge(scalarBytes(value)); return value; }
    if (typeof value !== 'object' || seen.has(value)) reject();
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) reject();
    if (Object.getOwnPropertySymbols(value).length) reject();
    seen.add(value); const result = Array.isArray(value) ? [] : {};
    if (Array.isArray(value) && value.length > 10000) reject();
    charge(2);
    let index = 0;
    for (const key of Object.keys(value)) {
      if (!scalarString(key)) reject();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject();
      charge((index ? 1 : 0) + (Array.isArray(value) ? 0 : scalarBytes(key) + 1));
      Object.defineProperty(result, key, { value: copy(descriptor.value, depth + 1), enumerable: true, writable: true, configurable: true });
      index++;
    }
    if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key,index)=>key!==String(index)))) reject();
    seen.delete(value); return result;
  }
  return copy(input, 0);
}

// Strict check of a JSON-domain graph WITHOUT materialising a second graph. Same predicates
// as copyJson: depth, path-based cycle rule (shared siblings stay legal), plain prototypes,
// data-only properties, no symbols, finite numbers, string caps, canonical array shape.
// Used by the admission boundary so the snapshot can be frozen in place instead of copied.
function assertStrictJson(input) {
  // `active` is the path-based cycle rule (identical to copyJson: shared siblings are legal,
  // a genuine cycle is refused). Completed subtree heights preserve depth checks on every
  // alias path while charging each distinct object only once.
  const active = new Set(); const heights = new WeakMap(); let bytes = 0;
  function check(value, depth) {
    if (depth > MAX_DEPTH) reject();
    if (value === null || typeof value === 'boolean') { bytes += scalarBytes(value); if (bytes > MAX_GRAPH_BYTES) reject(); return 0; }
    if (typeof value === 'number') { if (!Number.isFinite(value)) reject(); bytes += scalarBytes(value); if (bytes > MAX_GRAPH_BYTES) reject(); return 0; }
    if (typeof value === 'string') { if (!scalarString(value)) reject(); bytes += scalarBytes(value); if (bytes > MAX_GRAPH_BYTES) reject(); return 0; }
    if (typeof value !== 'object' || active.has(value)) reject();
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) reject();
    if (Object.getOwnPropertySymbols(value).length) reject();
    if (heights.has(value)) {
      const height = heights.get(value);
      if (depth + height > MAX_DEPTH) reject();
      return height;
    }
    active.add(value);
    if (Array.isArray(value) && value.length > 10000) reject();
    bytes += 2;
    let index = 0, height = 0;
    for (const key of Object.keys(value)) {
      if (!scalarString(key)) reject();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject();
      bytes += (index ? 1 : 0) + (Array.isArray(value) ? 0 : scalarBytes(key) + 1);
      if (bytes > MAX_GRAPH_BYTES) reject();
      height = Math.max(height, 1 + check(descriptor.value, depth + 1));
      index++;
    }
    if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key,index)=>key!==String(index)))) reject();
    active.delete(value);
    heights.set(value, height);
    return height;
  }
  check(input, 0);
  if (bytes > MAX_GRAPH_BYTES) reject();
  return input;
}

function canonicalJson(input) {
  // Canonicalization uses the uncached encoder.
  // Values may be freshly constructed and mutable.
  // Validation and encoding operate on the supplied strict JSON value.
  // Object identity does not replace canonical byte encoding.
  return canonicalJsonUncached(input);
}
function canonicalJsonUncached(input) {
  // Validate with the same predicates without materialising a second
  // graph (assertStrictJson documents that it applies the same checks as copyJson). The clone
  // Encoding uses the validated supplied value; it preserves the strict JSON rules
  // and introduces no additional normalization.
  assertStrictJson(input);
  const value = input;
  // The encoder builds one canonical string through a shared chunk array.
  // concatenation (`v.map(encode).join(',')` / `Object.keys(v).sort().map(...)`), so every scalar paid
  // its own JSON.stringify and every parent a fresh join. It now pushes into one shared chunk array
  // and joins once, and object keys are encoded once per key. Output is byte-identical: the same
  // JSON.stringify is still the only string encoder, the same key order (sort) is kept, and the same
  // separators/quoting are emitted.
  const chunks = [];
  const keyCache = new Map();
  function encode(v) {
    if (Array.isArray(v)) {
      chunks.push('[');
      for (let i = 0; i < v.length; i++) { if (i) chunks.push(','); encode(v[i]); }
      chunks.push(']');
      return;
    }
    if (v && typeof v === 'object') {
      chunks.push('{');
      const keys = Object.keys(v).sort();
      for (let i = 0; i < keys.length; i++) {
        if (i) chunks.push(',');
        const k = keys[i];
        chunks.push(keyCache.get(k) ?? keyCache.set(k, JSON.stringify(k)).get(k), ':');
        encode(v[k]);
      }
      chunks.push('}');
      return;
    }
    chunks.push(JSON.stringify(v));
  }
  encode(value);
  const text = chunks.join('');
  return text;
}

if (typeof process === 'object' && process !== null && process.env?.KDNA_CJ_COUNT) {
  process.on('exit', () => {
    const g = globalThis.__KDNA_CJ__;
    if (g) process.stderr.write('KDNA_CJ_COUNT calls=' + g.calls + ' distinct_frozen_objects=' + g.distinct + ' frozen_calls=' + g.frozen + ' nonfrozen_calls=' + g.unfrozen + ' cache_hits=' + g.hits + ' cache_misses=' + g.misses + ' bytes=' + g.bytes + ' at_utc=' + new Date().toISOString() + '\n');
  });
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
}

function validTimestamp(value) {
  if(typeof value!=='string')return false;
  const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/.exec(value);
  if(!m)return false;
  const [year,month,day,hour,minute,second]=m.slice(1).map(Number);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  return month>=1&&month<=12&&day>=1&&day<=days[month-1]&&hour<=23&&minute<=59&&second<=59;
}

module.exports = { reject, scalarString, identifier, entryName, uint, utf8, compareUtf8, parseJson, copyJson, assertStrictJson, canonicalJson, freeze, validTimestamp, MAX_PAYLOAD_BYTES, MAX_GRAPH_BYTES, MAX_DEPTH, MAX_STRING_BYTES };
