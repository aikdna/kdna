#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  assertCommitBinding,
  assertEvidenceBinding,
  assertReleaseContext,
  canonicalScopedTag,
} from './check-scoped-release-readiness.mjs';

const SHA = '1'.repeat(40);
const OTHER_SHA = '2'.repeat(40);
const TAG = 'eval/0.3.1';
const PUBLISH_WORKFLOW = fs.readFileSync(
  new URL('../.github/workflows/publish.yml', import.meta.url),
  'utf8',
);

function workflowJob(name) {
  const match = new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z0-9-]+:|(?![\\s\\S]))`, 'mu').exec(
    PUBLISH_WORKFLOW,
  );
  assert.ok(match, `missing ${name} job`);
  return match[0];
}

function context(overrides = {}) {
  return {
    expectedTag: TAG,
    eventName: 'release',
    eventAction: 'published',
    draft: 'false',
    prerelease: 'false',
    releaseTag: TAG,
    githubRef: `refs/tags/${TAG}`,
    ...overrides,
  };
}

function evidence(overrides = {}) {
  return {
    source_commit: SHA,
    git_dirty: false,
    selected_packages: ['eval'],
    artifacts: [{ label: 'eval', package_name: '@aikdna/kdna-eval', version: '0.3.1' }],
    ...overrides,
  };
}

test('scoped tag is exactly scope plus stable package version', () => {
  assert.equal(canonicalScopedTag('eval', '0.3.1'), TAG);
  assert.throws(() => canonicalScopedTag('eval', '0.3.1-extra'), /invalid stable package version/u);
});

test('release context rejects prefix-only and mutable release inputs', () => {
  assert.doesNotThrow(() => assertReleaseContext(context()));
  for (const candidate of [
    context({ releaseTag: `${TAG}-forged` }),
    context({ githubRef: `refs/tags/${TAG}-forged` }),
    context({ eventAction: 'edited' }),
    context({ draft: 'true' }),
    context({ prerelease: 'true' }),
  ]) {
    assert.throws(() => assertReleaseContext(candidate));
  }
});

test('release commit binds tag, HEAD, GITHUB_SHA, and clean tree', () => {
  const valid = {
    expectedTag: TAG,
    taggedCommit: SHA,
    headCommit: SHA,
    githubSha: SHA,
    status: '',
  };
  assert.doesNotThrow(() => assertCommitBinding(valid));
  assert.throws(() => assertCommitBinding({ ...valid, taggedCommit: OTHER_SHA }), /identical/u);
  assert.throws(() => assertCommitBinding({ ...valid, githubSha: OTHER_SHA }), /identical/u);
  assert.throws(() => assertCommitBinding({ ...valid, status: ' M package.json' }), /clean/u);
});

test('release evidence binds one exact package artifact to GITHUB_SHA', () => {
  const input = {
    manifest: evidence(),
    label: 'eval',
    packageName: '@aikdna/kdna-eval',
    version: '0.3.1',
    githubSha: SHA,
  };
  assert.doesNotThrow(() => assertEvidenceBinding(input));
  for (const manifest of [
    evidence({ source_commit: OTHER_SHA }),
    evidence({ git_dirty: true }),
    evidence({ selected_packages: ['eval', 'agent'] }),
    evidence({ artifacts: [] }),
    evidence({
      artifacts: [{ label: 'eval', package_name: '@aikdna/kdna-eval', version: '0.3.2' }],
    }),
  ]) {
    assert.throws(() => assertEvidenceBinding({ ...input, manifest }));
  }
});

test('eval workflow gates the exact tag, commit, and evidence before publish', () => {
  for (const name of ['publish-eval']) {
    const job = workflowJob(name);
    assert.match(job, /ref: \$\{\{ github\.event\.release\.tag_name \}\}/u);
    assert.match(job, /fetch-depth: 0/u);
    assert.match(job, /fetch-tags: true/u);
    for (const binding of [
      'RELEASE_EVENT_ACTION',
      'RELEASE_TAG_NAME',
      'RELEASE_IS_DRAFT',
      'RELEASE_IS_PRERELEASE',
    ]) {
      assert.match(job, new RegExp(`^      ${binding}:`, 'mu'));
    }

    const releaseCheck = job.indexOf('release:check');
    const evidenceGeneration = job.indexOf('release:evidence --');
    const evidenceCheck = job.indexOf('release:evidence:check');
    const publication = job.indexOf('name: Publish');
    assert.ok(releaseCheck > -1, `${name} must run release:check`);
    assert.ok(evidenceGeneration > releaseCheck, `${name} evidence must follow source checks`);
    assert.ok(evidenceCheck > evidenceGeneration, `${name} must verify generated evidence`);
    assert.ok(publication > evidenceCheck, `${name} publish must follow every release gate`);
  }
  assert.doesNotMatch(
    PUBLISH_WORKFLOW,
    /publish-agent|working-directory: examples\/typescript-agent|Publish @aikdna\/agent/u,
  );
});
