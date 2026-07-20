#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { inspect } = require('../packages/kdna-core/src/container');
const { sameFilesystemIdentity } = require('./filesystem-identity');
const {
  compareStableVersions,
  currentAssetIndexInventory,
  manifestArtifactInventory,
  resolveComponentPath,
} = require('./ecosystem-manifest');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = process.env.KDNA_ECOSYSTEM_MANIFEST_PATH
  ? path.resolve(process.env.KDNA_ECOSYSTEM_MANIFEST_PATH)
  : path.join(repoRoot, 'ecosystem-manifest.json');
const schemaPath = path.join(repoRoot, 'schema', 'ecosystem-manifest.schema.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const liveLifecycle = new Set(['Pre-release', 'Experimental']);
const publishableReleaseStatuses = new Set(['active', 'candidate', 'compatibility']);
const retiredReleaseStatus = 'deprecated';

let failures = 0;

function label(component, detail = '') {
  const repository = component?.repository || '<unknown>';
  return detail ? `${repository} ${detail}` : repository;
}

function fail(component, message, detail = '') {
  failures += 1;
  console.error(`FAIL ${label(component, detail)}: ${message}`);
}

function validateSchema() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (validate(manifest)) return true;

  for (const error of validate.errors || []) {
    failures += 1;
    const location = error.instancePath || '/';
    console.error(`FAIL manifest schema ${location}: ${error.message}`);
  }
  return false;
}

function gitText(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gitBytes(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: null,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function assertConformanceCommit(component, commit, detail = '') {
  if (!commit) return;
  try {
    const objectType = gitText(repoRoot, ['cat-file', '-t', commit]);
    if (objectType !== 'commit') {
      fail(component, `conformance anchor is not a commit: ${commit}`, detail);
      return;
    }
    execFileSync('git', ['merge-base', '--is-ancestor', commit, 'HEAD'], {
      cwd: repoRoot,
      stdio: 'ignore',
    });
  } catch {
    fail(
      component,
      `conformance commit is not reachable from current KDNA history: ${commit}`,
      detail,
    );
  }
}

function assertComponentRelease(component, root) {
  const hasTag = typeof component.release_tag === 'string';
  const hasCommit = typeof component.release_commit === 'string';
  if (hasTag !== hasCommit) {
    fail(component, 'component release_tag and release_commit must be declared together');
    return;
  }
  if (!hasTag) return;
  if (!component.component_version) {
    fail(component, 'component release evidence requires component_version');
  } else if (
    component.release_tag !== component.component_version &&
    component.release_tag !== `v${component.component_version}`
  ) {
    fail(component, 'component release_tag must equal component_version with at most a v prefix');
  }
  if (!root) return;
  try {
    const tagCommit = gitText(root, ['rev-list', '-n', '1', `refs/tags/${component.release_tag}`]);
    if (tagCommit !== component.release_commit) {
      fail(
        component,
        `component release tag mismatch: manifest=${component.release_commit} tag=${tagCommit}`,
      );
    }
    if (component.source_commit) {
      execFileSync(
        'git',
        ['merge-base', '--is-ancestor', component.release_commit, component.source_commit],
        { cwd: root, stdio: 'ignore' },
      );
    }
  } catch (error) {
    fail(component, `component release Git evidence is unavailable: ${error.message}`);
  }
}

function relativeRecordPath(component, recordPath, kind) {
  if (
    path.posix.isAbsolute(recordPath) ||
    path.win32.isAbsolute(recordPath) ||
    recordPath.includes('\\') ||
    recordPath.split('/').some((segment) => segment === '.' || segment === '..') ||
    path.posix.normalize(recordPath) !== recordPath
  ) {
    fail(component, `${kind} path must be a normalized repository-relative POSIX path`, recordPath);
    return null;
  }
  return recordPath;
}

function resolvedRecordPath(component, root, recordPath, kind) {
  const relativePath = relativeRecordPath(component, recordPath, kind);
  if (!relativePath || !root) return null;

  const candidate = path.resolve(root, relativePath);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    fail(component, `${kind} path escapes the component repository`, recordPath);
    return null;
  }
  if (!fs.existsSync(candidate)) return candidate;

  try {
    const realRoot = fs.realpathSync(root);
    const realCandidate = fs.realpathSync(candidate);
    const realRelative = path.relative(realRoot, realCandidate);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
      fail(component, `${kind} path resolves outside the component repository`, recordPath);
      return null;
    }
  } catch (error) {
    fail(component, `${kind} path identity is unreadable: ${error.message}`, recordPath);
    return null;
  }
  return candidate;
}

