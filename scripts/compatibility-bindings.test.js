'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync, spawnSync } = require('node:child_process');
const { test, before, after } = require('node:test');
const {
  EXPECTED_BINDINGS,
  bindingKey,
  findConsumers,
  reconcileBindings,
  evaluateConsumers,
  readCompatibilityBindings,
  validateEnvironmentBaselines,
} = require('./ecosystem-version-lock');
const accepted = require('./compatibility-bindings.json').bindings;
const { prepareCompatibilityRepos } = require('./prepare-compatibility-repos');

let temporary;
let control;
let repositories;
let records;
let manifests;
let baselines;
let verified;
function json(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
}
function git(root, args) {
  return execFileSync('/usr/bin/git', ['-C', root, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
function rootFor(repository) {
  return repository === 'kdna' ? control : path.join(repositories, repository);
}
function discover() {
  return evaluateConsumers(
    reconcileBindings(
      findConsumers(repositories, baselines, new Map(), manifests, { controlRoot: control })
        .consumers,
      baselines,
    ),
    verified,
  );
}
before(() => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'compatibility-binding-tests-'));
  repositories = path.join(temporary, 'repositories');
  control = path.join(temporary, 'arbitrary-control-directory');
  fs.mkdirSync(repositories);
  records = accepted.map((row) => ({ ...row }));
  manifests = new Map();
  baselines = new Map(records.map((row) => [row.packageName, '999.0.0']));
  const grouped = new Map();
  for (const row of records) {
    const file = path.join(rootFor(row.repository), row.manifest);
    const pkg = grouped.get(file) || { name: row.repository, version: '1.0.0' };
    pkg[row.section] ||= {};
    pkg[row.section][row.packageName] = row.declared;
    grouped.set(file, pkg);
    manifests.set(row.repository, [
      ...new Set([...(manifests.get(row.repository) || []), row.manifest]),
    ]);
  }
  for (const [file, pkg] of grouped) json(file, pkg);
  const components = [];
  for (const repository of [...new Set(records.map((row) => row.repository))]) {
    const root = rootFor(repository);
    git(root, ['init', '--quiet']);
    git(root, ['config', 'user.name', 'Synthetic Test Fixture']);
    git(root, ['config', 'user.email', 'fixture@example.test']);
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '-m', 'Create synthetic dependency fixture']);
    const commit = git(root, ['rev-parse', 'HEAD']);
    components.push({ repository: `aikdna/${repository}`, source_commit: commit, packages: [] });
    for (const row of records.filter((row) => row.repository === repository)) {
      if (row.source_manifest_blob) {
        row.source_manifest_blob = git(root, ['rev-parse', `${commit}:${row.manifest}`]);
      } else {
        row.source = commit;
      }
      row.manifest_sha256 = createHash('sha256')
        .update(fs.readFileSync(path.join(root, row.manifest)))
        .digest('hex');
    }
  }
  for (const repository of [
    'kdna-core-swift',
    'kdna-app-shared',
    'kdna-studio-swift',
    'kdna-vscode',
  ]) {
    const root = rootFor(repository);
    fs.mkdirSync(root);
    fs.writeFileSync(path.join(root, 'README.md'), 'Synthetic compatibility fixture.\n');
    git(root, ['init', '--quiet']);
    git(root, ['config', 'user.name', 'Synthetic Test Fixture']);
    git(root, ['config', 'user.email', 'fixture@example.test']);
    git(root, ['add', '.']);
    git(root, ['commit', '--quiet', '-m', 'Create synthetic compatibility fixture']);
    components.push({
      repository: `aikdna/${repository}`,
      source_commit: git(root, ['rev-parse', 'HEAD']),
      packages: [],
    });
  }
  for (const component of components) {
    component.local_path =
      component.repository === 'aikdna/kdna' ? '.' : `../${component.repository.split('/').pop()}`;
  }
  components.find((component) => component.repository === 'aikdna/kdna').packages = [
    ...baselines.keys(),
  ].map((npm_package) => ({
    npm_package,
    package_json: 'package.json',
    version: '999.0.0',
    release_status: 'active',
    dependency_policy: 'frozen',
  }));
  json(path.join(control, 'ecosystem-manifest.json'), { schema_version: 2, components });
  json(path.join(control, 'scripts/compatibility-bindings.json'), {
    schema_version: '1.0.0',
    bindings: records,
  });
  verified = readCompatibilityBindings(control, repositories);
});
after(() => fs.rmSync(temporary, { recursive: true, force: true }));

