'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const F = require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const { req, coreDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const { admitBytes } = req('@aikdna/kdna-core');
const E = req('@aikdna/kdna-core/execution');
const { inspectSnapshot } = req('@aikdna/kdna-core/read-boundary');
const { versionTuple: tuple } = require(path.join(coreDir, 'src/public-contract/generated-contract.json'));
const clone = value => JSON.parse(JSON.stringify(value));
const H = value => { const result = E.executionDigest(value); assert.equal(result.status, 'valid'); return result.digest; };
function fixture(overrides = {}, count = 2, patch = null) {
  const asset = F.blank(tuple, count);
  if (patch) patch(asset);
  const admission = admitBytes(F.encode(asset, req)); assert.equal(admission.status, 'accepted');
  const snapshot = admission.snapshot, view = inspectSnapshot(snapshot), selection = view.ir.mandatory_closures[0].selection;
  const options = { plan_id: 'plan:test', intent: { task: '私密任务：运用选定判断帮助推理。', use: 'reasoning_support' }, selection, budget: { capsule_bytes: 1000000, output_bytes: 1000, response_bytes: 100000, trace_events: 6, ...overrides } };
  const planned = E.createConsumptionPlan(snapshot, options); assert.equal(planned.status, 'admitted');
  return { snapshot, view, selection, plan: planned.plan, options };
}
function ready(overrides = {}, patch = null) {
  const f = fixture(overrides, 2, patch), built = E.createRuntimeCapsule(f.snapshot, f.plan); assert.equal(built.status, 'admitted');
  const requested = E.createAgentHostRequest(f.plan, built.capsule, { request_id: 'request:test', run_id: 'run:test', host_id: 'host:test', host_epoch: 'epoch:test' }); assert.equal(requested.status, 'admitted');
  return { ...f, capsule: built.capsule, request: requested.request };
}
function configuration(changes = {}) {
  return { host_id: 'host:test', host_epoch: 'epoch:test', clock: () => 1000,
    authorize: ({ request, request_digest }) => ({ decision: 'allow', authorization_id: 'authorization:test', request_digest, host_id: request.host_id, host_epoch: request.host_epoch, issued_at: 900, expires_at: 2000 }),
    observeDelivery: ({ request, request_digest }) => ({ delivery_id: 'delivery:test', request_digest, producer_digest: request.capsule_digest, delivery_digest: request.capsule_digest }),
    observeOutcome: () => ({ observation_id: 'outcome:test', status: 'completed', output: '甲🙂' }), ...changes };
}
function host(changes = {}) { const created = E.createExecutionHost(configuration(changes)); assert.equal(created.status, 'ready'); return created.host; }
function noBody(result, code) { assert.equal(result.status, 'rejected'); assert.equal(result.code, code); assert.equal(result.body, null); assert.equal(result.body_bytes, 0); }

