'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
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
function rejectedBeforeGeneration(mutate) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-navigation-'));
  try {
    const candidate = structuredClone(source);
    mutate(candidate);
    const candidateRoot = path.join(temporary, 'candidate');
    fs.mkdirSync(path.join(candidateRoot, 'specs'), { recursive: true });
    const input = path.join(candidateRoot, 'specs/public-semantic-source.json'),
      out = path.join(temporary, 'output'),
      scratch = path.join(temporary, 'scratch');
    const candidateBytes = Buffer.from(JSON.stringify(candidate));
    fs.writeFileSync(input, candidateBytes);
    const crypto = require('node:crypto');
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
for (const [name, oldPath] of Object.entries(oldPaths))
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
  ['root README current package', 'README.md', '0.37.1-rc.browser.1', '0.35.0-rc.source.1'],
  ['root README current execution', 'README.md', 'native execution 0.3.1', 'native execution 0.2'],
  [
    'Chinese README package',
    'README.zh.md',
    'Read `0.11.2-rc.browser.1`',
    '0.3.0-rc.component-semantics.2',
  ],
  [
    'Chinese README execution',
    'README.zh.md',
    '原生 0.3.1 Plan/Capsule',
    'Runtime Capsule / Plan 入场不可用',
  ],
  [
    'Core packed README package',
    'packages/kdna-core/README.md',
    'actual source package `0.37.1-rc.browser.1`',
    '0.36.0-rc.r2.4',
  ],
  [
    'Read packed README package',
    'packages/kdna-read/README.md',
    'source package `0.11.2-rc.browser.1`',
    '0.11.0-rc.r2.4',
  ],
  [
    'Read packed README exact peer',
    'packages/kdna-read/README.md',
    'peer `@aikdna/kdna-core@0.37.1-rc.browser.1`',
    '0.36.0-rc.r2.4',
  ],
  [
    'Read packed README compiled coordinate',
    'packages/kdna-read/README.md',
    'kdna.read/0.6.4',
    'kdna.read/0.6.1',
  ],
  [
    'SPEC index current schema',
    'SPEC-INDEX.md',
    'read-contract-0.6.4.schema.json',
    'read-contract-0.6.1.schema.json',
  ],
  [
    'SPEC index historical wrapper page',
    'SPEC-INDEX.md',
    'protected-source-r2.md',
    'protected-source-r2-binding-2.md',
  ],
  [
    'CoreRead guide exact peer',
    'docs/core-read-current-status.md',
    'Read declares Core `0.37.1-rc.browser.1` as its exact peer',
    'Read declares Core `0.36.0-rc.r2.4` as its exact peer',
  ],
  [
    'CoreRead guide payload coordinate',
    'docs/core-read-current-status.md',
    'kdna.payload.judgment/0.5.1',
    'kdna.payload.judgment/0.4.0',
  ],
  [
    'CoreRead guide Core coordinate',
    'docs/core-read-current-status.md',
    'kdna.core/0.8.2',
    'kdna.core/0.8.0',
  ],
  [
    'CoreRead guide IR coordinate',
    'docs/core-read-current-status.md',
    'kdna.canonical-ir/0.6.1',
    'kdna.canonical-ir/0.5.0',
  ],
  [
    'CoreRead guide Read coordinate',
    'docs/core-read-current-status.md',
    'kdna.read/0.6.4',
    'kdna.read/0.6.1',
  ],
  [
    'CoreRead guide execution coordinate',
    'docs/core-read-current-status.md',
    'execution coordinates `0.3.1`',
    'execution coordinates `0.2.0`',
  ],
  [
    'CoreRead guide unknown critical',
    'docs/core-read-current-status.md',
    'Unknown critical semantics reject',
    'Unknown critical semantics permit historical catalog_only',
  ],
  [
    'Start Here package',
    'docs/start-here.md',
    '`0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1`',
    '0.35.0-rc.source.1',
  ],
  [
    'Chinese status current execution',
    'docs/status.zh.md',
    '原生 0.3.1 Plan/Capsule',
    '不可用的 Plan/Capsule',
  ],
  [
    'matrix current package',
    'docs/version-and-capability-matrix.md',
    '| `@aikdna/kdna-core` | `0.37.1-rc.browser.1`',
    '| `@aikdna/kdna-core` | `0.35.0-rc.source.1`',
  ],
  [
    'matrix current tuple',
    'docs/version-and-capability-matrix.md',
    'kdna.read/0.6.4',
    'kdna.read/0.6.1',
  ],
  [
    'consumption optional Plan',
    'docs/consumption-runtime.md',
    'does not require a Plan/Capsule step',
    'has no Plan/Capsule implementation',
  ],
  [
    'protection heading',
    'specs/protection-admission.md',
    'binding 8 candidate',
    'binding 1 candidate',
  ],
  ['protection schema id', 'specs/protection-admission.md', ':binding:r2:8', ':binding:r2:4'],
  [
    'protection lower schema link',
    'specs/protection-admission.md',
    'The generated [schema](protection-admission-r2-binding-8.schema.json)',
    'The generated [schema](protection-admission-r2-binding-2.schema.json)',
  ],
  ['protected source schema id', 'specs/protected-source-r2.md', ':binding:r2:8', ':binding:r2:4'],
  ['issuer schema id', 'specs/external-grant-issuer.md', ':binding:r2:8', ':binding:r2:4'],
  [
    'issuer current pair',
    'specs/external-grant-issuer.md',
    'Core `0.37.1-rc.browser.1`、Read `0.11.2-rc.browser.1`',
    '0.36.0-rc.r2.2',
  ],
  [
    'adoption current pair',
    'specs/protection-adoption.md',
    'Core `0.37.1-rc.browser.1` and Read',
    '0.35.0-rc.source.1',
  ],
  [
    'crypto ordinary admission boundary',
    'specs/kdna-crypto-profiles.md',
    'Current R2 ordinary root/browser',
    'Current grammar.3 public Core',
  ],
  [
    'Read middle current pair',
    'specs/read-contract.md',
    'Core `0.37.1-rc.browser.1` and Read `0.11.2-rc.browser.1`',
    '0.36.0-rc.r2.3',
  ],
  ['Read middle binding', 'specs/read-contract.md', 'binding:r2:8', 'binding:r2:3'],
  [
    'policy current tuple',
    'specs/public-version-policy.md',
    '| read | `kdna.read/0.6.4` |',
    '| read | `kdna.read/0.6.1` |',
  ],
  ['policy current binding', 'specs/public-version-policy.md', ':binding:r2:8', ':binding:r2:4'],
  ['missing local file', 'README.md', '(./docs/start-here.md)', '(./docs/absent-current-entry.md)'],
  [
    'missing local anchor',
    'README.md',
    'SPEC-INDEX.md#kdna-public-specification-index',
    'SPEC-INDEX.md#current-unpublished-grammar3-candidate',
  ],
  [
    'existing file wrong anchor',
    'packages/kdna-read/README.md',
    '#choose-and-obtain-one-matching-delivery',
    '#absent-current-anchor',
  ],
];
for (const [label, file, before, after] of mutations)
  test(`current navigation rejects ${label}`, () => {
    const original = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(original.includes(before), 'Mutation precondition');
    const changed = original.replace(before, after);
    const result = checkCurrentNavigation(root, {
      compiled: false,
      readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
    });
    assert.ok(result.issues.length > 0, label);
  });
