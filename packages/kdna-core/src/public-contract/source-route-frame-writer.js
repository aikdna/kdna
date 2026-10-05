'use strict';
const C=require('./section-common.js'), Codec=require('./section-scope-codec.js');
const encoder=new (require('cbor-x/index-no-eval').Encoder)({useRecords:false,mapsAsObjects:true,structuredClone:false,alwaysUseFloat:true});
function buildFrames(ir) {
  C.need(ir && Array.isArray(ir.nodes));
  const catalog = ir.catalog, data = [], nodeMap = [], topics = [];
  const add = (id,kind,records) => { const frame = {section_id:id,kind,records}; data.push(kind==='xref'?Codec.encodeFrame(frame):frame); if(kind!=='xref') for(const n of records) nodeMap.push({node_ref:n.id,section_id:id}); };
  const xrefs = (ordinal,jid) => {
    const rows = ir.expansion_targets.filter(x => jid===null ? x.anchor.kind==='asset' : x.anchor.kind==='judgment' && x.anchor.selection.judgment_id===jid);
    for(let i=0;i<rows.length;i+=1024) add(`xref:${ordinal}:${i/1024}`,'xref',rows.slice(i,i+1024));
  };
  xrefs(0,null);
  catalog.forEach((c,i)=>{ const id='topic:'+c.judgment_id; topics.push({judgment_id:c.judgment_id,section_id:id}); add(id,'topic',ir.nodes.filter(n=>n.owner_judgment_id===c.judgment_id)); xrefs(i+1,c.judgment_id); });
  const volume = ir.nodes.filter(n=>n.owner_judgment_id===null).sort((a,b)=>C.utf8(a.id,b.id));
  for(let i=0;i<volume.length;i+=512) add('volume:'+i/512,'volume',volume.slice(i,i+512));
  C.need(nodeMap.length===ir.nodes.length && new Set(nodeMap.map(n=>n.node_ref)).size===ir.nodes.length);
  C.need(JSON.stringify(data.filter(x=>x.kind==='xref').flatMap(x=>Codec.decodeFrame(x).records))===JSON.stringify(ir.expansion_targets),'XREF_ORDER_INPUT');
  const packs=[], frames=[], sections=[];
  function append(id, value) {
    const bytes=Buffer.from(encoder.encode(value)); C.decode(bytes); const ordinal=frames.length, p=Math.floor(ordinal/8); packs[p]??=[];
    const offset=packs[p].reduce((n,b)=>n+b.length,0); const row={section_id:id,member:`sections/pack-${p}.kdnab`,offset_bytes:offset,length_bytes:bytes.length,pack_ordinal:ordinal,digest:C.sha(bytes)};
    packs[p].push(bytes); frames.push({row,bytes,value}); return row;
  }
  for(const frame of data) { const loc=append(frame.section_id,frame); const row={...loc,kind:frame.kind,entry_count:frame.kind==='xref'?frame.records.length:0}; C.shape('Representation06DataSectionRow',row); sections.push(row); }
  const tables=[];
  for(const [table,rows] of Object.entries({sections,topics,node_sections:nodeMap})) {
    const key=C.tableKeys[table]; rows.sort((a,b)=>C.utf8(a[key],b[key])); C.sortedUnique(rows.map(r=>r[key])); rows.forEach(r=>C.shape(C.rowNames[table],r));
    for(let i=0;i<Math.max(1,rows.length);i+=4096) { const part=i/4096, group=rows.slice(i,i+4096), id=`table:${table}:${part}`;
      const loc=append(id,group); const row={...loc,table,part,rows:group.length,first_key:group[0]?.[key]??null,last_key:group.at(-1)?.[key]??null}; C.shape('Representation06TableDirectoryRow',row); tables.push(row);
    }
  }
  return {tables,packs:Object.fromEntries(packs.map((chunks,i)=>['sections/pack-'+i+'.kdnab',Buffer.concat(chunks)]))};
}
module.exports={buildFrames};
