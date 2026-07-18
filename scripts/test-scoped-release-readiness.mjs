#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  assertCommitBinding,
  assertEvidenceBinding,
  assertReleaseContext,
  canonicalScopedTag,
  inspectEvidenceArtifact,
} from './check-scoped-release-readiness.mjs';

const SHA = '1'.repeat(40);
const OTHER_SHA = '2'.repeat(40);
const TAG = 'eval/0.3.2';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_GENERATOR_PATH = path.join(REPO_ROOT, 'scripts', 'generate-release-evidence.js');
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
    source_repository: 'aikdna/kdna',
    source_commit: SHA,
    git_dirty: false,
    selected_packages: ['eval'],
    artifacts: [],
    ...overrides,
  };
}

function artifactFixture(t, { packageName = '@aikdna/kdna-eval', version = '0.3.2' } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-eval-release-'));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  const stageRoot = path.join(repoRoot, 'stage');
  const packageRoot = path.join(stageRoot, 'package');
  const outputRoot = path.join(repoRoot, 'release-evidence');
  fs.mkdirSync(packageRoot, { recursive: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packageRoot, 'package.json'),
    JSON.stringify({ name: packageName, version }),
    'utf8',
  );
  const filename = 'aikdna-kdna-eval-0.3.2.tgz';
  const artifactPath = path.join(outputRoot, filename);
  execFileSync('tar', ['-czf', artifactPath, '-C', stageRoot, 'package']);
  const bytes = fs.readFileSync(artifactPath);
  const artifact = {
    label: 'eval',
    package_name: '@aikdna/kdna-eval',
    version: '0.3.2',
    filename,
    artifact_path: `release-evidence/${filename}`,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    shasum: crypto.createHash('sha1').update(bytes).digest('hex'),
    integrity: `sha512-${crypto.createHash('sha512').update(bytes).digest('base64')}`,
    size: bytes.length,
    publish_command: `npm publish "./release-evidence/${filename}" --provenance --access public`,
    npm_provenance_required: true,
  };
  const manifest = evidence({ artifacts: [artifact] });
  return {
    artifact,
    artifactPath,
    manifest,
    repoRoot,
    inspection: inspectEvidenceArtifact({ manifest, repoRoot }),
  };
}