function readJsonEvidence(component, filePath, detail) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(component, `package evidence is unreadable: ${error.message}`, detail);
    return null;
  }
}

function assertPackageManifest(component, packageRecord, pkg, origin) {
  const detail = packageRecord.package_json;
  if (pkg.name !== packageRecord.package_name) {
    fail(
      component,
      `${origin} package name mismatch: manifest=${packageRecord.package_name} package.json=${pkg.name}`,
      detail,
    );
  }
  if (pkg.version !== packageRecord.version) {
    fail(
      component,
      `${origin} package version mismatch: manifest=${packageRecord.version} package.json=${pkg.version}`,
      detail,
    );
  }
  if (packageRecord.npm_package && packageRecord.npm_package !== packageRecord.package_name) {
    fail(component, 'npm_package must equal package_name when present', detail);
  }
  if (publishableReleaseStatuses.has(packageRecord.release_status) && pkg.private === true) {
    fail(component, `${packageRecord.release_status} package must not be private`, detail);
  }
  if (packageRecord.release_status === retiredReleaseStatus) {
    if (pkg.private !== true) {
      fail(component, 'deprecated package source must be private', detail);
    }
    for (const script of ['prepublishOnly', 'release:check', 'release:evidence:check']) {
      if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, script)) {
        fail(component, `deprecated package must not expose ${script}`, detail);
      }
    }
  }
}

function assertCheckout(component, root) {
  if (!root || component.local_path === '.') return;
  try {
    const checkoutRoot = gitText(root, ['rev-parse', '--show-toplevel']);
    if (!sameFilesystemIdentity(checkoutRoot, root)) {
      fail(component, `component path is not a repository root: ${root}`);
      return;
    }

    if (!component.source_commit) {
      fail(component, 'checked-out component must declare source_commit');
    } else {
      gitText(root, ['rev-parse', '--verify', `${component.source_commit}^{commit}`]);
    }
  } catch (error) {
    fail(component, `accepted source snapshot is unreadable: ${error.message}`);
  }
}

function assertPackage(component, packageRecord, root) {
  if (component.source_commit && root && component.local_path !== '.') {
    let bytes;
    try {
      bytes = gitBytes(root, [
        'show',
        `${component.source_commit}:${packageRecord.package_json}`,
      ]);
    } catch (error) {
      fail(
        component,
        `package evidence is unavailable at source_commit: ${error.message}`,
        packageRecord.package_json,
      );
      return;
    }
    try {
      const committedPackage = JSON.parse(bytes.toString('utf8'));
      assertPackageManifest(component, packageRecord, committedPackage, 'source_commit');
    } catch (error) {
      fail(
        component,
        `package evidence is unreadable at source_commit: ${error.message}`,
        packageRecord.package_json,
      );
    }
    return;
  }

  const filePath = resolvedRecordPath(component, root, packageRecord.package_json, 'package_json');
  if (!filePath || !fs.existsSync(filePath)) {
    if (
      liveLifecycle.has(component.lifecycle) ||
      publishableReleaseStatuses.has(packageRecord.release_status)
    ) {
      fail(component, 'current package evidence is unavailable', packageRecord.package_json);
    }
    return;
  }

  const pkg = readJsonEvidence(component, filePath, packageRecord.package_json);
  if (pkg) assertPackageManifest(component, packageRecord, pkg, 'checkout');

}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function assertArtifact(component, artifact, root) {
  assertConformanceCommit(component, artifact.conformance_commit, artifact.path);
  const filePath = resolvedRecordPath(component, root, artifact.path, 'artifact');
  if (!filePath || !fs.existsSync(filePath)) {
    if (liveLifecycle.has(component.lifecycle)) {
      fail(component, 'current artifact evidence is unavailable', artifact.path);
    }
    return;
  }

  const bytes = fs.readFileSync(filePath);
  const observedHash = sha256(bytes);
  if (observedHash !== artifact.sha256) {
    fail(
      component,
      `artifact SHA-256 mismatch: manifest=${artifact.sha256} observed=${observedHash}`,
      artifact.path,
    );
  }

  try {
    const summary = inspect(filePath);
    if (summary.version !== artifact.version) {
      fail(
        component,
        `artifact version mismatch: manifest=${artifact.version} asset=${summary.version}`,
        artifact.path,
      );
    }
  } catch (error) {
    fail(component, `artifact is not inspectable: ${error.message}`, artifact.path);
  }

  if (!root) return;
  try {
    const releaseBytes = gitBytes(root, ['show', `${artifact.release_commit}:${artifact.path}`]);
    const releaseHash = sha256(releaseBytes);
    if (releaseHash !== artifact.sha256) {
      fail(
        component,
        `release artifact SHA-256 mismatch: manifest=${artifact.sha256} release=${releaseHash}`,
        artifact.path,
      );
    }
    const tagCommit = gitText(root, ['rev-list', '-n', '1', `refs/tags/${artifact.release_tag}`]);
    if (tagCommit !== artifact.release_commit) {
      fail(
        component,
        `release tag mismatch: manifest=${artifact.release_commit} tag=${tagCommit}`,
        artifact.path,
      );
    }
  } catch (error) {
    fail(
      component,
      `release artifact Git evidence is unavailable: ${error.message}`,
      artifact.path,
    );
  }
}

