'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const zlib = require('node:zlib');

const { validateCurrentReleaseBinding } = require('../scripts/current-release-binding');
const {
  AUDITED_NPM_VERSION,
  OFFICIAL_REGISTRY,
  REGISTRY_TIMEOUT_MS,
  assertAuditedNpmResult,
} = require('../scripts/npm-tooling');
const { publishArguments, publishCandidate } = require('../scripts/publish-verified-artifact');
const { guardCandidate } = require('../scripts/check-publish-duplicate');
const { assertOutsideRepository } = require('../scripts/prepare-release-artifact');
const { evaluateRegistryResult, expectedE404 } = require('../scripts/registry-duplicate-policy');
const {
  EXPECTED_FILES,
  parseTarFiles,
  validateEvidenceArtifact,
  validatePackReport,
  validateReleaseEvidence,
} = require('../scripts/release-evidence');
const { validateReleaseContext } = require('../scripts/release-policy');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const HASH = 'a'.repeat(40);
const OTHER_HASH = 'c'.repeat(40);
const CHECKOUT_V7_SHA = '9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0';
const SETUP_NODE_V6_SHA = '249970729cb0ef3589644e2896645e5dc5ba9c38';
const UPLOAD_V4_SHA = 'ea165f8d65b6e75b540449e92b4886f43607fa02';

function releaseInput(overrides = {}) {
  const version = overrides.pkg?.version || '1.2.3';
  return {
    pkg: { name: '@aikdna/kdna', version, ...overrides.pkg },
    changelog: overrides.changelog ?? `# Changelog\n\n## ${version} (2026-07-15)\n`,
    env: {
      GITHUB_EVENT_NAME: 'release',
      RELEASE_EVENT_ACTION: 'published',
      RELEASE_TAG_NAME: `kdna-v${version}`,
      RELEASE_IS_DRAFT: 'false',
      RELEASE_IS_PRERELEASE: 'false',
      GITHUB_REF: `refs/tags/kdna-v${version}`,
      GITHUB_SHA: HASH,
      ...overrides.env,
    },
    git: {
      status: '',
      head: HASH,
      tagCommit: HASH,
      ...overrides.git,
    },
  };
}

function evidence(overrides = {}) {
  const files = EXPECTED_FILES.map((filePath, index) => ({ path: filePath, size: index + 1 }));
  const unpackedSize = files.reduce((total, file) => total + file.size, 0);
  const base = {
    schema: 'kdna.compat.release-evidence',
    version: '1.0',
    source: { ref: 'refs/tags/kdna-v1.2.3', commit: HASH },
    package: { name: '@aikdna/kdna', version: '1.2.3' },
    artifact: {
      filename: 'aikdna-kdna-1.2.3.tgz',
      integrity: `sha512-${Buffer.alloc(64).toString('base64')}`,
      shasum: 'b'.repeat(40),
      packed_size: 100,
      unpacked_size: unpackedSize,
      file_count: files.length,
      files,
    },
  };
  return {
    ...base,
    ...overrides,
    source: { ...base.source, ...overrides.source },
    package: { ...base.package, ...overrides.package },
    artifact: { ...base.artifact, ...overrides.artifact },
  };
}

function registryMetadata(candidate = evidence(), overrides = {}) {
  return JSON.stringify({
    name: candidate.package.name,
    version: candidate.package.version,
    'dist.integrity': candidate.artifact.integrity,
    'dist.shasum': candidate.artifact.shasum,
    ...overrides,
  });
}

function e404Result(candidate = evidence()) {
  const expected = expectedE404(candidate);
  return {
    status: 1,
    stdout: JSON.stringify({ error: { code: 'E404', ...expected } }),
    stderr: '',
  };
}

function packFixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-pack-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const packed = spawnSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', '--pack-destination', temp],
    {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      shell: false,
      timeout: REGISTRY_TIMEOUT_MS,
    },
  );
  assert.equal(packed.error, undefined);
  assert.equal(packed.status, 0, packed.stderr);
  assert.equal(packed.stderr, '');
  const report = JSON.parse(packed.stdout)[0];
  const tarball = fs.readFileSync(path.join(temp, report.filename));
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const candidate = validatePackReport({
    reportText: packed.stdout,
    tarball,
    pkg,
    source: { ref: `refs/tags/kdna-v${pkg.version}`, commit: HASH },
  });
  return { candidate, packed, pkg, tarball };
}

