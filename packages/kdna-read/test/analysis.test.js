'use strict';
// Controlled synthetic fixtures through actual public Core and Read, not a user/model study.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { bindDependencyPorts } = require('./r2-test-model.js');
const F = require('../../../conformance/public-contract/test/bytes-fixtures.cjs');
const runtime = process.env.KDNA_PUBLIC_RUNTIME || path.resolve(__dirname, '../../..');
const { req, coreDir } = F.runtime(runtime);
const core = req('@aikdna/kdna-core');
const { packSourceBytes } = req('@aikdna/kdna-core/authoring-node');
const { readBrowser } = req('@aikdna/kdna-read/browser');
const embedding = req('@aikdna/kdna-read/embedding');
const { summarizeRead, compareReadSelections } = require('../src/analysis.js');
const tuple = require(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
const clone = value => JSON.parse(JSON.stringify(value));

function synthetic(count = 1) {
  const asset = F.blank(tuple, count);
  asset.manifest.title = 'Synthetic Read analysis fixture, not real user/model evidence';
  return asset;
}
async function read(asset, { mode = 'exact_selection', id = 'j:0', bytes = F.encode(bindDependencyPorts(asset), req) } = {}) {
  const admitted = core.admitBytes(bytes); assert.equal(admitted.status, 'accepted', JSON.stringify(admitted));
  let decision = 0;
  const control = embedding.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 1000000 }));
  const host = embedding.createTrustedHostReadProvider({ observe: ({ request, snapshot }) => ({
    host_id: 'synthetic:analysis-host', host_epoch: 'synthetic:epoch', decision_id: 'synthetic:decision:' + (++decision), request_id: request.request_id,
    snapshot_id: snapshot.snapshot_id, A: snapshot.digests.A.observed, C: snapshot.digests.C.observed, scope: snapshot.ir.nodes.map(node => node.id),
    issued_at: 900, expires_at: 2000, current_ms: 1000, decision: 'allow', policy_id: 'synthetic:read-only'
  }) });
  const request = F.candidate(tuple, asset, mode, id);
  const result = await readBrowser(admitted.snapshot, request, control, host);
  assert.equal(result.channel, 'read_envelope');
  return { envelope: result.envelope, snapshot: admitted.snapshot, host, control, request, bytes };
}
async function revised(asset, before, mutate, version = '1.0.1') {
  const next = clone(asset);
  next.manifest.version = version; next.manifest.updated_at = '2026-09-17T00:00:00Z'; next.payload.asset.asset_version = version;
  mutate(next);
  const packed = packSourceBytes(before.bytes, { manifest: next.manifest, payload: next.payload });
  assert.equal(packed.status, 'accepted', JSON.stringify(packed));
  return read(next, { bytes: packed.bytes });
}
function assertDataOnly(value) {
  assert.equal(value.authority.proof, 'data-only-not-new-acceptance');
  assert.equal(value.authority.action_authorization, 'not_evaluated');
  assert.equal(value.authority.current_run_results, 'not_evaluated');
  assert.equal(value.authority.identity, 'not_verified');
}

test('synthetic: summary keeps static authored results distinct from current-task results', async () => {
  const { envelope } = await read(synthetic());
  const summary = summarizeRead(envelope);
  assert.equal(summary.status, 'summarized'); assert.equal(summary.scope.kind, 'selected-closure');
  assert.equal(summary.judgments[0].static_result_declared, true);
  assert.equal(summary.judgments[0].current_run_result, 'not_evaluated');
  assertDataOnly(summary); assert.ok(Object.isFrozen(summary.judgments[0]));
});

test('synthetic: retired display labels stay absent instead of being invented from the question', async () => {
  const asset = synthetic(); delete asset.payload.judgments[0].label;
  const { envelope } = await read(asset), summary = summarizeRead(envelope);
  assert.equal(Object.hasOwn(summary.judgments[0], 'label'), false);
  assert.equal(summary.judgments[0].question, asset.payload.judgments[0].focus);
  assert.deepEqual(JSON.parse(JSON.stringify(summary)), summary);
});

test('synthetic: version-only outer node/reference id drift does not become a domain-content change', async () => {
  const asset = synthetic(), before = await read(asset), after = await revised(asset, before, () => {});
  assert.notEqual(before.envelope.content.closure[0].id, after.envelope.content.closure[0].id);
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.domain_content.changed, false);
  assert.equal(comparison.shared_declarations.changed, false);
  assert.equal(comparison.metadata.changed, true, 'Versions are retained as metadata.');
  assert.equal(comparison.supply_scope.changed, false);
  assertDataOnly(comparison); assert.equal(comparison.comparison_rules.behavioral_equivalence, 'not-evaluated');
});

