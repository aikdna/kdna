'use strict';
// Session-scoped handle resolution: a client that kept a delivered answer can
// name its expansion handles by id, and every misuse (unknown, foreign asset,
// stale snapshot, expired) gets an explicit refusal with the action a caller
// should take. Resolution grants nothing: the returned handle still passes the
// reader's own admission on use, which this file also exercises end to end.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const {admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embedding=req('@aikdna/kdna-read/embedding');
const {collectExpansionHandles,resolveExpansionHandle}=require('../src/expansion-handles.js');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const control=embedding.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));

function memberGraph(asset){
  asset.payload.relationships.push(
    {id:'rel-support-qb',kind:{term:'support'},direction:'directed',
     participants:[{judgment_ref:'qB',role:{term:'supporter'}},{judgment_ref:'qA',role:{term:'claim'}}],
     operator:{term:'supports'},effect:{term:'offers_support'},statement:'handle resolution: qB supports qA.'},
    {id:'rel-conflict-qc',kind:{term:'conflict'},direction:'undirected',
     participants:[{judgment_ref:'qA',role:{term:'side_a'}},{judgment_ref:'qC',role:{term:'side_b'}}],
     operator:{term:'conflicts_with'},effect:{term:'preserves_disagreement'},statement:'handle resolution: qA conflicts with qC.'});
}
async function readWithMembers(){
  const asset=F.asset(tuple,'complex');memberGraph(asset);
  const admitted=admitBrowser(F.encode(asset,req,{deflate:true}));
  assert.equal(admitted.status,'accepted');
  let calls=0;
  const host=embedding.createTrustedHostReadProvider({observe:({request,snapshot})=>{calls++;const view=inspectSnapshot(snapshot);
    return {host_id:'host:resolution',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,
      snapshot_id:view.snapshot_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:view.ir.nodes.map(n=>n.id),
      issued_at:1000,expires_at:1900,current_ms:1000,decision:'allow',policy_id:'policy:resolution'};}});
  const result=await readBrowser(admitted.snapshot,F.candidate(tuple,asset,'exact_selection','qA',8000000),control,host);
  assert.equal(result.envelope.status,'ready');
  return {asset,admitted,host,result};
}
test('a kept answer resolves its own handles and refuses every misuse explicitly',async()=>{
  const {result}=await readWithMembers();
  const handles=collectExpansionHandles(result);
  const issued=result.envelope.content.expansion_handles.map(h=>h.handle_id);
  assert.ok(issued.length>=2,'the fixture issues one handle per folded member plus any existing deferral');
  const first=issued[0],handle=handles.get(first);
  const ok=resolveExpansionHandle(handles,first,{current_ms:1000,snapshot_id:handle.snapshot_id,asset_id:handle.asset?.asset_id??handle.asset_id,asset_version:handle.asset?.asset_version??handle.asset_version});
  assert.equal(ok.status,'ready');
  assert.deepEqual(ok.handle,handle,'the resolution hands back the issued handle');
  assert.notEqual(ok.handle,handles.get(first),'the resolution copies rather than aliases');
  assert.ok(Object.isFrozen(ok.handle));
  const unknown=resolveExpansionHandle(handles,'handle:nothing-issued-this');
  assert.equal(unknown.status,'unavailable');
  assert.equal(unknown.code,'READ_HANDLE_UNKNOWN');
  assert.ok(unknown.guidance.action.length>0);
  const foreign=resolveExpansionHandle(handles,first,{asset_id:'asset:elsewhere',asset_version:'1.0.0'});
  assert.equal(foreign.code,'READ_HANDLE_ASSET_MISMATCH');
  const stale=resolveExpansionHandle(handles,first,{snapshot_id:'section-snapshot:another'});
  assert.equal(stale.code,'READ_HANDLE_STALE');
  const expired=resolveExpansionHandle(handles,first,{current_ms:handle.expires_at});
  assert.equal(expired.code,'READ_HANDLE_EXPIRED');
  // Collecting twice keeps the first issue per id and tolerates non-answers.
  const again=collectExpansionHandles(result,handles);
  assert.equal(again.get(first),handle);
  assert.equal(collectExpansionHandles({envelope:{content:{}}}).size,0);
  assert.equal(collectExpansionHandles(null).size,0);
});
test('the retained handle shape resolves on its nested origin snapshot',async()=>{
  // The retained route issues handles with `origin` holding the snapshot and no
  // top-level snapshot_id; the flat R2 handles carry it at the top. A correct
  // snapshot from either shape resolves; a stale one is refused either way.
  const collected=new Map();
  const retainedShape={
    binding_kind:'retained_section_snapshot',handle_id:'retained-handle:fixture-retained',
    asset:{asset_id:'asset:retained-fixture',asset_version:'1.0.0',judgment_version:'1.0.0'},
    tuple:tuple,
    origin:{snapshot_id:'section-snapshot:retained-fixture',kind:'whole',capture_id:'capture:fixture',
      admission_request_digest:'sha256:'+'1'.repeat(64),verification_digest:'sha256:'+'2'.repeat(64),
      checked_sections_digest:'sha256:'+'3'.repeat(64)},
    anchor:{kind:'asset'},target:{kind:'judgment',id:'qA'},scope:['judgment:fixture'],
    issued_at:1000,expires_at:1900,host_id:'host:fixture',host_epoch:'epoch:1',
  };
  collectExpansionHandles({envelope:{content:{expansion_handles:[retainedShape]}}},collected);
  const ok=resolveExpansionHandle(collected,retainedShape.handle_id,
    {current_ms:1000,snapshot_id:'section-snapshot:retained-fixture',asset_id:'asset:retained-fixture',asset_version:'1.0.0'});
  assert.equal(ok.status,'ready','a retained-shape handle resolves against its origin snapshot');
  const stale=resolveExpansionHandle(collected,retainedShape.handle_id,{snapshot_id:'section-snapshot:elsewhere'});
  assert.equal(stale.code,'READ_HANDLE_STALE','a different snapshot is still refused');
  const expired=resolveExpansionHandle(collected,retainedShape.handle_id,{current_ms:retainedShape.expires_at});
  assert.equal(expired.code,'READ_HANDLE_EXPIRED');
  const foreign=resolveExpansionHandle(collected,retainedShape.handle_id,{asset_id:'asset:elsewhere',asset_version:'1.0.0'});
  assert.equal(foreign.code,'READ_HANDLE_ASSET_MISMATCH');
});
test('a resolved handle expands through the reader, which still checks it fully',async()=>{
  const {asset,admitted,host,result}=await readWithMembers();
  const handles=collectExpansionHandles(result);
  const handle=result.envelope.content.expansion_handles.find(h=>h.anchor&&h.target&&h.target.kind==='judgment'&&h.target.id==='qC');
  assert.ok(handle,'the folded member qC has its handle');
  const resolved=resolveExpansionHandle(handles,handle.handle_id,{current_ms:1000});
  assert.equal(resolved.status,'ready');
  const expandRequest={...F.candidate(tuple,asset,'whole_asset','x',8000000),mode:'expand',selection:result.envelope.content.selected,handle:resolved.handle};
  // The resolved object is the issued handle itself, so admission accepts it
  // exactly as if the client had echoed the full object.
  const reply=await readBrowser(admitted.snapshot,expandRequest,control,host);
  assert.equal(reply.envelope.status,'ready');
  assert.ok(reply.envelope.content.closure.some(e=>e.target.id==='qC'),'the expansion returns the member');
});
