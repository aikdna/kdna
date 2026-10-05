import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Hermetic fixtures: a fake repository root carrying a copy of the preflight plus a
// stub naming gate with a controllable exit code. Candidate tarballs are built with
// /usr/bin/tar directly (no npm, no network). The functional smoke install runs
// offline against local file: dependencies only.

const SCRIPT = fileURLToPath(new URL('./check-release-prerelease-readiness.mjs', import.meta.url));
const TAR = '/usr/bin/tar';
const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

function makeRepo({ namingExit = 0 } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-repo-'));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(root, 'scripts', 'check-release-prerelease-readiness.mjs'));
  fs.writeFileSync(
    path.join(root, 'scripts', 'check-post-cutover-naming.mjs'),
    `process.exit(${namingExit});\n`,
  );
  return root;
}

function buildPackage(
  dir,
  { name, version, deps = null, peerDeps = null, license = true, extraFiles = {} },
) {
  const pkgDir = path.join(dir, 'package');
  fs.mkdirSync(pkgDir, { recursive: true });
  const manifest = { name, version, main: 'index.js' };
  if (license) manifest.license = 'Apache-2.0';
  if (deps) manifest.dependencies = deps;
  if (peerDeps) manifest.peerDependencies = peerDeps;
  fs.writeFileSync(path.join(pkgDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(pkgDir, 'index.js'), 'module.exports = {};\n');
  if (license) fs.writeFileSync(path.join(pkgDir, 'LICENSE'), 'Apache License 2.0\n');
  for (const [rel, content] of Object.entries(extraFiles)) {
    const p = path.join(pkgDir, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
  }
  const tgz = path.join(dir, `${name.replace(/^@/u, '').replace(/\//gu, '-')}-${version}.tgz`);
  execFileSync(TAR, ['-czf', tgz, '-C', dir, 'package']);
  return tgz;
}

function writeHookedPackage(repo, rel, name, version) {
  fs.mkdirSync(path.join(repo, rel), { recursive: true });
  fs.writeFileSync(
    path.join(repo, rel, 'package.json'),
    JSON.stringify({ name, version }, null, 2) + '\n',
  );
}

function member(tgz, { name, version, memberCount = null, sha = null } = {}) {
  return {
    name,
    version,
    tgz,
    sha256: sha ?? sha256(tgz),
    member_count:
      memberCount ?? execFileSync(TAR, ['-tzf', tgz]).toString().split('\n').filter(Boolean).length,
  };
}

function writeCandidate(
  dir,
  members,
  {
    distTag = 'r2.7',
    peerPins = [],
    closure = [],
    label = 'fixture',
    format = 'kdna.prerelease-candidate/1',
  } = {},
) {
  const file = path.join(dir, 'candidate.json');
  fs.writeFileSync(
    file,
    JSON.stringify(
      { format, label, dist_tag: distTag, members, closure, peer_pins: peerPins },
      null,
      2,
    ) + '\n',
  );
  return file;
}

function runCli(repo, args) {
  const result = spawnSync(
    process.execPath,
    [path.join(repo, 'scripts', 'check-release-prerelease-readiness.mjs'), ...args],
    { encoding: 'utf8', timeout: 120000 },
  );
  let report = null;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    /* usage errors print no report */
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, report };
}

function hasFailure(report, id) {
  return report?.failures?.some((f) => f.id === id) ?? false;
}

// Shared valid pair fixture.
function buildValidPair({ coreExtra = {}, readExtra = {} } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-fixtures-'));
  const coreTgz = buildPackage(path.join(dir, 'core'), {
    name: '@aikdna/kdna-core',
    version: '9.9.9-rc.1',
    ...coreExtra,
  });
  const readTgz = buildPackage(path.join(dir, 'read'), {
    name: '@aikdna/kdna-read',
    version: '8.8.8-rc.1',
    peerDeps: { '@aikdna/kdna-core': '9.9.9-rc.1' },
    ...readExtra,
  });
  const core = member(coreTgz, { name: '@aikdna/kdna-core', version: '9.9.9-rc.1' });
  const read = member(readTgz, { name: '@aikdna/kdna-read', version: '8.8.8-rc.1' });
  return { dir, coreTgz, readTgz, core, read };
}

function validRepo() {
  const repo = makeRepo();
  writeHookedPackage(repo, 'packages/kdna-core', '@aikdna/kdna-core', '9.9.9-rc.1');
  writeHookedPackage(repo, 'packages/kdna-read', '@aikdna/kdna-read', '8.8.8-rc.1');
  return repo;
}

test('positive: valid prerelease pair passes, naming gate mandatory and bound, offline smoke loads both members', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const helperTgz = buildPackage(path.join(dir, 'helper'), {
    name: 'helper-lib',
    version: '1.2.3',
  });
  const closure = [
    { name: 'helper-lib', version: '1.2.3', tgz: helperTgz, sha256: sha256(helperTgz) },
  ];
  const candidate = writeCandidate(dir, [core, read], {
    peerPins: [{ package: '@aikdna/kdna-read', peer: '@aikdna/kdna-core', version: '9.9.9-rc.1' }],
    closure,
  });
  const run = runCli(repo, [
    '--package=packages/kdna-read',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=source399@review01',
  ]);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.report.exit_code, 0);
  const namingGate = run.report.checks.find((c) => c.id === 'naming_gate');
  assert.ok(namingGate);
  assert.equal(namingGate.detail.naming_bind, 'source399@review01');
  for (const field of [
    'naming_stdout',
    'runtime_git_head',
    'runtime_porcelain',
    'naming_script_sha256',
  ]) {
    assert.ok(field in namingGate.detail, field);
  }
  assert.ok(run.report.checks.some((c) => c.id === 'smoke_readback'));
  assert.match(run.report.naming_scope, /源坐标/u);
});

