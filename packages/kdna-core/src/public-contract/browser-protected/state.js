'use strict';
const strict = require('../browser-native/strict-input.js');
const { digestCanonical } = require('../digests.js');
const { inspectSnapshot, markProtectedSnapshot } = require('../brand.js');
const contract = require('../protected-browser-contract/contract.json');
const validators = require('../protected-browser-contract/validators.cjs');
const origins = new WeakMap(), requests = new WeakMap(), authorities = new WeakMap();
const operations = new WeakMap(), snapshots = new WeakMap(), checkpoints = new WeakMap(), failures = new WeakMap();
const tuple = require('../generated-contract.json').versionTuple;
const frozen = strict.freeze;
function need(ok, code = 'READ_INPUT_INVALID') {
  if (!ok) { const error = new Error(code); failures.set(error, code); throw error; }
}
function validate(name, value) {
  strict.assertStrictJson(value);
  need(typeof validators[name] === 'function' && validators[name](value), 'READ_INPUT_INVALID');
  scalars(value, contract.types[name]);
  return value;
}
function scalars(value, shape, depth = 0) {
  need(depth <= 64);
  if (shape.$ref) {
    const name = shape.$ref.slice(8);
    if (name === 'Identifier') need(strict.identifier(value));
    if (['EntryName', 'RuntimeMandatoryEntryName'].includes(name)) need(strict.entryName(value));
    if (name === 'Timestamp') need(strict.validTimestamp(value));
    return scalars(value, contract.types[name], depth);
  }
  if (typeof value === 'string') need(strict.scalarString(value));
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(shape.properties ?? {}))
      if (Object.hasOwn(value, key)) scalars(value[key], child, depth + 1);
    if (Array.isArray(value) && shape.items) for (const child of value) scalars(child, shape.items, depth + 1);
  }
  for (const child of shape.allOf ?? []) scalars(value, child, depth);
  for (const child of shape.oneOf ?? shape.anyOf ?? []) {
    const branch = child.$ref ? contract.types[child.$ref.slice(8)] : child;
    if (branch.type && (branch.type === 'null' ? value !== null : branch.type === 'array' ? !Array.isArray(value) : typeof value !== branch.type)) continue;
    if (Object.entries(branch.properties ?? {}).some(([key, field]) => Object.hasOwn(field, 'const') && Object.hasOwn(value ?? {}, key) && value[key] !== field.const)) continue;
    scalars(value, child, depth);
  }
}
function parseJsonText(value) { need(typeof value === 'string'); return strict.parseJson(value); }
function keys(value, names) {
  need(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === names.length && names.every(k => Object.hasOwn(value, k)));
}
const C = { strict, contract, validate, keys, need, parseJsonText, isFailure: e => failures.has(e), failureCode: e => failures.get(e) ?? null };
function failed(code = 'PROTECTION_OPERATION_UNTRUSTED', stage = 'input') {
  return frozen({ status: 'protection_failed', diagnostic: { code, stage }, checked_at_ms: null });
}
// Registration is private to successful browser admission. Public snapshot fields,
// JSON copies and Node admissions cannot establish this provenance.
function register(snapshot, metadata) {
  const view = inspectSnapshot(snapshot);
  need(view && strict.canonicalJson(view.tuple) === strict.canonicalJson(tuple), 'READ_SNAPSHOT_UNATTESTED');
  const origin = { phase: 'available', view, metadata: frozen(metadata) };
  origins.set(snapshot, origin);
  markProtectedSnapshot(snapshot, () => origin.phase !== 'closed');
}
function mintRequest(data, sourceDigest = null) {
  const token = Object.freeze({}), copy = frozen(strict.copyJson(data)), digest = digestCanonical(copy);
  requests.set(token, { data: copy, digest, sourceDigest: sourceDigest ?? digest, operation: null });
  return token;
}
function request(token) { const r = requests.get(token); return r && (!r.operation || operation(r.operation)) ? r : null; }
function inspectRequest(token) { return request(token)?.data ?? null; }
function normalized(record, view) {
  if (record.data.mode !== 'exact_selection') return mintRequest(record.data, record.sourceDigest);
  const s = record.data.selection;
  need(s.asset_id === view.asset.asset_id, 'READ_ASSET_MISMATCH');
  need(s.asset_version === view.asset.asset_version, 'READ_ASSET_VERSION_MISMATCH');
  const wanted = new Set(s.judgment_ids), ordered = view.ir.catalog.filter(x => wanted.has(x.judgment_id)).map(x => x.judgment_id);
  need(ordered.length === wanted.size, 'READ_SELECTION_NOT_FOUND');
  return mintRequest({ ...record.data, selection: { ...s, judgment_ids: ordered } }, record.sourceDigest);
}
function createAuthority(callback, policyJson) {
  if (typeof callback !== 'function') throw new TypeError('PROTECTED_BROWSER_AUTHORITY_CALLBACK');
  const policy = policyJson === undefined ? { requireSignature: false, expectedPublicKeyHex: null } : parseJsonText(policyJson);
  validate('BrowserProtectedSignaturePolicy', policy);
  const token = Object.freeze({}); authorities.set(token, { callback, policy: frozen(policy) }); return token;
}
function operation(token) { const record = operations.get(token); return record && !record.disposed ? record : null; }
function inspectProtectedSnapshot(token) { const record = snapshots.get(token); return record && !record.disposed ? record.view : null; }
function pairRequest(token, op) {
  const r = requests.get(token), record = operation(op);
  need(r && record && !r.operation);
  r.operation = op; return token;
}
function dispose(op) {
  const record = operations.get(op);
  if (!record || record.disposed) return;
  record.disposed = true; record.generation++;
  record.origin.phase = 'closed'; record.origin.view = null; record.origin.metadata = null;
  for (const release of record.releases) release();
  record.releases.clear();
  record.view = null; record.metadata = null;
}
function onDispose(op, release) {
  const record = operation(op);
  if (!record) { release(); return () => {}; }
  record.releases.add(release);
  return () => record.releases.delete(release);
}
function clock(record, stage) {
  need(!record.disposed, 'PROTECTION_OPERATION_DISPOSED');
  let now;
  try { now = record.metadata.provider.clock(); } catch { need(!record.disposed, 'PROTECTION_OPERATION_DISPOSED'); need(false, 'PROTECTION_PROVIDER_FAILED'); }
  need(!record.disposed, 'PROTECTION_OPERATION_DISPOSED');
  need(strict.uint(now), 'PROTECTION_PROVIDER_FAILED');
  need(now >= record.lastTime, 'PROTECTION_STATE_ROLLBACK');
  record.lastTime = now; return now;
}
function receipt(record, now) {
  return frozen({ contract: 'kdna.protected-browser-observation/0.1.0-candidate', operation_id: record.id,
    snapshot_id: record.view.snapshot_id, A: record.view.digests.A.observed, C: record.view.digests.C.observed,
    E: record.view.digests.E.observed, checked_at_ms: now, proof: 'observation_not_authority', provenance: 'host_supplied_triple' });
}
function context(record, r, phase, policy) {
  const view = record.view, read_intent = {
    operation: phase, operation_id: record.id, capture_id: record.base.capture.capture_id,
    snapshot_id: view.snapshot_id, request_digest: r.digest, mode: r.data.mode,
    physical_reads: 'none', provenance: 'host_supplied_triple', new_decryption: false,
    new_domain_validation: false, new_signature_verification: false
  };
  return frozen({ request: r.data, request_digest: r.digest, tuple: view.tuple, asset: view.asset,
    digests: view.digests, read_intent, read_intent_digest: digestCanonical(read_intent),
    signature_policy: policy, disclosure: record.metadata.disclosure });
}
async function grant(authority, r, record, phase) {
  const a = authorities.get(authority);
  need(a && !record.disposed, 'PROTECTION_OPERATION_UNTRUSTED');
  const integrity = record.metadata.integrity;
  need(!(a.policy.requireSignature || a.policy.expectedPublicKeyHex !== null) ||
    integrity.signature !== 'absent' && (a.policy.expectedPublicKeyHex === null || integrity.public_key === a.policy.expectedPublicKeyHex), 'READ_CORE_INVALID');
  const value = context(record, r, phase, a.policy);
  validate('BrowserProtectedAuthorityContext', value);
  let accepted;
  try { accepted = await a.callback(value); } catch { need(!record.disposed, 'PROTECTION_OPERATION_DISPOSED'); need(false, 'READ_HOST_DENIED'); }
  need(!record.disposed, 'PROTECTION_OPERATION_DISPOSED');
  need(accepted === true, 'READ_HOST_DENIED');
  return value;
}
function bind(op, authority, r) {
  const record = operation(op);
  if (!record || !r || r.operation !== op) return null;
  const binding = Object.freeze({
    observe(phase) {
      const task = record.queue.then(async () => {
        try {
          clock(record, phase);
          await grant(authority, r, record, phase);
          const now = clock(record, phase); record.generation++;
          const checkpoint = Object.freeze({}); checkpoints.set(checkpoint, { record, generation: record.generation, phase });
          return Object.freeze({ status: 'current', checkpoint, receipt: receipt(record, now) });
        } catch (e) { return failed(failures.get(e) ?? 'PROTECTION_PROVIDER_FAILED', phase); }
      });
      record.queue = task.then(() => undefined, () => undefined); return task;
    },
    assertCurrent(checkpoint) {
      const cp = checkpoints.get(checkpoint);
      if (!cp || cp.record !== record) return failed();
      try {
        const now = clock(record, cp.phase);
        need(record.generation === cp.generation, 'PROTECTION_STATE_ROLLBACK');
        return Object.freeze({ status: 'current', receipt: receipt(record, now) });
      } catch (e) { return failed(failures.get(e) ?? 'PROTECTION_PROVIDER_FAILED', cp.phase); }
    }
  });
  return { record, binding };
}
async function admit(snapshot, admitted, authority) {
  const origin = origins.get(snapshot), raw = request(admitted);
  if (!origin || origin.phase !== 'available' || !raw || raw.operation || raw.data.mode === 'expand' || !authorities.has(authority)) return failed();
  // Consume the genuine origin before any clock/authority callback can reenter.
  origin.phase = 'reserved';
  let op;
  try {
    op = Object.freeze({});
    const nativeSnapshot = Object.freeze({}), metadata = origin.metadata;
    const view = frozen({ ...origin.view, observation: metadata.observation });
    const record = { id: 'browser-protection:' + globalThis.crypto.randomUUID(), origin, view, metadata,
      base: { capture: { capture_id: 'browser-origin:' + globalThis.crypto.randomUUID() } },
      disposed: false, generation: 0, lastTime: 0, queue: Promise.resolve(), releases: new Set() };
    operations.set(op, record); snapshots.set(nativeSnapshot, record);
    need(strict.canonicalJson(raw.data.tuple) === strict.canonicalJson(view.tuple), 'READ_UNSUPPORTED_VERSION');
    const token = normalized(raw, view), r = requests.get(token);
    pairRequest(token, op);
    await grant(authority, r, record, 'admit_retained_protected_snapshot');
    const now = clock(record, 'authorization'); origin.phase = 'active';
    const proof = receipt(record, now); record.receipt = proof;
    return Object.freeze({ status: 'accepted', request: token, snapshot: nativeSnapshot, operation: op,
      receipt: proof, observation: view.observation, disclosure: metadata.disclosure, physical_reads: 'none' });
  } catch (e) {
    dispose(op);
    origin.phase = 'closed'; origin.view = null; origin.metadata = null;
    return failed(failures.get(e) ?? 'READ_CORE_CAPABILITY_UNAVAILABLE', 'authorization');
  }
}
module.exports = { C, tuple, frozen, register, mintRequest, request, inspectRequest, normalized, createAuthority,
  operation, inspectSnapshot: inspectProtectedSnapshot, pairRequest, dispose, onDispose, grant, bind, admit };
