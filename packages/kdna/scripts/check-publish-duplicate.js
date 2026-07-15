#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { hashArtifact } = require('./prepare-release-artifact');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const DEFAULT_EVIDENCE_ROOT = path.join(REPO_ROOT, 'release-evidence');

function readJson(filePath, label) {
  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`${label} is unavailable at ${filePath}: ${error.message}`);
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function requireNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function validateSha(value, label) {
  const sha = requireNonEmptyString(value, label);
  if (!/^[0-9a-f]{40}$/u.test(sha)) {
    throw new Error(`${label} must be a full lowercase 40-character commit SHA`);
  }
  return sha;
}

function validateShasum(value, label) {
  const shasum = requireNonEmptyString(value, label);
  if (!/^[0-9a-f]{40}$/u.test(shasum)) {
    throw new Error(`${label} must be a lowercase 40-character hexadecimal SHA-1`);
  }
  return shasum;
}

function loadLocalEvidence({ evidenceRoot, packageManifest, githubSha }) {
  const pack = readJson(path.join(evidenceRoot, 'compat.npm-pack.json'), 'compat npm-pack evidence');
  const manifest = readJson(
    path.join(evidenceRoot, 'artifact-manifest.json'),
    'release artifact manifest',
  );
  const expectedSha = validateSha(githubSha, 'GITHUB_SHA');
  const expectedName = requireNonEmptyString(packageManifest.name, 'package name');
  const expectedVersion = requireNonEmptyString(packageManifest.version, 'package version');

  if (pack.package_name !== expectedName || pack.version !== expectedVersion) {
    throw new Error(
      `compat npm-pack evidence identifies ${pack.package_name || '<missing>'}@${pack.version || '<missing>'}, expected ${expectedName}@${expectedVersion}`,
    );
  }
  requireNonEmptyString(pack.integrity, 'compat npm-pack evidence integrity');
  const packShasum = validateShasum(pack.shasum, 'compat npm-pack evidence shasum');
  const filename = requireNonEmptyString(pack.filename, 'compat npm-pack evidence filename');
  if (path.basename(filename) !== filename || !filename.endsWith('.tgz')) {
    throw new Error('compat npm-pack evidence filename must be one local .tgz basename');
  }
  const artifactPath = path.join(evidenceRoot, filename);
  let artifactBuffer;
  try {
    artifactBuffer = fs.readFileSync(artifactPath);
  } catch (error) {
    throw new Error(`exact compatibility tarball is unavailable at ${artifactPath}: ${error.message}`);
  }
  const artifactHashes = hashArtifact(artifactBuffer);
  if (artifactHashes.integrity !== pack.integrity || artifactHashes.shasum !== packShasum) {
    throw new Error('exact compatibility tarball bytes do not match npm-pack evidence');
  }

  if (manifest.source_repository !== 'aikdna/kdna') {
    throw new Error(
      `release evidence source_repository is ${manifest.source_repository || '<missing>'}, expected aikdna/kdna`,
    );
  }
  if (manifest.source_commit !== expectedSha) {
    throw new Error(
      `release evidence source_commit ${manifest.source_commit || '<missing>'} does not match GITHUB_SHA ${expectedSha}`,
    );
  }
  if (manifest.git_dirty !== false) {
    throw new Error('release evidence was generated from a dirty worktree');
  }
  if (!Array.isArray(manifest.selected_packages) || !manifest.selected_packages.includes('compat')) {
    throw new Error('release artifact manifest does not select the compatibility package');
  }
  const manifestCompat = Array.isArray(manifest.artifacts)
    ? manifest.artifacts.find((artifact) => artifact && artifact.label === 'compat')
    : null;
  if (!manifestCompat) throw new Error('release artifact manifest has no compatibility artifact');
  const manifestShasum = validateShasum(
    manifestCompat.shasum,
    'release artifact manifest compatibility shasum',
  );
  if (
    manifestCompat.package_name !== pack.package_name ||
    manifestCompat.version !== pack.version ||
    manifestCompat.filename !== filename ||
    manifestCompat.integrity !== pack.integrity ||
    manifestShasum !== packShasum
  ) {
    throw new Error('compat npm-pack evidence does not match the release artifact manifest');
  }

  return {
    name: expectedName,
    version: expectedVersion,
    githubSha: expectedSha,
    integrity: pack.integrity,
    shasum: packShasum,
    artifactPath,
  };
}

