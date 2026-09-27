'use strict';
// Current R2 engineering examples; no Creator fidelity or real-user authority claim.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const sourceRoot=process.env.KDNA_BASE_TEST_SOURCE??path.resolve(__dirname,'../../..');
const F=require(path.join(sourceRoot,'conformance/public-contract/test/r2-fixtures.cjs'));
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??sourceRoot);
const {admitNode}=req('@aikdna/kdna-core/node'),{admitBrowser}=req('@aikdna/kdna-core/browser');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const contract=require(path.join(coreDir,'src/public-contract/generated-contract.json')),tuple=contract.versionTuple;
const validators=require(path.join(coreDir,'src/public-contract/validators.generated.js'));
const {checkPayload}=require(path.join(coreDir,'src/public-contract/cross-entry.js'));
const clone=structuredClone;
const fixture=(name='simple')=>F.asset(tuple,name);
async function admit(a,opts){const bytes=F.encode(a,req,opts),n=await admitNode(bytes),b=admitBrowser(bytes);assert.deepEqual(n.status,b.status);if(n.status==='accepted')assert.deepEqual(inspectSnapshot(n.snapshot).ir,inspectSnapshot(b.snapshot).ir);else assert.deepEqual(n,b);return n;}
async function accepted(a,opts){const r=await admit(a,opts);assert.equal(r.status,'accepted',JSON.stringify(r));return inspectSnapshot(r.snapshot);}
function changed(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return [];if(a&&b&&typeof a==='object'&&typeof b==='object'){const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];return keys.flatMap(k=>changed(a[k],b[k],p+'/'+k));}return [p];}
async function negative(t,a,edit,{field,gate='semantic',rule,paths,opts}={}){
 await accepted(a,opts);const b=clone(a);edit(b);const mutations=changed(a,b);assert.ok(mutations.length);if(paths)assert.deepEqual(mutations,paths);
 const schema=validators.Payload(b.payload),errors=clone(validators.Payload.errors),cross=checkPayload(b.payload,contract.core_terms).filter(r=>!r.ok);
 if(gate==='schema')assert.equal(schema,false,'negative must reach the intended current schema constraint');
 else assert.equal(schema,true,JSON.stringify(errors));
 if(gate==='semantic')assert.deepEqual(cross,[],'no earlier cross-entry failure may mask this semantic counterexample');
 if(rule)assert.equal(cross[0]?.rule_id,rule,JSON.stringify(cross));
 const r=await admit(b,opts);assert.equal(r.status,'rejected',JSON.stringify(r));assert.equal(r.reason,'READ_CORE_INVALID');assert.equal(r.snapshot,undefined);assert.equal(r.diagnostics[0].field,field,JSON.stringify(r));
 t.diagnostic(JSON.stringify({gate,mutations,schema,cross:cross.map(x=>({rule:x.rule_id,violations:x.violations})),diagnostic:r.diagnostics[0]}));
}
function closure(v,id){const c=v.ir.mandatory_closures.find(c=>c.selection.judgment_id===id);assert.ok(c);const ids=new Set(c.node_ids);return v.ir.nodes.filter(n=>ids.has(n.id));}
function keys(v,id){return closure(v,id).map(n=>n.target.kind+':'+n.target.id);}

for(const [name,edit,pointer]of [
 ['same answer kind',a=>a.payload.judgments[0].answer_parts[1].kind='ranking','/payload/judgments/0/answer_parts/1/kind'],
 ['duplicate output field',a=>a.payload.judgments[0].answer_parts[1].output_field='priority','/payload/judgments/0/answer_parts/1/output_field'],
 ['optional output field',a=>a.payload.judgments[0].result_contract.shape.fields[1].required=false,'/payload/judgments/0/result_contract/shape/fields/1/required'],
 ['nonexistent output field',a=>a.payload.judgments[0].answer_parts[1].output_field='absent','/payload/judgments/0/answer_parts/1/output_field'],
])test('BASE-RESULT composite rejects '+name,t=>negative(t,fixture('complex'),edit,{field:'/payload/judgments/0',paths:[pointer]}));
function valueFixture(kind){const a=F.blank(tuple),j=a.payload.judgments[0];j.core_expression={kind:'authored',statement:'Explicit static result, no inference from display text.',qualification_refs:[]};j.result_contract.form={term:kind==='record'?'record':'list'};j.result_contract.allowed_result_types=[{term:kind}];j.result.result_type={term:kind};
 if(kind==='list'){j.result_contract.shape={kind:'list',item_shape:{kind:'scalar',scalar_type:'text'},minimum:0,maximum:5};j.result_contract.minimum=2;j.result_contract.maximum=2;j.result.value={kind:'list',items:[{kind:'text',value:'a'},{kind:'text',value:'b'}]};}
 else {j.result_contract.maximum=2;j.result_contract.shape={kind:'record',fields:[{name:'a',required:true,shape:{kind:'scalar',scalar_type:'text'}},{name:'b',required:true,shape:{kind:'scalar',scalar_type:'text'}}]};j.result.value={kind:'record',fields:[{name:'a',value:{kind:'text',value:'a'}},{name:'b',value:{kind:'text',value:'b'}}]};}
 return a;}
