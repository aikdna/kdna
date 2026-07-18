'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const zlib = require('node:zlib');

const {
  AUDITED_NPM_VERSION,
  JSON_LIMITS,
  OFFICIAL_REGISTRY,
  REPO_ROOT,
  TRUSTED_NPM_ENVIRONMENT,
  TRUSTED_NPM_ENTRY_COUNT,
  TRUSTED_NPM_FILENAME,
  TRUSTED_NPM_INTEGRITY,
  TRUSTED_NPM_URL,
  TREE_LIMITS,
  assertNoInheritedNpmAuthority,
  assertIndexMatchesTree,
  assertNoProjectNpmConfig,
  buildRegistryManifest,
  canonicalTempRoot,
  cleanGitEnvironment,
  cleanNpmEnvironment,
  commitDocument,
  createTokenUserConfig,
  evaluateRegistryResult,
  extractSafeEcosystemFailureStage,
  expectedRegistryE404,
  guardCandidate,
  inspectTree,
  initializeIsolatedGateRepository,
  integrity,
  materializeTree,
  makePrivateTemp,
  parseIndexEntries,
  parseTarFiles,
  parseTreeEntries,
  publishCandidate,
  resolveTrustedNpmInvocation,
  runNpm,
  sha1,
  sha256,
  strictJson,
  validateEvidenceArtifact,
  validateReleaseContext,
  validateReleaseEvidence,
  verifyTrustedNpmTarball,
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
      GITHUB_REPOSITORY: 'aikdna/kdna',
      GITHUB_SERVER_URL: 'https://github.com',
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
      author: { normalized: 'Aikdna <release@example.com>' },
      committer: { normalized: 'Release Bot <bot@example.com>' },
      signoffs: ['Aikdna <release@example.com>'],
      authorSignoffMatch: true,
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
      author: 'Aikdna <release@example.com>',
      committer: 'Release Bot <bot@example.com>',
      author_signoff_match: true,
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
      npm_release_url: TRUSTED_NPM_URL,
      npm_release_integrity: TRUSTED_NPM_INTEGRITY,
      npm_release_entry_count: TRUSTED_NPM_ENTRY_COUNT,
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
    author: 'Aikdna <release@example.com>',
    committer: 'Release Bot <bot@example.com>',
    signoffs: ['Aikdna <release@example.com>'],
    authorSignoffMatch: true,
  });
});

