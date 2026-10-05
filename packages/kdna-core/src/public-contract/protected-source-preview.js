'use strict';
// Validation-only revision preview.
//
// This is the semantic step shared by preview and produce. It validates a PROPOSED
// decoded Payload against a Manifest through the one existing Core semantic path,
// and asks the existing Canonical IR builder whether the proposal is interpretable.
// It never calls `finishAdmission`: there is no final ciphertext yet, so there is no
// snapshot, no C/E self-binding, no checksums/signature claim and no final A to make.
//
// Pure: no I/O, no clock, no provider call, no randomness, no mutation of the
// caller's values. The caller's proposed Manifest and Payload are passed to
// `validate()`, which returns its own validated value.
const { validate } = require('./validate.js');
const { validateDecodedPayload } = require('./semantic-admission.js');
const { buildIR } = require('./canonical-ir.js');

const INCOMPLETE = 'READ_INTERPRETATION_INCOMPLETE';

function interpret(manifest, payload, entries) {
  try {
    return { status: 'valid', ir: buildIR(manifest, payload, entries) };
  } catch (error) {
    if (error?.reason !== INCOMPLETE) throw error;
    return { status: 'incomplete', detail: error?.diagnostic ?? null };
  }
}

// Returns { semantic_status, payload? , detail? }. `semantic_status:'valid'` means
// the proposal is a structurally and semantically admissible authoring value for
// this Manifest — never that a container, snapshot, grant or signature exists.
function validateProposedRevision(manifest, payload, entries) {
  const validatedManifest = validate('Manifest', manifest);
  const validatedPayload = validateDecodedPayload(validatedManifest, payload);
  const interpreted = interpret(validatedManifest, validatedPayload, entries);
  if (interpreted.status !== 'valid') {
    return { semantic_status: 'incomplete', detail: interpreted.detail };
  }
  return { semantic_status: 'valid', manifest: validatedManifest, payload: validatedPayload, ir: interpreted.ir };
}

module.exports = { validateProposedRevision };
