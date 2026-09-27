'use strict';
// B3 protected source opening.
//
// This is the only route that discloses original protected bytes and the authenticated
// decrypted CBOR, and it discloses them to exactly one recipient: a Host created by
// this same Core through `createTrustedProtectedSourceHost`, inside that Host's own
// `deliver` callback. The outer result is body-free and carries only finite
// statuses/capabilities/digests.
//
// What is NOT here: no plaintext declassification, no catalog content, no second
// crypto or container parser, no permission inferred from a projection Read scope, and
// no long-lived lease that would let a human drafting interval outlive an authorization.
const { randomUUID } = require('node:crypto');
const { freeze, uint, identifier } = require('./strict-input.js');
const { digest } = require('./digests.js');
const { admitProtectedSource } = require('./protection-admission.js');
const { bindProtectionOperation, disposeProtectionOperation } = require('./protection-operation.js');
const {
  openSourceDelivery,
  stateOf,
  disclosure,
  recordHandoff,
  beginCommit,
  settleCommit,
  closeSourceDelivery,
  hadPendingCommit,
  noneDisclosure,
} = require('./protected-source-delivery.js');
const { createRevisionContext, closeRevisionContext } = require('./protected-source-revision.js');
const CONTRACT = require('./protected-source-contract.generated.json');

const LIMITS = Object.freeze({
  container_bytes: 25 * 1024 * 1024,
  entries: 128,
  entry_bytes: 8 * 1024 * 1024,
  total_uncompressed_bytes: 12 * 1024 * 1024,
  compression_ratio: 100,
  delivered_plaintext_bytes: 8 * 1024 * 1024,
  documented_raw_byte_bound: 20 * 1024 * 1024,
  timeout_ms_min: 1,
  timeout_ms_max: 60000,
});

const PROFILES = Object.freeze(['kdna.envelope.aead/0.1.0', 'kdna.envelope.external-grant/0.1.0']);

const PROOF_LIMITS = Object.freeze([
  'Source delivery is one admission observation, not editing, adoption, action or publication authority.',
  'Member bytes, names and modes are preserved except explicitly edited members and refreshed protection content bindings; ZIP compression, timestamps, extras and comments are not preserved.',
  'Bytes and decoded values only: no filesystem extraction, attachment execution or hooks.',
  'complete_source authorizes the original Manifest, the whole decrypted Payload including material a projection Read would not emit, and every original member/attachment.',
]);

const CALLABLES = Object.freeze([
  'getProtectedSourceContract',
  'createTrustedProtectedSourceHost',
  'withProtectedSourceNode',
  'commitProtectedSourceTransport',
  'previewProtectedSourceRevision',
  'produceProtectedSourceRevision',
]);

const hosts = new WeakMap();

function diagnostic(code, stage) {
  return freeze({ code, stage });
}
function sourceFailed(code, stage, history) {
  return freeze({ status: 'source_failed', diagnostic: diagnostic(code, stage), disclosure: history, body: null, body_bytes: 0 });
}

function getProtectedSourceContract() {
  return freeze({
    contract: freeze({ id: CONTRACT.id, version: CONTRACT.version, definition_digest: CONTRACT.definition_digest }),
    implementation: freeze({ package: '@aikdna/kdna-core', version: require('../../package.json').version }),
    profiles: PROFILES,
    callables: CALLABLES,
    limits: LIMITS,
    proof_limits: PROOF_LIMITS,
  });
}

// A Host is an opaque same-Core brand. Only own data-descriptor callbacks named exactly
// `observe` and `deliver` are accepted, so no Agent, JSON body or HTTP client can forge
// one, and no accessor can run during registration.
function createTrustedProtectedSourceHost(callbacks) {
  if (!callbacks || typeof callbacks !== 'object' || Object.getOwnPropertySymbols(callbacks).length) {
    throw new TypeError('Protected source Host callbacks required');
  }
  const names = Object.getOwnPropertyNames(callbacks).sort();
  if (names.length !== 2 || names[0] !== 'deliver' || names[1] !== 'observe') {
    throw new TypeError('Protected source Host callbacks required');
  }
  for (const key of ['observe', 'deliver']) {
    const descriptor = Object.getOwnPropertyDescriptor(callbacks, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value') || typeof descriptor.value !== 'function') {
      throw new TypeError('Protected source Host callbacks required');
    }
  }
  const host = Object.freeze({});
  hosts.set(host, { observe: callbacks.observe, deliver: callbacks.deliver });
  return host;
}