test('synthetic: new shared declarations are separate from unchanged domain rules and metadata', async () => {
  const asset = synthetic(), before = await read(asset);
  const after = await revised(asset, before, next => {
    next.payload.shared_declarations = [{ id: 'worldview:synthetic', kind: 'worldview', value: ['Absence is not a negative observation in this fixture.'], subject: { actor_ids: [], statement: 'Synthetic author scope' }, applies_to: { kind: 'asset' } }];
  });
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.domain_content.changed, false);
  assert.equal(comparison.shared_declarations.changed, true);
  assert.equal(comparison.metadata.changed, true);
  assert.equal(comparison.supply_scope.changed, true);
  assert.ok(comparison.shared_declarations.changes.some(change => change.after?.value?.value?.[0] === 'Absence is not a negative observation in this fixture.'));
  assert.ok(summarizeRead(after.envelope).shared_declarations.some(node => node.value.id === 'worldview:synthetic'));
});

test('synthetic: actor/creator changes are review-relevant attribution claims, never harmless metadata', async () => {
  const asset = synthetic();
  asset.manifest.creator = { kind: 'agent', name: 'Synthetic original creator' };
  asset.payload.actors = [{ id: 'actor:synthetic', kind: 'agent', name: 'Synthetic original actor' }];
  asset.payload.judgments[0].subject.actor_ids = ['actor:synthetic'];
  const before = await read(asset), after = await revised(asset, before, next => {
    next.payload.actors[0].name = 'Changed synthetic actor';
    next.manifest.creator.name = 'Changed synthetic creator';
  });
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.domain_content.changed, false);
  assert.equal(comparison.metadata.changed, true);
  assert.equal(comparison.metadata.review_required, true);
  assert.equal(comparison.comparison_rules.metadata_is_harmless, false);
  assert.equal(comparison.comparison_rules.unchanged_domain_implies_behavioral_equivalence, false);
  assert.match(comparison.metadata.interpretation, /authorship or authority claims/);
  assert.ok(summarizeRead(after.envelope).authorship_and_authority_claims.nodes.some(node => node.role === 'actor' && node.value.name === 'Changed synthetic actor'));
  assertDataOnly(comparison);
});

test('synthetic: changed declarer references remain visible in full shared declarations', async () => {
  const asset = synthetic();
  asset.payload.actors = [{ id: 'actor:first', kind: 'agent', name: 'Synthetic first' }, { id: 'actor:second', kind: 'agent', name: 'Synthetic second' }];
  asset.payload.declarations.boundaries = { state: 'provided', value: [{ id: 'boundary:synthetic', effect: 'limit', statement: 'Synthetic authorship boundary.', declared_by: 'actor:first', applies_to: { kind: 'asset' }, exception_refs: [] }] };
  const before = await read(asset), after = await revised(asset, before, next => { next.payload.declarations.boundaries.value[0].declared_by = 'actor:second'; });
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.shared_declarations.changed, true);
  const declaration = comparison.shared_declarations.changes.find(change => change.after?.role === 'boundary');
  assert.equal(declaration.before.value.declared_by, 'actor:first');
  assert.equal(declaration.after.value.declared_by, 'actor:second');
  assert.equal(comparison.comparison_rules.behavioral_equivalence, 'not-evaluated');
});

test('synthetic: complete body changes, nested contract ids and references are never stripped', async () => {
  const asset = synthetic(), before = await read(asset);
  const after = await revised(asset, before, next => {
    next.payload.judgments[0].result_contract.id = 'result-contract:renamed';
    next.payload.judgments[0].result.contract_ref = 'result-contract:renamed';
    next.payload.judgments[0].result.value.value = 'A genuinely changed synthetic authored result.';
  });
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.domain_content.changed, true);
  const judgment = comparison.domain_content.changes.find(change => change.after?.role === 'judgment');
  assert.equal(judgment.before.value.result.contract_ref, 'result-contract:0');
  assert.equal(judgment.after.value.result.contract_ref, 'result-contract:renamed');
  assert.equal(judgment.after.value.result.value.value, 'A genuinely changed synthetic authored result.');
  assert.ok(comparison.domain_content.changes.some(change => change.key.startsWith('reference:')));
});

