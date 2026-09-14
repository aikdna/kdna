'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  TRUSTED_GIT,
  cleanGitEnvironment,
  parseTarFiles,
  resolveTrustedNpmInvocation,
  runNpm,
} = require('./core-release-authority');

const REPOSITORIES = Object.freeze([
  'create-kdna-web-app',
  'kdna',
  'kdna-activation-server',
  'kdna-app-shared',
  'kdna-assets',
  'kdna-cli',
  'kdna-core-swift',
  'kdna-demo-web-viewer',
  'kdna-react',
  'kdna-remote-server',
  'kdna-skills',
  'kdna-studio-cli',
  'kdna-studio-core',
  'kdna-studio-swift',
  'kdna-web-client',
  'kdna-web-server',
]);
const { swiftDependencies } = require('./ecosystem-source-swift');
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const THIRD_PARTY_ARCHIVES = new Map([
  ['d884c7a2d8adb5568c1272d92b4f9c62707f4226cf9e7b22e7b957c7361e3c53', ['js-tokens', '4.0.0']],
  [
    '6a917895a313fc1d3c161c28fe39970c10bf2344cbb62e6eb7e9105c7ef43f62',
    ['@types/prop-types', '15.7.15'],
  ],
  ['c340ddf5ba598073a62de027ca879763bad9c7f237b41b57f2dbd0e9dcc23ca1', ['@types/react', '18.3.31']],
  ['b290bbb35b9e72c3ef84edbe041f28c4479c4d9ee79f555817b8caafe7ce4bba', ['npm', '11.17.0']],
]);
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonDigest = (value) => digest(Buffer.from(JSON.stringify(value)));
const sorted = (rows) => rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 60000,
    shell: false,
    detached: process.platform !== 'win32',
    ...options,
  });
  if (result.error && result.pid && process.platform !== 'win32') {
    try {
      process.kill(-result.pid, 'SIGKILL');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  assert.ok(
    !result.error && !result.signal && result.status === 0,
    `source command failed: ${path.basename(command)} ${args[0] || ''} (${result.error?.code || result.signal || result.status})`,
  );
  return result.stdout;
}
function gitRaw(root, args) {
  return run(TRUSTED_GIT, ['-C', root, ...args], { env: cleanGitEnvironment() });
}
function git(root, args) {
  return gitRaw(root, args).trim();
}
function safePath(relative) {
  assert.ok(
    typeof relative === 'string' &&
      relative.length > 0 &&
      !relative.includes('\\') &&
      !relative.includes('\0') &&
      !path.isAbsolute(relative) &&
      relative.split('/').every((part) => part && part !== '.' && part !== '..'),
    'unsafe source path',
  );
  return relative;
}
function readRegular(root, relative) {
  safePath(relative);
  let current = root;
  for (const [index, part] of relative.split('/').entries()) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current);
    assert.ok(!stat.isSymbolicLink(), `source path is a symlink: ${relative}`);
    assert.ok(
      index === relative.split('/').length - 1 ? stat.isFile() : stat.isDirectory(),
      `source path is not regular: ${relative}`,
    );
  }
  return fs.readFileSync(current);
}
function verifyCheckout(root, record, self = false) {
  assert.ok(
    fs.lstatSync(root).isDirectory() && !fs.lstatSync(root).isSymbolicLink(),
    'source root is not a regular directory',
  );
  assert.equal(
    fs.realpathSync(root),
    fs.realpathSync(git(root, ['rev-parse', '--show-toplevel'])),
    'source root is not a repository root',
  );
  const head = git(root, ['rev-parse', 'HEAD']);
  const tree = git(root, ['rev-parse', 'HEAD^{tree}']);
  if (!self) {
    assert.equal(head, record.commit, 'selected source commit differs');
    assert.equal(tree, record.tree, 'selected source tree differs');
  }
  assert.equal(
    gitRaw(root, ['diff', '--cached', '--name-only', '-z', 'HEAD']),
    '',
    'source index differs from committed tree',
  );
  assert.equal(
    gitRaw(root, ['ls-files', '-z', '--others', '--exclude-standard']),
    '',
    'source contains untracked files',
  );
  const files = [];
  for (const entry of gitRaw(root, ['ls-tree', '-rz', '--full-tree', 'HEAD'])
    .split('\0')
    .filter(Boolean)) {
    const match = /^(100644|100755) blob ([a-f0-9]{40})\t(.+)$/su.exec(entry);
    assert.ok(match, 'source tree contains a link or non-file entry');
    const bytes = readRegular(root, match[3]);
    const actual = crypto
      .createHash('sha1')
      .update(`blob ${bytes.length}\0`)
      .update(bytes)
      .digest('hex');
    assert.equal(actual, match[2], `actual source bytes differ from Git blob: ${match[3]}`);
    const mode = fs.statSync(path.join(root, match[3])).mode;
    assert.equal(
      Boolean(mode & 0o111),
      match[1] === '100755',
      `source executable mode differs: ${match[3]}`,
    );
    files.push(match[3]);
  }
  return { head, tree, files: files.sort() };
}

