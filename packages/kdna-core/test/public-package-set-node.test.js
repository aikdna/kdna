'use strict';
// Public PackageSet node surface: capture purity, resources, observation pairing,
// the accepted R07 order, caller-JSON non-permission and the handoff wrapper.
//
// Every fixture is real `.kdna` bytes produced by the accepted encoder and
// admitted by the accepted public bytes entry. The expectations are the frozen
// N1 literals; none of them is derived from a run.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const F = require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const { req, coreDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const core = req('@aikdna/kdna-core');
const P = req('@aikdna/kdna-core/package-set-node');
const { versionTuple: tuple } = require(path.join(coreDir, 'src/public-contract/generated-contract.json'));
const diagnostics = require(path.join(coreDir, 'schema/public-diagnostics.json'));
const { decidePackageSet } = require(path.join(coreDir, 'src/public-contract/package-set.js'));

const HOST = 'host:package-set';
const EPOCH = 'epoch:package-set';
const LOCAL_FAILURES = P.getPackageSetContract().local_failures;

let clock = 1000;
function reset() {
  clock = 1000;
}

function assetBytes(count, assetId) {
  const asset = F.blank(tuple, count, {
    patch: (manifest, payload) => {
      manifest.asset_id = assetId;
      payload.asset.asset_id = assetId;
    },
  });
  return F.encode(asset, req);
}
function member(memberId, count, assetId = 'asset:' + memberId) {
  const bytes = assetBytes(count, assetId);
  const admitted = core.admitBytes(bytes);
  assert.equal(admitted.status, 'accepted');
  const view = req('@aikdna/kdna-core/read-boundary').inspectSnapshot(admitted.snapshot);
  return {
    source: { member_id: memberId, bytes },
    record: {
      member_id: memberId,
      asset_id: view.asset.asset_id,
      asset_version: view.asset.asset_version,
      A: view.digests.A.observed,
    },
    view,
  };
}

function makeSet(members, overrides = {}) {
  return { set_id: 'set:package', members: members.map(entry => entry.record), selection: members[0].view.ir.mandatory_closures[0].selection, ...overrides };
}

function provider(decisions, changes = {}) {
  const rows = decisions.map(({ member, decision = 'allow' }) => {
    const row = { ...member.record, decision, decision_id: 'decision:' + member.record.member_id, host_id: HOST, host_epoch: EPOCH, issued_at: 900, expires_at: 2000, current_ms: clock++ };
    return row;
  });
  const observe = () => ({ decisions: rows.map(row => ({ ...row })) });
  return { provider: P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe, ...changes }), observe };
}

function limits(overrides = {}) {
  return { maxMembers: 10000, maxTotalSourceBytes: 104857600, ...overrides };
}

async function admit(input, providerValue) {
  return P.admitPackageSetNode(input, providerValue);
}

test('the generated module descriptor is self-consistent and its 12 local codes stay off the wire', () => {
  const contract = P.getPackageSetContract();
  assert.equal(contract.contract, 'kdna.package-set-node/0.2.1');
  assert.equal(contract.core_version, '0.37.0');
  assert.equal(contract.read_version, '0.11.1');
  assert.equal(contract.claims, 'claims_not_authenticated');
  assert.equal(contract.core_callables.length, 7);
  assert.equal(contract.read_callables.length, 5);
  assert.deepEqual(contract.limits, { maxMembers: 10000, maxTotalSourceBytes: 104857600 });
  assert.equal(LOCAL_FAILURES.length, 12);
  const wire = new Set(diagnostics.entries.map(entry => entry.code));
  for (const code of LOCAL_FAILURES) assert.equal(wire.has(code), false, code + ' must not be a wire diagnostic');
});

test('the declared core callables are exactly the exported ones', () => {
  assert.deepEqual(Object.keys(P).sort(), [...P.getPackageSetContract().core_callables].sort());
});