test('synthetic: required and optional dependencies report only disclosed producers and no execution', async () => {
  const asset = synthetic(3);
  delete asset.payload.judgments[1].result;
  // R2: removing the result must also move the issue to the rule form and
  // restate the asset capability, because the closed form and the asset-level
  // summary are both checked by Core admission now.
  asset.payload.judgments[1].form = 'rule';
  asset.payload.asset_capability = 'mixed';
  asset.payload.judgments[1].formation_rule = { statement: 'A supplied synthetic producer rule, not an executed result.', condition_refs: [], output_contract_ref: 'result-contract:1' };
  asset.payload.dependencies = [true, false].map((required, index) => ({ id: 'dependency:' + index, producer: { kind: 'judgment_result', judgment_ref: 'j:' + (index + 1), result_contract_ref: 'result-contract:' + (index + 1) }, consumer_judgment_ref: 'j:0', input_role: required ? 'necessary-result' : 'optional-result', data_type: { term: 'text' }, required, purpose: 'A separately evaluated prior outcome would be needed, not merely loading its definition.' }));
  const first = await read(asset), initial = summarizeRead(first.envelope);
  assert.equal(initial.scope.dependency_inventory, 'disclosed-only'); assert.equal(initial.scope.expansion_available, true);
  assert.equal(initial.dependencies.length, 1); assert.equal(initial.dependencies[0].required, true);
  assert.equal(initial.dependencies[0].producer_definition_supplied, true);
  assert.equal(initial.dependencies[0].producer_formation_rule_supplied, true);
  assert.equal(initial.dependencies[0].producer_static_result_declared, false);
  const expanded = await readBrowser(first.snapshot, { ...first.request, mode: 'expand', handle: first.envelope.content.expansion_handles[0] }, first.control, first.host);
  assert.equal(expanded.envelope.status, 'ready');
  const summary = summarizeRead(expanded.envelope);
  assert.equal(summary.dependencies.length, 2);
  const optional = summary.dependencies.find(item => !item.required);
  assert.equal(optional.producer_static_result_declared, true); assert.equal(optional.current_run_result, 'not_evaluated');
  const comparison = compareReadSelections(first.envelope, expanded.envelope);
  assert.equal(comparison.supply_scope.changed, true);
  assert.equal(comparison.supply_scope.opaque_target_equivalence, 'not-established');
  assertDataOnly(comparison);
});

test('synthetic: unresolved omitted wrapper ids do not justify a cross-version scope equivalence claim', async () => {
  const asset = synthetic(2);
  asset.payload.dependencies = [{ id:'dependency:optional', producer:{kind:'judgment_result',judgment_ref:'j:1',result_contract_ref:'result-contract:1'}, consumer_judgment_ref:'j:0', input_role:'context', data_type:{term:'text'}, required:false, purpose:'Disclosed optional producer keeps an opaque unsupplied scope.' }];
  const before = await read(asset), after = await revised(asset, before, () => {});
  const comparison = compareReadSelections(before.envelope, after.envelope);
  assert.equal(comparison.domain_content.changed, false);
  // R2 expansion anchors retain the exact asset version, so this visible binding
  // changes while opaque target equivalence remains unproved. Within the same
  // version even identical supplied data cannot prove opaque target equivalence.
  assert.equal(comparison.supply_scope.changed, true);
  assert.equal(comparison.supply_scope.observed_shape_changed, true);
  assert.equal(compareReadSelections(before.envelope, before.envelope).supply_scope.changed, null);
  assert.equal(comparison.supply_scope.opaque_target_equivalence, 'not-established');
  assert.ok(comparison.supply_scope.unresolved_targets.before > 0);
});

for (const mode of ['whole_asset', 'catalog']) test('synthetic: ' + mode + ' unselected closure cannot be passed off as a selected-content comparison', async () => {
  const { envelope } = await read(synthetic(), { mode });
  assert.equal(envelope.content.closure.filter(node => node.role === 'judgment').length, 0);
  assert.equal(envelope.content.selected, null);
  assert.equal(summarizeRead(envelope).scope.kind, 'unselected-catalog-or-declarations');
  assert.throws(() => compareReadSelections(envelope, envelope), { code: 'READ_ANALYSIS_SELECTED_CONTENT_REQUIRED' });
});

