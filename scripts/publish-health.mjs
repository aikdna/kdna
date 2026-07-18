#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = path.join(repoRoot, 'release-health-policy.json');
const stableSemver = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const slsaPredicate = 'https://slsa.dev/provenance/v1';

function compareStableVersions(left, right) {
  const leftMatch = stableSemver.exec(left || '');
  const rightMatch = stableSemver.exec(right || '');
  if (!leftMatch || !rightMatch) throw new Error('stable SemVer comparison requires x.y.z');
  for (let index = 1; index <= 3; index += 1) {
    const leftPart = BigInt(leftMatch[index]);
    const rightPart = BigInt(rightMatch[index]);
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

export function expectedMainVersion(entry) {
  return entry.candidate_version || entry.version;
}

export function canonicalTag(policy, version) {
  if (!stableSemver.test(version)) {
    throw new Error(`invalid stable version: ${version}`);
  }
  if (policy.type === 'natural') return version;
  if (policy.type === 'prefix' && typeof policy.value === 'string' && policy.value) {
    return `${policy.value}${version}`;
  }
  throw new Error('canonical_tag must be natural or a non-empty prefix');
}

export function validatePolicy(policy) {
  if (policy?.schema_version !== '2' || !Array.isArray(policy.packages)) {
    throw new Error('release-health policy must use schema_version 2 and a packages array');
  }

  const packageNames = new Set();
  const sourcePaths = new Set();
  for (const entry of policy.packages) {
    for (const field of [
      'label',
      'repository',
      'package_json',
      'npm_package',
      'version',
      'canonical_tag',
    ]) {
      if (!entry[field]) throw new Error(`release-health entry is missing ${field}`);
    }
    if (!stableSemver.test(entry.version)) {
      throw new Error(`invalid expected version for ${entry.npm_package}`);
    }
    if (
      entry.candidate_version !== undefined &&
      (!stableSemver.test(entry.candidate_version) ||
        compareStableVersions(entry.candidate_version, entry.version) <= 0)
    ) {
      throw new Error(`invalid candidate version for ${entry.npm_package}`);
    }
    if (!/^aikdna\/[a-z0-9._-]+$/u.test(entry.repository)) {
      throw new Error(`invalid public repository coordinate: ${entry.repository}`);
    }
    if (entry.package_json.startsWith('/') || entry.package_json.split('/').includes('..')) {
      throw new Error(`package_json must stay inside its repository: ${entry.package_json}`);
    }
    if (packageNames.has(entry.npm_package)) {
      throw new Error(`duplicate npm package: ${entry.npm_package}`);
    }
    const sourceKey = `${entry.repository}:${entry.package_json}`;
    if (sourcePaths.has(sourceKey)) throw new Error(`duplicate package source: ${sourceKey}`);
    packageNames.add(entry.npm_package);
    sourcePaths.add(sourceKey);
    canonicalTag(entry.canonical_tag, '1.2.3');

    for (const [version, digest] of Object.entries(entry.legacy_release_tag_sha256 || {})) {
      if (!stableSemver.test(version) || !/^[a-f0-9]{64}$/u.test(digest)) {
        throw new Error(`invalid exact legacy release coordinate for ${entry.npm_package}`);
      }
    }
  }
  return policy;
}

export function candidateTags(entry, version) {
  return [canonicalTag(entry.canonical_tag, version)];
}

export function legacyTagDigest(entry, version) {
  return entry.legacy_release_tag_sha256?.[version] || null;
}

export function fetchHeaders(url) {
  const headers = {
    'User-Agent': 'aikdna-publish-health',
  };
  if (new URL(url).hostname === 'api.github.com') {
    headers.Accept = 'application/vnd.github+json';
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: fetchHeaders(url),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`request failed with HTTP ${response.status}`);
  return response.json();
}

function resolveTagCommit(repository, tag) {
  const output = execFileSync(
    'git',
    [
      'ls-remote',
      '--tags',
      `https://github.com/${repository}.git`,
      `refs/tags/${tag}`,
      `refs/tags/${tag}^{}`,
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20_000 },
  );
  const refs = new Map(
    output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(/\s+/u).reverse()),
  );
  return refs.get(`refs/tags/${tag}^{}`) || refs.get(`refs/tags/${tag}`) || null;
}

async function releaseExists(repository, tag) {
  const url = `https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(tag)}`;
  const response = await fetch(url, {
    headers: fetchHeaders(url),
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`release lookup failed with HTTP ${response.status}`);
  const release = await response.json();
  return release.draft === false && release.prerelease === false;
}

async function findLegacyRelease(entry, version) {
  const expectedDigest = legacyTagDigest(entry, version);
  if (!expectedDigest) return null;
  const releases = await fetchJson(
    `https://api.github.com/repos/${entry.repository}/releases?per_page=100`,
  );
  const release = releases.find(
    (candidate) =>
      candidate.draft === false &&
      candidate.prerelease === false &&
      typeof candidate.tag_name === 'string' &&
      candidate.tag_name.endsWith(version) &&
      createHash('sha256').update(candidate.tag_name).digest('hex') === expectedDigest,
  );
  if (!release) return null;
  const commit = resolveTagCommit(entry.repository, release.tag_name);
  return commit ? { tag: release.tag_name, commit, legacy: true } : null;
}

async function selectRelease(entry, version) {
  for (const tag of candidateTags(entry, version)) {
    const commit = resolveTagCommit(entry.repository, tag);
    if (commit && (await releaseExists(entry.repository, tag))) {
      return {
        tag,
        commit,
        legacy: tag !== canonicalTag(entry.canonical_tag, version),
      };
    }
  }
  return findLegacyRelease(entry, version);
}

async function auditPackage(entry) {
  const registry = await fetchJson(
    `https://registry.npmjs.org/${encodeURIComponent(entry.npm_package)}/latest`,
  );
  const npmVersion = registry.version;
  if (!stableSemver.test(npmVersion || '')) throw new Error('npm latest is not stable SemVer');
  const expectedVersion = entry.version;
  const mainExpectedVersion = expectedMainVersion(entry);

  const source = await fetchJson(
    `https://raw.githubusercontent.com/${entry.repository}/main/${entry.package_json}`,
  );
  const release = await selectRelease(entry, expectedVersion);
  const taggedSource = release
    ? await fetchJson(
        `https://raw.githubusercontent.com/${entry.repository}/${release.commit}/${entry.package_json}`,
      )
    : null;
  const provenance =
    Boolean(registry.dist?.attestations?.url) &&
    registry.dist?.attestations?.provenance?.predicateType === slsaPredicate;
  const sourceBound =
    !registry.gitHead || !release ? Boolean(release) : registry.gitHead === release.commit;

  const failures = [];
  if (npmVersion !== expectedVersion) failures.push('manifest/npm version mismatch');
  if (source.version !== mainExpectedVersion) failures.push('main/manifest version mismatch');
  if (!release) failures.push('release tag or published Release missing');
  if (taggedSource && taggedSource.version !== expectedVersion) {
    failures.push('tag/manifest version mismatch');
  }
  if (!sourceBound) failures.push('npm gitHead/tag commit mismatch');
  if (!provenance) failures.push('SLSA provenance missing');

  return {
    entry,
    expectedVersion,
    mainVersion: source.version || null,
    npmVersion,
    release,
    provenance,
    failures,
  };
}

export async function run(
  policy = validatePolicy(JSON.parse(fs.readFileSync(policyPath, 'utf8'))),
) {
  const results = [];
  for (const entry of policy.packages) {
    try {
      results.push(await auditPackage(entry));
    } catch (error) {
      results.push({
        entry,
        expectedVersion: entry.version,
        mainVersion: null,
        npmVersion: null,
        release: null,
        provenance: false,
        failures: [error.message],
      });
    }
  }

  console.log('## npm publish-health report\n');
  console.log('| package | expected | main | npm | release | provenance | status |');
  console.log('| --- | --- | --- | --- | --- | --- | --- |');
  for (const result of results) {
    const release = result.release
      ? result.release.legacy
        ? `historical release for ${result.expectedVersion}`
        : result.release.tag
      : '?';
    const status = result.failures.length ? result.failures.join('; ') : 'ok';
    console.log(
      `| ${result.entry.npm_package} | ${result.expectedVersion || '?'} | ${result.mainVersion || '?'} | ${result.npmVersion || '?'} | ${release} | ${result.provenance ? 'SLSA v1' : 'missing'} | ${status} |`,
    );
  }

  const failures = results.reduce((total, result) => total + result.failures.length, 0);
  const legacy = results.filter((result) => result.release?.legacy).length;
  console.log(`\nFailures: ${failures}. Exact grandfathered legacy coordinates: ${legacy}.`);
  return { results, failures, legacy };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outcome = await run();
  process.exitCode = outcome.failures === 0 ? 0 : 1;
}