test('negative: tampered byte is rejected (MEMBER_SHA_MISMATCH)', () => {
  const repo = validRepo();
  const { dir, coreTgz, read } = buildValidPair();
  const goodSha = sha256(coreTgz);
  const bytes = fs.readFileSync(coreTgz);
  bytes[bytes.length - 1] ^= 0xff;
  fs.writeFileSync(coreTgz, bytes);
  const core = {
    name: '@aikdna/kdna-core',
    version: '9.9.9-rc.1',
    tgz: coreTgz,
    sha256: goodSha,
    member_count: null,
  };
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'MEMBER_SHA_MISMATCH'));
});

test('negative: changed peer pin is rejected (PEER_PIN_MISMATCH)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair({
    readExtra: { peerDeps: { '@aikdna/kdna-core': '7.7.7-rc.9' } },
  });
  const candidate = writeCandidate(dir, [core, read], {
    peerPins: [{ package: '@aikdna/kdna-read', peer: '@aikdna/kdna-core', version: '9.9.9-rc.1' }],
  });
  const run = runCli(repo, [
    '--package=packages/kdna-read',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'PEER_PIN_MISMATCH'));
});

test('negative: nested file: dependency is rejected (DEP_FILE_SPECIFIER_FORBIDDEN)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair({
    coreExtra: { deps: { ajv: 'file:../vendor/ajv.tgz' } },
  });
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'DEP_FILE_SPECIFIER_FORBIDDEN'));
});

test('negative: wrong declared SHA is rejected (MEMBER_SHA_MISMATCH)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  core.sha256 = '0'.repeat(64);
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'MEMBER_SHA_MISMATCH'));
});

test('negative: latest dist-tag is forbidden (DIST_TAG_LATEST_FORBIDDEN)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read], { distTag: 'latest' });
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'DIST_TAG_LATEST_FORBIDDEN'));
});

test('negative: missing license is rejected (LICENSE_MISSING)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair({ coreExtra: { license: false } });
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'LICENSE_MISSING'));
});

