#!/usr/bin/env node
// Prerelease-candidate release preflight (local-only; added under Owner ruling "(ii) fix the repository release path").
//
// Scope: this is the repository's own preflight for PRERELEASE candidates. It does not
// replace or modify the stable release path (`check-release-readiness.js`,
// `core-release-authority.js`); it deliberately does not import it (stable path has
// git/gh/network dependencies; this check must run fully local and offline).
//
// Frozen hard requirements (joint design review, 2026-10-05):
//   N1. The naming step is MANDATORY: a missing `--naming-bind` or a non-zero naming
//       exit is an OVERALL FAILURE. The naming step must never be skipped.
//   N2. Scope sentence: 命名门槛覆盖源坐标（经 live 仓原样检查），非 tarball 字节。 /
//       "The naming gate covers source coordinates (checked as-is via the live
//       repository), not tarball bytes." This sentence must appear in the output.
//
// Usage:
//   node scripts/check-release-prerelease-readiness.mjs \
//     --package=packages/kdna-read --label=read \
//     --candidate=<candidate.json> --naming-bind=<source-coordinate-string> \
//     [--dist-tag=<tag>] [--out=<report.json>] [--sandbox=<dir>]
//
// Candidate file format: kdna.prerelease-candidate/1 (see docs/release-prerelease-candidate.md).
// Exit codes: 0 all checks passed; non-zero = overall failure (first failing check code printed).

import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_PATH);
const ROOT = path.resolve(SCRIPT_DIR, '..');
const TAR = '/usr/bin/tar';

const checks = [];
const failures = [];
function record(id, ok, detail) {
  checks.push({ id, status: ok ? 'PASS' : 'FAIL', detail: detail ?? null });
  if (!ok) failures.push({ id, detail: detail ?? null });
}
function fail(id, detail) {
  record(id, false, detail);
  finish(1);
}
function finish(code) {
  const report = {
    format: 'kdna.prerelease-readiness-report/1',
    script: { path: SCRIPT_PATH, sha256: sha256File(SCRIPT_PATH) },
    naming_scope:
      '命名门槛覆盖源坐标（经 live 仓原样检查），非 tarball 字节 / source coordinates (checked as-is via the live repository), not tarball bytes',
    checks,
    failures,
    finished_at: new Date().toISOString(),
    exit_code: code,
  };
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (OUT_PATH) fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
  process.exit(code);
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}
function parseArgs(argv) {
  const out = {};
  const known = new Set([
    'package',
    'label',
    'candidate',
    'naming-bind',
    'dist-tag',
    'out',
    'sandbox',
  ]);
  for (const item of argv) {
    const m = /^--([a-z-]+)(?:=(.*))?$/u.exec(item);
    if (!m) fail('ARGUMENT_INVALID', { argument: item });
    if (!known.has(m[1])) fail('ARGUMENT_INVALID', { argument: item, reason: 'unknown flag' });
    out[m[1]] = m[2] ?? true;
  }
  return out;
}
function runFile(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.error ?? null,
  };
}
function readTarballJson(tgz, innerPath) {
  const result = runFile(TAR, ['-xOzf', tgz, innerPath]);
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}
function listTarball(tgz) {
  const result = runFile(TAR, ['-tzf', tgz]);
  if (result.status !== 0) return null;
  return result.stdout.split('\n').filter(Boolean);
}

let OUT_PATH = null;
const args = parseArgs(process.argv.slice(2));
if (!args.package || !args.label || !args.candidate || args['naming-bind'] === undefined) {
  console.error(
    'USAGE: check-release-prerelease-readiness.mjs --package=<relpath> --label=<label> --candidate=<file> --naming-bind=<source-coordinate> [--dist-tag=<tag>] [--out=<file>] [--sandbox=<dir>]',
  );
  process.exit(64);
}
if (args['naming-bind'] === true || String(args['naming-bind']).trim() === '') {
  fail(
    'NAMING_BIND_MISSING',
    '--naming-bind is required and must be non-empty (frozen requirement N1)',
  );
}
OUT_PATH = typeof args.out === 'string' ? args.out : null;

// --- Candidate file ---------------------------------------------------------
const candidatePath = path.resolve(args.candidate);
if (!fs.existsSync(candidatePath)) fail('CANDIDATE_FILE_MISSING', candidatePath);
let candidate;
try {
  candidate = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
} catch (error) {
  fail('CANDIDATE_FILE_INVALID', { error: String(error.message) });
}
if (
  candidate.format !== 'kdna.prerelease-candidate/1' ||
  !Array.isArray(candidate.members) ||
  candidate.members.length === 0
) {
  fail('CANDIDATE_FILE_INVALID', candidatePath);
}
record('candidate_file', true, {
  path: candidatePath,
  sha256: sha256File(candidatePath),
  label: candidate.label ?? null,
});
if (candidate.label && args.label !== candidate.label)
  fail('CANDIDATE_LABEL_MISMATCH', { expected: args.label, candidate: candidate.label });

