/**
 * canonical-conformance.mjs — stable container conformance.
 * Tests the distribution container with real Core toolchain fixtures.
 * Run: node --test conformance/canonical-conformance.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { createRequire } from 'node:module';
const _require = createRequire(import.meta.url);
const core = _require('../packages/kdna-core/src/index.js');
const cbor = _require('cbor-x');

let WORKDIR;

test.before(() => {
  WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-conformance-'));
});

test.after(() => {
  if (WORKDIR) fs.rmSync(WORKDIR, { recursive: true, force: true });
});

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function fixtureDir(name) {
  const d = path.join(WORKDIR, name);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function buildFixture(name, manifestOverrides = {}, payloadOverrides = {}) {
  const dir = fixtureDir(name);
  const manifest = {
    format_version: '0.1.0',
    asset_id: `kdna:c:${name}`,
    asset_uid: `urn:uuid:00000000-0000-4000-8000-${sha256(name).slice(0, 12)}`,
    asset_type: 'domain',
    title: `Conformance ${name}`,
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-06-25T00:00:00Z',
    updated_at: '2026-06-25T00:00:00Z',
    creator: { name: 'C', id: 'c' },
    compatibility: {
      min_loader_version: '0.20.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
    ...manifestOverrides,
  };
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'Conformance test.',
      axioms: [
        {
          id: 'c-001',
          one_sentence: 'Test axiom.',
          full_statement: 'For conformance.',
          applies_when: ['testing'],
          does_not_apply_when: [],
          failure_risk: 'None.',
        },
      ],
      boundaries: [{ type: 'scope', text: 'Testing only.' }],
    },
    patterns: [
      { type: 'term', term: 'conformance', definition: 'Protocol compliance verification.' },
    ],
    ...payloadOverrides,
  };
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), cbor.encode(payload));
  // Generate checksums before packing
  const cs = core.buildChecksums(dir);
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(cs, null, 2));
  const kdna = path.join(WORKDIR, `${name}.kdna`);
  core.pack(dir, kdna);
  return { dir, kdna, manifest, payload };
}

// ═══════════════════════════════════════════════════════════════════════
// Protocol
// ═══════════════════════════════════════════════════════════════════════

test('canonical container: ZIP with required entries', () => {
  const f = buildFixture('pkg');
  const buf = fs.readFileSync(f.kdna);
  assert.ok(buf.length > 100);
  assert.equal(buf.readUInt32LE(0), 0x04034b50, 'PK signature');
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(f.kdna);
  const names = reader.listEntriesSync(asset);
  for (const e of ['mimetype', 'kdna.json', 'payload.kdnab', 'checksums.json']) {
    assert.ok(names.includes(e), `must include ${e}`);
  }
});

test('canonical container: deterministic output', () => {
  const dir = fixtureDir('det');
  const manifest = {
    format_version: '0.1.0',
    asset_id: 'kdna:c:det',
    asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    asset_type: 'domain',
    title: 'Det',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-06-25T00:00:00Z',
    updated_at: '2026-06-25T00:00:00Z',
    creator: { name: 'C', id: 'c' },
    compatibility: {
      min_loader_version: '0.20.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
  };
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'X',
      axioms: [
        {
          id: 'x',
          one_sentence: 'x',
          full_statement: 'x',
          applies_when: ['x'],
          does_not_apply_when: [],
          failure_risk: 'x',
        },
      ],
      boundaries: [],
    },
    patterns: [],
  };
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), cbor.encode(payload));
  const csd = core.buildChecksums(dir);
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(csd));
  core.pack(dir, path.join(WORKDIR, 'det1.kdna'));
  core.pack(dir, path.join(WORKDIR, 'det2.kdna'));
  assert.equal(
    sha256(fs.readFileSync(path.join(WORKDIR, 'det1.kdna'))),
    sha256(fs.readFileSync(path.join(WORKDIR, 'det2.kdna'))),
  );
});

test('protocol: validate returns overall_valid=true', () => {
  const f = buildFixture('valid');
  const v = core.validate(f.kdna);
  assert.equal(v.overall_valid, true, JSON.stringify(v.problems));
});

test('protocol: planLoad public → ready', () => {
  const f = buildFixture('pub');
  const plan = core.planLoad(f.kdna);
  assert.equal(plan.access, 'public');
  assert.equal(plan.state, 'ready');
  assert.equal(plan.can_load_now, true);
});

// ═══════════════════════════════════════════════════════════════════════
// Access modes
// ═══════════════════════════════════════════════════════════════════════

test('access: licensed/password → needs_password', () => {
  const f = buildFixture('pwd');
  const pwdManifest = {
    ...f.manifest,
    access: 'licensed',
    entitlement: { profile: 'password' },
    encryption: {
      profile: 'kdna.encryption.password',
      profile_version: '0.1.0',
      encrypted_entries: ['payload.kdnab'],
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: true },
  };
  // Overwrite manifest with licensed config
  fs.writeFileSync(path.join(f.dir, 'kdna.json'), JSON.stringify(pwdManifest, null, 2));
  const plaintext = cbor.encode(f.payload);
  const envelope = core.encryptProtectedEntry(plaintext, {
    entryName: 'payload.kdnab',
    manifest: pwdManifest,
    password: 'test',
    recoveryCode: core.generateRecoveryCode(),
  });
  fs.writeFileSync(path.join(f.dir, 'payload.kdnab'), cbor.encode(envelope));
  const checksums = core.buildChecksums(f.dir);
  fs.writeFileSync(path.join(f.dir, 'checksums.json'), JSON.stringify(checksums));
  core.pack(f.dir, f.kdna);
  const plan = core.planLoad(f.kdna);
  assert.equal(plan.access, 'licensed');
  assert.equal(plan.state, 'needs_password');
  assert.equal(plan.required_action, 'enter_password');
});

test('access: remote → needs_runtime', () => {
  const f = buildFixture('remote', { access: 'remote' });
  const plan = core.planLoad(f.kdna);
  assert.equal(plan.access, 'remote');
  assert.equal(plan.state, 'needs_runtime');
});

test('access: removed alias fails closed', () => {
  const f = buildFixture('open', { access: 'open' });
  const plan = core.planLoad(f.kdna);
  assert.equal(plan.state, 'invalid');
});

// ═══════════════════════════════════════════════════════════════════════
// Negative security
// ═══════════════════════════════════════════════════════════════════════

test('negative: corrupt manifest JSON fails validate', () => {
  const f = buildFixture('bad-manifest');
  fs.writeFileSync(path.join(f.dir, 'kdna.json'), '{bad');
  core.pack(f.dir, f.kdna);
  // validate may throw for unparseable JSON, which is also a valid failure mode
  let v;
  try {
    v = core.validate(f.kdna);
  } catch (e) {
    assert.ok(
      e.message.includes('JSON') || e.message.includes('invalid'),
      `expected JSON error: ${e.message}`,
    );
    return;
  }
  assert.equal(v.overall_valid, false);
});

test('negative: wrong mimetype rejected at pack time', () => {
  const f = buildFixture('bad-mime');
  fs.writeFileSync(path.join(f.dir, 'mimetype'), 'text/plain');
  assert.throws(() => core.pack(f.dir, f.kdna));
});

test('negative: source tree entries are rejected at pack time', () => {
  const f = buildFixture('source-tree');
  fs.writeFileSync(path.join(f.dir, 'KDNA_Core.json'), JSON.stringify({ meta: {}, axioms: [] }));
  assert.throws(
    () => core.pack(f.dir, f.kdna),
    /forbidden top-level source entry: KDNA_Core\.json/,
  );
});

test('negative: unknown access value → invalid LoadPlan', () => {
  const f = buildFixture('bad-access', { access: 'premium' });
  const plan = core.planLoad(f.kdna);
  assert.equal(plan.state, 'invalid');
});

// ═══════════════════════════════════════════════════════════════════════
// CBOR-only enforcement
// ═══════════════════════════════════════════════════════════════════════

test('negative: encoding=json manifest is rejected', () => {
  const dir = fixtureDir('bad-enc');
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(
    path.join(dir, 'kdna.json'),
    JSON.stringify({
      format_version: '0.1.0',
      asset_id: 'kdna:c:bad-enc',
      asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000002',
      asset_type: 'domain',
      title: 'X',
      version: '1.0.0',
      judgment_version: '1.0.0',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      creator: { name: 'T' },
      payload: { path: 'payload.kdnab', encoding: 'json', encrypted: false },
      compatibility: {
        min_loader_version: '0.20.0',
        profile: 'kdna.payload.judgment',
        profile_version: '0.1.0',
      },
    }),
  );
  const p = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: { highest_question: 'Q', axioms: [{ id: 'a1', one_sentence: 'Test.' }] },
  };
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), cbor.encode(p));
  const cs = core.buildChecksums(dir);
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(cs));
  const kdna = path.join(WORKDIR, 'bad-enc.kdna');
  core.pack(dir, kdna);
  const v = core.validate(kdna);
  assert.equal(v.schema_valid, false, 'encoding=json must be rejected by schema');
});

test('negative: JSON payload disguised as CBOR is rejected', () => {
  const dir = fixtureDir('bad-payload');
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(
    path.join(dir, 'kdna.json'),
    JSON.stringify({
      format_version: '0.1.0',
      asset_id: 'kdna:c:bad-payload',
      asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000003',
      asset_type: 'domain',
      title: 'X',
      version: '1.0.0',
      judgment_version: '1.0.0',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      creator: { name: 'T' },
      payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
      compatibility: {
        min_loader_version: '0.20.0',
        profile: 'kdna.payload.judgment',
        profile_version: '0.1.0',
      },
    }),
  );
  const p = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: { highest_question: 'Q', axioms: [{ id: 'a1', one_sentence: 'Test.' }] },
  };
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify(p));
  const cs = core.buildChecksums(dir);
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(cs));
  const kdna = path.join(WORKDIR, 'bad-payload.kdna');
  core.pack(dir, kdna);
  const v = core.validate(kdna);
  assert.equal(
    v.payload_valid,
    false,
    'JSON payload must be rejected even when manifest says cbor',
  );
});

// ═══════════════════════════════════════════════════════════════════════
// Product integration
// ═══════════════════════════════════════════════════════════════════════

test('integration: pack → validate → load', () => {
  const f = buildFixture('integ');
  assert.equal(core.validate(f.kdna).overall_valid, true);
  assert.equal(core.planLoad(f.kdna).can_load_now, true);
  const r = core.loadAuthorized(f.kdna, { profile: 'index', as: 'json' });
  assert.equal(r.type, 'kdna.runtime-capsule');
  assert.equal(r.contract_version, '0.1.0');
  assert.equal(r.asset.asset_id, f.manifest.asset_id);
});

test('integration: pack → unpack → validate', () => {
  const f = buildFixture('unpack');
  const out = fixtureDir('unpack-out');
  core.unpack(f.kdna, out);
  assert.ok(fs.existsSync(path.join(out, 'kdna.json')));
  assert.ok(fs.existsSync(path.join(out, 'payload.kdnab')));
  assert.equal(core.validate(out).overall_valid, true);
});
