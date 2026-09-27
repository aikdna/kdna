import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),Ajv=require('ajv/dist/2020.js');
const source=JSON.parse(fs.readFileSync(new URL('../../specs/public-semantic-source.json',import.meta.url))),p=source.external_grant_issuer;
test('issuer definitions keep exact result arms and two callables',()=>{
 assert.deepEqual(p.runtime_exports,['getExternalGrantIssuerContract','issueExternalKeyGrantForAsset']);
 assert.equal(p.id,'kdna.external-grant-issuer/1');assert.equal(p.version,'1.0.0');
 assert.equal(p.types.IssuerFailedObservation.oneOf.length,6);
 assert.deepEqual(p.types.IssuerAdmissionObservation.oneOf.map(x=>[x.properties.status.const,x.properties.interpretation.const]),[['accepted','complete'],['catalog_only','blocked']]);
 assert.equal(p.types.IssuerIssuedObservation.additionalProperties,false);
 assert.equal(p.schema_path,'specs/external-grant-issuer-r2-binding-7.schema.json');
 assert.equal(p.schema_id,'urn:kdna:schema:external-grant-issuer:1.0.0:binding:r2:7');
 const schema=JSON.parse(fs.readFileSync(new URL('../../'+p.schema_path,import.meta.url))),valid=new Ajv({strict:false,validateFormats:false}).compile(schema);
 for(const arm of p.types.IssuerFailedObservation.oneOf){const value={status:'issuer_failed',code:arm.properties.code.const,stage:arm.properties.stage.enum[0]};assert.equal(valid(value),true);for(const key of ['plaintext','IR','grantBytes','catalog','A'])assert.equal(valid({...value,[key]:'leak'}),false);}
 assert.equal(valid({status:'core_rejected',stage:'asset',core:{status:'rejected',reason:'READ_CORE_INVALID'}}),true);
 assert.equal(valid({status:'core_rejected',stage:'asset',core:{status:'rejected',reason:'READ_CORE_INVALID',diagnostics:[]}}),false);
 assert.ok(!source.diagnostic_registry.some(x=>x.startsWith('ISSUER_')));
});
test('issuer registration rejects cross-scope duplicates coverage gaps and false runtime claims',async()=>{
 const {generate}=await import('./generate.mjs'),os=await import('node:os'),path=await import('node:path');
 const root=new URL('../../',import.meta.url).pathname,dir=fs.mkdtempSync(path.join(os.tmpdir(),'issuer-scope-'));
 try{
  assert.equal(generate(['--source',path.join(root,'specs/public-semantic-source.json'),'--root',root,'--out-dir',root,'--check']).status,'CHECK_MATCH','The unchanged current source passes before negative mutations');
  const changes=[
   ['scope collision',s=>s.external_grant_issuer.non_schema_rules[0].id=s.non_schema_rules[0].id,/^duplicate non-schema rule across contract scopes:/],
   ['coverage gap',s=>delete s.external_grant_issuer.rule_coverage['ISSUER-RESULT'],/^rule_coverage must cover exactly/],
   ['false runtime claim',s=>s.external_grant_issuer.runtime_enforcement_claims['ISSUER-GRANT'].runtime_enforcement='none',/^runtime_enforcement_claims disagree/],
   ['inconsistent unimplemented claim',s=>s.external_grant_issuer.runtime_not_implemented.push('ISSUER-GRANT'),/^rule_coverage runtime_units must be empty for a runtime_not_implemented rule: ISSUER-GRANT$/],
   ['type collision',s=>s.external_grant_issuer.types.Manifest=s.types.Manifest,/^issuer type collision$/],
   ['undeclared export',s=>s.external_grant_issuer.runtime_exports.push('unsafeSign'),/^issuer surface drift$/],
  ];
  let index=0;
  for(const [name,change,reason] of changes){
   const bad=structuredClone(source);change(bad);const file=path.join(dir,String(index++)+'.json');fs.writeFileSync(file,JSON.stringify(bad));
   assert.throws(()=>generate(['--source',file,'--root',root,'--out-dir',root,'--check']),error=>error.code==='SOURCE'&&reason.test(error.message),name+' must reach its own rule, not pin/navigation or unrelated validation');
  }
  }finally{fs.rmSync(dir,{recursive:true});}
});

// IssuerAdmissionObservation retains a catalog-only observation shape for history.
// Schema representability cannot claim that the current Core can issue that state.
test('current Core refuses unknown critical content before an issuer catalog-only result can exist',()=>{
 const F=require('../../conformance/public-contract/test/bytes-fixtures.cjs');
 const core=require('@aikdna/kdna-core');
 const asset=F.blank(source.versionTuple);
 assert.equal(core.admitBytes(F.encode(asset,require)).status,'accepted');
 asset.payload.extensions=[{id:'urn:definition-test:unknown',critical:true,definition:'Future meaning is intentionally not implemented.',value:{kind:'text',value:'opaque'}}];
 const rejected=core.admitBytes(F.encode(asset,require));
 assert.equal(rejected.status,'rejected');assert.equal(rejected.reason,'READ_UNSUPPORTED_CRITICAL');
 assert.deepEqual(rejected.states,{core:'valid',interpretation:'blocked'});
 assert.ok(rejected.diagnostics.some(x=>x.code==='READ_UNSUPPORTED_CRITICAL'));
 for(const key of ['snapshot','catalog','operation','grantBytes','IR'])assert.equal(Object.hasOwn(rejected,key),false,key+' must not leak authority or content');
});