const priorCoordinates = {
  container: '0.4.0',
  payload_profile: 'kdna.payload.previous',
  payload_version: '0.4.0',
  core: 'kdna.core/0.8.0',
  ir: 'kdna.canonical-ir/0.5.0',
  runtime: 'kdna.runtime-capsule/0.2.0',
  plan: 'kdna.consumption-plan/0.2.0',
  host: 'kdna.agent-host/0.2.0',
  trace: 'kdna.judgment-trace/0.2.0',
  read: 'kdna.read/0.6.1',
};
for (const [key, historical] of Object.entries(priorCoordinates))
  test(`the current tuple table refuses stale ${key} even when the correct value appears elsewhere`, () => {
    const file = 'specs/public-version-policy.md',
      original = fs.readFileSync(path.join(root, file), 'utf8');
    const before = `| ${key} | \`${source.versionTuple[key]}\` |`;
    assert.ok(original.includes(before));
    const changed = original.replace(before, `| ${key} | \`${historical}\` |`);
    assert.ok(
      checkCurrentNavigation(root, {
        compiled: false,
        readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
      }).issues.length > 0,
    );
  });
test('adding a stale current identity beside the correct text is refused', () => {
  const file = 'specs/read-contract.md',
    original = fs.readFileSync(path.join(root, file), 'utf8');
  const changed = original + '\nThe current package is also 0.36.0-rc.r2.3.\n';
  assert.ok(
    checkCurrentNavigation(root, {
      compiled: false,
      readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
    }).issues.length > 0,
  );
});
test('superseded consumer rows stay in dated records while the current guide names the successor', () => {
  const guide = fs.readFileSync(path.join(root, 'docs/core-read-current-status.md'), 'utf8');
  assert.ok(guide.includes('CLI `0.39.0-rc.native-sections.3` with the exact SDK pair above'));
  assert.ok(
    guide.includes(
      'Older local combination/material-edit delivery\nrecords retain their original bytes and scope; they no longer describe these\ncurrent source candidates.',
    ),
  );
  assert.equal(guide.includes('0.17.0-rc.material-edit.1'), false);
  const history = fs.readFileSync(path.join(root, 'docs/version-and-capability-matrix.md'), 'utf8');
  assert.ok(history.includes('4.5.0-rc.material-edit.1'));
  assert.ok(history.includes('0.8.1-rc.combination.1'));
  assert.ok(
    fs
      .readFileSync(path.join(root, 'specs/public-version-policy.md'), 'utf8')
      .includes('The historical RC4 exact pair was Core `0.36.0-rc.r2.4`'),
  );
  assert.deepEqual(checkCurrentNavigation(root).issues, []);
});

function changedDocument(file, transform) {
  const original = fs.readFileSync(path.join(root, file), 'utf8');
  const changed = transform(original);
  assert.notEqual(changed, original, 'Counterexample must alter its intended document');
  return checkCurrentNavigation(root, {
    compiled: false,
    readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
  });
}
test('the published native graph is retained separately while browser current identities stay visible', () => {
  const result = checkCurrentNavigation(root, { compiled: false });
  assert.deepEqual(result.issues, []);
  for (const file of ['README.md', 'README.zh.md', 'docs/core-read-current-status.md']) {
    for (const version of [
      source.engineering.package_versions.core,
      source.engineering.package_versions.read,
    ])
      assert.ok(result.identity_claims.some((row) => row.file === file && row.value === version));
    assert.equal(
      result.identity_claims.some(
        (row) => row.file === file && row.value === '0.39.0-rc.native-sections.2',
      ),
      false,
      'Only the independently bound native statements retain the published CLI identity',
    );
  }
});
const nativeIdentityMutations = [
  [
    'CLI candidate row',
    'README.md',
    'CLI `0.39.0-rc.native-sections.3` with that exact Core/Read pair',
    'CLI `0.39.0-rc.native-sections.2` with that exact Core/Read pair',
  ],
  [
    'MCP candidate row',
    'README.md',
    'MCP `0.8.0-rc.native-sections.1` with that exact native CLI',
    'MCP `0.8.1-rc.combination.1` with that exact native CLI',
  ],
  [
    'Studio candidate row',
    'README.md',
    'StudioCore `4.0.0-rc.components.2` with that exact Core/Read pair',
    'StudioCore `4.5.0-rc.material-edit.1` with that exact Core/Read pair',
  ],
  [
    'English published Core',
    'README.md',
    '`0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`; loading CLI',
    '`0.37.1-rc.browser.1` / Read `0.11.0-rc.r2.7`; loading CLI',
  ],
  [
    'English published Read',
    'README.md',
    '`0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`; loading CLI',
    '`0.36.0-rc.r2.7` / Read `0.11.2-rc.browser.1`; loading CLI',
  ],
  [
    'Chinese published Core',
    'README.zh.md',
    '其精确依赖为 `@aikdna/kdna-core@0.36.0-rc.r2.7`',
    '其精确依赖为 `@aikdna/kdna-core@0.37.1-rc.browser.1`',
  ],
  [
    'Chinese published Read',
    'README.zh.md',
    '`@aikdna/kdna-read@0.11.0-rc.r2.7`。该组合',
    '`@aikdna/kdna-read@0.11.2-rc.browser.1`。该组合',
  ],
  [
    'status published Core',
    'docs/core-read-current-status.md',
    '`0.39.0-rc.native-sections.2` with Core `0.36.0-rc.r2.7` / Read',
    '`0.39.0-rc.native-sections.2` with Core `0.37.1-rc.browser.1` / Read',
  ],
  [
    'status published Read',
    'docs/core-read-current-status.md',
    '`0.11.0-rc.r2.7`. These are distinct installed graphs.',
    '`0.11.2-rc.browser.1`. These are distinct installed graphs.',
  ],
  [
    'historical publication role',
    'README.md',
    'Historical native CLI `0.39.0-rc.native-sections.2`',
    'Current native CLI `0.39.0-rc.native-sections.2`',
  ],
  [
    'Chinese published status',
    'README.zh.md',
    '下面保留已发布原生线的独立历史示例。',
    '下面保留未发布原生线的独立历史示例。',
  ],
  [
    'support licensed-asset index status',
    'docs/current-release-support.md',
    'verification scope `0.1.5`',
    'verification scope `0.2.0`',
  ],
  [
    'support Studio status',
    'docs/current-release-support.md',
    'npm `3.0.0`. Current source is not a stable npm release.',
    'npm `4.0.0`. Current source is a stable npm release.',
  ],
  [
    'support Loader/MCP adapter status',
    'docs/current-release-support.md',
    'npm MCP `0.5.0`; not the current native adapter.',
    'npm MCP `0.5.0`; it is the current native adapter.',
  ],
];
for (const label of ['原生交付说明', '作者示例', '可执行原生配方'])
  nativeIdentityMutations.push([
    `Chinese ${label} fixed published URL`,
    'README.zh.md',
    `[${label}](https://unpkg.com/@aikdna/kdna-cli@0.39.0-rc.native-sections.2/`,
    `[${label}](https://unpkg.com/@aikdna/kdna-cli@0.39.1-rc.combination.1/`,
  ]);
for (const file of ['README.md', 'README.zh.md'])
  nativeIdentityMutations.push([
    `${file} candidate installed CLI coordinate`,
    file,
    'npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.39.0-rc.native-sections.3',
    'npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.39.0-rc.native-sections.2',
  ]);
