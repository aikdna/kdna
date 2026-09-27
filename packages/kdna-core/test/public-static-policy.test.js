'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitNode}=req('@aikdna/kdna-core/node'),{admitBrowser}=req('@aikdna/kdna-core/browser');
const {inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {getStaticPolicyContract}=req('@aikdna/kdna-core/static-policy');
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {canonicalJson,utf8}=require(path.join(coreDir,'src/public-contract/strict-input.js'));
const {digest}=require(path.join(coreDir,'src/public-contract/digests.js'));
const descriptor=getStaticPolicyContract(),H=x=>digest(utf8(canonicalJson(x)));
const FIRST_MATCHING_DEFINITION='sha256:c3f8aec755b58fe98deb201ce5b9f30cd729e1b10bf636608b87e863f6c7cf92';
function semantic(x){if(x===null)return {kind:'null'};if(Array.isArray(x))return {kind:'list',items:x.map(semantic)};if(typeof x==='object')return {kind:'record',fields:Object.entries(x).map(([name,value])=>({name,value:semantic(value)}))};return {kind:typeof x==='string'?'text':typeof x,value:x};}
function fixture(){
 const asset=F.blank(tuple,1,{form:'rule'}),j=asset.payload.judgments[0];delete j.result;
 j.formation_rule={statement:'按明确条件调整行动。',condition_refs:[],output_contract_ref:j.result_contract.id};
 const rule={output_contract_ref:j.result_contract.id,candidates:[{key:'maintain',title:'维持',meaning:'继续必要行动。',result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'维持'}},{key:'reduce',title:'减力',meaning:'降低不必要干预。',result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'减力'}}],strategy:{kind:'priority',direction:'higher-first'},entries:[{key:'effective',condition:{kind:'interpreted',statement:'必要行动仍有效且未产生明显反作用。'},priority:10,candidate_key:'maintain'},{key:'counterforce',condition:{kind:'interpreted',statement:'额外干预造成明显反作用。'},priority:20,candidate_key:'reduce'}],fallback:{kind:'no_match',statement:'信息不足时不形成调整方向。'}};
 const carrier={contract_id:descriptor.contract_id,contract_version:descriptor.contract_version,definition_digest:descriptor.definition_digest,judgment_ref:j.id,rule_digest:H(rule),rule};
 return {asset,j,carrier};
}
function bind(x){x.carrier.rule_digest=H(x.carrier.rule);x.j.extensions=[{id:descriptor.carrier.id,critical:true,definition:descriptor.carrier.definition,value:semantic(x.carrier)}];return x.asset;}
test('fixed definition binds single first-match, unknown blocking and all-false fallback without an evaluator',()=>{
 const {static_policy:registry}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
 assert.equal(descriptor.definition_digest,FIRST_MATCHING_DEFINITION);
 assert.equal(H(registry.definition),FIRST_MATCHING_DEFINITION);
 assert.deepEqual(registry.definition.priority_semantics,{
  kind:'first-matching-priority',selection:'single-candidate',
  true_entry_requires:'all-prior-conditions-explicitly-false',
  unknown_prior_condition:'blocks-later-candidates-and-fallback',
  fallback_requires:'all-conditions-explicitly-false',
  condition_evaluation:'outside-core-and-read'
 });
 const normative=registry.definition.rules.join('\n');
 for(const rule of [
  'If multiple conditions are true, only the earliest qualifying true entry determines the candidate.',
  'An earlier unknown or unevaluated condition blocks later candidates: it is never treated as false or skipped.',
  'Fallback applies only when every entry condition is explicitly false; unknown or unevaluated conditions do not permit fallback.'
 ])assert.ok(normative.includes(rule),rule);
 assert.deepEqual(Object.keys(descriptor).sort(),['carrier','contract_id','contract_version','definition_digest']);
});
async function rejectFixture(edit,after){const control=fixture();assert.equal((await admitNode(F.encode(bind(control),req))).status,'accepted','valid current SP2 control');const x=fixture();edit(x);bind(x);if(after)after(x);const r=await admitNode(F.encode(x.asset,req));assert.equal(r.status,'rejected');assert.equal(r.reason,'READ_STATIC_POLICY_INVALID');assert.deepEqual(r.states,{core:'valid',interpretation:'blocked'});assert.equal(r.component_failure,null);return r;}
test('static policy retains original rule, deterministic explicit priority and no execution result in Node/browser',async()=>{
 const x=fixture(),bytes=F.encode(bind(x),req,{deflate:true}),a=await admitNode(bytes),b=admitBrowser(bytes);
 assert.equal(a.status,'accepted');assert.equal(b.status,'accepted');const ir=inspectSnapshot(a.snapshot).ir;assert.deepEqual(ir,inspectSnapshot(b.snapshot).ir);
 const n=ir.nodes.find(n=>n.target.kind==='judgment');assert.equal(n.target.id,x.j.id);assert.equal(n.static_policy_interpretation.definition_digest,FIRST_MATCHING_DEFINITION);assert.deepEqual(n.static_policy_interpretation.authored_rule,x.carrier.rule);assert.deepEqual(n.static_policy_interpretation.rule.entries.map(e=>e.key),['counterforce','effective']);assert.equal(n.static_policy_interpretation.rule_digest,H(x.carrier.rule));assert.equal(ir.nodes.some(n=>n.role==='result'),false);assert.ok(ir.mandatory_closures[0].node_ids.includes(n.id));
 assert.equal(Object.hasOwn(n.static_policy_interpretation,'evaluatorCompleted'),false);assert.equal(Object.hasOwn(n.static_policy_interpretation,'selected_candidate'),false);
 x.carrier.rule.strategy.direction='lower-first';const c=await admitNode(F.encode(bind(x),req));assert.deepEqual(inspectSnapshot(c.snapshot).ir.nodes.find(n=>n.target.kind==='judgment').static_policy_interpretation.rule.entries.map(e=>e.key),['effective','counterforce']);
});
for(const [name,edit]of [
 ['unknown strategy',x=>x.carrier.rule.strategy.kind='first-match'],
 ['unknown direction',x=>x.carrier.rule.strategy.direction='implicit'],
 ['duplicate priority',x=>x.carrier.rule.entries[1].priority=10],
 ['wrong owner',x=>x.carrier.judgment_ref='j:other'],
 ['wrong output contract',x=>x.carrier.rule.output_contract_ref='result-contract:other'],
 ['missing formation rule',x=>{delete x.j.formation_rule;x.j.form='conclusion';x.asset.payload.asset_capability='asserted_answers';x.j.result={contract_ref:x.j.result_contract.id,result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'existing assertion'}};}],
 ['nonempty overall conditions are never cleared',x=>{x.asset.payload.conditions.push({id:'precondition',owner_ref:{kind:'judgment',id:x.j.id},expression:{kind:'interpreted',statement:'原有前提不得自动搬动。'}});x.j.formation_rule.condition_refs=[{kind:'condition',id:'precondition'}];}],
 ['unsupported condition kind',x=>x.carrier.rule.entries[0].condition={kind:'structured',operator:'equals',operands:[]}],
 ['dangling candidate',x=>x.carrier.rule.entries[0].candidate_key='missing'],
 ['dangling fallback',x=>x.carrier.rule.fallback={kind:'candidate',candidate_key:'missing'}],
 ['missing fallback',x=>delete x.carrier.rule.fallback],
 ['duplicate candidate',x=>x.carrier.rule.candidates.push(structuredClone(x.carrier.rule.candidates[0]))],
 ['candidate violates result shape',x=>x.carrier.rule.candidates[0].value={kind:'number',value:1}],
 ['candidate violates result type',x=>x.carrier.rule.candidates[0].result_type={term:'number',vocabulary:'core'}],
 ['static candidate cannot claim runtime result',x=>x.carrier.rule.candidates[0].executed=true],
 ['empty meaning',x=>x.carrier.rule.candidates[0].meaning=' '],
 ['definition mismatch',x=>x.carrier.definition_digest='sha256:'+'0'.repeat(64)],
 ['previous ambiguous definition is not silently accepted',x=>x.carrier.definition_digest='sha256:7f93f43175d4eedcf82e1f779dad6e1cadc29da01224f529720d80af35cff498']
])test('rejects '+name+' even after content digest is rebuilt',()=>rejectFixture(edit));
test('carrier criticality, placement, duplicate carrier/fields and stale content digest reject',async()=>{
 await rejectFixture(()=>{},x=>x.j.extensions[0].critical=false);
 await rejectFixture(()=>{},x=>{x.asset.payload.extensions=x.j.extensions;x.j.extensions=[];});
 await rejectFixture(()=>{},x=>x.j.extensions.push(structuredClone(x.j.extensions[0])));
 await rejectFixture(()=>{},x=>x.j.extensions[0].value.fields.push(structuredClone(x.j.extensions[0].value.fields[0])));
 await rejectFixture(()=>{},x=>x.j.extensions[0].value.fields.find(f=>f.name==='rule_digest').value.value='sha256:'+'0'.repeat(64));
});
test('explicit candidate fallback and ordinary assertion/nonempty formation conditions remain valid',async()=>{
 const x=fixture();x.carrier.rule.fallback={kind:'candidate',candidate_key:'reduce'};assert.equal((await admitNode(F.encode(bind(x),req))).status,'accepted');
 const ordinary=F.blank(tuple);assert.equal((await admitNode(F.encode(ordinary,req))).status,'accepted');
 const y=fixture();y.asset.payload.conditions.push({id:'ordinary-condition',owner_ref:{kind:'judgment',id:y.j.id},expression:{kind:'interpreted',statement:'原有总体条件。'}});y.j.formation_rule.condition_refs=[{kind:'condition',id:'ordinary-condition'}];const a=await admitNode(F.encode(y.asset,req));assert.equal(a.status,'accepted');assert.equal(inspectSnapshot(a.snapshot).ir.nodes.some(n=>n.role==='static_policy'),false);
});
test('Read delivers the exact Core static policy; budget and old tuple never silently drop it',async()=>{
 const {readNode}=req('@aikdna/kdna-read/node'),{createTrustedReadControlProvider,createTrustedHostReadProvider}=req('@aikdna/kdna-read/embedding');
 const x=fixture(),bytes=F.encode(bind(x),req),request=F.candidate(tuple,x.asset),control=createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
 const host=createTrustedHostReadProvider({observe({request,snapshot}){const v=inspectSnapshot(snapshot),now=Date.now();return {host_id:'synthetic-policy-test',host_epoch:'test',decision_id:'decision:'+request.request_id,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:now-1,expires_at:now+100000,decision:'allow',policy_id:'synthetic-test',current_ms:now};}});
 const r=await readNode(bytes,request,control,host);assert.equal(r.envelope.status,'ready');const policy=r.envelope.content.closure.find(n=>n.target.kind==='judgment');assert.equal(policy.static_policy_interpretation.definition_digest,FIRST_MATCHING_DEFINITION);assert.deepEqual(policy.static_policy_interpretation.authored_rule,x.carrier.rule);assert.equal(r.envelope.content.closure.some(n=>n.role==='result'),false);
 const small=await readNode(bytes,{...request,budget_bytes:1},control,host);assert.notEqual(small.envelope?.status,'ready');
 const old=await readNode(bytes,{...request,tuple:{...tuple,core:'kdna.core/0.3.0',ir:'kdna.canonical-ir/0.2.0',read:'kdna.read/0.2.0'}},control,host);assert.notEqual(old.envelope?.status,'ready');
});
