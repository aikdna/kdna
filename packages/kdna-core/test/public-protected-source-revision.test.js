'use strict';
// B3 source-bound revision producer: literals L10 (expiry binding), L12 (the exact
// integrity remove/replace/add table), L13 (digest domains), L14 (member/mode and
// omitted-payload preservation) and L15 (monotonic disclosure).
const test = require('node:test');
const path = require('node:path');
const H = require('./protection-test-helpers.js');
const { assert, core, req, F } = H;
const source = req('@aikdna/kdna-core/protected-source-node');
const authoring = req('@aikdna/kdna-core/authoring-node');
const { parseContainer } = require(path.join(H.coreDir, 'src/public-contract/container.js'));
const { digest, contentTreePreimage, runtimeEntryPreimage } = require(path.join(H.coreDir, 'src/public-contract/digests.js'));
const { makeChecksums, signatureContentDigest, verifyIntegrity } = require(path.join(H.coreDir, 'src/public-contract/protection-integrity.js'));
const { decodeEnvelope } = require(path.join(H.coreDir, 'src/public-contract/protection-envelope-codec.js'));
const { decryptPassword, validateEnvelope } = require(path.join(H.coreDir, 'src/public-contract/protection-crypto.js'));

// Timing discipline (A1/R3): the producer path runs scrypt, so the behavioural cases use the
// same 5 s operation budget as the opening suite; the deadline rule has its own
// deterministic case in public-protected-source.test.js.
const PASSWORD = Buffer.from('correct horse battery staple');
const SLOT = 's1';
const SEED = Buffer.alloc(32, 7);
const policy = H.policy;

function credentials() {
  return { credential: { kind: 'password', password: PASSWORD, slotIndex: 0 }, signaturePolicy: policy };
}

function writePolicy(over = {}) {
  return {
    kind: 'password',
    asset_uid: 'asset:revision',
    entitlement: { profile: 'password', offline: true, revocable: false },
    slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
    checksums: true,
    signature: 'none',
    ...over,
  };
}

function secrets(over = {}) {
  const value = { passwords: [{ slot: SLOT, password: PASSWORD }], ...over };
  if (value.signingSeed === undefined) delete value.signingSeed;
  return value;
}

async function predecessor(over = {}) {
  const asset = H.asset(2);
  const ordinary = F.encode(asset, req);
  const producerPolicy = {
    kind: 'password',
    asset_uid: asset.manifest.asset_uid,
    entitlement: { profile: 'password', offline: true, revocable: false },
    slots: [{ slot: SLOT, kdf_profile: 'scrypt-sha256' }],
    checksums: true,
    signature: 'none',
    ...over,
  };
  // The accepted producer's secret record is closed, so a signing seed may only be
  // present when the policy actually signs.
  const output = await core.protectSourceBytes(ordinary, producerPolicy, secrets(producerPolicy.signature === 'ed25519' ? { signingSeed: SEED } : {}));
  assert.equal(output.status, 'produced', JSON.stringify(output));
  return { asset, ordinary, bytes: output.bytes, A: output.evidence.output.A };
}

function host(plan = {}) {
  const seen = { observe: 0, deliver: 0 };
  const created = source.createTrustedProtectedSourceHost({
    observe: async () => {
      seen.observe += 1;
      return plan.observation ? plan.observation(seen.observe) : {
        context_id: 'context:one',
        epoch: 'epoch:one',
        asset_digest: plan.A,
        permission: 'allowed',
        scope: 'complete_source',
        current_ms: 1000,
        expires_at_ms: 2000,
        revoked: false,
      };
    },
    deliver: async (bundle, prepared, context) => {
      seen.deliver += 1;
      if (plan.inside) await plan.inside({ bundle, prepared, context, seen });
      return plan.ack === undefined ? true : plan.ack;
    },
  });
  return { created, seen };
}

