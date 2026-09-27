'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {bindDependencyPorts}=require('./r2-test-model.js');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {admitBytes}=req('@aikdna/kdna-core'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {admitReadRequest,project}=req('@aikdna/kdna-read'),{readBrowser}=req('@aikdna/kdna-read/browser'),{createTrustedReadControlProvider,createTrustedHostReadProvider}=req('@aikdna/kdna-read/embedding');
function projectAsset(a,mode='exact_selection'){
 const core=admitBytes(F.encode(bindDependencyPorts(a),req));assert.equal(core.status,'accepted',JSON.stringify(core));
 const admitted=admitReadRequest(F.candidate(tuple,a,mode),createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000})));
 const result=project(admitted.admitted_request,core.snapshot);assert.equal(result.status,'projected',JSON.stringify(result));return {body:result.body,ir:inspectSnapshot(core.snapshot).ir};
}
for(const kind of ['dependency','relationship','replacement'])test('provided mandatory '+kind+' body is never also an omission',()=>{
 const a=F.blank(tuple,3);
 if(kind==='dependency')a.payload.dependencies=[{id:'d:1',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'support',data_type:{term:'text',vocabulary:'core'},required:true,purpose:'Mandatory support'}];
 if(kind==='relationship')a.payload.relationships=[{id:'r:1',statement:'Explicit contrast relation.',kind:{term:'conflict',vocabulary:'core'},operator:{term:'conflicts_with',vocabulary:'core'},effect:{term:'preserves_disagreement',vocabulary:'core'},direction:'undirected',participants:[{judgment_ref:'j:0',role:{term:'side_a',vocabulary:'core'}},{judgment_ref:'j:1',role:{term:'side_b',vocabulary:'core'}}]}];
 if(kind==='replacement')a.payload.judgments[0].lifecycle={status:'superseded',superseded_by:[{asset:a.payload.asset,judgment_id:'j:1'}],statement:'Use the named replacement.'};
 const {body,ir}=projectAsset(a),provided=body.content.closure.filter(n=>n.role==='judgment').map(n=>n.value.id);
 assert.deepEqual(provided,['j:0','j:1']);assert.deepEqual(body.content.catalog.map(n=>n.judgment_id),['j:0','j:1']);
 // R2 selected_discovery: unrelated j:2 is neither disclosed nor counted.
 assert.equal(body.omissions.some(o=>o.field==='judgment'),false);
 assert.equal(JSON.stringify(body).includes(ir.catalog.find(c=>c.judgment_id==='j:2').node_ref),false);
});
test('whole asset and catalog still omit all unrequested bodies with exact count',async()=>{
 for(const mode of ['whole_asset','catalog']){
  const a=F.blank(tuple,3),admitted=admitBytes(F.encode(a,req));assert.equal(admitted.status,'accepted');
  const candidate=F.candidate(tuple,a,mode),control=createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
  const pure=project(admitReadRequest(candidate,control).admitted_request,admitted.snapshot);
  // whole_asset has deferred descriptors; only an actual Host can mint handles.
  if(mode==='whole_asset'){assert.equal(pure.status,'rejected');assert.equal(pure.diagnostics[0].code,'READ_HOST_CONTEXT_UNTRUSTED');}
  else assert.equal(pure.status,'projected');
  const host=createTrustedHostReadProvider({observe:({request,snapshot})=>{const v=inspectSnapshot(snapshot);return {host_id:'host:omissions',host_epoch:'epoch:1',decision_id:'decision:1',request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:900,expires_at:2000,current_ms:1000,decision:'allow',policy_id:'policy:omissions'};}});
  const result=await readBrowser(admitted.snapshot,candidate,control,host);assert.equal(result.envelope.status,'ready');const body=result.envelope;
  assert.equal(body.content.closure.filter(n=>n.role==='judgment').length,0);const rows=body.omissions.filter(o=>o.field==='judgment');assert.equal(rows.reduce((n,o)=>n+(o.count??1),0),3);
  assert.ok(rows.every(o=>o.reason===(mode==='catalog'?'not_in_mode':'not_requested')));
 }
});
