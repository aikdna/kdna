'use strict';
const crypto = require('node:crypto');
const { parseJson, validTimestamp, uint, copyJson } = require('./strict-input.js');
const { fail, closed } = require('./protection-declaration.js');
const { validateExternalKeyGrant, grantSigningPayload, externalEnvelopeAad } = require('../external-key-grant.js');
const { aesUnwrap } = require('../crypto-profile.js');
const { decode64, decryptGcm } = require('./protection-crypto.js');
const { digest } = require('./digests.js');
function rawKey(value,type,length=32) {
  if (typeof value !== 'string' || !value.startsWith(type+':')) fail('GRANT_INVALID','grant');
  try { return decode64(value.slice(type.length+1),length,true); } catch { fail('GRANT_INVALID','grant'); }
}
function publicKey(value,type) {
  const key = rawKey(value,type);
  const prefix = type === 'ed25519' ? '302a300506032b6570032100' : '302a300506032b656e032100';
  try { return crypto.createPublicKey({key:Buffer.concat([Buffer.from(prefix,'hex'),key]),format:'der',type:'spki'}); } catch { fail('GRANT_INVALID','grant'); }
}
function verifyGrant(raw,credential,manifest,envelope,A) {
  let grant, privateKey;
  try {
    if (!(raw instanceof Uint8Array) || raw.length > 1048576) throw Error();
    grant = parseJson(raw); validateExternalKeyGrant(grant);
    for (const k of ['issued_at','refresh_after','offline_grace_until','expires_at']) if (!validTimestamp(grant[k]) || !uint(Date.parse(grant[k]))) throw Error();
    if (!uint(grant.status_version)) throw Error();
  } catch { fail('GRANT_INVALID','grant'); }
  const e = credential.expected;
  const pairs = [['issuer',e.issuer],['signing_key_id',e.signing_key_id],['account_id',e.account_id],['entitlement_id',e.entitlement_id],['device_id',e.device_id],['device_public_key',e.device_agreement_public_key],['device_signing_public_key',e.device_signing_public_key]];
  if (pairs.some(([k,v])=>grant[k]!==v) || manifest.entitlement.profile !== e.entitlement_profile) fail('GRANT_BINDING_MISMATCH','grant');
  let signatureValid = false;
  try { signatureValid = crypto.verify(null,grantSigningPayload(grant),publicKey(e.issuer_public_key,'ed25519'),rawKey(grant.signature,'ed25519',64)); } catch { fail('GRANT_INVALID','grant'); }
  if (!signatureValid) fail('GRANT_INVALID','grant');
  const binding = {asset_id:manifest.asset_id,asset_uid:manifest.asset_uid,version:manifest.version,digest:A,entry_path:'payload.kdnab',ciphertext_digest:digest(decode64(envelope.ciphertext,null,true)),key_ref:envelope.key_ref,issuer_key_id:envelope.issuer_key_id};
  if (Object.entries(binding).some(([k,v])=>grant.asset[k]!==v)) fail('GRANT_BINDING_MISMATCH','grant');
  rawKey(e.device_signing_public_key,'ed25519');
  try {
    privateKey = crypto.createPrivateKey({key:credential.deviceAgreementPrivateKeyPkcs8,format:'der',type:'pkcs8'});
    if (privateKey.asymmetricKeyType !== 'x25519' || 'x25519:'+crypto.createPublicKey(privateKey).export({format:'jwk'}).x !== e.device_agreement_public_key) fail('GRANT_BINDING_MISMATCH','grant');
  } catch { fail('GRANT_BINDING_MISMATCH','grant'); }
  return { grant, privateKey, grant_digest:digest(raw), times:{issued:Date.parse(grant.issued_at),refresh:Date.parse(grant.refresh_after),grace:Date.parse(grant.offline_grace_until),expires:Date.parse(grant.expires_at)} };
}
function grantPlaintext(verified,manifest,envelope) {
  let shared,kek,cek;
  try {
    const grant=verified.grant;
    shared=crypto.diffieHellman({privateKey:verified.privateKey,publicKey:publicKey(grant.wrap.ephemeral_public_key,'x25519')});
    const salt=decode64(grant.wrap.salt,16,true);
    kek=Buffer.from(crypto.hkdfSync('sha256',shared,salt,Buffer.from('kdna.key-context.device-grant\n0.1.0\n'+grant.grant_id),32));
    cek=aesUnwrap(kek,decode64(grant.wrap.wrapped_cek,40,true));
    const plaintext=decryptGcm(envelope,cek,externalEnvelopeAad({manifest,entryName:'payload.kdnab',plaintextDigest:envelope.plaintext_digest,keyRef:envelope.key_ref,issuerKeyId:envelope.issuer_key_id}),true);
    if (digest(plaintext)!==envelope.plaintext_digest) { plaintext.fill(0); fail('AUTHENTICATION_FAILED','authentication'); }
    return plaintext;
  } catch { fail('AUTHENTICATION_FAILED','authentication'); }
  finally { shared?.fill(0);kek?.fill(0);cek?.fill(0); }
}
function validity(record,now,stage) {
  const {grant,times}=record.verified;
  if (grant.status==='revoked') fail('AUTHORIZATION_REVOKED',stage);
  if (grant.status!=='active' || now>=times.expires || now<times.issued) fail('AUTHORIZATION_EXPIRED',stage);
  if (record.credential.mode==='offline') { if(now>times.grace)fail('AUTHORIZATION_EXPIRED',stage); }
  else if(now>=times.refresh) fail('REFRESH_REQUIRED',stage);
}
async function advance(record,now,stage,alive) {
  const {grant,grant_digest}=record.verified;
  const scope={issuer:grant.issuer,account_id:grant.account_id,entitlement_id:grant.entitlement_id};
  let state;
  try {
    state=copyJson(await record.provider.readAdvance(Object.freeze({scope:Object.freeze(scope),device_id:grant.device_id,verified:Object.freeze({grant_digest,status_version:grant.status_version,status:grant.status,observed_at_ms:now})})));
  } catch { alive();fail('PROVIDER_FAILED',stage); }
  alive();
  try { closed(state,['scope','highest_status_version','status','last_trusted_time_ms','revision']);closed(state.scope,['issuer','account_id','entitlement_id']); } catch { fail('PROVIDER_FAILED',stage); }
  if (Object.keys(scope).some(k=>state.scope[k]!==scope[k]) || ![state.highest_status_version,state.last_trusted_time_ms,state.revision].every(uint) || !['active','revoked','expired'].includes(state.status)) fail('PROVIDER_FAILED',stage);
  const prior=record.highWater;
  if(state.highest_status_version<grant.status_version || state.last_trusted_time_ms!==now || (prior && (state.highest_status_version<prior.highest_status_version || state.revision<prior.revision || state.last_trusted_time_ms<prior.last_trusted_time_ms || (state.highest_status_version===prior.highest_status_version&&state.status!==prior.status)))) fail('STATE_ROLLBACK',stage);
  record.highWater=state;
  if(state.status==='revoked')fail('AUTHORIZATION_REVOKED',stage);
  if(state.status==='expired')fail('AUTHORIZATION_EXPIRED',stage);
  if(state.highest_status_version>grant.status_version)fail('REFRESH_REQUIRED',stage);
  if(state.status!==grant.status)fail('STATE_ROLLBACK',stage);
}
function authorization(record) {
  if(record.credential.kind!=='external-grant') return {kind:record.credential.kind==='password'?'password_possession':'none'};
  const {grant,times}=record.verified;
  return {kind:'external_grant',account_id:grant.account_id,entitlement_profile:record.manifest.entitlement.profile,device_id:grant.device_id,status_version:grant.status_version,refresh_after_ms:times.refresh,expires_at_ms:times.expires,offline_grace_until_ms:times.grace,mode:record.credential.mode,issuer:grant.issuer,entitlement_id:grant.entitlement_id,signing_key_id:grant.signing_key_id};
}
module.exports={verifyGrant,grantPlaintext,validity,advance,authorization};
