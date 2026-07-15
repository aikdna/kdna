#!/usr/bin/env node
'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyAuditedNpm } = require('./npm-tooling');
const { validatePackReport } = require('./release-evidence');
const { canonicalTag } = require('./release-policy');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    shell: false,
    ...options,
  });
  if (result.error) fail(`${command} failed: ${result.error.message}`);
  if (!Number.isInteger(result.status)) fail(`${command} did not return an integer exit status`);
  if (result.status !== 0) {
    fail(`${command} exited ${String(result.status)}: ${(result.stderr || '').trim()}`);
  }
  return result.stdout;
}

function parseArguments(argv) {
  const evidenceIndex = argv.indexOf('--evidence');
  const artifactIndex = argv.indexOf('--artifact');
  if (
    evidenceIndex < 0 ||
    artifactIndex < 0 ||
    !argv[evidenceIndex + 1] ||
    !argv[artifactIndex + 1] ||
    argv.length !== 4
  ) {
    fail(
      'usage: prepare-release-artifact.js --evidence <outside-repo.json> --artifact <outside-repo.tgz>',
    );
  }
  return {
    evidencePath: path.resolve(argv[evidenceIndex + 1]),
    artifactPath: path.resolve(argv[artifactIndex + 1]),
  };
}

function resolveDestination(destination) {
  let existing = destination;
  const suffix = [];
  while (!fs.existsSync(existing)) {
    const parent = path.dirname(existing);
    if (parent === existing) fail(`cannot resolve output destination ${destination}`);
    suffix.unshift(path.basename(existing));
    existing = parent;
  }
  return path.resolve(fs.realpathSync(existing), ...suffix);
}

function assertOutsideRepository(destination, label) {
  const resolvedRepository = fs.realpathSync(REPO_ROOT);
  const resolvedDestination = resolveDestination(destination);
  const relative = path.relative(resolvedRepository, resolvedDestination);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    fail(`${label} output must be outside the repository`);
  }
  return resolvedDestination;
}

function treeStatus() {
  return run('git', ['status', '--porcelain=v1', '--untracked-files=all']).trim();
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const resolvedEvidence = assertOutsideRepository(options.evidencePath, 'release evidence');
  const resolvedArtifact = assertOutsideRepository(options.artifactPath, 'release artifact');
  if (resolvedEvidence === resolvedArtifact) fail('evidence and artifact paths must differ');
  fs.mkdirSync(path.dirname(options.evidencePath), { recursive: true });
  fs.mkdirSync(path.dirname(options.artifactPath), { recursive: true });

  verifyAuditedNpm();
  if (treeStatus()) fail('worktree must be clean before packing');
  const pkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const source = {
    ref: process.env.GITHUB_REF,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim(),
  };
  if (process.env.GITHUB_SHA !== source.commit) fail('GITHUB_SHA must equal the packed commit');
  const tag = canonicalTag(pkg.version);
  const tagCommit = run('git', ['rev-parse', `${tag}^{commit}`]).trim();
  if (tagCommit !== source.commit) fail('the compatibility version tag must resolve to the packed commit');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-release-pack-'));
  let complete = false;
  let evidenceCreated = false;
  let artifactCreated = false;
  try {
    const reportText = run(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', temp],
      { cwd: PACKAGE_ROOT },
    );
    const reports = JSON.parse(reportText);
    if (!Array.isArray(reports) || reports.length !== 1 || !reports[0].filename) {
      fail('npm pack did not report exactly one filename');
    }
    const tarballPath = path.join(temp, reports[0].filename);
    const tarball = fs.readFileSync(tarballPath);
    const evidence = validatePackReport({ reportText, tarball, pkg, source });
    fs.copyFileSync(tarballPath, options.artifactPath, fs.constants.COPYFILE_EXCL);
    artifactCreated = true;
    if (!fs.readFileSync(options.artifactPath).equals(tarball)) {
      fail('retained release artifact differs from the verified tarball');
    }
    fs.writeFileSync(options.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600,
    });
    evidenceCreated = true;
    if (treeStatus()) fail('packing changed the repository');
    complete = true;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
    if (!complete) {
      if (evidenceCreated) fs.rmSync(options.evidencePath, { force: true });
      if (artifactCreated) fs.rmSync(options.artifactPath, { force: true });
    }
  }
  console.log(
    `Compatibility release evidence written to ${options.evidencePath}; exact artifact retained at ${options.artifactPath}`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility release evidence rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { assertOutsideRepository, parseArguments, resolveDestination };
