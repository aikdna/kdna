const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const core = require('../src');
const container = require('../src/container');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const minimalSource = path.join(repoRoot, 'examples', 'minimal');

function withAsset(mutator, { rebuildChecksums = true } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-public-api-'));
  const source = path.join(tmp, 'source');
  const assetPath = path.join(tmp, 'asset.kdna');
  fs.cpSync(minimalSource, source, { recursive: true });
  if (mutator) mutator(source);
  if (rebuildChecksums) {
    fs.writeFileSync(
      path.join(source, 'checksums.json'),
      JSON.stringify(container.buildChecksums(source), null, 2),
    );
  }
  container.pack(source, assetPath);
  return { tmp, source, assetPath, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}

function updateManifest(source, update) {
  const manifestPath = path.join(source, 'kdna.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  update(manifest);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

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

function makeLegacyZip(entries) {
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

test('stable APIs converge on current inspect, five-gate validate, Capsule load, and prompt render', async () => {
  const fixture = withAsset();
  try {
    const inspectedSync = core.inspectKDNASync(fixture.assetPath);
    const inspected = await core.inspectKDNA(fixture.assetPath);
    assert.deepEqual(inspected, inspectedSync);
    assert.equal(inspected.asset_id, 'kdna:example:agent-project-context');
    assert.match(inspected.asset_digest, /^sha256:[a-f0-9]{64}$/);
    assert.match(inspected.content_digest, /^sha256:[a-f0-9]{64}$/);
    assert.equal(inspected.ok, true);

    const validationSync = core.validateKDNASync(fixture.assetPath);
    const validation = await core.validateKDNA(fixture.assetPath);
    assert.deepEqual(validation, validationSync);
    assert.deepEqual(validation, container.validate(fixture.assetPath));
    assert.equal(validation.overall_valid, true, validation.problems.join('; '));

    const loadedSync = core.loadKDNASync(fixture.assetPath, { profile: 'compact', as: 'json' });
    const loaded = await core.loadKDNA(fixture.assetPath, { profile: 'compact', as: 'json' });
    const loadedByDefault = core.loadKDNASync(fixture.assetPath);
    assert.equal(loadedSync.type, 'kdna.runtime-capsule');
    assert.equal(loaded.type, 'kdna.runtime-capsule');
    assert.equal(loadedByDefault.type, 'kdna.runtime-capsule');
    assert.deepEqual(loaded.asset, loadedSync.asset);
    assert.deepEqual(loaded.context, loadedSync.context);

    const promptSync = core.renderForAgentSync(fixture.assetPath, { profile: 'compact' });
    const prompt = await core.renderForAgent(fixture.assetPath, { profile: 'compact' });
    assert.equal(prompt, promptSync);
    assert.match(prompt, /KDNA Judgment Asset/);

    const digestCheck = await core.verifyDigest(fixture.assetPath, inspected.asset_digest);
    assert.equal(digestCheck.ok, true, digestCheck.errors.join('; '));
  } finally {
    fixture.cleanup();
  }
});

test('matchDomain sync and async consume the current inspect shape', async () => {
  const fixture = withAsset();
  try {
    const query = 'Load kdna:example:agent-project-context for this task';
    const syncMatches = core.matchDomainSync(query, [fixture.assetPath]);
    const asyncMatches = await core.matchDomain(query, [fixture.assetPath]);
    assert.deepEqual(asyncMatches, syncMatches);
    assert.equal(syncMatches.length, 1);
    assert.equal(syncMatches[0].asset_id, 'kdna:example:agent-project-context');
    assert.equal(syncMatches[0].score > 0, true);
  } finally {
    fixture.cleanup();
  }
});

test('stable Runtime load rejects authoring source directories', async () => {
  assert.throws(
    () => core.loadKDNASync(minimalSource),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
  await assert.rejects(
    core.loadKDNA(minimalSource),
    (error) => error.code === 'KDNA_ASSET_FILE_REQUIRED',
  );
});

test('path, Buffer, Uint8Array, and opened-asset inputs have current API parity without temp materialization', async () => {
  const fixture = withAsset();
  try {
    const bytes = fs.readFileSync(fixture.assetPath);
    const opened = core.openKDNASync(bytes);
    const expectedValidation = core.validateKDNASync(fixture.assetPath);
    const expectedInspect = core.inspectKDNASync(fixture.assetPath);
    assert.deepEqual(container.inspect(bytes), container.inspect(fixture.assetPath));
    assert.deepEqual(container.validate(bytes), container.validate(fixture.assetPath));
    const filePlan = container.planLoad(fixture.assetPath);
    const memoryPlan = container.planLoad(bytes);
    assert.deepEqual(memoryPlan.asset, filePlan.asset);
    assert.deepEqual(memoryPlan.checks, filePlan.checks);
    assert.equal(memoryPlan.state, filePlan.state);
    assert.equal(memoryPlan.can_load_now, filePlan.can_load_now);
    assert.equal(
      memoryPlan.input_fingerprint.source_fingerprint,
      filePlan.input_fingerprint.source_fingerprint,
    );
    assert.deepEqual(
      container.loadAuthorized(bytes, { as: 'json' }).context,
      container.loadAuthorized(fixture.assetPath, { as: 'json' }).context,
    );

    const originalMkdtemp = fs.mkdtempSync;
    fs.mkdtempSync = () => { throw new Error('stable Buffer verification must not create temp files'); };
    try {
      for (const input of [bytes, new Uint8Array(bytes), opened]) {
        assert.deepEqual(core.validateKDNASync(input), expectedValidation);
        const verify = core.verifyAssetSync(input);
        assert.equal(verify.ok, true, verify.errors.join('; '));
        const inspect = core.inspectKDNASync(input);
        assert.equal(inspect.asset_digest, expectedInspect.asset_digest);
        assert.equal(inspect.content_digest, expectedInspect.content_digest);
        assert.equal(core.loadKDNASync(input, { as: 'json' }).type, 'kdna.runtime-capsule');
      }
    } finally {
      fs.mkdtempSync = originalMkdtemp;
    }

    const originalReadFile = fs.readFileSync;
    let assetReads = 0;
    fs.readFileSync = function countedRead(file, ...args) {
      if (path.resolve(String(file)) === path.resolve(fixture.assetPath)) assetReads += 1;
      return originalReadFile.call(this, file, ...args);
    };
    try {
      core.inspectKDNASync(fixture.assetPath);
      container.inspect(fixture.assetPath);
    } finally {
      fs.readFileSync = originalReadFile;
    }
    assert.equal(assetReads, 2, 'stable and direct inspect must each use one byte snapshot');
  } finally {
    fixture.cleanup();
  }
});

test('packaged load entry points authorize and project one immutable file snapshot', () => {
  const publicAsset = withAsset((source) => updateManifest(source, (manifest) => {
    manifest.asset_id = 'kdna:test:snapshot-public';
    manifest.title = 'Snapshot public';
    manifest.access = 'public';
    delete manifest.entitlement;
  }));
  const licensedAsset = withAsset((source) => updateManifest(source, (manifest) => {
    manifest.asset_id = 'kdna:test:snapshot-licensed';
    manifest.title = 'Snapshot licensed';
    manifest.access = 'licensed';
    manifest.entitlement = { profile: 'account' };
  }));
  const originalReadFile = fs.readFileSync;
  const publicBytes = originalReadFile(publicAsset.assetPath);
  const licensedBytes = originalReadFile(licensedAsset.assetPath);
  const loaders = [
    ['stable', (input) => core.loadKDNASync(input, { as: 'json' })],
    ['runtime', (input) => core.loadAuthorized(input, { as: 'json' })],
    ['container', (input) => container.loadAuthorized(input, { as: 'json' })],
  ];

  try {
    assert.equal(core.planLoad(licensedAsset.assetPath).can_load_now, false);
    for (const [name, load] of loaders) {
      fs.writeFileSync(publicAsset.assetPath, publicBytes);
      let reads = 0;
      fs.readFileSync = function mutateAfterSnapshot(file, ...args) {
        const bytes = originalReadFile.call(this, file, ...args);
        if (path.resolve(String(file)) === path.resolve(publicAsset.assetPath)) {
          reads += 1;
          if (reads === 1) fs.writeFileSync(publicAsset.assetPath, licensedBytes);
        }
        return bytes;
      };
      try {
        const capsule = load(publicAsset.assetPath);
        assert.equal(capsule.asset.asset_id, 'kdna:test:snapshot-public', name);
        assert.equal(capsule.access, 'public', name);
        assert.equal(reads, 1, `${name} must read the packaged path once`);
      } finally {
        fs.readFileSync = originalReadFile;
      }
    }
  } finally {
    fs.readFileSync = originalReadFile;
    publicAsset.cleanup();
    licensedAsset.cleanup();
  }
});

test('composeKDNA fails closed until Cluster/Capsule composition is defined', async () => {
  const fixture = withAsset();
  try {
    await assert.rejects(
      core.composeKDNA([fixture.assetPath]),
      (error) => error.code === 'KDNA_COMPOSE_PROTOCOL_UNAVAILABLE',
    );
  } finally {
    fixture.cleanup();
  }
});

test('language is valid and creator provenance remains optional but cannot be explicitly empty', () => {
  const noCreator = withAsset((source) => updateManifest(source, (manifest) => {
    delete manifest.creator;
    manifest.language = 'en';
  }));
  const emptyCreator = withAsset((source) => updateManifest(source, (manifest) => {
    manifest.creator = { name: '' };
  }));
  try {
    assert.equal(core.validateKDNASync(noCreator.assetPath).overall_valid, true);
    assert.equal(core.verifyAssetSync(noCreator.assetPath).ok, true);
    const invalid = core.validateKDNASync(emptyCreator.assetPath);
    assert.equal(invalid.schema_valid, false);
    assert.ok(invalid.problems.some((problem) => problem.includes('/creator/name')));
    assert.equal(core.verifyAssetSync(emptyCreator.assetPath).ok, false);
  } finally {
    noCreator.cleanup();
    emptyCreator.cleanup();
  }
});

test('current manifest validation rejects removed manifest aliases', () => {
  const fixture = withAsset((source) => updateManifest(source, (manifest) => {
    manifest.kdna_spec = '1.0-rc';
  }));
  try {
    const validation = core.validateKDNASync(fixture.assetPath);
    assert.equal(validation.schema_valid, false);
    assert.ok(
      validation.problems.includes('kdna.json: kdna_spec is not allowed. Use format_version.'),
    );
    assert.equal(core.verifyAssetSync(fixture.assetPath).ok, false);
  } finally {
    fixture.cleanup();
  }
});

test('stable verification fails closed for invalid CBOR, checksum mismatch, and missing manifest fields', () => {
  const invalidCbor = withAsset((source) => {
    fs.writeFileSync(path.join(source, 'payload.kdnab'), Buffer.from([0xff, 0x00, 0x01]));
  });
  const checksumMismatch = withAsset((source) => updateManifest(source, (manifest) => {
    manifest.summary = `${manifest.summary || ''} changed after checksums`;
  }), { rebuildChecksums: false });
  const invalidManifest = withAsset((source) => updateManifest(source, (manifest) => {
    delete manifest.asset_uid;
  }));
  try {
    const cborValidation = core.validateKDNASync(invalidCbor.assetPath);
    assert.equal(cborValidation.payload_valid, false);
    assert.equal(core.verifyAssetSync(invalidCbor.assetPath).ok, false);

    const checksumValidation = core.validateKDNASync(checksumMismatch.assetPath);
    assert.equal(checksumValidation.checksums_valid, false);
    assert.equal(core.verifyAssetSync(checksumMismatch.assetPath).ok, false);

    const manifestValidation = core.validateKDNASync(invalidManifest.assetPath);
    assert.equal(manifestValidation.schema_valid, false);
    assert.equal(core.verifyAssetSync(invalidManifest.assetPath).ok, false);
  } finally {
    invalidCbor.cleanup();
    checksumMismatch.cleanup();
    invalidManifest.cleanup();
  }
});

test('legacy plaintext ZIP is rejected while explicit pure legacy source loading remains available', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-legacy-plaintext-'));
  const legacyPath = path.join(tmp, 'legacy.kdna');
  const legacyCore = {
    meta: { domain: 'legacy', version: '1.0.0', created: '2026-01-01', purpose: 'test', load_condition: 'always' },
    axioms: [], ontology: [], frameworks: [], core_structure: [], stances: [],
  };
  const legacyPatterns = {
    meta: { domain: 'legacy', version: '1.0.0', created: '2026-01-01', purpose: 'test', load_condition: 'always' },
    terminology: {}, misunderstandings: [], self_check: [],
  };
  fs.writeFileSync(legacyPath, makeLegacyZip({
    mimetype: 'application/vnd.kdna.asset',
    'kdna.json': JSON.stringify({ kdna_version: '1.0' }),
    'KDNA_Core.json': JSON.stringify(legacyCore),
    'KDNA_Patterns.json': JSON.stringify(legacyPatterns),
  }));
  try {
    assert.equal(core.verifyAssetSync(legacyPath).ok, false);
    assert.throws(() => core.validateKDNASync(legacyPath), /forbidden top-level source entry|missing payload\.kdnab/);
    assert.throws(() => core.loadKDNASync(legacyPath), /LoadPlan denied loading/);
    const legacy = core.loadDomainFromFiles({
      'KDNA_Core.json': legacyCore,
      'KDNA_Patterns.json': legacyPatterns,
    });
    assert.equal(legacy.core.meta.domain, 'legacy');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('direct reader loadProfile uses current Capsule and legacy readDataMap fails explicitly', () => {
  const fixture = withAsset();
  try {
    const reader = core.createKdnaAssetReader();
    const asset = reader.openSync(fixture.assetPath);
    const capsule = reader.loadProfileSync(asset, 'compact');
    assert.equal(capsule.type, 'kdna.runtime-capsule');
    assert.throws(
      () => reader.readDataMapSync(asset),
      (error) => error.code === 'KDNA_LEGACY_DATA_MAP_UNSUPPORTED',
    );
  } finally {
    fixture.cleanup();
  }
});

test('CJS, ESM, and declarations expose the same stable API names', async () => {
  const esm = await import('../src/index.mjs');
  const stableNames = [
    'openKDNA', 'openKDNASync', 'inspectKDNA', 'inspectKDNASync',
    'loadKDNA', 'loadKDNASync', 'validateKDNA', 'validateKDNASync',
    'renderForAgent', 'renderForAgentSync', 'verifyAsset', 'verifyAssetSync',
    'composeKDNA',
  ];
  for (const name of stableNames) {
    assert.equal(typeof core[name], 'function', `CJS ${name}`);
    assert.equal(typeof esm[name], 'function', `ESM ${name}`);
  }
  const declarations = fs.readFileSync(path.join(__dirname, '..', 'src', 'types.d.ts'), 'utf8');
  for (const name of stableNames) assert.match(declarations, new RegExp(`function ${name}\\b`));
});
