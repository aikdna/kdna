'use strict';
const C = require('./retained-common.js');
const {selectedContext} = require('./selected-context.generated.js');
const same = (a,b) => C.strict.canonicalJson(a) === C.strict.canonicalJson(b);
function need(value, code) { C.need(value, code); }
function normalize(request, view) {
  const result = structuredClone(request);
  if (!result.selection) return result;
  const selection = result.selection;
  need(selection.asset_id === view.asset.asset_id, 'READ_ASSET_MISMATCH');
  need(selection.asset_version === view.asset.asset_version, 'READ_ASSET_VERSION_MISMATCH');
  const catalog = view.ir?.catalog ?? view.catalog;
  const wanted = new Set(selection.judgment_ids);
  for (const id of wanted) {
    const count = catalog.filter(row => row.judgment_id === id).length;
    need(count > 0, 'READ_SELECTION_NOT_FOUND');
    need(count === 1, 'READ_SELECTION_AMBIGUOUS');
  }
  selection.judgment_ids = catalog.filter(row => wanted.has(row.judgment_id)).map(row => row.judgment_id);
  return result;
}
function plan(request, view) {
  const ir = view.ir;
  if (request.mode === 'catalog') {
    const catalog = ir?.catalog ?? view.catalog, index = ir?.asset_index ?? view.asset_index;
    return {node_ids:[], descriptor_ids:[...new Set([...catalog,...index].map(x=>x.node_ref))], targets:[], unresolved:false};
  }
  const nodes = new Map(ir.nodes.map(n=>[n.id,n]));
  const asset = ir.nodes.find(n=>n.role==='asset_declaration');
  const anchor = request.selection === null ? {kind:'asset'} : {kind:'selection_set',selection:request.selection};
  const seeds = [asset.id];
  if (request.selection) for (const id of request.selection.judgment_ids) seeds.push(ir.catalog.find(x=>x.judgment_id===id).node_ref);
  function closure(input) {
    const found = new Set(input), queue = [...input];
    for (let i=0;i<queue.length;i++) for (const edge of ir.references) {
      if (edge.mandatory && edge.source_node===queue[i] && !found.has(edge.target_node)) {
        need(nodes.has(edge.target_node), 'READ_PROJECTION_INVALID');
        found.add(edge.target_node); queue.push(edge.target_node);
      }
    }
    return ir.nodes.filter(n=>found.has(n.id)).map(n=>n.id);
  }
  let ids, targets=[];
  if (request.mode === 'whole_asset') {
    ids = ir.asset_closure;
    targets = ir.expansion_targets.filter(x=>x.anchor.kind==='asset').map(x=>({anchor,target:x.target,scope:x.scope}));
  } else if (request.mode === 'exact_selection') {
    const union = new Set();
    for (const id of request.selection.judgment_ids) {
      const row = ir.mandatory_closures.find(x=>x.selection.judgment_id===id);
      need(row, 'READ_PROJECTION_INVALID');
      for (const node of row.node_ids) union.add(node);
    }
    ids = ir.nodes.filter(n=>union.has(n.id)).map(n=>n.id);
    const available = new Set(ids);
    for (const edge of ir.references) if (union.has(edge.source_node) && edge.source_node!==asset.id) available.add(edge.target_node);
    targets = ir.nodes.filter(n=>available.has(n.id)).map(n=>({anchor,target:n.target,scope:closure([...seeds,n.id])}));
  } else {
    const handle = request.handle;
    need(same(handle.asset,view.asset), 'READ_HANDLE_ASSET_MISMATCH');
    need(same(handle.tuple,view.tuple), 'READ_HANDLE_VERSION_MISMATCH');
    need(same(handle.anchor,anchor), 'READ_HANDLE_ASSET_MISMATCH');
    const target = ir.nodes.find(n=>same(n.target,handle.target));
    need(target, 'READ_HANDLE_SCOPE_MISMATCH');
    ids = closure([...seeds,target.id]);
    need(same(ids,handle.scope), 'READ_HANDLE_SCOPE_MISMATCH');
  }
  const scoped = request.mode === 'exact_selection' || request.mode === 'expand' ? selectedContext(ir,ids) : null;
  const supplied = new Set(ids);
  if (!scoped) for (const node of ir.nodes) if (node.role==='asset_declaration') supplied.add(node.id);
  const byTarget = new Map(targets.map(x=>[C.strict.canonicalJson(x.target),x]));
  const index = [];
  for (const descriptor of ir.asset_index) {
    const node = nodes.get(descriptor.node_ref), target=byTarget.get(C.strict.canonicalJson(descriptor.target));
    need(node, 'READ_PROJECTION_INVALID');
    if (request.mode==='expand' && !supplied.has(node.id)) continue;
    if (request.mode!=='whole_asset' && node.role==='judgment' && !supplied.has(node.id)) continue;
    if (request.mode!=='whole_asset' && !supplied.has(node.id) && !target) continue;
    need(supplied.has(node.id)||target, 'READ_PROJECTION_INVALID');
    index.push(descriptor);
  }
  const catalog=scoped?.catalog??ir.catalog;
  const deferred=index.filter(x=>!supplied.has(x.node_ref));
  const issued=deferred.map(x=>byTarget.get(C.strict.canonicalJson(x.target)));
  const typed = new Set(ir.nodes.filter(n=>supplied.has(n.id)).map(n=>C.strict.canonicalJson(n.target)));
  return {node_ids:ids,descriptor_ids:[...new Set([...catalog,...index].map(x=>x.node_ref))],targets:issued,
    unresolved:(ir.unresolved_external??[]).some(x=>x.mandatory&&typed.has(C.strict.canonicalJson(x.source))),index};
}
module.exports = {normalize,plan,same};
