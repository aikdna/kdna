'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const cbor = require('cbor-x');

const core = require('../src');
const container = require('../src/container');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const generator = path.join(repoRoot, 'scripts', 'generate-container-negative-fixtures.mjs');
const licenseKey = 'KDNA-TEST-LICENSE-VECTOR-2026';
const licensedFixtureSha256 = '25d1258352701e31c8e94253170947d936f6f861af70aeb984d38769c600f4dc';
const licensedFixtureEntries = ['mimetype', 'checksums.json', 'kdna.json', 'payload.kdnab'];

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function sha256(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function generatedHashes(root) {
  return [
    'fixtures/container/invalid-bad-checksum/checksums.json',
    'fixtures/container/invalid-bad-checksum/payload.kdnab',
    'fixtures/container/invalid-missing-manifest/payload.kdnab',
    'fixtures/test_licensed_entry.kdna',
  ].map((relativePath) => [relativePath, sha256(path.join(root, relativePath))]);
}

function validationChecks(validation) {
  return {
    format_valid: validation.format_valid,
    schema_valid: validation.schema_valid,
    payload_valid: validation.payload_valid,
    checksums_valid: validation.checksums_valid,
    load_contract_valid: validation.load_contract_valid,
    overall_valid: validation.overall_valid,
  };
}

function readZipMetadata(filePath) {
  const bytes = fs.readFileSync(filePath);
  let endOffset = -1;
  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65_557); offset -= 1) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  assert.notEqual(endOffset, -1, 'ZIP end record must exist');
  const end = {
    disk: bytes.readUInt16LE(endOffset + 4),
    centralDisk: bytes.readUInt16LE(endOffset + 6),
    diskEntries: bytes.readUInt16LE(endOffset + 8),
    entries: bytes.readUInt16LE(endOffset + 10),
    centralSize: bytes.readUInt32LE(endOffset + 12),
    centralOffset: bytes.readUInt32LE(endOffset + 16),
    commentLength: bytes.readUInt16LE(endOffset + 20),
  };
  assert.equal(endOffset + 22 + end.commentLength, bytes.length);
  assert.equal(end.centralOffset + end.centralSize, endOffset);

  const entries = [];
  let cursor = end.centralOffset;
  for (let index = 0; index < end.entries; index += 1) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const nameBytes = bytes.subarray(cursor + 46, cursor + 46 + nameLength);
    const localOffset = bytes.readUInt32LE(cursor + 42);
    assert.equal(bytes.readUInt32LE(localOffset), 0x04034b50);
    const localNameLength = bytes.readUInt16LE(localOffset + 26);
    const localExtraLength = bytes.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    entries.push({
      name: nameBytes.toString('utf8'),
      nameBytes: Buffer.from(nameBytes),
      madeBy: bytes.readUInt16LE(cursor + 4),
      needed: bytes.readUInt16LE(cursor + 6),
      flags: bytes.readUInt16LE(cursor + 8),
      method: bytes.readUInt16LE(cursor + 10),
      time: bytes.readUInt16LE(cursor + 12),
      date: bytes.readUInt16LE(cursor + 14),
      crc: bytes.readUInt32LE(cursor + 16),
      compressedSize,
      uncompressedSize: bytes.readUInt32LE(cursor + 24),
      extraLength,
      commentLength,
      startDisk: bytes.readUInt16LE(cursor + 34),
      internalAttributes: bytes.readUInt16LE(cursor + 36),
      externalAttributes: bytes.readUInt32LE(cursor + 38),
      localOffset,
      local: {
        needed: bytes.readUInt16LE(localOffset + 4),
        flags: bytes.readUInt16LE(localOffset + 6),
        method: bytes.readUInt16LE(localOffset + 8),
        time: bytes.readUInt16LE(localOffset + 10),
        date: bytes.readUInt16LE(localOffset + 12),
        crc: bytes.readUInt32LE(localOffset + 14),
        compressedSize: bytes.readUInt32LE(localOffset + 18),
        uncompressedSize: bytes.readUInt32LE(localOffset + 22),
        nameLength: localNameLength,
        extraLength: localExtraLength,
        nameBytes: Buffer.from(
          bytes.subarray(localOffset + 30, localOffset + 30 + localNameLength),
        ),
      },
      data: Buffer.from(bytes.subarray(dataStart, dataStart + compressedSize)),
      localEnd: dataStart + compressedSize,
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  assert.equal(cursor, endOffset);
  return { bytes, end, entries };
}

function prepareFixtureRoot(root) {
  for (const relativePath of [
    'examples/minimal',
    'fixtures/container/invalid-bad-checksum',
    'fixtures/container/invalid-missing-manifest',
  ]) {
    fs.cpSync(path.join(repoRoot, relativePath), path.join(root, relativePath), {
      recursive: true,
    });
  }
}

function changeTreeMetadata(root) {
  const timestamp = new Date('2040-12-31T23:59:58Z');
  const visit = (entryPath) => {
    const stat = fs.lstatSync(entryPath);
    fs.utimesSync(entryPath, timestamp, timestamp);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(entryPath)) visit(path.join(entryPath, entry));
    } else if (process.platform !== 'win32') {
      fs.chmodSync(entryPath, 0o600);
    }
  };
  visit(root);
}

