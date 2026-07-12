/**
 * v1-cli-shared.test.js — direct unit tests for shared @aikdna/kdna-core v1.
 *
 * Covers the routing + format-detection + pack/unpack logic that the
 * bin/kdna.js shim depends on. The subprocess tests (driving the actual
 * `kdna inspect / validate / pack / unpack` binary) live in
 * v1-cli-subprocess.test.js.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

function readPayload(p) {
  const buf = fs.readFileSync(p);
  return cbor.decode(buf);
}
const crypto = require('node:crypto');
const Ajv = require('ajv/dist/2020.js');

const v1 = require('../../packages/kdna-core/src/v1');
const { MIMETYPE, FORBIDDEN_OUTPUT_TERMS } = v1;

const repoRoot = path.resolve(__dirname, '..', '..');
const exampleMinimal = path.join(repoRoot, 'examples', 'minimal');
const loadPlanSchema = JSON.parse(
  fs.readFileSync(
    path.join(repoRoot, 'packages', 'kdna-core', 'schema', 'load-plan.schema.json'),
    'utf8',
  ),
);
const validateLoadPlanSchema = new Ajv({ allErrors: true, strict: false }).compile(loadPlanSchema);

function makeTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function copyMinimal(dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(exampleMinimal)) {
    fs.copyFileSync(path.join(exampleMinimal, f), path.join(dest, f));
  }
  return dest;
}

function mutateManifest(dir, mutator) {
  const manifestPath = path.join(dir, 'kdna.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  mutator(manifest);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(
    path.join(dir, 'checksums.json'),
    JSON.stringify(v1.buildChecksums(dir), null, 2),
  );
}

function testCrc32(buf) {
  const table = (() => {
    const out = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      out[n] = c >>> 0;
    }
    return out;
  })();
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function writeTestZip(outputPath, entries) {
  const locals = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(String(entry.data), 'utf8');
    const crc = testCrc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(1, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    locals.push(localHeader, nameBytes, data);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(1, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBytes.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE((entry.externalAttributes || 0) >>> 0, 38);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBytes);
    offset += localHeader.length + nameBytes.length + data.length;
  }
  const cdOffset = offset;
  const cdSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  fs.writeFileSync(outputPath, Buffer.concat([...locals, ...central, eocd]));
}

function validContainerEntries(sourceDir) {
  return ['mimetype', 'kdna.json', 'payload.kdnab', 'checksums.json']
    .filter((name) => fs.existsSync(path.join(sourceDir, name)))
    .map((name) => ({ name, data: fs.readFileSync(path.join(sourceDir, name)) }));
}

function assertForbiddenTermsAbsent(obj) {
  const seen = new Set();
  function walk(o) {
    if (o === null || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      o.forEach(walk);
      return;
    }
    for (const k of Object.keys(o)) {
      if (FORBIDDEN_OUTPUT_TERMS.includes(k)) seen.add(k);
      walk(o[k]);
    }
  }
  walk(obj);
  assert.equal(seen.size, 0, `forbidden terms in output: ${[...seen].join(', ')}`);
}

function assertValidLoadPlan(plan) {
  assert.equal(
    validateLoadPlanSchema(plan),
    true,
    JSON.stringify(validateLoadPlanSchema.errors, null, 2),
  );
}

test('isKdnaSourceDir: true for examples/minimal', () => {
  assert.equal(v1.isKdnaSourceDir(exampleMinimal), true);
});

test('isKdnaSourceDir: false for a non-existent path', () => {
  assert.equal(
    v1.isKdnaSourceDir(path.join(os.tmpdir(), 'definitely-not-a-dir-xyz' + Date.now())),
    false,
  );
});

test('isKdnaSourceDir: false for a directory missing mimetype', () => {
  const dir = makeTmp('kdna-v1-');
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), '{}');
    assert.equal(v1.isKdnaSourceDir(dir), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('isKdnaSourceDir: false for a directory with wrong mimetype', () => {
  const dir = makeTmp('kdna-v1-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/octet-stream');
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), '{}');
    assert.equal(v1.isKdnaSourceDir(dir), false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detectContainerFormat: returns "kdna" for a packed .kdna', () => {
  const dir = makeTmp('kdna-v1-pack-');
  const outFile = path.join(dir, 'packed.kdna');
  try {
    copyMinimal(path.join(dir, 'src'));
    v1.pack(path.join(dir, 'src'), outFile);
    assert.equal(v1.detectContainerFormat(outFile), 'kdna');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('detectContainerFormat: returns "kdna" for a .kdna container', () => {
  const kdnaFile = path.join(repoRoot, 'examples', 'minimal.kdna');
  if (!fs.existsSync(kdnaFile)) {
    // pack the minimal example on demand
    const dir = makeTmp('kdna-pack-');
    try {
      const src = path.join(repoRoot, 'examples', 'minimal');
      const out = path.join(dir, 'minimal.kdna');
      v1.pack(src, out);
      assert.equal(v1.detectContainerFormat(out), 'kdna');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    return;
  }
  assert.equal(v1.detectContainerFormat(kdnaFile), 'kdna');
});

test('detectContainerFormat: returns null for a non-zip file', () => {
  const tmp = path.join(os.tmpdir(), `not-a-zip-${Date.now()}.txt`);
  fs.writeFileSync(tmp, 'this is plain text, not a container\n');
  try {
    assert.equal(v1.detectContainerFormat(tmp), null);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

test('inspect: examples/minimal returns the documented fields', () => {
  const out = v1.inspect(exampleMinimal);
  assert.equal(out.kdna_version, '1.0');
  assert.equal(out.asset_id, 'kdna:example:agent-project-context');
  assert.equal(out.title, 'Agent Project Context');
  assert.equal(out.version, '1.0.0');
  assert.equal(out.payload, 'payload.kdnab');
  assert.equal(out.payload_encrypted, false);
  assert.equal(out.profile, 'judgment-profile-v1');
  assert.equal(out.load_contract_default_profile, 'compact');
});

test('inspect: output never contains forbidden trust terms', () => {
  const out = v1.inspect(exampleMinimal);
  assertForbiddenTermsAbsent(out);
});

test('inspect: a packed .kdna container produces the same output as its source dir', () => {
  const dir = makeTmp('kdna-v1-roundtrip-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const packed = path.join(dir, 'packed.kdna');
    v1.pack(src, packed);
    const fromDir = v1.inspect(src);
    const fromContainer = v1.inspect(packed);
    assert.deepEqual(fromContainer, fromDir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: examples/minimal reports all gates valid', () => {
  const out = v1.validate(exampleMinimal);
  assert.equal(out.format_valid, true);
  assert.equal(out.schema_valid, true);
  assert.equal(out.payload_valid, true);
  assert.equal(out.checksums_valid, true);
  assert.equal(out.load_contract_valid, true);
  assert.equal(out.overall_valid, true);
  assert.deepEqual(out.problems, []);
});

test('planLoad: public v1 asset is ready for minimal projection', () => {
  const plan = v1.planLoad(exampleMinimal);
  assertValidLoadPlan(plan);
  assert.equal(plan.access, 'public');
  assert.equal(plan.state, 'ready');
  assert.equal(plan.required_action, 'load');
  assert.equal(plan.can_load_now, true);
  assert.equal(plan.projection_policy, 'minimal');
  assert.ok(typeof plan.input_fingerprint === 'object' && plan.input_fingerprint !== null);
  assert.match(plan.input_fingerprint.source_fingerprint, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(plan.issues, []);
});

test('planLoad: password licensed asset requires password before load', () => {
  const dir = makeTmp('kdna-v1-plan-password-');
  try {
    copyMinimal(dir);
    mutateManifest(dir, (manifest) => {
      manifest.access = 'licensed';
      manifest.entitlement = { profile: 'password', offline: true, revocable: false };
      manifest.encryption = {
        profile: 'kdna-password-protected-v1',
        encrypted_entries: ['payload.kdnab'],
      };
      manifest.payload.encrypted = true;
    });

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.access, 'licensed');
    assert.equal(plan.entitlement_profile, 'password');
    assert.equal(plan.state, 'needs_password');
    assert.equal(plan.required_action, 'enter_password');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.issues[0].code, 'KDNA_AUTH_PASSWORD_REQUIRED');

    const unlockedPlan = v1.planLoad(dir, { hasPassword: true });
    assertValidLoadPlan(unlockedPlan);
    assert.equal(unlockedPlan.state, 'ready');
    assert.equal(unlockedPlan.required_action, 'load');
    assert.equal(unlockedPlan.can_load_now, true);
    assert.equal(unlockedPlan.issues[0].code, 'KDNA_AUTH_PASSWORD_DIAGNOSTIC');
    assert.equal(unlockedPlan.issues[0].severity, 'info');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: licensed receipt entitlement maps to stable states and actions', () => {
  const dir = makeTmp('kdna-v1-plan-receipt-');
  try {
    copyMinimal(dir);
    mutateManifest(dir, (manifest) => {
      manifest.access = 'licensed';
      manifest.entitlement = { profile: 'local_receipt', offline: true, revocable: true };
    });

    const missingPlan = v1.planLoad(dir);
    assertValidLoadPlan(missingPlan);
    assert.equal(missingPlan.state, 'needs_license');
    assert.equal(missingPlan.required_action, 'install_receipt');
    assert.equal(missingPlan.can_load_now, false);
    assert.equal(missingPlan.issues[0].code, 'KDNA_AUTH_ENTITLEMENT_REQUIRED');

    const activePlan = v1.planLoad(dir, { entitlement: { status: 'active' } });
    assertValidLoadPlan(activePlan);
    assert.equal(activePlan.state, 'ready');
    assert.equal(activePlan.required_action, 'load');
    assert.equal(activePlan.can_load_now, true);

    const expiredPlan = v1.planLoad(dir, { entitlement: { status: 'expired' } });
    assertValidLoadPlan(expiredPlan);
    assert.equal(expiredPlan.state, 'expired_grace');
    assert.equal(expiredPlan.required_action, 'renew_entitlement');
    assert.equal(expiredPlan.can_load_now, false);
    assert.equal(expiredPlan.issues[0].code, 'KDNA_AUTH_EXPIRED');

    const revokedPlan = v1.planLoad(dir, { entitlement: { status: 'revoked' } });
    assertValidLoadPlan(revokedPlan);
    assert.equal(revokedPlan.state, 'denied');
    assert.equal(revokedPlan.required_action, 'contact_issuer');
    assert.equal(revokedPlan.can_load_now, false);
    assert.equal(revokedPlan.issues[0].code, 'KDNA_AUTH_REVOKED');

    const gracePlan = v1.planLoad(dir, { entitlement: { status: 'offline_grace' } });
    assertValidLoadPlan(gracePlan);
    assert.equal(gracePlan.state, 'offline_grace');
    assert.equal(gracePlan.required_action, 'sync');
    assert.equal(gracePlan.can_load_now, true);
    assert.equal(gracePlan.issues[0].code, 'KDNA_AUTH_OFFLINE_GRACE_ACTIVE');
    assert.equal(gracePlan.issues[0].severity, 'warning');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: account and org entitlements require activation before load', () => {
  const cases = [
    ['account', 'needs_account', 'KDNA_AUTH_ACCOUNT_REQUIRED'],
    ['org', 'needs_org_auth', 'KDNA_AUTH_ORG_REQUIRED'],
  ];
  for (const [profile, state, issueCode] of cases) {
    const dir = makeTmp(`kdna-v1-plan-${profile}-`);
    try {
      copyMinimal(dir);
      mutateManifest(dir, (manifest) => {
        manifest.access = 'licensed';
        manifest.entitlement = { profile, offline: false, revocable: true };
      });

      const plan = v1.planLoad(dir);
      assertValidLoadPlan(plan);
      assert.equal(plan.entitlement_profile, profile);
      assert.equal(plan.state, state);
      assert.equal(plan.required_action, 'sign_in_or_activate');
      assert.equal(plan.can_load_now, false);
      assert.equal(plan.issues[0].code, issueCode);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('planLoad: unknown entitlement profile fails closed', () => {
  const dir = makeTmp('kdna-v1-plan-unknown-entitlement-');
  try {
    copyMinimal(dir);
    mutateManifest(dir, (manifest) => {
      manifest.access = 'licensed';
      manifest.entitlement = { profile: 'coupon_code', offline: false, revocable: true };
    });

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.state, 'invalid');
    assert.equal(plan.required_action, 'block');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.issues[0].code, 'KDNA_ENTITLEMENT_PROFILE_UNKNOWN');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: remote asset requires runtime and does not load locally', () => {
  const dir = makeTmp('kdna-v1-plan-remote-');
  try {
    copyMinimal(dir);
    mutateManifest(dir, (manifest) => {
      manifest.access = 'remote';
      manifest.runtime = { endpoint: 'https://runtime.example.test/v1/project' };
    });

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.access, 'remote');
    assert.equal(plan.state, 'needs_runtime');
    assert.equal(plan.required_action, 'connect_runtime');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.projection_policy, 'remote');
    assert.equal(plan.issues[0].code, 'KDNA_AUTH_REMOTE_RUNTIME_REQUIRED');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('loadV1: rejected LoadPlan states do not leak judgment payload', () => {
  const secret = 'SECRET_PAYLOAD_SHOULD_NOT_LEAK';
  const cases = [
    [
      'remote',
      (manifest) => {
        manifest.access = 'remote';
      },
    ],
    [
      'needs_license',
      (manifest) => {
        manifest.access = 'licensed';
        manifest.entitlement = { profile: 'local_receipt', offline: true, revocable: true };
      },
    ],
    [
      'expired',
      (manifest) => {
        manifest.access = 'licensed';
        manifest.entitlement = { profile: 'local_receipt', offline: true, revocable: true };
      },
      { entitlement: { status: 'expired' } },
    ],
    [
      'revoked',
      (manifest) => {
        manifest.access = 'licensed';
        manifest.entitlement = { profile: 'local_receipt', offline: true, revocable: true };
      },
      { entitlement: { status: 'revoked' } },
    ],
    [
      'unknown_access',
      (manifest) => {
        manifest.access = 'subscription';
      },
    ],
  ];

  for (const [label, mutate, loadOptions = {}] of cases) {
    const dir = makeTmp(`kdna-v1-load-denied-${label}-`);
    try {
      copyMinimal(dir);
      const payloadPath = path.join(dir, 'payload.kdnab');
      const payload = readPayload(payloadPath);
      payload.core.axioms = [{ id: 'secret', one_sentence: secret }];
      fs.writeFileSync(payloadPath, cbor.encode(payload));
      mutateManifest(dir, mutate);

      assert.throws(
        () => v1.load(dir, { profile: 'compact', as: 'prompt', ...loadOptions }),
        (error) => {
          assert.ok(!String(error.message).includes(secret), `${label} leaked payload in error`);
          assert.ok(
            !JSON.stringify(error.plan || {}).includes(secret),
            `${label} leaked payload in plan`,
          );
          return true;
        },
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

test('loadV1: compact profile preserves Human Lock boundary fields', () => {
  const dir = makeTmp('kdna-v1-human-lock-projection-');
  try {
    copyMinimal(dir);
    const payloadPath = path.join(dir, 'payload.kdnab');
    const payload = readPayload(payloadPath);
    payload.core.axioms = [
      {
        id: 'evidence_first',
        one_sentence: 'Prefer specific evidence over broad claims',
        applies_when: 'reviewing factual claims',
        does_not_apply_when: 'writing fictional copy',
        failure_risk: 'The agent may overfit to unsupported generalities.',
      },
    ];
    fs.writeFileSync(payloadPath, cbor.encode(payload));
    fs.writeFileSync(
      path.join(dir, 'checksums.json'),
      JSON.stringify(v1.buildChecksums(dir), null, 2),
    );

    const loaded = v1.load(dir, { profile: 'compact', as: 'json' });
    assert.equal(loaded.type, 'kdna.context.capsule');
    assert.deepEqual(loaded.context.axioms[0], {
      type: 'axiom_applicability',
      id: 'evidence_first',
      statement: 'Prefer specific evidence over broad claims',
      one_sentence: 'Prefer specific evidence over broad claims',
      applies_when: ['reviewing factual claims'],
      does_not_apply_when: ['writing fictional copy'],
      failure_risk: 'The agent may overfit to unsupported generalities.',
    });

    const prompt = v1.load(dir, { profile: 'compact', as: 'prompt' }).text;
    assert.match(prompt, /applies when: reviewing factual claims/);
    assert.match(prompt, /does not apply when: writing fictional copy/);
    assert.match(prompt, /failure risk: The agent may overfit/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: unknown access fails closed with a schema-valid plan', () => {
  const dir = makeTmp('kdna-v1-plan-unknown-access-');
  try {
    copyMinimal(dir);
    mutateManifest(dir, (manifest) => {
      manifest.access = 'subscription';
    });

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.access, null);
    assert.equal(plan.state, 'invalid');
    assert.equal(plan.required_action, 'block');
    assert.equal(plan.issues[0].code, 'KDNA_ACCESS_MODE_UNKNOWN');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: checksum mismatch returns invalid with blocking issue', () => {
  const dir = makeTmp('kdna-v1-plan-invalid-');
  try {
    copyMinimal(dir);
    const checksumsPath = path.join(dir, 'checksums.json');
    const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
    checksums.payload_digest =
      'sha256:0000000000000000000000000000000000000000000000000000000000000000';
    fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.state, 'invalid');
    assert.equal(plan.required_action, 'block');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.checks.checksums_valid, false);
    assert.ok(plan.issues.some((issue) => issue.code === 'KDNA_INTEGRITY_DIGEST_FAILED'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: placeholder asset_digest is rejected', () => {
  const dir = makeTmp('kdna-v1-placeholder-digest-');
  try {
    copyMinimal(dir);
    const checksumsPath = path.join(dir, 'checksums.json');
    const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
    checksums.asset_digest = 'sha256:placeholder';
    fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));

    const out = v1.validate(dir);
    assert.equal(out.overall_valid, false);
    assert.equal(out.checksums_valid, false);
    assert.ok(out.problems.some((problem) => problem.startsWith('checksums: /asset_digest')));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('planLoad: asset_digest mismatch returns invalid with blocking issue', () => {
  const dir = makeTmp('kdna-v1-plan-asset-digest-invalid-');
  try {
    copyMinimal(dir);
    const checksumsPath = path.join(dir, 'checksums.json');
    const checksums = JSON.parse(fs.readFileSync(checksumsPath, 'utf8'));
    checksums.asset_digest =
      'sha256:0000000000000000000000000000000000000000000000000000000000000000';
    fs.writeFileSync(checksumsPath, JSON.stringify(checksums, null, 2));

    const plan = v1.planLoad(dir);
    assertValidLoadPlan(plan);
    assert.equal(plan.state, 'invalid');
    assert.equal(plan.required_action, 'block');
    assert.equal(plan.can_load_now, false);
    assert.equal(plan.checks.checksums_valid, false);
    assert.ok(plan.issues.some((issue) => issue.code === 'KDNA_INTEGRITY_DIGEST_FAILED'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: missing mimetype is reported as format_valid=false', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    assert.throws(() => v1.validate(dir), /missing mimetype/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: invalid mimetype is reported as format error', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/x-invalid-mimetype');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    fs.writeFileSync(
      path.join(dir, 'payload.kdnab'),
      JSON.stringify({
        profile: 'judgment-profile-v1',
        core: { highest_question: 'q', axioms: [] },
      }),
    );
    assert.throws(() => v1.validate(dir), /not a KDNA layout/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('validate: lineage as array is rejected (Phase 1 rule)', () => {
  const dir = makeTmp('kdna-v1-bad-');
  try {
    copyMinimal(dir);
    const manifestPath = path.join(dir, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    // Replace the object lineage with an array — the spec explicitly
    // rejects this shape in v1.
    manifest.lineage = [{ type: 'original' }];
    fs.writeFileSync(manifestPath, JSON.stringify(manifest));
    assert.throws(() => v1.validate(dir), /lineage must be an object/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: produces a deterministic container (same input → same SHA-256)', () => {
  const dir = makeTmp('kdna-v1-det-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const a = path.join(dir, 'a.kdna');
    const b = path.join(dir, 'b.kdna');
    v1.pack(src, a);
    v1.pack(src, b);
    const ha = crypto.createHash('sha256').update(fs.readFileSync(a)).digest('hex');
    const hb = crypto.createHash('sha256').update(fs.readFileSync(b)).digest('hex');
    assert.equal(ha, hb, 'pack must be deterministic');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: output has mimetype as the first entry, STORED', () => {
  const dir = makeTmp('kdna-v1-first-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const out = path.join(dir, 'out.kdna');
    v1.pack(src, out);
    const r = v1.detectContainerFormat(out);
    assert.equal(r, 'kdna');
    // The container must round-trip through readV1Layout.
    const v = v1.readLayout(out);
    assert.equal(v.kind, 'file');
    assert.ok(v.map.mimetype);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: refuses to pack a directory missing a required entry', () => {
  const dir = makeTmp('kdna-v1-badpack-');
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), MIMETYPE);
    fs.writeFileSync(path.join(dir, 'kdna.json'), '{}');
    // missing payload.kdnab
    assert.throws(() => v1.pack(dir, path.join(dir, 'out.kdna')), /missing required entry/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('pack: skips junk files like .DS_Store', () => {
  const dir = makeTmp('kdna-v1-junk-');
  try {
    copyMinimal(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', '.DS_Store'), 'mac junk');
    const out = path.join(dir, 'out.kdna');
    v1.pack(path.join(dir, 'src'), out);
    const v = v1.readLayout(out);
    const names = Object.keys(v.map);
    assert.ok(!names.includes('.DS_Store'), 'no .DS_Store in the container');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unpack: extracts a packed .kdna and the result validates', () => {
  const dir = makeTmp('kdna-v1-unpack-');
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const packed = path.join(dir, 'packed.kdna');
    v1.pack(src, packed);
    const outDir = path.join(dir, 'unpacked');
    const r = v1.unpack(packed, outDir);
    assert.equal(r.outputDir, outDir);
    // The unpacked directory must itself be a valid v1 source dir.
    assert.equal(v1.isKdnaSourceDir(outDir), true);
    const result = v1.validate(outDir);
    assert.equal(result.overall_valid, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('unpack: refuses to write outside the destination (path traversal)', () => {
  const dir = makeTmp('kdna-v1-traversal-');
  try {
    // Build a tiny ZIP that contains an entry "../escape.txt" and
    // verify the unpacker rejects it.
    const zlib = require('node:zlib');
    const entries = [];
    function pushEntry(name, data) {
      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(0, 8); // STORED
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(1, 12);
      // Recompute CRC via direct table.
      const t = (() => {
        const tt = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
          let c = n;
          for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
          tt[n] = c >>> 0;
        }
        return tt;
      })();
      let cc = 0xffffffff;
      for (let i = 0; i < data.length; i++) cc = t[(cc ^ data[i]) & 0xff] ^ (cc >>> 8);
      const crcVal = (cc ^ 0xffffffff) >>> 0;
      localHeader.writeUInt32LE(crcVal, 14);
      localHeader.writeUInt32LE(data.length, 18);
      localHeader.writeUInt32LE(data.length, 22);
      const nameBytes = Buffer.from(name, 'utf8');
      localHeader.writeUInt16LE(nameBytes.length, 26);
      entries.push({ localHeader, nameBytes, data, offset: 0 });
    }
    pushEntry('mimetype', Buffer.from(MIMETYPE, 'utf8'));
    pushEntry('../escape.txt', Buffer.from('pwned', 'utf8'));

    // Build the ZIP with central directory.
    let offset = 0;
    const locals = [];
    const central = [];
    for (const e of entries) {
      e.offset = offset;
      locals.push(e.localHeader, e.nameBytes, e.data);
      offset += e.localHeader.length + e.nameBytes.length + e.data.length;
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(20, 4);
      cd.writeUInt16LE(20, 6);
      cd.writeUInt16LE(0, 8);
      cd.writeUInt16LE(0, 10);
      cd.writeUInt16LE(0, 12);
      cd.writeUInt16LE(1, 14);
      cd.writeUInt32LE(0, 16);
      cd.writeUInt32LE(e.data.length, 20);
      cd.writeUInt32LE(e.data.length, 24);
      cd.writeUInt16LE(e.nameBytes.length, 28);
      cd.writeUInt32LE(e.offset, 42);
      central.push(cd, e.nameBytes);
    }
    const cdOffset = offset;
    let cdSize = 0;
    for (const c of central) cdSize += c.length;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    eocd.writeUInt16LE(0, 20);

    const evil = path.join(dir, 'evil.kdna');
    fs.writeFileSync(evil, Buffer.concat([...locals, ...central, eocd]));

    const outDir = path.join(dir, 'out');
    assert.throws(
      () => v1.unpack(evil, outDir),
      /unsafe relative path|refusing to write outside target/i,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('malicious containers fail consistently before judgment payload output', () => {
  const dir = makeTmp('kdna-v1-malicious-fixtures-');
  const secret = 'SECRET_CONTAINER_PAYLOAD_SHOULD_NOT_LEAK';
  try {
    const src = path.join(dir, 'src');
    copyMinimal(src);
    const payloadPath = path.join(src, 'payload.kdnab');
    const payload = readPayload(payloadPath);
    payload.core.axioms = [{ id: 'secret', one_sentence: secret }];
    fs.writeFileSync(payloadPath, cbor.encode(payload));
    fs.writeFileSync(
      path.join(src, 'checksums.json'),
      JSON.stringify(v1.buildChecksums(src), null, 2),
    );
    const baseEntries = validContainerEntries(src);
    const fixtures = [
      [
        'traversal',
        [...baseEntries, { name: '../outside.txt', data: 'x' }],
        /unsafe relative path/,
      ],
      ['absolute', [...baseEntries, { name: '/tmp/absolute.txt', data: 'x' }], /absolute path/],
      ['duplicate', [...baseEntries, { name: 'kdna.json', data: '{}' }], /duplicate entry/],
      [
        'forbidden-top-level',
        [...baseEntries, { name: 'KDNA_Core.json', data: '{}' }],
        /forbidden top-level/,
      ],
      [
        'symlink',
        [
          ...baseEntries,
          { name: 'attachments/link', data: 'target', externalAttributes: (0o120777 << 16) >>> 0 },
        ],
        /unsupported file attributes/,
      ],
    ];

    for (const [label, entries, pattern] of fixtures) {
      const file = path.join(dir, `${label}.kdna`);
      writeTestZip(file, entries);
      assert.equal(v1.detectContainerFormat(file), 'kdna', `${label} should still route to kdna`);
      assert.throws(() => v1.validate(file), pattern, `${label} validate`);
      const plan = v1.planLoad(file);
      assert.equal(plan.can_load_now, false, `${label} plan-load`);
      assert.equal(plan.state, 'invalid', `${label} plan-load state`);
      assert.ok(!JSON.stringify(plan).includes(secret), `${label} leaked payload in plan`);
      assert.throws(
        () => v1.load(file, { profile: 'compact', as: 'prompt' }),
        (error) => {
          assert.ok(
            !String(error.message).includes(secret),
            `${label} leaked payload in load error`,
          );
          return true;
        },
        `${label} load`,
      );
      assert.throws(
        () => v1.unpack(file, path.join(dir, `${label}-out`)),
        pattern,
        `${label} unpack`,
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('readV1Layout: rejects a v1 source with a missing required entry', async () => {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'kdna-v1-missing-'));
  try {
    await fsp.writeFile(path.join(dir, 'mimetype'), MIMETYPE);
    await fsp.writeFile(path.join(dir, 'kdna.json'), JSON.stringify({ kdna_version: '1.0' }));
    // missing payload.kdnab
    assert.throws(() => v1.readLayout(dir), /missing payload\.kdnab/);
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
});

test('FORBIDDEN_OUTPUT_TERMS is non-empty and frozen at the API boundary', () => {
  assert.ok(FORBIDDEN_OUTPUT_TERMS.length > 0);
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('trusted'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('recommended'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('high_quality'));
  assert.ok(FORBIDDEN_OUTPUT_TERMS.includes('officially_approved'));
});
