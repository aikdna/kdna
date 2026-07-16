'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const zlib = require('node:zlib');

const {
  AUDITED_NPM_VERSION,
  OFFICIAL_REGISTRY,
  REPO_ROOT,
  TREE_LIMITS,
  assertIndexMatchesTree,
  cleanGitEnvironment,
  cleanNpmEnvironment,
  commitDocument,
  evaluateRegistryResult,
  expectedRegistryE404,
  guardCandidate,
  inspectTree,
  integrity,
  materializeTree,
  npmPublishArguments,
  parseIndexEntries,
  parseTarFiles,
  parseTreeEntries,
  publishCandidate,
  sha1,
  sha256,
  validateEvidenceArtifact,
  validateReleaseContext,
  validateReleaseEvidence,
  writeGithubDecision,
} = require('./core-release-authority');

const HASH = '1234567890abcdef1234567890abcdef12345678';
const OTHER_HASH = 'abcdef1234567890abcdef1234567890abcdef12';
const TREE = 'a'.repeat(40);

function writeOctal(header, offset, length, value) {
  Buffer.from(`${value.toString(8).padStart(length - 1, '0')}\0`, 'ascii').copy(header, offset);
}

function tarballFixture({
  filePath = 'package/package.json',
  bytes = Buffer.from('{}\n'),
  mode = 0o644,
  type = '0',
} = {}) {
  const header = Buffer.alloc(512);
  Buffer.from(filePath, 'utf8').copy(header, 0);
  writeOctal(header, 100, 8, mode);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, bytes.length);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header[156] = type.charCodeAt(0);
  Buffer.from('ustar\0', 'ascii').copy(header, 257);
  Buffer.from('00', 'ascii').copy(header, 263);
  let checksum = 0;
  for (const byte of header) checksum += byte;
  Buffer.from(`${checksum.toString(8).padStart(6, '0')}\0 `, 'ascii').copy(header, 148);
  const padding = Buffer.alloc(Math.ceil(bytes.length / 512) * 512 - bytes.length);
  return zlib.gzipSync(Buffer.concat([header, bytes, padding, Buffer.alloc(1024)]), { mtime: 0 });
}

function releaseContext(overrides = {}) {
  const pkg = { name: '@aikdna/kdna-core', version: '1.2.3', ...overrides.pkg };
  return {
    pkg,
    changelog:
      overrides.changelog || '# Changelog\n\n## Unreleased\n\n## 1.2.3 (2026-07-16)\n\n## 1.2.2\n',
    env: {
      GITHUB_EVENT_NAME: 'release',
      RELEASE_EVENT_ACTION: 'published',
      RELEASE_TAG_NAME: '1.2.3',
      RELEASE_IS_DRAFT: 'false',
      RELEASE_IS_PRERELEASE: 'false',
      GITHUB_REF: 'refs/tags/1.2.3',
      GITHUB_REF_TYPE: 'tag',
      GITHUB_REF_NAME: '1.2.3',
      GITHUB_SHA: HASH,
      ...overrides.env,
    },
    git: {
      status: '',
      head: HASH,
      tagCommit: HASH,
      tree: TREE,
      commitTree: TREE,
      signoffs: ['Aikdna <release@example.com>'],
      ...overrides.git,
    },
  };
}

function evidenceFixture(overrides = {}) {
  const version = overrides.version || '1.2.3';
  const tarball = overrides.tarball || tarballFixture();
  const files = parseTarFiles(tarball);
  const artifact = {
    filename: `aikdna-kdna-core-${version}.tgz`,
    integrity: integrity(tarball),
    shasum: sha1(tarball),
    sha256: sha256(tarball),
    packed_size: tarball.length,
    unpacked_size: files.reduce((sum, file) => sum + file.size, 0),
    file_count: files.length,
    files,
    ...overrides.artifact,
  };
  const evidence = {
    schema: 'kdna.core.release-evidence',
    schema_version: '1.0.0',
    source: {
      repository: 'aikdna/kdna',
      ref: `refs/tags/${version}`,
      tag: version,
      commit: HASH,
      tree: TREE,
      dco_signoff_count: 1,
      tracked_file_count: 10,
      tracked_bytes: 1000,
      materialization: 'git-cat-file-blobs',
      ...overrides.source,
    },
    package: {
      name: '@aikdna/kdna-core',
      version,
      directory: 'packages/kdna-core',
      ...overrides.package,
    },
    tooling: {
      git: 'git version 2.50.1',
      npm: AUDITED_NPM_VERSION,
      node: 'v26.4.0',
      platform: 'darwin',
      arch: 'arm64',
      ...overrides.tooling,
    },
    gates: {
      release_readiness: true,
      pack_content: true,
      public_surface: true,
      naming: true,
      ...overrides.gates,
    },
    reproducibility: {
      isolated_exact_commit_sources: 2,
      npm_pack_ignore_scripts: true,
      same_platform_byte_equal: true,
      first_sha256: artifact.sha256,
      second_sha256: artifact.sha256,
      ...overrides.reproducibility,
    },
    artifact,
    ...overrides.top,
  };
  return { evidence, tarball };
}

