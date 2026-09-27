'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path');
const F = require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const { req, coreDir } = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));
const { admitBrowser } = req('@aikdna/kdna-core/browser');
const { inspectSnapshot } = req('@aikdna/kdna-core/read-boundary');
const E = req('@aikdna/kdna-core/execution');
const { readBrowser } = req('@aikdna/kdna-read/browser');
const embedding = req('@aikdna/kdna-read/embedding');
const contract = require(path.join(coreDir, 'src/public-contract/generated-contract.json')), tuple = contract.versionTuple;
const clone = value => JSON.parse(JSON.stringify(value));
const H = value => { const r = E.executionDigest(value); assert.equal(r.status, 'valid'); return r.digest; };
const control = embedding.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 1000000 }));

function fixture(name = 'simple', edit = () => {}) {
  const asset = F.asset(tuple, name); edit(asset);
  const admission = admitBrowser(F.encode(asset, req, { deflate: true }));
  assert.equal(admission.status, 'accepted', JSON.stringify(admission));
  return { asset, snapshot: admission.snapshot, view: inspectSnapshot(admission.snapshot) };
}
function supply(f, id = f.asset.payload.judgments[0].id, budget = {}) {
  const selection = { asset_id: f.view.asset.asset_id, asset_version: f.view.asset.asset_version, judgment_id: id };
  const options = { plan_id: 'plan:r2-execution', intent: { task: 'Use the complete selected R2 context.', use: 'reasoning_support' }, selection, budget: { capsule_bytes: 8000000, output_bytes: 1000, response_bytes: 8000000, trace_events: 6, ...budget } };
  const planned = E.createConsumptionPlan(f.snapshot, options); assert.equal(planned.status, 'admitted', JSON.stringify(planned));
  const built = E.createRuntimeCapsule(f.snapshot, planned.plan); assert.equal(built.status, 'admitted', JSON.stringify(built));
  return { ...f, selection, options, plan: planned.plan, capsule: built.capsule, planValue: E.inspectAdmittedPlan(planned.plan), wire: E.inspectRuntimeCapsule(built.capsule) };
}
async function readResponse(f, id = f.asset.payload.judgments[0].id, mode = 'exact_selection') {
  const host = embedding.createTrustedHostReadProvider({ observe({ request, snapshot }) {
    const v = inspectSnapshot(snapshot);
    return { host_id: 'host:r2-execution', host_epoch: 'epoch:r2-execution', decision_id: 'decision:r2-execution', request_id: request.request_id, snapshot_id: v.snapshot_id, A: v.digests.A.observed, C: v.digests.C.observed, scope: v.ir.nodes.map(n => n.id), issued_at: 900, expires_at: 2000, current_ms: 1000, decision: 'allow', policy_id: 'policy:r2-execution' };
  } });
  const response = await readBrowser(f.snapshot, F.candidate(tuple, f.asset, mode, id, 8000000), control, host);
  assert.equal(response.channel, 'read_envelope', JSON.stringify(response));
  return response.envelope;
}
async function read(f, id = f.asset.payload.judgments[0].id, mode = 'exact_selection') {
  const envelope = await readResponse(f, id, mode); assert.equal(envelope.status, 'ready', JSON.stringify(envelope)); return envelope;
}
function noBody(result, code = 'EXECUTION_BINDING_INVALID') {
  assert.equal(result.status, 'rejected', JSON.stringify(result)); assert.equal(result.code, code);
  assert.equal(result.body, null); assert.equal(result.body_bytes, 0);
}
function foundationScope(asset, qualified = false) {
  for (const [id, kind, applies_to] of [['fGlobal', 'foundation', { kind: 'asset' }], ['fC', 'premise', { kind: 'judgments', judgment_refs: ['qC'] }]]) asset.payload.materials.push({ id, kind, statement: 'Explicit authored ' + id + ' semantic body.', source_refs: [], applies_to });
  asset.payload.kernel.foundation_refs = ['fGlobal', 'fC'].map(id => ({ kind: 'material', id, ...(qualified ? { asset: clone(asset.payload.asset) } : {}) }));
  asset.payload.declarations.boundaries = { state: 'provided', value: [['bGlobal', { kind: 'asset' }], ['bC', { kind: 'judgments', judgment_refs: ['qC'] }]].map(([id, applies_to]) => ({ id, effect: 'limit', statement: 'Explicit authored ' + id + ' limit body.', declared_by: 'author', applies_to, exception_refs: [] })) };
}
function relation(asset, kind) {
  const [first, second] = asset.payload.judgments, def = contract.r2_semantics.relationship_tuples[kind];
  asset.payload.relationships.push({ id: 'r2-relation', kind: { term: kind }, direction: def.direction, participants: [{ role: { term: def.roles[0] }, judgment_ref: first.id }, { role: { term: def.roles[1] }, judgment_ref: second.id }], operator: { term: def.operator }, effect: { term: def.effect }, statement: 'Explicit authored relation between the two questions.' });
}
const hasJudgment = (wire, id) => wire.closure.some(n => n.role === 'judgment' && n.value.id === id);
async function equalRead(s) {
  const envelope = await read(s, s.selection.judgment_id);
  for (const key of ['closure', 'catalog', 'references', 'relationships']) assert.deepEqual(s.wire[key], envelope.content[key], key);
  assert.equal(s.planValue.closure_digest, H(envelope.content.closure));
  assert.equal(s.planValue.closure_digest, H(s.wire.closure));
  return envelope;
}

