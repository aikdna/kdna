// Generated from specs/public-semantic-source.json and its selected-context algorithm; do not edit.
'use strict';
function selectedContext(ir, orderedNodeIds) {
  const clone=value=>JSON.parse(JSON.stringify(value));
  const byId=new Map(ir.nodes.map(node=>[node.id,node]));
  const original=orderedNodeIds.map(id=>byId.get(id));
  if(original.some(node=>!node)||new Set(orderedNodeIds).size!==orderedNodeIds.length)throw new Error('Invalid selected context nodes');
  const supplied=new Set(orderedNodeIds);
  const identity=target=>{
    const a=target.asset;
    const local=!a||(a.asset_id===ir.asset.asset_id&&a.asset_version===ir.asset.asset_version&&a.judgment_version===ir.asset.judgment_version);
    return JSON.stringify([target.kind,target.id,local?null:[a.asset_id,a.asset_version,a.judgment_version]]);
  };
  const targets=new Set(original.map(node=>identity(node.target)));
  const omissions=[];
  const omit=(target,field,reason)=>omissions.push({state:'explicitly_omitted',target,field,reason,expandable:false,handle_id:null});
  const closure=original.map(node=>{
    const projected=clone(node);
    if(node.role!=='asset_declaration')return projected;
    const value=projected.value;
    if(Object.hasOwn(value,'reading_order')){
      delete value.reading_order;
      omit(node.id,'reading_order','not_in_mode');
    }
    const refs=value.kernel.foundation_refs;
    value.kernel.foundation_refs=refs.filter(ref=>targets.has(identity(ref)));
    if(value.kernel.foundation_refs.length!==refs.length)omit(node.id,'kernel.foundation_refs','not_in_mode');
    return projected;
  });
  const judgments=new Set(original.filter(node=>node.role==='judgment').map(node=>node.value.id));
  const relationIds=new Set();
  for(const node of original)if(node.role==='relationship'){
    relationIds.add(node.value.id);
    for(const participant of node.value.participants)judgments.add(participant.judgment_ref);
  }
  const catalog=ir.catalog.filter(item=>judgments.has(item.judgment_id)).map(clone);
  for(const item of catalog)if(!supplied.has(item.node_ref))omit(item.node_ref,'judgment','outside_selection');
  const references=ir.references.filter(ref=>supplied.has(ref.source_node)&&supplied.has(ref.target_node)).map(clone);
  const relationships=ir.relationships.filter(relation=>relationIds.has(relation.id)).map(clone);
  return {closure,catalog,references,relationships,omissions};
}
module.exports={selectedContext};
