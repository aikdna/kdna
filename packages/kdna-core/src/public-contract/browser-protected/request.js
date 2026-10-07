'use strict';
const S = require('./state.js'), { C } = S;
const fixed = n => String(n).padStart(16, '0');
const count = value => new TextEncoder().encode(C.strict.canonicalJson(value)).length;
const correlation = id => C.strict.identifier(id) ? {
    state: 'validated', request_id: id
} : {
    state: 'unavailable', request_id: null
};
function failure(candidate) {
    const id = Object.getOwnPropertyDescriptor(candidate ?? {}, 'request_id')?.value, body = {
        contract: 'kdna.read-admission/0.1.0', code: 'READ_INPUT_INVALID', diagnostic: {
            stage: 'admission', severity: 'error', reason: 'mode_shape_invalid', field: '$candidate'
        }, correlation: correlation(id), control_budget: {
            limit_bytes: 4096, actual_bytes: '0000000000000000'
        }
    };
    body.control_budget.actual_bytes = fixed(count(body));
    const out = {
        channel: 'admission_rejection', envelope: null, admission_rejection: body, control: null, transport_failure: null
    };
    C.validate('BrowserProtectedRequestAdmission', out);
    return S.frozen(out);
}
function versionRejection(candidate, code) {
    const envelope = {
        contract: 'kdna.protected-browser-read/0.1.0-candidate', request_id: candidate.request_id, status: 'rejected', tuple: null, asset: null, snapshot_id: null, digests: null, content: null, states: {
            core: 'not_evaluated', interpretation: 'not_evaluated', writer: 'not_evaluated', confirmation: 'not_evaluated', read_permission: 'not_evaluated', action_authorization: 'not_evaluated'
        }, diagnostics: [{
                code, stage: 'version', severity: 'error', subject: null, field: null
            }], omissions: [], assessment: {
            state: 'not_evaluated', kind: null, assessor_id: null, evidence_ref: null
        }, receipt: {
            receipt_id: 'receipt:' + candidate.request_id, request_id: candidate.request_id, snapshot_id: null, host_id: null, host_epoch: null, decision_id: null, disclosed_at: null, delivery: 'not_delivered'
        }, budget: {
            limit_bytes: candidate.budget_bytes, required_bytes: '0000000000000000', actual_bytes: '0000000000000000'
        }
    };
    const size = count(envelope);
    envelope.budget.actual_bytes = fixed(size);
    envelope.budget.required_bytes = fixed(size);
    const out = size <= candidate.budget_bytes ? {
        channel: 'read_envelope', envelope, admission_rejection: null, control: null, transport_failure: null
    } : {
        channel: 'no_body_control', envelope: null, admission_rejection: null, control: {
            code: 'READ_RESPONSE_BUDGET_TOO_SMALL', semantic_cause: code, correlation: correlation(candidate.request_id), body_bytes: 0
        }, transport_failure: null
    };
    C.validate('BrowserProtectedRequestAdmission', out);
    return S.frozen(out);
}
function admit(candidateJson) {
    let candidate;
    try {
        candidate = C.parseJsonText(candidateJson);
        const data = candidate;
        C.keys(data, ['request_id', 'tuple', 'budget_bytes', 'mode', 'selection', 'handle']);
        C.need(C.strict.identifier(data.request_id) && C.strict.uint(data.budget_bytes), 'READ_INPUT_INVALID');
        const t = data.tuple;
        C.need(t && typeof t === 'object' && !Array.isArray(t) && Object.keys(t).every(k => Object.hasOwn(S.tuple, k) && typeof t[k] === 'string'), 'READ_INPUT_INVALID');
        if (Object.keys(t).length !== Object.keys(S.tuple).length || Object.entries(S.tuple).some(([k, v]) => t[k] !== v)) {
            const baseline = require('../generated-contract.json'), old = [baseline.versionTuple, ...baseline.types.UnsupportedVersionTuple.anyOf.map(x => Object.fromEntries(Object.entries(x.properties).map(([k, v]) => [k, v.const])))];
            const historical = old.some(value => Object.keys(t).length === Object.keys(value).length && Object.entries(value).every(([k, v]) => t[k] === v));
            return versionRejection(data, historical ? 'READ_UNSUPPORTED_VERSION' : Object.keys(S.tuple).some(k => k !== 'payload_profile' && t[k] === S.tuple[k]) ? 'READ_MIXED_VERSION_TUPLE' : 'READ_UNSUPPORTED_VERSION');
        }
        C.validate('BrowserProtectedRequest', data);
        return Object.freeze({
            channel: 'admitted_request', request: S.mintRequest(data)
        });
    }
    catch (e) {
        return failure(candidate);
    }
}
module.exports = {
    admit, failure
};