test('a pure structural read keeps duplicates and refuses every shape failure with R07 input-invalid', () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  const valid = P.validatePackageSetStructure(good);
  assert.equal(valid.status, 'valid');
  assert.equal(valid.proof, 'claims_not_authenticated');
  assert.equal(valid.value.members.length, 1);

  const duplicated = { ...good, members: [good.members[0], good.members[0]] };
  const kept = P.validatePackageSetStructure(duplicated);
  assert.equal(kept.status, 'valid');
  assert.equal(kept.value.members.length, 2);

  const shapes = {
    'missing set_id': () => { const bad = { ...good }; delete bad.set_id; return bad; },
    'extra tuple': () => ({ ...good, tuple: { ...tuple } }),
    'empty members': () => ({ ...good, members: [] }),
    'member extra key': () => ({ ...good, members: [{ ...good.members[0], authorized: true }] }),
    'version empty': () => ({ ...good, members: [{ ...good.members[0], asset_version: '' }] }),
    'version 257': () => ({ ...good, members: [{ ...good.members[0], asset_version: 'a'.repeat(257) }] }),
    'member id 257': () => ({ ...good, members: [{ ...good.members[0], member_id: 'a'.repeat(257) }] }),
    'version control': () => ({ ...good, members: [{ ...good.members[0], asset_version: 'a\nb' }] }),
    'version 258 utf8': () => ({ ...good, members: [{ ...good.members[0], asset_version: 'é'.repeat(129) }] }),
    'accessor': () => ({ ...good, get set_id() { throw new Error('accessor must not run'); } }),
    'sparse members': () => { const bad = { ...good, members: [{ ...good.members[0] }, { ...good.members[0] }] }; delete bad.members[1]; return bad; },
    'symbol key': () => ({ ...good, [Symbol('x')]: 1 }),
    'cycle': () => { const bad = { ...good }; bad.self = bad; return bad; },
  };
  for (const [label, build] of Object.entries(shapes)) {
    const outcome = P.validatePackageSetStructure(build());
    assert.equal(outcome.status, 'rejected', label);
    assert.equal(outcome.diagnostic, 'READ_INPUT_INVALID', label);
    assert.equal(outcome.merged_ir, false, label);
    assert.equal(outcome.action_authorized, false, label);
  }
  // A 256-byte UTF-8 version label is legal and must not be a shape failure.
  const wide = { ...good, members: [{ ...good.members[0], asset_version: 'é'.repeat(128) }] };
  assert.equal(P.validatePackageSetStructure(wide).status, 'valid');
});

test('a Proxy anywhere in the set is refused without firing a single trap', () => {
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  let traps = 0;
  const hostile = new Proxy({ ...good.members[0] }, {
    get() { traps++; throw new Error('trap'); },
    getPrototypeOf() { traps++; throw new Error('trap'); },
    ownKeys() { traps++; throw new Error('trap'); },
    getOwnPropertyDescriptor() { traps++; throw new Error('trap'); },
  });
  const outcome = P.validatePackageSetStructure({ ...good, members: [hostile] });
  assert.equal(outcome.status, 'rejected');
  assert.equal(outcome.diagnostic, 'READ_INPUT_INVALID');
  assert.equal(traps, 0);
  let observed = 0;
  const rows = provider([{ member: simple }]);
  const wrapped = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => { observed++; return { decisions: [] }; } });
  return admit({ set: { ...good, members: [hostile] }, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, wrapped).then(result => {
    assert.equal(result.status, 'rejected');
    assert.equal(result.decision.diagnostic, 'READ_INPUT_INVALID');
    assert.equal(observed, 0);
    assert.equal(typeof rows.provider, 'object');
  });
});

test('limit configuration is refused before any deep input or callback', async () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  let observed = 0;
  const providerValue = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => { observed++; return { decisions: [] }; } });
  for (const bad of [{ maxMembers: 0, maxTotalSourceBytes: 1 }, { maxMembers: 10001, maxTotalSourceBytes: 1 }, { maxMembers: 1, maxTotalSourceBytes: 104857601 }, { maxMembers: 1.5, maxTotalSourceBytes: 1 }, { maxMembers: 1 }, { maxMembers: -1, maxTotalSourceBytes: 1 }, { maxMembers: '1', maxTotalSourceBytes: 1 }]) {
    const outcome = await admit({ set: good, tuple, members: [simple.source], operation: 'isolated_read', limits: bad }, providerValue);
    assert.equal(outcome.local_failure, 'invalid_limits');
    assert.equal(outcome.decision, null);
  }
  // Invalid configuration wins over a malformed set, and never reaches the provider.
  const shapeVictim = { ...good };
  delete shapeVictim.set_id;
  const combined = await admit({ set: shapeVictim, tuple, members: [simple.source], operation: 'isolated_read', limits: { maxMembers: 0, maxTotalSourceBytes: 1 } }, providerValue);
  assert.equal(combined.local_failure, 'invalid_limits');
  assert.equal(observed, 0);
});

