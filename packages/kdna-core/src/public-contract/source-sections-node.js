'use strict';
const S=require('./source-route-common.js');
const C=require('./section-common.js');
const D=require('./digests.js');
const {rejected}=require('./admit.js');
const {openSourceRouteCapture}=require('./source-route-capture.js');
const {admitPublicBytes}=require('./source-public-admission.js');
const {packPublic}=require('./source-public-pack.js');
const protectionProducer=require('./source-protection-producer.js');
const tuple=C.contract.module.versionTuple;
const routeContract=C.strict.freeze({id:'kdna.source-sections/0.1.0-candidate',version:'0.1.0-candidate',definition_digest:D.digestCanonical(S.contract.module)});
const requests=new WeakMap(),authorities=new WeakMap(),sourceFailures=new WeakSet();
const encoder=new (require('cbor-x/index-no-eval').Encoder)({useRecords:false,mapsAsObjects:true,structuredClone:false,alwaysUseFloat:true});
const frozen=v=>C.strict.freeze(v);
const none=()=>({kind:'none',external_commit:{state:'not_invoked'}});
function failure(code,stage){
  const out={status:'source_failed',diagnostic:{code,stage},disclosure:none(),body:null,body_bytes:0};
  S.validate('SourceRouteFailure06',out);return frozen(out);
}
function coreFailure(code,stage,error=null){
  const out={status:'core_rejected',stage,core:rejected(code,error?.component_failure??null,error?.diagnostic??null),disclosure:none(),body:null,body_bytes:0};
  S.validate('SourceRouteCoreRejected06',out);return frozen(out);
}
function fail(code,stage){const e=new Error(code);e.sourceCode=code;e.sourceStage=stage;sourceFailures.add(e);throw e;}
function admitSourceOperationRequest(candidate){
  try{
    const data=C.strict.copyJson(candidate);
    C.keys(data,['request_id','tuple','operation','expected_A','timeout_ms','signature_policy']);
    C.need(C.strict.identifier(data.request_id),'READ_INPUT_INVALID');
    const t=data.tuple;
    C.need(t&&typeof t==='object'&&!Array.isArray(t)&&Object.keys(t).every(k=>Object.hasOwn(tuple,k)&&typeof t[k]==='string'),'READ_INPUT_INVALID');
    if(Object.keys(t).length!==Object.keys(tuple).length||Object.entries(tuple).some(([k,v])=>t[k]!==v)){
      const baseline=require('./generated-contract.json');
      const historical=[baseline.versionTuple,...baseline.types.UnsupportedVersionTuple.anyOf.map(x=>Object.fromEntries(Object.entries(x.properties).map(([k,v])=>[k,v.const])))];
      const known=historical.some(v=>Object.keys(v).length===Object.keys(t).length&&Object.entries(v).every(([k,x])=>t[k]===x));
      return coreFailure(known?'READ_UNSUPPORTED_VERSION':Object.keys(tuple).some(k=>k!=='payload_profile'&&t[k]===tuple[k])?'READ_MIXED_VERSION_TUPLE':'READ_UNSUPPORTED_VERSION','input');
    }
    S.validate('SourceOperationRequest06',data);
    const token=Object.freeze({});requests.set(token,{data:frozen(data),digest:D.digestCanonical(data)});
    return Object.freeze({status:'admitted_request',request:token});
  }catch(e){
    if(C.isFailure(e)||S.isFailure(e)||e.reason==='READ_INPUT_INVALID')return failure('SOURCE_INPUT_INVALID','input');
    return failure('SOURCE_CAPABILITY_UNAVAILABLE','input');
  }
}
function inspectSourceOperationRequest(token){return requests.get(token)?.data??null;}
function createNativeSourceOperationAuthority(callback){
  if(typeof callback!=='function')throw new TypeError('Native source authority callback required');
  const token=Object.freeze({});authorities.set(token,callback);return token;
}
function classify(e){
  if(S.isFailure(e))return 'READ_CORE_CAPABILITY_UNAVAILABLE';
  if(C.isFailure(e))return e.code==='SECTION_TYPED_SHAPE'?'READ_CORE_INVALID':e.code;
  const known=new Set(['READ_INPUT_INVALID','READ_CORE_INVALID','READ_CORE_CAPABILITY_UNAVAILABLE','READ_UNSUPPORTED_CRITICAL','READ_INTERPRETATION_INCOMPLETE','READ_STATIC_POLICY_INVALID',...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum]);
  return known.has(e?.reason)?e.reason:'READ_CORE_CAPABILITY_UNAVAILABLE';
}
async function execute(input,token,authority,operation,editsInput,optionsInput,outputSecretProvider){
  let capture,stage='input';
  try{
    const record=requests.get(token),callback=authorities.get(authority);
    if(!record||!callback||record.data.operation!==operation)fail('SOURCE_INPUT_INVALID','input');
    let edits=null;
    if(operation==='pack_source'){
      edits=C.strict.copyJson(editsInput);
      if(!edits||typeof edits!=='object'||Array.isArray(edits)||Object.keys(edits).some(k=>!['manifest','payload'].includes(k)))fail('SOURCE_INPUT_INVALID','input');
    }
    let options=null;
    if(operation==='protect_source'){
      options=protectionProducer.validateOptions(optionsInput,fail);
      if(typeof outputSecretProvider!=='function')fail('SOURCE_INPUT_INVALID','input');
    }
    const started=Date.now(),deadline=started+record.data.timeout_ms;
    const current=where=>{if(Date.now()>deadline)fail('SOURCE_DEADLINE_EXCEEDED',where);};
    current('admission');stage='capture';capture=await openSourceRouteCapture(input);current('admission');
    const manifest=C.strict.parseJson(capture.manifestBytes);
    if(manifest.representation_profile==='kdna.protected.logical-payload/0.1.0-candidate')fail('SOURCE_CAPABILITY_UNAVAILABLE','admission');
    C.validate('Manifest06Candidate',manifest);
    C.need(capture.rows.every(r=>r.method===0||r.method===8),'READ_CORE_CAPABILITY_UNAVAILABLE');
    const inventory=capture.rows.map(r=>({name:r.name,decoded_bytes:r.size,compressed_bytes:r.compressed,local_header_offset:r.local,data_offset:r.start,compression_method:r.method})).sort((a,b)=>C.utf8(a.name,b.name));
    const intent={operation,scope:'complete_source',input_profile:'public_sections06',capture_id:capture.identity.capture_id,request_digest:record.digest,member_inventory:inventory,authentication_scope:'full_public_sections_and_resources',source_bytes_delivery:'public_caller',signature_policy:record.data.signature_policy,edits_digest:edits===null?null:D.digestCanonical(edits),output_policy_digest:options===null?null:D.digestCanonical(options)};
    const context={request:record.data,request_digest:record.digest,capture:capture.identity,intent,intent_digest:D.digestCanonical(intent),manifest_identity:{asset_id:manifest.asset_id,asset_version:manifest.version,judgment_version:manifest.judgment_version}};
    S.validate('SourceOperationAuthorityContext06',context);stage='authorization';current('authorization');
    let grant;
    try{grant=await callback(frozen(context));}catch{fail('SOURCE_CAPABILITY_UNAVAILABLE','authorization');}
    current('authorization');if(grant!==true)fail('SOURCE_PERMISSION_REJECTED','authorization');
    stage='admission';current('admission');const bytes=await capture.wholeAfterAuthorization();current('admission');
    const source=admitPublicBytes(bytes,record.data.signature_policy,capture.identity.capture_id,record.digest,capture.manifestBytes);
    if(record.data.expected_A!==null&&record.data.expected_A!==source.observed.A)fail('SOURCE_EXPECTED_ASSET_MISMATCH','admission');
    await capture.assertUnchanged();current('semantic');
    const logical=Buffer.from(encoder.encode(source.payload));
    if(operation==='protect_source'){
      stage='output';
      current('semantic');
      const plan=protectionProducer.prepare(source,options,fail);
      const secretRequest=frozen({
        source_A:source.observed.A,
        output_policy_digest:D.digestCanonical(options),
        kind:options.kind,
        signature:options.signature
      });
      let suppliedSecrets;
      current('semantic');
      try{
        suppliedSecrets=await outputSecretProvider(secretRequest);
      }catch{
        fail('SOURCE_PROVIDER_FAILED','semantic');
      }
      // A late callback's secret object is not inspected, copied, or used.
      current('semantic');
      await capture.assertUnchanged();
      current('semantic');
      const produced=protectionProducer.produce(source,options,plan,logical,suppliedSecrets,capture.identity.capture_id,record.digest,fail);
      const evidence={
        contract:routeContract,
        source_A:source.observed.A,
        source_profile:'public_sections06',
        output_profile:produced.outputProfile,
        output:produced.observed,
        E_profile:produced.Eprofile,
        payload_source:'derived_deterministic_cbor',
        payload_digest:D.digest(logical),
        member_actions:produced.actions,
        proof:'producer_observation_not_consumer_admission',
        output_delivery:'not_published'
      };
      S.validate('SourceRouteProductionEvidence06',evidence);
      await capture.assertUnchanged();
      current('return');
      return Object.freeze({status:'produced',bytes:new Uint8Array(produced.bytes),evidence:frozen(evidence)});
    }
    if(operation==='open_source'){
      const observation={contract:routeContract,request_digest:record.digest,capture_id:capture.identity.capture_id,input_profile:'public_sections06',tuple:structuredClone(tuple),digests:{A:source.observed.A,C:source.observed.C,E:source.observed.E.digest},E_profile:source.observed.E.profile,logical_payload_encoding:'derived_deterministic_cbor',logical_payload_digest:D.digest(logical),logical_payload_bytes:logical.length,inventory:source.metadata.map(row=>({name:row.name,type:row.type,mode:row.mode,size:source.entries[row.name].length,sha256:D.digest(source.entries[row.name])})),proof:'complete_native_admission_and_source_observation_not_editing_authority'};
      S.validate('SourceRouteObservation06',observation);
      const bundle={observation:frozen(observation),manifest:frozen(structuredClone(source.manifest)),payload:frozen(structuredClone(source.payload)),original_members:source.metadata.map(row=>Object.freeze({...row,bytes:new Uint8Array(source.entries[row.name])})),logical_payload:Object.freeze({entry:'payload.kdnab',bytes:new Uint8Array(logical),encoding:'derived_deterministic_cbor'})};
      current('return');return Object.freeze({status:'source_opened',source:Object.freeze(bundle)});
    }
    stage='output';current('semantic');const packed=packPublic(source,edits,record.data.signature_policy,capture.identity.capture_id,record.digest);
    const encoded=Buffer.from(encoder.encode(packed.output.payload));
    const evidence={contract:routeContract,source_A:source.observed.A,source_profile:'public_sections06',output_profile:'public_sections06',output:{A:packed.output.observed.A,C:packed.output.observed.C,E:packed.output.observed.E.digest},E_profile:packed.output.observed.E.profile,payload_source:packed.payloadExplicit?'explicit_edit':'derived_deterministic_cbor',payload_digest:D.digest(encoded),member_actions:packed.actions,proof:'producer_observation_not_consumer_admission',output_delivery:'not_published'};
    S.validate('SourceRouteProductionEvidence06',evidence);await capture.assertUnchanged();current('return');
    return Object.freeze({status:'produced',bytes:new Uint8Array(packed.bytes),evidence:frozen(evidence)});
  }catch(e){
    if(sourceFailures.has(e))return failure(e.sourceCode,e.sourceStage);
    if(stage==='input'&&(C.isFailure(e)||S.isFailure(e)||e.reason==='READ_INPUT_INVALID'))return failure('SOURCE_INPUT_INVALID','input');
    return coreFailure(classify(e),['input','capture','output'].includes(stage)?stage:'admission',e);
  }finally{if(capture)await capture.close();}
}
function openSectionSourceNode(input,request,authority){return execute(input,request,authority,'open_source');}
function packSectionSourceNode(input,request,authority,edits){return execute(input,request,authority,'pack_source',edits);}
function protectSectionSourceNode(input,request,authority,options,outputSecretProvider){
  return execute(input,request,authority,'protect_source',undefined,options,outputSecretProvider);
}
const protectedSource = require('./source-protected-opening.js');
const withProtectedSectionSourceNode = protectedSource.createOpening((request, authority) => {
  const record = requests.get(request), callback = authorities.get(authority);
  return record && callback ? { record, callback } : null;
}, classify);
module.exports={previewProtectedSectionSourceRevision:protectedSource.previewProtectedSectionSourceRevision,produceProtectedSectionSourceRevision:protectedSource.produceProtectedSectionSourceRevision,createTrustedProtectedSectionSourceHost:protectedSource.createTrustedProtectedSectionSourceHost,withProtectedSectionSourceNode,commitProtectedSectionSourceTransport:protectedSource.commitProtectedSectionSourceTransport,protectSectionSourceNode,admitSourceOperationRequest,inspectSourceOperationRequest,createNativeSourceOperationAuthority,openSectionSourceNode,packSectionSourceNode};
