'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs/promises');
const path=require('node:path');
const {types}=require('node:util');
const {freeze}=require('./strict-input.js');
const {digest}=require('./digests.js');
const {parseProtectedAsset}=require('./protection-admission.js');
const {assetProtectionDeclaration,isFailure}=require('./protection-declaration.js');
const {decodeEnvelope}=require('./protection-envelope-codec.js');
const {validateEnvelope,issuerRootPlaintext}=require('./protection-crypto.js');
const {decodeValidatedPayload,interpretValidatedPayload}=require('./semantic-admission.js');
const {createExternalKeyGrant,validateExternalKeyGrant,grantSigningPayload}=require('../external-key-grant.js');
const definition=require('./issuer-contract.generated.json');
const validators=require('./issuer-validators.generated.js');
const reasons=new Set(require('./generated-contract.json').types.ReadDiagnosticCode.enum);
const monotonic=process.hrtime.bigint.bind(process.hrtime);
const typedPrototype=Object.getPrototypeOf(Uint8Array.prototype);
const byteLength=Object.getOwnPropertyDescriptor(typedPrototype,'byteLength').get;
const bufferOf=Object.getOwnPropertyDescriptor(typedPrototype,'buffer').get;
const setBytes=Uint8Array.prototype.set;
const FAILURE=Symbol('issuer failure');
const MAX_BYTES=26214400,MAX_GRANT=1048576,MAX_CONCURRENT=4;
let reserved=0;
function fail(code,stage){throw {[FAILURE]:true,code:'ISSUER_'+code,stage};}
function failed(code,stage){return freeze({status:'issuer_failed',code:'ISSUER_'+code,stage});}
function ownRecord(value,keys){
 if(!value||typeof value!=='object'||types.isProxy(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))fail('INPUT_INVALID','input');
 const names=Reflect.ownKeys(value);
 if(names.length!==keys.length||names.some(k=>typeof k!=='string'||!keys.includes(k)))fail('INPUT_INVALID','input');
 const result=Object.create(null);
 for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);if(!d||!Object.hasOwn(d,'value'))fail('INPUT_INVALID','input');result[key]=d.value;}
 return result;
}
function copyBytes(value,max,exact=null,key=false){
 if(!value||types.isProxy(value)||!types.isUint8Array(value))fail(key?'KEY_INVALID':'INPUT_INVALID',key?'issuer_key':'input');
 const backing=bufferOf.call(value),length=byteLength.call(value);
 if(types.isSharedArrayBuffer(backing))fail('INPUT_INVALID','input');
 if(length===0||length>max||(exact!==null&&length!==exact))fail(key?'KEY_INVALID':'INPUT_INVALID',key?'issuer_key':'input');
 const copy=Buffer.alloc(length);setBytes.call(copy,value);return copy;
}
function canonicalKey(value,prefix){
 if(typeof value!=='string'||!value.startsWith(prefix+':'))return false;
 const raw=value.slice(prefix.length+1),bytes=Buffer.from(raw,'base64url');return bytes.length===32&&bytes.toString('base64url')===raw;
}
function captureArguments(input,options,secrets,owned){
 const selected=ownRecord(options,Object.keys(definition.types.IssuerOptions.properties));
 if(!validators.IssuerOptions(selected))fail('GRANT_OPTIONS_INVALID','input');
 try{new URL(selected.issuer);}catch{fail('GRANT_OPTIONS_INVALID','input');}
 if(!canonicalKey(selected.device_agreement_public_key,'x25519')||!canonicalKey(selected.device_signing_public_key,'ed25519'))fail('GRANT_OPTIONS_INVALID','input');
 const times=['issued_at_ms','refresh_after_ms','offline_grace_until_ms','expires_at_ms'].map(k=>selected[k]);
 if(times.some((t,i)=>Date.parse(new Date(t).toISOString())!==t||(i&&t<times[i-1])))fail('GRANT_OPTIONS_INVALID','input');
 const secret=ownRecord(secrets,['issuerRootKey','issuerSigningPrivateKeyPkcs8','signaturePolicy']);
 const signaturePolicy=ownRecord(secret.signaturePolicy,['requireSignature','expectedPublicKeyHex']);
 if(!validators.IssuerSignaturePolicy(signaturePolicy))fail('INPUT_INVALID','input');
 const root=copyBytes(secret.issuerRootKey,32,32,true);owned.push(root);
 const privateBytes=copyBytes(secret.issuerSigningPrivateKeyPkcs8,4096,null,true);owned.push(privateBytes);
 let source;
 if(typeof input==='string'){if(!path.isAbsolute(input)||input.includes('\0'))fail('INPUT_INVALID','input');source=input;}
 else{source=copyBytes(input,MAX_BYTES);owned.push(source);}
 let privateKey,publicKey,publicKeyText;
 try{privateKey=crypto.createPrivateKey({key:privateBytes,format:'der',type:'pkcs8'});if(privateKey.asymmetricKeyType!=='ed25519'||!privateKey.export({format:'der',type:'pkcs8'}).equals(privateBytes))throw Error();publicKey=crypto.createPublicKey(privateKey);publicKeyText='ed25519:'+publicKey.export({format:'jwk'}).x;}catch{fail('KEY_INVALID','issuer_key');}
 return {selected,signaturePolicy,root,privateKey,publicKey,publicKeyText,source};
}
async function captureFile(file,checkpoint,owned){
 let handle;
 try{
  checkpoint();handle=await fs.open(file,'r');checkpoint();
  const stat=await handle.stat();checkpoint();if(!stat.isFile()||stat.size>MAX_BYTES)fail('INPUT_INVALID','input');
  const chunks=[];let total=0;
  for(;;){checkpoint();const chunk=Buffer.alloc(Math.min(65536,MAX_BYTES+1-total));owned.push(chunk);
   const read=await handle.read(chunk,0,chunk.length,null);checkpoint();total+=read.bytesRead;
   if(total>MAX_BYTES)fail('INPUT_INVALID','input');chunks.push(chunk.subarray(0,read.bytesRead));if(read.bytesRead===0)break;
  }
  const bytes=Buffer.concat(chunks,total);owned.push(bytes);return bytes;
 }catch(error){if(error?.[FAILURE])throw error;fail('INPUT_INVALID','input');}
 finally{if(handle)await handle.close();}
}
function classify(error,stage){
 if(error?.[FAILURE])return failed(error.code.slice(7),error.stage);
 if(isFailure(error))return failed(error.code==='PROTECTION_PROFILE_UNSUPPORTED'?'ASSET_PROFILE_UNSUPPORTED':'ASSET_AUTHENTICATION_FAILED',error.stage==='integrity'?'integrity':'asset');
 if(stage==='asset')return freeze({status:'core_rejected',stage:'asset',core:{status:'rejected',reason:reasons.has(error?.reason)?error.reason:'READ_CORE_INVALID'}});
 return failed('OUTPUT_INVALID',stage);
}
function getExternalGrantIssuerContract(){
 return freeze({id:definition.id,version:definition.version,definition_digest:definition.definition_digest,implementation:{package:'@aikdna/kdna-core',version:require('../../package.json').version},exports:[...definition.runtime_exports],limits:{container_bytes:MAX_BYTES,grant_bytes:MAX_GRANT,timeout_ms_max:60000,max_concurrent:MAX_CONCURRENT}});
}
function issueExternalKeyGrantForAsset(input,options,secrets){
 const start=monotonic();if(reserved>=MAX_CONCURRENT)return Promise.resolve(failed('INPUT_INVALID','input'));
 reserved++;const owned=[];let captured;
 try{captured=captureArguments(input,options,secrets,owned);}catch(error){owned.forEach(x=>x.fill(0));reserved--;return Promise.resolve(classify(error,'input'));}
 const deadline=start+BigInt(captured.selected.timeout_ms)*1000000n;
 let terminal=false,stage='input',timer;
 return new Promise(resolve=>{
  const checkpoint=()=>{if(terminal||monotonic()>=deadline)fail('OUTPUT_INVALID',stage);};
  const publish=value=>{if(!terminal){terminal=true;clearTimeout(timer);resolve(value);}};
  timer=setTimeout(()=>publish(failed('OUTPUT_INVALID',stage)),Math.max(0,Number(deadline-monotonic())/1e6));
  const work=async()=>{
   let plaintext;
   try{
    checkpoint();const bytes=typeof captured.source==='string'?await captureFile(captured.source,checkpoint,owned):captured.source;checkpoint();stage='asset';
    const {manifest,entries,digests,profile}=parseProtectedAsset(bytes,captured.signaturePolicy,m=>{
     const p=assetProtectionDeclaration(m);if(!p||p.id!=='kdna.envelope.external-grant')fail('ASSET_PROFILE_UNSUPPORTED','asset');
     if(m.entitlement.profile!==captured.selected.entitlement_profile)fail('GRANT_OPTIONS_INVALID','grant');return p;
    });checkpoint();
    const envelope=validateEnvelope(decodeEnvelope(entries['payload.kdnab']),profile);checkpoint();
    plaintext=issuerRootPlaintext(envelope,manifest,captured.root);checkpoint();
    const payload=decodeValidatedPayload(manifest,plaintext),interpreted=interpretValidatedPayload(manifest,payload,entries);checkpoint();
    const selected=captured.selected;stage='grant';checkpoint();
    // This legacy primitive is one non-preemptible synchronous unit, unchanged.
    const grant=createExternalKeyGrant({issuerRootKey:captured.root,issuerSigningPrivateKey:captured.privateKey,signingKeyId:selected.signing_key_id,issuer:selected.issuer,entitlementId:selected.entitlement_id,accountId:selected.account_id,deviceId:selected.device_id,devicePublicKey:selected.device_agreement_public_key,deviceSigningPublicKey:selected.device_signing_public_key,manifest,envelope,assetDigest:digests.A,status:selected.status,statusVersion:selected.status_version,issuedAt:new Date(selected.issued_at_ms),refreshAfter:new Date(selected.refresh_after_ms),offlineGraceUntil:new Date(selected.offline_grace_until_ms),expiresAt:new Date(selected.expires_at_ms),grantId:selected.grant_id});
    checkpoint();validateExternalKeyGrant(grant);
    const expected={issuer:selected.issuer,signing_key_id:selected.signing_key_id,entitlement_id:selected.entitlement_id,account_id:selected.account_id,device_id:selected.device_id,device_public_key:selected.device_agreement_public_key,device_signing_public_key:selected.device_signing_public_key,grant_id:selected.grant_id,status:selected.status,status_version:selected.status_version,issued_at:new Date(selected.issued_at_ms).toISOString(),refresh_after:new Date(selected.refresh_after_ms).toISOString(),offline_grace_until:new Date(selected.offline_grace_until_ms).toISOString(),expires_at:new Date(selected.expires_at_ms).toISOString()};
    const binding={asset_id:manifest.asset_id,asset_uid:manifest.asset_uid,version:manifest.version,digest:digests.A,entry_path:envelope.entry_path,ciphertext_digest:digest(Buffer.from(envelope.ciphertext,'base64url')),key_ref:envelope.key_ref,issuer_key_id:envelope.issuer_key_id};
    if(Object.entries(expected).some(([k,v])=>grant[k]!==v)||Object.entries(binding).some(([k,v])=>grant.asset[k]!==v)||!crypto.verify(null,grantSigningPayload(grant),captured.publicKey,Buffer.from(grant.signature.slice(8),'base64url')))fail('OUTPUT_INVALID','grant');
    const raw=Buffer.from(JSON.stringify(grant));owned.push(raw);if(raw.length>MAX_GRANT)fail('OUTPUT_INVALID','grant');
    const observation={status:'issued',grant:{byte_length:raw.length,digest:digest(raw)},asset:digests,issuer:{id:selected.issuer,signing_key_id:selected.signing_key_id,public_key:captured.publicKeyText},admission:{status:interpreted.status,asset_capability:payload.asset_capability,interpretation:interpreted.status==='accepted'?'complete':'blocked'},proof:'issuer_output_not_account_or_read_authority'};
    if(!validators.IssuerResultObservation(observation))fail('OUTPUT_INVALID','grant');checkpoint();
    return Object.freeze({...freeze(observation),grantBytes:Uint8Array.from(raw)});
   }finally{plaintext?.fill(0);owned.forEach(x=>x.fill(0));reserved--;}
  };
  work().then(result=>{try{checkpoint();publish(result);}catch(error){result?.grantBytes?.fill(0);publish(classify(error,stage));}},error=>publish(classify(error,stage)));
 });
}
module.exports={getExternalGrantIssuerContract,issueExternalKeyGrantForAsset};