test('negative: stable version on the prerelease channel is rejected (CHANNEL_VERSION_NOT_PRERELEASE)', () => {
  const repo = makeRepo();
  writeHookedPackage(repo, 'packages/kdna-core', '@aikdna/kdna-core', '9.9.9');
  writeHookedPackage(repo, 'packages/kdna-read', '@aikdna/kdna-read', '8.8.8-rc.1');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-fixtures-'));
  const coreTgz = buildPackage(path.join(dir, 'core'), {
    name: '@aikdna/kdna-core',
    version: '9.9.9',
  });
  const readTgz = buildPackage(path.join(dir, 'read'), {
    name: '@aikdna/kdna-read',
    version: '8.8.8-rc.1',
  });
  const candidate = writeCandidate(dir, [
    member(coreTgz, { name: '@aikdna/kdna-core', version: '9.9.9' }),
    member(readTgz, { name: '@aikdna/kdna-read', version: '8.8.8-rc.1' }),
  ]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'CHANNEL_VERSION_NOT_PRERELEASE'));
});

test('negative: unexpected member (.env) is rejected (FORBIDDEN_MEMBER)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair({
    coreExtra: { extraFiles: { '.env': 'SECRET=1\n' } },
  });
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'FORBIDDEN_MEMBER'));
});

test('negative: member count mismatch is rejected (MEMBER_COUNT_MISMATCH)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  core.member_count = core.member_count + 1;
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'MEMBER_COUNT_MISMATCH'));
});

test('negative: empty --naming-bind is an overall failure (NAMING_BIND_MISSING)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'NAMING_BIND_MISSING'));
});

test('negative: absent --naming-bind is refused before any check (usage, exit 64)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
  ]);
  assert.equal(run.status, 64);
});

test('negative: non-zero naming gate is an overall failure (NAMING_CHECK_FAILED)', () => {
  const repo = makeRepo({ namingExit: 1 });
  writeHookedPackage(repo, 'packages/kdna-core', '@aikdna/kdna-core', '9.9.9-rc.1');
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read], {
    peerPins: [{ package: '@aikdna/kdna-read', peer: '@aikdna/kdna-core', version: '9.9.9-rc.1' }],
  });
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'NAMING_CHECK_FAILED'));
});

test('negative: missing closure tarball is rejected (MEMBER_TARBALL_MISSING)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read], {
    closure: [{ name: 'ajv', version: '8.20.0', tgz: path.join(dir, 'missing-ajv.tgz') }],
  });
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'MEMBER_TARBALL_MISSING'));
});

test('negative: candidate label mismatch is rejected (CANDIDATE_LABEL_MISMATCH)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read], { label: 'other-label' });
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'CANDIDATE_LABEL_MISMATCH'));
});

test('negative: invalid candidate format is rejected (CANDIDATE_FILE_INVALID)', () => {
  const repo = validRepo();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-fixtures-'));
  const file = path.join(dir, 'candidate.json');
  fs.writeFileSync(file, JSON.stringify({ format: 'wrong/0', members: [] }) + '\n');
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${file}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'CANDIDATE_FILE_INVALID'));
});

test('negative: semver-shaped --dist-tag is rejected (DIST_TAG_SEMVER_SHAPE_FORBIDDEN)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
    '--dist-tag=1.2.3',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'DIST_TAG_SEMVER_SHAPE_FORBIDDEN'));
});

test('negative: unknown flags are rejected (ARGUMENT_INVALID)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair();
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
    '--zzz=1',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'ARGUMENT_INVALID'));
});

test('negative: malformed candidate JSON yields a structured failure, not a crash (CANDIDATE_FILE_INVALID)', () => {
  const repo = validRepo();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-fixtures-'));
  const file = path.join(dir, 'candidate.json');
  fs.writeFileSync(file, '{ this is not json\n');
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${file}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'CANDIDATE_FILE_INVALID'));
});

test('negative: workspace: protocol dependency is rejected (DEP_FILE_SPECIFIER_FORBIDDEN)', () => {
  const repo = validRepo();
  const { dir, core, read } = buildValidPair({ coreExtra: { deps: { partner: 'workspace:*' } } });
  const candidate = writeCandidate(dir, [core, read]);
  const run = runCli(repo, [
    '--package=packages/kdna-core',
    '--label=fixture',
    `--candidate=${candidate}`,
    '--naming-bind=bind',
  ]);
  assert.equal(run.status, 1);
  assert.ok(hasFailure(run.report, 'DEP_FILE_SPECIFIER_FORBIDDEN'));
});