test('synthetic: cross-asset, different-selection and invalid tuple inputs are rejected', async () => {
  const asset = synthetic(2), first = await read(asset), second = await read(asset, { id: 'j:1' });
  assert.throws(() => compareReadSelections(first.envelope, second.envelope), { code: 'READ_ANALYSIS_SELECTION_MISMATCH' });
  const other = synthetic(); other.manifest.asset_id = 'asset:other'; other.manifest.asset_uid = 'uid:other'; other.payload.asset.asset_id = 'asset:other';
  const foreign = await read(other);
  assert.throws(() => compareReadSelections(first.envelope, foreign.envelope), { code: 'READ_ANALYSIS_ASSET_MISMATCH' });
  const wrongTuple = clone(first.envelope); wrongTuple.tuple.read = 'kdna.read/999.0.0';
  assert.throws(() => compareReadSelections(first.envelope, wrongTuple), { code: 'READ_ANALYSIS_ENVELOPE_INVALID' });
});

test('synthetic: official rejected envelopes summarize unavailable and cannot compare content', async () => {
  const { envelope } = await read(synthetic(), { id: 'j:missing' });
  assert.notEqual(envelope.status, 'ready');
  const summary = summarizeRead(envelope); assert.equal(summary.status, 'unavailable'); assertDataOnly(summary);
  assert.throws(() => compareReadSelections(envelope, envelope), { code: 'READ_ANALYSIS_READY_REQUIRED' });
});

test('synthetic: hostile getters, symbols, cycles, nonfinite values and forged envelope fields cannot cross the clone/schema boundary', async () => {
  const { envelope } = await read(synthetic());
  let calls = 0; const hostile = clone(envelope);
  Object.defineProperty(hostile.content.closure[0], 'value', { enumerable: true, get() { calls++; return {}; } });
  assert.throws(() => summarizeRead(hostile), { code: 'READ_ANALYSIS_INPUT_INVALID' }); assert.equal(calls, 0);
  for (const mutate of [value => { value[Symbol('hidden')] = true; }, value => { value.content.extra = value; }, value => { value.budget.limit_bytes = Infinity; }]) {
    const bad = clone(envelope); mutate(bad); assert.throws(() => summarizeRead(bad), { code: 'READ_ANALYSIS_INPUT_INVALID' });
  }
  assert.throws(() => summarizeRead({ ...envelope, action_authorization: 'approved' }), { code: 'READ_ANALYSIS_ENVELOPE_INVALID' });
  assert.throws(() => summarizeRead({ envelope }), { code: 'READ_ANALYSIS_ENVELOPE_INVALID' });
});

test('synthetic: input/output mutation isolation and CJS/ESM parity', async () => {
  const { envelope } = await read(synthetic());
  const source = clone(envelope), summary = summarizeRead(source), originalQuestion = summary.judgments[0].question;
  source.content.closure.find(node => node.role === 'judgment').value.focus = 'Mutated after summary';
  assert.equal(summary.judgments[0].question, originalQuestion);
  assert.throws(() => { summary.judgments[0].question = 'Mutated output'; }, TypeError);
  const esm = await import('../src/analysis.mjs');
  assert.deepEqual(esm.summarizeRead(envelope), summarizeRead(envelope));
  assert.equal(esm.compareReadSelections(envelope, envelope).domain_content.changed, false);
});

test('synthetic: role/owner changes are retained and ambiguous source identities or dangling references are not guessed', async () => {
  const { envelope } = await read(synthetic());
  const ambiguous = clone(envelope), node = ambiguous.content.closure.find(item => item.role === 'method_component' && item.owner_judgment_id === 'j:0');
  ambiguous.content.closure.push({ ...clone(node), id: 'synthetic:ambiguous-wrapper' });
  assert.throws(() => summarizeRead(ambiguous), { code: 'READ_ANALYSIS_SOURCE_AMBIGUOUS' });
  const dangling = clone(envelope); dangling.content.references[0].target_node = 'synthetic:missing-wrapper';
  assert.throws(() => compareReadSelections(envelope, dangling), { code: 'READ_ANALYSIS_REFERENCE_UNRESOLVED' });
  const altered = clone(envelope), scope = altered.content.closure.find(item => item.role === 'method_component' && item.owner_judgment_id === 'j:0');
  scope.owner_judgment_id = 'j:other';
  assert.equal(compareReadSelections(envelope, altered).domain_content.changed, true, 'Data comparison observes owner changes without pretending to re-admit the edited envelope.');
});