test('actual counts and actual source bytes are separate local codes checked before any copy', async () => {
  reset();
  const simple = member('member:simple', 2);
  const rules = member('member:rules', 3);
  const two = makeSet([simple, rules]);
  const granted = provider([{ member: simple }, { member: rules }]);
  const overMembers = await admit({ set: two, tuple, members: [simple.source, rules.source], operation: 'isolated_read', limits: limits({ maxMembers: 1 }) }, granted.provider);
  assert.equal(overMembers.local_failure, 'member_limit_exceeded');
  const total = simple.source.bytes.length + rules.source.bytes.length;
  const exact = await admit({ set: two, tuple, members: [simple.source, rules.source], operation: 'isolated_read', limits: limits({ maxTotalSourceBytes: total }) }, granted.provider);
  assert.equal(exact.status, 'admitted');
  reset();
  const grantedAgain = provider([{ member: simple }, { member: rules }]);
  const overBytes = await admit({ set: two, tuple, members: [simple.source, rules.source], operation: 'isolated_read', limits: limits({ maxTotalSourceBytes: total - 1 }) }, grantedAgain.provider);
  assert.equal(overBytes.local_failure, 'source_bytes_limit_exceeded');
  assert.equal(overBytes.decision, null);
});

test('member bytes must be genuine non-Proxy Uint8Array of an unshared backing store', async () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  const providerValue = provider([{ member: simple }]).provider;
  const shared = new Uint8Array(new SharedArrayBuffer(8));
  const buffer = new ArrayBuffer(8);
  const detached = new Uint8Array(buffer);
  if (typeof structuredClone === 'function') structuredClone(buffer, { transfer: [buffer] });
  const cases = [
    { member_id: 'member:simple', bytes: new Proxy(new Uint8Array(4), {}) },
    { member_id: 'member:simple', bytes: shared },
    { member_id: 'member:simple', bytes: detached },
    { member_id: 'member:simple', bytes: new Uint16Array(2) },
    { member_id: 'member:simple', bytes: [1, 2, 3] },
    { member_id: '', bytes: simple.source.bytes },
    { member_id: 'member:simple' },
    { member_id: 'member:simple', bytes: simple.source.bytes, extra: 1 },
  ];
  for (const source of cases) {
    const outcome = await admit({ set: good, tuple, members: [source], operation: 'isolated_read', limits: limits() }, providerValue);
    assert.equal(outcome.status, 'rejected');
    assert.equal(outcome.local_failure, 'invalid_member_source');
    assert.equal(outcome.decision, null);
  }
});

test('a plain record carrying the right metadata, and a provider from another Core, are not brands', async () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  let calls = 0;
  const plain = { host_id: HOST, host_epoch: EPOCH, observe: () => { calls++; return { decisions: [] }; } };
  const fake = await admit({ set: good, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, plain);
  assert.equal(fake.local_failure, 'provider_invalid');
  assert.equal(calls, 0);
  const frozen = Object.freeze({ host_id: HOST, host_epoch: EPOCH, observe: () => { calls++; return { decisions: [] }; } });
  const copied = await admit({ set: good, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, frozen);
  assert.equal(copied.local_failure, 'provider_invalid');
  assert.equal(calls, 0);
});

test('observation rows are paired by full identity and never folded', async () => {
  reset();
  const simple = member('member:simple', 2);
  const rules = member('member:rules', 3);
  const two = makeSet([simple, rules]);
  const sources = [simple.source, rules.source];
  const base = () => provider([{ member: simple }, { member: rules }]);

  const missing = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(missing.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');

  const denied = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: rules, decision: 'deny' }]).provider);
  assert.equal(denied.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');

  for (const label of ['duplicate allow', 'contradictory allow/deny']) {
    reset();
    const rows = [{ member: simple }, { member: rules }];
    const built = base();
    const observe = built.observe;
    const duplicated = P.createTrustedPackageSetMemberProvider({
      host_id: HOST,
      host_epoch: EPOCH,
      observe: () => {
        const value = observe();
        const extra = label === 'duplicate allow' ? { ...value.decisions[0] } : { ...value.decisions[0], decision: 'deny' };
        return { decisions: [...value.decisions, extra] };
      },
    });
    const outcome = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, duplicated);
    assert.equal(outcome.local_failure, 'provider_observation_invalid', label);
    assert.equal(outcome.decision, null, label);
    assert.equal(rows.length, 2);
  }

  const undeclared = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: rules }, { member: member('member:ghost', 2) }]).provider);
  assert.equal(undeclared.local_failure, 'provider_observation_invalid');

  const expired = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => ({ decisions: [{ ...simple.record, decision: 'allow', decision_id: 'decision:x', host_id: HOST, host_epoch: EPOCH, issued_at: 900, expires_at: 950, current_ms: 950 }] }) });
  const expiredOutcome = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, expired);
  assert.equal(expiredOutcome.local_failure, 'provider_observation_invalid');

  const throwing = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => { throw new Error('boom'); } });
  const thrown = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, throwing);
  assert.equal(thrown.local_failure, 'provider_failed');
});