test('licensed interoperability fixture uses the current encrypted payload contract', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_licensed_entry.kdna');
  assert.equal(sha256(fixture), licensedFixtureSha256);
  const validation = container.validate(fixture);
  assert.equal(validation.overall_valid, true);
  assert.deepEqual(validation.problems, []);
  const reader = core.createKdnaAssetReader();
  const asset = reader.openSync(fixture);
  const manifest = reader.readManifestSync(asset);

  assert.equal(manifest.format_version, '0.1.0');
  assert.equal(manifest.payload.path, 'payload.kdnab');
  assert.equal(manifest.payload.encrypted, true);
  assert.equal(manifest.encryption.profile, core.LICENSED_ENTRY_PROFILE);
  assert.equal(manifest.encryption.profile_version, core.ENCRYPTION_PROFILE_VERSION);
  assert.deepEqual(manifest.encryption.encrypted_entries, ['payload.kdnab']);
  assert.deepEqual(reader.listEntriesSync(asset), [
    'checksums.json',
    'kdna.json',
    'mimetype',
    'payload.kdnab',
  ]);

  const decryptEntry = ({ ciphertext, entryName, manifest: runtimeManifest }) =>
    core.decryptLicensedEntry(ciphertext, {
      entryName,
      manifest: runtimeManifest,
      licenseKey,
    });
  const verification = reader.verifySync(asset, { requireDecryption: true, decryptEntry });
  assert.equal(verification.ok, true, verification.errors.join('; '));
  const plaintext = decryptEntry({
    ciphertext: reader.readEntrySync(asset, manifest.payload.path),
    entryName: manifest.payload.path,
    manifest,
  });
  const canonical = fs.readFileSync(path.join(repoRoot, 'examples', 'minimal', 'payload.kdnab'));
  assert.deepEqual(cbor.decode(plaintext), cbor.decode(canonical));
});

