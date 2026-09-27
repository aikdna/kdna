'use strict';
// Private half of the public PackageSet admission subpath.
//
// It owns the three things the accepted internal decider deliberately does not:
// a recursive pure capture that runs before strict-input.copyJson ever sees a
// caller object, the owner-exclusive member bytes, and the Core-private brand
// that makes a member observation genuine. It never exports the internal
// decider, and no caller-supplied JSON value can stand in for an observation.
const { types: utilTypes } = require('node:util');
const { copyJson, canonicalJson, freeze, identifier } = require('./strict-input.js');
const { inspectSnapshot } = require('./brand.js');
const { decidePackageSet, verifyHandoffBindings } = require('./package-set.js');
const { inspectAdmittedPlan } = require('./execution.js');
const contract = require('./package-set-contract.generated.json');

const descriptor = contract.descriptor;
const keySets = contract.key_sets;
const LIMITS = Object.freeze({ ...descriptor.limits });
const LOCAL_FAILURES = Object.freeze([...descriptor.local_failures]);
const OPERATIONS = Object.freeze(['isolated_read', 'semantic_merge', 'cross_asset_reference']);
const DIGEST = /^sha256:[0-9a-f]{64}$/;

const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const BYTE_LENGTH = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'byteLength').get;
const BYTE_OFFSET = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'byteOffset').get;
const BUFFER = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'buffer').get;
const TAG = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, Symbol.toStringTag).get;
const DETACHED = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'detached');

// A local failure is a closed code generated from the single semantic source; a
// thrown value carries one and nothing else can become one.
function localFailure(code) {
  if (!LOCAL_FAILURES.includes(code)) throw new Error('Undisclosed PackageSet local failure ' + code);
  return Object.assign(new Error(code), { packageSetLocal: code });
}

// A malformed PackageSet (or its selection) is an independent R07 rejection, not
// a local failure: it has its own accepted diagnostic and its own precedence.
function shapeFailure() {
  return Object.assign(new Error('READ_INPUT_INVALID'), { packageSetR07: 'READ_INPUT_INVALID' });
}

function failureCode(error) {
  return error && typeof error.packageSetLocal === 'string' ? error.packageSetLocal : null;
}

// --- recursive pure capture ---------------------------------------------------
//
// Proxy detection runs before any reflection that could fire a trap, so a
// hostile object is rejected without a getter, iterator, toJSON, custom
// prototype or conversion hook ever running. Only an own enumerable *data*
// descriptor is read, and the returned tree is built here, so no caller-owned
// mutable reference ever survives an await.
function ownDataFields(value, typeName, code) {
  if (value === null || typeof value !== 'object') throw localFailure(code);
  if (utilTypes.isProxy(value)) throw localFailure(code);
  if (Array.isArray(value)) throw localFailure(code);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw localFailure(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) throw localFailure(code);
  const shape = keySets[typeName];
  if (!shape) throw new Error('No generated key set for ' + typeName);
  const captured = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    const own = Object.getOwnPropertyDescriptor(value, key);
    if (!own || !Object.hasOwn(own, 'value') || own.enumerable !== true || !shape.keys.includes(key)) throw localFailure(code);
    captured[key] = own.value;
  }
  for (const key of shape.required) if (!Object.hasOwn(captured, key)) throw localFailure(code);
  return captured;
}

function ownDenseArray(value, code) {
  if (utilTypes.isProxy(value)) throw localFailure(code);
  if (!Array.isArray(value)) throw localFailure(code);
  if (Object.getPrototypeOf(value) !== Array.prototype) throw localFailure(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) throw localFailure(code);
  const names = Object.getOwnPropertyNames(value);
  if (names.length !== value.length + 1 || names[names.length - 1] !== 'length') throw localFailure(code);
  const out = [];
  for (let index = 0; index < value.length; index++) {
    if (names[index] !== String(index)) throw localFailure(code);
    const own = Object.getOwnPropertyDescriptor(value, String(index));
    if (!own || !Object.hasOwn(own, 'value') || own.enumerable !== true) throw localFailure(code);
    out.push(own.value);
  }
  const lengthOwn = Object.getOwnPropertyDescriptor(value, 'length');
  if (!lengthOwn || !Object.hasOwn(lengthOwn, 'value') || lengthOwn.enumerable === true) throw localFailure(code);
  if (!Number.isSafeInteger(value.length)) throw localFailure(code);
  return out;
}

