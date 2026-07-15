'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  decidePublication,
  loadLocalEvidence,
  parseArguments,
  parseRegistryResult,
  writeGithubOutput,
} = require('../scripts/check-publish-duplicate');
const {
  assertCanonicalTagExists,
  assertCanonicalWorkflowRef,
  assertTagCommit,
  canonicalCoreTag,
  normalizeCommandOutput,
  observeGithubRelease,
} = require('../scripts/check-release-readiness');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const FULL_SHA = '1234567890abcdef1234567890abcdef12345678';
const OTHER_SHA = 'abcdef1234567890abcdef1234567890abcdef12';
const INTEGRITY = 'sha512-c2FtZS1hcnRpZmFjdA==';
const SHASUM = '1234567890abcdef1234567890abcdef12345678';

function localArtifact() {
  return {
    name: '@aikdna/kdna-core',
    version: '0.18.0',
    githubSha: FULL_SHA,
    integrity: INTEGRITY,
    shasum: SHASUM,
  };
}

function registryArtifact(overrides = {}) {
  return {
    name: '@aikdna/kdna-core',
    version: '0.18.0',
    gitHead: FULL_SHA,
    dist: { integrity: INTEGRITY, shasum: SHASUM },
    ...overrides,
  };
}

function writeEvidence(directory, overrides = {}) {
  const pack = {
    label: 'core',
    package_name: '@aikdna/kdna-core',
    version: '0.18.0',
    integrity: INTEGRITY,
    shasum: SHASUM,
    ...overrides.pack,
  };
  const artifact = { ...pack, ...overrides.manifestArtifact };
  const manifest = {
    source_repository: 'aikdna/kdna',
    source_commit: FULL_SHA,
    git_dirty: false,
    selected_packages: ['core'],
    artifacts: [artifact],
    ...overrides.manifest,
  };
  fs.writeFileSync(path.join(directory, 'core.npm-pack.json'), JSON.stringify(pack));
  fs.writeFileSync(path.join(directory, 'artifact-manifest.json'), JSON.stringify(manifest));
}

test('duplicate publication guard publishes only when the exact version is absent', () => {
  assert.deepEqual(decidePublication({ local: localArtifact(), registry: null }), {
    publishRequired: true,
    message: '@aikdna/kdna-core@0.18.0 is not published; publication is required.',
  });
});

test('duplicate publication guard skips only the same commit and artifact', () => {
  const decision = decidePublication({
    local: localArtifact(),
    registry: registryArtifact(),
  });
  assert.equal(decision.publishRequired, false);
  assert.match(decision.message, /same commit and artifact; skipping publication/u);
});

test('duplicate publication guard fails closed on missing or mismatched identity', () => {
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({ gitHead: '' }),
      }),
    /registry gitHead must be a non-empty string/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({ gitHead: OTHER_SHA }),
      }),
    /does not match GITHUB_SHA/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({ dist: { integrity: 'sha512-other', shasum: SHASUM } }),
      }),
    /dist\.integrity does not match/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({ dist: { shasum: SHASUM } }),
      }),
    /registry dist\.integrity must be a non-empty string/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({ dist: { integrity: INTEGRITY } }),
      }),
    /registry dist\.shasum must be a non-empty string/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({
          dist: { integrity: INTEGRITY, shasum: SHASUM.toUpperCase() },
        }),
      }),
    /lowercase 40-character hexadecimal SHA-1/u,
  );
  assert.throws(
    () =>
      decidePublication({
        local: localArtifact(),
        registry: registryArtifact({
          dist: { integrity: INTEGRITY, shasum: OTHER_SHA },
        }),
      }),
    /dist\.shasum does not match/u,
  );
});

