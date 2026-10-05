'use strict';
// The original kdsig helpers own the signature domain and cryptographic algorithm.
const {inflateRawSync}=require('node:zlib');
const C=require('./section-common.js'),{digest,digestCanonical}=require('./digests.js');
const original=require('./protection-integrity.js'),signature=require('../signature.js');
const {parseSectionContainer}=require('./section-container.js'),{encodeStored}=require('./container-writer.js'),{observeWhole}=require('./section-digests.js');
const PROFILE='kdsig.ed25519',VERSION='0.1.0';
const DEFAULT_POLICY=Object.freeze({requireSignature:false,expectedPublicKeyHex:null});
function invalid(code='SECTION_SIGNATURE_INVALID',field='/signature.kdsig',subject=null){try{C.need(false,code);}catch(e){e.diagnostic={field,subject:typeof subject==='string'&&C.strict.identifier(subject)?subject:null};throw e;}}
function policy(candidate=DEFAULT_POLICY){C.validate('SectionSignaturePolicy06',candidate);return C.strict.freeze(structuredClone(candidate));}
function copySeed(value){
 C.need(require('node:util').types.isUint8Array(value),'READ_INPUT_INVALID');
 C.need([Uint8Array.prototype,Buffer.prototype].includes(Object.getPrototypeOf(value)),'READ_INPUT_INVALID');
 const length=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype),'length').get.call(value),keys=Reflect.ownKeys(value);
 C.need(length===32&&keys.length===32&&keys.every((key,i)=>key===String(i)&&Object.hasOwn(Object.getOwnPropertyDescriptor(value,key),'value')),'READ_INPUT_INVALID');
 const owned=Buffer.alloc(32);Uint8Array.prototype.set.call(owned,value);return owned;
}
function excluded(name){return ['.DS_Store','build-receipt.json','signature.kdsig'].includes(name)||name.startsWith('reports/');}
function intent(rows){
 const sig=rows.find(r=>r.name==='signature.kdsig');
 const result=sig?{operation:'verify_complete_original_kdsig_domain',signature_member:{name:sig.name,bytes:sig.size},covered_members:rows.filter(r=>!excluded(r.name)).sort((a,b)=>C.utf8(a.name,b.name)).map(r=>({name:r.name,bytes:r.size})),excluded_members:rows.filter(r=>excluded(r.name)).map(r=>r.name).sort(C.utf8),profile:PROFILE,profile_version:VERSION}:{operation:'none'};
 C.validate('SectionSignatureReadIntent06',result);return C.strict.freeze(result);
}
function authorizationContext(context,capture,signaturePolicy,operation='read'){
 const readIntent=intent(capture.rows);
 return C.strict.freeze({...context,operation,signature_policy:signaturePolicy,signature_policy_digest:digestCanonical(signaturePolicy),signature_read_intent:readIntent,signature_read_intent_digest:digestCanonical(readIntent)});
}
function isJsonDataFailure(e,raw){
 if(['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(e.reason))return true;
 // Determine malformed UTF8/JSON from actual bytes, not a forgeable exception code/type.
 if(!require('node:buffer').isUtf8(raw))return true;
 try{JSON.parse(Buffer.from(raw).toString('utf8'));}catch(syntax){if(syntax instanceof SyntaxError)return true;throw syntax;}
 return false;
}
function parse(raw){
 if(raw.length>1048576)invalid();let value;
 try{value=C.strict.parseJson(raw);}catch(e){if(isJsonDataFailure(e,raw))invalid();throw e;}
 const fields=['algorithm','content_digest','profile','profile_version','public_key','signature'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==fields.length||!fields.every(k=>Object.hasOwn(value,k)&&typeof value[k]==='string'))invalid();
 if(!/^sha256:[0-9a-f]{64}$/.test(value.content_digest)||! /^[0-9a-f]{64}$/.test(value.public_key)||! /^[0-9a-f]{128}$/.test(value.signature))invalid();
 if(value.profile!==PROFILE||value.profile_version!==VERSION||value.algorithm!=='ed25519')invalid('SIGNATURE_PROFILE_UNSUPPORTED');
 try{return signature.parseSignatureBundle(Buffer.from(raw));}catch(e){if(e.code==='KDNA_INTEGRITY_SIGNATURE_FAILED')invalid();throw e;}
}
function domain(entries){
 // Per-member use of the original helper preserves exact JSON exclusions and canonicalization.
 const names=Object.keys(entries).filter(name=>!excluded(name)).sort(C.utf8),rows=[],members=[];
 for(const name of names){let row;try{row=original.signatureContentPreimage({[name]:entries[name]}).toString('utf8');}catch(e){if(/\.json$/i.test(name)&&isJsonDataFailure(e,entries[name]))invalid('SECTION_SIGNATURE_INVALID','/'+name,name);throw e;}
  rows.push(row);members.push({name,bytes:entries[name].length,raw_digest:digest(entries[name]),signature_basis_digest:'sha256:'+row.slice(-64)});
 }
 return {observed:digest(Buffer.from(rows.join('\n'))),members,excluded_members:Object.keys(entries).filter(excluded).sort(C.utf8)};
}
function verify(entries,signaturePolicy,captureId,requestDigest,readIntent){
 const common={policy:signaturePolicy,policy_digest:digestCanonical(signaturePolicy),read_intent_digest:digestCanonical(readIntent),capture_id:captureId,request_digest:requestDigest};
 if(!Object.hasOwn(entries,'signature.kdsig')){C.need(readIntent.operation==='none','SECTION_SIGNATURE_INTENT_MISMATCH');if(signaturePolicy.requireSignature||signaturePolicy.expectedPublicKeyHex!==null)invalid('SECTION_SIGNATURE_REQUIRED');const result={status:'absent',...common};C.validate('SectionSignatureVerification06',result);return result;}
 const raw=entries['signature.kdsig'],bundle=parse(raw),actualIntent=intent(Object.entries(entries).map(([name,b])=>({name,size:b.length})));
 C.need(digestCanonical(actualIntent)===digestCanonical(readIntent),'SECTION_SIGNATURE_INTENT_MISMATCH');
 if(signaturePolicy.expectedPublicKeyHex!==null&&bundle.public_key!==signaturePolicy.expectedPublicKeyHex)invalid('SECTION_SIGNATURE_PIN_MISMATCH','/signature.kdsig/public_key');
 const observed=domain(entries);
 try{signature.verifySignatureBundle(Buffer.from(raw),observed.observed);}catch(e){if(e.code==='KDNA_INTEGRITY_SIGNATURE_FAILED')invalid();throw e;}
 const result={status:signaturePolicy.expectedPublicKeyHex===null?'verified_self_key':'verified_pinned_key',...common,profile:PROFILE,profile_version:VERSION,algorithm:'ed25519',signature_document_digest:digest(raw),expected_signature_content_digest:bundle.content_digest,observed_signature_content_digest:observed.observed,public_key:bundle.public_key,key_fingerprint:signature.keyFingerprint(bundle.public_key),members:observed.members,excluded_members:observed.excluded_members};C.validate('SectionSignatureVerification06',result);return result;
}
async function readScoped(capture,readIntent){
 if(readIntent.operation==='none')return null;
 // No ordinary semantic touched-set changes: these bytes prove signatures, not frame semantics.
 const entries=Object.create(null),sig=readIntent.signature_member;
 if(sig.bytes>1048576)invalid();entries[sig.name]=await capture.signatureMemberAfterAuthorization(sig.name,'signature_document_after_authorization');
 for(const row of readIntent.covered_members){entries[row.name]=row.name==='kdna.json'?capture.manifestBytes:await capture.signatureMemberAfterAuthorization(row.name,'signature_member_after_authorization');C.need(entries[row.name].length===row.bytes,'SECTION_SIGNATURE_INTENT_MISMATCH');}
 // Other excluded entries cannot occur in the current admitted 0.6 member grammar.
 C.need(readIntent.excluded_members.every(name=>name==='signature.kdsig'),'SECTION_SIGNATURE_INTENT_MISMATCH');await capture.assertUnchanged();return entries;
}
async function completeScoped(capture,checksumState,requestDigest,signaturePolicy,readIntent){
 const actual=await readScoped(capture,readIntent),checksums=await require('./section-checksums.js').completeScopedChecksums(capture,checksumState,requestDigest,actual);
 const signature_integrity=verify(actual??{},signaturePolicy,capture.identity.capture_id,requestDigest,readIntent);await capture.assertUnchanged();return {...checksums,signature_integrity};
}
function produce(entries,manifest,observations,metadata,captureId,requestDigest,io,packNames,options,seed){
 C.validate('SectionSignatureProducerOptions06',options);
 const sourceDomain=domain(entries).observed,working={...entries};
 if(options.checksums==='document_2'){const doc=require('./section-checksums.js').documentFor(working,observations);C.validate('ChecksumsDocument06',doc);working['checksums.json']=Buffer.from(C.strict.canonicalJson(doc),'utf8');C.need(working['checksums.json'].length<=1048576,'SECTION_CHECKSUMS_INVALID');}
 working['signature.kdsig']=original.signEntries(working,seed);
 const members=metadata.map(row=>({name:row.name,mode:row.mode,bytes:working[row.name]}));for(const name of ['checksums.json','signature.kdsig'])if(Object.hasOwn(working,name)&&!Object.hasOwn(entries,name))members.push({name,mode:0o100644,bytes:working[name]});
 const bytes=encodeStored(members),output=parseSectionContainer(bytes,(b,maxOutputLength)=>inflateRawSync(b,{maxOutputLength}));
 for(const [name,value]of Object.entries(entries))if(name!=='signature.kdsig'&&!(name==='checksums.json'&&options.checksums==='document_2'))C.need(Buffer.from(output[name]).equals(Buffer.from(value)),'SECTION_PRODUCER_MEMBER_CHANGED');
 C.need(Object.keys(output).length===Object.keys(working).length,'SECTION_PRODUCER_MEMBER_CHANGED');
 const observed=observeWhole(bytes,output,manifest,packNames);C.need(observed.C===observations.C&&observed.E.digest===observations.E.digest,'SECTION_PRODUCER_DIGEST_CHANGED');require('./section-checksums.js').verifyChecksums(output,observed,captureId,requestDigest);
 const receipt=verify(output,DEFAULT_POLICY,captureId,requestDigest,intent(Object.entries(output).map(([name,b])=>({name,size:b.length}))));
 const evidence={contract:C.contract.module.id,proof:'producer_observation_not_consumer_admission',profile:PROFILE,profile_version:VERSION,algorithm:'ed25519',options,source:{A:observations.A,C:observations.C,E:observations.E.digest,signature_content_digest:sourceDomain,capture_id:captureId,request_digest:requestDigest},output:{A:observed.A,C:observed.C,E:observed.E.digest,byte_length:bytes.length,signature_document_digest:receipt.signature_document_digest,signature_content_digest:receipt.observed_signature_content_digest,public_key:receipt.public_key,key_fingerprint:receipt.key_fingerprint},signed_member_names:receipt.members.map(row=>row.name)};C.validate('SectionSignatureProducerEvidence06',evidence);
 return Object.freeze({status:'produced',bytes,evidence:C.strict.freeze(evidence),io:C.strict.freeze(structuredClone(io))});
}
module.exports={copySeed,policy,intent,authorizationContext,verify,completeScoped,produce};
