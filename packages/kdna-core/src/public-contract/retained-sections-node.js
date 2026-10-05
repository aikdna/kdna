'use strict';
const crypto=require('node:crypto');
const C=require('./retained-common.js');
const native=require('./sections-node.js');
const {digestCanonical}=require('./digests.js');
const {policy}=require('./section-signatures.js');
const P=require('./retained-plan.js');
const state=require('./retained-state.js');
const tuple=require('./sections/contract.json').module.versionTuple;
const contract=C.strict.freeze({id:C.contract.module.version.contract_id,version:C.contract.module.version.contract_version,definition_digest:digestCanonical(C.contract.module)});
const copy=value=>C.strict.freeze(C.strict.copyJson(value));
function diagnostic(code,stage='core') {return {code,stage,severity:'error',subject:null,field:null};}
function failure(request,detail,code='READ_CORE_CAPABILITY_UNAVAILABLE',stage='core') {
  const result={contract,status:'rejected',request_id:request?.request_id??null,diagnostic:diagnostic(code,stage),detail,body:null,body_bytes:0};
  C.validate('RetainedSectionFailure06',result);
  return C.strict.freeze(result);
}
function admitRetainedSectionRequest(candidate) {
  let request;
  try {request=C.strict.copyJson(candidate);} catch {return failure(null,'input_invalid','READ_INPUT_INVALID','input');}
  try {
    C.need(request && typeof request==='object' && C.strict.identifier(request.request_id),'READ_INPUT_INVALID');
    C.keys(request,['request_id','tuple','budget_bytes','mode','selection','handle']);
    C.need(C.strict.uint(request.budget_bytes),'READ_INPUT_INVALID');
    C.need(request.tuple && typeof request.tuple==='object' && !Array.isArray(request.tuple) && Object.keys(request.tuple).every(k=>Object.hasOwn(tuple,k)&&typeof request.tuple[k]==='string'),'READ_INPUT_INVALID');
    if (!P.same(request.tuple,tuple)) {
      const baseline=require('./generated-contract.json');
      const old=[baseline.versionTuple,...baseline.types.UnsupportedVersionTuple.anyOf.map(x=>Object.fromEntries(Object.entries(x.properties).map(([k,v])=>[k,v.const])))];
      const historical=old.some(value=>P.same(value,request.tuple));
      const mixed=!historical&&Object.keys(tuple).some(k=>k!=='payload_profile'&&request.tuple[k]===tuple[k]);
      return failure(request,mixed?'mixed_tuple':'version_unsupported',mixed?'READ_MIXED_VERSION_TUPLE':'READ_UNSUPPORTED_VERSION','version');
    }
    C.validate('RetainedSectionRequest06',request);
  } catch {return failure(C.strict.identifier(request?.request_id)?request:null,'input_invalid','READ_INPUT_INVALID','input');}
  const token=Object.freeze({});state.requests.set(token,copy(request));
  return Object.freeze({status:'admitted_request',request:token});
}
function inspectRetainedSectionRequest(token) {return state.requests.get(token)??null;}
function createRetainedSectionReadAuthority(callback,signaturePolicy) {
  if (typeof callback!=='function') throw new TypeError('RETAINED_AUTHORITY_CALLBACK');
  const token=Object.freeze({});state.authorities.set(token,{callback,policy:policy(signaturePolicy)});return token;
}
function originFor(view,kind) {
  return {snapshot_id:view.snapshot_id,kind,capture_id:view.verification.capture.capture_id,
    admission_request_digest:view.verification.request_digest,verification_digest:digestCanonical(view.verification),
    checked_sections_digest:digestCanonical(view.verification.checked_sections)};
}
async function prepareRetainedSectionRead(snapshot,token,authority) {
  const raw=state.requests.get(token);
  if (!raw) return failure(null,'input_invalid','READ_INPUT_INVALID','input');
  let view=native.inspectWholeSectionSnapshot(snapshot), kind='whole';
  if (!view) {
    view=native.inspectSectionSnapshot(snapshot);kind='catalog';
    if (view && view.verification.mode!=='catalog') return failure(raw,'origin_scope_insufficient');
  }
  if (!view) {
    if (require('./protected-sections-node.js').inspectProtectedPayloadSnapshot(snapshot)) return failure(raw,'origin_protected');
    return failure(raw,'origin_untrusted','READ_SNAPSHOT_UNATTESTED');
  }
  if (kind==='catalog' && raw.mode!=='catalog') return failure(raw,'origin_scope_insufficient');
  const grant=state.authorities.get(authority);
  if (!grant) return failure(raw,'authority_untrusted');
  let request,origin,plan,intent,context;
  try {
    request=copy(P.normalize(raw,view)); origin=copy(originFor(view,kind));
    if (request.mode==='expand') C.need(P.same(request.handle.origin,origin),'READ_HANDLE_STALE');
    plan=P.plan(request,view);
    intent=copy({operation:'read_retained',operation_id:'retained:'+crypto.randomUUID(),origin,
      request_digest:digestCanonical(request),mode:request.mode,projection_node_ids:plan.node_ids,
      descriptor_node_ids:plan.descriptor_ids,issuable_handle_scopes:plan.targets,physical_reads:'none',protected_operation:false});
    context=copy({contract,request,asset:view.asset,tuple:view.tuple,intent,intent_digest:digestCanonical(intent),
      signature_policy:grant.policy,signature_policy_digest:digestCanonical(grant.policy)});
    C.validate('RetainedSectionAuthorityContext06',context);
  } catch (e) {
    if (C.isFailure(e) && /^READ_(ASSET_|SELECTION_|HANDLE_)/.test(e.code)) return failure(raw,e.code.startsWith('READ_HANDLE')?'handle_invalid':'input_invalid',e.code,e.code.startsWith('READ_HANDLE')?'handle':'selection');
    return failure(raw,'internal_capability_unavailable');
  }
  try {if (await grant.callback(context)!==true) return failure(request,'authority_denied');}
  catch {return failure(request,'authority_denied');}
  try {
    const receipt=view.verification.signature_integrity;
    const pin=grant.policy.expectedPublicKeyHex;
    if ((grant.policy.requireSignature||pin!==null) && (!receipt||receipt.status==='absent'||pin!==null&&receipt.public_key!==pin)) return failure(request,'signature_policy_unsatisfied','READ_CORE_INVALID');
    const check={basis:'immutable_origin_signature_receipt',policy:grant.policy,policy_digest:digestCanonical(grant.policy),origin_receipt_digest:digestCanonical(receipt),result:'satisfied',new_signature_verification:false};
    const data=copy({contract,request,request_digest:intent.request_digest,origin,intent,intent_digest:context.intent_digest,asset:view.asset,tuple:view.tuple,signature_policy_check:check});
    C.validate('RetainedSectionPreparationData06',data);
    const prepared=Object.freeze({});
    state.preparations.set(prepared,{phase:'available',snapshot,view,request,plan:copy(plan),data});
    return Object.freeze({status:'prepared',prepared});
  } catch {return failure(request,'internal_capability_unavailable');}
}
function inspectRetainedSectionPreparation(token) {return state.preparations.get(token)?.data??null;}
module.exports={admitRetainedSectionRequest,inspectRetainedSectionRequest,createRetainedSectionReadAuthority,prepareRetainedSectionRead,inspectRetainedSectionPreparation};