test('D009 simple unchanged context admits public Plan and Capsule with matching Read and empty omissions', async () => {
  const s = supply(fixture('simple', a => { delete a.payload.reading_order; }));
  const raw = s.view.ir.mandatory_closures.find(c => c.selection.judgment_id === s.selection.judgment_id).node_ids.map(id => s.view.ir.nodes.find(n => n.id === id));
  assert.deepEqual(s.wire.closure, raw); assert.deepEqual(s.wire.omissions, []);
  await equalRead(s);
  const planned = E.admitConsumptionPlan(JSON.stringify(s.planValue), s.snapshot); assert.equal(planned.status, 'admitted');
  assert.equal(E.admitRuntimeCapsule(JSON.stringify(s.wire), s.snapshot, planned.plan).status, 'admitted');
});

for (const qualified of [false, true]) test('D009 applicable foundations and boundaries survive selected context; qualified=' + qualified, async () => {
  const f = fixture('complex', a => foundationScope(a, qualified)), original = clone(f.view), originalHash = H(f.view.ir);
  for (const id of ['qA', 'qC']) {
    const s = supply(f, id), assetNode = s.wire.closure.find(n => n.role === 'asset_declaration');
    const envelope = await equalRead(s);
    assert.equal(Object.hasOwn(assetNode.value, 'reading_order'), false);
    assert.deepEqual(assetNode.value.kernel.foundation_refs, f.asset.payload.kernel.foundation_refs.filter(ref => id === 'qC' || ref.id === 'fGlobal'));
    for (const target of ['fGlobal', 'bGlobal', ...(id === 'qC' ? ['fC', 'bC'] : [])]) {
      const node = s.wire.closure.find(n => n.target.id === target); assert.ok(node, target);
      assert.deepEqual(node, f.view.ir.nodes.find(n => n.id === node.id));
    }
    if (id === 'qA') for (const target of ['fC', 'bC']) assert.ok(!s.wire.closure.some(n => n.target.id === target));
    assert.deepEqual(s.wire.omissions, envelope.omissions);
    const fields = s.wire.omissions.filter(o => o.target === assetNode.id).map(o => o.field);
    assert.deepEqual(fields, id === 'qA' ? ['reading_order', 'kernel.foundation_refs'] : ['reading_order']);
  }
  const whole = await read(f, 'qA', 'whole_asset'), declaration = whole.content.declarations.find(n => n.role === 'asset_declaration');
  assert.deepEqual(declaration.value.reading_order, f.asset.payload.reading_order);
  assert.deepEqual(declaration.value.kernel.foundation_refs, f.asset.payload.kernel.foundation_refs);
  assert.deepEqual(f.view, original); assert.equal(H(f.view.ir), originalHash);
});

test('D009 complement retains original relationship and full peer question without requesting peer body', async () => {
  const s = supply(fixture('complex'), 'qA'); await equalRead(s);
  assert.deepEqual(s.wire.relationships, s.view.ir.relationships.filter(r => r.id === 'rel1'));
  assert.ok(hasJudgment(s.wire, 'qA')); assert.ok(!hasJudgment(s.wire, 'qB')); assert.ok(!hasJudgment(s.wire, 'qC'));
  assert.deepEqual(s.wire.catalog, s.view.ir.catalog.filter(c => ['qA', 'qB'].includes(c.judgment_id)));
  const peer = s.wire.catalog.find(c => c.judgment_id === 'qB');
  assert.equal(peer.focus, s.asset.payload.judgments.find(j => j.id === 'qB').focus);
  assert.ok(!s.wire.closure.some(n => n.id === peer.node_ref));
  assert.deepEqual(s.wire.omissions.at(-1), { state: 'explicitly_omitted', target: peer.node_ref, field: 'judgment', reason: 'outside_selection', expandable: false, handle_id: null });
});