test('manifest encryption profile coordinates fail closed before decryption', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_protected_entry.kdna');
  const cases = [
    [
      'missing encryption declaration',
      (manifest) => { delete manifest.encryption; },
      /encryption/u,
    ],
    [
      'missing profile_version',
      (manifest) => { delete manifest.encryption.profile_version; },
      /profile_version/u,
    ],
    [
      'unsupported profile_version',
      (manifest) => { manifest.encryption.profile_version = '9.9.9'; },
      /profile_version/u,
    ],
    [
      'encrypted_entries names an unrelated entry',
      (manifest) => { manifest.encryption.encrypted_entries = ['other.bin']; },
      /encrypted_entries|payload\.kdnab/u,
    ],
    [
      'encrypted_entries adds an unrelated entry',
      (manifest) => {
        manifest.encryption.encrypted_entries = ['payload.kdnab', 'other.bin'];
      },
      /encrypted_entries|payload\.kdnab/u,
    ],
  ];

  for (const [name, mutate, problemPattern] of cases) {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-encryption-coordinate-'));
    const source = path.join(temporary, 'source');
    const asset = path.join(temporary, 'mutated.kdna');
    try {
      container.unpack(fixture, source);
      const manifestPath = path.join(source, 'kdna.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      mutate(manifest);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      fs.writeFileSync(
        path.join(source, 'checksums.json'),
        JSON.stringify(core.buildChecksums(source)),
      );
      container.pack(source, asset);

      const validation = container.validate(asset);
      assert.equal(validation.schema_valid, false, name);
      assert.equal(validation.overall_valid, false, name);
      assert.match(validation.problems.join('; '), problemPattern, name);
      assert.throws(
        () => core.loadAuthorized(asset, {
          profile: 'compact',
          as: 'json',
          password: 'KDNA-TEST-VECTOR-2026',
        }),
        /LoadPlan denied loading/u,
        name,
      );
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
});

test('manifest declaration and encrypted payload bytes must agree in both directions', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_protected_entry.kdna');
  const plaintextPayload = fs.readFileSync(
    path.join(repoRoot, 'examples', 'minimal', 'payload.kdnab'),
  );
  const cases = [
    [
      'declared encryption with plaintext payload',
      () => plaintextPayload,
      () => {},
      /not an encrypted envelope/u,
    ],
    [
      'encrypted envelope with all declarations removed',
      (source) => fs.readFileSync(path.join(source, 'payload.kdnab')),
      (manifest) => {
        manifest.payload.encrypted = false;
        delete manifest.encryption;
      },
      /missing its manifest encryption declaration|must be equal to constant/u,
    ],
    [
      'encrypted envelope with object encrypted_entries',
      (source) => fs.readFileSync(path.join(source, 'payload.kdnab')),
      (manifest) => {
        manifest.payload.encrypted = false;
        manifest.encryption.encrypted_entries = { entry: 'payload.kdnab' };
      },
      /encrypted_entries must be array|missing its manifest encryption declaration/u,
    ],
    [
      'encrypted envelope with numeric encrypted_entries',
      (source) => fs.readFileSync(path.join(source, 'payload.kdnab')),
      (manifest) => {
        manifest.payload.encrypted = false;
        manifest.encryption.encrypted_entries = 7;
      },
      /encrypted_entries must be array|missing its manifest encryption declaration/u,
    ],
  ];

  for (const [name, payloadBytes, mutateManifest, problemPattern] of cases) {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-encryption-agreement-'));
    const source = path.join(temporary, 'source');
    const asset = path.join(temporary, 'mutated.kdna');
    try {
      container.unpack(fixture, source);
      const manifestPath = path.join(source, 'kdna.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      mutateManifest(manifest);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      fs.writeFileSync(
        path.join(source, 'payload.kdnab'),
        typeof payloadBytes === 'function' ? payloadBytes(source) : payloadBytes,
      );
      fs.writeFileSync(
        path.join(source, 'checksums.json'),
        JSON.stringify(core.buildChecksums(source)),
      );
      container.pack(source, asset);

      const validation = container.validate(asset);
      assert.equal(validation.payload_valid, false, name);
      assert.equal(validation.overall_valid, false, name);
      assert.match(validation.problems.join('; '), problemPattern, name);
      assert.throws(
        () => core.loadAuthorized(asset, {
          profile: 'compact',
          as: 'json',
          password: 'KDNA-TEST-VECTOR-2026',
        }),
        /LoadPlan denied loading/u,
        name,
      );
    } finally {
      fs.rmSync(temporary, { recursive: true, force: true });
    }
  }
});

