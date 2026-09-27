'use strict';

// Data helpers, not Core admission, a Host witness, a transport receipt or execution.
const { clone, freeze, jcs } = require('./util.js');
const { remoteSchema } = require('./transport-validators.generated.js');
const BOUNDARY = Object.freeze({ proof: 'data-only-not-new-acceptance', input_validation: 'read-schema-shape-only', identity: 'not_verified', action_authorization: 'not_evaluated', current_run_results: 'not_evaluated' });
const METADATA = new Set(['asset_declaration', 'actor', 'attribution', 'provenance']);
const SHARED = new Set(['shared_declaration', 'boundary', 'exception', 'condition', 'material']);
const ATTRIBUTION_NOTICE = 'Metadata is a structural grouping, not a harmless-change classification. Actor, creator, attribution, provenance and declarer changes can alter authorship or authority claims and require review; none authenticates identity or grants authority.';
const same = (left, right) => jcs(left) === jcs(right);
const ordered = values => values.slice().sort((left, right) => { const a = jcs(left), b = jcs(right); return a < b ? -1 : a > b ? 1 : 0; });
const fail = (code, details = {}) => { throw Object.assign(new Error(code), { code, ...details }); };

function checked(input) {
  let envelope;
  try { envelope = clone(input); } catch { fail('READ_ANALYSIS_INPUT_INVALID'); }
  // Reuse the generated public Read schema. This wrapper exists only to invoke
  // its existing envelope branch; it does NOT invoke transport admission.
  const wrapper = { channel: 'read_envelope', http_status: envelope?.status === 'ready' ? 200 : 422, byte_length: 0, body: envelope, headers: null };
  if (!remoteSchema(wrapper)) fail('READ_ANALYSIS_ENVELOPE_INVALID', { remedy: 'Supply an unmodified current Read envelope, not a projection, Payload or response wrapper.' });
  return envelope;
}
function nodeKey(node) {
  // Keep source identities and ALL nested values. Only IR wrapper ids drift away.
  return jcs([node.target, node.owner]);
}
function category(node) {
  if (METADATA.has(node.role)) return 'metadata';
  if (node.owner_judgment_id === null && SHARED.has(node.role)) return 'shared_declarations';
  return 'domain_content';
}
function indexContent(content) {
  const byId = new Map(), byKey = new Map();
  for (const node of [...content.declarations, ...content.closure, ...content.provenance.declarations]) {
    const previous = byId.get(node.id);
    if (previous) {
      if (!same(previous, node)) fail('READ_ANALYSIS_NODE_CONFLICT', { node_id: node.id });
      continue;
    }
    const key = nodeKey(node);
    if (byKey.has(key)) fail('READ_ANALYSIS_SOURCE_AMBIGUOUS', { source_key: key, remedy: 'The supplied data does not uniquely identify these same-role source records. Do not guess from wrapper ids.' });
    byId.set(node.id, node); byKey.set(key, node);
  }
  return { byId, byKey };
}
function selectedNode(envelope, index) {
  const selected = envelope.content.selected;
  if (!selected || !envelope.content.closure.length) fail('READ_ANALYSIS_SELECTED_CONTENT_REQUIRED', { remedy: 'Read an exact selection (or an expansion containing it); whole_asset/catalog is not selected judgment content.' });
  if (selected.asset_id !== envelope.asset.asset_id || selected.asset_version !== envelope.asset.asset_version) fail('READ_ANALYSIS_SELECTION_BINDING_INVALID');
  const catalog = envelope.content.catalog;
  const selectedCatalog=catalog.filter(item=>item.judgment_id===selected.judgment_id);
  if (selectedCatalog.length !== 1) fail('READ_ANALYSIS_SELECTION_BINDING_INVALID');
  const node = index.byId.get(selectedCatalog[0].node_ref);
  if (!node || !envelope.content.closure.some(item => item.id === node.id) || node.role !== 'judgment' || node.owner_judgment_id !== selected.judgment_id || node.value.id !== selected.judgment_id) fail('READ_ANALYSIS_SELECTED_CONTENT_REQUIRED');
  return node;
}
function normalizeNode(node) { const {id, ...value}=clone(node); return value; }
function normalizedReferences(content, index) {
  return content.references.map(reference => {
    const source = index.byId.get(reference.source_node), target = index.byId.get(reference.target_node);
    if (!source || !target) fail('READ_ANALYSIS_REFERENCE_UNRESOLVED', { reference_id: reference.id, remedy: 'The supplied Read data lacks a referenced source record; request the necessary selection before comparing.' });
    const targetCategory = category(target), sourceCategory = category(source);
    const bucket = targetCategory !== 'domain_content' ? targetCategory : sourceCategory;
    return { category: bucket, value: { source: nodeKey(source), target: nodeKey(target), role: reference.role, mandatory: reference.mandatory } };
  });
}
function supply(envelope, index) {
  const content = envelope.content;
  let unresolved = 0;
  function target(id) {
    const node = index.byId.get(id);
    if (node) return { source_key: nodeKey(node) };
    // Opaque omitted targets cannot be matched across versions by hashing guesses.
    unresolved++; return { unresolved: true };
  }
  return {
    value: {
      closure: ordered(content.closure.map(nodeKey)), declarations: ordered(content.declarations.map(nodeKey)),
      catalog_judgment_ids: ordered(content.catalog.map(item => item.judgment_id)),
      omissions: ordered(envelope.omissions.map(item => ({ ...(item.state==='explicitly_omitted_batch'?{target_kind:item.target_kind,count:item.count}:{target:target(item.target)}), field: item.field, reason: item.reason, expandable: item.expandable, state: item.state }))),
      expansion_targets: ordered(content.expansion_handles.map(handle => ({ target: clone(handle.target), anchor: clone(handle.anchor), scope: ordered(handle.scope.map(target)) })))
    },
    unresolved_targets: unresolved
  };
}
function inputBinding(envelope) {
  return { asset: clone(envelope.asset), tuple: clone(envelope.tuple), snapshot_id: envelope.snapshot_id, request_id: envelope.request_id, digests: clone(envelope.digests), receipt: clone(envelope.receipt), budget: clone(envelope.budget) };
}
function summarizeRead(input) {
  const envelope = checked(input);
  if (envelope.status !== 'ready') return freeze({ kind: 'read-data-summary', status: 'unavailable', read_status: envelope.status, diagnostics: clone(envelope.diagnostics), authority: BOUNDARY });
  const content = envelope.content, index = indexContent(content);
  normalizedReferences(content, index); // Only ensure comparison references can be resolved, not semantic validity.
  const judgments = content.closure.filter(node => node.role === 'judgment');
  const dependencies = content.closure.filter(node => node.role === 'dependency').map(node => {
    const dependency = node.value;
    const producer = dependency.producer.kind === 'judgment_result' ? judgments.find(item => item.value.id === dependency.producer.judgment_ref) : content.closure.find(item => item.role === 'source' && item.value.id === dependency.producer.source_ref);
    return { definition: clone(dependency), required: dependency.required, producer_definition_supplied: Boolean(producer), producer_formation_rule_supplied: dependency.producer.kind === 'judgment_result' ? Boolean(producer && Object.hasOwn(producer.value, 'formation_rule')) : null, producer_static_result_declared: dependency.producer.kind === 'judgment_result' ? Boolean(producer && Object.hasOwn(producer.value, 'result')) : null, current_run_result: 'not_evaluated' };
  });
  const selected = content.selected;
  const selectedSupplied = selected !== null && judgments.some(node => node.value.id === selected.judgment_id);
  return freeze({
    kind: 'read-data-summary', status: 'summarized', asset: clone(envelope.asset), tuple: clone(envelope.tuple), selection: clone(selected),
    scope: { kind: selectedSupplied ? 'selected-closure' : selected ? 'selection-not-supplied' : 'unselected-catalog-or-declarations', dependency_inventory: 'disclosed-only', closure_node_count: content.closure.length, expansion_available: content.expansion_handles.length > 0, supplied_judgment_ids: judgments.map(node => node.value.id) },
    judgments: judgments.map(node => ({ judgment_id: node.value.id, question: node.value.focus, formation_rule_supplied: Object.hasOwn(node.value, 'formation_rule'), static_result_declared: Object.hasOwn(node.value, 'result'), current_run_result: 'not_evaluated' })),
    dependencies,
    shared_declarations: [...index.byKey.values()].filter(node => category(node) === 'shared_declarations').map(normalizeNode),
    authorship_and_authority_claims: { nodes: [...index.byKey.values()].filter(node => ['actor', 'attribution', 'provenance'].includes(node.role) || node.role === 'asset_declaration' && Object.hasOwn(node.value, 'creator')).map(normalizeNode), provenance: { confirmation: content.provenance.confirmation, verifier_id: content.provenance.verifier_id, evidence_ref: content.provenance.evidence_ref }, declarer_links: 'Preserved in the complete shared_declarations and node values; not authenticated.', interpretation: ATTRIBUTION_NOTICE },
    missing: clone(content.missing),
    supplied_role_counts: Object.fromEntries([...new Set(content.closure.map(node => node.role))].sort().map(role => [role, content.closure.filter(node => node.role === role).length])),
    authority: BOUNDARY
  });
}
function difference(before, after) {
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes = [];
  for (const key of keys) {
    const previous = before.get(key), next = after.get(key);
    if (previous !== undefined && next !== undefined && same(previous, next)) continue;
    changes.push({ key, kind: previous === undefined ? 'added' : next === undefined ? 'removed' : 'changed', before: previous === undefined ? null : clone(previous), after: next === undefined ? null : clone(next) });
  }
  return { changed: changes.length > 0, changes };
}
function grouped(envelope, index) {
  const result = { domain_content: new Map(), shared_declarations: new Map(), metadata: new Map() };
  for (const [key, node] of index.byKey) result[category(node)].set('node:' + key, normalizeNode(node));
  for (const reference of normalizedReferences(envelope.content, index)) {
    const key = 'reference:' + jcs([reference.value.source, reference.value.target, reference.value.role]);
    if (result[reference.category].has(key)) fail('READ_ANALYSIS_REFERENCE_AMBIGUOUS', { source_key: key });
    result[reference.category].set(key, reference.value);
  }
  for (const relation of envelope.content.relationships) {
    const key = 'relationship:' + relation.id;
    if (result.domain_content.has(key)) fail('READ_ANALYSIS_RELATIONSHIP_AMBIGUOUS', { source_key: key });
    result.domain_content.set(key, clone(relation));
  }
  result.shared_declarations.set('observed-missing-fields', ordered(envelope.content.missing));
  result.metadata.set('asset-identity', clone(envelope.asset));
  result.metadata.set('catalog-questions', ordered(envelope.content.catalog.map(item => ({ judgment_id: item.judgment_id, focus: item.focus }))));
  const provenance = envelope.content.provenance;
  result.metadata.set('provenance-claims', { confirmation: provenance.confirmation, verifier_id: provenance.verifier_id, evidence_ref: provenance.evidence_ref });
  result.metadata.set('read-state-claims', { states: clone(envelope.states), assessment: clone(envelope.assessment), diagnostics: clone(envelope.diagnostics) });
  return result;
}
function compareReadSelections(beforeInput, afterInput) {
  const before = checked(beforeInput), after = checked(afterInput);
  if (before.status !== 'ready' || after.status !== 'ready') fail('READ_ANALYSIS_READY_REQUIRED');
  if (!same(before.tuple, after.tuple)) fail('READ_ANALYSIS_TUPLE_MISMATCH');
  if (before.asset.asset_id !== after.asset.asset_id) fail('READ_ANALYSIS_ASSET_MISMATCH');
  const beforeIndex = indexContent(before.content), afterIndex = indexContent(after.content);
  selectedNode(before, beforeIndex); selectedNode(after, afterIndex);
  if (before.content.selected.judgment_id !== after.content.selected.judgment_id) fail('READ_ANALYSIS_SELECTION_MISMATCH');
  const left = grouped(before, beforeIndex), right = grouped(after, afterIndex);
  const categories = Object.fromEntries(Object.keys(left).map(key => [key, difference(left[key], right[key])]));
  categories.metadata.interpretation = ATTRIBUTION_NOTICE;
  categories.metadata.review_required = categories.metadata.changed;
  const leftSupply = supply(before, beforeIndex), rightSupply = supply(after, afterIndex);
  const observedSupplyChange = !same(leftSupply.value, rightSupply.value);
  const opaqueSupply = leftSupply.unresolved_targets > 0 || rightSupply.unresolved_targets > 0;
  return freeze({
    kind: 'read-selection-data-comparison', status: 'compared', comparison_scope: 'supplied-selected-content-only',
    selection: { asset_id: before.asset.asset_id, judgment_id: before.content.selected.judgment_id },
    input_bindings: { before: inputBinding(before), after: inputBinding(after) },
    ...categories,
    supply_scope: { changed: observedSupplyChange ? true : opaqueSupply ? null : false, observed_shape_changed: observedSupplyChange, before: leftSupply.value, after: rightSupply.value, unresolved_targets: { before: leftSupply.unresolved_targets, after: rightSupply.unresolved_targets }, opaque_target_equivalence: opaqueSupply ? 'not-established' : 'not-applicable' },
    comparison_rules: { node_identity: 'role + owner_judgment_id + authored value.id when present; ambiguous identities rejected', values: 'complete nested values retained without stripping ids or refs', references: 'source and target wrapper ids mapped to source identities; role and mandatory retained', metadata_roles: [...METADATA], shared_roles_when_owner_null: [...SHARED], metadata_is_harmless: false, unchanged_domain_implies_behavioral_equivalence: false, envelope_observations: 'request/snapshot/digests/receipt/budget retained in input_bindings, not mistaken for authored content differences', behavioral_equivalence: 'not-evaluated' },
    authority: BOUNDARY
  });
}

module.exports = { summarizeRead, compareReadSelections };
