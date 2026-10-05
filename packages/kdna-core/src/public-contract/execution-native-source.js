'use strict';
const C = require('./execution-native-common.js');
const native = require('./sections-node.js');
const protectedState = require('./protected-payload-state.js');
const {isProtectedSnapshot} = require('./brand.js');
const {selectedContext} = require('./selected-context.generated.js');
const originTuple = require('./sections/contract.json').module.versionTuple;
const same = (a, b) => C.strict.canonicalJson(a) === C.strict.canonicalJson(b);
function inspectNative(snapshot) { return native.inspectWholeSectionSnapshot(snapshot); }
function origin(snapshot) {
  const view = inspectNative(snapshot);
  if (!view) {
    if (native.inspectSectionSnapshot(snapshot) || protectedState.inspectSnapshot(snapshot) || protectedState.operation(snapshot) || isProtectedSnapshot(snapshot)) C.fail('EXECUTION_SOURCE_UNSUPPORTED');
    C.fail('EXECUTION_SOURCE_UNATTESTED');
  }
  if (!same(view.tuple, originTuple)) C.fail('EXECUTION_VERSION_UNSUPPORTED');
  const proof = view.verification;
  if (proof.mode !== 'whole_asset' || proof.semantic_status !== 'verified_whole_graph' || proof.routing_integrity !== 'checked' || proof.unchecked_sections.length !== 0) C.fail('EXECUTION_SOURCE_UNSUPPORTED');
  const fields = [['whole_container_digest','A'],['whole_content_digest','C'],['runtime_entry_digest','E']];
  for (const [field, name] of fields) {
    if (proof[field].status !== 'verified' || proof[field].digest !== view.digests[name].observed) C.fail('EXECUTION_BINDING_INVALID');
  }
  if (proof.ir_digest.status !== 'verified') C.fail('EXECUTION_SOURCE_UNSUPPORTED');
  return view;
}
function sourceSelection(snapshot, input) {
  const view = origin(snapshot), selection = C.inputCopy(input);
  const keys = ['asset_id','asset_version','judgment_ids'];
  if (!selection || Array.isArray(selection) || Object.keys(selection).length !== keys.length || Object.keys(selection).some(k => !keys.includes(k)) || !C.strict.identifier(selection.asset_id) || !C.strict.identifier(selection.asset_version) || !Array.isArray(selection.judgment_ids) || selection.judgment_ids.length === 0 || selection.judgment_ids.some(id => !C.strict.identifier(id))) C.fail('EXECUTION_SELECTION_INVALID');
  if (selection.asset_id !== view.asset.asset_id || selection.asset_version !== view.asset.asset_version) C.fail('EXECUTION_SELECTION_INVALID');
  const wanted = new Set(selection.judgment_ids);
  for (const id of wanted) if (view.ir.catalog.filter(row => row.judgment_id === id).length !== 1) C.fail('EXECUTION_SELECTION_INVALID');
  selection.judgment_ids = view.ir.catalog.filter(row => wanted.has(row.judgment_id)).map(row => row.judgment_id);
  const union = new Set(), byId = new Map(view.ir.nodes.map(node => [node.id, node]));
  for (const judgment_id of selection.judgment_ids) {
    const single = {asset_id:selection.asset_id, asset_version:selection.asset_version, judgment_id};
    const matches = view.ir.mandatory_closures.filter(row => same(row.selection, single));
    if (matches.length !== 1) C.fail('EXECUTION_SELECTION_INVALID');
    for (const id of matches[0].node_ids) {
      if (!byId.has(id)) C.fail('EXECUTION_BINDING_INVALID');
      union.add(id);
    }
  }
  const ids = view.ir.nodes.filter(node => union.has(node.id)).map(node => node.id);
  const suppliedTargets = new Set(ids.map(id => C.strict.canonicalJson(byId.get(id).target)));
  if (view.ir.unresolved_external.some(ref => ref.mandatory && suppliedTargets.has(C.strict.canonicalJson(ref.source)))) C.fail('EXECUTION_UNRESOLVED_EXTERNAL');
  const source = {asset:view.asset, origin_tuple:view.tuple, digests:view.digests, ir_digest:view.verification.ir_digest.digest};
  // Preserve complete original pure selectedContext semantics, including absence/order.
  return {source, selection, ...selectedContext(view.ir, ids)};
}
module.exports = {inspectNative, sourceSelection};