test('release context rejects prefixed, prerelease, mutable, unsigned, dirty, or stale inputs', async (t) => {
  const cases = [
    ['version prefix', releaseContext({ pkg: { version: 'v1.2.3' } })],
    ['scope prefix', releaseContext({ pkg: { version: 'core/1.2.3' } })],
    ['prerelease version', releaseContext({ pkg: { version: '1.2.3-rc.1' } })],
    ['leading zero', releaseContext({ pkg: { version: '01.2.3' } })],
    ['missing repository', releaseContext({ env: { GITHUB_REPOSITORY: undefined } })],
    ['wrong repository', releaseContext({ env: { GITHUB_REPOSITORY: 'other/kdna' } })],
    ['wrong GitHub server', releaseContext({ env: { GITHUB_SERVER_URL: 'https://example.com' } })],
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
    ['missing author', releaseContext({ git: { author: null } })],
    ['author DCO mismatch', releaseContext({ git: { authorSignoffMatch: false } })],
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
    LD_PRELOAD: '/tmp/hostile.so',
    DYLD_INSERT_LIBRARIES: '/tmp/hostile.dylib',
    GITHUB_TOKEN: 'must-not-propagate',
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
  assert.equal(environment.LD_PRELOAD, undefined);
  assert.equal(environment.DYLD_INSERT_LIBRARIES, undefined);
  assert.equal(environment.GITHUB_TOKEN, undefined);
});

test('private temp creation canonicalizes a symlinked system temp root', (t) => {
  const target = makePrivateTemp('kdna-core-temp-target-');
  const alias = `${target}-alias`;
  fs.symlinkSync(target, alias, 'dir');
  t.after(() => {
    fs.rmSync(alias, { force: true });
    fs.rmSync(target, { recursive: true, force: true });
  });
  assert.equal(canonicalTempRoot(alias), target);
  const child = makePrivateTemp('kdna-core-temp-child-', alias);
  assert.equal(path.dirname(child), target);
  assert.equal(fs.realpathSync(child), child);
});

test('private temp creation rejects a writable non-sticky root', (t) => {
  const root = makePrivateTemp('kdna-core-insecure-temp-root-');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.chmodSync(root, 0o777);
  assert.throws(
    () => canonicalTempRoot(root),
    /writable system temp root must use the sticky bit/u,
  );
});

test('private temp creation rejects same-root symlink substitution', () => {
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      String.raw`
        'use strict';
        const fs = require('node:fs');
        const path = require('node:path');
        const authority = require(process.argv[1]);
        const root = authority.makePrivateTemp('kdna-core-substitution-root-');
        const victim = path.join(root, 'victim');
        fs.mkdirSync(victim, { mode: 0o700 });
        const original = fs.mkdtempSync;
        fs.mkdtempSync = (prefix) => {
          const created = original(prefix);
          fs.rmdirSync(created);
          fs.symlinkSync(victim, created, 'dir');
          return created;
        };
        try {
          authority.makePrivateTemp('kdna-core-substitution-child-', root);
          process.exitCode = 2;
        } catch (error) {
          if (!/private temp must remain one real directory/u.test(String(error.message))) {
            process.stderr.write(String(error.stack || error));
            process.exitCode = 3;
          }
        } finally {
          fs.mkdtempSync = original;
          fs.rmSync(root, { recursive: true, force: true });
        }
      `,
      require.resolve('./core-release-authority'),
    ],
    { encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('release JSON rejects duplicates, BOMs, invalid scalars, size, and depth before normalization', () => {
  assert.deepEqual(strictJson('{"safe":[1,true,null]}', 'fixture'), { safe: [1, true, null] });
  for (const source of [
    '{"a":1,"a":2}',
    '{"outer":{"a":1,"a":2}}',
    '{"__proto__":{},"__proto__":{}}',
    '{"n":1e999}',
    '"\\uD800"',
  ]) {
    assert.throws(() => strictJson(source, 'hostile JSON'));
  }
  assert.throws(() => strictJson(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]), 'BOM'), /BOM/u);
  assert.throws(
    () => strictJson('[]', 'oversized', { bytes: 1, depth: JSON_LIMITS.depth }),
    /byte limit/u,
  );
  assert.throws(() => strictJson('[[[]]]', 'deep', { bytes: 64, depth: 2 }), /nesting limit/u);
});

test('inherited npm executable authority and mutable trusted tar paths fail closed', (t) => {
  assert.throws(
    () => assertNoInheritedNpmAuthority({ npm_execpath: '/tmp/hostile-npm.js' }),
    /inherited npm executable authority/u,
  );
  assert.throws(
    () => assertNoInheritedNpmAuthority({ NPM_NODE_EXECPATH: '/tmp/hostile-node' }),
    /inherited npm executable authority/u,
  );
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-trusted-npm-hostile-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const candidate = path.join(temp, TRUSTED_NPM_FILENAME);
  fs.writeFileSync(candidate, tarballFixture());
  assert.throws(() => verifyTrustedNpmTarball(candidate), /integrity/u);
  const hardlink = path.join(temp, 'hardlinked.tgz');
  fs.linkSync(candidate, hardlink);
  assert.throws(() => verifyTrustedNpmTarball(candidate), /hard link/u);
});

test(
  'provisioned official npm bytes resolve to the audited CLI and ignore mutable PATH',
  { skip: !process.env[TRUSTED_NPM_ENVIRONMENT] },
  (t) => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-path-npm-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const environment = { ...process.env, PATH: '/tmp/hostile-path' };
    for (const key of Object.keys(environment)) {
      if (['npm_execpath', 'npm_node_execpath'].includes(key.toLowerCase())) {
        delete environment[key];
      }
    }
    const invocation = resolveTrustedNpmInvocation({
      environment,
    });
    try {
      const result = runNpm(invocation, ['--version'], { timeout: 30_000 });
      assert.equal(result.stdout.trim(), AUDITED_NPM_VERSION);
      assert.equal(result.stderr, '');
      const pathResult = spawnSync('npm', ['--version'], {
        encoding: 'utf8',
        env: cleanNpmEnvironment({
          invocation,
          home: path.join(temp, 'home'),
          cache: path.join(temp, 'cache'),
          environment,
        }),
        shell: false,
      });
      assert.equal(pathResult.status, 0, pathResult.stderr);
      assert.equal(pathResult.stdout.trim(), AUDITED_NPM_VERSION);
      const ancestor = path.join(temp, 'hostile-ancestor');
      const project = path.join(ancestor, 'controlled-project');
      fs.mkdirSync(project, { recursive: true });
      fs.writeFileSync(path.join(ancestor, 'package.json'), '{"private":true}\n');
      fs.writeFileSync(path.join(ancestor, '.npmrc'), 'strict-ssl=false\n');
      fs.writeFileSync(
        path.join(project, 'package.json'),
        '{"name":"controlled-project","version":"1.0.0","private":true}\n',
      );
      const strictSsl = runNpm(invocation, ['config', 'get', 'strict-ssl'], {
        cwd: project,
        projectRoot: project,
        home: path.join(temp, 'strict-home'),
        cache: path.join(temp, 'strict-cache'),
      });
      assert.equal(strictSsl.stdout.trim(), 'true');
    } finally {
      invocation.cleanup();
    }
  },
);

