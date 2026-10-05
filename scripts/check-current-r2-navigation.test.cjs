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
  ['root README current package', 'README.md', '0.36.0-rc.r2.7', '0.35.0-rc.source.1'],
  ['root README current execution', 'README.md', 'native execution 0.3.1', 'native execution 0.2'],
  ['Chinese README package', 'README.zh.md', '0.11.0-rc.r2.7', '0.3.0-rc.component-semantics.2'],
  [
    'Chinese README execution',
    'README.zh.md',
    '原生 0.3.1 Plan/Capsule',
    'Runtime Capsule / Plan 入场不可用',
  ],
  [
    'Core packed README package',
    'packages/kdna-core/README.md',
    '0.36.0-rc.r2.7',
    '0.36.0-rc.r2.4',
  ],
  [
    'Read packed README package',
    'packages/kdna-read/README.md',
    '0.11.0-rc.r2.7',
    '0.11.0-rc.r2.4',
  ],
  [
    'Read packed README exact peer',
    'packages/kdna-read/README.md',
    '0.36.0-rc.r2.7',
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
    'exact Core peer `0.36.0-rc.r2.7`',
    'exact Core peer `0.36.0-rc.r2.4`',
  ],
  [
    'CoreRead guide payload coordinate',
    'docs/core-read-current-status.md',
    'version `0.5.1`',
    'version `0.4.0`',
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
    'Trace `0.3.1`',
    'Trace `0.2.0`',
  ],
  [
    'CoreRead guide unknown critical',
    'docs/core-read-current-status.md',
    'reject all four modes',
    'permit historical catalog_only',
  ],
  ['Start Here package', 'docs/start-here.md', '0.36.0-rc.r2.7', '0.35.0-rc.source.1'],
  [
    'Chinese status current execution',
    'docs/status.zh.md',
    '原生 0.3.1 Plan/Capsule',
    '不可用的 Plan/Capsule',
  ],
  [
    'matrix current package',
    'docs/version-and-capability-matrix.md',
    '| `@aikdna/kdna-core` | `0.36.0-rc.r2.7`',
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
    'binding 7 candidate',
    'binding 1 candidate',
  ],
  ['protection schema id', 'specs/protection-admission.md', ':binding:r2:7', ':binding:r2:4'],
  [
    'protection lower schema link',
    'specs/protection-admission.md',
    'The generated [schema](protection-admission-r2-binding-7.schema.json)',
    'The generated [schema](protection-admission-r2-binding-2.schema.json)',
  ],
  ['protected source schema id', 'specs/protected-source-r2.md', ':binding:r2:7', ':binding:r2:4'],
  ['issuer schema id', 'specs/external-grant-issuer.md', ':binding:r2:7', ':binding:r2:4'],
  ['issuer current pair', 'specs/external-grant-issuer.md', '0.36.0-rc.r2.7', '0.36.0-rc.r2.2'],
  ['adoption current pair', 'specs/protection-adoption.md', '0.36.0-rc.r2.7', '0.35.0-rc.source.1'],
  [
    'crypto ordinary admission boundary',
    'specs/kdna-crypto-profiles.md',
    'Current R2 ordinary root/browser',
    'Current grammar.3 public Core',
  ],
  ['Read middle current pair', 'specs/read-contract.md', '0.36.0-rc.r2.7', '0.36.0-rc.r2.3'],
  ['Read middle binding', 'specs/read-contract.md', 'binding:r2:7', 'binding:r2:3'],
  [
    'policy current tuple',
    'specs/public-version-policy.md',
    '| read | `kdna.read/0.6.4` |',
    '| read | `kdna.read/0.6.1` |',
  ],
  ['policy current binding', 'specs/public-version-policy.md', ':binding:r2:7', ':binding:r2:4'],
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
test('historical policy and actual downstream old dependency rows are retained without becoming current selectors', () => {
  const guide = fs.readFileSync(path.join(root, 'docs/core-read-current-status.md'), 'utf8');
  assert.ok(
    guide.includes(
      'Studio CLI `0.17.0-rc.material-edit.1` / Studio Core `4.5.0-rc.material-edit.1` / Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`',
    ),
  );
  assert.ok(
    guide.includes(
      'MCP `0.8.1-rc.combination.1` / CLI `0.39.1-rc.combination.1` / Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`',
    ),
  );
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
    'local package line is Core `0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`',
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
      s.target_lines = s.target_lines.filter((row) => row.line !== 'r2.rc7');
    },
    'current-target:unique',
  ],
  [
    'duplicate current target',
    ({ source: s }) => {
      s.target_lines.push(structuredClone(s.target_lines.find((row) => row.line === 'r2.rc7')));
    },
    'current-target:unique',
  ],
  [
    'wrong current tuple',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'r2.rc7').versionTuple.read = 'kdna.read/0.6.0';
    },
    'current-target:tuple',
  ],
  [
    'wrong Core package',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'r2.rc7').package_versions[0].core =
        '0.36.0-rc.r2.2';
    },
    'current-target:packages',
  ],
  [
    'wrong Read package',
    ({ source: s }) => {
      s.target_lines.find((row) => row.line === 'r2.rc7').package_versions[0].read =
        '0.11.0-rc.r2.2';
    },
    'current-target:packages',
  ],
  [
    'duplicate package pair',
    ({ source: s }) => {
      const row = s.target_lines.find((row) => row.line === 'r2.rc7');
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
      s.target_lines.find((row) => row.line === 'r2.rc7').status =
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