test('all 35 accepted declarations have verified Git blob provenance and canonical root identity', () => {
  assert.equal(verified.size, 35);
  const consumers = discover();
  assert.equal(consumers.length, 35);
  assert.equal(consumers.filter((row) => !row.ok).length, 0);
  assert.equal(
    consumers.some((row) => row.repository === 'arbitrary-control-directory'),
    false,
  );
});

test('root blob provenance includes merged side history but rejects an unmerged branch', () => {
  const root = path.join(temporary, 'merged-root-history');
  fs.mkdirSync(root);
  git(root, ['init', '--quiet', '--initial-branch=main']);
  git(root, ['config', 'user.name', 'Synthetic Test Fixture']);
  git(root, ['config', 'user.email', 'fixture@example.test']);
  const file = path.join(root, 'package.json');
  json(file, { devDependencies: { '@aikdna/kdna-cli': '999.0.0' } });
  git(root, ['add', 'package.json']);
  git(root, ['commit', '--quiet', '-m', 'Create current synthetic declaration']);
  git(root, ['checkout', '--quiet', '-b', 'accepted']);
  json(file, { devDependencies: { '@aikdna/kdna-cli': '0.36.1' } });
  git(root, ['commit', '--quiet', '-am', 'Record accepted synthetic declaration']);
  const row = {
    repository: 'kdna',
    manifest: 'package.json',
    section: 'devDependencies',
    packageName: '@aikdna/kdna-cli',
    declared: '0.36.1',
    source_manifest_blob: git(root, ['rev-parse', 'HEAD:package.json']),
    manifest_sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  };
  git(root, ['checkout', '--quiet', 'main']);
  json(path.join(root, 'scripts/compatibility-bindings.json'), {
    schema_version: '1.0.0',
    bindings: [row],
  });
  json(path.join(root, 'ecosystem-manifest.json'), { components: [] });
  assert.throws(() => readCompatibilityBindings(root, repositories, [row]), /HEAD history/u);
  git(root, [
    'merge',
    '--quiet',
    '--no-ff',
    '-s',
    'ours',
    'accepted',
    '-m',
    'Merge accepted history',
  ]);
  assert.equal(readCompatibilityBindings(root, repositories, [row]).size, 1);
});

