'use strict';

const { canonicalJson, parseJson, entryName, compareUtf8, utf8, reject } = require('./strict-input.js');

// Hashing is loaded only at the Core bytes boundary, never by Read's pure root.
function digest(bytes) {
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
      content = utf8(canonicalJson(value));
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
module.exports = { digest, concat, word, contentTreePreimage, runtimeEntryPreimage, runtimeEntryNames, comparison, evidence, capsuleDigest };
