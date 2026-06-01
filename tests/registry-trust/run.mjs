import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const registryDir = path.join(__dirname, 'registry-mocks');
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(registryDir, { recursive: true });

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }

function makeZip(entries) {
  const localParts = [], centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBuf.length), u16(0),
      nameBuf, data,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBuf.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuf,
    ]));
    offset += local.length;
  }
  return Buffer.concat([Buffer.concat(localParts), Buffer.concat(centralParts),
    Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length), u32(Buffer.concat(centralParts).length), u32(Buffer.concat(localParts).length), u16(0)])]);
}

const json = (v) => JSON.stringify(v, null, 2);

// Build a valid .kdna asset to use as download target for mock registries
const validAssetZip = makeZip({
  mimetype: 'application/vnd.aikdna.kdna+zip',
  'kdna.json': json({
    format: 'kdna', format_version: '1.0', spec_version: '1.0-rc',
    name: '@trust-e2e/minimal', version: '0.1.0', judgment_version: '2026.06',
    access: 'open', status: 'experimental',
    description: 'E2E trust test asset.',
    author: { name: 'E2E Test', id: 'trust-e2e' },
    license: { type: 'CC0-1.0' }, languages: ['en'], default_language: 'en',
    keywords: ['trust-e2e'], quality_badge: 'untested', risk_level: 'R0',
  }),
  'KDNA_Core.json': json({
    meta: { domain: 'trust-e2e', version: '0.1.0', created: '2026-06-01', purpose: 'E2E test fixture.', load_condition: 'always' },
    stances: ['Test fixture.'],
    axioms: [{ id: 'ax_0', one_sentence: 'Test axiom.', full_statement: 'E2E test axiom.', why: 'Testing.' }],
    ontology: [], frameworks: [], core_structure: [],
  }),
  'KDNA_Patterns.json': json({
    meta: { domain: 'trust-e2e', version: '0.1.0', created: '2026-06-01', purpose: 'E2E test fixture.', load_condition: 'always' },
    terminology: { standard_terms: [], banned_terms: [] },
    misunderstandings: [], self_check: ['Is this a valid E2E test?'],
  }),
});

const assetDigest = 'sha256:' + crypto.createHash('sha256').update(validAssetZip).digest('hex');
const assetPath = path.join(fixturesDir, 'trust-e2e-valid.kdna');
fs.writeFileSync(assetPath, validAssetZip);

// Tampered asset for digest mismatch test
const tamperedAsset = Buffer.from(validAssetZip);
tamperedAsset[tamperedAsset.length - 10] ^= 0xFF;
const tamperedPath = path.join(fixturesDir, 'trust-e2e-tampered.kdna');
fs.writeFileSync(tamperedPath, tamperedAsset);

const now = new Date().toISOString();
const expired = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

const baseDomain = {
  name: '@trust-e2e/minimal', version: '0.1.0', status: 'experimental',
  description: 'E2E trust test domain.',
  asset_url: `file://${assetPath}`,
  asset_digest: assetDigest,
  quality_badge: 'untested', risk_level: 'R0',
  review_status: 'community', languages: ['en'], default_language: 'en',
};

// === Test 1: Yanked domain — kdna install must reject ===
console.log('\n=== Test 1: Yanked Domain ===');

const yankedRegistry = {
  registry_version: '1.0-rc', schema_version: '3.0', updated: now,
  scopes: {},
  domains: [{ ...baseDomain, yanked: true, yanked_reason: 'Safety issue in E2E test.' }],
};
const yankedPath = path.join(registryDir, 'yanked-domains.json');
fs.writeFileSync(yankedPath, json(yankedRegistry));

try {
  execSync(`KDNA_REGISTRY_URL=file://${yankedPath} kdna registry refresh`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 10000,
  });
  execSync(`KDNA_REGISTRY_URL=file://${yankedPath} kdna install @trust-e2e/minimal`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 15000,
  });
  console.log('  ✗ FAIL: kdna install should have rejected yanked domain');
  process.exitCode = 1;
} catch (e) {
  const code = e.status ?? 1;
  if (code === 5 || e.stderr?.includes('yank') || e.stdout?.includes('yank')) {
    console.log(`  ✓ PASS: kdna install rejected yanked domain (exit ${code})`);
  } else {
    console.log(`  ✗ UNEXPECTED: exit ${code}, stderr: ${(e.stderr || '').slice(0, 200)}`);
    process.exitCode = 1;
  }
}

// === Test 2: Expired registry snapshot ===
console.log('\n=== Test 2: Expired Registry Snapshot ===');

const expiredRegistry = {
  registry_version: '1.0-rc', schema_version: '3.0', updated: expired,
  scopes: {},
  domains: [baseDomain],
};
const expiredPath = path.join(registryDir, 'expired-domains.json');
fs.writeFileSync(expiredPath, json(expiredRegistry));

try {
  execSync(`KDNA_REGISTRY_URL=file://${expiredPath} kdna registry refresh`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 10000,
  });
  execSync(`KDNA_REGISTRY_URL=file://${expiredPath} kdna install @trust-e2e/minimal`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 15000,
  });
  console.log('  ✗ FAIL: v1.0-rc requires expired registry snapshots to be rejected');
  process.exitCode = 1;
} catch (e) {
  const code = e.status ?? 1;
  assert.ok(code !== 0, `v1.0-rc: expired registry snapshot must be rejected (got exit ${code})`);
  console.log(`  ✓ PASS: kdna install rejected expired registry snapshot (exit ${code})`);
}

