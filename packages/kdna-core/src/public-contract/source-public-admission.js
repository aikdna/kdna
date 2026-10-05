'use strict';
const {inflateRawSync}=require('node:zlib');
const C=require('./section-common.js');
const D=require('./digests.js');
const {parseSectionContainer}=require('./section-container.js');
const {restoreWholeFrames}=require('./section-frame-graph.js');
const {reconstructPayload}=require('./section-reconstruct.js');
const {validateDecodedPayload,assertContentBindings}=require('./semantic-admission.js');
const {buildIR}=require('./canonical-ir.js');
const {observeWhole}=require('./section-digests.js');
const checksums=require('./section-checksums.js');
const signatures=require('./section-signatures.js');
const tuple=C.contract.module.versionTuple;

// The same full representation/domain/integrity gates as native whole admission.
// No old-format container or snapshot brand is manufactured by this source route.
function admitPublicBytes(bytes,signaturePolicy,captureId,requestDigest,manifestBytes=null){
  const metadata=[];
  const entries=parseSectionContainer(bytes,(b,maxOutputLength)=>inflateRawSync(b,{maxOutputLength}),metadata);
  if(manifestBytes)C.need(Buffer.from(entries['kdna.json']).equals(Buffer.from(manifestBytes)),'SECTION_CAPTURE_CHANGED');
  const manifest=C.strict.parseJson(entries['kdna.json']);
  C.validate('Manifest06Candidate',manifest);
  C.need(!manifest.payload.encrypted&&!manifest.encryption&&!manifest.entitlement,'PROTECTION_BINDING_UNIMPLEMENTED');
  const restored=restoreWholeFrames(entries,manifest);
  const payload=reconstructPayload(restored.ir);
  validateDecodedPayload(manifest,payload);
  const ir={...buildIR(manifest,payload,entries),tuple:structuredClone(tuple)};
  C.need(D.digestCanonical(ir)===D.digestCanonical(restored.ir),'SECTION_DERIVED_IR_MISMATCH');
  const observed=observeWhole(bytes,entries,manifest,restored.pack_names);
  assertContentBindings(manifest,observed.C);
  checksums.verifyChecksums(entries,observed,captureId,requestDigest);
  signatures.verify(entries,signaturePolicy,captureId,requestDigest,signatures.intent(Object.entries(entries).map(([name,b])=>({name,size:b.length}))));
  return {manifest,payload,ir,entries,metadata,observed};
}
module.exports={admitPublicBytes};
