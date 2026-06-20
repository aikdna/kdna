/**
 * v1-cli-subprocess.test.js — drive the actual `node packages/kdna/bin/kdna.js`
 * shim end-to-end. This is the test that proves the user's stated
 * invocation works:
 *
 *   node packages/kdna/bin/kdna.js inspect  examples/minimal
 *   node packages/kdna/bin/kdna.js validate examples/minimal
 *   node packages/kdna/bin/kdna.js pack     examples/minimal /tmp/out.kdna
 *   node packages/kdna/bin/kdna.js unpack   /tmp/out.kdna /tmp/out-dir
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const v1 = require('../../packages/kdna-core/src/v1');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliBin = path.join(repoRoot, 'packages', 'kdna', 'bin', 'kdna.js');
const exampleMinimal = path.join(repoRoot, 'examples', 'minimal');
const FORBIDDEN_TERMS = [
  'trusted',
  'recommended',
  'high_quality',
  'officially_approved',
  'quality_badge',
];

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [cliBin, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...opts,
  });
}

function tmpFile(name) {
  return path.join(fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-')), name);
}

test('cli: kdna inspect examples/minimal returns a content-neutral JSON manifest', () => {
  const r = runCli(['inspect', exampleMinimal]);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.equal(out.kdna_version, '1.0');
  assert.equal(out.asset_id, 'kdna:example:atomspeak-core');
  assert.equal(out.title, 'Atomspeak Core');
  assert.equal(out.payload, 'payload.kdnab');
  assert.equal(out.payload_encrypted, false);
  assert.equal(out.profile, 'judgment-profile-v1');
  for (const term of FORBIDDEN_TERMS) {
    assert.ok(!Object.prototype.hasOwnProperty.call(out, term), `forbidden term "${term}" present`);
  }
});

test('cli: kdna validate examples/minimal reports overall_valid=true', () => {
  const r = runCli(['validate', exampleMinimal]);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.equal(out.overall_valid, true);
  assert.equal(out.format_valid, true);
  assert.equal(out.schema_valid, true);
  assert.equal(out.payload_valid, true);
  assert.equal(out.checksums_valid, true);
  assert.equal(out.load_contract_valid, true);
  assert.deepEqual(out.problems, []);
});

test('cli: kdna validate --runtime exits 3 when LoadPlan cannot load now', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-validate-runtime-'));
  const secret = 'VALIDATE_RUNTIME_SECRET_SHOULD_NOT_LEAK';
  try {
    for (const name of fs.readdirSync(exampleMinimal)) {
      fs.copyFileSync(path.join(exampleMinimal, name), path.join(dir, name));
    }
    const manifestPath = path.join(dir, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.access = 'remote';
    manifest.runtime = { endpoint: 'https://runtime.example.test/v1/project' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    const payloadPath = path.join(dir, 'payload.kdnab');
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    payload.core.axioms = [{ id: 'secret', one_sentence: secret }];
    fs.writeFileSync(payloadPath, JSON.stringify(payload, null, 2));
    fs.writeFileSync(
      path.join(dir, 'checksums.json'),
      JSON.stringify(v1.buildChecksumsV1(dir), null, 2),
    );

    const r = runCli(['validate', dir, '--runtime']);
    assert.equal(r.status, 3, `stdout=${r.stdout}\nstderr=${r.stderr}`);
    const out = JSON.parse(r.stdout);
    assert.equal(out.overall_valid, true);
    assert.equal(out.runtime_load_plan.state, 'needs_runtime');
    assert.equal(out.runtime_load_plan.can_load_now, false);
    assert.ok(!r.stdout.includes(secret));
    assert.ok(!r.stderr.includes(secret));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: kdna plan-load examples/minimal returns a ready LoadPlan', () => {
  const r = runCli(['plan-load', exampleMinimal]);
  assert.equal(r.status, 0, `stdout=${r.stdout}\nstderr=${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.equal(out.access, 'public');
  assert.equal(out.state, 'ready');
  assert.equal(out.required_action, 'load');
  assert.equal(out.can_load_now, true);
  assert.equal(out.projection_policy, 'minimal');
  assert.equal(out.asset.asset_id, 'kdna:example:atomspeak-core');
});

test('cli: kdna plan-load returns 3 when the plan is valid but cannot load now', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-plan-exit-'));
  try {
    for (const name of fs.readdirSync(exampleMinimal)) {
      fs.copyFileSync(path.join(exampleMinimal, name), path.join(dir, name));
    }
    const manifestPath = path.join(dir, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.access = 'remote';
    manifest.runtime = { endpoint: 'https://runtime.example.test/v1/project' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(
      path.join(dir, 'checksums.json'),
      JSON.stringify(v1.buildChecksumsV1(dir), null, 2),
    );

    const r = runCli(['plan-load', dir]);
    assert.equal(r.status, 3, `stdout=${r.stdout}\nstderr=${r.stderr}`);
    const out = JSON.parse(r.stdout);
    assert.equal(out.state, 'needs_runtime');
    assert.equal(out.can_load_now, false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: kdna pack examples/minimal produces a deterministic container', () => {
  const a = tmpFile('pack-a.kdna');
  const b = tmpFile('pack-b.kdna');
  const rA = runCli(['pack', exampleMinimal, a]);
  const rB = runCli(['pack', exampleMinimal, b]);
  assert.equal(rA.status, 0, `pack-a failed: ${rA.stderr}`);
  assert.equal(rB.status, 0, `pack-b failed: ${rB.stderr}`);
  const ha = crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex');
  const hb = crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex');
  assert.equal(ha, hb, 'pack must be deterministic across runs');
});

test('cli: kdna unpack <packed> <dir> then kdna validate <dir> succeeds', () => {
  const a = tmpFile('packed.kdna');
  const outDir = path.join(path.dirname(a), 'unpacked');
  const rPack = runCli(['pack', exampleMinimal, a]);
  assert.equal(rPack.status, 0, `pack failed: ${rPack.stderr}`);
  const rUnpack = runCli(['unpack', a, outDir]);
  assert.equal(rUnpack.status, 0, `unpack failed: ${rUnpack.stderr}`);
  const rVal = runCli(['validate', outDir]);
  assert.equal(rVal.status, 0, `validate after unpack failed: ${rVal.stderr}`);
  const out = JSON.parse(rVal.stdout);
  assert.equal(out.overall_valid, true);
});

test('cli: kdna validate on a directory missing mimetype exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-nomime-'));
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    const r = runCli(['validate', dir]);
    // The router must not silently pass a non-v1 directory. Either
    // the v1 route rejects it (preferred) or the upstream CLI does
    // (acceptable: legacy behavior preserved). In neither case may
    // the command succeed.
    assert.notEqual(r.status, 0, `expected non-zero exit, got: ${r.stdout}`);
    assert.ok(
      !/overall_valid.*true/.test(r.stdout + r.stderr),
      'must not report overall_valid=true',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: kdna validate on a directory with the v2 mimetype exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-v2mime-'));
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.aikdna.kdna+zip');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    const r = runCli(['validate', dir]);
    // v1 router must not pass a v2-mimetype directory.
    assert.notEqual(r.status, 0, `expected non-zero exit, got: ${r.stdout}`);
    assert.ok(
      !/overall_valid.*true/.test(r.stdout + r.stderr),
      'must not report overall_valid=true',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: kdna validate on a directory with lineage as array exits non-zero', () => {
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-v1-lineagearr-'));
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(
      path.join(dir, 'kdna.json'),
      JSON.stringify({
        kdna_version: '1.0',
        asset_id: 'kdna:test:lineage-array',
        asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000099',
        asset_type: 'sample',
        title: 'lineage array negative',
        version: '1.0.0',
        judgment_version: '1.0.0',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        creator: { name: 'Test' },
        compatibility: { min_loader_version: '1.0.0', profile: 'judgment-profile-v1' },
        payload: { path: 'payload.kdnab', encoding: 'json', encrypted: false },
        lineage: [{ type: 'original' }],
      }),
    );
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    const r = runCli(['validate', dir]);
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /lineage/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: kdna inspect on a v2 .kdna container is NOT routed to v1 (legacy preserved)', () => {
  // The conformance fixture is a v2 .kdna container. It must reach
  // the upstream CLI, not the v1 inspector. The upstream `inspect`
  // prints a JSON envelope with v2-specific fields, which the v1
  // inspector would never produce.
  const v2Fixture = path.join(repoRoot, 'fixtures', 'test_conformance.kdna');
  if (!fs.existsSync(v2Fixture)) return; // optional in some checkouts
  const r = runCli(['inspect', v2Fixture, '--json']);
  // We don't assert the exact upstream output — it varies across
  // versions. We only assert that the upstream CLI was reached: the
  // v1 inspector never emits the `name` field at the top level, and
  // v2 outputs always do.
  const out = JSON.parse(r.stdout);
  assert.ok(out.name, 'upstream CLI must have produced the v2 envelope');
  assert.ok(!('asset_uid' in out), 'v2 envelope does not expose v1 asset_uid');
});

test('cli: a non-v1 directory does NOT trigger the v1 route (no false positive)', () => {
  // A directory that contains kdna.json but no mimetype must not be
  // misclassified as v1.
  const dir = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-not-v1-'));
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    // No mimetype, no payload.kdnab — definitely not a v1 source dir.
    // The router should fall through to upstream, which will error
    // out because it doesn't know what to do with this directory.
    const r = runCli(['validate', dir]);
    assert.notEqual(r.status, 0, 'must not silently pass a non-v1 directory');
    // The error must come from the v1 router (saying "missing mimetype")
    // OR from the upstream CLI. Both are acceptable. What we want to
    // be sure of is that we did NOT emit a successful v1 validation.
    const merged = r.stdout + r.stderr;
    assert.ok(
      !/overall_valid.*true/.test(merged),
      'must not report overall_valid=true for a non-v1 dir',
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('cli: legacy .kdna path is NOT routed to v1 (legacy kdna-inspect still works)', () => {
  // When the input is a v2 .kdna file, the shim should fall through
  // to the upstream kdna-cli, not the v1 inspector. The v1 inspector
  // would refuse it because the mimetype would be v2.
  const v2Fixture = path.join(repoRoot, 'fixtures', 'test_conformance.kdna');
  if (!fs.existsSync(v2Fixture)) return;
  const r = runCli(['inspect', v2Fixture, '--json']);
  // If the shim had routed this to v1, it would have exited non-zero
  // with a "not a KDNA v1 container" error. Upstream produces a
  // well-formed v2 envelope (with `name` at the top level) instead.
  assert.equal(r.status, 0, `expected upstream success, got: ${r.stderr}`);
  const out = JSON.parse(r.stdout);
  assert.ok(out.name, 'upstream CLI must have produced the v2 envelope');
  assert.equal(out.format, 'kdna-zip');
});
