'use strict';
// Source-bound revision: one-use contexts, validation-only preview, and the
// producer that turns an adopted proposal back into a licensed encrypted asset.
//
// Lifecycle (each numbered step is enforced in code, in this order):
//   1. reserve  — opaque context identity is looked up in the same-Core WeakMap and
//                 moved available -> reserved BEFORE any caller value is read.
//   2. capture  — edits/policy/provider are read through closed own-data descriptors;
//                 accessors, proxies and unknown fields are refused, and no getter runs.
//   3. current  — the captured Host observer and the existing Core operation are both
//                 re-checked before and after every await, together with the owner
//                 generation, the absolute operation deadline and the ORIGINAL
//                 context/epoch/A/expiry. A renewed Host expiry never extends it.
//   4. work     — preview validates; produce asks the output-secret provider only after
//                 step 3 has passed, then re-encrypts.
//   5. publish  — only the still-open owning callback may publish, exactly once.
//
// The producer deliberately duplicates the encryption/integrity sequence of
// `protection-producer.js` rather than calling it: that accepted producer opens its
// input through the ordinary authoring path; the protected route preserves it.
// Sharing would require changing an accepted leaf; duplicating two call sites is the
// smaller, disclosed cost. Both paths call the same crypto/integrity primitives.
const { randomUUID } = require('node:crypto');
const { freeze, uint, identifier, copyJson } = require('./strict-input.js');
const { closed, bytes: copyBytes, fail } = require('./protection-declaration.js');
const { digest, digestCanonical, contentTreePreimage, runtimeEntryPreimage } = require('./digests.js');
const { validate } = require('./validate.js');
const { parseContainer } = require('./container.js');
const { encodeStored } = require('./container-writer.js');
const { encryptPassword, encryptExternal, validateEnvelope } = require('./protection-crypto.js');
const { encodeEnvelope } = require('./protection-envelope-codec.js');
const { makeChecksums, signEntries, verifyIntegrity } = require('./protection-integrity.js');
const { validateProposedRevision } = require('./protected-source-preview.js');
const CONTRACT = require('./protected-source-contract.generated.json');

const contexts = new WeakMap();
const CLOSED_OWNER = 'SOURCE_CONTEXT_CLOSED';
const UNTRUSTED_OWNER = 'SOURCE_CONTEXT_UNTRUSTED';

function diagnostic(code, stage) {
  return freeze({ code, stage });
}
function previewRejected(code, stage) {
  return freeze({ status: 'preview_rejected', diagnostic: diagnostic(code, stage), body: null, body_bytes: 0 });
}
function revisionRejected(code, stage) {
  return freeze({ status: 'revision_rejected', diagnostic: diagnostic(code, stage), body: null, body_bytes: 0 });
}
function contractIdentity() {
  return freeze({
    contract: freeze({ id: CONTRACT.id, version: CONTRACT.version, definition_digest: CONTRACT.definition_digest }),
    implementation: freeze({ package: '@aikdna/kdna-core', version: require('../../package.json').version }),
  });
}

function implementationObservation() {
  return freeze({ name: '@aikdna/kdna-core', version: require('../../package.json').version });
}

// ---------- context registry ----------

function createRevisionContext(owner) {
  const context = Object.freeze({});
  contexts.set(context, {
    owner,
    state: 'available',
    consumedBy: null,
    closed: false,
  });
  return context;
}

function closeRevisionContext(context) {
  const entry = contexts.get(context);
  if (!entry) return;
  entry.closed = true;
  if (entry.state === 'available') entry.state = 'closed';
}

function reserveContext(context, kind) {
  const entry = contexts.get(context);
  if (!entry) return { ok: false, code: UNTRUSTED_OWNER, stage: 'input' };
  if (entry.closed || entry.state !== 'available') return { ok: false, code: CLOSED_OWNER, stage: 'input' };
  // Atomic within this synchronous block: no caller code runs between the identity
  // lookup and the state transition, so a second call cannot observe `available`.
  entry.state = 'reserved';
  entry.consumedBy = kind;
  return { ok: true, entry };
}

// ---------- owner freshness ----------

function checkLocal(record, stage) {
  if (record.closed) return { ok: false, code: CLOSED_OWNER, stage: 'input' };
  const generation = record.generation;
  const now = Date.now();
  if (now > record.deadline) return { ok: false, code: 'SOURCE_DEADLINE_EXCEEDED', stage };
  return { ok: true, now, generation };
}

