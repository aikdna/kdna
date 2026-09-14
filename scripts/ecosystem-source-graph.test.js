'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { test } = require('node:test');
const {
  REPOSITORIES,
  run,
  git,
  readRegular,
  verifyCheckout,
  declarations,
  compareDeclarations,
  inspectArchive,
  compareMembers,
  assertCheckoutAnchor,
} = require('./ecosystem-source-graph');
const { validateInventory } = require('./ecosystem-source-gate');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-source-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, ['init', '--quiet']);
  fs.mkdirSync(path.join(root, 'app'));
  fs.writeFileSync(
    path.join(root, 'app/package.json'),
    JSON.stringify({
      name: '@aikdna/example',
      version: '1.0.0',
      dependencies: { '@aikdna/kdna-core': '1.0.0' },
    }),
  );
  git(root, ['add', '.']);
  git(root, [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '--quiet',
    '-m',
    'Synthetic source fixture',
  ]);
  const record = {
    commit: git(root, ['rev-parse', 'HEAD']),
    tree: git(root, ['rev-parse', 'HEAD^{tree}']),
  };
  return { root, record, file: path.join(root, 'app/package.json') };
}

test('exact source bytes and root identity do not depend on a repository directory name', (t) => {
  const f = fixture(t);
  const result = verifyCheckout(f.root, f.record);
  assert.equal(result.head, f.record.commit);
  assert.deepEqual(result.files, ['app/package.json']);
});
for (const flag of ['--assume-unchanged', '--skip-worktree']) {
  test(`source byte verification rejects hidden modifications under ${flag}`, (t) => {
    const f = fixture(t);
    git(f.root, ['update-index', flag, 'app/package.json']);
    fs.appendFileSync(f.file, '\n');
    assert.equal(git(f.root, ['diff', '--name-only']), '');
    assert.throws(() => verifyCheckout(f.root, f.record), /actual source bytes differ/u);
  });
}
for (const variant of ['leaf', 'parent']) {
  test(`source byte verification rejects identical-byte ${variant} symlink`, (t) => {
    const f = fixture(t);
    git(f.root, ['update-index', '--assume-unchanged', 'app/package.json']);
    if (variant === 'leaf') {
      fs.renameSync(f.file, path.join(f.root, '.git/manifest'));
      fs.symlinkSync('../.git/manifest', f.file);
    } else {
      fs.renameSync(path.join(f.root, 'app'), path.join(f.root, '.git/app'));
      fs.symlinkSync('.git/app', path.join(f.root, 'app'));
    }
    assert.throws(() => readRegular(f.root, 'app/package.json'), /symlink/u);
    assert.throws(() => verifyCheckout(f.root, f.record), /symlink|untracked/u);
  });
}
for (const variant of ['commit', 'tree']) {
  test(`source checkout rejects changed ${variant} pin`, (t) => {
    const f = fixture(t);
    f.record[variant] = 'a'.repeat(40);
    assert.throws(() => verifyCheckout(f.root, f.record), /differs/u);
  });
}
test('source inventory rejects untracked manifests and newly staged changes', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, 'package.json'), '{}');
  assert.throws(() => verifyCheckout(f.root, f.record), /untracked/u);
  git(f.root, ['add', 'package.json']);
  assert.throws(() => verifyCheckout(f.root, f.record), /index differs/u);
});
for (const field of [
  'manifests',
  'dependencies',
  'locks',
  'archives',
  'swift',
  'registered_legs',
]) {
  test(`source ${field} comparison discovers additions and removals in both directions`, (t) => {
    const f = fixture(t);
    const original = declarations(f.root, ['app/package.json']);
    const changed = structuredClone(original);
    changed[field].push({ path: 'unexpected' });
    assert.throws(() => compareDeclarations(changed, original), /either direction/u);
    assert.throws(() => compareDeclarations(original, changed), /either direction/u);
  });
}
test('managed dependency identity, section, declaration and manifest path are all bound', (t) => {
  const f = fixture(t);
  const original = declarations(f.root, ['app/package.json']);
  for (const [key, value] of Object.entries({
    path: 'package.json',
    section: 'devDependencies',
    name: '@aikdna/other',
    declared: 'unreviewed-drift',
  })) {
    const changed = structuredClone(original);
    changed.dependencies[0][key] = value;
    assert.throws(() => compareDeclarations(changed, original), /dependencies inventory/u);
  }
});