// Produce inside the owning callback, which is the only place a context is usable.
// `edits` is a factory because the editable proposal is built from the DELIVERED bundle
// inside the owning callback; the ordinary opener cannot read a protected predecessor.
async function produceInside({ bytes, A, edits, write = null, provider = () => secrets({ signingSeed: SEED }), plan = {} }) {
  let produced;
  const policyFor = (bundle) => (typeof write === 'function' ? write(bundle) : writePolicy({ asset_uid: bundle.manifest.asset_uid, ...(write ?? {}) }));
  const h = host({ A, ...plan, inside: async (state) => { produced = await source.produceProtectedSourceRevision(state.context, edits(state.bundle), policyFor(state.bundle), provider); } });
  const opened = await source.withProtectedSourceNode(bytes, { admission: credentials(), expected_A: A, timeout_ms: 5000 }, { kind: 'local', clock: () => 1000 }, h.created);
  return { opened, produced, seen: h.seen };
}

const sameProposal = (bundle) => ({ payload: bundle.payload });

function finalEntries(bytes) {
  const entries = parseContainer(new Uint8Array(bytes));
  return { entries, manifest: JSON.parse(Buffer.from(entries['kdna.json'])) };
}

test('produce rebuilds a licensed asset whose bytes a fresh protected admission accepts', async () => {
  const { bytes, A } = await predecessor();
  // No authored change at all: the explicit "omitted payload" case.
  const { opened, produced } = await produceInside({ bytes, A, edits: () => ({}) });
  assert.equal(opened.status, 'source_delivered', JSON.stringify(opened));
  assert.equal(produced.status, 'revision_produced', JSON.stringify(produced));
  assert.ok(produced.bytes.length > 0);
  assert.equal(produced.evidence.source_A, A);
  assert.equal(produced.evidence.output_delivery, 'not_published');
  assert.equal(produced.evidence.output_A, null);
  assert.equal(produced.evidence.payload_source, 'original_decrypted_cbor');

  // Independent admission of the saved bytes with a fresh credential — not the
  // producer's own CEK or evidence.
  const readmitted = await core.admitProtectedNode(produced.bytes, credentials(), { kind: 'local', clock: () => 1000 });
  assert.equal(readmitted.status, 'accepted', JSON.stringify(readmitted));
  assert.equal(readmitted.snapshot.digests.A.observed, produced.evidence.output.A);
  assert.equal(readmitted.snapshot.digests.C.observed, produced.evidence.output.C);
  assert.equal(readmitted.snapshot.digests.E.observed, produced.evidence.output.E);
});

// L13: the declared digest domains, recomputed from the saved bytes.
test('L13 C, E and A are recomputed from the saved successor bytes', async () => {
  const { bytes, A } = await predecessor();
  const { produced } = await produceInside({ bytes, A, edits: sameProposal });
  assert.equal(produced.status, 'revision_produced', JSON.stringify(produced));
  const { entries, manifest } = finalEntries(produced.bytes);
  assert.equal(produced.evidence.output.A, digest(new Uint8Array(produced.bytes)));
  assert.equal(produced.evidence.output.C, digest(contentTreePreimage(entries)));
  assert.equal(produced.evidence.output.E, digest(runtimeEntryPreimage(entries, manifest)));
  // The checksums document must be the document derived from the FINAL entries.
  assert.equal(
    JSON.stringify(makeChecksums(entries, manifest, produced.evidence.output.E)),
    Buffer.from(entries['checksums.json']).toString('utf8'),
  );
  // The signature domain is kdsig 0.1 over the final entry set, never C0.2 or E0.2.
  assert.notEqual(produced.evidence.output.C, signatureContentDigest(entries));
});