test('BASE-RESULT root list uses actual item count while a record counts as one',async t=>{
 for(const kind of ['list','record']){const a=valueFixture(kind);const v=await accepted(a);assert.deepEqual(v.ir.nodes.find(n=>n.target.kind==='result').value,a.payload.judgments[0].result);}
 await negative(t,valueFixture('list'),a=>a.payload.judgments[0].result.value.items.pop(),{field:'/payload'});
 await negative(t,valueFixture('list'),a=>a.payload.judgments[0].result.value.items.push({kind:'text',value:'c'}),{field:'/payload'});
 await negative(t,valueFixture('record'),a=>a.payload.judgments[0].result_contract.minimum=2,{field:'/payload',paths:['/payload/judgments/0/result_contract/minimum']});
});
function nested(){const a=valueFixture('record'),j=a.payload.judgments[0];j.result_contract.shape.fields[1].shape={kind:'list',item_shape:{kind:'list',item_shape:{kind:'scalar',scalar_type:'text'},minimum:1,maximum:2},minimum:1,maximum:2};j.result.value.fields[1].value={kind:'list',items:[{kind:'list',items:[{kind:'text',value:'one'}]}]};return a;}
for(const [name,edit]of [
 ['inner lower',a=>a.payload.judgments[0].result.value.fields[1].value.items[0].items=[]],
 ['inner upper',a=>a.payload.judgments[0].result.value.fields[1].value.items[0].items.push({kind:'text',value:'two'},{kind:'text',value:'three'})],
 ['outer lower',a=>a.payload.judgments[0].result.value.fields[1].value.items=[]],
 ['outer upper',a=>{const x=a.payload.judgments[0].result.value.fields[1].value.items;x.push(clone(x[0]),clone(x[0]));}],
])test('BASE-RESULT each nested list enforces '+name,t=>negative(t,nested(),edit,{field:'/payload'}));
function formFixture(kind='conclusion'){const a=F.blank(tuple),j=a.payload.judgments[0];j.core_expression={kind:'authored',statement:'Authored static statement.',qualification_refs:[]};if(kind==='rule'){j.form='rule';delete j.result;j.formation_rule={statement:'Authored rule, not an evaluated result.',condition_refs:[],output_contract_ref:j.result_contract.id};a.payload.asset_capability='result_forming_rules';}return a;}
for(const [kind,name,edit,field]of [
 ['conclusion','with rule',a=>a.payload.judgments[0].formation_rule={statement:'Full legal current rule.',condition_refs:[],output_contract_ref:a.payload.judgments[0].result_contract.id},'/payload/judgments/0'],
 ['rule','with result',a=>a.payload.judgments[0].result={contract_ref:a.payload.judgments[0].result_contract.id,result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'An explicit result.'}},'/payload/judgments/0'],
 ['conclusion','without result',a=>delete a.payload.judgments[0].result,'/payload/judgments/0/result'],
 ['rule','without rule',a=>delete a.payload.judgments[0].formation_rule,'/payload/judgments/0/result'],
])test('BASE-FORM current '+kind+' '+name,t=>negative(t,formFixture(kind),edit,{field,gate:'schema',rule:'PUBLIC-FORM-CONSISTENCY'}));
const capabilities=['asserted_answers','result_forming_rules','mixed'];
function capabilityFixture(expected){if(expected==='asserted_answers')return formFixture();if(expected==='result_forming_rules')return formFixture('rule');return fixture('coverage-basic');}
for(const expected of capabilities)test('BASE-CAPABILITY exact mapping '+expected,async t=>{
 const a=capabilityFixture(expected);assert.deepEqual([...new Set(a.payload.judgments.map(j=>j.form))].sort(),expected==='mixed'?['conclusion','rule']:[expected==='asserted_answers'?'conclusion':'rule']);const v=await accepted(a);assert.equal(a.payload.asset_capability,expected);assert.deepEqual(v.ir.catalog.map(c=>c.judgment_id),a.payload.judgments.map(j=>j.id));
 for(const wrong of capabilities.filter(x=>x!==expected))await negative(t,a,b=>b.payload.asset_capability=wrong,{field:'/payload/asset_capability',gate:'cross-entry',rule:'PUBLIC-ASSET-CAPABILITY',paths:['/payload/asset_capability']});
});