function readOptions(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return null;
  const names = Object.getOwnPropertyNames(options).sort();
  if (names.length !== 3 || names[0] !== 'admission' || names[1] !== 'expected_A' || names[2] !== 'timeout_ms') return null;
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(options, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return null;
  }
  const { admission, expected_A: expectedA, timeout_ms: timeoutMs } = options;
  if (!uint(timeoutMs) || timeoutMs < LIMITS.timeout_ms_min || timeoutMs > LIMITS.timeout_ms_max) return null;
  if (typeof expectedA !== 'string' || !/^sha256:[0-9a-f]{64}$/.test(expectedA)) return null;
  return { admission, expectedA, timeoutMs };
}

function catalogArm(catalog, history) {
  const observed = catalog?.digests ?? {};
  return freeze({
    status: 'catalog_only',
    capability: freeze({
      source_opening: false,
      revision: false,
      interpretation: 'blocked',
      asset_capability: catalog?.asset_capability ?? null,
    }),
    identity: freeze({ A: observed.A?.observed ?? null, C: observed.C?.observed ?? null, E: observed.E?.observed ?? null }),
    disclosure: history,
    body: null,
    body_bytes: 0,
  });
}

function coreRejectedArm(admitted, history) {
  return freeze({
    status: 'core_rejected',
    stage: 'admission',
    core: admitted.core,
    disclosure: history,
    body: null,
    body_bytes: 0,
  });
}

function buildBundle(record, hostObservation) {
  const source = record.source;
  // Sealed, not deep-frozen: the bundle carries owned byte copies and
  // `strict-input.freeze` cannot freeze a typed array with elements.
  return Object.freeze({
    identity: freeze({ A: source.digestA, C: source.digestC, E: source.digestE }),
    manifest: source.manifest,
    payload: source.payload,
    original_members: source.members.map((row) => Object.freeze({ name: row.name, type: row.type, mode: row.mode, bytes: Buffer.from(row.bytes) })),
    original_inventory: freeze(source.inventory.map((row) => freeze({ ...row }))),
    plaintext_payload: Object.freeze({ entry: 'payload.kdnab', bytes: Buffer.from(source.plaintext), sha256: source.plaintextDigest }),
    prior_snapshot: source.snapshot,
    host_observation: hostObservation,
    proof_limits: PROOF_LIMITS,
  });
}

