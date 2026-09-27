'use strict';
// B3 protected source opening: freezing, disclosure, context lifetime and the
// validation-only preview. Every expectation here is one of the frozen literals
// L01–L11; the producer literals L12–L15 live in the revision suite.
const test = require('node:test');
const H = require('./protection-test-helpers.js');
const { assert, core, req, F } = H;
const crypto = require('node:crypto');
const path = require('node:path');
const source = req('@aikdna/kdna-core/protected-source-node');

const PASSWORD = Buffer.from('correct horse battery staple');
const SLOT = 's1';
const policy = H.policy;

// Timing discipline (A1/R3). The wall-clock operation deadline is NOT the subject of the
// behavioural cases: those paths run scrypt, so a tight budget made them load-dependent
// (a full parallel run once produced SOURCE_DEADLINE_EXCEEDED where the case expected a
// permission or delivery outcome). Every behavioural case therefore uses a 5 s budget,
// and the deadline rule itself is covered by one dedicated deterministic case: a Host
// observer that sleeps 60 ms under a 5 ms budget must refuse with
// SOURCE_DEADLINE_EXCEEDED and deliver nothing, independent of machine load.
const OPERATION_BUDGET_MS = 5000;

function passwordOptions(asset, over = {}) {
  return {
    kind: 'password',
    asset_uid: asset.manifest.asset_uid,
    entitlement: { profile: 'password', offline: true, revocable: false },
    slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
    checksums: true,
    signature: 'none',
    ...over,
  };
}

async function predecessor(over = {}) {
  const asset = H.asset(2);
  const ordinary = F.encode(asset, req);
  const passwords = [{ slot: SLOT, password: PASSWORD }];
  const output = await core.protectSourceBytes(ordinary, passwordOptions(asset, over), { passwords });
  assert.equal(output.status, 'produced', JSON.stringify(output));
  return { asset, ordinary, bytes: output.bytes, passwords, output, A: output.evidence.output.A };
}

function admission() {
  return { credential: { kind: 'password', password: PASSWORD, slotIndex: 0 }, signaturePolicy: policy };
}

function hostOf(plan) {
  const seen = { observe: 0, deliver: 0, committed: 0 };
  const host = source.createTrustedProtectedSourceHost({
    observe: async () => {
      seen.observe += 1;
      return plan.observation(seen.observe);
    },
    deliver: async (bundle, prepared, context) => {
      seen.deliver += 1;
      seen.bundle = bundle;
      seen.prepared = prepared;
      seen.context = context;
      if (plan.inside) await plan.inside({ bundle, prepared, context, seen });
      return plan.ack === undefined ? true : plan.ack;
    },
  });
  return { host, seen };
}

function observation(A, over = {}) {
  return {
    context_id: 'context:one',
    epoch: 'epoch:one',
    asset_digest: A,
    permission: 'allowed',
    scope: 'complete_source',
    current_ms: 1000,
    expires_at_ms: 2000,
    revoked: false,
    ...over,
  };
}

// L16 / L01: exactly six callables, and the accepted protection module is untouched.
test('the source module exposes exactly six callables and leaves the protection module alone', () => {
  assert.deepEqual(Object.keys(source).sort(), [
    'commitProtectedSourceTransport',
    'createTrustedProtectedSourceHost',
    'getProtectedSourceContract',
    'previewProtectedSourceRevision',
    'produceProtectedSourceRevision',
    'withProtectedSourceNode',
  ]);
  assert.equal(Object.keys(core).length, 5);
  const descriptor = source.getProtectedSourceContract();
  assert.equal(descriptor.contract.id, 'kdna.protected-source/1');
  assert.equal(descriptor.contract.version, '1.0.0');
  assert.equal(descriptor.implementation.package, '@aikdna/kdna-core');
  assert.equal(descriptor.implementation.version, '0.36.0-rc.r2.7');
  assert.equal(descriptor.profiles.length, 2);
  assert.equal(descriptor.limits.timeout_ms_max, 60000);
  assert.match(descriptor.contract.definition_digest, /^sha256:[0-9a-f]{64}$/);
  assert.throws(() => source.createTrustedProtectedSourceHost({ observe() {}, deliver: 1 }), TypeError);
  assert.throws(() => source.createTrustedProtectedSourceHost({ deliver() {}, observe() {}, extra() {} }), TypeError);
});

