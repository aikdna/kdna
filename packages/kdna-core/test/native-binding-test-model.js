'use strict';
const F=require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const {bindDependencyPorts}=require('./r2-test-model.js');
const KINDS=['actor','judgment','reason','source','source_use','resource','material','relationship','dependency','contract','component','boundary','exception','misuse'];
function recursion(tuple){
 const a=F.blank(tuple,3),p=a.payload,scope={kind:'judgments',judgment_refs:['j:2']};
 p.actors=[{id:'author',kind:'person',name:'Explicit synthetic author'}];
 p.declarations.boundaries={state:'provided',value:[{id:'limit',effect:'limit',statement:'A scoped authored limit.',declared_by:'author',applies_to:scope,exception_refs:['exception']}]};
 p.conditions=[{id:'when',owner_ref:{kind:'exception',id:'exception'},expression:{kind:'interpreted',statement:'A stated condition; not evaluated.'}}];
 p.exceptions=[{id:'exception',boundary_ref:'limit',statement:'Authored exception.',applies_to:scope,when:{kind:'condition',id:'when'},effect:{kind:'waive'}}];
 p.judgments[0].method.bindings=[{component_ref:'component:0',role:'author-exception-support',target:{kind:'exception',id:'exception'}}];
 return a;
}
function allKinds(tuple,digest){
 const a=recursion(tuple),p=a.payload,bytes=Buffer.from('Actual bounded resource body.');
 p.sources=[{id:'source',identity:'Authored source identity only.'}];
 p.materials=[{id:'material',kind:'attachment',statement:'Synthetic material.',source_refs:[]}];
 p.source_uses=[{id:'source-use',role:'support',source_ref:'source',target_kind:'material',target_ref:'material'}];
 p.resources=[{id:'resource',entry:'attachments/native.txt',digest:digest(bytes),media_type:'text/plain'}];
 p.reasons=[{id:'reason',role:'support',judgment_ref:'j:0',statement:'Authored reason.',component_refs:[]}];
 p.relationships=[{id:'relationship',kind:{term:'complement'},direction:'directed',participants:[{judgment_ref:'j:1',role:{term:'supplement'}},{judgment_ref:'j:0',role:{term:'base'}}],operator:{term:'complements'},effect:{term:'adds_perspective'},statement:'Independent supplement, no automatic body adoption.'}];
 p.dependencies=[{id:'dependency',producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'},consumer_judgment_ref:'j:0',input_role:'input',data_type:{term:'text'},required:false,purpose:'Explicit optional dependency.'}];bindDependencyPorts(a);
 p.misuse=[{id:'misuse',statement:'Do not mistake static support for permission.'}];
 const targets={actor:'author',judgment:'j:1',reason:'reason',source:'source',source_use:'source-use',resource:'resource',material:'material',relationship:'relationship',dependency:'dependency',contract:'result-contract:1',component:'component:1',boundary:'limit',exception:'exception',misuse:'misuse'};
 return {a,targets,entries:{'attachments/native.txt':bytes}};
}
module.exports={F,KINDS,recursion,allKinds};