test(
  'trusted-npm failure output is a stable summary without child provider details',
  { skip: !process.env[TRUSTED_NPM_ENVIRONMENT] },
  () => {
    const marker = 'provider-body-must-not-escape';
    const result = spawnSync(
      process.execPath,
      [path.join(REPO_ROOT, 'scripts', 'core-release-authority.js'), 'trusted-npm', marker],
      { cwd: REPO_ROOT, encoding: 'utf8', env: process.env, shell: false },
    );
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(
      result.stderr,
      'Core release authority rejected: trusted npm workflow command failed\n',
    );
    assert.doesNotMatch(result.stderr, new RegExp(marker, 'u'));
  },
);

test('trusted npm exposes only one exact ecosystem stage sentinel', () => {
  const args = ['run', 'ecosystem-gate'];
  assert.equal(
    extractSafeEcosystemFailureStage(args, {
      stdout: 'ordinary test output\n',
      stderr: 'provider details\nKDNA_SAFE_ECOSYSTEM_STAGE=swift-test\n',
    }),
    'swift-test',
  );
  for (const result of [
    { stdout: 'KDNA_SAFE_ECOSYSTEM_STAGE=swift-test-suffix!', stderr: '' },
    { stdout: 'prefix KDNA_SAFE_ECOSYSTEM_STAGE=swift-test', stderr: '' },
    {
      stdout: 'KDNA_SAFE_ECOSYSTEM_STAGE=swift-test\n',
      stderr: 'KDNA_SAFE_ECOSYSTEM_STAGE=core-test\n',
    },
    { stdout: 'KDNA_SAFE_ECOSYSTEM_STAGE=Swift-Test\n', stderr: '' },
    { stdout: 'KDNA_SAFE_ECOSYSTEM_STAGE=provider-detail\n', stderr: '' },
    {
      stdout: `KDNA_SAFE_ECOSYSTEM_STAGE=${'a'.repeat(33)}\n`,
      stderr: '',
    },
  ]) {
    assert.equal(extractSafeEcosystemFailureStage(args, result), null);
  }
  assert.equal(
    extractSafeEcosystemFailureStage(['test'], {
      stdout: 'KDNA_SAFE_ECOSYSTEM_STAGE=swift-test\n',
      stderr: '',
    }),
    null,
  );
});

