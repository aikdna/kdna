'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const {admitNode}=req('@aikdna/kdna-core/node'),{admitBrowser}=req('@aikdna/kdna-core/browser'),{inspectSnapshot}=req('@aikdna/kdna-core/read-boundary');
const {getComponentSemanticsContract}=req('@aikdna/kdna-core/components');
const {versionTuple:tuple}=require(path.join(coreDir,'src/public-contract/generated-contract.json'));
const {canonicalJson,utf8,compareUtf8}=require(path.join(coreDir,'src/public-contract/strict-input.js'));
const {digest}=require(path.join(coreDir,'src/public-contract/digests.js'));
const H=x=>digest(utf8(canonicalJson(x))),descriptor=getComponentSemanticsContract();
function value(x){if(x===null)return {kind:'null'};if(Array.isArray(x))return {kind:'list',items:x.map(value)};if(typeof x==='object')return {kind:'record',fields:Object.entries(x).map(([name,x])=>({name,value:value(x)}))};return {kind:typeof x==='string'?'text':typeof x,value:x};}
function ext(kind,x){const c=descriptor.carriers[kind];return {id:c.id,critical:true,definition:c.definition,value:value(x)};}
function claims(asset,contents){
 const j=asset.payload.judgments[0];j.method={method:{term:'diagnostic-differential'},components:contents.map(x=>({id:x.id,method:{term:x.type},statement:canonicalJson(x.content)})),bindings:[{component_ref:'j:0:candidates',role:'observations',target_ref:j.id},{component_ref:'j:0:candidates',role:'comparison-context',target_ref:j.id}]};
 const declarations=contents.map(x=>{
  const c=j.method.components.find(c=>c.id===x.id);const bindings=j.method.bindings.filter(b=>b.component_ref===c.id).sort((a,b)=>compareUtf8(a.role,b.role)||compareUtf8(a.target_ref,b.target_ref));
  return {contract_id:descriptor.contract_id,contract_version:descriptor.contract_version,definition_digest:descriptor.definition_digest,judgment_ref:j.id,component_ref:c.id,component_type:x.type,profile_id:descriptor.profiles.find(p=>p.component_type===x.type).profile_id,content:x.content,content_digest:H(x.content),component_declaration_digest:H({component:c,statement_origin:'mechanical_content_representation'}),statement_origin:'mechanical_content_representation',bindings_digest:H(bindings),adoption_proposal_digest:H({synthetic_fixture:true,component:c.id,content:x.content})};
 });
 j.extensions=declarations.map(d=>ext('component',d));
 // This is a static, deliberately synthetic fixture record. It proves no
 // actual Agent/editor adoption, human confirmation or strong Creation.
 asset.payload.extensions=[ext('adoption',{contract_id:descriptor.contract_id,contract_version:descriptor.contract_version,definition_digest:descriptor.definition_digest,declaration_set_digest:H(declarations.slice().sort((a,b)=>compareUtf8(a.judgment_ref,b.judgment_ref)||compareUtf8(a.component_ref,b.component_ref))),proposal_set_digest:H([...new Set(declarations.map(d=>d.adoption_proposal_digest))].sort(compareUtf8)),decision_digest:H('synthetic test decision only'),adoption_kind:'delegated_agent_editorial'})];return asset;
}
function fixture(){
 const contents=[{id:'j:0:discriminators',type:'discriminator-set',content:{candidateSetRef:'j:0:candidates',items:[{key:'evidence',title:'具体证据',prompt:'查看来源和实际输入',contrasts:[{candidateKey:'retrieval',criterion:'来源存在但未取到。'},{candidateKey:'source',criterion:'来源原文缺少所需信息。'}]}]}},{id:'j:0:candidates',type:'candidate-set',content:{items:[{key:'source',title:'来源问题',meaning:'原材料可能缺少证据。'},{key:'retrieval',title:'检索问题',meaning:'取回的内容可能不足。'}]}},{id:'j:0:other-candidates',type:'candidate-set',content:{items:[]}},{id:'j:0:taxonomy',type:'taxonomy',content:{items:[{key:'shared',title:'共享类别',meaning:'属于两个父类。'},{key:'first',title:'相同名称',meaning:'第一个父类。'},{key:'second',title:'相同名称',meaning:'第二个父类。'}],broader:[{narrowerKey:'shared',broaderKey:'second'},{narrowerKey:'shared',broaderKey:'first'}]}}];return {asset:claims(F.blank(tuple),contents),contents};
}
async function admit(asset){return admitNode(F.encode(asset,req));}
async function rejected(asset,reason){const r=await admit(asset);assert.equal(r.status,'rejected');assert.equal(r.reason,reason);assert.deepEqual(r.states,{core:'valid',interpretation:'blocked'});assert.equal(r.component_failure?.body,null);return r;}
test('explicit three-profile content survives public Node and browser, same type, unbound and multi-role',async()=>{
 const {asset}=fixture(),bytes=F.encode(asset,req,{deflate:true});const a=await admitNode(bytes);assert.equal(a.status,'accepted');const b=admitBrowser(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));assert.equal(b.status,'accepted');const view=inspectSnapshot(a.snapshot);assert.deepEqual(view.ir,inspectSnapshot(b.snapshot).ir);
 const m=view.ir.nodes.find(x=>x.role==='method').value;assert.equal(m.declaration.bindings.length,2);assert.equal(m.component_interpretations.length,4);assert.ok(m.component_interpretations.every(x=>x.status==='supported'));
 const tax=m.component_interpretations.find(x=>x.component_type==='taxonomy');assert.equal(tax.body.broader.length,2);assert.equal(tax.body.items.filter(x=>x.title==='相同名称').length,2);
 const disc=m.component_interpretations.find(x=>x.component_type==='discriminator-set');assert.deepEqual(disc.body.candidateIndex.map(x=>x.key),['retrieval','source']);assert.equal(disc.body.items[0].contrasts.length,2);
 assert.deepEqual(m.component_interpretations.find(x=>x.component_ref==='j:0:other-candidates').body,{kind:'candidate-set',items:[]});assert.equal(Object.isFrozen(descriptor),true);
});
test('cycle and dangling candidate remain blocked after all static fixture digests are rebuilt',async()=>{
 const x=fixture();x.contents[3].content.broader.push({narrowerKey:'first',broaderKey:'shared'});await rejected(claims(x.asset,x.contents),'READ_COMPONENT_GRAPH_CYCLE');
 const y=fixture();y.contents[0].content.items[0].contrasts[0].candidateKey='absent';await rejected(claims(y.asset,y.contents),'READ_COMPONENT_REFERENCE_INVALID');
 const z=fixture();z.contents[1].content.items[0].meaning=' trailing ';await rejected(claims(z.asset,z.contents),'READ_COMPONENT_CONTENT_INVALID');
});
test('carrier criticality, duplicate fields, native statement and missing aggregate fail closed',async()=>{
 let x=fixture();x.asset.payload.judgments[0].extensions[0].critical=false;await rejected(x.asset,'READ_COMPONENT_DECLARATION_INVALID');
 x=fixture();const fields=x.asset.payload.judgments[0].extensions[0].value.fields;fields.push(structuredClone(fields[0]));await rejected(x.asset,'READ_COMPONENT_DECLARATION_INVALID');
 x=fixture();x.asset.payload.judgments[0].method.components[0].statement='invented summary';await rejected(x.asset,'READ_COMPONENT_DECLARATION_INVALID');
 x=fixture();delete x.asset.payload.extensions;await rejected(x.asset,'READ_COMPONENT_ADOPTION_INVALID');
});
test('unselected meanings remain undeclared; presence-only preserves absent versus explicit empty',async()=>{
 const x=fixture();delete x.asset.payload.judgments[0].extensions;delete x.asset.payload.extensions;let r=await admit(x.asset);assert.equal(r.status,'accepted');let m=inspectSnapshot(r.snapshot).ir.nodes.find(x=>x.role==='method').value;assert.ok(m.component_interpretations.every(x=>x.status==='undeclared'&&x.body===null));
 const a=F.blank(tuple),j=a.payload.judgments[0];j.method={method:{term:'direct-preference'},components:[],bindings:[]};j.extensions=[ext('presence',{judgment_ref:j.id,components_state:'undeclared',bindings_state:'declared'})];r=await admit(a);assert.equal(r.status,'accepted');m=inspectSnapshot(r.snapshot).ir.nodes.find(x=>x.role==='method').value;assert.deepEqual(m.declaration_presence,{components_state:'undeclared',bindings_state:'declared'});assert.deepEqual(m.component_interpretations,[]);
 j.extensions.push(structuredClone(j.extensions[0]));await rejected(a,'READ_METHOD_PRESENCE_INVALID');
});
test('Read supplies complete interpreted bodies only with current permission and sufficient budget',async()=>{
 const {readNode}=req('@aikdna/kdna-read/node'),{createTrustedReadControlProvider,createTrustedHostReadProvider}=req('@aikdna/kdna-read/embedding');const {asset}=fixture();const bytes=F.encode(asset,req);const control=createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096}));
 const host=allow=>createTrustedHostReadProvider({observe({request,snapshot}){const v=inspectSnapshot(snapshot),now=Date.now();return {host_id:'synthetic',host_epoch:'test',decision_id:'test:'+request.request_id,request_id:request.request_id,snapshot_id:v.snapshot_id,A:v.digests.A.observed,C:v.digests.C.observed,scope:v.ir.nodes.map(n=>n.id),issued_at:now,expires_at:now+60000,current_ms:now,decision:allow?'allow':'deny',policy_id:'synthetic-only'};}});
 const request=F.candidate(tuple,asset);let r=await readNode(bytes,request,control,host(true));assert.equal(r.envelope.status,'ready');assert.equal(r.envelope.content.closure.find(n=>n.role==='method').value.component_interpretations.length,4);assert.equal(r.envelope.states.action_authorization,'not_evaluated');
 r=await readNode(bytes,request,control,host(false));assert.equal(r.envelope.states.read_permission,'denied');assert.equal(r.envelope.content,null);
 r=await readNode(bytes,{...request,budget_bytes:0},control,host(true));assert.equal(r.channel,'no_body_control');
 const broken=fixture();delete broken.asset.payload.extensions;r=await readNode(F.encode(broken.asset,req),request,control,host(true));assert.deepEqual(r.envelope.states,{core:'valid',interpretation:'blocked',writer:'not_evaluated',confirmation:'not_evaluated',read_permission:'not_evaluated',action_authorization:'not_evaluated'});assert.equal(r.envelope.diagnostics[0].stage,'core');assert.equal(r.envelope.content,null);
});
test('finite taxonomy depth and UTF-8 bounds reject without truncating or changing local meaning',async()=>{
 const chain=edges=>({items:Array.from({length:edges+1},(_,i)=>({key:'k'+i,title:'类别'+i,meaning:'本地类别'})),broader:Array.from({length:edges},(_,i)=>({narrowerKey:'k'+i,broaderKey:'k'+(i+1)}))});
 let x=fixture();x.contents[3].content=chain(64);let r=await admit(claims(x.asset,x.contents));assert.equal(r.status,'accepted');assert.equal(inspectSnapshot(r.snapshot).ir.nodes.find(n=>n.role==='method').value.component_interpretations[3].body.broader.length,64);
 x=fixture();x.contents[3].content=chain(65);await rejected(claims(x.asset,x.contents),'READ_COMPONENT_LIMIT_EXCEEDED');
 x=fixture();x.contents[1].content.items[0].title='界'.repeat(85)+'a';assert.equal((await admit(claims(x.asset,x.contents))).status,'accepted');
 x.contents[1].content.items[0].title+='b';await rejected(claims(x.asset,x.contents),'READ_COMPONENT_CONTENT_INVALID');
 x=fixture();x.contents[2].content.items=Array.from({length:129},(_,i)=>({key:'n'+i,title:'候选',meaning:'独立的本地解释'}));await rejected(claims(x.asset,x.contents),'READ_COMPONENT_LIMIT_EXCEEDED');
});
test('registered carriers cannot hide in another typed extension position; opaque content stays opaque',async()=>{
 let x=fixture();const j=x.asset.payload.judgments[0];j.method.method.extension=j.extensions.shift();await rejected(x.asset,'READ_COMPONENT_DECLARATION_INVALID');
 const a=F.blank(tuple);a.payload.extensions=[{id:'example.opaque',critical:false,definition:'Unrecognized application data',value:value({id:'example.nested',critical:true,definition:'Data, not an extension position',value:{}})}];assert.equal((await admit(a)).status,'accepted');
 a.payload.extensions[0].critical=true;const r=await admit(a);assert.equal(r.status,'rejected');assert.equal(r.reason,'READ_INTERPRETATION_INCOMPLETE');assert.deepEqual(r.states,{core:'valid',interpretation:'blocked'});
});
test('presence cannot invent a method, erase a populated array or redundantly claim declared arrays',async()=>{
 let a=F.blank(tuple),j=a.payload.judgments[0];j.extensions=[ext('presence',{judgment_ref:j.id,components_state:'undeclared',bindings_state:'declared'})];await rejected(a,'READ_METHOD_PRESENCE_INVALID');
 let x=fixture();j=x.asset.payload.judgments[0];j.extensions.push(ext('presence',{judgment_ref:j.id,components_state:'undeclared',bindings_state:'declared'}));await rejected(x.asset,'READ_METHOD_PRESENCE_INVALID');
 a=F.blank(tuple);j=a.payload.judgments[0];j.method={method:{term:'direct-preference'},components:[],bindings:[]};j.extensions=[ext('presence',{judgment_ref:j.id,components_state:'declared',bindings_state:'declared'})];await rejected(a,'READ_METHOD_PRESENCE_INVALID');
});
test('new public tuple is exact; native known method requirements are structural',async()=>{
 const {readNode}=req('@aikdna/kdna-read/node'),{createTrustedReadControlProvider,createTrustedHostReadProvider}=req('@aikdna/kdna-read/embedding');const a=F.blank(tuple),j=a.payload.judgments[0];
 const candidate=F.candidate(tuple,a);candidate.tuple={...tuple,core:'kdna.core/0.2.0',ir:'kdna.canonical-ir/0.1.0',read:'kdna.read/0.1.0'};
 let calls=0;const result=await readNode(F.encode(a,req),candidate,createTrustedReadControlProvider(()=>({admission_response_limit_bytes:4096})),createTrustedHostReadProvider({observe(){calls++;throw Error('unexpected Host');}}));assert.equal(result.channel,'read_envelope');assert.equal(result.envelope.status,'rejected');assert.equal(result.envelope.diagnostics[0].code,'READ_MIXED_VERSION_TUPLE');assert.equal(result.envelope.content,null);assert.equal(calls,0);
 j.method={method:{term:'diagnostic-differential'},components:[],bindings:[]};const r=await admit(a);assert.equal(r.reason,'READ_CORE_INVALID');assert.equal(r.states.core,'invalid');assert.equal(r.component_failure,null);
});
