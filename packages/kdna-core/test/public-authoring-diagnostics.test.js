'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {req,coreDir}=F.runtime(process.env.KDNA_PUBLIC_RUNTIME??path.resolve(__dirname,'../../..'));
const api=req('@aikdna/kdna-core/authoring-node'),core=req('@aikdna/kdna-core');
const tuple=require(path.join(coreDir,'src/public-contract/generated-contract.json')).versionTuple;
function input(){const a=F.blank(tuple,2);a.payload.dependencies=[{id:'d:upstream',producer:{kind:'judgment_result',judgment_ref:'j:0',result_contract_ref:'result-contract:0'},consumer_judgment_ref:'j:1',input_role:'upstream',data_type:{term:'text'},required:true,purpose:'The consumer needs the producer judgment'}];return require('./r2-test-model.js').bindDependencyPorts(a);}
test('missing dependency producer and wrong contract identify the current dependency record and subject',()=>{
 const a=input(),bytes=F.encode(a,req);assert.equal(core.admitBytes(bytes).status,'accepted','valid dependency control');
 for(const [key,value]of [['judgment_ref','j:missing'],['result_contract_ref','result-contract:1']]){
  const payload=structuredClone(a.payload);payload.dependencies[0].producer[key]=value;
  const out=api.packSourceBytes(bytes,{payload});assert.equal(out.status,'rejected');assert.equal(out.reason,'READ_CORE_INVALID');
  assert.equal(out.diagnostics[0].field,'/payload/dependencies/0');assert.equal(out.diagnostics[0].subject,key==='judgment_ref'?'j:missing':null);
  assert.equal('source'in out,false);assert.equal('bytes'in out,false);
 }
});
test('same rejection gate preserves schema and native method coordinates',()=>{
 const a=input();delete a.payload.judgments[0].focus;
 const schema=core.admitBytes(F.encode(a,req));assert.equal(schema.status,'rejected');assert.equal(schema.diagnostics[0].field,'/payload/judgments/0/focus');
 const b=input();assert.equal(core.admitBytes(F.encode(b,req)).status,'accepted');b.payload.judgments[0].method.components[0].role='经验要点';
 const out=core.admitBytes(F.encode(b,req));assert.equal(out.status,'rejected');assert.equal(out.reason,'READ_CORE_INVALID');assert.equal(out.diagnostics[0].field,'/payload/judgments/0/method/components');
});
test('native guidance is immutable and uses the existing public definition',()=>{
 const components=req('@aikdna/kdna-core/components'),descriptor=components.getComponentSemanticsContract(),table=components.getNativeMethodRequirements();
 assert.equal(table.definition_digest,descriptor.definition_digest);assert.ok(Object.isFrozen(table.requirements));
 assert.deepEqual(table.requirements,[],'the former CS1 native method table is retired; R2 native roles are checked by the current semantic registry');
 const a=input();assert.equal(core.admitBytes(F.encode(a,req)).status,'accepted');a.payload.judgments[0].method.method.term='diagnostic-differential';assert.equal(core.admitBytes(F.encode(a,req)).reason,'READ_CORE_INVALID');
});
test('new authoring workflow scopes the single-candidate policy without changing interpretation',()=>{
 const policy=api.getAuthoringWorkflowContract();assert.equal(policy.id,'kdna.authoring-workflow/2');assert.equal(policy.version,'2.0.0');assert.equal(policy.minimum_candidates,1);assert.equal(Object.hasOwn(policy,'implementation'),false);assert.deepEqual(Object.keys(policy).sort(),['definition_digest','id','minimum_candidates','rules','version']);assert.match(policy.definition_digest,/^sha256:[a-f0-9]{64}$/);assert.ok(Object.isFrozen(policy.rules));
 assert.ok(policy.rules.some(x=>x.includes('creation.6')&&x.includes('never upgraded')));
 const crypto=require('node:crypto');const {definition_digest,...definition}=policy;const canonical=JSON.stringify(definition, function(key,value){return value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(k=>[k,value[k]])):value;});
 assert.equal(definition_digest,'sha256:'+crypto.createHash('sha256').update(canonical).digest('hex'));assert.throws(()=>policy.rules.push('weakened'));assert.ok(policy.rules.some(x=>x.includes('actual producer or consumer implementation identity')));
 assert.equal(req('@aikdna/kdna-core/components').getComponentSemanticsContract().definition_digest,'sha256:37e857cc4e43f7283a51ee6abe1f6e8401803902e8dc47f6d14d712aa7d7b089');
});
