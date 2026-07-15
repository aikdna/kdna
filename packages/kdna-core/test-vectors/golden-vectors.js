/**
 * golden-vectors.js — Cross-language test vectors for KDNA crypto + container.
 *
 * Wave 3b (B8): Establishes shared truth before any platform-specific optimization.
 * Run with: node --test test-vectors/golden-vectors.js
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const core = require('../');

const TEST_PASSWORD = 'KDNA-GOLDEN-VECTOR-PASSWORD-2026';
const MANIFEST = {
  kdna_version: '1.0', asset_id: 'kdna:test:golden', asset_uid: 'kdna:test:golden@1.0.0',
  asset_type: 'domain', name: '@test/golden', title: 'Golden Vector Test',
  version: '1.0.0', judgment_version: '1.0.0',
  created_at: '2026-06-25T00:00:00Z', updated_at: '2026-06-25T00:00:00Z',
  creator: { name: 'Test', id: 'test' },
  compatibility: { min_loader_version: '0.0.0', profile: 'kdna.payload.judgment' },
  payload: { path: 'payload.kdnab', encoding: 'json', encrypted: false },
  access: 'public',
  asset_digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
  content_digest: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
};
const PAYLOAD_JSON = {
  profile: 'kdna.payload.judgment',
  core: { highest_question: 'What is the golden path?',
    axioms: [{ id: 'gv-001', one_sentence: 'Golden vectors must be deterministic.', full_statement: 'All implementations MUST produce identical output.', applies_when: ['Testing'], does_not_apply_when: [], failure_risk: 'Divergent implementations.' }],
    boundaries: [{ type: 'scope', text: 'Only test vectors defined in this file.' }] },
  patterns: [{ type: 'term', term: 'golden', definition: 'Deterministic cross-platform reference.' }],
};
const PAYLOAD_STR = JSON.stringify(PAYLOAD_JSON);
const ENCRYPTED_MANIFEST = { ...MANIFEST, access: 'licensed',
  entitlement: { profile: 'password' },
  encryption: {
    profile: 'kdna.encryption.password',
    profile_version: '0.1.0',
    encrypted_entries: ['payload.kdnab'],
  },
  payload: { path: 'payload.kdnab', encoding: 'json', encrypted: true } };

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-gv-')); }

// ═══════════════════════════════════════════════════════════════════════
// 1. Crypto: Password-Protected Entry (RFC-0009)
// ═══════════════════════════════════════════════════════════════════════

test('B8: encryptProtectedEntry produces valid envelope', () => {
  const rc = core.generateRecoveryCode();
  const envelope = core.encryptProtectedEntry(PAYLOAD_STR, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: TEST_PASSWORD, recoveryCode: rc,
  });
  assert.equal(envelope.profile, 'kdna.encryption.password');
  assert.equal(envelope.alg, 'AES-256-GCM');
  assert.equal(envelope.kdf, 'Argon2id');
  assert.equal(envelope.key_wrapping, 'AES-256-KW');
  assert.ok(Array.isArray(envelope.key_slots) && envelope.key_slots.length >= 1, 'key_slots');
  assert.ok(envelope.ciphertext && envelope.iv && envelope.tag, 'ciphertext/iv/tag required');
});

test('B8: decryptProtectedEntry recovers original plaintext', () => {
  const rc = core.generateRecoveryCode();
  const envelope = core.encryptProtectedEntry(PAYLOAD_STR, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: TEST_PASSWORD, recoveryCode: rc,
  });
  const decrypted = core.decryptProtectedEntry(envelope, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: TEST_PASSWORD,
  });
  assert.equal(decrypted.toString('utf8'), PAYLOAD_STR);
});

test('B8: decryptProtectedEntry rejects wrong password', () => {
  const rc = core.generateRecoveryCode();
  const envelope = core.encryptProtectedEntry(PAYLOAD_STR, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: TEST_PASSWORD, recoveryCode: rc,
  });
  assert.throws(() => core.decryptProtectedEntry(envelope, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: 'WRONG',
  }));
});

test('B8: decryptProtectedEntry with recovery code recovers plaintext', () => {
  const rc = core.generateRecoveryCode();
  const envelope = core.encryptProtectedEntry(PAYLOAD_STR, {
    entryName: 'payload.kdnab', manifest: MANIFEST, password: TEST_PASSWORD, recoveryCode: rc,
  });
  const decrypted = core.decryptProtectedEntry(envelope, {
    entryName: 'payload.kdnab', manifest: MANIFEST, recoveryCode: rc,
  });
  assert.equal(decrypted.toString('utf8'), PAYLOAD_STR);
});

// ═══════════════════════════════════════════════════════════════════════
// 2. LoadPlan: Authorization Planning (ADR-002)
// ═══════════════════════════════════════════════════════════════════════

test('B8: planLoad public asset → ready', () => {
  const dir = tmpDir();
  try {
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(MANIFEST));
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify(PAYLOAD_JSON));
    const plan = core.planLoad(dir);
    assert.equal(plan.access, 'public');
    assert.equal(plan.state, 'ready');
    assert.equal(plan.can_load_now, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('B8: planLoad licensed/password without password → needs_password', () => {
  const dir = tmpDir();
  try {
    const rc = core.generateRecoveryCode();
    const envelope = core.encryptProtectedEntry(PAYLOAD_STR, {
      entryName: 'payload.kdnab', manifest: ENCRYPTED_MANIFEST, password: TEST_PASSWORD, recoveryCode: rc,
    });
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(ENCRYPTED_MANIFEST));
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify(envelope));
    const plan = core.planLoad(dir);
    assert.equal(plan.access, 'licensed');
    assert.equal(plan.entitlement_profile, 'password');
    assert.equal(plan.state, 'needs_password');
    assert.equal(plan.required_action, 'enter_password');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('B8: planLoad remote → needs_runtime', () => {
  const dir = tmpDir();
  try {
    const remoteManifest = { ...MANIFEST, access: 'remote' };
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(remoteManifest));
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify(PAYLOAD_JSON));
    const plan = core.planLoad(dir);
    assert.equal(plan.access, 'remote');
    assert.equal(plan.state, 'needs_runtime');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('B8: planLoad legacy open alias → public ready', () => {
  const dir = tmpDir();
  try {
    const openManifest = { ...MANIFEST, access: 'open' };
    fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(openManifest));
    fs.writeFileSync(path.join(dir, 'payload.kdnab'), JSON.stringify(PAYLOAD_JSON));
    const plan = core.planLoad(dir);
    assert.equal(plan.access, 'public');
    assert.equal(plan.access_alias, 'open');
    assert.equal(plan.state, 'ready');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
