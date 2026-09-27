'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto');
const F = require('./bytes-fixtures.cjs');
const runtimeRoot = process.argv[2],
  out = process.argv[3];
if (!path.isAbsolute(runtimeRoot) || !path.isAbsolute(out))
  throw Error('Explicit runtime and output required');
const { req, coreDir, readDir } = F.runtime(runtimeRoot),
  core = req('@aikdna/kdna-core'),
  node = req('@aikdna/kdna-core/node'),
  read = req('@aikdna/kdna-read'),
  readNode = req('@aikdna/kdna-read/node').readNode,
  embed = req('@aikdna/kdna-read/embedding'),
  boundary = req('@aikdna/kdna-core/read-boundary');
const ci = (n) =>
    require(
      path.join(coreDir, 'src/public-contract', n + (n === 'generated-contract' ? '.json' : '.js')),
    ),
  ri = (n) => require(path.join(readDir, 'src', n + '.js'));
const tuple = ci('generated-contract').versionTuple,
limits = ci('generated-contract').resource_limits,
u = ri('util'),
S = ci('strict-input'),
D = ci('digests');
const controls = () =>
  embed.createTrustedReadControlProvider(() => ({ admission_response_limit_bytes: 1000000 }));
const rows = [],
  started = new Date().toISOString();
async function check(id, obligation, run, route = 'real_bytes_parser') {
  const start = new Date().toISOString();
  try {
    const detail = await run();
    rows.push({
      id,
      obligation,
      route,
      status: 'MATCH',
      started_at: start,
      ended_at: new Date().toISOString(),
      detail: detail ?? null,
    });
  } catch (error) {
    rows.push({
      id,
      obligation,
      route,
      status: 'FAIL',
      started_at: start,
      ended_at: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    });
  }
}
function accepted(asset, options) {
  const bytes = F.encode(asset, req, options),
    result = core.admitBytes(bytes);
  assert.equal(result.status, 'accepted', JSON.stringify(result));
  return {
    bytes,
    result,
    snapshot: result.snapshot,
    view: boundary.inspectSnapshot(result.snapshot),
  };
}
function rejected(asset, reason = 'READ_CORE_INVALID', options) {
  const bytes = F.encode(asset, req, options),
    result = core.admitBytes(bytes);
  assert.equal(result.status, 'rejected');
  assert.equal(result.reason, reason);
  return { bytes: bytes.length, A: D.digest(bytes), result };
}
// R2 fails closed on unsupported critical extensions. No snapshot, catalog-only
// carrier or disclosed body may be manufactured from that rejected asset.
function interpretationBlocked(asset, options) {
  const bytes = F.encode(asset, req, options), result = core.admitBytes(bytes);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.equal(result.reason, 'READ_UNSUPPORTED_CRITICAL');
  assert.equal(Object.hasOwn(result, 'snapshot'), false);
  assert.deepEqual(result.states, { core: 'valid', interpretation: 'blocked' });
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].code, 'READ_UNSUPPORTED_CRITICAL');
  return { bytes: bytes.length, A: D.digest(bytes), result };
}
// R10 (`specs/read-contract.md:456-476`, normative on this line) makes a homogeneous
// omission set recordable either per entry or as one `OmissionBatch` count record, and
// `specs/read-contract.md:460` keeps both encodings legal. The obligation a case here
// records is the projection decision, so it holds in either encoding; a folded record
// must still be a legal batch, and it is tied to the target kind of the identity it
// replaced because a batch never names identities (`specs/read-contract.md:464`).
function omittedForReason(envelope, target, reason, targetKind) {
  const kinds = readSchema.$defs.OmissionTargetKind.enum,
    reasons = readSchema.$defs.OmissionBatchReason.enum;
  return envelope.omissions.some((record) => {
    if (record.state === 'explicitly_omitted') return record.target === target && record.reason === reason;
    return (
      record.state === 'explicitly_omitted_batch' &&
      record.target_kind === targetKind &&
      record.field === targetKind &&
      record.reason === reason &&
      kinds.includes(record.target_kind) &&
      reasons.includes(record.reason) &&
      Number.isInteger(record.count) &&
      record.count >= 2 &&
      typeof record.expandable === 'boolean' &&
      (record.handle_id === null || typeof record.handle_id === 'string')
    );
  });
}
function host(callback, deliver) {
  let count = 0;
  const provider = embed.createTrustedHostReadProvider({
    observe: ({ request, snapshot }) => {
      count++;
      const data = {
        host_id: 'host:bytes',
        host_epoch: 'epoch:1',
        decision_id: 'decision:' + count,
        request_id: request.request_id,
        snapshot_id: snapshot.snapshot_id,
        A: snapshot.digests.A.observed,
        C: snapshot.digests.C.observed,
        scope: snapshot.ir.nodes.map((n) => n.id),
        issued_at: 900,
        expires_at: 2000,
        current_ms: 1000,
        decision: 'allow',
        policy_id: 'policy:bytes',
      };
      return callback ? callback(data, count, request, snapshot) : data;
    },
    ...(deliver ? { deliver } : {}),
  });
  return { provider, count: () => count };
}
function project(snapshot, request) {
  const admission = read.admitReadRequest(request, controls());
  assert.equal(admission.channel, 'admitted_request');
  const result = read.project(admission.admitted_request, snapshot);
  assert.equal(result.status, 'projected', JSON.stringify(result));
  return result;
}
function assertBudget(result) {
  const e = result.envelope;
  assert.ok(e);
  assert.equal(Number(e.budget.actual_bytes), Buffer.byteLength(S.canonicalJson(e)));
  assert.equal(e.budget.actual_bytes.length, 16);
  return Number(e.budget.actual_bytes);
}
function addDependency(asset, { id, producer, consumer, role, required, purpose }) {
  const from = asset.payload.judgments.find((j) => j.id === producer);
  const to = asset.payload.judgments.find((j) => j.id === consumer);
  const contract = { kind: 'contract', id: from.result_contract.id };
  const output = 'output:' + id, input = 'input:' + id;
  from.ports.push({ name: output, meaning: 'Declared result output.', direction: 'output', contract_ref: contract, result_field: null });
  to.inputs.push({ name: role, meaning: purpose, contract_ref: contract });
  to.ports.push({ name: input, meaning: purpose, direction: 'input', input_role: role, contract_ref: contract });
  asset.payload.dependencies.push({ id, producer: { kind: 'judgment_result', judgment_ref: producer, result_contract_ref: from.result_contract.id }, producer_port: output, consumer_judgment_ref: consumer, consumer_port: input, input_role: role, data_type: { term: 'text' }, required, purpose });
}
function optionalAsset() {
  const a = F.blank(tuple, 2);
  addDependency(a, { id: 'dependency:optional', producer: 'j:1', consumer: 'j:0', role: 'context', required: false, purpose: 'Optional source judgment' });
  return a;
}
function addException(asset, judgmentId, assetOwned = false) {
  const p = asset.payload, judgment = p.judgments.find(j => j.id === judgmentId);
  const scope = { kind: 'judgments', judgment_refs: [judgmentId] };
  const b = { id: 'boundary:required', effect: 'limit', statement: 'Required qualification', declared_by: 'actor:boundary', applies_to: scope, exception_refs: ['exception:selected'] };
  const e = { id: 'exception:selected', statement: 'Explicit conditional exception', boundary_ref: b.id, applies_to: scope, when: { kind: 'condition', id: 'condition:exception' }, effect: { kind: 'waive' } };
  p.actors.push({ id: 'actor:boundary', kind: 'person', name: 'Engineering boundary author' });
  if (assetOwned) p.declarations.boundaries = { state: 'provided', value: [b] };
  else judgment.boundaries = { state: 'provided', value: [b] };
  judgment.exceptions = { state: 'provided', value: [e] };
  p.conditions.push({ id: 'condition:exception', owner_ref: { kind: 'exception', id: e.id }, expression: { kind: 'interpreted', statement: 'Author-supplied qualification, never evaluated by Core or Read.' } });
  return { boundary: b, exception: e };
}
const schema = req('ajv/dist/2020.js');
const ajv = new schema({ strict: false, validateFormats: false });
// Published packages retain historical schemas. Select the single schema whose
// complete tuple matches the runtime under test, never an arbitrary first file.
const readSchemaFiles = JSON.parse(
  fs.readFileSync(path.join(readDir, 'package.json'), 'utf8'),
).files.filter((file) => /^schema\/read-contract-.*\.schema\.json$/.test(file));
const currentReadSchemas = readSchemaFiles.map((file) => JSON.parse(fs.readFileSync(path.join(readDir, file))))
  .filter((schema) => {
    const properties = schema.$defs?.VersionTuple?.properties;
    return properties && Object.keys(properties).length === Object.keys(tuple).length &&
      Object.entries(tuple).every(([key, value]) => properties[key]?.const === value);
  });
