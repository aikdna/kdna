'use strict';
const { selectedContext } = require('./selected-context.generated.js');
const { assetCapability, bodyFor, folded, projectionFailure } = require('./project.js');
const { jcs, clone, assessment } = require('./util.js');
function selectionBase(request, view) {
    if (request.selection === null)
        return new Set(view.ir.asset_closure);
    const wanted = new Set(request.selection.judgment_ids), rows = view.ir.mandatory_closures.filter(x => wanted.has(x.selection.judgment_id));
    return new Set(rows.flatMap(x => x.node_ids));
}
function availableTargets(request, view) {
    const ir = view.ir;
    if (request.selection === null)
        return ir.expansion_targets.filter(t => t.anchor.kind === 'asset');
    const wanted = new Set(request.selection.judgment_ids), available = new Set(ir.expansion_targets.filter(t => t.anchor.kind === 'judgment' && wanted.has(t.anchor.selection.judgment_id)).map(t => jcs(t.target))), base = selectionBase(request, view);
    return ir.expansion_targets.filter(t => t.anchor.kind === 'asset' && available.has(jcs(t.target))).map(t => {
        const ids = new Set([...base, ...t.scope]);
        return {
            ...t, anchor: {
                kind: 'selection_set', selection: clone(request.selection)
            }, scope: ir.nodes.filter(n => ids.has(n.id)).map(n => n.id)
        };
    });
}
function project(request, view) {
    const ir = view.ir;
    if (request.mode === 'catalog')
        return {
            content: {
                catalog: clone(ir.catalog), asset_index: clone(ir.asset_index)
            }, diagnostics: [], omissions: [], assessment: assessment(), targets: []
        };
    const targets = availableTargets(request, view);
    if (request.mode === 'whole_asset') {
        const unavailable = projectionFailure(request, view);
        if (unavailable)
            throw Error(unavailable);
        const body = clone(bodyFor(request, view));
        if (!body)
            throw Error('READ_PROJECTION_INVALID');
        return {
            ...body, targets
        };
    }
    let ids = selectionBase(request, view);
    if (request.mode === 'expand') {
        const t = targets.find(t => jcs(t.target) === jcs(request.handle.target));
        if (!t || jcs(t.scope) !== jcs(request.handle.scope))
            throw Error('READ_HANDLE_SCOPE_MISMATCH');
        ids = new Set(t.scope);
    }
    // Preserve the original projectionFailure rule for the complete normalized
    // selection/expansion closure, rather than only checking each single anchor.
    const supplied = new Set(ir.nodes.filter(n => ids.has(n.id)).map(n => jcs(n.target)));
    if ((ir.unresolved_external ?? []).some(ref => ref.mandatory && supplied.has(jcs(ref.source))))
        throw Error('READ_UNRESOLVED_EXTERNAL');
    const ordered = ir.nodes.filter(n => ids.has(n.id)).map(n => n.id), scoped = selectedContext(ir, ordered), declarations = scoped.closure.filter(n => n.role === 'asset_declaration'), claims = scoped.closure.filter(n => n.role === 'actor' || n.role === 'source' || n.role === 'source_use' || n.role === 'asset_declaration' && (n.value.creator || n.value.attributions?.state === 'provided'));
    const optional = new Map(targets.map(t => [jcs(t.target), t])), nodes = new Map(ir.nodes.map(n => [n.id, n])), index = [];
    for (const d of ir.asset_index) {
        const n = nodes.get(d.node_ref), supplied = ids.has(n.id);
        if (request.mode === 'expand' && !supplied)
            continue;
        if (n.role === 'judgment' && !supplied)
            continue;
        if (!supplied && !optional.has(jcs(d.target)))
            continue;
        index.push({
            target: clone(d.target), owner: clone(d.owner), display_name: d.display_name, body_delivery: supplied ? 'inline' : 'deferred'
        });
    }
    const body = {
        content: {
            declarations, catalog: scoped.catalog, selected: clone(request.selection), closure: scoped.closure, references: scoped.references, relationships: scoped.relationships, missing: [], provenance: {
                declarations: claims, confirmation: claims.length ? 'claimed_unverified' : 'not_evaluated', verifier_id: null, evidence_ref: null
            }, asset_capability: assetCapability(view), asset_index: index, expansion_handles: []
        }, diagnostics: [], omissions: scoped.omissions, assessment: assessment(), targets
    };
    return clone(folded(body));
}
function scope(body, view, includeTargets = true) {
    const ids = new Set(), content = body.content;
    for (const n of [...content.declarations ?? [], ...content.closure ?? [], ...content.provenance?.declarations ?? []])
        ids.add(n.id);
    for (const r of content.catalog)
        ids.add(r.node_ref);
    const nodes = new Map(view.ir.nodes.map(n => [jcs(n.target), n]));
    for (const d of content.asset_index)
        ids.add(d.node_ref ?? nodes.get(jcs(d.target)).id);
    for (const r of content.references ?? []) {
        ids.add(r.source_node);
        ids.add(r.target_node);
    }
    if (includeTargets)
        for (const d of content.asset_index)
            if (d.body_delivery === 'deferred') {
                const t = body.targets.find(t => jcs(t.target) === jcs(d.target));
                if (!t)
                    throw Error('READ_PROJECTION_INVALID');
                for (const id of t.scope)
                    ids.add(id);
            }
    return view.ir.nodes.filter(n => ids.has(n.id)).map(n => n.id);
}
module.exports = {
    project, scope, availableTargets
};
