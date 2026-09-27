'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const N=require('./native-binding-test-model.js'),{F}=N;
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const C=req('@aikdna/kdna-core'),Node=req('@aikdna/kdna-core/node'),Browser=req('@aikdna/kdna-core/browser'),B=req('@aikdna/kdna-core/read-boundary'),E=req('@aikdna/kdna-core/execution');
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {digest}=require(path.join(coreDir,'src/public-contract/digests.js'));
function check(a,entries={},expected='accepted'){const bytes=F.encode(a,req,{entries}),result=C.admitBytes(bytes);assert.equal(result.status,expected,JSON.stringify(result));if(expected==='accepted')return {bytes,snapshot:result.snapshot,view:B.inspectSnapshot(result.snapshot)};assert.equal(result.snapshot,undefined);return result;}
for(const kind of N.KINDS)test('native binding exact local '+kind+' supports valid target and rejects missing/wrong kind',async()=>{
 const {a,targets,entries}=N.allKinds(tuple,digest),j=a.payload.judgments[0];j.method.bindings=[{component_ref:'component:0',role:'literal authored role / '+kind,target:{kind,id:targets[kind]}}];
 const x=check(a,entries),node=x.view.ir.nodes.find(n=>n.target.kind==='judgment'&&n.target.id===j.id);
 assert.deepEqual(node.value.method.bindings,j.method.bindings);
 const component=x.view.ir.nodes.find(n=>n.target.kind==='component'&&n.target.id==='component:0'),target=x.view.ir.nodes.find(n=>n.target.kind===kind&&n.target.id===targets[kind]);
 const closure=x.view.ir.mandatory_closures[0];assert.ok(closure.node_ids.includes(target.id));
 assert.ok(x.view.ir.references.some(edge=>edge.source_node===component.id&&edge.target_node===target.id&&edge.mandatory===true));
 const nodeEntry=await Node.admitNode(x.bytes),browserEntry=Browser.admitBrowser(x.bytes);assert.equal(nodeEntry.status,'accepted');assert.equal(browserEntry.status,'accepted');assert.deepEqual(B.inspectSnapshot(nodeEntry.snapshot).ir,x.view.ir);assert.deepEqual(B.inspectSnapshot(browserEntry.snapshot).ir,x.view.ir);
 assert.ok(x.view.ir.expansion_targets.some(t=>t.target.kind==='component'&&t.target.id==='component:0'&&t.scope.includes(target.id)),JSON.stringify(x.view.ir.expansion_targets));
 j.method.bindings[0].target.id='absent:'+kind;check(a,entries,'rejected');
 j.method.bindings[0].target={kind:kind==='actor'?'misuse':'actor',id:targets[kind]};check(a,entries,'rejected');
});
test('native ECR02 component -> exception -> boundary -> actor/condition closure deduplicates without adjacent question bodies',async()=>{
 const a=N.recursion(tuple),j=a.payload.judgments[0];
 const without=structuredClone(a);without.payload.judgments[0].method.bindings=[];
 const unbound=check(without),bareIds=unbound.view.ir.mandatory_closures[0].node_ids;
 for(const kind of ['exception','condition','boundary','actor'])assert.ok(!unbound.view.ir.nodes.some(n=>bareIds.includes(n.id)&&n.target.kind===kind),kind+' is absent without native binding');
 assert.deepEqual(a.payload.exceptions[0].applies_to,{kind:'judgments',judgment_refs:['j:2']});
 j.method.bindings.push({...j.method.bindings[0],role:'second-distinct-authored-role'});
 const x=check(a),closure=x.view.ir.mandatory_closures[0],nodes=x.view.ir.nodes.filter(n=>closure.node_ids.includes(n.id));
 for(const kind of ['exception','condition','boundary','actor'])assert.equal(nodes.filter(n=>n.target.kind===kind).length,1,kind);
 assert.deepEqual(nodes.filter(n=>n.target.kind==='judgment').map(n=>n.target.id),['j:0']);assert.equal(new Set(closure.node_ids).size,closure.node_ids.length);
 const node=await Node.admitNode(x.bytes),browser=Browser.admitBrowser(x.bytes);assert.equal(node.status,'accepted');assert.equal(browser.status,'accepted');assert.deepEqual(B.inspectSnapshot(node.snapshot).ir,x.view.ir);assert.deepEqual(B.inspectSnapshot(browser.snapshot).ir,x.view.ir);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kdna-native-test-'));try{const file=path.join(dir,'native.kdna');fs.writeFileSync(file,x.bytes);const fromPath=await Node.admitNode(file);assert.equal(fromPath.status,'accepted');assert.deepEqual(B.inspectSnapshot(fromPath.snapshot).ir,x.view.ir);}finally{fs.rmSync(dir,{recursive:true,force:true});}
 const p=E.createConsumptionPlan(x.snapshot,{plan_id:'native:plan',intent:{task:'Static support check.',use:'reasoning_support'},selection:closure.selection,budget:{capsule_bytes:1000000,output_bytes:1000,response_bytes:1000000,trace_events:10}});assert.equal(p.status,'admitted',JSON.stringify(p));const c=E.createRuntimeCapsule(x.snapshot,p.plan);assert.equal(c.status,'admitted',JSON.stringify(c));const wire=E.inspectRuntimeCapsule(c.capsule);for(const kind of ['exception','condition','boundary','actor'])assert.ok(wire.closure.some(n=>n.target.kind===kind));assert.equal(E.inspectAdmittedPlan(p.plan).closure_digest,E.executionDigest(wire.closure).digest);
});
for(const [name,mutate] of [
 ['both targets',b=>b.target_ref='j:0'],['neither target',b=>delete b.target],['extra key',b=>b.invented=true],
 ['external asset',b=>b.target.asset={asset_id:'other',asset_version:'1',judgment_version:'1'}],['explicit current asset', (b,a)=>b.target.asset=a.payload.asset],
 ...['asset','result','condition','plan','plan_node','policy','revision','unit','shared_declaration','example','example_result','candidate','branch_entry'].map(kind=>['excluded kind '+kind,b=>b.target.kind=kind]),
 ['foreign component',b=>b.component_ref='component:1'],['unopted profile own target',b=>{delete b.target;b.target_ref='j:0';}],['untyped support target',b=>{delete b.target;b.target_ref='exception';}]
])test('native valid control then rejects '+name,()=>{const a=N.recursion(tuple);check(a);mutate(a.payload.judgments[0].method.bindings[0],a);check(a,{},'rejected');});
test('native exact duplicates reject, different roles preserve, and same-ID other kinds never shadow the typed target',()=>{
 const a=N.recursion(tuple),j=a.payload.judgments[0];a.payload.misuse.push({id:'exception',statement:'Same string ID, distinct kind.'});check(a);
 j.method.bindings.push(structuredClone(j.method.bindings[0]));check(a,{},'rejected');j.method.bindings[1].role='second-role';check(a);
 j.method.bindings[1].target.kind='misuse';const x=check(a);const scope=x.view.ir.mandatory_closures[0].node_ids;for(const kind of ['exception','misuse'])assert.ok(x.view.ir.nodes.some(n=>scope.includes(n.id)&&n.target.kind===kind&&n.target.id==='exception'));
});
test('native support cycles reach a finite fixed point while component content cycles remain invalid',()=>{
 const a=F.blank(tuple,2);a.payload.judgments.forEach((j,i)=>j.method.bindings=[{component_ref:'component:'+i,role:'support-cycle',target:{kind:'component',id:'component:'+(1-i)}}]);const x=check(a);assert.equal(new Set(x.view.ir.mandatory_closures[0].node_ids).size,x.view.ir.mandatory_closures[0].node_ids.length);
 for(const [i,j]of a.payload.judgments.entries()){delete j.method.components[0].statement;j.method.components[0].content_ref={kind:'component',id:'component:'+(1-i)};}check(a,{},'rejected');
});

test('native source open and no-edit pack preserve authored component, role, typed target and full source',()=>{
 const a=N.recursion(tuple),x=check(a),A=req('@aikdna/kdna-core/authoring-node');
 const opened=A.openSourceBytes(x.bytes);assert.equal(opened.status,'accepted');assert.deepEqual(opened.source.payload,a.payload);
 const packed=A.packSourceBytes(x.bytes,{});assert.equal(packed.status,'accepted');assert.deepEqual(packed.source.payload,a.payload);
 const again=C.admitBytes(packed.bytes);assert.equal(again.status,'accepted');assert.deepEqual(B.inspectSnapshot(again.snapshot).ir,x.view.ir);
});
