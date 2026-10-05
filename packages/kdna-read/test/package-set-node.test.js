'use strict';
// Public PackageSet read surface: own Host pinning, the real synchronous sink,
// the accepted four channels, the opaque delivered token, and the handoff
// correlation with an independently admitted Plan.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { bindDependencyPorts } = require('./r2-test-model.js');
const F = require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const { req, coreDir, readDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const core = req('@aikdna/kdna-core');
const P = req('@aikdna/kdna-core/package-set-node');
const E = req('@aikdna/kdna-core/execution');
const boundary = req('@aikdna/kdna-core/read-boundary');
const read = req('@aikdna/kdna-read');
const R = req('@aikdna/kdna-read/package-set-node');
const embed = req('@aikdna/kdna-read/embedding');
const GENERATED = require(path.join(coreDir, 'src/public-contract/generated-contract.json'));
const tuple = GENERATED.versionTuple;
const { jcs } = require(path.join(readDir, 'src/util.js'));

const HOST = 'host:package-set-read';
const EPOCH = 'epoch:package-set-read';
const ALIEN = 'epoch:package-set-foreign';

let clock = 5000;
function reset() {
  clock = 5000;
}

// `options.requiredDependency` grows the selected judgment's mandatory closure,
// and `options.optionalDependency` adds a real optional dependency so the
// accepted pipeline produces a non-empty expansion handle list. The real
// closure shapes in this current R2 suite are explicitly measured as 5 and 10
// nodes below. These synthetic fixtures do not borrow historical slice identities.
function assetBytes(count, assetId, options = {}) {
  const asset = F.blank(tuple, count, {
    patch: (manifest, payload) => {
      manifest.asset_id = assetId;
      payload.asset.asset_id = assetId;
      if (options.requiredDependency || options.optionalDependency) {
        payload.dependencies = [
          {
            id: options.requiredDependency ? 'dependency:required:0' : 'dependency:optional:0',
            producer: { kind: 'judgment_result', judgment_ref: 'j:1', result_contract_ref: 'result-contract:1' },
            consumer_judgment_ref: 'j:0',
            input_role: 'context',
            data_type: { term: 'text', vocabulary: 'core' },
            required: options.requiredDependency === true,
            purpose: 'Dependency for the PackageSet read acceptance fixture.',
          },
        ];
      }
    },
  });
  return F.encode(bindDependencyPorts(asset), req);
}

function member(memberId, count, assetId, options) {
  const bytes = assetBytes(count, assetId ?? 'asset:' + memberId, options);
  const admitted = core.admitBytes(bytes);
  assert.equal(admitted.status, 'accepted', JSON.stringify(admitted));
  const view = boundary.inspectSnapshot(admitted.snapshot);
  return {
    source: { member_id: memberId, bytes },
    record: { member_id: memberId, asset_id: view.asset.asset_id, asset_version: view.asset.asset_version, A: view.digests.A.observed },
    snapshot: admitted.snapshot,
    view,
  };
}

function memberProviderFor(members) {
  const observe = () => ({
    decisions: members.map(entry => ({
      ...entry.record,
      decision: 'allow',
      decision_id: 'decision:' + entry.record.member_id,
      host_id: HOST,
      host_epoch: EPOCH,
      issued_at: 4000,
      expires_at: 90000,
      current_ms: clock++,
    })),
  });
  return P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe });
}

function control(counter) {
  return embed.createTrustedReadControlProvider(() => {
    if (counter) counter.calls += 1;
    return { admission_response_limit_bytes: 1000000 };
  });
}

