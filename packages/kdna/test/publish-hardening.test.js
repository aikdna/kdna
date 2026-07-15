'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  assertCanonicalTagExists,
  assertCanonicalWorkflowRef,
  assertChangelogEntry,
  assertTagCommit,
  canonicalCompatTag,
} = require('../scripts/check-release-readiness');
const {
  decidePublication,
  loadLocalEvidence,
  parseArguments,
  parseRegistryResult,
  writeGithubOutput,
} = require('../scripts/check-publish-duplicate');
const { assertExactArtifact, hashArtifact } = require('../scripts/prepare-release-artifact');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const SHA = '1234567890abcdef1234567890abcdef12345678';
const OTHER_SHA = 'abcdef1234567890abcdef1234567890abcdef12';

function localEvidence(overrides = {}) {
  return {
    name: '@aikdna/kdna',
    version: '0.13.0',
    githubSha: SHA,
    integrity: 'sha512-local',
    shasum: '0123456789abcdef0123456789abcdef01234567',
    ...overrides,
  };
}

function registryEvidence(overrides = {}) {
  return {
    name: '@aikdna/kdna',
    version: '0.13.0',
    dist: {
      integrity: 'sha512-local',
      shasum: '0123456789abcdef0123456789abcdef01234567',
    },
    ...overrides,
  };
}

test('canonical compatibility tag is derived from one exact package version', () => {
  assert.equal(canonicalCompatTag('0.13.0'), 'kdna-v0.13.0');
  assert.throws(() => canonicalCompatTag('latest'), /invalid compatibility package version/u);
  assert.throws(() => canonicalCompatTag(''), /invalid compatibility package version/u);
});

test('release readiness requires the exact tag, workflow ref, and workflow commit', () => {
  assert.doesNotThrow(() =>
    assertCanonicalTagExists({ expectedTag: 'kdna-v0.13.0', listedTag: 'kdna-v0.13.0' }),
  );
  assert.throws(
    () => assertCanonicalTagExists({ expectedTag: 'kdna-v0.13.0', listedTag: '' }),
    /not found/u,
  );
  assert.doesNotThrow(() =>
    assertCanonicalWorkflowRef({
      expectedTag: 'kdna-v0.13.0',
      githubRef: 'refs/tags/kdna-v0.13.0',
    }),
  );
  assert.throws(
    () =>
      assertCanonicalWorkflowRef({
        expectedTag: 'kdna-v0.13.0',
        githubRef: 'refs/tags/kdna-v0.13.0-extra',
      }),
    /does not exactly match/u,
  );
  assert.doesNotThrow(() =>
    assertTagCommit({
      expectedTag: 'kdna-v0.13.0',
      taggedCommit: SHA,
      headCommit: SHA,
      githubSha: SHA,
    }),
  );
  assert.throws(
    () =>
      assertTagCommit({
        expectedTag: 'kdna-v0.13.0',
        taggedCommit: OTHER_SHA,
        headCommit: SHA,
        githubSha: SHA,
      }),
    /not HEAD/u,
  );
  assert.throws(
    () =>
      assertTagCommit({
        expectedTag: 'kdna-v0.13.0',
        taggedCommit: SHA,
        headCommit: SHA,
        githubSha: OTHER_SHA,
      }),
    /does not match tagged HEAD/u,
  );
});

test('release readiness requires an exact dated changelog heading', () => {
  assert.doesNotThrow(() =>
    assertChangelogEntry({ changelog: '## 0.13.0 (2026-07-15)\n', version: '0.13.0' }),
  );
  assert.throws(
    () => assertChangelogEntry({ changelog: 'future 0.13.0 notes\n', version: '0.13.0' }),
    /missing an exact dated heading/u,
  );
});

test('duplicate publication guard publishes only when the exact version is absent', () => {
  assert.deepEqual(decidePublication({ local: localEvidence(), registry: null }), {
    publishRequired: true,
    message: '@aikdna/kdna@0.13.0 is not published; publication is required.',
  });
});

