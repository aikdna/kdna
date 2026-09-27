'use strict';
// Read-private half of the public PackageSet read subpath.
//
// It owns the installed Read Host, the per-observation Host/epoch pinning the
// accepted generic gate cannot supply when `request.handle` is null, the single
// real synchronous sink, and the final synchronous completion section. It never
// re-parses an asset: the selected member is consumed as the genuine Core
// snapshot the Core member admission already produced.
const { types: utilTypes } = require('node:util');
const { createTrustedHostReadProvider } = require('./embedding.js');
const { freeze } = require('./util.js');
const corePackageSet = require('@aikdna/kdna-core/package-set-node');
const contract = require('./package-set-contract.generated.json');

const KEY_SETS = contract.key_sets;
const LOCAL_FAILURES = Object.freeze([...contract.descriptor.local_failures]);
const HOST_CONTEXT_KEYS = KEY_SETS.HostReadContextData;
// The clock the observation is evaluated at is the one named extension of the
// generated Host context record, declared in the same single source.
const HOST_CONTEXT_EXTRA = KEY_SETS.PackageSetReadHostObservation;
const HOST_CONTEXT_ALLOWED = [...HOST_CONTEXT_KEYS.keys, ...HOST_CONTEXT_EXTRA.keys];
const HOST_CONTEXT_REQUIRED = [...HOST_CONTEXT_KEYS.required, ...HOST_CONTEXT_EXTRA.required];

function localFailure(code) {
  if (!LOCAL_FAILURES.includes(code)) throw new Error('Undisclosed PackageSet local failure ' + code);
  return Object.assign(new Error(code), { packageSetLocal: code });
}
function failureCode(error) {
  return error && typeof error.packageSetLocal === 'string' ? error.packageSetLocal : null;
}

// Pure capture of an own closed record: Proxy first, then own enumerable data
// descriptors only, so no getter, iterator, toJSON or custom prototype runs.
function ownFields(value, typeName, code) {
  if (value === null || typeof value !== 'object') throw localFailure(code);
  if (utilTypes.isProxy(value)) throw localFailure(code);
  if (Array.isArray(value)) throw localFailure(code);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw localFailure(code);
  if (Object.getOwnPropertySymbols(value).length !== 0) throw localFailure(code);
  const shape = KEY_SETS[typeName];
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
  return out;
}

// The own Host context is `HostReadContextData` plus `current_ms`; both halves
// come from the generated single source, so the accepted generic gate still
// performs every request/snapshot/digest/time/scope/revocation check on the same
// value.
function captureHostContext(raw) {
  if (raw === null || typeof raw !== 'object' || utilTypes.isProxy(raw) || Array.isArray(raw)) throw localFailure('provider_observation_invalid');
  const prototype = Object.getPrototypeOf(raw);
  if (prototype !== Object.prototype && prototype !== null) throw localFailure('provider_observation_invalid');
  if (Object.getOwnPropertySymbols(raw).length !== 0) throw localFailure('provider_observation_invalid');
  const captured = {};
  for (const key of Object.getOwnPropertyNames(raw)) {
    const own = Object.getOwnPropertyDescriptor(raw, key);
    if (!own || !Object.hasOwn(own, 'value') || own.enumerable !== true || !HOST_CONTEXT_ALLOWED.includes(key)) throw localFailure('provider_observation_invalid');
    captured[key] = own.value;
  }
  for (const key of HOST_CONTEXT_REQUIRED) if (!Object.hasOwn(captured, key)) throw localFailure('provider_observation_invalid');
  const scope = ownDenseArray(captured.scope, 'provider_observation_invalid');
  for (const entry of scope) if (typeof entry !== 'string' || entry.length === 0) throw localFailure('provider_observation_invalid');
  const out = {};
  for (const key of HOST_CONTEXT_ALLOWED) {
    if (key === 'scope') {
      out.scope = [...scope];
      continue;
    }
    if (!Object.hasOwn(captured, key)) continue;
    const value = captured[key];
    const type = typeof value;
    if (value !== null && type !== 'string' && type !== 'number' && type !== 'boolean') throw localFailure('provider_observation_invalid');
    out[key] = value;
  }
  for (const key of HOST_CONTEXT_REQUIRED) if (!Object.hasOwn(out, key)) throw localFailure('provider_observation_invalid');
  return out;
}

function sameScope(left, right) {
  const a = new Set(left.scope);
  const b = new Set(right.scope);
  if (a.size !== b.size) return false;
  for (const entry of a) if (!b.has(entry)) return false;
  return true;
}