function tar(entries) {
  const blocks = [];
  for (const { name, text, type = '0', mode = 0o644 } of entries) {
    const content = Buffer.from(text);
    const header = Buffer.alloc(512);
    header.write(name, 0);
    header.write(mode.toString(8).padStart(7, '0') + '\0', 100);
    header.write('0000000\0', 108);
    header.write('0000000\0', 116);
    header.write(content.length.toString(8).padStart(11, '0') + '\0', 124);
    header.write('00000000000\0', 136);
    header.fill(32, 148, 156);
    header.write(type, 156);
    header.write('ustar\0', 257);
    header.write('00', 263);
    const checksum = [...header].reduce((sum, byte) => sum + byte, 0);
    header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148);
    blocks.push(header, content, Buffer.alloc((512 - (content.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(blocks));
}
const manifest = {
  name: 'package/package.json',
  text: JSON.stringify({ name: '@aikdna/example', version: '1.0.0' }),
};
test('real bounded archive inspection reads package identity, members and content bytes', () => {
  const result = inspectArchive(
    tar([manifest, { name: 'package/index.js', text: 'module.exports = 1;' }]),
  );
  assert.equal(result.name, '@aikdna/example');
  assert.equal(result.version, '1.0.0');
  assert.equal(result.member_count, 2);
  assert.equal(result.format, 'strict-npm-tar');
});
test('independent standard tar reader handles retained third-party modes without extraction', () => {
  const before = fs.readdirSync(__dirname).sort();
  const result = JSON.parse(
    run(process.env.KDNA_PYTHON || 'python3', [path.join(__dirname, 'inspect-source-tar.py')], {
      input: tar([{ ...manifest, mode: 0o664 }]),
    }),
  );
  assert.equal(result.name, '@aikdna/example');
  assert.equal(result.members[0].mode, 0o664);
  assert.deepEqual(fs.readdirSync(__dirname).sort(), before);
});
for (const [label, extra] of [
  ['path escape', { name: 'package/../escape', text: 'x' }],
  ['duplicate member', manifest],
  ['symlink', { name: 'package/linked', text: '', type: '2' }],
  ['unknown nonstandard mode', { name: 'package/unknown', text: 'x', mode: 0o664 }],
]) {
  test(`archive inspection rejects ${label} without a generic third-party exemption`, () => {
    assert.throws(() => inspectArchive(tar([manifest, extra])));
  });
  if (label !== 'unknown nonstandard mode')
    test(`independent standard tar reader rejects ${label}`, () => {
      assert.throws(() =>
        run(process.env.KDNA_PYTHON || 'python3', [path.join(__dirname, 'inspect-source-tar.py')], {
          input: tar([manifest, extra]),
        }),
      );
    });
}
test('lock verifies real archive integrity, version, package identity and tracked path', (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'vendor'));
  const bytes = tar([manifest]);
  const info = inspectArchive(bytes);
  fs.writeFileSync(path.join(f.root, 'vendor/example.tgz'), bytes);
  const original = {
    lockfileVersion: 3,
    packages: {
      'node_modules/@aikdna/example': {
        version: info.version,
        resolved: 'file:vendor/example.tgz',
        integrity: info.integrity,
      },
    },
  };
  const files = ['package-lock.json', 'vendor/example.tgz'];
  const save = (lock) => fs.writeFileSync(path.join(f.root, files[0]), JSON.stringify(lock));
  save(original);
  assert.equal(declarations(f.root, files).locks[0].local_archives.length, 1);
  for (const [key, value] of Object.entries({
    integrity: 'sha512-invalid',
    version: '9.0.0',
    resolved: 'file:../escape.tgz',
  })) {
    const copy = structuredClone(original);
    copy.packages['node_modules/@aikdna/example'][key] = value;
    save(copy);
    assert.throws(() => declarations(f.root, files));
  }
  save(original);
  assert.throws(() => declarations(f.root, ['package-lock.json']), /missing from source/u);
  const wrong = structuredClone(original);
  wrong.packages['node_modules/@aikdna/other'] = wrong.packages['node_modules/@aikdna/example'];
  delete wrong.packages['node_modules/@aikdna/example'];
  save(wrong);
  assert.throws(() => declarations(f.root, files), /package name differs/u);
});
test('Swift local sibling dependency is rejected before any build', (t) => {
  const f = fixture(t);
  fs.writeFileSync(
    path.join(f.root, 'Package.swift'),
    'Package(dependencies: [.package(path: "../kdna-core-swift")])',
  );
  assert.throws(() => declarations(f.root, ['Package.swift']), /sibling path/u);
});
test('Swift moving branch and version range cannot replace a full source revision', (t) => {
  const f = fixture(t);
  for (const declaration of ['branch: "main"', 'from: "1.0.0"', 'revision: "abcdef"']) {
    fs.writeFileSync(
      path.join(f.root, 'Package.swift'),
      `Package(dependencies: [.package(url: "https://github.com/aikdna/kdna-core-swift.git", ${declaration})])`,
    );
    assert.throws(() => declarations(f.root, ['Package.swift']), /full revision/u);
  }
});
test('a binding JSON is package content even when stored below docs', () => {
  const before = [{ path: 'docs/binding.json', mode: 0o644, sha256: 'a' }];
  const after = [{ path: 'docs/binding.json', mode: 0o644, sha256: 'b' }];
  assert.equal(compareMembers(before, after)[0].kind, 'package-content');
});
test('a command failure, signal, and timeout never produce a passing result', () => {
  assert.throws(() => run(process.execPath, ['-e', 'process.exit(17)']), /17/u);
  assert.throws(
    () => run(process.execPath, ['-e', 'process.kill(process.pid, "SIGTERM")']),
    /SIGTERM/u,
  );
  assert.throws(
    () => run(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeout: 50 }),
    /ETIMEDOUT/u,
  );
});
test('exact repository inventory excludes missing, duplicate and undeclared inputs', () => {
  const inventory = {
    schema_version: '1.0.0',
    repositories: REPOSITORIES.map((name) => ({
      repository: `aikdna/${name}`,
      ...(name === 'kdna'
        ? { identity: 'current-control-checkout' }
        : { commit: 'a'.repeat(40), tree: 'b'.repeat(40), ci: { head: 'c'.repeat(40) } }),
      packs: [],
    })),
  };
  validateInventory(inventory);
  for (const change of [
    (rows) => rows.pop(),
    (rows) => rows.push(rows[0]),
    (rows) => {
      rows[0].repository = 'aikdna/unlisted';
    },
  ]) {
    const copy = structuredClone(inventory);
    change(copy.repositories);
    assert.throws(() => validateInventory(copy));
  }
});

