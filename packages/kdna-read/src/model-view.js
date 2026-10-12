'use strict';
// The default surface a model consumer receives is the author body plus one
// fingerprint. Contract material, the target index and the expansion handles
// are not deleted: the same read re-requested with the full view returns every
// field in one call. The projection refuses an unrecognised shape instead of
// dropping a field it does not know, so structural losslessness is a property
// of the representation rather than a promise about today's field list.
const {createHash} = require('node:crypto');
const {clone, freeze, jcs} = require('./util.js');

const MODEL_VIEW_CONTRACT = 'kdna.read.model-view/0.1.0';
const VIEWS = Object.freeze(['body', 'full']);

// The complete public envelope of a ready read, in schema order.
const ENVELOPE_KEYS = Object.freeze([
  'contract', 'request_id', 'status', 'tuple', 'asset', 'snapshot_id', 'digests',
  'content', 'states', 'diagnostics', 'omissions', 'assessment', 'receipt', 'budget',
]);
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
// Envelope fields the fingerprint stands for on the default surface.
const OMITTED_ENVELOPE_KEYS = Object.freeze(
  ENVELOPE_KEYS.filter(k => !['content', 'asset', 'snapshot_id', 'status'].includes(k)),
);

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
function digest(value) {
  return 'sha256:' + createHash('sha256').update(jcs(value)).digest('hex');
}
function fingerprintOf(envelope, options) {
  const recovery = {view: 'full'};
  if (typeof options.mode === 'string' && options.mode) recovery.mode = options.mode;
  return {
    asset: clone(envelope.asset),
    snapshot_id: envelope.snapshot_id,
    // Binds the whole pre-projection result, so a consumer can tell that the
    // body it received belongs to the read it asked for.
    result_digest: digest(envelope),
    omitted: {envelope: [...OMITTED_ENVELOPE_KEYS], content: [...AUDIT_KEYS]},
    recovery,
  };
}
function projectModelView(result, options = {}) {
  const view = options.view ?? 'body';
  if (!VIEWS.includes(view)) throw viewFailure('unknown view: ' + String(view));
  // A channel that is not a read envelope is not this projection's to reshape.
  if (!isObject(result) || result.channel !== 'read_envelope') return result;
  const envelope = result.envelope;
  // A rejection, a no-body control or a transport failure carries a diagnosis;
  // it reaches the caller verbatim rather than being folded into a body view.
  if (!isObject(envelope) || envelope.status !== 'ready') return result;
  if (!exactShape(envelope, ENVELOPE_KEYS)) throw viewFailure('unexpected read envelope shape');
  if (!exactShape(envelope.content, CONTENT_KEYS)) throw viewFailure('unexpected read content shape');
  if (view === 'full') return result;
  const content = Object.fromEntries(BODY_KEYS.map(k => [k, clone(envelope.content[k])]));
  return freeze({
    // Named view_contract so it cannot be mistaken for the read contract
    // coordinate the full envelope carries in `contract`.
    view_contract: MODEL_VIEW_CONTRACT,
    view: 'body',
    status: envelope.status,
    fingerprint: fingerprintOf(envelope, options),
    content,
  });
}
module.exports = {
  projectModelView,
  MODEL_VIEW_CONTRACT,
  VIEWS,
  ENVELOPE_KEYS,
  CONTENT_KEYS,
  BODY_KEYS,
  AUDIT_KEYS,
};
