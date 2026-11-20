'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  checkCurrentNavigation,
  markdownLinks,
  headingText,
  DOCUMENTS,
} = require('./check-current-r2-navigation.cjs');

const root = path.resolve(__dirname, '..');
const source = JSON.parse(
  fs.readFileSync(path.join(root, 'specs/public-semantic-source.json'), 'utf8'),
);

const oldPaths = {
  Manifest: 'schema/manifest-0.2.schema.json',
  Payload: 'schema/payload-profile-0.2.schema.json',
  CanonicalIR: 'specs/canonical-ir.schema.json',
  ReadCallResult: 'specs/read-contract-0.6.1.schema.json',
  PublicRuntimeCapsule: 'schema/runtime-capsule-0.2.schema.json',
  PublicConsumptionPlan: 'schema/consumption-plan-0.2.schema.json',
  PublicAgentHostRequest: 'schema/agent-host-request-0.2.schema.json',
  PublicAgentHostReceipt: 'schema/agent-host-receipt-0.2.schema.json',
  PublicJudgmentTrace: 'schema/judgment-trace-0.2.schema.json',
  ProtectionDefinitionObservation: 'specs/protection-admission-r2-binding-4.schema.json',
  PackageSetNodeSurface: 'specs/package-set-node.schema.json',
  IssuerResultObservation: 'specs/external-grant-issuer-r2-binding-4.schema.json',
  ProtectedSourceObservation: 'specs/protected-source-r2-binding-4.schema.json',
};

function readWith(overrides = {}) {
  return (rel) => {
    if (Object.hasOwn(overrides, rel)) return overrides[rel];
    return fs.readFileSync(path.join(root, rel), 'utf8');
  };
}

