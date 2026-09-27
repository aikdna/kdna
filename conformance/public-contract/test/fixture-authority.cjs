'use strict';
// Finite test authority, excluded from both RC package allowlists. No function
// accepts caller-supplied snapshot data. The only issuer input is a frozen seed ID.
const fs = require('node:fs');
const path = require('node:path');
const seed = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../public-contract-decision-vectors.json'), 'utf8'),
);
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
  const f = input.fixture;
  const { createRequire } = require('node:module'),
    req = createRequire(path.join(coreDir, 'package.json'));
  const F = require('./bytes-fixtures.cjs');
  // The seed names a complete current authored source. Core computes every Ref,
  // owner, closure, index, digest and stable wrapper id before test premises.
  const bytes = F.encode(f.authored_asset, req);
  const admitted = req('@aikdna/kdna-core').admitBytes(bytes);
  if (admitted.status !== 'accepted')
    throw Error('Fixture source rejected: ' + JSON.stringify(admitted));
  const view = req('@aikdna/kdna-core/read-boundary').inspectSnapshot(admitted.snapshot);
  const { validate } = require(path.join(coreDir, 'src/public-contract/validate.js'));
  validate('CanonicalIR', view.ir);
  const schemaControls = [];
  for (const field of ['target', 'owner', 'asset_index', 'asset_closure']) {
    const invalid = clone(view.ir);
    if (field === 'target' || field === 'owner') delete invalid.nodes[0][field];
    else delete invalid[field];
    let rejected = false;
    try {
      validate('CanonicalIR', invalid);
    } catch {
      rejected = true;
    }
    if (!rejected) throw Error('Current IR schema failed to reject missing ' + field);
    schemaControls.push({ missing: field, rejected: true });
  }
  const { canonicalJson } = require(path.join(coreDir, 'src/public-contract/strict-input.js'));
  const same = (a, b) => canonicalJson(a) === canonicalJson(b);
  if (!Object.keys(view.tuple).every((k) => view.tuple[k] === seed.tuple_fixtures.new[k]))
    throw Error('Current seed tuple drift');
  const byAlias = new Map(),
    byId = new Map();
  for (const alias of f.node_aliases) {
    const nodes = view.ir.nodes.filter((n) => same(n.target, alias.target));
    if (nodes.length !== 1 || byAlias.has(alias.id) || byId.has(nodes[0].id))
      throw Error('Fixture alias is not unique');
    byAlias.set(alias.id, nodes[0].id);
    byId.set(nodes[0].id, alias.id);
  }
  if (byId.size !== view.ir.nodes.length) throw Error('Fixture alias inventory incomplete');
  const actualId = (id) => {
    if (!byAlias.has(id)) throw Error('Unknown named fixture node ' + id);
    return byAlias.get(id);
  };
  f.host.scope = f.host.scope.map(actualId);
  f.handle = {
    asset_id: view.asset.asset_id,
    asset_version: view.asset.asset_version,
    A: view.digests.A.observed,
    C: view.digests.C.observed,
    snapshot_id: view.snapshot_id,
    ...f.handle,
    scope: f.handle.scope.map(actualId),
  };
  if (input.request.handle) input.request.handle = clone(f.handle);
  const snapshot =
    f.core_witness === 'ISSUED_BY_CORE_FIXTURE_AUTHORITY'
      ? admitted.snapshot
      : clone({ ...view, admission: {} });
  return {
    input,
    snapshot,
    view,
    aliasId: (id) => byId.get(id) ?? id,
    setup: {
      source_admission: 'accepted',
      source_bytes: bytes.length,
      core_calls: 1,
      canonical_ir_schema: 'valid',
      negative_schema_controls: schemaControls,
      ir_digest: view.ir_digest,
      A: view.digests.A.observed,
      C: view.digests.C.observed,
      actual_tuple: view.tuple,
      declared_premise_tuple: f.tuple,
      identity: 'real_core_snapshot_ids_preserved',
      proof_limit:
        'This builds the test premise; mocked pipeline admission and finite handle registry cases remain explicit stage tests.',
    },
  };
}
module.exports = { resolve, fixture };