function regularHeaderOffsets(archive) {
  const offsets = [];
  let offset = 0;
  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/u, '').trim();
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    const type = header[156] || 0x30;
    if (type === 0x30 || type === 0) offsets.push(offset);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return offsets;
}

function rewriteHeaderPath(archive, offset, name) {
  const changed = Buffer.from(archive);
  const header = changed.subarray(offset, offset + 512);
  const encoded = Buffer.from(name, 'utf8');
  assert.ok(encoded.length <= 100);
  header.fill(0, 0, 100);
  encoded.copy(header, 0);
  header.fill(0, 345, 500);
  header.fill(0x20, 148, 156);
  let checksum = 0;
  for (const byte of header) checksum += byte;
  Buffer.from(`${checksum.toString(8).padStart(6, '0')}\0 `, 'ascii').copy(header, 148);
  return changed;
}

function headerPath(archive, offset) {
  const header = archive.subarray(offset, offset + 512);
  const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/u, '');
  const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/u, '');
  return prefix ? `${prefix}/${name}` : name;
}

test('publish workflow is release-only, stable-only, immutable, and serializes each tag', () => {
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'publish.yml'), 'utf8');
  assert.doesNotMatch(workflow, /workflow_dispatch|github\.event\.inputs/u);
  assert.match(workflow, /release:\n\s+types: \[published\]/u);
  assert.match(
    workflow,
    /concurrency:\n\s+group: \$\{\{ github\.workflow \}\}-\$\{\{ github\.event\.release\.tag_name \}\}\n\s+cancel-in-progress: false/u,
  );

  for (const [job, next] of [
    ['publish-core', 'publish-eval'],
    ['publish-eval', 'publish-compat'],
    ['publish-compat', 'publish-agent'],
    ['publish-agent', null],
  ]) {
    const start = workflow.indexOf(`  ${job}:`);
    const end = next ? workflow.indexOf(`\n  ${next}:`, start) : workflow.length;
    assert.ok(start >= 0 && end > start, `${job} is missing`);
    const body = workflow.slice(start, end);
    assert.match(body, /github\.event_name == 'release'/u);
    assert.match(body, /github\.event\.action == 'published'/u);
    assert.match(body, /github\.event\.release\.draft == false/u);
    assert.match(body, /github\.event\.release\.prerelease == false/u);
  }

  const immutableActions = [...workflow.matchAll(/uses: actions\/(?:checkout|setup-node|upload-artifact)@([^\s]+)/gu)];
  assert.ok(immutableActions.length > 0);
  for (const match of immutableActions) assert.match(match[1], /^[0-9a-f]{40}$/u);
  assert.match(workflow, new RegExp(`actions/checkout@${CHECKOUT_V7_SHA} # v7`, 'u'));
  assert.match(workflow, new RegExp(`actions/setup-node@${SETUP_NODE_V6_SHA} # v6`, 'u'));
  assert.match(workflow, new RegExp(`actions/upload-artifact@${UPLOAD_V4_SHA} # v4`, 'u'));
});