function asIdentifier(value, code) {
  if (!identifier(value)) throw localFailure(code);
  return value;
}

function asDigest(value, code) {
  if (typeof value !== 'string' || !DIGEST.test(value)) throw localFailure(code);
  return value;
}

function capturePackageMember(value) {
  const captured = ownDataFields(value, 'PackageMember', 'invalid_read_request');
  try {
    return {
      member_id: asIdentifier(captured.member_id, 'invalid_read_request'),
      asset_id: asIdentifier(captured.asset_id, 'invalid_read_request'),
      asset_version: asIdentifier(captured.asset_version, 'invalid_read_request'),
      A: asDigest(captured.A, 'invalid_read_request'),
    };
  } catch (error) {
    // A malformed member record is a PackageSet shape failure, never local.
    if (failureCode(error)) throw shapeFailure();
    throw error;
  }
}

function captureSelection(value) {
  const captured = ownDataFields(value, 'Selection', 'invalid_read_request');
  try {
    return {
      asset_id: asIdentifier(captured.asset_id, 'invalid_read_request'),
      asset_version: asIdentifier(captured.asset_version, 'invalid_read_request'),
      judgment_id: asIdentifier(captured.judgment_id, 'invalid_read_request'),
    };
  } catch (error) {
    if (failureCode(error)) throw shapeFailure();
    throw error;
  }
}

// The caller's member array preserves order and duplicates exactly; nothing is
// folded and no identifier is invented.
function capturePackageSet(value) {
  const captured = ownDataFields(value, 'PackageSet', 'invalid_read_request');
  let members;
  let selection;
  try {
    members = ownDenseArray(captured.members, 'invalid_read_request', 'set.members').map(capturePackageMember);
    selection = captureSelection(captured.selection);
    if (members.length === 0) throw localFailure('invalid_read_request');
    if (members.length > LIMITS.maxMembers) throw localFailure('invalid_read_request');
  } catch (error) {
    if (failureCode(error)) throw shapeFailure();
    throw error;
  }
  return { set_id: asIdentifier(captured.set_id, 'invalid_read_request'), members, selection };
}

function captureTuple(value) {
  const captured = ownDataFields(value, 'VersionTuple', 'invalid_read_request');
  for (const key of keySets.VersionTuple.required) if (typeof captured[key] !== 'string' || captured[key].length === 0) throw localFailure('invalid_read_request');
  return { ...captured };
}

// --- owner-exclusive member bytes --------------------------------------------
//
// Length comes from the intrinsic TypedArray accessors of a genuine non-Proxy
// Uint8Array. A Proxy, a shared backing store, a detached view, a non-Uint8Array
// and a malformed source record each have their own accepted local code, and the
// copy completes before the first await. The running total is compared against
// the remaining allowance instead of being summed first, so the declared
// configuration ceiling leaves no reachable integer overflow.
function copyIntrinsicBytes(view) {
  if (utilTypes.isProxy(view)) throw localFailure('invalid_member_source');
  let length;
  let offset;
  let buffer;
  try {
    length = BYTE_LENGTH.call(view);
    offset = BYTE_OFFSET.call(view);
    buffer = BUFFER.call(view);
    if (TAG.call(view) !== 'Uint8Array') throw localFailure('invalid_member_source');
  } catch (error) {
    if (failureCode(error)) throw error;
    throw localFailure('invalid_member_source');
  }
  if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) throw localFailure('invalid_member_source');
  if (!(buffer instanceof ArrayBuffer)) throw localFailure('invalid_member_source');
  if (DETACHED && typeof DETACHED.get === 'function' && DETACHED.get.call(buffer) === true) throw localFailure('invalid_member_source');
  if (!Number.isSafeInteger(length) || !Number.isSafeInteger(offset) || length < 0 || offset < 0) throw localFailure('invalid_member_source');
  const owned = new Uint8Array(length);
  if (length > 0) owned.set(new Uint8Array(buffer, offset, length));
  return owned;
}