for (const kind of ['support', 'qualify']) test('D009 ' + kind + ' preserves metadata-only reverse direction and complete necessary forward direction', async () => {
  const f = fixture('coverage-basic', a => relation(a, kind)), [first, second] = f.asset.payload.judgments;
  const metadata = supply(f, first.id); await equalRead(metadata);
  assert.ok(!hasJudgment(metadata.wire, second.id));
  assert.deepEqual(metadata.wire.catalog.find(c => c.judgment_id === second.id), f.view.ir.catalog.find(c => c.judgment_id === second.id));
  assert.ok(metadata.wire.relationships.some(r => r.id === 'r2-relation'));
  const required = supply(f, second.id); await equalRead(required);
  for (const j of [first, second]) assert.deepEqual(required.wire.closure.find(n => n.role === 'judgment' && n.value.id === j.id).value, j);
});

test('D009 conflict supplies both full questions without duplicating either closure', async () => {
  const f = fixture('coverage-basic', a => relation(a, 'conflict'));
  for (const j of f.asset.payload.judgments.slice(0, 2)) {
    const s = supply(f, j.id); await equalRead(s);
    for (const peer of f.asset.payload.judgments.slice(0, 2)) assert.deepEqual(s.wire.closure.find(n => n.role === 'judgment' && n.value.id === peer.id).value, peer);
    assert.equal(new Set(s.wire.closure.map(n => n.id)).size, s.wire.closure.length);
  }
});

test('D009 required data dependency retains producer body and actual reference endpoints', async () => {
  const f = fixture('feedback', a => a.payload.dependencies.push({ id: 'observed-input', producer: { kind: 'judgment_result', judgment_ref: 'qSignal', result_contract_ref: 'qSignal-out' }, producer_port: 'result', consumer_judgment_ref: 'qAdjust', consumer_port: 'signal', input_role: 'signal', data_type: { term: 'number' }, required: true, purpose: 'Supply the declared observed input.' }));
  const s = supply(f, 'qAdjust'); await equalRead(s);
  for (const id of ['qSignal', 'qAdjust']) assert.ok(hasJudgment(s.wire, id));
  const ids = new Set(s.wire.closure.map(n => n.id));
  assert.deepEqual(s.wire.references, f.view.ir.references.filter(r => ids.has(r.source_node) && ids.has(r.target_node)));
});

test('D009 whole-object admission rejects separately tampered body, ordering, organization, catalog, relation, references and omissions', () => {
  const s = supply(fixture('complex', foundationScope), 'qA');
  const mutations = [
    ['node body', v => { v.closure.find(n => n.role === 'judgment').value.focus += ' forged'; }],
    ['node order', v => { v.closure.reverse(); }],
    ['required foundation body', v => { v.closure.find(n => n.target.id === 'fGlobal').value.statement = 'Forged foundation.'; }],
    ['required foundation absent', v => { v.closure = v.closure.filter(n => n.target.id !== 'fGlobal'); }],
    ['required boundary absent', v => { v.closure = v.closure.filter(n => n.target.id !== 'bGlobal'); }],
    ['original organization restored', v => { const i = v.closure.findIndex(n => n.role === 'asset_declaration'); v.closure[i] = clone(s.view.ir.nodes.find(n => n.id === v.closure[i].id)); }],
    ['foundation refs cleared', v => { v.closure.find(n => n.role === 'asset_declaration').value.kernel.foundation_refs = []; }],
    ['peer question', v => { v.catalog.find(c => c.judgment_id === 'qB').focus = 'Forged peer question.'; }],
    ['peer catalog absent', v => { v.catalog = v.catalog.filter(c => c.judgment_id !== 'qB'); }],
    ['relation absent', v => { v.relationships = []; }],
    ['relation statement', v => { v.relationships[0].statement = 'Forged relation.'; }],
    ['reference absent', v => { assert.ok(v.references.length); v.references.pop(); }],
    ['omissions absent', v => { v.omissions = []; }],
    ['omission order', v => { v.omissions.reverse(); }],
    ['omission false claim', v => { v.omissions[0].field = 'kernel.foundation_refs'; }],
  ];
  for (const [label, mutate] of mutations) {
    const changed = clone(s.wire); mutate(changed);
    assert.notEqual(H(changed), H(s.wire), label);
    assert.equal(E.admitRuntimeCapsule(changed, s.snapshot, s.plan).status, 'rejected', label);
  }
});