test('compatibility workflow fixes every live checkout and publishes only the rebound exact tarball', () => {
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'publish.yml'), 'utf8');
  const start = workflow.indexOf('  publish-compat:');
  const end = workflow.indexOf('\n  publish-agent:', start);
  const job = workflow.slice(start, end);
  for (const [repository, commit] of [
    ['aikdna/kdna-cli', 'dcc5f70df4cbb0460ef27222d5c1e6fa3e632888'],
    ['aikdna/kdna-skills', '76ce82a001fc363d93581cd3d0e54c7c31de0c26'],
    ['aikdna/kdna-studio-core', 'ee65a8896a77c0f2c797a0d85e04be1fc5aacbd6'],
    ['aikdna/kdna-studio-cli', '66545bf2b51b93433e5233fed9a5b93c6a366bfe'],
    ['aikdna/kdna-core-swift', 'b1f7f1a7cba5459413f00ecc0302f71e0d21ef78'],
    ['aikdna/kdna-vscode', 'c0d885ba8222b6dccad87ec67f7d82fcc1283107'],
    ['aikdna/kdna-activation-server', '9ba3c71b50dc282f24f1fb455a0e79019d36458f'],
    ['aikdna/kdna-remote-server', '2e97c860e4eab1797ec19e304fd771b51454009d'],
    ['aikdna/kdna-web-server', 'e99bf65ec95101a2bc9a7bed1e85f597db001486'],
    ['aikdna/kdna-web-client', 'ad27c702c29b0780dce89dfa5e3665d69fca179d'],
    ['aikdna/kdna-react', 'b012419be197a5f3ce8d1e4b13cf9552cadef069'],
    ['aikdna/create-kdna-web-app', '33b3b4c2b7934eff27f5c4fd3bc30c5498642127'],
  ]) {
    assert.match(job, new RegExp(`repository: ${repository.replace('/', '\\/')}\\n\\s+ref: ${commit}`, 'u'));
  }
  assert.match(job, /ref: \$\{\{ github\.event\.release\.tag_name \}\}/u);
  assert.match(
    job,
    /npm install --global npm@11\.17\.0 --ignore-scripts --registry=https:\/\/registry\.npmjs\.org\//u,
  );
  assert.match(job, /npm --version \| grep -Fx 11\.17\.0/u);
  assert.match(job, /npm ci --ignore-scripts/u);

  const releaseCheck = job.indexOf('run release:check');
  const ecosystemGate = job.indexOf('npm run ecosystem-gate');
  const pack = job.indexOf('run release:pack');
  const smoke = job.indexOf('run release:smoke');
  const guard = job.indexOf('run publish:guard');
  const publish = job.indexOf('run publish:verified');
  assert.ok(releaseCheck >= 0 && releaseCheck < ecosystemGate);
  assert.ok(ecosystemGate < pack && pack < smoke && smoke < guard && guard < publish);
  assert.equal((job.match(/\$RUNNER_TEMP\/kdna-compat-release\.tgz/gu) || []).length, 5);
  assert.doesNotMatch(job, /run:\s+npm publish\b/u);
  assert.match(job, /if: steps\.registry\.outputs\.should_publish == 'true'/u);
  assert.match(job, /if: always\(\)/u);
});

test('release context binds event, stable tag, package, changelog, HEAD, and workflow commit', () => {
  assert.deepEqual(validateReleaseContext(releaseInput()), {
    name: '@aikdna/kdna',
    version: '1.2.3',
    tag: 'kdna-v1.2.3',
    ref: 'refs/tags/kdna-v1.2.3',
    commit: HASH,
  });
});

test('release context rejects every ambiguous or mutable release input', async (t) => {
  const cases = [
    ['renamed package', releaseInput({ pkg: { name: '@other/name' } })],
    ['prerelease version', releaseInput({ pkg: { version: '1.2.3-rc.1' } })],
    ['noncanonical version', releaseInput({ pkg: { version: '01.2.3' } })],
    ['wrong event', releaseInput({ env: { GITHUB_EVENT_NAME: 'workflow_dispatch' } })],
    ['wrong action', releaseInput({ env: { RELEASE_EVENT_ACTION: 'created' } })],
    ['wrong event tag', releaseInput({ env: { RELEASE_TAG_NAME: 'kdna-v9.9.9' } })],
    ['draft', releaseInput({ env: { RELEASE_IS_DRAFT: 'true' } })],
    ['prerelease', releaseInput({ env: { RELEASE_IS_PRERELEASE: 'true' } })],
    ['branch ref', releaseInput({ env: { GITHUB_REF: 'refs/heads/main' } })],
    ['short workflow sha', releaseInput({ env: { GITHUB_SHA: HASH.slice(0, 12) } })],
    ['dirty tree', releaseInput({ git: { status: '?? artifact.tgz' } })],
    ['tag differs from head', releaseInput({ git: { tagCommit: OTHER_HASH } })],
    ['workflow sha differs from head', releaseInput({ env: { GITHUB_SHA: OTHER_HASH } })],
    ['substring changelog', releaseInput({ changelog: '# Changelog\n\nnotes for 1.2.3 only\n' })],
    ['prefix heading', releaseInput({ changelog: '# Changelog\n\n## 1.2.30\n' })],
    [
      'duplicate heading',
      releaseInput({ changelog: '# Changelog\n\n## 1.2.3\n\n## 1.2.3 (2026-07-15)\n' }),
    ],
    [
      'not first finalized heading',
      releaseInput({ changelog: '# Changelog\n\n## 1.2.2\n\n## 1.2.3\n' }),
    ],
  ];
  for (const [name, input] of cases) {
    await t.test(name, () => assert.throws(() => validateReleaseContext(input)));
  }
});

