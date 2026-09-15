'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const runtime=process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'),{req,coreDir}=F.runtime(runtime);
const {readNode}=req('@aikdna/kdna-read/node'),embed=req('@aikdna/kdna-read/embedding'),tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const {hosts}=require('../src/brands.js');

// A long-lived host keeps one handle registry across reads. Expired handles must stop accumulating:
// after a read whose window has passed, the registry should not still hold the older handle. Expiry is
// enforced by the host gate on use regardless, so this bounds the registry without changing authority.
test('a long-lived host registry does not accumulate expired expansion handles',async()=>{
 const {admitBrowser}=req('@aikdna/kdna-core/browser'),{readBrowser}=req('@aikdna/kdna-read/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary'),asset=F.blank(tuple,2);
 asset.payload.dependencies=[{id:'dependency:optional',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'context',data_type:{term:'text'},required:false,purpose:'Optional support'}];
 const bytes=F.encode(asset,req,{deflate:true}),admitted=admitBrowser(bytes);assert.equal(admitted.status,'accepted');
 const WINDOW=1000,READS=50;let calls=0;
 const host=embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{calls++;const v=inspectSnapshot(snapshot),current_ms=WINDOW*calls;
  return {host_id:'host:test',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:current_ms-WINDOW,expires_at:current_ms+WINDOW,current_ms,decision:'allow',policy_id:'policy:test'};}}),
  control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000})),request=F.candidate(tuple,asset);
 let lastSelected=null;
 for(let i=0;i<READS;i++){
  lastSelected=await readBrowser(admitted.snapshot,request,control,host);
  assert.equal(lastSelected.envelope.status,'ready');
  assert.ok(lastSelected.envelope.content.expansion_handles.length>0,'fixture must expose an expansion handle');
 }
 const registered=hosts.get(host).handles;
 // The host observe callback runs once for admission and once for the delivered read.
 assert.equal(calls,READS*2);
 assert.ok(registered.size>0,'the most recent handles must remain registered');
 // Only handles that are still live for the latest read may remain; the previously expired ones must be gone.
 const latestIssued=lastSelected.envelope.content.expansion_handles[0].issued_at;
 assert.ok(registered.size<READS,'expired handles accumulated instead of being reclaimed');
 assert.ok(registered.size<=lastSelected.envelope.content.expansion_handles.length,
  'the registry may hold at most the handles of the latest read');
 for(const handle of registered.values())assert.ok(handle.expires_at>latestIssued,'an expired handle was left registered');
});

test('an expired handle is still rejected even though the registry is pruned',async()=>{
 const {admitBrowser}=req('@aikdna/kdna-core/browser'),{readBrowser}=req('@aikdna/kdna-read/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary'),asset=F.blank(tuple,2);
 asset.payload.dependencies=[{id:'dependency:optional',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'context',data_type:{term:'text'},required:false,purpose:'Optional support'}];
 const bytes=F.encode(asset,req,{deflate:true}),admitted=admitBrowser(bytes);assert.equal(admitted.status,'accepted');
 let calls=0,current=1000;
 const host=embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{calls++;const v=inspectSnapshot(snapshot);return {host_id:'host:test',host_epoch:'epoch:1',decision_id:'decision:'+calls,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:current-900,expires_at:current+100,current_ms:current,decision:'allow',policy_id:'policy:test'};}}),
  control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000})),request=F.candidate(tuple,asset);
 const first=await readBrowser(admitted.snapshot,request,control,host);assert.equal(first.envelope.status,'ready');
 const handle=first.envelope.content.expansion_handles[0];assert.ok(handle);
 // Advance the host clock past the issued handle's expiry, then attempt to expand with it.
 current=handle.expires_at+1;
 const second=await readBrowser(admitted.snapshot,request,control,host);
 assert.equal(second.envelope.status,'ready');
 const expired=await readBrowser(admitted.snapshot,{...request,mode:'expand',handle},control,host);
 assert.equal(expired.envelope.content,null);
 // Whether the gate reports the handle as expired or as untrusted (once it has been reclaimed), the
 // outcome that matters is that a handle past its window can no longer be used.
 assert.ok(/READ_HANDLE_(EXPIRED|UNTRUSTED)/.test(expired.envelope.diagnostics[0].code),expired.envelope.diagnostics[0].code);
});