test('licensed fixture ZIP bytes and local or central metadata are platform-independent', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_licensed_entry.kdna');
  const archive = readZipMetadata(fixture);
  assert.deepEqual(archive.end, {
    disk: 0,
    centralDisk: 0,
    diskEntries: 4,
    entries: 4,
    centralSize: 228,
    centralOffset: 2643,
    commentLength: 0,
  });
  assert.deepEqual(
    archive.entries.map((entry) => entry.name),
    licensedFixtureEntries,
  );
  let expectedOffset = 0;
  for (const entry of archive.entries) {
    assert.equal(entry.localOffset, expectedOffset);
    assert.deepEqual(
      {
        madeBy: entry.madeBy,
        needed: entry.needed,
        flags: entry.flags,
        method: entry.method,
        time: entry.time,
        date: entry.date,
        extraLength: entry.extraLength,
        commentLength: entry.commentLength,
        startDisk: entry.startDisk,
        internalAttributes: entry.internalAttributes,
        externalAttributes: entry.externalAttributes,
      },
      {
        madeBy: 788,
        needed: 20,
        flags: 0x0800,
        method: 0,
        time: 0,
        date: 1,
        extraLength: 0,
        commentLength: 0,
        startDisk: 0,
        internalAttributes: 0,
        externalAttributes: (0o100644 * 0x10000) >>> 0,
      },
    );
    assert.deepEqual(entry.local, {
      needed: 20,
      flags: 0x0800,
      method: 0,
      time: 0,
      date: 1,
      crc: entry.crc,
      compressedSize: entry.uncompressedSize,
      uncompressedSize: entry.uncompressedSize,
      nameLength: entry.nameBytes.length,
      extraLength: 0,
      nameBytes: entry.nameBytes,
    });
    assert.equal(entry.compressedSize, entry.uncompressedSize);
    assert.equal(entry.data.length, entry.uncompressedSize);
    assert.equal(entry.crc, crc32(entry.data));
    expectedOffset = entry.localEnd;
  }
  assert.equal(expectedOffset, archive.end.centralOffset);
});

test('public packer preserves logical identity while binding new transport bytes', (t) => {
  const fixture = path.join(repoRoot, 'fixtures', 'test_licensed_entry.kdna');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-licensed-pack-smoke-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const source = path.join(temporary, 'source');
  const repacked = path.join(temporary, 'repacked.kdna');
  container.unpack(fixture, source);
  container.pack(source, repacked);

  const validation = container.validate(repacked);
  assert.equal(validation.overall_valid, true);
  assert.deepEqual(validation.problems, []);

  const reader = core.createKdnaAssetReader();
  const decryptEntry = ({ ciphertext, entryName, manifest }) =>
    core.decryptLicensedEntry(ciphertext, { entryName, manifest, licenseKey });
  const originalAsset = reader.openSync(fixture);
  const repackedAsset = reader.openSync(repacked);
  const originalVerification = reader.verifySync(originalAsset, {
    requireDecryption: true,
    decryptEntry,
  });
  const repackedVerification = reader.verifySync(repackedAsset, {
    requireDecryption: true,
    decryptEntry,
  });
  assert.equal(originalVerification.ok, true, originalVerification.errors.join('; '));
  assert.equal(repackedVerification.ok, true, repackedVerification.errors.join('; '));
  assert.equal(repackedVerification.content_digest, originalVerification.content_digest);
  assert.notEqual(repackedVerification.asset_digest, originalVerification.asset_digest);
  const originalChecksums = JSON.parse(
    reader.readEntrySync(originalAsset, 'checksums.json').toString('utf8'),
  );
  const repackedChecksums = JSON.parse(
    reader.readEntrySync(repackedAsset, 'checksums.json').toString('utf8'),
  );
  assert.equal(repackedChecksums.entry_set_digest, originalChecksums.entry_set_digest);

  const originalPlan = container.planLoad(fixture);
  const repackedPlan = container.planLoad(repacked);
  assert.equal(
    repackedPlan.input_fingerprint.source_fingerprint,
    originalPlan.input_fingerprint.source_fingerprint,
  );
  assert.notEqual(
    container.readLayout(repacked).containerDigest,
    container.readLayout(fixture).containerDigest,
  );

  const manifest = reader.readManifestSync(repackedAsset);
  const plaintext = decryptEntry({
    ciphertext: reader.readEntrySync(repackedAsset, manifest.payload.path),
    entryName: manifest.payload.path,
    manifest,
  });
  const canonical = fs.readFileSync(path.join(repoRoot, 'examples', 'minimal', 'payload.kdnab'));
  assert.deepEqual(cbor.decode(plaintext), cbor.decode(canonical));
});

