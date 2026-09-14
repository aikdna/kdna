'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CURRENT_RELEASE_STATUSES = new Set(['active', 'compatibility']);
const PUBLISHABLE_SOURCE_STATUSES = new Set(['active', 'candidate', 'compatibility']);
// Declared asset-index state that means "registered, but no release coordinate
// exists yet" (kdna-assets schemas/public-read-index.schema.json). The current
// index carries one such state beside the historical references; the historical
// shape predates the field entirely and is read as published.
const UNPUBLISHED_ASSET_STATUS = 'unpublished_candidate';
const STABLE_SEMVER_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;
const SEMVER_RE =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-((?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/u;
const NUMERIC_IDENTIFIER_RE = /^[0-9]+$/u;

function componentRecords(manifest) {
  if (manifest?.schema_version !== 2 || !Array.isArray(manifest?.components)) {
    throw new Error('ecosystem manifest must use schema_version 2 with a components array');
  }
  return manifest.components;
}

function packageRecords(manifest) {
  const records = [];
  for (const component of componentRecords(manifest)) {
    if (!Array.isArray(component?.packages)) {
      throw new Error(
        `ecosystem component ${component?.repository || '<unknown>'} has no packages array`,
      );
    }
    for (const packageRecord of component.packages) {
      records.push({ component, packageRecord });
    }
  }
  return records;
}

function artifactRecords(manifest) {
  const records = [];
  for (const component of componentRecords(manifest)) {
    if (!Array.isArray(component?.artifacts)) {
      throw new Error(
        `ecosystem component ${component?.repository || '<unknown>'} has no artifacts array`,
      );
    }
    for (const artifactRecord of component.artifacts) {
      records.push({ component, artifactRecord });
    }
  }
  return records;
}

function requireComponent(manifest, repository) {
  const matches = componentRecords(manifest).filter(
    (component) => component?.repository === repository,
  );
  if (matches.length !== 1) {
    throw new Error(
      `ecosystem manifest must declare exactly one component for ${repository}; found ${matches.length}`,
    );
  }
  return matches[0];
}

function requireNpmPackage(manifest, npmPackage) {
  const matches = packageRecords(manifest).filter(
    ({ packageRecord }) => packageRecord?.npm_package === npmPackage,
  );
  if (matches.length !== 1) {
    throw new Error(
      `ecosystem manifest must declare exactly one package for ${npmPackage}; found ${matches.length}`,
    );
  }
  return matches[0];
}

function currentPublishedPackages(manifest) {
  return packageRecords(manifest).filter(
    ({ packageRecord }) =>
      CURRENT_RELEASE_STATUSES.has(packageRecord?.release_status) &&
      typeof packageRecord?.npm_package === 'string',
  );
}

function publishableSourcePackages(manifest) {
  return packageRecords(manifest).filter(
    ({ packageRecord }) =>
      PUBLISHABLE_SOURCE_STATUSES.has(packageRecord?.release_status) &&
      typeof packageRecord?.npm_package === 'string',
  );
}

function compareStableVersions(left, right) {
  if (!STABLE_SEMVER_RE.test(left || '') || !STABLE_SEMVER_RE.test(right || '')) {
    throw new Error('stable SemVer comparison requires x.y.z');
  }
  return compareSemver(left, right);
}

// SemVer 2.0.0 precedence. A prerelease candidate (for example
// `0.24.0-rc.component-semantics.2`) is an unpublished source coordinate, so
// ordering it against a published incumbent needs the full precedence rules,
// not a three-number comparison.
function compareSemver(left, right) {
  const leftMatch = SEMVER_RE.exec(left || '');
  const rightMatch = SEMVER_RE.exec(right || '');
  if (!leftMatch || !rightMatch) {
    throw new Error(`SemVer comparison requires Semantic Versioning values: ${left} / ${right}`);
  }
  for (let index = 1; index <= 3; index += 1) {
    const leftPart = BigInt(leftMatch[index]);
    const rightPart = BigInt(rightMatch[index]);
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return comparePrereleaseIdentifiers(leftMatch[4] ?? null, rightMatch[4] ?? null);
}

function comparePrereleaseIdentifiers(left, right) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  const leftParts = left.split('.');
  const rightParts = right.split('.');
  const shared = Math.min(leftParts.length, rightParts.length);
  for (let index = 0; index < shared; index += 1) {
    const leftPart = leftParts[index];
    const rightPart = rightParts[index];
    const leftNumeric = NUMERIC_IDENTIFIER_RE.test(leftPart);
    const rightNumeric = NUMERIC_IDENTIFIER_RE.test(rightPart);
    if (leftNumeric && rightNumeric) {
      const leftValue = BigInt(leftPart);
      const rightValue = BigInt(rightPart);
      if (leftValue > rightValue) return 1;
      if (leftValue < rightValue) return -1;
      continue;
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }
  if (leftParts.length === rightParts.length) return 0;
  return leftParts.length > rightParts.length ? 1 : -1;
}

function candidateIncumbentPackages(manifest) {
  return packageRecords(manifest)
    .filter(
      ({ packageRecord }) =>
        packageRecord?.release_status === 'candidate' &&
        typeof packageRecord?.npm_package === 'string',
    )
    .map(({ component, packageRecord }) => ({
      component,
      packageRecord: { ...packageRecord, version: packageRecord.published_version },
      candidateVersion: packageRecord.version,
    }));
}

function resolveComponentPath(repoRoot, component, options = {}) {
  if (!component?.local_path) return null;
  if (component.local_path === '.') return repoRoot;

  const repoName = component.repository.split('/').pop();
  const explicitReposRoot = options.reposRoot ?? process.env.KDNA_ECOSYSTEM_REPOS_ROOT;
  if (explicitReposRoot) {
    const explicitPath = path.resolve(explicitReposRoot, repoName);
    return fs.existsSync(explicitPath) ? explicitPath : null;
  }

  const ciPath = path.join(repoRoot, '.ecosystem-repos', repoName);
  if (fs.existsSync(ciPath)) return ciPath;

  const localPath = path.resolve(repoRoot, component.local_path);
  return fs.existsSync(localPath) ? localPath : null;
}

function manifestArtifactInventory(component) {
  if (!Array.isArray(component?.artifacts)) {
    throw new Error('component artifacts must be an array');
  }
  return component.artifacts
    .map((artifact) => ({
      path: artifact.path,
      version: artifact.version,
      sha256: artifact.sha256,
      release_tag: artifact.release_tag,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function currentAssetIndexInventory(index) {
  if (!Array.isArray(index?.assets) || !Array.isArray(index?.clusters)) {
    throw new Error('current asset index must declare assets and clusters arrays');
  }
  if (index.clusters.length !== 0) {
    throw new Error('current asset index clusters require an ecosystem manifest schema extension');
  }
  // The producer's index states what it can express by construction: the exact
  // artifact (path, version, digest) and, for a published entry, that artifact
  // listed in its own `files` inventory. A release coordinate is an extra field
  // the older index carried and the current one does not, so it is read here
  // when present and verified against the producer's release history instead of
  // being demanded from every entry.
  //
  // Published: artifact integrity + the artifact listed in `files` (traceable
  // bytes inside the index) + a well-formed release coordinate when one is
  // declared. Unpublished: artifact integrity + explicit status + no release
  // coordinate at all. An entry with neither a release coordinate nor an
  // explicit unpublished status is neither, and fails.
  const published = [];
  const unpublished = [];
  const paths = new Set();
  for (const entry of index.assets) {
    const status = typeof entry?.publication_status === 'string' ? entry.publication_status : null;
    const path = entry?.artifact?.path;
    const version = entry?.version;
    const sha256 = entry?.digest?.value;
    const download = entry?.download;
    if (typeof path !== 'string' || path.length === 0) {
      throw new Error('current asset index entry must declare an artifact path');
    }
    if (paths.has(path)) {
      throw new Error('current asset index contains duplicate artifact paths');
    }
    paths.add(path);
    if (!version || !sha256) {
      throw new Error('current asset index contains an incomplete artifact coordinate');
    }
    if (status === UNPUBLISHED_ASSET_STATUS) {
      if (download !== undefined) {
        throw new Error(
          'unpublished current asset index entry must not declare a release coordinate',
        );
      }
      unpublished.push({ path, version, sha256 });
      continue;
    }
    if (download === undefined && status === null) {
      throw new Error(
        'current asset index entry must declare either a release coordinate or an unpublished status',
      );
    }
    const tagMatch =
      download === undefined
        ? null
        : typeof download?.url === 'string'
          ? download.url.match(/\/releases\/download\/([^/]+)\//u)
          : undefined;
    if (download !== undefined && !tagMatch) {
      throw new Error('current asset index entry declares an invalid release coordinate');
    }
    // A published entry is traceable when it names its release coordinate or
    // when it lists the exact artifact bytes in its own file inventory.
    const listedInFiles =
      Array.isArray(entry?.files) &&
      entry.files.some((file) => file?.path === path && file?.sha256 === sha256);
    if (!tagMatch && !listedInFiles) {
      throw new Error('published current asset index entry has no traceable artifact coordinate');
    }
    published.push({ path, version, sha256, release_tag: tagMatch?.[1] || null });
  }
  return {
    published: published.sort((left, right) => left.path.localeCompare(right.path)),
    unpublished: unpublished.sort((left, right) => left.path.localeCompare(right.path)),
  };
}

module.exports = {
  CURRENT_RELEASE_STATUSES,
  PUBLISHABLE_SOURCE_STATUSES,
  artifactRecords,
  candidateIncumbentPackages,
  compareSemver,
  compareStableVersions,
  componentRecords,
  currentAssetIndexInventory,
  currentPublishedPackages,
  manifestArtifactInventory,
  packageRecords,
  publishableSourcePackages,
  requireComponent,
  requireNpmPackage,
  resolveComponentPath,
};