async function withProtectedSourceNode(input, options, protectionProvider, sourceHost) {
  const host = hosts.get(sourceHost);
  if (!host) return sourceFailed('SOURCE_HOST_UNTRUSTED', 'input', noneDisclosure());
  const config = readOptions(options);
  if (!config) return sourceFailed('SOURCE_INPUT_INVALID', 'input', noneDisclosure());
  const deadline = Date.now() + config.timeoutMs;
  let admitted, binding, operation, deliveryState, context, record;
  try {
    admitted = await admitProtectedSource(input, config.admission, protectionProvider);
    if (Date.now() > deadline) return sourceFailed('SOURCE_DEADLINE_EXCEEDED', 'admission', noneDisclosure());
    if (admitted.status === 'catalog_only') return catalogArm(admitted.catalog, noneDisclosure());
    // An embedded protected failure keeps its exact existing diagnostic and code
    // family; the source module never renumbers an accepted enum.
    if (admitted.status === 'protection_failed') {
      return freeze({ status: 'source_failed', diagnostic: admitted.diagnostic, disclosure: noneDisclosure(), body: null, body_bytes: 0 });
    }
    if (admitted.status !== 'source') return coreRejectedArm(admitted, noneDisclosure());
    // `admitProtectedSource` reports the raw digest strings; the evidence-shaped
    // `.observed` form only exists on the snapshot/carrier produced by finishAdmission.
    if (admitted.digests.A !== config.expectedA) return sourceFailed('SOURCE_EXPECTED_ASSET_MISMATCH', 'input', noneDisclosure());

    const bound = bindProtectionOperation(admitted.operation);
    if (bound.status !== 'bound') return sourceFailed('SOURCE_CAPABILITY_UNAVAILABLE', 'admission', noneDisclosure());
    binding = bound.binding;
    operation = admitted.operation;
    deliveryState = stateOf(openSourceDelivery(null));

    const source = {
      digestA: admitted.digests.A,
      digestC: admitted.digests.C,
      digestE: admitted.digests.E,
      manifest: admitted.manifest,
      payload: admitted.payload,
      entries: admitted.entries,
      members: admitted.members,
      inventory: admitted.inventory,
      plaintext: admitted.plaintext,
      plaintextDigest: digest(admitted.plaintext),
      snapshot: admitted.snapshot,
    };
    record = {
      ownerId: 'protected-source:' + randomUUID(),
      generation: 0,
      A: source.digestA,
      contextId: null,
      epoch: null,
      originalExpiresAt: null,
      deadline,
      lastMs: 0,
      observe: host.observe,
      binding,
      source,
      closed: false,
    };

    // Fresh Host authority is obtained inside the same call that will deliver, so a
    // permission observed for an earlier opening cannot be replayed here.
    const request = freeze({
      context_id: null,
      epoch: null,
      asset_digest: record.A,
      scope: 'complete_source',
      purpose: 'source_opening',
      requested_at_ms: Date.now(),
    });
    let observation;
    try {
      observation = await host.observe(request);
    } catch {
      return sourceFailed('SOURCE_PROVIDER_FAILED', 'authorization', noneDisclosure());
    }
    if (Date.now() > deadline) return sourceFailed('SOURCE_DEADLINE_EXCEEDED', 'authorization', noneDisclosure());
    if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
      return sourceFailed('SOURCE_PROVIDER_FAILED', 'authorization', noneDisclosure());
    }
    if (observation.scope !== 'complete_source' || observation.asset_digest !== record.A) {
      return sourceFailed('SOURCE_PERMISSION_REJECTED', 'authorization', noneDisclosure());
    }
    if (observation.permission !== 'allowed' || observation.revoked === true) {
      return sourceFailed('SOURCE_HOST_DENIED', 'authorization', noneDisclosure());
    }
    if (!uint(observation.current_ms) || !uint(observation.expires_at_ms) || observation.current_ms >= observation.expires_at_ms) {
      return sourceFailed('SOURCE_PERMISSION_REJECTED', 'authorization', noneDisclosure());
    }
    record.contextId = observation.context_id;
    record.epoch = observation.epoch;
    record.originalExpiresAt = observation.expires_at_ms;
    record.lastMs = observation.current_ms;

    const preHandoff = await binding.observe('host_handoff');
    if (preHandoff.status !== 'current') return sourceFailed('SOURCE_PERMISSION_REJECTED', 'authorization', noneDisclosure());

    const bundle = buildBundle(record, freeze({ ...observation }));
    context = createRevisionContext(record);
    deliveryState.owner = record;
    deliveryState.ownerBinding = binding;
    deliveryState.bundle = bundle;
    recordHandoff(deliveryState, Date.now());
    let acknowledged;
    try {
      acknowledged = await host.deliver(bundle, deliveryState.token, context);
    } catch {
      closeSourceDelivery(deliveryState);
      return sourceFailed('SOURCE_PROVIDER_FAILED', 'return', disclosure(deliveryState));
    }
    const pending = hadPendingCommit(deliveryState);
    closeSourceDelivery(deliveryState);
    if (acknowledged !== true) {
      return sourceFailed(pending ? 'SOURCE_HANDOFF_UNKNOWN' : 'SOURCE_HOST_DENIED', 'return', disclosure(deliveryState));
    }
    const postHandoff = await binding.observe('read_return');
    if (postHandoff.status !== 'current') return sourceFailed('SOURCE_PERMISSION_REJECTED', 'return', disclosure(deliveryState));
    if (Date.now() > deadline) return sourceFailed('SOURCE_DEADLINE_EXCEEDED', 'return', disclosure(deliveryState));
    return freeze({
      status: 'source_delivered',
      receipt: admitted.receipt,
      disclosure: disclosure(deliveryState),
      source_identity: freeze({ A: source.digestA, C: source.digestC, E: source.digestE }),
      body: null,
      body_bytes: 0,
    });
  } catch {
    return sourceFailed('SOURCE_CAPABILITY_UNAVAILABLE', 'admission', noneDisclosure());
  } finally {
    if (record) record.closed = true;
    if (context) closeRevisionContext(context);
    if (deliveryState) closeSourceDelivery(deliveryState);
    if (operation) disposeProtectionOperation(operation);
  }
}

