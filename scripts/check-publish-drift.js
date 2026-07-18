#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { currentPublishedPackages } = require('./ecosystem-manifest');

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
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'ecosystem-manifest.json'), 'utf8'),
);
const PACKAGES = currentPublishedPackages(manifest).map(({ component, packageRecord }) => {
  const componentRoot = path.resolve(__dirname, '..', component.local_path || '.');
  return {
    repo: path.relative(
      REPOS_ROOT,
      path.dirname(path.join(componentRoot, packageRecord.package_json)),
    ),
    pkg: packageRecord.npm_package,
    expectedVersion: packageRecord.version,
  };
});

console.log('── npm publish drift check\n');

for (const { repo, pkg, expectedVersion } of PACKAGES) {
  const repoPath = path.join(REPOS_ROOT, repo);
  const pkgJsonPath = path.join(repoPath, 'package.json');

  let repoVersion = null;
  if (fs.existsSync(pkgJsonPath)) {
    repoVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  }

  let npmVersion;
  try {
    npmVersion = execFileSync('npm', ['view', pkg, 'version'], {
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

  check(
    `${pkg} manifest=${expectedVersion} npm=${npmVersion}`,
    npmVersion === expectedVersion,
    'registry latest must equal the manifest version',
  );
  if (repoVersion) {
    check(
      `${pkg} repo=${repoVersion} manifest=${expectedVersion}`,
      repoVersion === expectedVersion,
      'repository package version must equal the manifest version',
    );
  }
}

console.log(
  `\n${failures === 0 ? 'No drift — all packages aligned.' : `${failures} package(s) drifted.`}`,
);
process.exit(failures === 0 ? 0 : 1);
