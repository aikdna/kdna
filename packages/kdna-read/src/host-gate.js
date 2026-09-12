'use strict';
const {hosts}=require('./brands.js');
const {identifier,uint,clone,freeze,jcs}=require('./util.js');
function handleRegistered(provider,handle){const state=hosts.get(provider);return !!state&&state.handles.has(handle.handle_id)&&jcs(state.handles.get(handle.handle_id))===jcs(handle);}
async function observe(provider,request,snapshot,view){
  const state=hosts.get(provider);if(!state)return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  const raw=await state.observe(freeze({request,snapshot}));
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  let value;try{value=clone(raw);}catch{return {error:'READ_HOST_CONTEXT_UNTRUSTED'};}
  const keys=['host_id','host_epoch','decision_id','request_id','snapshot_id','A','C','scope','issued_at','expires_at','decision','policy_id','current_ms','revoked','lift_denial'];
  if(Object.keys(value).some(k=>!keys.includes(k))||['revoked','lift_denial'].some(k=>Object.hasOwn(value,k)&&typeof value[k]!=='boolean'))return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  for(const k of ['host_id','host_epoch','decision_id','request_id','snapshot_id','policy_id'])if(!identifier(value[k]))return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  if(value.request_id!==request.request_id||value.snapshot_id!==view.snapshot_id||value.A!==view.digests.A.observed||value.C!==view.digests.C.observed||!['allow','deny'].includes(value.decision)||!Array.isArray(value.scope)||value.scope.some(x=>!identifier(x))||new Set(value.scope).size!==value.scope.length)return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  if(!uint(value.issued_at)||!uint(value.expires_at)||value.issued_at>=value.expires_at||value.expires_at-value.issued_at>3600000)return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  const handle=request.handle;
  if(handle&&(handle.host_id!==value.host_id||handle.host_epoch!==value.host_epoch))return {error:'READ_HOST_EPOCH_MISMATCH'};
  if(!uint(value.current_ms)||value.current_ms<value.issued_at||(handle&&value.current_ms<handle.issued_at))return {error:'READ_HOST_TIME_INVALID'};
  if(handle&&value.current_ms>=handle.expires_at)return {error:'READ_HANDLE_EXPIRED'};
  if(value.current_ms>=value.expires_at)return {error:'READ_HOST_CONTEXT_EXPIRED'};
  const denial=jcs([value.host_id,value.host_epoch,view.asset.asset_id]);
  if(value.lift_denial===true)state.revocations.delete(denial);
  if(value.revoked===true||value.decision==='deny')state.revocations.add(denial);
  if(state.revocations.has(denial))return {error:'READ_HOST_DENIED'};
  return {value,state};
}
function scopeBody(body,request,context){
  const allowed=new Set(context.scope),content=body.content;
  if(content.closure.some(x=>!allowed.has(x.id)))return false;
  content.declarations=content.declarations.filter(x=>allowed.has(x.id));
  content.catalog=content.catalog.filter(x=>allowed.has(x.node_ref));
  content.provenance.declarations=content.provenance.declarations.filter(x=>allowed.has(x.id));
  if(!content.provenance.declarations.some(x=>x.role==='provenance'||x.value.state==='provided')){content.provenance.confirmation='not_evaluated';content.provenance.verifier_id=null;content.provenance.evidence_ref=null;}
  content.relationships=content.relationships.filter(r=>content.closure.some(n=>n.role==='relationship'&&n.value.id===r.id&&allowed.has(n.id)));
  content.references=content.references.filter(x=>allowed.has(x.source_node)&&allowed.has(x.target_node));
  body.omissions=body.omissions.filter(x=>allowed.has(x.target));
  return true;
}
module.exports={handleRegistered,observe,scopeBody};