// Everything an N1 read observes about itself lives in one per-operation object.
// There is no global pending table, and a second, re-entrant read cannot borrow
// any handle, snapshot or delivery fact from this one.
function createOwnHost(operation) {
  const facts = {
    member_observations: 0,
    observer_calls: 0,
    sink_invoked: false,
    sink_confirmed: false,
    pipeline_confirmed_delivery: false,
    local_failure: null,
    r07_revocation: null,
    host_closed: false,
  };
  let lastContext = null;
  let lastObserved = null;

  function latch(code) {
    if (facts.local_failure === null) facts.local_failure = code;
    return code;
  }
  // An own-Host failure is a fact about this operation even though the accepted
  // pipeline only sees the resulting transport failure. Latch it before the throw
  // so the caller is never told about a nameless failure.
  function fail(code) {
    latch(code);
    throw localFailure(code);
  }
  const aborted = () => operation.signal !== null && operation.signal.aborted === true;

  // A member recheck is a fresh provider observation, never a reuse of the
  // admission's own allow. An observed R07 rejection is latched as the operation's
  // first cause and a later callback or resource error cannot overwrite it.
  function memberRecheck() {
    facts.member_observations += 1;
    if (aborted()) return latch('cancelled');
    const outcome = corePackageSet.recheckPackageSet(operation.admission, 'read');
    if (outcome.status === 'allowed') return null;
    if (outcome.decision && outcome.decision.status === 'rejected') {
      if (facts.r07_revocation === null) facts.r07_revocation = outcome.decision;
      return 'r07';
    }
    return latch(outcome.local_failure ?? 'provider_observation_invalid');
  }

  function observeRead(input) {
    facts.observer_calls += 1;
    try {
      return operation.provider.observeRead(freeze({ request: input.request, snapshot: input.snapshot }));
    } catch {
      throw localFailure('provider_failed');
    }
  }

  async function observe(input) {
    lastObserved = input;
    if (facts.host_closed) fail('provider_invalid');
    const before = memberRecheck();
    if (before) fail(before === 'r07' ? 'provider_observation_invalid' : before);
    let raw;
    try {
      raw = await observeRead(input);
    } catch (error) {
      fail(failureCode(error) ?? 'provider_failed');
    }
    const value = captureHostContext(raw);
    const after = memberRecheck();
    if (after) fail(after === 'r07' ? 'provider_observation_invalid' : after);
    // The accepted generic gate compares Host identity only when a handle is
    // present, and this line always fixes handle:null. Pinning host_id and
    // host_epoch on EVERY observation — including the first and the post-sink
    // one — is therefore required; a consistent foreign pair is not a new
    // binding and is never stored as the new expectation.
    if (value.host_id !== operation.provider.host_id || value.host_epoch !== operation.provider.host_epoch) fail('provider_invalid');
    lastContext = value;
    return value;
  }

  async function deliver(prepared) {
    if (!prepared || prepared.channel !== 'read_envelope' || !prepared.envelope || prepared.envelope.status !== 'ready') {
      // The other accepted channels are returned unchanged: N1 must not rewrite an
      // admission rejection, a no-body control or a transport failure.
      return true;
    }
    if (facts.host_closed) return false;
    if (aborted()) {
      latch('cancelled');
      return false;
    }
    if (memberRecheck()) return false;
    if (typeof operation.provider.sink !== 'function') {
      // No own Read delivery is installed. The channel alone proves nothing: the
      // accepted envelope already carries receipt.delivery = delivered.
      latch('delivery_unconfirmed');
      return false;
    }
    facts.sink_invoked = true;
    let sinkResult;
    try {
      sinkResult = operation.provider.sink(prepared);
    } catch {
      latch('delivery_unconfirmed');
      return false;
    }
    // Only a synchronous strict true confirms delivery. A Promise is neither
    // awaited nor able to upgrade later, and there is exactly one physical sink
    // attempt with no retry and no second sink.
    if (sinkResult !== true) {
      latch('delivery_unconfirmed');
      return false;
    }
    facts.sink_confirmed = true;
    if (aborted()) {
      latch('cancelled');
      return false;
    }
    if (memberRecheck()) return false;
    if (lastContext === null || lastObserved === null) {
      latch('provider_observation_invalid');
      return false;
    }
    let fresh;
    try {
      fresh = captureHostContext(await observeRead({ request: lastObserved.request, snapshot: lastObserved.snapshot }));
    } catch (error) {
      latch(failureCode(error) ?? 'provider_failed');
      return false;
    }
    if (fresh.host_id !== operation.provider.host_id || fresh.host_epoch !== operation.provider.host_epoch) {
      latch('provider_invalid');
      return false;
    }
    if (fresh.request_id !== lastContext.request_id || fresh.snapshot_id !== lastContext.snapshot_id) {
      latch('provider_observation_invalid');
      return false;
    }
    if (fresh.decision !== 'allow') {
      latch('provider_observation_invalid');
      return false;
    }
    if (fresh.policy_id !== lastContext.policy_id || !sameScope(fresh, lastContext)) {
      latch('provider_observation_invalid');
      return false;
    }
    if (memberRecheck()) return false;
    // Registration and the delivered token are separate facts. Confirming the
    // delivery here is the precise condition the accepted pipeline uses to
    // register the prepared handles.
    facts.pipeline_confirmed_delivery = true;
    return true;
  }

  const host = createTrustedHostReadProvider({
    observe: input => observe(input),
    deliver: prepared => deliver(prepared),
  });
  return {
    host,
    facts,
    latch,
    // The very callback the accepted pipeline reads out of its private Host
    // registry; exposing it lets the caller decide registration at the seam.
    deliver: prepared => deliver(prepared),
    close() {
      facts.host_closed = true;
    },
    lastContext() {
      return lastContext;
    },
  };
}

module.exports = {
  contract,
  KEY_SETS,
  LOCAL_FAILURES,
  localFailure,
  failureCode,
  ownFields,
  ownDenseArray,
  captureHostContext,
  createOwnHost,
};
