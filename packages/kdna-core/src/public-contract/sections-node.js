'use strict';
const knownSemanticReasons=new Set(['READ_INPUT_INVALID','READ_CORE_INVALID','READ_CORE_CAPABILITY_UNAVAILABLE','READ_UNSUPPORTED_CRITICAL','READ_INTERPRETATION_INCOMPLETE','READ_STATIC_POLICY_INVALID',...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum]);
const {inflateRawSync}=require('node:zlib');
const fsp=require('node:fs/promises');
const fsFlags=require('node:fs').constants;
const C=require('./section-common.js'),{openSectionCapture}=require('./section-capture-node.js'),{parseSectionContainer}=require('./section-container.js'),{restoreWholeFrames}=require('./section-frame-graph.js'),{reconstructPayload}=require('./section-reconstruct.js'),{observeWhole}=require('./section-digests.js');
const {validateDecodedPayload,assertContentBindings}=require('./semantic-admission.js'),{buildIR}=require('./canonical-ir.js'),{digestCanonical,evidence}=require('./digests.js');
const {requests,snapshots,byteOrigins}=require('./section-native-state.js'),authorities=new WeakMap();
const tuple=C.contract.module.versionTuple;
const expansion=require('./section-expansion.js');
const checksums=require('./section-checksums.js'),signatures=require('./section-signatures.js');
function bindSectionExpansionRequest(origin,candidate){C.validate('ReadRequest06Candidate',candidate);C.need(!byteOrigins.has(origin),'READ_HANDLE_STALE');const binding=expansion.bind(origin,candidate),token=admitSectionRequest(binding.request);requests.get(token).expansion=binding;return token;}
function admitSectionRequest(candidate){C.validate('ReadRequest06Candidate',candidate);const data=C.strict.freeze(structuredClone(candidate)),token=Object.freeze({});requests.set(token,{data,digest:digestCanonical(data)});return token;}
function createSectionReadAuthority(callback,signaturePolicy){C.need(typeof callback==='function','SECTION_AUTHORITY_CALLBACK');const token=Object.freeze({});authorities.set(token,Object.freeze({authorize:callback,policy:signatures.policy(signaturePolicy)}));return token;}
function inspectWholeSectionSnapshot(token){return token&&typeof token==='object'?snapshots.get(token)??null:null;}
function classify(code){return ['CONTAINER_COMMENT_CAPTURE_UNIMPLEMENTED','PROTECTION_BINDING_UNIMPLEMENTED','PARTIAL_SEMANTIC_PROOF_UNAVAILABLE','EXPAND_INTEGRATION_UNIMPLEMENTED','CHECKSUMS_PROFILE_UNSUPPORTED','CHECKSUMS_SCOPED_PROOF_UNIMPLEMENTED','SIGNATURE_PROFILE_UNSUPPORTED'].includes(code)?'unsupported':'rejected';}
async function executeSectionNode(input,admitted,authority,operation='read',options=null,signingSeed=null){
 let capture,ownedSeed,stage='input';
 const failure=(status,reason,diagnostic=null,io=[])=>{const v={contract:C.contract.module.id,request_id:requests.get(admitted)?.data.request_id??null,status,reason,stage,io,diagnostic:diagnostic?{field:diagnostic.field??null,subject:diagnostic.subject??null}:null};C.validate(status==='unsupported'?'SectionAdmissionUnsupported06':'SectionAdmissionRejected06',v);return C.strict.freeze(v);};
 try{
  const request=requests.get(admitted),authorityRecord=authorities.get(authority);C.need(request&&authorityRecord,'SECTION_NATIVE_REQUEST_OR_AUTHORITY_UNTRUSTED');const {authorize,policy:signaturePolicy}=authorityRecord;C.need(operation==='read'||request.data.mode==='whole_asset','READ_INPUT_INVALID');if(operation==='produce_signature'){try{C.validate('SectionSignatureProducerOptions06',options);}catch(e){if(C.isFailure(e)||e.reason==='READ_INPUT_INVALID')C.need(false,'READ_INPUT_INVALID');throw e;}ownedSeed=signatures.copySeed(signingSeed);options=C.strict.freeze(structuredClone(options));}
  if(['catalog','exact_selection','expand'].includes(request.data.mode)){C.need(request.data.mode!=='expand'||request.expansion,'READ_HANDLE_UNTRUSTED');return await require('./section-partial-node.js').admitPartialSectionNode(input,request.data,authorize,admitSectionRequest,request.expansion,signaturePolicy);}
  if(request.data.mode!=='whole_asset')return failure('unsupported',request.data.mode==='expand'?'EXPAND_INTEGRATION_UNIMPLEMENTED':'PARTIAL_SEMANTIC_PROOF_UNAVAILABLE');
  capture=await openSectionCapture(input);stage='metadata';const manifest=C.strict.parseJson(capture.manifestBytes);C.validate('Manifest06Candidate',manifest);
  if(manifest.payload.encrypted||manifest.encryption||manifest.entitlement)return failure('unsupported','PROTECTION_BINDING_UNIMPLEMENTED',null,structuredClone(capture.io));
  const authorization=signatures.authorizationContext({request:structuredClone(request.data),request_digest:request.digest,capture:structuredClone(capture.identity),manifest_identity:{asset_id:manifest.asset_id,asset_version:manifest.version,judgment_version:manifest.judgment_version},mode:'whole_asset'},capture,signaturePolicy,operation);stage='authorization';let grant;try{grant=await authorize(authorization);}catch{C.need(false,'READ_CORE_CAPABILITY_UNAVAILABLE');}
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
  if(operation==='produce_signature')return signatures.produce(entries,manifest,observations,metadata,capture.identity.capture_id,request.digest,capture.io,restored.pack_names,options,ownedSeed);
  if(operation==='produce_checksums')return checksums.produceChecksums(entries,manifest,observations,metadata,capture.identity.capture_id,request.digest,capture.io,restored.pack_names);
  const verification={signature_integrity,checksum_integrity,capture:{...capture.identity,table_frames:restored.checked_sections.filter(x=>x.section_id.startsWith('table:'))},request_digest:request.digest,checked_sections:restored.checked_sections,unchecked_sections:[],routing_integrity:'checked',runtime_entry_digest:observations.E,whole_container_digest:{profile:'kdna.digest-basis.container-bytes/0.2.0',status:'verified',digest:observations.A},whole_content_digest:{profile:'kdna.digest-basis.content-tree/0.2.0',status:'verified',digest:observations.C},ir_digest:{profile:'CanonicalIR:SHA-256(RFC8785):existing-digestCanonical',status:'verified',digest:digestCanonical(derived)},mode:'whole_asset',semantic_status:'verified_whole_graph'};
  const expectedC=manifest.content_digest??manifest.authoring?.content_digest??null;const digests={A:evidence('A',observations.A),C:evidence('C',observations.C,expectedC,expectedC?{kind:'manifest_declaration',source_id:manifest.content_digest?'kdna.json':'kdna.json/authoring/content_digest'}:null),E:{...evidence('E',observations.E.digest,checksum_integrity.status==='verified_document_2'?checksum_integrity.expected_entry_set_digest:null,checksum_integrity.status==='verified_document_2'?{kind:'checksums_declaration',source_id:'checksums.json'}:null),profile_version:'0.3.0-candidate'}};
  const data={digests,snapshot_id:'section-snapshot:'+globalThis.crypto.randomUUID(),tuple:structuredClone(tuple),asset:structuredClone(payload.asset),ir:derived,runtime_entry_names:observations.E.member_names,verification};C.validate('WholeSectionSnapshotData06',data);
  const view=C.strict.freeze(data),snapshot=Object.freeze({});snapshots.set(snapshot,view);expansion.retain(snapshot,view,capture);
  return Object.freeze({status:'accepted',snapshot,io:C.strict.freeze(structuredClone(capture.io)),input_byte_length:bytes.length});
 }catch(e){if(e?.result_stage)stage=e.result_stage;const nativeFailure=C.isFailure(e),semanticFailure=knownSemanticReasons.has(e?.reason);const code=nativeFailure?e.code:semanticFailure?e.reason:e?.code==='CONTAINER_COMMENT_CAPTURE_UNIMPLEMENTED'?e.code:'READ_CORE_CAPABILITY_UNAVAILABLE';const classified=stage==='input'&&code==='READ_CORE_INVALID'?await pathInputClass(input):null;if(classified){stage=classified.stage;return failure(classify(classified.reason),classified.reason,classified.diagnostic,structuredClone(capture?.io??e?.capture_io??[]));}return failure(classify(code),code,nativeFailure||semanticFailure?e?.diagnostic:null,structuredClone(capture?.io??e?.capture_io??[]));}finally{if(ownedSeed)ownedSeed.fill(0);if(capture)await capture.close();}
}
// F2: the same bounded metadata classifier as the two byte entries, expressed for
// a file path. It reads only the head, the EOCD tail window and the central
// directory - never content members - and it changes no shared module. Rules:
// no container structure at all -> READ_INPUT_INVALID; recognisable but damaged
// (including whole-file truncation) -> READ_CORE_INVALID unchanged; the central
// directory declaring a payload-family member set -> READ_UNSUPPORTED_VERSION.
const INPUT_MARKERS={eocd:Uint8Array.from([80,75,5,6]),payload:Uint8Array.from([112,97,121,108,111,97,100,46,107,100,110,97,98]),frames:Uint8Array.from([115,101,99,116,105,111,110,115,47,112,97,99,107,45])};
const INPUT_TAIL=65557,DIR_SCAN_CAP=1048576;
function findBytes(buf,needle,from=0,to=buf.length){const last=Math.min(to,buf.length)-needle.length;outer:for(let i=from;i<=last;i++){for(let j=0;j<needle.length;j++)if(buf[i+j]!==needle[j])continue outer;return i;}return -1;}
function findLastBytes(buf,needle){for(let i=buf.length-needle.length;i>=0;i--){let ok=true;for(let j=0;j<needle.length;j++)if(buf[i+j]!==needle[j]){ok=false;break;}if(ok)return i;}return -1;}
async function pathInputClass(file){
 try{
  // Classification follows a rejected capture, so the path is still untrusted.
  // A blocking reopen of a FIFO would wait indefinitely for a writer.
  const fh=await fsp.open(file,fsFlags.O_RDONLY|fsFlags.O_NONBLOCK);
  try{
   const st=await fh.stat();
   if(!st.isFile()||!Number.isSafeInteger(st.size)||st.size<0)return {reason:'READ_INPUT_INVALID',stage:'input',diagnostic:null};
   const head=Buffer.alloc(4),{bytesRead}=await fh.read(head,0,Math.min(4,st.size),0);
   const zip=bytesRead===4&&head[0]===0x50&&head[1]===0x4b&&(head[2]===0x03||head[2]===0x05||head[2]===0x07);
   // A recognisable ZIP shorter than an EOCD is damaged, as in both byte entries.
   if(st.size<22)return zip?null:{reason:'READ_INPUT_INVALID',stage:'input',diagnostic:null};
   const tailLen=Math.min(st.size,INPUT_TAIL),tail=Buffer.alloc(tailLen);await fh.read(tail,0,tailLen,st.size-tailLen);
   const eocd=findLastBytes(tail,INPUT_MARKERS.eocd);
   if(eocd===-1)return zip?null:{reason:'READ_INPUT_INVALID',stage:'input',diagnostic:null};
   const cdStart=tail.readUInt32LE(eocd+16),cdSize=tail.readUInt32LE(eocd+12);
   if(cdStart+cdSize>st.size||cdSize===0||cdSize>DIR_SCAN_CAP)return null;
   const dir=Buffer.alloc(cdSize);await fh.read(dir,0,cdSize,cdStart);
   const hasPayload=findBytes(dir,INPUT_MARKERS.payload)!==-1,hasFrames=findBytes(dir,INPUT_MARKERS.frames)!==-1;
   return hasPayload&&!hasFrames?{reason:'READ_UNSUPPORTED_VERSION',stage:'metadata',diagnostic:{field:'/payload.kdnab',subject:null}}:null;
  }finally{await fh.close();}
 }catch{return null;}
}
async function admitSectionNode(input,admitted,authority){return executeSectionNode(input,admitted,authority);}
async function createSectionChecksumsNode(input,admitted,authority){return executeSectionNode(input,admitted,authority,'produce_checksums');}
async function createSectionSignatureNode(input,admitted,authority,options,signingSeed){return executeSectionNode(input,admitted,authority,'produce_signature',options,signingSeed);}
function inspectSectionRequest(token){return requests.get(token)?.data??null;}
module.exports={createSectionSignatureNode,createSectionChecksumsNode,bindSectionExpansionRequest,inspectSectionSnapshot:require('./section-partial-node.js').inspectSectionSnapshot,inspectSectionRequest,admitSectionRequest,createSectionReadAuthority,admitSectionNode,inspectWholeSectionSnapshot};
