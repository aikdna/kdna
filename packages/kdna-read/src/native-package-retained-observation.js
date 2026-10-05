'use strict';
// Exact original retained rejection/budget/observation/scope functions below.
// This private post-sink check does not modify the original retained pipeline.
const {createRequire}=require('node:module');
const coreRequire=createRequire(require.resolve('@aikdna/kdna-core/package.json'));
const C=coreRequire('./src/public-contract/retained-common.js');
const V=coreRequire('./src/public-contract/retained/validators.cjs');
const {hosts}=require('./brands.js');
const {scopeBody}=require('./host-gate.js');
const {states}=require('./budget.js');
const {measureInternalResponse:measure}=require('./retained-response-meter.js');
const {decideBudget}=require('./budget-decision.js');
const {clone,freeze,jcs,diagnostic,result,assessment}=require('./util.js');
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
    value=clone(raw);
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

function fail(record,code){return finish(rejection(record,code,code==='READ_CORE_CAPABILITY_UNAVAILABLE'?'internal_capability_unavailable':'host_invalid'),record);}
module.exports={observe,scope,fail};
