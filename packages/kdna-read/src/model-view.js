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
const {clone, freeze, jcs} = require('./util.js');

const MODEL_VIEW_CONTRACT = 'kdna.read.model-view/0.2.0';
const VIEWS = Object.freeze(['body', 'full']);

// 0.2.0 body semantics for an exact_selection answer. The closure still names
// every member the selection must be read with, but a member that is not the
// selection arrives reduced: its focus, its core expression and the meaning
// markers (answer kind, form, method term, boundary and exception states,
// whether the question is undecided) stay in place, and the rest of its body
// with its attached component/contract/result entries waits behind the
// expansion handle the reader issued for it. Relationship entries stop
// repeating a body that content.relationships already carries once; the
// reference form names the relation by id. Nothing is lost: the full view
// still returns every field, and every reduced member expands back to its full
// entry — the equivalence is a property the tests rebuild field by field.
// A consumer that pins the 0.1.0 contract is refused explicitly rather than
// served new semantics under an old label.
const REDUCED_ATTACHED_ROLES = Object.freeze(['method_component', 'result_contract', 'result']);

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

// Every public content key, in pipeline order. A mode carries a subset: a catalog
// answer carries the catalog and the index and no judgment body.
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
// An old contract is not served with new semantics: the caller that pins a
// different model-view contract gets an explicit refusal with the upgrade
// guidance instead of a best-effort answer.
function unsupportedAccept(accept) {
  return Object.assign(new Error('model view contract is not served: ' + String(accept)), {
    code: 'READ_MODEL_VIEW_UNSUPPORTED_VERSION',
    guidance: {
      requires: MODEL_VIEW_CONTRACT,
      action:
        'upgrade the Host or CLI to the release that carries this view contract; the previous contract is not served',
    },
  });
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
  // Content keys must all be known, but the set is the mode's, not a fixed list:
  // an unknown key is a shape this projection has not been taught and refuses.
  if (!isObject(envelope.content)) throw viewFailure('unexpected read content shape');
  if (Object.keys(envelope.content).some(key => !CONTENT_KEYS.includes(key)))
    throw viewFailure('unexpected read content shape');
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
function fingerprintOf(envelope, variant, carried, options, mode) {
  const recovery = {view: 'full'};
  if (isText(mode)) recovery.mode = mode;
  const fingerprint = {
    asset: clone(envelope.asset),
    snapshot_id: envelope.snapshot_id,
    request_id: envelope.request_id,
    omitted: {
      envelope: variant.filter(k => !SURFACED_ENVELOPE_KEYS.includes(k)),
      // Only what this answer actually carried can be said to have been moved:
      // a catalog answer never held the handles in the first place.
      content: AUDIT_KEYS.filter(k => carried.includes(k)),
    },
    recovery,
  };
  const attested = observedDigests(envelope);
  if (attested) fingerprint.attested = attested;
  return fingerprint;
}
function isText(value) {
  return typeof value === 'string' && value.length > 0;
}
function reducedValue(value) {
  return {
    id: value.id,
    focus: value.focus,
    core_expression: clone(value.core_expression),
    markers: {
      answer_kind: value.answer_kind,
      form: value.form,
      method_term: value.method?.method?.term ?? null,
      boundaries: value.boundaries?.state ?? 'none',
      exceptions: value.exceptions?.state ?? 'none',
      undecided: value.answer_kind === 'other',
    },
  };
}
function expansionHandleFor(content, target) {
  const descriptor = content.asset_index.find(
    d => jcs(d.target) === jcs(target) && isText(d.handle_id)
  );
  return descriptor ? descriptor.handle_id : null;
}
// The selection keeps its full body, the declarations and the relationship
// layer; only closure members that were not selected fold, and only their own
// attached entries leave with them.
function reduceExactSelection(content) {
  // The retained selection object carries a list; the R2 pipeline shape names
  // one judgment.
  const selected = new Set(content.selected?.judgment_ids ?? []);
  if (isText(content.selected?.judgment_id)) selected.add(content.selected.judgment_id);
  const members = content.closure.filter(e => e.role === 'judgment' && !selected.has(e.target.id));
  // The members fold only when every one of them can name its recovery: a
  // host-minted answer issues one expansion handle per member, and a route
  // that cannot mint handles answers with the full member bodies instead. A
  // mixture of both is a shape this projection has not been taught.
  const handles = members.map(e => expansionHandleFor(content, e.target));
  if (members.length && handles.every(h => h === null)) return content;
  const memberIds = new Set(members.map(e => e.target.id));
  const attached = new Set(
    content.closure
      .filter(e => REDUCED_ATTACHED_ROLES.includes(e.role) && isText(e.owner_judgment_id) && memberIds.has(e.owner_judgment_id))
      .map(e => e.id)
  );
  const memberEntryIds = new Set(members.map(e => e.id));
  const closure = [];
  for (const entry of content.closure) {
    if (attached.has(entry.id)) continue;
    if (entry.role === 'relationship') {
      const {value, ...rest} = entry;
      closure.push({...rest, value_ref: value.id});
      continue;
    }
    if (memberEntryIds.has(entry.id)) {
      if (!isText(entry.value?.id) || !isObject(entry.value.core_expression))
        throw viewFailure('reduced member without its authored body');
      const handle_id = expansionHandleFor(content, entry.target);
      if (handle_id === null)
        throw viewFailure('exact_selection members delivered by a mixture of handles and inline bodies');
      closure.push({
        id: entry.id,
        role: entry.role,
        target: clone(entry.target),
        owner: clone(entry.owner),
        owner_judgment_id: entry.owner_judgment_id,
        state: 'reduced',
        body_delivery: 'deferred',
        value: reducedValue(entry.value),
        handle_id,
      });
      continue;
    }
    closure.push(entry);
  }
  // Edges that touch a folded member -- its own entry or anything attached to
  // it -- travel with the member: its expansion returns its whole scope, and
  // the semantic layer (content.relationships) already names the connections
  // by judgment. Keeping them would pay twice for the same graph.
  const folded = new Set([...attached, ...memberEntryIds]);
  const references = content.references.filter(
    row => !folded.has(row.source_node) && !folded.has(row.target_node)
  );
  return {...content, closure, references};
}
function projectModelView(result, options = {}) {
  const view = options.view ?? 'body';
  if (!VIEWS.includes(view)) throw viewFailure('unknown view: ' + String(view));
  if (options.accept !== undefined && options.accept !== MODEL_VIEW_CONTRACT)
    throw unsupportedAccept(options.accept);
  // A channel that is not a read envelope is not this projection's to reshape.
  if (!isObject(result) || result.channel !== 'read_envelope') return result;
  const envelope = result.envelope;
  // A rejection, a no-body control or a transport failure carries a diagnosis;
  // it reaches the caller verbatim rather than being folded into a body view.
  if (!isObject(envelope) || !PROJECTABLE_STATUSES.includes(envelope.status)) return result;
  const variant = matchedVariant(envelope);
  if (view === 'full') return result;
  const carried = Object.keys(envelope.content);
  // The R2 pipeline shape carries no mode; the caller that issued the request
  // states it, and the retained shape carries its own.
  const mode = isText(options.mode) ? options.mode : isText(envelope.mode) ? envelope.mode : undefined;
  // The reduction reads the asset index too, so it runs against the full
  // content before the body keys are selected.
  let source = envelope.content;
  if (mode === 'exact_selection' && isObject(source.selected))
    source = reduceExactSelection(source);
  const content = Object.fromEntries(BODY_KEYS.filter(k => carried.includes(k)).map(k => [k, clone(source[k])]));
  return freeze({
    // Named view_contract so it cannot be mistaken for the read contract
    // coordinate the full envelope carries in `contract`.
    view_contract: MODEL_VIEW_CONTRACT,
    view: 'body',
    status: envelope.status,
    fingerprint: fingerprintOf(envelope, variant, carried, options, mode),
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
