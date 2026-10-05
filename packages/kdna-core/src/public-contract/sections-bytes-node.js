'use strict';
const knownSemanticReasons=new Set(['READ_INPUT_INVALID','READ_CORE_INVALID','READ_CORE_CAPABILITY_UNAVAILABLE','READ_UNSUPPORTED_CRITICAL','READ_INTERPRETATION_INCOMPLETE','READ_STATIC_POLICY_INVALID',...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum]);
const {inflateRawSync}=require('node:zlib');
const C=require('./section-common.js');
const {requests,snapshots,byteOrigins}=require('./section-native-state.js');
const {openOwnedSectionCapture}=require('./section-capture-bytes.js');
const {ownBytes}=require('./section-owned-bytes.js');
const {parseSectionContainer}=require('./section-container.js');
const {restoreWholeFrames}=require('./section-frame-graph.js');
const {reconstructPayload}=require('./section-reconstruct.js');
const {observeWhole}=require('./section-digests.js');
const {validateDecodedPayload,assertContentBindings}=require('./semantic-admission.js');
const {buildIR}=require('./canonical-ir.js');
const {digestCanonical,evidence}=require('./digests.js');
const checksums=require('./section-checksums.js'),signatures=require('./section-signatures.js');
const definition=require('./sectionbytes/contract.json');
const validators=require('./sectionbytes/validators.cjs');
const contract=Object.freeze({id:definition.module.id,version:definition.module.version,definition_digest:digestCanonical(definition.module)});
const tuple=C.contract.module.versionTuple;
const authorities=new WeakMap();
function typed(name,value){
 C.strict.assertStrictJson(value);
 if(!validators[name](value))throw new Error('INTERNAL_BYTE_RESULT_SHAPE');
 return C.strict.freeze(value);
}
function createNativeSectionByteReadAuthority(callback,signaturePolicy){
 C.need(typeof callback==='function','SECTION_AUTHORITY_CALLBACK');
 const token=Object.freeze({});
 authorities.set(token,Object.freeze({authorize:callback,policy:signatures.policy(signaturePolicy)}));
 require('./section-byte-authority-state.js').add(token);
 return token;
}
function classify(code){
 return ['PROTECTION_BINDING_UNIMPLEMENTED','CHECKSUMS_PROFILE_UNSUPPORTED','SIGNATURE_PROFILE_UNSUPPORTED'].includes(code)?'unsupported':'rejected';
}
async function admitSectionBytesNode(input,admitted,authority){
 let capture,owned,length=null,stage='input';
 const io=[];
 function observation(){
  if(length===null)return null;
  return typed('NativeSectionByteObservation06',{contract,input_kind:'owned_uint8array',input_byte_length:length,
   ownership_copy:{offset_bytes:0,length_bytes:length},capture:capture?structuredClone(capture.identity):null,
   access_ranges:structuredClone(io),filesystem_reads:0});
 }
 function failure(status,reason,diagnostic=null){
  return typed('NativeSectionByteRejected06',{contract,request_id:requests.get(admitted)?.data.request_id??null,
   status,reason,stage,diagnostic:diagnostic?{field:diagnostic.field??null,subject:diagnostic.subject??null}:null,
   input_observation:observation(),snapshot:null});
 }
 try{
  const request=requests.get(admitted),authorityRecord=authorities.get(authority);
  C.need(request&&authorityRecord,'SECTION_NATIVE_REQUEST_OR_AUTHORITY_UNTRUSTED');
  if(request.data.mode!=='whole_asset')return failure('unsupported','READ_CORE_CAPABILITY_UNAVAILABLE');
  // No await/callback occurs before this complete owned copy.
  owned=ownBytes(input);length=owned.length;
  capture=await openOwnedSectionCapture(owned,io);
  stage='metadata';const manifest=C.strict.parseJson(capture.manifestBytes);C.validate('Manifest06Candidate',manifest);
  if(manifest.payload.encrypted||manifest.encryption||manifest.entitlement)return failure('unsupported','PROTECTION_BINDING_UNIMPLEMENTED');
  const {authorize,policy:signaturePolicy}=authorityRecord;
  const oldContext=signatures.authorizationContext({},capture,signaturePolicy);
  const authorization=typed('NativeSectionByteAuthorityContext06',{contract,operation:'admit_owned_whole',
   request:structuredClone(request.data),request_digest:request.digest,input_observation:observation(),
   manifest_identity:{asset_id:manifest.asset_id,asset_version:manifest.version,judgment_version:manifest.judgment_version},
   signature_policy:signaturePolicy,signature_policy_digest:oldContext.signature_policy_digest,
   signature_read_intent:oldContext.signature_read_intent,signature_read_intent_digest:oldContext.signature_read_intent_digest});
  stage='authorization';let grant;
  try{grant=await authorize(authorization);}catch{C.need(false,'READ_CORE_CAPABILITY_UNAVAILABLE');}
  C.need(grant===true,'SECTION_PERMISSION_DENIED');
  stage='content';const bytes=await capture.wholeAfterAuthorization(),metadata=[],entries=parseSectionContainer(bytes,(b,maxOutputLength)=>inflateRawSync(b,{maxOutputLength}),metadata);
  C.need(Buffer.from(entries['kdna.json']).equals(Buffer.from(capture.manifestBytes)),'SECTION_CAPTURE_CHANGED');
  const restored=restoreWholeFrames(entries,manifest),payload=reconstructPayload(restored.ir);
  stage='semantic';validateDecodedPayload(manifest,payload);
  // Domain interpretation remains the unchanged Core path. Only representation/read tuple coordinates bind to this candidate.
  const derived={...buildIR(manifest,payload,entries),tuple:structuredClone(tuple)};
  C.need(digestCanonical(derived)===digestCanonical(restored.ir),'SECTION_DERIVED_IR_MISMATCH');
  const observations=observeWhole(bytes,entries,manifest,restored.pack_names);assertContentBindings(manifest,observations.C);
  stage='integrity';const checksum_integrity=checksums.verifyChecksums(entries,observations,capture.identity.capture_id,request.digest),signature_integrity=signatures.verify(entries,signaturePolicy,capture.identity.capture_id,request.digest,authorization.signature_read_intent);await capture.assertUnchanged();
  const verification={signature_integrity,checksum_integrity,capture:{...capture.identity,table_frames:restored.checked_sections.filter(x=>x.section_id.startsWith('table:'))},request_digest:request.digest,checked_sections:restored.checked_sections,unchecked_sections:[],routing_integrity:'checked',runtime_entry_digest:observations.E,whole_container_digest:{profile:'kdna.digest-basis.container-bytes/0.2.0',status:'verified',digest:observations.A},whole_content_digest:{profile:'kdna.digest-basis.content-tree/0.2.0',status:'verified',digest:observations.C},ir_digest:{profile:'CanonicalIR:SHA-256(RFC8785):existing-digestCanonical',status:'verified',digest:digestCanonical(derived)},mode:'whole_asset',semantic_status:'verified_whole_graph'};
  const expectedC=manifest.content_digest??manifest.authoring?.content_digest??null;const digests={A:evidence('A',observations.A),C:evidence('C',observations.C,expectedC,expectedC?{kind:'manifest_declaration',source_id:manifest.content_digest?'kdna.json':'kdna.json/authoring/content_digest'}:null),E:{...evidence('E',observations.E.digest,checksum_integrity.status==='verified_document_2'?checksum_integrity.expected_entry_set_digest:null,checksum_integrity.status==='verified_document_2'?{kind:'checksums_declaration',source_id:'checksums.json'}:null),profile_version:'0.3.0-candidate'}};
  const data={digests,snapshot_id:'section-snapshot:'+globalThis.crypto.randomUUID(),tuple:structuredClone(tuple),asset:structuredClone(payload.asset),ir:derived,runtime_entry_names:observations.E.member_names,verification};C.validate('WholeSectionSnapshotData06',data);
  const view=C.strict.freeze(data),snapshot=Object.freeze({});snapshots.set(snapshot,view);byteOrigins.add(snapshot);
  return Object.freeze({status:'accepted',snapshot,input_observation:observation()});

 }catch(error){
  const nativeFailure=C.isFailure(error),semanticFailure=knownSemanticReasons.has(error?.reason);
  const code=nativeFailure?error.code:semanticFailure?error.reason:'READ_CORE_CAPABILITY_UNAVAILABLE';
  return failure(classify(code),code,nativeFailure||semanticFailure?error?.diagnostic:null);
 }finally{
  if(capture)await capture.close();
 }
}
module.exports={createNativeSectionByteReadAuthority,admitSectionBytesNode};