function e404Result(evidence) {
  const expected = expectedRegistryE404(evidence);
  return {
    status: 1,
    stdout: JSON.stringify({ error: { code: 'E404', ...expected } }),
    stderr: '',
  };
}

function registryMetadata(evidence, overrides = {}) {
  return JSON.stringify({
    name: evidence.package.name,
    version: evidence.package.version,
    'dist.integrity': evidence.artifact.integrity,
    'dist.shasum': evidence.artifact.shasum,
    ...overrides,
  });
}

function treeRecord({
  mode = '100644',
  type = 'blob',
  object = 'b'.repeat(40),
  size = '1',
  filePath = Buffer.from('safe.txt'),
} = {}) {
  return Buffer.concat([
    Buffer.from(`${mode} ${type} ${object}  ${size}\t`, 'ascii'),
    filePath,
    Buffer.from([0]),
  ]);
}

test('release context accepts only one exact natural SemVer tag binding', () => {
  assert.deepEqual(validateReleaseContext(releaseContext()), {
    name: '@aikdna/kdna-core',
    version: '1.2.3',
    tag: '1.2.3',
    ref: 'refs/tags/1.2.3',
    commit: HASH,
    tree: TREE,
    signoffs: ['Aikdna <release@example.com>'],
  });
});

test('release context rejects prefixed, prerelease, mutable, unsigned, dirty, or stale inputs', async (t) => {
  const cases = [
    ['version prefix', releaseContext({ pkg: { version: 'v1.2.3' } })],
    ['scope prefix', releaseContext({ pkg: { version: 'core/1.2.3' } })],
    ['prerelease version', releaseContext({ pkg: { version: '1.2.3-rc.1' } })],
    ['leading zero', releaseContext({ pkg: { version: '01.2.3' } })],
    ['wrong event', releaseContext({ env: { GITHUB_EVENT_NAME: 'workflow_dispatch' } })],
    ['wrong action', releaseContext({ env: { RELEASE_EVENT_ACTION: 'created' } })],
    ['wrong event tag', releaseContext({ env: { RELEASE_TAG_NAME: '1.2.30' } })],
    ['draft', releaseContext({ env: { RELEASE_IS_DRAFT: 'true' } })],
    ['prerelease event', releaseContext({ env: { RELEASE_IS_PRERELEASE: 'true' } })],
    ['branch ref', releaseContext({ env: { GITHUB_REF: 'refs/heads/main' } })],
    ['wrong ref type', releaseContext({ env: { GITHUB_REF_TYPE: 'branch' } })],
    ['short SHA', releaseContext({ env: { GITHUB_SHA: HASH.slice(0, 12) } })],
    ['dirty', releaseContext({ git: { status: '1 .M package.json' } })],
    ['tag mismatch', releaseContext({ git: { tagCommit: OTHER_HASH } })],
    ['HEAD mismatch', releaseContext({ env: { GITHUB_SHA: OTHER_HASH } })],
    ['tree mismatch', releaseContext({ git: { commitTree: OTHER_HASH } })],
    ['no DCO', releaseContext({ git: { signoffs: [] } })],
    ['substring changelog', releaseContext({ changelog: '# Changelog\n\nnotes 1.2.3\n' })],
    [
      'duplicate changelog',
      releaseContext({ changelog: '# Changelog\n\n## 1.2.3\n\n## 1.2.3 (2026-07-16)\n' }),
    ],
    ['stale changelog', releaseContext({ changelog: '# Changelog\n\n## 1.2.2\n\n## 1.2.3\n' })],
  ];
  for (const [name, input] of cases)
    await t.test(name, () => assert.throws(() => validateReleaseContext(input)));
});

