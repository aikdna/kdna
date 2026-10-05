'use strict';
const core = require('@aikdna/kdna-core/protected-sections-node');
const S = require('./protected-payload-bridge.js'), H = require('./protected-payload-host.js'), P = require('./protected-payload-project.js'), delivery = require('./protected-payload-delivery.js');
const { clone, freeze, jcs, assessment, diagnostic, result } = require('./util.js');
const { measure, states } = require('./budget.js'), { decideBudget } = require('./budget-decision.js');
let sequence = 0;
const contract = 'kdna.protected-read/0.1.0-candidate', none = () => ({
    kind: 'none', external_commit: {
        state: 'not_invoked'
    }
});
function failed(code = 'PROTECTION_OPERATION_UNTRUSTED', stage = 'input', history = none()) {
    return freeze({
        status: 'protection_failed', diagnostic: {
            code, stage
        }, disclosure: history, body: null, body_bytes: 0
    });
}
function rejection(request, code) {
    return {
        contract, request_id: request.request_id, status: 'rejected', tuple: null, asset: null, snapshot_id: null, digests: null, content: null, states: {
            ...states(), read_permission: code === 'READ_HOST_DENIED' ? 'denied' : 'not_evaluated'
        }, diagnostics: [diagnostic(code)], omissions: [], assessment: assessment(), receipt: {
            receipt_id: 'receipt:' + request.request_id, request_id: request.request_id, snapshot_id: null, host_id: null, host_epoch: null, decision_id: null, disclosed_at: null, delivery: 'not_delivered'
        }, budget: {
            limit_bytes: request.budget_bytes, required_bytes: '0000000000000000', actual_bytes: '0000000000000000'
        }
    };
}
function finish(envelope, request) {
    const count = measure(envelope), ready = ['ready', 'catalog_only'].includes(envelope.status), code = envelope.diagnostics.find(x => x.severity === 'error')?.code ?? null, rejected = ready ? rejection(request, 'READ_BUDGET_INSUFFICIENT') : envelope, rejectedBytes = ready ? measure(rejected, count) : count, d = decideBudget(request, ready ? count : null, rejectedBytes, code);
    if (d.kind === 'control')
        return freeze(d.result);
    const body = d.kind === 'ready' ? envelope : rejected;
    body.budget.required_bytes = d.required;
    body.budget.actual_bytes = d.actual;
    const out = result('read_envelope', body);
    S.C.validate('ProtectedPayloadCallResult06', out);
    return freeze(out);
}
function handleError(hostState, operation, request, record) {
    const h = request.handle;
    if (!h)
        return null;
    const registered = hostState.handles.get(h.handle_id);
    if (!registered || registered.operation !== operation || jcs(registered.handle) !== jcs(h))
        return 'READ_HANDLE_UNTRUSTED';
    const view = record.view;
    if (h.core_version !== S.tuple.core || h.ir_version !== S.tuple.ir || h.read_version !== S.tuple.read)
        return 'READ_HANDLE_VERSION_MISMATCH';
    if (h.snapshot_id !== view.snapshot_id || h.A !== view.digests.A.observed || h.C !== view.digests.C.observed)
        return 'READ_HANDLE_STALE';
    if (h.asset_id !== view.asset.asset_id || h.asset_version !== view.asset.asset_version)
        return 'READ_HANDLE_ASSET_MISMATCH';
    if (h.anchor.kind === 'selection_set') {
        if (h.operation_id !== record.receipt.operation_id || h.capture_id !== record.base.capture.capture_id || jcs(h.anchor.selection) !== jcs(request.selection))
            return 'READ_HANDLE_SCOPE_MISMATCH';
    }
    else if (request.selection !== null)
        return 'READ_HANDLE_SCOPE_MISMATCH';
    return null;
}
function mint(body, request, record, host) {
    const handles = [], view = record.view;
    for (const d of body.content.asset_index) {
        if (d.body_delivery !== 'deferred')
            continue;
        const target = body.targets.find(x => jcs(x.target) === jcs(d.target));
        if (!target)
            throw Error('READ_PROJECTION_INVALID');
        const h = {
            handle_id: 'protected-handle:' + globalThis.crypto.randomUUID(), asset_id: view.asset.asset_id, asset_version: view.asset.asset_version, A: view.digests.A.observed, C: view.digests.C.observed, snapshot_id: view.snapshot_id, core_version: S.tuple.core, ir_version: S.tuple.ir, read_version: S.tuple.read, anchor: request.selection === null ? {
                kind: 'asset'
            } : {
                kind: 'selection_set', selection: clone(request.selection)
            }, target: clone(target.target), scope: clone(target.scope), issued_at: host.current_ms, expires_at: Math.min(host.expires_at, host.current_ms + 3600000), host_id: host.host_id, host_epoch: host.host_epoch
        };
        if (request.selection !== null)
            Object.assign(h, {
                binding_kind: 'protected_selection_set', operation_id: record.receipt.operation_id, capture_id: record.base.capture.capture_id
            });
        S.C.validate('ProtectedPayloadExpansionHandle06', h);
        handles.push(h);
        d.handle_id = h.handle_id;
        const node = view.ir.nodes.find(n => jcs(n.target) === jcs(h.target));
        for (const o of body.omissions)
            if (o.target === node?.id) {
                o.expandable = true;
                o.handle_id = h.handle_id;
                o.reason = 'not_requested';
            }
    }
    body.content.expansion_handles = handles;
    return handles;
}
async function readProtectedSectionNode(operation, admitted, authority, host) {
    const bound = S.bind(operation), requestRecord = S.request(admitted), hostState = H.hosts.get(host);
    if (!bound || !requestRecord || requestRecord.operation !== operation)
        return failed();
    if (!hostState)
        return freeze({
            status: 'delivery_failed', reason: 'host_callback_failed', disclosure: none(), body: null, body_bytes: 0
        });
    const { record, binding } = bound, request = requestRecord.data, view = record.view;
    let lastReceipt = record.receipt, state, prepared, currentContext, contextFailure = null;
    const check = async (phase) => {
        const x = await binding.observe(phase);
        if (x.status !== 'current') {
            contextFailure = x;
            throw Error('Protection boundary');
        }
        const y = binding.assertCurrent(x.checkpoint);
        if (y.status !== 'current') {
            contextFailure = y;
            throw Error('Protection boundary');
        }
        lastReceipt = y.receipt;
        return y;
    };
    const rejected = code => finish(rejection(request, code), request), returned = out => freeze({
        status: 'read_result', result: out, receipt: lastReceipt, disclosure: none()
    });
    try {
        const authorization = await S.grant(authority, requestRecord, record.base, request.mode === 'expand' ? 'expand_protected_projection' : 'read_protected_projection');
        await check('projection');
        // Validate a later request against this exact retained catalog, without mutating caller token.
        if (request.selection) {
            if (request.selection.asset_id !== view.asset.asset_id)
                return returned(rejected('READ_ASSET_MISMATCH'));
            if (request.selection.asset_version !== view.asset.asset_version)
                return returned(rejected('READ_ASSET_VERSION_MISMATCH'));
            const ids = request.selection.judgment_ids, set = new Set(ids), ordered = view.ir.catalog.filter(x => set.has(x.judgment_id)).map(x => x.judgment_id);
            if (jcs(ids) !== jcs(ordered))
                return returned(rejected('READ_INPUT_INVALID'));
        }
        const hError = handleError(hostState, operation, request, record);
        if (hError)
            return returned(rejected(hError));
        const body = P.project(request, view), projectionScope = P.scope(body, view), b = {
            operation_id: lastReceipt.operation_id, snapshot_id: view.snapshot_id, capture_id: record.base.capture.capture_id, request_id: request.request_id, request_digest: requestRecord.digest, source_request_digest: requestRecord.sourceDigest, read_intent_digest: authorization.read_intent_digest, tuple: view.tuple, asset: view.asset, A: view.digests.A.observed, C: view.digests.C.observed, E: view.digests.E.observed
        };
        S.C.validate('ProtectedPayloadBinding06', b);
        let context = {
            request, binding: b, projection_scope: projectionScope, issued_handle_scopes: [], protection_receipt: lastReceipt
        };
        await check('host_observation');
        let first = await H.observe(hostState, context);
        if (first.error)
            return returned(rejected(first.error));
        // Both observations authorize all candidate target scopes through projection_scope.
        // Issue credentials only from the second current Host observation, as in the
        // original pipeline; no monotonic relation between observations is imposed.
        await check('host_observation');
        const second = await H.observe(hostState, context);
        if (second.error)
            return returned(rejected(second.error));
        if (first.value.host_id !== second.value.host_id || first.value.host_epoch !== second.value.host_epoch)
            return returned(rejected('READ_HOST_EPOCH_MISMATCH'));
        const handles = ['whole_asset', 'exact_selection'].includes(request.mode) ? mint(body, request, record, second.value) : [];
        currentContext = {
            ...context, issued_handle_scopes: handles, protection_receipt: lastReceipt
        };
        const now = second.value, confirmation = body.content.provenance?.confirmation ?? 'not_evaluated', verification = {
            mode: request.mode, integrity_and_semantics: view.observation, operation_receipt: lastReceipt, disclosure: none(), projection_basis: 'original_registry_order_and_required_context', cost_model: 'full_ciphertext_authentication_before_projection', authority_boundary: 'native_current_operation_plus_independent_host_scope', binding: b, observation_phase: 'projection_before_host_delivery'
        };
        const envelope = {
            contract, request_id: request.request_id, status: request.mode === 'catalog' ? 'catalog_only' : 'ready', mode: request.mode, tuple: view.tuple, asset: view.asset, snapshot_id: view.snapshot_id, digests: view.digests, content: body.content, states: {
                core: 'valid', interpretation: 'complete', writer: 'not_evaluated', confirmation, read_permission: 'allowed', action_authorization: 'not_evaluated'
            }, diagnostics: body.diagnostics, omissions: body.omissions, assessment: body.assessment, verification, receipt: {
                receipt_id: 'protected-receipt:' + (++sequence), request_id: request.request_id, snapshot_id: view.snapshot_id, host_id: now.host_id, host_epoch: now.host_epoch, decision_id: now.decision_id, disclosed_at: now.current_ms, delivery: 'delivered'
            }, budget: {
                limit_bytes: request.budget_bytes, required_bytes: '0000000000000000', actual_bytes: '0000000000000000'
            }
        };
        prepared = finish(envelope, request);
        if (!prepared.envelope || !['ready', 'catalog_only'].includes(prepared.envelope.status))
            return returned(prepared);
        await check('host_handoff');
        const issued = delivery.prepareDelivery(operation, binding, prepared, currentContext, hostState, lastReceipt);
        state = issued.state;
        let acknowledged;
        try {
            acknowledged = await hostState.deliver(prepared, issued.token);
        }
        catch {
            return freeze({
                status: 'delivery_failed', reason: 'host_callback_failed', disclosure: delivery.disclosure(state), body: null, body_bytes: 0
            });
        }
        const pending = state.pending;
        delivery.closeOwner(state);
        if (pending || state.failed || acknowledged !== true)
            return freeze({
                status: 'delivery_failed', reason: pending || state.failed ? 'transport_commit_failed' : 'host_callback_failed', disclosure: delivery.disclosure(state), body: null, body_bytes: 0
            });
        await check('read_return');
        for (const h of handles)
            hostState.handles.set(h.handle_id, {
                operation, handle: freeze(clone(h))
            });
        return freeze({
            status: 'read_result', result: prepared, receipt: lastReceipt, disclosure: delivery.disclosure(state)
        });
    }
    catch (e) {
        if (contextFailure)
            return freeze({
                status: 'protection_failed', diagnostic: contextFailure.diagnostic, disclosure: state ? delivery.disclosure(state) : none(), body: null, body_bytes: 0
            });
        const recognized = ['READ_PROJECTION_INVALID', 'READ_HANDLE_SCOPE_MISMATCH', 'READ_UNRESOLVED_EXTERNAL'].includes(e.message) ? e.message : S.C.isFailure(e) && e.code === 'SECTION_PERMISSION_DENIED' ? 'READ_HOST_DENIED' : 'READ_CORE_CAPABILITY_UNAVAILABLE';
        if (state)
            return freeze({
                status: 'delivery_failed', reason: 'host_callback_failed', disclosure: delivery.disclosure(state), body: null, body_bytes: 0
            });
        return returned(rejected(recognized));
    }
    finally {
        if (state)
            delivery.closeOwner(state);
    }
}
module.exports = {
    createTrustedProtectedPayloadHost: H.create, readProtectedSectionNode, commitProtectedSectionTransport: delivery.commitProtectedTransport
};
