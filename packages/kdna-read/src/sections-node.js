'use strict';
const core=require('@aikdna/kdna-core/sections-node');
const {bodyFor,folded,projectionFailure}=require('./project.js');
const {observeSectionHost,canonicalDigest}=require('./section-host-gate.js');
const {selectedBody,scopeSelectedBody}=require('./section-selected-project.js');
const {observe,scopeBody}=require('./host-gate.js');
const {hosts}=require('./brands.js');
const {states,measure}=require('./budget.js');
const {decideBudget}=require('./budget-decision.js');
const {deliverResult}=require('./delivery.js');
const {createTrustedHostReadProvider}=require('./embedding.js');
const {clone,freeze,jcs,correlation,result,transport,diagnostic,assessment}=require('./util.js');
const contract=require('./sections/contract.json'),V=require('./sections/validators.cjs'),tuple=contract.module.versionTuple;
const sectionHandles=require('./section-handles.js');
let sequence=0;
function rejected(request,code,state,original=null){const d=diagnostic(code);if(original){d.field=original.field??null;d.subject=original.subject??null;}return {contract:tuple.read,request_id:request.request_id,status:'rejected',tuple:null,asset:null,snapshot_id:null,digests:null,content:null,states:state,diagnostics:[d],omissions:[],assessment:assessment(),receipt:{receipt_id:'receipt:'+request.request_id,request_id:request.request_id,snapshot_id:null,host_id:null,host_epoch:null,decision_id:null,disclosed_at:null,delivery:'not_delivered'},budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}};}
function finish(envelope,request){const count=measure(envelope),ready=['ready','catalog_only'].includes(envelope.status),code=envelope.diagnostics.find(x=>x.severity==='error')?.code??null;const rejection=ready?rejected(request,'READ_BUDGET_INSUFFICIENT',{...envelope.states,core:envelope.states.core==='loaded_scope_valid'?'not_evaluated':envelope.states.core,interpretation:envelope.states.interpretation==='loaded_scope_complete'?'not_evaluated':envelope.states.interpretation}):envelope;const rejectionBytes=ready?measure(rejection,count):count;const decision=decideBudget(request,ready?count:null,rejectionBytes,code);if(decision.kind==='control')return decision.result;const body=decision.kind==='ready'?envelope:rejection;body.budget.required_bytes=decision.required;body.budget.actual_bytes=decision.actual;const out=result('read_envelope',body);if(!V.SectionReadCallResult06(out))throw new TypeError('SECTION_READ_OUTPUT_SHAPE');return out;}
async function readSectionNode(input,candidate,authority,host){
 let request,coreResult,admitted;
 try {admitted=core.admitSectionRequest(candidate);request=core.inspectSectionRequest(admitted);}catch{return freeze(transport('READ_INPUT_INVALID',correlation(null)));}
 if(request.mode==='expand'){
  const origin=sectionHandles.lookup(host,request.handle);if(origin.error)coreResult={status:'rejected',reason:origin.error};
  else{try{admitted=core.bindSectionExpansionRequest(origin.snapshot,request);request=core.inspectSectionRequest(admitted);}catch(e){coreResult={status:'rejected',reason:['READ_HANDLE_UNTRUSTED','READ_HANDLE_STALE','READ_HANDLE_SCOPE_MISMATCH','READ_HANDLE_ASSET_MISMATCH','READ_HANDLE_VERSION_MISMATCH'].includes(e.code)?e.code:'READ_CORE_CAPABILITY_UNAVAILABLE'};}}
 }
 if(!coreResult)try {coreResult=await core.admitSectionNode(input,admitted,authority);}catch{return freeze(transport('READ_CORE_CAPABILITY_UNAVAILABLE',correlation(request.request_id)));}
 const state=states(),fail=(code,field=null)=>finish(rejected(request,code,{...state},field),request);
 let prepared,pending=null;
 try {
  if(coreResult.status!=='accepted'){
   const reason=coreResult.reason;const code=reason?.startsWith('READ_')?reason:coreResult.status==='unsupported'?'READ_CORE_CAPABILITY_UNAVAILABLE':reason==='SECTION_PERMISSION_DENIED'?'READ_HOST_DENIED':reason==='SECTION_NATIVE_REQUEST_OR_AUTHORITY_UNTRUSTED'?'READ_INPUT_INVALID':'READ_CORE_INVALID';
   if(code==='READ_CORE_INVALID')state.core='invalid';if(code==='READ_HOST_DENIED')state.read_permission='denied';prepared=fail(code,coreResult.diagnostic);
  }else{
   const catalog=core.inspectSectionSnapshot(coreResult.snapshot);
   if(catalog&&['exact_selection','expand'].includes(catalog.verification.mode)){
    const normalized=core.inspectSectionRequest(coreResult.request);if(!normalized||normalized.mode!==request.mode||normalized.request_id!==request.request_id||normalized.budget_bytes!==request.budget_bytes||jcs(normalized.tuple)!==jcs(request.tuple)||jcs(normalized.handle)!==jcs(request.handle)||((request.selection===null)!==(normalized.selection===null))||request.selection&&(normalized.selection.asset_id!==request.selection.asset_id||normalized.selection.asset_version!==request.selection.asset_version||jcs([...new Set(normalized.selection.judgment_ids)].sort())!==jcs([...new Set(request.selection.judgment_ids)].sort()))||canonicalDigest(normalized)!==catalog.request_digest)throw new TypeError('SECTION_NORMALIZED_REQUEST_BINDING');request=normalized;
    const failureFor=code=>{if(code==='READ_HOST_DENIED')state.read_permission='denied';return fail(code);};
    if(catalog.unresolved_external.some(x=>x.mandatory))prepared=failureFor('READ_UNRESOLVED_EXTERNAL');else{
     const body=selectedBody(request,catalog),first=await observeSectionHost(host,request,coreResult.snapshot,catalog);
     if(first.error)prepared=failureFor(first.error);else if(!scopeSelectedBody(body,first.value)||request.mode==='exact_selection'&&!sectionHandles.scopeTargets(body,catalog,first.value))prepared=failureFor('READ_SCOPE_DENIED');else{
      const fresh=await observeSectionHost(host,request,coreResult.snapshot,catalog);if(fresh.error)prepared=failureFor(fresh.error);else if(!scopeSelectedBody(body,fresh.value)||request.mode==='exact_selection'&&!sectionHandles.scopeTargets(body,catalog,fresh.value))prepared=failureFor('READ_SCOPE_DENIED');else{
       const ctx=fresh.value,handles=request.mode==='exact_selection'?sectionHandles.mint(body,catalog,ctx):[];prepared=finish({contract:tuple.read,request_id:request.request_id,status:'ready',tuple:catalog.tuple,asset:catalog.asset,snapshot_id:catalog.snapshot_id,digests:null,content:body.content,states:{core:'loaded_scope_valid',interpretation:'loaded_scope_complete',writer:'not_evaluated',confirmation:body.content.provenance.confirmation,read_permission:'allowed',action_authorization:'not_evaluated'},diagnostics:body.diagnostics,omissions:body.omissions,assessment:body.assessment,verification:catalog.verification,receipt:{receipt_id:'receipt:'+catalog.snapshot_id+':'+(++sequence),request_id:request.request_id,snapshot_id:catalog.snapshot_id,host_id:ctx.host_id,host_epoch:ctx.host_epoch,decision_id:ctx.decision_id,disclosed_at:ctx.current_ms,delivery:'delivered'},budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}},request);if(prepared.envelope?.status==='ready')pending={state:fresh.state,handles,current:ctx.current_ms,snapshot:coreResult.snapshot};
      }
     }
    }
   }else if(catalog){
    const failureFor=code=>{if(code==='READ_HOST_DENIED')state.read_permission='denied';return fail(code);},check=ctx=>{const scope=new Set(ctx.scope);return catalog.catalog.every(r=>scope.has(r.node_ref))&&catalog.asset_index.every(r=>scope.has(r.node_ref));};
    const first=await observeSectionHost(host,request,coreResult.snapshot,catalog);
    if(first.error)prepared=failureFor(first.error);else if(!check(first.value))prepared=failureFor('READ_SCOPE_DENIED');
    else{const fresh=await observeSectionHost(host,request,coreResult.snapshot,catalog);if(fresh.error)prepared=failureFor(fresh.error);else if(!check(fresh.value))prepared=failureFor('READ_SCOPE_DENIED');else{
     const ctx=fresh.value;prepared=finish({contract:tuple.read,request_id:request.request_id,status:'catalog_only',tuple:catalog.tuple,asset:catalog.asset,snapshot_id:catalog.snapshot_id,digests:null,content:{catalog:catalog.catalog,asset_index:catalog.asset_index},states:{core:'not_evaluated',interpretation:'not_evaluated',writer:'not_evaluated',confirmation:'not_evaluated',read_permission:'allowed',action_authorization:'not_evaluated'},diagnostics:[],omissions:[],assessment:assessment(),verification:catalog.verification,receipt:{receipt_id:'receipt:'+catalog.snapshot_id+':'+(++sequence),request_id:request.request_id,snapshot_id:catalog.snapshot_id,host_id:ctx.host_id,host_epoch:ctx.host_epoch,decision_id:ctx.decision_id,disclosed_at:ctx.current_ms,delivery:'delivered'},budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}},request);
    }}
   }else{
   const authenticated=core.inspectWholeSectionSnapshot(coreResult.snapshot);if(!authenticated)throw new TypeError('SECTION_NATIVE_SNAPSHOT_MISSING');
   if(jcs(authenticated.tuple)!==jcs(tuple))throw new TypeError('SECTION_TUPLE_MISMATCH');
   const view={...authenticated,digests:authenticated.digests,expansion_targets:authenticated.ir.expansion_targets};
   state.core='valid';state.interpretation='complete';
   const first=await observe(host,request,coreResult.snapshot,view);
   if(first.error){if(first.error==='READ_HOST_DENIED')state.read_permission='denied';prepared=fail(first.error);}
   else {
    const error=projectionFailure(request,view);let body=error?null:bodyFor(request,view);
    if(error||!body)prepared=fail(error??'READ_PROJECTION_INVALID');
    else {body=clone(body);if(!scopeBody(body,request,first.value,view))prepared=fail('READ_SCOPE_DENIED');
     else {
      const fresh=await observe(host,request,coreResult.snapshot,view);
      if(fresh.error){if(fresh.error==='READ_HOST_DENIED')state.read_permission='denied';prepared=fail(fresh.error);}
      else if(!scopeBody(body,request,fresh.value,view))prepared=fail('READ_SCOPE_DENIED');
      else {
       const context=fresh.value,targets=new Map(),nodes=new Map(),handles=[];for(const t of view.expansion_targets){if(t.anchor.kind!=='asset')continue;const key=jcs(t.target);if(!targets.has(key))targets.set(key,t);}for(const n of view.ir.nodes){const key=jcs(n.target);if(!nodes.has(key))nodes.set(key,n);}
       let invalid=false;for(const descriptor of body.content.asset_index){if(descriptor.body_delivery==='inline')continue;const key=jcs(descriptor.target),target=targets.get(key);if(!target||target.scope.some(id=>!context.scope.includes(id))){invalid=true;break;}const handle={handle_id:'handle:'+view.snapshot_id+':'+(++sequence),asset_id:view.asset.asset_id,asset_version:view.asset.asset_version,A:view.digests.A.observed,C:view.digests.C.observed,snapshot_id:view.snapshot_id,core_version:tuple.core,ir_version:tuple.ir,read_version:tuple.read,anchor:{kind:'asset'},target:target.target,scope:target.scope,issued_at:context.current_ms,expires_at:Math.min(context.expires_at,context.current_ms+3600000),host_id:context.host_id,host_epoch:context.host_epoch};handles.push(handle);descriptor.handle_id=handle.handle_id;for(const omission of body.omissions)if(omission.target===nodes.get(key)?.id){omission.expandable=true;omission.handle_id=handle.handle_id;omission.reason='not_requested';}}
       if(invalid)prepared=fail('READ_SCOPE_DENIED');
       else {body.content.expansion_handles=handles;body=folded(body);state.read_permission='allowed';state.confirmation=body.content.provenance.confirmation;const envelope={contract:tuple.read,request_id:request.request_id,status:'ready',tuple:view.tuple,asset:view.asset,snapshot_id:view.snapshot_id,digests:view.digests,content:body.content,states:state,diagnostics:body.diagnostics,omissions:body.omissions,assessment:body.assessment,verification:view.verification,receipt:{receipt_id:'receipt:'+view.snapshot_id+':'+(++sequence),request_id:request.request_id,snapshot_id:view.snapshot_id,host_id:context.host_id,host_epoch:context.host_epoch,decision_id:context.decision_id,disclosed_at:context.current_ms,delivery:'delivered'},budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}};prepared=finish(envelope,request);if(prepared.envelope?.status==='ready')pending={state:fresh.state,handles,current:context.current_ms,snapshot:coreResult.snapshot};}
      }
     }
    }
   }
   }
  }
 }catch{prepared=fail('READ_CORE_CAPABILITY_UNAVAILABLE');}
 const delivered=await deliverResult(prepared,request.request_id,hosts.get(host)?.deliver);
 if(delivered===prepared&&pending)sectionHandles.commit(pending.state,pending.handles,pending.current,pending.snapshot);
 if(!V.SectionReadCallResult06(delivered))return freeze(transport('READ_CORE_CAPABILITY_UNAVAILABLE',correlation(request.request_id)));
 return freeze(delivered);
}
module.exports={readSectionNode,createTrustedHostReadProvider};