test('trusted Git environment removes hostile inherited Git controls', () => {
  const environment = cleanGitEnvironment({
    PATH: '/hostile',
    GIT_DIR: '/tmp/evil',
    GIT_INDEX_FILE: '/tmp/hidden-index',
    GIT_OBJECT_DIRECTORY: '/tmp/objects',
    GIT_ALTERNATE_OBJECT_DIRECTORIES: '/tmp/alternate',
    GIT_CONFIG_GLOBAL: '/tmp/config',
    GIT_CONFIG_SYSTEM: '/tmp/system',
    GIT_CONFIG_COUNT: '9',
    GIT_REPLACE_REF_BASE: 'refs/evil',
  });
  assert.equal(environment.GIT_DIR, undefined);
  assert.equal(environment.GIT_INDEX_FILE, undefined);
  assert.equal(environment.GIT_OBJECT_DIRECTORY, undefined);
  assert.equal(environment.GIT_ALTERNATE_OBJECT_DIRECTORIES, undefined);
  assert.equal(environment.GIT_REPLACE_REF_BASE, undefined);
  assert.equal(environment.GIT_CONFIG_GLOBAL, '/dev/null');
  assert.equal(environment.GIT_CONFIG_SYSTEM, '/dev/null');
  assert.equal(environment.GIT_CONFIG_COUNT, '0');
  assert.equal(environment.GIT_NO_REPLACE_OBJECTS, '1');
  assert.equal(environment.GIT_CONFIG_NOSYSTEM, '1');
});

test('publisher npm environment uses only its isolated token indirection config', () => {
  const environment = cleanNpmEnvironment({
    npmExecutable: '/opt/audited/bin/npm',
    home: '/tmp/isolated-home',
    cache: '/tmp/isolated-cache',
    userconfig: '/tmp/isolated-publisher.npmrc',
    environment: {
      GIT_DIR: '/tmp/hostile-git-dir',
      NODE_AUTH_TOKEN: 'test-placeholder',
      NODE_OPTIONS: '--require=/tmp/hostile.js',
      npm_config_userconfig: '/tmp/hostile.npmrc',
    },
  });
  assert.equal(environment.NODE_AUTH_TOKEN, 'test-placeholder');
  assert.equal(environment.npm_config_userconfig, '/tmp/isolated-publisher.npmrc');
  assert.equal(environment.npm_config_registry, OFFICIAL_REGISTRY);
  assert.equal(environment.npm_config_ignore_scripts, 'true');
  assert.equal(environment.GIT_DIR, undefined);
  assert.equal(environment.NODE_OPTIONS, '');
});

test('tree parser accepts only bounded regular canonical UTF-8 blobs', async (t) => {
  assert.deepEqual(parseTreeEntries(treeRecord()), [
    { path: 'safe.txt', mode: '100644', object: 'b'.repeat(40), size: 1 },
  ]);
  const cases = [
    ['symlink', treeRecord({ mode: '120000' })],
    ['gitlink', treeRecord({ mode: '160000', type: 'commit', size: '-' })],
    ['invalid mode', treeRecord({ mode: '100664' })],
    ['invalid UTF-8', treeRecord({ filePath: Buffer.from([0xff]) })],
    ['dot path', treeRecord({ filePath: Buffer.from('a/../b') })],
    ['backslash', treeRecord({ filePath: Buffer.from('a\\b') })],
    ['hidden Git', treeRecord({ filePath: Buffer.from('a/.GiT/config') })],
    ['control', treeRecord({ filePath: Buffer.from('a\nb') })],
  ];
  for (const [name, raw] of cases)
    await t.test(name, () => assert.throws(() => parseTreeEntries(raw)));
  assert.throws(() => parseTreeEntries(treeRecord(), { ...TREE_LIMITS, files: 0 }), /file-count/u);
  assert.throws(
    () => parseTreeEntries(treeRecord({ size: '2' }), { ...TREE_LIMITS, fileBytes: 1 }),
    /size/u,
  );
});

test('index parser rejects nonzero merge stages and unsafe paths', () => {
  const valid = Buffer.from(`100644 ${'c'.repeat(40)} 0\tsafe.txt\0`, 'utf8');
  assert.deepEqual(parseIndexEntries(valid), [
    { mode: '100644', object: 'c'.repeat(40), path: 'safe.txt' },
  ]);
  assert.throws(
    () => parseIndexEntries(Buffer.from(`100644 ${'c'.repeat(40)} 2\tsafe.txt\0`, 'utf8')),
    /merge stage/u,
  );
  assert.throws(
    () => parseIndexEntries(Buffer.from(`100644 ${'c'.repeat(40)} 0\t.git/index\0`, 'utf8')),
    /\.git/u,
  );
});

