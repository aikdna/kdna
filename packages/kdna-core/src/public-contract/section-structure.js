'use strict';
const crypto=require('node:crypto'),C=require('./section-common.js'),{scanFrame}=require('./section-structure-scanner.js'),{checkPartitionBindings}=require('./section-partition-bindings.js');
const failures=new WeakSet();
function need(v,code,subject){if(!v){const e=new Error(code);e.code=code;e.subject=subject;failures.add(e);throw e;}}
async function inspectStructure(capture,layout,manifest){
 const nodes=[],frames=[];
 for(const row of layout.ordered){if(row.kind==='xref')continue;const observed=crypto.createHash('sha256');
 let scan;try{scan=await capture.structureAfterAuthorization(row,read=>scanFrame(row.length_bytes,async(offset,count)=>{const b=await read(offset,count),header=Buffer.alloc(16);header.writeBigUInt64BE(BigInt(offset));header.writeBigUInt64BE(BigInt(count),8);observed.update(header).update(b);return b;}));}catch(e){if(typeof e.code==='string'&&e.code.startsWith('SCAN_'))failures.add(e);throw e;}
 C.keys(scan.partial,['kind','section_id','records']);need(scan.partial.kind===row.kind&&scan.partial.section_id===row.section_id,'SCAN_FRAME_IDENTITY',row.section_id);
 const expected=new Set(layout.tableRows.node_sections.filter(x=>x.section_id===row.section_id).map(x=>x.node_ref));need(expected.size===scan.partial.records.length&&scan.partial.records.every(n=>expected.has(n.id)),'SCAN_FRAME_RECORDS',row.section_id);
 for(const node of scan.partial.records){need(node.owner_judgment_id===(row.kind==='volume'?null:row.section_id.slice(6)),'SCAN_FRAME_OWNER',node.id);nodes.push(node);}
 frames.push({section_id:row.section_id,member:row.member,offset_bytes:row.offset_bytes,length_bytes:row.length_bytes,observed_ranges_digest:'sha256:'+observed.digest('hex'),observed_read_bytes:scan.read_bytes,read_calls:scan.reads.length,skipped_text_bytes:scan.skipped_text_bytes,frame_digest_status:'not_checked',unread_text_status:'not_checked'});
 }
 let binding;try{binding=checkPartitionBindings(nodes,manifest,layout.meta,{...require('./digests.js'),...require('./r2-registry.js')});}catch(e){if(typeof e.code==='string'&&e.code.startsWith('SCAN_'))failures.add(e);throw e;}
 const observation={profile:'kdna.section-structure-observation/0.1.0-candidate',capture_id:capture.identity.capture_id,frames,registration_partition:'checked_from_observed_registration_fields',unread_body_semantics:'not_checked'};C.validate('StructuralPartitionObservation06',observation);return {observation,nodes,binding};
}
module.exports={inspectStructure,isFailure:e=>failures.has(e)};