test('current release binding rejects stale evidence before lookup or publication', async (t) => {
  const valid = releaseInput();
  const matching = evidence();
  assert.equal(validateCurrentReleaseBinding({ evidence: matching, ...valid }), matching);
  const cases = [
    ['evidence name', evidence({ package: { name: '@other/name' } }), valid],
    ['evidence version', evidence({ package: { version: '1.2.4' } }), valid],
    ['evidence ref', evidence({ source: { ref: 'refs/tags/kdna-v9.9.9' } }), valid],
    ['evidence commit', evidence({ source: { commit: OTHER_HASH } }), valid],
    ['current package', matching, releaseInput({ pkg: { version: '1.2.4' } })],
    ['current ref', matching, releaseInput({ env: { GITHUB_REF: 'refs/tags/kdna-v9.9.9' } })],
    ['current sha', matching, releaseInput({ env: { GITHUB_SHA: OTHER_HASH } })],
    ['current head', matching, releaseInput({ git: { head: OTHER_HASH } })],
    ['current tag', matching, releaseInput({ git: { tagCommit: OTHER_HASH } })],
    ['current dirty tree', matching, releaseInput({ git: { status: ' M package.json' } })],
  ];
  for (const [name, candidate, current] of cases) {
    await t.test(name, () =>
      assert.throws(() => validateCurrentReleaseBinding({ evidence: candidate, ...current })),
    );
  }

  let lookupCalls = 0;
  let publishCalls = 0;
  const stale = () => {
    throw new Error('stale binding');
  };
  assert.throws(() =>
    guardCandidate({
      evidence: matching,
      tarball: Buffer.from('not reached'),
      bindCurrent: stale,
      lookup: () => {
        lookupCalls += 1;
      },
    }),
  );
  assert.throws(() =>
    publishCandidate({
      evidence: matching,
      tarball: Buffer.from('not reached'),
      artifactPath: '/tmp/not-reached.tgz',
      bindCurrent: stale,
      publish: () => {
        publishCalls += 1;
      },
    }),
  );
  assert.equal(lookupCalls, 0);
  assert.equal(publishCalls, 0);
});

test('release evidence recomputes hashes, files, counts, and sizes from the tarball', (t) => {
  const { candidate, packed, pkg, tarball } = packFixture(t);
  assert.deepEqual(candidate.artifact.files.map((file) => file.path), EXPECTED_FILES);
  assert.equal(candidate.artifact.shasum, crypto.createHash('sha1').update(tarball).digest('hex'));
  assert.equal(candidate.artifact.packed_size, tarball.length);
  assert.equal(candidate.artifact.file_count, EXPECTED_FILES.length);
  assert.equal(validateReleaseEvidence(candidate), candidate);
  assert.equal(validateEvidenceArtifact(candidate, tarball), candidate);

  const tamperedReport = JSON.parse(packed.stdout);
  tamperedReport[0].integrity = `sha512-${Buffer.alloc(64, 1).toString('base64')}`;
  assert.throws(
    () =>
      validatePackReport({
        reportText: JSON.stringify(tamperedReport),
        tarball,
        pkg,
        source: { ref: `refs/tags/kdna-v${pkg.version}`, commit: HASH },
      }),
    /integrity/u,
  );
  const tamperedBytes = Buffer.from(tarball);
  tamperedBytes[tamperedBytes.length - 1] ^= 1;
  assert.throws(() => validateEvidenceArtifact(candidate, tamperedBytes), /shasum|integrity|tar/iu);
});

test('independent tar parser rejects checksum, truncation, trailing bytes, unsafe paths, and duplicates', (t) => {
  const { tarball } = packFixture(t);
  const archive = zlib.gunzipSync(tarball);
  const offsets = regularHeaderOffsets(archive);
  assert.ok(offsets.length >= 2);

  const badChecksum = Buffer.from(archive);
  badChecksum[offsets[0]] ^= 1;
  assert.throws(() => parseTarFiles(zlib.gzipSync(badChecksum)), /checksum/u);

  let lastNonZero = archive.length - 1;
  while (lastNonZero >= 0 && archive[lastNonZero] === 0) lastNonZero -= 1;
  const truncated = archive.subarray(0, Math.ceil((lastNonZero + 1) / 512) * 512);
  assert.throws(() => parseTarFiles(zlib.gzipSync(truncated)), /terminator/u);

  const trailing = Buffer.from(archive);
  trailing[trailing.length - 1] = 1;
  assert.throws(() => parseTarFiles(zlib.gzipSync(trailing)), /terminator|trailing/u);

  const unsafe = rewriteHeaderPath(archive, offsets[0], 'package/../escape');
  assert.throws(() => parseTarFiles(zlib.gzipSync(unsafe)), /unsafe packed path/u);

  const firstPath = headerPath(archive, offsets[0]);
  const duplicate = rewriteHeaderPath(archive, offsets[1], firstPath);
  assert.throws(() => parseTarFiles(zlib.gzipSync(duplicate)), /duplicate file paths/u);
});

