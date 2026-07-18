'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CURRENT_RELEASE_STATUSES = new Set(['active', 'compatibility']);

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
  const records = index.assets.map((entry) => {
    const tagMatch = entry?.download?.url?.match(/\/releases\/download\/([^/]+)\//u);
    return {
      path: entry?.artifact?.path,
      version: entry?.version,
      sha256: entry?.digest?.value,
      release_tag: tagMatch?.[1] || null,
    };
  });
  if (records.some((record) => Object.values(record).some((value) => !value))) {
    throw new Error('current asset index contains an incomplete artifact coordinate');
  }
  if (new Set(records.map((record) => record.path)).size !== records.length) {
    throw new Error('current asset index contains duplicate artifact paths');
  }
  return records.sort((left, right) => left.path.localeCompare(right.path));
}

module.exports = {
  CURRENT_RELEASE_STATUSES,
  artifactRecords,
  candidateIncumbentPackages,
  componentRecords,
  currentAssetIndexInventory,
  currentPublishedPackages,
  manifestArtifactInventory,
  packageRecords,
  requireComponent,
  requireNpmPackage,
  resolveComponentPath,
};
