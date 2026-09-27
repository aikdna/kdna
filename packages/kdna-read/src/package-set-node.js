'use strict';
// Public Node PackageSet read subpath.
//
// Five callables. The Read side never re-parses an asset and never re-creates a
// Core judgment: it consumes the genuine Core snapshots through the same
// accepted internal pipeline the ordinary read uses, installs its own Host so
// the delivery fact is its own, and mints an opaque token only after a real
// synchronous sink returned true and every boundary was rechecked.
const { types: utilTypes } = require('node:util');
const corePackageSet = require('@aikdna/kdna-core/package-set-node');
const { inspectAdmittedPlan, executionDigest } = require('@aikdna/kdna-core/execution');
const { inspectCandidate } = require('./admission.js');
const { prepareRead, registerPreparedHandles, discardPreparedHandles } = require('./pipeline.js');
const { deliverResult } = require('./delivery.js');
const { freeze, jcs, clone } = require('./util.js');
const host = require('./package-set-host.js');

const { KEY_SETS, LOCAL_FAILURES, localFailure, failureCode, createOwnHost } = host;
const contract = host.contract;
const OPERATIONS = Object.freeze(['isolated_read', 'semantic_merge', 'cross_asset_reference']);

const TYPED_ARRAY_PROTOTYPE = Object.getPrototypeOf(Uint8Array.prototype);
const BYTE_LENGTH = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'byteLength').get;
const BUFFER = Object.getOwnPropertyDescriptor(TYPED_ARRAY_PROTOTYPE, 'buffer').get;

// A generic recursive pure copy for values whose closed shape belongs to an
// accepted schema this module only forwards: Proxy first, own enumerable data
// descriptors only, dense arrays only, and no cycle. The accepted validator then
// runs on the owned tree, so no caller object is ever handed to a reflection
// helper that could fire a trap.
function pureCopy(value, depth = 0, seen = new Set()) {
  if (depth > 64 || seen.size > 100000) throw localFailure('invalid_read_request');
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw localFailure('invalid_read_request');
    return value;
  }
  if (typeof value !== 'object') throw localFailure('invalid_read_request');
  if (utilTypes.isProxy(value)) throw localFailure('invalid_read_request');
  if (seen.has(value)) throw localFailure('invalid_read_request');
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Array.prototype) throw localFailure('invalid_read_request');
      if (Object.getOwnPropertySymbols(value).length !== 0) throw localFailure('invalid_read_request');
      const names = Object.getOwnPropertyNames(value);
      if (names.length !== value.length + 1 || names[names.length - 1] !== 'length') throw localFailure('invalid_read_request');
      const out = [];
      for (let index = 0; index < value.length; index++) {
        if (names[index] !== String(index)) throw localFailure('invalid_read_request');
        const own = Object.getOwnPropertyDescriptor(value, String(index));
        if (!own || !Object.hasOwn(own, 'value') || own.enumerable !== true) throw localFailure('invalid_read_request');
        out.push(pureCopy(own.value, depth + 1, seen));
      }
      return out;
    }
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw localFailure('invalid_read_request');
    if (Object.getOwnPropertySymbols(value).length !== 0) throw localFailure('invalid_read_request');
    const out = {};
    for (const key of Object.getOwnPropertyNames(value)) {
      const own = Object.getOwnPropertyDescriptor(value, key);
      if (!own || !Object.hasOwn(own, 'value') || own.enumerable !== true) throw localFailure('invalid_read_request');
      out[key] = pureCopy(own.value, depth + 1, seen);
    }
    return out;
  } finally {
    seen.delete(value);
  }
}

