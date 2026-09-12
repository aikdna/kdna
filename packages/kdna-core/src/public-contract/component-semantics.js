'use strict';

const {canonicalJson,utf8,compareUtf8,copyJson,freeze,reject,scalarString}=require('./strict-input.js');
const {digest}=require('./digests.js');
const {validate}=require('./validate.js');
const {types,component_semantics:registry}=require('./generated-contract.json');
const definition=registry.definition, D=registry.definition_digest;
const H=value=>digest(utf8(canonicalJson(value)));
if(H(definition)!==D)throw new Error('COMPONENT_DEFINITION_INTEGRITY');
const carriers=definition.carriers, limits=definition.limits;
const kinds=new Map(Object.entries(carriers).map(([kind,c])=>[c.id,{kind,...c}]));
const profiles=new Map(definition.profiles.map(p=>[p.component_type,p.profile_id]));
const codes={declaration:'READ_COMPONENT_DECLARATION_INVALID',content:'READ_COMPONENT_CONTENT_INVALID',reference:'READ_COMPONENT_REFERENCE_INVALID',cycle:'READ_COMPONENT_GRAPH_CYCLE',limit:'READ_COMPONENT_LIMIT_EXCEEDED',binding:'READ_COMPONENT_BINDING_INVALID',adoption:'READ_COMPONENT_ADOPTION_INVALID',presence:'READ_METHOD_PRESENCE_INVALID'};
function failure(kind,judgment=null,component=null){
 const reason=codes[kind];
 throw Object.assign(new Error(reason),{reason,component_failure:{judgment_ref:judgment,component_ref:component,status:'invalid',body:null,code:reason}});
}
function jsonValue(value,kind,j=null,c=null){
 if(value.kind==='text'||value.kind==='number'||value.kind==='boolean')return value.value;
 if(value.kind==='null')return null;
 if(value.kind==='list')return value.items.map(v=>jsonValue(v,kind,j,c));
 const out={},seen=new Set();
 for(const f of value.fields){
  if(seen.has(f.name))failure(kind,j,c);seen.add(f.name);
  Object.defineProperty(out,f.name,{value:jsonValue(f.value,kind,j,c),enumerable:true,writable:true,configurable:true});
 }
 return out;
}
// Walk only positions typed as Extension. Extension.value is opaque here.
// Discriminated unions may share fields; an extension object is visited once.
function visitExtensions(payload,callback){
 const seen=new WeakSet();
 function walk(value,shape,path){
  if(!value||typeof value!=='object')return;
  if(shape.$ref){
   const name=shape.$ref.slice(8);
   if(name==='Extension'){
    if(!seen.has(value)){seen.add(value);callback(value,path);}return;
   }
   return walk(value,types[name],path);
  }
  if(shape.properties)for(const [key,child]of Object.entries(shape.properties))if(Object.hasOwn(value,key))walk(value[key],child,[...path,key]);
  if(Array.isArray(value)&&shape.items)value.forEach((v,i)=>walk(v,shape.items,[...path,i]));
  for(const branch of [...(shape.oneOf??shape.anyOf??[]),...(shape.allOf??[])])walk(value,branch,path);
 }
 walk(payload,types.Payload,[]);
}
function checkNativeMethods(payload){
 const required=new Map(definition.native_method_requirements.map(x=>[x.term,x]));
 for(const j of payload.judgments){
  const m=j.method;if(!m||m.method.extension)continue;const r=required.get(m.method.term);if(!r)continue;
  if(r.component_types.some(type=>!m.components.some(c=>c.method.term===type&&!c.method.extension))||r.binding_roles.some(role=>!m.bindings.some(b=>b.role===role)))reject('READ_CORE_INVALID');
 }
}
function text(value,max,j,c){if(typeof value!=='string'||!value.length||value.trim()!==value||!scalarString(value,max))failure('content',j,c);}
function itemList(items,j,c,discriminators=false){
 if(!Array.isArray(items))failure('content',j,c);
 if(items.length>limits.items_per_component)failure('limit',j,c);
 const keys=new Set();
 for(const item of items){
  if(!item||typeof item!=='object'||!/^\w/.test(item.key??'')||!/^[a-z][a-z0-9-]{0,63}$/.test(item.key??''))failure('content',j,c);
  if(keys.has(item.key))failure('content',j,c);keys.add(item.key);text(item.title,limits.title_utf8_bytes,j,c);
  text(discriminators?item.prompt:item.meaning,limits.meaning_prompt_criterion_utf8_bytes,j,c);
 }
 return keys;
}
const byKey=(a,b)=>compareUtf8(a.key,b.key);
function plainProfile(type,content,j,c){
 // Limits are checked before the generated grammar so excess cannot be
 // mislabeled as missing content or silently truncated.
 if(!content||typeof content!=='object'||Array.isArray(content))failure('content',j,c);
 if(Array.isArray(content.items)&&content.items.length>limits.items_per_component)failure('limit',j,c);
 if(type==='taxonomy'&&Array.isArray(content.broader)&&content.broader.length>limits.edges_per_component)failure('limit',j,c);
 if(type==='discriminator-set'&&Array.isArray(content.items)){
  let edges=0;for(const item of content.items)if(Array.isArray(item?.contrasts))edges+=item.contrasts.length;
  if(edges>limits.edges_per_component)failure('limit',j,c);
 }
 const schema={taxonomy:'TaxonomyContent','candidate-set':'CandidateSetContent','discriminator-set':'DiscriminatorContent'}[type];
 try{validate(schema,content);}catch{failure('content',j,c);}
 const keys=itemList(content.items,j,c,type==='discriminator-set');
 if(type==='taxonomy'){
  const edgeSet=new Set(),graph=new Map([...keys].map(k=>[k,[]]));
  for(const edge of content.broader){
   if(!keys.has(edge.narrowerKey)||!keys.has(edge.broaderKey))failure('reference',j,c);
   if(edge.narrowerKey===edge.broaderKey)failure('cycle',j,c);
   const id=canonicalJson([edge.narrowerKey,edge.broaderKey]);if(edgeSet.has(id))failure('content',j,c);edgeSet.add(id);graph.get(edge.narrowerKey).push(edge.broaderKey);
  }
  const visiting=new Set(),longest=new Map();
  function depth(key,ancestors){
   if(ancestors>limits.taxonomy_path_edges)failure('limit',j,c);
   if(visiting.has(key))failure('cycle',j,c);if(longest.has(key))return longest.get(key);
   visiting.add(key);let value=0;for(const next of graph.get(key))value=Math.max(value,1+depth(next,ancestors+1));visiting.delete(key);
   if(value>limits.taxonomy_path_edges)failure('limit',j,c);longest.set(key,value);return value;
  }
  for(const key of keys)depth(key,0);
  return {kind:'taxonomy',items:copyJson(content.items).sort(byKey),broader:copyJson(content.broader).sort((a,b)=>compareUtf8(a.narrowerKey,b.narrowerKey)||compareUtf8(a.broaderKey,b.broaderKey))};
 }
 if(type==='candidate-set')return {kind:type,items:copyJson(content.items).sort(byKey)};
 // Target-dependent discriminator validation follows after all declarations.
 for(const item of content.items){
  const candidates=new Set();
  for(const contrast of item.contrasts){if(candidates.has(contrast.candidateKey))failure('content',j,c);candidates.add(contrast.candidateKey);text(contrast.criterion,limits.meaning_prompt_criterion_utf8_bytes,j,c);}
 }
 return null;
}
function resolveComponents(payload){
 const byJudgment=new Map(payload.judgments.map(j=>[j.id,j]));
 const selected=new Map(),presences=new Map(),allValues=[];let aggregate=null,totalBytes=0;
 if(payload.judgments.reduce((n,j)=>n+(j.method?.components.length??0),0)>limits.components_per_payload)failure('limit');
 for(const j of payload.judgments)if(j.method)presences.set(j.id,{components_state:'declared',bindings_state:'declared'});
 const seenPresence=new Set();
 visitExtensions(payload,(extension,path)=>{
  const registered=kinds.get(extension.id);
  if(!registered){if(extension.critical)reject('READ_INTERPRETATION_INCOMPLETE');return;}
  const judgmentPosition=path.length===4&&path[0]==='judgments'&&path[2]==='extensions';
  const payloadPosition=path.length===2&&path[0]==='extensions';
  const j=judgmentPosition?payload.judgments[path[1]]:null;
  const kind=registered.kind, errorKind=kind==='component'?'declaration':kind;
  if(!extension.critical||extension.definition!==registered.definition||(kind==='adoption'?!payloadPosition:!judgmentPosition))failure(errorKind,j?.id??null);
  const value=jsonValue(extension.value,errorKind,j?.id??null);
  if(!value||typeof value!=='object'||Array.isArray(value))failure(errorKind,j?.id??null);
  if(kind==='presence'){
   try{validate('MethodPresenceCarrier',value);}catch{failure('presence',j.id);}
   if(!j.method||value.judgment_ref!==j.id||seenPresence.has(j.id)||(value.components_state==='declared'&&value.bindings_state==='declared'))failure('presence',j.id);
   if((value.components_state==='undeclared'&&j.method.components.length)||(value.bindings_state==='undeclared'&&j.method.bindings.length))failure('presence',j.id);
   seenPresence.add(j.id);presences.set(j.id,{components_state:value.components_state,bindings_state:value.bindings_state});return;
  }
  if(kind==='adoption'){
   try{validate('ComponentAdoptionCarrier',value);}catch{failure('adoption');}
   if(aggregate)failure('adoption');aggregate=value;return;
  }
  if(!j.method||value.judgment_ref!==j.id)failure('reference',j.id);
  const component=j.method.components.find(c=>c.id===value.component_ref);
  if(!component)failure('reference',j.id);
  const c=component.id, profile=profiles.get(component.method.term);
  if(selected.has(c)||component.method.extension||!profile||value.component_type!==component.method.term||value.profile_id!==profile||value.contract_id!==definition.id||value.contract_version!==definition.version||value.definition_digest!==D)failure('declaration',j.id,c);
  let bytes;try{bytes=utf8(canonicalJson(value.content)).length;}catch{failure('content',j.id,c);}totalBytes+=bytes;
  if(bytes>limits.content_canonical_bytes||totalBytes>limits.opted_in_total_canonical_bytes)failure('limit',j.id,c);
  const body=plainProfile(component.method.term,value.content,j.id,c);
  try{validate('ComponentSemanticsCarrier',value);}catch{failure('declaration',j.id,c);}
  if(value.content_digest!==H(value.content))failure('binding',j.id,c);
  if(value.statement_origin==='mechanical_content_representation'&&component.statement!==canonicalJson(value.content))failure('declaration',j.id,c);
  if(value.component_declaration_digest!==H({component,statement_origin:value.statement_origin}))failure('binding',j.id,c);
  const bindings=j.method.bindings.filter(b=>b.component_ref===c).slice().sort((a,b)=>compareUtf8(a.role,b.role)||compareUtf8(a.target_ref,b.target_ref));
  const seen=new Set();for(const b of bindings){if(b.target_ref!==j.id||seen.has(canonicalJson(b)))failure('binding',j.id,c);seen.add(canonicalJson(b));}
  if(value.bindings_digest!==H(bindings))failure('binding',j.id,c);
  selected.set(c,{value,body,owner:j.id});allValues.push(value);
 });
 for(const [c,entry]of selected){
  const {value,owner:j}=entry;if(value.component_type!=='discriminator-set')continue;
  const target=selected.get(value.content.candidateSetRef);
  if(!target||target.owner!==j||target.value.component_type!=='candidate-set')failure('reference',j,c);
  const keys=new Set(target.value.content.items.map(x=>x.key));
  for(const item of value.content.items)for(const contrast of item.contrasts)if(!keys.has(contrast.candidateKey))failure('reference',j,c);
  entry.body={kind:'discriminator-set',candidateSetRef:value.content.candidateSetRef,candidateIndex:target.body.items.map(({key,title})=>({key,title})),items:copyJson(value.content.items).sort(byKey).map(item=>({...item,contrasts:item.contrasts.sort((a,b)=>compareUtf8(a.candidateKey,b.candidateKey))}))};
 }
 if(Boolean(aggregate)!==Boolean(selected.size))failure('adoption');
 if(aggregate){
  allValues.sort((a,b)=>compareUtf8(a.judgment_ref,b.judgment_ref)||compareUtf8(a.component_ref,b.component_ref));
  const proposals=[...new Set(allValues.map(x=>x.adoption_proposal_digest))].sort(compareUtf8);
  if(aggregate.contract_id!==definition.id||aggregate.contract_version!==definition.version||aggregate.definition_digest!==D||aggregate.declaration_set_digest!==H(allValues)||aggregate.proposal_set_digest!==H(proposals))failure('adoption');
 }
 const methods=new Map();
 for(const [id,j]of byJudgment){
  if(!j.method)continue;
  const entries=j.method.components.map(component=>{
   const common={judgment_ref:id,component_ref:component.id,component_type:component.method.term,definition_digest:D};const entry=selected.get(component.id);
   if(!entry)return {...common,status:'undeclared',declaration_digest:null,content_digest:null,profile_id:null,component_declaration_digest:null,statement_origin:null,bindings_digest:null,adoption_proposal_digest:null,authored_content:null,body:null};
   const value=entry.value;
   return {...common,status:'supported',declaration_digest:H(value),content_digest:value.content_digest,profile_id:value.profile_id,component_declaration_digest:value.component_declaration_digest,statement_origin:value.statement_origin,bindings_digest:value.bindings_digest,adoption_proposal_digest:value.adoption_proposal_digest,authored_content:copyJson(value.content),body:entry.body};
  });
  methods.set(id,{declaration:j.method,declaration_presence:presences.get(id),component_interpretations:entries});
 }
 return methods;
}
function getComponentSemanticsContract(){return freeze(copyJson(registry));}
module.exports={resolveComponents,checkNativeMethods,getComponentSemanticsContract};