test('publisher process environment uses a minimal provenance and token whitelist', () => {
  const invocation = {
    command: process.execPath,
    prefixArgs: ['/opt/audited/npm-cli.js'],
    cliPath: '/opt/audited/npm-cli.js',
    toolEntries: { directory: '/opt/audited/tool-bin' },
  };
  const environment = cleanNpmEnvironment({
    invocation,
    home: '/tmp/isolated-home',
    cache: '/tmp/isolated-cache',
    allowAuth: true,
    environment: {
      GIT_DIR: '/tmp/hostile-git-dir',
      NODE_AUTH_TOKEN: 'test-placeholder',
      NODE_OPTIONS: '--require=/tmp/hostile.js',
      NODE_EXTRA_CA_CERTS: '/tmp/hostile-ca.pem',
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      SSL_CERT_FILE: '/tmp/hostile-cert.pem',
      LD_PRELOAD: '/tmp/hostile.so',
      LD_AUDIT: '/tmp/hostile-audit.so',
      DYLD_INSERT_LIBRARIES: '/tmp/hostile.dylib',
      GITHUB_TOKEN: 'must-not-propagate',
      GITHUB_OUTPUT: '/tmp/github-output',
      KDNA_CONTROL_ROOT: '/tmp/control-root',
      KDNA_PYTHON: '/tmp/python',
      AWS_SECRET_ACCESS_KEY: 'must-not-propagate',
      NPM_TOKEN: 'must-not-propagate',
      npm_config_userconfig: '/tmp/hostile.npmrc',
    },
  });
  assert.equal(environment.NODE_AUTH_TOKEN, 'test-placeholder');
  assert.equal(environment.GITHUB_OUTPUT, '/tmp/github-output');
  assert.equal(environment.KDNA_CONTROL_ROOT, '/tmp/control-root');
  assert.equal(environment.KDNA_PYTHON, '/tmp/python');
  assert.equal(environment.npm_config_userconfig, '/tmp/isolated-home/absent-user.npmrc');
  assert.equal(environment.npm_config_registry, OFFICIAL_REGISTRY);
  assert.equal(environment.npm_config_strict_ssl, 'true');
  assert.equal(environment.npm_config_ignore_scripts, 'true');
  assert.equal(environment.npm_execpath, invocation.cliPath);
  assert.equal(environment.npm_node_execpath, process.execPath);
  assert.equal(environment.GIT_DIR, undefined);
  assert.equal(environment.NODE_OPTIONS, '');
  assert.equal(environment.NODE_EXTRA_CA_CERTS, undefined);
  assert.equal(environment.NODE_TLS_REJECT_UNAUTHORIZED, undefined);
  assert.equal(environment.SSL_CERT_FILE, undefined);
  assert.equal(environment.LD_PRELOAD, undefined);
  assert.equal(environment.LD_AUDIT, undefined);
  assert.equal(environment.DYLD_INSERT_LIBRARIES, undefined);
  assert.equal(environment.GITHUB_TOKEN, undefined);
  assert.equal(environment.AWS_SECRET_ACCESS_KEY, undefined);
  assert.equal(environment.NPM_TOKEN, undefined);

  const unauthenticated = cleanNpmEnvironment({
    invocation,
    home: '/tmp/isolated-home',
    cache: '/tmp/isolated-cache',
    environment: { NODE_AUTH_TOKEN: 'must-not-propagate', NPM_TOKEN: 'must-not-propagate' },
  });
  assert.equal(unauthenticated.NODE_AUTH_TOKEN, undefined);
  assert.equal(unauthenticated.NPM_TOKEN, undefined);
});

test('trusted npm auth config contains only a literal environment reference in a private file', (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-auth-config-'));
  fs.chmodSync(home, 0o700);
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const userconfig = createTokenUserConfig(home, { NODE_AUTH_TOKEN: 'test-placeholder' });
  const state = fs.lstatSync(userconfig);
  assert.equal(state.mode & 0o777, 0o600);
  assert.equal(
    fs.readFileSync(userconfig, 'utf8'),
    '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n',
  );
  assert.throws(() => createTokenUserConfig(home, {}), /missing or invalid/u);
});

test('npm execution rejects project configuration from cwd through its declared root', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-npm-config-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const nested = path.join(root, 'packages', 'core');
  fs.mkdirSync(nested, { recursive: true });
  assert.doesNotThrow(() => assertNoProjectNpmConfig(nested, root));
  fs.writeFileSync(path.join(root, '.npmrc'), 'registry=https://example.invalid/\n');
  assert.throws(() => assertNoProjectNpmConfig(nested, root), /project npm config is forbidden/u);
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
  const hardlink = `${index}.hardlink`;
  fs.linkSync(index, hardlink);
  assert.throws(() => assertIndexMatchesTree(tree, root), /hard link/u);
  fs.unlinkSync(hardlink);
  assert.doesNotThrow(() => assertIndexMatchesTree(tree, root));

  fs.renameSync(index, `${index}.real`);
  fs.symlinkSync('index.real', index);
  assert.throws(() => assertIndexMatchesTree(tree, root), /real file/u);
});