// A real Host observation echoes the snapshot it was handed. Every field is
// derived from that snapshot, exactly as a real installer would, so the test
// cannot accidentally compare two different admissions of the same bytes.
function observerFor(changes = {}, options = {}) {
  return input => {
    if (options.onCall) options.onCall();
    const view = boundary.inspectSnapshot(input.snapshot);
    const mandatory = view.ir.mandatory_closures.find(row => jcs(row.selection) === jcs(input.request.selection));
    return {
      host_id: HOST,
      host_epoch: EPOCH,
      decision_id: 'decision:read',
      request_id: input.request.request_id,
      snapshot_id: view.snapshot_id,
      A: view.digests.A.observed,
      C: view.digests.C.observed,
      scope: options.wideScope ? [...new Set([...mandatory.node_ids, ...view.expansion_targets.flatMap(target => target.scope)])] : mandatory.node_ids,
      issued_at: 4000,
      expires_at: 90000,
      decision: 'allow',
      policy_id: 'policy:test',
      current_ms: clock++,
      ...changes,
    };
  };
}

function requestFor(set, overrides = {}) {
  return { request_id: 'request:package-set', tuple, budget_bytes: 1000000, mode: 'exact_selection', selection: { ...set.selection }, handle: null, ...overrides };
}

function twoMembers() {
  // Two genuinely different closure classes: the plain asset's selected
  // judgment closes over 7 nodes, the extended one over 13.
  const nine = member('member:plain', 2, 'asset:plain');
  const seventeen = member('member:extended', 2, 'asset:extended', { requiredDependency: true });
  const set = { set_id: 'set:package', members: [nine.record, seventeen.record], selection: nine.view.ir.mandatory_closures[0].selection };
  return { nine, seventeen, set };
}

function limits(overrides = {}) {
  return { maxMembers: 10000, maxTotalSourceBytes: 104857600, ...overrides };
}

function readProviderFor(members, overrides = {}) {
  return R.createTrustedPackageReadProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    members: overrides.members ?? memberProviderFor(members),
    observeRead: overrides.observeRead ?? observerFor(),
    ...(overrides.sink === undefined ? {} : { sink: overrides.sink }),
  });
}

function readInput(set, members, extra = {}) {
  return { set, tuple, members: members.map(entry => entry.source), operation: 'isolated_read', limits: limits(), request: requestFor(set), ...extra };
}

function planFor(nine, set, planId = 'plan:n1') {
  return E.createConsumptionPlan(nine.snapshot, {
    plan_id: planId,
    intent: { task: 'Use the selected judgment.', use: 'reasoning_support' },
    selection: set.selection,
    budget: { capsule_bytes: 1000000, output_bytes: 1000, response_bytes: 100000, trace_events: 6 },
  });
}