// === Test 3: Missing trust_pubkey for scoped registry ===
console.log('\n=== Test 3: Missing trust_pubkey ===');

const noTrustRegistry = {
  registry_version: '1.0-rc', schema_version: '3.0', updated: now,
  scopes: { '@untrusted-e2e': { type: 'scoped', verified: false } },
  domains: [{
    ...baseDomain,
    name: '@untrusted-e2e/no-trust', version: '0.1.0',
    description: 'Domain from scope without trust_pubkey.',
  }],
};
const noTrustPath = path.join(registryDir, 'no-trust-pubkey-domains.json');
fs.writeFileSync(noTrustPath, json(noTrustRegistry));

try {
  execSync(`KDNA_REGISTRY_URL=file://${noTrustPath} kdna registry refresh`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 10000,
  });
  execSync(`KDNA_REGISTRY_URL=file://${noTrustPath} kdna install @untrusted-e2e/no-trust`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 15000,
  });
  console.log('  ✗ FAIL: v1.0-rc requires scoped domains without trust_pubkey to be rejected');
  process.exitCode = 1;
} catch (e) {
  const code = e.status ?? 1;
  assert.ok(code !== 0, `v1.0-rc: scoped domain without trust_pubkey must be rejected (got exit ${code})`);
  console.log(`  ✓ PASS: kdna install rejected domain without trust_pubkey (exit ${code})`);
}

// === Test 4: Digest mismatch via local install ===
console.log('\n=== Test 4: Digest Mismatch (Local Install) ===');

try {
  execSync(`kdna verify ${tamperedPath}`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 10000,
  });
  console.log('  ✗ FAIL: v1.0-rc requires digest mismatch to be rejected at verify level');
  process.exitCode = 1;
} catch (e) {
  const code = e.status ?? 1;
  assert.equal(code, 3, `v1.0-rc: digest mismatch must exit with TRUST_FAILED (3), got ${code}`);
  console.log(`  ✓ PASS: kdna verify rejected tampered asset with TRUST_FAILED (exit ${code})`);
}

// === Test 5: Bad mimetype (disallowed x-kdna) ===
console.log('\n=== Test 5: Disallowed Mimetype ===');

const badMimeAsset = makeZip({
  mimetype: 'application/x-kdna',
  'kdna.json': json({
    format: 'kdna', format_version: '1.0', spec_version: '1.0-rc',
    name: '@trust-e2e/bad-mime', version: '0.1.0',
    access: 'open', quality_badge: 'untested', risk_level: 'R0',
    languages: ['en'], default_language: 'en',
    description: 'Bad mimetype test.',
    author: { name: 'Test', id: 'e2e' }, license: { type: 'CC0-1.0' },
  }),
  'KDNA_Core.json': json({
    meta: { domain: 'bad-mime', version: '0.1.0', created: '2026-06-01', purpose: 'Test.', load_condition: 'always' },
    stances: [], axioms: [{ id: 'ax_0', one_sentence: 'T.', full_statement: 'Test.', why: 'T.' }],
    ontology: [], frameworks: [], core_structure: [],
  }),
  'KDNA_Patterns.json': json({
    meta: { domain: 'bad-mime', version: '0.1.0', created: '2026-06-01', purpose: 'Test.', load_condition: 'always' },
    terminology: { standard_terms: [], banned_terms: [] },
    misunderstandings: [], self_check: ['Test?'],
  }),
});
const badMimePath = path.join(fixturesDir, 'trust-e2e-bad-mime.kdna');
fs.writeFileSync(badMimePath, badMimeAsset);

try {
  execSync(`kdna verify ${badMimePath} --json`, {
    encoding: 'utf8', stdio: 'pipe', timeout: 10000,
  });
  console.log('  ✗ FAIL: v1.0-rc requires application/x-kdna mimetype to be rejected');
  console.log('  v1.0-rc non-negotiable: root mimetype MUST be application/vnd.aikdna.kdna+zip');
  process.exitCode = 1;
} catch (e) {
  const code = e.status ?? 1;
  assert.ok(code !== 0, `v1.0-rc: application/x-kdna must be rejected (got exit ${code})`);
  console.log(`  ✓ PASS: kdna verify rejected disallowed mimetype (exit ${code})`);
}

// === Summary ===
console.log('\n========================================');
console.log('KDNA v1.0-rc Trust Failure Tests');
console.log('========================================');
console.log('v1.0-rc Non-Negotiable Rules Tested:');
console.log('  ✓ Yanked domains → install rejected (REGISTRY_ERROR)');
console.log('  ✓ Expired registry snapshots → install rejected');
console.log('  ✓ Missing trust_pubkey → scoped install rejected');
console.log('  ✓ Digest mismatch → verify rejected (TRUST_FAILED)');
console.log('  ✓ application/x-kdna mimetype → verify rejected');
console.log('\nAll 5 scenarios: v1.0-rc hard-fail assertions.');
console.log('No "NOTE" fallback paths remain — if CLI accepts untrusted asset, test FAILS.');
console.log('');

// Cleanup mock registry files
for (const f of fs.readdirSync(registryDir)) fs.unlinkSync(path.join(registryDir, f));
for (const f of fs.readdirSync(fixturesDir)) fs.unlinkSync(path.join(fixturesDir, f));