function decidePublication({ local, registry }) {
  if (registry === null) {
    return {
      publishRequired: true,
      message: `${local.name}@${local.version} is not published; publication is required.`,
    };
  }
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) {
    throw new Error('npm registry metadata must be an object');
  }
  if (registry.name !== local.name || registry.version !== local.version) {
    throw new Error(
      `registry metadata identifies ${registry.name || '<missing>'}@${registry.version || '<missing>'}, expected ${local.name}@${local.version}`,
    );
  }
  const registryIntegrity = requireNonEmptyString(
    registry.dist && registry.dist.integrity,
    'registry dist.integrity',
  );
  if (registryIntegrity !== local.integrity) {
    throw new Error('registry dist.integrity does not match this run\'s compatibility npm-pack evidence');
  }
  const registryShasum = validateShasum(
    registry.dist && registry.dist.shasum,
    'registry dist.shasum',
  );
  if (registryShasum !== local.shasum) {
    throw new Error('registry dist.shasum does not match this run\'s compatibility npm-pack evidence');
  }
  return {
    publishRequired: false,
    message: `${local.name}@${local.version} already exists with the same commit and artifact; skipping publication.`,
  };
}

function parseJsonDocument(source) {
  if (typeof source !== 'string' || !source.trim()) return null;
  try {
    return JSON.parse(source.trim());
  } catch {
    return null;
  }
}

function parseRegistryResult(result, spec) {
  const stdout = typeof result.stdout === 'string' ? result.stdout.trim() : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
  if (result.error) throw new Error(`failed to run npm view for ${spec}: ${result.error.message}`);
  if (result.status === 0) {
    if (!stdout) throw new Error(`npm view returned no metadata for ${spec}`);
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch (error) {
      throw new Error(`npm view returned invalid JSON for ${spec}: ${error.message}`);
    }
    if (Array.isArray(parsed)) {
      if (parsed.length !== 1) {
        throw new Error(`npm view returned ${parsed.length} records for exact version ${spec}`);
      }
      return parsed[0];
    }
    return parsed;
  }

  const structuredError = parseJsonDocument(stdout);
  const separator = spec.lastIndexOf('@');
  const version = separator > 0 ? spec.slice(separator + 1) : '';
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error(`npm view spec must select one exact version: ${spec}`);
  }
  if (
    structuredError &&
    structuredError.error &&
    structuredError.error.code === 'E404' &&
    structuredError.error.summary === `No match found for version ${version}`
  ) {
    return null;
  }
  throw new Error(
    `npm view failed for ${spec} with exit ${result.status === null ? 'unknown' : result.status}: ${stdout || stderr || 'no diagnostic output'}`,
  );
}

function queryRegistry(name, version) {
  const spec = `${name}@${version}`;
  const npmExecPath = process.env.npm_execpath;
  const result = npmExecPath
    ? spawnSync(process.execPath, [npmExecPath, 'view', spec, '--json'], {
        encoding: 'utf8',
        env: process.env,
      })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['view', spec, '--json'], {
        encoding: 'utf8',
        env: process.env,
      });
  return parseRegistryResult(result, spec);
}

function writeGithubOutput(filePath, publishRequired) {
  if (!filePath) return;
  fs.appendFileSync(filePath, `publish_required=${publishRequired ? 'true' : 'false'}\n`, 'utf8');
}

function parseArguments(argv) {
  const result = { evidenceRoot: DEFAULT_EVIDENCE_ROOT, githubOutput: null };
  for (const argument of argv) {
    if (argument.startsWith('--evidence-root=')) {
      const value = argument.slice('--evidence-root='.length);
      if (!value) throw new Error('--evidence-root requires a path');
      result.evidenceRoot = path.resolve(value);
    } else if (argument.startsWith('--github-output=')) {
      result.githubOutput = argument.slice('--github-output='.length);
      if (!result.githubOutput) throw new Error('--github-output requires a path');
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return result;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (process.env.GITHUB_ACTIONS === 'true' && !options.githubOutput) {
    throw new Error('--github-output is required in GitHub Actions');
  }
  const packageManifest = readJson(
    path.join(PACKAGE_ROOT, 'package.json'),
    'compatibility package manifest',
  );
  const local = loadLocalEvidence({
    evidenceRoot: options.evidenceRoot,
    packageManifest,
    githubSha: process.env.GITHUB_SHA,
  });
  const registry = queryRegistry(local.name, local.version);
  const decision = decidePublication({ local, registry });
  writeGithubOutput(options.githubOutput, decision.publishRequired);
  console.log(decision.message);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility publication guard failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  decidePublication,
  loadLocalEvidence,
  parseArguments,
  parseRegistryResult,
  writeGithubOutput,
};
