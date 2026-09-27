'use strict';
// Historical fixture shapes stay rejected under R01/R06/R08; changing a test
// to current R2 must not silently reinstate an obsolete authored shape.
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs'),{bindDependencyPorts}=require('./r2-test-model.js');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple,core=req('@aikdna/kdna-core');
const {readBrowser}=req('@aikdna/kdna-read/browser'),embed=req('@aikdna/kdna-read/embedding');
for(const kind of ['old-display-label','old-shared-declaration','missing-dependency-ports','old-contrast-tuple','old-rule-conditions'])test('migrated fixture retains historical rejection: '+kind,async()=>{
 const a=F.blank(tuple,2);assert.equal(core.admitBytes(F.encode(a,req)).status,'accepted');
 if(kind==='old-display-label')a.payload.judgments[0].label='Legacy label';
 if(kind==='old-shared-declaration')a.payload.declarations.worldview={state:'provided',value:['Old unscoped worldview']};
 if(kind==='missing-dependency-ports'){
  a.payload.dependencies=[{id:'dep',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'context',data_type:{term:'text'},required:false,purpose:'Optional support'}];
  const current=bindDependencyPorts(structuredClone(a));assert.equal(core.admitBytes(F.encode(current,req)).status,'accepted');
 }
 if(kind==='old-contrast-tuple')a.payload.relationships=[{id:'r:old',statement:'Legacy contrast meaning.',kind:{term:'contrast',vocabulary:'author'},operator:{term:'contrast',vocabulary:'author'},effect:{term:'context',vocabulary:'author'},direction:'directed',participants:[{judgment_ref:'j:0',role:{term:'first',vocabulary:'author'}},{judgment_ref:'j:1',role:{term:'second',vocabulary:'author'}}]}];
 if(kind==='old-rule-conditions'){const j=a.payload.judgments[0];j.form='rule';delete j.result;a.payload.asset_capability='mixed';j.formation_rule={statement:'Legacy conditions cannot replace explicit Ref.',conditions:[],output_contract_ref:j.result_contract.id};}
 const bytes=F.encode(a,req),admitted=core.admitBytes(bytes);assert.equal(admitted.status,'rejected');assert.equal(admitted.reason,'READ_CORE_INVALID');
 let calls=0;const host=embed.createTrustedHostReadProvider({observe(){calls++;throw Error('Invalid current fixture must not reach Host');}}),control=embed.createTrustedReadControlProvider(()=>({admission_response_limit_bytes:1000000}));
 const r=await readBrowser(bytes,F.candidate(tuple,a),control,host);assert.equal(r.envelope.status,'rejected');assert.equal(r.envelope.content,null);assert.equal(r.envelope.diagnostics[0].code,'READ_CORE_INVALID');assert.equal(calls,0);
});
