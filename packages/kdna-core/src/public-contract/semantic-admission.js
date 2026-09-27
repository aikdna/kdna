'use strict';

const { reject, freeze } = require('./strict-input.js');
const { decodePayload } = require('./cbor.js');
const { digest, digestCanonical, runtimeEntryNames, evidence } = require('./digests.js');
const { validate } = require('./validate.js');
const { buildIR } = require('./canonical-ir.js');
const { issueSnapshot } = require('./brand.js');
const { versionTuple, core_terms } = require('./generated-contract.json');
const { assertPayload } = require('./cross-entry.js');

// The decoded-value half of the one semantic path. B3 needs it because a revision
// preview validates a PROPOSED decoded Payload value, not bytes; re-encoding the value
// to bytes would be a second parse of proposed content and would move the failure codes.
// Pure: no I/O, no clock, no provider, no randomness, no mutation of `payload`.
function validateDecodedPayload(manifest, payload) {
  const validated = validate('Payload', payload);
  if (validated.asset.asset_id !== manifest.asset_id || validated.asset.asset_version !== manifest.version || validated.asset.judgment_version !== manifest.judgment_version) reject('READ_CORE_INVALID');
  assertPayload(validated, core_terms);
  return validated;
}
function decodeValidatedPayload(manifest, payloadBytes) {
  const payload = validateDecodedPayload(manifest, decodePayload(payloadBytes));
  return payload;
}
function assertContentBindings(manifest, C) {
  if ((manifest.content_digest && manifest.content_digest !== C) || (manifest.authoring?.content_digest && manifest.authoring.content_digest !== C)) reject('READ_CORE_INVALID');
}
function interpretValidatedPayload(manifest,payload,entries) {
  try { return {status:'accepted',ir:buildIR(manifest,payload,entries)}; }
  catch(error) {
    // R2 never issues a catalog carrier for uninterpreted critical semantics.
    throw error;
  }
}
function finishAdmission(manifest, payload, entries, { A, C, E }, expectedE = null) {
  const digests = {
    A: evidence('A', A),
    C: evidence('C', C, manifest.content_digest ?? null, manifest.content_digest ? { kind: 'manifest_declaration', source_id: 'kdna.json' } : null),
    E: evidence('E', E, expectedE, expectedE ? { kind: 'checksums_declaration', source_id: 'checksums.json' } : null),
  };
  const interpreted=interpretValidatedPayload(manifest,payload,entries);
  const ir=interpreted.ir;
  const uuid = globalThis.crypto?.randomUUID?.();
  if (!uuid) reject('READ_CORE_CAPABILITY_UNAVAILABLE');
  const data = { snapshot_id: 'snapshot:' + uuid, tuple: versionTuple, asset: payload.asset, digests, ir, ir_digest: digestCanonical(ir), runtime_entry_names: runtimeEntryNames(entries, manifest), expansion_targets: ir.expansion_targets };
  return freeze({ status: 'accepted', snapshot: issueSnapshot(data) });
}
module.exports = { decodeValidatedPayload, validateDecodedPayload, assertContentBindings, finishAdmission, interpretValidatedPayload };