function captureMemberSource(value, index, remaining) {
  const captured = ownDataFields(value, 'PackageSetMemberSource', 'invalid_member_source');
  const memberId = captured.member_id;
  if (!identifier(memberId)) throw localFailure('invalid_member_source');
  const bytes = copyIntrinsicBytes(captured.bytes);
  if (bytes.length > remaining) throw localFailure('source_bytes_limit_exceeded');
  return { member_id: memberId, index, bytes, length: bytes.length };
}

// --- limits -------------------------------------------------------------------
function captureLimits(value) {
  const captured = ownDataFields(value, 'PackageSetLimits', 'invalid_limits');
  const positiveSafeUInt = candidate => typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate > 0;
  if (!positiveSafeUInt(captured.maxMembers) || captured.maxMembers > LIMITS.maxMembers) throw localFailure('invalid_limits');
  if (!positiveSafeUInt(captured.maxTotalSourceBytes) || captured.maxTotalSourceBytes > LIMITS.maxTotalSourceBytes) throw localFailure('invalid_limits');
  return { maxMembers: captured.maxMembers, maxTotalSourceBytes: captured.maxTotalSourceBytes };
}

// --- the trusted member provider brand ----------------------------------------
const memberProviders = new WeakMap();

function createTrustedPackageSetMemberProvider(config) {
  let captured;
  try {
    captured = ownDataFields(config, 'PackageSetMemberProviderConfig', 'invalid_read_request');
  } catch {
    throw new TypeError('PackageSet member provider configuration required');
  }
  if (!identifier(captured.host_id) || !identifier(captured.host_epoch)) throw new TypeError('PackageSet member provider host identity required');
  if (typeof captured.observe !== 'function') throw new TypeError('PackageSet member observer required');
  const provider = Object.freeze({});
  memberProviders.set(provider, { host_id: captured.host_id, host_epoch: captured.host_epoch, observe: captured.observe, current_ms: null });
  return provider;
}

function memberProviderState(provider) {
  return provider && typeof provider === 'object' ? memberProviders.get(provider) ?? null : null;
}

// --- member observation -------------------------------------------------------
//
// The pairing unit is the de-duplicated full identity
// (member_id, asset_id, asset_version, A). Rows are compared item by item: the
// original set and source arrays are never folded, an undeclared identity or a
// second row for the same identity is a provider observation failure, and a
// single valid deny (or no row at all) is an authorization failure. No first
// cause is invented when no observation happened.
function captureObservation(state, set, operation, phase) {
  let raw;
  try {
    raw = state.observe(freeze({ set_id: set.set_id, members: set.members.map(member => ({ ...member })), selection: { ...set.selection }, operation, phase }));
  } catch {
    throw localFailure('provider_failed');
  }
  const returned = ownDataFields(raw, 'PackageSetMemberObservation', 'provider_observation_invalid');
  const rawRows = ownDenseArray(returned.decisions, 'provider_observation_invalid', 'decisions');
  if (rawRows.length > LIMITS.maxMembers) throw localFailure('provider_observation_invalid');
  const rows = [];
  const seen = new Set();
  for (const candidate of rawRows) {
    const row = ownDataFields(candidate, 'PackageSetMemberObservationRow', 'provider_observation_invalid');
    for (const key of ['member_id', 'asset_id', 'host_id', 'host_epoch', 'decision_id']) if (!identifier(row[key])) throw localFailure('provider_observation_invalid');
    if (!identifier(row.asset_version)) throw localFailure('provider_observation_invalid');
    if (!DIGEST.test(row.A)) throw localFailure('provider_observation_invalid');
    if (row.decision !== 'allow' && row.decision !== 'deny') throw localFailure('provider_observation_invalid');
    for (const key of ['issued_at', 'expires_at', 'current_ms']) if (typeof row[key] !== 'number' || !Number.isSafeInteger(row[key]) || row[key] < 0) throw localFailure('provider_observation_invalid');
    if (!(row.issued_at <= row.current_ms && row.current_ms < row.expires_at)) throw localFailure('provider_observation_invalid');
    if (row.host_id !== state.host_id || row.host_epoch !== state.host_epoch) throw localFailure('provider_observation_invalid');
    if (state.current_ms !== null && row.current_ms < state.current_ms) throw localFailure('provider_observation_invalid');
    const identity = canonicalJson([row.member_id, row.asset_id, row.asset_version, row.A]);
    if (seen.has(identity)) throw localFailure('provider_observation_invalid');
    const declared = set.members.some(member => member.member_id === row.member_id && member.asset_id === row.asset_id && member.asset_version === row.asset_version && member.A === row.A);
    if (!declared) throw localFailure('provider_observation_invalid');
    seen.add(identity);
    state.current_ms = row.current_ms;
    rows.push({
      member_id: row.member_id,
      asset_id: row.asset_id,
      asset_version: row.asset_version,
      A: row.A,
      decision: row.decision,
      decision_id: row.decision_id,
      host_id: row.host_id,
      host_epoch: row.host_epoch,
      issued_at: row.issued_at,
      expires_at: row.expires_at,
      current_ms: row.current_ms,
    });
  }
  return rows;
}

