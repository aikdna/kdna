'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { execFileSync } = require('node:child_process');
const authority = require('./preview-release-authority.js');
const trusted = require('./core-release-authority.js');
const publisher = require('./preview-release-publisher.js');
const SHA = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const OTHER = 'c'.repeat(40);
const DIGEST = 'd'.repeat(64);
function fixture(unit = 'core') {
  const pkg = { ...authority.POLICIES[unit], license: 'Apache-2.0' };
  delete pkg.directory;
  if (unit === 'read')
    pkg.peerDependencies = { '@aikdna/kdna-core': authority.POLICIES.core.version };
  const notes =
    '## ' +
    (unit === 'core' ? 'Core ' : 'Read ') +
    pkg.version +
    '\n\n- Exact preview change notes with supported scope and limitations.';
  const approval = {
    schema: 'kdna.preview-release-approval/1',
    unit,
    repository: 'aikdna/kdna',
    source_commit: SHA,
    source_tree: TREE,
    base_commit: authority.BASE_COMMIT,
    version: pkg.version,
    dist_tag: 'browser-preview',
    artifact_sha256: DIGEST,
    notes_sha256: trusted.sha256(Buffer.from(notes)),
    companion:
      unit === 'read'
        ? {
            name: '@aikdna/kdna-core',
            version: authority.POLICIES.core.version,
            sha256: DIGEST,
            integrity: 'sha512-' + Buffer.alloc(64).toString('base64'),
            shasum: OTHER,
            gitHead: SHA,
          }
        : null,
  };
  const tag = 'preview/' + unit + '/' + pkg.version;
  const event = {
    action: 'published',
    repository: { full_name: 'aikdna/kdna' },
    release: {
      id: 12345,
      published_at: '2026-10-09T00:00:00Z',
      draft: false,
      prerelease: true,
      tag_name: tag,
      html_url: 'https://github.com/aikdna/kdna/releases/tag/' + tag,
      target_commitish: SHA,
      body: notes + '\n\n```kdna-preview-release\n' + JSON.stringify(approval, null, 2) + '\n```',
    },
  };
  const env = {
    GITHUB_ACTIONS: 'true',
    GITHUB_REPOSITORY: 'aikdna/kdna',
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_EVENT_NAME: 'release',
    GITHUB_REF: 'refs/tags/' + tag,
    GITHUB_REF_TYPE: 'tag',
    GITHUB_REF_NAME: tag,
    GITHUB_SHA: SHA,
  };
  const observation = {
    commit: SHA,
    tree: TREE,
    tagCommit: SHA,
    clean: true,
    mainContainsSource: true,
    dco: true,
    baseCommit: authority.BASE_COMMIT,
  };
  return { unit, pkg, notes, approval, event, env, observation };
}
function rewriteBody(value) {
  value.event.release.body =
    value.notes +
    '\n\n```kdna-preview-release\n' +
    JSON.stringify(value.approval, null, 2) +
    '\n```';
}
function directory() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-preview-test-')));
}
function git(root, args) {
  return execFileSync(
    '/usr/bin/git',
    [
      '-c',
      'core.hooksPath=/dev/null',
      '-c',
      'user.name=Fixture Author',
      '-c',
      'user.email=fixture@example.invalid',
      ...args,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      env: {
        PATH: '/usr/bin:/bin',
        HOME: root,
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_GLOBAL: '/dev/null',
      },
    },
  ).trim();
}
function sourceFixture() {
  const root = directory();
  fs.mkdirSync(path.join(root, 'packages/kdna-core'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'base.txt'), 'baseline\n');
  git(root, ['init', '--quiet']);
  git(root, ['add', '.']);
  git(root, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'fixture baseline']);
  const baseline = git(root, ['rev-parse', 'HEAD']);
  const pkg = {
    name: '@aikdna/kdna-core',
    version: authority.POLICIES.core.version,
    main: 'index.js',
    license: 'Apache-2.0',
  };
  const members = {
    'package.json': JSON.stringify(pkg, null, 2) + '\n',
    LICENSE: 'Apache License 2.0\n',
    NOTICE: 'Fixture only\n',
    'index.js': 'module.exports = {};\n',
  };
  for (const [name, bytes] of Object.entries(members))
    fs.writeFileSync(path.join(root, 'packages/kdna-core', name), bytes);
  const notes = fixture().notes + '\n';
  fs.writeFileSync(path.join(root, 'docs/release-preview-notes.md'), notes);
  git(root, ['add', '.']);
  git(root, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'fixture preview']);
  return { root, baseline, pkg, members };
}
function tarball(members, overrides = {}) {
  const chunks = [];
  for (const [name, value] of Object.entries(members)) {
    const bytes = Buffer.from(value);
    const header = Buffer.alloc(512);
    header.write('package/' + name, 0, 100, 'utf8');
    const octal = (at, width, number) =>
      header.write(number.toString(8).padStart(width - 1, '0') + '\0', at, width, 'ascii');
    octal(100, 8, overrides.mode || 0o644);
    octal(108, 8, 0);
    octal(116, 8, 0);
    octal(124, 12, bytes.length);
    octal(136, 12, 0);
    header.fill(0x20, 148, 156);
    header[156] = 0x30;
    header.write('ustar\0', 257, 6, 'ascii');
    header.write('00', 263, 2, 'ascii');
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
    chunks.push(header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512));
  }
  chunks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(chunks));
}
test('only exact Core and Read preview contexts pass; stable remains separate', () => {
  for (const unit of ['core', 'read'])
    assert.equal(
      authority.validateContext(fixture(unit)).authorization,
      'published-prerelease-event',
    );
  assert.throws(
    () =>
      trusted.validateReleaseContext({
        pkg: fixture().pkg,
        changelog: '',
        env: fixture().env,
        git: {},
      }),
    /stable natural SemVer/u,
  );
});
test('release context rejects event, source, DCO, notes and channel substitutions', async (t) => {
  const cases = [
    ['workflow dispatch', (x) => (x.env.GITHUB_EVENT_NAME = 'workflow_dispatch')],
    ['not Actions', (x) => (x.env.GITHUB_ACTIONS = 'false')],
    ['wrong repository', (x) => (x.event.repository.full_name = 'other/kdna')],
    ['wrong server', (x) => (x.env.GITHUB_SERVER_URL = 'https://example.invalid')],
    ['draft', (x) => (x.event.release.draft = true)],
    ['stable event', (x) => (x.event.release.prerelease = false)],
    ['edited event', (x) => (x.event.action = 'edited')],
    ['wrong tag', (x) => (x.event.release.tag_name += '.other')],
    ['wrong ref', (x) => (x.env.GITHUB_REF = 'refs/heads/main')],
    ['wrong event SHA', (x) => (x.env.GITHUB_SHA = OTHER)],
    ['wrong target', (x) => (x.event.release.target_commitish = 'main')],
    ['wrong tree', (x) => (x.observation.tree = OTHER)],
    ['dirty source', (x) => (x.observation.clean = false)],
    ['tag moved', (x) => (x.observation.tagCommit = OTHER)],
    ['not on main', (x) => (x.observation.mainContainsSource = false)],
    ['missing DCO', (x) => (x.observation.dco = false)],
    [
      'latest',
      (x) => {
        x.approval.dist_tag = 'latest';
        rewriteBody(x);
      },
    ],
    [
      'unapproved SHA',
      (x) => {
        x.approval.source_commit = OTHER;
        rewriteBody(x);
      },
    ],
    [
      'invalid artifact digest',
      (x) => {
        x.approval.artifact_sha256 = '../artifact';
        rewriteBody(x);
      },
    ],
    [
      'unknown approval fields',
      (x) => {
        x.approval.skip = true;
        rewriteBody(x);
      },
    ],
    [
      'notes replaced',
      (x) =>
        (x.event.release.body = x.event.release.body.replace('supported scope', 'unbounded scope')),
    ],
    ['trailing release text', (x) => (x.event.release.body += '\nExtra unsupported claims')],
    [
      'duplicate approval JSON key',
      (x) =>
        (x.event.release.body = x.event.release.body.replace(
          '"unit": "core",',
          '"unit": "core", "unit": "read",',
        )),
    ],
    ['private package', (x) => (x.pkg.private = true)],
    ['local dependency', (x) => (x.pkg.dependencies = { ajv: 'file:../ajv' })],
  ];
  for (const [label, mutate] of cases)
    await t.test(label, () => {
      const value = fixture();
      mutate(value);
      assert.throws(() => authority.validateContext(value));
    });
});
test('Read companion and exact Core peer cannot be switched', () => {
  let value = fixture('read');
  value.pkg.peerDependencies['@aikdna/kdna-core'] = '0.37.0';
  assert.throws(() => authority.validateContext(value), /exact Core peer/u);
  value = fixture('read');
  value.approval.companion.gitHead = OTHER;
  rewriteBody(value);
  assert.throws(() => authority.validateContext(value), /companion source/u);
  value = fixture('read');
  value.approval.companion = null;
  rewriteBody(value);
  assert.throws(() => authority.validateContext(value), /companion/u);
});
test('actual Git source inspection binds commit/tree/index and every range DCO', () => {
  const f = sourceFixture();
  try {
    const source = authority.inspectSource('core', f.root, { baseline: f.baseline });
    assert.equal(source.commit, git(f.root, ['rev-parse', 'HEAD']));
    assert.equal(source.tree, git(f.root, ['rev-parse', 'HEAD^{tree}']));
    assert.equal(source.dco_commit_count, 1);
    fs.writeFileSync(path.join(f.root, 'untracked'), 'new');
    assert.throws(
      () => authority.inspectSource('core', f.root, { baseline: f.baseline }),
      /clean/u,
    );
    fs.rmSync(path.join(f.root, 'untracked'));
    fs.appendFileSync(path.join(f.root, 'packages/kdna-core/index.js'), '// changed\n');
    assert.throws(
      () => authority.inspectSource('core', f.root, { baseline: f.baseline }),
      /clean/u,
    );
    git(f.root, ['add', '.']);
    git(f.root, ['commit', '--quiet', '--no-gpg-sign', '-m', 'unsigned DCO fixture']);
    assert.throws(() => authority.inspectSource('core', f.root, { baseline: f.baseline }), /DCO/u);
  } finally {
    fs.rmSync(f.root, { recursive: true, force: true });
  }
});
test('artifact checks every member against exact Git bytes and mode', () => {
  const f = sourceFixture();
  try {
    const tree = trusted.inspectTree(git(f.root, ['rev-parse', 'HEAD']), f.root);
    const bytes = tarball(f.members);
    const result = authority.validateArtifact(bytes, authority.POLICIES.core, tree, f.root);
    assert.equal(result.sha256, trusted.sha256(bytes));
    assert.equal(result.files.length, 4);
    assert.throws(
      () =>
        authority.validateArtifact(
          tarball({ ...f.members, 'index.js': 'changed' }),
          authority.POLICIES.core,
          tree,
          f.root,
        ),
      /differs from source/u,
    );
    assert.throws(
      () =>
        authority.validateArtifact(
          tarball({ ...f.members, 'extra.js': 'extra' }),
          authority.POLICIES.core,
          tree,
          f.root,
        ),
      /no exact source/u,
    );
    assert.throws(
      () =>
        authority.validateArtifact(
          tarball(f.members, { mode: 0o755 }),
          authority.POLICIES.core,
          tree,
          f.root,
        ),
      /source mode/u,
    );
    const changed = { ...f.members, 'package.json': JSON.stringify({ ...f.pkg, gitHead: SHA }) };
    assert.throws(
      () => authority.validateArtifact(tarball(changed), authority.POLICIES.core),
      /publisher-owned/u,
    );
    const noLicense = { ...f.members };
    delete noLicense.LICENSE;
    assert.throws(
      () => authority.validateArtifact(tarball(noLicense), authority.POLICIES.core),
      /license/u,
    );
  } finally {
    fs.rmSync(f.root, { recursive: true, force: true });
  }
});
function expectedRegistry() {
  return {
    name: '@aikdna/kdna-core',
    version: authority.POLICIES.core.version,
    integrity: 'sha512-' + Buffer.alloc(64).toString('base64'),
    shasum: OTHER,
    gitHead: SHA,
  };
}
function metadata(expected, change = {}) {
  return {
    status: 0,
    stderr: '',
    stdout: JSON.stringify({
      name: expected.name,
      version: expected.version,
      'dist.integrity': expected.integrity,
      'dist.shasum': expected.shasum,
      gitHead: expected.gitHead,
      ...change,
    }),
  };
}
test('registry duplicate policy permits only exact bytes and source metadata', () => {
  const expected = expectedRegistry();
  assert.equal(authority.registryDecision(metadata(expected), expected).decision, 'skip-identical');
  for (const change of [
    { version: '0.37.0' },
    { 'dist.integrity': 'sha512-other' },
    { 'dist.shasum': SHA },
    { gitHead: OTHER },
    { extra: true },
  ])
    assert.throws(() => authority.registryDecision(metadata(expected, change), expected));
  for (const result of [
    { status: 1, stdout: '', stderr: 'error' },
    { status: 2, stdout: '{}', stderr: '' },
    { status: null, stdout: '', stderr: '' },
    { status: 1, stdout: '{"error":{"code":"E403"}}', stderr: '' },
  ])
    assert.throws(() => authority.registryDecision(result, expected));
});
test('only exact version E404 is absence, not failed authentication or ambiguous output', () => {
  const expected = expectedRegistry();
  const spec = expected.name + '@' + expected.version;
  const error = {
    code: 'E404',
    summary: 'No match found for version ' + expected.version,
    detail:
      "The requested resource '" +
      spec +
      "' could not be found or you do not have permission to access it.\n\nNote that you can also install from a\ntarball, folder, http url, or git url.",
  };
  assert.equal(
    authority.registryDecision(
      { status: 1, stderr: '', stdout: JSON.stringify({ error }) },
      expected,
    ).decision,
    'publish',
  );
  error.summary = 'Not found';
  assert.throws(() =>
    authority.registryDecision(
      { status: 1, stderr: '', stdout: JSON.stringify({ error }) },
      expected,
    ),
  );
});
test('isolated publisher uses retained bytes and browser-preview, rejects changed bytes before calling library', async () => {
  const root = directory();
  try {
    const artifactPath = path.join(root, 'retained.tgz');
    const manifestPath = path.join(root, 'manifest.json');
    const bytes = Buffer.from('fixture retained bytes');
    fs.writeFileSync(artifactPath, bytes);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        name: '@aikdna/kdna-core',
        version: authority.POLICIES.core.version,
        gitHead: SHA,
      }),
    );
    let calls = 0;
    const library = {
      publish: async (manifest, tar, options) => {
        calls++;
        assert.ok(tar.equals(bytes));
        assert.equal(manifest.gitHead, SHA);
        assert.equal(options.defaultTag, 'browser-preview');
        assert.equal(options.registry, 'https://registry.npmjs.org/');
        assert.equal(options.provenance, true);
      },
    };
    const options = {
      libraryPath: '/fixture/audited-library',
      manifestPath,
      artifactPath,
      artifactSha256: trusted.sha256(bytes),
      token: 'synthetic-fixture-only',
      library,
    };
    await publisher.publishVerified(options);
    assert.equal(calls, 1);
    fs.appendFileSync(artifactPath, 'changed');
    await assert.rejects(publisher.publishVerified(options), /digest mismatch/u);
    assert.equal(calls, 1);
    fs.writeFileSync(artifactPath, bytes);
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({
        name: '@aikdna/kdna-core',
        version: authority.POLICIES.core.version,
        gitHead: SHA,
        publishConfig: { tag: 'latest' },
      }),
    );
    await assert.rejects(publisher.publishVerified(options), /conflicting metadata/u);
    assert.equal(calls, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('local candidate is a separate operation, not a release event or publish override', () => {
  const args = authority.parseArgs([
    'candidate',
    '--unit',
    'core',
    '--evidence',
    '/tmp/evidence',
    '--artifact',
    '/tmp/retained',
  ]);
  assert.equal(args.command, 'candidate');
  assert.throws(() => authority.parseArgs(['publish', '--unit', 'core', '--skip-release', 'true']));
  assert.throws(() =>
    authority.parseArgs([
      'publish',
      '--unit',
      'other',
      '--evidence',
      '/tmp/evidence',
      '--artifact',
      '/tmp/retained',
    ]),
  );
  assert.throws(() => authority.parseArgs(['publish', '--unit', 'core', '--unit', 'read']));
});

test('programmatic publish cannot override real release authority with a local candidate', () => {
  assert.throws(
    () => authority.publish({ requireRelease: false }),
    /requires real release authority/u,
  );
});

test('public channel requires exact preview tag and observes unchanged latest, never repairs tags', () => {
  const before = { latest: '0.37.0', 'browser-preview': '0.37.0-rc.1' };
  const after = { latest: '0.37.0', 'browser-preview': authority.POLICIES.core.version };
  assert.equal(
    authority.validateChannel(after, before, authority.POLICIES.core.version, true)
      .latest_unchanged,
    true,
  );
  assert.throws(
    () => authority.validateChannel(before, before, authority.POLICIES.core.version, true),
    /dist-tag/u,
  );
  assert.throws(
    () =>
      authority.validateChannel(
        { ...after, latest: authority.POLICIES.core.version },
        before,
        authority.POLICIES.core.version,
        true,
      ),
    /latest/u,
  );
  assert.throws(
    () =>
      authority.validateChannel(
        { latest: '0.37.0' },
        before,
        authority.POLICIES.core.version,
        true,
      ),
    /dist-tag/u,
  );
  for (const bad of [
    null,
    [],
    {},
    { latest: 'file:local' },
    { latest: '0.37.0', 'browser-preview': 1 },
  ])
    assert.throws(() => authority.validateDistTags(bad));
});
