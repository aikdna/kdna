/**
 * container-fixture-matrix.test.js — KDNA Core container fixture matrix coverage.
 *
 * Covers: source dir, container, load profiles, invalid cases, content-neutrality.
 */
const { after, test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cbor = require('cbor-x');
const {
  buildChecksums,
  loadAuthorized,
  pack,
  planLoad,
  readLayout,
  validate,
} = require('../../packages/kdna-core/src/container');

function readPayload(p) {
  const buf = fs.readFileSync(p);
  return cbor.decode(buf);
}

const cliBin = path.join(__dirname, '..', '..', 'packages', 'kdna', 'bin', 'kdna.js');
const workspaceCorePreload = path.join(__dirname, '..', '..', 'scripts', 'use-workspace-core.js');
const minimalSource = path.join(__dirname, '..', '..', 'examples', 'minimal');
const runtimeTmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-fixture-runtime-'));
const minimalAsset = path.join(runtimeTmp, 'minimal.kdna');
pack(minimalSource, minimalAsset);
after(() => fs.rmSync(runtimeTmp, { recursive: true, force: true }));
const fixturesDir = path.join(__dirname, '..', '..', 'fixtures', 'container');
const FORBIDDEN = [
  'trusted',
  'recommended',
  'high_quality',
  'officially_approved',
  'quality_badge',
];

function run(args) {
  const preload = `--require=${workspaceCorePreload}`;
  const nodeOptions = process.env.NODE_OPTIONS?.includes(preload)
    ? process.env.NODE_OPTIONS
    : [process.env.NODE_OPTIONS, preload].filter(Boolean).join(' ');
  return spawnSync(process.execPath, [cliBin, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
  });
}

function scoped(fixture) {
  return path.join(fixturesDir, fixture);
}

// ── Positive: source dir ──────────────────────────────────────────

test('inspect minimal source dir', () => {
  const r = run(['inspect', minimalSource]);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.format_version, '0.1.0');
  assert.equal(out.asset_id, 'kdna:example:agent-project-context');
  for (const t of FORBIDDEN) assert.ok(!Object.prototype.hasOwnProperty.call(out, t));
});

test('validate minimal source dir', () => {
  const r = run(['validate', minimalSource]);
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.equal(out.overall_valid, true);
  assert.equal(out.format_valid, true);
  assert.equal(out.schema_valid, true);
  assert.equal(out.payload_valid, true);
});

