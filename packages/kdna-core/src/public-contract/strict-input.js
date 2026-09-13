'use strict';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const MAX_DEPTH = 64;
const MAX_VALUES = 100000;
const MAX_STRING_BYTES = 1024 * 1024;

function reject(reason = 'READ_INPUT_INVALID') {
  throw Object.assign(new Error(reason), { reason });
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
  let position = 0, values = 0;
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
    if (depth > MAX_DEPTH || ++values > MAX_VALUES) reject();
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
  const seen = new Set(); let values = 0;
  function copy(value, depth) {
    if (depth > MAX_DEPTH || ++values > MAX_VALUES) reject();
    if (value === null || typeof value === 'boolean') return value;
    if (typeof value === 'number') { if (!Number.isFinite(value)) reject(); return value; }
    if (typeof value === 'string') { if (!scalarString(value)) reject(); return value; }
    if (typeof value !== 'object' || seen.has(value)) reject();
    const prototype = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) reject();
    if (Object.getOwnPropertySymbols(value).length) reject();
    seen.add(value); const result = Array.isArray(value) ? [] : {};
    if (Array.isArray(value) && value.length > 10000) reject();
    for (const key of Object.keys(value)) {
      if (!scalarString(key)) reject();
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject();
      Object.defineProperty(result, key, { value: copy(descriptor.value, depth + 1), enumerable: true, writable: true, configurable: true });
    }
    if (Array.isArray(value) && (Object.keys(value).length !== value.length || Object.keys(value).some((key,index)=>key!==String(index)))) reject();
    seen.delete(value); return result;
  }
  return copy(input, 0);
}

function canonicalJson(input) {
  const value = copyJson(input);
  function encode(v) {
    if (Array.isArray(v)) return '[' + v.map(encode).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + encode(v[k])).join(',') + '}';
    return JSON.stringify(v);
  }
  return encode(value);
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

module.exports = { reject, scalarString, identifier, entryName, uint, utf8, compareUtf8, parseJson, copyJson, canonicalJson, freeze, validTimestamp };