// --- admission ----------------------------------------------------------------
const admissions = new WeakMap();
// The member provider's own mutable observation state (its last accepted clock)
// must NOT live inside the frozen admission record: freezing the record would
// freeze the provider and make the next observation unwritable.
const admissionProviders = new WeakMap();

function r07Rejected(diagnostic) {
  return freeze({ status: 'rejected', diagnostic, merged_ir: false, action_authorized: false });
}

function captureAdmissionInput(input) {
  const outer = ownDataFields(input, 'PackageSetAdmissionInput', 'invalid_read_request');
  const limits = captureLimits(outer.limits);
  if (!OPERATIONS.includes(outer.operation)) throw localFailure('invalid_read_request');
  const rawSources = ownDenseArray(outer.members, 'invalid_read_request', 'members');
  // Both counts are checked against the configuration before a single byte is
  // copied; the set array length is only consulted when it really is an array,
  // so a non-array there stays a shape failure instead of passing as zero.
  if (rawSources.length > limits.maxMembers) throw localFailure('member_limit_exceeded');
  const rawMembers = outer.set !== null && typeof outer.set === 'object' && !utilTypes.isProxy(outer.set) && !Array.isArray(outer.set) ? Object.getOwnPropertyDescriptor(outer.set, 'members') : null;
  const rawMemberList = rawMembers && Object.hasOwn(rawMembers, 'value') ? rawMembers.value : null;
  if (rawMemberList !== null && Array.isArray(rawMemberList) && !utilTypes.isProxy(rawMemberList) && rawMemberList.length > limits.maxMembers) throw localFailure('member_limit_exceeded');
  let running = 0;
  const sources = rawSources.map((source, index) => {
    const captured = captureMemberSource(source, index, limits.maxTotalSourceBytes - running);
    running += captured.length;
    return captured;
  });
  const set = capturePackageSet(outer.set);
  const tuple = captureTuple(outer.tuple);
  return { set, tuple, operation: outer.operation, limits, sources };
}