test('scoped tag is exactly scope plus stable package version', () => {
  assert.equal(canonicalScopedTag('eval', '0.3.2'), TAG);
  assert.throws(() => canonicalScopedTag('eval', '0.3.2-extra'), /invalid stable package version/u);
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

test('release evidence binds one exact package artifact to GITHUB_SHA', (t) => {
  const fixture = artifactFixture(t);
  const input = {
    manifest: fixture.manifest,
    label: 'eval',
    packageName: '@aikdna/kdna-eval',
    version: '0.3.2',
    githubSha: SHA,
    artifactInspection: fixture.inspection,
  };
  assert.doesNotThrow(() => assertEvidenceBinding(input));
  for (const manifest of [
    { ...fixture.manifest, source_commit: OTHER_SHA },
    { ...fixture.manifest, source_repository: 'attacker/kdna' },
    { ...fixture.manifest, git_dirty: true },
    { ...fixture.manifest, selected_packages: ['eval', 'agent'] },
    { ...fixture.manifest, artifacts: [] },
    {
      ...fixture.manifest,
      artifacts: [{ ...fixture.artifact, version: '0.3.3' }],
    },
    {
      ...fixture.manifest,
      artifacts: [{ ...fixture.artifact, sha256: 'f'.repeat(64) }],
    },
    {
      ...fixture.manifest,
      artifacts: [{ ...fixture.artifact, npm_provenance_required: false }],
    },
  ]) {
    assert.throws(() => assertEvidenceBinding({ ...input, manifest }));
  }
});

test('release artifact inspection rejects unsafe paths, symlinks, and wrong package identity', (t) => {
  const fixture = artifactFixture(t);
  for (const artifactPath of [
    '../outside.tgz',
    '/tmp/outside.tgz',
    'release-evidence/../outside.tgz',
    'release-evidence\\outside.tgz',
  ]) {
    const manifest = {
      ...fixture.manifest,
      artifacts: [
        {
          ...fixture.artifact,
          artifact_path: artifactPath,
          filename: path.posix.basename(artifactPath),
        },
      ],
    };
    assert.throws(() => inspectEvidenceArtifact({ manifest, repoRoot: fixture.repoRoot }));
  }

  const symlinkName = 'linked.tgz';
  fs.symlinkSync(
    fixture.artifactPath,
    path.join(fixture.repoRoot, 'release-evidence', symlinkName),
  );
  const symlinkManifest = {
    ...fixture.manifest,
    artifacts: [
      {
        ...fixture.artifact,
        filename: symlinkName,
        artifact_path: `release-evidence/${symlinkName}`,
      },
    ],
  };
  assert.throws(
    () => inspectEvidenceArtifact({ manifest: symlinkManifest, repoRoot: fixture.repoRoot }),
    /regular file, not a symlink/u,
  );

  const wrongIdentity = artifactFixture(t, { packageName: '@attacker/other', version: '9.9.9' });
  assert.throws(
    () =>
      assertEvidenceBinding({
        manifest: wrongIdentity.manifest,
        label: 'eval',
        packageName: '@aikdna/kdna-eval',
        version: '0.3.2',
        githubSha: SHA,
        artifactInspection: wrongIdentity.inspection,
      }),
    /package identity/u,
  );
});

test('release evidence generator retains and binds the real npm pack artifact', () => {
  execFileSync(process.execPath, [EVIDENCE_GENERATOR_PATH, '--package=eval'], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      npm_config_cache: path.join(REPO_ROOT, '.npm-cache', 'release-evidence-test'),
    },
  });
  const manifest = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, 'release-evidence', 'artifact-manifest.json'), 'utf8'),
  );
  const inspection = inspectEvidenceArtifact({ manifest, repoRoot: REPO_ROOT });
  const [artifact] = manifest.artifacts;

  assert.equal(artifact.artifact_path, inspection.relativePath);
  assert.equal(artifact.size, inspection.size);
  assert.equal(artifact.sha256, inspection.sha256);
  assert.equal(artifact.shasum, inspection.shasum);
  assert.equal(artifact.integrity, inspection.integrity);
  assert.equal(artifact.package_name, inspection.packageName);
  assert.equal(artifact.version, inspection.version);
  assert.doesNotThrow(() =>
    assertEvidenceBinding({
      manifest: { ...manifest, source_commit: SHA, git_dirty: false },
      label: 'eval',
      packageName: '@aikdna/kdna-eval',
      version: '0.3.2',
      githubSha: SHA,
      artifactInspection: inspection,
    }),
  );
  const packDryRun = JSON.parse(
    execFileSync(
      'npm',
      ['pack', `./${artifact.artifact_path}`, '--dry-run', '--ignore-scripts', '--json'],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          npm_config_cache: path.join(REPO_ROOT, '.npm-cache', 'release-evidence-test'),
        },
      },
    ),
  );
  assert.equal(packDryRun[0]?.id, '@aikdna/kdna-eval@0.3.2');
  assert.equal(packDryRun[0]?.filename, artifact.filename);
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
    const artifactSelection = job.indexOf('name: Select the verified Eval artifact');
    const publication = job.indexOf('name: Publish');
    assert.ok(releaseCheck > -1, `${name} must run release:check`);
    assert.ok(evidenceGeneration > releaseCheck, `${name} evidence must follow source checks`);
    assert.ok(evidenceCheck > evidenceGeneration, `${name} must verify generated evidence`);
    assert.ok(
      artifactSelection > evidenceCheck,
      `${name} must select the artifact only after verification`,
    );
    assert.ok(publication > artifactSelection, `${name} publish must follow every release gate`);
    assert.match(job, /EVAL_RELEASE_ARTIFACT/u);
    assert.match(job, /npm publish "\.\/\$EVAL_RELEASE_ARTIFACT" --provenance --access public/u);
    assert.doesNotMatch(job, /npm publish "\$EVAL_RELEASE_ARTIFACT" --provenance --access public/u);
    assert.doesNotMatch(job, /working-directory: packages\/kdna-eval/u);
  }
  assert.doesNotMatch(
    PUBLISH_WORKFLOW,
    /publish-agent|working-directory: examples\/typescript-agent|Publish @aikdna\/agent/u,
  );
});
