'use strict';
const test=require('node:test');const H=require('./protection-test-helpers.js');const {assert,core,local,req,boundary}=H;
test('opaque binding/checkpoint rejects JSON and other operations; fresh observation invalidates old checkpoint',async()=>{
 const a=await local(),b=await local(),one=core.bindProtectionOperation(a.operation).binding,two=core.bindProtectionOperation(b.operation).binding,first=await one.observe('projection');
 assert.equal(one.assertCurrent({}).status,'protection_failed');assert.equal(two.assertCurrent(first.checkpoint).status,'protection_failed');
 await one.observe('projection');assert.equal(one.assertCurrent(first.checkpoint).diagnostic.code,'PROTECTION_STATE_ROLLBACK');core.disposeProtectionOperation(a.operation);core.disposeProtectionOperation(a.operation);assert.equal(one.source().diagnostic.code,'PROTECTION_OPERATION_DISPOSED');assert.equal(boundary.isProtectedSnapshot(a.snapshot),true);
});
test('pure Plan Capsule request guards keep private source disposal without calling provider clock',async()=>{
 let clocks=0;const f=await local({clock(){clocks++;return 1000;}}),E=req('@aikdna/kdna-core/execution'),before=clocks,selection=f.snapshot.ir.mandatory_closures[0].selection;
 const planned=E.createConsumptionPlan(f.snapshot,{plan_id:'plan:protected',intent:{task:'Use this explicit selection.',use:'reasoning_support'},selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:100000,trace_events:6}});assert.equal(planned.status,'admitted');
 const built=E.createRuntimeCapsule(f.snapshot,planned.plan);assert.equal(built.status,'admitted');
 const asked=E.createAgentHostRequest(planned.plan,built.capsule,{request_id:'request:test',run_id:'run:test',host_id:'host:test',host_epoch:'epoch:test'});assert.equal(asked.status,'admitted');assert.equal(clocks,before);
 core.disposeProtectionOperation(f.operation);assert.equal(E.inspectAdmittedPlan(planned.plan),null);assert.equal(E.inspectRuntimeCapsule(built.capsule),null);assert.equal(E.inspectAgentHostRequest(asked.request),null);assert.equal(E.createRuntimeCapsule(f.snapshot,planned.plan).code,'EXECUTION_SOURCE_UNATTESTED');assert.equal(clocks,before);
});
for(const phase of ['assert','observe'])for(const fault of ['throw','invalid','rollback','dispose'])test('current invocation '+phase+' '+fault+' samples observation without granting authority',async()=>{
 let armed=false,operation,calls=0;const f=await local({clock(){calls++;if(!armed)return 1000;if(fault==='throw')throw Error('clock');if(fault==='dispose')core.disposeProtectionOperation(operation);return fault==='invalid'?NaN:fault==='rollback'?999:1001;}});operation=f.operation;
 const binding=core.bindProtectionOperation(operation).binding,observed=await binding.observe('projection');armed=true;
 const got=phase==='assert'?binding.assertCurrent(observed.checkpoint):await binding.observe('projection');assert.equal(got.status,'protection_failed');assert.equal(got.checked_at_ms,fault==='dispose'?1001:null);assert.deepEqual(Object.keys(got).sort(),['checked_at_ms','diagnostic','status']);
 const before=calls,invalid=binding.assertCurrent({});assert.equal(invalid.checked_at_ms,null);assert.equal(calls,before);
});
test('external observation and assertion retain actual expiry sample; uncalled stale checkpoint carries null',async()=>{
 const f=await H.external(),binding=core.bindProtectionOperation(f.operation).binding,observed=await binding.observe('projection');
 assert.equal(binding.assertCurrent(observed.checkpoint).receipt.checked_at_ms,1000);f.state.now=2000;
 for(const got of [binding.assertCurrent(observed.checkpoint),await binding.observe('projection')]){assert.equal(got.diagnostic.code,'PROTECTION_AUTHORIZATION_EXPIRED');assert.equal(got.checked_at_ms,2000);}
 const invalid=await binding.observe('unrecognized');assert.equal(invalid.checked_at_ms,null);
});
