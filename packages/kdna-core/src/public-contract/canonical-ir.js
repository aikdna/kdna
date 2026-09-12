'use strict';

const { reject, canonicalJson, utf8, copyJson } = require('./strict-input.js');
const { digest } = require('./digests.js');
const { versionTuple } = require('./generated-contract.json');
const { validate } = require('./validate.js');
const {resolveComponents,checkNativeMethods}=require('./component-semantics.js');

function unique(items, key = 'id') {
  const map = new Map();
  for (const item of items) { if (map.has(item[key])) reject('READ_CORE_INVALID'); map.set(item[key], item); }
  return map;
}
function bounds(value) { if (value.maximum !== null && value.maximum < value.minimum) reject('READ_CORE_INVALID'); }
function resultShape(shape, value) {
  if (shape.kind === 'scalar') { if (value.kind !== shape.scalar_type) reject('READ_CORE_INVALID'); return; }
  if (shape.kind === 'list') {
    bounds(shape);
    if (value.kind !== 'list' || value.items.length < shape.minimum || (shape.maximum !== null && value.items.length > shape.maximum)) reject('READ_CORE_INVALID');
    for (const item of value.items) resultShape(shape.item_shape, item);
    return;
  }
  if (value.kind !== 'record') reject('READ_CORE_INVALID');
  const fields = unique(shape.fields, 'name'), actual = unique(value.fields, 'name');
  for (const field of fields.values()) { if (field.required && !actual.has(field.name)) reject('READ_CORE_INVALID'); }
  for (const field of actual.values()) { if (!fields.has(field.name)) reject('READ_CORE_INVALID'); resultShape(fields.get(field.name).shape, field.value); }
}
function validateShape(shape) {
  if(shape.kind==='list'){bounds(shape);validateShape(shape.item_shape);}
  if(shape.kind==='record'){unique(shape.fields,'name');for(const field of shape.fields)validateShape(field.shape);}
}
function validateResult(judgment) {
  const contract = judgment.result_contract; bounds(contract);validateShape(contract.shape);
  if (judgment.result) {
    const result = judgment.result;
    if (result.contract_ref !== contract.id || !contract.allowed_result_types.some(x => canonicalJson(x) === canonicalJson(result.result_type))) reject('READ_CORE_INVALID');
    resultShape(contract.shape, result.value);
    const count = result.value.kind === 'list' ? result.value.items.length : 1;
    if (count < contract.minimum || (contract.maximum !== null && count > contract.maximum)) reject('READ_CORE_INVALID');
  }
  if (judgment.formation_rule && judgment.formation_rule.output_contract_ref !== contract.id) reject('READ_CORE_INVALID');
}
function buildIR(manifest, payload, entries) {
  const definitions = new Map(), byKind = {}, nodes = [], references = [], catalog = [], ownNodes = new Map();
  function register(kind, records) {
    const map = unique(records); byKind[kind] = map;
    for (const [id, record] of map) { if (definitions.has(id)) reject('READ_CORE_INVALID'); definitions.set(id, { kind, record }); }
  }
  for (const [kind, key] of [['actor','actors'],['judgment','judgments'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['material','materials'],['relationship','relationships'],['dependency','dependencies']]) register(kind, payload[key] ?? []);
  register('result_contract', payload.judgments.map(j => j.result_contract));
  register('method_component',payload.judgments.flatMap(j=>j.method?.components??[]));
  register('boundary',[...(payload.declarations?.boundaries?.state==='provided'?payload.declarations.boundaries.value:[]),...payload.judgments.flatMap(j=>j.boundaries?.state==='provided'?j.boundaries.value:[])]);
  register('exception',payload.judgments.flatMap(j=>j.exceptions?.state==='provided'?j.exceptions.value:[]));
  register('misuse',payload.judgments.flatMap(j=>j.misuse?.state==='provided'?j.misuse.value:[]));
  const requireRef = (id, kind) => { const value = definitions.get(id); if (!value || (kind && value.kind !== kind)) reject('READ_CORE_INVALID'); return value; };
  for (const j of payload.judgments) {
    validateResult(j);
    for (const id of j.subject.actor_ids) requireRef(id, 'actor');
    for (const id of j.reason_refs ?? []) if(requireRef(id, 'reason').record.judgment_ref!==j.id)reject('READ_CORE_INVALID');
    for (const id of j.material_refs ?? []) requireRef(id, 'material');
    if (j.method) {
      const components = unique(j.method.components);
      for (const b of j.method.bindings) { if (!components.has(b.component_ref)) reject('READ_CORE_INVALID'); requireRef(b.target_ref); }
    }
    for (const condition of j.formation_rule?.conditions ?? []) {const c=condition.kind==='external_evaluator'?condition.declaration:condition;if(c.kind==='structured')for(const operand of c.operands)if(operand.kind==='dependency'){const d=requireRef(operand.dependency_ref,'dependency').record;if(d.consumer_judgment_ref!==j.id)reject('READ_CORE_INVALID');}}
    for(const x of j.exceptions?.state==='provided'?j.exceptions.value:[])if(x.boundary_ref!==null)requireRef(x.boundary_ref,'boundary');
  }
  for(const r of payload.reasons??[]){requireRef(r.judgment_ref,'judgment');for(const ref of r.component_refs)requireRef(ref,'method_component');}
  for (const b of [payload.declarations?.boundaries, ...payload.judgments.map(j => j.boundaries)]) if (b?.state === 'provided') for (const item of b.value) requireRef(item.declared_by, 'actor');
  for (const item of payload.attributions?.state === 'provided' ? payload.attributions.value : []) for (const id of item.actor_ids) requireRef(id, 'actor');
  for (const m of payload.materials ?? []) { if (m.resource_ref) requireRef(m.resource_ref, 'resource'); for (const id of m.source_refs) requireRef(id, 'source'); }
  for (const resource of payload.resources ?? []) if (!entries[resource.entry] || digest(entries[resource.entry]) !== resource.digest) reject('READ_CORE_INVALID');
  for (const use of payload.source_uses ?? []) { requireRef(use.source_ref, 'source'); requireRef(use.target_ref, use.target_kind); }
  for (const relation of payload.relationships ?? []) for (const participant of relation.participants) requireRef(participant.judgment_ref, 'judgment');
  for (const dependency of payload.dependencies ?? []) {
    requireRef(dependency.consumer_judgment_ref, 'judgment');
    if (dependency.producer.kind === 'judgment_result') {
      const producer = requireRef(dependency.producer.judgment_ref, 'judgment').record;
      if (producer.result_contract.id !== dependency.producer.result_contract_ref) reject('READ_CORE_INVALID');
    } else requireRef(dependency.producer.source_ref, 'source');
  }
  checkNativeMethods(payload);
  const methodValues=resolveComponents(payload);
  const nodeId = (role, identity) => role + ':' + digest(utf8(canonicalJson([payload.asset, identity]))).slice(7, 47);
  const sourceNodes = new Map();
  function node(role, identity, value, owner = null) {
    const item = { id: nodeId(role, identity), role, owner_judgment_id: owner, value: copyJson(value) };
    nodes.push(item);
    if (owner !== null) { if (!ownNodes.has(owner)) ownNodes.set(owner, []); ownNodes.get(owner).push(item.id); }
    return item;
  }
  const assetDeclaration = Object.fromEntries(['title','creator','license','summary','description','language','access'].filter(k => Object.hasOwn(manifest,k)).map(k => [k,manifest[k]]));
  for(const key of ['content_risk','extensions'])if(Object.hasOwn(payload,key))assetDeclaration[key]=copyJson(payload[key]);
  node('asset_declaration','asset',assetDeclaration);
  node('scope','asset-scope',payload.scope);
  if (payload.declarations) node('declaration','authored-declarations',payload.declarations);
  if (payload.cohesion) node('cohesion','cohesion',payload.cohesion);
  if (Object.hasOwn(payload,'attributions')) node('attribution','attributions',payload.attributions);
  for (const [kind, key] of [['actor','actors'],['reason','reasons'],['source','sources'],['source_use','source_uses'],['resource','resources'],['material','materials'],['relationship','relationships'],['dependency','dependencies']]) for (const value of payload[key] ?? []) sourceNodes.set(value.id,node(kind,value.id,value));
  for (const j of payload.judgments) {
    const main = node('judgment',j.id,j,j.id); sourceNodes.set(j.id,main);
    catalog.push({ judgment_id:j.id,label:j.label ?? j.focus,node_ref:main.id });
    node('subject',j.id,j.subject,j.id); node('scope',j.id,j.scope,j.id); sourceNodes.set(j.result_contract.id,node('result_contract',j.result_contract.id,j.result_contract,j.id));
    if (j.result) node('result',j.id,j.result,j.id);
    if (j.formation_rule) node('formation_rule',j.id,j.formation_rule,j.id);
    if (j.method) {const n=node('method',j.id,methodValues.get(j.id),j.id);for(const c of j.method.components)sourceNodes.set(c.id,n);}
    for (const [key,role] of [['boundaries','boundary'],['exceptions','exception'],['misuse','misuse']]) if (j[key]?.state === 'provided') j[key].value.forEach((x,i)=>sourceNodes.set(x.id,node(role,j.id+':'+i,x,j.id)));
  }
  const referenceRoles = require('./generated-contract.json').types.ReferenceRole.enum;
  function reference(from,to,mandatory,role='mandatory_support') {
    if (!referenceRoles.includes(role)) reject('READ_CORE_INVALID');
    references.push({ id:nodeId('reference',from+'\0'+to+'\0'+role),source_node:from,target_node:to,role,mandatory });
  }
  const assetIds = nodes.filter(x=>x.owner_judgment_id===null&&['asset_declaration','declaration','scope','cohesion','attribution'].includes(x.role)).map(x=>x.id);
  // Asset-level boundary declarations are carried in their typed declaration node.
  const declarationNode=nodes.find(n=>n.role==='declaration'&&n.owner_judgment_id===null);
  for(const boundary of payload.declarations?.boundaries?.state==='provided'?payload.declarations.boundaries.value:[])sourceNodes.set(boundary.id,declarationNode);
  function closedIds(judgmentId,extraDependency=null){
    const selected=new Set(assetIds),visited=new Set();
    function add(id){
      if(visited.has(id))return;visited.add(id);
      const definition=definitions.get(id),n=sourceNodes.get(id);
      if(!definition||!n)reject('READ_CORE_INVALID');selected.add(n.id);
      const r=definition.record;
      if(definition.kind==='judgment'){
        for(const own of ownNodes.get(id))selected.add(own);
        for(const ref of [...r.subject.actor_ids,...(r.reason_refs??[]),...(r.material_refs??[])])add(ref);
        // Including an owned node is not enough: traverse its registered identity
        // so exception boundaries and method-component source uses also close.
        add(r.result_contract.id);
        for(const component of r.method?.components??[])add(component.id);
        for(const key of ['boundaries','exceptions','misuse']){
          for(const declaration of r[key]?.state==='provided'?r[key].value:[])add(declaration.id);
        }
        for(const b of r.method?.bindings??[])add(b.target_ref);
        for(const c of r.formation_rule?.conditions??[]){const d=c.kind==='external_evaluator'?c.declaration:c;for(const operand of d.operands??[])if(operand.kind==='dependency')add(operand.dependency_ref);}
        for(const dependency of payload.dependencies??[])if(dependency.consumer_judgment_ref===id&&dependency.required)add(dependency.id);
        for(const relation of payload.relationships??[])if(relation.participants.some(p=>p.judgment_ref===id))add(relation.id);
      }else if(definition.kind==='reason'){add(r.judgment_ref);for(const ref of r.component_refs)add(ref);}
      else if(definition.kind==='material'){if(r.resource_ref)add(r.resource_ref);for(const ref of r.source_refs)add(ref);}
      else if(definition.kind==='method_component'||definition.kind==='result_contract'){if(n.owner_judgment_id)add(n.owner_judgment_id);}
      else if(definition.kind==='source_use'){add(r.source_ref);add(r.target_ref);}
      else if(definition.kind==='dependency'){add(r.consumer_judgment_ref);add(r.producer.kind==='judgment_result'?r.producer.judgment_ref:r.producer.source_ref);}
      else if(definition.kind==='relationship')for(const member of r.participants)add(member.judgment_ref);
      else if(definition.kind==='boundary')add(r.declared_by);
      else if(definition.kind==='exception'&&r.boundary_ref!==null)add(r.boundary_ref);
      for(const use of payload.source_uses??[])if(use.target_ref===id)add(use.id);
    }
    for(const boundary of payload.declarations?.boundaries?.state==='provided'?payload.declarations.boundaries.value:[])add(boundary.declared_by);
    for(const claim of payload.attributions?.state==='provided'?payload.attributions.value:[])for(const actor of claim.actor_ids)add(actor);
    add(judgmentId);if(extraDependency)add(extraDependency);
    return nodes.filter(n=>selected.has(n.id)).map(n=>n.id);
  }
  const selection=id=>({asset_id:payload.asset.asset_id,asset_version:payload.asset.asset_version,judgment_id:id});
  const mandatory_closures=payload.judgments.map(j=>({selection:selection(j.id),node_ids:closedIds(j.id)}));
  for(const closure of mandatory_closures){const from=sourceNodes.get(closure.selection.judgment_id).id;for(const id of closure.node_ids)if(id!==from)reference(from,id,true);}
  const expansion_targets=(payload.dependencies??[]).filter(d=>!d.required).map(d=>({selection:selection(d.consumer_judgment_ref),target:sourceNodes.get(d.id).id,scope:closedIds(d.consumer_judgment_ref,d.id)}));
  for(const target of expansion_targets)reference(sourceNodes.get(target.selection.judgment_id).id,target.target,false,'optional_expansion');
  const ir={contract:versionTuple.ir,tuple:versionTuple,asset:payload.asset,nodes,catalog,references,relationships:payload.relationships??[],mandatory_closures,expansion_targets};
  validate('CanonicalIR',ir);
  return ir;
}
module.exports = { buildIR, validateResult, resultShape };