test('D009 Plan preserves complete original source and exact projected closure digest', () => {
  const s = supply(fixture('complex', foundationScope), 'qA');
  assert.deepEqual(s.planValue.source, { asset: s.view.asset, digests: s.view.digests, ir_digest: s.view.ir_digest });
  const raw = s.view.ir.mandatory_closures.find(c => c.selection.judgment_id === 'qA').node_ids.map(id => s.view.ir.nodes.find(n => n.id === id));
  assert.notEqual(H(raw), s.planValue.closure_digest);
  for (const mutate of [v => { v.source.ir_digest = H(s.wire.closure); }, v => { v.closure_digest = H(raw); }, v => { v.source.digests.A.observed = 'sha256:' + '0'.repeat(64); }, v => { v.selection.judgment_id = 'qC'; }]) {
    const changed = clone(s.planValue); mutate(changed); noBody(E.admitConsumptionPlan(changed, s.snapshot));
  }
  noBody(E.admitConsumptionPlan(s.planValue, clone(s.snapshot)), 'EXECUTION_SOURCE_UNATTESTED');
  noBody(E.admitRuntimeCapsule(s.wire, s.snapshot, clone(s.plan)), 'EXECUTION_SOURCE_UNATTESTED');
});

test('D009 unrelated source changes still invalidate original source binding even when selected context is identical', () => {
  const original = supply(fixture('complex'), 'qA');
  const changed = supply(fixture('complex', a => { a.payload.judgments.find(j => j.id === 'qC').focus += ' Changed unselected question.'; }), 'qA');
  assert.deepEqual(changed.wire.closure, original.wire.closure);
  assert.deepEqual(changed.wire.catalog, original.wire.catalog);
  assert.notEqual(changed.view.ir_digest, original.view.ir_digest);
  noBody(E.admitConsumptionPlan(original.planValue, changed.snapshot));
  noBody(E.admitRuntimeCapsule(original.wire, changed.snapshot, changed.plan));
});

test('D009 catalog and omissions are mandatory closed Capsule fields; old and mixed tuples do not migrate', () => {
  const s = supply(fixture('complex'), 'qA');
  for (const key of ['catalog', 'omissions']) { const changed = clone(s.wire); delete changed[key]; noBody(E.admitRuntimeCapsule(changed, s.snapshot, s.plan), 'EXECUTION_SCHEMA_INVALID'); }
  for (const value of [ { ...s.wire, contract: 'kdna.runtime-capsule/0.2.0' }, { ...s.wire, tuple: { ...tuple, runtime: 'kdna.runtime-capsule/0.2.0' } } ]) assert.equal(E.admitRuntimeCapsule(value, s.snapshot, s.plan).status, 'rejected');
});

test('D009 complete Capsule including catalog and omissions obeys exact byte budget without truncation', () => {
  const f = fixture('complex', foundationScope), initial = supply(f, 'qA');
  const bytes = Buffer.byteLength(JSON.stringify(initial.wire));
  const exact = supply(f, 'qA', { capsule_bytes: bytes }); assert.deepEqual(exact.wire, initial.wire);
  for (const capsule_bytes of [bytes - 1, 0]) {
    const plan = E.createConsumptionPlan(f.snapshot, { ...initial.options, budget: { ...initial.options.budget, capsule_bytes } }); assert.equal(plan.status, 'admitted');
    noBody(E.createRuntimeCapsule(f.snapshot, plan.plan), 'EXECUTION_BUDGET_EXCEEDED');
  }
});

test('D009 Host request digest binds full admitted Capsule including question catalog and omission ledger', () => {
  const s = supply(fixture('complex'), 'qA');
  const request = E.createAgentHostRequest(s.plan, s.capsule, { request_id: 'request:r2-execution', run_id: 'run:r2-execution', host_id: 'host:r2-execution', host_epoch: 'epoch:r2-execution' });
  assert.equal(request.status, 'admitted'); const wire = E.inspectAgentHostRequest(request.request);
  assert.equal(wire.capsule_digest, H(s.wire));
  for (const key of ['catalog', 'omissions']) {
    const changed = clone(s.wire); changed[key] = [];
    noBody(E.admitAgentHostRequest({ ...wire, capsule_digest: H(changed) }, s.plan, s.capsule));
  }
});