// L12: the exact remove/replace/add table.
test('L12 old integrity entries are removed, replaced or added exactly once', async () => {
  const cases = [
    { label: 'present-both -> checksums+none', make: { checksums: true, signature: 'ed25519' }, write: { checksums: true, signature: 'none' }, expect: { 'checksums.json': 'replaced' } },
    { label: 'present-both -> none+none', make: { checksums: true, signature: 'ed25519' }, write: { checksums: false, signature: 'none' }, expect: { 'checksums.json': 'removed', 'signature.kdsig': 'removed' } },
    { label: 'present-checksums + none -> ed25519', make: { checksums: true, signature: 'none' }, write: { checksums: true, signature: 'ed25519' }, expect: { 'checksums.json': 'replaced', 'signature.kdsig': 'added' } },
    { label: 'absent-both -> checksums+ed25519', make: { checksums: false, signature: 'none' }, write: { checksums: true, signature: 'ed25519' }, expect: { 'checksums.json': 'added', 'signature.kdsig': 'added' } },
    { label: 'absent-both -> none+none', make: { checksums: false, signature: 'none' }, write: { checksums: false, signature: 'none' }, expect: {} },
  ];
  for (const item of cases) {
    const { bytes, A } = await predecessor(item.make);
    const before = parseContainer(new Uint8Array(bytes));
    assert.equal(Object.hasOwn(before, 'checksums.json'), item.make.checksums, item.label);
    assert.equal(Object.hasOwn(before, 'signature.kdsig'), item.make.signature === 'ed25519', item.label);
    const { produced } = await produceInside({ bytes, A, edits: sameProposal, write: item.write });
    assert.equal(produced.status, 'revision_produced', item.label + ' ' + JSON.stringify(produced));
    const { entries, manifest } = finalEntries(produced.bytes);
    const names = Object.keys(entries);
    assert.equal(names.filter((n) => n === 'checksums.json').length, item.write.checksums ? 1 : 0, item.label + ' checksums count');
    assert.equal(names.filter((n) => n === 'signature.kdsig').length, item.write.signature === 'ed25519' ? 1 : 0, item.label + ' signature count');
    for (const [name, action] of Object.entries(item.expect)) {
      assert.equal(produced.evidence.member_actions[name], action, item.label + ' ' + name);
    }
    // A replaced entry keeps its original mode; a newly added one is 0o100644.
    const metadata = [];
    parseContainer(new Uint8Array(produced.bytes), undefined, metadata);
    const row = (name) => metadata.find((m) => m.name === name);
    if (Object.hasOwn(before, 'checksums.json') && item.write.checksums) {
      assert.equal(row('checksums.json').mode, 0o100644, item.label);
    }
    // The produced integrity is self-consistent under the accepted verifier.
    const integrity = verifyIntegrity(entries, manifest, produced.evidence.output.E, {
      requireSignature: item.write.signature === 'ed25519',
      expectedPublicKeyHex: null,
    });
    assert.equal(integrity.checksums, item.write.checksums ? 'verified_document_1' : 'absent', item.label);
    assert.equal(integrity.signature, item.write.signature === 'ed25519' ? 'verified_self_key' : 'absent', item.label);
  }
});

