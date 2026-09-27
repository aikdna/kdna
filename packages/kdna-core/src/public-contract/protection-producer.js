'use strict';
const { openSourceBytes } = require('./authoring-node.js');
const { rejected } = require('./admit.js');
const { parseContainer } = require('./container.js');
const { encodeStored } = require('./container-writer.js');
const { copyJson, identifier } = require('./strict-input.js');
const { digest, contentTreePreimage, runtimeEntryPreimage } = require('./digests.js');
const { validate } = require('./validate.js');
const { closed, bytes: copyBytes, fail, failure, contract, getProtectionContract } = require('./protection-declaration.js');
const { encryptPassword, encryptExternal, validateEnvelope } = require('./protection-crypto.js');
const { encodeEnvelope } = require('./protection-envelope-codec.js');
const { makeChecksums, signEntries, verifyIntegrity } = require('./protection-integrity.js');
async function protectSourceBytes(input, suppliedOptions, suppliedSecrets) {
  const owned=[];
  try {
    const options=copyJson(suppliedOptions),kind=options?.kind;
    const fields=kind==='password'?['asset_uid','entitlement','slots']:kind==='external-grant'?['asset_uid','entitlement','key_ref','issuer_key_id']:[];
    closed(options,['kind','checksums','signature',...fields]);
    if(!['password','external-grant','integrity'].includes(kind) || typeof options.checksums!=='boolean' || !['none','ed25519'].includes(options.signature) || (kind==='integrity'&&!options.checksums&&options.signature==='none'))fail('INPUT_INVALID','input');
    const secretFields=kind==='password'?['passwords']:kind==='external-grant'?['issuerRootKey']:[];
    closed(suppliedSecrets,[...secretFields,...(options.signature==='ed25519'?['signingSeed']:[])]);
    const secrets={};const own=(value,max,exact=null)=>{const b=copyBytes(value,max,exact);owned.push(b);return b;};
    if(options.signature==='ed25519')secrets.signingSeed=own(suppliedSecrets.signingSeed,32,32);
    if(kind!=='integrity') {
      if(!identifier(options.asset_uid))fail('INPUT_INVALID','input');
      closed(options.entitlement,['profile'],['offline','revocable']);
      if(['offline','revocable'].some(k=>Object.hasOwn(options.entitlement,k)&&typeof options.entitlement[k]!=='boolean'))fail('INPUT_INVALID','input');
      if(kind==='password') {
        if(options.entitlement.profile!=='password'||options.entitlement.offline===false||options.entitlement.revocable===true)fail('DECLARATION_CONFLICT','authorization');
        if(!Array.isArray(options.slots)||options.slots.length<1||options.slots.length>16||!Array.isArray(suppliedSecrets.passwords)||suppliedSecrets.passwords.length!==options.slots.length)fail('INPUT_INVALID','input');
        const names=new Set();
        secrets.passwords=options.slots.map((slot,i)=>{
          closed(slot,['slot','kdf_profile']);const password=closed(suppliedSecrets.passwords[i],['slot','password']);
          if(!identifier(slot.slot)||names.has(slot.slot)||!['scrypt-sha256','argon2id'].includes(slot.kdf_profile)||password.slot!==slot.slot)fail('INPUT_INVALID','input');
          names.add(slot.slot);const value=own(password.password,1048576);
          try{new TextDecoder('utf-8',{fatal:true}).decode(value);}catch{fail('INPUT_INVALID','input');}
          return {slot:slot.slot,password:value};
        });
      }else{
        if(!['account','org'].includes(options.entitlement.profile)||!identifier(options.key_ref)||!identifier(options.issuer_key_id)||options.issuer_key_id.length>128)fail('INPUT_INVALID','input');
        secrets.issuerRootKey=own(suppliedSecrets.issuerRootKey,32,32);
      }
    }
    const opened=openSourceBytes(input);
    if(opened.status!=='accepted')return {status:'core_rejected',stage:'container',core:opened};
    const {manifest,members}=opened.source,entries=Object.fromEntries(members.map(row=>[row.name,row.bytes]));
    let profile=null;
    if(kind!=='integrity') {
      if(Object.hasOwn(manifest,'asset_uid')&&manifest.asset_uid!==options.asset_uid)fail('DECLARATION_INVALID','declaration');
      manifest.asset_uid=options.asset_uid;manifest.access='licensed';manifest.entitlement=options.entitlement;manifest.payload.encrypted=true;
      const id=kind==='password'?'kdna.envelope.aead':'kdna.envelope.external-grant';
      manifest.encryption={profile:id,profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};profile={id,version:'0.1.0'};
      validate('Manifest',manifest);
      const envelope=kind==='password'?encryptPassword(entries['payload.kdnab'],manifest,options.slots,secrets.passwords):encryptExternal(entries['payload.kdnab'],manifest,options,secrets.issuerRootKey);
      entries['payload.kdnab']=encodeEnvelope(envelope);validateEnvelope(envelope,profile);
    }
    entries['kdna.json']=Buffer.from(JSON.stringify(manifest));
    const C=digest(contentTreePreimage(entries));
    if(Object.hasOwn(manifest,'content_digest'))manifest.content_digest=C;
    if(Object.hasOwn(manifest.authoring??{},'content_digest'))manifest.authoring.content_digest=C;
    entries['kdna.json']=Buffer.from(JSON.stringify(manifest));validate('Manifest',manifest);
    const E=digest(runtimeEntryPreimage(entries,manifest));
    if(options.checksums)entries['checksums.json']=Buffer.from(JSON.stringify(makeChecksums(entries,manifest,E)));
    if(options.signature==='ed25519')entries['signature.kdsig']=signEntries(entries,secrets.signingSeed);
    const integrity=verifyIntegrity(entries,manifest,E,{requireSignature:options.signature==='ed25519',expectedPublicKeyHex:null});
    const outputMembers=members.map(row=>({...row,bytes:entries[row.name]}));
    for(const name of ['checksums.json','signature.kdsig'])if(entries[name])outputMembers.push({name,mode:0o100644,bytes:entries[name]});
    const bytes=encodeStored(outputMembers);parseContainer(bytes);
    return {status:'produced',bytes,evidence:{contract:contract(),implementation:getProtectionContract().implementation,source_A:opened.source.artifact_digest,output:{A:digest(bytes),C,E},profile,entry:'payload.kdnab',integrity,proof:'producer_observation_not_consumer_admission'}};
  }catch(error){
    if(error?.reason)return {status:'core_rejected',stage:'manifest',core:rejected(error.reason,error.component_failure??null,error.diagnostic??null)};
    return failure(error);
  }finally{for(const value of owned)value.fill(0);}
}
module.exports={protectSourceBytes};
