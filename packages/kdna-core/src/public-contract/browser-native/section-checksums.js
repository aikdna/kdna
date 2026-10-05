'use strict';
const C=require('./section-common.js'),{digest}=require('./digests.js');
const PROFILE='kdna.checksums.document/2',VERSION='2.0.0-candidate';
function invalid(field='/checksums.json',subject=null){require('./failure-state.js').fail('SECTION_CHECKSUMS_INVALID',{field,subject:typeof subject==='string'&&C.strict.identifier(subject)?subject:null});}
function documentFor(entries,observations){const names=observations.E.member_names;return {profile:PROFILE,profile_version:VERSION,algorithm:'sha256',digest_profile:'kdna.digest-basis.runtime-entry-set',digest_profile_version:'0.3.0-candidate',covered_entries:[...names],entries:names.map(name=>({name,bytes:entries[name].length,digest:digest(entries[name])})),entry_set_digest:observations.E.digest};}
function firstDifference(actual,expected,pointer='/checksums.json'){
 if(actual===expected)return null;
 if(!actual||!expected||typeof actual!=='object'||typeof expected!=='object')return pointer;
 const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])];
 for(const key of keys){if(!Object.hasOwn(actual,key)||!Object.hasOwn(expected,key))return pointer+'/'+key;const found=firstDifference(actual[key],expected[key],pointer+'/'+key);if(found)return found;}return null;
}
function parseChecksums(raw){
 if(raw.length>1048576)invalid();let value;
 try{value=C.strict.parseJson(raw);}catch(e){if(['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(C.failureInfo(e)?.code))invalid();throw e;}
 if(!value||typeof value!=='object'||Array.isArray(value)||!['profile','profile_version','digest_profile','digest_profile_version'].every(key=>Object.hasOwn(value,key)&&typeof value[key]==='string'))invalid();
 if(value.profile!==PROFILE||value?.profile_version!==VERSION||value?.digest_profile!=='kdna.digest-basis.runtime-entry-set'||value?.digest_profile_version!=='0.3.0-candidate')C.need(false,'CHECKSUMS_PROFILE_UNSUPPORTED');
 try{C.validate('ChecksumsDocument06',value);}catch(e){if(C.isFailure(e)||['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(C.failureInfo(e)?.code))invalid();throw e;}
 return value;
}
function verifyChecksums(entries,observations,captureId,requestDigest){
 if(!Object.hasOwn(entries,'checksums.json'))return {status:'absent'};
 const raw=entries['checksums.json'],value=parseChecksums(raw);
 const expected=documentFor(entries,observations),field=firstDifference(value,expected);
 if(field){const match=field.match(/^\/checksums.json\/entries\/(\d+)(?:\/|$)/);invalid(field,match?expected.entries[Number(match[1])]?.name:null);}
 return {status:'verified_document_2',profile:PROFILE,profile_version:VERSION,document_digest:digest(raw),expected_entry_set_digest:value.entry_set_digest,observed_entry_set_digest:observations.E.digest,covered_entries:[...observations.E.member_names],capture_id:captureId,request_digest:requestDigest,observed_A:observations.A,observed_C:observations.C};
}
module.exports={verifyChecksums};
