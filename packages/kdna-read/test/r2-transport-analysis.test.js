'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),http=require('node:http'),crypto=require('node:crypto'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const {req,coreDir,readDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embed=req('@aikdna/kdna-read/embedding');
const {admitReadTransportResponse}=req('@aikdna/kdna-read/transport'),analysis=req('@aikdna/kdna-read/analysis');
const {jcs}=require(path.join(readDir,'src/util.js'));
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
async function fixture(mode){
 const asset=F.asset(tuple,'complex'),a=admitBrowser(F.encode(asset,req));assert.equal(a.status,'accepted');const view=inspectSnapshot(a.snapshot);
 const control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
 const host=embed.createTrustedHostReadProvider({observe({request}){const now=Date.now();return {host_id:'host:r2-transport',host_epoch:'epoch:r2',decision_id:'decision:r2',request_id:request.request_id,snapshot_id:view.snapshot_id,A:view.digests.A.observed,C:view.digests.C.observed,scope:view.ir.nodes.map(n=>n.id),issued_at:now-1000,expires_at:now+60000,current_ms:now,decision:'allow',policy_id:'policy:r2'};}});
 let request=F.candidate(tuple,asset,mode==='expand'?'whole_asset':mode,asset.payload.judgments[0].id,1000000);
 request.request_id='request:'+crypto.randomUUID();let output=await readBrowser(a.snapshot,request,control,host);assert.equal(output.envelope.status,'ready');
 if(mode==='expand'){
  const descriptor=output.envelope.content.asset_index.find(x=>x.target.kind==='example'&&x.target.id==='e0');
  const handle=output.envelope.content.expansion_handles.find(x=>x.handle_id===descriptor.handle_id);
  request={...request,mode,handle};output=await readBrowser(a.snapshot,request,control,host);assert.equal(output.envelope.status,'ready');
 }
 return {asset,request,output,view};
}
async function exchange(mode,change=()=>{}){
 const f=await fixture(mode),body=JSON.parse(JSON.stringify(f.output.envelope));change(body);
 body.budget.actual_bytes='0000000000000000';body.budget.required_bytes='0000000000000000';
 const count=String(Buffer.byteLength(jcs(body))).padStart(16,'0');body.budget.actual_bytes=count;body.budget.required_bytes=count;
 const wire=jcs(body);assert.equal(Buffer.byteLength(wire),Number(count));
 const server=http.createServer(async(i,o)=>{const chunks=[];for await(const chunk of i)chunks.push(chunk);assert.equal(Buffer.concat(chunks).toString(),JSON.stringify(f.request));o.writeHead(200,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(wire),'x-kdna-channel':'read_envelope'});o.end(wire);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/read',now=Date.now();
 const context={association_id:'association:'+crypto.randomUUID(),endpoint_id:'endpoint:r2',session_id:'session:r2',endpoint_url:url,issued_at_ms:now-1,expires_at_ms:now+60000,outbound_request_json:JSON.stringify(f.request),correlation:{state:'validated',request_id:f.request.request_id},expected_tuple:tuple,expected_asset:f.view.asset,expected_digests:Object.fromEntries(['A','C','E'].map(k=>[k,f.view.digests[k].observed])),expected_snapshot_id:f.view.snapshot_id,max_response_bytes:1000000,max_read_ms:10000,admission_response_limit_bytes:4096};
 try{return await admitReadTransportResponse(await fetch(url,{method:'POST',body:JSON.stringify(f.request)}),context);}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
for(const mode of ['catalog','whole_asset','exact_selection','expand'])test('R2 '+mode+' survives public HTTP transport admission without gaining capabilities',async()=>{
 const got=await exchange(mode);assert.equal(got.status,'accepted',JSON.stringify(got));assert.equal(got.contract,'kdna.read-transport-admission/0.2.1');assert.ok(Object.values(got.capabilities).every(v=>v===false));
});
for(const [name,mode,edit] of [
 ['catalog focus mismatch','exact_selection',b=>{b.content.catalog[0].focus='Forged question';}],
 ['asset index target mismatch','whole_asset',b=>{b.content.asset_index[0].target={kind:'material',id:'unknown'};}],
 ['asset handle anchor mismatch','whole_asset',b=>{b.content.expansion_handles[0].anchor={kind:'judgment',selection:{asset_id:b.asset.asset_id,asset_version:b.asset.asset_version,judgment_id:'qA'}};}]
])test('R2 transport rejects '+name,async()=>{const got=await exchange(mode,edit);assert.equal(got.status,'rejected',JSON.stringify(got));assert.equal(got.rejection.code,'READ_TRANSPORT_BINDING_MISMATCH');assert.equal(got.response,null);});
test('R2 analysis preserves full focus and typed source identity and compares genuine selected data',async()=>{
 const f=await fixture('exact_selection'),envelope=f.output.envelope;
 const summary=analysis.summarizeRead(envelope);assert.equal(summary.status,'summarized');assert.equal(summary.judgments.find(j=>j.judgment_id==='qA').question,f.asset.payload.judgments[0].focus);
 const equal=analysis.compareReadSelections(envelope,envelope);assert.equal(equal.domain_content.changed,false);assert.equal(equal.metadata.changed,false);assert.equal(equal.authority.action_authorization,'not_evaluated');
 const changed=JSON.parse(JSON.stringify(envelope));const node=changed.content.closure.find(n=>n.target.kind==='judgment'&&n.target.id==='qA');node.value.focus='A different full authored question?';changed.content.catalog.find(n=>n.judgment_id==='qA').focus=node.value.focus;
 const comparison=analysis.compareReadSelections(envelope,changed);assert.equal(comparison.domain_content.changed,true);assert.equal(comparison.metadata.changed,true);
});