const external = (kind = 'material', id = 'outside-definition') => ({ kind, id, asset: { asset_id: 'outside', asset_version: 'v1', judgment_version: 'v1' } });
function externalQualification(judgment) {
  judgment.core_expression = { kind: 'authored', statement: 'An authored answer requiring the fixed external definition.', qualification_refs: [external()] };
}
async function rejectsRequiredExternal(f, healthy) {
  const response = await readResponse(f, healthy.selection.judgment_id);
  assert.equal(response.status, 'rejected'); assert.equal(response.content, null);
  assert.equal(response.diagnostics[0].code, 'READ_UNRESOLVED_EXTERNAL');
  for (const result of [
    E.createConsumptionPlan(f.snapshot, healthy.options),
    E.admitConsumptionPlan(healthy.planValue, f.snapshot),
    E.createRuntimeCapsule(f.snapshot, healthy.plan),
    E.admitRuntimeCapsule(healthy.wire, f.snapshot, healthy.plan),
  ]) {
    noBody(result, 'EXECUTION_UNRESOLVED_EXTERNAL');
    for (const key of ['plan', 'capsule', 'closure']) assert.equal(Object.hasOwn(result, key), false);
  }
}

test('D010 legitimate fixed external qualification stays Core-admitted but all complete Execution supply entries refuse it', async () => {
  const healthy = supply(fixture()), f = fixture('simple', a => externalQualification(a.payload.judgments[0]));
  assert.deepEqual(f.view.ir.unresolved_external, [{ source: { kind: 'judgment', id: 'pref' }, target: external(), mandatory: true }]);
  await rejectsRequiredExternal(f, healthy);
  await read(f, 'pref', 'catalog');
});

test('D010 an optional external reference of an actually supplied condition is not promoted to necessary content', async () => {
  const f = fixture('simple', a => {
    a.payload.conditions.push({ id: 'scoped-condition', owner_ref: external('judgment', 'outside-owner'), expression: { kind: 'interpreted', statement: 'A declared contextual condition with an external owner reference.' } });
    a.payload.judgments[0].core_expression = { kind: 'authored', statement: 'An answer qualified by the supplied condition.', qualification_refs: [{ kind: 'condition', id: 'scoped-condition' }] };
  });
  assert.deepEqual(f.view.ir.unresolved_external, [{ source: { kind: 'condition', id: 'scoped-condition' }, target: external('judgment', 'outside-owner'), mandatory: false }]);
  const s = supply(f); assert.ok(s.wire.closure.some(n => n.target.kind === 'condition' && n.target.id === 'scoped-condition'));
  await equalRead(s);
});

test('D010 another question required external source does not block this selection but blocks its own selection', async () => {
  const f = fixture('complex', a => externalQualification(a.payload.judgments.find(j => j.id === 'qC')));
  const selected = supply(f, 'qA'); await equalRead(selected);
  assert.ok(!hasJudgment(selected.wire, 'qC'));
  await rejectsRequiredExternal(f, supply(fixture('complex'), 'qC'));
});

test('D010 fixed-point closure checks a necessary component reached through another judgment relationship', async () => {
  const edit = a => relation(a, 'support'), healthyFixture = fixture('coverage-basic', edit);
  const selectedId = healthyFixture.asset.payload.judgments[1].id;
  const f = fixture('coverage-basic', a => { edit(a); a.payload.judgments[0].method.components[0].material_refs.push(external()); });
  const source = { kind: 'component', id: f.asset.payload.judgments[0].method.components[0].id };
  assert.deepEqual(f.view.ir.unresolved_external, [{ source, target: external(), mandatory: true }]);
  const closure = f.view.ir.mandatory_closures.find(c => c.selection.judgment_id === selectedId);
  assert.ok(closure.node_ids.some(id => { const n = f.view.ir.nodes.find(n => n.id === id); return n.target.kind === source.kind && n.target.id === source.id; }));
  await rejectsRequiredExternal(f, supply(healthyFixture, selectedId));
});

test('D010 unresolved source identity includes kind so an unrelated component sharing a selected judgment id does not block it', async () => {
  const f = fixture('complex', a => {
    const j = a.payload.judgments.find(j => j.id === 'qC'), c = j.method.components[0], old = c.id;
    c.id = 'qA'; c.material_refs.push(external());
    for (const unit of j.method.units ?? []) unit.component_refs = unit.component_refs.map(id => id === old ? c.id : id);
    for (const binding of j.method.bindings ?? []) if (binding.component_ref === old) binding.component_ref = c.id;
  });
  assert.ok(f.view.ir.unresolved_external.some(r => r.source.kind === 'component' && r.source.id === 'qA' && r.mandatory));
  await equalRead(supply(f, 'qA'));
  await rejectsRequiredExternal(f, supply(fixture('complex'), 'qC'));
});