assert.equal(currentReadSchemas.length, 1, 'the Read package must publish exactly one schema for the current complete tuple');
const readSchema = currentReadSchemas[0];
delete readSchema.$id;
readSchema.$ref = '#/$defs/ReadCallResult';
const validateRead = ajv.compile(readSchema);
async function main() {
  const retention = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../ir-retention-vectors.generated.json')),
  );
  for (const test of retention.cases)
    await check(test.id, 'PUBLIC-MODES', async () => {
      const variants = [];
      for (const variant of test.variants) {
        const asset = optionalAsset();
        for (const key of ['content_risk', 'extensions']) delete asset.payload[key];
        Object.assign(asset.payload, structuredClone(variant));
        if (test.expectation === 'READ_UNSUPPORTED_CRITICAL') {
          variants.push(interpretationBlocked(asset));
          continue;
        }
        const a = accepted(asset),
          declaration = a.view.ir.nodes.find((n) => n.role === 'asset_declaration');
        for (const key of ['content_risk', 'extensions']) {
          assert.equal(Object.hasOwn(declaration.value, key), Object.hasOwn(variant, key));
          if (Object.hasOwn(variant, key)) assert.deepEqual(declaration.value[key], variant[key]);
        }
        const modes = {};
        for (const mode of ['whole_asset', 'catalog', 'exact_selection']) {
          const request = F.candidate(tuple, asset, mode),
            h = host(),
            result = await ri('pipeline').runRead(
              async () => a.result,
              a.bytes,
              request,
              controls(),
              h.provider,
            );
          assert.equal(result.envelope.status, 'ready');
          assert.ok(validateRead(result), JSON.stringify(validateRead.errors));
          if (mode === 'catalog') {
            assert.deepEqual(result.envelope.content.declarations, []);
            assert.ok(
              omittedForReason(result.envelope, declaration.id, 'not_in_mode', 'declaration'),
              JSON.stringify(result.envelope.omissions),
            );
          } else {
            const shown = result.envelope.content.declarations.find(n => n.id === declaration.id).value;
            for (const key of ['content_risk', 'extensions']) {
              assert.equal(Object.hasOwn(shown, key), Object.hasOwn(variant, key));
              if (Object.hasOwn(variant, key)) assert.deepEqual(shown[key], variant[key]);
            }
          }
          modes[mode] = {
            content: result.envelope.content,
            content_digest: D.capsuleDigest(result.envelope.content),
            actual_bytes: assertBudget(result),
            host_observations: h.count(),
          };
          if (mode === 'exact_selection') {
            const handle = result.envelope.content.expansion_handles[0];
            assert.ok(handle);
            const expand = { ...request, mode: 'expand', handle };
            const expanded = await ri('pipeline').runRead(
              async () => a.result,
              a.bytes,
              expand,
              controls(),
              h.provider,
            );
            assert.equal(expanded.envelope.status, 'ready');
            const shown = expanded.envelope.content.declarations.find(n => n.id === declaration.id).value;
            for (const key of ['content_risk', 'extensions']) {
              assert.equal(Object.hasOwn(shown, key), Object.hasOwn(variant, key));
              if (Object.hasOwn(variant, key)) assert.deepEqual(shown[key], variant[key]);
            }
            modes.expand = {
              content_digest: D.capsuleDigest(expanded.envelope.content),
              actual_bytes: assertBudget(expanded),
              scope: handle.scope,
            };
          }
        }
        variants.push({
          input: variant,
          A: a.view.digests.A.observed,
          C: a.view.digests.C.observed,
          ir_digest: a.view.ir_digest,
          declaration,
          modes,
        });
      }
      if (test.expectation !== 'READ_UNSUPPORTED_CRITICAL')
        for (let i = 1; i < variants.length; i++) {
          assert.notEqual(variants[0].ir_digest, variants[i].ir_digest);
          for (const mode of ['whole_asset', 'exact_selection', 'expand'])
            assert.notEqual(
              variants[0].modes[mode].content_digest,
              variants[i].modes[mode].content_digest,
            );
          // Budget reflects exact final UTF-8 content. Reordering equal-sized items can
          // preserve byte length, so only an actual size change requires a different count.
          for (const mode of ['whole_asset', 'exact_selection'])
            if (
              Buffer.byteLength(S.canonicalJson(variants[0].modes[mode].content)) !==
              Buffer.byteLength(S.canonicalJson(variants[i].modes[mode].content))
            )
              assert.notEqual(
                variants[0].modes[mode].actual_bytes,
                variants[i].modes[mode].actual_bytes,
              );
        }
      return { expectation: test.expectation, variants };
    });
  await check('PAYLOAD-TOP-LEVEL-REAL-IR-CARRIERS', 'PUBLIC-GRAPH', async () => {
    const a = optionalAsset(),
      p = a.payload,
      attachment = Buffer.from('top-level carrier evidence');
    p.actors = [{ id: 'actor:1', kind: 'person', name: 'Declared author' }];
    p.judgments[0].subject.actor_ids = ['actor:1'];
    p.declarations = { highest_question: { state: 'provided', value: 'Authored question' } };
    p.reasons = [
      {
        id: 'reason:1',
        role: 'support',
        judgment_ref: 'j:0',
        statement: 'Authored reason',
        component_refs: [],
      },
    ];
    p.judgments[0].reason_refs = ['reason:1'];
    p.sources = [{ id: 'source:1', identity: 'Authored source' }];
    p.source_uses = [
      {
        id: 'use:1',
        role: 'support',
        source_ref: 'source:1',
        target_kind: 'judgment',
        target_ref: 'j:0',
      },
    ];
    p.resources = [
      {
        id: 'resource:1',
        entry: 'attachments/carrier.txt',
        digest: D.digest(attachment),
        media_type: 'text/plain',
      },
    ];
    p.materials = [
      {
        id: 'material:1',
        kind: 'attachment',
        resource_ref: 'resource:1',
        source_refs: ['source:1'],
      },
    ];
    p.judgments[0].material_refs = ['material:1'];
    p.relationships = [
      {
        id: 'relation:1',
        // grammar.1 `PUBLIC-TERM-VOCABULARY` closes the governed positions against
        // engineering.core_terms; a coined term must declare vocabulary:"author".
        kind: { term: 'support' },
        direction: 'directed',
        participants: [
          { judgment_ref: 'j:0', role: { term: 'supporter' } },
          { judgment_ref: 'j:1', role: { term: 'claim' } },
        ],
        operator: { term: 'supports' },
        effect: { term: 'offers_support' },
        statement: 'Authored relationship',
      },
    ];
    p.cohesion = {
      purpose: 'One declared purpose',
      governance: 'One declared governance',
      subject_relationship: 'Related subjects',
      projection_closure: 'Preserve support',
      rights_compatibility: 'Declared compatibility',
    };
    p.content_risk = 'high_consequence';
    p.extensions = [
      {
        id: 'extension:1',
        critical: false,
        definition: 'Opaque annotation',
        value: { kind: 'text', value: 'Retained text' },
      },
    ];
    p.attributions = {
      state: 'provided',
      value: [{ role: 'creator', actor_ids: ['actor:1'], statement: 'Authored attribution' }],
    };
const r = accepted(a, { entries: { 'attachments/carrier.txt': attachment } }),
  ir = r.view.ir,
  rows = [];
const projection = await readNode(r.bytes, F.candidate(tuple, a, 'whole_asset'), controls(), host().provider);
assert.equal(projection.envelope.status, 'ready');
const collections = {
      actors: 'actor',
      judgments: 'judgment',
      reasons: 'reason',
      sources: 'source',
      source_uses: 'source_use',
      resources: 'resource',
      materials: 'material',
      relationships: 'relationship',
      dependencies: 'dependency',
      shared_declarations: 'shared_declaration',
      contracts: 'result_contract',
      conditions: 'condition',
      exceptions: 'exception',
      misuse: 'misuse',
      examples: 'example',
    };
    for (const key of Object.keys(ci('generated-contract').types.Payload.properties)) {
      assert.ok(Object.hasOwn(p, key), key + ' fixture present');
      let observed, carrier;
      if (key === 'profile' || key === 'profile_version') {
        carrier = 'tuple.' + (key === 'profile' ? 'payload_profile' : 'payload_version');
        observed = ir.tuple[key === 'profile' ? 'payload_profile' : 'payload_version'];
      } else if (key === 'asset') {
        carrier = 'asset';
        observed = ir.asset;
      } else if (collections[key]) {
        carrier = 'nodes[role=' + collections[key] + '].value';
        observed = ir.nodes.filter((n) => n.role === collections[key] && (key !== 'contracts' || n.owner.kind === 'asset')).map((n) => n.value);
  } else if (key === 'asset_capability') {
        carrier = 'Read.content.asset_capability';
        observed = projection.envelope.content.asset_capability;
      } else {
        assert.ok(['scope', 'kernel', 'reading_order', 'declarations', 'cohesion', 'attributions', 'content_risk', 'extensions'].includes(key), key + ' mapped');
        carrier = 'nodes[role=asset_declaration].value.' + key;
        observed = ir.nodes.find((n) => n.role === 'asset_declaration').value[key];
      }
      assert.deepEqual(observed, p[key]);
      rows.push({ field: key, carrier, status: 'EXACT_VALUE_MATCH', observed });
}
// Whole-asset overview carries exactly the asset closure; full judgment
// bodies remain available through their explicit index targets.
    assert.deepEqual(projection.envelope.content.catalog, ir.catalog);
    const overview = [...projection.envelope.content.declarations, ...projection.envelope.content.closure];
    assert.deepEqual(new Set(overview.map(n => n.id)), new Set(ir.asset_closure));
    assert.equal(overview.some(n => n.role === 'judgment'), false);
    return {
      A: r.view.digests.A.observed,
      C: r.view.digests.C.observed,
      ir_digest: r.view.ir_digest,
      rows,
      scope:
        'Finite authored top-level values through a real admitted container and whole-asset Read; not wire-format invertibility or an independent semantic acceptance.',
    };
  });
  await check('BYTES-UNICODE-LIMITS', 'PUBLIC-BYTES', () => {
    assert.equal(S.identifier('汉'.repeat(85)), true);
    assert.equal(S.identifier('汉'.repeat(86)), false);
    assert.equal(S.identifier('a\u0001b'), false);
    assert.equal(S.identifier('\ud800'), false);
    assert.equal(S.entryName('a'.repeat(4096)), true);
    assert.equal(S.entryName('a'.repeat(4097)), false);
    assert.throws(() => S.parseJson('{"x":1,"x":2}'));
    assert.throws(() => S.parseJson('{"x":"\\ud800"}'));
    assert.throws(() => S.parseJson('{"x":1e400}'));
    const a = F.blank(tuple);
    a.payload.judgments[0].id = '汉'.repeat(86);
    return rejected(a);
  });
  await check('BYTES-REAL-UTC-CALENDAR', 'PUBLIC-BYTES', () => {
    for (const valid of ['2024-02-29T00:00:00.123456Z', '2000-02-29T23:59:59Z'])
      assert.ok(S.validTimestamp(valid));
    for (const invalid of [
      '2025-02-29T00:00:00Z',
      '1900-02-29T00:00:00Z',
      '2024-01-01T24:00:00Z',
      '2024-01-01T23:59:60Z',
    ])
      assert.equal(S.validTimestamp(invalid), false);
    const a = F.blank(tuple);
    a.manifest.updated_at = '2025-02-29T00:00:00Z';
    return rejected(a);
  });
  await check(
    'BYTES-DENSE-JSON-VALUES',
    'PUBLIC-BYTES',
    () => {
      const a = [];
      a.length = 1;
      a.extra = 1;
      assert.throws(() => S.canonicalJson(a));
      assert.throws(() => u.jcs(a));
      const x = {};
      x.self = x;
      assert.throws(() => u.clone(x));
      let called = 0;
      const getter = {
        get value() {
          called++;
          return 'secret';
        },
      };
      assert.throws(() => u.clone(getter));
      assert.equal(called, 0);
      return { getter_executions: called };
    },
    'real_strict_value_primitive',
  );
  await check('DIGEST-A-C-E-INDEPENDENT', 'PUBLIC-DIGESTS', () => {
    const a = accepted(F.blank(tuple));
    assert.equal(
      a.view.digests.A.observed,
      'sha256:' + crypto.createHash('sha256').update(a.bytes).digest('hex'),
    );
    const entries = ci('container').parseContainer(a.bytes);
    assert.equal(a.view.digests.C.observed, D.digest(D.contentTreePreimage(entries)));
    assert.equal(
      a.view.digests.E.observed,
      D.digest(D.runtimeEntryPreimage(entries, S.parseJson(entries['kdna.json']))),
    );
    assert.equal(a.view.ir_digest, D.capsuleDigest(a.view.ir));
    return {
      A: a.view.digests.A,
      C: a.view.digests.C,
      E: a.view.digests.E,
      ir_digest: a.view.ir_digest,
    };
  });
  await check(
    'DIGEST-DETACHED-HOST-RECEIVED',
    'PUBLIC-DIGESTS',
    () => {
      const capsule = { contract: tuple.runtime, context: { selected: 'j:0' } };
      const wire = Buffer.from(S.canonicalJson(capsule));
      const observed = D.capsuleDigest(S.parseJson(wire)),
        expected = 'sha256:' + crypto.createHash('sha256').update(wire).digest('hex');
      assert.equal(observed, expected);
      const altered = Buffer.from(S.canonicalJson({ ...capsule, context: { selected: 'j:1' } }));
      assert.equal(
        D.comparison(D.capsuleDigest(S.parseJson(altered)), expected, {
          kind: 'host_observation',
          source_id: 'received:1',
        }).state,
        'mismatched',
      );
      return { expected, observed, changed_received_bytes: true };
    },
    'real_detached_digest_and_received_bytes',
  );
  await check('GRAPH-UPSTREAM-SOURCE-USE-RESOURCE', 'PUBLIC-GRAPH', () => {
    const a = F.blank(tuple, 2);
    a.payload.actors = [{ id: 'actor:1', kind: 'person', name: 'Example' }];
    a.payload.judgments[0].subject.actor_ids = ['actor:1'];
    a.payload.sources = [{ id: 'source:1', identity: 'Test document' }];
    const bytes = Buffer.from('attachment');
    a.payload.resources = [
      {
        id: 'resource:1',
        entry: 'attachments/source.txt',
        digest: D.digest(bytes),
        media_type: 'text/plain',
      },
    ];
    a.payload.materials = [
      {
        id: 'material:1',
        kind: 'attachment',
        resource_ref: 'resource:1',
        source_refs: ['source:1'],
      },
    ];
    a.payload.judgments[0].material_refs = ['material:1'];
    a.payload.source_uses = [
      {
        id: 'use:1',
        role: 'support',
        source_ref: 'source:1',
        target_kind: 'judgment',
        target_ref: 'j:0',
      },
    ];
    addDependency(a, { id: 'dependency:1', producer: 'j:1', consumer: 'j:0', role: 'upstream', required: true, purpose: 'Required evidence' });
    const r = accepted(a, { entries: { 'attachments/source.txt': bytes } }),
      closure = r.view.ir.mandatory_closures[0],
      nodes = r.view.ir.nodes.filter((n) => closure.node_ids.includes(n.id));
    for (const role of [
      'actor',
      'source',
      'source_use',
      'material',
      'resource',
      'dependency',
      'result_contract',
    ])
      assert.ok(
        nodes.some((n) => n.role === role),
        role,
      );
    assert.ok(nodes.some((n) => n.role === 'judgment' && n.value.id === 'j:1'));
    return { closure: closure.node_ids, roles: nodes.map((n) => n.role) };
  });
  await check('GRAPH-DUPLICATE-DANGLING-ROLE', 'PUBLIC-GRAPH', () => {
    const failures = [];
    let a = F.blank(tuple, 2);
    a.payload.judgments[1].id = 'j:0';
    failures.push(rejected(a));
    a = F.blank(tuple);
    a.payload.judgments[0].subject.actor_ids = ['absent'];
    failures.push(rejected(a));
    a = F.blank(tuple);
    a.payload.sources = [{ id: 'source:1', identity: 'Source' }];
    a.payload.judgments[0].subject.actor_ids = ['source:1'];
    failures.push(rejected(a));
    a = F.blank(tuple);
    a.payload.reasons = [
      {
        id: 'reason:1',
        role: 'support',
        judgment_ref: 'absent',
        statement: 'Reason',
        component_refs: [],
      },
    ];
    failures.push(rejected(a));
    return failures;
  });
  await check('GRAPH-CYCLE-RETAINED', 'PUBLIC-GRAPH', () => {
    const a = F.blank(tuple, 2);
    for (const i of [0, 1]) addDependency(a, { id: 'd:' + i, producer: 'j:' + (1-i), consumer: 'j:' + i, role: 'input', required: true, purpose: 'Declared cycle' });
    const r = accepted(a);
    for (const closure of r.view.ir.mandatory_closures)
      assert.equal(
        r.view.ir.nodes.filter((n) => closure.node_ids.includes(n.id) && n.role === 'judgment')
          .length,
        2,
      );
    assert.equal(r.view.ir.nodes.filter((n) => n.role === 'dependency').length, 2);
    return { closures: r.view.ir.mandatory_closures, cycle_nodes: 2 };
  });
  await check('RESULT-RECURSIVE-SHAPE-CARDINALITY', 'PUBLIC-RESULT', () => {
    const a = F.blank(tuple);
    const j = a.payload.judgments[0];
    j.result_contract.shape = {
      kind: 'record',
      fields: [
        {
          name: 'values',
          required: true,
          shape: {
            kind: 'list',
            item_shape: { kind: 'scalar', scalar_type: 'number' },
            minimum: 1,
            maximum: 2,
          },
        },
      ],
    };
    j.result.value = {
      kind: 'record',
      fields: [{ name: 'values', value: { kind: 'list', items: [{ kind: 'number', value: 1 }] } }],
    };
    accepted(a);
    const failures = [];
    let bad = structuredClone(a);
    bad.payload.judgments[0].result.value.fields[0].value.items = [];
    failures.push(rejected(bad));
    bad = structuredClone(a);
    bad.payload.judgments[0].result.value.fields.push(
      bad.payload.judgments[0].result.value.fields[0],
    );
    failures.push(rejected(bad));
    bad = structuredClone(a);
    bad.payload.judgments[0].result_contract.shape.fields[0].shape.maximum = 0;
    failures.push(rejected(bad));
    return failures;
  });
    await check('RESULT-FORMATION-STATIC-NO-EXECUTION', 'PUBLIC-RESULT', () => {
      const a = F.blank(tuple);
      const j = a.payload.judgments[0];
      delete j.result;
      // grammar.1 `PUBLIC-FORM-CONSISTENCY` (specs/public-semantic-source.json) makes
      // `form` the discriminator: a formation rule requires form:"rule" and forbids
      // `result`. Before grammar.1 this case only deleted `result`.
      j.form = 'rule';
      // The declared capability must agree with the forms (PUBLIC-ASSET-CAPABILITY):
      // one rule-form judgment is `result_forming_rules`, not the fixture default.
      a.payload.asset_capability = 'result_forming_rules';
      j.formation_rule = {
      statement: 'Static rule',
      output_contract_ref: j.result_contract.id,
      condition_refs: [{ kind: 'condition', id: 'condition:static' }],
    };
    a.payload.conditions.push({ id: 'condition:static', owner_ref: { kind: 'judgment', id: j.id }, expression: { kind: 'interpreted', statement: 'globalThis.__shouldNeverRun = true' } });
    globalThis.__shouldNeverRun = false;
    accepted(a);
    assert.equal(globalThis.__shouldNeverRun, false);
    j.formation_rule.output_contract_ref = 'wrong';
    return rejected(a);
  });
  await check('AUTHORSHIP-ABSENCE-DECLARED-STATES', 'PUBLIC-AUTHORSHIP', () => {
    const results = [];
    for (const state of ['unknown', 'none', 'not_applicable']) {
      const a = F.blank(tuple);
      a.payload.attributions = { state, value: null };
      a.payload.declarations.boundaries = { state, value: null };
      const r = accepted(a), p = project(r.snapshot, F.candidate(tuple, a));
      const declaration = r.view.ir.nodes.find(n => n.role === 'asset_declaration').value;
      assert.deepEqual(declaration.attributions, a.payload.attributions);
      assert.deepEqual(declaration.declarations.boundaries, { state });
      assert.equal(p.body.content.provenance.confirmation, 'not_evaluated');
      const bad = structuredClone(a);
      bad.payload.declarations.highest_question = { state, value: null };
      const negative = rejected(bad);
      assert.ok(negative.result.diagnostics.some(d => d.field === '/payload/declarations/highest_question/state'));
      results.push({ state, missing: p.body.content.missing, invalid_highest_question: negative });
    }
    const a = F.blank(tuple), r = accepted(a);
    assert.equal(Object.hasOwn(r.view.ir.nodes.find(n => n.role === 'asset_declaration').value, 'attributions'), false);
    const result = ci('authorship').assessAuthorship({}, ['highest_question'], 'valid');
    assert.equal(result.writer, 'insufficient');
    assert.deepEqual(result.output, {});
    assert.deepEqual(result.synthesized_fields, []);
    return results;
  });
  await check(
    'ADMISSION-ORDER-PRIVATE-BRAND',
    'PUBLIC-ADMISSION',
    () => {
      const a = F.blank(tuple);
      let x = F.candidate(tuple, a);
      x.tuple = { ...tuple, payload_profile: 4, core: 4 };
      let r = read.admitReadRequest(x, controls());
      assert.equal(r.admission_rejection.diagnostic.field, 'tuple.payload_profile');
      x = F.candidate(tuple, a);
      x.authorized = true;
      x.request_id = '';
      r = read.admitReadRequest(x, controls());
      assert.equal(r.admission_rejection.diagnostic.field, '$unknown');
      const valid = read.admitReadRequest(F.candidate(tuple, a), controls());
      const snap = accepted(a).snapshot;
      assert.equal(
        read.project(JSON.parse(JSON.stringify(valid.admitted_request)), snap).diagnostics[0].code,
        'READ_INPUT_INVALID',
      );
      return { first_tuple_field: 'tuple.payload_profile', first_top_field: '$unknown' };
    },
    'real_request_admission',
  );
  await check('CONTROL-INVALID-ZERO-NO-BODY', 'PUBLIC-CONTROL', async () => {
    const a = F.blank(tuple),
      r = accepted(a),
      h = host();
    const candidate = F.candidate(tuple, a);
    candidate.budget_bytes = 'private';
    let out = await readNode(r.bytes, candidate, controls(), h.provider);
    assert.equal(out.channel, 'admission_rejection');
    assert.equal(h.count(), 0);
    candidate.budget_bytes = 0;
    out = await readNode(r.bytes, candidate, controls(), h.provider);
    assert.equal(out.channel, 'no_body_control');
    assert.equal(out.control.semantic_cause, 'READ_BUDGET_INSUFFICIENT');
    assert.equal(out.control.body_bytes, 0);
    assert.equal(h.count(), 2);
    return out;
  });
  await check(
    'BUDGET-FINAL-FULL-BODY-EXACT-MINUS-ONE',
    'PUBLIC-BUDGET',
    async () => {
      const a = optionalAsset(),
        r = accepted(a),
        request = F.candidate(tuple, a);
      const prepare = async (budget) => {
        const h = host();
        return ri('pipeline').runRead(
          async () => r.result,
          r.bytes,
          { ...request, budget_bytes: budget },
          controls(),
          h.provider,
        );
      };
      let result = await prepare(1000000);
      assert.equal(result.envelope.status, 'ready');
      let count = assertBudget(result);
      for (let i = 0; i < 4; i++) {
        result = await prepare(count);
        const n = Number(result.envelope.budget.required_bytes);
        if (n === count && result.envelope.status === 'ready') break;
        count = n;
      }
      assert.equal(result.envelope.status, 'ready');
      assertBudget(result);
      const minus = await prepare(count - 1);
      assert.equal(minus.envelope.status, 'rejected');
      assert.equal(minus.envelope.diagnostics[0].code, 'READ_BUDGET_INSUFFICIENT');
      assertBudget(minus);
      assert.equal(minus.envelope.content, null);
      return {
        exact: result.envelope.budget,
        minus_one: minus.envelope.budget,
        handles_in_final_body: result.envelope.content.expansion_handles.length,
      };
    },
    'real_bytes_retained_snapshot_reference_pipeline',
  );
  await check('HOST-FRESH-DENIAL-NO-LEAK', 'PUBLIC-HOST', async () => {
    const a = F.blank(tuple),
      r = accepted(a),
      h = host((data, count) => ({ ...data, decision: count === 2 ? 'deny' : 'allow' }));
    const answer = await readNode(r.bytes, F.candidate(tuple, a), controls(), h.provider);
    assert.equal(answer.envelope.diagnostics[0].code, 'READ_HOST_DENIED');
    assert.equal(answer.envelope.content, null);
    assert.equal(answer.envelope.states.read_permission, 'denied');
    assert.equal(answer.envelope.states.core, 'valid');
    return { answer, calls: h.count() };
  });
  await check('HOST-REVOCATION-TOMBSTONE-LIFT', 'PUBLIC-HOST', async () => {
    const a = F.blank(tuple),
      r = accepted(a);
    let decision = 'deny',
      lift = false;
    const h = host((data) => ({ ...data, decision, lift_denial: lift })),
      request = F.candidate(tuple, a);
    let result = await readNode(r.bytes, request, controls(), h.provider);
    assert.equal(result.envelope.diagnostics[0].code, 'READ_HOST_DENIED');
    decision = 'allow';
    result = await readNode(r.bytes, request, controls(), h.provider);
    assert.equal(result.envelope.diagnostics[0].code, 'READ_HOST_DENIED');
    lift = true;
    result = await readNode(r.bytes, request, controls(), h.provider);
    assert.equal(result.envelope.status, 'ready');
    return { explicit_lift_required: true, final: result.envelope.states };
  });
  await check(
    'HOST-HANDLE-DELIVERY-REGISTRY-EPOCH',
    'PUBLIC-HOST',
    async () => {
      const a = optionalAsset(),
        r = accepted(a),
        request = F.candidate(tuple, a);
      let epoch = 'epoch:1';
      const h = host((data) => ({ ...data, host_epoch: epoch }));
      const run = (c) =>
        ri('pipeline').runRead(async () => r.result, r.bytes, c, controls(), h.provider);
      let result = await run(request);
      const handle = result.envelope.content.expansion_handles[0];
      assert.ok(handle);
      result = await run({ ...request, mode: 'expand', handle });
      assert.equal(result.envelope.status, 'ready');
      epoch = 'epoch:2';
      result = await run({ ...request, mode: 'expand', handle });
      assert.equal(result.envelope.diagnostics[0].code, 'READ_HOST_EPOCH_MISMATCH');
      const failed = host(null, () => false);
      result = await ri('pipeline').runRead(
        async () => r.result,
        r.bytes,
        request,
        controls(),
        failed.provider,
      );
      assert.equal(result.channel, 'transport_failure');
      assert.equal(ri('brands').hosts.get(failed.provider).handles.size, 0);
      return { successful_handle: handle, failed_delivery_handle_records: 0 };
    },
    'real_bytes_retained_snapshot_reference_pipeline',
  );
  await check('HOST-NEW-ADMISSION-INVALIDATES-HANDLE', 'PUBLIC-HOST', async () => {
    const a = optionalAsset(),
      r = accepted(a),
      h = host(),
      request = F.candidate(tuple, a);
    const first = await readNode(r.bytes, request, controls(), h.provider);
    const handle = first.envelope.content.expansion_handles[0];
    const second = await readNode(
      r.bytes,
      { ...request, mode: 'expand', handle },
      controls(),
      h.provider,
    );
    assert.equal(second.envelope.diagnostics[0].code, 'READ_HANDLE_STALE');
    return { first_snapshot: handle.snapshot_id, result: second.envelope.diagnostics };
  });
  await check('MODES-SCOPE-NO-ADJACENT-OMISSION-LEAK', 'PUBLIC-MODES', async () => {
    const a = F.blank(tuple, 2),
      r = accepted(a);
    const h = host((data, count, request, snapshot) => ({
      ...data,
      scope: snapshot.ir.nodes.filter((n) => n.owner_judgment_id !== 'j:1').map((n) => n.id),
    }));
    let answer = await readNode(r.bytes, F.candidate(tuple, a), controls(), h.provider);
    assert.equal(answer.envelope.status, 'ready');
    assert.equal(answer.envelope.content.catalog.length, 1);
    const adjacent = r.view.ir.nodes.filter(n => n.owner_judgment_id === 'j:1').map(n => n.id);
    for (const id of adjacent) assert.equal(JSON.stringify(answer.envelope.omissions).includes(id), false);
    assert.equal(JSON.stringify(answer.envelope.omissions).includes('j:1'), false);
    const limited = host((data, count, request, snapshot) => ({
      ...data,
      scope: snapshot.ir.nodes.filter((n) => n.role !== 'result_contract').map((n) => n.id),
    }));
    answer = await readNode(r.bytes, F.candidate(tuple, a), controls(), limited.provider);
    assert.equal(answer.envelope.diagnostics[0].code, 'READ_SCOPE_DENIED');
    assert.equal(answer.envelope.content, null);
    return { scope_denial: answer.envelope.diagnostics, no_unauthorized_omission: true };
  });
  await check('MODES-ONE-TWENTY-HUNDRED-PARITY', 'PUBLIC-MODES', () => {
    const results = [];
    for (const count of [1, 20, 100]) {
      const a = F.blank(tuple, count),
        r = accepted(a),
        selected = 'j:' + (count - 1),
        projection = project(r.snapshot, F.candidate(tuple, a, 'exact_selection', selected));
      assert.equal(projection.body.content.selected.judgment_id, selected);
      assert.equal(projection.body.content.catalog[0].judgment_id, selected);
      const catalog = project(r.snapshot, F.candidate(tuple, a, 'catalog')).body.content.catalog;
      const clicked = catalog.find((item) => item.judgment_id === selected);
      assert.ok(clicked);
      const readerRequest = {
        request_id: 'reader:catalog-selection',
        tuple,
        budget_bytes: 1000000,
        mode: 'exact_selection',
        selection: {
          asset_id: r.view.asset.asset_id,
          asset_version: r.view.asset.asset_version,
          judgment_id: clicked.judgment_id,
        },
        handle: null,
      };
      const readerAdapter = project(r.snapshot, readerRequest),
        agentAdapter = projection;
      assert.deepEqual(readerAdapter.body.content, agentAdapter.body.content);
      assert.deepEqual(readerAdapter.diagnostics, agentAdapter.diagnostics);
      assert.equal(projection.body.content.closure.filter((n) => n.role === 'judgment').length, 1);
      results.push({
        count,
        selected,
        mandatory_nodes: projection.body.content.closure.length,
        reader_route: 'headless catalog lookup then independently admitted selection',
        agent_route: 'headless explicit semantic identity selection',
        content_equal: true,
        diagnostics_equal: true,
        content_digest: D.capsuleDigest(projection.body.content),
      });
    }
    return results;
  });
  await check('STATES-NO-INVENTED-AUTHORITY', 'PUBLIC-STATES', async () => {
    const a = F.blank(tuple),
      r = accepted(a),
      h = host();
    const wrong = F.candidate(tuple, a);
    wrong.selection.asset_id = 'asset:other';
    const answer = await readNode(r.bytes, wrong, controls(), h.provider);
    assert.equal(answer.envelope.states.core, 'valid');
    assert.equal(answer.envelope.states.read_permission, 'not_evaluated');
    assert.equal(answer.envelope.states.action_authorization, 'not_evaluated');
    assert.equal(h.count(), 0);
    const independent = ri('authority').correlateStates('valid', 'insufficient', 'verified');
    assert.equal(independent.read_permission, 'not_evaluated');
    assert.equal(independent.action_authorization, 'not_evaluated');
    return { answer, independent };
  });
  await check('DELIVERY-CAUSE-ALL-CHANNELS', 'PUBLIC-CONTROL', async () => {
    const a = F.blank(tuple),
      r = accepted(a),
      h = host(null, () => {
        throw Error('private/path/transport');
      }),
      candidate = F.candidate(tuple, a);
    const observations = [];
    for (const [bytes, c, expected] of [
      [r.bytes, { ...candidate, budget_bytes: 'secret' }, 'READ_INPUT_INVALID'],
      [new Uint8Array(2), candidate, 'READ_CORE_INVALID'],
      [r.bytes, candidate, null],
    ]) {
      const result = await readNode(bytes, c, controls(), h.provider);
      assert.equal(result.channel, 'transport_failure');
      assert.equal(result.transport_failure.semantic_cause, expected);
      assert.equal(result.envelope, null);
      assert.equal(JSON.stringify(result).includes('private/path'), false);
      observations.push(result);
    }
    return observations;
  });
  await check(
    'PACKAGE-SET-ORDER-EXACT-BINDINGS',
    'PUBLIC-PACKAGE-SET',
    () => {
      const members = [
          {
            member_id: 'm:1',
            asset_id: 'asset:1',
            asset_version: '1',
            A: 'sha256:' + '1'.repeat(64),
          },
        ],
        set = {
          tuple,
          members,
          selection: { asset_id: 'asset:1', asset_version: '1', judgment_id: 'j:1' },
        },
        admitted = members.map((x) => ({ ...x, core: 'valid', judgment_ids: ['j:1'] })),
        fn = ci('package-set').decidePackageSet;
      assert.equal(fn(set, [], [], 'semantic_merge', true).diagnostic, 'SET_MEMBER_UNAUTHORIZED');
      assert.equal(fn(set, [], members, 'semantic_merge', true).diagnostic, 'SET_MEMBER_MISSING');
      assert.equal(
        fn(
          set,
          [...admitted, { ...admitted[0], member_id: 'extra' }],
          members,
          'isolated_read',
          false,
        ).diagnostic,
        'SET_MEMBER_EXTRA',
      );
      assert.equal(
        fn(
          set,
          [{ ...admitted[0], A: 'sha256:' + '2'.repeat(64) }],
          members,
          'isolated_read',
          false,
        ).diagnostic,
        'READ_CORE_INVALID',
      );
      assert.equal(
        fn(set, admitted, members, 'semantic_merge', false).diagnostic,
        'UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE',
      );
      return fn(set, admitted, members, 'isolated_read', false);
    },
    'real_package_set_decision_with_independent_admission_grant_observations',
  );
  await check('OPAQUE-BRAND-IMMUTABLE-COPY', 'PUBLIC-OPAQUE', () => {
    const a = F.blank(tuple),
      r = accepted(a);
    assert.equal(boundary.inspectSnapshot(JSON.parse(JSON.stringify(r.snapshot))), null);
    assert.equal(boundary.inspectSnapshot({ ...r.snapshot }), null);
    assert.throws(() => {
      r.snapshot.ir.nodes[0].value.title = 'changed';
    });
    const original = r.view.digests.A.observed;
    r.bytes.fill(0);
    assert.equal(boundary.inspectSnapshot(r.snapshot).digests.A.observed, original);
    return {
      serialized_witness: false,
      shallow_copy_witness: false,
      input_mutation_cannot_rewrite_snapshot: true,
    };
  });
  await check('EXTENSIONS-CRITICAL-FIREWALL', 'PUBLIC-EXTENSIONS', () => {
    const a = F.blank(tuple);
    a.payload.judgments[0].extensions = [
      {
        id: 'e:1',
        critical: true,
        definition: 'Unsupported evaluator',
        value: { kind: 'text', value: 'execute()' },
      },
    ];
    const result = interpretationBlocked(a);
    const b = F.blank(tuple);
    b.payload.judgments[0].authorized = true;
    return [result, rejected(b)];
  });
  await check('CONTAINER-CODEC-CRC-ENTRY-ALLOWLIST', 'PUBLIC-CONTAINER', async () => {
    const a = F.blank(tuple),
      valid = F.encode(a, req, { deflate: true });
    const n = await node.admitNode(valid);
    assert.equal(n.status, 'accepted');
    assert.equal(core.admitBytes(valid).reason, 'READ_CORE_CAPABILITY_UNAVAILABLE');
    const invalid = Buffer.from(F.encode(a, req));
    invalid[40] ^= 1;
    assert.equal(core.admitBytes(invalid).reason, 'READ_CORE_INVALID');
    const blocked = rejected(a, 'READ_CORE_INVALID', {
      entries: { 'reports/private.json': Buffer.from('{}') },
    });
    const cryptoAsset = F.blank(tuple);
    cryptoAsset.manifest.payload.encrypted = true;
    cryptoAsset.manifest.encryption = {
      profile: 'unsupported:encryption',
      profile_version: '1',
      encrypted_entries: ['payload.kdnab'],
    };
    return {
      node_deflate: n.status,
      bytes_only_deflate: core.admitBytes(valid).reason,
      allowlist: blocked,
      encryption: rejected(cryptoAsset, 'READ_CORE_CAPABILITY_UNAVAILABLE'),
    };
  });
  await check('CONTAINER-BOUNDS-DUPLICATE-TRAVERSAL', 'PUBLIC-CONTAINER', () => {
    const a = F.blank(tuple),
      results = [];
    results.push(
      rejected(a, 'READ_CORE_INVALID', { entries: { 'attachments/../escape': Buffer.from('x') } }),
    );
      results.push(
        rejected(a, 'READ_CORE_INVALID', {
          // The bound is the declared one, not a number frozen at the pre-grammar.2
          // 5 MiB: `resource_limits.entry_bytes` is 8 MiB on this coordinate.
          entries: { 'attachments/large': new Uint8Array(limits.entry_bytes + 1) },
        }),
    );
    const many = Object.fromEntries(
      Array.from({ length: 126 }, (_, i) => ['attachments/' + i, Buffer.from('x')]),
    );
    results.push(rejected(a, 'READ_CORE_INVALID', { entries: many }));
    const duplicate = Buffer.from([0xa2, 0x61, 0x78, 0x01, 0x61, 0x78, 0x02]);
    results.push(rejected(a, 'READ_CORE_INVALID', { rawPayload: duplicate }));
    return results;
  });
  await check('CONTAINER-REAL-NODE-PATH-ERRORS', 'PUBLIC-CONTAINER', async () => {
    const a = F.blank(tuple),
      bytes = F.encode(a, req),
      file = path.join(path.dirname(out), 'node-capture.kdna');
    fs.writeFileSync(file, bytes);
    const admitted = await node.admitNode(file);
    assert.equal(admitted.status, 'accepted');
    assert.equal(boundary.inspectSnapshot(admitted.snapshot).digests.A.observed, D.digest(bytes));
    const bad = await node.admitNode(path.join(path.dirname(out), 'not-existing-secret.kdna'));
    assert.equal(bad.status, 'rejected');
    assert.equal(JSON.stringify(bad).includes('secret'), false);
    return { path_admission: admitted.status, unavailable_path: bad };
  });
  await check(
    'PACKAGE-HANDOFF-CORRELATION-NO-EXECUTION',
    'PUBLIC-PACKAGE-SET',
    async () => {
      const a = F.blank(tuple),
        r = accepted(a),
        request = F.candidate(tuple, a),
        h = host(),
        result = await ri('pipeline').runRead(
          async () => r.result,
          r.bytes,
          request,
          controls(),
          h.provider,
        );
      const execution=req('@aikdna/kdna-core/execution');
      const admission=execution.createConsumptionPlan(r.snapshot,{plan_id:'plan:handoff',intent:{task:'Read handoff correlation',use:'reasoning_support'},selection:request.selection,budget:{capsule_bytes:1000000,output_bytes:100000,response_bytes:1000000,trace_events:16}});
      assert.equal(admission.status,'admitted');
      const plan=execution.inspectAdmittedPlan(admission.plan);
      const handoff = {
        contract: 'kdna.package-set-handoff/0.2.1',
        tuple,
        set_id: 'set:1',
        members: [
          {
            member_id: 'member:1',
            asset_id: r.view.asset.asset_id,
            asset_version: r.view.asset.asset_version,
            A: r.view.digests.A.observed,
            C: r.view.digests.C.observed,
            snapshot_id: r.view.snapshot_id,
          },
        ],
        selection: request.selection,
        closure_digest: D.capsuleDigest(result.envelope.content.closure),
        read_receipt_id: result.envelope.receipt.receipt_id,
        plan_digest: D.capsuleDigest(plan),
        host_id: result.envelope.receipt.host_id,
        host_epoch: result.envelope.receipt.host_epoch,
      };
      const context = {
          snapshots: [{ member_id: 'member:1', snapshot: r.snapshot }],
          deliveredRead: result,
          observeAdmittedPlan: () => admission.plan,
        },
        verify = ci('package-set').verifyHandoffBindings;
      assert.equal(verify(handoff, context), true);
      assert.equal(verify({ ...handoff, read_receipt_id: 'wrong' }, context), false);
      assert.equal(
        verify({ ...handoff, closure_digest: 'sha256:' + '0'.repeat(64) }, context),
        false,
      );
      assert.equal(
        verify(handoff, { ...context, observeAdmittedPlan: () => ({ ...plan, changed: true }) }),
        false,
      );
      assert.equal(verify(handoff, { ...context, observeAdmittedPlan: null }), false);
      assert.equal(
        verify(handoff, {
          ...context,
          snapshots: [{ member_id: 'member:1', snapshot: JSON.parse(JSON.stringify(r.snapshot)) }],
        }),
        false,
      );
      return {
        handoff,
        valid_binding: true,
        invalid_bindings_rejected: 5,
        plan_admission: 'independent stage premise only',
        execution_performed: false,
      };
    },
    'real_read_snapshot_handoff_binding_with_independent_plan_premise',
  );
  await check(
    'BROWSER-BRANDED-SNAPSHOT-CAPABILITY',
    'PUBLIC-MODES',
    async () => {
      const a = F.blank(tuple),
        r = accepted(a),
        h = host();
      const result = await req('@aikdna/kdna-read/browser').readBrowser(
        r.snapshot,
        F.candidate(tuple, a),
        controls(),
        h.provider,
      );
      // packages/kdna-read/README.md: Browser Read accepts a retained Core
      // snapshot for expansion; src/browser.js reuses the private snapshot
      // identity instead of re-admitting browser bytes.
      assert.equal(result.channel, 'read_envelope');
      assert.equal(result.envelope.status, 'ready');
      assert.equal(result.envelope.contract, tuple.read);
      assert.deepEqual(result.envelope.diagnostics, []);
      assert.ok(validateRead(result), JSON.stringify(validateRead.errors));
      assert.equal(h.count(), 2);
      // The capability is the same-Core retained snapshot, not any
      // snapshot-shaped object: a structured clone stays foreign and is
      // rejected before the Host sees it.
      const foreign = await req('@aikdna/kdna-read/browser').readBrowser(
        JSON.parse(JSON.stringify(r.snapshot)),
        F.candidate(tuple, a),
        controls(),
        h.provider,
      );
      assert.equal(foreign.envelope.diagnostics[0].code, 'READ_INPUT_INVALID');
      assert.equal(h.count(), 2);
      return {
        contract: result.envelope.contract,
        host_observations: h.count(),
        foreign_snapshot_rejection: foreign.envelope.diagnostics[0].code,
        retained_snapshot_accepted: true,
      };
    },
    'Node execution of browser capability branch; not browser engine',
  );
  await check(
    'CBOR-NEGATIVE-INTEGER-PRECISION',
    'PUBLIC-BYTES',
    () => {
      const bytes = Buffer.from('3b0020000000000000', 'hex');
      assert.throws(() => ci('cbor').decodePayload(bytes));
      return { raw_hex: bytes.toString('hex'), rounded_negative_rejected: true };
    },
    'real_raw_cbor_admission',
  );
  await check('CHECKSUMS-METADATA-CAPABILITY', 'PUBLIC-CONTAINER', () => {
    const a = F.blank(tuple);
    return rejected(a, 'READ_CORE_CAPABILITY_UNAVAILABLE', {
      entries: { 'checksums.json': Buffer.from('{}') },
    });
  });
  for (const location of ['same', 'cross', 'asset', 'null', 'missing'])
    await check('ECR02-EXCEPTION-' + location.toUpperCase(), 'PUBLIC-GRAPH', async () => {
      const a = F.blank(tuple, 3);
      const values = addException(a, 'j:0', location === 'asset' || location === 'cross');
      const admitted = accepted(a), view = admitted.view;
      if (['cross', 'null', 'missing'].includes(location)) {
        const bad = structuredClone(a);
        if (location === 'cross') {
          const b = bad.payload.declarations.boundaries.value[0];
          bad.payload.declarations.boundaries = { state: 'none', value: null };
          b.applies_to = { kind: 'judgments', judgment_refs: ['j:1'] };
          bad.payload.judgments[1].boundaries = { state: 'provided', value: [b] };
        } else bad.payload.judgments[0].exceptions.value[0].boundary_ref = location === 'null' ? null : 'boundary:absent';
        const negative = rejected(bad);
        assert.ok(negative.result.diagnostics.some(d => /\/(?:exceptions|boundaries)(?:\/|$)/.test(d.field ?? '')), JSON.stringify(negative.result));
        if (location !== 'cross') return { location, valid_control: view.ir_digest, negative };
      }
      const closure = view.ir.mandatory_closures[0], nodes = view.ir.nodes.filter(n => closure.node_ids.includes(n.id));
      for (const role of ['boundary', 'exception', 'condition', 'actor']) assert.ok(nodes.some(n => n.role === role), role);
      assert.deepEqual(nodes.filter(n => n.role === 'judgment').map(n => n.value.id), ['j:0']);
      assert.equal(new Set(closure.node_ids).size, closure.node_ids.length);
      const full = await readNode(admitted.bytes, F.candidate(tuple, a), controls(), host().provider);
      assert.equal(full.envelope.status, 'ready');
      assert.equal(full.envelope.receipt.delivery, 'delivered');
      assertBudget(full);
      const boundary = nodes.find(n => n.target.kind === 'boundary' && n.target.id === values.boundary.id);
      const author = nodes.find(n => n.role === 'actor');
      const observations = [];
      for (const excluded of [[boundary.id], [author.id], [boundary.id, author.id]]) {
        const h = host(data => ({ ...data, scope: data.scope.filter(id => !excluded.includes(id)) }));
        const result = await readNode(admitted.bytes, F.candidate(tuple, a), controls(), h.provider);
        assert.equal(result.envelope.status, 'rejected');
        assert.equal(result.envelope.diagnostics[0].code, 'READ_SCOPE_DENIED');
        assert.equal(result.envelope.content, null);
        observations.push({ excluded, result });
      }
      return { location, A: view.digests.A.observed, closure: closure.node_ids, observations, no_adjacent_judgment: true };
    });
  await check('ECR02-OWNED-METHOD-SOURCE-USE', 'PUBLIC-GRAPH', async () => {
    const a = F.blank(tuple, 2),
      p = a.payload;
    p.judgments[0].method.components[0].statement = 'Authored component with source evidence';
    p.sources = [{ id: 'source:component', identity: 'Necessary method evidence' }];
    p.source_uses = [
      {
        id: 'use:component',
        role: 'support',
        source_ref: 'source:component',
        target_kind: 'method_component',
        target_ref: 'component:0',
      },
    ];
    const admitted = accepted(a),
      closure = admitted.view.ir.mandatory_closures[0],
      nodes = admitted.view.ir.nodes.filter((n) => closure.node_ids.includes(n.id));
    for (const role of ['method_component', 'source', 'source_use'])
      assert.ok(
        nodes.some((n) => n.role === role),
        role,
      );
    assert.deepEqual(
      nodes.filter((n) => n.role === 'judgment').map((n) => n.value.id),
      ['j:0'],
    );
    assert.equal(new Set(closure.node_ids).size, closure.node_ids.length);
    const full = await readNode(admitted.bytes, F.candidate(tuple, a), controls(), host().provider);
    assert.equal(full.envelope.status, 'ready');
    const h = host((data) => ({
      ...data,
      scope: data.scope.filter((id) => !nodes.some((n) => n.id === id && n.role === 'source')),
    }));
    const excluded = await readNode(admitted.bytes, F.candidate(tuple, a), controls(), h.provider);
    assert.equal(excluded.envelope.diagnostics[0].code, 'READ_SCOPE_DENIED');
    assert.equal(excluded.envelope.content, null);
    return {
      closure: closure.node_ids,
      roles: nodes.map((n) => n.role),
      full_scope: full.envelope.status,
      excluded,
    };
  });
  await check('ECR02-INDIRECT-EXCEPTION-BINDING-DEDUP', 'PUBLIC-GRAPH', () => {
    const a = F.blank(tuple, 3);
    addException(a, 'j:2', true);
    // The support scope remains j:2. It is referenced, never adopted as j:0 permission.
    const bare=accepted(a),bareIds=bare.view.ir.mandatory_closures[0].node_ids;
    for(const role of ['exception','condition','boundary','actor'])assert.ok(!bare.view.ir.nodes.some(n=>bareIds.includes(n.id)&&n.role===role),role+' without native binding');
    a.payload.judgments[0].method.bindings = [{ component_ref: 'component:0', role: 'qualification', target: { kind: 'exception', id: 'exception:selected' } }, { component_ref: 'component:0', role: 'second-distinct-role', target: { kind: 'exception', id: 'exception:selected' } }];
    const admitted = accepted(a), closure = admitted.view.ir.mandatory_closures[0];
    const nodes = admitted.view.ir.nodes.filter(n => closure.node_ids.includes(n.id));
    for (const role of ['exception', 'condition', 'boundary', 'actor']) assert.ok(nodes.some(n => n.role === role), role);
    assert.equal(new Set(closure.node_ids).size, closure.node_ids.length);
    assert.deepEqual(nodes.filter(n => n.role === 'judgment').map(n => n.value.id), ['j:0']);
    const invalid = structuredClone(a);
    invalid.payload.judgments[0].method.bindings = [{ component_ref: 'component:0', role: 'qualification', target_ref: 'exception:selected' }];
    const negative = rejected(invalid);
    assert.ok(negative.result.diagnostics.some(d => d.field === '/payload/judgments/0/method/bindings'));
    return { closure: closure.node_ids, roles: nodes.map(n => n.role), native_only_positive_control: true, no_adjacent_judgment: true, invalid_untyped_binding: negative };
  });
  await check(
    'ECR02-EXPANSION-RECURSIVE-SUPPORT',
    'PUBLIC-MODES',
    async () => {
      const a = F.blank(tuple, 3),
        p = a.payload;
      addException(a, 'j:1', true);
      addDependency(a, { id: 'dependency:optional', producer: 'j:1', consumer: 'j:0', role: 'context', required: false, purpose: 'Optional supporting judgment' });
      const admitted = accepted(a),
        view = admitted.view,
        target = view.ir.expansion_targets.find(t => t.anchor.kind === 'judgment' && t.anchor.selection.judgment_id === 'j:0' && t.target.kind === 'dependency' && t.target.id === 'dependency:optional'),
        support = view.ir.nodes.filter((n) => target.scope.includes(n.id));
      for (const role of ['exception', 'boundary', 'actor'])
        assert.ok(
          support.some((n) => n.role === role),
          role,
        );
      assert.deepEqual(
        support.filter((n) => n.role === 'judgment').map((n) => n.value.id),
        ['j:0', 'j:1'],
      );
      let deny = false;
      const h = host((data) => ({
        ...data,
        scope: deny
          ? data.scope.filter((id) => !support.some((n) => n.id === id && n.role === 'boundary'))
          : data.scope,
      }));
      const run = (request) =>
          ri('pipeline').runRead(
            async () => admitted.result,
            admitted.bytes,
            request,
            controls(),
            h.provider,
          ),
        request = F.candidate(tuple, a),
        initial = await run(request),
        handle = initial.envelope.content.expansion_handles.find(h => h.target.kind === 'dependency' && h.target.id === 'dependency:optional');
      assert.ok(handle);
      const full = await run({ ...request, mode: 'expand', handle });
      assert.equal(full.envelope.status, 'ready');
      assert.ok(full.envelope.content.closure.some((n) => n.role === 'boundary'));
      deny = true;
      const excluded = await run({ ...request, mode: 'expand', handle });
      assert.equal(excluded.envelope.diagnostics[0].code, 'READ_SCOPE_DENIED');
      assert.equal(excluded.envelope.content, null);
      return { target, full_scope: full.envelope.status, excluded };
    },
    'real_bytes_retained_snapshot_reference_pipeline',
  );
  const obligations = ci('generated-contract').types;
  const report = {
    format: 'kdna.runtime-obligations/1',
    started_at: started,
    ended_at: new Date().toISOString(),
    count: rows.length,
    matched: rows.filter((x) => x.status === 'MATCH').length,
    failed: rows.filter((x) => x.status === 'FAIL').length,
    rows,
  };
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      count: report.count,
      matched: report.matched,
      failed: report.failed,
      failures: rows.filter((x) => x.status === 'FAIL').map((x) => ({ id: x.id, error: x.error })),
    }),
  );
  process.exitCode = report.failed ? 1 : 0;
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