test('packaging contract distinguishes logical identity from transport bytes', () => {
  const formatDoc = fs.readFileSync(path.join(repoRoot, 'docs', 'core', 'file-format.md'), 'utf8');
  const agentGuide = fs.readFileSync(path.join(repoRoot, 'docs', '15-minute-agent-guide.md'), 'utf8');
  const statusMatrix = fs.readFileSync(path.join(repoRoot, 'docs', 'tool-status-matrix.md'), 'utf8');
  const changelog = fs.readFileSync(
    path.join(repoRoot, 'packages', 'kdna-core', 'CHANGELOG.md'),
    'utf8',
  );
  const containerSource = fs.readFileSync(
    path.join(repoRoot, 'packages', 'kdna-core', 'src', 'container', 'index.js'),
    'utf8',
  );
  const packScript = fs.readFileSync(path.join(repoRoot, 'scripts', 'pack-asset.mjs'), 'utf8');
  for (const text of [formatDoc, agentGuide, changelog, containerSource, packScript]) {
    assert.match(text, /pinned (?:packer )?toolchain/u);
    assert.match(text, /DEFLATE/u);
  }
  for (const text of [formatDoc, containerSource]) {
    assert.match(text, /entry_set_digest/u);
    assert.match(text, /source_fingerprint/u);
    assert.match(text, /exact immutable (?:package\s+)?bytes/u);
  }
  const publicClaims = [
    formatDoc,
    agentGuide,
    statusMatrix,
    changelog,
    containerSource,
    packScript,
  ].join('\n');
  assert.doesNotMatch(publicClaims, /Equal logical entries produce equal package bytes/u);
  assert.doesNotMatch(publicClaims, /same input → same SHA-256/u);
  assert.doesNotMatch(publicClaims, /Same source → byte-identical output/u);
  assert.doesNotMatch(
    publicClaims,
    /Packing the same source directory\s+twice produces byte-identical output/u,
  );
  assert.doesNotMatch(publicClaims, /Deterministic ZIP pack/u);
  assert.doesNotMatch(publicClaims, /same source directory packed twice produces\s+\* byte-identical output/u);
});

test('bad-checksum fixture has one current-contract digest failure and no structural failures', () => {
  const fixture = path.join(repoRoot, 'fixtures', 'container', 'invalid-bad-checksum');
  const manifest = JSON.parse(fs.readFileSync(path.join(fixture, 'kdna.json'), 'utf8'));
  const payloadPath = path.join(fixture, 'payload.kdnab');
  const payload = cbor.decode(fs.readFileSync(payloadPath));
  const checksums = JSON.parse(fs.readFileSync(path.join(fixture, 'checksums.json'), 'utf8'));

  assert.equal(manifest.format_version, '0.1.0');
  assert.equal(manifest.compatibility.profile, 'kdna.payload.judgment');
  assert.equal(manifest.compatibility.profile_version, '0.1.0');
  assert.equal(payload.profile, 'kdna.payload.judgment');
  assert.equal(payload.profile_version, '0.1.0');

  const declared = checksums.payload_digest.replace(/^sha256:/u, '');
  const actual = sha256(payloadPath);
  const expectedProblem = `checksums: payload_digest mismatch (declared ${declared.slice(0, 8)}..., actual ${actual.slice(0, 8)}...)`;
  const validation = container.validate(fixture);
  assert.deepEqual(validationChecks(validation), {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: false,
    load_contract_valid: true,
    overall_valid: false,
  });
  assert.deepEqual(validation.problems, [expectedProblem]);

  const plan = container.planLoad(fixture);
  assert.deepEqual(plan.checks, validationChecks(validation));
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_INTEGRITY_DIGEST_FAILED',
      severity: 'blocking',
      message: expectedProblem,
    },
  ]);
});