for (const [label, file, before, after] of nativeIdentityMutations)
  test(`the fixed published native context refuses ${label}`, () => {
    const result = changedDocument(file, (text) => {
      assert.equal(text.split(before).length - 1, 1, 'Mutation names one bounded native fact');
      return text.replace(before, after);
    });
    assert.ok(result.issues.some((issue) => issue.name.startsWith(`${file}:retained-downstream:`)));
  });
const nativeContextAnchors = [
  [
    'README.md',
    '## Current source: choose the matching implementation',
    'actual task adoption.',
    'Published Core `0.37.0`',
  ],
  [
    'README.zh.md',
    '## 已发布原生 CLI 0.39.0-rc.native-sections.2 的独立路径',
    '这条路径使用包内作者示例与配方。Studio 保留独立创作路径。',
    '下面保留已发布原生线的独立历史示例。',
  ],
  [
    'docs/core-read-current-status.md',
    '## Matching consumer routes',
    'No page, clean checkout, package.json version or draft PR establishes that fact.',
    'The published history retains',
  ],
];
for (const [file, heading, anchor, startAnchor] of nativeContextAnchors) {
  test(`renaming the published native heading in ${file} loses its bounded identity role`, () => {
    const result = changedDocument(file, (text) =>
      text.replace(heading, '## Separate native notes'),
    );
    assert.ok(result.issues.some((issue) => issue.name.startsWith(`${file}:retained-downstream:`)));
  });
  test(`moving the intact native statement to another heading in ${file} is refused`, () => {
    const result = changedDocument(file, (text) => {
      const start = text.indexOf(startAnchor),
        end = text.indexOf(anchor, start) + anchor.length;
      assert.ok(start >= 0 && end > start);
      const statement = text.slice(start, end);
      return text.slice(0, start) + text.slice(end) + '\n## Relocated native notes\n\n' + statement;
    });
    assert.ok(result.issues.some((issue) => issue.name.startsWith(`${file}:retained-downstream:`)));
    assert.ok(result.issues.some((issue) => issue.name.includes('current-package')));
  });
  for (const [label, claim, issueKind] of [
    [
      'native pair recast as current',
      'Current Core `0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`.',
      'current-package',
    ],
    [
      'stale browser family recast as current',
      'Current Core `0.37.1-rc.browser.0` / Read `0.11.2-rc.browser.0`.',
      'current-package',
    ],
    [
      'current browser coordinate assigned to the wrong owner',
      `Current Core \`${source.engineering.package_versions.read}\`.`,
      'current-owner',
    ],
  ])
    test(`${label} beside the retained native text in ${file} is still scanned`, () => {
      const result = changedDocument(file, (text) => {
        assert.equal(text.split(anchor).length - 1, 1);
        return text.replace(anchor, anchor + ' ' + claim);
      });
      assert.equal(
        result.issues.some((issue) => issue.name.includes(':retained-')),
        false,
        'Original fixed contexts remain valid; the added claim must fail its own identity check',
      );
      assert.ok(result.issues.some((issue) => issue.name.includes(issueKind)));
    });
}
test('a copied native recipe is not exempt in another document or a second heading', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const recipe = readme.match(/```sh\nmkdir kdna-native-example\n[\s\S]*?\n```/)[0];
  // The recipe's own CLI coordinate is an admitted companion preview coordinate.
  // Point the copy at the superseded neighbour so this control still proves that a
  // copied recipe gains no scanning exemption.
  const staleRecipe = recipe.replace('0.39.0-rc.native-sections.3', '0.39.0-rc.native-sections.2');
  assert.notEqual(staleRecipe, recipe, 'recipe must name the CLI coordinate');
  for (const file of ['README.md', 'SPEC-INDEX.md']) {
    const result = changedDocument(
      file,
      // The intact copy keeps the retained-downstream control (the exact retained
      // text must not appear a second time); the stale copy keeps the
      // current-package control for both files.
      (text) => text + '\n## Copied native example\n\n' + recipe + '\n\n' + staleRecipe,
    );
    assert.ok(result.issues.some((issue) => issue.name.includes('current-package')));
    if (file === 'README.md')
      assert.ok(
        result.issues.some((issue) => issue.name.startsWith(`${file}:retained-downstream:`)),
      );
  }
});
for (const file of ['docs/version-taxonomy.md', 'specs/read-contract.md'])
  test(`a wrong-owner current browser claim elsewhere in ${file} gains no native exemption`, () => {
    const result = changedDocument(
      file,
      (text) => text + `\nCurrent Read \`${source.engineering.package_versions.core}\`.\n`,
    );
    assert.ok(result.issues.some((issue) => issue.name.includes('current-owner')));
  });
for (const [file, before, after] of [
  [
    'README.md',
    'Once official registry metadata confirms the exact preview versions',
    'The exact preview versions are already published',
  ],
  ['README.md', 'CLI `.2` is already published', 'CLI `.2` is not published'],
  ['README.md', '`.3` and must not overwrite `.2`', '`.3` and may overwrite `.2`'],
  [
    'README.zh.md',
    '只有官方 registry 元数据确认这三个精确预览版本后',
    '这三个精确预览版本现在已在官方 registry 发布',
  ],
  [
    'docs/start-here.md',
    'publication is disabled and named Host delivery remains NOT_RUN',
    'publication is enabled and named Host delivery is accepted',
  ],
  [
    'docs/current-release-support.md',
    'The combinations below are published on their own dist-tags',
    'The combinations below are not published on any dist-tag',
  ],
  [
    'docs/current-release-support.md',
    'A descriptor supplied by an Agent does not establish authorization by itself',
    'A descriptor supplied by an Agent establishes authorization by itself',
  ],
  [
    'docs/core-read-current-status.md',
    '`latest` remains unchanged and existing version collisions fail closed',
    '`latest` is replaced and existing version collisions are overwritten',
  ],
  [
    'docs/core-read-current-status.md',
    'not enable Plan/load in the native asset CLI',
    'enable Plan/load in the native asset CLI',
  ],
  [
    'docs/core-read-current-status.md',
    'do not fall back to plaintext or a raw parser',
    'fall back to plaintext or a raw parser',
  ],
])
  test(`current publication or permission fact stays explicit: ${file}: ${before}`, () => {
    const result = changedDocument(file, (text) => {
      assert.equal(text.split(before).length - 1, 1);
      return text.replace(before, after);
    });
    assert.ok(
      result.issues.length,
      'Correct coordinates cannot rescue a false capability or publication statement',
    );
  });