test('release evidence rejects forged schema, identity, filename, fields, hashes, counts, and sizes', async (t) => {
  const base = evidence();
  const files = base.artifact.files;
  const cases = [
    ['extra top-level field', { ...base, injected: true }],
    ['name', evidence({ package: { name: '@other/name' } })],
    ['version', evidence({ package: { version: '1.2.3-rc.1' } })],
    ['ref', evidence({ source: { ref: 'refs/heads/main' } })],
    ['commit', evidence({ source: { commit: 'abc' } })],
    ['filename', evidence({ artifact: { filename: '../forged.tgz' } })],
    ['integrity', evidence({ artifact: { integrity: 'sha512-no' } })],
    ['shasum', evidence({ artifact: { shasum: 'B'.repeat(40) } })],
    ['packed size', evidence({ artifact: { packed_size: 0 } })],
    ['unpacked size', evidence({ artifact: { unpacked_size: -1 } })],
    ['file count', evidence({ artifact: { file_count: 2 } })],
    [
      'file allowlist',
      evidence({ artifact: { files: files.map((file, index) => index === 0 ? { ...file, path: 'evil' } : file) } }),
    ],
    ['file size total', evidence({ artifact: { unpacked_size: base.artifact.unpacked_size + 1 } })],
    ['extra artifact field', evidence({ artifact: { injected: true } })],
  ];
  for (const [name, candidate] of cases) {
    await t.test(name, () => assert.throws(() => validateReleaseEvidence(candidate)));
  }
});

test('only an exact target-bound npm 11.17 E404 with empty stderr permits publication', () => {
  assert.deepEqual(evaluateRegistryResult(e404Result(), evidence()), {
    decision: 'publish',
    shouldPublish: true,
  });
});

test('registry absence rejects auth, outage, timeout, ambiguity, injection, and noninteger status', async (t) => {
  const candidate = evidence();
  const base = e404Result(candidate);
  const wrongVersion = JSON.parse(base.stdout);
  wrongVersion.error.summary = 'No match found for version 9.9.9';
  const wrongTarget = JSON.parse(base.stdout);
  wrongTarget.error.detail = wrongTarget.error.detail.replace(
    '@aikdna/kdna@1.2.3',
    '@aikdna/kdna@9.9.9',
  );
  const extra = JSON.parse(base.stdout);
  extra.error.retryable = true;
  const cases = [
    ['prefix', { ...base, stdout: `notice\n${base.stdout}` }],
    ['suffix', { ...base, stdout: `${base.stdout}\nnotice` }],
    ['malformed', { ...base, stdout: '{"error":' }],
    ['wrong version', { ...base, stdout: JSON.stringify(wrongVersion) }],
    ['wrong target', { ...base, stdout: JSON.stringify(wrongTarget) }],
    ['extra field', { ...base, stdout: JSON.stringify(extra) }],
    ['E401 stderr', { ...base, stderr: 'npm error code E401\n' }],
    ['E403 stderr', { ...base, stderr: 'npm error code E403\n' }],
    ['timeout text', { ...base, stderr: 'request timeout\n' }],
    ['wrong exit', { status: 2, stdout: '', stderr: 'network unavailable' }],
    ['null status', { status: null, stdout: '', stderr: '' }],
    ['string status', { status: '1', stdout: base.stdout, stderr: '' }],
    ['timeout error', { status: null, stdout: '', stderr: '', error: new Error('ETIMEDOUT') }],
    [
      'structured E401',
      {
        status: 1,
        stdout: JSON.stringify({ error: { code: 'E401', summary: 'auth', detail: 'auth' } }),
        stderr: '',
      },
    ],
  ];
  for (const [name, result] of cases) {
    await t.test(name, () => assert.throws(() => evaluateRegistryResult(result, candidate)));
  }
});

