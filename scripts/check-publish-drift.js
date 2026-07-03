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
  { repo: 'kdna-cli', pkg: '@aikdna/kdna-cli' },
  { repo: 'kdna-studio-cli', pkg: '@aikdna/kdna-studio-cli' },
  { repo: 'kdna-studio-core', pkg: '@aikdna/kdna-studio-core' },
  { repo: 'kdna-web-client', pkg: '@aikdna/kdna-web-client' },
  { repo: 'kdna-web-server', pkg: '@aikdna/kdna-web-server' },
  { repo: 'kdna-react', pkg: '@aikdna/kdna-react' },
  { repo: 'create-kdna-web-app', pkg: 'create-kdna-web-app' },
];

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
    check(`${pkg}: published (v${npmVersion})`, /^\d+\.\d+\.\d+$/.test(npmVersion), 'repo not cloned, only npm checked');
    continue;
  }

  check(
    `${pkg} repo=${repoVersion} npm=${npmVersion}`,
    repoVersion === npmVersion,
    `drift detected`,
  );
}

console.log(`\n${failures === 0 ? 'No drift — all packages aligned.' : `${failures} package(s) drifted.`}`);
process.exit(failures === 0 ? 0 : 1);