'use strict';
const C=require('./section-common.js'),{createRegistry,ref}=require('./r2-registry.js'),{validateR2}=require('./r2-semantics.js'),{digestCanonical}=require('./digests.js');
class MissingBody extends Error{constructor(judgment){super('REQUIRED_TYPED_BODY');this.judgment=judgment;}}
function registrationPayload(nodes,meta,manifest){
 const asset=nodes.find(n=>n.target.kind==='asset'),same=(a,b)=>digestCanonical(a)===digestCanonical(b),root=kind=>nodes.filter(n=>n.target.kind===kind&&n.owner_judgment_id===null&&same(n.owner,asset.target)).map(n=>n.value);
 const p={profile:meta.tuple.payload_profile,profile_version:meta.tuple.payload_version,asset:meta.asset,judgments:nodes.filter(n=>n.target.kind==='judgment').map(n=>n.value)};
 for(const [kind,name]of [['actor','actors'],['material','materials'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['relationship','relationships'],['dependency','dependencies'],['contract','contracts'],['condition','conditions'],['shared_declaration','shared_declarations'],['example','examples'],['exception','exceptions'],['misuse','misuse']])p[name]=root(kind);
 for(const k of ['scope','kernel','reading_order','cohesion','attributions','content_risk','extensions'])if(Object.hasOwn(asset.value,k))p[k]=asset.value[k];
 p.declarations=structuredClone(asset.value.declarations);if(p.declarations.boundaries)p.declarations.boundaries.value=p.declarations.boundaries.state==='provided'?root('boundary'):null;return p;
}
async function deriveMandatoryContext(capture,layout,manifest,structure,selectedIds,options={}){
 const interpretation=await require('./section-loaded-validation.js').readInterpretationInputs(capture,layout,structure);
 const loadedRows=new Set(),loadedJudgments=new Set(),values=new Map(structure.nodes.map(n=>[n.id,n])),checked=[],iterations=[],entries={};
 const byJudgment=new Map(layout.tableRows.topics.map(x=>[x.judgment_id,x.section_id]));
 async function load(row,why){if(loadedRows.has(row.section_id))return;const frame=await layout.readFrame(row,'content');C.validate('DataFrame06Candidate',frame);C.need(frame.kind===row.kind&&frame.section_id===row.section_id,'SECTION_FRAME_IDENTITY');const expected=new Set(layout.tableRows.node_sections.filter(x=>x.section_id===row.section_id).map(x=>x.node_ref));C.need(expected.size===frame.records.length&&frame.records.every(x=>expected.has(x.id)),'SECTION_FRAME_RECORD_SET');for(const n of frame.records){C.need(n.owner_judgment_id===(row.kind==='volume'?null:row.section_id.slice(6)),'NODE_OWNER');values.set(n.id,n);}loadedRows.add(row.section_id);if(row.kind==='topic')loadedJudgments.add(row.section_id.slice(6));checked.push({section_id:row.section_id,member:row.member,offset_bytes:row.offset_bytes,length_bytes:row.length_bytes,digest:row.digest,why});}
 async function loadJudgment(id,why){const section=byJudgment.get(id);C.need(section,'SECTION_MISSING_JUDGMENT');await load(layout.sectionMap.get(section),why);}
 for(const row of layout.ordered)if(row.kind==='volume')await load(row,'complete incoming root obligations');
 for(const id of selectedIds)await loadJudgment(id,'requested selection');
 for(let count=0;count<=layout.ordered.length;count++){
  const nodes=layout.meta.node_order.map(id=>values.get(id)),payload=registrationPayload(nodes,layout.meta,manifest);
  for(const resource of payload.resources)if(!entries[resource.entry])entries[resource.entry]=await capture.resourceAfterAuthorization(resource.entry);
  const registry=createRegistry(manifest,payload),byTarget=new Map(nodes.map(n=>[registry.identity(n.target),n]));
  for(const record of registry.ordered){if(record.judgment!==null&&!loadedJudgments.has(record.judgment)){Object.defineProperty(record,'value',{get(){throw new MissingBody(record.judgment);}});continue;}
   if(record.target.kind!=='asset'){const node=byTarget.get(registry.identity(record.target));C.need(node&&digestCanonical(node.value)===digestCanonical(record.value),'SECTION_LOADED_DUPLICATE_VALUE_MISMATCH');}
  }
  try{
   require('./section-loaded-validation.js').validateLoadedSchema(payload,loadedJudgments,interpretation);
   const r=validateR2(manifest,payload,entries,{registry,loadedJudgments,completeJudgments:interpretation.judgments,requireCompletePolicyUses(){}});
   const seeds=[r.asset,...selectedIds.map(id=>ref('judgment',id))],closure=r.closure([...seeds,...(options.target?[options.target]:[])]);
   const available=new Set(closure.map(x=>r.identity(x.target)));if(!options.target)for(const record of closure){if(record.target.kind==='asset')continue;for(const key of r.edges.get(r.identity(record.target)).keys())available.add(key);}
   const targetScopes=options.target?[]:r.ordered.filter(record=>available.has(r.identity(record.target))).map(record=>({target:record.target,records:r.closure([...seeds,record.target])}));
   const proofRecords=[...closure,...targetScopes.flatMap(x=>x.records)];const missing=[...new Set(proofRecords.filter(x=>x.judgment!==null&&!loadedJudgments.has(x.judgment)).map(x=>x.judgment))];iterations.push({iteration:count,loaded_judgments:[...loadedJudgments],closure_count:closure.length,missing});
   if(missing.length){for(const id of missing)await loadJudgment(id,'actual mandatory fixed-point');continue;}
   for(const id of selectedIds){const ownClosure=new Set(r.closure([r.asset,ref('judgment',id)]).map(x=>r.identity(x.target))),actual=nodes.filter(n=>ownClosure.has(r.identity(n.target))).map(n=>n.id),declared=layout.meta.mandatory_closures.find(x=>x.selection.judgment_id===id);C.need(declared&&digestCanonical(actual)===digestCanonical(declared.node_ids),'SECTION_REQUIRED_CONTEXT_MISMATCH');}
   const selected=new Set(closure.map(x=>r.identity(x.target))),ordered=nodes.filter(n=>selected.has(r.identity(n.target)));
   const materialized=require('./section-scoped-materialize.js').materializeScoped(r,payload,manifest,nodes,ordered,selectedIds,layout.meta,loadedJudgments);
   if(options.target){materialized.asset_index=materialized.asset_index.filter(x=>ordered.some(n=>n.id===x.node_ref));C.need(digestCanonical(ordered.map(n=>n.id))===digestCanonical(options.scope),'READ_HANDLE_SCOPE_MISMATCH');}
   else{const byKey=new Map(nodes.map(n=>[r.identity(n.target),n])),anchor={kind:'selection_set',selection:{asset_id:payload.asset.asset_id,asset_version:payload.asset.asset_version,judgment_ids:selectedIds}};materialized.expansion_targets=targetScopes.map(x=>({anchor,target:x.target,scope:x.records.map(record=>byKey.get(r.identity(record.target)).id)}));}
   const interpretationObservation=require('./section-loaded-validation.js').validateLoadedInterpretation(payload,nodes,loadedJudgments,interpretation,manifest,capture.identity.capture_id);
   return {...materialized,interpretation_observation:interpretationObservation,selected_node_ids:ordered.map(n=>n.id),nodes:ordered,checked_sections:checked,loaded_judgments:[...loadedJudgments],iterations,scope:'Actual original rules on complete roots and actually loaded selected and expansion-proof topic records. Output nodes contain only requested mandatory closure; all extra proof reads remain in checked_sections and capture I/O.'};
  }catch(e){if(!(e instanceof MissingBody))throw e;iterations.push({iteration:count,loaded_judgments:[...loadedJudgments],required_body:e.judgment});await loadJudgment(e.judgment,'original domain rule requires actual value');}
 }
 C.need(false,'SECTION_FIXEDPOINT_DID_NOT_CONVERGE');
}
module.exports={deriveMandatoryContext};
