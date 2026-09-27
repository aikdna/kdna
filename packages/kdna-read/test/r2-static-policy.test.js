'use strict';
// specs/static-policy-2.md §§3, 5, 8, 10: complete interpretation is mandatory
// selected body, while catalog/whole_asset defer it; no branch is executed here.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const core=req('@aikdna/kdna-core'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embed=req('@aikdna/kdna-read/embedding');
const contract=require(path.join(coreDir,'src/public-contract/generated-contract.json')),tuple=contract.versionTuple;
const {canonicalJson}=require(path.join(coreDir,'src/public-contract/strict-input.js'));
const hash=x=>'sha256:'+crypto.createHash('sha256').update(canonicalJson(x)).digest('hex');
function semantic(x){if(Array.isArray(x))return {kind:'list',items:x.map(semantic)};if(x!==null&&typeof x==='object')return {kind:'record',fields:Object.entries(x).map(([name,value])=>({name,value:semantic(value)}))};return {kind:typeof x==='string'?'text':typeof x,value:x};}
function fixture(edit=()=>{}){
 const asset=F.blank(tuple),j=asset.payload.judgments[0],d=contract.static_policy.definition;
 asset.payload.asset_capability='result_forming_rules';j.form='rule';delete j.result;
 j.formation_rule={statement:'Follow complete authored priority; unknown blocks later branches.',condition_refs:[],output_contract_ref:j.result_contract.id};
 const rule={output_contract_ref:j.result_contract.id,candidates:[{key:'keep',title:'Keep',meaning:'Keep the declared course.',result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'Keep'}},{key:'reduce',title:'Reduce',meaning:'Reduce the declared effort.',result_type:{term:'text',vocabulary:'core'},value:{kind:'text',value:'Reduce'}}],strategy:{kind:'priority',direction:'higher-first'},entries:[{key:'effective',condition:{kind:'interpreted',statement:'Necessary action remains effective.'},priority:10,candidate_key:'keep'},{key:'counterforce',condition:{kind:'interpreted',statement:'Extra effort produces counterforce.'},priority:20,candidate_key:'reduce'}],fallback:{kind:'no_match',statement:'No adjustment when all conditions are false.'}};
 const carrier={contract_id:d.id,contract_version:d.version,definition_digest:contract.static_policy.definition_digest,judgment_ref:j.id,rule_digest:hash(rule),rule};
 edit({asset,j,rule,carrier});carrier.rule_digest=hash(rule);
 const extension={id:d.carrier.id,critical:true,definition:d.carrier.definition,value:semantic(carrier)};j.extensions=[extension];
 return {asset,j,rule,carrier,extension};
}
const control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
function host(filter=ids=>ids){return embed.createTrustedHostReadProvider({observe:({request,snapshot})=>{const v=inspectSnapshot(snapshot);return {host_id:'host:sp2',host_epoch:'epoch:sp2',decision_id:'decision:sp2',request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:filter(v.ir.nodes.map(n=>n.id),v),issued_at:900,expires_at:2000,current_ms:1000,decision:'allow',policy_id:'policy:sp2'};}});}
function admitted(f){const bytes=F.encode(f.asset,req),result=core.admitBytes(bytes);assert.equal(result.status,'accepted',JSON.stringify(result));return {bytes,...result};}
function complete(result,f){assert.equal(result.envelope.status,'ready',JSON.stringify(result));const node=result.envelope.content.closure.find(n=>n.target.kind==='judgment'&&n.target.id===f.j.id);assert.ok(node);assert.deepEqual(node.static_policy_interpretation.authored_rule,f.rule);assert.equal(node.static_policy_interpretation.rule_digest,hash(f.rule));assert.deepEqual(node.static_policy_interpretation.rule.entries.map(e=>e.key),['counterforce','effective']);assert.equal(Object.hasOwn(node.static_policy_interpretation,'selected_candidate'),false);assert.equal(Object.hasOwn(node.value,'static_policy_interpretation'),false);assert.equal(Object.hasOwn(node.value,'result'),false);return node;}
test('SP2 exact selection and asset-anchored expansion retain complete authored and normalized rules',async()=>{
 const f=fixture(),a=admitted(f),h=host();
 complete(await readBrowser(a.snapshot,F.candidate(tuple,f.asset),control,h),f);
 for(const mode of ['catalog','whole_asset']){
  const request=F.candidate(tuple,f.asset,mode),result=await readBrowser(a.snapshot,request,control,h);assert.equal(result.envelope.status,'ready');assert.equal(result.envelope.content.closure.some(n=>n.static_policy_interpretation),false);
  if(mode==='catalog'){assert.equal(result.envelope.content.expansion_handles.length,0);continue;}
  const handle=result.envelope.content.expansion_handles.find(x=>x.target.kind==='judgment'&&x.target.id===f.j.id);assert.ok(handle);assert.equal(handle.anchor.kind,'asset');
  complete(await readBrowser(a.snapshot,{...request,mode:'expand',handle},control,h),f);
 }
});
test('SP2 exact and expand budget shortage reject complete body without truncating rule',async()=>{
 const f=fixture(),a=admitted(f),h=host(),whole=F.candidate(tuple,f.asset,'whole_asset');
 const index=await readBrowser(a.snapshot,whole,control,h),handle=index.envelope.content.expansion_handles.find(x=>x.target.kind==='judgment');assert.ok(handle);
 for(const request of [F.candidate(tuple,f.asset),{...whole,mode:'expand',handle}]){
  const full=await readBrowser(a.snapshot,request,control,h);complete(full,f);
  const limited=await readBrowser(a.snapshot,{...request,budget_bytes:1500},control,h);
  assert.notEqual(limited.envelope?.status,'ready');assert.equal(limited.envelope?.content??null,null);assert.equal(limited.envelope?.diagnostics[0]?.code??limited.control?.semantic_cause,'READ_BUDGET_INSUFFICIENT');
 }
});
test('SP2 denied owning judgment refuses exact selection and cannot issue whole-asset handles',async()=>{
 const f=fixture(),a=admitted(f),h=host((ids,v)=>ids.filter(id=>!v.ir.nodes.some(n=>n.id===id&&n.target.kind==='judgment')));
 for(const mode of ['exact_selection','whole_asset']){const r=await readBrowser(a.snapshot,F.candidate(tuple,f.asset,mode),control,h);assert.equal(r.envelope.status,'rejected');assert.equal(r.envelope.diagnostics[0].code,'READ_SCOPE_DENIED');assert.equal(r.envelope.content,null);}
});
for(const kind of ['old-definition','old-carrier','nonempty-condition'])test('SP2 '+kind+' refuses through Read before Host observation',async()=>{
 const f=fixture(({asset,j,carrier})=>{if(kind==='old-definition')carrier.definition_digest='sha256:a28980e46f5f24a9a5190fcd380b813f996db307603620d3f2ab1a14ffb679bb';if(kind==='nonempty-condition'){asset.payload.conditions=[{id:'condition:pre',owner_ref:{kind:'judgment',id:j.id},expression:{kind:'interpreted',statement:'A precondition cannot disappear.'}}];j.formation_rule.condition_refs=[{kind:'condition',id:'condition:pre'}];}});
 if(kind==='old-carrier')f.extension.id='kdna.static-policy/1';let observations=0;const forbidden=embed.createTrustedHostReadProvider({observe(){observations++;throw Error('Must not observe rejected SP2');}});
 const bytes=F.encode(f.asset,req),reason=kind==='old-carrier'?'READ_UNSUPPORTED_CRITICAL':'READ_STATIC_POLICY_INVALID';assert.equal(core.admitBytes(bytes).reason,reason);
 const r=await readBrowser(bytes,F.candidate(tuple,f.asset),control,forbidden);assert.equal(r.envelope.status,'rejected');assert.equal(r.envelope.diagnostics[0].code,reason);assert.equal(r.envelope.content,null);assert.equal(observations,0);
});