test('the read contract pins the installed Core and exposes exactly the declared callables', () => {
  const contract = R.getPackageReadContract();
  assert.equal(contract.descriptor.contract, 'kdna.package-set-node/0.2.1');
  assert.equal(contract.descriptor.core_version, '0.36.0');
  assert.equal(contract.descriptor.read_version, '0.11.0');
  assert.match(contract.core_contract_digest, /^sha256:[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(R).sort(), [...contract.descriptor.read_callables].sort());
});

test('a genuine two-member set is read through the accepted pipeline with an own Host sink', async () => {
  reset();
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-packageset-'));
  try {
    const { nine, seventeen, set } = twoMembers();
    const counter = { calls: 0 };
    const written = [];
    const outcome = await R.readPackageSetNode(
      readInput(set, [nine, seventeen]),
      control(counter),
      readProviderFor([nine, seventeen], { sink: result => { written.push(result); fs.writeFileSync(path.join(directory, 'read.json'), JSON.stringify(result)); return true; } })
    );
    assert.equal(outcome.local_failure, null);
    assert.equal(outcome.decision.status, 'allowed');
    assert.equal(outcome.decision.selected_member, 'member:plain');
    assert.equal(outcome.readResult.channel, 'read_envelope');
    assert.equal(outcome.readResult.envelope.status, 'ready');
    assert.equal(outcome.sink_invoked, true);
    assert.equal(outcome.sink_confirmed, true);
    assert.equal(outcome.delivered !== null, true);
    assert.equal(written.length, 1);
    assert.equal(counter.calls, 1, 'the accepted pipeline performs its single control observation');
    assert.equal(fs.readFileSync(path.join(directory, 'read.json'), 'utf8'), JSON.stringify(written[0]));

    const plan = planFor(nine, set);
    assert.equal(plan.status, 'admitted');
    const sealed = R.sealPackageSetHandoff(outcome.delivered, plan.plan);
    assert.equal(sealed.status, 'valid');
    assert.equal(sealed.proof, 'claims_not_authenticated');
    assert.equal(sealed.value.set_id, 'set:package');
    // Handoff members are bound in ascending member_id order, one row per member.
    assert.deepEqual(sealed.value.members.map(entry => entry.member_id), ['member:extended', 'member:plain']);
    assert.equal(sealed.value.read_receipt_id, outcome.readResult.envelope.receipt.receipt_id);
    assert.equal(sealed.value.closure_digest, E.executionDigest(outcome.readResult.envelope.content.closure).digest);
    assert.equal(sealed.value.plan_digest, E.executionDigest(E.inspectAdmittedPlan(plan.plan)).digest);
    assert.deepEqual(sealed.value.tuple, tuple);
    assert.equal(R.admitPackageSetHandoff(sealed.value, outcome.delivered, plan.plan).status, 'valid');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('the delivered token, the Plan and the wire cannot be replaced by a structural copy', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProviderFor([nine, seventeen], { sink: () => true }));
  const plan = planFor(nine, set);
  const sealed = R.sealPackageSetHandoff(outcome.delivered, plan.plan);
  assert.equal(sealed.status, 'valid');
  // A JSON round trip of the token, a foreign token object and a JSON copy of the
  // Plan each prove no admission and cannot produce a valid handoff.
  assert.equal(R.sealPackageSetHandoff(JSON.parse(JSON.stringify(outcome.delivered)), plan.plan).diagnostic, 'handoff_invalid');
  assert.equal(R.sealPackageSetHandoff({}, plan.plan).diagnostic, 'handoff_invalid');
  assert.equal(R.sealPackageSetHandoff(outcome.delivered, E.inspectAdmittedPlan(plan.plan)).diagnostic, 'handoff_invalid');
  assert.equal(R.admitPackageSetHandoff(sealed.value, JSON.parse(JSON.stringify(outcome.delivered)), plan.plan).diagnostic, 'handoff_invalid');
  // Any single mutated correlation field fails the whole handoff.
  for (const [label, mutate] of [
    ['set', wire => ({ ...wire, set_id: 'set:other' })],
    ['tuple', wire => ({ ...wire, tuple: { ...tuple, read: 'kdna.read/0.4.0' } })],
    ['selection', wire => ({ ...wire, selection: { ...wire.selection, judgment_id: 'judgment:other' } })],
    ['receipt', wire => ({ ...wire, read_receipt_id: 'receipt:other' })],
    ['closure', wire => ({ ...wire, closure_digest: 'sha256:' + '0'.repeat(64) })],
    ['plan', wire => ({ ...wire, plan_digest: 'sha256:' + '0'.repeat(64) })],
    ['host', wire => ({ ...wire, host_epoch: ALIEN })],
    ['member A', wire => ({ ...wire, members: wire.members.map(entry => ({ ...entry, A: 'sha256:' + '0'.repeat(64) })) })],
    ['member order', wire => ({ ...wire, members: [...wire.members].reverse() })],
    ['member snapshot', wire => ({ ...wire, members: wire.members.map(entry => ({ ...entry, snapshot_id: 'snapshot:other' })) })],
  ]) {
    const refused = R.admitPackageSetHandoff(mutate(sealed.value), outcome.delivered, plan.plan);
    assert.equal(refused.status, 'rejected', label);
    assert.equal(refused.diagnostic, 'handoff_invalid', label);
  }
});

test('the two real closure classes never impersonate each other', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  assert.equal(nine.view.ir.mandatory_closures[0].node_ids.length, 5);
  assert.equal(seventeen.view.ir.mandatory_closures[0].node_ids.length, 10);
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProviderFor([nine, seventeen], { sink: () => true }));
  assert.equal(outcome.delivered !== null, true);
  const closure = outcome.readResult.envelope.content.closure;
  assert.equal(closure.length, 5);
  assert.notEqual(closure.length, 10);
  // A handoff built from the other member's read is refused even when every other
  // correlation field is genuine.
  const seventeenOnly = { set_id: 'set:package', members: [nine.record, seventeen.record], selection: seventeen.view.ir.mandatory_closures[0].selection };
  const otherRead = await R.readPackageSetNode(readInput(seventeenOnly, [nine, seventeen]), control(), readProviderFor([nine, seventeen], { sink: () => true }));
  assert.equal(otherRead.delivered !== null, true);
  assert.equal(otherRead.readResult.envelope.content.closure.length, 10);
  const plan = planFor(nine, set);
  const sealed = R.sealPackageSetHandoff(outcome.delivered, plan.plan);
  assert.equal(sealed.status, 'valid');
  const swapped = { ...sealed.value, members: sealed.value.members.map(entry => entry.member_id === 'member:plain' ? { ...entry, snapshot_id: seventeen.view.snapshot_id, A: seventeen.record.A, C: seventeen.view.digests.C.observed, asset_id: seventeen.record.asset_id, asset_version: seventeen.record.asset_version } : entry) };
  assert.equal(R.admitPackageSetHandoff(swapped, outcome.delivered, plan.plan).diagnostic, 'handoff_invalid');
});