test('existing registry metadata skips only one exact package/version/artifact identity', async (t) => {
  const candidate = evidence();
  assert.deepEqual(
    evaluateRegistryResult(
      { status: 0, stdout: registryMetadata(candidate), stderr: '' },
      candidate,
    ),
    { decision: 'skip-identical', shouldPublish: false },
  );
  for (const [name, changes] of [
    ['name', { name: '@other/name' }],
    ['version', { version: '1.2.4' }],
    ['integrity', { 'dist.integrity': `sha512-${Buffer.alloc(64, 1).toString('base64')}` }],
    ['shasum', { 'dist.shasum': 'c'.repeat(40) }],
    ['extra metadata', { injected: true }],
  ]) {
    await t.test(name, () =>
      assert.throws(() =>
        evaluateRegistryResult(
          { status: 0, stdout: registryMetadata(candidate, changes), stderr: '' },
          candidate,
        ),
      ),
    );
  }
  assert.throws(() =>
    evaluateRegistryResult(
      { status: 0, stdout: registryMetadata(candidate), stderr: 'npm warning injected\n' },
      candidate,
    ),
  );
  assert.throws(() =>
    evaluateRegistryResult(
      { status: 0, stdout: `${registryMetadata(candidate)}\ntrailing`, stderr: '' },
      candidate,
    ),
  );
});

test('audited npm verification rejects errors, stderr, drift, and noninteger statuses', async (t) => {
  assert.equal(
    assertAuditedNpmResult({ status: 0, stdout: `${AUDITED_NPM_VERSION}\n`, stderr: '' }),
    AUDITED_NPM_VERSION,
  );
  for (const [name, result] of [
    ['error', { status: null, stdout: '', stderr: '', error: new Error('ETIMEDOUT') }],
    ['null status', { status: null, stdout: AUDITED_NPM_VERSION, stderr: '' }],
    ['string status', { status: '0', stdout: AUDITED_NPM_VERSION, stderr: '' }],
    ['nonzero status', { status: 1, stdout: AUDITED_NPM_VERSION, stderr: '' }],
    ['stderr', { status: 0, stdout: AUDITED_NPM_VERSION, stderr: 'warning' }],
    ['version drift', { status: 0, stdout: '11.16.0\n', stderr: '' }],
  ]) {
    await t.test(name, () => assert.throws(() => assertAuditedNpmResult(result)));
  }
});

test('guard and publisher reparse one exact tarball before the network operation', (t) => {
  const { candidate, tarball } = packFixture(t);
  let bound = 0;
  let lookedUp = 0;
  const decision = guardCandidate({
    evidence: candidate,
    tarball,
    bindCurrent: (observed) => {
      assert.equal(observed, candidate);
      bound += 1;
    },
    lookup: (spec) => {
      assert.equal(spec, '@aikdna/kdna@0.13.0');
      lookedUp += 1;
      return e404Result(candidate);
    },
  });
  assert.deepEqual(decision, { decision: 'publish', shouldPublish: true });
  assert.equal(bound, 1);
  assert.equal(lookedUp, 1);

  let published = 0;
  const result = publishCandidate({
    evidence: candidate,
    tarball,
    artifactPath: '/tmp/exact-kdna-compat.tgz',
    bindCurrent: () => {
      bound += 1;
    },
    publish: (args) => {
      assert.deepEqual(args, publishArguments('/tmp/exact-kdna-compat.tgz'));
      published += 1;
      return { status: 0 };
    },
  });
  assert.equal(result.status, 0);
  assert.equal(bound, 2);
  assert.equal(published, 1);
});

test('publisher pins scripts, provenance, access, registry, and the network timeout', () => {
  assert.deepEqual(publishArguments('/tmp/exact.tgz'), [
    'publish',
    '/tmp/exact.tgz',
    '--ignore-scripts',
    '--provenance',
    '--access',
    'public',
    `--registry=${OFFICIAL_REGISTRY}`,
  ]);
  assert.equal(REGISTRY_TIMEOUT_MS, 30_000);
  for (const script of [
    'check-publish-duplicate.js',
    'publish-verified-artifact.js',
    'smoke-release-artifact.js',
  ]) {
    const source = fs.readFileSync(path.join(PACKAGE_ROOT, 'scripts', script), 'utf8');
    assert.match(source, /REGISTRY_TIMEOUT_MS/u);
    assert.match(source, /OFFICIAL_REGISTRY/u);
  }
});

test('release outputs reject repository paths reached through an outside symlink', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-release-output-path-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const link = path.join(temp, 'repository-link');
  fs.symlinkSync(REPO_ROOT, link, 'dir');
  assert.throws(
    () => assertOutsideRepository(path.join(link, 'forged-evidence.json'), 'release evidence'),
    /outside the repository/u,
  );
  assert.equal(
    assertOutsideRepository(path.join(temp, 'real-evidence.json'), 'release evidence'),
    path.join(fs.realpathSync(temp), 'real-evidence.json'),
  );
});
