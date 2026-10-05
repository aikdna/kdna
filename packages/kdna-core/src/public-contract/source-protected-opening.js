'use strict';
const { randomUUID } = require('node:crypto');
const { types } = require('node:util');
const C = require('./section-common.js');
const S = require('./source-route-common.js');
const D = require('./digests.js');
const P = require('./protection-declaration.js');
const { rejected } = require('./admit.js');
const { openSourceRouteCapture } = require('./source-route-capture.js');
const { admitSource } = require('./source-protected-admission.js');
const frozen = value => C.strict.freeze(value);
const none = () => ({ kind: 'none', external_commit: { state: 'not_invoked' } });
const failures = new WeakSet();
const hosts = new WeakMap(), deliveries = new WeakMap(), revisions = new WeakMap();
const definitionDigest = D.digestCanonical(S.contract.module);
const routeContract = frozen({ id: S.contract.module.versions.source_route, version: '0.1.0-candidate', definition_digest: definitionDigest });
const protectedContract = frozen({ id: S.contract.module.versions.protected_source_route, version: '0.1.0-candidate', definition_digest: definitionDigest });

function fail(code, stage) {
  const error = new Error(code);
  error.sourceDiagnostic = { code, stage };
  failures.add(error);
  throw error;
}
function history(state) {
  return state?.handoff ? structuredClone(state.handoff) : none();
}
function failed(code, stage, state) {
  const result = { status: 'source_failed', diagnostic: { code, stage }, disclosure: history(state), body: null, body_bytes: 0 };
  S.validate('SourceRouteFailure06', result);
  return frozen(result);
}
function fromError(error, stage, state, classify) {
  if (failures.has(error)) return failed(error.sourceDiagnostic.code, error.sourceDiagnostic.stage, state);
  if (P.isFailure(error)) {
    const result = { status: 'source_failed', diagnostic: P.failure(error).diagnostic, disclosure: history(state), body: null, body_bytes: 0 };
    S.validate('SourceRouteFailure06', result);
    return frozen(result);
  }
  const result = { status: 'core_rejected', stage: stage === 'capture' ? 'capture' : 'admission', core: rejected(classify(error), error?.component_failure ?? null, error?.diagnostic ?? null), disclosure: history(state), body: null, body_bytes: 0 };
  S.validate('SourceRouteCoreRejected06', result);
  return frozen(result);
}
function callbacks(value, names) {
  if (!value || typeof value !== 'object' || types.isProxy(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== names.length || keys.some(k => !names.includes(k))) return null;
  const result = {};
  for (const name of names) {
    const d = Object.getOwnPropertyDescriptor(value, name);
    if (!d || !Object.hasOwn(d, 'value') || typeof d.value !== 'function') return null;
    result[name] = d.value;
  }
  return result;
}
function createTrustedProtectedSectionSourceHost(value) {
  const cb = callbacks(value, ['observe', 'deliver']);
  if (!cb) throw new TypeError('Protected complete-source Host callbacks required');
  const host = Object.freeze({});
  hosts.set(host, cb);
  return host;
}
function inputPolicy(options, declared) {
  // Only the nonsecret own signaturePolicy value is examined before caller consent.
  if (!options || typeof options !== 'object' || types.isProxy(options) || ![Object.prototype, null].includes(Object.getPrototypeOf(options))) fail('SOURCE_INPUT_INVALID', 'input');
  const keys = Reflect.ownKeys(options);
  if (keys.length !== 2 || !keys.includes('credential') || !keys.includes('signaturePolicy')) fail('SOURCE_INPUT_INVALID', 'input');
  const d = Object.getOwnPropertyDescriptor(options, 'signaturePolicy');
  if (!d || !Object.hasOwn(d, 'value')) fail('SOURCE_INPUT_INVALID', 'input');
  let policy;
  try { policy = C.strict.copyJson(d.value); C.validate('SectionSignaturePolicy06', policy); }
  catch { fail('SOURCE_INPUT_INVALID', 'input'); }
  if (D.digestCanonical(policy) !== D.digestCanonical(declared)) fail('SOURCE_INPUT_INVALID', 'input');
  return policy;
}
function local(record, stage) {
  if (record.closed) fail('SOURCE_CONTEXT_CLOSED', stage);
  if (Date.now() > record.deadline) fail('SOURCE_DEADLINE_EXCEEDED', stage);
}
function observeRequest(record, purpose) {
  return frozen({ context_id: record.contextId, epoch: record.epoch, asset_digest: record.source.digests.A, scope: 'complete_source', purpose, requested_at_ms: Date.now() });
}
function acceptObservation(record, raw, initial = false) {
  let value;
  try { value = C.strict.copyJson(raw); }
  catch { fail('SOURCE_PROVIDER_FAILED', 'authorization'); }
  if (value?.scope !== 'complete_source' || value?.asset_digest !== record.source.digests.A) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
  if (value.permission !== 'allowed' || value.revoked === true) fail(initial ? 'SOURCE_HOST_DENIED' : 'SOURCE_PERMISSION_REJECTED', 'authorization');
  try { S.validate('ProtectedSectionSourceHostObservation06', value); }
  catch { fail('SOURCE_PROVIDER_FAILED', 'authorization'); }
  if (value.current_ms >= value.expires_at_ms) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
  if (!initial && (value.context_id !== record.contextId || value.epoch !== record.epoch || value.current_ms < record.lastMs || value.current_ms >= record.originalExpiresAt)) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
  if (initial) {
    record.contextId = value.context_id;
    record.epoch = value.epoch;
    record.originalExpiresAt = value.expires_at_ms;
  }
  record.lastMs = value.current_ms;
  record.observation = frozen(value);
  return record.observation;
}
async function operationCurrent(record, phase, stage) {
  local(record, stage);
  const observed = await record.source.binding.observe(phase);
  local(record, stage);
  if (observed.status !== 'current') fail('SOURCE_PERMISSION_REJECTED', stage);
  const settled = record.source.binding.assertCurrent(observed.checkpoint);
  if (settled.status !== 'current') fail('SOURCE_PERMISSION_REJECTED', stage);
  local(record, stage);
  record.receipt = settled.receipt;
}
async function hostCurrent(record, purpose, stage, initial = false, observer = null) {
  local(record, stage);
  let raw;
  try { raw = await (observer ? observer() : record.host.observe(observeRequest(record, purpose))); }
  catch { fail('SOURCE_PROVIDER_FAILED', stage); }
  local(record, stage);
  await record.capture.assertUnchanged();
  local(record, stage);
  return acceptObservation(record, raw, initial);
}
function bundle(record, observation) {
  const source = record.source;
  const routeObservation = {
    contract: routeContract, request_digest: record.requestDigest, capture_id: record.capture.identity.capture_id,
    input_profile: 'protected_logical_payload06', tuple: structuredClone(C.contract.module.versionTuple),
    digests: { ...source.digests }, E_profile: 'kdna.digest-basis.runtime-entry-set/0.2.0',
    logical_payload_encoding: 'original_decrypted_cbor', logical_payload_digest: source.plaintextDigest,
    logical_payload_bytes: source.plaintext.length, inventory: source.inventory,
    proof: 'complete_native_admission_and_source_observation_not_editing_authority'
  };
  S.validate('SourceRouteObservation06', routeObservation);
  return Object.freeze({
    identity: frozen({ ...source.digests }), manifest: frozen(structuredClone(source.manifest)), payload: frozen(structuredClone(source.payload)),
    original_members: source.members.map(row => Object.freeze({ name: row.name, type: row.type, mode: row.mode, bytes: new Uint8Array(row.bytes) })),
    original_inventory: frozen(structuredClone(source.inventory)),
    plaintext_payload: Object.freeze({ entry: 'payload.kdnab', bytes: new Uint8Array(source.plaintext), sha256: source.plaintextDigest }),
    prior_snapshot: source.snapshot, host_observation: observation,
    proof_limits: frozen(['Complete original source observation, not editing or publication authority.', 'Original decrypted CBOR and all original member bytes; no physical sections proof or range performance claim.']),
    observation: frozen(routeObservation)
  });
}

function createOpening(resolve, classify) {
  return async function withProtectedSectionSourceNode(input, request, authority, options, provider, hostToken) {
    let capture, source, owner, state, context, stage = 'input';
    try {
      const host = hosts.get(hostToken);
      if (!host) fail('SOURCE_HOST_UNTRUSTED', 'input');
      const resolved = resolve(request, authority);
      if (!resolved || resolved.record.data.operation !== 'open_protected_source' || resolved.record.data.expected_A === null) fail('SOURCE_INPUT_INVALID', 'input');
      const { record, callback } = resolved;
      const policy = inputPolicy(options, record.data.signature_policy);
      const deadline = Date.now() + record.data.timeout_ms;
      const current = where => { if (Date.now() > deadline) fail('SOURCE_DEADLINE_EXCEEDED', where); };
      current('admission');
      stage = 'capture';
      capture = await openSourceRouteCapture(input);
      current('admission');
      const manifest = C.strict.parseJson(capture.manifestBytes);
      C.validate('ProtectedManifest06Candidate', manifest);
      capture = { ...capture, identity: frozen({ ...capture.identity, input_profile: 'protected_logical_payload06' }) };
      C.need(capture.rows.every(r => r.method === 0 || r.method === 8), 'READ_CORE_CAPABILITY_UNAVAILABLE');
      const inventory = capture.rows.map(r => ({ name: r.name, decoded_bytes: r.size, compressed_bytes: r.compressed, local_header_offset: r.local, data_offset: r.start, compression_method: r.method })).sort((a, b) => C.utf8(a.name, b.name));
      const intent = {
        operation: 'open_protected_source', scope: 'complete_source', input_profile: 'protected_logical_payload06',
        capture_id: capture.identity.capture_id, request_digest: record.digest, member_inventory: inventory,
        authentication_scope: 'full_original_protected_payload_and_resources', source_bytes_delivery: 'trusted_complete_source_host',
        signature_policy: policy, edits_digest: null, output_policy_digest: null
      };
      const consent = { request: record.data, request_digest: record.digest, capture: capture.identity, intent, intent_digest: D.digestCanonical(intent), manifest_identity: { asset_id: manifest.asset_id, asset_version: manifest.version, judgment_version: manifest.judgment_version } };
      S.validate('SourceOperationAuthorityContext06', consent);
      let allowed;
      current('authorization');
      try { allowed = await callback(frozen(consent)); }
      catch { fail('SOURCE_CAPABILITY_UNAVAILABLE', 'authorization'); }
      current('authorization');
      if (allowed !== true) fail('SOURCE_PERMISSION_REJECTED', 'authorization');
      stage = 'admission';
      current('admission');
      const bytes = await capture.wholeAfterAuthorization();
      current('admission');
      if (D.digest(bytes) !== record.data.expected_A) fail('SOURCE_EXPECTED_ASSET_MISMATCH', 'admission');
      source = await admitSource(bytes, capture.manifestBytes, options, provider, capture, current, policy);
      current('admission');
      owner = { source, host, capture, requestDigest: record.digest, deadline, closed: false, contextId: null, epoch: null, originalExpiresAt: null, lastMs: 0, receipt: source.receipt };
      const observed = await hostCurrent(owner, 'source_opening', 'authorization', true);
      await operationCurrent(owner, 'host_handoff', 'authorization');
      local(owner, 'authorization');
      const delivered = bundle(owner, observed);
      context = Object.freeze({}); revisions.set(context, { owner, phase: 'available' });
      const token = Object.freeze({});
      state = { token, owner, phase: 'open', closed: false, handoff: null };
      deliveries.set(token, state);
      local(owner, 'authorization');
      state.handoff = { kind: 'trusted_host', at_ms: Date.now(), external_commit: { state: 'not_invoked' } };
      let acknowledged;
      try { acknowledged = await host.deliver(delivered, token, context); }
      catch { fail('SOURCE_PROVIDER_FAILED', 'return'); }
      state.closed = true;
      revisions.get(context).phase = 'closed';
      local(owner, 'return');
      if (acknowledged !== true) fail(state.phase === 'pending' ? 'SOURCE_HANDOFF_UNKNOWN' : 'SOURCE_HOST_DENIED', 'return');
      await hostCurrent(owner, 'publish', 'return');
      await operationCurrent(owner, 'read_return', 'return');
      local(owner, 'return');
      const result = { status: 'source_delivered', contract: protectedContract, receipt: owner.receipt, disclosure: history(state), source_identity: { ...source.digests }, body: null, body_bytes: 0 };
      S.validate('ProtectedSectionSourceDelivered06', result);
      return frozen(result);
    } catch (error) {
      return fromError(error, stage, state, classify);
    } finally {
      if (owner) owner.closed = true;
      if (state) state.closed = true;
      if (context) revisions.get(context).phase = 'closed';
      source?.dispose();
      if (capture) await capture.close();
    }
  };
}

async function commitProtectedSectionSourceTransport(prepared, transport) {
  const state = deliveries.get(prepared);
  if (!state) return failed('SOURCE_CONTEXT_UNTRUSTED', 'input');
  try {
    const cb = callbacks(transport, ['observeScope', 'commit']);
    if (!cb) fail('SOURCE_INPUT_INVALID', 'input');
    if (state.closed || !state.handoff) fail('SOURCE_CONTEXT_CLOSED', 'input');
    if (state.phase !== 'open') fail('SOURCE_HANDOFF_UNKNOWN', 'return');
    const owner = state.owner;
    await hostCurrent(owner, 'publish', 'authorization', false, cb.observeScope);
    await operationCurrent(owner, 'transport_commit', 'authorization');
    local(owner, 'authorization');
    if (state.closed) fail('SOURCE_CONTEXT_CLOSED', 'input');
    if (state.phase !== 'open') fail('SOURCE_HANDOFF_UNKNOWN', 'return');
    // Consume before any sink call; even false/throw/thenable may have written bytes.
    state.phase = 'pending';
    state.handoff.external_commit = { state: 'outcome_unknown', attempt_id: 'source-attempt:' + randomUUID(), attempted_at_ms: Date.now() };
    let committed;
    try { committed = cb.commit(bundle(owner, owner.observation)); }
    catch { state.phase = 'failed'; fail('SOURCE_HANDOFF_UNKNOWN', 'return'); }
    if (committed !== true) { state.phase = 'failed'; fail('SOURCE_HANDOFF_UNKNOWN', 'return'); }
    state.phase = 'committed';
    state.handoff.external_commit = { ...state.handoff.external_commit, state: 'confirmed', confirmed_at_ms: Date.now() };
    local(owner, 'return');
    const result = { status: 'source_committed', disclosure: history(state), body: null, body_bytes: 0 };
    S.validate('ProtectedSectionSourceCommit06', result);
    return frozen(result);
  } catch (error) {
    if (failures.has(error)) return failed(error.sourceDiagnostic.code, error.sourceDiagnostic.stage, state);
    return failed('SOURCE_CAPABILITY_UNAVAILABLE', 'return', state);
  }
}

function reserveRevision(context, kind) {
  const entry = revisions.get(context);
  if (!entry) fail('SOURCE_CONTEXT_UNTRUSTED', 'input');
  if (entry.phase !== 'available' || entry.owner.closed) fail('SOURCE_CONTEXT_CLOSED', 'input');
  // No caller code runs between same-instance lookup and this transition.
  entry.phase = 'reserved';
  entry.consumedBy = kind;
  return {
    owner: entry.owner,
    current(stage) {
      // The deliver callback closes its context before outer return awaits end.
      // A pending revision must not use that remaining outer-operation window.
      if (entry.phase !== 'reserved' || entry.owner.closed) fail('SOURCE_CONTEXT_CLOSED', 'input');
      local(entry.owner, stage);
    }
  };
}
const revision = require('./source-protected-revision.js').createRevision({
  reserve: reserveRevision, local, hostCurrent, operationCurrent, fail,
  isFailure: error => failures.has(error)
});
module.exports = { createOpening, createTrustedProtectedSectionSourceHost,
  commitProtectedSectionSourceTransport, ...revision };