async function admit(input, provider) {
  let captured;
  try {
    captured = captureAdmissionInput(input);
  } catch (error) {
    const r07 = error && error.packageSetR07 ? error.packageSetR07 : null;
    if (r07) return freeze({ status: 'rejected', admission: null, decision: r07Rejected(r07), local_failure: null });
    const code = failureCode(error);
    if (code) return freeze({ status: 'rejected', admission: null, decision: null, local_failure: code });
    return freeze({ status: 'rejected', admission: null, decision: null, local_failure: 'core_unavailable' });
  }
  const { set, tuple, operation, sources } = captured;
  const state = memberProviderState(provider);
  // The brand is confirmed by Core's own private WeakMap. A plain object that
  // merely carries the right metadata, or a provider created by a different
  // installed Core, is refused here and its functions are never called.
  if (!state) return freeze({ status: 'rejected', admission: null, decision: null, local_failure: 'provider_invalid' });
  let rows;
  try {
    rows = captureObservation(state, set, operation, 'initial');
  } catch (error) {
    return freeze({ status: 'rejected', admission: null, decision: null, local_failure: failureCode(error) ?? 'provider_observation_invalid' });
  }
  const admitted = [];
  const snapshots = new Map();
  for (const source of sources) {
    let result;
    try {
      result = await admitMemberBytes(source.bytes);
    } catch {
      result = { status: 'rejected', reason: 'READ_CORE_CAPABILITY_UNAVAILABLE' };
    }
    const snapshot = result && result.status === 'accepted' ? result.snapshot : null;
    if (snapshot) snapshots.set(source.index, snapshot);
    const view = snapshot ? inspectSnapshot(snapshot) : null;
    const declared = set.members[source.index] ?? null;
    admitted.push(
      view
        ? {
            member_id: source.member_id,
            A: view.digests.A.observed,
            asset_id: view.asset.asset_id,
            asset_version: view.asset.asset_version,
            core: 'valid',
            judgment_ids: view.ir.catalog.map(item => item.judgment_id),
          }
        : {
            member_id: source.member_id,
            A: declared ? declared.A : source.member_id,
            asset_id: declared ? declared.asset_id : source.member_id,
            asset_version: declared ? declared.asset_version : source.member_id,
            core: 'invalid',
            judgment_ids: [],
          }
    );
  }
  const grants = rows.filter(row => row.decision === 'allow').map(row => ({ member_id: row.member_id, A: row.A, asset_id: row.asset_id, asset_version: row.asset_version }));
  let decision;
  try {
    // The accepted internal decider runs on the captured set plus the separate
    // tuple argument. PackageSet itself has no tuple field, so the two are joined
    // only here, and only for the R07 call.
    decision = decidePackageSet({ ...set, tuple }, admitted, grants, operation, operation === 'cross_asset_reference');
  } catch {
    return freeze({ status: 'rejected', admission: null, decision: null, local_failure: 'core_unavailable' });
  }
  if (decision.status !== 'allowed') return freeze({ status: 'rejected', admission: null, decision, local_failure: null });
  const selectedIndex = admitted.findIndex((row, index) => row.member_id === decision.selected_member && snapshots.has(sources[index].index));
  if (selectedIndex < 0) return freeze({ status: 'rejected', admission: null, decision: r07Rejected('READ_CORE_INVALID'), local_failure: null });
  const selectedSnapshot = snapshots.get(sources[selectedIndex].index);
  const admission = Object.freeze({});
  admissionProviders.set(admission, state);
  admissions.set(admission, freeze({
    set: copyJson(set),
    tuple: copyJson(tuple),
    operation,
    admitted: freeze(admitted.map(row => copyJson(row))),
    members: freeze([...snapshots.entries()].sort((left, right) => left[0] - right[0]).map(([index, snapshot]) => freeze({ member_id: sources.find(source => source.index === index).member_id, snapshot }))),
    selected_member: freeze({ member_id: decision.selected_member, snapshot: selectedSnapshot }),
    host_id: state.host_id,
    host_epoch: state.host_epoch,
    decision,
  }));
  return freeze({ status: 'admitted', admission, decision, local_failure: null });
}

// Member admission is the accepted public bytes entry, so a member that this
// Core cannot interpret keeps exactly the accepted outcome.
function admitMemberBytes(bytes) {
  const { admitNode } = require('./node.js');
  return admitNode(bytes);
}

function admissionState(admission) {
  return admission && typeof admission === 'object' ? admissions.get(admission) ?? null : null;
}

function admissionMemberProvider(admission) {
  return admission && typeof admission === 'object' ? admissionProviders.get(admission) ?? null : null;
}

function inspectAdmission(admission) {
  const state = admissionState(admission);
  if (!state) return null;
  return freeze({
    set: copyJson(state.set),
    tuple: copyJson(state.tuple),
    operation: state.operation,
    members: state.members,
    selected_member: state.selected_member,
    host_id: state.host_id,
    host_epoch: state.host_epoch,
  });
}

