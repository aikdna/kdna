'use strict';
const C=require('./section-common.js'),Codec=require('./section-scope-codec.js'),Metadata=require('./section-metadata-codec.js');
function restoreWholeFrames(entries,publicManifest){
 C.validate('Manifest06Candidate',publicManifest);
 const meta=Metadata.decode(publicManifest.representation_metadata);
 const manifest={...meta,tables:publicManifest.payload.tables};
 const members=new Map(Object.entries(entries).map(([name,b])=>[name,{length:b.length}]));
    const catalogIds=manifest.catalog.map(c=>c.judgment_id); C.need(new Set(catalogIds).size===catalogIds.length,'CATALOG_DUPLICATE');
    C.need(manifest.mandatory_closures.length===catalogIds.length,'CLOSURE_COVERAGE');
    manifest.mandatory_closures.forEach((x,i)=>C.need(x.selection.judgment_id===catalogIds[i]&&x.selection.asset_id===manifest.asset.asset_id&&x.selection.asset_version===manifest.asset.asset_version,'CLOSURE_BINDING'));
    const tableRows={}, tableFrames=[], loaded=[], checked=[];
    function frame(row,category) {
      const m=members.get(row.member); C.need(m&&Number.isSafeInteger(row.offset_bytes+row.length_bytes)&&row.offset_bytes+row.length_bytes<=m.length,'FRAME_RANGE');
      const b=Buffer.from(entries[row.member]).subarray(row.offset_bytes,row.offset_bytes+row.length_bytes); C.need(C.sha(b)===row.digest,'SECTION_DIGEST'); const v=C.decode(b); checked.push(row.section_id); return v;
    }
    let ti=0;
    for(const table of Object.keys(C.tableKeys)) {
      const rows=[];let part=0; const key=C.tableKeys[table];
      while(ti<manifest.tables.length&&manifest.tables[ti].table===table) {
        const row=manifest.tables[ti++]; C.shape('Representation06TableDirectoryRow',row);
        C.need(row.part===part&&row.section_id===`table:${table}:${part}`,'TABLE_PART_SEQUENCE');
        C.need(part===0||rows.length===4096*part,'TABLE_UNIQUE_CUT');
        C.need(row.rows!==0||part===0,'EMPTY_PART');
        const items=frame(row,'metadata'); C.need(Array.isArray(items)&&items.length===row.rows,'TABLE_ROWS'); items.forEach(v=>C.shape(C.rowNames[table],v));
        C.need(row.first_key===(items[0]?.[key]??null)&&row.last_key===(items.at(-1)?.[key]??null),'TABLE_KEYS');
        rows.push(...items);tableFrames.push(row);part++;
      }
      C.need(part>0,'MISSING_TABLE'); C.sortedUnique(rows.map(x=>x[key])); tableRows[table]=rows;
    }
    C.need(ti===manifest.tables.length,'TABLE_DIRECTORY_ORDER');
    const sections=tableRows.sections, sectionMap=new Map(sections.map(s=>[s.section_id,s]));
    const nodeMap=new Map(tableRows.node_sections.map(x=>[x.node_ref,x.section_id]));
    C.need(nodeMap.size===manifest.node_order.length&&manifest.node_order.every(id=>nodeMap.has(id)),'NODE_MAP_COVERAGE');
    for(const [node,sid] of nodeMap) C.need(sectionMap.has(sid)&&sectionMap.get(sid).kind!=='xref','NODE_MAP_TARGET');
    C.need(tableRows.topics.length===catalogIds.length,'TOPIC_COVERAGE');
    for(const c of manifest.catalog) {
      const row=tableRows.topics.find(x=>x.judgment_id===c.judgment_id); C.need(row&&row.section_id==='topic:'+c.judgment_id&&sectionMap.get(row.section_id)?.kind==='topic'&&nodeMap.get(c.node_ref)===row.section_id,'TOPIC_MAP');
    }
    for(const cl of manifest.mandatory_closures) C.need(cl.node_ids.every(id=>nodeMap.has(id)),'CLOSURE_NODE_MISSING');
    // Reconstruct the mandated physical order from identities, not table sorting order.
    const ordered=[]; function anchor(ordinal) { const xs=sections.filter(s=>s.section_id.startsWith('xref:'+ordinal+':')).sort((a,b)=>a.pack_ordinal-b.pack_ordinal); xs.forEach((r,i)=>C.need(r.kind==='xref'&&r.section_id===`xref:${ordinal}:${i}`&&(i===xs.length-1||r.entry_count===1024),'XREF_CHUNK')); ordered.push(...xs); }
    anchor(0); catalogIds.forEach((jid,i)=>{ordered.push(sectionMap.get('topic:'+jid));anchor(i+1);});
    const volumes=sections.filter(s=>s.kind==='volume').sort((a,b)=>a.pack_ordinal-b.pack_ordinal); volumes.forEach((v,i)=>C.need(v.section_id==='volume:'+i,'VOLUME_SEQUENCE')); ordered.push(...volumes);
    const volumeIds=tableRows.node_sections.filter(r=>sectionMap.get(r.section_id)?.kind==='volume').map(r=>r.node_ref).sort(C.utf8);
    C.need(volumes.length===Math.ceil(volumeIds.length/512),'VOLUME_FIXED_CHUNKS');
    volumeIds.forEach((id,i)=>C.need(nodeMap.get(id)==='volume:'+Math.floor(i/512),'VOLUME_FIXED_CHUNKS'));
    C.need(ordered.length===sections.length&&new Set(ordered.map(x=>x.section_id)).size===sections.length,'SECTION_COVERAGE');
    const all=[...ordered,...tableFrames], packEnds=new Map();
    all.forEach((r,i)=>{const member=`sections/pack-${Math.floor(i/8)}.kdnab`; C.need(r.pack_ordinal===i&&r.member===member&&r.offset_bytes===(packEnds.get(member)??0),'FRAME_PACK_ORDER_OR_OVERLAP');packEnds.set(member,r.offset_bytes+r.length_bytes);});
    C.need(packEnds.size===[...members.keys()].filter(x=>x.startsWith('sections/')).length,'PACK_COVERAGE');for(const [name,len]of packEnds)C.need(members.get(name)?.length===len,'PACK_SPAN_COVERAGE');
    const nodes=new Map(),expansions=[];
    for(const row of ordered)  {
      const stored=frame(row,'content');const value=row.kind==='xref'?Codec.decodeFrame(stored):stored;C.keys(value,['section_id','kind','records']);C.need(value.section_id===row.section_id&&value.kind===row.kind&&Array.isArray(value.records),'FRAME_SHAPE'); loaded.push(row.section_id);
      if(row.kind==='xref') { C.need(value.records.length===row.entry_count&&value.records.length<=1024,'XREF_ENTRY_COUNT'); const ordinal=Number(row.section_id.split(':')[1]);for(const x of value.records){C.validate('ExpansionTarget',x);C.need(x.scope.every(id=>nodeMap.has(id)),'XREF_SCOPE');if(ordinal===0)C.need(x.anchor.kind==='asset','XREF_ANCHOR');else C.need(x.anchor.kind==='judgment'&&x.anchor.selection.judgment_id===catalogIds[ordinal-1]&&x.anchor.selection.asset_id===manifest.asset.asset_id&&x.anchor.selection.asset_version===manifest.asset.asset_version,'XREF_ANCHOR');}expansions.push(...value.records); }
      else {
        const expected=tableRows.node_sections.filter(x=>x.section_id===row.section_id).map(x=>x.node_ref).sort(C.utf8),actual=value.records.map(n=>n.id).sort(C.utf8); C.need(JSON.stringify(expected)===JSON.stringify(actual),'FRAME_NODE_COVERAGE');
        if(row.kind==='volume') {C.need(value.records.length<=512,'VOLUME_CHUNK');C.sortedUnique(value.records.map(n=>n.id));}
        for(const n of value.records) {C.validate('IRReadNode',n);C.need(!nodes.has(n.id),'DUPLICATE_RECORD');C.need(row.kind==='volume'?n.owner_judgment_id===null:'topic:'+n.owner_judgment_id===row.section_id,'NODE_OWNER');nodes.set(n.id,n);}
      }
    }

 const outputNodes=manifest.node_order.map(id=>{C.need(nodes.has(id),'REQUIRED_NODE_MISSING');return nodes.get(id);});
 const {node_order,ir_digest_claim,runtime_entry_names,...components}=meta;
 return {ir:{...components,nodes:outputNodes,expansion_targets:expansions},checked_sections:[...ordered,...tableFrames].map(({section_id,member,offset_bytes,length_bytes,digest})=>({section_id,member,offset_bytes,length_bytes,digest})),pack_names:[...packEnds.keys()],source_ir_digest_claim:ir_digest_claim,source_runtime_entry_names:runtime_entry_names};
}
module.exports={restoreWholeFrames};