function assertCheckoutAnchor(actual, initial) {
  assert.equal(actual.head, initial.head, 'source HEAD changed during gate execution');
  assert.equal(actual.tree, initial.tree, 'source tree changed during gate execution');
}

function inspectArchive(bytes) {
  const sha = digest(bytes);
  let name, version, members, format;
  if (THIRD_PARTY_ARCHIVES.has(sha)) {
    const result = JSON.parse(
      run(
        process.env.KDNA_PYTHON || 'python3',
        ['-I', path.join(__dirname, 'inspect-source-tar.py')],
        { input: bytes },
      ),
    );
    [name, version] = THIRD_PARTY_ARCHIVES.get(sha);
    assert.equal(result.name, name);
    assert.equal(result.version, version);
    members = result.members;
    format = 'bounded-standard-third-party-tar';
  } else {
    const files = parseTarFiles(bytes, { includeBytes: true });
    const manifest = files.find((file) => file.path === 'package.json');
    assert.ok(manifest, 'archive lacks package manifest');
    ({ name, version } = JSON.parse(manifest.bytes));
    members = files.map(({ bytes: content, ...file }) => file);
    format = 'strict-npm-tar';
  }
  assert.ok(
    typeof name === 'string' && typeof version === 'string',
    'archive package identity missing',
  );
  sorted(members);
  return {
    sha256: sha,
    integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`,
    bytes: bytes.length,
    name,
    version,
    format,
    member_count: members.length,
    members_sha256: jsonDigest(members),
    members,
  };
}

function declarations(root, files) {
  const manifests = [],
    dependencies = [],
    locks = [],
    archives = [],
    swift = [],
    registrations = [];
  for (const relative of files) {
    if (path.posix.basename(relative) === 'package.json') {
      const data = readRegular(root, relative);
      const manifest = JSON.parse(data);
      manifests.push({
        path: relative,
        name: manifest.name || null,
        version: manifest.version || null,
      });
      for (const section of SECTIONS)
        for (const [name, declared] of Object.entries(manifest[section] || {})) {
          if (name.startsWith('@aikdna/'))
            dependencies.push({ path: relative, section, name, declared });
        }
    }
    if (path.posix.basename(relative) === 'package-lock.json') {
      const bytes = readRegular(root, relative);
      const lock = JSON.parse(bytes);
      assert.ok(
        lock.packages && lock.lockfileVersion >= 2,
        'source requires a package-inventory lockfile',
      );
      const local = [];
      for (const [key, entry] of Object.entries(lock.packages))
        if (entry.resolved?.startsWith('file:') && entry.resolved.endsWith('.tgz')) {
          const target = path.posix.normalize(
            path.posix.join(path.posix.dirname(relative), entry.resolved.slice(5)),
          );
          safePath(target);
          assert.ok(files.includes(target), `lock archive is missing from source: ${target}`);
          const artifact = inspectArchive(readRegular(root, target));
          assert.equal(
            entry.integrity,
            artifact.integrity,
            `lock archive integrity differs: ${target}`,
          );
          assert.equal(entry.version, artifact.version, `lock archive version differs: ${target}`);
          assert.ok(
            key.endsWith(`node_modules/${artifact.name}`),
            `lock archive package name differs: ${target}`,
          );
          local.push({
            path: key,
            archive: target,
            name: artifact.name,
            version: artifact.version,
            integrity: artifact.integrity,
          });
        }
      locks.push({ path: relative, sha256: digest(bytes), local_archives: sorted(local) });
    }
    if (relative.endsWith('.tgz')) {
      const { members, ...artifact } = inspectArchive(readRegular(root, relative));
      archives.push({ path: relative, ...artifact });
    }
    if (path.posix.basename(relative) === 'Package.swift') {
      const bytes = readRegular(root, relative);
      if (relative.startsWith('retired/')) {
        swift.push({
          path: relative,
          sha256: digest(bytes),
          scope: 'retained-historical-manifest',
        });
      } else {
        swift.push({
          path: relative,
          sha256: digest(bytes),
          scope: 'current-source-manifest',
          dependencies: swiftDependencies(bytes.toString()),
        });
      }
    }
    if (path.posix.basename(relative) === 'leg-registry.json') {
      registrations.push({ path: relative, sha256: digest(readRegular(root, relative)) });
    }
  }
  return {
    manifests: sorted(manifests),
    dependencies: dependencies.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    locks: sorted(locks),
    archives: sorted(archives),
    swift: sorted(swift),
    registered_legs: sorted(registrations),
  };
}

function compareDeclarations(actual, expected) {
  for (const field of [
    'manifests',
    'dependencies',
    'locks',
    'archives',
    'swift',
    'registered_legs',
  ]) {
    assert.deepEqual(
      actual[field],
      expected[field],
      `source ${field} inventory differs in either direction`,
    );
  }
}

function compareMembers(archive, current) {
  const left = new Map(archive.map((file) => [file.path, file]));
  const right = new Map(current.map((file) => [file.path, file]));
  const differences = [];
  for (const relative of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const before = left.get(relative);
    const after = right.get(relative);
    if (before?.sha256 === after?.sha256 && before?.mode === after?.mode) continue;
    differences.push({
      path: relative,
      archive_sha256: before?.sha256 || null,
      source_pack_sha256: after?.sha256 || null,
      archive_mode: before?.mode || null,
      source_pack_mode: after?.mode || null,
      kind:
        /(?:^|\/)(?:README|SECURITY|CHANGELOG|CONTRIBUTING)(?:\.[^/]+)?$/iu.test(relative) ||
        /^docs\/.*\.(?:md|txt|rst)$/iu.test(relative)
          ? 'documentation'
          : 'package-content',
    });
  }
  return differences;
}

function packSource(root, directory, destination, invocation) {
  assert.ok(directory === '.' || safePath(directory));
  const target = directory === '.' ? root : path.join(root, directory);
  fs.mkdirSync(destination, { mode: 0o700 });
  const result = runNpm(
    invocation,
    ['pack', '--ignore-scripts', '--json', '--pack-destination', destination],
    { cwd: target, projectRoot: root, timeout: 120000 },
  );
  const receipt = JSON.parse(result.stdout);
  assert.ok(
    Array.isArray(receipt) && receipt.length === 1,
    'source pack must produce one real artifact',
  );
  const filename = safePath(receipt[0].filename);
  assert.equal(path.basename(filename), filename, 'source pack filename must be a basename');
  const artifact = inspectArchive(readRegular(destination, filename));
  assert.equal(
    artifact.member_count,
    receipt[0].entryCount,
    'actual packed member count differs from npm receipt',
  );
  assert.equal(
    artifact.integrity,
    receipt[0].integrity,
    'actual packed integrity differs from npm receipt',
  );
  return artifact;
}

module.exports = {
  REPOSITORIES,
  digest,
  jsonDigest,
  run,
  git,
  safePath,
  readRegular,
  verifyCheckout,
  assertCheckoutAnchor,
  inspectArchive,
  declarations,
  compareDeclarations,
  compareMembers,
  packSource,
  resolveTrustedNpmInvocation,
};