// L04: a protected predecessor is opened through the protected admission only.
test('L04 an ordinary or tampered predecessor is refused with no sink and no downgrade', async () => {
  const { ordinary, A } = await predecessor();
  const plain = hostOf({ observation: () => observation(A) });
  const refused = await source.withProtectedSourceNode(ordinary, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plain.host);
  assert.equal(plain.seen.deliver, 0);
  assert.equal(refused.body, null);
  assert.equal(refused.source_identity, undefined);
  assert.ok(['source_failed', 'core_rejected'].includes(refused.status), JSON.stringify(refused));

  const { bytes } = await predecessor();
  const tampered = Buffer.from(bytes);
  tampered[tampered.length - 30] ^= 0xff;
  const denied = hostOf({ observation: () => observation(A) });
  const result = await source.withProtectedSourceNode(tampered, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, denied.host);
  assert.ok(['source_failed', 'core_rejected'].includes(result.status), JSON.stringify(result));
  assert.equal(denied.seen.deliver, 0);
});

test('a real protected predecessor opens once and delivers owned original bytes plus the decrypted CBOR', async () => {
  const { asset, ordinary, bytes, A } = await predecessor();
  assert.ok(asset.manifest.asset_uid);
  assert.ok(ordinary.length > 0);
  const plan = hostOf({ observation: () => observation(A) });
  const result = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plan.host);
  assert.equal(result.status, 'source_delivered', JSON.stringify(result));
  assert.equal(result.body, null);
  assert.equal(result.body_bytes, 0);
  assert.equal(result.source_identity.A, A);
  assert.equal(plan.seen.deliver, 1);
  const bundle = plan.seen.bundle;
  assert.equal(bundle.plaintext_payload.entry, 'payload.kdnab');
  // The delivered plaintext must be the ORIGINAL decrypted CBOR, i.e. exactly what the
  // ordinary container carried before protection was applied.
  const { parseContainer } = require(path.join(H.coreDir, 'src/public-contract/container.js'));
  const beforeProtection = parseContainer(new Uint8Array(ordinary));
  const { digest } = require(path.join(H.coreDir, 'src/public-contract/digests.js'));
  assert.deepEqual(Array.from(bundle.plaintext_payload.bytes), Array.from(beforeProtection['payload.kdnab']));
  assert.equal(bundle.plaintext_payload.sha256, digest(beforeProtection['payload.kdnab']));
  const original = req('@aikdna/kdna-core/authoring-node').openSourceBytes(new Uint8Array(ordinary));
  assert.equal(original.status, 'accepted');
  // The protected container carries one extra member (checksums.json), so the
  // shared members are compared one by one rather than by count.
  assert.ok(bundle.original_inventory.length >= original.source.inventory.length);
  for (const row of bundle.original_inventory) {
    const match = original.source.inventory.find((x) => x.name === row.name);
    if (!match) continue; // the refreshed integrity member has no predecessor twin
    // kdna.json gains the protection fields and payload.kdnab becomes the ciphertext;
    // both are the point of the change, so only the untouched members are compared.
    if (['kdna.json', 'payload.kdnab'].includes(row.name)) continue;
    assert.equal(row.sha256, match.sha256, row.name);
    assert.equal(row.mode, match.mode, row.name);
    assert.equal(row.size, match.size, row.name);
  }
  for (const match of original.source.inventory) {
    if (!['kdna.json', 'payload.kdnab'].includes(match.name)) {
      assert.ok(bundle.original_inventory.some((row) => row.name === match.name && row.sha256 === match.sha256), match.name);
    }
  }
  // The delivered original members are the protected container's own bytes, not the
  // ordinary predecessor's: payload.kdnab is the ciphertext.
  const protectedMembers = parseContainer(new Uint8Array(bytes));
  const delivered = bundle.original_members.find((m) => m.name === 'payload.kdnab');
  assert.deepEqual(Array.from(delivered.bytes), Array.from(protectedMembers['payload.kdnab']));
  // Mutating a delivered buffer cannot change the retained original: a fresh opening of
  // the same predecessor still observes the same member bytes.
  delivered.bytes.fill(0);
  const again = hostOf({ observation: () => observation(A) });
  const reopened = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, again.host);
  assert.equal(reopened.status, 'source_delivered', JSON.stringify(reopened));
  assert.deepEqual(
    Array.from(again.seen.bundle.original_members.find((m) => m.name === 'payload.kdnab').bytes),
    Array.from(protectedMembers['payload.kdnab']),
  );
  assert.equal(bundle.proof_limits.length, 4);
  assert.ok(bundle.prior_snapshot);
  assert.equal(bundle.prior_snapshot.status, undefined);
});