test('without an own Read delivery the channel alone never mints a token', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProviderFor([nine, seventeen]));
  assert.equal(outcome.sink_invoked, false);
  assert.equal(outcome.sink_confirmed, false);
  assert.equal(outcome.delivered, null);
  assert.equal(outcome.local_failure, 'delivery_unconfirmed');
  assert.equal(outcome.registered_handles, 0);
  // The accepted pipeline on its own still yields a ready envelope whose receipt
  // already says `delivered`. That is exactly why the delivery *fact*, not the
  // channel, has to decide the token.
  const plain = await readNodeInto(nine);
  assert.equal(plain.channel, 'read_envelope');
  assert.equal(plain.envelope.status, 'ready');
  assert.equal(plain.envelope.receipt.delivery, 'delivered');
});

async function readNodeInto(entry) {
  const { readNode } = req('@aikdna/kdna-read/node');
  const host = embed.createTrustedHostReadProvider({ observe: observerFor() });
  return readNode(entry.source.bytes, requestFor({ selection: entry.view.ir.mandatory_closures[0].selection }), control(), host);
}

test('sink false, throw and Promise are all delivery-unconfirmed with exactly one attempt', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  for (const [label, behaviour] of [
    ['false', () => false],
    ['throw', () => { throw new Error('sink failed'); }],
    ['promise', () => Promise.resolve(true)],
  ]) {
    reset();
    let calls = 0;
    const readProvider = readProviderFor([nine, seventeen], { sink: () => { calls += 1; return behaviour(); } });
    const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProvider);
    assert.equal(outcome.local_failure, 'delivery_unconfirmed', label);
    assert.equal(outcome.sink_confirmed, false, label);
    assert.equal(outcome.delivered, null, label);
    assert.equal(outcome.registered_handles, 0, label);
    assert.equal(calls, 1, label + ': one physical sink attempt, no retry');
  }
});