test('root blob provenance survives a rewritten commit in a fresh main-only clone', () => {
  const source = path.join(temporary, 'rebase-source');
  const cloned = path.join(temporary, 'rebase-main-only');
  fs.mkdirSync(source);
  git(source, ['init', '--quiet', '--initial-branch=main']);
  git(source, ['config', 'user.name', 'Synthetic Test Fixture']);
  git(source, ['config', 'user.email', 'fixture@example.test']);
  const rows = records.filter((row) => row.source_manifest_blob).map((row) => ({ ...row }));
  assert.equal(rows.length, 4);
  for (const row of rows) {
    const file = path.join(source, row.manifest);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.copyFileSync(path.join(control, row.manifest), file);
  }
  git(source, ['add', '.']);
  git(source, ['commit', '--quiet', '-m', 'Create accepted synthetic manifests']);
  const original = git(source, ['rev-parse', 'HEAD']);
  const tree = git(source, ['rev-parse', 'HEAD^{tree}']);
  git(source, ['commit', '--amend', '--quiet', '-m', 'Rebase synthetic manifests']);
  assert.notEqual(git(source, ['rev-parse', 'HEAD']), original);
  git(source, [
    'clone',
    '--no-local',
    '--no-tags',
    '--single-branch',
    '--branch',
    'main',
    source,
    cloned,
  ]);
  assert.equal(git(cloned, ['rev-parse', 'HEAD^{tree}']), tree);
  assert.throws(() => git(cloned, ['cat-file', '-e', original]));
  const file = path.join(cloned, 'scripts/compatibility-bindings.json');
  json(file, { schema_version: '1.0.0', bindings: rows });
  json(path.join(cloned, 'ecosystem-manifest.json'), { components: [] });
  assert.equal(readCompatibilityBindings(cloned, repositories, rows).size, 4);
  const acceptedDocument = fs.readFileSync(file);
  for (const mutate of [
    (changed) => (changed[0].source_manifest_blob = '0'.repeat(40)),
    (changed) => (changed[0].declared = 'unreviewed-drift'),
    (changed) => (changed[0].manifest_sha256 = '0'.repeat(64)),
    (changed) => (changed[0].source = original),
  ]) {
    const changed = JSON.parse(acceptedDocument).bindings;
    mutate(changed);
    json(file, { schema_version: '1.0.0', bindings: changed });
    assert.throws(() => readCompatibilityBindings(cloned, repositories, rows));
  }
  const misplaced = rows.map((row) => ({ ...row }));
  misplaced[0].manifest = 'other/package.json';
  json(file, { schema_version: '1.0.0', bindings: misplaced });
  assert.throws(() => readCompatibilityBindings(cloned, repositories, misplaced), /exact path/u);
  const dangling = rows.map((row) => ({ ...row }));
  const danglingBytes = Buffer.from(
    '{"devDependencies":{"@aikdna/kdna-cli":"unreviewed-drift"}}\n',
  );
  dangling[0].source_manifest_blob = execFileSync(
    '/usr/bin/git',
    ['-C', cloned, 'hash-object', '-w', '--stdin'],
    { input: danglingBytes },
  )
    .toString()
    .trim();
  dangling[0].manifest_sha256 = createHash('sha256').update(danglingBytes).digest('hex');
  dangling[0].declared = 'unreviewed-drift';
  assert.equal(git(cloned, ['cat-file', '-t', dangling[0].source_manifest_blob]), 'blob');
  json(file, { schema_version: '1.0.0', bindings: dangling });
  assert.throws(() => readCompatibilityBindings(cloned, repositories, rows), /HEAD history/u);
});

for (const binding of EXPECTED_BINDINGS) {
  test(`rejects changed declaration ${binding.repository}/${binding.manifest}#${binding.section}/${binding.packageName}`, () => {
    const file = path.join(rootFor(binding.repository), binding.manifest);
    const original = fs.readFileSync(file);
    try {
      const pkg = JSON.parse(original);
      pkg[binding.section][binding.packageName] = 'unreviewed-drift';
      json(file, pkg);
      const failures = discover().filter((row) => !row.ok);
      assert.equal(failures.length, 1);
      assert.equal(bindingKey(failures[0]), bindingKey(binding));
    } finally {
      fs.writeFileSync(file, original);
    }
  });
}

test('formerly broad repository and root compatibility exceptions reject ranges and external inputs', () => {
  for (const repository of ['kdna-cli', 'kdna-assets', 'kdna-studio-core', 'kdna']) {
    const row = records.find((row) => row.repository === repository);
    for (const declared of [
      '*',
      '^0.21.0',
      '0.0.0',
      'file:/unreviewed/archive.tgz',
      'git+https://example.test/source.git',
    ]) {
      assert.equal(
        evaluateConsumers([{ ...row, declared, expected: '999.0.0' }], verified)[0].ok,
        false,
      );
    }
  }
});

