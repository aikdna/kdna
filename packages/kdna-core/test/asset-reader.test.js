const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  createKdnaAssetReader,
  createLicensedDecryptEntry,
  encryptLicensedEntry,
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
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(data.length),
      u32(data.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf,
      data,
    ]);
    localParts.push(local);

    centralParts.push(
      Buffer.concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(data.length),
        u32(data.length),
        u16(nameBuf.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        nameBuf,
      ]),
    );
    offset += local.length;
  }

  const central = Buffer.concat(centralParts);
  const local = Buffer.concat(localParts);
  const eocd = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(centralParts.length),
    u16(centralParts.length),
    u32(central.length),
    u32(local.length),
    u16(0),
  ]);
  return Buffer.concat([local, central, eocd]);
}

function json(value) {
  return JSON.stringify(value, null, 2);
}

test('asset reader opens, verifies, and loads a .kdna asset without extraction', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-asset-'));
  const assetPath = path.join(tmp, 'writing.kdna');
  fs.writeFileSync(
    assetPath,
    makeZip({
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
        quality_badge: 'untested',
        description: 'Writing asset',
        author: { name: 'Test', id: 'test' },
        license: { type: 'CC-BY-4.0' },
        languages: ['en'],
        default_language: 'en',
        keywords: ['writing'],
      }),
      'KDNA_Core.json': json({
        meta: { domain: 'writing', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        stances: ['Structure before polish.'],
        axioms: [{ id: 'a1', one_sentence: 'Writing has structure.', full_statement: 'Writing has structure.', why: 'Readers need a path.' }],
        ontology: [],
      }),
      'KDNA_Patterns.json': json({
        meta: { domain: 'writing', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        misunderstandings: [{ id: 'm1', wrong: 'Polish first.', correct: 'Structure first.', key_distinction: 'structure', why: 'Polish hides weak thinking.' }],
        self_check: ['Did I inspect structure?'],
      }),
    }),
  );

  const reader = createKdnaAssetReader();
  const asset = await reader.open(assetPath);
  assert.match(asset.asset_digest, /^sha256:/);

  const entries = await reader.listEntries(asset);
  assert.deepEqual(entries, ['KDNA_Core.json', 'KDNA_Patterns.json', 'kdna.json', 'mimetype']);

  const manifest = await reader.readManifest(asset);
  assert.equal(manifest.name, '@aikdna/writing');
  assert.equal(await reader.readJson(asset, 'KDNA_Scenarios.json'), null);
  assert.equal(reader.readJsonSync(asset, 'KDNA_Scenarios.json'), null);

  const verify = await reader.verify(asset);
  assert.equal(verify.ok, true);
  assert.match(verify.content_digest, /^sha256:/);

  const compact = await reader.loadProfile(asset, 'compact');
  assert.equal(compact.manifest.name, '@aikdna/writing');
  assert.equal(compact.domain.core.axioms[0].id, 'a1');
  assert.match(compact.context, /Writing has structure/);

  const index = await reader.loadProfile(asset, 'index');
  assert.equal(index.name, '@aikdna/writing');
  assert.deepEqual(index.keywords, ['writing']);
});