test('a revocation seen while the read observer is awaited keeps the R07 first cause and never sinks', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  let revoked = false;
  const members = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => ({
      decisions: revoked
        ? []
        : [nine, seventeen].map(entry => ({ ...entry.record, decision: 'allow', decision_id: 'decision:' + entry.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ })),
    }),
  });
  let sinkCalls = 0;
  let reads = 0;
  const readProvider = readProviderFor([nine, seventeen], {
    members,
    observeRead: observerFor({}, { onCall: () => { reads += 1; if (reads === 1) revoked = true; } }),
    sink: () => { sinkCalls += 1; return true; },
  });
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProvider);
  assert.equal(outcome.decision.status, 'rejected');
  assert.equal(outcome.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
  assert.equal(outcome.sink_invoked, false);
  assert.equal(outcome.sink_confirmed, false);
  assert.equal(outcome.delivered, null);
  assert.equal(sinkCalls, 0);
  assert.equal(outcome.readResult.channel, 'transport_failure');
});

test('a revocation after a real sink keeps the disclosure facts and withholds the token and the handles', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  let revoked = false;
  const members = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => ({
      decisions: revoked
        ? []
        : [nine, seventeen].map(entry => ({ ...entry.record, decision: 'allow', decision_id: 'decision:' + entry.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ })),
    }),
  });
  const written = [];
  const readProvider = readProviderFor([nine, seventeen], {
    members,
    sink: result => { written.push(result); revoked = true; return true; },
  });
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProvider);
  assert.equal(outcome.sink_invoked, true);
  assert.equal(outcome.sink_confirmed, true);
  assert.equal(written.length, 1, 'the past disclosure is not withdrawn');
  assert.equal(outcome.delivered, null);
  assert.equal(outcome.registered_handles, 0);
  assert.equal(outcome.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
  assert.equal(outcome.readResult.channel, 'transport_failure');
});

test('the own Host pins host_id and host_epoch on every observation', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  // A consistent but foreign label pair is not a new binding: the very first
  // observation is refused, so nothing is sunk and no token exists.
  const foreign = readProviderFor([nine, seventeen], { observeRead: observerFor({ host_epoch: ALIEN }), sink: () => true });
  const foreignOutcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), foreign);
  assert.equal(foreignOutcome.local_failure, 'provider_invalid');
  assert.equal(foreignOutcome.sink_invoked, false);
  assert.equal(foreignOutcome.delivered, null);
  assert.equal(foreignOutcome.readResult.channel, 'transport_failure');

  // A Read provider fixed at a different Host than the member provider never
  // observes, never sinks and never mints, while the genuine Core admission
  // history is still reported as it really was.
  reset();
  const otherHost = R.createTrustedPackageReadProvider({
    host_id: HOST,
    host_epoch: ALIEN,
    members: memberProviderFor([nine, seventeen]),
    observeRead: observerFor({ host_epoch: ALIEN }),
    sink: () => true,
  });
  const otherOutcome = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), otherHost);
  assert.equal(otherOutcome.local_failure, 'provider_invalid');
  assert.equal(otherOutcome.decision.status, 'allowed');
  assert.equal(otherOutcome.readResult, null);
  assert.equal(otherOutcome.reader_observations, 0);
});

test('an invalid Read request is refused purely, with zero control and zero observations', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  const counter = { calls: 0 };
  const readProvider = readProviderFor([nine, seventeen], { observeRead: () => { throw new Error('must not be observed'); }, sink: () => true });
  const variants = {
    'selection differs': () => requestFor(set, { selection: { ...set.selection, judgment_id: 'judgment:other' } }),
    'handle is not null': () => requestFor(set, { handle: {} }),
    'mode is not exact_selection': () => requestFor(set, { mode: 'whole_asset', selection: null }),
    'unknown field': () => ({ ...requestFor(set), extra: 1 }),
    'wrong tuple': () => requestFor(set, { tuple: { ...tuple, read: 'kdna.read/0.4.0' } }),
  };
  for (const [label, build] of Object.entries(variants)) {
    const request = build();
    const outcome = await R.readPackageSetNode({ ...readInput(set, [nine, seventeen]), request }, control(counter), readProvider);
    assert.equal(outcome.local_failure, 'invalid_read_request', label);
    assert.equal(outcome.decision, null, label);
    assert.equal(outcome.reader_observations, 0, label);
  }
  assert.equal(counter.calls, 0, 'the trusted control observer is never consulted for a malformed candidate');
});