// The prepared token is consumed at most once, before the sink is invoked. A false,
// throwing or thenable-returning commit stays `outcome_unknown`; only a synchronous
// `true` confirms. There is no retry and no send after the owner settled.
async function commitProtectedSourceTransport(prepared, transport) {
  const state = stateOf(prepared);
  if (!state) return sourceFailed('SOURCE_CONTEXT_UNTRUSTED', 'input', noneDisclosure());
  const history = () => disclosure(state);
  if (!transport || typeof transport !== 'object' || Array.isArray(transport)) return sourceFailed('SOURCE_INPUT_INVALID', 'input', history());
  const names = Object.getOwnPropertyNames(transport).sort();
  if (names.length !== 2 || names[0] !== 'commit' || names[1] !== 'observeScope') return sourceFailed('SOURCE_INPUT_INVALID', 'input', history());
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(transport, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) return sourceFailed('SOURCE_INPUT_INVALID', 'input', history());
  }
  if (typeof transport.observeScope !== 'function' || typeof transport.commit !== 'function') return sourceFailed('SOURCE_INPUT_INVALID', 'input', history());
  if (state.closed || !state.handoff) return sourceFailed('SOURCE_CONTEXT_CLOSED', 'input', history());
  if (state.phase !== 'open') return sourceFailed('SOURCE_HANDOFF_UNKNOWN', 'return', history());
  let observation;
  try {
    observation = await transport.observeScope();
  } catch {
    return sourceFailed('SOURCE_PROVIDER_FAILED', 'authorization', history());
  }
  const owner = state.owner;
  if (owner && (observation?.scope !== 'complete_source' || observation?.permission !== 'allowed' || observation?.revoked === true)) {
    return sourceFailed('SOURCE_PERMISSION_REJECTED', 'authorization', history());
  }
  const ownerBinding = state.ownerBinding;
  if (ownerBinding) {
    const current = await ownerBinding.observe('transport_commit');
    if (current.status !== 'current') return sourceFailed('SOURCE_PERMISSION_REJECTED', 'authorization', history());
  }
  if (!beginCommit(state, Date.now())) return sourceFailed('SOURCE_HANDOFF_UNKNOWN', 'return', history());
  let committed;
  try {
    committed = transport.commit(state.bundle ?? null);
  } catch {
    settleCommit(state, false, Date.now());
    return sourceFailed('SOURCE_HANDOFF_UNKNOWN', 'return', history());
  }
  if (committed !== true) {
    settleCommit(state, false, Date.now());
    return sourceFailed('SOURCE_HANDOFF_UNKNOWN', 'return', history());
  }
  settleCommit(state, true, Date.now());
  return freeze({ status: 'source_committed', disclosure: history(), body: null, body_bytes: 0 });
}

module.exports = {
  getProtectedSourceContract,
  createTrustedProtectedSourceHost,
  withProtectedSourceNode,
  commitProtectedSourceTransport,
};
