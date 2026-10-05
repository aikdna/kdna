'use strict';
const C=require('./section-common.js');
const D=require('./digests.js');
const {buildIR}=require('./canonical-ir.js');
const {validateDecodedPayload}=require('./semantic-admission.js');
const {buildFrames}=require('./source-route-frame-writer.js');
const M=require('./section-metadata-codec.js');
const {encodeStored}=require('./container-writer.js');
const {admitPublicBytes}=require('./source-public-admission.js');
const {isDeepStrictEqual}=require('node:util');

function packPublic(source,edits,policy,captureId,requestDigest){
  const entries={...source.entries};
  let manifest=source.manifest,payload=source.payload;
  if(Object.keys(edits).length){
    manifest=structuredClone(edits.manifest??source.manifest);
    payload=structuredClone(edits.payload??source.payload);
    C.validate('Manifest06Candidate',manifest);
    // Authored values are checked before encoding. Derived transport metadata is
    // then replaced by the representation built from these exact authored values.
    validateDecodedPayload(manifest,payload);
    const ir={...buildIR(manifest,payload,entries),tuple:structuredClone(C.contract.module.versionTuple)};
    const built=buildFrames(ir),oldPacks=Object.keys(entries).filter(n=>n.startsWith('sections/'));
    const newPacks=Object.keys(built.packs);
    manifest.runtime.mandatory_entries=[...new Set(manifest.runtime.mandatory_entries.flatMap(n=>oldPacks.includes(n)?newPacks:[n]))];
    manifest.payload={layout:'sections',encoding:'strict-cbor-frames',encrypted:false,tables:built.tables,xref_codec:'frame-local-ordered-scope-dictionary/1'};
    const {nodes,expansion_targets,...meta}=ir;
    meta.node_order=nodes.map(n=>n.id);
    meta.ir_digest_claim=D.digestCanonical(ir);
    meta.runtime_entry_names=[...new Set(['kdna.json',...newPacks,...manifest.runtime.mandatory_entries])].sort(C.utf8);
    manifest.representation_metadata=M.encode(meta);
    for(const n of oldPacks)delete entries[n];
    Object.assign(entries,built.packs);
    entries['kdna.json']=Buffer.from(JSON.stringify(manifest));
    // Only existing valid self declarations are refreshed. Signature/checksum
    // members are retained; output admission decides whether they still verify.
    const declared=x=>typeof x==='string'&&/^sha256:[0-9a-f]{64}$/.test(x);
    const root=declared(manifest.content_digest),author=declared(manifest.authoring?.content_digest);
    if(root||author){
      const digest=D.digest(D.contentTreePreimage(entries));
      if(root)manifest.content_digest=digest;
      if(author)manifest.authoring.content_digest=digest;
      entries['kdna.json']=Buffer.from(JSON.stringify(manifest));
    }
  }
  const members=source.metadata.filter(r=>Object.hasOwn(entries,r.name)).map(r=>({...r,bytes:entries[r.name]}));
  for(const [name,bytes]of Object.entries(entries))if(!members.some(r=>r.name===name))members.push({name,type:'file',mode:0o100644,bytes});
  C.need(members.length<=128,'READ_CORE_INVALID');
  const bytes=encodeStored(members);
  const output=admitPublicBytes(bytes,policy,captureId,requestDigest);
  C.need(isDeepStrictEqual(output.payload,payload),'SECTION_SOURCE_PAYLOAD_CHANGED');
  const actions=[];
  for(const [name,prior]of Object.entries(source.entries))actions.push({name,action:!Object.hasOwn(entries,name)?'removed':Buffer.from(prior).equals(Buffer.from(entries[name]))?'preserved':'replaced'});
  for(const name of Object.keys(entries))if(!Object.hasOwn(source.entries,name))actions.push({name,action:'added'});
  return {bytes,output,actions,payloadExplicit:Object.hasOwn(edits,'payload')};
}
module.exports={packPublic};
