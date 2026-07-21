/**
 * single-format-api.test.js — KDNA Core single-format public API regression.
 *
 * Verifies the Core module surface after the single-format refactor:
 *   - exports MIMETYPE, isKdnaSourceDir, detectContainerFormat
 *   - detectContainerFormat returns 'kdna' for current assets and null for others
 *   - authoritative and packaged Runtime schemas remain identical
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cbor = require('cbor-x');

const core = require('../src/index.js');
const container = require('../src/container/index.js');

const LEGACY_MIMETYPE = ['application/vnd', 'aikdna', 'kdna+zip'].join('.');
const { createKdnaAssetReader } = require('../src/asset-reader.js');
const packagedManifestSchema = require('../schema/manifest.schema.json');
const authoritativeManifestSchema = require('../../../schema/manifest.schema.json');
const packagedChecksumsSchema = require('../schema/checksums.schema.json');
const authoritativeChecksumsSchema = require('../../../schema/checksums.schema.json');

test('Core root exports single-format public API', () => {
  assert.equal(typeof core.MIMETYPE, 'string', 'MIMETYPE exported');
  assert.equal(core.MIMETYPE, 'application/vnd.kdna.asset');
  assert.equal(typeof core.isKdnaSourceDir, 'function', 'isKdnaSourceDir exported');
  assert.equal(typeof core.detectContainerFormat, 'function', 'detectContainerFormat exported');

  assert.equal(core.isSourceDir, undefined, 'isSourceDir alias must not be exported');
});

test('Core runtime API rejects source directories and accepts packaged assets', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const source = path.join(repoRoot, 'examples', 'minimal');
  const plan = core.planLoad(source);
  assert.equal(plan.state, 'invalid');
  assert.equal(plan.can_load_now, false);
  assert.equal(plan.issues[0].code, 'KDNA_ASSET_FILE_REQUIRED');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-runtime-file-'));
  try {
    const assetPath = path.join(tmp, 'minimal.kdna');
    container.pack(source, assetPath);
    const packagedPlan = core.planLoad(assetPath);
    assert.equal(packagedPlan.state, 'ready');
    assert.equal(
      packagedPlan.input_fingerprint.source_fingerprint,
      container.planLoad(source).input_fingerprint.source_fingerprint,
      'source fingerprint is stable across source and packaged transports',
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('container entry exports the single-format public API', () => {
  assert.equal(container.MIMETYPE, 'application/vnd.kdna.asset');
  assert.equal(typeof container.isKdnaSourceDir, 'function');
  assert.equal(typeof container.detectContainerFormat, 'function');

  const generationMarker = 'V';
  assert.equal(container[['MIMETYPE_', generationMarker, 1].join('')], undefined);
  assert.equal(container[['MIMETYPE_', generationMarker, 2].join('')], undefined);
  assert.equal(container.MIMETYPE_LEGACY, undefined);
  assert.equal(container[['is', generationMarker, 1, 'SourceDir'].join('')], undefined);
  assert.equal(container[['is', generationMarker, 2, 'SourceDir'].join('')], undefined);
});

test('detectContainerFormat returns kdna for current asset and null for others', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-detect-'));
  try {
    const src = path.join(tmp, 'src');
    fs.mkdirSync(src, { recursive: true });
    fs.writeFileSync(path.join(src, 'mimetype'), 'application/vnd.kdna.asset');
    fs.writeFileSync(
      path.join(src, 'kdna.json'),
      JSON.stringify({
        format_version: '0.1.0',
        asset_id: 'kdna:test:detect',
        asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000001',
        asset_type: 'sample',
        title: 'Detect test',
        version: '1.0.0',
        judgment_version: '1.0.0',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        creator: { name: 'Test' },
        compatibility: {
          min_loader_version: '0.20.0',
          profile: 'kdna.payload.judgment',
          profile_version: '0.1.0',
        },
        payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
      }),
    );
    fs.writeFileSync(
      path.join(src, 'payload.kdnab'),
      cbor.encode({
        profile: 'kdna.payload.judgment',
        profile_version: '0.1.0',
        core: { highest_question: 'q', axioms: [] },
      }),
    );

    const packed = path.join(tmp, 'test.kdna');
    container.pack(src, packed);
    assert.equal(
      container.detectContainerFormat(packed),
      'kdna',
      'packed current asset detects as kdna',
    );

    const notKdna = path.join(tmp, 'not.kdna');
    fs.writeFileSync(notKdna, 'this is not a zip file');
    assert.equal(container.detectContainerFormat(notKdna), null, 'non-zip returns null');

    const oldMimeDir = path.join(tmp, 'old');
    fs.mkdirSync(oldMimeDir, { recursive: true });
    fs.writeFileSync(path.join(oldMimeDir, 'mimetype'), LEGACY_MIMETYPE);
    fs.writeFileSync(path.join(oldMimeDir, 'kdna.json'), '{}');
    fs.writeFileSync(path.join(oldMimeDir, 'payload.kdnab'), '{}');
    assert.equal(
      container.isKdnaSourceDir(oldMimeDir),
      false,
      'removed mimetype source dir is rejected',
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('packaged manifest schema exposes only the single wire contract', () => {
  assert.equal(packagedManifestSchema.properties.format_version.const, '0.1.0');
  assert.deepEqual(packagedManifestSchema.properties.payload.properties.encoding.enum, ['cbor']);
  assert.equal(packagedManifestSchema.properties[['kdna', 'version'].join('_')], undefined);
  assert.equal(packagedManifestSchema.properties.spec_version, undefined);
});

test('authoritative and packaged Runtime manifest schemas stay identical', () => {
  assert.deepEqual(packagedManifestSchema, authoritativeManifestSchema);
});

test('authoritative and packaged checksum schemas stay identical', () => {
  assert.deepEqual(packagedChecksumsSchema, authoritativeChecksumsSchema);
});

test('Runtime manifest creator provenance is optional for validate and load', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const sourceFixture = path.join(repoRoot, 'examples', 'minimal');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-optional-creator-'));
  try {
    const source = path.join(tmp, 'source');
    fs.cpSync(sourceFixture, source, { recursive: true });
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    delete manifest.creator;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(
      path.join(source, 'checksums.json'),
      JSON.stringify(container.buildChecksums(source), null, 2),
    );

    const assetPath = path.join(tmp, 'no-creator.kdna');
    container.pack(source, assetPath);
    const validation = core.validate(assetPath);
    assert.equal(validation.overall_valid, true, validation.problems.join('; '));

    const capsule = core.load(assetPath, { profile: 'compact', as: 'json' });
    assert.equal(capsule.type, 'kdna.runtime-capsule');
    assert.equal(capsule.asset.asset_id, manifest.asset_id);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Runtime manifest rejects an explicitly empty creator name', () => {
  const repoRoot = path.resolve(__dirname, '..', '..', '..');
  const sourceFixture = path.join(repoRoot, 'examples', 'minimal');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-empty-creator-'));
  try {
    const source = path.join(tmp, 'source');
    fs.cpSync(sourceFixture, source, { recursive: true });
    const manifestPath = path.join(source, 'kdna.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.creator = { name: '' };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    fs.writeFileSync(
      path.join(source, 'checksums.json'),
      JSON.stringify(container.buildChecksums(source), null, 2),
    );

    const assetPath = path.join(tmp, 'empty-creator.kdna');
    container.pack(source, assetPath);
    const validation = core.validate(assetPath);
    assert.equal(validation.overall_valid, false);
    assert.equal(validation.schema_valid, false);
    assert.ok(
      validation.problems.some(
        (problem) => problem.includes('/creator/name') && problem.includes('fewer than 1'),
      ),
      validation.problems.join('; '),
    );
    assert.throws(() => core.load(assetPath), /LoadPlan denied loading/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('asset reader verifySync enforces format_version and current mimetype', () => {
  const reader = createKdnaAssetReader();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-reader-'));
  try {
    const file = path.join(tmp, 'single.kdna');
    const manifest = {
      format_version: '0.1.0',
      asset_id: 'kdna:test:reader',
      asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000001',
      asset_type: 'sample',
      title: 'Reader test',
      version: '1.0.0',
      judgment_version: '1.0.0',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      creator: { name: 'Test' },
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
        highest_question: 'Which reader behavior preserves the container contract?',
        axioms: ['Reject containers whose required format coordinates are invalid.'],
      },
    };

    const files = {
      mimetype: Buffer.from('application/vnd.kdna.asset', 'utf8'),
      'kdna.json': Buffer.from(JSON.stringify(manifest), 'utf8'),
      'payload.kdnab': cbor.encode(payload),
    };
    const order = ['mimetype', 'kdna.json', 'payload.kdnab'];

    // Build a minimal deterministic ZIP
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const name of order) {
      const data = files[name];
      const crc = 0;
      const compressed = data;
      const method = 0;
      const nameBuf = Buffer.from(name, 'utf8');
      const local = Buffer.alloc(30 + nameBuf.length);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(20, 4);
      local.writeUInt16LE(0, 6);
      local.writeUInt16LE(method, 8);
      local.writeUInt16LE(0, 10);
      local.writeUInt16LE(0, 12);
      local.writeUInt32LE(crc, 14);
      local.writeUInt32LE(compressed.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(nameBuf.length, 26);
      local.writeUInt16LE(0, 28);
      nameBuf.copy(local, 30);
      locals.push(local, compressed);

      const cd = Buffer.alloc(46 + nameBuf.length);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(20, 4);
      cd.writeUInt16LE(20, 6);
      cd.writeUInt16LE(0, 8);
      cd.writeUInt16LE(method, 10);
      cd.writeUInt16LE(0, 12);
      cd.writeUInt16LE(0, 14);
      cd.writeUInt32LE(crc, 16);
      cd.writeUInt32LE(compressed.length, 20);
      cd.writeUInt32LE(data.length, 24);
      cd.writeUInt16LE(nameBuf.length, 28);
      cd.writeUInt16LE(0, 30);
      cd.writeUInt16LE(0, 32);
      cd.writeUInt16LE(0, 34);
      cd.writeUInt16LE(0, 36);
      cd.writeUInt32LE(0, 38);
      cd.writeUInt32LE(offset, 42);
      nameBuf.copy(cd, 46);
      centrals.push(cd);
      offset += local.length + compressed.length;
    }
    const cdSize = centrals.reduce((s, c) => s + c.length, 0);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(order.length, 8);
    eocd.writeUInt16LE(order.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);
    fs.writeFileSync(file, Buffer.concat([...locals, ...centrals, eocd]));

    const verify = reader.verifySync(reader.openSync(file));
    assert.equal(verify.ok, true, `verify errors: ${verify.errors.join('; ')}`);
    assert.equal(verify.manifest.format_version, '0.1.0');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('types.d.ts does not declare old split-format API', () => {
  const typesPath = path.join(__dirname, '..', 'src', 'types.d.ts');
  const types = fs.readFileSync(typesPath, 'utf8');
  const generationMarker = 'V';
  for (const removedName of [
    ['MIMETYPE_', generationMarker, 1].join(''),
    ['MIMETYPE_', generationMarker, 2].join(''),
    ['is', generationMarker, 1, 'SourceDir'].join(''),
    ['is', generationMarker, 2, 'SourceDir'].join(''),
  ]) {
    assert.ok(!types.includes(removedName), `types.d.ts must not declare ${removedName}`);
  }
  assert.ok(types.includes('isKdnaSourceDir'), 'types.d.ts must declare isKdnaSourceDir');
  assert.ok(
    types.includes("detectContainerFormat(inputPath: string): 'kdna' | null"),
    'detectContainerFormat return type must be kdna | null',
  );
});
