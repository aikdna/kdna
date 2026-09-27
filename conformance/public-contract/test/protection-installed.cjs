'use strict';
// External fixture/issuer harness. All authority and Read calls use public package exports.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { createRequire } = require('node:module'),
  { pathToFileURL } = require('node:url');
const [freshRoot, oldRoot, duplicateRoot, outRoot] = process.argv.slice(2);
assert.ok(outRoot, 'Name four actual installed consumer/evidence roots');
process.env.KDNA_PUBLIC_RUNTIME = path.resolve(freshRoot);
const H = require('../../../packages/kdna-core/test/protection-test-helpers.js'),
  { core, read, req, F, tuple } = H,
  old = createRequire(path.resolve(oldRoot, 'package.json')),
  duplicate = createRequire(path.resolve(duplicateRoot, 'package.json'));
fs.mkdirSync(outRoot, { recursive: true });
const observations = [];
const check = (id, data) => {
  observations.push({ id, status: 'OBSERVED', ...data });
};
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !['snapshot_id', 'receipt_id', 'carrier_id', 'decision_id'].includes(k))
        .map(([k, v]) => [k, stable(v)]),
    );
  return value;
}
function ordinaryHost(embedding, boundary) {
  return embedding.createTrustedHostReadProvider({
    observe({ request, snapshot }) {
      const v = boundary.inspectSnapshot(snapshot) ?? snapshot;
      return {
        host_id: 'host:comparison',
        host_epoch: 'epoch:1',
        decision_id: 'decision:comparison',
        request_id: request.request_id,
        snapshot_id: v.snapshot_id ?? v.carrier_id,
        A: v.digests.A.observed,
        C: v.digests.C.observed,
        scope: v.ir ? v.ir.nodes.map((x) => x.id) : v.catalog.map((x) => x.node_ref),
        issued_at: 900,
        expires_at: 2000,
        current_ms: 1000,
        decision: 'allow',
        policy_id: 'policy:comparison',
      };
    },
  });
}
(async () => {
  assert.equal(req('@aikdna/kdna-core/package.json').version, '0.35.0-rc.source.1');
  assert.equal(
    req('@aikdna/kdna-read/package.json').peerDependencies['@aikdna/kdna-core'],
    '0.35.0-rc.source.1',
  );
  for (const [pkg, names] of [
    [
      '@aikdna/kdna-core',
      [
        'admitProtectedNode',
        'bindProtectionOperation',
        'disposeProtectionOperation',
        'getProtectionContract',
        'protectSourceBytes',
      ],
    ],
    [
      '@aikdna/kdna-read',
      ['commitProtectedTransport', 'createTrustedProtectedHostReadProvider', 'readProtectedNode'],
    ],
  ]) {
    const meta = req(pkg + '/package.json'),
      dir = path.dirname(req.resolve(pkg + '/package.json')),
      cjs = req(pkg + '/protection-node'),
      esm = await import(
        pathToFileURL(path.join(dir, meta.exports['./protection-node'].import)).href
      );
    assert.deepEqual(Object.keys(cjs).sort(), names);
    assert.deepEqual(
      Object.keys(esm)
        .filter((k) => k !== 'default')
        .sort(),
      names,
    );
  }
  check('EXPORTS-CJS-ESM', { core: Object.keys(core), read: Object.keys(read) });
  const readRows = [];
  for (const access of [undefined, 'public', 'licensed'])
    for (const form of ['conclusion', 'rule']) {
      const a = F.blank(tuple, 2, { form });
      if (form === 'rule')
        for (const j of a.payload.judgments) {
          delete j.result;
          j.formation_rule = {
            statement: 'Act only when the authored condition holds.',
            conditions: [{ kind: 'interpreted', statement: 'The named condition is established.' }],
            output_contract_ref: j.result_contract.id,
          };
        }
      if (access) a.manifest.access = access;
      const bytes = F.encode(a, req);
      const current = req('@aikdna/kdna-core').admitBytes(bytes),
        prior = old('@aikdna/kdna-core').admitBytes(bytes);
      assert.equal(prior.status, 'accepted');
      assert.equal(current.status, 'accepted');
      assert.deepEqual(stable(current.snapshot), stable(prior.snapshot));
      for (const ep of ['node', 'browser']) {
        const fn = ep === 'node' ? 'admitNode' : 'admitBrowser';
        assert.deepEqual(
          stable(await req('@aikdna/kdna-core/' + ep)[fn](bytes)),
          stable(await old('@aikdna/kdna-core/' + ep)[fn](bytes)),
        );
      }
      for (const r of [req, old]) {
        const author = r('@aikdna/kdna-core/authoring-node'),
          opened = author.openSourceBytes(bytes),
          packed = author.packSourceBytes(bytes, {});
        assert.equal(opened.status, 'accepted');
        assert.equal(packed.status, 'accepted');
        assert.deepEqual(packed.source.payload, a.payload);
      }
      for (const mode of ['catalog', 'exact_selection']) {
        const candidate = F.candidate(tuple, a, mode),
          runs = [];
        for (const r of [old, req]) {
          const embedding = r('@aikdna/kdna-read/embedding'),
            host = ordinaryHost(embedding, r('@aikdna/kdna-core/read-boundary'));
          const got = await r('@aikdna/kdna-read/node').readNode(
            bytes,
            candidate,
            embedding.createTrustedReadControlProvider(() => ({
              admission_response_limit_bytes: 1000000,
            })),
            host,
          );
          runs.push(got);
        }
        // Stable semantics and diagnostics; allocated receipt ids/budget widths remain producer-specific.
        assert.deepEqual(stable(runs[0].envelope.content), stable(runs[1].envelope.content));
        assert.deepEqual(runs[0].envelope.states, runs[1].envelope.states);
        assert.deepEqual(runs[0].envelope.diagnostics, runs[1].envelope.diagnostics);
        readRows.push({ access: access ?? 'absent', form, mode, status: runs[1].envelope.status });
      }
    }
  check('OLD-NEW-ABSENCE', { cases: readRows });
  const catalogAsset = F.blank(tuple);
  catalogAsset.payload.extensions = [
    {
      id: 'urn:test:unknown',
      critical: true,
      definition: 'Unknown future semantics.',
      value: { kind: 'text', value: 'opaque' },
    },
  ];
  const catalogBytes = F.encode(catalogAsset, req),
    hostArms = [];
  for (const r of [old, req]) {
    const embedding = r('@aikdna/kdna-read/embedding'),
      ordinary = ordinaryHost(embedding, r('@aikdna/kdna-core/read-boundary'));
    let carrierSeen = 0;
    const boundary = r('@aikdna/kdna-core/read-boundary'),
      host = embedding.createTrustedHostReadProvider({
        observe({ request, snapshot }) {
          assert.equal(snapshot.status, 'catalog_only');
          carrierSeen++;
          return {
            host_id: 'host:catalog',
            host_epoch: 'epoch:1',
            decision_id: 'decision:catalog',
            request_id: request.request_id,
            snapshot_id: snapshot.carrier_id,
            A: snapshot.digests.A.observed,
            C: snapshot.digests.C.observed,
            scope: snapshot.catalog.map((x) => x.node_ref),
            issued_at: 900,
            expires_at: 2000,
            current_ms: 1000,
            decision: 'allow',
            policy_id: 'policy:catalog',
          };
        },
      });
    const got = await r('@aikdna/kdna-read/node').readNode(
      catalogBytes,
      F.candidate(tuple, catalogAsset, 'catalog'),
      embedding.createTrustedReadControlProvider(() => ({
        admission_response_limit_bytes: 1000000,
      })),
      host,
    );
    assert.equal(got.envelope.status, 'catalog_only');
    assert.equal(carrierSeen, 2);
    hostArms.push({ carrierSeen, diagnostics: got.envelope.diagnostics });
  }
  assert.deepEqual(hostArms[0], hostArms[1]);
  check('ORDINARY-CATALOG-HOST-ARMS', {
    ordinary_observations: readRows.length * 2,
    catalog: hostArms,
  });

  const source = fs.readFileSync(process.env.KDNA_PROTECTION_REAL_SOURCE),
    opened = req('@aikdna/kdna-core/authoring-node').openSourceBytes(source);
  assert.equal(opened.status, 'accepted');
  const actual = { manifest: opened.source.manifest, payload: opened.source.payload },
    plain = req('@aikdna/kdna-core').admitBytes(source),
    files = [];
  for (const mode of ['password', 'external-grant', 'integrity']) {
    let f, bytes, options, provider;
    if (mode === 'external-grant') {
      f = await H.external({ asset: actual, bytes: source });
      bytes = f.bytes;
      options = { credential: f.credential, signaturePolicy: H.policy };
      provider = f.provider;
    } else {
      const args =
          mode === 'password'
            ? {
                kind: 'password',
                asset_uid: actual.manifest.asset_uid,
                entitlement: { profile: 'password' },
                slots: [{ slot: 'one', kdf_profile: 'scrypt-sha256' }],
                checksums: true,
                signature: 'none',
              }
            : { kind: 'integrity', checksums: true, signature: 'none' },
        secrets =
          mode === 'password'
            ? { passwords: [{ slot: 'one', password: Buffer.from('installed-private-password') }] }
            : {};
      const produced = await core.protectSourceBytes(source, args, secrets);
      assert.equal(produced.status, 'produced');
      bytes = produced.bytes;
      options = {
        credential:
          mode === 'password'
            ? { kind: 'password', password: Buffer.from('installed-private-password') }
            : { kind: 'none' },
        signaturePolicy: H.policy,
      };
      provider = { kind: 'local', clock: () => 1000 };
    }
    const file = path.join(outRoot, mode + '.kdna');
    fs.writeFileSync(file, bytes, { flag: 'wx' });
    const admitted = await core.admitProtectedNode(file, options, provider);
    assert.equal(admitted.status, 'accepted');
    assert.equal(
      admitted.receipt.A,
      'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
    );
    const expectedIr = structuredClone(plain.snapshot.ir);
    if (mode !== 'integrity')
      for (const node of expectedIr.nodes)
        if (node.role === 'asset_declaration') node.value.access = 'licensed';
    assert.deepEqual(admitted.snapshot.ir, expectedIr);
    const fixture = { asset: actual, ...admitted },
      observe = H.observer(fixture),
      sink = path.join(outRoot, mode + '-sink.bin');
    fs.writeFileSync(sink, Buffer.alloc(0));
    let commit;
    const host = read.createTrustedProtectedHostReadProvider({
      observe,
      async deliver(result, token) {
        commit = await read.commitProtectedTransport(admitted.operation, token, {
          observeScope: observe,
          commit(value) {
            fs.appendFileSync(sink, Buffer.from(JSON.stringify(value)));
            return true;
          },
        });
        return true;
      },
    });
    const got = await read.readProtectedNode(
      admitted.operation,
      F.candidate(tuple, actual, 'exact_selection', actual.payload.judgments[0].id),
      H.control(),
      host,
    );
    assert.equal(got.status, 'read_result');
    assert.equal(got.result.envelope.status, 'ready');
    assert.equal(commit.status, 'committed');
    assert.ok(fs.statSync(sink).size > 0);
    assert.equal(
      duplicate('@aikdna/kdna-core/protection-node').bindProtectionOperation(admitted.operation)
        .status,
      'protection_failed',
    );
    assert.equal(
      core.bindProtectionOperation(JSON.parse(JSON.stringify(admitted.operation))).status,
      'protection_failed',
    );
    files.push({
      mode,
      file,
      sink,
      sink_bytes: fs.statSync(sink).size,
      receipt: admitted.receipt,
      read: got.disclosure,
    });
    core.disposeProtectionOperation(admitted.operation);
  }
  check('REAL-SOURCE-SAVED-PROTECTION', {
    source_A: 'sha256:' + crypto.createHash('sha256').update(source).digest('hex'),
    files,
  });
  check('DUPLICATE-CORE-BRAND', { restored: false });
  fs.writeFileSync(
    path.join(outRoot, 'OBSERVATIONS.json'),
    JSON.stringify(
      { node: process.version, status: 'IMPLEMENTER_OBSERVED_NOT_ACCEPTANCE', observations },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      status: 'OBSERVED',
      node: process.version,
      cases: observations.length,
      files: files.map((f) => ({ mode: f.mode, sink_bytes: f.sink_bytes, A: f.receipt.A })),
    }),
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