function observationRequest(record, purpose, now) {
  return freeze({
    context_id: record.contextId,
    epoch: record.epoch,
    asset_digest: record.A,
    scope: 'complete_source',
    purpose,
    requested_at_ms: now,
  });
}

// A Host observation is authorized only when every field agrees with the ORIGINAL
// opening. A later observation that extends its own expiry cannot extend the original
// context's expiry, and a rolled-back clock is refused.
function verifyObservation(record, value) {
  const keys = ['context_id', 'epoch', 'asset_digest', 'permission', 'scope', 'current_ms', 'expires_at_ms', 'revoked'];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { code: 'SOURCE_PROVIDER_FAILED', stage: 'authorization' };
  const own = Object.keys(value).sort();
  if (own.length !== keys.length || own.some((k, i) => k !== [...keys].sort()[i])) return { code: 'SOURCE_PROVIDER_FAILED', stage: 'authorization' };
  if (value.scope !== 'complete_source') return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (value.context_id !== record.contextId || value.epoch !== record.epoch) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (value.asset_digest !== record.A) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (value.permission !== 'allowed' || value.revoked === true) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (!uint(value.current_ms) || !uint(value.expires_at_ms)) return { code: 'SOURCE_PROVIDER_FAILED', stage: 'authorization' };
  if (value.current_ms < record.lastMs) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (value.current_ms >= value.expires_at_ms) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  if (value.current_ms >= record.originalExpiresAt) return { code: 'SOURCE_PERMISSION_REJECTED', stage: 'authorization' };
  return null;
}

// One bracketed external interaction: local check, callback, local re-check. A value
// that arrives after the deadline or after the owner ended is discarded, so a late
// observation or provider result can never launch new work.
async function bracketed(record, stage, work) {
  const pre = checkLocal(record, stage);
  if (!pre.ok) return pre;
  let value;
  try {
    value = await work(pre.now);
  } catch {
    return { ok: false, code: 'SOURCE_PROVIDER_FAILED', stage };
  }
  const post = checkLocal(record, stage);
  if (!post.ok) return post;
  if (post.generation !== pre.generation) return { ok: false, code: 'SOURCE_PERMISSION_REJECTED', stage };
  return { ok: true, value, now: post.now };
}

// `stage` is this module's own diagnostic stage; `phase` is one of the accepted
// protection observation phases. They are deliberately separate: the protection
// binding only accepts its own closed phase list.
async function refreshOwner(record, purpose, stage, phase) {
  const observed = await bracketed(record, stage, (now) => record.observe(observationRequest(record, purpose, now)));
  if (!observed.ok) return observed;
  const bad = verifyObservation(record, observed.value);
  if (bad) return { ok: false, code: bad.code, stage: bad.stage };
  record.lastMs = observed.value.current_ms;
  const core = await bracketed(record, stage, () => record.binding.observe(phase));
  if (!core.ok) return core;
  if (core.value?.status !== 'current') return { ok: false, code: 'SOURCE_PERMISSION_REJECTED', stage };
  const settled = record.binding.assertCurrent(core.value.checkpoint);
  if (settled?.status !== 'current') return { ok: false, code: 'SOURCE_PERMISSION_REJECTED', stage };
  return { ok: true, receipt: settled.receipt };
}

// ---------- closed input capture ----------

function captureEdits(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('edits'), { code: 'INPUT' });
  closed(value, [], ['manifest', 'payload']);
  const captured = {};
  for (const key of ['manifest', 'payload']) {
    if (!Object.hasOwn(value, key)) continue;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) throw Object.assign(new Error('edits'), { code: 'INPUT' });
    captured[key] = copyJson(descriptor.value);
  }
  // An edits object with neither key is the explicit "no authored change" case: the
  // producer must then feed the ORIGINAL decrypted CBOR bytes to the new encryption.
  return captured;
}