test('raw NUL source cleanliness rejects a whitespace-only untracked or staged filename', (t) => {
  const f = fixture(t);
  fs.writeFileSync(path.join(f.root, ' '), '');
  assert.throws(() => verifyCheckout(f.root, f.record), /untracked/u);
  git(f.root, ['add', '--', ' ']);
  assert.throws(() => verifyCheckout(f.root, f.record), /index differs/u);
});
test('root self identity is anchored to the first checkout in one gate execution', (t) => {
  const f = fixture(t);
  const before = verifyCheckout(f.root, {}, true);
  assertCheckoutAnchor(verifyCheckout(f.root, {}, true), before);
  fs.appendFileSync(f.file, '\n');
  git(f.root, ['add', '.']);
  git(f.root, [
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '--quiet',
    '-m',
    'Synthetic changed source',
  ]);
  assert.throws(
    () => assertCheckoutAnchor(verifyCheckout(f.root, {}, true), before),
    /changed during gate/u,
  );
});
const swiftURL = 'https://github.com/aikdna/kdna-core-swift.git';
const swiftPin = 'a'.repeat(40);
for (const separator of [' ', '\n', '/* outer /* nested */ comment */', '// comment\n']) {
  test(`Swift token boundaries cannot hide a moving dependency: ${JSON.stringify(separator)}`, (t) => {
    const f = fixture(t);
    for (const argument of ['branch: "main"', 'path: "../sdk"', 'from: "1.0.0"']) {
      fs.writeFileSync(
        path.join(f.root, 'Package.swift'),
        `Package(dependencies: [.package${separator}(url: "${swiftURL}", ${argument})])`,
      );
      assert.throws(() => declarations(f.root, ['Package.swift']));
    }
    fs.writeFileSync(
      path.join(f.root, 'Package.swift'),
      `Package(dependencies: [.package${separator}(url: "${swiftURL}", revision: "${swiftPin}",)])`,
    );
    assert.deepEqual(declarations(f.root, ['Package.swift']).swift[0].dependencies, [
      { url: swiftURL, revision: swiftPin },
    ]);
  });
}
test('Swift comments and ordinary string contents do not invent dependency calls', (t) => {
  const f = fixture(t);
  fs.writeFileSync(
    path.join(f.root, 'Package.swift'),
    '/* .package(path: ignored) */ Package(name: ".package(fake)", dependencies: [])',
  );
  assert.deepEqual(declarations(f.root, ['Package.swift']).swift[0].dependencies, []);
});
for (const content of [
  'let factory = Package.Dependency.package; Package(dependencies: [])',
  'let dependencies = []; Package(dependencies: dependencies)',
  'Package(dependencies: makeDependencies())',
  'Package(dependencies: [.package(url: dynamicURL, revision: "' + swiftPin + '")])',
  'Package(dependencies: [.package(url: "' +
    swiftURL +
    '", revision: "' +
    swiftPin +
    '")].filter { true })',
])
  test('Swift unsupported dynamic dependencies fail closed: ' + content, (t) => {
    const f = fixture(t);
    fs.writeFileSync(path.join(f.root, 'Package.swift'), content);
    assert.throws(() => declarations(f.root, ['Package.swift']));
  });
test('retired Swift manifests retain exact hashes without claiming current dependencies', (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'retired'));
  fs.writeFileSync(
    path.join(f.root, 'retired/Package.swift'),
    'Package(dependencies: [.package(url: "old", from: "1.0.0")])',
  );
  const result = declarations(f.root, ['retired/Package.swift']).swift[0];
  assert.equal(result.scope, 'retained-historical-manifest');
  assert.equal(result.dependencies, undefined);
  assert.match(result.sha256, /^[a-f0-9]{64}$/u);
});

test('Swift escaped package identifiers cannot hide a branch dependency', (t) => {
  const f = fixture(t);
  fs.writeFileSync(
    path.join(f.root, 'Package.swift'),
    'Package(dependencies: [.`package`(url: "' + swiftURL + '", branch: "main")])',
  );
  assert.throws(() => declarations(f.root, ['Package.swift']), /full revision/u);
});