test('BASE-AUTHORSHIP adoption must stay within the exact declared question scope',t=>negative(t,fixture('complex'),a=>a.payload.judgments[0].content_uses[0].target.id='sB',{field:'/payload/judgments/0',paths:['/payload/judgments/0/content_uses/0/target/id']}));
for(const role of ['discuss','oppose'])test('BASE-AUTHORSHIP '+role+' outside scope references complete content without adopting or enlarging scope',async()=>{
 const a=fixture('complex'),j=a.payload.judgments[0];j.content_uses[0]={target:{kind:'shared_declaration',id:'sB'},role,statement:'Discuss the other authored position without adopting it.'};const v=await accepted(a),nodes=closure(v,'qA');
 const shared=nodes.find(n=>n.target.kind==='shared_declaration'&&n.target.id==='sB');assert.ok(shared);assert.deepEqual(shared.value,a.payload.shared_declarations[1]);assert.deepEqual(shared.value.applies_to,{kind:'judgments',judgment_refs:['qB']});
 assert.deepEqual(nodes.find(n=>n.target.kind==='judgment'&&n.target.id==='qA').value.content_uses,j.content_uses);
 const without=clone(a);without.payload.judgments[0].content_uses=[];const v2=await accepted(without);assert.ok(!keys(v2,'qA').includes('shared_declaration:sB'));assert.ok(keys(v2,'qB').includes('shared_declaration:sB'));
});
test('BASE-AUTHORSHIP adoption and opposition cannot claim the same target',t=>negative(t,fixture('complex'),a=>a.payload.judgments[0].content_uses.push({...clone(a.payload.judgments[0].content_uses[0]),role:'oppose'}),{field:'/payload/judgments/0'}));
for(const field of ['subject','applies_to'])test('BASE-AUTHORSHIP shared declaration requires explicit '+field,t=>negative(t,fixture('complex'),a=>delete a.payload.shared_declarations[0][field],{field:'/payload/shared_declarations/0/'+field,gate:'schema'}));
function parentFixture(){const a=F.blank(tuple,2);a.payload.actors=[{id:'author',kind:'person',name:'Synthetic author'}];const j=a.payload.judgments[0],scope={kind:'judgments',judgment_refs:[j.id]};
 j.boundaries={state:'provided',value:[{id:'parent-limit',effect:'limit',statement:'Only the parent question limit.',declared_by:'author',applies_to:scope,exception_refs:['parent-exception']}]};
 j.exceptions={state:'provided',value:[{id:'parent-exception',statement:'Only a parent condition can waive its parent limit.',boundary_ref:'parent-limit',applies_to:scope,when:{kind:'condition',id:'parent-when'},effect:{kind:'waive'}}]};
 j.misuse={state:'provided',value:[{id:'parent-misuse',statement:'Do not extend this parent claim to a child.'}]};
 a.payload.conditions=[{id:'parent-when',owner_ref:{kind:'exception',id:'parent-exception'},expression:{kind:'interpreted',statement:'An authored parent condition; not executed.'}}];return a;}