for (const [file, heading, firstCell] of [
  ['README.md', '## Current source:', '[Native CLI](https://github.com/aikdna/kdna-cli#readme)'],
  ['README.zh.md', '## 当前源码', '[原生 CLI](https://github.com/aikdna/kdna-cli#readme)'],
  ['docs/core-read-current-status.md', '## Matching consumer routes', 'Native CLI'],
  [
    'docs/current-release-support.md',
    '## Repository-by-repository support',
    '[kdna-cli](https://github.com/aikdna/kdna-cli)',
  ],
]) {
  test(`a second conflicting delivery row cannot coexist with the correct row in ${file}`, () => {
    const result = changedDocument(file, (text) => {
      const row = text.split('\n').find((line) => line.startsWith(`| ${firstCell} |`));
      assert.ok(row);
      return text.replace(
        row,
        row + `\n| ${firstCell} | Core 0.37.0 / Read 0.11.1 | Already published; current route |`,
      );
    });
    assert.ok(
      result.issues.some((issue) => issue.name === `${file}:current-table-roles:${heading}`),
    );
  });
  test(`current route roles cannot be swapped in ${file}`, () => {
    const result = changedDocument(file, (text) => text.replace(`| ${firstCell} |`, '| SDK |'));
    assert.ok(
      result.issues.some((issue) => issue.name === `${file}:current-table-roles:${heading}`),
    );
  });
}
for (const [file, before] of [
  ['README.md', 'https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md'],
  ['README.zh.md', 'https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs'],
])
  test(`the current source route cannot silently choose an unrelated recipe in ${file}`, () => {
    const result = changedDocument(file, (text) => text.replace(before, before + '.retired'));
    assert.ok(result.issues.some((issue) => issue.name.startsWith(`${file}:current:`)));
  });
for (const [file, before, after] of [
  [
    'README.md',
    'Ordinary and Host-unlocked protected browser SDK; declared Node reference exports; Node >=20',
    'All protected files unlocked automatically; Node >=18',
  ],
  [
    'README.zh.md',
    '普通与 Host 解锁的受保护浏览器 SDK、声明的 Node 参考入口；Node >=20',
    '无需 Host 的全部受保护浏览器 SDK；Node >=18',
  ],
  [
    'docs/current-release-support.md',
    'npm Core `0.37.0`, Read `0.11.1`; their own contracts and artifacts.',
    'npm Core `0.37.1`, Read `0.11.2`; current candidates already published.',
  ],
  [
    'docs/current-release-support.md',
    'npm native `.2` on `r2.7`; loading CLI `0.36.1` on `latest`.',
    'npm native `.3` on `latest`; loading CLI `0.36.1` on `r2.7`.',
  ],
  [
    'docs/current-release-support.md',
    'GitHub release `0.1.1`; source asset index, not an npm SDK.',
    'GitHub release `0.1.1`; it is the current npm SDK.',
  ],
])
  test(`stable-only publication or base SDK capability cannot drift in ${file}: ${before}`, () => {
    const result = changedDocument(file, (text) => {
      assert.equal(text.split(before).length - 1, 1);
      return text.replace(before, after);
    });
    assert.ok(result.issues.length);
  });
for (const file of ['README.md', 'README.zh.md', 'docs/current-release-support.md'])
  test(`a native contract cannot replace the base SDK tuple in ${file}`, () => {
    const result = changedDocument(
      file,
      (text) => text + '\nCurrent SDK Read `kdna.read/0.7.0-candidate`.\n',
    );
    assert.ok(result.issues.some((issue) => issue.name.includes('current-tuple')));
  });
test('the current policy rejects a transport URI rollback at its own binding gate', () => {
  const result = changedDocument('specs/public-version-policy.md', (text) => {
    assert.ok(text.includes('urn:kdna:schema:read-transport-admission:0.2.1'));
    return text.replace(
      'urn:kdna:schema:read-transport-admission:0.2.1',
      'urn:kdna:schema:read-transport-admission:0.2.0',
    );
  });
  assert.ok(result.issues.some((issue) => issue.name === 'policy:transport-binding'));
});
for (const stale of [
  '| catalog_only | catalog (unchanged actual CoreAdmissionCatalogOnly), operation, receipt | No snapshot/IR. All technical/protection steps passed; sole unknown-critical blocker. |',
  '| read_result | actual unchanged ReadCallResult, receipt, disclosure | Includes genuine ready, catalog_only or existing Read refusal. No new protection code inserted into old result. |',
])
  test(
    'the current protection union table rejects restored catalog-only wording: ' +
      stale.split('|')[1].trim(),
    () => {
      const result = changedDocument('specs/protection-admission.md', (text) =>
        text.replace('## 6.', stale + '\n\n## 6.'),
      );
      assert.ok(result.issues.some((issue) => issue.name === 'protection:current-result-unions'));
    },
  );
const bodyRegressions = [
  [
    'governing existing old Read schema beneath the correct heading',
    'specs/read-contract.md',
    '[read-contract-0.6.4.schema.json](read-contract-0.6.4.schema.json)',
    '[read-contract-0.6.1.schema.json](read-contract-0.6.1.schema.json)',
  ],
  [
    'crypto tail current pair from an old major/minor family',
    'specs/kdna-crypto-profiles.md',
    'local package line is Core `0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1`',
    'local package line is Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`',
  ],
  [
    'matrix late capability row',
    'docs/version-and-capability-matrix.md',
    'Native 0.3.1 formats',
    'Native 0.2 formats',
  ],
  [
    'matrix late reception row',
    'docs/version-and-capability-matrix.md',
    '| Core / Read R2 |',
    '| Core / Read grammar.3 |',
  ],
  [
    'Status late licensed capability beside a correct introduction',
    'docs/status.md',
    'Explicit Node protection admits supported encrypted containers under trusted providers',
    'current Core does not implement encrypted-container admission',
  ],
  [
    'Status optional static execution beside the correct introduction',
    'docs/status.md',
    'optional native 0.3.1 static Plan/Capsule admission',
    'published planning and Capsule only',
  ],
  ['outer maturity badge missing fragment', 'README.md', '](./docs/maturity.md)', '](#maturity)'],
  [
    'outer maturity badge missing file',
    'README.md',
    '](./docs/maturity.md)',
    '](./docs/no-such-maturity.md)',
  ],
  [
    'historical role relabeled current',
    'specs/public-version-policy.md',
    'The historical RC4 exact pair was',
    'The current RC4 exact pair is',
  ],
];
for (const [label, file, before, after] of bodyRegressions)
  test(`full-page navigation refuses ${label}`, () => {
    const result = changedDocument(file, (text) => {
      assert.ok(text.includes(before));
      return text.replace(before, after);
    });
    assert.ok(result.issues.length, label);
  });
for (const file of DOCUMENTS)
  test(`a stale current package appended to ${file} cannot hide behind correct earlier text or history`, () => {
    const result = changedDocument(
      file,
      (text) =>
        text + '\nThe current pair is Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`.\n',
    );
    assert.ok(
      result.issues.some((issue) => issue.name.includes('current-package')),
      JSON.stringify(result.issues),
    );
  });
