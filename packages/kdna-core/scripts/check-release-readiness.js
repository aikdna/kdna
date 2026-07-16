#!/usr/bin/env node
'use strict';

const ROOT_AUTHORITY = require('../../../scripts/core-release-authority');

function normalizeCommandOutput(output) {
  return typeof output === 'string' ? output.trim() : '';
}

function canonicalCoreTag(version) {
  if (
    typeof version !== 'string' ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/u.test(version)
  ) {
    throw new Error(`invalid Core package version: ${version || '<missing>'}`);
  }
  return version;
}

function assertCanonicalTagExists({ expectedTag, listedTag }) {
  if (listedTag !== expectedTag) {
    throw new Error(
      `Canonical tag ${expectedTag} not found. Run: git tag ${expectedTag} && git push origin ${expectedTag}`,
    );
  }
}

function assertCanonicalWorkflowRef({ expectedTag, githubRef }) {
  const expectedRef = `refs/tags/${expectedTag}`;
  if (githubRef !== expectedRef) {
    throw new Error(
      `GITHUB_REF ${githubRef || '<missing>'} does not exactly match package version tag ${expectedRef}`,
    );
  }
}

function assertTagCommit({ expectedTag, taggedCommit, headCommit, githubSha }) {
  if (taggedCommit !== headCommit) {
    throw new Error(
      `${expectedTag} points to ${taggedCommit.slice(0, 12)}, not HEAD ${headCommit.slice(0, 12)}`,
    );
  }
  if (githubSha !== null && githubSha !== headCommit) {
    throw new Error(
      `GITHUB_SHA ${githubSha.slice(0, 12)} does not match tagged HEAD ${headCommit.slice(0, 12)}`,
    );
  }
}

function observeGithubRelease({ coreTag, repo, runGh, log = console.log }) {
  try {
    runGh(['auth', 'status']);
  } catch {
    log(`  SKIP GitHub Release observation for ${coreTag}: gh is not authenticated (not a publish gate)`);
    return 'skipped';
  }
  try {
    runGh(['release', 'view', coreTag, '--repo', repo]);
    log(`  OBSERVED GitHub Release ${coreTag}`);
    return 'observed';
  } catch {
    log(`  SKIP GitHub Release observation for ${coreTag}: release not found (not a publish gate)`);
    return 'skipped';
  }
}

function main() {
  if (process.env.npm_lifecycle_event === 'prepublishOnly') {
    throw new Error(
      'direct worktree publication is forbidden; publish only through scripts/core-release-authority.js and its retained artifact',
    );
  }
  const authoritative = ROOT_AUTHORITY.inspectAuthoritativeRelease();
  console.log(
    `Authoritative Core release binding passed: ${authoritative.name}@${authoritative.version} ${authoritative.commit}`,
  );
}

if (require.main === module) main();

module.exports = {
  assertCanonicalTagExists,
  assertCanonicalWorkflowRef,
  assertTagCommit,
  canonicalCoreTag,
  normalizeCommandOutput,
  observeGithubRelease,
};