test('BASE-PARENT parent self reference rejects at the parent rule',t=>negative(t,parentFixture(),a=>a.payload.judgments[0].parent_ref='j:0',{field:'/payload/judgments/0/parent_ref',gate:'cross-entry',rule:'PUBLIC-PARENT-CLOSURE',paths:['/payload/judgments/0/parent_ref']}));
test('BASE-PARENT directory linkage inherits no boundary exception misuse permission or execution meaning',async()=>{
 const a=parentFixture(),before=await accepted(a),b=clone(a);b.payload.judgments[1].parent_ref='j:0';const after=await accepted(b);
 assert.deepEqual(keys(after,'j:1'),keys(before,'j:1'));for(const kind of ['boundary','exception','misuse','condition'])assert.ok(!closure(after,'j:1').some(n=>n.target.kind===kind));
 for(const target of ['boundary:parent-limit','exception:parent-exception','misuse:parent-misuse','condition:parent-when'])assert.ok(keys(after,'j:0').includes(target));
 const child=closure(after,'j:1').find(n=>n.target.kind==='judgment');assert.equal(child.value.parent_ref,'j:0');assert.deepEqual(child.value.method,before.ir.nodes.find(n=>n.target.kind==='judgment'&&n.target.id==='j:1').value.method);
 assert.deepEqual(after.ir.references,before.ir.references);assert.deepEqual(after.ir.mandatory_closures,before.ir.mandatory_closures);
});