for (const [name, mutate] of [
  ['missing record', (rows) => rows.pop()],
  ['duplicate record', (rows) => rows.push(rows[0])],
  ['transplanted section', (rows) => (rows[0].section = 'optionalDependencies')],
  ['wrong source commit', (rows) => (rows[0].source = '0'.repeat(40))],
  ['wrong manifest digest', (rows) => (rows[0].manifest_sha256 = '0'.repeat(64))],
  ['declaration not in accepted blob', (rows) => (rows[0].declared = 'unreviewed-drift')],
  ['unsafe manifest path', (rows) => (rows[0].manifest = '../package.json')],
]) {
  test(`rejects compatibility provenance ${name}`, () => {
    const file = path.join(control, 'scripts/compatibility-bindings.json');
    const original = fs.readFileSync(file);
    try {
      const document = JSON.parse(original);
      mutate(document.bindings);
      json(file, document);
      assert.throws(() => readCompatibilityBindings(control, repositories));
    } finally {
      fs.writeFileSync(file, original);
    }
  });
}

test('environment baseline cannot add authority or turn a changed binding green', () => {
  const policy = { baselines, candidateBaselines: new Map() };
  validateEnvironmentBaselines(policy, verified, { KDNA_CORE_BASELINE: '0.21.0' });
  assert.throws(() =>
    validateEnvironmentBaselines(policy, verified, { KDNA_CORE_BASELINE: 'unreviewed-drift' }),
  );
  const changed = { ...records[0], declared: 'unreviewed-drift', expected: '999.0.0' };
  assert.equal(evaluateConsumers([changed], verified)[0].ok, false);
});

test('compatibility source provenance rejects a changed checkout and modified accepted manifest', () => {
  const row = records.find((item) => item.repository === 'kdna-cli');
  const root = rootFor(row.repository);
  git(root, ['commit', '--allow-empty', '--quiet', '-m', 'Change synthetic checkout identity']);
  try {
    assert.throws(() => readCompatibilityBindings(control, repositories));
  } finally {
    git(root, ['checkout', '--detach', '--quiet', row.source]);
  }
  const file = path.join(root, row.manifest);
  const original = fs.readFileSync(file);
  try {
    fs.appendFileSync(file, '\n');
    assert.throws(() => readCompatibilityBindings(control, repositories));
  } finally {
    fs.writeFileSync(file, original);
  }
});

test('missing manifest and missing dependency still fail complete compatibility reconciliation', () => {
  const row = records[0];
  const file = path.join(rootFor(row.repository), row.manifest);
  const original = fs.readFileSync(file);
  try {
    fs.unlinkSync(file);
    assert.ok(discover().some((item) => !item.ok && item.manifest === row.manifest));
    const pkg = JSON.parse(original);
    delete pkg[row.section][row.packageName];
    json(file, pkg);
    assert.ok(discover().some((item) => !item.ok && bindingKey(item) === bindingKey(row)));
  } finally {
    fs.writeFileSync(file, original);
  }
});

test('compatibility preparation creates sixteen exact detached snapshots without changing inputs', () => {
  const before = new Map(
    fs.readdirSync(repositories).map((name) => {
      const root = path.join(repositories, name);
      return [
        name,
        [
          git(root, ['rev-parse', 'HEAD']),
          git(root, ['show-ref']),
          git(root, ['status', '--porcelain']),
        ],
      ];
    }),
  );
  const rows = prepareCompatibilityRepos(control, path.join(temporary, 'prepared'), repositories);
  assert.equal(rows.length, 16);
  for (const row of rows) {
    assert.equal(git(row.path, ['rev-parse', 'HEAD']), row.commit);
    assert.equal(git(row.path, ['branch', '--show-current']), '');
  }
  for (const [name, expected] of before) {
    const root = path.join(repositories, name);
    assert.deepEqual(
      [
        git(root, ['rev-parse', 'HEAD']),
        git(root, ['show-ref']),
        git(root, ['status', '--porcelain']),
      ],
      expected,
    );
  }
});