// --- module identity ----------------------------------------------------------
function assertInstalledCore() {
  const installed = corePackageSet.getPackageSetContract();
  const recorded = contract.descriptor;
  // Both sides are emitted by the same generator from the same single source, so
  // they must be identical field for field and in the same order. An old,
  // duplicated or foreign Core fails closed here.
  if (JSON.stringify(recorded) !== JSON.stringify(installed)) throw installMismatch();
  return installed;
}
function installMismatch() {
  return Object.assign(new Error('PACKAGE_SET_NODE_INSTALLATION_MISMATCH'), { code: 'PACKAGE_SET_NODE_INSTALLATION_MISMATCH' });
}

function getPackageReadContract() {
  const installed = assertInstalledCore();
  return freeze({
    descriptor: installed,
    core_contract_digest: contract.core_contract_digest,
    schema_id: contract.schema_id,
    schema_path: contract.schema_path,
    proof_limits: contract.proof_limits,
  });
}

// --- the trusted Read provider brand ------------------------------------------
const readProviders = new WeakMap();

function createTrustedPackageReadProvider(config) {
  assertInstalledCore();
  let captured;
  try {
    captured = host.ownFields(config, 'PackageSetReadProviderConfig', 'invalid_read_request');
  } catch {
    throw new TypeError('PackageSet read provider configuration required');
  }
  if (!corePackageSet.validatePackageSetStructure) throw new TypeError('PackageSet read provider configuration required');
  if (typeof captured.host_id !== 'string' || captured.host_id.length === 0) throw new TypeError('PackageSet read provider host identity required');
  if (typeof captured.host_epoch !== 'string' || captured.host_epoch.length === 0) throw new TypeError('PackageSet read provider host epoch required');
  if (captured.members === null || typeof captured.members !== 'object') throw new TypeError('PackageSet read provider requires a Core member provider reference');
  if (typeof captured.observeRead !== 'function') throw new TypeError('PackageSet read observer required');
  if (captured.sink !== undefined && typeof captured.sink !== 'function') throw new TypeError('PackageSet sink must be a function when supplied');
  const provider = Object.freeze({});
  // The Core member-provider brand is NOT checked here. Read cannot see Core's
  // private WeakMap and must not import, probe or copy it; Core confirms the
  // brand when the member admission actually runs, and the fixed label is
  // compared against the genuine admission view afterwards.
  readProviders.set(provider, {
    host_id: captured.host_id,
    host_epoch: captured.host_epoch,
    members: captured.members,
    observeRead: captured.observeRead,
    sink: captured.sink,
  });
  return provider;
}

// --- input capture -------------------------------------------------------------
function captureLimits(value) {
  const captured = host.ownFields(value, 'PackageSetLimits', 'invalid_limits');
  const positiveSafeUInt = candidate => typeof candidate === 'number' && Number.isSafeInteger(candidate) && candidate > 0;
  if (!positiveSafeUInt(captured.maxMembers) || captured.maxMembers > contract.descriptor.limits.maxMembers) throw localFailure('invalid_limits');
  if (!positiveSafeUInt(captured.maxTotalSourceBytes) || captured.maxTotalSourceBytes > contract.descriptor.limits.maxTotalSourceBytes) throw localFailure('invalid_limits');
  return captured;
}

// Lengths only: the accepted resource check must reject before any copy, and it
// never traverses the caller's deep set content.
function sourceLength(value) {
  const captured = host.ownFields(value, 'PackageSetMemberSource', 'invalid_member_source');
  if (typeof captured.member_id !== 'string' || captured.member_id.length === 0) throw localFailure('invalid_member_source');
  const bytes = captured.bytes;
  if (utilTypes.isProxy(bytes)) throw localFailure('invalid_member_source');
  let length;
  let buffer;
  try {
    length = BYTE_LENGTH.call(bytes);
    buffer = BUFFER.call(bytes);
  } catch {
    throw localFailure('invalid_member_source');
  }
  if (typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer) throw localFailure('invalid_member_source');
  if (!(buffer instanceof ArrayBuffer)) throw localFailure('invalid_member_source');
  if (!Number.isSafeInteger(length) || length < 0) throw localFailure('invalid_member_source');
  return length;
}

