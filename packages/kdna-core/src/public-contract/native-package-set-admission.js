'use strict';
// Additive native PackageSet mechanics. Old PackageSet and all its brands remain untouched.
const { types: utilTypes } = require('node:util');
const { copyJson, canonicalJson, freeze, identifier } = require('./canonical-json-shim.js');
const C = require('./section-common.js');
const { requests, snapshots } = require('./section-native-state.js');
const byteAuthorities = require('./section-byte-authority-state.js');
const { ownBytes } = require('./section-owned-bytes.js');
const { admitSectionBytesNode } = require('./sections-bytes-node.js');
const definition = require('./packageset06/contract.json');
const { digestCanonical } = require('./digests.js');
const legacy = require('./package-set-contract.generated.json');
const originTuple = C.contract.module.versionTuple;
const keySets = { ...legacy.key_sets,
  PackageSetMemberSource: { keys: ['member_id','bytes','request','authority'], required: ['member_id','bytes','request','authority'] } };
const LIMITS = Object.freeze({ maxMembers: 10000, maxTotalSourceBytes: 104857600 });
const LOCAL_FAILURES = Object.freeze(definition.types.NativePackageSetLocalFailure06.enum.slice());
const OPERATIONS = Object.freeze(['isolated_read','semantic_merge','cross_asset_reference']);
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const BYTE_LENGTH = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), 'byteLength').get;
const localErrors = new WeakMap(), shapeErrors = new WeakSet();
function localFailure(code) {
  if (!LOCAL_FAILURES.includes(code)) throw new Error('Unknown native PackageSet local code');
  const error = new Error(code); localErrors.set(error, code); return error;
}
function failureCode(error) { return error && typeof error === 'object' ? localErrors.get(error) ?? null : null; }
function shapeFailure() { const error = new Error('READ_INPUT_INVALID'); shapeErrors.add(error); return error; }
const descriptor = freeze({ contract: { id: definition.module.module.id, version: definition.module.module.version,
  definition_digest: digestCanonical(definition.module) }, origin_tuple: copyJson(originTuple),
  execution_tuple: Object.fromEntries(Object.entries(require('./execution06/contract.json').types.NativeExecutionVersionTuple06.properties).map(([k,v])=>[k,v.const])),
  max_members: 10000, max_total_source_bytes: 104857600,
  core_callables: definition.module.api.core_callables.slice(), read_callables: definition.module.api.read_callables.slice(),
  claims: 'claims_not_authenticated' });
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
function captureMemberSource(value, index, remaining) {
  const captured = ownDataFields(value, 'PackageSetMemberSource', 'invalid_member_source');
  if (!identifier(captured.member_id)) throw localFailure('invalid_member_source');
  const request = requests.get(captured.request);
  if (!request || request.data.mode !== 'whole_asset' || !byteAuthorities.has(captured.authority)) {
    throw localFailure('invalid_member_source');
  }
  // Validate the intrinsic length against the total allowance before allocating.
  let length;
  try {
    if (utilTypes.isProxy(captured.bytes) || !utilTypes.isUint8Array(captured.bytes)) throw Error();
    length = BYTE_LENGTH.call(captured.bytes);
    if (!Number.isSafeInteger(length) || length < 0) throw Error();
  } catch { throw localFailure('invalid_member_source'); }
  if (length > remaining) throw localFailure('source_bytes_limit_exceeded');
  let bytes;
  try { bytes = ownBytes(captured.bytes); }
  catch (error) {
    if (C.isFailure(error) && error.code === 'READ_INPUT_INVALID') throw localFailure('invalid_member_source');
    throw error;
  }
  return { member_id: captured.member_id, index, bytes, length,
    request: captured.request, authority: captured.authority };
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
function captureObservation(state, set, operation, phase, onObserve) {
  let raw;
  try {
    if (onObserve) onObserve();
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
    if (typeof row.A !== 'string' || !DIGEST.test(row.A)) throw localFailure('provider_observation_invalid');
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


const admissions = new WeakMap(), admissionProviders = new WeakMap();
function r07Rejected(diagnostic) {
  return freeze({ status: 'rejected', diagnostic, merged_ir: false, action_authorized: false });
}
function rejected(local_failure = null, decision = null, member_failure = null) {
  return freeze({ status: 'rejected', admission: null, decision, local_failure, member_failure });
}
function release(sources) {
  for (const source of sources) { source.bytes = null; source.request = null; source.authority = null; }
}
function captureAdmissionInput(input) {
  const outer = ownDataFields(input, 'PackageSetAdmissionInput', 'invalid_read_request');
  const limits = captureLimits(outer.limits);
  if (!OPERATIONS.includes(outer.operation)) throw localFailure('invalid_read_request');
  // Counts precede own-name inventory and allocation of either member array.
  if (utilTypes.isProxy(outer.members) || !Array.isArray(outer.members)) throw localFailure('invalid_read_request');
  const sourceLength = Object.getOwnPropertyDescriptor(outer.members, 'length').value;
  if (sourceLength > limits.maxMembers) throw localFailure('member_limit_exceeded');
  const memberDescriptor = outer.set && typeof outer.set === 'object' && !utilTypes.isProxy(outer.set)
    ? Object.getOwnPropertyDescriptor(outer.set, 'members') : null;
  const memberList = memberDescriptor && Object.hasOwn(memberDescriptor, 'value') ? memberDescriptor.value : null;
  if (memberList && !utilTypes.isProxy(memberList) && Array.isArray(memberList) && memberList.length > limits.maxMembers) {
    throw localFailure('member_limit_exceeded');
  }
  const rawSources = ownDenseArray(outer.members, 'invalid_read_request');
  let set;
  try { set = capturePackageSet(outer.set); }
  catch (error) { if (failureCode(error) || shapeErrors.has(error)) throw shapeFailure(); throw error; }
  const tuple = captureTuple(outer.tuple), sources = [];
  let running = 0;
  try {
    for (let i = 0; i < rawSources.length; i++) {
      const source = captureMemberSource(rawSources[i], i, limits.maxTotalSourceBytes - running);
      running += source.length; sources.push(source);
    }
  } catch (error) { release(sources); throw error; }
  return { set, tuple, operation: outer.operation, limits, sources };
}
function decide(set, tuple, admitted, rows, operation) {
  const grants = rows.filter(row => row.decision === 'allow');
  const ids = set.members.map(member => member.member_id);
  if (set.members.some(m => !grants.some(g => g.member_id===m.member_id && g.asset_id===m.asset_id && g.asset_version===m.asset_version && g.A===m.A))) return r07Rejected('SET_MEMBER_UNAUTHORIZED');
  if (ids.some(id => !admitted.some(a => a.member_id === id))) return r07Rejected('SET_MEMBER_MISSING');
  if (admitted.some(a => !ids.includes(a.member_id))) return r07Rejected('SET_MEMBER_EXTRA');
  if (new Set(ids).size !== ids.length || new Set(admitted.map(a=>a.member_id)).size !== admitted.length) return r07Rejected('SET_MEMBER_DUPLICATE');
  if (canonicalJson(tuple) !== canonicalJson(originTuple)) {
    const old = require('./generated-contract.json');
    const historical = canonicalJson(tuple) === canonicalJson(old.versionTuple) || old.types.UnsupportedVersionTuple.anyOf.some(shape => canonicalJson(tuple) === canonicalJson(Object.fromEntries(Object.entries(shape.properties).map(([k,v])=>[k,v.const]))));
    return r07Rejected(historical ? 'READ_UNSUPPORTED_VERSION' : Object.keys(originTuple).some(k => k !== 'payload_profile' && tuple[k] === originTuple[k]) ? 'READ_MIXED_VERSION_TUPLE' : 'READ_UNSUPPORTED_VERSION');
  }
  const failed = admitted.find(a => a.failure);
  if (failed) return { member_failure: { member_id: failed.member_id, result: failed.failure } };
  if (set.members.some(m => { const a = admitted.find(a=>a.member_id===m.member_id); return !a || a.A!==m.A || a.asset_id!==m.asset_id || a.asset_version!==m.asset_version; })) return r07Rejected('READ_CORE_INVALID');
  if (operation !== 'isolated_read') return r07Rejected('UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE');
  const matches = admitted.filter(a => a.asset_id===set.selection.asset_id && a.asset_version===set.selection.asset_version)
    .flatMap(a => a.judgment_ids.filter(id => id===set.selection.judgment_id).map(()=>a.member_id));
  if (matches.length !== 1) return r07Rejected(matches.length ? 'READ_SELECTION_AMBIGUOUS' : 'READ_SELECTION_NOT_FOUND');
  return freeze({ status: 'allowed', selected_member: matches[0], merged_ir: false, action_authorized: false });
}
async function admit(input, provider) {
  let captured;
  try { captured = captureAdmissionInput(input); }
  catch (error) { return rejected(failureCode(error) ?? (shapeErrors.has(error) ? null : 'core_unavailable'), shapeErrors.has(error) ? r07Rejected('READ_INPUT_INVALID') : null); }
  const { set, tuple, operation, sources } = captured;
  try {
    const providerState = memberProviderState(provider);
    if (!providerState) return rejected('provider_invalid');
    const rows = captureObservation(providerState, set, operation, 'initial');
    const admitted = [], members = [];
    for (const source of sources) {
      let result;
      try { result = await admitSectionBytesNode(source.bytes, source.request, source.authority); }
      finally { source.bytes = null; source.request = null; source.authority = null; }
      if (result.status !== 'accepted') {
        admitted.push({ member_id: source.member_id, failure: result });
        continue;
      }
      const view = snapshots.get(result.snapshot);
      if (!view || view.verification.semantic_status !== 'verified_whole_graph' || view.verification.ir_digest.status !== 'verified') throw Error('Invalid native whole result');
      members.push(freeze({ member_id: source.member_id, snapshot: result.snapshot }));
      admitted.push({ member_id: source.member_id, A: view.digests.A.observed,
        asset_id: view.asset.asset_id, asset_version: view.asset.asset_version,
        judgment_ids: view.ir.catalog.map(item=>item.judgment_id) });
    }
    const decision = decide(set, tuple, admitted, rows, operation);
    if (decision.member_failure) return rejected('member_admission_failed', null, decision.member_failure);
    if (decision.status !== 'allowed') return rejected(null, decision);
    const admission = Object.freeze({});
    const selected_member = members.find(m => m.member_id===decision.selected_member);
    if (!selected_member) throw Error('Missing selected whole');
    admissions.set(admission, freeze({ set: copyJson(set), tuple: copyJson(tuple), operation,
      admitted, members, selected_member, host_id: providerState.host_id, host_epoch: providerState.host_epoch, decision }));
    admissionProviders.set(admission, providerState);
    return freeze({ status: 'admitted', admission, decision, local_failure: null, member_failure: null });
  } catch (error) { return rejected(failureCode(error) ?? 'core_unavailable'); }
  finally { release(sources); }
}
function admissionState(admission) { return admission && typeof admission === 'object' ? admissions.get(admission) ?? null : null; }
function inspectAdmission(admission) {
  const state = admissionState(admission);
  if (!state) return null;
  return freeze({ set: state.set, tuple: state.tuple, operation: state.operation,
    members: state.members, selected_member: state.selected_member, host_id: state.host_id, host_epoch: state.host_epoch });
}
function recheck(admission, phase, onObserve) {
  const state = admissionState(admission);
  const reject = (local_failure, decision=null) => freeze({ status: 'rejected', decision, local_failure });
  if (!state || (phase !== 'read' && phase !== 'handoff')) return reject('invalid_read_request');
  const provider = admissionProviders.get(admission);
  if (!provider) return reject('provider_invalid');
  try {
    const rows = captureObservation(provider, state.set, state.operation, 'read', onObserve);
    const decision = decide(state.set, state.tuple, state.admitted, rows, state.operation);
    return freeze({ status: decision.status === 'allowed' ? 'allowed' : 'rejected', decision, local_failure: null });
  } catch (error) { return reject(failureCode(error) ?? 'core_unavailable'); }
}
function validateStructure(input) {
  try { return freeze({ status: 'valid', value: freeze(capturePackageSet(input)), proof: 'claims_not_authenticated' }); }
  catch { return r07Rejected('READ_INPUT_INVALID'); }
}
module.exports = { descriptor, ownDataFields, ownDenseArray, capturePackageSet, createTrustedPackageSetMemberProvider,
  memberProviderState, admit, admissionState, inspectAdmission, recheck, validateStructure };