test('exact commit blobs materialize without reading the mutable worktree', (t) => {
  const head =
    process.env.KDNA_TEST_EXACT_COMMIT ||
    require('node:child_process')
      .execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' })
      .trim();
  assert.match(head, /^[0-9a-f]{40}$/u);
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
  initializeIsolatedGateRepository(source, tree, head, REPO_ROOT);
  assert.equal(
    require('node:child_process')
      .execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' })
      .trim(),
    head,
  );
  assert.equal(
    require('node:child_process').execFileSync(
      '/usr/bin/git',
      ['status', '--porcelain=v2', '--untracked-files=all'],
      { cwd: source, encoding: 'utf8' },
    ),
    '',
  );
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
    [
      'npm source',
      evidenceFixture({ tooling: { npm_release_url: 'https://example.invalid/' } }).evidence,
    ],
    [
      'npm integrity',
      evidenceFixture({ tooling: { npm_release_integrity: 'sha512-forged' } }).evidence,
    ],
    ['npm entry count', evidenceFixture({ tooling: { npm_release_entry_count: 1 } }).evidence],
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

test('existing registry version is idempotent only for exact identity and matching gitHead', async (t) => {
  const { evidence } = evidenceFixture();
  assert.deepEqual(
    evaluateRegistryResult(
      {
        status: 0,
        stdout: registryMetadata(evidence, { gitHead: evidence.source.commit }),
        stderr: '',
      },
      evidence,
    ),
    {
      decision: 'skip-identical',
      shouldPublish: false,
    },
  );
  assert.throws(() =>
    evaluateRegistryResult({ status: 0, stdout: registryMetadata(evidence), stderr: '' }, evidence),
  );
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
    publish: (request) => {
      publishes += 1;
      assert.equal(request.evidence, evidence);
      assert.equal(request.tarball, tarball);
      assert.equal(request.artifactPath, '/tmp/aikdna-kdna-core-1.2.3.tgz');
      return { status: 0 };
    },
  });
  assert.deepEqual(published, { decision: 'published', shouldPublish: true, published: true });
  assert.equal(bindings, 3);
  assert.equal(lookups, 2);
  assert.equal(publishes, 1);
});

test('publisher skips exact existing registry identity without invoking the publisher', () => {
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
});

test('registry manifest binds exact retained package identity to the evidence commit', () => {
  const packageManifest = { name: '@aikdna/kdna-core', version: '1.2.3' };
  const tarball = tarballFixture({ bytes: Buffer.from(`${JSON.stringify(packageManifest)}\n`) });
  const { evidence } = evidenceFixture({ tarball });
  assert.deepEqual(buildRegistryManifest(evidence, tarball), {
    ...packageManifest,
    gitHead: HASH,
  });
  const hostileTarball = tarballFixture({
    bytes: Buffer.from(`${JSON.stringify({ ...packageManifest, gitHead: OTHER_HASH })}\n`),
  });
  const hostile = evidenceFixture({ tarball: hostileTarball });
  assert.throws(
    () => buildRegistryManifest(hostile.evidence, hostileTarball),
    /publisher-owned field gitHead/u,
  );
  const hostileTagTarball = tarballFixture({
    bytes: Buffer.from(`${JSON.stringify({ ...packageManifest, tag: 'next' })}\n`),
  });
  const hostileTag = evidenceFixture({ tarball: hostileTagTarball });
  assert.throws(
    () => buildRegistryManifest(hostileTag.evidence, hostileTagTarball),
    /publisher-owned field tag/u,
  );
});

