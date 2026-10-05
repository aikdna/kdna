'use strict';
const {inspectSnapshot}=require('@aikdna/kdna-core/read-boundary');
const {requests}=require('./brands.js');
const {foldOmissions}=require('./omissions.js');
const {selectedContext}=require('./selected-context.generated.js');
const {sameInstallation}=require('./installation.js');
const {tuple,clone,freeze,diagnostic,assessment,jcs,anchorFor}=require('./util.js');
const CAPABILITIES=require('../schema/read-contract-0.6.4.schema.json').$defs.AssetCapability.enum;
const reject=code=>({status:'rejected',body:null,diagnostics:[diagnostic(code)]});
const same=(left,right)=>jcs(left)===jcs(right);
const closureMemo=new WeakMap();
function assetCapability(view){
  const declared=view.asset_capability??view.ir.asset_capability;
  if(CAPABILITIES.includes(declared))return declared;
  const forms=view.ir.nodes.filter(x=>x.role==='judgment').map(x=>x.value.form);
  if(!forms.length||forms.some(x=>x!=='conclusion'&&x!=='rule'))return null;
  return new Set(forms).size>1?'mixed':forms[0]==='conclusion'?'asserted_answers':'result_forming_rules';
}
function inspect(admitted,snapshot){
  const record=requests.get(admitted);
  if(!record)return {error:'READ_INPUT_INVALID'};
  if(record.version_rejection)return {error:record.version_rejection};
  if(!sameInstallation())return {error:'READ_CORE_CAPABILITY_UNAVAILABLE'};
  if(snapshot===null||typeof snapshot!=='object'||snapshot instanceof Uint8Array||snapshot instanceof ArrayBuffer)return {error:'READ_INPUT_INVALID'};
  const view=inspectSnapshot(snapshot);if(!view)return {error:'READ_SNAPSHOT_UNATTESTED'};
  if(!same(view.tuple,tuple))return {error:'READ_MIXED_VERSION_TUPLE'};
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
function expansionFor(request,view,target=request.handle?.target){
  const anchor=anchorFor(request);
  return view.expansion_targets.find(x=>same(x.target,target)&&same(x.anchor,anchor));
}
function handleFields(request,view){
  const h=request.handle;if(!h)return null;
  if(h.core_version!==tuple.core||h.ir_version!==tuple.ir||h.read_version!==tuple.read)return 'READ_HANDLE_VERSION_MISMATCH';
  if(h.snapshot_id!==view.snapshot_id||h.A!==view.digests.A.observed||h.C!==view.digests.C.observed)return 'READ_HANDLE_STALE';
  if(h.asset_id!==view.asset.asset_id||h.asset_version!==view.asset.asset_version||!same(h.anchor,anchorFor(request)))return 'READ_HANDLE_ASSET_MISMATCH';
  const target=expansionFor(request,view);
  if(!target||!same([...target.scope].sort(),[...h.scope].sort()))return 'READ_HANDLE_SCOPE_MISMATCH';
  return null;
}
function closureFor(request,view){
  if(request.mode==='catalog')return {node_ids:[],unresolved_external:[]};
  if(request.mode==='whole_asset')return {node_ids:view.ir.asset_closure,unresolved_external:view.ir.asset_unresolved_external??[]};
  if(request.mode==='expand'){
    const target=expansionFor(request,view);
    return target?{node_ids:target.scope,unresolved_external:target.unresolved_external??[]}:null;
  }
  // Memoize each admitted view’s selection closure by its canonical selection key.

  let memo=closureMemo.get(view);if(!memo){memo=new Map();for(const row of view.ir.mandatory_closures)memo.set(jcs(row.selection),row);closureMemo.set(view,memo);}
  return memo.get(jcs(request.selection))??null;
}
function projectionFailure(request,view){
  const closure=closureFor(request,view);
  if(!closure)return 'READ_PROJECTION_INVALID';
  const supplied=new Set(view.ir.nodes.filter(node=>closure.node_ids.includes(node.id)).map(node=>jcs(node.target)));
  if((view.ir.unresolved_external??[]).some(ref=>ref.mandatory&&supplied.has(jcs(ref.source))))return 'READ_UNRESOLVED_EXTERNAL';
  return null;
}
function bodyFor(request,view){
  const ir=view.ir,nodes=new Map(ir.nodes.map(x=>[x.id,x]));
  const capability=assetCapability(view),mandatory=closureFor(request,view);
  if(capability===null||!mandatory||projectionFailure(request,view)||!Array.isArray(mandatory.node_ids)||mandatory.node_ids.some(id=>!nodes.has(id)))return null;
  const selected=request.selection;
  const scoped=request.mode==='exact_selection'||request.mode==='expand'?selectedContext(ir,mandatory.node_ids):null;
  const closure=scoped?scoped.closure:mandatory.node_ids.map(id=>nodes.get(id));
  const declarations=request.mode==='catalog'?[]:scoped?closure.filter(x=>x.role==='asset_declaration'):ir.nodes.filter(x=>x.role==='asset_declaration');
  const supplied=new Set([...declarations,...closure].map(x=>x.id));
  const catalog=scoped?scoped.catalog:ir.catalog;
  const omissions=scoped?scoped.omissions:[];
  const anchor=anchorFor(request),targets=view.expansion_targets.filter(x=>same(x.anchor,anchor));
  const available=new Map(targets.map(x=>[jcs(x.target),x]));
  let index=[];
  if(request.mode!=='catalog'){
    for(const descriptor of ir.asset_index){
      const target=available.get(jcs(descriptor.target));
      const node=nodes.get(descriptor.node_ref)??ir.nodes.find(x=>same(x.target,descriptor.target));
      if(!node)return null;
      // An explicit expansion requests this target and its necessary closure.
      // Authored optional references remain in its body without becoming new
      // body requests. This mode boundary is independent of Host permissions.
      if(request.mode==='expand'&&!supplied.has(node.id))continue;
      // R08 can require the related question only as a catalog description.
      // That role never requests its entire body, even under a broad Host grant.
      if(request.mode!=='whole_asset'&&node.role==='judgment'&&!supplied.has(node.id))continue;
      if(request.mode!=='whole_asset'&&!supplied.has(node.id)&&!target)continue;
      const body_delivery=supplied.has(node.id)?'inline':'deferred';
      if(body_delivery==='deferred'&&!target)return null;
      index.push({target:descriptor.target,owner:descriptor.owner,display_name:descriptor.display_name,body_delivery});
    }
  }
  const claims=[...declarations,...closure].filter(x=>x.role==='actor'||x.role==='source'||x.role==='source_use'||x.role==='asset_declaration'&&(x.value.creator||x.value.attributions?.state==='provided'));
  const references=scoped?scoped.references:ir.references.filter(x=>supplied.has(x.source_node)&&supplied.has(x.target_node));
  const relationIds=new Set(closure.filter(x=>x.role==='relationship').map(x=>x.value.id));
  if(request.mode==='catalog')omissions.push({state:'explicitly_omitted',target:ir.nodes.find(x=>x.role==='asset_declaration').id,field:'asset_index',reason:'not_in_mode',expandable:false,handle_id:null});
  if(!scoped)for(const item of catalog)if(!supplied.has(item.node_ref))omissions.push({state:'explicitly_omitted',target:item.node_ref,field:'judgment',reason:request.mode==='catalog'?'not_in_mode':'outside_selection',expandable:false,handle_id:null});
  const content={declarations,catalog,selected,closure,references,relationships:scoped?scoped.relationships:ir.relationships.filter(x=>relationIds.has(x.id)),missing:[],provenance:{declarations:claims,confirmation:claims.length?'claimed_unverified':'not_evaluated',verifier_id:null,evidence_ref:null},asset_capability:capability,asset_index:index,expansion_handles:[]};
  return {asset:view.asset,tuple:view.tuple,digests:view.digests,snapshot_id:view.snapshot_id,content,diagnostics:[],omissions,assessment:assessment()};
}
function project(admitted,snapshot){
  try{
    const {error,view,request}=inspect(admitted,snapshot);if(error)return freeze(reject(error));
    const failure=handleFields(request,view)||projectionFailure(request,view);if(failure)return freeze(reject(failure));
    const body=bodyFor(request,view);if(!body)return freeze(reject('READ_PROJECTION_INVALID'));
    // A pure projection cannot mint an authorized expansion handle. Do not
    // expose a deferred descriptor with a fabricated or missing credential.
    if(request.handle||body.content.asset_index.some(x=>x.body_delivery==='deferred'))return freeze(reject('READ_HOST_CONTEXT_UNTRUSTED'));
    return freeze({status:'projected',body:clone(folded(body)),diagnostics:[]});
  }catch{return freeze(reject('READ_PROJECTION_INVALID'));}
}
function folded(body){body.omissions=foldOmissions(body.omissions);return body;}
module.exports={project,inspect,handleFields,bodyFor,folded,assetCapability,anchorFor,expansionFor,projectionFailure};