test('index authority rejects hidden entries and a symlinked index', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-index-authority-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (args) => {
    const result = spawnSync('/usr/bin/git', args, {
      cwd: root,
      encoding: 'utf8',
      env: cleanGitEnvironment(),
      shell: false,
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init', '--quiet']);
  git(['config', 'user.name', 'KDNA Test']);
  git(['config', 'user.email', 'test@example.invalid']);
  fs.writeFileSync(path.join(root, 'safe.txt'), 'safe\n');
  git(['add', 'safe.txt']);
  git(['commit', '--quiet', '-s', '-m', 'test: create exact tree']);
  const tree = inspectTree(git(['rev-parse', 'HEAD']), root);
  assert.doesNotThrow(() => assertIndexMatchesTree(tree, root));

  git(['update-index', '--assume-unchanged', 'safe.txt']);
  assert.throws(() => assertIndexMatchesTree(tree, root), /hidden or skip-worktree/u);
  git(['update-index', '--no-assume-unchanged', 'safe.txt']);
  git(['update-index', '--skip-worktree', 'safe.txt']);
  assert.throws(() => assertIndexMatchesTree(tree, root), /hidden or skip-worktree/u);
  git(['update-index', '--no-skip-worktree', 'safe.txt']);

  const index = path.join(root, '.git', 'index');
  fs.renameSync(index, `${index}.real`);
  fs.symlinkSync('index.real', index);
  assert.throws(() => assertIndexMatchesTree(tree, root), /real file/u);
});

test('exact commit blobs materialize without reading the mutable worktree', (t) => {
  const head = require('node:child_process')
    .execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' })
    .trim();
  const tree = inspectTree(head);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-materialize-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const source = materializeTree(tree, path.join(temp, 'source'));
  assert.deepEqual(
    fs.readFileSync(path.join(source, 'packages', 'kdna-core', 'package.json')),
    require('node:child_process').execFileSync(
      '/usr/bin/git',
      ['show', `${head}:packages/kdna-core/package.json`],
      { cwd: REPO_ROOT },
    ),
  );
  assert.equal(fs.existsSync(path.join(source, '.git')), false);
  assert.ok(commitDocument(head).signoffs.length > 0);
});

test('tar and evidence validation bind paths, modes, bytes, counts, and hashes', () => {
  const { evidence, tarball } = evidenceFixture();
  assert.equal(validateReleaseEvidence(evidence), evidence);
  assert.equal(validateEvidenceArtifact(evidence, tarball), evidence);
  const tampered = Buffer.from(tarball);
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => validateEvidenceArtifact(evidence, tampered));
  assert.throws(() => parseTarFiles(tarballFixture({ type: '2' })), /type/u);
  assert.throws(
    () => parseTarFiles(tarballFixture({ filePath: 'package/../escape' })),
    /canonical|unsafe/u,
  );
  assert.throws(
    () =>
      parseTarFiles(
        tarballFixture({ filePath: Buffer.concat([Buffer.from('package/'), Buffer.from([0xff])]) }),
      ),
    /UTF-8/u,
  );
  assert.throws(() => parseTarFiles(tarballFixture({ mode: 0o666 })), /mode/u);
});

test('evidence rejects forged fields, identity, tooling, gates, reproducibility, and artifact facts', async (t) => {
  const base = evidenceFixture();
  const cases = [
    ['extra top field', evidenceFixture({ top: { injected: true } }).evidence],
    ['package name', evidenceFixture({ package: { name: '@other/core' } }).evidence],
    ['version', evidenceFixture({ version: '1.2.3-rc.1' }).evidence],
    ['ref', evidenceFixture({ source: { ref: 'refs/heads/main' } }).evidence],
    ['DCO', evidenceFixture({ source: { dco_signoff_count: 0 } }).evidence],
    ['materialization', evidenceFixture({ source: { materialization: 'working-tree' } }).evidence],
    ['npm', evidenceFixture({ tooling: { npm: '11.16.0' } }).evidence],
    ['gate', evidenceFixture({ gates: { naming: false } }).evidence],
    [
      'one pack',
      evidenceFixture({ reproducibility: { isolated_exact_commit_sources: 1 } }).evidence,
    ],
    [
      'pack mismatch',
      evidenceFixture({ reproducibility: { second_sha256: 'f'.repeat(64) } }).evidence,
    ],
    ['filename', evidenceFixture({ artifact: { filename: '../evil.tgz' } }).evidence],
    ['size', evidenceFixture({ artifact: { packed_size: 0 } }).evidence],
    [
      'file mode',
      evidenceFixture({
        artifact: { files: base.evidence.artifact.files.map((file) => ({ ...file, mode: 0o666 })) },
      }).evidence,
    ],
  ];
  for (const [name, candidate] of cases)
    await t.test(name, () => assert.throws(() => validateReleaseEvidence(candidate)));
});

test('only an exact structured target-bound E404 permits publication', () => {
  const { evidence } = evidenceFixture();
  assert.deepEqual(evaluateRegistryResult(e404Result(evidence), evidence), {
    decision: 'publish',
    shouldPublish: true,
  });
});

test('registry absence fails closed for auth, outage, timeout, prefix, suffix, and E404 injection', async (t) => {
  const { evidence } = evidenceFixture();
  const base = e404Result(evidence);
  const wrongVersion = JSON.parse(base.stdout);
  wrongVersion.error.summary = 'No match found for version 9.9.9';
  const wrongTarget = JSON.parse(base.stdout);
  wrongTarget.error.detail = wrongTarget.error.detail.replace(
    '@aikdna/kdna-core@1.2.3',
    '@aikdna/kdna-core@9.9.9',
  );
  const cases = [
    ['prefix', { ...base, stdout: `notice\n${base.stdout}` }],
    ['suffix', { ...base, stdout: `${base.stdout}\nnotice` }],
    ['stderr auth', { ...base, stderr: 'npm error code E401\n' }],
    ['wrong version', { ...base, stdout: JSON.stringify(wrongVersion) }],
    ['wrong target', { ...base, stdout: JSON.stringify(wrongTarget) }],
    [
      'structured E401',
      {
        status: 1,
        stdout: JSON.stringify({ error: { code: 'E401', summary: 'auth', detail: 'auth' } }),
        stderr: '',
      },
    ],
    ['outage', { status: 2, stdout: '', stderr: 'network unavailable' }],
    ['timeout', { status: null, stdout: '', stderr: '', error: new Error('ETIMEDOUT') }],
    ['noninteger', { status: '1', stdout: base.stdout, stderr: '' }],
  ];
  for (const [name, result] of cases)
    await t.test(name, () => assert.throws(() => evaluateRegistryResult(result, evidence)));
});

test('existing registry version is idempotent only for exact identity and optional matching gitHead', async (t) => {
  const { evidence } = evidenceFixture();
  for (const metadata of [
    registryMetadata(evidence),
    registryMetadata(evidence, { gitHead: evidence.source.commit }),
  ]) {
    assert.deepEqual(
      evaluateRegistryResult({ status: 0, stdout: metadata, stderr: '' }, evidence),
      {
        decision: 'skip-identical',
        shouldPublish: false,
      },
    );
  }
  const collisions = [
    ['name', { name: '@other/core' }],
    ['version', { version: '1.2.4' }],
    ['integrity', { 'dist.integrity': `sha512-${Buffer.alloc(64, 1).toString('base64')}` }],
    ['shasum', { 'dist.shasum': 'f'.repeat(40) }],
    ['gitHead', { gitHead: OTHER_HASH }],
    ['extra', { injected: true }],
  ];
  for (const [name, changes] of collisions) {
    await t.test(name, () =>
      assert.throws(() =>
        evaluateRegistryResult(
          { status: 0, stdout: registryMetadata(evidence, changes), stderr: '' },
          evidence,
        ),
      ),
    );
  }
  assert.throws(() =>
    evaluateRegistryResult(
      { status: 0, stdout: registryMetadata(evidence), stderr: 'warning' },
      evidence,
    ),
  );
});

test('guard and publisher rebind, revalidate, requery, and publish only the retained tgz', () => {
  const { evidence, tarball } = evidenceFixture();
  let bindings = 0;
  let lookups = 0;
  const decision = guardCandidate({
    evidence,
    tarball,
    bindCurrent: (candidate) => {
      bindings += 1;
      return candidate;
    },
    lookup: (candidate) => {
      lookups += 1;
      return e404Result(candidate);
    },
  });
  assert.deepEqual(decision, { decision: 'publish', shouldPublish: true });
  let publishes = 0;
  const published = publishCandidate({
    evidence,
    tarball,
    artifactPath: '/tmp/aikdna-kdna-core-1.2.3.tgz',
    bindCurrent: (candidate) => {
      bindings += 1;
      return candidate;
    },
    lookup: (candidate) => {
      lookups += 1;
      return e404Result(candidate);
    },
    publish: (args) => {
      publishes += 1;
      assert.deepEqual(args, npmPublishArguments('/tmp/aikdna-kdna-core-1.2.3.tgz'));
      return { status: 0 };
    },
  });
  assert.deepEqual(published, { decision: 'published', shouldPublish: true, published: true });
  assert.equal(bindings, 2);
  assert.equal(lookups, 2);
  assert.equal(publishes, 1);
});

test('publisher skips exact existing identity and pins the required npm publish arguments', () => {
  const { evidence, tarball } = evidenceFixture();
  let publishes = 0;
  const result = publishCandidate({
    evidence,
    tarball,
    artifactPath: '/tmp/aikdna-kdna-core-1.2.3.tgz',
    bindCurrent: (candidate) => candidate,
    lookup: () => ({
      status: 0,
      stdout: registryMetadata(evidence, { gitHead: HASH }),
      stderr: '',
    }),
    publish: () => {
      publishes += 1;
    },
  });
  assert.deepEqual(result, { decision: 'skip-identical', shouldPublish: false, published: false });
  assert.equal(publishes, 0);
  assert.deepEqual(npmPublishArguments('/tmp/aikdna-kdna-core-1.2.3.tgz'), [
    'publish',
    '/tmp/aikdna-kdna-core-1.2.3.tgz',
    '--ignore-scripts',
    '--provenance',
    '--access=public',
    `--registry=${OFFICIAL_REGISTRY}`,
  ]);
});

test('GitHub output is append-only and exact', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-github-output-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const output = path.join(temp, 'output');
  writeGithubDecision(output, { shouldPublish: false, decision: 'skip-identical' });
  writeGithubDecision(output, { shouldPublish: true, decision: 'publish' });
  assert.equal(
    fs.readFileSync(output, 'utf8'),
    'should_publish=false\ndecision=skip-identical\nshould_publish=true\ndecision=publish\n',
  );
});

