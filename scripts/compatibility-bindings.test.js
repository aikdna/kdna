'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
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
      row.source = commit;
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