test('asset verification rejects archives without the KDNA mimetype marker', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-no-mimetype-'));
  const assetPath = path.join(tmp, 'legacy.kdna');
  fs.writeFileSync(
    assetPath,
    makeZip({
      'kdna.json': json({
        format: 'kdna',
        format_version: '1.0',
        spec_version: '1.0-rc',
        name: '@aikdna/legacy',
        version: '0.1.0',
        judgment_version: '2026.05',
        access: 'open',
        status: 'experimental',
        quality_badge: 'untested',
        description: 'Legacy asset without media marker',
        author: { name: 'Test', id: 'test' },
        license: { type: 'CC-BY-4.0' },
        languages: ['en'],
        default_language: 'en',
      }),
      'KDNA_Core.json': json({
        meta: { domain: 'legacy', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        stances: ['Legacy assets need migration.'],
        axioms: [{ id: 'a1', one_sentence: 'Markers matter.', full_statement: 'Markers matter.', why: 'Loaders need identity.' }],
        ontology: [],
      }),
      'KDNA_Patterns.json': json({
        meta: { domain: 'legacy', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        misunderstandings: [{ id: 'm1', wrong: 'Extension is enough.', correct: 'Mimetype is required.', key_distinction: 'identity', why: 'ZIP is generic.' }],
        self_check: ['Did I check mimetype?'],
      }),
    }),
  );

  const reader = createKdnaAssetReader();
  const verify = await reader.verify(await reader.open(assetPath));
  assert.equal(verify.ok, false);
  assert.ok(verify.errors.includes('required entry missing: mimetype'));
});

test('asset verification rejects deprecated kdna_spec manifests', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-kdna-spec-'));
  const assetPath = path.join(tmp, 'legacy.kdna');
  fs.writeFileSync(
    assetPath,
    makeZip({
      mimetype: 'application/vnd.aikdna.kdna+zip',
      'kdna.json': json({
        kdna_spec: '1.0-rc',
        name: '@aikdna/legacy',
        version: '0.1.0',
        judgment_version: '2026.05',
        access: 'open',
        status: 'experimental',
        quality_badge: 'untested',
        description: 'Legacy asset with deprecated field',
        author: { name: 'Test', id: 'test' },
        license: { type: 'CC-BY-4.0' },
        languages: ['en'],
        default_language: 'en',
      }),
      'KDNA_Core.json': json({
        meta: { domain: 'legacy', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        stances: ['Legacy manifests need migration.'],
        axioms: [{ id: 'a1', one_sentence: 'Canonical names matter.', full_statement: 'Canonical names matter.', why: 'Implementers need one name.' }],
        ontology: [],
      }),
      'KDNA_Patterns.json': json({
        meta: { domain: 'legacy', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
        misunderstandings: [{ id: 'm1', wrong: 'Two spec fields are harmless.', correct: 'One field is canonical.', key_distinction: 'interop', why: 'Schema drift breaks loaders.' }],
        self_check: ['Did I use spec_version?'],
      }),
    }),
  );

  const reader = createKdnaAssetReader();
  const verify = await reader.verify(await reader.open(assetPath));
  assert.equal(verify.ok, false);
  assert.ok(verify.errors.includes('kdna.json: kdna_spec is not allowed. Use spec_version.'));
});

test('asset reader decrypts licensed entries only through an in-memory hook', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-licensed-'));
  const assetPath = path.join(tmp, 'writing-pro.kdna');
  const core = {
    meta: { domain: 'writing_pro', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
    stances: ['Licensed judgment stays protected.'],
    axioms: [{ id: 'licensed_a1', one_sentence: 'Protected judgment loads in memory.', full_statement: 'Protected judgment loads in memory.', why: 'Assets can be licensed.' }],
    ontology: [],
  };
  const patterns = {
    meta: { domain: 'writing_pro', version: '0.1.0', created: '2026-05-27', purpose: 'test', load_condition: 'always' },
    misunderstandings: [{ id: 'licensed_m1', wrong: 'Decrypt to disk.', correct: 'Decrypt in memory.', key_distinction: 'storage', why: 'Plaintext must not persist.' }],
    self_check: ['Did decryption stay in memory?'],
  };
  const manifest = {
    format: 'kdna',
    format_version: '1.0',
    spec_version: '1.0-rc',
    name: '@aikdna/writing_pro',
    version: '0.1.0',
    judgment_version: '2026.05',
    access: 'licensed',
    status: 'experimental',
    quality_badge: 'untested',
    description: 'Licensed writing asset',
    author: { name: 'Test', id: 'test' },
    license: { type: 'KCL-1.0' },
    languages: ['en'],
    default_language: 'en',
    encryption: {
      profile: 'kdna-licensed-entry-v1',
      encrypted_entries: ['KDNA_Core.json', 'KDNA_Patterns.json'],
    },
  };
  const licenseKey = 'KDNA-LIC-TEST';

  fs.writeFileSync(
    assetPath,
    makeZip({
      mimetype: 'application/vnd.aikdna.kdna+zip',
      'kdna.json': json(manifest),
      'KDNA_Core.json': json(
        encryptLicensedEntry(json(core), {
          entryName: 'KDNA_Core.json',
          manifest,
          licenseKey,
        }),
      ),
      'KDNA_Patterns.json': json(
        encryptLicensedEntry(json(patterns), {
          entryName: 'KDNA_Patterns.json',
          manifest,
          licenseKey,
        }),
      ),
    }),
  );

  const reader = createKdnaAssetReader();
  const asset = await reader.open(assetPath);
  const verifyWithoutHook = await reader.verify(asset, { requireDecryption: true });
  assert.equal(verifyWithoutHook.ok, false);
  assert.ok(verifyWithoutHook.errors.includes('decryptEntry hook required for encrypted entries'));

  await assert.rejects(
    () => reader.loadProfile(asset, 'compact'),
    /encrypted entry requires decryptEntry hook/,
  );

  const decryptEntry = createLicensedDecryptEntry({ licenseKey });
  const verifyWithHook = await reader.verify(asset, { requireDecryption: true, decryptEntry });
  assert.equal(verifyWithHook.ok, true);
  assert.match(verifyWithHook.warnings.join('\n'), /encrypted entries present/);

  const loaded = await reader.loadProfile(asset, 'compact', { decryptEntry });
  assert.equal(loaded.domain.core.axioms[0].id, 'licensed_a1');
  assert.match(loaded.context, /Protected judgment loads in memory/);

  const syncAsset = reader.openSync(assetPath);
  const syncVerify = reader.verifySync(syncAsset, { requireDecryption: true, decryptEntry });
  assert.equal(syncVerify.ok, true);
  const syncLoaded = reader.loadProfileSync(syncAsset, 'compact', { decryptEntry });
  assert.equal(syncLoaded.domain.core.axioms[0].id, 'licensed_a1');

  const wrongDecryptEntry = createLicensedDecryptEntry({
    licenseKey: 'wrong',
  });
  const wrongVerify = await reader.verify(asset, {
    requireDecryption: true,
    decryptEntry: wrongDecryptEntry,
  });
  assert.equal(wrongVerify.ok, false);
});