test('any consumer can independently admit a complete 0.2 Plan from real admitted asset bytes', () => {
  const f = ready(), wire = E.inspectAdmittedPlan(f.plan), serialized = JSON.stringify(wire);
  assert.equal(wire.contract, tuple.plan); assert.deepEqual(wire.tuple, tuple);
  const again = E.admitConsumptionPlan(serialized, f.snapshot); assert.equal(again.status, 'admitted');
  assert.deepEqual(E.inspectAdmittedPlan(again.plan), wire);
  assert.equal(E.inspectAdmittedPlan(clone(f.plan)), null);
  assert.equal(E.inspectAdmittedPlan(wire), null);
  noBody(E.admitConsumptionPlan(serialized, clone(f.snapshot)), 'EXECUTION_SOURCE_UNATTESTED');
  assert.equal(Object.isFrozen(wire.intent), true);
  const changed = clone(wire); changed.source.digests.A.observed = 'sha256:' + '0'.repeat(64);
  noBody(E.admitConsumptionPlan(changed, f.snapshot), 'EXECUTION_BINDING_INVALID');
});
test('the ESM execution entry exports the same native public admission surface', async () => {
  const imported = await import(require('node:url').pathToFileURL(path.join(coreDir, 'src/public-contract/execution.mjs')));
  assert.equal(imported.createConsumptionPlan, E.createConsumptionPlan);
  assert.equal(imported.validateExecutionResponse, E.validateExecutionResponse);
});
test('capsule is exact mandatory static supply without foreign judgments, execution claims or truncation', () => {
  const f = ready(), capsule = E.inspectRuntimeCapsule(f.capsule), ids = f.view.ir.mandatory_closures[0].node_ids;
  assert.deepEqual(capsule.closure.map(node => node.id), ids);
  assert.equal(capsule.closure.filter(node => node.role === 'judgment').length, 1);
  assert.equal(capsule.kind, 'static_judgment_supply');
  assert.equal(capsule.closure.some(node => node.value?.focus === 'Explicit issue 1'), false);
  const again = E.admitRuntimeCapsule(JSON.stringify(capsule), f.snapshot, f.plan); assert.equal(again.status, 'admitted');
  for (const edit of [value => value.closure.pop(), value => value.closure.reverse(), value => value.references.pop(), value => value.closure[0].value.statement = 'silently rewritten', value => value.executed = true, value => value.P = H(value)]) {
    const changed = clone(capsule); edit(changed);
    assert.equal(E.admitRuntimeCapsule(changed, f.snapshot, f.plan).status, 'rejected');
  }
});
test('same-asset source changes, wrong selection and closure digests cannot rebind a Plan', () => {
  const f = ready(), changedSource = fixture({}, 2, asset => { asset.payload.judgments[0].result.value.value = 'Changed statement'; });
  noBody(E.admitConsumptionPlan(E.inspectAdmittedPlan(f.plan), changedSource.snapshot), 'EXECUTION_BINDING_INVALID');
  const wrong = clone(E.inspectAdmittedPlan(f.plan)); wrong.selection.judgment_id = 'missing';
  noBody(E.admitConsumptionPlan(wrong, f.snapshot), 'EXECUTION_SELECTION_INVALID');
  wrong.selection = f.selection; wrong.closure_digest = 'sha256:' + '0'.repeat(64);
  noBody(E.admitConsumptionPlan(wrong, f.snapshot), 'EXECUTION_BINDING_INVALID');
});
test('strict parse and schema reject duplicate members, unsafe JS values, extra authority and mixed versions', () => {
  noBody(E.parseExecutionJson('{"authorized":true,"authorized":false}'), 'EXECUTION_INPUT_INVALID');
  const f = ready(), wire = clone(E.inspectAdmittedPlan(f.plan));
  for (const value of [null, { ...wire, authorized: true }, { ...wire, budget: { ...wire.budget, output_bytes: -1 } }, { ...wire, intent: { ...wire.intent, task: '\ud800' } }]) assert.equal(E.admitConsumptionPlan(value, f.snapshot).status, 'rejected');
  wire.tuple.plan = 'kdna.consumption-plan/0.1.0';
  noBody(E.admitConsumptionPlan(wire, f.snapshot), 'EXECUTION_VERSION_UNSUPPORTED');
  const longIdentifier = clone(E.inspectAdmittedPlan(f.plan)); longIdentifier.plan_id = '中'.repeat(100);
  noBody(E.admitConsumptionPlan(longIdentifier, f.snapshot), 'EXECUTION_SCHEMA_INVALID');
  const getters = {}; Object.defineProperty(getters, 'intent', { enumerable: true, get() { throw new Error('should not run'); } });
  noBody(E.admitConsumptionPlan(getters, f.snapshot), 'EXECUTION_INPUT_INVALID');
});
test('Capsule bytes are measured as complete UTF-8 JCS with exact equality and zero accepted as a lawful limit', () => {
  const f = ready(), bytes = Buffer.byteLength(JSON.stringify(E.inspectRuntimeCapsule(f.capsule)));
  const exact = fixture({ capsule_bytes: bytes }); assert.equal(E.createRuntimeCapsule(exact.snapshot, exact.plan).status, 'admitted');
  const small = fixture({ capsule_bytes: bytes - 1 }); noBody(E.createRuntimeCapsule(small.snapshot, small.plan), 'EXECUTION_BUDGET_EXCEEDED');
  const zero = fixture({ capsule_bytes: 0 }); noBody(E.createRuntimeCapsule(zero.snapshot, zero.plan), 'EXECUTION_BUDGET_EXCEEDED');
});
test('Request binding requires both admitted objects and whole-object detached digests', () => {
  const f = ready(), request = clone(E.inspectAgentHostRequest(f.request));
  noBody(E.admitAgentHostRequest(request, clone(f.plan), f.capsule), 'EXECUTION_SOURCE_UNATTESTED');
  request.capsule_digest = H(E.inspectAdmittedPlan(f.plan));
  noBody(E.admitAgentHostRequest(request, f.plan, f.capsule), 'EXECUTION_BINDING_INVALID');
  request.capsule_digest = H(E.inspectRuntimeCapsule(f.capsule)); request.authorized = true;
  noBody(E.admitAgentHostRequest(request, f.plan, f.capsule), 'EXECUTION_SCHEMA_INVALID');
});
test('complete reference Host observation binds independent delivery, authorization, bytes and trace', () => {
  const f = ready(), result = host().consume(f.request);
  assert.equal(result.status, 'completed'); assert.equal(result.body.output, '甲🙂');
  assert.equal(result.body.receipt.output.bytes, 7);
  assert.equal(result.body_bytes, Buffer.byteLength(JSON.stringify(result.body)));
  assert.equal(result.output_delivery, 'not_confirmed');
  assert.equal(result.body.receipt.output_delivery, 'not_confirmed');
  assert.equal(E.validateExecutionResponse(result.body, f.request).status, 'valid');
  assert.equal(E.validateExecutionResponse(result.body, f.request).proof, 'claims_not_authenticated');
  assert.equal(E.validateAgentHostReceipt(result.body.receipt, f.request).status, 'valid');
  assert.equal(E.validateJudgmentTrace(result.body.trace, f.request, result.body.receipt).status, 'valid');
});
test('Host denial and fake supplied booleans never reach the outcome provider or disclose input text', () => {
  const f = ready(); let outcomes = 0;
  const result = host({ authorize: observation => ({ ...configuration().authorize(observation), decision: 'deny' }), observeOutcome: () => { outcomes++; throw new Error('not reached'); } }).consume(f.request);
  assert.equal(result.status, 'denied'); assert.equal(outcomes, 0); assert.equal(result.body.output, null);
  assert.equal(result.body.receipt.output.bytes, 0); assert.equal(result.body.receipt.output.digest, null);
  assert.equal(JSON.stringify(result).includes('私密任务'), false); assert.equal(JSON.stringify(result).includes('Authored result'), false);
  const malformed = host({ authorize: () => true, observeOutcome: () => { outcomes++; return null; } }).consume(f.request);
  assert.equal(malformed.status, 'failed'); assert.equal(outcomes, 0);
});
test('authorization is external configuration; missing providers, caller clones and foreign hosts fail closed', () => {
  for (const field of ['authorize', 'observeDelivery', 'observeOutcome', 'clock']) { const config = configuration(); delete config[field]; noBody(E.createExecutionHost(config), 'EXECUTION_HOST_INVALID'); }
  const f = ready(); noBody(host().consume(clone(f.request)), 'EXECUTION_SOURCE_UNATTESTED');
  noBody(host({ host_epoch: 'other' }).consume(f.request), 'EXECUTION_HOST_INVALID');
  const h = host(); assert.equal(h.consume(f.request).status, 'completed'); noBody(h.consume(f.request), 'EXECUTION_REPLAY');
});
test('request summaries to delivery and authorization providers contain no Plan task or Capsule content', () => {
  const f = ready(); let authorizations = 0, deliveries = 0;
  const result = host({ authorize(observation) { authorizations++; assert.equal(Object.isFrozen(observation.request), true); assert.equal(JSON.stringify(observation).includes('私密任务'), false); assert.equal(JSON.stringify(observation).includes('Authored result'), false); return configuration().authorize(observation); }, observeDelivery(observation) { deliveries++; assert.deepEqual(Object.keys(observation).sort(), ['request', 'request_digest']); return configuration().observeDelivery(observation); } }).consume(f.request);
  assert.equal(result.status, 'completed'); assert.equal(authorizations, 2); assert.equal(deliveries, 1);
});
test('expired, future, mismatched and final revoked Host grants return no output', () => {
  const f = ready();
  for (const patch of [{ expires_at: 1000 }, { issued_at: 1001 }, { request_digest: 'sha256:' + '0'.repeat(64) }]) {
    const result = host({ authorize: observation => ({ ...configuration().authorize(observation), ...patch }) }).consume(f.request);
    assert.notEqual(result.status, 'completed'); assert.equal(result.body?.output ?? null, null);
  }
  const result = host({ authorize: observation => ({ ...configuration().authorize(observation), decision: observation.phase === 'output' ? 'deny' : 'allow' }) }).consume(f.request);
  assert.equal(result.status, 'denied'); assert.equal(result.body.output, null); assert.equal(result.body.receipt.authorization, null);
});
test('incoming Capsule producer, trusted delivery and actual Host digests must all agree', () => {
  const f = ready(); let calls = 0;
  for (const field of ['producer_digest', 'delivery_digest', 'request_digest']) {
    const result = host({ observeDelivery: observation => ({ ...configuration().observeDelivery(observation), [field]: 'sha256:' + '0'.repeat(64) }), observeOutcome() { calls++; return configuration().observeOutcome(); } }).consume(f.request);
    assert.equal(result.status, 'failed'); assert.equal(result.body.receipt.failure, 'EXECUTION_DELIVERY_INVALID'); assert.equal(result.body.receipt.delivery, null);
  }
  assert.equal(calls, 0);
});
test('output UTF-8 equality, overage, failed observation and provider promise are handled without leaked content', () => {
  assert.equal(host().consume(ready({ output_bytes: 7 }).request).status, 'completed');
  for (const limit of [0, 6]) { const result = host().consume(ready({ output_bytes: limit }).request); assert.equal(result.status, 'failed'); assert.equal(result.body.output, null); assert.equal(result.body.receipt.failure, 'EXECUTION_BUDGET_EXCEEDED'); }
  for (const observeOutcome of [() => ({ observation_id: 'failed:test', status: 'failed', output: null }), () => Promise.resolve({ status: 'completed', output: 'unobserved' }), () => { throw new Error('secret provider failure'); }]) {
    const result = host({ observeOutcome }).consume(ready().request); assert.equal(result.status, 'failed'); assert.equal(result.body.output, null); assert.equal(JSON.stringify(result).includes('secret provider failure'), false);
  }
});
test('complete response equality is allowed; response overage and trace budget use a zero-body control', () => {
  const initial = host().consume(ready().request), exact = host().consume(ready({ response_bytes: initial.body_bytes }).request);
  assert.equal(exact.status, 'completed'); assert.equal(exact.body_bytes, initial.body_bytes);
  noBody(host().consume(ready({ response_bytes: initial.body_bytes - 1 }).request), 'EXECUTION_BUDGET_EXCEEDED');
  noBody(host().consume(ready({ response_bytes: 0 }).request), 'EXECUTION_BUDGET_EXCEEDED');
  noBody(host({ authorize: observation => ({ ...configuration().authorize(observation), decision: 'deny' }) }).consume(ready({ response_bytes: 0 }).request), 'EXECUTION_HOST_DENIED');
  let called = false;
  noBody(host({ observeOutcome() { called = true; return configuration().observeOutcome(); } }).consume(ready({ trace_events: 5 }).request), 'EXECUTION_BUDGET_EXCEEDED');
  assert.equal(called, false);
});
test('wire Receipt, Trace and Response checks prove correlations only and reject rewritten bytes or chronology', () => {
  const f = ready(), response = host().consume(f.request), body = response.body;
  assert.equal(E.validateExecutionStructure('PublicAgentHostReceipt', body.receipt).proof, 'claims_not_authenticated');
  const badOutput = clone(body); badOutput.output = '乙🙂'; noBody(E.validateExecutionResponse(badOutput, f.request), 'EXECUTION_BINDING_INVALID');
  const badReceipt = clone(body.receipt); badReceipt.plan_digest = 'sha256:' + '0'.repeat(64); noBody(E.validateAgentHostReceipt(badReceipt, f.request), 'EXECUTION_BINDING_INVALID');
  for (const edit of [trace => trace.events[1].sequence = 0, trace => trace.events[0].at = 1001, trace => trace.events[1].source = 'authorization_provider', trace => trace.receipt_digest = 'sha256:' + '0'.repeat(64), trace => trace.events[4].evidence_id = 'fabricated']) {
    const trace = clone(body.trace); edit(trace); assert.equal(E.validateJudgmentTrace(trace, f.request, body.receipt).status, 'rejected');
  }
  const forged = clone(body); forged.receipt.output_delivery = 'delivered'; assert.equal(E.validateExecutionResponse(forged, f.request).status, 'rejected');
  const denial = host({ authorize: observation => ({ ...configuration().authorize(observation), decision: 'deny' }) }).consume(f.request).body.receipt;
  const contradictory = clone(denial); contradictory.failure = 'EXECUTION_PROVIDER_FAILED'; noBody(E.validateAgentHostReceipt(contradictory, f.request), 'EXECUTION_BINDING_INVALID');
  contradictory.failure = 'EXECUTION_HOST_DENIED'; contradictory.status = 'failed'; noBody(E.validateAgentHostReceipt(contradictory, f.request), 'EXECUTION_BINDING_INVALID');
});
test('independently authored static rule supply remains a rule and yields no invented runtime result', () => {
  const f = ready({}, asset => { const j = asset.payload.judgments[0]; j.form = 'rule'; delete j.result; j.formation_rule = { statement: '信息不足则保留判断。', condition_refs: [{kind:'condition',id:'execution-condition'}], output_contract_ref: j.result_contract.id }; asset.payload.conditions.push({id:'execution-condition',owner_ref:{kind:'judgment',id:j.id},expression:{kind:'interpreted',statement:'具名信息是否充分。'}}); asset.payload.asset_capability = 'mixed'; });
  const capsule = E.inspectRuntimeCapsule(f.capsule);
  const rule=capsule.closure.find(node=>node.target.kind==='judgment').value;assert.equal(rule.form,'rule');assert.equal(rule.formation_rule.statement,'信息不足则保留判断。');assert.deepEqual(rule.formation_rule.condition_refs,[{kind:'condition',id:'execution-condition'}]);assert.ok(capsule.closure.some(node=>node.target.kind==='condition'&&node.target.id==='execution-condition'));assert.equal(Object.hasOwn(rule,'result'),false);
  assert.equal(capsule.closure.some(node => node.role === 'result'), false);
  const result = host().consume(f.request); assert.equal(result.status, 'completed');
  assert.equal(E.inspectRuntimeCapsule(f.capsule).closure.some(node => node.role === 'result'), false);
});
test('runtime handoff cannot turn an arbitrary callback JSON Plan into independent admission', () => {
  const { verifyHandoffBindings } = require(path.join(coreDir, 'src/public-contract/package-set.js'));
  const f = ready(), wirePlan = E.inspectAdmittedPlan(f.plan), selection = f.selection, view = f.view;
  const closure = E.inspectRuntimeCapsule(f.capsule).closure;
  const handoff = { contract: 'kdna.package-set-handoff/0.2.1', tuple, set_id: 'set:test', members: [{ member_id: 'member:test', asset_id: view.asset.asset_id, asset_version: view.asset.asset_version, A: view.digests.A.observed, C: view.digests.C.observed, snapshot_id: view.snapshot_id }], selection, closure_digest: H(closure), read_receipt_id: 'read:test', plan_digest: H(wirePlan), host_id: 'host:test', host_epoch: 'epoch:test' };
  const context = { snapshots: [{ member_id: 'member:test', snapshot: f.snapshot }], deliveredRead: { channel: 'read_envelope', envelope: { status: 'ready', snapshot_id: view.snapshot_id, digests: view.digests, receipt: { delivery: 'delivered', receipt_id: 'read:test', host_id: 'host:test', host_epoch: 'epoch:test' }, content: { selected: selection, closure } } }, observeAdmittedPlan: () => f.plan };
  assert.equal(verifyHandoffBindings(handoff, context), true);
  assert.equal(verifyHandoffBindings(handoff, { ...context, observeAdmittedPlan: () => wirePlan }), false);
  assert.equal(verifyHandoffBindings(handoff, { ...context, observeAdmittedPlan: () => clone(f.plan) }), false);
  const otherSelection = E.createConsumptionPlan(f.snapshot, { ...f.options, selection: f.view.ir.mandatory_closures[1].selection });
  assert.equal(otherSelection.status, 'admitted');
  assert.equal(verifyHandoffBindings({ ...handoff, plan_digest: H(E.inspectAdmittedPlan(otherSelection.plan)) }, { ...context, observeAdmittedPlan: () => otherSelection.plan }), false);
  const otherAsset = fixture({}, 2, asset => { asset.manifest.asset_id = 'asset:other'; asset.payload.asset.asset_id = 'asset:other'; });
  assert.equal(verifyHandoffBindings({ ...handoff, plan_digest: H(E.inspectAdmittedPlan(otherAsset.plan)) }, { ...context, observeAdmittedPlan: () => otherAsset.plan }), false);
  const changedClosure = clone(closure); changedClosure.pop();
  assert.equal(verifyHandoffBindings({ ...handoff, closure_digest: H(changedClosure) }, { ...context, deliveredRead: { channel: 'read_envelope', envelope: { ...context.deliveredRead.envelope, content: { selected: selection, closure: changedClosure } } } }), false);
  const largePlan = E.createConsumptionPlan(f.snapshot, { ...f.options, intent: { ...f.options.intent, task: 'x'.repeat(1048000) } });
  assert.equal(largePlan.status, 'admitted');
  assert.ok(Buffer.byteLength(JSON.stringify(E.inspectAdmittedPlan(largePlan.plan))) > 1048576);
  assert.equal(verifyHandoffBindings({ ...handoff, plan_digest: H(E.inspectAdmittedPlan(largePlan.plan)) }, { ...context, observeAdmittedPlan: () => largePlan.plan }), true);
});
