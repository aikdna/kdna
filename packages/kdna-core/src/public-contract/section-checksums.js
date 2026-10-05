'use strict';
const {inflateRawSync}=require('node:zlib');
const C=require('./section-common.js'),{digest}=require('./digests.js'),{observeWhole}=require('./section-digests.js'),{parseSectionContainer}=require('./section-container.js'),{encodeStored}=require('./container-writer.js');
const PROFILE='kdna.checksums.document/2',VERSION='2.0.0-candidate';
function invalid(field='/checksums.json',subject=null){try{C.need(false,'SECTION_CHECKSUMS_INVALID');}catch(e){e.diagnostic={field,subject:typeof subject==='string'&&C.strict.identifier(subject)?subject:null};throw e;}}
function documentFor(entries,observations){const names=observations.E.member_names;return {profile:PROFILE,profile_version:VERSION,algorithm:'sha256',digest_profile:'kdna.digest-basis.runtime-entry-set',digest_profile_version:'0.3.0-candidate',covered_entries:[...names],entries:names.map(name=>({name,bytes:entries[name].length,digest:digest(entries[name])})),entry_set_digest:observations.E.digest};}
function firstDifference(actual,expected,pointer='/checksums.json'){
 if(actual===expected)return null;
 if(!actual||!expected||typeof actual!=='object'||typeof expected!=='object')return pointer;
 const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])];
 for(const key of keys){if(!Object.hasOwn(actual,key)||!Object.hasOwn(expected,key))return pointer+'/'+key;const found=firstDifference(actual[key],expected[key],pointer+'/'+key);if(found)return found;}return null;
}
function parseChecksums(raw){
 if(raw.length>1048576)invalid();let value;
 try{value=C.strict.parseJson(raw);}catch(e){if(['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(e.reason))invalid();throw e;}
 if(!value||typeof value!=='object'||Array.isArray(value)||!['profile','profile_version','digest_profile','digest_profile_version'].every(key=>Object.hasOwn(value,key)&&typeof value[key]==='string'))invalid();
 if(value.profile!==PROFILE||value?.profile_version!==VERSION||value?.digest_profile!=='kdna.digest-basis.runtime-entry-set'||value?.digest_profile_version!=='0.3.0-candidate')C.need(false,'CHECKSUMS_PROFILE_UNSUPPORTED');
 try{C.validate('ChecksumsDocument06',value);}catch(e){if(C.isFailure(e)||['READ_INPUT_INVALID','READ_CORE_INVALID'].includes(e.reason))invalid();throw e;}
 return value;
}
function verifyChecksums(entries,observations,captureId,requestDigest){
 if(!Object.hasOwn(entries,'checksums.json'))return {status:'absent'};
 const raw=entries['checksums.json'],value=parseChecksums(raw);
 const expected=documentFor(entries,observations),field=firstDifference(value,expected);
 if(field){const match=field.match(/^\/checksums.json\/entries\/(\d+)(?:\/|$)/);invalid(field,match?expected.entries[Number(match[1])]?.name:null);}
 return {status:'verified_document_2',profile:PROFILE,profile_version:VERSION,document_digest:digest(raw),expected_entry_set_digest:value.entry_set_digest,observed_entry_set_digest:observations.E.digest,covered_entries:[...observations.E.member_names],capture_id:captureId,request_digest:requestDigest,observed_A:observations.A,observed_C:observations.C};
}
function produceChecksums(entries,manifest,observations,metadata,captureId,requestDigest,io,packNames){
 const doc=documentFor(entries,observations);C.validate('ChecksumsDocument06',doc);const documentBytes=Buffer.from(C.strict.canonicalJson(doc),'utf8');C.need(documentBytes.length<=1048576,'SECTION_CHECKSUMS_INVALID');
 const members=metadata.map(row=>({name:row.name,mode:row.mode,bytes:row.name==='checksums.json'?documentBytes:entries[row.name]}));
 if(!Object.hasOwn(entries,'checksums.json'))members.push({name:'checksums.json',mode:0o100644,bytes:documentBytes});
 const bytes=encodeStored(members),output=parseSectionContainer(bytes,(b,maxOutputLength)=>inflateRawSync(b,{maxOutputLength}));
 for(const [name,value]of Object.entries(entries))if(name!=='checksums.json')C.need(Buffer.from(output[name]).equals(Buffer.from(value)),'SECTION_PRODUCER_MEMBER_CHANGED');
 C.need(Object.keys(output).length===Object.keys(entries).length+(Object.hasOwn(entries,'checksums.json')?0:1),'SECTION_PRODUCER_MEMBER_CHANGED');
 const observed=observeWhole(bytes,output,manifest,packNames);C.need(observed.C===observations.C&&observed.E.digest===observations.E.digest,'SECTION_PRODUCER_DIGEST_CHANGED');
 verifyChecksums(output,observed,captureId,requestDigest);
 if(Object.hasOwn(output,'signature.kdsig')){const S=require('./section-signatures.js');S.verify(output,S.policy(),captureId,requestDigest,S.intent(Object.entries(output).map(([name,b])=>({name,size:b.length}))));}
 const evidence={contract:C.contract.module.id,proof:'producer_observation_not_consumer_admission',profile:PROFILE,profile_version:VERSION,source:{A:observations.A,C:observations.C,E:observations.E.digest,capture_id:captureId,request_digest:requestDigest},output:{A:observed.A,C:observed.C,E:observed.E.digest,byte_length:bytes.length,document_digest:digest(documentBytes)},covered_entries:[...observed.E.member_names]};C.validate('SectionChecksumProducerEvidence06',evidence);
 return Object.freeze({status:'produced',bytes,evidence:C.strict.freeze(evidence),io:C.strict.freeze(structuredClone(io))});
}

async function prepareScopedChecksums(capture,manifest){
 const row=capture.rows.find(r=>r.name==='checksums.json');if(!row)return null;if(row.size>1048576)invalid();
 const raw=await capture.checksumMemberAfterAuthorization('checksums.json','checksum_document_after_authorization'),value=parseChecksums(raw),members=new Map(capture.rows.map(r=>[r.name,r]));
 const declared=manifest.runtime.mandatory_entries;C.need(Array.isArray(declared)&&new Set(declared).size===declared.length,'SECTION_RUNTIME_DECLARATION');
 for(const name of declared)C.need(C.strict.entryName(name)&&members.has(name)&&!['checksums.json','signature.kdsig','mimetype','build-receipt.json'].includes(name)&&!name.startsWith('reports/')&&!name.startsWith('authoring/'),'SECTION_RUNTIME_MEMBER_MISSING');
 const names=[...new Set(['kdna.json',...capture.rows.filter(r=>r.name.startsWith('sections/')).map(r=>r.name),...declared])].sort(C.utf8);
 const field=firstDifference(value.covered_entries,names,'/checksums.json/covered_entries');if(field)invalid(field);
 if(value.entries.length!==names.length)invalid('/checksums.json/entries');
 names.forEach((name,i)=>{if(value.entries[i].name!==name)invalid('/checksums.json/entries/'+i+'/name',name);if(value.entries[i].bytes!==members.get(name).size)invalid('/checksums.json/entries/'+i+'/bytes',name);});
 return {value,names,document_digest:digest(raw)};
}
function word(n,width){C.need(Number.isSafeInteger(n)&&n>=0&&(width!==4||n<=0xffffffff),'SECTION_DIGEST_LENGTH');const b=Buffer.alloc(width);if(width===4)b.writeUInt32BE(n);else b.writeBigUInt64BE(BigInt(n));return b;}
async function completeScopedChecksums(capture,prepared,requestDigest,signatureEntries=null){
 if(!prepared)return {checksum_integrity:{status:'absent'},runtime_entry_digest:{status:'not_checked',profile:'kdna.digest-basis.runtime-entry-set/0.3.0-candidate',claimed_digest:null}};
 const {value,names,document_digest}=prepared,touched=new Set(signatureEntries?Object.keys(signatureEntries):['kdna.json',...capture.touchedMemberNames()]),required=names.filter(name=>touched.has(name)),complete=required.length===names.length,checked_entries=[],unchecked_entries=value.entries.filter(row=>!touched.has(row.name));
 const E=complete?require('node:crypto').createHash('sha256'):null;if(E){E.update(Buffer.from('KDNA-RUNTIME-ENTRY-SET\0'+'0.3.0-candidate\0'));E.update(word(names.length,4));}
 for(const name of required){const index=names.indexOf(name),expected=value.entries[index],bytes=signatureEntries?signatureEntries[name]:name==='kdna.json'?capture.manifestBytes:await capture.checksumMemberAfterAuthorization(name,'checksum_member_after_authorization'),observed=digest(bytes);
  if(bytes.length!==expected.bytes)invalid('/checksums.json/entries/'+index+'/bytes',name);if(observed!==expected.digest)invalid('/checksums.json/entries/'+index+'/digest',name);
  checked_entries.push({name,bytes:bytes.length,expected_digest:expected.digest,observed_digest:observed});if(E){const nb=Buffer.from(name);E.update(word(nb.length,4));E.update(nb);E.update(word(bytes.length,8));E.update(bytes);}
 }
 await capture.assertUnchanged();let entry_set_digest,runtime_entry_digest;
 if(E){const observed='sha256:'+E.digest('hex');if(observed!==value.entry_set_digest)invalid('/checksums.json/entry_set_digest');entry_set_digest={status:'verified',expected_digest:value.entry_set_digest,observed_digest:observed,comparison:'matched',basis:'actual_complete_member_bytes'};runtime_entry_digest={status:'verified',profile:'kdna.digest-basis.runtime-entry-set/0.3.0-candidate',digest:observed,member_names:[...names]};}
 else{C.need(unchecked_entries.length>0,'SECTION_CHECKSUMS_PARTITION');entry_set_digest={status:'not_checked',expected_digest:value.entry_set_digest,observed_digest:null,comparison:'not_compared',reason:'members_unchecked'};runtime_entry_digest={status:'not_checked',profile:'kdna.digest-basis.runtime-entry-set/0.3.0-candidate',claimed_digest:value.entry_set_digest};}
 const checksum_integrity={status:'checked_members_document_2',profile:PROFILE,profile_version:VERSION,declaration_status:'shape_and_directory_checked',document_digest,covered_entries:[...names],checked_entries,unchecked_entries,entry_set_digest,capture_id:capture.identity.capture_id,request_digest:requestDigest};C.validate('ScopedChecksumVerification06',checksum_integrity);C.validate('ScopedRuntimeEntryDigest06',runtime_entry_digest);return {checksum_integrity,runtime_entry_digest};
}

module.exports={documentFor,verifyChecksums,produceChecksums,prepareScopedChecksums,completeScopedChecksums};
