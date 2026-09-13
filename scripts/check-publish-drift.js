#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { publishableSourcePackages } = require('./ecosystem-manifest');

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

// Candidate-branch repositories are outside the current release scope:
// their package.json versions may lead the published registry version
// while their candidate branch is developed. See the execution control
// table (out-of-scope repo list).
const CANDIDATE_BRANCH_REPOS = new Set(['kdna-activation-server', 'kdna-remote-server']);

const REPOS_ROOT = path.resolve(__dirname, '..', '..');
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'ecosystem-manifest.json'), 'utf8'),
);
// Every record with an npm coordinate is compared on its published source
// coordinate. An `active` or `compatibility` record publishes its own version,
// while a `candidate` record keeps an unpublished source coordinate above the
// registry incumbent; that incumbent stays audited by the release-health
// policy (see release-health-policy.json and scripts/publish-health.mjs), so
// recording an unpublished prerelease candidate narrows nothing here.
const PACKAGES = publishableSourcePackages(manifest).map(({ component, packageRecord }) => {
  const componentRoot = path.resolve(__dirname, '..', component.local_path || '.');
  return {
    repo: path.relative(
      REPOS_ROOT,
      path.dirname(path.join(componentRoot, packageRecord.package_json)),
    ),
    pkg: packageRecord.npm_package,
    sourceVersion: packageRecord.version,
    publishedVersion: packageRecord.published_version || packageRecord.version,
    candidate: packageRecord.release_status === 'candidate',
  };
});

console.log('── npm publish drift check\n');

for (const { repo, pkg, sourceVersion, publishedVersion, candidate } of PACKAGES) {
  const repoPath = path.join(REPOS_ROOT, repo);
  const pkgJsonPath = path.join(repoPath, 'package.json');

  let repoVersion = null;
  if (fs.existsSync(pkgJsonPath)) {
    repoVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
  }

  if (candidate) {
    console.log(
      `  NOTE: ${pkg} candidate source=${sourceVersion} incumbent=${publishedVersion}` +
        ' — the incumbent registry coordinate is audited by the release-health policy',
    );
  } else {
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
      `${pkg} manifest=${publishedVersion} npm=${npmVersion}`,
      npmVersion === publishedVersion || CANDIDATE_BRANCH_REPOS.has(repo),
      CANDIDATE_BRANCH_REPOS.has(repo)
        ? 'registry latest may lag the manifest version for out-of-scope candidate branches'
        : 'registry latest must equal the manifest version',
    );
  }
  if (repoVersion) {
    check(
      `${pkg} repo=${repoVersion} manifest=${sourceVersion}`,
      repoVersion === sourceVersion || CANDIDATE_BRANCH_REPOS.has(repo),
      CANDIDATE_BRANCH_REPOS.has(repo)
        ? 'repository version may lead the manifest version for out-of-scope candidate branches'
        : 'repository package version must equal the manifest version',
    );
  }

  // Pre-publish narrative gate: the in-package README and its Chinese mirror
  // must not advertise a different "latest" version than the one being
  // published. A stale "latest is X" claim misleads installers.
  if (!candidate && !CANDIDATE_BRANCH_REPOS.has(repo)) {
    for (const readmeName of ['README.md', 'README.zh.md']) {
      const readmePath = path.join(repoPath, readmeName);
      if (!fs.existsSync(readmePath)) continue;
      const readmeText = fs.readFileSync(readmePath, 'utf8');
      const latestClaim = readmeText.match(
        /(?:registry\s+`?latest`?\s*(?:release)?\s*(?:is|为|是)?\s*`?|latest`?\s*(?:is|为|是)\s*`?)(\d+\.\d+\.\d+)/i,
      );
      if (latestClaim) {
        check(
          `${pkg} ${readmeName} latest-claim=${latestClaim[1]} manifest=${publishedVersion}`,
          latestClaim[1] === publishedVersion,
          `${readmeName} latest-version claim must equal the manifest version`,
        );
      }
    }
  }
}

console.log(
  `\n${failures === 0 ? 'No drift — all packages aligned.' : `${failures} package(s) drifted.`}`,
);
process.exit(failures === 0 ? 0 : 1);