test('missing-manifest fixture carries an independently valid current payload', (t) => {
  const fixture = path.join(repoRoot, 'fixtures', 'container', 'invalid-missing-manifest');
  const payloadPath = path.join(fixture, 'payload.kdnab');
  const payload = cbor.decode(fs.readFileSync(payloadPath));
  assert.equal(payload.profile, 'kdna.payload.judgment');
  assert.equal(payload.profile_version, '0.1.0');

  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-missing-manifest-payload-'));
  t.after(() => fs.rmSync(source, { recursive: true, force: true }));
  for (const entry of ['mimetype', 'kdna.json']) {
    fs.copyFileSync(path.join(repoRoot, 'examples', 'minimal', entry), path.join(source, entry));
  }
  fs.copyFileSync(payloadPath, path.join(source, 'payload.kdnab'));
  fs.writeFileSync(
    path.join(source, 'checksums.json'),
    `${JSON.stringify(container.buildChecksums(source), null, 2)}\n`,
  );
  const payloadValidation = container.validate(source);
  assert.deepEqual(validationChecks(payloadValidation), {
    format_valid: true,
    schema_valid: true,
    payload_valid: true,
    checksums_valid: true,
    load_contract_valid: true,
    overall_valid: true,
  });
  assert.deepEqual(payloadValidation.problems, []);

  assert.throws(
    () => container.validate(fixture),
    (error) => error.message === 'not a KDNA authoring source directory: missing kdna.json',
  );
  const plan = container.planLoad(fixture);
  assert.deepEqual(plan.issues, [
    {
      code: 'KDNA_FORMAT_INVALID',
      severity: 'blocking',
      message: `Source directory missing required entries: ${fixture}`,
    },
  ]);
});

test('container fixture generator is byte-stable and preserves each negative intent', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-container-fixtures-'));
  const alternateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-container-platform-'));
  t.after(() => {
    fs.rmSync(root, { force: true, recursive: true });
    fs.rmSync(alternateRoot, { force: true, recursive: true });
  });
  prepareFixtureRoot(root);
  prepareFixtureRoot(alternateRoot);
  changeTreeMetadata(alternateRoot);

  const run = () =>
    spawnSync(process.execPath, [generator, '--root', root], {
      encoding: 'utf8',
    });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  const firstHashes = generatedHashes(root);
  assert.deepEqual(firstHashes, generatedHashes(repoRoot));
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(generatedHashes(root), firstHashes);

  const platformSimulation = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `process.umask(0o077); const { generateContainerFixtures } = await import(${JSON.stringify(pathToFileURL(generator).href)}); await generateContainerFixtures(${JSON.stringify(alternateRoot)});`,
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, TZ: 'Pacific/Kiritimati' },
    },
  );
  assert.equal(platformSimulation.status, 0, platformSimulation.stderr);
  assert.deepEqual(generatedHashes(alternateRoot), firstHashes);

  const badRoot = path.join(root, 'fixtures', 'container', 'invalid-bad-checksum');
  const badChecksums = JSON.parse(fs.readFileSync(path.join(badRoot, 'checksums.json'), 'utf8'));
  assert.notEqual(
    badChecksums.payload_digest,
    `sha256:${sha256(path.join(badRoot, 'payload.kdnab'))}`,
  );
  assert.equal(
    fs.existsSync(
      path.join(root, 'fixtures', 'container', 'invalid-missing-manifest', 'kdna.json'),
    ),
    false,
  );
});