test('a superseded companion preview coordinate is still refused on a current line', () => {
  for (const stale of [
    '0.39.0-rc.native-sections.2',
    '0.13.0-rc.components.1',
    '0.7.0-rc.component-semantics.1',
  ]) {
    const result = changedDocument(
      'README.md',
      (text) => text + `\nThe current CLI candidate is \`${stale}\`.\n`,
    );
    assert.ok(
      result.issues.some((issue) => issue.name.includes('current-package')),
      `${stale}: ${JSON.stringify(result.issues)}`,
    );
  }
});
test('a correct package coordinate cannot be assigned to the wrong current owner', () => {
  const result = changedDocument(
    'specs/read-contract.md',
    (text) => text + '\nThe current Core is `0.11.0-rc.r2.7`.\n',
  );
  assert.ok(result.issues.some((issue) => issue.name.includes('current-owner')));
});
test('a numeric old current coordinate without an rc suffix is also refused', () => {
  const result = changedDocument(
    'specs/read-contract.md',
    (text) => text + '\nThe current Core is Core `0.35.0`.\n',
  );
  assert.ok(result.issues.some((issue) => issue.name.includes('current-owner')));
});
test('an old schema link label cannot hide behind a correct destination', () => {
  const result = changedDocument('specs/read-contract.md', (text) =>
    text.replace('[read-contract-0.6.4.schema.json]', '[read-contract-0.6.1.schema.json]'),
  );
  assert.ok(result.issues.some((issue) => issue.name.includes('governing-read-schema')));
});
test('the nested image and its outer local link are both parsed', () => {
  assert.deepEqual(
    markdownLinks('[![Maturity](https://example.test/badge.svg)](./docs/maturity.md)').map(
      (link) => link.href,
    ),
    ['https://example.test/badge.svg', './docs/maturity.md'],
  );
  assert.deepEqual(
    markdownLinks('[![Badge](https://example.test/a_(b).svg)](<./docs/maturity.md>)').map(
      (link) => link.href,
    ),
    ['https://example.test/a_(b).svg', './docs/maturity.md'],
  );
});
test('nested outer link to a real local heading succeeds', () => {
  const result = changedDocument(
    'README.md',
    (text) =>
      text +
      '\n[![Proof](https://example.test/badge.svg)](./SPEC-INDEX.md#kdna-public-specification-index)\n',
  );
  assert.deepEqual(result.issues, []);
});
test('a new stale current statement inside a history section is not exempted with the retained paragraph', () => {
  const result = changedDocument('specs/public-version-policy.md', (text) =>
    text.replace(
      'The historical RC4 exact pair was',
      'The current pair is Core `0.35.0-rc.source.1`.\n\nThe historical RC4 exact pair was',
    ),
  );
  assert.ok(result.issues.some((issue) => issue.name.includes('current-package')));
});
test('correct tuple values elsewhere cannot rescue a stale current matrix cell', () => {
  const result = changedDocument('docs/version-and-capability-matrix.md', (text) =>
    text.replace(
      '| Container `format_version` | `0.1.0` | `0.5.0` |',
      '| Container `format_version` | `0.1.0` | `0.4.0` |',
    ),
  );
  assert.ok(
    result.issues.some((issue) => issue.name === 'matrix:current-axis:Container `format_version`'),
  );
});
test('the actual packed Read narrative cannot reintroduce the unreachable transport status beside correct text', () => {
  const result = changedDocument(
    'packages/kdna-read/README.md',
    (text) =>
      text + '\nRemote transport compares bindings on both ready and catalog-only responses.\n',
  );
  assert.ok(result.issues.some((issue) => issue.name === 'packed-read:transport-role'));
});
test('the packed Read narrative preserves catalog mode while rejecting the old envelope status', () => {
  const result = changedDocument('packages/kdna-read/README.md', (text) =>
    text.replace('catalog reading mode remains supported', 'catalog reading mode is unsupported'),
  );
  assert.ok(result.issues.length);
});
for (const [label, mutate] of [
  [
    'candidate line',
    (policy) => {
      policy.line = 'r2.rc3';
    },
  ],
  [
    'planned package line',
    (policy) => {
      policy.planned_packages[0].line = 'r2.rc2';
    },
  ],
  [
    'read design axis',
    (policy) => {
      policy.design_axes.find((row) => row.axis === 'read').target = 'kdna.read/0.6.0';
    },
  ],
  [
    'current Core package mirror',
    (policy) => {
      policy.planned_packages.find(
        (row) => row.name === '@aikdna/kdna-core',
      ).current_source_version = '0.36.0-rc.r2.2';
    },
  ],
  [
    'candidate Read package mirror',
    (policy) => {
      policy.planned_packages.find((row) => row.name === '@aikdna/kdna-read').candidate_version =
        '0.11.0-rc.r2.2';
    },
  ],
  [
    'supported tuple mirror',
    (policy) => {
      policy.supported_tuple.read = 'kdna.read/0.6.2';
    },
  ],
])
  test(`the current decision ${label} must agree with its source owner`, () => {
    const file = 'specs/public-contract-decisions.json';
    const result = changedDocument(file, (text) => {
      const data = JSON.parse(text);
      mutate(data.version_policy);
      return JSON.stringify(data);
    });
    assert.ok(result.issues.some((issue) => issue.name.startsWith('current-decisions:')));
  });

function changedDecisionAxes(mutate) {
  return changedDocument('specs/public-contract-decisions.json', (text) => {
    const data = JSON.parse(text),
      original = structuredClone(data.version_policy);
    mutate(data.version_policy);
    assert.notDeepEqual(
      data.version_policy,
      original,
      'The intended mirror mutation must occur, not only JSON reformatting',
    );
    assert.deepEqual(
      data.version_policy.supported_tuple,
      original.supported_tuple,
      'The full tuple stays correct in axis counterexamples',
    );
    return JSON.stringify(data);
  });
}
const currentAxisNames = [
  'container',
  'payload',
  'core_api',
  'canonical_ir',
  'runtime_capsule',
  'consumption_plan',
  'agent_host',
  'trace',
  'read',
  'package_set_handoff',
];
for (const axis of currentAxisNames) {
  test(`a missing current ${axis} row cannot hide behind a correct supported tuple`, () => {
    const result = changedDecisionAxes((policy) => {
      assert.equal(policy.design_axes.filter((row) => row.axis === axis).length, 1);
      policy.design_axes = policy.design_axes.filter((row) => row.axis !== axis);
    });
    assert.ok(result.issues.some((issue) => issue.name === 'current-decisions:axis-set'));
    assert.ok(result.issues.some((issue) => issue.name === `current-decisions:axis:${axis}`));
  });
  test(`a duplicate current ${axis} row is rejected even when both values are correct`, () => {
    const result = changedDecisionAxes((policy) => {
      const row = policy.design_axes.find((row) => row.axis === axis);
      assert.ok(row);
      policy.design_axes.push(structuredClone(row));
    });
    assert.ok(result.issues.some((issue) => issue.name === 'current-decisions:axis-set'));
    assert.ok(result.issues.some((issue) => issue.name === `current-decisions:axis:${axis}`));
  });
}
for (const target of ['kdna.package-set-handoff/0.1.0', 'kdna.package-set-handoff/99.0.0']) {
  test(`the handoff mirror rejects ${target} using the public source owner outside VersionTuple`, () => {
    const result = changedDecisionAxes((policy) => {
      const row = policy.design_axes.find((row) => row.axis === 'package_set_handoff');
      assert.equal(row.target, 'kdna.package-set-handoff/0.2.1');
      row.target = target;
    });
    assert.ok(
      result.issues.some((issue) => issue.name === 'current-decisions:axis:package_set_handoff'),
    );
  });
}
test('an unknown extra current axis fails with all ten correct rows still present', () => {
  const result = changedDecisionAxes((policy) => {
    policy.design_axes.push({ axis: 'unknown_future_axis', target: 'kdna.future/1.0.0' });
  });
  assert.ok(result.issues.some((issue) => issue.name === 'current-decisions:axis-set'));
});
test('reordering the ten correct current axes preserves their meaning', () => {
  const result = changedDecisionAxes((policy) => {
    policy.design_axes.reverse();
  });
  assert.deepEqual(result.issues, []);
});
test('a real observation date change does not change a semantic coordinate', () => {
  const result = changedDocument('specs/public-contract-decisions.json', (text) => {
    const data = JSON.parse(text),
      row = data.version_policy.planned_packages[0];
    assert.ok(Object.hasOwn(row, 'current_source_version_observed'));
    const before = row.current_source_version_observed;
    row.current_source_version_observed = before === '2026-09-25' ? '2026-09-26' : '2026-09-25';
    assert.notEqual(row.current_source_version_observed, before);
    return JSON.stringify(data);
  });
  assert.deepEqual(result.issues, []);
});
for (const missingMirrorValue of [false, true])
  test(`a missing public handoff owner fails even with mirror value ${missingMirrorValue ? 'also absent' : 'present'}`, () => {
    const sourcePath = 'specs/public-semantic-source.json',
      decisionsPath = 'specs/public-contract-decisions.json';
    const changedSource = structuredClone(source);
    assert.equal(
      changedSource.types.PackageSetHandoff.properties.contract.const,
      'kdna.package-set-handoff/0.2.1',
    );
    delete changedSource.types.PackageSetHandoff.properties.contract.const;
    const changedDecisions = JSON.parse(fs.readFileSync(path.join(root, decisionsPath), 'utf8'));
    if (missingMirrorValue) {
      const row = changedDecisions.version_policy.design_axes.find(
        (row) => row.axis === 'package_set_handoff',
      );
      assert.ok(Object.hasOwn(row, 'target'));
      delete row.target;
    }
    const result = checkCurrentNavigation(root, {
      compiled: false,
      readText: (rel) =>
        rel === sourcePath
          ? JSON.stringify(changedSource)
          : rel === decisionsPath
            ? JSON.stringify(changedDecisions)
            : fs.readFileSync(path.join(root, rel), 'utf8'),
    });
    assert.ok(
      result.issues.some((issue) => issue.name === 'source-owner:axis:package_set_handoff'),
    );
    assert.ok(
      result.issues.some((issue) => issue.name === 'current-decisions:axis:package_set_handoff'),
    );
  });