test('Core workflow uses the authoritative retained-artifact path and no direct worktree publish', () => {
  const workflow = fs.readFileSync(
    path.join(REPO_ROOT, '.github', 'workflows', 'publish.yml'),
    'utf8',
  );
  const start = workflow.indexOf('  publish-core:');
  const end = workflow.indexOf('\n  publish-eval:', start);
  const job = workflow.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(job, /!startsWith\(github\.event\.release\.tag_name, 'v'\)/u);
  assert.match(job, /!contains\(github\.event\.release\.tag_name, '\/'\)/u);
  assert.doesNotMatch(job, /startsWith\(github\.event\.release\.tag_name, 'core\/'\)/u);
  assert.doesNotMatch(job, /workflow_dispatch/u);
  assert.match(job, /ref: \$\{\{ github\.event\.release\.tag_name \}\}/u);
  assert.match(job, /npm install --global npm@11\.17\.0 --ignore-scripts/u);
  const check = job.indexOf('core-release-authority.js check');
  const tests = job.indexOf('scripts/core-release-authority.test.js');
  const prepare = job.indexOf('core-release-authority.js prepare');
  const smoke = job.indexOf('core-release-authority.js smoke');
  const guard = job.indexOf('core-release-authority.js guard');
  const publish = job.indexOf('core-release-authority.js publish');
  assert.ok(
    check >= 0 &&
      check < tests &&
      tests < prepare &&
      prepare < smoke &&
      smoke < guard &&
      guard < publish,
  );
  assert.match(job, /if: steps\.registry\.outputs\.should_publish == 'true'/u);
  assert.doesNotMatch(job, /run:\s*>?-?\s*npm publish\b/u);
  assert.doesNotMatch(job, /working-directory: packages\/kdna-core/u);
});

test('Core package prepublish hook blocks direct worktree publication', () => {
  const result = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, 'packages', 'kdna-core', 'scripts', 'check-release-readiness.js')],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, npm_lifecycle_event: 'prepublishOnly' },
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /direct worktree publication is forbidden/u);
});
