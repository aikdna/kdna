'use strict';
// The default surface a model consumer receives is the author body plus one
// fingerprint. Contract material, the target index and the expansion handles
// are not deleted: the same read re-requested with the full view returns every
// field in one call. The projection refuses an unrecognised shape instead of
// dropping a field it does not know, so structural losslessness is a property
// of the representation rather than a promise about today's field list.
//
// The fingerprint carries identity the reader already attested -- asset,
// snapshot, request and the observed A/C/E digests -- rather than a hash this
// module computes. That keeps the module free of any platform binding, which
// the root entry requires: it is loaded in a browser sandbox with no Node
// builtins and no WebCrypto.
const {clone, freeze} = require('./util.js');

const MODEL_VIEW_CONTRACT = 'kdna.read.model-view/0.1.0';
const VIEWS = Object.freeze(['body', 'full']);

// The public read result exists in two envelope shapes. The exact R2 pipeline
// emits the first; the sections/retained reader the native CLI and the MCP
// adapter consume emits the second, which also carries its mode and its
// verification proof. Both carry the same content object.
const PIPELINE_ENVELOPE_KEYS = Object.freeze([
  'contract', 'request_id', 'status', 'tuple', 'asset', 'snapshot_id', 'digests',
  'content', 'states', 'diagnostics', 'omissions', 'assessment', 'receipt', 'budget',
]);
const RETAINED_ENVELOPE_KEYS = Object.freeze([
  'contract', 'mode', 'request_id', 'status', 'tuple', 'asset', 'snapshot_id',
  'digests', 'content', 'states', 'diagnostics', 'omissions', 'assessment',
  'verification', 'receipt', 'budget',
]);
const ENVELOPE_VARIANTS = Object.freeze([PIPELINE_ENVELOPE_KEYS, RETAINED_ENVELOPE_KEYS]);
// A catalog read answers with the catalog and no judgment body; that is still a
// body, so it projects rather than passing through as a non-answer.
const PROJECTABLE_STATUSES = Object.freeze(['ready', 'catalog_only']);

// The complete public content object, in pipeline order.
const CONTENT_KEYS = Object.freeze([
  'declarations', 'catalog', 'selected', 'closure', 'references', 'relationships',
  'missing', 'provenance', 'asset_capability', 'asset_index', 'expansion_handles',
]);
// What the author wrote or named stays on the default surface.
const BODY_KEYS = Object.freeze([
  'declarations', 'catalog', 'selected', 'closure', 'references', 'relationships',
  'missing', 'provenance', 'asset_capability',
]);
// Reachability machinery: an index of expandable targets and the handles that
// stand for them. Arriving material, not content.
const AUDIT_KEYS = Object.freeze(['asset_index', 'expansion_handles']);
// Envelope fields restated on the default surface rather than omitted.
const SURFACED_ENVELOPE_KEYS = Object.freeze([
  'content', 'status', 'asset', 'snapshot_id', 'request_id',
]);

function viewFailure(message) {
  return Object.assign(new Error(message), {code: 'READ_MODEL_VIEW_UNAVAILABLE'});
}
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
// Membership has to be exact in both directions: a missing expected key and an
// unexpected extra key are both shapes this projection has not been taught.
function exactShape(value, names) {
  return (
    isObject(value) &&
    Object.keys(value).length === names.length &&
    names.every(k => Object.hasOwn(value, k))
  );
}
function matchedVariant(envelope) {
  const match = ENVELOPE_VARIANTS.find(variant => exactShape(envelope, variant));
  if (!match) throw viewFailure('unexpected read envelope shape');
  if (!exactShape(envelope.content, CONTENT_KEYS)) throw viewFailure('unexpected read content shape');
  return match;
}
// The observed digests only: the basis, profile and comparison records around
// them are contract material and stay on the full view.
function observedDigests(envelope) {
  const source = envelope.digests;
  if (!isObject(source)) return null;
  const observed = {};
  for (const key of ['A', 'C', 'E'])
    if (isObject(source[key]) && typeof source[key].observed === 'string') observed[key] = source[key].observed;
  return Object.keys(observed).length ? observed : null;
}
function fingerprintOf(envelope, variant, options) {
  const recovery = {view: 'full'};
  if (typeof options.mode === 'string' && options.mode) recovery.mode = options.mode;
  const fingerprint = {
    asset: clone(envelope.asset),
    snapshot_id: envelope.snapshot_id,
    request_id: envelope.request_id,
    omitted: {
      envelope: variant.filter(k => !SURFACED_ENVELOPE_KEYS.includes(k)),
      content: [...AUDIT_KEYS],
    },
    recovery,
  };
  const attested = observedDigests(envelope);
  if (attested) fingerprint.attested = attested;
  return fingerprint;
}
function projectModelView(result, options = {}) {
  const view = options.view ?? 'body';
  if (!VIEWS.includes(view)) throw viewFailure('unknown view: ' + String(view));
  // A channel that is not a read envelope is not this projection's to reshape.
  if (!isObject(result) || result.channel !== 'read_envelope') return result;
  const envelope = result.envelope;
  // A rejection, a no-body control or a transport failure carries a diagnosis;
  // it reaches the caller verbatim rather than being folded into a body view.
  if (!isObject(envelope) || !PROJECTABLE_STATUSES.includes(envelope.status)) return result;
  const variant = matchedVariant(envelope);
  if (view === 'full') return result;
  const content = Object.fromEntries(BODY_KEYS.map(k => [k, clone(envelope.content[k])]));
  return freeze({
    // Named view_contract so it cannot be mistaken for the read contract
    // coordinate the full envelope carries in `contract`.
    view_contract: MODEL_VIEW_CONTRACT,
    view: 'body',
    status: envelope.status,
    fingerprint: fingerprintOf(envelope, variant, options),
    content,
  });
}
module.exports = {
  projectModelView,
  MODEL_VIEW_CONTRACT,
  VIEWS,
  PIPELINE_ENVELOPE_KEYS,
  RETAINED_ENVELOPE_KEYS,
  CONTENT_KEYS,
  BODY_KEYS,
  AUDIT_KEYS,
};