test('joining a missing payload owner cannot create an apparently present coordinate', () => {
  const sourcePath = 'specs/public-semantic-source.json',
    decisionsPath = 'specs/public-contract-decisions.json';
  const changedSource = structuredClone(source);
  assert.equal(changedSource.versionTuple.payload_profile, 'kdna.payload.judgment');
  delete changedSource.versionTuple.payload_profile;
  const changedDecisions = JSON.parse(fs.readFileSync(path.join(root, decisionsPath), 'utf8'));
  delete changedDecisions.version_policy.supported_tuple.payload_profile;
  changedDecisions.version_policy.design_axes.find((row) => row.axis === 'payload').target =
    'undefined/0.5.0';
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: (rel) =>
      rel === sourcePath
        ? JSON.stringify(changedSource)
        : rel === decisionsPath
          ? JSON.stringify(changedDecisions)
          : fs.readFileSync(path.join(root, rel), 'utf8'),
  });
  assert.ok(result.issues.some((issue) => issue.name === 'source-owner:axis:payload'));
});

const sourceMapPath = 'specs/public-source-map.json',
  decisionsPath = 'specs/public-contract-decisions.json';
const sourceMap = JSON.parse(fs.readFileSync(path.join(root, sourceMapPath), 'utf8'));
const decisionDocument = JSON.parse(fs.readFileSync(path.join(root, decisionsPath), 'utf8'));
const schemaOwners = {
  ...source.r2_semantics.schema_paths,
  [source.transport_admission.root]: source.transport_admission.schema_path,
  [source.protection_admission.checksums.root]: source.protection_admission.checksums.schema_path,
};
function changedNavigationInputs(mutate) {
  const inputs = {
    source: structuredClone(source),
    map: structuredClone(sourceMap),
    decisions: structuredClone(decisionDocument),
  };
  const before = structuredClone(inputs);
  mutate(inputs);
  assert.notDeepEqual(inputs, before, 'A counterexample must change the parsed data');
  return inputs;
}
function checkInputs(inputs) {
  const changed = new Map([
    ['specs/public-semantic-source.json', inputs.source],
    [sourceMapPath, inputs.map],
    [decisionsPath, inputs.decisions],
  ]);
  return checkCurrentNavigation(root, {
    readText: (rel) =>
      changed.has(rel)
        ? JSON.stringify(changed.get(rel))
        : fs.readFileSync(path.join(root, rel), 'utf8'),
  });
}
function rejectsInputsBeforeGeneration(inputs) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'r2-input-navigation-'));
  try {
    const candidateRoot = path.join(temporary, 'candidate');
    fs.mkdirSync(path.join(candidateRoot, 'specs'), { recursive: true });
    const mapBytes = Buffer.from(JSON.stringify(inputs.map));
    const decisionBytes = Buffer.from(JSON.stringify(inputs.decisions));
    // Re-pin the changed accepted input: an authorized hash update must not make
    // a stale semantic edge or a false existence statement admissible.
    const crypto = require('node:crypto');
    for (const [rel, content] of [
      [sourceMapPath, mapBytes],
      [decisionsPath, decisionBytes],
    ]) {
      fs.writeFileSync(path.join(candidateRoot, rel), content);
      const pin = inputs.source.accepted_designs.find((row) => row.path === rel);
      pin.bytes = content.length;
      pin.sha256 = crypto.createHash('sha256').update(content).digest('hex');
    }
    const input = path.join(candidateRoot, 'specs/public-semantic-source.json');
    const candidateBytes = Buffer.from(JSON.stringify(inputs.source));
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
    const out = path.join(temporary, 'output'),
      scratch = path.join(temporary, 'scratch');
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
    assert.equal(fs.existsSync(out), false, 'Admission failure creates no output');
    assert.equal(fs.existsSync(scratch), false, 'Admission failure creates no scratch');
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}
for (const [name, schemaPath] of Object.entries(schemaOwners)) {
  for (const [label, mutate] of [
    [
      'missing',
      (map) => {
        map.edges = map.edges.filter((edge) => edge.target !== schemaPath);
      },
    ],
    [
      'duplicate',
      (map) => {
        map.edges.push(structuredClone(map.edges.find((edge) => edge.target === schemaPath)));
      },
    ],
    [
      'wrong source owner',
      (map) => {
        map.edges.find((edge) => edge.target === schemaPath).source =
          'specs/public-semantic-source.json#/component_semantics';
      },
    ],
  ])
    test(`the complete source map rejects a ${label} ${name} edge`, () => {
      const result = checkInputs(changedNavigationInputs((inputs) => mutate(inputs.map)));
      assert.ok(result.issues.some((issue) => issue.name === `source-map:owner:${schemaPath}`));
    });
}
const mapHistory = [
  ['ReadCallResult', 'specs/read-contract-0.6.schema.json'],
  ['ProtectionDefinitionObservation', 'specs/protection-admission-r2-binding-2.schema.json'],
  ['IssuerResultObservation', 'specs/external-grant-issuer-r2-binding-2.schema.json'],
  ['ProtectedSourceObservation', 'specs/protected-source-r2-binding-2.schema.json'],
];
for (const [name, historicalPath] of mapHistory)
  test(`a re-pinned historical ${name} map edge fails navigation and generator before writes`, () => {
    assert.ok(fs.existsSync(path.join(root, historicalPath)));
    const inputs = changedNavigationInputs(({ map }) => {
      map.edges.find((edge) => edge.target === schemaOwners[name]).target = historicalPath;
    });
    assert.ok(checkInputs(inputs).issues.some((issue) => issue.name === 'source-map:schema-set'));
    rejectsInputsBeforeGeneration(inputs);
  });
