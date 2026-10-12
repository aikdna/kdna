'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const {admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embedding=req('@aikdna/kdna-read/embedding');
const modelView=require('../src/model-view.js');
const {projectModelView,MODEL_VIEW_CONTRACT,PIPELINE_ENVELOPE_KEYS,RETAINED_ENVELOPE_KEYS,CONTENT_KEYS,BODY_KEYS,AUDIT_KEYS}=modelView;
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
  return {result,host};
}
function thaw(value){return JSON.parse(JSON.stringify(value));}
// The sections/retained reader the native CLI consumes emits the same envelope
// with two extra contract fields, and answers a catalog read with
// catalog_only. Both are shape transforms of a real result here.
function asRetained(result,{mode='whole_asset',status=result.envelope.status}={}){
  const copy=thaw(result);
  copy.envelope.mode=mode;
  copy.envelope.verification={ir_digest:{digest:'sha256:'+'0'.repeat(64)}};
  copy.envelope.status=status;
  return copy;
}

test('the body view keeps every author field and removes only the index and the handles',async()=>{
  for(const [contract,mode] of [['pipeline','whole_asset'],['pipeline','exact_selection'],['retained','whole_asset'],['retained','exact_selection']])
    for(const name of ['simple','complex']){
      const {result:original}=await readFull(name,mode);
      const result=contract==='retained'?asRetained(original,{mode}):original;
      const body=projectModelView(result,{mode});
      assert.equal(body.view_contract,MODEL_VIEW_CONTRACT);
      assert.equal(body.view,'body');
      assert.equal(body.status,'ready');
      const carried=BODY_KEYS.filter(k=>Object.hasOwn(result.envelope.content,k));
      assert.deepEqual(Object.keys(body.content).sort(),[...carried].sort());
      for(const key of carried)assert.deepEqual(body.content[key],result.envelope.content[key],`${contract}/${name}/${mode}/${key}`);
      for(const key of AUDIT_KEYS)assert.equal(Object.hasOwn(body.content,key),false,`${contract}/${name}/${mode}/${key}`);
      const surfaced=['content','status','asset','snapshot_id','request_id'];
      for(const key of (contract==='retained'?RETAINED_ENVELOPE_KEYS:PIPELINE_ENVELOPE_KEYS))
        if(!surfaced.includes(key))assert.equal(Object.hasOwn(body,key),false,`${contract}/${name}/${mode}/${key}`);
    }
});
test('every field of the full result is projected or named as omitted, and nothing else is claimed',async()=>{
  for(const contract of ['pipeline','retained']){
    const {result:original}=await readFull('complex','whole_asset');
    const result=contract==='retained'?asRetained(original):original;
    const variant=contract==='retained'?RETAINED_ENVELOPE_KEYS:PIPELINE_ENVELOPE_KEYS;
    const body=projectModelView(result,{mode:'whole_asset'});
    const surfaced=['content','status','asset','snapshot_id','request_id'];
    for(const key of variant){
      const where=surfaced.includes(key)?'surfaced':'fingerprint.omitted.envelope';
      assert.ok(where==='surfaced'||body.fingerprint.omitted.envelope.includes(key),`envelope field silently dropped: ${contract}/${key}`);
    }
    const carried=Object.keys(result.envelope.content);
    for(const key of carried)
      assert.ok(Object.hasOwn(body.content,key)||body.fingerprint.omitted.content.includes(key),`content field silently dropped: ${contract}/${key}`);
    for(const key of body.fingerprint.omitted.envelope)assert.ok(variant.includes(key),`omitted list invents an envelope field: ${contract}/${key}`);
    for(const key of body.fingerprint.omitted.content)assert.ok(AUDIT_KEYS.includes(key),`omitted list invents a content field: ${contract}/${key}`);
    assert.deepEqual(body.fingerprint.omitted.content,AUDIT_KEYS.filter(k=>carried.includes(k)));
    for(const key of CONTENT_KEYS)if(!carried.includes(key))assert.equal(body.fingerprint.omitted.content.includes(key),false,`a key the answer never carried cannot be named as omitted: ${key}`);
    assert.equal(body.fingerprint.recovery.view,'full');
    assert.equal(body.fingerprint.recovery.mode,'whole_asset');
    // The fingerprint restates identity the reader attested rather than hashing it here.
    assert.equal(body.fingerprint.request_id,result.envelope.request_id);
    assert.equal(body.fingerprint.snapshot_id,result.envelope.snapshot_id);
    assert.deepEqual(body.fingerprint.asset,result.envelope.asset);
    assert.deepEqual(body.fingerprint.attested,{
      A:result.envelope.digests.A.observed,
      C:result.envelope.digests.C.observed,
      E:result.envelope.digests.E.observed,
    });
    assert.equal(Object.hasOwn(body.fingerprint,'result_digest'),false,'no self-computed digest');
  }
});
test('a catalog answer is a body too, and the full view is one call away',async()=>{
  const {result}=await readFull('complex','exact_selection');
  // A catalog answer carries the catalog and the index and no judgment body, so
  // the projection must narrow to what the answer actually holds.
  const catalogOnly=asRetained(result,{mode:'catalog',status:'catalog_only'});
  catalogOnly.envelope.content={catalog:thaw(result.envelope.content.catalog),asset_index:thaw(result.envelope.content.asset_index)};
  const body=projectModelView(catalogOnly,{mode:'catalog'});
  assert.equal(body.view,'body');
  assert.equal(body.status,'catalog_only');
  assert.deepEqual(Object.keys(body.content),['catalog']);
  assert.deepEqual(body.fingerprint.omitted.content,['asset_index']);
  assert.deepEqual(body.content.catalog,result.envelope.content.catalog);
  // The same narrowing holds for the exact pipeline, whose catalog answer carries
  // the same two keys.
  const pipelineCatalog=thaw(result);
  pipelineCatalog.envelope.content={catalog:thaw(result.envelope.content.catalog),asset_index:thaw(result.envelope.content.asset_index)};
  assert.deepEqual(Object.keys(projectModelView(pipelineCatalog,{mode:'catalog'}).content),['catalog']);
  const full=projectModelView(result,{view:'full'});
  assert.equal(full,result,'the full view must not copy, reshape or drop anything');
  assert.ok(Array.isArray(full.envelope.content.asset_index));
  assert.ok(Array.isArray(full.envelope.content.expansion_handles));
  assert.deepEqual(projectModelView(full,{mode:'exact_selection'}),projectModelView(result,{mode:'exact_selection'}));
});
test('the projection reads nothing: no further host observation, no mutation of the result',async()=>{
  const {result,host}=await readFull('complex','whole_asset');
  const before=thaw(result),callsBefore=host.calls();
  const first=projectModelView(result,{mode:'whole_asset'}),second=projectModelView(result,{mode:'whole_asset'});
  assert.equal(host.calls(),callsBefore,'the projection must not observe the host again');
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
  const notAnObject=thaw(result);notAnObject.envelope.content=[];refusal(notAnObject,'content that is not an object must refuse');
  const bothShapes=thaw(result);bothShapes.envelope.mode='whole_asset';refusal(bothShapes,'a mixture of both envelope shapes must refuse');
  // A subset of known content keys is legitimate: it is what a mode carries.
  const narrowed=thaw(result);narrowed.envelope.content={catalog:narrowed.envelope.content.catalog};
  assert.deepEqual(Object.keys(projectModelView(narrowed,{mode:'catalog'}).content),['catalog']);
  assert.throws(()=>projectModelView(result,{view:'summary'}),error=>error.code==='READ_MODEL_VIEW_UNAVAILABLE','an unknown view name must refuse');
});
test('a result that is not a projectable read envelope reaches the caller unchanged',()=>{
  for(const value of [
    {channel:'read_envelope',envelope:{status:'rejected',diagnostics:[{code:'READ_SELECTION_UNKNOWN'}]}},
    {channel:'read_envelope',envelope:null},
    {channel:'read_no_body_control',envelope:null},
    {channel:'read_transport_failure',transport_failure:{code:'READ_TRANSPORT_FAILURE'}},
    {channel:'admission_rejection',admission_rejection:{reason:'unknown'}},
  ]){
    assert.equal(projectModelView(value,{mode:'whole_asset'}),value,JSON.stringify(value.channel));
    assert.equal(projectModelView(value,{view:'full'}),value,JSON.stringify(value.channel));
  }
});