test('a malformed set is R07 input-invalid before the provider, and limits are decided first', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  let observations = 0;
  const members = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => { observations += 1; return { decisions: [] }; } });
  const readProvider = readProviderFor([nine, seventeen], { members, observeRead: () => { throw new Error('must not run'); }, sink: () => true });
  const malformed = { set_id: 'set:package', members: [nine.record], selection: nine.view.ir.mandatory_closures[0].selection, tuple: { ...tuple } };
  const shape = await R.readPackageSetNode({ set: malformed, tuple, members: [nine.source], operation: 'isolated_read', limits: limits(), request: requestFor(malformed) }, control(), readProvider);
  assert.equal(shape.decision.diagnostic, 'READ_INPUT_INVALID');
  assert.equal(shape.local_failure, null);
  assert.equal(shape.readResult, null);
  assert.equal(observations, 0);
  const limited = await R.readPackageSetNode({ set: malformed, tuple, members: [nine.source], operation: 'isolated_read', limits: limits({ maxMembers: 0 }), request: requestFor(malformed) }, control(), readProvider);
  assert.equal(limited.local_failure, 'invalid_limits');
  assert.equal(limited.decision, null);
  assert.equal(observations, 0);
  // Missing is evaluated only after authorization is complete, so both declared
  // identities are granted and only one source is supplied.
  const grantedButShort = readProviderFor([nine, seventeen], { observeRead: () => { throw new Error('must not run'); }, sink: () => true });
  const missing = await R.readPackageSetNode({ set, tuple, members: [nine.source], operation: 'isolated_read', limits: limits(), request: requestFor(set) }, control(), grantedButShort);
  assert.equal(missing.decision.diagnostic, 'SET_MEMBER_MISSING');
  assert.equal(missing.local_failure, null);
});

test('an unbranded Read provider and a foreign member provider are refused before any callback', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  let calls = 0;
  const plain = { host_id: HOST, host_epoch: EPOCH, observe: () => { calls += 1; return { decisions: [] }; } };
  const unbranded = await R.readPackageSetNode(
    readInput(set, [nine, seventeen]),
    control(),
    { host_id: HOST, host_epoch: EPOCH, members: plain, observeRead: () => { calls += 1; }, sink: () => true }
  );
  assert.equal(unbranded.local_failure, 'provider_invalid');
  assert.equal(calls, 0);
  const brandedButForeign = readProviderFor([nine, seventeen], { members: plain, observeRead: () => { calls += 1; }, sink: () => true });
  const foreign = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), brandedButForeign);
  assert.equal(foreign.local_failure, 'provider_invalid');
  assert.equal(calls, 0);
});

test('a cancellation before or during the read is a local failure, never a silent success', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  const before = new AbortController();
  before.abort();
  const readProvider = readProviderFor([nine, seventeen], { observeRead: () => { throw new Error('must not run'); }, sink: () => true });
  const early = await R.readPackageSetNode(readInput(set, [nine, seventeen], { signal: before.signal }), control(), readProvider);
  assert.equal(early.local_failure, 'cancelled');
  assert.equal(early.decision, null);
  assert.equal(early.reader_observations, 0);

  reset();
  const during = new AbortController();
  const cancelled = readProviderFor([nine, seventeen], { observeRead: observerFor({}, { onCall: () => during.abort() }), sink: () => true });
  const outcome = await R.readPackageSetNode(readInput(set, [nine, seventeen], { signal: during.signal }), control(), cancelled);
  assert.equal(outcome.local_failure, 'cancelled');
  assert.equal(outcome.sink_invoked, false);
  assert.equal(outcome.delivered, null);
});

