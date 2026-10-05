'use strict';
const {selectedContext}=require('./selected-context.generated.js');
const {assetCapability,folded}=require('./project.js');
const {clone,jcs,assessment}=require('./util.js');
function project(record) {
  const {view,request,plan}=record, ir=view.ir;
  if (request.mode==='catalog') return {content:{catalog:clone(ir?.catalog??view.catalog),asset_index:clone(ir?.asset_index??view.asset_index)},omissions:[],diagnostics:[],assessment:assessment()};
  const selected=request.mode==='exact_selection'||request.mode==='expand';
  const scoped=selected?selectedContext(ir,plan.node_ids):null;
  const nodes=new Map(ir.nodes.map(n=>[n.id,n]));
  const closure=scoped?scoped.closure:plan.node_ids.map(id=>nodes.get(id));
  const declarations=scoped?closure.filter(n=>n.role==='asset_declaration'):ir.nodes.filter(n=>n.role==='asset_declaration');
  const supplied=new Set([...declarations,...closure].map(n=>n.id));
  const catalog=scoped?.catalog??ir.catalog;
  const omissions=clone(scoped?.omissions??[]);
  if (!scoped) for (const row of catalog) if (!supplied.has(row.node_ref)) omissions.push({state:'explicitly_omitted',target:row.node_ref,field:'judgment',reason:'outside_selection',expandable:false,handle_id:null});
  const index=plan.index.map(row=>{
    const out={target:row.target,owner:row.owner,display_name:row.display_name,body_delivery:supplied.has(row.node_ref)?'inline':'deferred'};
    if (selected) out.node_ref=row.node_ref;
    return out;
  });
  const claims=[...declarations,...closure].filter(n=>n.role==='actor'||n.role==='source'||n.role==='source_use'||n.role==='asset_declaration'&&(n.value.creator||n.value.attributions?.state==='provided'));
  const relations=new Set(closure.filter(n=>n.role==='relationship').map(n=>n.value.id));
  const content={declarations,catalog,selected:request.selection,closure,
    references:scoped?.references??ir.references.filter(e=>supplied.has(e.source_node)&&supplied.has(e.target_node)),
    relationships:scoped?.relationships??ir.relationships.filter(x=>relations.has(x.id)),missing:[],
    provenance:{declarations:claims,confirmation:claims.length?'claimed_unverified':'not_evaluated',verifier_id:null,evidence_ref:null},
    asset_capability:assetCapability(view),asset_index:index,expansion_handles:[]};
  return clone({content,omissions,diagnostics:[],assessment:assessment()});
}
function mint(body,record,context,id) {
  const {request,data,plan,view}=record;
  if (request.mode==='catalog'||request.mode==='expand') return [];
  const targets=new Map(plan.targets.map(row=>[jcs(row.target),row]));
  const nodes=new Map(view.ir.nodes.map(row=>[jcs(row.target),row.id]));
  const handles=[];
  for (const descriptor of body.content.asset_index) {
    if (descriptor.body_delivery==='inline') continue;
    const target=targets.get(jcs(descriptor.target));
    if (!target) throw new TypeError('RETAINED_TARGET_MISSING');
    const handle={binding_kind:'retained_section_snapshot',handle_id:id(),asset:data.asset,tuple:data.tuple,origin:data.origin,
      issuing_operation_id:data.intent.operation_id,issuing_request_digest:data.request_digest,
      anchor:target.anchor,target:target.target,scope:target.scope,issued_at:context.current_ms,
      expires_at:Math.min(context.expires_at,context.current_ms+3600000),host_id:context.host_id,host_epoch:context.host_epoch};
    descriptor.handle_id=handle.handle_id;handles.push(handle);
    for (const omission of body.omissions) if (omission.target===nodes.get(jcs(target.target))) {
      omission.expandable=true;omission.handle_id=handle.handle_id;omission.reason='not_requested';
    }
  }
  body.content.expansion_handles=handles;
  folded(body);
  return handles;
}
module.exports={project,mint};
