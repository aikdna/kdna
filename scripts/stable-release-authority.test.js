'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createAuthority, stableCoordinate } = require('./release-channel-authority.js');
const authority = require('./stable-release-authority.js');
const preview = require('./preview-release-authority.js');
const publisher = require('./stable-release-publisher.js');
const trusted = require('./core-release-authority.js');
const COMMIT = 'a'.repeat(40),
  TREE = 'b'.repeat(40),
  OTHER = 'c'.repeat(40),
  DIGEST = 'd'.repeat(64);
function fixture(unit = 'core') {
  const pkg = { ...authority.POLICIES[unit] };
  delete pkg.directory;
  if (unit === 'read')
    pkg.peerDependencies = { '@aikdna/kdna-core': authority.POLICIES.core.version };
  const notes =
    '## ' +
    (unit === 'core' ? 'Core ' : 'Read ') +
    pkg.version +
    '\n\nExact stable native source and independently approved retained artifact bytes.';
  const approval = {
    schema: 'kdna.stable-release-approval/1',
    unit,
    repository: 'aikdna/kdna',
    source_commit: COMMIT,
    source_tree: TREE,
    base_commit: authority.BASE_COMMIT,
    version: pkg.version,
    dist_tag: 'latest',
    artifact_sha256: DIGEST,
    notes_sha256: trusted.sha256(Buffer.from(notes)),
    companion:
      unit === 'core'
        ? null
        : {
            name: '@aikdna/kdna-core',
            version: authority.POLICIES.core.version,
            sha256: DIGEST,
            integrity: 'sha512-' + Buffer.alloc(64).toString('base64'),
            shasum: OTHER,
            gitHead: COMMIT,
          },
  };
  const tag = unit === 'core' ? pkg.version : 'read/' + pkg.version;
  const event = {
    action: 'published',
    repository: { full_name: 'aikdna/kdna' },
    release: {
      id: 123,
      published_at: '2026-10-11T00:00:00Z',
      draft: false,
      prerelease: false,
      tag_name: tag,
      html_url: 'https://github.com/aikdna/kdna/releases/tag/' + tag,
      target_commitish: COMMIT,
      body: '',
    },
  };
  const env = {
    GITHUB_ACTIONS: 'true',
    GITHUB_REPOSITORY: 'aikdna/kdna',
    GITHUB_SERVER_URL: 'https://github.com',
    GITHUB_EVENT_NAME: 'release',
    GITHUB_REF: 'refs/tags/' + tag,
    GITHUB_REF_NAME: tag,
    GITHUB_REF_TYPE: 'tag',
    GITHUB_SHA: COMMIT,
  };
  const observation = {
    commit: COMMIT,
    tree: TREE,
    tagCommit: COMMIT,
    clean: true,
    mainContainsSource: true,
    dco: true,
    baseCommit: authority.BASE_COMMIT,
  };
  const value = { unit, pkg, notes, approval, event, env, observation };
  body(value);
  return value;
}
function body(value) {
  value.event.release.body =
    value.notes +
    '\n\n```kdna-stable-release\n' +
    JSON.stringify(value.approval, null, 2) +
    '\n```';
}
function directory() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-stable-test-')));
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
test('Core and Read require their own exact final published event and stable approval', async (t) => {
  for (const unit of ['core', 'read']) {
    const value = fixture(unit),
      context = authority.validateContext(value);
    assert.equal(context.authorization, 'published-stable-release-event');
    assert.equal(context.tag, unit === 'core' ? '0.37.3' : 'read/0.12.0');
    assert.throws(() => preview.validateContext(value));
    for (const [name, change] of [
      ['prerelease', (f) => (f.event.release.prerelease = true)],
      ['draft', (f) => (f.event.release.draft = true)],
      ['edited event', (f) => (f.event.action = 'edited')],
      ['dispatch', (f) => (f.env.GITHUB_EVENT_NAME = 'workflow_dispatch')],
      ['not Actions', (f) => (f.env.GITHUB_ACTIONS = 'false')],
      ['wrong repo', (f) => (f.event.repository.full_name = 'other/kdna')],
      ['wrong server', (f) => (f.env.GITHUB_SERVER_URL = 'https://example.invalid')],
      ['preview tag', (f) => (f.event.release.tag_name = 'preview/' + unit + '/' + f.pkg.version)],
      ['alias tag', (f) => (f.event.release.tag_name = 'v' + f.pkg.version)],
      ['wrong ref', (f) => (f.env.GITHUB_REF = 'refs/heads/main')],
      ['wrong event SHA', (f) => (f.env.GITHUB_SHA = OTHER)],
      ['target branch', (f) => (f.event.release.target_commitish = 'main')],
      ['tree substituted', (f) => (f.observation.tree = OTHER)],
      ['dirty source', (f) => (f.observation.clean = false)],
      ['tag moved', (f) => (f.observation.tagCommit = OTHER)],
      ['off main', (f) => (f.observation.mainContainsSource = false)],
      ['no DCO', (f) => (f.observation.dco = false)],
      ['wrong baseline', (f) => (f.approval.base_commit = OTHER)],
      ['preview approval', (f) => (f.approval.schema = 'kdna.preview-release-approval/1')],
      ['preview channel', (f) => (f.approval.dist_tag = 'browser-preview')],
      ['bad digest', (f) => (f.approval.artifact_sha256 = 'bad')],
      ['unapproved bytes', (f) => (f.approval.artifact_sha256 = '0'.repeat(64))],
      ['unapproved source', (f) => (f.approval.source_commit = OTHER)],
      ['unknown approval', (f) => (f.approval.extra = true)],
      ['changed notes', (f) => (f.notes += '\nSubstituted.')],
      [
        'preview fence',
        (f) =>
          (f.event.release.body = f.event.release.body.replace(
            'kdna-stable-release',
            'kdna-preview-release',
          )),
      ],
      ['trailing text', (f) => (f.event.release.body += '\nNot approved.')],
      [
        'duplicate JSON key',
        (f) =>
          (f.event.release.body = f.event.release.body.replace(
            '"unit":',
            '"unit":"substituted","unit":',
          )),
      ],
      ['private package', (f) => (f.pkg.private = true)],
      ['local dependency', (f) => (f.pkg.dependencies = { other: 'file:../other' })],
      ['preview dependency', (f) => (f.pkg.dependencies = { other: '1.0.0-rc.1' })],
    ])
      await t.test(unit + ': ' + name, () => {
        const value = fixture(unit);
        change(value);
        assert.throws(() => authority.validateContext(value));
      });
  }
});
test('stable channel configuration rejects aliases, prereleases and unsafe numeric coordinates', () => {
  const configuration = {
    channel: 'stable',
    base_commit: authority.BASE_COMMIT,
    versions: { core: '0.37.2', read: '0.11.3' },
  };
  for (const version of [
    'v0.37.2',
    '0.37.2-rc.1',
    '00.37.2',
    '0.37',
    '0.37.2+metadata',
    '0.37.9007199254740992',
    null,
  ]) {
    assert.equal(stableCoordinate(version), false);
    assert.throws(() =>
      createAuthority({ ...configuration, versions: { ...configuration.versions, core: version } }),
    );
  }
  assert.throws(() => createAuthority({ ...configuration, channel: 'default' }));
  assert.throws(() => createAuthority({ ...configuration, base_commit: 'main' }));
  assert.throws(() => createAuthority({ ...configuration, ignored: true }));
});
test('Read requires the exact stable Core peer and approved same-source companion', () => {
  for (const change of [
    (f) => (f.pkg.peerDependencies['@aikdna/kdna-core'] = preview.POLICIES.core.version),
    (f) => (f.approval.companion.version = '0.37.1'),
    (f) => (f.approval.companion.gitHead = OTHER),
    (f) => (f.approval.companion.sha256 = 'bad'),
    (f) => (f.approval.companion.integrity = 'sha1-bad'),
    (f) => (f.approval.companion.extra = true),
    (f) => (f.approval.companion = null),
  ]) {
    const value = fixture('read');
    change(value);
    body(value);
    assert.throws(() => authority.validateContext(value));
  }
  const value = fixture();
  value.approval.companion = fixture('read').approval.companion;
  body(value);
  assert.throws(() => authority.validateContext(value));
});
test('stable source inspection binds real Git bytes, index, DCO range and stable notes', () => {
  const root = directory();
  try {
    git(root, ['init', '--quiet']);
    fs.writeFileSync(path.join(root, 'base.txt'), 'baseline\n');
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'fixture baseline']);
    const baseline = git(root, ['rev-parse', 'HEAD']);
    const local = createAuthority({
      channel: 'stable',
      base_commit: baseline,
      versions: { core: '0.37.3', read: '0.12.0' },
    });
    fs.mkdirSync(path.join(root, 'docs'));
    fs.mkdirSync(path.join(root, 'packages/kdna-core'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'packages/kdna-core/package.json'),
      JSON.stringify(fixture().pkg),
    );
    fs.writeFileSync(path.join(root, 'docs/release-stable-notes.md'), fixture().notes + '\n');
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'fixture stable']);
    const source = local.inspectSource('core', root);
    assert.equal(source.commit, git(root, ['rev-parse', 'HEAD']));
    assert.equal(source.tree, git(root, ['rev-parse', 'HEAD^{tree}']));
    assert.equal(source.dco_commit_count, 1);
    assert.equal(source.notes, fixture().notes);
    fs.appendFileSync(path.join(root, 'base.txt'), 'dirty\n');
    assert.throws(() => local.inspectSource('core', root), /clean/u);
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '--no-gpg-sign', '-m', 'missing DCO']);
    assert.throws(() => local.inspectSource('core', root), /DCO/u);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('stable duplicate publication requires matching name, version, integrity, shasum and exact source', () => {
  for (const unit of ['core', 'read']) {
    const expected = {
      ...authority.POLICIES[unit],
      integrity: 'sha512-fixture',
      shasum: OTHER,
      gitHead: COMMIT,
    };
    delete expected.directory;
    const data = {
      name: expected.name,
      version: expected.version,
      'dist.integrity': expected.integrity,
      'dist.shasum': expected.shasum,
      gitHead: expected.gitHead,
    };
    const result = (value) => ({ status: 0, stdout: JSON.stringify(value), stderr: '' });
    assert.deepEqual(authority.registryDecision(result(data), expected), {
      decision: 'skip-identical',
      shouldPublish: false,
    });
    for (const key of Object.keys(data))
      assert.throws(() =>
        authority.registryDecision(result({ ...data, [key]: 'substituted' }), expected),
      );
    for (const response of [
      { status: 1, stdout: '{}', stderr: '' },
      { status: 0, stdout: JSON.stringify(data), stderr: 'provider body' },
      { status: null, stdout: '', stderr: '' },
    ])
      assert.throws(() => authority.registryDecision(response, expected));
  }
});
test('stable latest transition binds the complete map before and after, including unknown tags', () => {
  const before = { latest: '0.37.1', 'browser-preview': '0.37.1-rc.browser.1', retained: '0.35.0' };
  const after = { ...before, latest: '0.37.2' };
  assert.equal(authority.validateChannel(before, before, '0.37.2').other_tags_unchanged, true);
  assert.equal(authority.validateChannel(after, before, '0.37.2', true).other_tags_unchanged, true);
  assert.equal(authority.validateChannel(after, after, '0.37.2', true).latest_after, '0.37.2');
  assert.throws(() => authority.validateChannel(after, before, '0.37.2'));
  assert.throws(() => authority.validateChannel(before, before, '0.37.2', true));
  for (const changed of [
    { ...after, retained: '0.34.0' },
    { ...after, added: '0.37.2' },
    { latest: after.latest, retained: '0.35.0' },
    { ...after, latest: '0.37.3' },
  ])
    assert.throws(() => authority.validateChannel(changed, before, '0.37.2', true));
});
test('stable publisher only sends approved retained bytes with exact stable identity and latest', async () => {
  const root = directory();
  try {
    const artifactPath = path.join(root, 'artifact.tgz'),
      manifestPath = path.join(root, 'manifest.json'),
      bytes = Buffer.from('retained fixture bytes');
    fs.writeFileSync(artifactPath, bytes);
    let calls = 0;
    const options = {
      libraryPath: path.join(root, 'audited-library.js'),
      artifactPath,
      manifestPath,
      artifactSha256: trusted.sha256(bytes),
      token: 'synthetic-token',
      library: {
        async publish(manifest, actual, settings) {
          calls++;
          assert.deepEqual(actual, bytes);
          assert.equal(settings.defaultTag, 'latest');
          assert.equal(settings.provenance, true);
          assert.equal(settings.registry, trusted.OFFICIAL_REGISTRY);
        },
      },
    };
    for (const unit of ['core', 'read']) {
      const manifest = { ...fixture(unit).pkg, gitHead: COMMIT };
      fs.writeFileSync(manifestPath, JSON.stringify(manifest));
      assert.equal(await publisher.publishVerified(options), true);
      for (const bad of [
        { ...manifest, version: preview.POLICIES[unit].version },
        { ...manifest, gitHead: 'main' },
        { ...manifest, publishConfig: { tag: 'other' } },
      ]) {
        fs.writeFileSync(manifestPath, JSON.stringify(bad));
        await assert.rejects(publisher.publishVerified(options));
      }
    }
    assert.equal(calls, 2);
    await assert.rejects(publisher.publishVerified({ ...options, artifactSha256: '0'.repeat(64) }));
    assert.equal(calls, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test('both stable jobs route prepare, smoke, collision guard, retained publication and public verification through shared authority', () => {
  const text = fs.readFileSync(path.join(__dirname, '../.github/workflows/publish.yml'), 'utf8');
  for (const [unit, next] of [
    ['core', 'eval'],
    ['read', 'compat'],
  ]) {
    const job = text.slice(
      text.indexOf('  publish-' + unit + ':'),
      text.indexOf('\n  publish-' + next + ':'),
    );
    let previous = -1;
    for (const command of ['check', 'prepare', 'smoke', 'guard', 'publish', 'verify-public']) {
      const index = job.indexOf('stable-release-authority.js ' + command + ' --unit ' + unit);
      assert.ok(index > previous, unit + ' ' + command);
      previous = index;
    }
    assert.match(job, /persist-credentials: false/u);
    assert.match(job, /fetch-depth: 0/u);
    assert.match(job, /github\.event\.release\.prerelease == false/u);
    assert.doesNotMatch(
      job,
      /npm view|trusted-npm-auth publish|npm publish|already published; skipping/u,
    );
  }
  assert.throws(
    () => authority.publish({ requireRelease: false }),
    /requires real release authority/u,
  );
});

test('stable registry visibility observation is bounded and never relaxes the complete tag map', () => {
  const expected = { name: '@aikdna/kdna-core', version: '0.37.2' };
  const before = { latest: '0.37.1', 'browser-preview': '0.37.1-rc.browser.1' };
  const after = { ...before, latest: expected.version };
  let sleeps = 0;
  const result = authority.awaitDistTag(null, expected, null, {
    attempts: 3,
    delayMs: 0,
    sleep: () => sleeps++,
    read: (attempt) => (attempt === 3 ? after : before),
  });
  assert.equal(result.attempt, 3);
  assert.equal(sleeps, 2);
  assert.equal(
    authority.validateChannel(result.tags, before, expected.version, true).other_tags_unchanged,
    true,
  );
  let reads = 0;
  assert.throws(
    () =>
      authority.awaitDistTag(null, expected, null, {
        attempts: 2,
        delayMs: 0,
        sleep: () => {},
        read: () => {
          reads++;
          throw new Error('synthetic provider body');
        },
      }),
    /bounded registry window/u,
  );
  assert.equal(reads, 2);
  assert.throws(() => authority.awaitDistTag(null, expected, null, { attempts: 14 }));
  const changed = authority.awaitDistTag(null, expected, null, {
    attempts: 1,
    read: () => ({ ...after, added: expected.version }),
  });
  assert.throws(() => authority.validateChannel(changed.tags, before, expected.version, true));
});

test(
  'stable build runs all original source gates and refuses each real gate failure',
  { skip: !process.env[trusted.TRUSTED_NPM_ENVIRONMENT] },
  async (t) => {
    const scripts = [
      'check-pack-contents.js',
      'check-public-surface.mjs',
      'check-post-cutover-naming.mjs',
    ];
    for (const rejected of [null, ...scripts])
      await t.test(rejected || 'all gates pass', () => {
        const root = directory(),
          source = path.join(root, 'source'),
          trace = path.join(root, 'gate-trace.jsonl');
        fs.mkdirSync(source);
        try {
          git(source, ['init', '--quiet']);
          fs.writeFileSync(path.join(source, 'base.txt'), 'baseline\n');
          git(source, ['add', '.']);
          git(source, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'gate fixture baseline']);
          const baseline = git(source, ['rev-parse', 'HEAD']);
          const local = createAuthority({
            channel: 'stable',
            base_commit: baseline,
            versions: { core: '0.37.3', read: '0.12.0' },
          });
          fs.mkdirSync(path.join(source, 'scripts'));
          fs.mkdirSync(path.join(source, 'docs'));
          fs.mkdirSync(path.join(source, 'packages/kdna-core'), { recursive: true });
          for (const script of scripts) {
            const code =
              "require('node:fs').appendFileSync(" +
              JSON.stringify(trace) +
              ',' +
              JSON.stringify(script + '\n') +
              ');process.exit(' +
              (script === rejected ? '1' : '0') +
              ');\n';
            fs.writeFileSync(
              path.join(source, 'scripts', script),
              script.endsWith('.mjs')
                ? "import {createRequire} from 'node:module'; const require=createRequire(import.meta.url);\n" +
                    code
                : code,
            );
          }
          const pkg = {
            ...fixture().pkg,
            main: 'index.js',
            files: ['index.js', 'LICENSE', 'NOTICE'],
          };
          for (const [file, bytes] of Object.entries({
            'package.json': JSON.stringify(pkg) + '\n',
            'index.js': 'module.exports={};\n',
            LICENSE: 'Apache License 2.0\n',
            NOTICE: 'Synthetic test package\n',
          }))
            fs.writeFileSync(path.join(source, 'packages/kdna-core', file), bytes);
          fs.writeFileSync(
            path.join(source, 'docs/release-stable-notes.md'),
            fixture().notes + '\n',
          );
          git(source, ['add', '.']);
          git(source, ['commit', '--quiet', '--no-gpg-sign', '-s', '-m', 'gate fixture source']);
          const evidencePath = path.join(root, 'evidence.json'),
            artifactPath = path.join(root, local.filename(local.POLICIES.core));
          const action = () =>
            local.build({
              unit: 'core',
              root: source,
              candidate: true,
              evidencePath,
              artifactPath,
            });
          if (rejected) {
            assert.throws(action, /Core (pack-content|public-surface|naming) gate/u);
            assert.equal(fs.existsSync(evidencePath), false);
            assert.equal(fs.existsSync(artifactPath), false);
          } else {
            const result = action();
            assert.deepEqual(result.build.source_gates, {
              pack_content: true,
              public_surface: true,
              naming: true,
            });
            assert.equal(
              local.readCandidate({
                unit: 'core',
                root: source,
                requireRelease: false,
                evidencePath,
                artifactPath,
              }).evidence.artifact.sha256,
              result.artifact.sha256,
            );
            // This package loads generically but intentionally omits remote-runtime.
            // The actual shared smoke entry must reach the retained Core boundary probe.
            assert.throws(
              () =>
                local.smoke({
                  unit: 'core',
                  root: source,
                  requireRelease: false,
                  evidencePath,
                  artifactPath,
                }),
              /Core installed artifact probe/u,
            );
            const tampered = structuredClone(result);
            delete tampered.build.source_gates.public_surface;
            fs.writeFileSync(evidencePath, JSON.stringify(tampered));
            assert.throws(
              () =>
                local.readCandidate({
                  unit: 'core',
                  root: source,
                  requireRelease: false,
                  evidencePath,
                  artifactPath,
                }),
              /build claims/u,
            );
          }
          assert.deepEqual(
            fs.readFileSync(trace, 'utf8').trim().split('\n'),
            rejected ? scripts.slice(0, scripts.indexOf(rejected) + 1) : scripts,
          );
        } finally {
          fs.rmSync(root, { recursive: true, force: true });
        }
      });
  },
);

function installedCoreFixture(root) {
  const directory = path.join(root, 'node_modules/@aikdna/kdna-core');
  fs.mkdirSync(path.join(directory, 'src/container'), { recursive: true });
  const manifest = {
    name: '@aikdna/kdna-core',
    version: '0.37.2',
    exports: {
      '.': { require: './index.cjs', import: './index.mjs' },
      './remote-runtime': {
        types: './remote-runtime.d.ts',
        require: './remote-runtime.cjs',
        import: './remote-runtime.mjs',
      },
      './package.json': './package.json',
    },
  };
  const files = {
    'package.json': JSON.stringify(manifest),
    'index.cjs': 'module.exports={};\n',
    'index.mjs': 'export const safe=true;\n',
    'remote-runtime.cjs': 'exports.loadRemoteRuntimeAsset=()=>{};\n',
    'remote-runtime.mjs': 'export function loadRemoteRuntimeAsset(){}\n',
    'remote-runtime.d.ts': 'export declare function loadRemoteRuntimeAsset():void;\n',
    'src/container/index.js': 'module.exports={};\n',
    'src/remote-runtime.js': 'module.exports={};\n',
  };
  for (const [file, bytes] of Object.entries(files))
    fs.writeFileSync(path.join(directory, file), bytes);
  return { directory, manifest };
}
test('installed Core boundary executes real CJS and ESM probes and rejects dangerous exports', async (t) => {
  const variants = [
    ['valid boundary', () => {}],
    ...['loadRemoteRuntimeAsset', 'loadRemoteRuntimeAssetForServer', 'loadAssetUnsafe'].map(
      (name) => [
        name,
        (f) =>
          fs.appendFileSync(
            path.join(f.directory, 'index.cjs'),
            'module.exports.' + name + '=()=>{};\n',
          ),
      ],
    ),
    [
      'extra remote CJS export',
      (f) =>
        fs.appendFileSync(path.join(f.directory, 'remote-runtime.cjs'), 'exports.extra=true;\n'),
    ],
    ...['loadRemoteRuntimeAsset', 'loadRemoteRuntimeAssetForServer', 'loadAssetUnsafe'].map(
      (name) => [
        'root ESM ' + name,
        (f) =>
          fs.appendFileSync(
            path.join(f.directory, 'index.mjs'),
            'export const ' + name + '=()=>{};\n',
          ),
      ],
    ),
    [
      'extra remote ESM export',
      (f) =>
        fs.appendFileSync(
          path.join(f.directory, 'remote-runtime.mjs'),
          'export const extra=true;\n',
        ),
    ],
    ['missing remote types', (f) => fs.unlinkSync(path.join(f.directory, 'remote-runtime.d.ts'))],
    ...['src/container/index.js', 'src/remote-runtime.js'].map((file) => [
      'exported ' + file,
      (f) => {
        f.manifest.exports['./' + file] = './' + file;
        fs.writeFileSync(path.join(f.directory, 'package.json'), JSON.stringify(f.manifest));
      },
    ]),
    [
      'wrong installed coordinate',
      (f) => {
        f.manifest.version = '0.37.1';
        fs.writeFileSync(path.join(f.directory, 'package.json'), JSON.stringify(f.manifest));
      },
    ],
  ];
  for (const [label, change] of variants)
    await t.test(label, () => {
      const root = directory();
      try {
        const fixture = installedCoreFixture(root);
        change(fixture);
        const action = () => trusted.verifyInstalledCoreBoundary({ cwd: root, version: '0.37.2' });
        if (label === 'valid boundary') assert.equal(action(), true);
        else assert.throws(action, /Core installed artifact probe/u);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    });
});
