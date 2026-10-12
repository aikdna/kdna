'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const {admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embedding=req('@aikdna/kdna-read/embedding');
const {projectModelView,MODEL_VIEW_CONTRACT,ENVELOPE_KEYS,CONTENT_KEYS,BODY_KEYS,AUDIT_KEYS}=require('../src/model-view.js');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const control=embedding.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
function prepared(name='simple',edit=()=>{}){
  const asset=F.asset(tuple,name);edit(asset);
  const bytes=F.encode(asset,req,{deflate:true});return {asset,bytes,admitted:admitBrowser(bytes)};
}
// One trusted host per read, counting its observations so a test can prove the
// projection performs no read of its own.
function countingHost(){
  let calls=0;
  const provider=embedding.createTrustedHostReadProvider({observe:({request,snapshot})=>{
    calls++;const view=inspectSnapshot(snapshot);
    return {host_id:'host:model-view',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,snapshot_id:view.snapshot_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:view.ir.nodes.map(n=>n.id),issued_at:900,expires_at:1900,current_ms:1000,decision:'allow',policy_id:'policy:test'};
  }});
  return {provider,calls:()=>calls};
}
function request(asset,mode='whole_asset',id=asset.payload.judgments[0].id){return F.candidate(tuple,asset,mode,id,8000000);}
async function readFull(name,mode){
  const {asset,admitted}=prepared(name);
  assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
  const host=countingHost();
  const result=await readBrowser(admitted.snapshot,request(asset,mode),control,host.provider);
  assert.equal(result.channel,'read_envelope',JSON.stringify(result));
  assert.equal(result.envelope.status,'ready',JSON.stringify(result));
  return {result,host,callsBeforeProjection:host.calls()};
}
function thaw(value){return JSON.parse(JSON.stringify(value));}

test('the body view keeps every author field and removes only the index and the handles',async()=>{
  for(const mode of ['whole_asset','exact_selection'])
    for(const name of ['simple','complex']){
      const {result}=await readFull(name,mode),body=projectModelView(result,{mode});
      assert.equal(body.view_contract,MODEL_VIEW_CONTRACT);
      assert.equal(body.view,'body');
      assert.equal(body.status,'ready');
      assert.deepEqual(Object.keys(body.content).sort(),[...BODY_KEYS].sort());
      for(const key of BODY_KEYS)assert.deepEqual(body.content[key],result.envelope.content[key],`${name}/${mode}/${key}`);
      for(const key of AUDIT_KEYS)assert.equal(Object.hasOwn(body.content,key),false,`${name}/${mode}/${key}`);
      // `content` becomes the body and `status` is restated as a plain fact; every
      // other envelope field, including the read contract coordinate, is gone.
      for(const key of ENVELOPE_KEYS.filter(k=>!['content','status'].includes(k)))assert.equal(Object.hasOwn(body,key),false,`${name}/${mode}/${key}`);
    }
});
test('every field of the full result is projected or named as omitted, and nothing else is claimed',async()=>{
  const {result}=await readFull('complex','whole_asset'),body=projectModelView(result,{mode:'whole_asset'});
  const where={};
  for(const key of ENVELOPE_KEYS){
    where[key]= key==='content'?'projected:content'
      :key==='status'?'projected:status'
      :['asset','snapshot_id'].includes(key)?'fingerprint'
      :body.fingerprint.omitted.envelope.includes(key)?'fingerprint.omitted.envelope'
      :'MISSING';
    assert.notEqual(where[key],'MISSING','envelope field silently dropped: '+key);
  }
  for(const key of CONTENT_KEYS)
    assert.ok(Object.hasOwn(body.content,key)||body.fingerprint.omitted.content.includes(key),'content field silently dropped: '+key);
  for(const key of body.fingerprint.omitted.envelope)assert.ok(ENVELOPE_KEYS.includes(key),'omitted list invents an envelope field: '+key);
  for(const key of body.fingerprint.omitted.content)assert.ok(AUDIT_KEYS.includes(key),'omitted list invents a content field: '+key);
  assert.deepEqual(body.fingerprint.omitted.content,[...AUDIT_KEYS]);
  assert.equal(body.fingerprint.recovery.view,'full');
  assert.equal(body.fingerprint.recovery.mode,'whole_asset');
});
test('the full view returns the same result object, so the moved material is one call away',async()=>{
  const {result}=await readFull('complex','exact_selection');
  const full=projectModelView(result,{view:'full'});
  assert.equal(full,result,'the full view must not copy, reshape or drop anything');
  assert.ok(Array.isArray(full.envelope.content.asset_index));
  assert.ok(Array.isArray(full.envelope.content.expansion_handles));
  // Re-projecting the full view reproduces the body view exactly: the body view
  // carries no information the full view cannot rebuild.
  assert.deepEqual(projectModelView(full,{mode:'exact_selection'}),projectModelView(result,{mode:'exact_selection'}));
});
test('the projection reads nothing: no further host observation, no mutation of the result',async()=>{
  const {result,host,callsBeforeProjection}=await readFull('complex','whole_asset');
  const before=thaw(result);
  const first=projectModelView(result,{mode:'whole_asset'}),second=projectModelView(result,{mode:'whole_asset'});
  assert.equal(host.calls(),callsBeforeProjection,'the projection must not observe the host again');
  assert.ok(Object.isFrozen(result));
  assert.deepEqual(thaw(result),before,'the projection must not mutate its input');
  assert.deepEqual(first,second,'the projection must be deterministic');
});
test('an unrecognised shape is refused instead of silently projected',async()=>{
  const {result}=await readFull('simple','whole_asset');
  const refusal=(candidate,label)=>assert.throws(()=>projectModelView(candidate,{mode:'whole_asset'}),error=>error.code==='READ_MODEL_VIEW_UNAVAILABLE',label);
  const extraEnvelope=thaw(result);extraEnvelope.envelope.future_field='x';refusal(extraEnvelope,'an extra envelope field must refuse');
  const missingEnvelope=thaw(result);delete missingEnvelope.envelope.receipt;refusal(missingEnvelope,'a missing envelope field must refuse');
  const extraContent=thaw(result);extraContent.envelope.content.future_field=[];refusal(extraContent,'an extra content field must refuse');
  const missingContent=thaw(result);delete missingContent.envelope.content.asset_index;refusal(missingContent,'a missing content field must refuse');
  assert.throws(()=>projectModelView(result,{view:'summary'}),error=>error.code==='READ_MODEL_VIEW_UNAVAILABLE','an unknown view name must refuse');
});
test('a result that is not a ready read envelope reaches the caller unchanged',()=>{
  for(const value of [
    {channel:'read_envelope',envelope:{status:'rejected',diagnostics:[{code:'READ_SELECTION_UNKNOWN'}]}},
    {channel:'read_envelope',envelope:{status:'catalog_only'}},
    {channel:'read_no_body_control',envelope:null},
    {channel:'read_transport_failure',transport_failure:{code:'READ_TRANSPORT_TIMEOUT'}},
    {channel:'admission_rejection',admission_rejection:{reason:'unknown'}},
  ]){
    assert.equal(projectModelView(value,{mode:'whole_asset'}),value,JSON.stringify(value.channel));
    assert.equal(projectModelView(value,{view:'full'}),value,JSON.stringify(value.channel));
  }
});
