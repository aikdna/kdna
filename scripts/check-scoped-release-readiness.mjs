#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function canonicalScopedTag(scope, version) {
  if (typeof scope !== 'string' || !/^[a-z][a-z0-9-]*$/u.test(scope)) {
    throw new Error(`invalid release scope: ${scope || '<missing>'}`);
  }
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/u.test(version)) {
    throw new Error(`invalid stable package version: ${version || '<missing>'}`);
  }
  return `${scope}/${version}`;
}

function assertReleaseContext({
  expectedTag,
  eventName,
  eventAction,
  draft,
  prerelease,
  releaseTag,
  githubRef,
}) {
  if (eventName !== 'release' || eventAction !== 'published') {
    throw new Error('publication requires a published GitHub Release event');
  }
  if (String(draft) !== 'false' || String(prerelease) !== 'false') {
    throw new Error('publication requires a stable, non-draft GitHub Release');
  }
  if (releaseTag !== expectedTag) {
    throw new Error(`release tag ${releaseTag || '<missing>'} must equal ${expectedTag}`);
  }
  if (githubRef !== `refs/tags/${expectedTag}`) {
    throw new Error(`GITHUB_REF ${githubRef || '<missing>'} must equal refs/tags/${expectedTag}`);
  }
}

function assertCommitBinding({ expectedTag, taggedCommit, headCommit, githubSha, status }) {
  for (const [label, value] of Object.entries({ taggedCommit, headCommit, githubSha })) {
    if (typeof value !== 'string' || !/^[0-9a-f]{40}$/u.test(value)) {
      throw new Error(`${label} must be a full lowercase commit SHA`);
    }
  }
  if (status !== '') throw new Error('release worktree must be clean');
  if (taggedCommit !== headCommit || githubSha !== headCommit) {
    throw new Error(`${expectedTag} commit, HEAD, and GITHUB_SHA must be identical`);
  }
}

function resolveSafeRepositoryFile(repoRoot, relativePath, label) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    relativePath.includes('\\') ||
    path.isAbsolute(relativePath) ||
    path.posix.normalize(relativePath) !== relativePath ||
    relativePath.startsWith('../')
  ) {
    throw new Error(`${label} path must be a normalized repository-relative path`);
  }
  const resolved = path.resolve(repoRoot, ...relativePath.split('/'));
  const relative = path.relative(repoRoot, resolved);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} path must stay inside the repository`);
  }
  const stat = fs.lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) {
    throw new Error(`${label} must be a regular file, not a symlink`);
  }
  const realPath = fs.realpathSync(resolved);
  const realRelative = path.relative(fs.realpathSync(repoRoot), realPath);
  if (realRelative === '' || realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
    throw new Error(`${label} real path must stay inside the repository`);
  }
  return resolved;
}

function inspectEvidenceArtifact({ manifest, repoRoot = ROOT }) {
  if (!Array.isArray(manifest?.artifacts) || manifest.artifacts.length !== 1) {
    throw new Error('release evidence must contain exactly one artifact');
  }
  const [artifact] = manifest.artifacts;
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    throw new Error('release evidence artifact must be an object');
  }
  if (artifact.artifact_path !== `release-evidence/${artifact.filename}`) {
    throw new Error('release evidence artifact path must exactly bind its filename');
  }
  const artifactPath = resolveSafeRepositoryFile(
    repoRoot,
    artifact.artifact_path,
    'release artifact',
  );
  const bytes = fs.readFileSync(artifactPath);
  let packageMetadata;
  try {
    packageMetadata = JSON.parse(
      execFileSync('tar', ['-xOzf', artifactPath, 'package/package.json'], {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    );
  } catch {
    throw new Error('release artifact must contain a readable package/package.json');
  }
  return {
    artifactPath,
    relativePath: artifact.artifact_path,
    size: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    shasum: crypto.createHash('sha1').update(bytes).digest('hex'),
    integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`,
    packageName: packageMetadata?.name,
    version: packageMetadata?.version,
  };
}

