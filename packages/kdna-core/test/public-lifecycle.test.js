'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitBytes}=req('@aikdna/kdna-core'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {admitBrowser}=req('@aikdna/kdna-core/browser');
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {admitReadRequest,project}=req('@aikdna/kdna-read');
const {createTrustedReadControlProvider}=req('@aikdna/kdna-read/embedding');
function fixture(){return F.blank(tuple,3);}
function target(a,id,patch={}){return {asset:{...a.payload.asset,...patch},judgment_id:id};}
function lifecycle(a,index,status,targets=[]){a.payload.judgments[index].lifecycle={status,superseded_by:targets,statement:'An explicit authored lifecycle declaration.'};}
function admit(a){return admitBytes(F.encode(a,req));}
for(const [name,mutate]of [
 ['dangling local replacement',a=>lifecycle(a,0,'superseded',[target(a,'missing')])],
 ['self replacement',a=>lifecycle(a,0,'superseded',[target(a,'j:0')])],
 ['replacement cycle',a=>{lifecycle(a,0,'superseded',[target(a,'j:1')]);lifecycle(a,1,'deprecated',[target(a,'j:0')]);}],
 ['empty superseded',a=>lifecycle(a,0,'superseded')],
 ['active replacement',a=>lifecycle(a,0,'active',[target(a,'j:1')])],
 ['withdrawn replacement',a=>lifecycle(a,0,'withdrawn',[target(a,'j:1')])],
 ['duplicate target',a=>lifecycle(a,0,'superseded',[target(a,'j:1'),target(a,'j:1')])],
 ['ambiguous old string',a=>lifecycle(a,0,'superseded',['j:1'])],
 ['missing judgment version',a=>{const t=target(a,'j:1');delete t.asset.judgment_version;lifecycle(a,0,'superseded',[t]);}],
])test('lifecycle rejects '+name,()=>{const a=fixture();assert.equal(admit(a).status,'accepted','valid lifecycle control');mutate(a);const rejected=admit(a);assert.equal(rejected.status,'rejected');assert.equal(rejected.reason,'READ_CORE_INVALID');});
test('local replacement chain closes exact reading without changing selection',()=>{
 const a=fixture();lifecycle(a,0,'superseded',[target(a,'j:1')]);lifecycle(a,1,'deprecated',[target(a,'j:2')]);
 const admitted=admit(a);assert.equal(admitted.status,'accepted');const view=inspectSnapshot(admitted.snapshot);
 const closure=view.ir.mandatory_closures.find(c=>c.selection.judgment_id==='j:0');
 for(const id of ['j:0','j:1','j:2'])assert.ok(closure.node_ids.includes(view.ir.catalog.find(c=>c.judgment_id===id).node_ref));
 const ids=['j:0','j:1','j:2'].map(id=>view.ir.catalog.find(c=>c.judgment_id===id).node_ref);
 for(let i=0;i<2;i++)assert.deepEqual(view.ir.references.filter(r=>r.source_node===ids[i]&&r.target_node===ids[i+1]).map(r=>({role:r.role,mandatory:r.mandatory})),[{role:'lifecycle_replacement',mandatory:true}],'exact authored replacement edge');
 const request=admitReadRequest(F.candidate(tuple,a),createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000})));
 assert.equal(request.channel,'admitted_request');const result=project(request.admitted_request,admitted.snapshot);
 assert.equal(result.status,'projected');assert.equal(result.body.content.selected.judgment_id,'j:0');assert.equal(result.body.content.closure.filter(n=>n.role==='judgment').length,3);assert.equal(result.body.content.references.filter(r=>r.role==='lifecycle_replacement').length,2);assert.deepEqual(result.body.omissions,[{state:'explicitly_omitted',target:view.ir.nodes.find(n=>n.role==='asset_declaration').id,field:'reading_order',reason:'not_in_mode',expandable:false,handle_id:null}]);
});
test('one endpoint pair preserves distinct lifecycle and ordinary support roles with deterministic reference identities',()=>{
 const a=fixture();lifecycle(a,0,'superseded',[target(a,'j:1')]);
 a.payload.relationships=[{id:'support:replacement',kind:{term:'support'},direction:'directed',participants:[{judgment_ref:'j:1',role:{term:'supporter'}},{judgment_ref:'j:0',role:{term:'claim'}}],operator:{term:'supports'},effect:{term:'offers_support'},statement:'The replacement also independently supports the original question.'}];
 const first=admit(a),second=admit(a);assert.equal(first.status,'accepted');assert.equal(second.status,'accepted');
 const ir=inspectSnapshot(first.snapshot).ir;assert.deepEqual(ir,inspectSnapshot(second.snapshot).ir);
 const bytes=F.encode(a,req),browser=admitBrowser(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));assert.equal(browser.status,'accepted');assert.deepEqual(inspectSnapshot(browser.snapshot).ir,ir);
 const ids=['j:0','j:1'].map(id=>ir.catalog.find(c=>c.judgment_id===id).node_ref);
 const references=ir.references.filter(r=>r.source_node===ids[0]&&r.target_node===ids[1]);
 assert.deepEqual(references.map(r=>[r.role,r.mandatory]),[['lifecycle_replacement',true],['mandatory_support',true]]);
 assert.equal(new Set(references.map(r=>r.id)).size,2);
 for(const role of ['lifecycle_replacement','mandatory_support']) {
  const single=structuredClone(a);
  if(role==='lifecycle_replacement')single.payload.relationships=[];else delete single.payload.judgments[0].lifecycle;
  const control=admit(single);assert.equal(control.status,'accepted');
  const edge=inspectSnapshot(control.snapshot).ir.references.find(r=>r.source_node===ids[0]&&r.target_node===ids[1]);
  assert.equal(edge.role,role);assert.equal(edge.id,references.find(r=>r.role===role).id,'Adding a distinct edge meaning must preserve the existing reference identity.');
 }
 const closure=ir.mandatory_closures.find(c=>c.selection.judgment_id==='j:0');assert.equal(closure.node_ids.filter(id=>id===ids[1]).length,1);
});
for(const patch of [{asset_id:'other:asset'},{asset_version:'2.0.0'},{judgment_version:'2.0.0'}])test('external tuple stays an explicit unverified declaration '+JSON.stringify(patch),()=>{
 const a=fixture(),t=target(a,'j:1',patch);lifecycle(a,0,'superseded',[t]);const admitted=admit(a);assert.equal(admitted.status,'accepted');
 const ir=inspectSnapshot(admitted.snapshot).ir,node=ir.nodes.find(n=>n.role==='judgment'&&n.value.id==='j:0');
 const localCounterpart=ir.nodes.find(n=>n.target.kind==='judgment'&&n.target.id==='j:1');
 assert.deepEqual(node.value.lifecycle.superseded_by,[t]);assert.equal(ir.references.filter(r=>r.source_node===node.id&&r.target_node===localCounterpart.id).length,0,'A matching local textual ID must not satisfy an external complete identity.');
 assert.deepEqual(ir.unresolved_external,[{source:{kind:'judgment',id:'j:0'},target:{kind:'judgment',id:'j:1',asset:t.asset},mandatory:true}]);
 const closure=ir.mandatory_closures.find(c=>c.selection.judgment_id==='j:0');assert.equal(ir.nodes.filter(n=>n.role==='judgment'&&closure.node_ids.includes(n.id)).length,1);
});
for(const state of ['active','deprecated','withdrawn'])test(state+' remains historically readable',()=>{
 const a=fixture();lifecycle(a,0,state);assert.equal(admit(a).status,'accepted');
});
test('missing lifecycle preserves absence without defaulting active',()=>{
 const a=fixture(),admitted=admit(a),ir=inspectSnapshot(admitted.snapshot).ir;
 assert.ok(ir.nodes.filter(n=>n.role==='judgment').every(n=>!Object.hasOwn(n.value,'lifecycle')));
});
