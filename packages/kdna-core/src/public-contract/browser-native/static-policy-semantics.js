'use strict';

const {canonicalJson,utf8,compareUtf8,copyJson,scalarString,reject}=require('./strict-input.js');
const {digest}=require('./digests.js');
const {validate}=require('./validate.js');
const {static_policy:registry}=require('./generated-contract.json');
const definition=registry.definition,D=registry.definition_digest,limits=definition.limits;
const H=value=>digest(utf8(canonicalJson(value)));
if(H(definition)!==D)throw new Error('STATIC_POLICY_DEFINITION_INTEGRITY');
const fail=()=>reject('READ_STATIC_POLICY_INVALID');

function decode(value){
 if(value.kind==='text'||value.kind==='number'||value.kind==='boolean')return value.value;
 if(value.kind==='null')return null;
 if(value.kind==='list')return value.items.map(decode);
 const object={},seen=new Set();
 for(const field of value.fields){if(seen.has(field.name))fail();seen.add(field.name);Object.defineProperty(object,field.name,{value:decode(field.value),enumerable:true});}
 return object;
}
function text(value,maximum){if(typeof value!=='string'||!value.length||value.trim()!==value||!scalarString(value,maximum))fail();}
function resolveStaticPolicies(payload,visitExtensions,validateCandidate){
 const result=new Map();let total=0;
 visitExtensions(payload,(extension,path)=>{
  if(extension.id!==definition.carrier.id)return;
  if(path.length!==4||path[0]!=='judgments'||path[2]!=='extensions'||!extension.critical||extension.definition!==definition.carrier.definition)fail();
  const judgment=payload.judgments[path[1]],value=decode(extension.value);
  try{validate('StaticPolicyCarrier',value);}catch(error){if(!require('./failure-state.js').info(error))throw error;fail();}
  if(value.contract_id!==definition.id||value.contract_version!==definition.version||value.definition_digest!==D||value.judgment_ref!==judgment.id||result.has(judgment.id))fail();
  const rule=value.rule,formation=judgment.formation_rule;
  if(!formation||formation.condition_refs.length!==0||formation.policy||rule.output_contract_ref!==formation.output_contract_ref||rule.output_contract_ref!==judgment.result_contract.id)fail();
  const bytes=utf8(canonicalJson(rule)).length;total+=bytes;
  if(bytes>limits.rule_canonical_bytes||total>limits.total_rule_canonical_bytes||H(rule)!==value.rule_digest)fail();
  const candidates=new Set();
  for(const candidate of rule.candidates){
   if(candidates.has(candidate.key))fail();candidates.add(candidate.key);
   text(candidate.title,limits.title_utf8_bytes);text(candidate.meaning,limits.text_utf8_bytes);
   try{validateCandidate(judgment,candidate);}catch(error){if(!require('./failure-state.js').info(error))throw error;fail();}
  }
  const entries=new Set(),priorities=new Set();
  for(const entry of rule.entries){
   if(entries.has(entry.key)||priorities.has(entry.priority)||!Number.isSafeInteger(entry.priority)||!candidates.has(entry.candidate_key))fail();
   entries.add(entry.key);priorities.add(entry.priority);text(entry.condition.statement,limits.text_utf8_bytes);
  }
  if(rule.fallback.kind==='candidate'){if(!candidates.has(rule.fallback.candidate_key))fail();}
  else text(rule.fallback.statement,limits.text_utf8_bytes);
  const normalized=copyJson(rule);normalized.candidates.sort((a,b)=>compareUtf8(a.key,b.key));
  normalized.entries.sort((a,b)=>rule.strategy.direction==='higher-first'?b.priority-a.priority:a.priority-b.priority);
  result.set(judgment.id,{contract_id:definition.id,contract_version:definition.version,definition_digest:D,judgment_ref:judgment.id,declaration_digest:H(value),rule_digest:value.rule_digest,authored_rule:copyJson(rule),rule:normalized,status:'supported'});
 });
 return result;
}
module.exports={resolveStaticPolicies,definition};