function rejectedBeforeGeneration(mutate) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-navigation-'));
  try {
    const candidate = structuredClone(source);
    mutate(candidate);
    const candidateRoot = path.join(temporary, 'candidate');
    fs.mkdirSync(path.join(candidateRoot, 'specs'), { recursive: true });
    const input = path.join(candidateRoot, 'specs/public-semantic-source.json');
    const out = path.join(temporary, 'output');
    const scratch = path.join(temporary, 'scratch');
    const candidateBytes = Buffer.from(JSON.stringify(candidate));
    fs.writeFileSync(input, candidateBytes);
    const recipeRow = JSON.parse(
      fs.readFileSync(path.join(root, 'scripts/public-contract/native-output-recipe.json'), 'utf8'),
    );
    recipeRow.input_sha256 = crypto.createHash('sha256').update(candidateBytes).digest('hex');
    fs.mkdirSync(path.join(candidateRoot, 'scripts/public-contract'), { recursive: true });
    const recipeCopy = path.join(
      candidateRoot,
      'scripts/public-contract/native-output-recipe.json',
    );
    fs.writeFileSync(recipeCopy, JSON.stringify(recipeRow));
    const result = spawnSync(
      process.execPath,
      [
        path.join(__dirname, 'public-contract/generate.mjs'),
        '--source',
        input,
        '--root',
        candidateRoot,
        '--out-dir',
        out,
        '--scratch-dir',
        scratch,
        '--dependency-root',
        root,
      ],
      { encoding: 'utf8', env: { ...process.env, KDNA_NATIVE_RECIPE: recipeCopy } },
    );
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.equal(JSON.parse(result.stderr).code, 'SOURCE_NAVIGATION_CONFLICT');
    assert.equal(
      fs.existsSync(out),
      false,
      'No output directory before source navigation admission',
    );
    assert.equal(
      fs.existsSync(scratch),
      false,
      'No scratch writes before source navigation admission',
    );
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

test('the actual current source, documents, generated modules and package identities agree', () => {
  const result = checkCurrentNavigation(root);
  assert.deepEqual(result.issues, []);
  assert.equal(result.schema_roots, 13);
  assert.ok(result.local_links > 100);
});

for (const [name, oldPath] of Object.entries(oldPaths)) {
  test(`generator refuses existing historical ${name} path before any output`, () => {
    assert.ok(
      fs.existsSync(path.join(root, oldPath)),
      'Negative control uses a real preserved historical file',
    );
    assert.notEqual(source.r2_semantics.schema_paths[name], oldPath);
    rejectedBeforeGeneration((candidate) => {
      candidate.r2_semantics.schema_paths[name] = oldPath;
    });
  });
}

test('generator refuses a missing navigation root before writing', () =>
  rejectedBeforeGeneration((candidate) => {
    delete candidate.r2_semantics.schema_paths.ProtectedSourceObservation;
  }));

test('generator refuses an extra navigation root before writing', () =>
  rejectedBeforeGeneration((candidate) => {
    candidate.r2_semantics.schema_paths.Extra = 'specs/protected-source.schema.json';
  }));

test('generator refuses duplicate owning roots even when a lookup would overwrite one', () =>
  rejectedBeforeGeneration((candidate) => {
    candidate.protected_source.root = candidate.protection_admission.root;
  }));

const mutations = [
  ['root README coordinate block', 'README.md', '`0.37.11`', '`0.36.0-rc.r2.1`'],
  [
    'Chinese README CLI coordinate',
    'README.zh.md',
    '@aikdna/kdna-cli@0.45.1',
    '@aikdna/kdna-cli@0.36.1',
  ],
  [
    'Start Here CLI coordinate',
    'docs/start-here.md',
    '@aikdna/kdna-cli@0.45.1',
    '@aikdna/kdna-cli@0.36.1',
  ],
  ['status Core coordinate', 'docs/status.md', '`0.37.11`', '`0.36.0`'],
  ['Chinese status Read coordinate', 'docs/status.zh.md', '`0.13.5`', '`0.11.0`'],
  ['current release support Core row', 'docs/current-release-support.md', '`0.37.11`', '`0.36.0`'],
  [
    'SPEC-INDEX Read schema',
    'SPEC-INDEX.md',
    'read-contract-0.6.4.schema.json',
    'read-contract-0.6.1.schema.json',
  ],
  [
    'SPEC-INDEX protected-source link',
    'SPEC-INDEX.md',
    'specs/protected-source-r2.md',
    'specs/protected-source-r2-binding-4.md',
  ],
  ['Core package README version', 'packages/kdna-core/README.md', '0.37.11', '0.36.0-rc.r2.1'],
  ['Read package README version', 'packages/kdna-read/README.md', '0.13.5', '0.11.0-rc.r2.1'],
  [
    'Read package README transport role',
    'packages/kdna-read/README.md',
    'schema-accepted ready and rejected responses',
    'both ready and catalog-only responses',
  ],
  ['read-contract spec version', 'specs/read-contract.md', 'kdna.read/0.6.4', 'kdna.read/0.6.1'],
  ['protection-admission binding', 'specs/protection-admission.md', 'binding:r2:8', 'binding:r2:4'],
  [
    'external-grant-issuer binding',
    'specs/external-grant-issuer.md',
    'binding:r2:8',
    'binding:r2:4',
  ],
  ['protected-source binding', 'specs/protected-source-r2.md', 'binding:r2:8', 'binding:r2:4'],
  [
    'public-version-policy transport binding',
    'specs/public-version-policy.md',
    'urn:kdna:schema:read-transport-admission:0.2.1',
    'urn:kdna:schema:read-transport-admission:0.2.0',
  ],
  ['broken local link in README', 'README.md', './docs/start-here.md', './docs/does-not-exist.md'],
  [
    'existing file with wrong anchor',
    'README.md',
    './SPEC-INDEX.md#kdna-public-specification-index',
    './SPEC-INDEX.md#missing-anchor-heading',
  ],
];

for (const [label, file, from, to] of mutations) {
  test(`current navigation rejects ${label}`, () => {
    const original = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(original.includes(from), `mutation fixture missing ${from} in ${file}`);
    const mutated = original.replaceAll(from, to);
    const result = checkCurrentNavigation(root, {
      compiled: false,
      readText: readWith({ [file]: mutated }),
    });
    assert.equal(result.status, 'FAIL', `expected ${label} to fail`);
    assert.ok(result.issues.length > 0);
  });
}

test('adding a stale current prerelease identity beside correct text is refused', () => {
  const original = fs.readFileSync(path.join(root, 'docs/status.md'), 'utf8');
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({
      'docs/status.md': `${original}\nCurrent Core 0.36.0-rc.r2.5\n`,
    }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.issues.some((issue) => issue.name.includes('0.36.0-rc.r2.5')));
});

test('assigning a valid package coordinate to the wrong current owner is refused', () => {
  const original = fs.readFileSync(path.join(root, 'docs/status.md'), 'utf8');
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({
      'docs/status.md': `${original}\nCurrent Read 0.37.11\n`,
    }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.issues.some((issue) => issue.name.includes('current-owner')));
});

test('renaming a retained historical heading loses its bounded exemption', () => {
  const original = fs.readFileSync(path.join(root, 'docs/current-release-support.md'), 'utf8');
  const mutated = original.replace('## Published channel history', '## Renamed channel history');
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({ 'docs/current-release-support.md': mutated }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.issues.some((issue) => issue.name.includes('retained-historical')));
});

test('nested image link and outer local link are both parsed cleanly', () => {
  const links = markdownLinks('[![badge](./img.png)](./docs/start-here.md#top)');
  assert.deepEqual(
    links.map((item) => item.href),
    ['./img.png', './docs/start-here.md#top'],
  );
});

test('heading projection strips complete and unclosed markup safely', () => {
  assert.equal(headingText('Hello <code>world</code>'), 'Hello world');
  assert.equal(headingText('Unclosed <span class="x"'), 'Unclosed span class="x"');
  assert.equal(headingText('A < B and C > D'), 'A  D');
});

test('every declared DOCUMENT exists on disk', () => {
  for (const rel of DOCUMENTS) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing declared document ${rel}`);
  }
});

test('release matrix missing a pinned unit fails closed', () => {
  const matrix = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/release-coordinates.json'), 'utf8'),
  );
  matrix.packages = matrix.packages.filter((row) => row.unit !== 'read');
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({ 'docs/release-coordinates.json': JSON.stringify(matrix) }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.issues.some((issue) => issue.name === 'release-coordinates:packages.read'));
});

test('release matrix disagreeing with semantic source is caught', () => {
  const matrix = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/release-coordinates.json'), 'utf8'),
  );
  const coreRow = matrix.packages.find((row) => row.unit === 'core');
  coreRow.version = '0.37.99';
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({ 'docs/release-coordinates.json': JSON.stringify(matrix) }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(
    result.issues.some((issue) => issue.name === 'release-coordinates:source-consistency.core'),
  );
});

test('declared source candidate that does not strictly lead published is refused', () => {
  const matrix = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/release-coordinates.json'), 'utf8'),
  );
  const coreRow = matrix.packages.find((row) => row.unit === 'core');
  coreRow.candidate_version = coreRow.version;
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({ 'docs/release-coordinates.json': JSON.stringify(matrix) }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(
    result.issues.some((issue) => issue.name === 'release-coordinates:candidate-declared.core'),
  );
});

test('declared source candidate rendered as published artifact is refused', () => {
  const matrix = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/release-coordinates.json'), 'utf8'),
  );
  const coreRow = matrix.packages.find((row) => row.unit === 'core');
  coreRow.candidate_version = '0.37.12';
  const readme = fs
    .readFileSync(path.join(root, 'README.md'), 'utf8')
    .replace('`@aikdna/kdna-core` | `0.37.11`', '`@aikdna/kdna-core` | `0.37.12`');
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: readWith({
      'docs/release-coordinates.json': JSON.stringify(matrix),
      'README.md': readme,
    }),
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(
    result.issues.some((issue) => issue.name === 'release-coordinates:candidate-not-published'),
  );
});