test('a genuine read with a real expansion handle registers exactly the offered handles', async () => {
  reset();
  const nine = member('member:plain', 2, 'asset:expand', { optionalDependency: true });
  const seventeen = member('member:extended', 2, 'asset:plain-extended');
  const set = { set_id: 'set:package', members: [nine.record, seventeen.record], selection: nine.view.ir.mandatory_closures[0].selection };
  assert.ok(nine.view.expansion_targets.some(x=>x.target.kind==='dependency'&&x.target.id==='dependency:optional:0'&&x.anchor.kind==='judgment'&&x.anchor.selection.judgment_id==='j:0'));
  const written = [];
  const outcome = await R.readPackageSetNode(
    readInput(set, [nine, seventeen]),
    control(),
    readProviderFor([nine, seventeen], { observeRead: observerFor({}, { wideScope: true }), sink: result => { written.push(result); return true; } })
  );
  assert.equal(outcome.local_failure, null);
  assert.equal(outcome.delivered !== null, true);
  const handles = outcome.readResult.envelope.content.expansion_handles;
  assert.equal(handles.length, 1);
  assert.match(handles[0].handle_id, /^handle:/);
  assert.equal(outcome.registered_handles, handles.length);
  assert.equal(written.length, 1);
});

test('a non-ready Read channel is returned unchanged and never sinks', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  let sinkCalls = 0;
  const outcome = await R.readPackageSetNode(
    readInput(set, [nine, seventeen]),
    control(),
    readProviderFor([nine, seventeen], { observeRead: observerFor({ decision: 'deny' }), sink: () => { sinkCalls += 1; return true; } })
  );
  assert.equal(outcome.readResult.channel, 'read_envelope');
  assert.equal(outcome.readResult.envelope.status, 'rejected');
  assert.equal(outcome.readResult.envelope.diagnostics[0].code, 'READ_HOST_DENIED');
  assert.equal(outcome.sink_invoked, false);
  assert.equal(outcome.delivered, null);
  assert.equal(outcome.registered_handles, 0);
  assert.equal(sinkCalls, 0);
});

// N1-A1-L43 (frozen in implementation/A1-LITERAL-MANIFEST.json before this case
// was written): the narrow window where the own deliver callback already returned
// true — so the accepted pipeline really registered the handles — and only the
// final synchronous section observes the revocation or cancellation. The handle
// ledger must report what really exists. No token, no success claim, no hidden
// Host or sink fact, and the 'no token' fact is a different field from the
// 'handle registered' fact.
test('N1-A1-L43 a revocation first seen in the final synchronous section keeps the handle ledger truthful', async () => {
  reset();
  const nine = member('member:plain', 2, 'asset:window', { optionalDependency: true });
  const seventeen = member('member:extended', 2, 'asset:window-extended');
  const set = { set_id: 'set:package', members: [nine.record, seventeen.record], selection: nine.view.ir.mandatory_closures[0].selection };
  assert.ok(nine.view.expansion_targets.some(x=>x.target.kind==='dependency'&&x.target.id==='dependency:optional:0'&&x.anchor.kind==='judgment'&&x.anchor.selection.judgment_id==='j:0'));

  // First, measure how many member observations one successful operation of this
  // exact shape performs. The last of them is the final synchronous section's.
  reset();
  let controlObservations = 0;
  const counting = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => {
      controlObservations += 1;
      return { decisions: [nine, seventeen].map(entry => ({ ...entry.record, decision: 'allow', decision_id: 'decision:' + entry.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ })) };
    },
  });
  const controlRun = await R.readPackageSetNode(readInput(set, [nine, seventeen]), control(), readProviderFor([nine, seventeen], { members: counting, observeRead: observerFor({}, { wideScope: true }), sink: () => true }));
  assert.equal(controlRun.delivered !== null, true, 'the control run must succeed');
  assert.equal(controlObservations >= 3, true);

  // Now deny exactly on that last observation: every observation inside the own
  // deliver callback still allows, so delivery is confirmed and the accepted
  // pipeline registers the handles; only the final synchronous section sees it.
  reset();
  let seen = 0;
  const members = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => {
      seen += 1;
      return { decisions: seen >= controlObservations ? [] : [nine, seventeen].map(entry => ({ ...entry.record, decision: 'allow', decision_id: 'decision:' + entry.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ })) };
    },
  });
  const written = [];
  const outcome = await R.readPackageSetNode(
    readInput(set, [nine, seventeen]),
    control(),
    readProviderFor([nine, seventeen], { members, observeRead: observerFor({}, { wideScope: true }), sink: result => { written.push(result); return true; } })
  );

  assert.equal(seen, controlObservations, 'the narrow window is the last observation of the same shape');
  // The no-token fact and the handle fact are separate fields, never one 0.
  assert.equal(outcome.delivered, null, 'no token is minted');
  assert.equal(outcome.handle_registration, 'registered');
  assert.equal(outcome.registered_handles >= 1, true, 'a handle that really exists is not reported as 0');
  assert.deepEqual(outcome.registered_handle_ids, outcome.readResult.envelope.content.expansion_handles.map(handle => handle.handle_id).slice().sort());
  assert.equal(outcome.registered_handle_ids.length, outcome.registered_handles);
  assert.match(outcome.registered_handle_ids[0], /^handle:/);
  // The closed Host and the real delivery facts are not hidden.
  assert.equal(outcome.host_closed, true);
  assert.equal(outcome.sink_invoked, true);
  assert.equal(outcome.sink_confirmed, true);
  assert.equal(written.length, 1);
  // No success is claimed and the first cause is the observed R07 rejection.
  assert.equal(outcome.decision.status, 'rejected');
  assert.equal(outcome.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
  assert.equal(outcome.local_failure, null);
  // The ready channel is not rewritten into a transport failure.
  assert.equal(outcome.readResult.channel, 'read_envelope');
  assert.equal(outcome.readResult.envelope.status, 'ready');
});

