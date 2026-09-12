'use strict';
const {inspectSnapshot}=require('@aikdna/kdna-core/read-boundary');
const {requests}=require('./brands.js');
const {projectDeclarations}=require('./declarations.js');
const {tuple,clone,freeze,diagnostic,assessment,jcs}=require('./util.js');
const reject=code=>({status:'rejected',body:null,diagnostics:[diagnostic(code)]});
function inspect(admitted,snapshot){
  const record=requests.get(admitted);
  if(!record)return {error:'READ_INPUT_INVALID'};
  if(record.version_rejection)return {error:record.version_rejection};
  if(snapshot===null||typeof snapshot!=='object'||snapshot instanceof Uint8Array||snapshot instanceof ArrayBuffer)return {error:'READ_INPUT_INVALID'};
  const view=inspectSnapshot(snapshot);if(!view)return {error:'READ_SNAPSHOT_UNATTESTED'};
  if(jcs(view.tuple)!==jcs(tuple))return {error:'READ_MIXED_VERSION_TUPLE'};
  const request=record.request;
  if(request.selection){
    if(request.selection.asset_id!==view.asset.asset_id)return {error:'READ_ASSET_MISMATCH'};
    if(request.selection.asset_version!==view.asset.asset_version)return {error:'READ_ASSET_VERSION_MISMATCH'};
    const matches=view.ir.catalog.filter(x=>x.judgment_id===request.selection.judgment_id);
    if(!matches.length)return {error:'READ_SELECTION_NOT_FOUND'};
    if(matches.length>1)return {error:'READ_SELECTION_AMBIGUOUS'};
  }
  return {view,request,record};
}
function handleFields(request,view){
  const h=request.handle;if(!h)return null;
  if(h.core_version!==tuple.core||h.ir_version!==tuple.ir||h.read_version!==tuple.read)return 'READ_HANDLE_VERSION_MISMATCH';
  if(h.snapshot_id!==view.snapshot_id||h.A!==view.digests.A.observed||h.C!==view.digests.C.observed)return 'READ_HANDLE_STALE';
  if(h.asset_id!==view.asset.asset_id||h.asset_version!==view.asset.asset_version||jcs(h.selection)!==jcs(request.selection))return 'READ_HANDLE_ASSET_MISMATCH';
  const target=view.expansion_targets.find(x=>x.target===h.target&&jcs(x.selection)===jcs(request.selection));
  if(!target||target.scope.some(x=>!h.scope.includes(x))||h.scope.some(x=>!target.scope.includes(x)))return 'READ_HANDLE_SCOPE_MISMATCH';
  return null;
}
function bodyFor(request,view){
  const ir=view.ir,nodes=new Map(ir.nodes.map(x=>[x.id,x]));
  const declarations=ir.nodes.filter(x=>x.owner_judgment_id===null&&['asset_declaration','declaration','scope','cohesion','attribution'].includes(x.role));
  let selected=null,closure=[],catalog=ir.catalog,omissions=[];
  if(request.mode==='exact_selection'||request.mode==='expand'){
    selected=request.selection;catalog=ir.catalog.filter(x=>x.judgment_id===selected.judgment_id);
    const mandatory=ir.mandatory_closures.find(x=>jcs(x.selection)===jcs(selected));
    if(!mandatory)return null;
    const ids=request.mode==='expand'?view.expansion_targets.find(x=>x.target===request.handle.target&&jcs(x.selection)===jcs(selected))?.scope:mandatory.node_ids;
    if(!ids||ids.some(x=>!nodes.has(x)))return null;closure=ids.map(x=>nodes.get(x));
  }
  for(const item of ir.catalog)if(!selected||item.judgment_id!==selected.judgment_id)omissions.push({state:'explicitly_omitted',target:item.node_ref,field:'judgment',reason:selected?'outside_selection':'not_in_mode',expandable:false,handle_id:null});
  if(request.mode==='catalog')for(const d of declarations)omissions.push({state:'explicitly_omitted',target:d.id,field:'declaration',reason:'not_in_mode',expandable:false,handle_id:null});
  const authored=ir.nodes.find(x=>x.role==='declaration'&&x.owner_judgment_id===null)?.value;
  const projectedDeclarations=projectDeclarations(declarations,['highest_question','worldview','value_order','role','boundaries'].filter(k=>!authored||!Object.hasOwn(authored,k)));
  const missing=projectedDeclarations.missing;
  const claims=ir.nodes.filter(x=>x.role==='provenance'||x.role==='attribution');
  const hasClaim=claims.some(x=>x.role==='provenance'||x.value.state==='provided');
  const content={declarations:request.mode==='catalog'?[]:projectedDeclarations.declarations,catalog,selected,closure,references:ir.references.filter(x=>closure.some(n=>n.id===x.source_node)&&closure.some(n=>n.id===x.target_node)),relationships:ir.relationships.filter(x=>x.participants.every(p=>closure.some(n=>n.role==='judgment'&&n.value.id===p.judgment_ref))),missing,provenance:{declarations:claims,confirmation:hasClaim?'claimed_unverified':'not_evaluated',verifier_id:null,evidence_ref:null},expansion_handles:[]};
  return {asset:view.asset,tuple:view.tuple,digests:view.digests,snapshot_id:view.snapshot_id,content,diagnostics:[],omissions,assessment:assessment()};
}
function project(admitted,snapshot){
  try{const {error,view,request}=inspect(admitted,snapshot);if(error)return freeze(reject(error));const h=handleFields(request,view);if(h)return freeze(reject(h));const body=bodyFor(request,view);return freeze(body?{status:'projected',body:clone(body),diagnostics:[]}:reject('READ_PROJECTION_INVALID'));}
  catch{return freeze(reject('READ_PROJECTION_INVALID'));}
}
module.exports={project,inspect,handleFields,bodyFor};