function assertEvidenceBinding({
  manifest,
  label,
  packageName,
  version,
  githubSha,
  artifactInspection,
}) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('release evidence manifest must be an object');
  }
  if (manifest.source_commit !== githubSha) {
    throw new Error('release evidence source_commit must equal GITHUB_SHA');
  }
  if (manifest.source_repository !== 'aikdna/kdna') {
    throw new Error('release evidence source_repository must equal aikdna/kdna');
  }
  if (manifest.git_dirty !== false)
    throw new Error('release evidence must record a clean worktree');
  if (JSON.stringify(manifest.selected_packages) !== JSON.stringify([label])) {
    throw new Error(`release evidence must select only ${label}`);
  }
  if (!Array.isArray(manifest.artifacts) || manifest.artifacts.length !== 1) {
    throw new Error('release evidence must contain exactly one artifact');
  }
  const [artifact] = manifest.artifacts;
  if (
    artifact.label !== label ||
    artifact.package_name !== packageName ||
    artifact.version !== version
  ) {
    throw new Error('release evidence artifact identity does not match the scoped package');
  }
  if (
    typeof artifact.filename !== 'string' ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*\.tgz$/u.test(artifact.filename) ||
    path.posix.basename(artifact.filename) !== artifact.filename ||
    artifact.artifact_path !== `release-evidence/${artifact.filename}`
  ) {
    throw new Error('release evidence artifact path does not safely bind its filename');
  }
  const expectedFilename = `${packageName.replace(/^@/u, '').replace('/', '-')}-${version}.tgz`;
  if (artifact.filename !== expectedFilename) {
    throw new Error('release evidence artifact filename does not match the scoped package');
  }
  if (
    typeof artifact.sha256 !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(artifact.sha256) ||
    typeof artifact.shasum !== 'string' ||
    !/^[a-f0-9]{40}$/u.test(artifact.shasum) ||
    typeof artifact.integrity !== 'string' ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(artifact.integrity) ||
    !Number.isSafeInteger(artifact.size) ||
    artifact.size <= 0
  ) {
    throw new Error('release evidence artifact hashes and size must be complete');
  }
  const expectedPublishCommand = `npm publish "${artifact.artifact_path}" --provenance --access public`;
  if (
    artifact.npm_provenance_required !== true ||
    artifact.publish_command !== expectedPublishCommand
  ) {
    throw new Error('release evidence must preserve npm provenance for the exact artifact');
  }
  if (!artifactInspection || typeof artifactInspection !== 'object') {
    throw new Error('release artifact inspection is required');
  }
  if (
    artifactInspection.relativePath !== artifact.artifact_path ||
    artifactInspection.size !== artifact.size ||
    artifactInspection.sha256 !== artifact.sha256 ||
    artifactInspection.shasum !== artifact.shasum ||
    artifactInspection.integrity !== artifact.integrity
  ) {
    throw new Error('release evidence hashes do not match the retained artifact bytes');
  }
  if (artifactInspection.packageName !== packageName || artifactInspection.version !== version) {
    throw new Error('retained artifact package identity does not match the scoped package');
  }
}

function parseArguments(argv) {
  const values = {};
  for (const argument of argv) {
    const match = /^--(package|scope|label|evidence)=(.+)$/u.exec(argument);
    if (!match) throw new Error(`unknown or incomplete argument: ${argument}`);
    values[match[1]] = match[2];
  }
  for (const required of ['package', 'scope', 'label']) {
    if (!values[required]) throw new Error(`--${required}=... is required`);
  }
  return values;
}

function runGit(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  const packageRoot = path.resolve(ROOT, args.package);
  const relativePackageRoot = path.relative(ROOT, packageRoot);
  if (relativePackageRoot.startsWith('..') || path.isAbsolute(relativePackageRoot)) {
    throw new Error('release package path must stay inside the repository');
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  const expectedTag = canonicalScopedTag(args.scope, pkg.version);
  if (process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('scoped publication is allowed only from GitHub Actions');
  }
  assertReleaseContext({
    expectedTag,
    eventName: process.env.GITHUB_EVENT_NAME,
    eventAction: process.env.RELEASE_EVENT_ACTION,
    draft: process.env.RELEASE_IS_DRAFT,
    prerelease: process.env.RELEASE_IS_PRERELEASE,
    releaseTag: process.env.RELEASE_TAG_NAME,
    githubRef: process.env.GITHUB_REF,
  });
  const headCommit = runGit(['rev-parse', 'HEAD']);
  assertCommitBinding({
    expectedTag,
    taggedCommit: runGit(['rev-list', '-n', '1', expectedTag]),
    headCommit,
    githubSha: process.env.GITHUB_SHA,
    status: runGit(['status', '--porcelain']),
  });
  if (args.evidence) {
    const evidencePath = resolveSafeRepositoryFile(ROOT, args.evidence, 'release evidence');
    const manifest = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    const artifactInspection = inspectEvidenceArtifact({ manifest });
    assertEvidenceBinding({
      manifest,
      label: args.label,
      packageName: pkg.name,
      version: pkg.version,
      githubSha: process.env.GITHUB_SHA,
      artifactInspection,
    });
  }
  console.log(`Scoped release readiness passed: ${pkg.name}@${pkg.version} from ${expectedTag}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

export {
  assertCommitBinding,
  assertEvidenceBinding,
  assertReleaseContext,
  canonicalScopedTag,
  inspectEvidenceArtifact,
  parseArguments,
  resolveSafeRepositoryFile,
};