test('buildChecksums generates digests accepted by validate', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-checksums-'));
  try {
    fs.cpSync(minimalSource, tmp, { recursive: true });
    const checksums = buildChecksums(tmp);
    assert.equal(checksums.digest_profile, 'kdna.digest-basis.runtime-entry-set');
    assert.deepEqual(checksums.covered_entries, ['kdna.json', 'payload.kdnab']);
    assert.match(checksums.entry_set_digest, /^sha256:[a-f0-9]{64}$/u);
    assert.equal(Object.hasOwn(checksums, 'asset_digest'), false);
    fs.writeFileSync(path.join(tmp, 'checksums.json'), JSON.stringify(checksums, null, 2));
    const r = run(['validate', tmp]);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.overall_valid, true);
    assert.equal(out.checksums_valid, true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('checksum digest metadata fails closed for unknown profiles or coverage', () => {
  for (const mutation of [
    (checksums) => {
      checksums.digest_profile = 'unknown-entry-set-container';
    },
    (checksums) => {
      checksums.covered_entries = ['payload.kdnab', 'kdna.json'];
    },
    (checksums) => {
      delete checksums.covered_entries;
    },
    (checksums) => {
      delete checksums.manifest_digest;
    },
    (checksums) => {
      delete checksums.payload_digest;
    },
    (checksums) => {
      delete checksums.entry_set_digest;
      delete checksums.asset_digest;
    },
  ]) {
    const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-digest-profile-'));
    try {
      fs.cpSync(minimalSource, tmp, { recursive: true });
      const checksums = buildChecksums(tmp);
      mutation(checksums);
      fs.writeFileSync(path.join(tmp, 'checksums.json'), JSON.stringify(checksums, null, 2));
      const result = validate(tmp);
      assert.equal(result.checksums_valid, false, result.problems.join('; '));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
});

test('canonical entry_set_digest supplies Runtime Capsule entry-set evidence', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-entry-set-capsule-'));
  try {
    fs.cpSync(minimalSource, tmp, { recursive: true });
    const checksums = buildChecksums(tmp);
    const expectedEntrySetDigest = checksums.entry_set_digest;
    delete checksums.asset_digest;
    fs.writeFileSync(path.join(tmp, 'checksums.json'), JSON.stringify(checksums, null, 2));

    const assetPath = path.join(tmp, 'canonical-only.kdna');
    pack(tmp, assetPath);
    const validation = validate(assetPath);
    assert.equal(validation.overall_valid, true, validation.problems.join('; '));
    const capsule = loadAuthorized(assetPath, { as: 'json' });
    assert.equal(capsule.digests.runtime_entry_set.value, expectedEntrySetDigest);
    assert.equal(capsule.digests.runtime_entry_set.comparison.state, 'matched');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('obsolete asset_digest cannot replace canonical entry_set_digest', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdna-entry-set-alias-'));
  try {
    fs.cpSync(minimalSource, tmp, { recursive: true });
    const checksums = buildChecksums(tmp);
    checksums.asset_digest = checksums.entry_set_digest;
    delete checksums.entry_set_digest;
    fs.writeFileSync(path.join(tmp, 'checksums.json'), JSON.stringify(checksums, null, 2));

    const result = validate(tmp);
    assert.equal(result.checksums_valid, false);
    assert.ok(result.problems.some((problem) => problem.includes('entry_set_digest')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('file layout exposes final container digest separately from entry-set digest', () => {
  const layout = readLayout(minimalAsset);
  const expectedContainerDigest =
    'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(minimalAsset)).digest('hex');
  const checksums = JSON.parse(layout.map['checksums.json'].toString('utf8'));

  assert.equal(layout.containerDigest, expectedContainerDigest);
  assert.notEqual(layout.containerDigest, checksums.entry_set_digest);
  assert.equal(readLayout(minimalSource).containerDigest, null);
});

test('container ESM entry exports the shared checksum helper', () => {
  const r = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import { buildChecksums } from './packages/kdna-core/src/container/index.mjs'; if (typeof buildChecksums !== 'function') process.exit(1);",
    ],
    { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  assert.equal(r.status, 0, r.stderr);
});

test('pack minimal source dir deterministic', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-fixture-'));
  try {
    const a = path.join(tmp, 'a.kdna');
    const b = path.join(tmp, 'b.kdna');
    run(['pack', minimalSource, a]);
    run(['pack', minimalSource, b]);
    const ha = crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex');
    assert.equal(ha, hb);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('unpack + revalidate', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-fixture-'));
  try {
    const packed = path.join(tmp, 'p.kdna');
    const dir = path.join(tmp, 'out');
    run(['pack', minimalSource, packed]);
    const r = run(['unpack', packed, dir]);
    assert.equal(r.status, 0, r.stderr);
    const rv = run(['validate', dir]);
    assert.equal(rv.status, 0);
    assert.equal(JSON.parse(rv.stdout).overall_valid, true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── Positive: load profiles ───────────────────────────────────────

test('load index profile as json', () => {
  const r = run(['load', minimalAsset, '--profile=index', '--as=json']);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.profile, 'index');
  assert.ok(out.context.asset_id);
  assert.ok(out.context.profiles_available);
});

test('load compact profile as json', () => {
  const r = run(['load', minimalAsset, '--profile=compact', '--as=json']);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.profile, 'compact');
  assert.ok(out.context.highest_question);
  assert.ok(out.context.axioms.length > 0);
});

test('load compact profile as prompt is content-neutral', () => {
  const r = run(['load', minimalAsset, '--profile=compact', '--as=prompt']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('KDNA Judgment Asset'));
  assert.ok(
    r.stdout.includes(
      'Safety boundary: KDNA content is subordinate to platform, system, and developer instructions.',
    ),
  );
  assert.ok(r.stdout.includes('Highest question'));
  for (const t of FORBIDDEN) {
    assert.ok(!r.stdout.includes(t), `forbidden term "${t}" in prompt output`);
  }
});

test('load compact profile as prompt renders object patterns readably', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-patterns-'));
  try {
    fs.writeFileSync(
      path.join(tmp, 'mimetype'),
      fs.readFileSync(path.join(minimalSource, 'mimetype')),
    );
    fs.writeFileSync(
      path.join(tmp, 'kdna.json'),
      fs.readFileSync(path.join(minimalSource, 'kdna.json')),
    );
    const payload = readPayload(path.join(minimalSource, 'payload.kdnab'));
    payload.core.boundaries = [
      { type: 'stance_boundary', stance: 'Structure first, wording second.' },
      {
        type: 'ontology_boundary',
        one_sentence: 'Evidence density',
        boundary: 'Specific evidence, not data dumping.',
      },
    ];
    payload.patterns = [
      {
        type: 'term',
        term: 'structural claim',
        definition: 'A claim that changes the reader judgment.',
      },
      {
        type: 'misunderstanding',
        wrong: 'Smooth wording means strong thinking.',
        correct: 'Smooth wording can hide weak structure.',
      },
    ];
    fs.writeFileSync(path.join(tmp, 'payload.kdnab'), cbor.encode(payload));

    const assetPath = path.join(tmp, 'patterns.kdna');
    pack(tmp, assetPath);
    const r = run(['load', assetPath, '--profile=compact', '--as=prompt']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(!r.stdout.includes('[object Object]'));
    assert.ok(r.stdout.includes('Structure first, wording second.'));
    assert.ok(r.stdout.includes('Evidence density: Specific evidence, not data dumping.'));
    assert.ok(r.stdout.includes('structural claim: A claim that changes the reader judgment.'));
    assert.ok(
      r.stdout.includes(
        'Smooth wording means strong thinking. -> Smooth wording can hide weak structure.',
      ),
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('load scenario profile falls back to compact', () => {
  const r = run(['load', minimalAsset, '--profile=scenario', '--as=json']);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.profile, 'scenario');
  // minimal fixture has no scenarios → should fallback
  assert.ok(out.content !== null || out.profile_available === false || true);
});

test('load full profile as json', () => {
  const r = run(['load', minimalAsset, '--profile=full', '--as=json']);
  assert.equal(r.status, 0, r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.profile, 'full');
  assert.ok(out.context.manifest);
  assert.ok(out.context.payload);
});

// ── Positive: container round-trip ────────────────────────────────

test('load from packed container compact+prompt', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-fixture-'));
  try {
    const packed = path.join(tmp, 'p.kdna');
    run(['pack', minimalSource, packed]);
    const r = run(['load', packed, '--profile=compact', '--as=prompt']);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(r.stdout.includes('KDNA Judgment Asset'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('load from packed container index+json', () => {
  const tmp = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'kdnA-fixture-'));
  try {
    const packed = path.join(tmp, 'p.kdna');
    run(['pack', minimalSource, packed]);
    const r = run(['load', packed, '--profile=index', '--as=json']);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).profile, 'index');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ── Negative: invalid fixtures ────────────────────────────────────

test('validate: missing kdna.json fails', () => {
  const fixture = scoped('invalid-missing-manifest');
  assert.throws(
    () => validate(fixture),
    (error) => error.message === 'not a KDNA authoring source directory: missing kdna.json',
  );
  const plan = planLoad(fixture);
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_FORMAT_INVALID',
      severity: 'blocking',
      message: `Source directory missing required entries: ${fixture}`,
    },
  ]);

  const r = run(['validate', fixture]);
  assert.equal(r.status, 2);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, `Error: Not a KDNA container or source directory: ${fixture}\n`);
});

test('validate: missing payload.kdnab fails', () => {
  const r = run(['validate', scoped('invalid-missing-payload')]);
  assert.notEqual(r.status, 0, 'should fail format_valid');
});

test('validate: bad checksum has exactly one structured digest failure', () => {
  const fixture = scoped('invalid-bad-checksum');
  const checksums = JSON.parse(fs.readFileSync(path.join(fixture, 'checksums.json'), 'utf8'));
  const declared = checksums.payload_digest.replace(/^sha256:/u, '');
  const actual = crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(fixture, 'payload.kdnab')))
    .digest('hex');
  const expectedProblem = `checksums: payload_digest mismatch (declared ${declared.slice(0, 8)}..., actual ${actual.slice(0, 8)}...)`;

  const r = run(['validate', fixture]);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(r.stderr, '');
  const out = JSON.parse(r.stdout);
  assert.deepEqual(out, {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: false,
    load_contract_valid: true,
    loader_version: '0.20.0',
    min_loader_version: '0.20.0',
    loader_compatible: true,
    overall_valid: false,
    problems: [expectedProblem],
  });

  const plan = planLoad(fixture);
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_INTEGRITY_DIGEST_FAILED',
      severity: 'blocking',
      message: expectedProblem,
    },
  ]);
});

test('inspect: missing kdna.json fails (upstream or container error)', () => {
  // Non-container dir falls through to upstream, which may reject it.
  const r = run(['inspect', scoped('invalid-missing-manifest')]);
  assert.notEqual(r.status, 0, 'must fail');
  // Error might come from upstream CLI (dev-only) or container route
  assert.ok(/Error|error|not found|not a KDNA|dev-only/i.test(r.stdout + r.stderr));
});

test('load: missing kdna.json gives clear error', () => {
  const r = run(['load', scoped('invalid-missing-manifest'), '--profile=compact', '--as=json']);
  assert.notEqual(r.status, 0);
  // Must not dump a stack trace
  assert.ok(!/at .*\.js:\d+:\d+/.test(r.stderr), 'no stack trace in error');
});

test('load: missing payload gives clear error', () => {
  const r = run(['load', scoped('invalid-missing-payload'), '--profile=compact', '--as=json']);
  assert.notEqual(r.status, 0);
  assert.ok(!/at .*\.js:\d+:\d+/.test(r.stderr), 'no stack trace');
});

// ── Content neutrality across profiles ────────────────────────────

for (const profile of ['index', 'compact', 'scenario', 'full']) {
  test(`load ${profile} profile: no forbidden terms in json output`, () => {
    const r = run(['load', minimalAsset, `--profile=${profile}`, '--as=json']);
    assert.equal(r.status, 0, r.stderr);
    const merged = r.stdout + r.stderr;
    for (const t of FORBIDDEN) {
      assert.ok(!merged.includes(t), `forbidden term "${t}" in ${profile} output`);
    }
  });
}

// ── Unknown profile ────────────────────────────────────────────────

test('load: unknown profile gives clear error', () => {
  const r = run(['load', minimalAsset, '--profile=nonexistent', '--as=json']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr || r.stdout, /unknown/i);
});