// Handle accounting is reported, never assumed. `registered_handle_ids` names the
// handles the accepted pipeline really registered, `handle_registration` says
// whether that registration happened at all, and `host_closed` says whether this
// operation's private own Host was closed. A token being absent is a separate
// field: it must never be expressed by zeroing the handle ledger.
const noHandles = Object.freeze([]);
const rejected = (decision, localFailureCode, extra = {}) =>
  freeze({ decision: decision ?? null, readResult: null, delivered: null, local_failure: localFailureCode ?? null, sink_invoked: false, sink_confirmed: false, registered_handles: 0, registered_handle_ids: noHandles, handle_registration: 'none', host_closed: false, member_observations: 0, reader_observations: 0, ...extra });

const R07_INPUT = freeze({ status: 'rejected', diagnostic: 'READ_INPUT_INVALID', merged_ir: false, action_authorized: false });

function captureReadInput(input) {
  const outer = host.ownFields(input, 'PackageSetReadInput', 'invalid_read_request');
  const signal = Object.hasOwn(outer, 'signal') && outer.signal !== null && outer.signal !== undefined ? outer.signal : null;
  let abortable = null;
  if (signal !== null) {
    if (utilTypes.isProxy(signal) || !(signal instanceof AbortSignal)) throw localFailure('invalid_read_request');
    abortable = signal;
  }
  if (abortable && abortable.aborted === true) throw localFailure('cancelled');
  const limits = captureLimits(outer.limits);
  if (!OPERATIONS.includes(outer.operation)) throw localFailure('invalid_read_request');
  const rawSources = host.ownDenseArray(outer.members, 'invalid_read_request');
  if (rawSources.length > limits.maxMembers) throw localFailure('member_limit_exceeded');
  let running = 0;
  for (const source of rawSources) {
    const length = sourceLength(source);
    if (length > limits.maxTotalSourceBytes - running) throw localFailure('source_bytes_limit_exceeded');
    running += length;
  }
  return { limits, operation: outer.operation, sources: rawSources, set: outer.set, tuple: outer.tuple, request: outer.request, signal: abortable };
}