for (const [label, mutate, issue] of [
  [
    'absent current target',
    ({ source: s }) => {
      s.target_lines = s.target_lines.filter((row) => row.line !== 'browser.rc1');
    },
    'current-target:unique',
  ],
  [
    'duplicate current target',
    ({ source: s }) => {
      s.target_lines.push(
        structuredClone(s.target_lines.find((row) => row.line === 'browser.rc1')),
      );
    },
    'current-target:unique',
  ],
  [
    'wrong current tuple',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'browser.rc1').versionTuple.read =
        'kdna.read/0.6.0';
    },
    'current-target:tuple',
  ],
  [
    'wrong Core package',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'browser.rc1').package_versions[0].core =
        '0.36.0-rc.r2.2';
    },
    'current-target:packages',
  ],
  [
    'wrong Read package',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'browser.rc1').package_versions[0].read =
        '0.11.0-rc.r2.2';
    },
    'current-target:packages',
  ],
  [
    'duplicate package pair',
    ({ source: s }) => {
      const row = s.target_lines.find((row) => row.line === 'browser.rc1');
      row.package_versions.push(structuredClone(row.package_versions[0]));
    },
    'current-target:packages',
  ],
  [
    'another current label',
    ({ source: s }) => {
      s.target_lines[0].status = 'CURRENT_UNPUBLISHED_TARGET';
    },
    'current-target:unique',
  ],
  [
    'missing current label',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'browser.rc1').status =
        'UNACCEPTED_SUPERSEDED_CANDIDATE_HISTORY';
    },
    'current-target:unique',
  ],
  [
    'planned source declaration',
    ({ decisions }) => {
      decisions.source_of_future_machine_semantics =
        'specs/public-semantic-source.json (PLANNED_NOT_PRESENT)';
    },
    'current-decisions:source-present',
  ],
  [
    'wrong declared source path',
    ({ decisions }) => {
      decisions.source_of_future_machine_semantics =
        decisions.source_of_future_machine_semantics.replace(
          'public-semantic-source',
          'missing-source',
        );
    },
    'current-decisions:source-present',
  ],
  [
    'missing source declaration',
    ({ decisions }) => {
      delete decisions.source_of_future_machine_semantics;
    },
    'current-decisions:source-present',
  ],
  [
    'planned map source',
    ({ map }) => {
      map.single_machine_editable_source.status = 'PLANNED_NOT_PRESENT';
    },
    'source-map:machine-source',
  ],
  [
    'wrong map source path',
    ({ map }) => {
      map.single_machine_editable_source.path = 'specs/missing-source.json';
    },
    'source-map:machine-source',
  ],
  [
    'historical current owner',
    ({ source: s }) => {
      s.historical_artifacts.push({ path: s.transport_admission.schema_path });
    },
    `source-map:current-not-historical:${source.transport_admission.schema_path}`,
  ],
  [
    'extra schema edge',
    ({ map }) => {
      map.edges.push({
        source: 'specs/public-semantic-source.json',
        target: 'specs/unowned.schema.json',
      });
    },
    'source-map:schema-set',
  ],
])
  test(`the shared pre-generation gate rejects ${label}`, () => {
    const inputs = changedNavigationInputs(mutate);
    assert.ok(
      checkInputs(inputs).issues.some((row) => row.name === issue),
      label,
    );
    rejectsInputsBeforeGeneration(inputs);
  });
// Promotion fixtures are built explicitly from either a candidate or released
// source. Stable versions resolve through the one current row, not its label.
function promoteFixture({ source: s, decisions }) {
  const row = s.target_lines.find((candidate) =>
    ['CURRENT_RELEASED_TARGET', 'CURRENT_UNPUBLISHED_TARGET'].includes(candidate.status),
  );
  assert.ok(row);
  row.status = 'CURRENT_RELEASED_TARGET';
  for (const key of ['core', 'read'])
    s.engineering.package_versions[key] = s.engineering.package_versions[key].split('-')[0];
  row.package_versions = [structuredClone(s.engineering.package_versions)];
  for (const pkg of decisions.version_policy.planned_packages) {
    const key = pkg.name.endsWith('kdna-core') ? 'core' : 'read';
    pkg.candidate_version = pkg.current_source_version = s.engineering.package_versions[key];
  }
  return row;
}
test('a promoted source resolves the current line under either current status', () => {
  const inputs = changedNavigationInputs((input) => {
    const row = promoteFixture(input);
    row.status = 'CURRENT_UNPUBLISHED_TARGET';
  });
  const result = checkInputs(inputs);
  assert.deepEqual(
    result.issues.filter(
      (row) =>
        row.name.startsWith('current-target:') ||
        row.name === 'current-decisions:line' ||
        row.name.startsWith('current-decisions:package:'),
    ),
    [],
  );
});
for (const [label, mutate] of [
  [
    'zero current rows on a promoted source',
    ({ source: s }) => {
      const row = s.target_lines.find(
        (candidate) => candidate.status === 'CURRENT_RELEASED_TARGET',
      );
      row.status = 'UNACCEPTED_SUPERSEDED_CANDIDATE_HISTORY';
    },
  ],
  [
    'two current rows on a promoted source',
    ({ source: s }) => {
      const row = s.target_lines.find(
        (candidate) => candidate.status === 'CURRENT_RELEASED_TARGET',
      );
      const clone = structuredClone(row);
      clone.status = 'CURRENT_UNPUBLISHED_TARGET';
      s.target_lines.push(clone);
    },
  ],
  [
    'two released rows on a promoted source',
    ({ source: s }) => {
      const row = s.target_lines.find(
        (candidate) => candidate.status === 'CURRENT_RELEASED_TARGET',
      );
      const clone = structuredClone(row);
      s.target_lines.push(clone);
    },
  ],
])
  test(`promotion navigation rejects ${label}`, () => {
    const inputs = changedNavigationInputs((input) => {
      promoteFixture(input);
      mutate(input);
    });
    assert.ok(
      checkInputs(inputs).issues.some((row) => row.name === 'current-target:unique'),
      label,
    );
    rejectsInputsBeforeGeneration(inputs);
  });
test('a promoted document section missing its current stable identity is refused', () => {
  const file = 'specs/read-contract.md',
    original = fs.readFileSync(path.join(root, file), 'utf8');
  const marker =
    'The current exact pair is Core `0.37.1-rc.browser.1` and Read `0.11.2-rc.browser.1`';
  assert.ok(original.includes(marker), 'expected the current stable pair statement');
  const changed = original.replace(
    marker,
    'The current exact pair is Core `0.36.1` and Read `0.11.2-rc.browser.1`',
  );
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
  });
  assert.ok(
    result.issues.some((row) => row.name.startsWith(`${file}:identity-family:`)),
    JSON.stringify(result.issues.slice(0, 3)),
  );
});
test('source-map edge order and target history order carry no identity meaning', () => {
  const result = checkInputs(
    changedNavigationInputs(({ map, source: s }) => {
      map.edges.reverse();
      s.target_lines.reverse();
    }),
  );
  assert.deepEqual(result.issues, []);
});