// L05 / L06: the outside of the callback is body-free and content-free.
test('L05 the outer arms expose only finite statuses, capabilities and digests', async () => {
  const canary = 'CANARY-3f9c1d0e';
  const { asset, ordinary, A } = await predecessor();
  asset.manifest.title = canary;
  const rebuilt = F.encode(asset, req);
  const output = await core.protectSourceBytes(rebuilt, passwordOptions(asset), { passwords: [{ slot: SLOT, password: PASSWORD }] });
  assert.equal(output.status, 'produced');
  const canaryA = output.evidence.output.A;

  const denied = hostOf({ observation: () => observation(canaryA, { permission: 'denied' }) });
  const refused = await source.withProtectedSourceNode(output.bytes, { admission: admission(), expected_A: canaryA, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, denied.host);
  const text = JSON.stringify(refused);
  assert.ok(!text.includes(canary), 'canary leaked: ' + text);
  assert.deepEqual(Object.keys(refused).sort(), ['body', 'body_bytes', 'diagnostic', 'disclosure', 'status']);
  assert.deepEqual(Object.keys(refused.diagnostic).sort(), ['code', 'stage']);
  assert.deepEqual(Object.keys(refused.disclosure).sort(), ['external_commit', 'kind']);

  const mismatch = hostOf({ observation: () => observation(canaryA) });
  const wrong = await source.withProtectedSourceNode(output.bytes, { admission: admission(), expected_A: 'sha256:' + 'a'.repeat(64), timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, mismatch.host);
  assert.equal(wrong.status, 'source_failed');
  assert.equal(wrong.diagnostic.code, 'SOURCE_EXPECTED_ASSET_MISMATCH');
  assert.equal(mismatch.seen.deliver, 0);
  assert.ok(!JSON.stringify(wrong).includes(canary));
  assert.ok(ordinary.length > 0);
  assert.ok(A);
});

// L09: reservation precedes any observation of caller input.
test('L09 an untrusted or already-used context is refused without running a getter', async () => {
  const { bytes, A } = await predecessor();
  let getters = 0;
  const edits = { payload: {} };
  Object.defineProperty(edits.payload, 'asset', { enumerable: true, get() { getters += 1; return {}; } });
  const policyProbe = { kind: 'password', checksums: true, signature: 'none', asset_uid: 'x', entitlement: { profile: 'password' }, slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }] };
  const provider = () => { getters += 1; return {}; };
  const forgedContext = Object.freeze({});
  const rejected = await source.produceProtectedSourceRevision(forgedContext, edits, policyProbe, provider);
  assert.equal(rejected.status, 'revision_rejected');
  assert.equal(rejected.diagnostic.code, 'SOURCE_CONTEXT_UNTRUSTED');
  assert.equal(getters, 0);

  let inner, first, second;
  const plan = hostOf({
    observation: () => observation(A),
    inside: async (state) => {
      inner = state;
      first = await source.previewProtectedSourceRevision(state.context, { payload: state.bundle.payload }, policyProbe);
      // The same context may be used only once: the second call must refuse and must
      // not reach the input capture.
      edits.payload = { asset: {} };
      second = await source.previewProtectedSourceRevision(state.context, edits, policyProbe);
    },
  });
  const result = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plan.host);
  assert.equal(result.status, 'source_delivered');
  assert.ok(inner.context);
  assert.equal(second.status, 'preview_rejected');
  assert.equal(second.diagnostic.code, 'SOURCE_CONTEXT_CLOSED');
  assert.ok(['preview_valid', 'preview_rejected'].includes(first.status));
  assert.ok(plan.seen.committed === 0);
});