test('duplicate publication guard skips only the same commit and artifact', () => {
  assert.deepEqual(
    decidePublication({ local: localEvidence(), registry: registryEvidence() }),
    {
      publishRequired: false,
      message:
        '@aikdna/kdna@0.13.0 already exists with the same commit and artifact; skipping publication.',
    },
  );
});

test('duplicate publication guard fails closed on registry artifact drift without requiring gitHead', () => {
  assert.throws(
    () =>
      decidePublication({
        local: localEvidence(),
        registry: registryEvidence({
          dist: {
            integrity: 'sha512-other',
            shasum: '0123456789abcdef0123456789abcdef01234567',
          },
        }),
      }),
    /dist\.integrity/u,
  );
  assert.throws(
    () => decidePublication({ local: localEvidence(), registry: {} }),
    /registry metadata identifies/u,
  );
});

test('registry absence is accepted only from the exact structured npm E404', () => {
  const spec = '@aikdna/kdna@0.13.0';
  assert.equal(
    parseRegistryResult(
      {
        status: 1,
        stdout: JSON.stringify({
          error: { code: 'E404', summary: 'No match found for version 0.13.0' },
        }),
        stderr: 'npm error',
      },
      spec,
    ),
    null,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        {
          status: 1,
          stdout: JSON.stringify({
            error: { code: 'E404', summary: 'Package access denied' },
          }),
          stderr: '',
        },
        spec,
      ),
    /npm view failed/u,
  );
  assert.throws(
    () =>
      parseRegistryResult(
        { status: 1, stdout: '', stderr: 'E404 No match found for version 0.13.0' },
        spec,
      ),
    /npm view failed/u,
  );
});

test('publication guard binds pack evidence to the clean workflow commit', () => {
  const evidenceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-evidence-'));
  const artifactBuffer = Buffer.from('exact compatibility artifact');
  const hashes = hashArtifact(artifactBuffer);
  const pack = {
    label: 'compat',
    package_name: '@aikdna/kdna',
    version: '0.13.0',
    filename: 'aikdna-kdna-0.13.0.tgz',
    integrity: hashes.integrity,
    shasum: hashes.shasum,
  };
  fs.writeFileSync(path.join(evidenceRoot, pack.filename), artifactBuffer);
  fs.writeFileSync(path.join(evidenceRoot, 'compat.npm-pack.json'), JSON.stringify(pack));
  fs.writeFileSync(
    path.join(evidenceRoot, 'artifact-manifest.json'),
    JSON.stringify({
      source_repository: 'aikdna/kdna',
      source_commit: SHA,
      git_dirty: false,
      selected_packages: ['compat'],
      artifacts: [pack],
    }),
  );

  const observed = loadLocalEvidence({
    evidenceRoot,
    packageManifest: { name: '@aikdna/kdna', version: '0.13.0' },
    githubSha: SHA,
  });
  assert.deepEqual(observed, {
    name: '@aikdna/kdna',
    version: '0.13.0',
    githubSha: SHA,
    integrity: hashes.integrity,
    shasum: hashes.shasum,
    artifactPath: path.join(evidenceRoot, pack.filename),
  });

  const dirtyManifest = JSON.parse(
    fs.readFileSync(path.join(evidenceRoot, 'artifact-manifest.json'), 'utf8'),
  );
  dirtyManifest.git_dirty = true;
  fs.writeFileSync(path.join(evidenceRoot, 'artifact-manifest.json'), JSON.stringify(dirtyManifest));
  assert.throws(
    () =>
      loadLocalEvidence({
        evidenceRoot,
        packageManifest: { name: '@aikdna/kdna', version: '0.13.0' },
        githubSha: SHA,
      }),
    /dirty worktree/u,
  );
});