function recheck(admission, phase) {
  const state = admissionState(admission);
  if (!state) return freeze({ status: 'rejected', decision: null, local_failure: 'invalid_read_request' });
  // Only `read` and `handoff` are public phases. Every read-internal recheck is
  // `read`, and `handoff` asks the same current question, so the member observer
  // stays strictly initial | read and no third phase is generated.
  if (phase !== 'read' && phase !== 'handoff') return freeze({ status: 'rejected', decision: null, local_failure: 'invalid_read_request' });
  let rows;
  try {
    const memberProvider = admissionMemberProvider(admission);
    if (!memberProvider) return freeze({ status: 'rejected', decision: null, local_failure: 'provider_invalid' });
    rows = captureObservation(memberProvider, state.set, state.operation, 'read');
  } catch (error) {
    return freeze({ status: 'rejected', decision: null, local_failure: failureCode(error) ?? 'provider_observation_invalid' });
  }
  const grants = rows.filter(row => row.decision === 'allow').map(row => ({ member_id: row.member_id, A: row.A, asset_id: row.asset_id, asset_version: row.asset_version }));
  let decision;
  try {
    decision = decidePackageSet({ ...state.set, tuple: state.tuple }, state.admitted, grants, state.operation, state.operation === 'cross_asset_reference');
  } catch {
    return freeze({ status: 'rejected', decision: null, local_failure: 'core_unavailable' });
  }
  if (decision.status !== 'allowed') return freeze({ status: 'rejected', decision, local_failure: null });
  return freeze({ status: 'allowed', decision, local_failure: null });
}

// --- handoff correlation -------------------------------------------------------
//
// The public wrapper binds the ORIGINAL identity first — set_id, selection, the
// captured tuple and the admission's fixed Host — and only then reuses the
// accepted internal checker for member order, digests, snapshots, closure,
// receipt and the independently admitted Plan. Matching SOME member's snapshot
// is not enough: the delivered read must match the single selected member.
function verifyHandoff(handoff, admission, plan, deliveredRead) {
  const state = admissionState(admission);
  if (!state) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  let wire;
  try {
    wire = copyJson(handoff);
  } catch {
    return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  }
  if (!wire || typeof wire !== 'object' || Array.isArray(wire)) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (wire.set_id !== state.set.set_id) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (canonicalJson(wire.selection) !== canonicalJson(state.set.selection)) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (canonicalJson(wire.tuple) !== canonicalJson(state.tuple)) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (wire.host_id !== state.host_id || wire.host_epoch !== state.host_epoch) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  const selectedView = inspectSnapshot(state.selected_member.snapshot);
  if (!selectedView) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  const read = deliveredRead && typeof deliveredRead === 'object' && !Array.isArray(deliveredRead) && deliveredRead.channel === 'read_envelope' ? deliveredRead.envelope : null;
  if (!read || read.status !== 'ready') return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (read.snapshot_id !== selectedView.snapshot_id) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (read.digests?.A?.observed !== selectedView.digests.A.observed || read.digests?.C?.observed !== selectedView.digests.C.observed) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (read.asset?.asset_id !== selectedView.asset.asset_id || read.asset?.asset_version !== selectedView.asset.asset_version) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  // A JSON Plan or a callback returning one proves no admission: the accepted
  // checker resolves the identity through the public execution surface.
  const planView = inspectAdmittedPlan(plan);
  if (planView === null) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (canonicalJson(planView.source) !== canonicalJson({ asset: selectedView.asset, digests: selectedView.digests, ir_digest: selectedView.ir_digest })) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  const snapshots = state.members.filter(member => member.snapshot).map(member => ({ member_id: member.member_id, snapshot: member.snapshot }));
  let correlated;
  try {
    correlated = verifyHandoffBindings(wire, { snapshots, deliveredRead, observeAdmittedPlan: () => plan });
  } catch {
    correlated = false;
  }
  if (!correlated) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  return freeze({ status: 'valid', value: freeze(copyJson(wire)), proof: 'claims_not_authenticated' });
}

module.exports = {
  descriptor,
  keySets,
  LIMITS,
  LOCAL_FAILURES,
  OPERATIONS,
  capturePackageSet,
  createTrustedPackageSetMemberProvider,
  memberProviderState,
  admit,
  admissionState,
  admissionMemberProvider,
  inspectAdmission,
  recheck,
  verifyHandoff,
};
