'use strict';
const crypto = require('node:crypto');
const { fail } = require('./protection-declaration.js');
const { aesWrap, aesUnwrap } = require('../crypto-profile.js');
const { externalEnvelopeAad, deriveExternalAssetCek } = require('../external-key-grant.js');
const { digest } = require('./digests.js');
const { PasswordEnvelope: passwordShape, ExternalEnvelope: externalShape } = require('./protection-validators.generated.js');
function decode64(value, length = null, url = false) {
  const encoding = url ? 'base64url' : 'base64';
  if (typeof value !== 'string') fail('ENVELOPE_INVALID','envelope');
  const decoded = Buffer.from(value,encoding);
  if (decoded.toString(encoding) !== value || (length !== null && decoded.length !== length)) fail('ENVELOPE_INVALID','envelope');
  return decoded;
}
function validateEnvelope(value, profile) {
  if (value?.profile !== profile.id || (value.profile_version ?? value.contract_version) !== profile.version) fail('PROFILE_UNSUPPORTED','envelope');
  if (profile.id === 'kdna.envelope.aead') {
    if (!passwordShape(value) || value.kdf_profile !== value.key_slots[0].kdf_profile) fail('ENVELOPE_INVALID','envelope');
    for (const slot of value.key_slots) { decode64(slot.kdf_params.salt,16); decode64(slot.wrapped_key,40); }
    decode64(value.iv,12); decode64(value.tag,16); decode64(value.ciphertext);
  } else {
    if (!externalShape(value) || value.entry_path !== 'payload.kdnab') fail('ENVELOPE_INVALID','envelope');
    decode64(value.iv,12,true); decode64(value.tag,16,true); decode64(value.ciphertext,null,true);
  }
  return value;
}
function passwordAad(manifest) {
  return Buffer.from(['kdna.envelope.aead','0.1.0',manifest.asset_uid,manifest.asset_id,manifest.version,'payload.kdnab',manifest.access,manifest.entitlement.profile].join('\n'));
}
function deriveKek(password, slot) {
  const salt = decode64(slot.kdf_params.salt,16);
  try {
    if (slot.kdf_profile === 'scrypt-sha256') return crypto.scryptSync(password,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024});
    const { argon2id } = require('@noble/hashes/argon2');
    return Buffer.from(argon2id(password,salt,{t:3,m:65536,p:4,dkLen:32}));
  } catch { fail('KDF_UNAVAILABLE','kdf'); }
  finally { salt.fill(0); }
}
function decryptGcm(envelope, cek, aad, url = false) {
  let unauthenticated;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm',cek,decode64(envelope.iv,12,url));
    decipher.setAAD(aad); decipher.setAuthTag(decode64(envelope.tag,16,url));
    unauthenticated=decipher.update(decode64(envelope.ciphertext,null,url));
    return Buffer.concat([unauthenticated,decipher.final()]);
  } catch { fail('AUTHENTICATION_FAILED','authentication'); }
  finally { unauthenticated?.fill(0); }
}
function decryptPassword(envelope, credential, manifest) {
  if (credential.slotIndex >= envelope.key_slots.length) fail('ENVELOPE_INVALID','envelope');
  const slot = envelope.key_slots[credential.slotIndex], kek = deriveKek(credential.password,slot);
  let cek;
  try { try { cek = aesUnwrap(kek,decode64(slot.wrapped_key,40)); } catch { fail('AUTHENTICATION_FAILED','authentication'); }
    return decryptGcm(envelope,cek,passwordAad(manifest));
  } finally { kek.fill(0); cek?.fill(0); }
}
function encryptGcm(plaintext, cek, aad, url = false) {
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv('aes-256-gcm',cek,iv), encoding = url ? 'base64url' : 'base64';
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext),cipher.final()]);
  return { iv:iv.toString(encoding), tag:cipher.getAuthTag().toString(encoding), ciphertext:ciphertext.toString(encoding) };
}
function encryptPassword(plaintext, manifest, slots, passwords) {
  const cek = crypto.randomBytes(32);
  try {
    const key_slots = slots.map((slot,index) => {
      const salt = crypto.randomBytes(16).toString('base64');
      const kdf_params = slot.kdf_profile === 'scrypt-sha256' ? {N:32768,r:8,p:1,salt} : {t:3,m:65536,p:4,dkLen:32,salt};
      const descriptor = {slot:slot.slot,kdf_profile:slot.kdf_profile,kdf_params,wrap:'AES-256-KW'};
      const kek = deriveKek(passwords[index].password,descriptor);
      try { return {...descriptor,wrapped_key:aesWrap(kek,cek).toString('base64')}; } finally { kek.fill(0); }
    });
    return {profile:'kdna.envelope.aead',profile_version:'0.1.0',alg:'AES-256-GCM',key_wrapping:'AES-256-KW',kdf_profile:key_slots[0].kdf_profile,key_slots,...encryptGcm(plaintext,cek,passwordAad(manifest))};
  } finally { cek.fill(0); }
}
function encryptExternal(plaintext, manifest, options, issuerRootKey) {
  const plaintextDigest = digest(plaintext), parameters = {manifest,entryName:'payload.kdnab',plaintextDigest,keyRef:options.key_ref,issuerKeyId:options.issuer_key_id};
  const cek = deriveExternalAssetCek({...parameters,issuerRootKey});
  try { return {profile:'kdna.envelope.external-grant',contract_version:'0.1.0',alg:'A256GCM',cek_derivation:'HKDF-SHA256',key_ref:options.key_ref,issuer_key_id:options.issuer_key_id,entry_path:'payload.kdnab',plaintext_digest:plaintextDigest,...encryptGcm(plaintext,cek,externalEnvelopeAad(parameters),true)}; }
  finally { cek.fill(0); }
}
function issuerRootPlaintext(envelope,manifest,issuerRootKey) {
  const parameters={manifest,entryName:envelope.entry_path,plaintextDigest:envelope.plaintext_digest,keyRef:envelope.key_ref,issuerKeyId:envelope.issuer_key_id};
  const cek=deriveExternalAssetCek({...parameters,issuerRootKey});let plaintext;
  try {
    plaintext=decryptGcm(envelope,cek,externalEnvelopeAad(parameters),true);
    if(digest(plaintext)!==envelope.plaintext_digest){plaintext.fill(0);fail('AUTHENTICATION_FAILED','authentication');}
    return plaintext;
  } finally {cek.fill(0);}
}
module.exports = { decode64, validateEnvelope, passwordAad, deriveKek, decryptGcm, decryptPassword, encryptPassword, encryptExternal, issuerRootPlaintext };