const N=require(path.join(sourceRoot,'packages/kdna-core/test/native-binding-test-model.js'));
const {digest}=require(path.join(coreDir,'src/public-contract/digests.js'));
function identityFixture(name){if(name==='native'){const {a,entries}=N.allKinds(tuple,digest);return {a,opts:{entries}};}return {a:fixture(name),opts:undefined};}
// Ref's single asset and derived result are checked separately; every other registered
// identity family below has a real current container collision, not a registry-unit mock.
const identityCases=[
 ['actor','native','payload.actors', '/payload/actors/1/id','cross-entry'],
 ['judgment','native','payload.judgments','/payload/judgments/3/id','cross-entry'],
 ['reason','native','payload.reasons','/payload/reasons/1/id','cross-entry'],
 ['source','native','payload.sources','/payload/sources/1/id','cross-entry'],
 ['source_use','native','payload.source_uses','/payload/source_uses/1/id','cross-entry'],
 ['resource','native','payload.resources','/payload/resources/1/id','cross-entry'],
 ['material','native','payload.materials','/payload/materials/1/id','cross-entry'],
 ['relationship','native','payload.relationships','/payload/relationships/1/id','cross-entry'],
 ['dependency','native','payload.dependencies','/payload/dependencies/1/id','cross-entry'],
 ['contract','complex','payload.contracts','/payload/contracts/4','semantic'],
 ['condition','native','payload.conditions','/payload/conditions/1','semantic'],
 ['shared_declaration','complex','payload.shared_declarations','/payload/shared_declarations/2','semantic'],
 ['example','complex','payload.examples','/payload/examples/1','semantic'],
 ['component','simple','payload.judgments.0.method.components','/payload/judgments/0/method/components/1/id','cross-entry'],
 ['unit','complex','payload.judgments.0.method.units','/payload/judgments/0/method/units','semantic'],
 ['plan_node','complex','payload.judgments.0.method.plan.nodes','/payload/judgments/0/method/plan/nodes','semantic'],
 ['branch_entry','branches','payload.judgments.0.formation_rule.policy.entries','/payload/judgments/0/formation_rule/policy/entries','semantic'],
 ['candidate','branches','payload.judgments.0.formation_rule.policy.candidates','/payload/judgments/0/formation_rule/policy/candidates','semantic'],
 ['boundary','native','payload.declarations.boundaries.value','/payload/declarations/boundaries/value/1/id','cross-entry'],
 ['exception','native','payload.exceptions','/payload/declarations/exceptions','semantic'],
 ['misuse','native','payload.misuse','/payload/declarations/misuse','semantic'],
 ['example_result','complex','payload.examples.0.results','/payload/examples/results','semantic'],
 ['revision','complex','manifest.history.entries','/manifest/history/entries','semantic'],
];
function at(a,p){return p.split('.').reduce((x,k)=>x[k],a);}
for(const [kind,name,collection,field,gate]of identityCases)test('BASE-IDENTITY same-kind collision '+kind,async t=>{
 const {a,opts}=identityFixture(name),list=at(a,collection);assert.ok(list.length);
 const v=await accepted(a,opts),nodes=v.ir.nodes.filter(n=>n.target.kind===kind&&n.target.id===list[0].id);assert.equal(nodes.length,1);
 let owner={kind:'asset',id:a.manifest.asset_uid};
 if(['component','unit'].includes(kind))owner={kind:'judgment',id:a.payload.judgments[0].id};
 if(kind==='plan_node')owner={kind:'plan',id:a.payload.judgments[0].method.plan.id};
 if(['branch_entry','candidate'].includes(kind))owner={kind:'policy',id:a.payload.judgments[0].formation_rule.policy.id};
 if(kind==='example_result')owner={kind:'example',id:a.payload.examples[0].id};
 assert.deepEqual(nodes[0].owner,owner);
 // Adding a byte-identical second declaration changes only the namespace population.
 // No original reference is changed or left dangling: all still resolve to the old ID.
 await negative(t,a,b=>{const items=at(b,collection);items.push(clone(items[0]));},{field,gate,rule:gate==='cross-entry'?'PUBLIC-UNIQUE-IDENTITY':undefined,opts});
});
function copyJudgmentWithFreshNestedIds(j,suffix){const ids=new Set();function collect(x){if(!x||typeof x!=='object')return;if(typeof x.id==='string'&&!(typeof x.kind==='string'&&Object.keys(x).every(k=>['kind','id','asset'].includes(k))))ids.add(x.id);for(const v of Object.values(x))collect(v);}collect(j);function rewrite(x){if(typeof x==='string')return ids.has(x)?x+suffix:x;if(Array.isArray(x))return x.map(rewrite);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,rewrite(v)]));return x;}const copy=rewrite(j);copy.parent_ref=null;copy.content_uses=[];return copy;}
for(const [kind,name,member]of [['plan','complex','method.plan'],['policy','branches','formation_rule.policy']])test('BASE-IDENTITY same '+kind+' id across different judgment owners rejects',async t=>{
 const a=fixture(name),original=a.payload.judgments[0],other=copyJudgmentWithFreshNestedIds(original,'-second-owner');a.payload.judgments.push(other);
 const view=await accepted(a);const otherIndex=a.payload.judgments.length-1;
 for(const j of [original,other])assert.deepEqual(view.ir.nodes.find(n=>n.target.kind===kind&&n.target.id===at(j,member).id).owner,{kind:'judgment',id:j.id});
 await negative(t,a,b=>at(b.payload.judgments[otherIndex],member).id=at(original,member).id,{field:'/payload/judgments/'+otherIndex+'/'+member.replaceAll('.','/'),gate:'semantic'});
});
test('BASE-IDENTITY registered Ref inventory has a collision or explicit singleton/derived proof',()=>{
 assert.deepEqual([...identityCases.map(x=>x[0]),'asset','result','plan','policy'].sort(),[...contract.types.Ref.properties.kind.enum].sort());
});
test('BASE-IDENTITY result identity and owner derive from its unique judgment while same text across kinds is legal',async()=>{
 const a=fixture(),j=a.payload.judgments[0];a.payload.actors[0].id=j.id;j.subject.actor_ids=[j.id];const v=await accepted(a);
 for(const kind of ['actor','judgment','result'])assert.ok(v.ir.nodes.some(n=>n.target.kind===kind&&n.target.id===j.id));
 const results=v.ir.nodes.filter(n=>n.target.kind==='result');for(const n of results)assert.deepEqual(n.owner,{kind:'judgment',id:n.target.id});
 assert.equal(v.ir.nodes.filter(n=>n.target.kind==='asset').length,1);assert.equal(v.ir.nodes.find(n=>n.target.kind==='asset').target.id,a.manifest.asset_uid);
});
for(const [name,build,edit,field]of [
 ['auxiliary versus owned',()=>fixture('complex'),a=>a.payload.contracts[0].id=a.payload.judgments[0].result_contract.id,'/payload/judgments/0/result_contract'],
 ['emission-list versus owned',()=>fixture('authored-merge'),a=>a.payload.contracts.find(c=>c.kind==='emission_list').id=a.payload.judgments[0].result_contract.id,'/payload/judgments/0/result_contract'],
 ['emission-list versus auxiliary',()=>fixture('authored-merge'),a=>a.payload.contracts.find(c=>c.kind==='emission_list').id=a.payload.contracts[0].id,'/payload/contracts/1'],
])test('BASE-IDENTITY one contract namespace '+name,t=>negative(t,build(),edit,{field,gate:'semantic'}));
