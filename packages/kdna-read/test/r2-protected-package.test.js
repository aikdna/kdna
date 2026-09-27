'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const H=require('../../kdna-core/test/protection-test-helpers.js');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const core=req('@aikdna/kdna-core'),P=req('@aikdna/kdna-core/package-set-node'),E=req('@aikdna/kdna-core/execution');
const R=req('@aikdna/kdna-read/package-set-node'),boundary=req('@aikdna/kdna-core/read-boundary');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
const request=(a,mode='exact_selection')=>F.candidate(tuple,a,mode,a.payload.judgments[0].id,8000000);
function compareJudgment(body,authored){
 const node=body.closure.find(n=>n.target.kind==='judgment'&&n.target.id===authored.id);assert.ok(node);
 for(const key of ['focus','form','answer_kind','core_expression','result','formation_rule'])assert.deepEqual(node.value[key],authored[key],key);
 assert.deepEqual(node.value.method,authored.method);
 for(const c of authored.method.components)assert.ok(body.closure.some(n=>n.target.kind==='component'&&n.target.id===c.id));
}
for(const kind of ['local','external'])test('R2 '+kind+' protected read preserves authored semantics through one real transport commit',async()=>{
 const asset=F.asset(tuple,'complex'),f=await H[kind]({asset}),observe=H.observer(f);let committed,token,calls=0,wire;
 const host=H.read.createTrustedProtectedHostReadProvider({observe,async deliver(result,prepared){
  token=prepared;committed=await H.read.commitProtectedTransport(f.operation,prepared,{observeScope:observe,commit(value){calls++;wire=JSON.stringify(value);return true;}});return true;
 }});
 const got=await H.read.readProtectedNode(f.operation,request(asset),H.control(),host);
 assert.equal(got.status,'read_result',JSON.stringify(got));assert.equal(got.result.envelope.status,'ready',JSON.stringify(got));
 assert.equal(committed.status,'committed',JSON.stringify(committed));assert.equal(calls,1);assert.deepEqual(JSON.parse(wire),got.result);
 compareJudgment(got.result.envelope.content,asset.payload.judgments[0]);
 assert.equal(got.disclosure.external_commit.state,'confirmed');
 const repeated=await H.read.commitProtectedTransport(f.operation,token,{observeScope:observe,commit(){calls++;return true;}});
 assert.equal(repeated.status,'delivery_failed');assert.equal(calls,1);
 H.core.disposeProtectionOperation(f.operation);
});
test('R2 protected catalog and index denial refuse all content and invoke no delivery',async()=>{
 const asset=F.asset(tuple,'complex'),f=await H.local({asset});
 for(const [mode,kind,id] of [['catalog','judgment','qB'],['whole_asset','material','d0']]){
  let calls=0;
  const observe=H.observer(f,(ids,v)=>ids.filter(id0=>!v.ir.nodes.some(n=>n.id===id0&&n.target.kind===kind&&n.target.id===id)));
  const host=H.read.createTrustedProtectedHostReadProvider({observe,deliver(){calls++;return true;}});
  const got=await H.read.readProtectedNode(f.operation,request(asset,mode),H.control(),host);
  assert.equal(got.status,'read_result');assert.equal(got.result.envelope.status,'rejected');assert.equal(got.result.envelope.content,null);assert.equal(got.result.envelope.asset,null);assert.equal(calls,0);
 }
 H.core.disposeProtectionOperation(f.operation);
});
test('R2 scope withdrawal at protected commit rejects complete asset index and sends zero bytes',async()=>{
 const asset=F.asset(tuple,'complex'),f=await H.local({asset}),observe=H.observer(f);let calls=0,committed;
 const restricted=H.observer(f,(ids,v)=>ids.filter(id=>!v.ir.nodes.some(n=>n.id===id&&n.target.kind==='material'&&n.target.id==='d0')));
 const host=H.read.createTrustedProtectedHostReadProvider({observe,async deliver(result,token){committed=await H.read.commitProtectedTransport(f.operation,token,{observeScope:restricted,commit(){calls++;return true;}});return true;}});
 const got=await H.read.readProtectedNode(f.operation,request(asset,'whole_asset'),H.control(),host);
 assert.equal(got.status,'delivery_failed');assert.equal(committed.status,'delivery_failed');assert.equal(got.body,null);assert.equal(got.body_bytes,0);assert.equal(calls,0);
 H.core.disposeProtectionOperation(f.operation);
});
test('R2 unknown critical declaration cannot enter protected catalog fallback',async()=>{
 const asset=F.asset(tuple);asset.payload.extensions=[{id:'urn:r2:unknown',critical:true,definition:'Unknown semantics',value:{kind:'text',value:'opaque'}}];
 const got=await H.core.admitProtectedNode(F.encode(asset,req),{credential:{kind:'none'},signaturePolicy:H.policy},{kind:'local',clock:()=>1000});
 assert.equal(got.status,'core_rejected',JSON.stringify(got));assert.equal(got.core.diagnostics[0].code,'READ_UNSUPPORTED_CRITICAL');assert.equal(got.operation,undefined);assert.equal(got.snapshot,undefined);
});
function member(name,id){
 const asset=F.asset(tuple,name);asset.manifest.asset_id=id;asset.payload.asset.asset_id=id;
 const bytes=F.encode(asset,req),admitted=core.admitBytes(bytes);assert.equal(admitted.status,'accepted',JSON.stringify(admitted));
 const view=boundary.inspectSnapshot(admitted.snapshot);
 return {asset,bytes,snapshot:admitted.snapshot,view,record:{member_id:'member:'+id,asset_id:id,asset_version:view.asset.asset_version,A:view.digests.A.observed}};
}
async function packageRead(){
 const selected=member('complex','asset:selected'),other=member('simple','asset:other'),members=[selected,other];
 const host_id='host:r2-package',host_epoch='epoch:r2-package';
 const selection={asset_id:selected.view.asset.asset_id,asset_version:selected.view.asset.asset_version,judgment_id:selected.asset.payload.judgments[0].id};
 const set={set_id:'set:r2',members:members.map(m=>m.record),selection};let sinkCount=0;
 const provider=P.createTrustedPackageSetMemberProvider({host_id,host_epoch,observe(){return {decisions:members.map(m=>({...m.record,decision:'allow',decision_id:'decision:'+m.record.member_id,host_id,host_epoch,issued_at:900,expires_at:2000,current_ms:1000}))};}});
 const readProvider=R.createTrustedPackageReadProvider({host_id,host_epoch,members:provider,observeRead({snapshot,request}){const v=boundary.inspectSnapshot(snapshot);return {host_id,host_epoch,decision_id:'decision:read',request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:900,expires_at:2000,current_ms:1000,decision:'allow',policy_id:'policy:r2'};},sink(){sinkCount++;return true;}});
 const outcome=await R.readPackageSetNode({set,tuple,members:members.map(m=>({member_id:m.record.member_id,bytes:m.bytes})),operation:'isolated_read',limits:{maxMembers:10,maxTotalSourceBytes:10485760},request:request(selected.asset)},H.control(),readProvider);
 return {selected,set,outcome,sinkCount};
}
test('R2 PackageSet retains full semantics and binds handoff to actual 0.3 Plan and delivered Read',async()=>{
 const {selected,set,outcome,sinkCount}=await packageRead();assert.equal(outcome.local_failure,null,JSON.stringify(outcome));assert.equal(outcome.decision.status,'allowed');assert.equal(outcome.readResult.envelope.status,'ready',JSON.stringify(outcome));assert.equal(sinkCount,1);assert.equal(outcome.sink_confirmed,true);
 compareJudgment(outcome.readResult.envelope.content,selected.asset.payload.judgments[0]);
 const plan=E.createConsumptionPlan(selected.snapshot,{plan_id:'plan:r2',intent:{task:'Inspect R2 handoff.',use:'reasoning_support'},selection:set.selection,budget:{capsule_bytes:8000000,output_bytes:1000,response_bytes:8000000,trace_events:10}});
 assert.equal(plan.status,'admitted',JSON.stringify(plan));
 const sealed=R.sealPackageSetHandoff(outcome.delivered,plan.plan);assert.equal(sealed.status,'valid',JSON.stringify(sealed));assert.equal(sealed.value.contract,'kdna.package-set-handoff/0.2.1');assert.deepEqual(sealed.value.tuple,tuple);assert.equal(sealed.proof,'claims_not_authenticated');
 for(const wire of [{...sealed.value,contract:'kdna.package-set-handoff/0.1.0'},{...sealed.value,tuple:{...tuple,read:'kdna.read/0.5.0'}},{...sealed.value,closure_digest:'sha256:'+'0'.repeat(64)}])assert.equal(R.admitPackageSetHandoff(wire,outcome.delivered,plan.plan).status,'rejected');
 assert.equal(R.sealPackageSetHandoff({...outcome.delivered},plan.plan).status,'rejected');
});
test('R2 protection and PackageSet descriptors pin the exact installed combination',()=>{
 const p=H.core.getProtectionContract();assert.equal(p.implementation.version,req('@aikdna/kdna-core/package.json').version);
 const c=R.getPackageReadContract();assert.equal(c.descriptor.contract,'kdna.package-set-node/0.2.1');assert.equal(c.descriptor.core_version,req('@aikdna/kdna-core/package.json').version);assert.equal(c.descriptor.read_version,req('@aikdna/kdna-read/package.json').version);
});
