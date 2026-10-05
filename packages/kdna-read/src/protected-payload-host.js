'use strict';
const S = require('./protected-payload-bridge.js');
const { clone, freeze, jcs } = require('./util.js');
const hosts = new WeakMap();
function create(callbacks) {
    if (!callbacks || typeof callbacks !== 'object' || Object.getOwnPropertySymbols(callbacks).length || Object.getOwnPropertyNames(callbacks).sort().join(',') !== 'deliver,observe' || ['observe', 'deliver'].some(k => {
        const d = Object.getOwnPropertyDescriptor(callbacks, k);
        return !d || !Object.hasOwn(d, 'value') || typeof d.value !== 'function';
    }))
        throw TypeError('Protected Host callbacks required');
    const token = Object.freeze({});
    hosts.set(token, {
        observe: callbacks.observe, deliver: callbacks.deliver, handles: new Map(), revocations: new Set()
    });
    return token;
}
async function observe(state, context, observer = state.observe) {
    let value;
    try {
        value = clone(await observer(freeze(context)));
        S.C.validate('ProtectedPayloadHostObservation06', value);
    }
    catch {
        return {
            error: 'READ_HOST_CONTEXT_UNTRUSTED'
        };
    }
    const b = context.binding, r = context.request;
    for (const key of ['operation_id', 'capture_id', 'request_digest', 'read_intent_digest', 'request_id', 'snapshot_id', 'A', 'C', 'E'])
        if (value[key] !== b[key])
            return {
                error: 'READ_HOST_CONTEXT_UNTRUSTED'
            };
    if (jcs(value.asset) !== jcs(b.asset) || jcs(value.tuple) !== jcs(b.tuple))
        return {
            error: 'READ_HOST_CONTEXT_UNTRUSTED'
        };
    if (value.issued_at >= value.expires_at || value.expires_at - value.issued_at > 3600000)
        return {
            error: 'READ_HOST_CONTEXT_UNTRUSTED'
        };
    if (value.current_ms < value.issued_at)
        return {
            error: 'READ_HOST_TIME_INVALID'
        };
    if (value.current_ms >= value.expires_at)
        return {
            error: 'READ_HOST_CONTEXT_EXPIRED'
        };
    const handle = r.handle;
    if (handle) {
        if (handle.host_id !== value.host_id || handle.host_epoch !== value.host_epoch)
            return {
                error: 'READ_HOST_EPOCH_MISMATCH'
            };
        if (value.current_ms < handle.issued_at)
            return {
                error: 'READ_HOST_TIME_INVALID'
            };
        if (value.current_ms >= handle.expires_at)
            return {
                error: 'READ_HANDLE_EXPIRED'
            };
    }
    const denial = jcs([value.host_id, value.host_epoch, b.asset.asset_id]);
    if (value.lift_denial === true)
        state.revocations.delete(denial);
    if (value.revoked === true || value.decision === 'deny')
        state.revocations.add(denial);
    if (state.revocations.has(denial))
        return {
            error: 'READ_HOST_DENIED'
        };
    const allowed = new Set(value.scope);
    if (context.projection_scope.some(id => !allowed.has(id)) || context.issued_handle_scopes.some(h => h.scope.some(id => !allowed.has(id))))
        return {
            error: 'READ_SCOPE_DENIED'
        };
    return {
        value
    };
}
module.exports = {
    hosts, create, observe
};