// --- Channel policy (prerelease only; non-latest dist-tag required) ---------
const distTag = typeof args['dist-tag'] === 'string' ? args['dist-tag'] : candidate.dist_tag;
if (typeof distTag !== 'string' || distTag.trim() === '')
  fail('DIST_TAG_MISSING', 'a non-latest dist-tag must be stated in advance');
if (distTag === 'latest') fail('DIST_TAG_LATEST_FORBIDDEN', distTag);
if (/^v?\d+\.\d+\.\d+/u.test(distTag)) fail('DIST_TAG_SEMVER_SHAPE_FORBIDDEN', distTag);
if (candidate.dist_tag && args['dist-tag'] && args['dist-tag'] !== candidate.dist_tag)
  fail('DIST_TAG_MISMATCH', { argument: args['dist-tag'], candidate: candidate.dist_tag });
record('channel_policy', true, { dist_tag: distTag, channel: 'prerelease' });

// --- Hooked package binding -------------------------------------------------
const packageDir = path.resolve(ROOT, args.package);
const pkgJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
const hooked = candidate.members.find((m) => m.name === pkgJson.name);
if (!hooked) fail('HOOKED_PACKAGE_NOT_IN_CANDIDATE', { package: pkgJson.name });
if (hooked.version !== pkgJson.version)
  fail('HOOKED_PACKAGE_VERSION_MISMATCH', {
    package_json: pkgJson.version,
    candidate: hooked.version,
  });
if (!String(hooked.version).includes('-')) fail('CHANNEL_VERSION_NOT_PRERELEASE', hooked.version);
record('hooked_package_binding', true, { package: pkgJson.name, version: pkgJson.version });

// --- Member, closure, and peer checks --------------------------------------
const forbiddenMember =
  /(^|\/)(\.env|\.git|node_modules)(\/|$)|(^|\/)(id_rsa|\.npmrc)$|_authToken|BEGIN [A-Z ]*PRIVATE KEY/u;
for (const member of [...candidate.members, ...(candidate.closure ?? [])]) {
  if (typeof member.tgz !== 'string' || !fs.existsSync(member.tgz))
    fail('MEMBER_TARBALL_MISSING', member.name);
  const actual = sha256File(member.tgz);
  if (member.sha256 && actual !== member.sha256)
    fail('MEMBER_SHA_MISMATCH', { name: member.name, expected: member.sha256, actual });
  const inside = readTarballJson(member.tgz, 'package/package.json');
  if (!inside) fail('MEMBER_TARBALL_NOT_PACKAGE', member.name);
  if (member.name && inside.name !== member.name)
    fail('MEMBER_NAME_MISMATCH', { file: inside.name, declared: member.name });
  if (member.version && inside.version !== member.version)
    fail('MEMBER_VERSION_MISMATCH', { file: inside.version, declared: member.version });
  // The prerelease channel governs the publish unit (members); third-party closure
  // dependencies are stable packages and must not be forced onto the rc channel.
  if (candidate.members.includes(member) && !String(inside.version).includes('-')) {
    fail('CHANNEL_VERSION_NOT_PRERELEASE', { member: inside.name, version: inside.version });
  }
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dep, spec] of Object.entries(inside[field] ?? {})) {
      if (
        typeof spec === 'string' &&
        (spec.startsWith('file:') ||
          spec.startsWith('link:') ||
          spec.startsWith('workspace:') ||
          path.isAbsolute(spec))
      ) {
        fail('DEP_FILE_SPECIFIER_FORBIDDEN', { in: inside.name, dep, spec });
      }
    }
  }
  record('member', true, {
    name: inside.name,
    version: inside.version,
    sha256: actual,
    tgz: member.tgz,
  });
}
for (const member of candidate.members) {
  const list = listTarball(member.tgz);
  if (!list) fail('MEMBER_LIST_FAILED', member.name);
  for (const entry of list)
    if (forbiddenMember.test(entry)) fail('FORBIDDEN_MEMBER', { tgz: member.name, entry });
  if (member.member_count && list.length !== member.member_count)
    fail('MEMBER_COUNT_MISMATCH', {
      name: member.name,
      expected: member.member_count,
      actual: list.length,
    });
  const hasLicense =
    list.some((entry) => /(^|\/)LICENSE(\.|$)/u.test(entry)) ||
    /Apache|MIT|BSD|ISC/u.test(
      String(readTarballJson(member.tgz, 'package/package.json')?.license ?? ''),
    );
  if (!hasLicense) fail('LICENSE_MISSING', member.name);
}
for (const pin of candidate.peer_pins ?? []) {
  const holder = [...candidate.members, ...(candidate.closure ?? [])].find(
    (m) => m.name === pin.package && m.tgz,
  );
  const target = [...candidate.members, ...(candidate.closure ?? [])].find(
    (m) => m.name === pin.peer && m.tgz,
  );
  if (!holder || !target) fail('PEER_PIN_TARGET_MISSING', pin);
  const holderJson = readTarballJson(holder.tgz, 'package/package.json');
  const actualPin = holderJson?.peerDependencies?.[pin.peer];
  if (actualPin !== pin.version || target.version !== pin.version) {
    fail('PEER_PIN_MISMATCH', {
      package: pin.package,
      peer: pin.peer,
      expected: pin.version,
      actual: actualPin,
      sibling: target.version,
    });
  }
  record('peer_pin', true, { package: pin.package, peer: pin.peer, version: pin.version });
}

