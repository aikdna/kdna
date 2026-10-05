'use strict';

const { canonicalJson, utf8, copyJson, compareUtf8 } = require('./canonical-json-shim.js');
const { digest } = require('./digests.js');
const { versionTuple } = require('./generated-contract.json');
const { validate } = require('./validate.js');
const { resolveComponents, visitExtensions, checkInterpretationComplete } = require('./component-semantics.js');
const { resolveStaticPolicies } = require('./static-policy-semantics.js');
const { validateR2 } = require('./r2-semantics.js');
const { ref, values } = require('./r2-registry.js');
const { validateResult, resultShape } = require('./r2-values.js');

const ROLES = Object.freeze({asset:'asset_declaration',contract:'result_contract',component:'method_component',unit:'method_unit',plan:'method_plan',plan_node:'method_instance',policy:'conditional_policy',branch_entry:'branch'});
function buildIR(manifest,payload,entries) {
  const registry = validateR2(manifest,payload,entries);
  const visit = (value,callback) => {
    visitExtensions(manifest,(extension,path) => callback(extension,['manifest',...path]),'Manifest');
    visitExtensions(value,callback);
  };
  const methodValues = resolveComponents(payload,visit);
  // The versioned static-policy carrier preserves its first-match meaning.
  // It is never implicitly rewritten as an R2 all-matches or authored policy.
  const policyValues = resolveStaticPolicies(payload,visit,(judgment,candidate) => validateResult({...judgment,result:{contract_ref:judgment.result_contract.id,result_type:candidate.result_type,value:candidate.value}}));
  const assetValue = {};
  for (const name of ['asset_id','asset_type','asset_uid','version','judgment_version','title','summary','languages','created_at','updated_at','creator','license','access','description','keywords','lineage','encryption','entitlement']) if (Object.hasOwn(manifest,name)) assetValue[name] = copyJson(manifest[name]);
  for (const name of ['scope','kernel','reading_order','cohesion','attributions','content_risk','extensions']) if (Object.hasOwn(payload,name)) assetValue[name] = copyJson(payload[name]);
  // Child targets have their own permission and delivery identity. A parent
  // overview must not smuggle deferred history or scoped boundary bodies inline.
  assetValue.history = {coverage:manifest.history.coverage,statement:manifest.history.statement};
  assetValue.declarations = {highest_question:copyJson(payload.declarations.highest_question)};
  if (payload.declarations.boundaries) assetValue.declarations.boundaries = {state:payload.declarations.boundaries.state};
  registry.get(registry.asset).value = assetValue;
  const nodes = [], nodeMap = new Map(), references = [];
  const stableId = (role,identity) => role + ':' + digest(utf8(canonicalJson([payload.asset,identity]))).slice(7,47);
  for (const record of registry.ordered) {
    const role = record.value?.kind === 'emission_list' && record.target.kind === 'contract' ? 'emission_list_contract' : ROLES[record.target.kind] ?? record.target.kind;
    const node = {id:stableId(role,record.target),role,target:copyJson(record.target),owner:copyJson(record.owner),owner_judgment_id:record.judgment,value:copyJson(record.value)};
    if (record.activation) node.activation = copyJson(record.activation);
    if (record.target.kind === 'judgment') {
      node.method_interpretation = copyJson(methodValues.get(record.target.id));
      if (policyValues.has(record.target.id)) node.static_policy_interpretation = copyJson(policyValues.get(record.target.id));
    }
    nodes.push(node); nodeMap.set(registry.identity(record.target),node);
  }
  const nodeFor = target => nodeMap.get(registry.identity(target));
  for (const record of registry.ordered) for (const [targetKey,roles] of registry.referenceRoles.get(registry.identity(record.target))) {
    const from = nodeFor(record.target), to = nodeMap.get(targetKey);
    if (from.id === to.id) continue;
    const meanings=[...roles].map(([declaredRole,mandatory])=>({declaredRole,mandatory,role:declaredRole??(mandatory?'mandatory_support':'optional_expansion')})).sort((a,b)=>compareUtf8(a.role,b.role));
    for(const {declaredRole,mandatory,role} of meanings) {
      const identity=[record.target,to.target,mandatory];
      if(declaredRole!==null)identity.push(declaredRole);
      references.push({id:stableId('reference',identity),source_node:from.id,target_node:to.id,role,mandatory});
    }
  }
  const selection = id => ({asset_id:payload.asset.asset_id,asset_version:payload.asset.asset_version,judgment_id:id});
  const catalog = payload.judgments.map(j => ({judgment_id:j.id,focus:j.focus,node_ref:nodeFor(ref('judgment',j.id)).id,parent_ref:j.parent_ref,...(j.lifecycle?{lifecycle:copyJson(j.lifecycle)}:{})}));
  const mandatory_closures = payload.judgments.map(j => ({selection:selection(j.id),node_ids:registry.closure([registry.asset,ref('judgment',j.id)]).map(record => nodeFor(record.target).id)}));
  const globalSeeds = [registry.asset,...payload.relationships.map(x => ref('relationship',x.id)),...payload.dependencies.map(x => ref('dependency',x.id))];
  // Organization records are complete in whole_asset. Merely listing a
  // dependency does not request its producer body; exact_selection separately
  // traverses a required dependency through the typed graph above.
  const globalRecords = registry.closure([registry.asset,...values(payload.declarations.boundaries).map(b => ref('boundary',b.id))]);
  const globalIds = new Set(globalRecords.map(record => nodeFor(record.target).id));
  for (const target of globalSeeds) globalIds.add(nodeFor(target).id);
  const asset_closure = nodes.filter(n => globalIds.has(n.id)).map(n => n.id);
  function display(record) {
    const v = record.value;
    if (record.target.kind === 'judgment') return v.focus;
    if (record.target.kind === 'asset') return v.title;
    if (record.target.kind === 'material' && v.kind === 'definition') return v.term;
    if (record.target.kind === 'example') return v.title;
    return v.name ?? v.role ?? record.target.kind + ':' + record.target.id;
  }
  const asset_index = registry.ordered.map(record => ({target:copyJson(record.target),owner:copyJson(record.owner),display_name:display(record),node_ref:nodeFor(record.target).id}));
  const expansion_targets = [];
  const scopeFor = seeds => registry.closure(seeds).map(record => nodeFor(record.target).id);
  for (const record of registry.ordered) expansion_targets.push({anchor:{kind:'asset'},target:copyJson(record.target),scope:scopeFor([registry.asset,record.target])});
  // A question discovers its necessary closure and the optional references of
  // those objects. Asset ownership alone is not a relationship to every question.
  // Do not traverse optional edges recursively: an optional related question's
  // own optional neighborhood belongs to that question or the asset anchor.
  for (const judgment of payload.judgments) {
    const seeds = [registry.asset,ref('judgment',judgment.id)], mandatory = registry.closure(seeds);
    const available = new Set(mandatory.map(record => registry.identity(record.target)));
    for (const record of mandatory) {
      if (record.target.kind === 'asset') continue;
      for (const targetKey of registry.edges.get(registry.identity(record.target)).keys()) available.add(targetKey);
    }
    for (const record of registry.ordered) if (available.has(registry.identity(record.target))) expansion_targets.push({anchor:{kind:'judgment',selection:selection(judgment.id)},target:copyJson(record.target),scope:scopeFor([...seeds,record.target])});
  }
  const ir = {contract:versionTuple.ir,tuple:versionTuple,asset:payload.asset,nodes,catalog,references,relationships:payload.relationships,mandatory_closures,expansion_targets,asset_closure,asset_index,unresolved_external:registry.unresolved};
  validate('CanonicalIR',ir);
  checkInterpretationComplete(payload,visit);
  return ir;
}
module.exports = { buildIR, validateResult, resultShape };
