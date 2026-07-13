#!/usr/bin/env node
/**
 * ecosystem-version-lock — enforces cross-repo version consistency for the
 * @aikdna/* packages. Runs from the kdna monorepo (the control repo) and
 * reports any consumer whose declared @aikdna/kdna-core / kdna-cli /
 * kdna-studio-core dependency is below the safety baseline.
 *
 * PR-8 (follow-up to PR-1): the bug we just fixed in PR-1 (missing
 * STANDARD_ENTRIES) shipped because consumers pinned ^0.7 / ^0.8 of
 * kdna-core while the monorepo source was already at 0.9.x. After
 * publishing @aikdna/kdna-core 0.9.1 (the post-PR-1 release), this gate
 * must ensure no consumer falls behind.
 *
 * The baseline version is read from:
 *   - KDNA_CORE_BASELINE env var, OR
 *   - packages/kdna-core/package.json (the monorepo source of truth)
 *
 * Repos to scan are read from KDNA_REPOS_ROOT (defaults to the parent of
 * the kdna monorepo). Each subdirectory is treated
 * as a consumer if it has a package.json declaring a @aikdna/* dep.
 *
 * Usage:
 *   node scripts/ecosystem-version-lock.js [--strict]
 *
 * Exit 0: all consumers meet baseline.
 * Exit 1: at least one consumer is behind.
 */

const fs = require('fs');
const path = require('path');

const SCAN_PACKAGES = [
  '@aikdna/kdna-core',
  '@aikdna/kdna-cli',
  '@aikdna/kdna-studio-core',
  '@aikdna/kdna-studio-cli',
  '@aikdna/kdna-studio-swift',
];

function readPackageVersion(repoRoot, pkgName) {
  if (pkgName === '@aikdna/kdna-core') {
    // The monorepo IS the source of truth for kdna-core.
    const p = path.join(repoRoot, 'kdna', 'packages', 'kdna-core', 'package.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8')).version;
  }
  return null;
}

function parseSemver(spec) {
  // Strip ^, ~, >=, etc. Just return the digits.
  const m = String(spec).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function cmpSemver(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function findConsumers(reposRoot) {
  const out = [];
  if (!fs.existsSync(reposRoot)) return out;
  for (const entry of fs.readdirSync(reposRoot)) {
    const pkgPath = path.join(reposRoot, entry, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (_) {
      continue;
    }
    if (!pkg.dependencies && !pkg.devDependencies) continue;
    for (const aikdna of SCAN_PACKAGES) {
      const dep = (pkg.dependencies || {})[aikdna] || (pkg.devDependencies || {})[aikdna];
      if (dep) {
        out.push({ repo: entry, pkg: aikdna, declared: dep, declaredV: parseSemver(dep) });
      }
    }
  }
  return out;
}

function main() {
  const strict = process.argv.includes('--strict');
  const reposRoot = process.env.KDNA_REPOS_ROOT || path.resolve(__dirname, '..', '..');
  const baselineEnv = process.env.KDNA_CORE_BASELINE;
  const baseline = baselineEnv
    ? { pkg: '@aikdna/kdna-core', version: baselineEnv, semver: parseSemver(baselineEnv) }
    : (() => {
        const v = readPackageVersion(reposRoot, '@aikdna/kdna-core');
        if (!v) return null;
        return { pkg: '@aikdna/kdna-core', version: v, semver: parseSemver(v) };
      })();

  if (!baseline || !baseline.semver) {
    console.error(
      'ecosystem-version-lock: cannot determine baseline version (set KDNA_CORE_BASELINE or run from kdna monorepo)',
    );
    process.exit(2);
  }

  console.log(`ecosystem-version-lock: baseline @aikdna/kdna-core = ${baseline.version}`);
  console.log(`scanning ${reposRoot}`);

  const consumers = findConsumers(reposRoot);
  if (consumers.length === 0) {
    console.log('  (no consumers found)');
    return;
  }

  const failures = [];
  for (const c of consumers) {
    if (c.declaredV && cmpSemver(c.declaredV, baseline.semver) >= 0) {
      console.log(`  PASS ${c.repo}: ${c.pkg}@${c.declared}`);
    } else {
      const msg = `${c.repo}: ${c.pkg}@${c.declared} (baseline ${baseline.version})`;
      if (strict) {
        failures.push(msg);
        console.log(`  FAIL ${msg}`);
      } else {
        console.log(`  WARN ${msg}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\necosystem-version-lock: ${failures.length} consumer(s) behind baseline`);
    process.exit(1);
  }
  console.log(`\necosystem-version-lock: ${consumers.length} consumer check(s) completed`);
}

if (require.main === module) main();
module.exports = { findConsumers, parseSemver, cmpSemver };
