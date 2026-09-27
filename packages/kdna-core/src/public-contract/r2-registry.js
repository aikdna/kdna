'use strict';

const { canonicalJson, reject } = require('./strict-input.js');
const { sameAsset } = require('./cross-entry.js');

const ref = (kind, id) => ({ kind, id });
const key = target => canonicalJson([target.asset ?? null, target.kind, target.id]);
const values = declaration => declaration?.state === 'provided' ? declaration.value : [];
function fail(field = '/payload', subject = null) { reject('READ_CORE_INVALID', { field, subject }); }

// The registry records the author-owned object once. Neither an array position
// nor a globally unique bare string substitutes for a typed target identity.
function createRegistry(manifest, payload) {
  const asset = ref('asset', manifest.asset_uid), records = new Map(), ordered = [];
  const edges = new Map(), referenceRoles = new Map(), unresolved = [];
  const local = target => !target.asset || sameAsset(target.asset, payload.asset);
  const identity = target => key(local(target) ? ref(target.kind, target.id) : target);
  function add(kind, id, value, owner = asset, judgment = null, path = '/payload', activation = null) {
    const target = ref(kind, id), idKey = identity(target);
    if (records.has(idKey)) fail(path, id);
    const record = { target, owner, value, judgment, path, activation };
    records.set(idKey, record); ordered.push(record); edges.set(idKey, new Map()); referenceRoles.set(idKey,new Map());
    return record;
  }
  function get(target, kinds = null, field = '/payload') {
    if (!target || typeof target !== 'object' || typeof target.id !== 'string' || (kinds && ![].concat(kinds).includes(target.kind))) fail(field);
    if (!local(target)) return null;
    const record = records.get(identity(target));
    if (!record) fail(field, target.id);
    return record;
  }
  function link(from, target, mandatory = true, kinds = null, field = '/payload', referenceRole = null) {
    const record = get(target, kinds, field), fromKey = identity(from);
    if (!records.has(fromKey)) fail(field);
    if (!record) {
      const existing = unresolved.find(x => identity(x.source) === fromKey && identity(x.target) === identity(target));
      if (existing) existing.mandatory ||= mandatory;
      else unresolved.push({ source: from, target, mandatory });
      return null;
    }
    const list = edges.get(fromKey), targetKey = identity(target);
    list.set(targetKey, Boolean(list.get(targetKey) || mandatory));
    // Closure needs one boolean per endpoint pair; public references also retain
    // separately declared meanings such as a lifecycle replacement on that pair.
    const byTarget=referenceRoles.get(fromKey), roles=byTarget.get(targetKey)??new Map();
    roles.set(referenceRole,Boolean(roles.get(referenceRole)||mandatory));byTarget.set(targetKey,roles);
    return record;
  }
  function owned(kind, object, owner, judgment, path, activation = null) {
    return add(kind, object.id, object, owner, judgment, path, activation);
  }
  add('asset', manifest.asset_uid, null, asset, null, '/manifest');
  for (const [kind, collection] of [['actor','actors'], ['material','materials'], ['reason','reasons'], ['source','sources'], ['source_use','source_uses'], ['resource','resources'], ['relationship','relationships'], ['dependency','dependencies'], ['contract','contracts'], ['condition','conditions'], ['shared_declaration','shared_declarations'], ['example','examples']]) {
    for (const [i, value] of (payload[collection] ?? []).entries()) owned(kind, value, asset, null, '/payload/' + collection + '/' + i);
  }
  function restrictions(holder, owner, judgment, path, isAsset = false) {
    for (const b of values(holder.boundaries)) owned('boundary', b, owner, judgment, path + '/boundaries', { kind:'always' });
    for (const e of isAsset ? payload.exceptions : values(holder.exceptions)) {
      const exception = owned('exception', e, owner, judgment, path + '/exceptions');
      if (e.effect.kind === 'replace_limit') owned('boundary', e.effect.replacement, exception.target, judgment, path + '/exceptions/replacement', { kind:'exception', exception_ref:exception.target });
    }
    for (const m of isAsset ? payload.misuse : values(holder.misuse)) owned('misuse', m, owner, judgment, path + '/misuse');
  }
  restrictions(payload.declarations, asset, null, '/payload/declarations', true);
  for (const [i, judgment] of payload.judgments.entries()) {
    const at = '/payload/judgments/' + i, target = ref('judgment', judgment.id);
    owned('judgment', judgment, asset, judgment.id, at);
    owned('contract', judgment.result_contract, target, judgment.id, at + '/result_contract');
    if (judgment.result) add('result', judgment.id, judgment.result, target, judgment.id, at + '/result');
    for (const component of judgment.method.components) owned('component', component, target, judgment.id, at + '/method/components');
    for (const unit of judgment.method.units ?? []) owned('unit', unit, target, judgment.id, at + '/method/units');
    if (judgment.method.plan) {
      const plan = owned('plan', judgment.method.plan, target, judgment.id, at + '/method/plan');
      for (const node of plan.value.nodes) owned('plan_node', node, plan.target, judgment.id, at + '/method/plan/nodes');
    }
    if (judgment.formation_rule?.policy) {
      const policy = owned('policy', judgment.formation_rule.policy, target, judgment.id, at + '/formation_rule/policy');
      for (const entry of policy.value.entries) owned('branch_entry', entry, policy.target, judgment.id, policy.path + '/entries');
      for (const candidate of policy.value.candidates) owned('candidate', candidate, policy.target, judgment.id, policy.path + '/candidates');
    }
    restrictions(judgment, target, judgment.id, at);
  }
  for (const example of payload.examples) for (const result of example.results) owned('example_result', result, ref('example', example.id), null, '/payload/examples/results');
  for (const revision of manifest.history.entries) owned('revision', revision, asset, null, '/manifest/history/entries');
  function qualified(value) {
    if (value.kind === 'local') return ref('judgment', value.judgment_id);
    return { kind:'judgment', id:value.judgment_id, asset:value.asset };
  }
  function closure(seeds) {
    const selected = new Set(), queue = seeds.map(identity);
    for (let i = 0; i < queue.length; i++) {
      const current = queue[i];
      if (selected.has(current)) continue;
      if (!records.has(current)) fail();
      selected.add(current);
      for (const [next, mandatory] of edges.get(current)) if (mandatory) queue.push(next);
    }
    return ordered.filter(r => selected.has(identity(r.target)));
  }
  return { asset, records, ordered, edges, referenceRoles, unresolved, identity, local, add, get, link, qualified, closure };
}

module.exports = { createRegistry, ref, key, values, fail };
