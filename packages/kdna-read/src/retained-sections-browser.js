'use strict';
const S=require('../../kdna-core/src/public-contract/retained-state.js');
const {snapshots}=require('../../kdna-core/src/public-contract/section-native-state.js');
const C=require('../../kdna-core/src/public-contract/browser-retained/common.js');
const V=require('../../kdna-core/src/public-contract/retained-browser06/validators.cjs');
const {hosts}=require('./brands.js');
function createTrustedHostReadProviderJson(observeJson,deliver){
  if(typeof observeJson!=='function'||deliver!==undefined&&typeof deliver!=='function')throw new TypeError('RETAINED_HOST_CALLBACKS');
  const provider=Object.freeze({});hosts.set(provider,{observe:observeJson,deliver,handles:new Map(),revocations:new Set(),lastEpoch:null});return provider;
}
const {scopeBody,handleRegistered}=require('./host-gate.js');
const {project,mint}=require('./retained-read-project.js');
const {states}=require('./budget.js');
const {measureInternalResponse:measure}=require('./retained-response-meter.js');
const {decideBudget}=require('./budget-decision.js');
const {clone,freeze,jcs,correlation,result,transport,diagnostic,assessment}=require('./util.js');
const same=(a,b)=>jcs(a)===jcs(b);
function rejection(record,code,detail,state=states()) {
  const {request,data}=record;
  if (code==='READ_HOST_DENIED') state.read_permission='denied';
  return {contract:data.contract,request_id:request.request_id,status:'rejected',tuple:null,asset:null,snapshot_id:null,digests:null,content:null,
    states:state,diagnostics:[diagnostic(code,code==='READ_CORE_CAPABILITY_UNAVAILABLE'?'core':undefined)],omissions:[],assessment:assessment(),
    receipt:{receipt_id:'receipt:'+request.request_id,request_id:request.request_id,snapshot_id:null,host_id:null,host_epoch:null,decision_id:null,disclosed_at:null,delivery:'not_delivered'},
    budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'},retained_detail:detail};
}
function finish(envelope,record) {
  const count=measure(envelope),ready=['ready','catalog_only'].includes(envelope.status);
  const code=envelope.diagnostics.find(x=>x.severity==='error')?.code??null;
  const rejected=ready?rejection(record,'READ_BUDGET_INSUFFICIENT','budget_insufficient',{...envelope.states}):envelope;
  const rejectedBytes=ready?measure(rejected,count):count;
  const decision=decideBudget(record.request,ready?count:null,rejectedBytes,code);
  if (decision.kind==='control') return decision.result;
  const body=decision.kind==='ready'?envelope:rejected;
  body.budget.required_bytes=decision.required;body.budget.actual_bytes=decision.actual;
  const out=result('read_envelope',body);
  if (!V.RetainedSectionReadCallResult06(out)) throw new TypeError('RETAINED_READ_OUTPUT_SHAPE');
  return out;
}
async function observe(host,record) {
  const state=hosts.get(host);
  if (!state) return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  let raw,value;
  try {raw=await state.observe(freeze({request:record.request,snapshot:record.snapshot,preparation:record.data}));}
  catch {return {error:'READ_CORE_CAPABILITY_UNAVAILABLE'};}
  try {
    value=C.parseJsonText(raw);
    C.validate('RetainedSectionHostObservation06',value);
  } catch {return {error:'READ_HOST_CONTEXT_UNTRUSTED'};}
  const {data,request}=record;
  if (value.operation_id!==data.intent.operation_id||value.request_id!==request.request_id||value.request_digest!==data.request_digest||
      !same(value.origin,data.origin)||value.intent_digest!==data.intent_digest||!same(value.asset,data.asset)||!same(value.tuple,data.tuple)) return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  if (value.issued_at>=value.expires_at||value.expires_at-value.issued_at>3600000) return {error:'READ_HOST_CONTEXT_UNTRUSTED'};
  const h=request.handle;
  if (h&&(h.host_id!==value.host_id||h.host_epoch!==value.host_epoch)) return {error:'READ_HOST_EPOCH_MISMATCH'};
  if (value.current_ms<value.issued_at||h&&value.current_ms<h.issued_at) return {error:'READ_HOST_TIME_INVALID'};
  if (h&&value.current_ms>=h.expires_at) return {error:'READ_HANDLE_EXPIRED'};
  if (value.current_ms>=value.expires_at) return {error:'READ_HOST_CONTEXT_EXPIRED'};
  const denial=jcs([value.host_id,value.host_epoch,data.asset.asset_id]);
  if (value.lift_denial===true) state.revocations.delete(denial);
  if (value.revoked===true||value.decision==='deny') state.revocations.add(denial);
  if (state.revocations.has(denial)) return {error:'READ_HOST_DENIED'};
  return {value,state};
}
function scope(body,record,context) {
  const allowed=new Set(context.scope);
  const required=[...record.data.intent.projection_node_ids,...record.data.intent.descriptor_node_ids,...record.plan.targets.flatMap(t=>t.scope)];
  if (required.some(id=>!allowed.has(id))) return false;
  if (record.request.mode==='catalog') return true;
  return scopeBody(body,record.request,context,record.view);
}
async function readRetainedSection(token,host) {
  // Consume before any await, including before untrusted Host callbacks.
  const record=S.consume(token);
  if (!record) return freeze(transport('READ_INPUT_INVALID',correlation(null)));
  const id=record.request.request_id;
  try {
  if(record.data.origin.kind!=='whole'||snapshots.get(record.snapshot)!==record.view||record.view.verification.mode!=='whole_asset')return freeze(transport('READ_SNAPSHOT_UNATTESTED',correlation(id)));
  let output,pending=[];
  const fail=(code,detail=code==='READ_CORE_CAPABILITY_UNAVAILABLE'?'internal_capability_unavailable':'host_invalid')=>finish(rejection(record,code,detail),record);
  try {
    const handle=record.request.handle;
    if (handle&&!handleRegistered(host,handle)) output=fail('READ_HANDLE_UNTRUSTED','handle_invalid');
    else {
      const first=await observe(host,record);
      if (first.error) output=fail(first.error);
      else if (record.plan.unresolved) output=fail('READ_UNRESOLVED_EXTERNAL','input_invalid');
      else {
        const body=project(record);
        if (!scope(body,record,first.value)) output=fail('READ_SCOPE_DENIED');
        else {
          const second=await observe(host,record);
          if (second.error) output=fail(second.error);
          else if (!scope(body,record,second.value)) output=fail('READ_SCOPE_DENIED');
          else {
            const {request,data,view}=record,ctx=second.value;
            pending=mint(body,record,ctx,()=> 'retained-handle:'+globalThis.crypto.randomUUID());
            const proof={contract:data.contract,operation_id:data.intent.operation_id,origin:data.origin,request_digest:data.request_digest,
              intent_digest:data.intent_digest,mode:request.mode,origin_verification:view.verification,signature_policy_check:data.signature_policy_check,
              new_capture:false,io:[],new_domain_validation:false,new_digest_computation:false};
            output=finish({contract:data.contract,mode:request.mode,request_id:id,status:request.mode==='catalog'?'catalog_only':'ready',tuple:view.tuple,
              asset:view.asset,snapshot_id:view.snapshot_id,digests:view.digests??null,content:body.content,
              states:{core:data.origin.kind==='whole'?'valid':'not_evaluated',interpretation:data.origin.kind==='whole'?'complete':'not_evaluated',writer:'not_evaluated',
                confirmation:body.content.provenance?.confirmation??'not_evaluated',read_permission:'allowed',action_authorization:'not_evaluated'},
              diagnostics:body.diagnostics,omissions:body.omissions,assessment:body.assessment,verification:proof,
              receipt:{receipt_id:'retained-receipt:'+globalThis.crypto.randomUUID(),request_id:id,snapshot_id:view.snapshot_id,host_id:ctx.host_id,host_epoch:ctx.host_epoch,decision_id:ctx.decision_id,disclosed_at:ctx.current_ms,delivery:'delivered'},
              budget:{limit_bytes:request.budget_bytes,required_bytes:'0000000000000000',actual_bytes:'0000000000000000'}},record);
          }
        }
      }
    }
  } catch {output=fail('READ_CORE_CAPABILITY_UNAVAILABLE','internal_capability_unavailable');pending=[];}
  try {
    const deliver=hosts.get(host)?.deliver;
    if (output.channel==='transport_failure') return freeze(output);
    if (!deliver||await deliver(freeze(output))!==true) return freeze(transport(output.envelope?.diagnostics[0]?.code??null,correlation(id)));
    if (output.envelope?.status==='ready') {
      const registry=hosts.get(host).handles,current=output.envelope.receipt.disclosed_at;
      for (const [key,value] of registry) if (value.expires_at<=current) registry.delete(key);
      for (const handle of pending) registry.set(handle.handle_id,freeze(clone(handle)));
    }
    return freeze(output);
  } catch {return freeze(transport(output?.envelope?.diagnostics[0]?.code??null,correlation(id)));}
  } finally {S.close(token);}
}
module.exports={createTrustedHostReadProviderJson,readRetainedSection};
