#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

let failures = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS: ${name}`);
    return true;
  }
  console.error(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  failures++;
  return false;
}

const REPOS_ROOT = path.resolve(__dirname, '..', '..');

const PACKAGES = [
  { repo: 'kdna/packages/kdna-core', pkg: '@aikdna/kdna-core' },
  { repo: 'kdna/packages/kdna-eval', pkg: '@aikdna/kdna-eval' },
  { repo: 'kdna-cli', pkg: '@aikdna/kdna-cli' },
  { repo: 'kdna-studio-cli', pkg: '@aikdna/kdna-studio-cli' },
  { repo: 'kdna-studio-core', pkg: '@aikdna/kdna-studio-core' },
  { repo: 'kdna-web-client', pkg: '@aikdna/kdna-web-client' },
  { repo: 'kdna-web-server', pkg: '@aikdna/kdna-web-server' },
  { repo: 'kdna-react', pkg: '@aikdna/kdna-react' },
  { repo: 'create-kdna-web-app', pkg: 'create-kdna-web-app' },
];

function compareSemver(a, b) {
  const left = String(a).split('.').map(Number);
  const right = String(b).split('.').map(Number);
  if (left.length !== 3 || right.length !== 3 || [...left, ...right].some(Number.isNaN)) {
    return null;
  }
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}

console.log('── npm publish drift check\n');

for (const { repo, pkg } of PACKAGES) {
  const repoPath = path.join(REPOS_ROOT, repo);
  const pkgJsonPath = path.join(repoPath, 'package.json');

  let repoVersion = null;
  if (fs.existsSync(pkgJsonPath)) {
    repoVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  }

  let npmVersion;
  try {
    npmVersion = execSync(`npm view ${pkg} version`, {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    npmVersion = null;
  }

  if (!npmVersion) {
    check(`${pkg}: published on npm`, false, 'npm view returned nothing');
    continue;
  }

  if (!repoVersion) {
    check(
      `${pkg}: published (v${npmVersion})`,
      /^\d+\.\d+\.\d+$/.test(npmVersion),
      'repo not cloned, only npm checked',
    );
    continue;
  }

  const comparison = compareSemver(repoVersion, npmVersion);
  if (comparison === 0) {
    check(`${pkg} repo=${repoVersion} npm=${npmVersion}`, true);
    continue;
  }

  if (comparison === 1) {
    const changelogPath = path.join(repoPath, 'CHANGELOG.md');
    const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
    check(
      `${pkg} repo=${repoVersion} npm=${npmVersion} (pending release)`,
      changelog.includes(repoVersion),
      `forward version requires a CHANGELOG entry for ${repoVersion}`,
    );
    continue;
  }

  check(
    `${pkg} repo=${repoVersion} npm=${npmVersion}`,
    false,
    comparison === -1 ? 'repository version is behind npm' : 'invalid semver',
  );
}

console.log(
  `\n${failures === 0 ? 'No drift — all packages aligned.' : `${failures} package(s) drifted.`}`,
);
process.exit(failures === 0 ? 0 : 1);