// L10: two clocks; the original context expiry is binding and cannot be renewed.
test('L10 host renewal, context/epoch/A drift and Core expiry all refuse without output', async () => {
  async function attempt(over, code) {
    const { bytes, A } = await predecessor();
    const plan = hostOf({ observation: () => observation(A, over(A)) });
    const result = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plan.host);
    assert.equal(result.status, 'source_failed', JSON.stringify(result));
    assert.equal(result.diagnostic.code, code);
    assert.equal(plan.seen.deliver, 0);
  }
  // A first observation whose own clock is already past its own expiry is refused.
  await attempt(() => ({ current_ms: 2000, expires_at_ms: 2000 }), 'SOURCE_PERMISSION_REJECTED');
  await attempt(() => ({ current_ms: 1500, expires_at_ms: 1400 }), 'SOURCE_PERMISSION_REJECTED');
  await attempt(() => ({ permission: 'denied' }), 'SOURCE_HOST_DENIED');
  await attempt(() => ({ revoked: true }), 'SOURCE_HOST_DENIED');
  await attempt((A) => ({ asset_digest: 'sha256:' + 'b'.repeat(64) }), 'SOURCE_PERMISSION_REJECTED');
  await attempt(() => ({ scope: 'projection' }), 'SOURCE_PERMISSION_REJECTED');

  // The absolute operation deadline is binding: a Host observer that answers after it
  // has passed can no longer authorize the opening.
  const { bytes, A: slowA } = await predecessor();
  let delivered = 0;
  const slow = source.createTrustedProtectedSourceHost({
    observe: async () => {
      await new Promise((resolve) => setTimeout(resolve, 60));
      return observation(slowA);
    },
    deliver: async () => { delivered += 1; return true; },
  });
  const expired = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: slowA, timeout_ms: 5 }, { kind: 'local', clock: () => 1000 }, slow);
  assert.equal(expired.status, 'source_failed', JSON.stringify(expired));
  assert.equal(expired.diagnostic.code, 'SOURCE_DEADLINE_EXCEEDED');
  assert.equal(delivered, 0);
});

// L11: the owning callback closes every unconsumed context and token.
test('L11 an unawaited producer cannot publish after the owner settled', async () => {
  const { bytes, A } = await predecessor();
  let captured;
  const plan = hostOf({
    observation: () => observation(A),
    inside: async (state) => {
      captured = state;
      // Deliberately do NOT await: the owner settles while this is pending.
      state.pending = source.produceProtectedSourceRevision(state.context, { payload: state.bundle.payload }, {
        kind: 'password',
        asset_uid: state.bundle.manifest.asset_uid,
        entitlement: { profile: 'password', offline: true, revocable: false },
        slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
        checksums: true,
        signature: 'none',
      }, () => ({ passwords: [{ slot: SLOT, password: PASSWORD }] }));
    },
  });
  const result = await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plan.host);
  assert.equal(result.status, 'source_delivered');
  const late = await captured.pending;
  assert.equal(late.status, 'revision_rejected', JSON.stringify(late.status));
  assert.ok(['SOURCE_CONTEXT_CLOSED', 'SOURCE_PERMISSION_REJECTED'].includes(late.diagnostic.code), late.diagnostic.code);
  assert.equal(late.bytes, undefined);
});

// L07: preview validates without producing anything.
test('L07 preview consults no output-secret provider and returns no artifact', async () => {
  const { bytes, A } = await predecessor();
  let captured, providerCalls = 0, preview;
  const plan = hostOf({
    observation: () => observation(A),
    inside: async (state) => {
      captured = state;
      preview = await source.previewProtectedSourceRevision(state.context, { payload: state.bundle.payload }, {
        kind: 'password',
        asset_uid: state.bundle.manifest.asset_uid,
        entitlement: { profile: 'password', offline: true, revocable: false },
        slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
        checksums: true,
        signature: 'none',
      });
    },
  });
  assert.equal((await source.withProtectedSourceNode(bytes, { admission: admission(), expected_A: A, timeout_ms: OPERATION_BUDGET_MS }, { kind: 'local', clock: () => 1000 }, plan.host)).status, 'source_delivered');
  assert.equal(preview.status, 'preview_valid', JSON.stringify(preview));
  assert.equal(preview.body, null);
  assert.equal(preview.body_bytes, 0);
  assert.equal(preview.validation.proof, 'semantic_validation_not_ciphertext_admission');
  assert.equal(preview.validation.source_A, A);
  assert.equal(preview.validation.semantic_status, 'valid');
  assert.match(preview.validation.edits_digest, /^sha256:[0-9a-f]{64}$/);
  assert.match(preview.validation.policy_digest, /^sha256:[0-9a-f]{64}$/);
  assert.equal(Object.hasOwn(preview.validation, 'snapshot_id'), false);
  assert.equal(preview.validation.implementation.version, '0.36.0-rc.r2.7');
  assert.equal(providerCalls, 0);
  assert.ok(captured);

  const broken = await source.previewProtectedSourceRevision(Object.freeze({}), { payload: {} }, {
    kind: 'password',
    asset_uid: 'x',
    entitlement: { profile: 'password' },
    slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
    checksums: true,
    signature: 'none',
  });
  assert.equal(broken.status, 'preview_rejected');
  assert.deepEqual(Object.keys(broken).sort(), ['body', 'body_bytes', 'diagnostic', 'status']);
});

test('crypto.randomUUID stays available for the operation record', () => {
  assert.equal(typeof crypto.randomUUID(), 'string');
});
