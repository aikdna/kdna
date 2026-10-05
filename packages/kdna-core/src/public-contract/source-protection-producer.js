'use strict';
const {types:is}=require('node:util');
const {isDeepStrictEqual}=require('node:util');
const {inflateRawSync}=require('node:zlib');
const C=require('./section-common.js');
const D=require('./digests.js');
const P=require('./protection-declaration.js');
const cryptoProfile=require('./protection-crypto.js');
const integrity=require('./protection-integrity.js');
const {encodeEnvelope,decodeEnvelope}=require('./protection-envelope-codec.js');
const {encodeStored}=require('./container-writer.js');
const {parseContainer}=require('./container.js');
const {decodeValidatedPayload,validateDecodedPayload,assertContentBindings}=require('./semantic-admission.js');
const {buildIR}=require('./canonical-ir.js');
const {admitPublicBytes}=require('./source-public-admission.js');

function validateOptions(candidate,fail){
  const options=C.strict.copyJson(candidate);
  const kind=options?.kind;
  const fields=kind==='password'?['asset_uid','entitlement','slots']:kind==='external-grant'?['asset_uid','entitlement','key_ref','issuer_key_id']:[];
  const required=['kind','checksums','signature',...fields];
  if(!options||typeof options!=='object'||Array.isArray(options)||Object.keys(options).length!==required.length||!required.every(k=>Object.hasOwn(options,k)))fail('SOURCE_INPUT_INVALID','input');
  if(!['password','external-grant','integrity'].includes(kind)||typeof options.checksums!=='boolean'||!['none','ed25519'].includes(options.signature))fail('SOURCE_INPUT_INVALID','input');
  if(kind==='integrity'){
    if(!options.checksums&&options.signature==='none')fail('SOURCE_POLICY_INVALID','input');
    return C.strict.freeze(options);
  }
  if(!C.strict.identifier(options.asset_uid))fail('SOURCE_INPUT_INVALID','input');
  const e=options.entitlement;
  if(!e||typeof e!=='object'||Array.isArray(e)||!Object.hasOwn(e,'profile')||Object.keys(e).some(k=>!['profile','offline','revocable'].includes(k))||['offline','revocable'].some(k=>Object.hasOwn(e,k)&&typeof e[k]!=='boolean'))fail('SOURCE_INPUT_INVALID','input');
  if(kind==='password'){
    if(e.profile!=='password'||e.offline===false||e.revocable===true)fail('SOURCE_POLICY_INVALID','input');
    if(!Array.isArray(options.slots)||options.slots.length<1||options.slots.length>16)fail('SOURCE_INPUT_INVALID','input');
    const names=new Set();
    for(const slot of options.slots){
      if(!slot||typeof slot!=='object'||Array.isArray(slot)||Object.keys(slot).length!==2||!C.strict.identifier(slot.slot)||names.has(slot.slot)||!['scrypt-sha256','argon2id'].includes(slot.kdf_profile))fail('SOURCE_INPUT_INVALID','input');
      names.add(slot.slot);
    }
  }else if(!['account','org'].includes(e.profile)||!C.strict.identifier(options.key_ref)||!C.strict.identifier(options.issuer_key_id)||options.issuer_key_id.length>128){
    fail('SOURCE_INPUT_INVALID','input');
  }
  return C.strict.freeze(options);
}
function closedData(value,fields,fail){
  if(!value||typeof value!=='object'||is.isProxy(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('SOURCE_INPUT_INVALID','semantic');
  const keys=Reflect.ownKeys(value);
  if(keys.length!==fields.length||!keys.every(k=>typeof k==='string'&&fields.includes(k)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value')))fail('SOURCE_INPUT_INVALID','semantic');
  return value;
}
function ownedBytes(value,max,exact,owned,fail){
  if(!is.isUint8Array(value)||![Uint8Array.prototype,Buffer.prototype].includes(Object.getPrototypeOf(value)))fail('SOURCE_INPUT_INVALID','semantic');
  const length=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length').get.call(value);
  const keys=Reflect.ownKeys(value);
  if(length>max||(exact!==null&&length!==exact)||keys.length!==length||!keys.every((k,i)=>k===String(i)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,k),'value')))fail('SOURCE_INPUT_INVALID','semantic');
  const b=Buffer.alloc(length);Uint8Array.prototype.set.call(b,value);owned.push(b);return b;
}
function copySecrets(value,options,owned,fail){
  const fields=options.kind==='password'?['passwords']:options.kind==='external-grant'?['issuerRootKey']:[];
  if(options.signature==='ed25519')fields.push('signingSeed');
  closedData(value,fields,fail);
  const out={};
  if(options.signature==='ed25519')out.signingSeed=ownedBytes(value.signingSeed,32,32,owned,fail);
  if(options.kind==='external-grant')out.issuerRootKey=ownedBytes(value.issuerRootKey,32,32,owned,fail);
  if(options.kind==='password'){
    const rows=value.passwords;
    if(!Array.isArray(rows)||is.isProxy(rows)||Object.getPrototypeOf(rows)!==Array.prototype||rows.length!==options.slots.length||Reflect.ownKeys(rows).length!==rows.length+1)fail('SOURCE_INPUT_INVALID','semantic');
    out.passwords=options.slots.map((slot,i)=>{
      const descriptor=Object.getOwnPropertyDescriptor(rows,String(i));
      if(!descriptor||!Object.hasOwn(descriptor,'value'))fail('SOURCE_INPUT_INVALID','semantic');
      const row=closedData(descriptor.value,['slot','password'],fail);
      if(row.slot!==slot.slot)fail('SOURCE_INPUT_INVALID','semantic');
      const password=ownedBytes(row.password,1048576,null,owned,fail);
      if(!require('node:buffer').isUtf8(password))fail('SOURCE_INPUT_INVALID','semantic');
      return {slot:row.slot,password};
    });
  }
  return out;
}
function prepare(source,options,fail){
  if(options.kind==='integrity')return {manifest:structuredClone(source.manifest),packs:source.metadata.filter(r=>r.name.startsWith('sections/')).map(r=>r.name)};
  const packs=source.metadata.filter(r=>r.name.startsWith('sections/')).map(r=>r.name);
  // A Resource is authored knowledge. Retiring its physical target cannot be
  // repaired by changing its digest/name or keeping a confidential clear pack.
  if((source.payload.resources??[]).some(r=>packs.includes(r.entry)))fail('SOURCE_CAPABILITY_UNAVAILABLE','output');
  const manifest=structuredClone(source.manifest);
  if(Object.hasOwn(manifest,'asset_uid')&&manifest.asset_uid!==options.asset_uid)fail('SOURCE_POLICY_INVALID','output');
  manifest.asset_uid=options.asset_uid;
  manifest.access='licensed';
  manifest.entitlement=structuredClone(options.entitlement);
  manifest.representation_profile='kdna.protected.logical-payload/0.1.0-candidate';
  manifest.payload={path:'payload.kdnab',encoding:'cbor',encrypted:true};
  manifest.encryption={profile:options.kind==='password'?'kdna.envelope.aead':'kdna.envelope.external-grant',profile_version:'0.1.0',encrypted_entries:['payload.kdnab']};
  delete manifest.representation_metadata;
  delete manifest.representation_origin;
  manifest.runtime.mandatory_entries=[...new Set(manifest.runtime.mandatory_entries.map(name=>packs.includes(name)?'payload.kdnab':name))];
  C.validate('ProtectedManifest06Candidate',manifest);
  validateDecodedPayload(manifest,source.payload);
  return {manifest,packs};
}
function produce(source,options,plan,logical,suppliedSecrets,captureId,requestDigest,fail){
  const owned=[];
  let plaintextCheck=null;
  try{
    const secrets=copySecrets(suppliedSecrets,options,owned,fail);
    const entries={...source.entries},manifest=plan.manifest;
    // Both flags are explicit output policy, as in original revision applyIntegrity.
    delete entries['checksums.json'];
    delete entries['signature.kdsig'];
    let Eprofile,E;
    if(options.kind!=='integrity'){
      for(const name of plan.packs)delete entries[name];
      const envelope=options.kind==='password'
        ?cryptoProfile.encryptPassword(logical,manifest,options.slots,secrets.passwords)
        :cryptoProfile.encryptExternal(logical,manifest,options,secrets.issuerRootKey);
      cryptoProfile.validateEnvelope(envelope,{id:manifest.encryption.profile,version:'0.1.0'});
      entries['payload.kdnab']=encodeEnvelope(envelope);
      entries['kdna.json']=Buffer.from(JSON.stringify(manifest));
      const contentDigest=D.digest(D.contentTreePreimage(entries));
      if(Object.hasOwn(manifest,'content_digest'))manifest.content_digest=contentDigest;
      if(Object.hasOwn(manifest.authoring??{},'content_digest'))manifest.authoring.content_digest=contentDigest;
      entries['kdna.json']=Buffer.from(JSON.stringify(manifest));
      E=D.digest(D.runtimeEntryPreimage(entries,manifest));
      Eprofile='kdna.digest-basis.runtime-entry-set/0.2.0';
      if(options.checksums)entries['checksums.json']=Buffer.from(JSON.stringify(integrity.makeChecksums(entries,manifest,E)));
    }else{
      const observed=require('./section-digests.js').observeE(entries,manifest,plan.packs);
      E=observed.digest;Eprofile=observed.profile;
      if(options.checksums){
        const document=require('./section-checksums.js').documentFor(entries,{E:observed});
        C.validate('ChecksumsDocument06',document);
        entries['checksums.json']=Buffer.from(C.strict.canonicalJson(document));
      }
    }
    if(options.signature==='ed25519')entries['signature.kdsig']=integrity.signEntries(entries,secrets.signingSeed);
    const members=source.metadata.filter(row=>Object.hasOwn(entries,row.name)).map(row=>({...row,bytes:entries[row.name]}));
    for(const [name,bytes]of Object.entries(entries))if(!members.some(row=>row.name===name))members.push({name,type:'file',mode:0o100644,bytes});
    C.need(members.length<=128,'READ_CORE_INVALID');
    const bytes=encodeStored(members);
    const policy={requireSignature:options.signature==='ed25519',expectedPublicKeyHex:null};
    let observed;
    if(options.kind==='integrity'){
      const output=admitPublicBytes(bytes,policy,captureId,requestDigest);
      observed={A:output.observed.A,C:output.observed.C,E:output.observed.E.digest};
      C.need(isDeepStrictEqual(output.payload,source.payload),'SECTION_SOURCE_PAYLOAD_CHANGED');
    }else{
      const actual=parseContainer(bytes,(raw,maxOutputLength)=>inflateRawSync(raw,{maxOutputLength}));
      const actualManifest=C.strict.parseJson(actual['kdna.json']);
      C.validate('ProtectedManifest06Candidate',actualManifest);
      observed={A:D.digest(bytes),C:D.digest(D.contentTreePreimage(actual)),E:D.digest(D.runtimeEntryPreimage(actual,actualManifest))};
      assertContentBindings(actualManifest,observed.C);
      integrity.verifyIntegrity(actual,actualManifest,observed.E,policy);
      const envelope=cryptoProfile.validateEnvelope(decodeEnvelope(actual['payload.kdnab']),{id:actualManifest.encryption.profile,version:'0.1.0'});
      plaintextCheck=options.kind==='password'
        ?cryptoProfile.decryptPassword(envelope,{password:secrets.passwords[0].password,slotIndex:0},actualManifest)
        :cryptoProfile.issuerRootPlaintext(envelope,actualManifest,secrets.issuerRootKey);
      C.need(Buffer.from(logical).equals(plaintextCheck),'SECTION_SOURCE_PAYLOAD_CHANGED');
      const payload=decodeValidatedPayload(actualManifest,plaintextCheck);
      const ir={...buildIR(actualManifest,payload,actual),tuple:structuredClone(C.contract.module.versionTuple)};
      C.validate('CanonicalIR06Candidate',ir);
      C.need(isDeepStrictEqual(payload,source.payload),'SECTION_SOURCE_PAYLOAD_CHANGED');
    }
    C.need(observed.E===E,'SECTION_PRODUCER_DIGEST_CHANGED');
    const actions=[];
    for(const [name,prior]of Object.entries(source.entries))actions.push({name,action:!Object.hasOwn(entries,name)?'removed':Buffer.from(prior).equals(Buffer.from(entries[name]))?'preserved':'replaced'});
    for(const name of Object.keys(entries))if(!Object.hasOwn(source.entries,name))actions.push({name,action:'added'});
    return {bytes,observed,Eprofile,actions,outputProfile:options.kind==='integrity'?'public_sections06':'protected_logical_payload06'};
  }catch(e){
    if(P.isFailure(e))fail(e.code==='PROTECTION_KDF_UNAVAILABLE'?'SOURCE_CAPABILITY_UNAVAILABLE':'SOURCE_OUTPUT_INVALID','output');
    throw e;
  }finally{
    plaintextCheck?.fill(0);
    for(const b of owned)b.fill(0);
  }
}
module.exports={validateOptions,prepare,produce};
