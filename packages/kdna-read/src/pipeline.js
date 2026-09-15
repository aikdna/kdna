'use strict';
const {admitReadRequest}=require('./admission.js');
const {requests,hosts}=require('./brands.js');
const {inspect,handleFields,bodyFor}=require('./project.js');
const {handleRegistered,observe,scopeBody}=require('./host-gate.js');
const {states,rejectedEnvelope,finish}=require('./budget.js');
const {tuple,clone,freeze,correlation,result,transport}=require('./util.js');
const {deliverResult}=require('./delivery.js');
const pendingHandles=new WeakMap();
let receiptSequence=0;
async function prepareRead(admit,input,candidate,controlProvider,host){
  const admission=admitReadRequest(candidate,controlProvider);
  if(admission.channel!=='admitted_request'){
    const {admitted_request,...rest}=admission;return freeze({channel:rest.channel,envelope:null,admission_rejection:rest.admission_rejection,control:rest.control,transport_failure:rest.transport_failure});
  }
  const admitted=admission.admitted_request,record=requests.get(admitted),state=states(),cor=correlation(record.request_id);let cause=null;
  const failure=code=>{cause=code;return finish(rejectedEnvelope(record,code,{...state}),record);};
  try{
    if(record.version_rejection)return freeze(failure(record.version_rejection));
    const core=await admit(input);
    if(core.status!=='accepted'){
      if(core.states){state.core=core.states.core;state.interpretation=core.states.interpretation;}
      return freeze(failure(core.reason));
    }
    const snapshot=core.snapshot;
    const authenticated=require('@aikdna/kdna-core/read-boundary').inspectSnapshot(snapshot);
    if(authenticated){state.core='valid';state.interpretation='complete';}
    const prepared=inspect(admitted,snapshot);
    if(prepared.error)return freeze(failure(prepared.error));
    const {view,request}=prepared;state.core='valid';state.interpretation='complete';
    if(request.handle){if(!handleRegistered(host,request.handle))return freeze(failure('READ_HANDLE_UNTRUSTED'));const error=handleFields(request,view);if(error)return freeze(failure(error));}
    const first=await observe(host,request,snapshot,view);
    if(first.error){if(first.error==='READ_HOST_DENIED')state.read_permission='denied';return freeze(failure(first.error));}
    let body=bodyFor(request,view);if(!body)return freeze(failure('READ_PROJECTION_INVALID'));body=clone(body);
    if(!scopeBody(body,request,first.value))return freeze(failure('READ_SCOPE_DENIED'));
    const fresh=await observe(host,request,snapshot,view);
    if(fresh.error){if(fresh.error==='READ_HOST_DENIED')state.read_permission='denied';return freeze(failure(fresh.error));}
    if(!scopeBody(body,request,fresh.value))return freeze(failure('READ_SCOPE_DENIED'));
    const context=fresh.value,hostState=fresh.state;
    state.read_permission='allowed';state.confirmation=body.content.provenance.confirmation;
    const handles=[];
    if(request.selection&&request.mode!=='expand')for(const target of view.expansion_targets){
      if(target.selection.judgment_id!==request.selection.judgment_id||target.scope.some(x=>!context.scope.includes(x)))continue;
      handles.push({handle_id:'handle:'+view.snapshot_id+':'+(++receiptSequence),asset_id:view.asset.asset_id,asset_version:view.asset.asset_version,A:view.digests.A.observed,C:view.digests.C.observed,snapshot_id:view.snapshot_id,core_version:tuple.core,ir_version:tuple.ir,read_version:tuple.read,selection:request.selection,target:target.target,scope:target.scope,issued_at:context.current_ms,expires_at:Math.min(context.expires_at,context.current_ms+3600000),host_id:context.host_id,host_epoch:context.host_epoch});
    }
    body.content.expansion_handles=handles;
    const envelope={contract:tuple.read,request_id:record.request_id,status:'ready',tuple:body.tuple,asset:body.asset,snapshot_id:body.snapshot_id,digests:body.digests,content:body.content,states:state,diagnostics:body.diagnostics,omissions:body.omissions,assessment:body.assessment,receipt:{receipt_id:'receipt:'+view.snapshot_id+':'+(++receiptSequence),request_id:record.request_id,snapshot_id:view.snapshot_id,host_id:context.host_id,host_epoch:context.host_epoch,decision_id:context.decision_id,disclosed_at:context.current_ms,delivery:'delivered'},budget:{limit_bytes:record.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}};
    const finished=finish(envelope,record);cause=finished.envelope?.diagnostics[0]?.code??finished.control?.semantic_cause??null;
    if(finished.channel==='read_envelope'&&finished.envelope.status==='ready')pendingHandles.set(finished,{hostState,handles});
    return freeze(finished);
  }catch{return freeze(transport(cause,cor));}
}
async function runRead(admit,input,candidate,controlProvider,host){
 const prepared=await prepareRead(admit,input,candidate,controlProvider,host);
 const id=prepared.envelope?.request_id??prepared.admission_rejection?.correlation.request_id??prepared.control?.correlation.request_id??prepared.transport_failure?.correlation.request_id??null;
 const delivered=await deliverResult(prepared,id,hosts.get(host)?.deliver);
 if(delivered===prepared&&pendingHandles.has(prepared)){
  const {hostState,handles}=pendingHandles.get(prepared);
  // A long-lived host keeps one registry across reads. Expired handles are still rejected by the
  // host gate (expiry is checked by timestamp, not by presence), but they would otherwise accumulate
  // without bound in a long session. Drop the ones that can no longer be used before registering the
  // new ones, so a host's live registry is bounded by its unexpired handles.
  const current_ms=prepared.envelope?.receipt?.disclosed_at;
  if(typeof current_ms==='number')for(const [handle_id,registered] of hostState.handles)if(current_ms>=registered.expires_at)hostState.handles.delete(handle_id);
  for(const handle of handles)hostState.handles.set(handle.handle_id,freeze(clone(handle)));
 }
 pendingHandles.delete(prepared);
 return delivered;
}
module.exports={runRead};