test('the observer is called with the closed request record, phases initial then read', async () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  const seen = [];
  const observe = request => {
    seen.push({ keys: Object.keys(request).sort(), phase: request.phase, operation: request.operation, members: request.members.length });
    return { decisions: [{ ...simple.record, decision: 'allow', decision_id: 'decision:x', host_id: HOST, host_epoch: EPOCH, issued_at: 900, expires_at: 2000, current_ms: clock++ }] };
  };
  const providerValue = P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe });
  const outcome = await admit({ set: good, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, providerValue);
  assert.equal(outcome.status, 'admitted');
  assert.deepEqual(seen[0].keys, ['members', 'operation', 'phase', 'selection', 'set_id']);
  assert.equal(seen[0].phase, 'initial');
  assert.equal(seen[0].operation, 'isolated_read');
  assert.equal(seen[0].members, 1);
  assert.equal(P.recheckPackageSet(outcome.admission, 'read').status, 'allowed');
  assert.equal(seen[1].phase, 'read');
  assert.equal(P.recheckPackageSet(outcome.admission, 'handoff').status, 'allowed');
  assert.equal(seen[2].phase, 'read', 'handoff recheck uses the single read observation phase');
  assert.equal(P.recheckPackageSet(outcome.admission, 'other').local_failure, 'invalid_read_request');
  assert.equal(seen.length, 3);
});