test('duplicate publication guard binds npm-pack evidence to clean workflow commit', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-publish-evidence-'));
  try {
    writeEvidence(tempDirectory);
    assert.deepEqual(
      loadLocalEvidence({
        evidenceRoot: tempDirectory,
        packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
        githubSha: FULL_SHA,
      }),
      localArtifact(),
    );

    writeEvidence(tempDirectory, { manifest: { source_commit: OTHER_SHA } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /source_commit .* does not match GITHUB_SHA/u,
    );

    writeEvidence(tempDirectory, { manifest: { git_dirty: true } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /dirty worktree/u,
    );

    writeEvidence(tempDirectory, { pack: { shasum: undefined } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /Core npm-pack evidence shasum must be a non-empty string/u,
    );

    writeEvidence(tempDirectory, { pack: { shasum: SHASUM.toUpperCase() } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /Core npm-pack evidence shasum must be a lowercase 40-character/u,
    );

    writeEvidence(tempDirectory, { manifestArtifact: { shasum: undefined } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /release artifact manifest Core shasum must be a non-empty string/u,
    );

    writeEvidence(tempDirectory, {
      manifestArtifact: { shasum: SHASUM.toUpperCase() },
    });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /release artifact manifest Core shasum must be a lowercase 40-character/u,
    );

    writeEvidence(tempDirectory, { manifestArtifact: { shasum: OTHER_SHA } });
    assert.throws(
      () =>
        loadLocalEvidence({
          evidenceRoot: tempDirectory,
          packageManifest: { name: '@aikdna/kdna-core', version: '0.18.0' },
          githubSha: FULL_SHA,
        }),
      /does not match the release artifact manifest/u,
    );
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test('npm registry lookup accepts only a structured exact-version miss', () => {
  assert.equal(
    parseRegistryResult(
      {
        status: 1,
        stdout: JSON.stringify({
          error: {
            code: 'E404',
            summary: 'No match found for version 0.18.0',
            detail: 'known package, exact version absent',
          },
        }),
        stderr: 'npm error code E404',
      },
      '@aikdna/kdna-core@0.18.0',
    ),
    null,
  );
});

test('npm registry lookup fails closed for package absence and E404 injection', () => {
  assert.throws(
    () =>
      parseRegistryResult(
        {
          status: 1,
          stdout: JSON.stringify({
            error: {
              code: 'E404',
              summary: 'Not Found - GET https://registry.npmjs.org/@aikdna%2fmissing - Not found',
              detail: 'package does not exist',
            },
          }),
          stderr: 'npm error code E404',
        },
        '@aikdna/missing@0.18.0',
      ),
    /npm view failed/u,
  );
  const exactMissingJson = JSON.stringify({
    error: {
      code: 'E404',
      summary: 'No match found for version 0.18.0',
      detail: 'known package, exact version absent',
    },
  });
  assert.throws(
    () =>
      parseRegistryResult(
        {
          status: 1,
          stdout: '',
          stderr: `proxy diagnostic\n${exactMissingJson}`,
        },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        { status: 1, stdout: `npm prefix\n${exactMissingJson}`, stderr: '' },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        { status: 1, stdout: `${exactMissingJson}\nnpm suffix`, stderr: '' },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        {
          status: 1,
          stdout: '',
          stderr:
            'proxy outage injected E404: No match found for version 0.18.0 without structured npm JSON',
        },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        {
          status: 1,
          stdout: JSON.stringify({
            error: {
              code: 'E404',
              summary: 'No match found for version 9.9.9',
              detail: 'different exact version',
            },
          }),
          stderr: '',
        },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
});

test('npm registry lookup fails closed for authorization and outage errors', () => {
  for (const code of ['E401', 'E403']) {
    assert.throws(
      () =>
        parseRegistryResult(
          {
            status: 1,
            stdout: JSON.stringify({
              error: {
                code,
                summary: 'No match found for version 0.18.0',
                detail: 'authorization error containing misleading E404 text',
              },
            }),
            stderr: `npm error code ${code}`,
          },
          '@aikdna/kdna-core@0.18.0',
        ),
      /npm view failed/u,
    );
  }
  assert.throws(
    () =>
      parseRegistryResult(
        { status: 1, stdout: '', stderr: 'npm error code EAI_AGAIN' },
        '@aikdna/kdna-core@0.18.0',
      ),
    /npm view failed/u,
  );
});

test('publication guard writes an explicit GitHub Actions decision', () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-github-output-'));
  const outputPath = path.join(tempDirectory, 'output');
  try {
    writeGithubOutput(outputPath, false);
    writeGithubOutput(outputPath, true);
    assert.equal(fs.readFileSync(outputPath, 'utf8'), 'publish_required=false\npublish_required=true\n');
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});

test('publication guard rejects empty workflow output paths', () => {
  assert.throws(() => parseArguments(['--github-output=']), /requires a path/u);
  assert.throws(() => parseArguments(['--evidence-root=']), /requires a path/u);
});

test('release readiness accepts only the canonical Core version tag', () => {
  const expectedTag = canonicalCoreTag('0.18.0');
  assert.equal(expectedTag, 'kdna-core-v0.18.0');
  assert.doesNotThrow(() => assertCanonicalTagExists({ expectedTag, listedTag: expectedTag }));
  assert.throws(
    () => assertCanonicalTagExists({ expectedTag, listedTag: 'v0.18.0' }),
    /Canonical tag kdna-core-v0\.18\.0 not found/u,
  );
  assert.throws(() => canonicalCoreTag('v0.18.0'), /invalid Core package version/u);
});

test('release readiness requires the workflow tag suffix to equal the package version', () => {
  assert.doesNotThrow(() =>
    assertCanonicalWorkflowRef({
      expectedTag: 'kdna-core-v0.18.0',
      githubRef: 'refs/tags/kdna-core-v0.18.0',
    }),
  );
  assert.throws(
    () =>
      assertCanonicalWorkflowRef({
        expectedTag: 'kdna-core-v0.18.0',
        githubRef: 'refs/tags/kdna-core-v0.18.0-recovery',
      }),
    /does not exactly match package version tag/u,
  );
  assert.throws(
    () =>
      assertCanonicalWorkflowRef({ expectedTag: 'kdna-core-v0.18.0', githubRef: null }),
    /GITHUB_REF <missing>/u,
  );
});

test('release readiness binds canonical tag, HEAD, and GITHUB_SHA', () => {
  assert.doesNotThrow(() =>
    assertTagCommit({
      expectedTag: 'kdna-core-v0.18.0',
      taggedCommit: FULL_SHA,
      headCommit: FULL_SHA,
      githubSha: FULL_SHA,
    }),
  );
  assert.throws(
    () =>
      assertTagCommit({
        expectedTag: 'kdna-core-v0.18.0',
        taggedCommit: OTHER_SHA,
        headCommit: FULL_SHA,
        githubSha: FULL_SHA,
      }),
    /points to/u,
  );
  assert.throws(
    () =>
      assertTagCommit({
        expectedTag: 'kdna-core-v0.18.0',
        taggedCommit: FULL_SHA,
        headCommit: FULL_SHA,
        githubSha: OTHER_SHA,
      }),
    /GITHUB_SHA .* does not match/u,
  );
});

test('GitHub Release observation reports SKIP without a false PASS', () => {
  const logs = [];
  const status = observeGithubRelease({
    coreTag: 'kdna-core-v0.18.0',
    repo: 'aikdna/kdna',
    runGh: () => {
      throw new Error('not authenticated');
    },
    log: (message) => logs.push(message),
  });
  assert.equal(status, 'skipped');
  assert.equal(logs.length, 1);
  assert.match(logs[0], /SKIP GitHub Release observation/u);
  assert.doesNotMatch(logs[0], /PASS/u);
});

test('ignored command output is normalized without throwing', () => {
  assert.equal(normalizeCommandOutput(null), '');
  assert.equal(normalizeCommandOutput(undefined), '');
  assert.equal(normalizeCommandOutput('  value\n'), 'value');
});

test('publish workflow keeps Core on release-published canonical tags only', () => {
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'publish.yml'), 'utf8');
  const coreStart = workflow.indexOf('  publish-core:');
  const coreEnd = workflow.indexOf('\n  publish-eval:', coreStart);
  assert.notEqual(coreStart, -1);
  assert.notEqual(coreEnd, -1);
  const coreJob = workflow.slice(coreStart, coreEnd);

  assert.match(
    coreJob,
    /if: github\.event_name == 'release' && github\.event\.action == 'published' && github\.event\.release\.draft == false && github\.event\.release\.prerelease == false && startsWith\(github\.event\.release\.tag_name, 'kdna-core-v'\)/u,
  );
  assert.doesNotMatch(coreJob, /workflow_dispatch/u);
  assert.equal((coreJob.match(/uses: actions\/checkout@/gu) || []).length, 1);
  assert.doesNotMatch(coreJob, /\.ecosystem-repos/u);

  const releaseCheck = coreJob.indexOf('run: npm --workspace @aikdna/kdna-core run release:check');
  const evidence = coreJob.indexOf('run: npm run release:evidence -- --package=core');
  const duplicateGuard = coreJob.indexOf('id: core-publish-guard');
  const publish = coreJob.indexOf('if: steps.core-publish-guard.outputs.publish_required');
  assert.ok(releaseCheck > 0 && releaseCheck < evidence);
  assert.ok(evidence < duplicateGuard && duplicateGuard < publish);
});