// The output policy is exactly one of the two accepted encrypted producer variants
// plus explicit integrity decisions. No arbitrary CEK, plaintext or member injection.
function capturePolicy(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
  const kind = value.kind;
  const fields = kind === 'password' ? ['asset_uid', 'entitlement', 'slots'] : kind === 'external-grant' ? ['asset_uid', 'entitlement', 'key_ref', 'issuer_key_id'] : [];
  closed(value, ['kind', 'checksums', 'signature', ...fields]);
  if (!['password', 'external-grant'].includes(kind)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
  if (typeof value.checksums !== 'boolean' || !['none', 'ed25519'].includes(value.signature)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
  const captured = copyJson(value);
  if (!identifier(captured.asset_uid)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
  if (kind === 'password') {
    closed(captured.entitlement, ['profile'], ['offline', 'revocable']);
    if (captured.entitlement.profile !== 'password' || captured.entitlement.offline === false || captured.entitlement.revocable === true) throw Object.assign(new Error('policy'), { code: 'INPUT' });
    if (!Array.isArray(captured.slots) || captured.slots.length < 1 || captured.slots.length > 16) throw Object.assign(new Error('policy'), { code: 'INPUT' });
    const names = new Set();
    for (const slot of captured.slots) {
      closed(slot, ['slot', 'kdf_profile']);
      if (!identifier(slot.slot) || names.has(slot.slot) || !['scrypt-sha256', 'argon2id'].includes(slot.kdf_profile)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
      names.add(slot.slot);
    }
  } else {
    closed(captured.entitlement, ['profile'], ['offline', 'revocable']);
    if (!['account', 'org'].includes(captured.entitlement.profile)) throw Object.assign(new Error('policy'), { code: 'INPUT' });
    if (!identifier(captured.key_ref) || !identifier(captured.issuer_key_id) || captured.issuer_key_id.length > 128) throw Object.assign(new Error('policy'), { code: 'INPUT' });
  }
  return captured;
}

function captureProvider(value) {
  if (typeof value !== 'function') throw Object.assign(new Error('provider'), { code: 'INPUT' });
  return value;
}

function policyDigest(policy) {
  return digestCanonical(policy);
}

// ---------- output ----------

function ownSecrets(policy, supplied, owned) {
  const own = (value, max, exact = null) => {
    const copy = copyBytes(value, max, exact);
    owned.push(copy);
    return copy;
  };
  const secrets = {};
  if (policy.signature === 'ed25519') secrets.signingSeed = own(supplied.signingSeed, 32, 32);
  if (policy.kind === 'password') {
    if (!Array.isArray(supplied.passwords) || supplied.passwords.length !== policy.slots.length) fail('INPUT_INVALID', 'input');
    secrets.passwords = policy.slots.map((slot, index) => {
      const entry = closed(supplied.passwords[index], ['slot', 'password']);
      if (entry.slot !== slot.slot) fail('INPUT_INVALID', 'input');
      return { slot: slot.slot, password: own(entry.password, 1048576) };
    });
  } else {
    secrets.issuerRootKey = own(supplied.issuerRootKey, 32, 32);
  }
  return secrets;
}

function declaredChecksums(entries, manifest, E) {
  return Buffer.from(JSON.stringify(makeChecksums(entries, manifest, E)));
}

// The explicit remove/replace/add table. Old integrity entries are dropped from the
// final member list before the policy is applied, so a same-named entry can never be
// appended beside itself.
function applyIntegrity(entries, manifest, E, policy) {
  const had = {
    'checksums.json': Object.hasOwn(entries, 'checksums.json'),
    'signature.kdsig': Object.hasOwn(entries, 'signature.kdsig'),
  };
  delete entries['checksums.json'];
  delete entries['signature.kdsig'];
  const actions = {};
  if (policy.checksums) {
    entries['checksums.json'] = declaredChecksums(entries, manifest, E);
    actions['checksums.json'] = had['checksums.json'] ? 'replaced' : 'added';
  } else if (had['checksums.json']) {
    actions['checksums.json'] = 'removed';
  }
  if (policy.signature === 'ed25519') {
    entries['signature.kdsig'] = signEntries(entries, policy.signingSeed);
    actions['signature.kdsig'] = had['signature.kdsig'] ? 'replaced' : 'added';
  } else if (had['signature.kdsig']) {
    actions['signature.kdsig'] = 'removed';
  }
  return actions;
}

function buildOutput(source, edits, policy, secrets) {
  const entries = {};
  for (const [name, value] of Object.entries(source.entries)) entries[name] = Buffer.from(value);
  const baseMembers = source.members.map((row) => ({ name: row.name, mode: row.mode, bytes: Buffer.from(row.bytes) }));
  const manifest = edits.manifest ? copyJson(edits.manifest) : copyJson(source.manifest);
  const plaintext = edits.payload
    ? Buffer.from(new (require('cbor-x/index-no-eval').Encoder)({ useRecords: false, mapsAsObjects: true, structuredClone: false, alwaysUseFloat: true }).encode(edits.payload))
    : Buffer.from(source.plaintext);
  if (Object.hasOwn(manifest, 'asset_uid') && manifest.asset_uid !== policy.asset_uid) fail('DECLARATION_INVALID', 'declaration');
  manifest.asset_uid = policy.asset_uid;
  manifest.access = 'licensed';
  manifest.entitlement = copyJson(policy.entitlement);
  manifest.payload.encrypted = true;
  const profile = policy.kind === 'password'
    ? { id: 'kdna.envelope.aead', version: '0.1.0' }
    : { id: 'kdna.envelope.external-grant', version: '0.1.0' };
  manifest.encryption = { profile: profile.id, profile_version: profile.version, encrypted_entries: ['payload.kdnab'] };
  validate('Manifest', manifest);
  const envelope = policy.kind === 'password'
    ? encryptPassword(plaintext, manifest, policy.slots, secrets.passwords)
    : encryptExternal(plaintext, manifest, policy, secrets.issuerRootKey);
  validateEnvelope(envelope, profile);
  entries['payload.kdnab'] = encodeEnvelope(envelope);
  entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  const C = digest(contentTreePreimage(entries));
  if (Object.hasOwn(manifest, 'content_digest')) manifest.content_digest = C;
  if (Object.hasOwn(manifest.authoring ?? {}, 'content_digest')) manifest.authoring.content_digest = C;
  entries['kdna.json'] = Buffer.from(JSON.stringify(manifest));
  validate('Manifest', manifest);
  const E = digest(runtimeEntryPreimage(entries, manifest));
  const actions = applyIntegrity(entries, manifest, E, { ...policy, signingSeed: secrets.signingSeed });
  // The final member list is rebuilt from the retained original members minus the two
  // integrity entries, which the policy then re-adds. Rebuilding is what makes a
  // same-named duplicate impossible; a replaced entry keeps its original mode and a
  // newly added one is 0o100644.
  const output = baseMembers
    .filter((row) => !['checksums.json', 'signature.kdsig'].includes(row.name))
    .map((row) => ({ ...row, bytes: entries[row.name] }));
  for (const name of ['checksums.json', 'signature.kdsig']) {
    if (!entries[name]) continue;
    const original = baseMembers.find((row) => row.name === name);
    output.push({ name, mode: original ? original.mode : 0o100644, bytes: entries[name] });
  }
  const outputBytes = encodeStored(output);
  parseContainer(outputBytes);
  const integrity = verifyIntegrity(Object.fromEntries(output.map((row) => [row.name, row.bytes])), manifest, E, {
    requireSignature: policy.signature === 'ed25519',
    expectedPublicKeyHex: null,
  });
  return {
    bytes: outputBytes,
    manifest,
    evidence: {
      contract: { id: CONTRACT.id, version: CONTRACT.version, definition_digest: CONTRACT.definition_digest },
      implementation: { package: '@aikdna/kdna-core', version: require('../../package.json').version },
      source_A: source.digestA,
      output: { A: digest(outputBytes), C, E },
      profile,
      entry: 'payload.kdnab',
      member_actions: actions,
      integrity,
      payload_source: edits.payload ? 'explicit_edit' : 'original_decrypted_cbor',
      proof: 'producer_observation_not_consumer_admission',
    },
  };
}

// ---------- public callables ----------

async function previewProtectedSourceRevision(context, edits, policy) {
  const reserved = reserveContext(context, 'preview');
  if (!reserved.ok) return previewRejected(reserved.code, reserved.stage);
  let capturedEdits, capturedPolicy;
  try {
    capturedEdits = captureEdits(edits);
    capturedPolicy = capturePolicy(policy);
  } catch {
    return previewRejected('SOURCE_INPUT_INVALID', 'input');
  }
  const record = reserved.entry.owner;
  const fresh = await refreshOwner(record, 'preview', 'semantic', 'host_observation');
  if (!fresh.ok) {
    const code = fresh.code === CLOSED_OWNER || fresh.code === UNTRUSTED_OWNER ? 'SOURCE_CONTEXT_CLOSED' : fresh.code;
    return previewRejected(code, fresh.stage === 'authorization' ? 'authorization' : fresh.stage);
  }
  let validated;
  try {
    const manifest = capturedEdits.manifest ?? record.source.manifest;
    const payload = capturedEdits.payload ?? record.source.payload;
    validated = validateProposedRevision(manifest, payload, record.source.entries);
  } catch {
    return previewRejected('SOURCE_DRAFT_INVALID', 'semantic');
  }
  if (validated.semantic_status !== 'valid') return previewRejected('SOURCE_INTERPRETATION_INCOMPLETE', 'semantic');
  return freeze({
    status: 'preview_valid',
    validation: freeze({
      contract: contractIdentity().contract,
      implementation: implementationObservation(),
      source_A: record.A,
      original_payload_digest: record.source.plaintextDigest,
      edits_digest: digestCanonical(capturedEdits),
      policy_digest: policyDigest(capturedPolicy),
      semantic_status: 'valid',
      proof: 'semantic_validation_not_ciphertext_admission',
    }),
    body: null,
    body_bytes: 0,
  });
}

async function produceProtectedSourceRevision(context, edits, policy, outputSecretProvider) {
  const reserved = reserveContext(context, 'produce');
  if (!reserved.ok) return revisionRejected(reserved.code, reserved.stage);
  let capturedEdits, capturedPolicy, provider;
  try {
    capturedEdits = captureEdits(edits);
    capturedPolicy = capturePolicy(policy);
    provider = captureProvider(outputSecretProvider);
  } catch {
    return revisionRejected('SOURCE_INPUT_INVALID', 'input');
  }
  const record = reserved.entry.owner;
  const owned = [];
  try {
    // The output secrets are requested only after the fresh source/Host check, and the
    // request carries finite metadata only.
    const fresh = await refreshOwner(record, 'produce', 'semantic', 'host_observation');
    if (!fresh.ok) return revisionRejected(fresh.code, fresh.stage);
    let supplied;
    try {
      supplied = await provider(freeze({
        source_A: record.A,
        edits_digest: digestCanonical(capturedEdits),
        policy_digest: policyDigest(capturedPolicy),
        kind: capturedPolicy.kind,
        signature: capturedPolicy.signature,
      }));
    } catch {
      return revisionRejected('SOURCE_PROVIDER_FAILED', 'semantic');
    }
    const after = checkLocal(record, 'semantic');
    if (!after.ok) return revisionRejected(after.code, after.stage);
    const secrets = ownSecrets(capturedPolicy, supplied, owned);
    if (capturedPolicy.signature === 'ed25519') capturedPolicy.signingSeed = secrets.signingSeed;
    let validated;
    try {
      validated = validateProposedRevision(
        capturedEdits.manifest ?? record.source.manifest,
        capturedEdits.payload ?? record.source.payload,
        record.source.entries,
      );
    } catch {
      return revisionRejected('SOURCE_DRAFT_INVALID', 'semantic');
    }
    if (validated.semantic_status !== 'valid') return revisionRejected('SOURCE_INTERPRETATION_INCOMPLETE', 'semantic');
    const built = buildOutput(record.source, capturedEdits, capturedPolicy, secrets);
    const publish = await refreshOwner(record, 'publish', 'return', 'read_return');
    if (!publish.ok) {
      built.bytes.fill(0);
      return revisionRejected(publish.code, publish.stage);
    }
    // Sealed, not deep-frozen: `bytes` is an owned typed array and
    // `strict-input.freeze` cannot freeze a typed array with elements.
    return Object.freeze({
      status: 'revision_produced',
      bytes: built.bytes,
      evidence: freeze({ ...built.evidence, output_delivery: 'not_published', output_A: null }),
      body_bytes: built.bytes.length,
    });
  } catch (error) {
    // A producer never throws: every internal rejection becomes a closed, body-free arm.
    // A declaration conflict with the captured original is a policy problem, and it is
    // reported as such rather than as a generic output failure.
    const code = error?.code === 'PROTECTION_DECLARATION_INVALID' || error?.code === 'PROTECTION_DECLARATION_CONFLICT'
      ? 'SOURCE_POLICY_INVALID'
      : error?.code === 'PROTECTION_INPUT_INVALID' || error?.code === 'PROTECTION_PROFILE_UNSUPPORTED'
        ? 'SOURCE_INPUT_INVALID'
        : 'SOURCE_OUTPUT_INVALID';
    return revisionRejected(code, code === 'SOURCE_OUTPUT_INVALID' ? 'output' : 'input');
  } finally {
    for (const value of owned) value.fill(0);
  }
}

module.exports = {
  createRevisionContext,
  closeRevisionContext,
  previewProtectedSourceRevision,
  produceProtectedSourceRevision,
};
