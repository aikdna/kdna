"use strict";
const C=require('./section-common.js'),F=require('./failure-state.js'),B=require('./bytes.js');
const {requests,snapshots,byteOrigins}=require('../section-native-state.js');
const {authorities}=require('../section-browser-state.js');
const definition=require('../browserwhole06/descriptor.json'),validators=require('../browserwhole06/validators.cjs');
const {ownBytes}=require('./section-owned-bytes-browser.js');
const {openOwnedSectionCapture}=require('./section-capture-bytes.js');
const {parseSectionContainer}=require('./section-container.js'),{inflate}=require('./portable-inflate.js');
const {restoreWholeFrames}=require('./section-frame-graph.js'),{reconstructPayload}=require('./section-reconstruct.js');
const {observeWhole}=require('./section-digests.js'),{validateDecodedPayload,assertContentBindings}=require('./semantic-admission.js');
const {buildIR}=require('./canonical-ir.js'),{digestCanonical,evidence}=require('./digests.js');
const checksums=require('./section-checksums.js'),signatures=require('./section-signatures.js');
const contract=C.strict.freeze(definition),tuple=C.contract.module.versionTuple;
function typed(name,value){C.strict.assertStrictJson(value);if(!validators[name](value))throw new Error('INTERNAL_BROWSER_BYTE_RESULT_SHAPE');return C.strict.freeze(value);}
function classify(code){return ['PROTECTION_BINDING_UNIMPLEMENTED','CHECKSUMS_PROFILE_UNSUPPORTED','SIGNATURE_PROFILE_UNSUPPORTED'].includes(code)?'unsupported':'rejected';}
// F2: one bounded metadata classifier for the three public read entries. It reads
// only two bounded windows - the EOCD tail and the central directory - never the
// whole container, and it never mutates a shared module. Empty input (no ZIP
// structure) is reported as READ_INPUT_INVALID; a container that is recognisable
// but damaged keeps READ_CORE_INVALID (the published Python contract pins that
// for damaged member streams); a readable container of another family (a
// payload-family member set) is reported as READ_UNSUPPORTED_VERSION.
const INPUT_MARKERS={eocd:Uint8Array.from([80,75,5,6]),payload:Uint8Array.from([112,97,121,108,111,97,100,46,107,100,110,97,98]),frames:Uint8Array.from([115,101,99,116,105,111,110,115,47,112,97,99,107,45])};
const INPUT_TAIL=65557,DIR_SCAN_CAP=1048576;
function findBytes(bytes,needle,from=0,to=bytes.length){const last=Math.min(to,bytes.length)-needle.length;outer:for(let i=from;i<=last;i++){for(let j=0;j<needle.length;j++)if(bytes[i+j]!==needle[j])continue outer;return i;}return -1;}
function containerMeta(bytes){
 const view=bytes&&bytes.length>=4?bytes:null;
 const zipMagic=view&&view[0]===0x50&&view[1]===0x4b&&(view[2]===0x03||view[2]===0x05||view[2]===0x07);
 const tailStart=Math.max(0,bytes.length-INPUT_TAIL),eocd=bytes.length>=22?findBytes(bytes,INPUT_MARKERS.eocd,tailStart):-1;
 if(!zipMagic&&eocd===-1)return {kind:'not_container'};
 if(eocd===-1)return {kind:'damaged'};
 const cdStart=(bytes[eocd+16]|(bytes[eocd+17]<<8)|(bytes[eocd+18]<<16)|(bytes[eocd+19]<<24))>>>0;
 const cdSize=(bytes[eocd+12]|(bytes[eocd+13]<<8)|(bytes[eocd+14]<<16)|(bytes[eocd+15]<<24))>>>0;
 if(cdStart+cdSize>bytes.length||cdSize>DIR_SCAN_CAP)return {kind:'damaged'};
 const hasPayload=findBytes(bytes,INPUT_MARKERS.payload,cdStart,cdStart+cdSize)!==-1;
 const hasFrames=findBytes(bytes,INPUT_MARKERS.frames,cdStart,cdStart+cdSize)!==-1;
 return hasPayload&&!hasFrames?{kind:'other_family'}:{kind:'damaged'};
}
function inputFailureClass(bytes){
 const meta=containerMeta(bytes);
 if(meta.kind==='not_container')return {reason:'READ_INPUT_INVALID',stage:'input',diagnostic:null};
 if(meta.kind==='other_family')return {reason:'READ_UNSUPPORTED_VERSION',stage:'metadata',diagnostic:{field:'/payload.kdnab',subject:null}};
 return null;
}
async function admitSectionBytesBrowser(input,admitted,authority){
 let capture,owned,length=null,stage='input';const io=[];
 function observation(){if(length===null)return null;return typed('NativeBrowserSectionByteObservation06',{contract,input_kind:'owned_uint8array',input_byte_length:length,ownership_copy:{offset_bytes:0,length_bytes:length},capture:capture?structuredClone(capture.identity):null,access_ranges:structuredClone(io),filesystem_reads:0});}
 function failure(status,reason,diagnostic=null){return typed('NativeBrowserSectionByteRejected06',{contract,request_id:requests.get(admitted)?.data.request_id??null,status,reason,stage,diagnostic,input_observation:observation(),snapshot:null});}
 try{
  const request=requests.get(admitted),record=authorities.get(authority);C.need(request&&record,'SECTION_NATIVE_REQUEST_OR_AUTHORITY_UNTRUSTED');
  if(request.data.mode!=='whole_asset')return failure('unsupported','READ_CORE_CAPABILITY_UNAVAILABLE');
  // The complete exact-view copy finishes synchronously before the first await or callback.
  try{owned=ownBytes(input);}catch{C.need(false,'READ_INPUT_INVALID');}length=owned.length;
  capture=await openOwnedSectionCapture(owned,io);stage='metadata';
  const manifest=C.strict.parseJson(capture.manifestBytes);C.validate('Manifest06Candidate',manifest);
  if(manifest.payload.encrypted||manifest.encryption||manifest.entitlement)return failure('unsupported','PROTECTION_BINDING_UNIMPLEMENTED');
  const {authorize,policy:signaturePolicy}=record,oldContext=signatures.authorizationContext({},capture,signaturePolicy);
  const authorization=typed('NativeBrowserSectionByteAuthorityContext06',{contract,operation:'admit_owned_whole',request:structuredClone(request.data),request_digest:request.digest,input_observation:observation(),manifest_identity:{asset_id:manifest.asset_id,asset_version:manifest.version,judgment_version:manifest.judgment_version},signature_policy:signaturePolicy,signature_policy_digest:oldContext.signature_policy_digest,signature_read_intent:oldContext.signature_read_intent,signature_read_intent_digest:oldContext.signature_read_intent_digest});
  stage='authorization';let grant;
  try{grant=await authorize(authorization);}catch{C.need(false,'READ_CORE_CAPABILITY_UNAVAILABLE');}
  C.need(grant===true,'SECTION_PERMISSION_DENIED');
  stage='content';const bytes=await capture.wholeAfterAuthorization(),metadata=[],entries=parseSectionContainer(bytes,inflate,metadata);
  C.need(B.equal(entries['kdna.json'],capture.manifestBytes),'SECTION_CAPTURE_CHANGED');
  const restored=restoreWholeFrames(entries,manifest),payload=reconstructPayload(restored.ir);stage='semantic';validateDecodedPayload(manifest,payload);
  // Preserve original domain interpretation, then replace only the representation/read tuple.
  const derived={...buildIR(manifest,payload,entries),tuple:structuredClone(tuple)};
  C.need(digestCanonical(derived)===digestCanonical(restored.ir),'SECTION_DERIVED_IR_MISMATCH');
  const observations=observeWhole(bytes,entries,manifest,restored.pack_names);assertContentBindings(manifest,observations.C);
  stage='integrity';const checksum_integrity=checksums.verifyChecksums(entries,observations,capture.identity.capture_id,request.digest),signature_integrity=await signatures.verify(entries,signaturePolicy,capture.identity.capture_id,request.digest,authorization.signature_read_intent);await capture.assertUnchanged();
  const verification={signature_integrity,checksum_integrity,capture:{...capture.identity,table_frames:restored.checked_sections.filter(x=>x.section_id.startsWith('table:'))},request_digest:request.digest,checked_sections:restored.checked_sections,unchecked_sections:[],routing_integrity:'checked',runtime_entry_digest:observations.E,whole_container_digest:{profile:'kdna.digest-basis.container-bytes/0.2.0',status:'verified',digest:observations.A},whole_content_digest:{profile:'kdna.digest-basis.content-tree/0.2.0',status:'verified',digest:observations.C},ir_digest:{profile:'CanonicalIR:SHA-256(RFC8785):existing-digestCanonical',status:'verified',digest:digestCanonical(derived)},mode:'whole_asset',semantic_status:'verified_whole_graph'};
  const expectedC=manifest.content_digest??manifest.authoring?.content_digest??null,digests={A:evidence('A',observations.A),C:evidence('C',observations.C,expectedC,expectedC?{kind:'manifest_declaration',source_id:manifest.content_digest?'kdna.json':'kdna.json/authoring/content_digest'}:null),E:{...evidence('E',observations.E.digest,checksum_integrity.status==='verified_document_2'?checksum_integrity.expected_entry_set_digest:null,checksum_integrity.status==='verified_document_2'?{kind:'checksums_declaration',source_id:'checksums.json'}:null),profile_version:'0.3.0-candidate'}};
  const data={digests,snapshot_id:'section-snapshot:'+globalThis.crypto.randomUUID(),tuple:structuredClone(tuple),asset:structuredClone(payload.asset),ir:derived,runtime_entry_names:observations.E.member_names,verification};C.validate('WholeSectionSnapshotData06',data);
  const input_observation=observation(),view=C.strict.freeze(data),snapshot=Object.freeze({});
  // Opaque schema is intentionally false for JSON input; the existing private owner mints this token.
  const result=Object.freeze({status:'accepted',snapshot,input_observation});
  snapshots.set(snapshot,view);byteOrigins.add(snapshot);return result;
 }catch(error){const held=F.info(error),code=held?.code??'READ_CORE_CAPABILITY_UNAVAILABLE';const classified=stage==='input'&&code==='READ_CORE_INVALID'?inputFailureClass(owned):null;if(classified){stage=classified.stage;return failure(classify(classified.reason),classified.reason,classified.diagnostic);}return failure(classify(code),code,held?.diagnostic??null);}
 finally{if(capture)await capture.close();}
}
module.exports={admitSectionBytesBrowser};