// --- read ----------------------------------------------------------------------
async function readPackageSetNode(input, control, provider) {
  const providerState = provider && typeof provider === 'object' ? readProviders.get(provider) ?? null : null;
  let captured;
  try {
    captured = captureReadInput(input);
  } catch (error) {
    const code = failureCode(error);
    if (code === 'cancelled') return rejected(null, 'cancelled');
    if (code === 'invalid_read_request') return rejected(null, 'invalid_read_request');
    return rejected(null, code ?? 'invalid_read_request');
  }
  // The PackageSet shape is an independent R07 rejection: it is decided before
  // the provider, before the Read request and before any callback runs.
  const structure = corePackageSet.validatePackageSetStructure(captured.set);
  if (structure.status !== 'valid') return rejected(R07_INPUT, null);
  // A closed Read candidate is checked purely, with the same-package
  // `inspectCandidate`. The trusted control observer is NOT consulted here:
  // `admitReadRequest` consults it even for a malformed candidate, so using it
  // could not honestly claim zero control calls.
  let inspected;
  try {
    const owned = pureCopy(captured.request);
    inspected = inspectCandidate(owned);
  } catch {
    return rejected(null, 'invalid_read_request');
  }
  if (inspected.version_rejection) return rejected(null, 'invalid_read_request');
  if (!inspected.request || inspected.request.mode !== 'exact_selection' || inspected.request.handle !== null) return rejected(null, 'invalid_read_request');
  if (jcs(inspected.request.selection) !== jcs(structure.value.selection)) return rejected(null, 'invalid_read_request');
  if (jcs(inspected.request.tuple) !== jcs(captured.tuple)) return rejected(null, 'invalid_read_request');
  if (providerState === null) return rejected(null, 'provider_invalid');
  const admission = await corePackageSet.admitPackageSetNode({ set: captured.set, tuple: captured.tuple, members: captured.sources, operation: captured.operation, limits: captured.limits }, providerState.members);
  if (admission.status !== 'admitted') {
    return frozen_result(admission, providerState, null);
  }
  const view = corePackageSet.inspectAdmittedPackageSet(admission.admission);
  if (view === null) return frozen_result({ decision: null, local_failure: 'provider_invalid' }, providerState, null, admission.decision);
  if (view.host_id !== providerState.host_id || view.host_epoch !== providerState.host_epoch) {
    // The genuine member admission succeeded, but the Read provider is fixed at a
    // different Host. Nothing is observed, nothing is sunk and no token is minted;
    // the Core member history is reported as the decision it really was.
    return rejected(admission.decision, 'provider_invalid');
  }
  const own = createOwnHost({ provider: providerState, admission: admission.admission, signal: captured.signal });
  let readResult = null;
  // The named pre-registration seam replaces the former `runRead` call: the
  // pipeline's preparation completes, the single delivery is made, and the
  // registration decision is taken here, on the very object the pipeline
  // prepared. The accepted pipeline's own condition (delivered === prepared) is
  // preserved exactly; only the point at which it is decided is named.
  let preparedHandles = null;
  let registrationDecided = false;
  try {
    const prepared = await prepareRead(async () => ({ status: 'accepted', snapshot: view.selected_member.snapshot }), null, inspected.request, control, own.host);
    const id = prepared.envelope?.request_id ?? prepared.admission_rejection?.correlation.request_id ?? prepared.control?.correlation.request_id ?? prepared.transport_failure?.correlation.request_id ?? null;
    readResult = await deliverResult(prepared, id, own.deliver);
    if (readResult === prepared) {
      preparedHandles = prepared.envelope?.content && Array.isArray(prepared.envelope.content.expansion_handles) ? prepared.envelope.content.expansion_handles : null;
      registerPreparedHandles(prepared);
      registrationDecided = true;
    }
    discardPreparedHandles(prepared);
  } catch {
    readResult = null;
  }
  // ---- final synchronous section: the last await has already completed -------
  const finalAbort = captured.signal !== null && captured.signal.aborted === true;
  if (finalAbort) own.latch('cancelled');
  let finalRecheck = null;
  if (!finalAbort) finalRecheck = corePackageSet.recheckPackageSet(admission.admission, 'read');
  if (finalRecheck && finalRecheck.status !== 'allowed' && finalRecheck.decision && finalRecheck.decision.status === 'rejected') {
    if (own.facts.r07_revocation === null) own.facts.r07_revocation = finalRecheck.decision;
  }
  own.facts.member_observations += 1;
  const successful = readResult !== null && readResult.channel === 'read_envelope' && readResult.envelope && readResult.envelope.status === 'ready' && own.facts.sink_confirmed === true && own.facts.local_failure === null && own.facts.r07_revocation === null && !finalAbort && finalRecheck !== null && finalRecheck.status === 'allowed';
  // Registration is decided at the named seam above, never inferred from a
  // Host-side fact: `registerPreparedHandles` is called only for the prepared
  // object the single delivery confirmed, and the identity array reported here is
  // the array that same object staged.
  const registrationConfirmed = registrationDecided === true && own.facts.pipeline_confirmed_delivery === true && readResult !== null && readResult.envelope && readResult.envelope.status === 'ready';
  const offeredHandles = registrationConfirmed ? preparedHandles : null;
  const registeredHandleIds = offeredHandles === null ? noHandles : freeze(offeredHandles.map(entry => entry.handle_id).slice().sort());
  const delivered = successful ? mint(admission.admission, view, readResult, providerState) : null;
  if (!successful) own.close();
  return freeze({
    decision: own.facts.r07_revocation ?? admission.decision,
    readResult,
    delivered,
    local_failure: own.facts.local_failure,
    sink_invoked: own.facts.sink_invoked,
    sink_confirmed: own.facts.sink_confirmed,
    registered_handles: registeredHandleIds.length,
    registered_handle_ids: registeredHandleIds,
    handle_registration: registrationConfirmed && offeredHandles !== null ? 'registered' : 'none',
    host_closed: own.facts.host_closed,
    member_observations: own.facts.member_observations,
    reader_observations: own.facts.observer_calls,
  });
}

