'use strict';
const core=require('@aikdna/kdna-core/protection-node');
const {admitReadRequest}=require('./admission.js');
const {requests,hosts}=require('./brands.js');
const {prepareRead,registerPreparedHandles,discardPreparedHandles}=require('./pipeline.js');
const {clone,freeze,jcs}=require('./util.js');
const delivery=require('./protected-delivery.js');
const protectedHosts=new WeakMap(),handleOperations=new WeakMap();
// Generated independent expectation. Do not derive this from the installed Core at runtime.
const EXPECTED_PROTECTION = {"capabilities":["protected_admission","protected_operation","protected_production"],"contract":{"definition_digest":"sha256:7257adf964aadbce546b1403a059852b72f5df269503d6b58445d1f549e2252d","id":"kdna.protection-admission/1","version":"1.0.0"},"implementation":{"package":"@aikdna/kdna-core","version":"0.37.1-rc.browser.1"},"kdfs":["scrypt-sha256","argon2id"],"profiles":["kdna.envelope.aead/0.1.0","kdna.envelope.external-grant/0.1.0","kdna.checksums.document/1@1.0.0","kdsig.ed25519/0.1.0"]}; // @protection-expectation
const EXPECTED_READ_VERSION = "0.11.2-rc.browser.1"; // @protection-read-version
function sameInstallation(){
  try{return EXPECTED_PROTECTION!==null&&require('../package.json').version===EXPECTED_READ_VERSION&&require('@aikdna/kdna-core/package.json').version===EXPECTED_PROTECTION.implementation.version&&require('../package.json').peerDependencies['@aikdna/kdna-core']===EXPECTED_PROTECTION.implementation.version&&jcs(core.getProtectionContract())===jcs(EXPECTED_PROTECTION);}catch{return false;}
}
function createTrustedProtectedHostReadProvider(callbacks){
  if(!callbacks||typeof callbacks!=='object'||Object.getOwnPropertySymbols(callbacks).length||Object.getOwnPropertyNames(callbacks).sort().join(',')!=='deliver,observe'||['observe','deliver'].some(k=>{const d=Object.getOwnPropertyDescriptor(callbacks,k);return !d||!Object.hasOwn(d,'value')||typeof d.value!=='function';}))throw new TypeError('Protected Host callbacks required');
  const host=Object.freeze({}),state={observe:callbacks.observe,handles:new Map(),revocations:new Set(),lastEpoch:null};
  hosts.set(host,state);protectedHosts.set(host,callbacks.deliver);handleOperations.set(host,new Map());return host;
}
const none=()=>({kind:'none',external_commit:{state:'not_invoked'}});
function protectionFailure(result,history=none()){return freeze({status:result.status,diagnostic:result.diagnostic,disclosure:history,body:null,body_bytes:0});}
async function readProtectedNode(operation,candidate,controlProvider,host){
  const admission=admitReadRequest(candidate,controlProvider);
  if(admission.channel!=='admitted_request'){
    const {admitted_request,...result}=admission;return freeze({status:'request_failed',result:{...result,envelope:null}});
  }
  const requestRecord=requests.get(admission.admitted_request);
  if(requestRecord.version_rejection){
    const result=await prepareRead(()=>{throw Error('Unreachable');},null,candidate,controlProvider,host,{admission});
    return freeze({status:'request_failed',result});
  }
  if(!sameInstallation())return freeze({status:'admission_failed',admission:{status:'protection_failed',diagnostic:{code:'PROTECTION_INPUT_INVALID',stage:'input'}}});
  const bound=core.bindProtectionOperation(operation);
  if(bound.status!=='bound')return freeze({status:'admission_failed',admission:bound});
  const binding=bound.binding,source=binding.source();
  if(source.status==='protection_failed')return freeze({status:'admission_failed',admission:source});
  const hostCallback=protectedHosts.get(host);
  if(!hostCallback)return freeze({status:'delivery_failed',reason:'host_callback_failed',disclosure:none(),body:null,body_bytes:0});
  let prepared,state,lastReceipt;
  const context={admission,failure:null,context:null,
    async check(phase){const result=await binding.observe(phase);if(result.status!=='current'){this.failure=result;throw Error('Protection boundary');}const final=binding.assertCurrent(result.checkpoint);if(final.status!=='current'){this.failure=final;throw Error('Protection boundary');}lastReceipt=final.receipt;return final;},
    checkHandle(handle){if(handleOperations.get(host).get(handle.handle_id)!==operation){this.failure={status:'protection_failed',diagnostic:{code:'PROTECTION_OPERATION_UNTRUSTED',stage:'input'}};throw Error('Protected handle');}}
  };
  try{
    await context.check('projection');
    const actual=source.kind==='snapshot'?{status:'accepted',snapshot:source.snapshot}:source.catalog;
    prepared=await prepareRead(()=>actual,null,candidate,controlProvider,host,context);
    if(!prepared.envelope||!['ready','catalog_only'].includes(prepared.envelope.status))return freeze({status:'read_result',result:prepared,receipt:lastReceipt,disclosure:none()});
    await context.check('host_handoff');
    const issued=delivery.prepareDelivery(operation,binding,prepared,context.context,hosts.get(host),lastReceipt);state=issued.state;
    let acknowledgement;
    try{acknowledgement=await hostCallback(prepared,issued.token);}catch{delivery.closeOwner(state);return freeze({status:'delivery_failed',reason:'host_callback_failed',disclosure:delivery.disclosure(state),body:null,body_bytes:0});}
    const wasPending=state.pending;
    delivery.closeOwner(state);
    if(wasPending||state.failed||acknowledgement!==true)return freeze({status:'delivery_failed',reason:wasPending||state.failed?'transport_commit_failed':'host_callback_failed',disclosure:delivery.disclosure(state),body:null,body_bytes:0});
    await context.check('read_return');
    registerPreparedHandles(prepared);
    for(const handle of prepared.envelope.content.expansion_handles)handleOperations.get(host).set(handle.handle_id,operation);
    return freeze({status:'read_result',result:prepared,receipt:lastReceipt,disclosure:delivery.disclosure(state)});
  }catch{
    if(context.failure)return protectionFailure(context.failure,state?delivery.disclosure(state):none());
    return freeze({status:'delivery_failed',reason:'host_callback_failed',disclosure:state?delivery.disclosure(state):none(),body:null,body_bytes:0});
  }finally{if(state)delivery.closeOwner(state);if(prepared)discardPreparedHandles(prepared);}
}
module.exports={createTrustedProtectedHostReadProvider,readProtectedNode,commitProtectedTransport:delivery.commitProtectedTransport};