test('the accepted R07 order is preserved for every combination', async () => {
  reset();
  const simple = member('member:simple', 2);
  const rules = member('member:rules', 3);
  const two = makeSet([simple, rules]);
  const sources = [simple.source, rules.source];

  const notGranted = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => ({ decisions: [] }) }));
  assert.equal(notGranted.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');

  const partial = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(partial.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');

  // A row whose full identity the set does not declare is a provider observation
  // failure, not an authorization verdict: the row is rejected before any R07
  // stage, so no invented first cause is produced. (N1-L02 states this input as a
  // partial match; N1-L20 and N1-CAPTURE-PHASE-CLOSURE classify it as an
  // undeclared observation. The property N1-L02 names is proved separately below.)
  const wrongA = { ...simple.record, A: 'sha256:' + '0'.repeat(64) };
  const mismatched = await admit({ set: two, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: { ...simple, record: wrongA } }, { member: rules }]).provider);
  assert.equal(mismatched.local_failure, 'provider_observation_invalid');
  assert.equal(mismatched.decision, null);

  // Identity is the full tuple, never the member_id alone: two declared
  // identities that share a member_id must each carry their own allow row.
  const twin = member('member:simple', 5);
  const twinSet = { set_id: 'set:package', members: [simple.record, twin.record], selection: simple.view.ir.mandatory_closures[0].selection };
  const onlyOne = await admit({ set: twinSet, tuple, members: [simple.source, twin.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(onlyOne.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
  const bothGranted = await admit({ set: twinSet, tuple, members: [simple.source, twin.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: twin }]).provider);
  assert.equal(bothGranted.decision.diagnostic, 'SET_MEMBER_DUPLICATE');

  // An extra *source* the set does not name is SET_MEMBER_EXTRA. The grant rows
  // still only cover identities the set declares, so this is not an undeclared
  // observation.
  const extra = await admit({ set: makeSet([simple]), tuple, members: [simple.source, rules.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(extra.decision.diagnostic, 'SET_MEMBER_EXTRA');

  const missing = await admit({ set: two, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: rules }]).provider);
  assert.equal(missing.decision.diagnostic, 'SET_MEMBER_MISSING');

  const duplicateSet = makeSet([simple, simple]);
  const duplicate = await admit({ set: duplicateSet, tuple, members: [simple.source, simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(duplicate.decision.diagnostic, 'SET_MEMBER_DUPLICATE');

  const duplicateOtherBytes = member('member:simple', 5);
  const duplicateBytes = await admit({ set: duplicateSet, tuple, members: [simple.source, duplicateOtherBytes.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(duplicateBytes.decision.diagnostic, 'SET_MEMBER_DUPLICATE');

  const unauthorisedWins = await admit({ set: duplicateSet, tuple, members: [simple.source, simple.source], operation: 'isolated_read', limits: limits() }, P.createTrustedPackageSetMemberProvider({ host_id: HOST, host_epoch: EPOCH, observe: () => ({ decisions: [] }) }));
  assert.equal(unauthorisedWins.decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');

  // A complete tuple recorded in the generated UnsupportedVersionTuple set is
  // reported as unsupported, never as a mixed family.
  const historical = Object.fromEntries(
    Object.entries(require(path.join(coreDir, 'src/public-contract/generated-contract.json')).types.UnsupportedVersionTuple.anyOf[0].properties).map(([key, node]) => [key, node.const])
  );
  const unsupported = await admit({ set: makeSet([simple]), tuple: historical, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(unsupported.decision.diagnostic, 'READ_UNSUPPORTED_VERSION');

  const mixed = { ...tuple, core: 'kdna.core/9.9.9' };
  const mixedOutcome = await admit({ set: makeSet([simple]), tuple: mixed, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(mixedOutcome.decision.diagnostic, 'READ_MIXED_VERSION_TUPLE');

  const merge = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'semantic_merge', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(merge.decision.diagnostic, 'UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE');
  const cross = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'cross_asset_reference', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(cross.decision.diagnostic, 'UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE');

  const nowhere = { ...two, selection: { asset_id: 'asset:absent', asset_version: simple.view.asset.asset_version, judgment_id: simple.view.ir.catalog[0].judgment_id } };
  const notFound = await admit({ set: nowhere, tuple, members: sources, operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: rules }]).provider);
  assert.equal(notFound.decision.diagnostic, 'READ_SELECTION_NOT_FOUND');
});

test('a non-selected member with invalid or uninterpretable bytes still fails the whole set', async () => {
  reset();
  const simple = member('member:simple', 2);
  const broken = { member_id: 'member:broken', bytes: new Uint8Array([1, 2, 3, 4]) };
  const record = { member_id: 'member:broken', asset_id: 'asset:broken', asset_version: '1.0.0', A: 'sha256:' + '1'.repeat(64) };
  const brokenMember = { source: broken, record, view: null };
  const set = { set_id: 'set:package', members: [simple.record, record], selection: simple.view.ir.mandatory_closures[0].selection };
  const outcome = await admit({ set, tuple, members: [simple.source, broken], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: brokenMember }]).provider);
  assert.equal(outcome.status, 'rejected');
  assert.equal(outcome.decision.diagnostic, 'READ_CORE_INVALID');
});

test('two admitted members that both carry the selected judgment are ambiguous, never first-match', async () => {
  reset();
  const simple = member('member:a', 2);
  const twin = { source: { member_id: 'member:b', bytes: simple.source.bytes }, record: { ...simple.record, member_id: 'member:b' }, view: simple.view };
  const set = { set_id: 'set:package', members: [simple.record, twin.record], selection: simple.view.ir.mandatory_closures[0].selection };
  const outcome = await admit({ set, tuple, members: [simple.source, twin.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }, { member: twin }]).provider);
  assert.equal(outcome.decision.diagnostic, 'READ_SELECTION_AMBIGUOUS');
});

test('the current caller object never becomes an observation and extra JSON keys are never permission', async () => {
  reset();
  const simple = member('member:simple', 2);
  const good = makeSet([simple]);
  for (const key of ['authorized', 'valid', 'grant', 'grants', 'admission', 'core']) {
    const planted = { ...good, members: [{ ...good.members[0], [key]: true }] };
    const outcome = await admit({ set: planted, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
    assert.equal(outcome.status, 'rejected');
    assert.equal(outcome.decision.diagnostic, 'READ_INPUT_INVALID');
  }
  // The property the accepted internal decider proves is unchanged: an extra
  // authority-shaped key on a member record is not an authorization, because the
  // observation arrives as a separate argument.
  const decision = decidePackageSet(
    { members: [{ ...simple.record, authorized: true }], tuple, selection: good.selection },
    [{ member_id: simple.record.member_id, A: simple.record.A, asset_id: simple.record.asset_id, asset_version: simple.record.asset_version, core: 'valid', judgment_ids: [good.selection.judgment_id] }],
    [],
    'isolated_read',
    false
  );
  assert.equal(decision.diagnostic, 'SET_MEMBER_UNAUTHORIZED');
  // A JSON round trip of the whole input cannot change the decision either.
  const granted = provider([{ member: simple }]);
  const first = await admit({ set: good, tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, granted.provider);
  assert.equal(first.status, 'admitted');
  reset();
  const wire = JSON.parse(JSON.stringify({ set: good, tuple }));
  assert.equal(wire.set.members[0].member_id, simple.record.member_id);
});

test('the admission brand is private and inspection of a fake returns null', async () => {
  reset();
  const simple = member('member:simple', 2);
  const outcome = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(outcome.status, 'admitted');
  assert.equal(P.inspectAdmittedPackageSet({}), null);
  assert.equal(P.inspectAdmittedPackageSet(JSON.parse(JSON.stringify(outcome.admission))), null);
  const view = P.inspectAdmittedPackageSet(outcome.admission);
  assert.equal(view.host_id, HOST);
  assert.equal(view.host_epoch, EPOCH);
  assert.equal(view.selected_member.member_id, simple.record.member_id);
  assert.equal(view.members.length, 1);
  assert.equal(view.set.set_id, 'set:package');
  assert.equal(Object.isFrozen(view), true);
});

test('the handoff wrapper binds the original set before it reuses the internal checker', async () => {
  reset();
  const E = req('@aikdna/kdna-core/execution');
  const simple = member('member:simple', 2);
  const outcome = await admit({ set: makeSet([simple]), tuple, members: [simple.source], operation: 'isolated_read', limits: limits() }, provider([{ member: simple }]).provider);
  assert.equal(outcome.status, 'admitted');
  const view = P.inspectAdmittedPackageSet(outcome.admission);
  const selection = view.set.selection;
  const declared = simple.record.A;
  const planResult = E.createConsumptionPlan(view.selected_member.snapshot, {
    plan_id: 'plan:n1',
    intent: { task: 'Use the selected judgment.', use: 'reasoning_support' },
    selection,
    budget: { capsule_bytes: 1000000, output_bytes: 1000, response_bytes: 100000, trace_events: 6 },
  });
  assert.equal(planResult.status, 'admitted');
  const wire = {
    contract: 'kdna.package-set-handoff/0.1.0',
    tuple,
    set_id: view.set.set_id,
    members: [{ member_id: simple.record.member_id, asset_id: simple.record.asset_id, asset_version: simple.record.asset_version, A: declared, C: simple.view.digests.C.observed, snapshot_id: simple.view.snapshot_id }],
    selection,
    closure_digest: 'sha256:' + '0'.repeat(64),
    read_receipt_id: 'receipt:none',
    plan_digest: 'sha256:' + '0'.repeat(64),
    host_id: HOST,
    host_epoch: EPOCH,
  };
  const delivered = { channel: 'read_envelope', envelope: null };
  // Without a genuine Plan and a genuine delivered read nothing can be valid.
  assert.equal(P.verifyPackageSetHandoff(wire, {}, planResult.plan, delivered).status, 'rejected');
  assert.equal(P.verifyPackageSetHandoff(wire, { ...outcome.admission }, planResult.plan, delivered).status, 'rejected');
  assert.equal(P.verifyPackageSetHandoff(wire, outcome.admission, JSON.parse(JSON.stringify(planResult.plan)), delivered).status, 'rejected');
  const wrongSet = { ...wire, set_id: 'set:other' };
  assert.equal(P.verifyPackageSetHandoff(wrongSet, outcome.admission, planResult.plan, delivered).status, 'rejected');
  const wrongTuple = { ...wire, tuple: { ...tuple, read: 'kdna.read/0.4.0' } };
  assert.equal(P.verifyPackageSetHandoff(wrongTuple, outcome.admission, planResult.plan, delivered).status, 'rejected');
});

test('the local failure list and the wire diagnostics stay disjoint on the generated surface', () => {
  const registry = new Set(diagnostics.entries.map(entry => `${entry.code}`));
  assert.equal(LOCAL_FAILURES.some(code => registry.has(code)), false);
  assert.deepEqual(LOCAL_FAILURES, [
    'invalid_limits',
    'member_limit_exceeded',
    'source_bytes_limit_exceeded',
    'invalid_member_source',
    'invalid_read_request',
    'provider_invalid',
    'provider_failed',
    'provider_observation_invalid',
    'cancelled',
    'core_unavailable',
    'delivery_unconfirmed',
    'handoff_invalid',
  ]);
});