// L14: unchanged members keep their bytes and modes; an omitted payload edit keeps the
// original decrypted CBOR bytes.
test('L14 untouched members and the omitted payload keep the original bytes', async () => {
  const { bytes, A, ordinary } = await predecessor({ signature: 'ed25519' });
  // Omitted payload: the producer must feed the ORIGINAL decrypted CBOR bytes into the
  // new encryption rather than re-encoding the decoded object.
  const { produced } = await produceInside({ bytes, A, edits: () => ({}) });
  assert.equal(produced.status, 'revision_produced', JSON.stringify(produced));
  assert.equal(produced.evidence.payload_source, 'original_decrypted_cbor');
  const beforeMeta = [];
  const beforeEntries = parseContainer(new Uint8Array(bytes), undefined, beforeMeta);
  const afterMeta = [];
  const afterEntries = parseContainer(new Uint8Array(produced.bytes), undefined, afterMeta);
  for (const row of beforeMeta) {
    if (['kdna.json', 'payload.kdnab', 'checksums.json', 'signature.kdsig'].includes(row.name)) continue;
    const after = afterMeta.find((m) => m.name === row.name);
    assert.ok(after, row.name);
    assert.equal(after.mode, row.mode, row.name);
    assert.deepEqual(Array.from(afterEntries[row.name]), Array.from(beforeEntries[row.name]), row.name);
  }
  // The member SET is the same except for the integrity entries, whose presence is a
  // policy decision tested separately in L12.
  const nonIntegrity = (rows) => rows.map((m) => m.name).filter((n) => !['checksums.json', 'signature.kdsig'].includes(n)).sort();
  assert.deepEqual(nonIntegrity(afterMeta), nonIntegrity(beforeMeta));

  // Omitted payload: decrypt the successor and compare to the predecessor's plaintext.
  const envelopeBefore = validateEnvelope(decodeEnvelope(beforeEntries['payload.kdnab']), { id: 'kdna.envelope.aead', version: '0.1.0' });
  const plainBefore = decryptPassword(envelopeBefore, credentials().credential, JSON.parse(Buffer.from(beforeEntries['kdna.json'])));
  const envelopeAfter = validateEnvelope(decodeEnvelope(afterEntries['payload.kdnab']), { id: 'kdna.envelope.aead', version: '0.1.0' });
  const plainAfter = decryptPassword(envelopeAfter, credentials().credential, JSON.parse(Buffer.from(afterEntries['kdna.json'])));
  assert.deepEqual(Array.from(plainAfter), Array.from(plainBefore));
  assert.notDeepEqual(Array.from(afterEntries['payload.kdnab']), Array.from(beforeEntries['payload.kdnab']));
  assert.ok(ordinary.length > 0);
});

// L10: the original context expiry is binding; a renewed Host expiry cannot extend it.
test('L10 renewal and context drift refuse the producer and publish no ciphertext', async () => {
  async function attempt(mutate, code) {
    const { bytes, A } = await predecessor();
    let produced;
    const plan = host({ A, inside: async (state) => { produced = await source.produceProtectedSourceRevision(state.context, { payload: state.bundle.payload }, writePolicy({ asset_uid: state.bundle.manifest.asset_uid }), () => secrets()); } });
    const original = plan.seen;
    const created = plan.created;
    // Re-plan the observation sequence: the opening observation is authorized, later ones drift.
    let calls = 0;
    const h2 = source.createTrustedProtectedSourceHost({
      observe: async () => {
        calls += 1;
        const base = { context_id: 'context:one', epoch: 'epoch:one', asset_digest: A, permission: 'allowed', scope: 'complete_source', current_ms: 1000, expires_at_ms: 2000, revoked: false };
        return calls === 1 ? base : mutate(base);
      },
      deliver: async (bundle, prepared, context) => {
        produced = await source.produceProtectedSourceRevision(context, { payload: bundle.payload }, writePolicy({ asset_uid: bundle.manifest.asset_uid }), () => secrets());
        return true;
      },
    });
    const opened = await source.withProtectedSourceNode(bytes, { admission: credentials(), expected_A: A, timeout_ms: 5000 }, { kind: 'local', clock: () => 1000 }, h2);
    assert.equal(opened.status, 'source_delivered', JSON.stringify(opened));
    if (code === null) {
      assert.equal(produced.status, 'revision_produced', JSON.stringify(produced.diagnostic ?? produced.status));
    } else {
      assert.equal(produced.status, 'revision_rejected', JSON.stringify(produced.status));
      assert.equal(produced.diagnostic.code, code);
      assert.equal(produced.bytes, undefined);
    }
    assert.ok(original);
    assert.ok(created);
  }
  await attempt((base) => ({ ...base, current_ms: 2000, expires_at_ms: 3000 }), 'SOURCE_PERMISSION_REJECTED');
  await attempt((base) => ({ ...base, current_ms: 2001, expires_at_ms: 3000 }), 'SOURCE_PERMISSION_REJECTED');
  await attempt((base) => ({ ...base, context_id: 'context:other' }), 'SOURCE_PERMISSION_REJECTED');
  await attempt((base) => ({ ...base, epoch: 'epoch:other' }), 'SOURCE_PERMISSION_REJECTED');
  await attempt((base) => ({ ...base, revoked: true }), 'SOURCE_PERMISSION_REJECTED');
  // current_ms 1999 with the original expiry 2000 is still allowed, which proves the
  // refusals above are the expiry binding and not a blanket rejection.
  await attempt((base) => ({ ...base, current_ms: 1999, expires_at_ms: 3000 }), null);
});