function frozen_result(admissionResult, providerState, readResult, decisionOverride) {
  return freeze({
    decision: decisionOverride ?? admissionResult.decision ?? null,
    readResult,
    delivered: null,
    local_failure: admissionResult.local_failure ?? null,
    sink_invoked: false,
    sink_confirmed: false,
    registered_handles: 0,
    registered_handle_ids: noHandles,
    handle_registration: 'none',
    host_closed: false,
    member_observations: 0,
    reader_observations: 0,
  });
}

// --- delivered token -----------------------------------------------------------
const deliveredTokens = new WeakMap();

function mint(admission, view, readResult, providerState) {
  const token = Object.freeze({});
  deliveredTokens.set(token, freeze({ admission, view, readResult, host_id: providerState.host_id, host_epoch: providerState.host_epoch }));
  return token;
}

function tokenState(token) {
  return token && typeof token === 'object' ? deliveredTokens.get(token) ?? null : null;
}

// --- handoff ---------------------------------------------------------------------
function buildHandoff(state) {
  const read = state.readResult.envelope;
  const digest = executionDigest(read.content.closure);
  if (digest.status !== 'valid') return null;
  const planValue = inspectAdmittedPlan(state.plan);
  if (planValue === null) return null;
  const planDigest = executionDigest(planValue);
  if (planDigest.status !== 'valid') return null;
  const sorted = state.view.members
    .filter(member => member.snapshot !== null)
    .map(member => {
      const snapshot = require('@aikdna/kdna-core/read-boundary').inspectSnapshot(member.snapshot);
      return snapshot === null ? null : {
        member_id: member.member_id,
        asset_id: snapshot.asset.asset_id,
        asset_version: snapshot.asset.asset_version,
        A: snapshot.digests.A.observed,
        C: snapshot.digests.C.observed,
        snapshot_id: snapshot.snapshot_id,
      };
    })
    .filter(member => member !== null)
    .sort((left, right) => (left.member_id < right.member_id ? -1 : left.member_id > right.member_id ? 1 : 0));
  return {
    contract: 'kdna.package-set-handoff/0.2.1',
    tuple: clone(read.tuple),
    set_id: state.view.set.set_id,
    members: sorted,
    selection: clone(read.content.selected),
    closure_digest: digest.digest,
    read_receipt_id: read.receipt.receipt_id,
    plan_digest: planDigest.digest,
    host_id: state.host_id,
    host_epoch: state.host_epoch,
  };
}

function sealPackageSetHandoff(deliveredToken, admittedPlan) {
  const state = tokenState(deliveredToken);
  if (state === null) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  if (inspectAdmittedPlan(admittedPlan) === null) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  const wire = buildHandoff({ ...state, plan: admittedPlan });
  if (wire === null) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  return corePackageSet.verifyPackageSetHandoff(wire, state.admission, admittedPlan, state.readResult);
}

function admitPackageSetHandoff(wire, deliveredToken, admittedPlan) {
  const state = tokenState(deliveredToken);
  if (state === null) return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  let owned;
  try {
    owned = pureCopy(wire);
    host.ownFields(owned, 'PackageSetHandoff', 'handoff_invalid');
  } catch {
    return freeze({ status: 'rejected', diagnostic: 'handoff_invalid' });
  }
  return corePackageSet.verifyPackageSetHandoff(owned, state.admission, admittedPlan, state.readResult);
}

module.exports = {
  getPackageReadContract,
  createTrustedPackageReadProvider,
  readPackageSetNode,
  sealPackageSetHandoff,
  admitPackageSetHandoff,
};