// N1-A1-L44: member observations must belong to declared identities.
// A provider observation for an undeclared identity is invalid; a declared
// identity without a matching observation is unauthorized.
test('N1-A1-L44 an undeclared observation row is a provider failure; a declared identity without one is unauthorized', async () => {
  reset();
  const { nine, seventeen, set } = twoMembers();
  const sources = [nine.source, seventeen.source];
  // Undeclared full identity in the observation rows.
  const undeclared = await P.admitPackageSetNode(
    { set, tuple, members: sources, operation: 'isolated_read', limits: limits() },
    memberProviderFor([nine, seventeen, member('member:ghost', 2, 'asset:ghost')])
  );
  assert.equal(undeclared.status, 'rejected');
  assert.equal(undeclared.local_failure, 'provider_observation_invalid');
  assert.equal(undeclared.decision, null);
  // Declared identity present in the grant rows but absent from the sources.
  const granted = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => ({ decisions: [nine, seventeen].map(entry => ({ ...entry.record, decision: 'allow', decision_id: 'decision:' + entry.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ })) }),
  });
  const short = await P.admitPackageSetNode({ set, tuple, members: [nine.source], operation: 'isolated_read', limits: limits() }, granted);
  assert.equal(short.status, 'rejected');
  assert.equal(short.local_failure, null);
  assert.equal(short.decision.diagnostic, 'SET_MEMBER_MISSING');
  // Declared identity with a single valid deny.
  const denied = P.createTrustedPackageSetMemberProvider({
    host_id: HOST,
    host_epoch: EPOCH,
    observe: () => ({ decisions: [{ ...nine.record, decision: 'allow', decision_id: 'decision:one', host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ }, { ...seventeen.record, decision: 'deny', decision_id: 'decision:two', host_id: HOST, host_epoch: EPOCH, issued_at: 4000, expires_at: 90000, current_ms: clock++ }] }),
  });
  const refused = await P.admitPackageSetNode({ set, tuple, members: sources, operation: 'isolated_read', limits: limits() }, denied);
  assert.equal(refused.local_failure, null);
  assert.equal(refused.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
});
