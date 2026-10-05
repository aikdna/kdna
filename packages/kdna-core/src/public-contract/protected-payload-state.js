'use strict';
const C = require('./section-common.js');
const { digestCanonical } = require('./digests.js');
const lifecycle = require('./protection-operation.js');
const requests = new WeakMap(), authorities = new WeakMap(), operations = new WeakMap(), snapshots = new WeakMap();
const tuple = C.contract.module.versionTuple;
const profile = 'kdna.protected.logical-payload/0.1.0-candidate';
const frozen = value => C.strict.freeze(value);
function mintRequest(data, sourceDigest = null) {
    data = frozen(structuredClone(data));
    const token = Object.freeze({}), digest = digestCanonical(data);
    requests.set(token, {
        data, digest, sourceDigest: sourceDigest ?? digest
    });
    return token;
}
function inspectRequest(token) {
    return requests.get(token)?.data ?? null;
}
function request(token) {
    return requests.get(token) ?? null;
}
function createAuthority(callback) {
    if (typeof callback !== 'function')
        throw new TypeError('Protected authority callback required');
    const token = Object.freeze({});
    authorities.set(token, callback);
    return token;
}
function normalized(record, view) {
    const r = record.data;
    if (r.mode !== 'exact_selection')
        return mintRequest(r, record.sourceDigest);
    const selection = r.selection;
    C.need(selection.asset_id === view.asset.asset_id && selection.asset_version === view.asset.asset_version, 'READ_SELECTION_ASSET_MISMATCH');
    const wanted = new Set(selection.judgment_ids), ordered = view.ir.catalog.filter(x => wanted.has(x.judgment_id)).map(x => x.judgment_id);
    C.need(ordered.length === wanted.size, 'READ_SELECTION_NOT_FOUND');
    return mintRequest({
        ...r, selection: {
            ...selection, judgment_ids: ordered
        }
    }, record.sourceDigest);
}
function inventory(capture) {
    return capture.rows.map(r => ({
        name: r.name, decoded_bytes: r.size, compressed_bytes: r.compressed, local_header_offset: r.local, data_offset: r.start, compression_method: r.method
    })).sort((a, b) => C.utf8(a.name, b.name));
}
function context(record, base, operation) {
    const read_intent = {
        representation_profile: profile, operation, mode: record.data.mode, logical_entry: 'payload.kdnab', ciphertext_observation: 'complete_captured_member', authentication_scope: 'complete_original_authored_payload', semantic_scope: 'complete_original_payload_and_resources', domain_member_names: base.inventory.map(x => x.name), requested_projection_only_to_host: true, capture_id: base.capture.capture_id, request_digest: record.digest, member_inventory: base.inventory, signature_policy: base.signaturePolicy, purpose: 'full_protected_payload_authentication_and_projection'
    };
    const value = {
        request: record.data, request_digest: record.digest, capture: base.capture, manifest_identity: base.manifestIdentity, read_intent, read_intent_digest: digestCanonical(read_intent)
    };
    C.validate('ProtectedPayloadAuthorityContext06', value);
    return frozen(value);
}
async function grant(authority, record, base, operation) {
    const callback = authorities.get(authority);
    C.need(callback, 'SECTION_NATIVE_REQUEST_OR_AUTHORITY_UNTRUSTED');
    const observed = context(record, base, operation);
    let permitted;
    try {
        permitted = await callback(observed);
    }
    catch {
        C.need(false, 'READ_CORE_CAPABILITY_UNAVAILABLE');
    }
    C.need(permitted === true, 'SECTION_PERMISSION_DENIED');
    return observed;
}
function issue(data, originalOperation, receipt, base) {
    const snapshot = Object.freeze({}), operation = Object.freeze({}), view = frozen(data);
    C.validate('ProtectedPayloadSnapshotData06', view);
    C.validate('ProtectedPayloadReceipt06', receipt);
    const record = {
        snapshot, view, originalOperation, receipt, base, disposed: false
    };
    snapshots.set(snapshot, record);
    operations.set(operation, record);
    return {
        snapshot, operation
    };
}
function inspectSnapshot(token) {
    const r = snapshots.get(token);
    return r && !r.disposed ? r.view : null;
}
function operation(token) {
    const r = operations.get(token);
    return r && !r.disposed ? r : null;
}
function dispose(token) {
    const r = operations.get(token);
    if (!r || r.disposed)
        return;
    r.disposed = true;
    lifecycle.disposeProtectionOperation(r.originalOperation);
}
function bind(token) {
    const r = operation(token);
    if (!r)
        return null;
    const b = lifecycle.bindProtectionOperation(r.originalOperation);
    return b.status === 'bound' ? {
        record: r, binding: b.binding
    } : null;
}
function pairRequest(token, operation) {
    const r = requests.get(token);
    C.need(r && operations.has(operation), 'READ_INPUT_INVALID');
    r.operation = operation;
    return token;
}
module.exports = {
    pairRequest, C, tuple, profile, frozen, mintRequest, inspectRequest, request, createAuthority, normalized, inventory, context, grant, issue, inspectSnapshot, operation, dispose, bind
};
