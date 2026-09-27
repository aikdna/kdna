import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const source=JSON.parse(fs.readFileSync(path.join(root,'specs/public-semantic-source.json'),'utf8'));
const scratch=process.env.KDNA_PROTECTION_TEST_ARTIFACT_ROOT;
assert.ok(scratch,'Explicit isolated test artifact root required.');
fs.mkdirSync(scratch,{recursive:true});
function rejects(id,mutate,pattern){
 const changed=structuredClone(source);mutate(changed);
 const input=path.join(scratch,id+'.json');fs.writeFileSync(input,JSON.stringify(changed));
 const argv=['scripts/public-contract/generate.mjs','--source',input,'--root',root,'--out-dir',root,'--check'];
 const result=spawnSync(process.execPath,argv,{cwd:root,encoding:'utf8'});
 fs.writeFileSync(path.join(scratch,id+'.result.json'),JSON.stringify({argv,status:result.status,stdout:result.stdout,stderr:result.stderr},null,2)+'\n');
 assert.equal(result.status,1,id);
 const failure=JSON.parse(result.stderr);
 assert.equal(failure.status,'ERROR',id);assert.equal(failure.code,'SOURCE',id+' must not stop at pin/navigation/tool checks');
 assert.match(failure.message,pattern,id);
}
test('each rule scope rejects missing registration, false implementation and nonexistent evidence equally',()=>{
 const control=spawnSync(process.execPath,['scripts/public-contract/generate.mjs','--source','specs/public-semantic-source.json','--root',root,'--out-dir',root,'--check'],{cwd:root,encoding:'utf8'});
 fs.writeFileSync(path.join(scratch,'unmodified-control.result.json'),JSON.stringify({status:control.status,stdout:control.stdout,stderr:control.stderr},null,2)+'\n');
 assert.equal(control.status,0,control.stdout+control.stderr);assert.equal(JSON.parse(control.stdout).status,'CHECK_MATCH');
 for(const scope of ['base','protection']){
  const table=s=>scope==='base'?s.engineering:s.protection_admission;
  const id=scope==='base'?'PUBLIC-BYTES':'PROTECTION-PRESENCE';
  rejects(scope+'-missing-coverage',s=>delete table(s).rule_coverage[id],/rule_coverage must cover exactly/);
  rejects(scope+'-missing-claim',s=>delete table(s).runtime_enforcement_claims[id],/runtime_enforcement_claims must cover exactly/);
  rejects(scope+'-extra-coverage',s=>table(s).rule_coverage['UNREGISTERED']=table(s).rule_coverage[id],/rule_coverage must cover exactly/);
  rejects(scope+'-false-runtime-claim',s=>table(s).runtime_enforcement_claims[id].runtime_enforcement='none',/runtime_enforcement_claims disagree/);
  rejects(scope+'-missing-proof',s=>table(s).rule_coverage[id].proof=[{gate:'protection-definition',cases:['NOT-A-REGISTERED-CASE']}],/proof case does not exist/);
  rejects(scope+'-bad-type',s=>(scope==='base'?s.non_schema_rules:s.protection_admission.non_schema_rules).find(r=>r.id===id).applies_to=['UnknownType'],/invalid non-schema mapping/);
 }
});
test('contract scope collisions, cross-scope rows and undeclared runtime are rejected',()=>{
 rejects('missing-current-decision-vector',s=>s.engineering.rule_coverage['PUBLIC-DIGESTS'].proof=[{gate:'decision-vectors',cases:['NOT-A-CURRENT-DECISION-VECTOR']}],/proof case does not exist in gate decision-vectors for PUBLIC-DIGESTS: NOT-A-CURRENT-DECISION-VECTOR/);
 rejects('duplicate-global-rule',s=>s.protection_admission.non_schema_rules.push(s.non_schema_rules[0]),/duplicate non-schema rule across contract scopes/);
 rejects('duplicate-local-rule',s=>s.protection_admission.non_schema_rules.push(s.protection_admission.non_schema_rules[0]),/duplicate non-schema rule across contract scopes/);
 rejects('foreign-coverage-row',s=>s.protection_admission.rule_coverage['PUBLIC-BYTES']=s.engineering.rule_coverage['PUBLIC-BYTES'],/rule_coverage must cover exactly/);
 rejects('foreign-not-implemented',s=>s.protection_admission.runtime_not_implemented.push('PUBLIC-BYTES'),/runtime_not_implemented must be an array of non-schema rule ids/);
 rejects('missing-not-implemented',s=>s.protection_admission.rule_coverage['PROTECTION-PRESENCE'].runtime_units=[],/needs a runtime unit or a runtime_not_implemented entry/);
 rejects('duplicate-not-implemented',s=>s.protection_admission.runtime_not_implemented.push('PROTECTION-PRESENCE','PROTECTION-PRESENCE'),/runtime_not_implemented must be an array/);
 rejects('undeclared-rule',s=>s.protection_admission.non_schema_rules.shift(),/protection rules must exactly reference/);
 rejects('rule-reference-mismatch',s=>s.protection_admission.rules['PROTECTION-PRESENCE']='different requirement',/protection rule requirement\/reference mismatch/);
 rejects('rule-source-unit-missing',s=>{s.protection_admission.runtime_not_implemented.shift();s.protection_admission.rule_coverage['PROTECTION-PRESENCE'].runtime_units=['missing-source.js:1'];},/implementation site is not a file/);
 rejects('wrong-module-version',s=>s.protection_admission.version='2.0.0',/unexpected protection definition coordinate/);
 rejects('wrong-module-schema',s=>s.protection_admission.schema_id='urn:wrong',/unexpected protection definition coordinate/);
 rejects('wrong-checksum-coordinate',s=>s.protection_admission.checksums.version='0.1.0',/unexpected checksums definition coordinate/);
 rejects('unresolved-contract-reference',s=>s.protection_admission.types.ProtectionExternalCommitUnknown.properties.attempt_id={$ref:'#/$defs/AbsentType'},/unresolved or nonlocal reference/);
});