function assertAssetIndex(component, root) {
  if (component.repository !== 'aikdna/kdna-assets' || !root) return;
  const indexPath = resolvedRecordPath(component, root, 'index/current.json', 'asset index');
  if (!indexPath || !fs.existsSync(indexPath)) {
    fail(component, 'current asset index is unavailable', 'index/current.json');
    return;
  }
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const indexed = currentAssetIndexInventory(index);
    const declared = manifestArtifactInventory(component);
    if (JSON.stringify(indexed) !== JSON.stringify(declared)) {
      fail(component, 'artifact inventory differs from the exact index/current.json projection');
    }
  } catch (error) {
    fail(component, `current asset index is invalid: ${error.message}`, 'index/current.json');
  }
}

if (validateSchema()) {
  const coreComponent = manifest.components.find(
    (component) => component.repository === 'aikdna/kdna',
  );
  const coreConformanceCommit = coreComponent?.conformance_commit || null;
  const corePackageRecords = (coreComponent?.packages || []).filter(
    (packageRecord) => packageRecord.npm_package === '@aikdna/kdna-core',
  );
  if (!coreComponent || corePackageRecords.length !== 1 || !coreConformanceCommit) {
    fail(coreComponent, 'manifest must declare one KDNA Core package and conformance anchor');
  } else {
    try {
      const corePackageRecord = corePackageRecords[0];
      const coreReleaseTag = corePackageRecord.release_status === 'candidate'
        ? corePackageRecord.published_version
        : corePackageRecord.version;
      const coreReleaseCommit = gitText(repoRoot, [
        'rev-list',
        '-n',
        '1',
        `refs/tags/${coreReleaseTag}`,
      ]);
      if (coreReleaseCommit !== coreConformanceCommit) {
        fail(
          coreComponent,
          `Core conformance_commit must equal release tag ${coreReleaseTag}: ${coreReleaseCommit}`,
        );
      }
    } catch (error) {
      fail(coreComponent, `Core release tag evidence is unavailable: ${error.message}`);
    }
  }
  const repositories = new Set();
  const packageNames = new Set();
  const npmPackages = new Set();
  const packageSources = new Set();
  const artifactSources = new Set();

  for (const component of manifest.components) {
    if (repositories.has(component.repository)) {
      fail(component, 'duplicate repository component');
    }
    repositories.add(component.repository);

    const repositoryName = component.repository.split('/').pop();
    const expectedLocalPath = `../${repositoryName}`;
    if (component.local_path === '.' && component.repository !== 'aikdna/kdna') {
      fail(component, 'only aikdna/kdna may use the manifest repository as local_path');
    } else if (
      component.local_path !== null &&
      component.local_path !== '.' &&
      component.local_path !== expectedLocalPath
    ) {
      fail(component, `local_path must be ${expectedLocalPath}`);
    }

    const root = resolveComponentPath(repoRoot, component);
    const isLive = liveLifecycle.has(component.lifecycle);
    if (isLive && !root) {
      fail(component, 'live component repository checkout is unavailable');
    }
    if (component.lifecycle === 'Removed') {
      if (component.packages.length > 0 || component.artifacts.length > 0) {
        fail(component, 'Removed component must not expose package or artifact records');
      }
      if (component.local_path !== null) {
        fail(component, 'Removed component must not declare a local_path');
      }
    }
    if (component.lifecycle === 'Legacy' && !component.legacy_replacement) {
      fail(component, 'Legacy component must declare legacy_replacement');
    }
    if (isLive && component.local_path !== '.' && !component.source_commit) {
      fail(component, 'live external component must declare source_commit');
    }

    assertCheckout(component, root);
    assertConformanceCommit(component, component.conformance_commit);
    assertComponentRelease(component, root);
    assertAssetIndex(component, root);
    if (
      coreConformanceCommit &&
      component.conformance_commit &&
      component.conformance_commit !== coreConformanceCommit
    ) {
      fail(component, 'component conformance_commit differs from the current KDNA anchor');
    }
    if (component.artifacts.length > 0 && !component.conformance_commit) {
      fail(component, 'artifact-bearing component must declare its Core conformance anchor');
    }

    for (const packageRecord of component.packages) {
      if (
        packageRecord.release_status === 'candidate' &&
        compareStableVersions(packageRecord.version, packageRecord.published_version) <= 0
      ) {
        fail(
          component,
          'candidate version must be greater than published_version',
          packageRecord.package_json,
        );
      }
      const sourceKey = `${component.repository}:${packageRecord.package_json}`;
      if (packageSources.has(sourceKey)) {
        fail(component, 'duplicate package_json record', packageRecord.package_json);
      }
      packageSources.add(sourceKey);

      if (packageNames.has(packageRecord.package_name)) {
        fail(component, `duplicate package_name ${packageRecord.package_name}`);
      }
      packageNames.add(packageRecord.package_name);

      if (packageRecord.npm_package) {
        if (npmPackages.has(packageRecord.npm_package)) {
          fail(component, `duplicate npm_package ${packageRecord.npm_package}`);
        }
        npmPackages.add(packageRecord.npm_package);
      }
      assertPackage(component, packageRecord, root);
    }

    for (const artifact of component.artifacts) {
      const sourceKey = `${component.repository}:${artifact.path}`;
      if (artifactSources.has(sourceKey)) {
        fail(component, 'duplicate artifact record', artifact.path);
      }
      artifactSources.add(sourceKey);
      if (
        component.conformance_commit &&
        artifact.conformance_commit !== component.conformance_commit
      ) {
        fail(
          component,
          'artifact conformance_commit differs from its component anchor',
          artifact.path,
        );
      }
      if (coreConformanceCommit && artifact.conformance_commit !== coreConformanceCommit) {
        fail(
          component,
          'artifact conformance_commit differs from the current KDNA anchor',
          artifact.path,
        );
      }
      assertArtifact(component, artifact, root);
    }

    if (
      isLive &&
      component.packages.length === 0 &&
      component.artifacts.length === 0 &&
      component.component_version === null
    ) {
      fail(component, 'live component has no package, artifact, or component version evidence');
    }
    if (
      isLive &&
      component.packages.length === 0 &&
      component.artifacts.length === 0 &&
      (!component.release_tag || !component.release_commit)
    ) {
      fail(component, 'live package-less component must bind its current release tag and commit');
    }

    if (component.repository === 'aikdna/kdna-core-swift' && root) {
      const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml');
      if (fs.existsSync(workflowPath)) {
        const workflow = fs.readFileSync(workflowPath, 'utf8');
        if (component.conformance_commit && !workflow.includes(component.conformance_commit)) {
          fail(component, 'Swift CI conformance commit does not match ecosystem manifest');
        }
        if (/git clone .*--branch main .*aikdna\/kdna\.git/.test(workflow)) {
          fail(component, 'Swift CI must not dynamically clone kdna main for conformance fixtures');
        }
      }
    }
  }
}

if (failures > 0) {
  console.error(`ecosystem-manifest validation failed: ${failures} failure(s)`);
  process.exit(1);
}

const packageCount = manifest.components.reduce(
  (total, component) => total + component.packages.length,
  0,
);
const artifactCount = manifest.components.reduce(
  (total, component) => total + component.artifacts.length,
  0,
);
console.log(
  `ecosystem-manifest validation passed: ${manifest.components.length} component(s), ${packageCount} package record(s), ${artifactCount} artifact record(s)`,
);
