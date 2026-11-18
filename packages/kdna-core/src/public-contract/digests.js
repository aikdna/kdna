'use strict';

const { canonicalJson, parseJson, entryName, compareUtf8, utf8, scalarString, reject } = require('./canonical-json-shim.js');

// Streaming canonical-JSON byte stream.
//
// `canonicalJson()` materialises the whole encoding as one string, and `utf8()`
// then applies the author-input string cap (MAX_STRING_BYTES, 1 MiB) to it. That
// cap exists to bound *authored* input; applying it to an internally derived
// structure (the Canonical IR) wrongly limited how many issues an asset may
// carry. This encoder emits the identical byte sequence in chunks so the digest
// can be computed incrementally, with no cap and no giant intermediate string.
//
// Byte equality with canonicalJson() is a hard requirement: the two must produce
// the same SHA-256 for every value. It is asserted by the conformance probe
// (impl/probes/core-ir-ceiling.cjs) and by the Core case runner.
function* canonicalChunks(value) {
  if (Array.isArray(value)) {
    yield '[';
    for (let i = 0; i < value.length; i++) {
      if (i) yield ',';
      yield* canonicalChunks(value[i]);
    }
    yield ']';
    return;
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    yield '{';
    for (let i = 0; i < keys.length; i++) {
      if (i) yield ',';
      yield JSON.stringify(keys[i]);
      yield ':';
      yield* canonicalChunks(value[keys[i]]);
    }
    yield '}';
    return;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) reject();
    yield JSON.stringify(value);
    return;
  }
  if (typeof value === 'string') {
    // Author strings keep their own cap: this only avoids the cap on the
    // *serialisation as a whole*, never on an individual authored value.
    if (!scalarString(value)) reject();
    yield JSON.stringify(value);
    return;
  }
  if (value === null || typeof value === 'boolean') {
    yield JSON.stringify(value);
    return;
  }
  reject();
}

const { isVerifiedFrozen } = require('./strict-input.js');
const nodeCrypto = typeof process === 'object' && typeof process?.getBuiltinModule === 'function' ? process.getBuiltinModule('node:crypto') : null;
const frozenJcsCache = new WeakMap();

function smallFrozenJcs(v, keyCache) {
  const hit = frozenJcsCache.get(v);
  if (hit !== undefined) return hit;
  if (Array.isArray(v)) {
    let out = '[';
    for (let i = 0; i < v.length; i++) {
      if (i) out += ',';
      const item = v[i];
      const sub = item !== null && typeof item === 'object' ? smallFrozenJcs(item, keyCache) : JSON.stringify(item);
      if (sub === null || out.length + sub.length > 65536) return (frozenJcsCache.set(v, null), null);
      out += sub;
    }
    out += ']';
    frozenJcsCache.set(v, out);
    return out;
  }
  const keys = Object.keys(v).sort();
  let out = '{';
  for (let i = 0; i < keys.length; i++) {
    if (i) out += ',';
    const k = keys[i];
    let prefix = keyCache.get(k);
    if (prefix === undefined) { prefix = JSON.stringify(k) + ':'; keyCache.set(k, prefix); }
    const item = v[k];
    const sub = item !== null && typeof item === 'object' ? smallFrozenJcs(item, keyCache) : JSON.stringify(item);
    if (sub === null || out.length + prefix.length + sub.length > 65536) return (frozenJcsCache.set(v, null), null);
    out += prefix + sub;
  }
  out += '}';
  frozenJcsCache.set(v, out);
  return out;
}

function digestCanonical(value) {
  const FLUSH_AT = 1 << 16;
  const keyCache = new Map();
  let buffer = '';
  const hasher = nodeCrypto ? nodeCrypto.createHash('sha256') : require('@noble/hashes/sha256').sha256.create();
  const encoder = nodeCrypto ? null : new TextEncoder();
  const flush = () => {
    if (!buffer.length) return;
    if (nodeCrypto) hasher.update(buffer, 'utf8');
    else hasher.update(encoder.encode(buffer));
    buffer = '';
  };
  const push = chunk => {
    buffer += chunk;
    if (buffer.length >= FLUSH_AT) flush();
  };
  function walk(v) {
    if (v !== null && typeof v === 'object' && isVerifiedFrozen(v)) {
      const cached = smallFrozenJcs(v, keyCache);
      if (cached !== null) { push(cached); return; }
    }
    if (Array.isArray(v)) {
      push('[');
      for (let i = 0; i < v.length; i++) { if (i) push(','); walk(v[i]); }
      push(']');
      return;
    }
    if (v && typeof v === 'object') {
      const keys = Object.keys(v).sort();
      push('{');
      for (let i = 0; i < keys.length; i++) {
        if (i) push(',');
        const k = keys[i];
        let prefix = keyCache.get(k);
        if (prefix === undefined) { prefix = JSON.stringify(k) + ':'; keyCache.set(k, prefix); }
        push(prefix);
        walk(v[k]);
      }
      push('}');
      return;
    }
    if (typeof v === 'number') { if (!Number.isFinite(v)) reject(); push(JSON.stringify(v)); return; }
    if (typeof v === 'string') { if (!scalarString(v)) reject(); push(JSON.stringify(v)); return; }
    if (v === null || typeof v === 'boolean') { push(v === null ? 'null' : v ? 'true' : 'false'); return; }
    reject();
  }
  walk(value);
  flush();
  if (nodeCrypto) return 'sha256:' + hasher.digest('hex');
  return 'sha256:' + Array.from(hasher.digest(), (n) => n.toString(16).padStart(2, '0')).join('');
}

