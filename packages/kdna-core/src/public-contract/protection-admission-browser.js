'use strict';
// Browser protected admission core (case A: an independent browser entry).
//
// The host supplies the container bytes, the payload plaintext bytes and the
// unlock observation; nothing here decrypts, and the observation is never
// authority (its provenance limit is named in the disclosure). The five-step
// admission mirrors the retained node entry's structure and codes; the kdsig
// face follows the browser family route (globalThis.crypto subtle, same
// kdsig.ed25519:0.1.0 framing as the node helper), and the checksums document
// is verified against a verbatim local port of protection-integrity.makeChecksums
// (that module is node-bound by its kdsig helper import).
const { parseJson, canonicalJson, freeze, uint, identifier } = require('./strict-input.js');
const { parseContainer } = require('./container.js');
const { inflate } = require('./browser-native/portable-inflate.js');
const { utf8, fromHex } = require('./browser-native/bytes.js');
const { digest, contentTreePreimage, runtimeEntryPreimage, runtimeEntryNames } = require('./digests.js');
const { validate } = require('./validate.js');
const { rejected } = require('./admit.js');
const { decodeValidatedPayload, assertContentBindings, finishAdmission } = require('./semantic-admission.js');
const { fail, failure, isFailure, closed, provider, assetProtectionDeclaration } = require('./protection-declaration.js');
const { decodeEnvelope, validateEnvelopeShape } = require('./protection-envelope-codec.js');
const { signatureContentPreimage } = require('./browser-native/signature-domain.js');
const { ChecksumsDocument1: checksumsShape } = require('./protection-validators.generated.js');
function checkDeclaration(manifest) {
  const profile = assetProtectionDeclaration(manifest);
  if (!profile) fail('NOT_DECLARED', 'declaration');
  if (profile.id !== 'kdna.envelope.aead') fail('PROFILE_UNSUPPORTED', 'declaration');
  if (manifest.entitlement.offline === false || manifest.entitlement.revocable === true) fail('DECLARATION_CONFLICT', 'authorization');
  return profile;
}
function inputs(value, inputProvider) {
  closed(value, ['bytes', 'plaintextPayload', 'observation'], ['signaturePolicy']);
  if (!(value.bytes instanceof Uint8Array) || !(value.plaintextPayload instanceof Uint8Array)) fail('INPUT_INVALID', 'input');
  const policy = value.signaturePolicy === undefined ? { requireSignature: false, expectedPublicKeyHex: null } : closed(value.signaturePolicy, ['requireSignature', 'expectedPublicKeyHex']);
  if (typeof policy.requireSignature !== 'boolean' || (policy.expectedPublicKeyHex !== null && (typeof policy.expectedPublicKeyHex !== 'string' || !/^[0-9a-f]{64}$/.test(policy.expectedPublicKeyHex)))) fail('INPUT_INVALID', 'input');
  const o = closed(value.observation, ['kind', 'proof', 'checked_at_ms', 'selection']);
  if (o.kind !== 'consumer_unlock_observation' || o.proof !== 'observation_not_authority' || !uint(o.checked_at_ms)) fail('OBSERVATION_INVALID', 'observation');
  const s = closed(o.selection, ['slotIndex', 'slot', 'kdf_profile']);
  if (!uint(s.slotIndex) || !identifier(s.slot) || !['scrypt-sha256', 'argon2id'].includes(s.kdf_profile)) fail('OBSERVATION_INVALID', 'observation');
  return { bytes: new Uint8Array(value.bytes), plaintext: new Uint8Array(value.plaintextPayload), observation: { kind: o.kind, proof: o.proof, checked_at_ms: o.checked_at_ms, selection: { slotIndex: s.slotIndex, slot: s.slot, kdf_profile: s.kdf_profile } }, signaturePolicy: { ...policy }, trustedProvider: provider(inputProvider, 'password') };
}
function assertObservationBinding(observation, envelope) {
  const slots = envelope.key_slots;
  if (observation.selection.slotIndex >= slots.length) fail('OBSERVATION_BINDING_INVALID', 'binding');
  const slot = slots[observation.selection.slotIndex];
  if (slot.slot !== observation.selection.slot || slot.kdf_profile !== observation.selection.kdf_profile) fail('OBSERVATION_BINDING_INVALID', 'binding');
}
// Verbatim port of protection-integrity.makeChecksums (node-bound there).
function makeChecksums(entries, manifest, E) {
  const names = runtimeEntryNames(entries, manifest);
  return { profile: 'kdna.checksums.document/1', profile_version: '1.0.0', algorithm: 'sha256', digest_profile: 'kdna.digest-basis.runtime-entry-set', digest_profile_version: '0.2.0', covered_entries: names, entries: names.map(name => ({ name, bytes: entries[name].length, digest: digest(entries[name]) })), entry_set_digest: E };
}
function parseKdsigBundle(raw) {
  // The same bundle domain the node helper and the browser section verifier accept.
  if (raw.length < 3 || raw.length > 1048576) fail('SIGNATURE_INVALID', 'integrity');
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) fail('SIGNATURE_INVALID', 'integrity');
  let value;
  try { value = parseJson(raw); } catch { fail('SIGNATURE_INVALID', 'integrity'); }
  const fields = ['algorithm', 'content_digest', 'profile', 'profile_version', 'public_key', 'signature'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== fields.length || !fields.every(k => Object.hasOwn(value, k) && typeof value[k] === 'string')) fail('SIGNATURE_INVALID', 'integrity');
  if (!/^sha256:[0-9a-f]{64}$/.test(value.content_digest) || !/^[0-9a-f]{64}$/.test(value.public_key) || !/^[0-9a-f]{128}$/.test(value.signature)) fail('SIGNATURE_INVALID', 'integrity');
  if (value.profile !== 'kdsig.ed25519' || value.profile_version !== '0.1.0' || value.algorithm !== 'ed25519') fail('PROFILE_UNSUPPORTED', 'integrity');
  return value;
}
async function verifyIntegrityBrowser(entries, manifest, E, policy) {
  const integrity = { checksums: 'absent', signature: 'absent', signature_content_digest: null };
  if (Object.hasOwn(entries, 'checksums.json')) {
    const raw = entries['checksums.json']; let value;
    try { if (raw.length > 1048576) throw Error(); value = parseJson(raw); } catch { fail('CHECKSUMS_INVALID', 'integrity'); }
    if (value?.profile !== 'kdna.checksums.document/1' || value?.profile_version !== '1.0.0') fail('PROFILE_UNSUPPORTED', 'integrity');
    if (!checksumsShape(value) || canonicalJson(value) !== canonicalJson(makeChecksums(entries, manifest, E))) fail('CHECKSUMS_INVALID', 'integrity');
    integrity.checksums = 'verified_document_1';
  }
  if (Object.hasOwn(entries, 'signature.kdsig')) {
    const bundle = parseKdsigBundle(entries['signature.kdsig']);
    if (policy.expectedPublicKeyHex !== null && bundle.public_key !== policy.expectedPublicKeyHex) fail('SIGNATURE_PIN_MISMATCH', 'integrity');
    const signatureDigest = digest(signatureContentPreimage(entries));
    if (bundle.content_digest !== signatureDigest) fail('SIGNATURE_INVALID', 'integrity');
    const subtle = globalThis.crypto?.subtle;
    if (!subtle || typeof subtle.importKey !== 'function' || typeof subtle.verify !== 'function') throw Object.assign(new Error('WebCrypto Ed25519 unavailable'), { reason: 'READ_CORE_CAPABILITY_UNAVAILABLE' });
    try {
      const key = await subtle.importKey('raw', fromHex(bundle.public_key), 'Ed25519', false, ['verify']);
      const ok = await subtle.verify('Ed25519', key, fromHex(bundle.signature), utf8('kdsig.ed25519:0.1.0:' + signatureDigest));
      if (ok !== true) fail('SIGNATURE_INVALID', 'integrity');
    } catch (error) { if (isFailure(error)) throw error; throw Object.assign(new Error('WebCrypto Ed25519 failed'), { reason: 'READ_CORE_CAPABILITY_UNAVAILABLE' }); }
    integrity.signature = policy.expectedPublicKeyHex === null ? 'verified_self_key' : 'verified_pinned_key';
    integrity.signature_content_digest = signatureDigest;
  } else if (policy.requireSignature || policy.expectedPublicKeyHex !== null) fail('SIGNATURE_INVALID', 'integrity');
  return integrity;
}
async function admitProtectedBrowser(input, inputProvider) {
  let copied = null, plaintext = null, stage = 'input';
  try {
    copied = inputs(input, inputProvider); plaintext = copied.plaintext; const bytes = copied.bytes;
    stage = 'container'; const entries = parseContainer(bytes, inflate);
    stage = 'manifest'; const manifest = validate('Manifest', parseJson(entries['kdna.json']));
    const profile = checkDeclaration(manifest);
    const digests = { A: digest(bytes), C: digest(contentTreePreimage(entries)), E: digest(runtimeEntryPreimage(entries, manifest)) };
    assertContentBindings(manifest, digests.C);
    const integrity = await verifyIntegrityBrowser(entries, manifest, digests.E, copied.signaturePolicy);
    const envelope = validateEnvelopeShape(decodeEnvelope(entries['payload.kdnab']), profile);
    assertObservationBinding(copied.observation, envelope);
    stage = 'payload'; const payload = decodeValidatedPayload(manifest, plaintext);
    stage = 'interpretation'; const result = finishAdmission(manifest, payload, entries, digests, integrity.checksums === 'verified_document_1' ? digests.E : null);
    const disclosure = freeze({ slot_selection: { ...copied.observation.selection }, observation_not_authority: true, provenance: 'host_supplied_triple' });
    return freeze(result.status === 'accepted' ? { status: 'accepted', snapshot: result.snapshot, disclosure } : { status: 'catalog_only', catalog: result, disclosure });
  } catch (error) {
    if (isFailure(error) || stage === 'input') return failure(error);
    return freeze({ status: 'core_rejected', stage, core: rejected(error?.code === 'MODULE_NOT_FOUND' ? 'READ_CORE_CAPABILITY_UNAVAILABLE' : error?.reason ?? 'READ_CORE_INVALID', error.component_failure ?? null, error.diagnostic ?? null) });
  } finally {
    plaintext?.fill(0);
  }
}
module.exports = { admitProtectedBrowser };
