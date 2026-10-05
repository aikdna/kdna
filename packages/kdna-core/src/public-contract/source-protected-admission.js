'use strict';
// Complete protected source admission on the already authorized, same-FD bytes.
// The native snapshot uses the accepted protected06 brand and original operation.
const { inflateRawSync } = require('node:zlib');
const S = require('./protected-payload-state.js');
const { C } = S;
const D = require('./digests.js');
const P = require('./protection-declaration.js');
const { parseContainer } = require('./container.js');
const { decodeEnvelope } = require('./protection-envelope-codec.js');
const { validateEnvelope, decryptPassword } = require('./protection-crypto.js');
const { verifyIntegrity } = require('./protection-integrity.js');
const { verifyGrant, grantPlaintext } = require('./protection-grant.js');
const { decodeValidatedPayload, assertContentBindings } = require('./semantic-admission.js');
const { buildIR } = require('./canonical-ir.js');
const lifecycle = require('./protection-operation.js');

async function admitSource(bytes, manifestBytes, inputOptions, inputProvider, capture, current, signaturePolicy) {
  let copied, plaintext, originalOperation, native;
  let retained = false;
  try {
    current('admission');
    P.closed(inputOptions, ['credential', 'signaturePolicy']);
    copied = P.options({ credential: inputOptions.credential, signaturePolicy });
    const provider = P.provider(inputProvider, copied.credential.kind);
    const metadata = [];
    const entries = parseContainer(bytes, (raw, maxOutputLength) => inflateRawSync(raw, { maxOutputLength }), metadata);
    C.need(Buffer.from(entries['kdna.json']).equals(Buffer.from(manifestBytes)), 'READ_CORE_INVALID');
    const manifest = C.strict.parseJson(entries['kdna.json']);
    C.validate('ProtectedManifest06Candidate', manifest);
    const profile = P.declaration(manifest, copied.credential, provider);
    const digests = {
      A: D.digest(bytes),
      C: D.digest(D.contentTreePreimage(entries)),
      E: D.digest(D.runtimeEntryPreimage(entries, manifest))
    };
    assertContentBindings(manifest, digests.C);
    const integrity = verifyIntegrity(entries, manifest, digests.E, copied.signaturePolicy);
    const envelope = validateEnvelope(decodeEnvelope(entries['payload.kdnab']), profile);
    current('admission');
    let verified = null;
    if (copied.credential.kind === 'password') {
      plaintext = decryptPassword(envelope, copied.credential, manifest);
    } else {
      verified = verifyGrant(copied.credential.grantBytes, copied.credential, manifest, envelope, digests.A);
      plaintext = grantPlaintext(verified, manifest, envelope);
    }
    C.need(plaintext.length <= 8 * 1024 * 1024, 'READ_CORE_INVALID');
    C.need(Object.values(entries).reduce((n, b) => n + b.length, 0) + plaintext.length <= 20 * 1024 * 1024, 'READ_CORE_INVALID');
    current('admission');
    const payload = decodeValidatedPayload(manifest, plaintext);
    const ir = { ...buildIR(manifest, payload, entries), tuple: structuredClone(S.tuple) };
    C.validate('CanonicalIR06Candidate', ir);
    const irDigest = D.digestCanonical(ir);
    const runtimeNames = D.runtimeEntryNames(entries, manifest);
    const expectedC = manifest.content_digest ?? manifest.authoring?.content_digest ?? null;
    const expectedE = integrity.checksums === 'verified_document_1' ? digests.E : null;
    const observation = {
      representation_profile: S.profile, capture_id: capture.identity.capture_id,
      input_byte_length: bytes.length, ...digests, C_profile_version: '0.2.0', E_profile_version: '0.2.0',
      runtime_entry_names: runtimeNames, logical_entry: 'payload.kdnab',
      ciphertext_member_bytes: entries['payload.kdnab'].length,
      ciphertext_member_digest: D.digest(entries['payload.kdnab']),
      authenticated_plaintext_bytes: plaintext.length, authenticated_plaintext_digest: D.digest(plaintext),
      domain: 'validated_complete_authored_payload', ir_digest: irDigest,
      persisted_section_frames: false, checked_sections: [], proof: 'observation_not_authority',
      tuple: structuredClone(S.tuple), asset: payload.asset, interpretation: 'complete'
    };
    const data = {
      snapshot_id: 'protected-snapshot:' + globalThis.crypto.randomUUID(),
      tuple: structuredClone(S.tuple), asset: payload.asset,
      digests: {
        A: D.evidence('A', digests.A),
        C: D.evidence('C', digests.C, expectedC, expectedC ? {
          kind: 'manifest_declaration', source_id: manifest.content_digest ? 'kdna.json' : 'kdna.json/authoring/content_digest'
        } : null),
        E: D.evidence('E', digests.E, expectedE, expectedE ? {
          kind: 'checksums_declaration', source_id: 'checksums.json'
        } : null)
      },
      ir, ir_digest: irDigest, runtime_entry_names: runtimeNames,
      expansion_targets: ir.expansion_targets, observation
    };
    current('admission');
    await capture.assertUnchanged();
    current('admission');
    const issued = await lifecycle.issueOperation({
      credential: copied.credential, provider, manifest, envelope, verified, digests, profile, integrity,
      source: { kind: 'protected_payload' }, plaintextDigest: observation.authenticated_plaintext_digest
    });
    originalOperation = issued.operation;
    current('admission');
    native = S.issue(data, originalOperation, issued.receipt, null);
    const bound = S.bind(native.operation);
    C.need(bound, 'READ_CORE_CAPABILITY_UNAVAILABLE');
    const members = metadata.map(row => ({ ...row, bytes: Buffer.from(entries[row.name]) }));
    const inventory = members.map(({ bytes: content, ...row }) => ({ ...row, size: content.length, sha256: D.digest(content) }));
    retained = true;
    return {
      manifest, payload, entries, members, inventory, plaintext,
      plaintextDigest: D.digest(plaintext), digests, snapshot: native.snapshot,
      receipt: issued.receipt, binding: bound.binding,
      dispose() { S.dispose(native.operation); plaintext.fill(0); }
    };
  } finally {
    if (!retained) {
      plaintext?.fill(0);
      if (native) S.dispose(native.operation);
      else if (originalOperation) lifecycle.disposeProtectionOperation(originalOperation);
      if (copied) for (const key of ['password', 'grantBytes', 'deviceAgreementPrivateKeyPkcs8']) copied.credential[key]?.fill(0);
    }
  }
}

module.exports = { admitSource };