// Hashing is loaded only at the Core bytes boundary, never by Read's pure root.
function digest(bytes) {
  if (nodeCrypto) return 'sha256:' + nodeCrypto.createHash('sha256').update(bytes).digest('hex');
  const { sha256 } = require('@noble/hashes/sha256');
  return 'sha256:' + Array.from(sha256(bytes), n => n.toString(16).padStart(2, '0')).join('');
}
function concat(parts) {
  const length = parts.reduce((n, p) => n + p.length, 0);
  if (!Number.isSafeInteger(length)) reject();
  const result = new Uint8Array(length); let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
function word(number, width) {
  if (!Number.isSafeInteger(number) || number < 0 || (width === 4 && number > 0xffffffff)) reject();
  const out = new Uint8Array(width), view = new DataView(out.buffer);
  if (width === 4) view.setUint32(0, number);
  else view.setBigUint64(0, BigInt(number));
  return out;
}
function admittedNames(entries) {
  const names = Object.keys(entries);
  if (names.some(n => !entryName(n) || n === 'build-receipt.json' || n.startsWith('reports/') || n.startsWith('authoring/'))) reject('READ_CORE_INVALID');
  return names.sort(compareUtf8);
}
function contentTreePreimage(entries) {
  const names = admittedNames(entries).filter(n => n !== 'checksums.json' && n !== 'signature.kdsig');
  const parts = [utf8('KDNA-CONTENT-TREE\0' + '0.2.0\0'), word(names.length, 4)];
  for (const name of names) {
    let content = entries[name]; const json = name.endsWith('.json');
    if (json) {
      const value = parseJson(content);
      if (name === 'kdna.json') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) reject();
        delete value.content_digest;
        if (Object.hasOwn(value, 'authoring')) {
          if (!value.authoring || typeof value.authoring !== 'object' || Array.isArray(value.authoring)) reject();
          delete value.authoring.content_digest;
        }
      }
      // canonicalJson checks each authored scalar; this aggregate JCS string is derived.
      // Encode exactly the same UTF-8 bytes without applying the single-value cap twice.
      content = new TextEncoder().encode(canonicalJson(value));
    }
    const nameBytes = utf8(name);
    parts.push(word(nameBytes.length, 4), nameBytes, Uint8Array.of(json ? 0 : 1), word(content.length, 8), content);
  }
  return concat(parts);
}
function runtimeEntryNames(entries, manifest) {
  admittedNames(entries);
  const declared = manifest.runtime.mandatory_entries;
  if (new Set(declared).size !== declared.length || declared.some(n => !entryName(n) || ['checksums.json', 'signature.kdsig', 'mimetype'].includes(n))) reject('READ_CORE_INVALID');
  const names = [...new Set(['kdna.json', 'payload.kdnab', ...declared])].sort(compareUtf8);
  if (names.some(n => !Object.hasOwn(entries, n))) reject('READ_CORE_INVALID');
  return names;
}
function runtimeEntryPreimage(entries, manifest) {
  const names = runtimeEntryNames(entries, manifest);
  const parts = [utf8('KDNA-RUNTIME-ENTRY-SET\0' + '0.2.0\0'), word(names.length, 4)];
  for (const name of names) {
    const bytes = utf8(name), content = entries[name];
    parts.push(word(bytes.length, 4), bytes, word(content.length, 8), content);
  }
  return concat(parts);
}
function comparison(observed, expected = null, expected_source = null) {
  return expected === null ? { state: 'not_compared', expected: null, expected_source: null }
    : { state: observed === expected ? 'matched' : 'mismatched', expected, expected_source };
}
function evidence(key, observed, expected = null, expectedSource = null) {
  const basis = { A: 'container_bytes', C: 'content_tree', E: 'runtime_entry_set', P: 'runtime_capsule_jcs' }[key];
  const profile = key === 'P' ? 'kdna.canonicalization.runtime-capsule-jcs'
    : 'kdna.digest-basis.' + { A: 'container-bytes', C: 'content-tree', E: 'runtime-entry-set' }[key];
  return { basis, profile, profile_version: '0.2.0', algorithm: 'SHA-256', observed, comparison: comparison(observed, expected, expectedSource) };
}
function capsuleDigest(capsule) { return digest(utf8(canonicalJson(capsule))); }
module.exports = { digest, digestCanonical, canonicalChunks, concat, word, contentTreePreimage, runtimeEntryPreimage, runtimeEntryNames, comparison, evidence, capsuleDigest };