const digest = 'sha256:' + 'a'.repeat(64);
const protectionIdentity = {
  id: 'kdna.protection-admission/1',
  version: '1.0.0',
  definition_digest: digest,
};
const bindingSamples = [
  [
    'ReadCallResult',
    'ReadRequest',
    {
      request_id: 'navigation:request',
      tuple: source.versionTuple,
      budget_bytes: 4096,
      mode: 'catalog',
      selection: null,
      handle: null,
    },
    (value) => {
      value.tuple.read = 'kdna.read/0.6.0';
    },
  ],
  [
    'ProtectionDefinitionObservation',
    'ProtectionRuntimeDescriptor',
    {
      contract: protectionIdentity,
      implementation: {
        package: '@aikdna/kdna-core',
        version: source.engineering.package_versions.core,
      },
      profiles: [
        'kdna.envelope.aead/0.1.0',
        'kdna.envelope.external-grant/0.1.0',
        'kdna.checksums.document/1@1.0.0',
        'kdsig.ed25519/0.1.0',
      ],
      kdfs: ['scrypt-sha256', 'argon2id'],
      capabilities: ['protected_admission', 'protected_operation', 'protected_production'],
    },
    (value) => {
      value.implementation.version = '0.36.0-rc.r2.2';
    },
  ],
  [
    'IssuerResultObservation',
    'IssuerDescriptor',
    {
      id: 'kdna.external-grant-issuer/1',
      version: '1.0.0',
      definition_digest: digest,
      implementation: {
        package: '@aikdna/kdna-core',
        version: source.engineering.package_versions.core,
      },
      exports: ['getExternalGrantIssuerContract', 'issueExternalKeyGrantForAsset'],
      limits: {
        container_bytes: 26214400,
        grant_bytes: 1048576,
        timeout_ms_max: 60000,
        max_concurrent: 4,
      },
    },
    (value) => {
      value.implementation.version = '0.36.0-rc.r2.2';
    },
  ],
  [
    'ProtectedSourceObservation',
    'SourcePreviewValidation',
    {
      contract: protectionIdentity,
      implementation: {
        name: '@aikdna/kdna-core',
        version: source.engineering.package_versions.core,
      },
      source_A: digest,
      original_payload_digest: digest,
      edits_digest: digest,
      policy_digest: digest,
      semantic_status: 'valid',
      proof: 'semantic_validation_not_ciphertext_admission',
    },
    (value) => {
      value.implementation.version = '0.36.0-rc.r2.2';
    },
  ],
];
for (const [owner, definition, current, toHistorical] of bindingSamples)
  test(`the mapped ${owner} schema admits its current ${definition} and refuses the historical coordinate`, () => {
    const Ajv = require('ajv/dist/2020.js');
    const currentPath = sourceMap.edges.find((edge) => edge.target === schemaOwners[owner])?.target;
    assert.equal(currentPath, schemaOwners[owner]);
    const historicalPath = mapHistory.find(([name]) => name === owner)[1];
    const validator = (schemaPath) => {
      const schema = JSON.parse(fs.readFileSync(path.join(root, schemaPath), 'utf8'));
      const ajv = new Ajv({ strict: false, validateFormats: false, allErrors: true });
      ajv.addSchema(schema);
      return ajv.getSchema(`${schema.$id}#/$defs/${definition}`);
    };
    const validCurrent = validator(currentPath),
      validHistorical = validator(historicalPath);
    const old = structuredClone(current);
    toHistorical(old);
    if (owner === 'ReadCallResult') {
      const historical = JSON.parse(fs.readFileSync(path.join(root, historicalPath), 'utf8'));
      old.tuple = Object.fromEntries(
        Object.entries(historical.$defs.VersionTuple.properties).map(([key, node]) => [
          key,
          node.const,
        ]),
      );
    }
    assert.notDeepEqual(old, current);
    assert.equal(validCurrent(current), true, JSON.stringify(validCurrent.errors));
    assert.equal(validCurrent(old), false);
    assert.equal(validHistorical(old), true, JSON.stringify(validHistorical.errors));
    assert.equal(validHistorical(current), false);
  });
test('heading fragments discard complete and unmatched markup without becoming HTML', () => {
  const file = 'README.md';
  const original = fs.readFileSync(path.join(root, file), 'utf8');
  const cases = [
    ['Inline <em>emphasis</em>', 'inline-emphasis'],
    ['Nested <scr<script>ipt> text', 'nested-ipt-text'],
    ['Unclosed <script', 'unclosed-script'],
    ['Angles <<>> and > tail', 'angles--and--tail'],
    ['[Linked title](https://example.test/path)', 'linked-title'],
    ['Unicode 中文 e\u0301', 'unicode-中文-e\u0301'],
    ['Deeper <scr<scr<script>ipt>ipt> text', 'deeper-iptipt-text'],
    ['Two <b>one</b> <i>two</i>', 'two-one-two'],
    ['Tail <a<b<c', 'tail-abc'],
    ['End >>中文<<é', 'end-中文é'],
    ['[<em>Linked 中文</em>](https://example.test/path)', 'linked-中文'],
    ['[Same](https://example.test/a)', 'same'],
    ['<em>Same</em>', 'same-1'],
    ['Same', 'same-2'],
  ];
  const additions = cases
    .map(([heading, fragment]) => `\n## ${heading}\n\n[Check](#${fragment})\n`)
    .join('');
  const changed = original + additions;
  const result = checkCurrentNavigation(root, {
    compiled: false,
    readText: (rel) => (rel === file ? changed : fs.readFileSync(path.join(root, rel), 'utf8')),
  });
  assert.deepEqual(result.issues, []);
  const malformed = changed.replace(
    '[Check](#unclosed-script)',
    '[Check](#unclosed-script-missing)',
  );
  const rejected = checkCurrentNavigation(root, {
    compiled: false,
    readText: (rel) => (rel === file ? malformed : fs.readFileSync(path.join(root, rel), 'utf8')),
  });
  assert.ok(
    rejected.issues.some((issue) => issue.name.includes('anchor:#unclosed-script-missing')),
  );
});
test('heading projection consumes original characters once, including long unclosed tag segments', () => {
  for (const size of [1, 32, 4096, 131072]) {
    const input = '<'.repeat(size) + '正文🔒e\u0301';
    let traversals = 0;
    let visits = 0;
    const onePass = {
      *[Symbol.iterator]() {
        traversals += 1;
        assert.equal(traversals, 1, 'the projection must not rescan the input');
        for (const character of input) {
          visits += 1;
          yield character;
        }
      },
    };
    assert.equal(headingText(onePass), '正文🔒e\u0301');
    assert.equal(visits, size + 5);
    assert.equal(headingText(input + '> retained'), ' retained');
  }
});
test('heading projection never reconstructs angle brackets across consumed segments', () => {
  for (const [input, expected] of [
    ['<scr<script>ipt>', 'ipt'],
    ['<scrip<ignored>t>alert(1)</script>', 'talert(1)'],
    ['x<unclosed<y', 'xunclosedy'],
    ['<<>>', ''],
    ['a>b<c', 'abc'],
    ['a<tag>文</tag>e\u0301', 'a文e\u0301'],
  ]) {
    const projected = headingText(input);
    assert.equal(projected, expected);
    assert.equal(projected.includes('<'), false);
    assert.equal(projected.includes('>'), false);
  }
});
