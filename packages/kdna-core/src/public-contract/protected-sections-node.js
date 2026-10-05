'use strict';
const { inflateRawSync } = require('node:zlib');
const S = require('./protected-payload-state.js'), { C } = S;
const { openProtectedPayloadCapture } = require('./protected-payload-capture.js');
const { parseContainer } = require('./container.js');
const { rejected } = require('./admit.js');
const D = require('./digests.js'), P = require('./protection-declaration.js');
const { decodeEnvelope } = require('./protection-envelope-codec.js');
const { validateEnvelope, decryptPassword } = require('./protection-crypto.js');
const { verifyIntegrity } = require('./protection-integrity.js');
const { verifyGrant, grantPlaintext } = require('./protection-grant.js');
const { decodeValidatedPayload, assertContentBindings } = require('./semantic-admission.js');
const { buildIR } = require('./canonical-ir.js');
const { issueOperation, disposeProtectionOperation } = require('./protection-operation.js');
const { admit: admitProtectedPayloadRequest, failure: requestFailure } = require('./protected-payload-request.js');
function bindProtectedPayloadRequest(operation, candidate) {
    const bound = S.bind(operation);
    if (!bound)
        return requestFailure();
    const admitted = admitProtectedPayloadRequest(candidate);
    if (admitted.channel !== 'admitted_request')
        return admitted;
    try {
        return Object.freeze({
            channel: 'admitted_request', request: S.pairRequest(S.normalized(S.request(admitted.request), bound.record.view), operation)
        });
    }
    catch (e) {
        if (C.isFailure(e))
            return requestFailure();
        throw e;
    }
}
function classify(error) {
    if (C.isFailure(error))
        return error.code === 'SECTION_PERMISSION_DENIED' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : error.code === 'SECTION_TYPED_SHAPE' ? 'READ_CORE_INVALID' : error.code;
    const allowed = new Set(['READ_INPUT_INVALID', 'READ_CORE_INVALID', 'READ_CORE_CAPABILITY_UNAVAILABLE', 'READ_UNSUPPORTED_CRITICAL', 'READ_INTERPRETATION_INCOMPLETE', 'READ_STATIC_POLICY_INVALID', ...require('./generated-contract.json').types.CoreComponentFailure.properties.code.enum]);
    return allowed.has(error?.reason) ? error.reason : 'READ_CORE_CAPABILITY_UNAVAILABLE';
}
async function admitProtectedSectionNode(input, request, authority, inputOptions, inputProvider) {
    let capture, copied, plaintext, originalOperation, retained = false, stage = 'input';
    const io = () => structuredClone(capture?.io ?? []);
    try {
        const requestRecord = S.request(request);
        C.need(requestRecord, 'READ_INPUT_INVALID');
        C.need(requestRecord.data.mode !== 'expand', 'READ_INPUT_INVALID');
        stage = 'capture';
        capture = await openProtectedPayloadCapture(input);
        stage = 'manifest';
        const manifest = C.strict.parseJson(capture.manifestBytes);
        C.validate('ProtectedManifest06Candidate', manifest);
        C.need(capture.rows.every(r => r.method === 0 || r.method === 8), 'READ_CORE_CAPABILITY_UNAVAILABLE');
        // Policy is non-secret authority context; credential bytes are not touched before grant.
        P.closed(inputOptions, ['credential', 'signaturePolicy']);
        C.validate('SectionSignaturePolicy06', inputOptions.signaturePolicy);
        const base = {
            capture: capture.identity, inventory: S.inventory(capture), signaturePolicy: S.frozen(structuredClone(inputOptions.signaturePolicy)), manifestIdentity: {
                asset_id: manifest.asset_id, asset_version: manifest.version, judgment_version: manifest.judgment_version
            }
        };
        stage = 'authority';
        await S.grant(authority, requestRecord, base, 'admit_protected_payload');
        copied = P.options(inputOptions);
        copied.signaturePolicy = base.signaturePolicy;
        const provider = P.provider(inputProvider, copied.credential.kind);
        const profile = P.declaration(manifest, copied.credential, provider);
        stage = 'container';
        const bytes = await capture.wholeAfterAuthorization(), entries = parseContainer(bytes, (data, maxOutputLength) => inflateRawSync(data, {
            maxOutputLength
        }));
        C.need(Buffer.from(entries['kdna.json']).equals(Buffer.from(capture.manifestBytes)), 'READ_CORE_INVALID');
        const digests = {
            A: D.digest(bytes), C: D.digest(D.contentTreePreimage(entries)), E: D.digest(D.runtimeEntryPreimage(entries, manifest))
        };
        assertContentBindings(manifest, digests.C);
        const integrity = verifyIntegrity(entries, manifest, digests.E, copied.signaturePolicy), envelope = validateEnvelope(decodeEnvelope(entries['payload.kdnab']), profile);
        let verified = null;
        if (copied.credential.kind === 'password') {
            plaintext = decryptPassword(envelope, copied.credential, manifest);
        } else {
            verified = verifyGrant(copied.credential.grantBytes, copied.credential, manifest, envelope, digests.A);
            plaintext = grantPlaintext(verified, manifest, envelope);
        }
        stage = 'payload';
        const payload = decodeValidatedPayload(manifest, plaintext);
        stage = 'interpretation';
        const ir = {
            ...buildIR(manifest, payload, entries), tuple: structuredClone(S.tuple)
        };
        C.validate('CanonicalIR06Candidate', ir);
        const irDigest = D.digestCanonical(ir), runtimeNames = D.runtimeEntryNames(entries, manifest), expectedC = manifest.content_digest ?? manifest.authoring?.content_digest ?? null, expectedE = integrity.checksums === 'verified_document_1' ? digests.E : null;
        const observation = {
            representation_profile: S.profile, capture_id: capture.identity.capture_id, input_byte_length: bytes.length, ...digests, C_profile_version: '0.2.0', E_profile_version: '0.2.0', runtime_entry_names: runtimeNames, logical_entry: 'payload.kdnab', ciphertext_member_bytes: entries['payload.kdnab'].length, ciphertext_member_digest: D.digest(entries['payload.kdnab']), authenticated_plaintext_bytes: plaintext.length, authenticated_plaintext_digest: D.digest(plaintext), domain: 'validated_complete_authored_payload', ir_digest: irDigest, persisted_section_frames: false, checked_sections: [], proof: 'observation_not_authority', tuple: structuredClone(S.tuple), asset: payload.asset, interpretation: 'complete'
        };
        const data = {
            snapshot_id: 'protected-snapshot:' + globalThis.crypto.randomUUID(), tuple: structuredClone(S.tuple), asset: payload.asset, digests: {
                A: D.evidence('A', digests.A), C: D.evidence('C', digests.C, expectedC, expectedC ? {
                    kind: 'manifest_declaration', source_id: manifest.content_digest ? 'kdna.json' : 'kdna.json/authoring/content_digest'
                } : null), E: D.evidence('E', digests.E, expectedE, expectedE ? {
                    kind: 'checksums_declaration', source_id: 'checksums.json'
                } : null)
            }, ir, ir_digest: irDigest, runtime_entry_names: runtimeNames, expansion_targets: ir.expansion_targets, observation
        };
        const normalized = S.normalized(requestRecord, data);
        await capture.assertUnchanged();
        const issued = await issueOperation({
            credential: copied.credential, provider, manifest, envelope, verified, digests, profile, integrity, source: {
                kind: 'protected_payload'
            }, plaintextDigest: observation.authenticated_plaintext_digest
        });
        originalOperation = issued.operation;
        const native = S.issue(data, issued.operation, issued.receipt, base);
        S.pairRequest(normalized, native.operation);
        retained = true;
        return Object.freeze({
            status: 'accepted', request: normalized, ...native, receipt: issued.receipt, observation: S.frozen(observation), io: S.frozen(io())
        });
    }
    catch (e) {
        const ranges = io().length ? io() : structuredClone(e.capture_io ?? []);
        if (P.isFailure(e)) {
            const out = {
                ...P.failure(e), snapshot: null, operation: null, io: ranges
            };
            C.validate('ProtectedPayloadAdmissionProtectionFailed06', out);
            return S.frozen(out);
        }
        const out = {
            status: 'core_rejected', stage, core: rejected(classify(e), e.component_failure ?? null, e.diagnostic ?? null), snapshot: null, operation: null, io: ranges
        };
        C.validate('ProtectedPayloadAdmissionCoreRejected06', out);
        return S.frozen(out);
    }
    finally {
        plaintext?.fill(0);
        if (!retained) {
            if (originalOperation)
                disposeProtectionOperation(originalOperation);
            if (copied)
                for (const name of ['password', 'grantBytes', 'deviceAgreementPrivateKeyPkcs8'])
                    copied.credential[name]?.fill(0);
        }
        if (capture)
            await capture.close();
    }
}
module.exports = {
    admitProtectedPayloadRequest, inspectProtectedPayloadRequest: S.inspectRequest, createProtectedPayloadReadAuthority: S.createAuthority, admitProtectedSectionNode, inspectProtectedPayloadSnapshot: S.inspectSnapshot, bindProtectedPayloadRequest, disposeProtectedSectionOperation: S.dispose
};
