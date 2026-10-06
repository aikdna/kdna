'use strict';
const fail = (code, stage) => require('./protection-declaration.js').fail(code, stage);
const LIMIT = 8 * 1024 * 1024;
function invalid() { fail('ENVELOPE_INVALID','envelope'); }
function head(major, n) {
  if (!Number.isSafeInteger(n) || n < 0) invalid();
  if (n < 24) return Buffer.from([(major << 5) | n]);
  const width = n <= 255 ? 1 : n <= 65535 ? 2 : n <= 4294967295 ? 4 : 8;
  const out = Buffer.alloc(width + 1); out[0] = (major << 5) | ({1:24,2:25,4:26,8:27})[width];
  if (width === 8) out.writeBigUInt64BE(BigInt(n),1); else out.writeUIntBE(n,1,width);
  return out;
}
function compare(a,b) { return a.length - b.length || Buffer.compare(a,b); }
function encodeEnvelope(value) {
  let count = 0;
  function encode(v, depth) {
    if (++count > 100000 || depth > 16) invalid();
    if (typeof v === 'string') {
      if (!v.isWellFormed()) invalid();
      const bytes = Buffer.from(v); if (bytes.length > LIMIT) invalid();
      return Buffer.concat([head(3,bytes.length),bytes]);
    }
    if (Number.isSafeInteger(v) && v >= 0) return head(0,v);
    if (Array.isArray(v)) return Buffer.concat([head(4,v.length), ...v.map(x=>encode(x,depth+1))]);
    if (v && typeof v === 'object' && [Object.prototype,null].includes(Object.getPrototypeOf(v))) {
      const members = Object.keys(v).map(k => [encode(k,depth+1), encode(v[k],depth+1)]).sort((a,b)=>compare(a[0],b[0]));
      return Buffer.concat([head(5,members.length), ...members.flat()]);
    }
    invalid();
  }
  const result = encode(value,0); if (result.length > LIMIT) invalid(); return result;
}
// This codec handles only the frozen envelope's string/uint/map/array domain.
// It never decodes Payload: authenticated plaintext goes to the sole Payload codec.
function decodeEnvelope(input) {
  if (!(input instanceof Uint8Array) || !input.length || input.length > LIMIT) invalid();
  const bytes = Buffer.from(input); let offset = 0, count = 0;
  const decoder = new TextDecoder('utf-8',{fatal:true});
  function read(depth) {
    if (++count > 100000 || depth > 16 || offset >= bytes.length) invalid();
    const first = bytes[offset++], major = first >> 5, add = first & 31;
    if (![0,3,4,5].includes(major) || add > 27) invalid();
    let n = add;
    if (add >= 24) {
      const width = 2 ** (add - 24); if (offset + width > bytes.length) invalid();
      n = width === 8 ? Number(bytes.readBigUInt64BE(offset)) : bytes.readUIntBE(offset,width); offset += width;
      if (!Number.isSafeInteger(n) || n < (width === 1 ? 24 : 2 ** (8 * width / 2))) invalid();
    }
    if (major === 0) return n;
    if (major === 3) {
      if (n > LIMIT || offset + n > bytes.length) invalid();
      let value; try { value = decoder.decode(bytes.subarray(offset,offset+n)); } catch { invalid(); }
      offset += n; return value;
    }
    if (n > 100000) invalid();
    if (major === 4) return Array.from({length:n},()=>read(depth+1));
    const value = {}; let prior = null;
    for (let i=0;i<n;i++) {
      const start = offset, key = read(depth+1), encoded = bytes.subarray(start,offset);
      if (typeof key !== 'string' || Object.hasOwn(value,key) || (prior && compare(prior,encoded) >= 0)) invalid();
      prior = encoded;
      Object.defineProperty(value,key,{value:read(depth+1),enumerable:true,writable:true,configurable:true});
    }
    return value;
  }
  const value = read(0); if (offset !== bytes.length || !encodeEnvelope(value).equals(bytes)) invalid(); return value;
}
// The frozen RFC18 ciphertext pattern is strict canonical padded base64. Native
// RegExp's repeated four-character group can exhaust the VM stack on an otherwise
// permitted multi-MiB member. Decode/re-encode recognizes exactly the same language
// (including padding bits) in bounded linear memory; all other patterns stay native.
const CIPHERTEXT_PATTERN = '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/][AQgw]==|[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=)?$';
function envelopeRegExp(pattern, flags) {
  if(pattern===CIPHERTEXT_PATTERN)return {test:value=>typeof value==='string'&&Buffer.from(value,'base64').toString('base64')===value};
  return new RegExp(pattern,flags);
}
envelopeRegExp.code = "require('./protection-envelope-codec.js').envelopeRegExp";
// Pure base64/base64url codec for the frozen envelope domain: exactly the recognize-or-reject
// language of the retained Node buffer codec (strict canonical round-trip plus an optional
// length pin), with no Buffer/atob dependency so browser consumers can reuse it.
const B64_ALPHABETS = { std: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', url: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_' };
const B64_MAPS = {};
function b64Map(url) {
  const key = url ? 'url' : 'std';
  if (!B64_MAPS[key]) { const map = new Int16Array(128).fill(-1); const alphabet = B64_ALPHABETS[key]; for (let i = 0; i < 64; i++) map[alphabet.charCodeAt(i)] = i; B64_MAPS[key] = map; }
  return B64_MAPS[key];
}
function b64Encode(bytes, url) {
  const alphabet = B64_ALPHABETS[url ? 'url' : 'std']; let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += alphabet[b0 >> 2] + alphabet[((b0 & 3) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    if (b1 === undefined) { if (!url) out += '=='; break; }
    out += alphabet[((b1 & 15) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    if (b2 === undefined) { if (!url) out += '='; break; }
    out += alphabet[b2 & 63];
  }
  return out;
}
function decode64Bytes(value, length = null, url = false) {
  if (typeof value !== 'string') invalid();
  const map = b64Map(url), n = value.length;
  if (n % 4 === 1) invalid();
  const out = new Uint8Array(((n + 3) >> 2) * 3);
  let o = 0, acc = 0, bits = 0, padded = false;
  for (let i = 0; i < n; i++) {
    const code = value.charCodeAt(i);
    if (code === 61) { padded = true; continue; }
    if (padded) invalid();
    const v = code < 128 ? map[code] : -1;
    if (v < 0) invalid();
    acc = ((acc << 6) | v) & 0xFFFFFF; bits += 6;
    if (bits >= 8) { bits -= 8; out[o++] = (acc >> bits) & 0xff; }
  }
  const bytes = out.subarray(0, o);
  if (b64Encode(bytes, url) !== value) invalid();
  if (length !== null && bytes.length !== length) invalid();
  return bytes;
}
function validateEnvelopeShape(value, profile) {
  if (value?.profile !== profile.id || (value.profile_version ?? value.contract_version) !== profile.version) fail('PROFILE_UNSUPPORTED','envelope');
  // Lazy: the generated validators require this module for the frozen ciphertext recognizer.
  const { PasswordEnvelope: passwordShape, ExternalEnvelope: externalShape } = require('./protection-validators.generated.js');
  if (profile.id === 'kdna.envelope.aead') {
    if (!passwordShape(value) || value.kdf_profile !== value.key_slots[0].kdf_profile) fail('ENVELOPE_INVALID','envelope');
    for (const slot of value.key_slots) { decode64Bytes(slot.kdf_params.salt,16); decode64Bytes(slot.wrapped_key,40); }
    decode64Bytes(value.iv,12); decode64Bytes(value.tag,16); decode64Bytes(value.ciphertext);
  } else {
    if (!externalShape(value) || value.entry_path !== 'payload.kdnab') fail('ENVELOPE_INVALID','envelope');
    decode64Bytes(value.iv,12,true); decode64Bytes(value.tag,16,true); decode64Bytes(value.ciphertext,null,true);
  }
  return value;
}
function passwordAadBytes(manifest) {
  return new TextEncoder().encode(['kdna.envelope.aead','0.1.0',manifest.asset_uid,manifest.asset_id,manifest.version,'payload.kdnab',manifest.access,manifest.entitlement.profile].join('\n'));
}
module.exports = { encodeEnvelope, decodeEnvelope, envelopeRegExp, decode64Bytes, validateEnvelopeShape, passwordAadBytes };