test('compatibility preparation refuses an existing destination and a path inside a source', () => {
  assert.throws(() =>
    prepareCompatibilityRepos(control, path.join(temporary, 'prepared'), repositories),
  );
  assert.throws(() =>
    prepareCompatibilityRepos(control, path.join(control, 'inside'), repositories),
  );
  assert.equal(fs.existsSync(path.join(control, 'inside')), false);
});

test('compatibility preparation refuses missing and symlinked input checkouts', () => {
  const source = rootFor('kdna-vscode');
  const moved = path.join(temporary, 'held-source');
  fs.renameSync(source, moved);
  try {
    assert.throws(() =>
      prepareCompatibilityRepos(control, path.join(temporary, 'missing-input'), repositories),
    );
    fs.symlinkSync(moved, source);
    assert.throws(() =>
      prepareCompatibilityRepos(control, path.join(temporary, 'symlink-input'), repositories),
    );
    fs.unlinkSync(source);
  } finally {
    fs.renameSync(moved, source);
  }
});

function strictCLI() {
  return spawnSync(
    process.execPath,
    [path.join(__dirname, 'ecosystem-version-lock.js'), '--strict'],
    {
      env: { ...process.env, KDNA_CONTROL_ROOT: control, KDNA_REPOS_ROOT: repositories },
      encoding: 'utf8',
      timeout: 30000,
    },
  );
}

for (const flag of ['assume-unchanged', 'skip-worktree']) {
  test(`actual strict CLI detects changed bytes hidden by ${flag}`, () => {
    const row = records.find((item) => item.repository === 'kdna-cli');
    const root = rootFor(row.repository);
    const file = path.join(root, row.manifest);
    const original = fs.readFileSync(file);
    const baseline = strictCLI();
    assert.equal(baseline.status, 0, baseline.stderr);
    git(root, ['update-index', `--${flag}`, row.manifest]);
    try {
      fs.appendFileSync(file, '\n');
      assert.equal(git(root, ['diff', '--quiet', row.source, '--', row.manifest]), '');
      const result = strictCLI();
      assert.equal(result.status, 2);
      assert.match(result.stderr, /actual compatibility manifest bytes differ/u);
    } finally {
      fs.writeFileSync(file, original);
      git(root, ['update-index', `--no-${flag}`, row.manifest]);
    }
  });
}

test('actual strict CLI rejects a manifest leaf symlink even when its bytes match', () => {
  const row = records.find((item) => item.repository === 'kdna-cli');
  const root = rootFor(row.repository);
  const file = path.join(root, row.manifest);
  const held = path.join(temporary, 'held-manifest.json');
  fs.renameSync(file, held);
  git(root, ['update-index', '--assume-unchanged', row.manifest]);
  try {
    fs.symlinkSync(held, file);
    const result = strictCLI();
    assert.notEqual(result.status, 0);
  } finally {
    fs.unlinkSync(file);
    fs.renameSync(held, file);
    git(root, ['update-index', '--no-assume-unchanged', row.manifest]);
  }
});

test('actual strict CLI rejects a symlinked manifest parent with identical file bytes', () => {
  const row = records.find((item) => item.repository === 'create-kdna-web-app');
  const root = rootFor(row.repository);
  const directory = path.dirname(path.join(root, row.manifest));
  const held = path.join(temporary, 'held-template-directory');
  fs.renameSync(directory, held);
  git(root, ['update-index', '--skip-worktree', row.manifest]);
  try {
    fs.symlinkSync(held, directory);
    const result = strictCLI();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /manifest path must not use symlinks/u);
  } finally {
    fs.unlinkSync(directory);
    fs.renameSync(held, directory);
    git(root, ['update-index', '--no-skip-worktree', row.manifest]);
  }
});
