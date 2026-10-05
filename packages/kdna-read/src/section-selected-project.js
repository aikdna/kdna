'use strict';
const {selectedContext}=require('./selected-context.generated.js'),{assessment,clone}=require('./util.js');
function selectedBody(request,view){
 const ir={asset:view.asset,nodes:view.nodes,catalog:view.catalog,references:view.references,relationships:view.relationships};const supplied=new Set(view.selected_node_ids),scoped=selectedContext(ir,view.selected_node_ids),declarations=scoped.closure.filter(n=>n.role==='asset_declaration');
 const claims=scoped.closure.filter(n=>n.role==='actor'||n.role==='source'||n.role==='source_use'||n.role==='asset_declaration'&&(n.value.creator||n.value.attributions?.state==='provided'));
 return {content:{declarations,catalog:scoped.catalog,selected:clone(request.selection),closure:scoped.closure,references:scoped.references,relationships:scoped.relationships,missing:[],provenance:{declarations:claims,confirmation:claims.length?'claimed_unverified':'not_evaluated',verifier_id:null,evidence_ref:null},expansion_handles:[],asset_capability:null,asset_index:view.asset_index.filter(row=>request.mode!=='expand'||supplied.has(row.node_ref)).map(row=>({...clone(row),body_delivery:supplied.has(row.node_ref)?'inline':'not_loaded'}))},diagnostics:[],omissions:scoped.omissions,assessment:assessment()};
}
function scopeSelectedBody(body,context){const scope=new Set(context.scope);return [...body.content.declarations,...body.content.closure].every(n=>scope.has(n.id))&&body.content.catalog.every(x=>scope.has(x.node_ref))&&body.content.asset_index.every(x=>scope.has(x.node_ref));}
module.exports={selectedBody,scopeSelectedBody};
