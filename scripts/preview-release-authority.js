#!/usr/bin/env node
'use strict';

// This is a separate, exact prerelease channel. Stable release policy is unchanged.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const trusted = require('./core-release-authority.js');
const ROOT = path.resolve(__dirname, '..');
const REPOSITORY = 'aikdna/kdna';
const DIST_TAG = 'browser-preview';
const BASE_COMMIT = 'c4299d751e0b5cac9474d2a95ce976c9cac0b267';
const HEX40 = /^[a-f0-9]{40}$/u;
const HEX64 = /^[a-f0-9]{64}$/u;
const POLICIES = Object.freeze({
  core: Object.freeze({
    name: '@aikdna/kdna-core',
    version: '0.37.1-rc.browser.1',
    directory: 'packages/kdna-core',
  }),
  read: Object.freeze({
    name: '@aikdna/kdna-read',
    version: '0.11.2-rc.browser.1',
    directory: 'packages/kdna-read',
  }),
});
const APPROVAL_KEYS = [
  'schema',
  'unit',
  'repository',
  'source_commit',
  'source_tree',
  'base_commit',
  'version',
  'dist_tag',
  'artifact_sha256',
  'notes_sha256',
  'companion',
];
function assert(value, message) {
  if (!value) throw new Error(message);
}
function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), label + ' must be an object');
  assert(
    JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort()),
    label + ' fields are not exact',
  );
}
function policy(unit) {
  assert(Object.hasOwn(POLICIES, unit), 'unsupported preview package');
  return POLICIES[unit];
}
function filename(pkg) {
  return pkg.name.slice(1).replace('/', '-') + '-' + pkg.version + '.tgz';
}
function git(args, root) {
  return trusted
    .runGit(args, { cwd: root, encoding: 'utf8', label: 'preview Git observation' })
    .stdout.trim();
}
function readRegular(file, label, maximum = 8 * 1024 * 1024) {
  const full = path.resolve(file);
  assert(fs.realpathSync(full) === full, label + ' must have a canonical path');
  const stat = fs.lstatSync(full);
  assert(
    stat.isFile() && !stat.isSymbolicLink() && stat.nlink === 1 && stat.size <= maximum,
    label + ' must be one bounded regular file',
  );
  return fs.readFileSync(full);
}
function readSource(tree, relative, root) {
  const entry = tree.entries.find((x) => x.path === relative);
  assert(entry, 'source file missing: ' + relative);
  return trusted.batchReadBlobs([entry], root)[0];
}
function previewNotes(text, unit) {
  const heading = '## ' + (unit === 'core' ? 'Core ' : 'Read ') + policy(unit).version;
  const sections = text.split(/(?=^## )/mu).filter((x) => x.startsWith(heading + '\n'));
  assert(sections.length === 1, 'exact preview change notes are missing or duplicated');
  const notes = sections[0].trim();
  assert(notes.length > heading.length + 30, 'preview change notes are empty');
  return notes;
}
function validateManifest(pkg, unit) {
  const expected = policy(unit);
  assert(
    pkg && pkg.name === expected.name && pkg.version === expected.version && pkg.private !== true,
    'preview source manifest identity mismatch',
  );
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const spec of Object.values(pkg[field] || {}))
      assert(
        typeof spec === 'string' &&
          /^\d+\.\d+\.\d+(?:-[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*)?$/u.test(spec),
        'preview package requires exact registry dependency coordinates',
      );
  }
  if (unit === 'read')
    assert(
      pkg.peerDependencies?.[POLICIES.core.name] === POLICIES.core.version,
      'preview Read exact Core peer mismatch',
    );
  return pkg;
}
function validateApproval(approval, unit) {
  const pkg = policy(unit);
  exactKeys(approval, APPROVAL_KEYS, 'preview approval');
  assert(approval.schema === 'kdna.preview-release-approval/1', 'preview approval schema mismatch');
  assert(
    approval.unit === unit && approval.repository === REPOSITORY,
    'preview approval target mismatch',
  );
  assert(approval.version === pkg.version, 'preview approval version mismatch');
  assert(
    approval.dist_tag === DIST_TAG && approval.dist_tag !== 'latest',
    'preview dist-tag must be browser-preview',
  );
  assert(approval.base_commit === BASE_COMMIT, 'preview approved baseline mismatch');
  assert(
    HEX40.test(approval.source_commit) && HEX40.test(approval.source_tree),
    'preview source coordinate invalid',
  );
  assert(
    HEX64.test(approval.artifact_sha256) && HEX64.test(approval.notes_sha256),
    'preview approved digest invalid',
  );
  if (unit === 'read') {
    exactKeys(
      approval.companion,
      ['name', 'version', 'sha256', 'integrity', 'shasum', 'gitHead'],
      'preview Core companion',
    );
    const peer = approval.companion;
    assert(
      peer.name === POLICIES.core.name && peer.version === POLICIES.core.version,
      'preview Core companion identity mismatch',
    );
    assert(
      HEX64.test(peer.sha256) &&
        HEX40.test(peer.shasum) &&
        /^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(peer.integrity),
      'preview Core companion digest invalid',
    );
    assert(peer.gitHead === approval.source_commit, 'preview Core companion source mismatch');
  } else assert(approval.companion === null, 'Core preview has no companion');
  return approval;
}
function parseReleaseBody(body, unit) {
  assert(typeof body === 'string', 'preview release body missing');
  const blocks = [...body.matchAll(/^```kdna-preview-release\n([\s\S]*?)\n```\s*$/gmu)];
  assert(blocks.length === 1, 'exactly one final preview approval block is required');
  const block = blocks[0];
  assert(
    body.slice(block.index + block[0].length).trim() === '',
    'preview approval must be the final release body block',
  );
  const notes = body.slice(0, block.index).trim();
  const approval = validateApproval(
    trusted.strictJson(Buffer.from(block[1]), 'preview approval'),
    unit,
  );
  assert(
    trusted.sha256(Buffer.from(notes)) === approval.notes_sha256,
    'preview release notes digest mismatch',
  );
  return { approval, notes };
}
function validateContext({ pkg, unit, notes, approval, event, env, observation }) {
  const expected = policy(unit);
  const tag = 'preview/' + unit + '/' + expected.version;
  validateManifest(pkg, unit);
  validateApproval(approval, unit);
  assert(
    env.GITHUB_ACTIONS === 'true' &&
      env.GITHUB_REPOSITORY === REPOSITORY &&
      env.GITHUB_SERVER_URL === 'https://github.com',
    'preview requires official GitHub Actions repository context',
  );
  assert(
    env.GITHUB_EVENT_NAME === 'release' && event.action === 'published',
    'preview requires a real published release event',
  );
  assert(
    event.repository?.full_name === REPOSITORY &&
      event.release?.draft === false &&
      event.release?.prerelease === true,
    'preview requires a nondraft prerelease in the exact repository',
  );
  assert(
    event.release.tag_name === tag &&
      event.release.html_url === 'https://github.com/' + REPOSITORY + '/releases/tag/' + tag,
    'preview event scoped tag mismatch',
  );
  assert(
    event.release.target_commitish === observation.commit,
    'preview release target must name the exact source commit',
  );
  assert(
    Number.isSafeInteger(event.release.id) &&
      event.release.id > 0 &&
      typeof event.release.published_at === 'string',
    'preview release identity missing',
  );
  assert(
    env.GITHUB_REF === 'refs/tags/' + tag &&
      env.GITHUB_REF_TYPE === 'tag' &&
      env.GITHUB_REF_NAME === tag,
    'preview GitHub tag ref mismatch',
  );
  assert(
    env.GITHUB_SHA === observation.commit &&
      approval.source_commit === observation.commit &&
      approval.source_tree === observation.tree,
    'preview source commit/tree mismatch',
  );
  assert(
    observation.tagCommit === observation.commit &&
      observation.clean === true &&
      observation.mainContainsSource === true,
    'preview tag/source/clean/main binding mismatch',
  );
  assert(
    observation.dco === true && observation.baseCommit === approval.base_commit,
    'preview source range DCO mismatch',
  );
  assert(
    trusted.sha256(Buffer.from(notes)) === approval.notes_sha256,
    'preview source change notes mismatch',
  );
  const parsed = parseReleaseBody(event.release.body, unit);
  assert(
    JSON.stringify(parsed.approval) === JSON.stringify(approval) && parsed.notes === notes,
    'preview event body does not match source notes and approved artifact',
  );
  return {
    unit,
    package: expected,
    tag,
    commit: observation.commit,
    tree: observation.tree,
    approval,
    notes_sha256: approval.notes_sha256,
    authorization: 'published-prerelease-event',
    release_id: event.release.id,
  };
}
function inspectSource(unit, root = ROOT, { requireMain = false, baseline = BASE_COMMIT } = {}) {
  const pkg = policy(unit);
  assert(
    fs.realpathSync(git(['rev-parse', '--show-toplevel'], root)) === fs.realpathSync(root),
    'preview repository root is ambiguous',
  );
  const commit = git(['rev-parse', '--verify', 'HEAD^{commit}'], root);
  const tree = trusted.inspectTree(commit, root);
  assert(
    git(['status', '--porcelain=v2', '--untracked-files=all'], root) === '',
    'preview source worktree must be clean',
  );
  trusted.assertIndexMatchesTree(tree, root);
  git(['merge-base', '--is-ancestor', baseline, commit], root);
  const commits = git(['rev-list', baseline + '..' + commit], root)
    .split('\n')
    .filter(Boolean);
  assert(
    commits.length > 0 && commits.length <= 100,
    'preview source range must be a bounded nonempty change',
  );
  for (const current of commits) trusted.commitDocument(current, root);
  const manifest = trusted.strictJson(
    readSource(tree, pkg.directory + '/package.json', root),
    'preview source manifest',
  );
  validateManifest(manifest, unit);
  const notes = previewNotes(
    readSource(tree, 'docs/release-preview-notes.md', root).toString('utf8'),
    unit,
  );
  if (requireMain) git(['merge-base', '--is-ancestor', commit, 'refs/remotes/origin/main'], root);
  return {
    unit,
    package: pkg,
    commit,
    tree: tree.tree,
    treeState: tree,
    notes,
    manifest,
    baseCommit: baseline,
    clean: true,
    dco: true,
    dco_commit_count: commits.length,
    mainContainsSource: requireMain,
  };
}
function inspectRelease(unit, env = process.env, root = ROOT) {
  const source = inspectSource(unit, root, { requireMain: true });
  const event = trusted.strictJson(
    readRegular(env.GITHUB_EVENT_PATH, 'GitHub release event'),
    'GitHub release event',
  );
  const { approval } = parseReleaseBody(event.release?.body, unit);
  const tag = 'preview/' + unit + '/' + source.package.version;
  git(['show-ref', '--verify', '--hash', 'refs/tags/' + tag], root);
  const tagCommit = git(['rev-parse', '--verify', 'refs/tags/' + tag + '^{commit}'], root);
  return {
    ...source,
    ...validateContext({
      pkg: source.manifest,
      unit,
      notes: source.notes,
      approval,
      event,
      env,
      observation: { ...source, tagCommit },
    }),
  };
}
function validateArtifact(bytes, pkg, tree, root) {
  const files = trusted.parseTarFiles(bytes, { includeBytes: true });
  const manifestFile = files.find((x) => x.path === 'package.json');
  assert(manifestFile, 'preview artifact has no manifest');
  const manifest = trusted.strictJson(manifestFile.bytes, 'preview artifact manifest');
  const unit = Object.keys(POLICIES).find((unit) => POLICIES[unit].name === pkg.name);
  validateManifest(manifest, unit);
  for (const field of [
    '_id',
    '_nodeVersion',
    '_npmVersion',
    'dist',
    'gitHead',
    'tag',
    'publishConfig',
  ])
    assert(
      !Object.hasOwn(manifest, field),
      'preview artifact contains publisher-owned metadata: ' + field,
    );
  assert(
    files.some((x) => x.path === 'LICENSE') && files.some((x) => x.path === 'NOTICE'),
    'preview artifact license/notice missing',
  );
  if (tree) {
    const entries = files.map((file) => {
      const entry = tree.entries.find((x) => x.path === pkg.directory + '/' + file.path);
      assert(entry, 'preview artifact member has no exact source: ' + file.path);
      assert(
        file.mode === (entry.mode === '100755' ? 0o755 : 0o644),
        'preview artifact member source mode mismatch',
      );
      return entry;
    });
    const blobs = trusted.batchReadBlobs(entries, root);
    files.forEach((file, index) =>
      assert(
        file.bytes.equals(blobs[index]),
        'preview artifact member differs from source: ' + file.path,
      ),
    );
  }
  return {
    filename: filename(pkg),
    sha256: trusted.sha256(bytes),
    shasum: trusted.sha1(bytes),
    integrity: trusted.integrity(bytes),
    bytes: bytes.length,
    files: files.map(({ bytes: omitted, ...entry }) => entry),
  };
}
function packSource(sourceRoot, context, invocation, work, label) {
  const destination = path.join(work, label);
  fs.mkdirSync(destination, { mode: 0o700 });
  const result = trusted.runNpm(
    invocation,
    ['pack', '--json', '--ignore-scripts', '--pack-destination', destination],
    {
      cwd: path.join(sourceRoot, context.package.directory),
      projectRoot: sourceRoot,
      label: 'preview exact-source pack',
      timeout: 120000,
    },
  );
  assert(result.stderr === '', 'preview pack wrote unexpected diagnostics');
  const report = trusted.strictJson(result.stdout, 'preview pack report');
  assert(
    Array.isArray(report) &&
      report.length === 1 &&
      report[0].filename === filename(context.package),
    'preview pack output identity mismatch',
  );
  const bytes = readRegular(
    path.join(destination, report[0].filename),
    'preview packed artifact',
    trusted.TAR_LIMITS.packedBytes,
  );
  const artifact = validateArtifact(bytes, context.package, context.treeState, context.objectRoot);
  assert(
    report[0].name === context.package.name &&
      report[0].version === context.package.version &&
      report[0].size === bytes.length &&
      report[0].shasum === artifact.shasum &&
      report[0].integrity === artifact.integrity,
    'preview pack report disagrees with bytes',
  );
  const reportedFiles = report[0].files
    .map(({ path: filePath, size, mode }) => ({ path: filePath, size, mode }))
    .sort((a, b) => a.path.localeCompare(b.path));
  assert(
    JSON.stringify(reportedFiles) ===
      JSON.stringify(
        artifact.files.map(({ path: filePath, size, mode }) => ({ path: filePath, size, mode })),
      ),
    'preview pack member report disagrees with tar',
  );
  assert(
    report[0].entryCount === artifact.files.length &&
      report[0].unpackedSize === artifact.files.reduce((n, f) => n + f.size, 0) &&
      report[0].bundled.length === 0,
    'preview pack counts/bundles disagree',
  );
  return { bytes, artifact };
}
function build({
  unit,
  evidencePath,
  artifactPath,
  env = process.env,
  root = ROOT,
  candidate = false,
}) {
  const context = candidate ? inspectSource(unit, root) : inspectRelease(unit, env, root);
  const evidenceOutput = trusted.assertOutsideRepository(evidencePath, 'preview evidence', root);
  const artifactOutput = trusted.assertOutsideRepository(artifactPath, 'preview artifact', root);
  assert(
    evidenceOutput !== artifactOutput &&
      !fs.existsSync(evidenceOutput) &&
      !fs.existsSync(artifactOutput),
    'preview outputs must be new distinct files',
  );
  assert(
    path.basename(artifactOutput) === filename(context.package),
    'preview artifact output filename mismatch',
  );
  const work = trusted.makePrivateTemp('kdna-preview-build-');
  let invocation;
  const created = [];
  try {
    invocation = trusted.resolveTrustedNpmInvocation({ environment: env, root });
    const sources = [1, 2].map((n) =>
      trusted.materializeTree(context.treeState, path.join(work, 'source-' + n), root),
    );
    for (const source of sources)
      trusted.initializeIsolatedGateRepository(source, context.treeState, context.commit, root);
    const naming = spawnSync(
      invocation.command,
      [path.join(sources[0], 'scripts/check-post-cutover-naming.mjs')],
      {
        cwd: sources[0],
        encoding: 'utf8',
        env: trusted.cleanNpmEnvironment({
          invocation,
          home: path.join(work, 'gate-home'),
          cache: path.join(work, 'gate-cache'),
          environment: env,
        }),
        timeout: 120000,
      },
    );
    assert(!naming.error && naming.status === 0, 'preview exact-source naming gate failed');
    const first = packSource(
      sources[0],
      { ...context, objectRoot: root },
      invocation,
      work,
      'pack-one',
    );
    const second = packSource(
      sources[1],
      { ...context, objectRoot: root },
      invocation,
      work,
      'pack-two',
    );
    assert(first.bytes.equals(second.bytes), 'preview exact-source packs differ');
    if (!candidate)
      assert(
        first.artifact.sha256 === context.approval.artifact_sha256,
        'preview bytes differ from Owner-approved artifact SHA',
      );
    const evidence = {
      schema: 'kdna.preview-release-evidence/1',
      authorization: candidate ? 'local-candidate-no-publication-authority' : context.authorization,
      unit,
      source: {
        repository: REPOSITORY,
        commit: context.commit,
        tree: context.tree,
        base_commit: context.baseCommit,
        dco_commit_count: context.dco_commit_count,
      },
      package: context.package,
      dist_tag: DIST_TAG,
      notes_sha256: trusted.sha256(Buffer.from(context.notes)),
      approval: candidate ? null : context.approval,
      release_id: candidate ? null : context.release_id,
      tooling: {
        npm: trusted.AUDITED_NPM_VERSION,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      build: {
        materialization: 'git-cat-file-blobs',
        independent_source_exports: 2,
        same_platform_byte_equal: true,
        source_member_equality: true,
        naming: true,
      },
      artifact: first.artifact,
    };
    for (const output of [artifactOutput, evidenceOutput])
      fs.mkdirSync(path.dirname(output), { recursive: true, mode: 0o700 });
    fs.writeFileSync(artifactOutput, first.bytes, { flag: 'wx', mode: 0o600 });
    created.push(artifactOutput);
    fs.writeFileSync(evidenceOutput, JSON.stringify(evidence, null, 2) + '\n', {
      flag: 'wx',
      mode: 0o600,
    });
    created.push(evidenceOutput);
    assert(
      readRegular(
        artifactOutput,
        'retained preview artifact',
        trusted.TAR_LIMITS.packedBytes,
      ).equals(first.bytes),
      'retained preview artifact changed',
    );
    const rebound = candidate ? inspectSource(unit, root) : inspectRelease(unit, env, root);
    assert(
      rebound.commit === context.commit && rebound.tree === context.tree,
      'preview source changed while building',
    );
    return evidence;
  } catch (error) {
    for (const output of created) fs.rmSync(output, { force: true });
    throw error;
  } finally {
    if (invocation) invocation.cleanup();
    fs.rmSync(work, { recursive: true, force: true });
  }
}
function readCandidate({
  unit,
  evidencePath,
  artifactPath,
  env = process.env,
  root = ROOT,
  requireRelease = true,
}) {
  trusted.assertOutsideRepository(evidencePath, 'preview evidence', root);
  trusted.assertOutsideRepository(artifactPath, 'preview artifact', root);
  const evidence = trusted.strictJson(
    readRegular(evidencePath, 'preview evidence'),
    'preview evidence',
  );
  exactKeys(
    evidence,
    [
      'schema',
      'authorization',
      'unit',
      'source',
      'package',
      'dist_tag',
      'notes_sha256',
      'approval',
      'release_id',
      'tooling',
      'build',
      'artifact',
    ],
    'preview evidence',
  );
  assert(
    evidence.schema === 'kdna.preview-release-evidence/1' &&
      evidence.unit === unit &&
      evidence.dist_tag === DIST_TAG,
    'preview evidence target/channel mismatch',
  );
  exactKeys(
    evidence.source,
    ['repository', 'commit', 'tree', 'base_commit', 'dco_commit_count'],
    'preview evidence source',
  );
  exactKeys(evidence.tooling, ['npm', 'node', 'platform', 'arch'], 'preview evidence tooling');
  const context = requireRelease ? inspectRelease(unit, env, root) : inspectSource(unit, root);
  assert(
    evidence.source.dco_commit_count === context.dco_commit_count,
    'preview evidence DCO range count mismatch',
  );
  assert(
    evidence.source.commit === context.commit &&
      evidence.source.tree === context.tree &&
      evidence.source.base_commit === context.baseCommit &&
      evidence.source.repository === REPOSITORY,
    'preview evidence source binding stale',
  );
  assert(
    JSON.stringify(evidence.package) === JSON.stringify(context.package),
    'preview evidence package binding stale',
  );
  assert(
    evidence.notes_sha256 === trusted.sha256(Buffer.from(context.notes)),
    'preview evidence notes binding stale',
  );
  assert(
    evidence.tooling.npm === trusted.AUDITED_NPM_VERSION &&
      evidence.tooling.node === process.version &&
      evidence.tooling.platform === process.platform &&
      evidence.tooling.arch === process.arch,
    'preview evidence tooling binding stale',
  );
  assert(
    JSON.stringify(evidence.build) ===
      JSON.stringify({
        materialization: 'git-cat-file-blobs',
        independent_source_exports: 2,
        same_platform_byte_equal: true,
        source_member_equality: true,
        naming: true,
      }),
    'preview evidence build claims invalid',
  );
  if (requireRelease)
    assert(
      evidence.authorization === 'published-prerelease-event' &&
        evidence.release_id === context.release_id &&
        JSON.stringify(evidence.approval) === JSON.stringify(context.approval),
      'preview evidence has no current real release authority',
    );
  else
    assert(
      ['local-candidate-no-publication-authority', 'published-prerelease-event'].includes(
        evidence.authorization,
      ),
      'preview evidence authorization invalid',
    );
  const bytes = readRegular(
    artifactPath,
    'retained preview artifact',
    trusted.TAR_LIMITS.packedBytes,
  );
  const artifact = validateArtifact(bytes, context.package, context.treeState, root);
  assert(
    JSON.stringify(artifact) === JSON.stringify(evidence.artifact),
    'preview evidence/artifact mismatch',
  );
  assert(path.basename(artifactPath) === artifact.filename, 'preview retained filename mismatch');
  if (requireRelease)
    assert(
      artifact.sha256 === context.approval.artifact_sha256,
      'preview retained artifact differs from approval',
    );
  return { evidence, bytes, context };
}
function registryDecision(result, expected) {
  assert(
    result &&
      !result.error &&
      Number.isInteger(result.status) &&
      typeof result.stdout === 'string' &&
      result.stderr === '',
    'preview registry lookup failed',
  );
  if (result.status === 1) {
    const document = trusted.strictJson(result.stdout, 'preview registry absence');
    exactKeys(document, ['error'], 'preview registry absence');
    exactKeys(document.error, ['code', 'summary', 'detail'], 'preview registry absence detail');
    const spec = expected.name + '@' + expected.version;
    assert(
      document.error.code === 'E404' &&
        document.error.summary === 'No match found for version ' + expected.version &&
        document.error.detail ===
          "The requested resource '" +
            spec +
            "' could not be found or you do not have permission to access it.\n\nNote that you can also install from a\ntarball, folder, http url, or git url.",
      'preview registry absence is not exact',
    );
    return { decision: 'publish', shouldPublish: true };
  }
  assert(result.status === 0, 'preview registry lookup failed');
  const data = trusted.strictJson(result.stdout, 'preview registry metadata');
  exactKeys(
    data,
    ['name', 'version', 'dist.integrity', 'dist.shasum', 'gitHead'],
    'preview registry metadata',
  );
  assert(
    data.name === expected.name &&
      data.version === expected.version &&
      data['dist.integrity'] === expected.integrity &&
      data['dist.shasum'] === expected.shasum &&
      data.gitHead === expected.gitHead,
    'preview registry version collision',
  );
  return { decision: 'skip-identical', shouldPublish: false };
}
function lookup(invocation, expected, work) {
  return spawnSync(
    invocation.command,
    [
      ...invocation.prefixArgs,
      'view',
      expected.name + '@' + expected.version,
      'name',
      'version',
      'dist.integrity',
      'dist.shasum',
      'gitHead',
      '--json',
      '--loglevel=silent',
      '--registry=' + trusted.OFFICIAL_REGISTRY,
    ],
    {
      cwd: work,
      encoding: 'utf8',
      env: trusted.cleanNpmEnvironment({
        invocation,
        home: path.join(work, 'home'),
        cache: path.join(work, 'cache'),
      }),
      maxBuffer: 1024 * 1024,
      timeout: 30000,
    },
  );
}
function expectedRegistry(candidate) {
  return {
    name: candidate.context.package.name,
    version: candidate.context.package.version,
    integrity: candidate.evidence.artifact.integrity,
    shasum: candidate.evidence.artifact.shasum,
    gitHead: candidate.context.commit,
  };
}
function withInvocation(options, action) {
  const candidate = readCandidate(options);
  const work = trusted.makePrivateTemp('kdna-preview-operation-');
  let invocation;
  try {
    invocation = trusted.resolveTrustedNpmInvocation({
      environment: options.env || process.env,
      root: options.root || ROOT,
    });
    return action(candidate, invocation, work);
  } finally {
    if (invocation) invocation.cleanup();
    fs.rmSync(work, { recursive: true, force: true });
  }
}
function guard(options) {
  return withInvocation(options, (candidate, invocation, work) =>
    registryDecision(
      lookup(invocation, expectedRegistry(candidate), work),
      expectedRegistry(candidate),
    ),
  );
}
function publish(options) {
  assert(options.requireRelease !== false, 'preview publish requires real release authority');
  return withInvocation({ ...options, requireRelease: true }, (candidate, invocation, work) => {
    const expected = expectedRegistry(candidate);
    const decision = registryDecision(lookup(invocation, expected, work), expected);
    if (!decision.shouldPublish) return decision;
    const rebound = readCandidate({ ...options, requireRelease: true });
    assert(rebound.bytes.equals(candidate.bytes), 'preview artifact changed before publish');
    const artifact = path.join(work, candidate.evidence.artifact.filename);
    fs.writeFileSync(artifact, candidate.bytes, { flag: 'wx', mode: 0o600 });
    const manifest = trusted.strictJson(
      trusted
        .parseTarFiles(candidate.bytes, { includeBytes: true })
        .find((x) => x.path === 'package.json').bytes,
      'preview publisher manifest',
    );
    const manifestPath = path.join(work, 'manifest.json');
    fs.writeFileSync(
      manifestPath,
      JSON.stringify({ ...manifest, gitHead: candidate.context.commit }) + '\n',
      { flag: 'wx', mode: 0o600 },
    );
    const tree = candidate.context.treeState;
    const publisher = path.join(work, 'publisher.js');
    fs.writeFileSync(
      publisher,
      readSource(tree, 'scripts/preview-release-publisher.js', options.root || ROOT),
      { flag: 'wx', mode: 0o600 },
    );
    const environment = trusted.cleanNpmEnvironment({
      invocation,
      home: path.join(work, 'auth-home'),
      cache: path.join(work, 'auth-cache'),
      environment: options.env || process.env,
      allowAuth: true,
    });
    assert(
      typeof environment.NODE_AUTH_TOKEN === 'string' && environment.NODE_AUTH_TOKEN !== '',
      'preview publication token missing',
    );
    const result = spawnSync(
      invocation.command,
      [
        publisher,
        invocation.publishLibraryPath,
        manifestPath,
        artifact,
        candidate.evidence.artifact.sha256,
      ],
      { cwd: work, env: environment, encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 300000 },
    );
    assert(!result.error && result.status === 0, 'verified preview publisher failed');
    return { decision: 'published', shouldPublish: true };
  });
}
function smoke(options) {
  return withInvocation(
    { ...options, requireRelease: options.requireRelease ?? true },
    (candidate, invocation, work) => {
      const tar = path.join(work, candidate.evidence.artifact.filename);
      fs.writeFileSync(tar, candidate.bytes, { flag: 'wx', mode: 0o600 });
      const packages = [
        { name: candidate.context.package.name, bytes: candidate.bytes, path: tar },
      ];
      if (candidate.context.unit === 'read') {
        const companion = candidate.context.approval?.companion;
        assert(companion, 'Read smoke requires approved publicly released Core companion');
        const decision = registryDecision(lookup(invocation, companion, work), companion);
        assert(
          !decision.shouldPublish,
          'Read preview requires the exact Core companion published first',
        );
        const result = trusted.runNpm(
          invocation,
          [
            'pack',
            companion.name + '@' + companion.version,
            '--json',
            '--ignore-scripts',
            '--pack-destination',
            work,
          ],
          {
            cwd: work,
            projectRoot: work,
            timeout: 120000,
            label: 'preview public Core acquisition',
          },
        );
        const report = trusted.strictJson(result.stdout, 'preview Core acquisition report');
        assert(
          Array.isArray(report) &&
            report.length === 1 &&
            report[0].filename === filename(POLICIES.core),
          'preview Core acquisition filename mismatch',
        );
        const file = path.join(work, report[0].filename);
        const bytes = readRegular(
          file,
          'preview public Core companion',
          trusted.TAR_LIMITS.packedBytes,
        );
        assert(
          trusted.sha256(bytes) === companion.sha256 &&
            trusted.integrity(bytes) === companion.integrity &&
            trusted.sha1(bytes) === companion.shasum,
          'preview Core companion bytes mismatch',
        );
        validateArtifact(bytes, POLICIES.core);
        packages.push({ name: companion.name, bytes, path: file });
      }
      fs.writeFileSync(
        path.join(work, 'package.json'),
        JSON.stringify({
          name: 'kdna-preview-installed-consumer',
          version: '1.0.0',
          private: true,
        }) + '\n',
      );
      trusted.runNpm(
        invocation,
        [
          'install',
          ...packages.map((x) =>
            options.publicAcquisition
              ? x.name +
                '@' +
                (x.name === POLICIES.core.name ? POLICIES.core.version : POLICIES.read.version)
              : x.path,
          ),
          '--ignore-scripts',
          '--omit=optional',
          '--no-audit',
          '--no-fund',
        ],
        {
          cwd: work,
          projectRoot: work,
          timeout: 180000,
          label: 'preview clean installed consumer',
        },
      );
      for (const pkg of packages) {
        const directory = path.join(work, 'node_modules', ...pkg.name.split('/'));
        const files = trusted.parseTarFiles(pkg.bytes, { includeBytes: true });
        for (const file of files)
          assert(
            readRegular(
              path.join(directory, file.path),
              'preview installed member',
              trusted.TAR_LIMITS.fileBytes,
            ).equals(file.bytes),
            'preview installed member mismatch',
          );
        const actual = [];
        function walk(dir, prefix = '') {
          for (const name of fs.readdirSync(dir)) {
            const file = path.join(dir, name);
            const stat = fs.lstatSync(file);
            assert(!stat.isSymbolicLink(), 'preview installed package contains a symbolic link');
            if (stat.isDirectory()) walk(file, prefix + name + '/');
            else {
              assert(stat.isFile(), 'preview installed package contains a special file');
              actual.push(prefix + name);
            }
          }
        }
        walk(directory);
        assert(
          JSON.stringify(actual.sort()) === JSON.stringify(files.map((f) => f.path).sort()),
          'preview installed package has extra or missing files',
        );
      }
      const loadCode =
        '(async () => { for (const name of ' +
        JSON.stringify(packages.map((x) => x.name)) +
        ') { const pkg = require(name + "/package.json"); for (const [key, target] of Object.entries(pkg.exports || {".": pkg.main})) { const entry = name + (key === "." ? "" : key.slice(1)); if (typeof target === "string" || target.require) require(entry); if (target && target.import) await import(entry); } } console.log("PREVIEW_INSTALLED_PUBLIC_EXPORTS_OK"); })().catch(() => process.exitCode = 1);';
      const load = spawnSync(invocation.command, ['-e', loadCode], {
        cwd: work,
        encoding: 'utf8',
        env: trusted.cleanNpmEnvironment({
          invocation,
          home: path.join(work, 'load-home'),
          cache: path.join(work, 'load-cache'),
        }),
        timeout: 30000,
      });
      assert(
        !load.error &&
          load.status === 0 &&
          load.stdout.trim() === 'PREVIEW_INSTALLED_PUBLIC_EXPORTS_OK',
        'preview installed public export load failed',
      );
      return {
        installed: packages.map((x) => x.name),
        exact_members: true,
        public_exports: true,
        acquisition: options.publicAcquisition
          ? 'exact-public-registry-versions'
          : 'retained-local-artifact',
      };
    },
  );
}
function verifyPublic(options) {
  const registry = withInvocation(options, (candidate, invocation, work) => {
    const expected = expectedRegistry(candidate);
    const decision = registryDecision(lookup(invocation, expected, work), expected);
    assert(!decision.shouldPublish, 'preview registry publication not observed');
    return { publicRegistryIdentity: 'exact', ...decision };
  });
  return { ...registry, publicInstall: smoke({ ...options, publicAcquisition: true }) };
}
function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let i = 0; i < rest.length; i += 2) {
    const key = { '--unit': 'unit', '--evidence': 'evidencePath', '--artifact': 'artifactPath' }[
      rest[i]
    ];
    assert(
      key &&
        typeof rest[i + 1] === 'string' &&
        !rest[i + 1].startsWith('--') &&
        !Object.hasOwn(options, key),
      'preview arguments invalid',
    );
    options[key] = rest[i + 1];
  }
  policy(options.unit);
  if (command !== 'check')
    assert(
      options.evidencePath && options.artifactPath,
      'preview evidence and retained artifact required',
    );
  return { command, options };
}
function main(argv = process.argv.slice(2)) {
  const { command, options } = parseArgs(argv);
  let result;
  if (command === 'check') {
    const context = inspectRelease(options.unit);
    result = {
      commit: context.commit,
      tree: context.tree,
      unit: context.unit,
      authorization: context.authorization,
    };
  } else if (command === 'candidate') result = build({ ...options, candidate: true });
  else if (command === 'prepare') result = build(options);
  else if (command === 'smoke') result = smoke(options);
  else if (command === 'candidate-smoke') result = smoke({ ...options, requireRelease: false });
  else if (command === 'guard') result = guard(options);
  else if (command === 'publish') result = publish(options);
  else if (command === 'verify-public') result = verifyPublic(options);
  else throw new Error('unknown preview command');
  console.log(JSON.stringify(result, null, 2));
}
if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('Preview release rejected: ' + error.message);
    process.exitCode = 1;
  }
}
module.exports = {
  BASE_COMMIT,
  DIST_TAG,
  POLICIES,
  build,
  filename,
  guard,
  inspectRelease,
  inspectSource,
  parseArgs,
  parseReleaseBody,
  policy,
  previewNotes,
  publish,
  readCandidate,
  registryDecision,
  smoke,
  validateApproval,
  validateArtifact,
  validateContext,
  validateManifest,
  verifyPublic,
};
