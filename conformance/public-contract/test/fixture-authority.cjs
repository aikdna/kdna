'use strict';
// Finite test authority, excluded from both RC package allowlists. No function
// accepts caller-supplied snapshot data. The only issuer input is a frozen seed ID.
const fs = require('node:fs');
const path = require('node:path');
const seed = JSON.parse(fs.readFileSync(path.join(__dirname, '../vectors.generated.json'), 'utf8'));
const cases = new Map(seed.vectors.map((v) => [v.id, structuredClone(v.input)]));
const clone = structuredClone;
function replace(root, key, value) {
  const parts = key.split('.'),
    last = parts.pop();
  let at = root;
  for (const part of parts) at = at[part];
  if (value?.$delete === true) delete at[last];
  else at[last] = clone(value);
}
function expandTuple(o) {
  if (o?.tuple_ref) {
    o.tuple = clone(seed.tuple_fixtures[o.tuple_ref]);
    delete o.tuple_ref;
  }
}
function resolve(id) {
  if (!cases.has(id)) throw new Error('Unknown frozen test case');
  const input = clone(cases.get(id));
  if (typeof input.fixture === 'string') {
    if (input.fixture !== 'admitted-a') throw new Error('Unknown fixture authority');
    input.fixture = clone(seed.fixtures[input.fixture]);
    for (const [key, value] of Object.entries(input.overrides ?? {}))
      if (key.endsWith('tuple_ref')) replace(input, key, value);
    expandTuple(input.request);
    expandTuple(input.fixture);
    for (const [key, value] of Object.entries(input.overrides ?? {}))
      if (!key.endsWith('tuple_ref')) replace(input, key, value);
    if (input.request.handle_ref) {
      if (input.request.handle_ref !== 'issued-handle:1') throw Error('Unknown handle');
      input.request.handle = clone(input.fixture.handle);
      delete input.request.handle_ref;
    }
  }
  expandTuple(input);
  if (input.content_entries_ref) {
    const [caseId, field] = input.content_entries_ref.split('.');
    input.content_entries = clone(cases.get(caseId)[field]);
  }
  return input;
}
function fixture(id, coreDir) {
  const input = resolve(id);
  if (!input.fixture) throw Error('Case does not name a Core fixture');
  const f = input.fixture,
    { evidence } = require(path.join(coreDir, 'src/public-contract/digests.js'));
  const nodes = [];
  const node = (id, role, value, owner = null) =>
    nodes.push({ id, role, value, owner_judgment_id: owner });
  node('decl:a', 'attribution', {
    state: 'provided',
    value: [{ role: 'creator', actor_ids: ['actor:fixture'], statement: 'Fixture assertion' }],
  });
  for (const item of f.catalog) {
    const n = item.judgment_id === 'j:1' ? 1 : 2;
    const contract = {
      id: 'contract:' + n,
      form: { term: 'statement' },
      shape: { kind: 'scalar', scalar_type: 'text' },
      minimum: 1,
      maximum: 1,
      allowed_result_types: [{ term: 'statement' }],
    };
    const result = {
      contract_ref: contract.id,
      result_type: { term: 'statement' },
      value: { kind: 'text', value: 'Fixture result' },
    };
    node(
      item.node_ref,
      'judgment',
      {
        id: item.judgment_id,
        focus: item.label,
        subject: { actor_ids: ['actor:fixture'], statement: 'Fixture subject' },
        scope: { statement: 'Fixture scope' },
        result_contract: contract,
        result,
      },
      item.judgment_id,
    );
    node('scope:' + n, 'scope', { statement: 'Fixture scope' }, item.judgment_id);
    if (n === 1)
      node(
        'boundary:1',
        'boundary',
        { id: 'b:1', effect: 'limit', statement: 'Fixture boundary', declared_by: 'actor:fixture' },
        item.judgment_id,
      );
    node('result:' + n, 'result', result, item.judgment_id);
  }
  node(
    'optional:1',
    'material',
    { id: 'm:optional', kind: 'example', statement: 'Fixture optional material', source_refs: [] },
    'j:1',
  );
  const ir = {
    contract: f.tuple.ir,
    tuple: f.tuple,
    asset: f.asset,
    nodes,
    catalog: f.catalog,
    references: [],
    relationships: [],
    mandatory_closures: Object.entries(f.mandatory_closures).map(([judgment_id, node_ids]) => ({
      selection: { asset_id: f.asset.asset_id, asset_version: f.asset.asset_version, judgment_id },
      node_ids,
    })),
    expansion_targets: f.expansion_targets,
  };
  // The current fixture is data-schema checked independently of its test witness.
  const { validate } = require(path.join(coreDir, 'src/public-contract/validate.js'));
  if (f.tuple.ir === seed.tuple_fixtures.new.ir) validate('CanonicalIR', ir);
  const view = {
    snapshot_id: f.snapshot_id,
    tuple: f.tuple,
    asset: f.asset,
    digests: { A: evidence('A', f.A), C: evidence('C', f.C), E: evidence('E', f.A) },
    ir,
    ir_digest: f.ir_digest,
    runtime_entry_names: f.runtime_entry_names,
    expansion_targets: f.expansion_targets,
  };
  const { issueSnapshot } = require(path.join(coreDir, 'src/public-contract/brand.js'));
  const snapshot =
    f.core_witness === 'ISSUED_BY_CORE_FIXTURE_AUTHORITY'
      ? issueSnapshot(view)
      : clone({ ...view, admission: {} });
  return { input, snapshot, view };
}
module.exports = { resolve, fixture };