// --- Naming gate (mandatory; covers source coordinates, not tarball bytes) --
let runtimeGitHead = null;
let runtimePorcelain = null;
const headRun = runFile('/usr/bin/git', ['-C', ROOT, 'rev-parse', 'HEAD']);
if (headRun.status === 0) runtimeGitHead = headRun.stdout.trim();
const statusRun = runFile('/usr/bin/git', ['-C', ROOT, 'status', '--porcelain']);
if (statusRun.status === 0) {
  const lines = statusRun.stdout.split('\n').filter(Boolean);
  runtimePorcelain = {
    total: lines.length,
    untracked: lines.filter((line) => line.startsWith('??')).length,
  };
}
const naming = runFile(
  process.execPath,
  [path.join(ROOT, 'scripts', 'check-post-cutover-naming.mjs')],
  { cwd: ROOT, env: { ...process.env, PATH: process.env.PATH } },
);
if (naming.error || naming.status !== 0) {
  fail('NAMING_CHECK_FAILED', {
    exit: naming.status,
    stderr_tail: String(naming.stderr).slice(-400),
  });
}
record('naming_gate', true, {
  naming_bind: String(args['naming-bind']),
  exit: naming.status,
  note: 'source coordinates (live repository, as-is); not tarball bytes',
  naming_stdout: String(naming.stdout),
  runtime_git_head: runtimeGitHead,
  runtime_porcelain: runtimePorcelain,
  naming_script_sha256: sha256File(path.join(ROOT, 'scripts', 'check-post-cutover-naming.mjs')),
});

// --- Functional smoke (offline closure install; n2-sandbox method) ----------
const sandbox =
  typeof args.sandbox === 'string'
    ? path.resolve(args.sandbox)
    : fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-prerelease-smoke-'));
for (const sub of ['pkg', 'home', 'cache', 'tmp'])
  fs.mkdirSync(path.join(sandbox, sub), { recursive: true });
fs.writeFileSync(path.join(sandbox, 'userconfig'), '');
const dependencies = {};
const overrides = {};
for (const m of candidate.members) dependencies[m.name] = `file:${m.tgz}`;
for (const c of candidate.closure ?? []) dependencies[c.name] = `file:${c.tgz}`;
for (const m of candidate.members) overrides[m.name] = `$${m.name}`;
fs.writeFileSync(
  path.join(sandbox, 'pkg', 'package.json'),
  JSON.stringify(
    { name: 'kdna-prerelease-smoke', version: '1.0.0', private: true, dependencies, overrides },
    null,
    2,
  ) + '\n',
);
const npm = process.env.KDNA_PRERELEASE_NPM || 'npm';
const npmVersion = runFile(npm, ['--version']).stdout.trim();
const env = {
  ...process.env,
  HOME: path.join(sandbox, 'home'),
  npm_config_cache: path.join(sandbox, 'cache'),
  npm_config_tmp: path.join(sandbox, 'tmp'),
  npm_config_userconfig: path.join(sandbox, 'userconfig'),
  npm_config_offline: 'true',
  npm_config_ignore_scripts: 'true',
  npm_config_omit: 'optional',
  npm_config_audit: 'false',
  npm_config_fund: 'false',
};
const install = runFile(npm, ['install', '--no-audit', '--no-fund'], {
  cwd: path.join(sandbox, 'pkg'),
  env,
});
if (install.status !== 0)
  fail('SMOKE_INSTALL_FAILED', {
    npm: npmVersion,
    exit: install.status,
    stderr_tail: String(install.stderr).slice(-500),
  });
record('smoke_install', true, { npm: npmVersion, exit: install.status, sandbox });
for (const member of candidate.members) {
  const installed = path.join(
    sandbox,
    'pkg',
    'node_modules',
    ...member.name.split('/'),
    'package.json',
  );
  if (!fs.existsSync(installed)) fail('SMOKE_INSTALLED_MISSING', member.name);
  const fromTar = runFile(TAR, ['-xOzf', member.tgz, 'package/package.json']);
  if (fromTar.status !== 0 || fromTar.stdout !== fs.readFileSync(installed, 'utf8')) {
    fail('SMOKE_PACKAGE_JSON_MISMATCH', member.name);
  }
}
const loadCode =
  candidate.members.map((m) => `require(${JSON.stringify(m.name)})`).join(';') +
  `;console.log('load-ok');`;
const load = runFile(process.execPath, ['-e', loadCode], { cwd: path.join(sandbox, 'pkg') });
if (load.status !== 0)
  fail('SMOKE_LOAD_FAILED', { exit: load.status, stderr_tail: String(load.stderr).slice(-400) });
record('smoke_readback', true, { versions: load.stdout.trim(), sandbox });

finish(0);