// L15: the transport commit is confirmed inside the callback and stays confirmed.
test('L15 the committed handoff is confirmed once and cannot be retried after settle', async () => {
  const { bytes, A } = await predecessor();
  let prepared, committed;
  const h = source.createTrustedProtectedSourceHost({
    observe: async () => ({ context_id: 'context:one', epoch: 'epoch:one', asset_digest: A, permission: 'allowed', scope: 'complete_source', current_ms: 1000, expires_at_ms: 2000, revoked: false }),
    deliver: async (bundle, token) => {
      prepared = token;
      committed = await source.commitProtectedSourceTransport(token, {
        observeScope: () => ({ context_id: 'context:one', epoch: 'epoch:one', asset_digest: A, permission: 'allowed', scope: 'complete_source', current_ms: 1000, expires_at_ms: 2000, revoked: false }),
        commit: () => true,
      });
      return true;
    },
  });
  const opened = await source.withProtectedSourceNode(bytes, { admission: credentials(), expected_A: A, timeout_ms: 5000 }, { kind: 'local', clock: () => 1000 }, h);
  assert.equal(opened.status, 'source_delivered', JSON.stringify(opened));
  assert.equal(committed.status, 'source_committed', JSON.stringify(committed));
  assert.equal(committed.disclosure.kind, 'trusted_host');
  assert.equal(committed.disclosure.external_commit.state, 'confirmed');
  assert.equal(opened.disclosure.external_commit.state, 'confirmed');
  assert.ok(Number.isSafeInteger(opened.disclosure.external_commit.confirmed_at_ms));
  // A second attempt with the same token cannot produce a second side effect.
  let secondCalls = 0;
  const again = await source.commitProtectedSourceTransport(prepared, {
    observeScope: () => ({ context_id: 'context:one', epoch: 'epoch:one', asset_digest: A, permission: 'allowed', scope: 'complete_source', current_ms: 1000, expires_at_ms: 2000, revoked: false }),
    commit: () => { secondCalls += 1; return true; },
  });
  assert.equal(again.status, 'source_failed');
  assert.equal(again.diagnostic.code, 'SOURCE_CONTEXT_CLOSED');
  assert.equal(secondCalls, 0);
  assert.equal(again.disclosure.external_commit.state, 'confirmed');
});

test('an output secret provider that throws, and an invalid proposal, publish nothing', async () => {
  const { bytes, A } = await predecessor();
  const brokenProvider = await produceInside({ bytes, A, edits: sameProposal, provider: () => { throw new Error('no secret'); } });
  assert.equal(brokenProvider.produced.status, 'revision_rejected');
  assert.equal(brokenProvider.produced.diagnostic.code, 'SOURCE_PROVIDER_FAILED');
  assert.equal(brokenProvider.produced.bytes, undefined);

  const invalid = await produceInside({ bytes, A, edits: () => ({ payload: { asset: {} } }) });
  assert.equal(invalid.produced.status, 'revision_rejected');
  assert.ok(['SOURCE_DRAFT_INVALID', 'SOURCE_INTERPRETATION_INCOMPLETE'].includes(invalid.produced.diagnostic.code), invalid.produced.diagnostic.code);
  assert.equal(invalid.produced.bytes, undefined);

  const getters = { count: 0 };
  const attempted = await produceInside({ bytes, A, edits: () => { const e = {}; Object.defineProperty(e, 'payload', { enumerable: true, get() { getters.count += 1; return {}; } }); return e; } });
  assert.equal(attempted.produced.status, 'revision_rejected');
  assert.equal(attempted.produced.diagnostic.code, 'SOURCE_INPUT_INVALID');
  assert.equal(getters.count, 0);
});
