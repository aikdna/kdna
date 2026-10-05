"use strict";
const C=require('./section-common.js'),{digest,digestCanonical}=require('./digests.js');
const B=require('./bytes.js'),F=require('./failure-state.js'),original=require('./signature-domain.js');
const PROFILE='kdsig.ed25519',VERSION='0.1.0';
function invalid(code='SECTION_SIGNATURE_INVALID',field='/signature.kdsig',subject=null){F.fail(code,{field,subject:typeof subject==='string'&&C.strict.identifier(subject)?subject:null});}
function excluded(name){return ['.DS_Store','build-receipt.json','signature.kdsig'].includes(name)||name.startsWith('reports/');}
function intent(rows){
 const sig=rows.find(r=>r.name==='signature.kdsig');
 const result=sig?{operation:'verify_complete_original_kdsig_domain',signature_member:{name:sig.name,bytes:sig.size},covered_members:rows.filter(r=>!excluded(r.name)).sort((a,b)=>C.utf8(a.name,b.name)).map(r=>({name:r.name,bytes:r.size})),excluded_members:rows.filter(r=>excluded(r.name)).map(r=>r.name).sort(C.utf8),profile:PROFILE,profile_version:VERSION}:{operation:'none'};
 C.validate('SectionSignatureReadIntent06',result);return C.strict.freeze(result);
}
function authorizationContext(context,capture,signaturePolicy){const readIntent=intent(capture.rows);return C.strict.freeze({...context,signature_policy:signaturePolicy,signature_policy_digest:digestCanonical(signaturePolicy),signature_read_intent:readIntent,signature_read_intent_digest:digestCanonical(readIntent)});}
function malformedJson(raw){let text;try{text=B.decoder.decode(raw);}catch{return true;}try{JSON.parse(text);return false;}catch{return true;}}
function isJsonDataFailure(error,raw){return ['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(F.info(error)?.code)||malformedJson(raw);}
function parse(raw){
 if(raw.length>1048576)invalid();let value;
 try{value=C.strict.parseJson(raw);}catch(error){if(isJsonDataFailure(error,raw))invalid();throw error;}
 const fields=['algorithm','content_digest','profile','profile_version','public_key','signature'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==fields.length||!fields.every(k=>Object.hasOwn(value,k)&&typeof value[k]==='string'))invalid();
 if(!/^sha256:[0-9a-f]{64}$/.test(value.content_digest)||! /^[0-9a-f]{64}$/.test(value.public_key)||! /^[0-9a-f]{128}$/.test(value.signature))invalid();
 if(value.profile!==PROFILE||value.profile_version!==VERSION||value.algorithm!=='ed25519')invalid('SIGNATURE_PROFILE_UNSUPPORTED');
 // Original parseSignatureBundle uses JSON.parse on UTF8 text, retaining a leading BOM.
 // Preserve that rejection after the original outer profile checks, not before them.
 if(raw.length>=3&&raw[0]===0xef&&raw[1]===0xbb&&raw[2]===0xbf)invalid();
 return value;
}
function domain(entries){
 const names=Object.keys(entries).filter(name=>!excluded(name)).sort(C.utf8),rows=[],members=[];
 for(const name of names){let row;try{row=B.decoder.decode(original.signatureContentPreimage({[name]:entries[name]}));}catch(error){if(/\.json$/i.test(name)&&isJsonDataFailure(error,entries[name]))invalid('SECTION_SIGNATURE_INVALID','/'+name,name);throw error;}
  rows.push(row);members.push({name,bytes:entries[name].length,raw_digest:digest(entries[name]),signature_basis_digest:'sha256:'+row.slice(-64)});
 }
 return {observed:digest(B.utf8(rows.join('\n'))),members,excluded_members:Object.keys(entries).filter(excluded).sort(C.utf8)};
}
async function verify(entries,signaturePolicy,captureId,requestDigest,readIntent){
 const common={policy:signaturePolicy,policy_digest:digestCanonical(signaturePolicy),read_intent_digest:digestCanonical(readIntent),capture_id:captureId,request_digest:requestDigest};
 if(!Object.hasOwn(entries,'signature.kdsig')){C.need(readIntent.operation==='none','SECTION_SIGNATURE_INTENT_MISMATCH');if(signaturePolicy.requireSignature||signaturePolicy.expectedPublicKeyHex!==null)invalid('SECTION_SIGNATURE_REQUIRED');const result={status:'absent',...common};C.validate('SectionSignatureVerification06',result);return result;}
 const raw=entries['signature.kdsig'],bundle=parse(raw),actualIntent=intent(Object.entries(entries).map(([name,b])=>({name,size:b.length})));
 C.need(digestCanonical(actualIntent)===digestCanonical(readIntent),'SECTION_SIGNATURE_INTENT_MISMATCH');
 if(signaturePolicy.expectedPublicKeyHex!==null&&bundle.public_key!==signaturePolicy.expectedPublicKeyHex)invalid('SECTION_SIGNATURE_PIN_MISMATCH','/signature.kdsig/public_key');
 const observed=domain(entries);if(bundle.content_digest!==observed.observed)invalid();
 const subtle=globalThis.crypto?.subtle;C.need(subtle&&typeof subtle.importKey==='function'&&typeof subtle.verify==='function','READ_CORE_CAPABILITY_UNAVAILABLE');
 const keyBytes=B.fromHex(bundle.public_key),signatureBytes=B.fromHex(bundle.signature);
 let valid;
 // Platform exceptions are capability failures regardless of thrown-value identity.
 try{const key=await subtle.importKey('raw',keyBytes,'Ed25519',false,['verify']);valid=await subtle.verify('Ed25519',key,signatureBytes,B.utf8('kdsig.ed25519:0.1.0:'+observed.observed));}
 catch{C.need(false,'READ_CORE_CAPABILITY_UNAVAILABLE');}
 if(valid!==true)invalid();
 const result={status:signaturePolicy.expectedPublicKeyHex===null?'verified_self_key':'verified_pinned_key',...common,profile:PROFILE,profile_version:VERSION,algorithm:'ed25519',signature_document_digest:digest(raw),expected_signature_content_digest:bundle.content_digest,observed_signature_content_digest:observed.observed,public_key:bundle.public_key,key_fingerprint:digest(keyBytes),members:observed.members,excluded_members:observed.excluded_members};C.validate('SectionSignatureVerification06',result);return result;
}
module.exports={authorizationContext,verify};
