'use strict';
const { randomUUID } = require('node:crypto');
const { isPromise } = require('node:util').types;
const { observe } = require('./protected-payload-host.js');
const { clone, freeze } = require('./util.js');
const tokens = new WeakMap();
function disclosure(state) {
    return freeze(clone(state.disclosure));
}
function deliveryFailure(state) {
    return freeze({
        status: 'delivery_failed', reason: 'transport_commit_failed', disclosure: disclosure(state), body: null, body_bytes: 0
    });
}
function protectionFailure(state, result) {
    return freeze({
        status: result.status, diagnostic: result.diagnostic, disclosure: disclosure(state), body: null, body_bytes: 0
    });
}
function prepareDelivery(operation, binding, prepared, context, hostState, receipt) {
    const token = Object.freeze({});
    const state = {
        operation, binding, prepared, context, hostState, ownerActive: true, lifecycle: 'available', pending: false, failed: false, disclosure: {
            kind: 'trusted_host', at_ms: receipt.checked_at_ms, external_commit: {
                state: 'not_invoked'
            }
        }
    };
    tokens.set(token, state);
    return {
        token, state
    };
}
function closeOwner(state) {
    state.ownerActive = false;
    if (state.lifecycle === 'reserved')
        state.failed = true;
    if (state.lifecycle !== 'closed')
        state.lifecycle = 'closed';
}
function reserveValid(state) {
    return state.ownerActive && state.lifecycle === 'reserved';
}
function closedTransport(value) {
    if (!value || typeof value !== 'object' || Object.getOwnPropertySymbols(value).length)
        return false;
    const keys = Object.getOwnPropertyNames(value);
    return keys.length === 2 && keys.includes('observeScope') && keys.includes('commit') && keys.every(k => {
        const d = Object.getOwnPropertyDescriptor(value, k);
        return d && Object.hasOwn(d, 'value') && typeof d.value === 'function';
    });
}
async function commitProtectedTransport(operation, token, transport) {
    const state = tokens.get(token);
    if (!state || state.operation !== operation)
        return freeze({
            status: 'protection_failed', diagnostic: {
                code: 'PROTECTION_OPERATION_UNTRUSTED', stage: 'input'
            }, disclosure: {
                kind: 'none', external_commit: {
                    state: 'not_invoked'
                }
            }, body: null, body_bytes: 0
        });
    if (!state.ownerActive || state.lifecycle !== 'available')
        return deliveryFailure(state);
    // Reservation happens before inspecting caller-owned objects or calling clocks.
    state.lifecycle = 'reserved';
    state.pending = true;
    const failed = result => {
        state.failed = true;
        state.lifecycle = 'closed';
        return result ? protectionFailure(state, result) : deliveryFailure(state);
    };
    try {
        if (!closedTransport(transport))
            return failed();
        const observeScope = transport.observeScope, commit = transport.commit;
        let current = await state.binding.observe('transport_commit');
        if (!reserveValid(state))
            return failed();
        if (current.status !== 'current')
            return failed(current);
        const scoped = await observe(state.hostState, state.context, observeScope);
        if (!reserveValid(state))
            return failed();
        if (scoped.error)
            return failed();
        const prior = state.prepared.envelope.receipt;
        if (scoped.value.host_id !== prior.host_id || scoped.value.host_epoch !== prior.host_epoch)
            return failed();
        const handles = state.prepared.envelope.content.expansion_handles ?? [];
        for (const handle of handles)
            if (handle.host_id !== scoped.value.host_id || handle.host_epoch !== scoped.value.host_epoch || scoped.value.current_ms < handle.issued_at || scoped.value.current_ms >= handle.expires_at || handle.scope.some(id => !scoped.value.scope.includes(id)))
                return failed();
        const final = state.binding.assertCurrent(current.checkpoint);
        if (!reserveValid(state))
            return failed();
        if (final.status !== 'current')
            return failed(final);
        // The Core checkpoint is a distinct clock observation. It cannot renew a
        // prepared Host handle that expired while this final callback ran.
        if (handles.some(handle => final.receipt.checked_at_ms >= handle.expires_at))
            return failed();
        const attempted = final.receipt.checked_at_ms;
        if (attempted < state.disclosure.at_ms)
            return failed();
        // Atomic authority consumption + history write precedes every side effect.
        state.lifecycle = 'closed';
        state.disclosure.external_commit = {
            state: 'outcome_unknown', attempt_id: 'attempt:' + randomUUID(), attempted_at_ms: attempted
        };
        let acknowledged;
        try {
            acknowledged = commit(state.prepared);
        }
        catch {
            return failed();
        }
        if (acknowledged !== true) {
            // Observe native rejection only to prevent an unhandled process error. Never
            // call a supplied then method, await it, or upgrade unknown from its outcome.
            if (isPromise(acknowledged))
                try {
                    Promise.prototype.then.call(acknowledged, undefined, () => undefined);
                }
                catch { /* Already outcome_unknown; acknowledgement remains invalid. */
                }
            return failed();
        }
        state.disclosure.external_commit = {
            ...state.disclosure.external_commit, state: 'confirmed', confirmed_at_ms: null
        };
        const after = state.binding.assertCurrent(current.checkpoint);
        if (after.status !== 'current') {
            if (after.checked_at_ms !== null && after.checked_at_ms >= attempted)
                state.disclosure.external_commit.confirmed_at_ms = after.checked_at_ms;
            return failed(after);
        }
        const confirmed = after.receipt.checked_at_ms;
        if (confirmed < attempted)
            return failed();
        state.disclosure.external_commit.confirmed_at_ms = confirmed;
        return freeze({
            status: 'committed', operation_id: after.receipt.operation_id, committed_at_ms: confirmed, disclosure: disclosure(state)
        });
    }
    catch {
        return failed();
    }
    finally {
        state.pending = false;
    }
}
module.exports = {
    prepareDelivery, closeOwner, disclosure, deliveryFailure, protectionFailure, commitProtectedTransport
};
