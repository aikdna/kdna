#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
// The override exists so regression tests can exercise the real validator
// against an isolated manifest without rewriting the canonical file.
const manifestPath = process.env.KDNA_ECOSYSTEM_MANIFEST_PATH
  ? path.resolve(process.env.KDNA_ECOSYSTEM_MANIFEST_PATH)
  : path.join(repoRoot, 'ecosystem-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const allowedLifecycle = new Set(manifest.lifecycle_terms || []);
const liveLifecycle = new Set(['Stable', 'Beta', 'Experimental']);
const requiredFields = [
  'repository',
  'npm_package',
  'current_version',
  'lifecycle',
  'supported_kdna_version',
  'supported_access_modes',
  'supported_entitlement_profiles',
  'conformance_commit',
  'known_limitations',
  'recommended_entrypoint',
  'legacy_replacement',
];

let failures = 0;

function fail(component, message) {
  failures += 1;
  console.error(`FAIL ${component.repository || '<unknown>'}: ${message}`);
}

function componentPath(component) {
  if (!component.local_path) return null;
  if (component.local_path === '.') return repoRoot;

  const repoName = component.repository.split('/').pop();
  const envRoot = process.env.KDNA_ECOSYSTEM_REPOS_ROOT;
  if (envRoot) {
    const envPath = path.resolve(envRoot, repoName);
    if (fs.existsSync(envPath)) return envPath;
  }

  const localPath = path.resolve(repoRoot, component.local_path);
  if (fs.existsSync(localPath)) return localPath;

  const ciPath = path.join(repoRoot, '.ecosystem-repos', repoName);
  if (fs.existsSync(ciPath)) return ciPath;

  return null;
}

function componentPackagePath(component) {
  if (!component.package_json) return null;
  const localRoot = componentPath(component);
  if (localRoot && component.local_path) {
    const relativePackagePath = path.relative(component.local_path, component.package_json);
    if (relativePackagePath.startsWith('..') || path.isAbsolute(relativePackagePath)) {
      fail(component, `package_json escapes component root: ${component.package_json}`);
      return null;
    }
    const localPackagePath = path.join(localRoot, relativePackagePath);
    return fs.existsSync(localPackagePath) ? localPackagePath : null;
  }

  const declaredPath = path.resolve(repoRoot, component.package_json);
  return fs.existsSync(declaredPath) ? declaredPath : null;
}

if (!Array.isArray(manifest.components) || manifest.components.length === 0) {
  console.error('FAIL manifest: components must be a non-empty array');
  process.exit(1);
}

for (const component of manifest.components) {
  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(component, field)) {
      fail(component, `missing field ${field}`);
    }
  }
  if (!allowedLifecycle.has(component.lifecycle)) {
    fail(component, `invalid lifecycle ${component.lifecycle}`);
  }
  if (!Array.isArray(component.supported_access_modes)) {
    fail(component, 'supported_access_modes must be an array');
  }
  if (!Array.isArray(component.supported_entitlement_profiles)) {
    fail(component, 'supported_entitlement_profiles must be an array');
  }
  if (!Array.isArray(component.known_limitations)) {
    fail(component, 'known_limitations must be an array');
  }

  const localPath = componentPath(component);

  if (component.package_json) {
    const pkgPath = componentPackagePath(component);
    if (!pkgPath) {
      if (liveLifecycle.has(component.lifecycle)) {
        fail(component, 'live package evidence is unavailable; repository checkout is required');
      }
    } else {
      let pkg;
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch (error) {
        fail(component, `package evidence is unreadable: ${error.message}`);
      }
      if (pkg) {
        if (component.npm_package && pkg.name !== component.npm_package) {
          fail(
            component,
            `package name mismatch: manifest=${component.npm_package} package.json=${pkg.name}`,
          );
        }
        if (component.current_version !== null && pkg.version !== component.current_version) {
          fail(
            component,
            `version mismatch: manifest=${component.current_version} package.json=${pkg.version}`,
          );
        }
      }
    }

    if (
      liveLifecycle.has(component.lifecycle) &&
      component.local_path &&
      component.local_path !== '.'
    ) {
      if (!localPath) {
        fail(component, 'live package repository checkout is unavailable');
      } else {
        let checkoutCommit = null;
        try {
          const checkoutRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
            cwd: localPath,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          }).trim();
          if (fs.realpathSync(checkoutRoot) !== fs.realpathSync(localPath)) {
            fail(component, `live package path is not a repository root: ${localPath}`);
          }
          checkoutCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
            cwd: localPath,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
          }).trim();
          const checkoutStatus = execFileSync(
            'git',
            ['status', '--porcelain', '--untracked-files=all'],
            {
              cwd: localPath,
              encoding: 'utf8',
              stdio: ['ignore', 'pipe', 'pipe'],
            },
          ).trim();
          if (checkoutStatus) {
            fail(component, 'live package checkout is dirty');
          }
        } catch (error) {
          fail(component, `live package checkout identity is unreadable: ${error.message}`);
        }
        if (checkoutCommit && checkoutCommit !== component.conformance_commit) {
          fail(
            component,
            `checkout commit mismatch: manifest=${component.conformance_commit} checkout=${checkoutCommit}`,
          );
        }
      }
    }
  }

  // A live component without a package or release artifact has no external
  // evidence surface for this validator to inspect. In that case, a real Git
  // checkout is the minimum verification anchor. Do not silently count a
  // missing repository as a passing ecosystem component.
  const hasPackageEvidence = Boolean(
    component.npm_package && component.package_json && component.current_version,
  );
  const hasArtifactEvidence = Boolean(component.artifact_path && component.current_version);
  if (liveLifecycle.has(component.lifecycle) && !hasPackageEvidence && !hasArtifactEvidence) {
    if (!localPath) {
      fail(
        component,
        'live component has no package/artifact evidence and its repository checkout is unavailable',
      );
    } else if (!fs.existsSync(path.join(localPath, '.git'))) {
      fail(
        component,
        'live component has no package/artifact evidence and local_path is not a Git checkout',
      );
    }
  }

  if (component.repository === 'aikdna/kdna-core-swift' && localPath) {
    const workflowPath = path.join(localPath, '.github', 'workflows', 'ci.yml');
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

  if (component.lifecycle === 'Removed') {
    continue;
  }

  if (component.artifact_path && localPath) {
    const artifactPath = path.join(localPath, component.artifact_path);
    if (!fs.existsSync(artifactPath)) {
      fail(component, `missing release artifact ${component.artifact_path}`);
    }

    const sourceManifestPath = path.join(localPath, 'kdna.json');
    if (fs.existsSync(sourceManifestPath)) {
      const sourceManifest = JSON.parse(fs.readFileSync(sourceManifestPath, 'utf8'));
      if (
        component.current_version !== null &&
        sourceManifest.version !== component.current_version
      ) {
        fail(
          component,
          `source version mismatch: manifest=${component.current_version} kdna.json=${sourceManifest.version}`,
        );
      }
    }

    const declaredLocalPath = component.local_path
      ? path.resolve(repoRoot, component.local_path)
      : null;
    const shouldCheckReferenceWorkflow =
      declaredLocalPath &&
      fs.existsSync(declaredLocalPath) &&
      path.resolve(localPath) === declaredLocalPath;
    const workflowPath = path.join(localPath, '.github', 'workflows', 'ci.yml');
    if (shouldCheckReferenceWorkflow && fs.existsSync(workflowPath)) {
      const workflow = fs.readFileSync(workflowPath, 'utf8');
      if (!workflow.includes('@aikdna/kdna-cli@0.26.1')) {
        fail(component, 'legacy proof asset CI must pin @aikdna/kdna-cli@0.26.1');
      }
      for (const command of [
        `kdna validate ${component.artifact_path}`,
        `kdna plan-load ${component.artifact_path}`,
        `kdna load ${component.artifact_path}`,
      ]) {
        if (!workflow.includes(command)) {
          fail(component, `legacy proof asset CI missing "${command}"`);
        }
      }
    }
  }
}

if (failures > 0) {
  console.error(`ecosystem-manifest validation failed: ${failures} failure(s)`);
  process.exit(1);
}

console.log(`ecosystem-manifest validation passed: ${manifest.components.length} component(s)`);
