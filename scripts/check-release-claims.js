#!/usr/bin/env node
'use strict';

/*
 * claims-lint: fail closed when README version/feature claims drift from
 * the npm registry truth and this repository's own CHANGELOG.
 *
 * Checks (P3-11):
 *  1. identity: the package README must name the exact source version its own
 *     package.json declares. It must NOT be asked to name the registry's
 *     current version as well: a packaged README ships inside an immutable
 *     tarball, while the registry's current version moves after that artifact
 *     is frozen, so requiring the split here would demand prose that is false
 *     the moment the release completes. The published/candidate split is a
 *     status-surface fact and stays asserted there - against the live registry
 *     by scripts/check-published-coordinates.mjs and inside the repository by
 *     the release matrix and the rendered block in README.md. The complementary
 *     rule, that a packaged README states no publication state at all, is
 *     enforced on both the source tree and the served tarball bytes by
 *     scripts/check-packaged-readme.mjs.
 *  2. "published incumbent X" claims must be registry-true, unless X is the
 *     current source version (a release PR in flight).
 *  3. version+feature claims (`X (some feature)`) on a published version must
 *     be backed by that version's CHANGELOG section.
 *
 * The registry is the only published truth. No private coordination files
 * are consulted, so this script is safe to run in public CI.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

const PACKAGES = [
  { dir: 'packages/kdna-core', readme: 'packages/kdna-core/README.md' },
  { dir: 'packages/kdna-conformance', readme: 'packages/kdna-conformance/README.md' },
  { dir: 'packages/kdna', readme: 'packages/kdna/README.md' },
  { dir: 'packages/kdna-eval', readme: 'packages/kdna-eval/README.md' },
];

const findings = [];

function fail(message) {
  findings.push(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function npmPublishedVersion(name) {
  const out = execFileSync('npm', ['view', name, 'version', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const parsed = JSON.parse(out);
  if (typeof parsed !== 'string' || !SEMVER_RE.test(parsed)) {
    throw new Error(`npm view ${name} version returned an unexpected shape`);
  }
  return parsed;
}

function escapeRegExpLiteral(value) {
  return value.replace(/\\/g, '\\\\').replace(/[.*+?^${}()|[\]]/g, '\\$&');
}

function changelogSection(changelog, version) {
  const escaped = escapeRegExpLiteral(version);
  const match = new RegExp(`^## ${escaped}(?: \\(\\d{4}-\\d{2}-\\d{2}\\))?\\s*$`, 'gmu').exec(
    changelog,
  );
  if (!match) return null;
  const rest = changelog.slice(match.index + match[0].length);
  const next = /^## \d+\.\d+\.\d+/gmu.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function checkPackage(entry) {
  const packageDir = path.join(REPO_ROOT, entry.dir);
  const packageJsonPath = path.join(packageDir, 'package.json');
  const readmePath = path.join(REPO_ROOT, entry.readme);
  if (!fs.existsSync(packageJsonPath)) return;
  const pkg = readJson(packageJsonPath);
  if (pkg.private === true) return;
  const published = npmPublishedVersion(pkg.name);
  const source = pkg.version;

  if (!fs.existsSync(readmePath)) {
    fail(`${pkg.name}: missing README ${entry.readme}`);
    return;
  }
  const readme = fs.readFileSync(readmePath, 'utf8');

  // 1. identity
  if (!readme.includes(source)) {
    fail(`${pkg.name}/${entry.readme}: does not name its own source version ${source}`);
  }

  // 2. "published incumbent X" claims must be registry-true (or the in-flight release)
  for (const match of readme.matchAll(
    /published\s+(?:incumbent|latest|release)[^0-9]{0,20}?(\d+\.\d+\.\d+)/giu,
  )) {
    const claimed = match[1];
    if (claimed !== published && claimed !== source) {
      fail(
        `${pkg.name}/${entry.readme}: claims published version ${claimed} but the registry serves ${published}`,
      );
    }
  }

  // 3. version+feature parenthetical claims must be backed by the CHANGELOG
  const changelogPath = path.join(packageDir, 'CHANGELOG.md');
  const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, 'utf8') : '';
  for (const match of readme.matchAll(/`(\d+\.\d+\.\d+)`\s*\(([^)]{4,80})\)/g)) {
    const [, claimedVersion, claim] = match;
    if (claimedVersion === source) continue; // in-flight release describes itself
    const section = changelogSection(changelog, claimedVersion);
    if (section === null) {
      fail(
        `${pkg.name}/${entry.readme}: feature claim on ${claimedVersion} ("${claim}") has no CHANGELOG section`,
      );
      continue;
    }
    const keywords = claim
      .toLowerCase()
      .split(/[^a-z0-9]+/u)
      .filter((token) => token.length >= 4 && !/^(with|from|that|this|the|and|for)$/.test(token));
    const backed = keywords.some((token) => section.toLowerCase().includes(token));
    if (!backed) {
      fail(
        `${pkg.name}/${entry.readme}: feature claim on ${claimedVersion} ("${claim}") is not backed by its CHANGELOG section`,
      );
    }
  }
}

function main() {
  for (const entry of PACKAGES) checkPackage(entry);
  if (findings.length > 0) {
    for (const finding of findings) console.error(`FAIL ${finding}`);
    console.error(`claims-lint failed: ${findings.length} finding(s)`);
    process.exit(1);
  }
  console.log(
    `claims-lint passed: ${PACKAGES.length} package surface(s) verified against the registry`,
  );
}

main();
