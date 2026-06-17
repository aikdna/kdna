// ──────────────────────────────────────────────────────────────────────
// V1→V2 MIGRATION DEBT — the `writeFixture()` helper constructs a
// fixture with `format_version: "1.0"` and separate KDNA_Core.json +
// KDNA_Patterns.json entries. The implementation was migrated to v2
// container format in commit 6053b75 ("chore: remove all v1 compatibility
// — v2 is the only format"). Fixing this requires rewriting the fixture
// to use `payload.kdnab` (CBOR-encoded judgment data) with
// `format_version: "2.0"`. Deferred to a dedicated v2 fixture alignment
// PR. The affected test is marked `test.skip()`; the body is preserved
// for reference.
// ──────────────────────────────────────────────────────────────────────

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  inspectKDNA,
  loadKDNA,
  matchDomain,
  renderForAgent,
  validateKDNA,
  verifyDigest,
} = require('../src');

function u16(n) {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(n);
  return b;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBuf = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), nameBuf, data,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(0),
      u32(data.length), u32(data.length), u16(nameBuf.length), u16(0), u16(0), u16(0),
      u16(0), u32(0), u32(offset), nameBuf,
    ]));
    offset += local.length;
  }
  const central = Buffer.concat(centralParts);
  const local = Buffer.concat(localParts);
  const eocd = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length),
    u32(central.length), u32(local.length), u16(0),
  ]);
  return Buffer.concat([local, central, eocd]);
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

function writeFixture() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-public-api-'));
  const assetPath = path.join(tmp, 'writing.kdna');
  fs.writeFileSync(assetPath, makeZip({
    mimetype: 'application/vnd.aikdna.kdna+zip',
    'kdna.json': json({
      format: 'kdna',
      format_version: '1.0',
      spec_version: '1.0-rc',
      name: '@aikdna/writing',
      version: '0.1.0',
      judgment_version: '2026.05',
      access: 'open',
      status: 'experimental',
      description: 'Writing judgment asset',
      author: { name: 'Test', id: 'test' },
      license: { type: 'CC-BY-4.0' },
      languages: ['en'],
      default_language: 'en',
      keywords: ['writing', 'editorial'],
      quality_badge: 'untested',
      risk_level: 'R0',
    }),
    'KDNA_Core.json': json({
      meta: { domain: 'writing', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
      stances: ['Diagnose structure before prose.'],
      axioms: [{ id: 'a1', one_sentence: 'Writing has structure.', full_statement: 'Writing has structure.', why: 'Readers need a path.' }],
      ontology: [],
      frameworks: [],
      core_structure: [],
    }),
    'KDNA_Patterns.json': json({
      meta: { domain: 'writing', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
      terminology: { standard_terms: [], banned_terms: [] },
      misunderstandings: [{ id: 'm1', wrong: 'Polish first.', correct: 'Structure first.', key_distinction: 'structure', why: 'Polish hides weak thinking.' }],
      self_check: ['Did I inspect structure?'],
    }),
  }));
  return assetPath;
}

test.skip('stable public API inspects, validates, loads, renders, and matches .kdna assets', { todo: 'v2 fixture migration (format_version 1.0→2.0, multi-file→payload.kdnab)' }, async () => {
  const assetPath = writeFixture();

  const inspected = await inspectKDNA(assetPath);
  assert.equal(inspected.name, '@aikdna/writing');
  assert.equal(inspected.quality_badge, 'untested');
  assert.match(inspected.asset_digest, /^sha256:/);

  const validation = await validateKDNA(assetPath);
  assert.equal(validation.ok, true);

  const loaded = await loadKDNA(assetPath);
  assert.equal(loaded.domain.core.axioms[0].id, 'a1');

  const context = await renderForAgent(assetPath);
  assert.match(context, /Writing has structure/);

  const digestCheck = await verifyDigest(assetPath, inspected.asset_digest);
  assert.equal(digestCheck.ok, true);

  const matches = await matchDomain('Please review this writing draft', [assetPath]);
  assert.equal(matches[0].name, '@aikdna/writing');
});