test(
  'audited publisher uploads the unchanged retained bytes with exact registry gitHead',
  { skip: !process.env[TRUSTED_NPM_ENVIRONMENT] },
  async (t) => {
    const packageManifest = { name: '@aikdna/kdna-core', version: '1.2.3' };
    const tarball = tarballFixture({ bytes: Buffer.from(`${JSON.stringify(packageManifest)}\n`) });
    const { evidence } = evidenceFixture({ tarball });
    const manifest = buildRegistryManifest(evidence, tarball);
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-core-publisher-capture-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const manifestPath = path.join(temp, 'manifest.json');
    const artifactPath = path.join(temp, evidence.artifact.filename);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest)}\n`, { mode: 0o600 });
    fs.writeFileSync(artifactPath, tarball, { mode: 0o600 });

    let resolveRequest;
    let rejectRequest;
    const capturedRequest = new Promise((resolve, reject) => {
      resolveRequest = resolve;
      rejectRequest = reject;
    });
    const server = http.createServer((request, response) => {
      const chunks = [];
      let bytes = 0;
      request.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) request.destroy(new Error('request exceeds test limit'));
        else chunks.push(chunk);
      });
      request.on('error', rejectRequest);
      request.on('end', () => {
        resolveRequest({
          authorization: request.headers.authorization,
          body: Buffer.concat(chunks),
          method: request.method,
        });
        response.writeHead(201, { 'content-type': 'application/json' });
        response.end('{}');
      });
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));

    const invocation = resolveTrustedNpmInvocation();
    t.after(() => invocation.cleanup());
    const { publishVerified } = require('./core-release-publisher');
    const address = server.address();
    await publishVerified({
      libraryPath: invocation.publishLibraryPath,
      manifestPath,
      artifactPath,
      registry: `http://127.0.0.1:${address.port}/`,
      token: 'test-placeholder',
      provenance: false,
      npmVersion: AUDITED_NPM_VERSION,
    });
    const request = await capturedRequest;
    assert.equal(request.method, 'PUT');
    assert.equal(request.authorization, 'Bearer test-placeholder');
    const metadata = strictJson(request.body, 'captured registry request');
    assert.deepEqual(metadata['dist-tags'], { latest: '1.2.3' });
    assert.equal(metadata.versions['1.2.3'].gitHead, HASH);
    const attachment = Object.values(metadata._attachments).find(
      (candidate) => candidate.content_type === 'application/octet-stream',
    );
    assert.ok(attachment);
    assert.deepEqual(Buffer.from(attachment.data, 'base64'), tarball);
    assert.equal(attachment.length, tarball.length);
  },
);

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
  assert.match(job, /github\.repository == 'aikdna\/kdna'/u);
  assert.doesNotMatch(job, /startsWith\(github\.event\.release\.tag_name, 'core\/'\)/u);
  assert.doesNotMatch(job, /workflow_dispatch/u);
  assert.match(job, /ref: \$\{\{ github\.event\.release\.tag_name \}\}/u);
  assert.match(job, /KDNA_TRUSTED_NPM_TARBALL=\$RUNNER_TEMP\/npm-11\.17\.0\.tgz/u);
  const provision = job.indexOf('core-release-authority.js provision-npm');
  const verifyNpm = job.indexOf('core-release-authority.js verify-npm');
  const check = job.indexOf('core-release-authority.js check');
  const tests = job.indexOf('scripts/core-release-authority.test.js');
  const prepare = job.indexOf('core-release-authority.js prepare');
  const smoke = job.indexOf('core-release-authority.js smoke');
  const guard = job.indexOf('core-release-authority.js guard');
  const publish = job.indexOf('core-release-authority.js publish');
  assert.ok(
    check >= 0 &&
      provision >= 0 &&
      provision < verifyNpm &&
      verifyNpm < check &&
      check < tests &&
      tests < prepare &&
      prepare < smoke &&
      smoke < guard &&
      guard < publish,
  );
  assert.match(job, /if: steps\.registry\.outputs\.should_publish == 'true'/u);
  assert.doesNotMatch(job, /npm install --global/u);
  assert.equal(
    job.split('\n').filter((line) => /^\s*(?:-\s*)?(?:run:\s*)?npm(?:\s|$)/u.test(line)).length,
    0,
  );
  assert.match(job, /core-release-authority\.js trusted-npm ci --ignore-scripts/u);
  assert.doesNotMatch(job, /run:\s*>?-?\s*npm publish\b/u);
  assert.doesNotMatch(job, /working-directory: packages\/kdna-core/u);
  assert.match(job, /^    permissions:\n      contents: read\n      id-token: write\n    env:$/mu);
  assert.match(
    job,
    /Remove transient Core release outputs[\s\S]*if: always\(\)[\s\S]*rm -f "\$CORE_RELEASE_EVIDENCE" "\$CORE_RELEASE_ARTIFACT"[\s\S]*"\$KDNA_TRUSTED_NPM_TARBALL"/u,
  );
});

test('Core CI provisions one audited npm authority before every npm command', () => {
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(workflow, /^permissions:\n  contents: read\njobs:$/mu);
  const start = workflow.indexOf('  test:');
  const end = workflow.indexOf('\n  public-surface:', start);
  const job = workflow.slice(start, end);
  const provision = job.indexOf('core-release-authority.js provision-npm');
  const verify = job.indexOf('core-release-authority.js verify-npm');
  const firstTrustedCommand = job.indexOf('core-release-authority.js trusted-npm');
  assert.ok(provision >= 0 && provision < verify && verify < firstTrustedCommand);
  assert.equal(
    job.split('\n').filter((line) => /^\s*(?:-\s*)?(?:run:\s*)?npm(?:\s|$)/u.test(line)).length,
    0,
  );
  assert.match(job, /if: always\(\)[\s\S]*rm -f "\$KDNA_TRUSTED_NPM_TARBALL"/u);
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
