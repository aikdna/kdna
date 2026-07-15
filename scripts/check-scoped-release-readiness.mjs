#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
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

function assertEvidenceBinding({ manifest, label, packageName, version, githubSha }) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('release evidence manifest must be an object');
  }
  if (manifest.source_commit !== githubSha) {
    throw new Error('release evidence source_commit must equal GITHUB_SHA');
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
    const evidencePath = path.resolve(ROOT, args.evidence);
    const relativeEvidencePath = path.relative(ROOT, evidencePath);
    if (relativeEvidencePath.startsWith('..') || path.isAbsolute(relativeEvidencePath)) {
      throw new Error('release evidence path must stay inside the repository');
    }
    assertEvidenceBinding({
      manifest: JSON.parse(fs.readFileSync(evidencePath, 'utf8')),
      label: args.label,
      packageName: pkg.name,
      version: pkg.version,
      githubSha: process.env.GITHUB_SHA,
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
  parseArguments,
};