test('exact release pack must match both dry-run metadata and tarball bytes', () => {
  const artifactBuffer = Buffer.from('same bytes');
  const hashes = hashArtifact(artifactBuffer);
  const actualPack = {
    name: '@aikdna/kdna',
    version: '0.13.0',
    filename: 'aikdna-kdna-0.13.0.tgz',
    ...hashes,
  };
  const packEvidence = {
    package_name: actualPack.name,
    version: actualPack.version,
    filename: actualPack.filename,
    ...hashes,
  };
  assert.deepEqual(assertExactArtifact({ packEvidence, actualPack, artifactBuffer }), hashes);
  assert.throws(
    () =>
      assertExactArtifact({
        packEvidence,
        actualPack,
        artifactBuffer: Buffer.from('different bytes'),
      }),
    /do not match npm pack/u,
  );
});

test('publication guard writes and validates explicit workflow decisions', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-output-'));
  const output = path.join(temp, 'github-output');
  writeGithubOutput(output, true);
  writeGithubOutput(output, false);
  assert.equal(
    fs.readFileSync(output, 'utf8'),
    'publish_required=true\npublish_required=false\n',
  );
  assert.deepEqual(parseArguments([`--evidence-root=${temp}`, `--github-output=${output}`]), {
    evidenceRoot: temp,
    githubOutput: output,
  });
  assert.throws(() => parseArguments(['--github-output=']), /requires a path/u);
  assert.throws(() => parseArguments(['--unknown']), /unknown argument/u);
});

test('publish workflow keeps compatibility release gates ordered and pinned', () => {
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'publish.yml'), 'utf8');
  const compatStart = workflow.indexOf('  publish-compat:');
  const compatEnd = workflow.indexOf('\n  publish-agent:', compatStart);
  assert.notEqual(compatStart, -1);
  assert.notEqual(compatEnd, -1);
  const compatJob = workflow.slice(compatStart, compatEnd);

  assert.match(
    compatJob,
    /if: github\.event_name == 'release' && github\.event\.action == 'published' && startsWith\(github\.ref, 'refs\/tags\/kdna-v'\)/u,
  );
  assert.match(compatJob, /fetch-depth: 0/u);
  assert.match(compatJob, /ref: dcc5f70df4cbb0460ef27222d5c1e6fa3e632888/u);
  assert.doesNotMatch(compatJob, /ref: (?:main|master|latest)\s*$/mu);

  const releaseCheck = compatJob.indexOf(
    'run: npm --workspace @aikdna/kdna run release:check',
  );
  const ecosystemGate = compatJob.indexOf('run: npm run ecosystem-gate');
  const evidence = compatJob.indexOf('run: npm run release:evidence -- --package=compat');
  const exactPack = compatJob.indexOf(
    'run: npm --workspace @aikdna/kdna run release:pack',
  );
  const cleanInstall = compatJob.indexOf(
    'run: npm --workspace @aikdna/kdna run release:smoke',
  );
  const duplicateGuard = compatJob.indexOf('id: compat-publish-guard');
  const publish = compatJob.indexOf(
    "if: steps.compat-publish-guard.outputs.publish_required == 'true'",
  );
  assert.ok(releaseCheck > 0 && releaseCheck < ecosystemGate);
  assert.ok(
    ecosystemGate < evidence &&
      evidence < exactPack &&
      exactPack < cleanInstall &&
      cleanInstall < duplicateGuard &&
      duplicateGuard < publish,
  );
  assert.match(
    compatJob,
    /npm publish "release-evidence\/\$\(node -p .*compat\.npm-pack\.json.*filename.*\)" --provenance --access public/u,
  );
  assert.doesNotMatch(compatJob, /working-directory: packages\/kdna/u);
  assert.doesNotMatch(compatJob, /uses: actions\/(?:checkout|setup-node|upload-artifact)@v\d/u);
  assert.doesNotMatch(compatJob, /workflow_dispatch/u);
});
