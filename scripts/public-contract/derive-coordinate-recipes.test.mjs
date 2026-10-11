import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  deriveCoordinates,
  FROZEN_DOCUMENTS,
  FROZEN_INPUT,
  readFrozenInputs,
  runDerivation,
} from './derive-coordinate-recipes.mjs';
import { digest, pointer, project, sha } from './native-renderer.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const inputs = readFrozenInputs(root);
const options = { ...inputs, core: '0.37.2', read: '0.11.3' };
const candidate = deriveCoordinates(options);

test('coordinate derivation verifies every frozen guard and is byte reproducible', () => {
  const repeated = deriveCoordinates(options);
  assert.deepEqual(repeated, candidate);
  assert.deepEqual(candidate.report.counts, {
    registered: 5,
    modules: 10,
    module_operations: 87,
    base_operations: 25,
  });
  assert.equal(candidate.report.guards.length, 1 + 5 + 20 + 87 + 25);
  assert.deepEqual(
    candidate.report.coordinates.map((row) => row.occurrences),
    [6, 7],
  );
  assert.equal(candidate.report.source_changes.length, 21);
  assert.equal(candidate.report.documents.length, 4);
  assert.equal(candidate.report.document_bindings.length, 8);
  const source = JSON.parse(candidate.sourceBytes),
    recipe = JSON.parse(candidate.recipeBytes);
  assert.equal(recipe.input_sha256, sha(candidate.sourceBytes));
  const oldSource = JSON.parse(inputs.sourceBytes);
  assert.deepEqual(source.protection_admission_legacy, oldSource.protection_admission_legacy);
  assert.deepEqual(
    candidate.report.source_changes
      .filter((row) => row.classification === 'generated_metadata')
      .map((row) => row.pointer)
      .sort(),
    candidate.report.document_bindings.map((row) => row.pointer).sort(),
  );
  const protectionDocument = candidate.documents.find(
    (row) => row.path === 'specs/protection-admission.md',
  );
  assert.equal(source.protection_admission.specification.sha256, sha(protectionDocument.bytes));
  assert.equal(source.protection_admission.specification.bytes, protectionDocument.bytes.length);
  const policy = candidate.documents
    .find((row) => row.path === 'specs/public-version-policy.md')
    .bytes.toString('utf8');
  assert.ok(
    policy.includes('publication is established only by matching release and registry evidence.'),
  );
  assert.ok(!policy.includes('The browser candidate above is unpublished'));
  assert.equal(source.status, oldSource.status);
  for (const [index, row] of source.accepted_designs.entries()) {
    const document = candidate.documents.find((entry) => entry.path === row.path);
    if (document) {
      assert.equal(row.bytes, document.bytes.length);
      assert.equal(row.sha256, sha(document.bytes));
      assert.ok([2, 4, 5].includes(index));
    } else assert.deepEqual(row, oldSource.accepted_designs[index]);
  }
  for (const row of recipe.registered_preimages)
    assert.equal(row.digest, digest(pointer(source, row.pointer)));
  for (const row of recipe.module_projections) {
    const value = pointer(source, row.pointer);
    assert.equal(row.input_digest, digest(value));
    assert.equal(row.output_digest, digest(project(value, row.operations)));
  }
  for (const row of candidate.report.guards.filter((row) => row.kind === 'operation_preimage')) {
    assert.equal(row.before, digest(row.provenance.old_value));
    assert.equal(row.provenance.commit.length, 40);
    assert.ok(row.provenance.source_pointer.startsWith('/'));
  }
});

test('decisions change exactly four package fields and two source observation dates', () => {
  const name = 'specs/public-contract-decisions.json';
  const before = JSON.parse(inputs.documentBytes[name]);
  const document = candidate.documents.find((row) => row.path === name);
  const after = JSON.parse(document.bytes);
  const expected = structuredClone(before);
  for (const [index, version] of ['0.37.2', '0.11.3'].entries()) {
    const row = expected.version_policy.planned_packages[index];
    row.candidate_version = version;
    row.current_source_version = version;
    row.current_source_version_observed = '2026-10-11';
  }
  assert.deepEqual(after, expected);
  const report = candidate.report.documents.find((row) => row.path === name);
  assert.equal(report.transformations.length, 6);
  assert.equal(report.transformations.filter((row) => row.kind === 'version_coordinate').length, 4);
  assert.equal(
    report.transformations.filter((row) => row.kind === 'source_observation_date').length,
    2,
  );
  for (const row of report.transformations) {
    assert.equal(pointer(before, row.pointer), row.before);
    assert.equal(pointer(after, row.pointer), row.after);
  }
  assert.deepEqual(after.decisions, before.decisions);
  for (const [index, row] of after.version_policy.planned_packages.entries()) {
    for (const key of Object.keys(row).filter(
      (key) =>
        ![
          'candidate_version',
          'current_source_version',
          'current_source_version_observed',
        ].includes(key),
    ))
      assert.deepEqual(row[key], before.version_policy.planned_packages[index][key]);
  }
});

test('document reconciliation refuses changed, missing or extra frozen document inputs', () => {
  for (const document of FROZEN_DOCUMENTS) {
    assert.throws(
      () =>
        deriveCoordinates({
          ...options,
          documentBytes: {
            ...inputs.documentBytes,
            [document.path]: Buffer.concat([
              inputs.documentBytes[document.path],
              Buffer.from('\n'),
            ]),
          },
        }),
      { code: 'FROZEN_DOCUMENT_IDENTITY' },
    );
    const missing = { ...inputs.documentBytes };
    delete missing[document.path];
    assert.throws(() => deriveCoordinates({ ...options, documentBytes: missing }), {
      code: 'FROZEN_DOCUMENT_IDENTITY',
    });
  }
  assert.throws(
    () =>
      deriveCoordinates({
        ...options,
        documentBytes: {
          ...inputs.documentBytes,
          'specs/unreviewed.md': Buffer.from('not an input'),
        },
      }),
    { code: 'FROZEN_DOCUMENT_IDENTITY' },
  );
});

test('derivation rejects unreviewed source/recipe bytes and non-stable target coordinates', () => {
  assert.throws(
    () =>
      deriveCoordinates({
        ...options,
        sourceBytes: Buffer.concat([inputs.sourceBytes, Buffer.from('\n')]),
      }),
    { code: 'FROZEN_SOURCE_IDENTITY' },
  );
  assert.throws(
    () =>
      deriveCoordinates({
        ...options,
        recipeBytes: Buffer.concat([inputs.recipeBytes, Buffer.from('\n')]),
      }),
    { code: 'FROZEN_RECIPE_IDENTITY' },
  );
  for (const core of ['0.37.2-rc.1', 'latest', '01.2.3', '1.2.9007199254740992', '../1.2.3'])
    assert.throws(() => deriveCoordinates({ ...options, core }), { code: 'COORDINATE' });
});

test('derivation CLI refuses maintained paths, aliases into the repository and existing output', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-coordinate-paths-'));
  const argv = (output) => [
    '--root',
    root,
    '--core-version',
    '0.37.2',
    '--read-version',
    '0.11.3',
    '--out-dir',
    output,
  ];
  try {
    fs.symlinkSync(root, path.join(base, 'alias'));
    for (const output of [
      root,
      path.join(root, 'coordinate-forbidden'),
      path.join(base, 'alias/coordinate-forbidden'),
      base,
    ])
      assert.throws(() => runDerivation(argv(output)), { code: 'OUTPUT_PATH' });
    const output = path.join(base, 'safe');
    assert.equal(runDerivation(argv(output)).status, 'DERIVED');
    assert.deepEqual(fs.readdirSync(output).sort(), [
      'native-output-recipe.json',
      'public-semantic-source.json',
      'report.json',
      'report.md',
      'specs',
    ]);
    assert.deepEqual(
      fs.readFileSync(path.join(output, 'public-semantic-source.json')),
      candidate.sourceBytes,
    );
    for (const document of candidate.documents)
      assert.deepEqual(fs.readFileSync(path.join(output, document.path)), document.bytes);
    const script = path.join(root, 'scripts/public-contract/derive-coordinate-recipes.mjs');
    fs.symlinkSync(script, path.join(base, 'derive.mjs'));
    const aliasRun = spawnSync(
      process.execPath,
      [path.join(base, 'derive.mjs'), ...argv(path.join(base, 'via-entry-alias'))],
      { encoding: 'utf8' },
    );
    assert.equal(aliasRun.status, 0, aliasRun.stderr);
    assert.equal(JSON.parse(aliasRun.stdout).status, 'DERIVED');
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test('real generator accepts derived coordinates and still rejects all protection tampering', () => {
  const base = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-coordinate-generator-')),
  );
  const source = path.join(base, 'source.json'),
    recipe = path.join(base, 'recipe.json');
  const generationRoot = path.join(base, 'generation-root');
  fs.mkdirSync(generationRoot);
  // Both the preserved historical inputs and the runtime proof-site files come
  // from the frozen Git tree. Unrelated worktree edits cannot supply new pins.
  // The actual generator/renderer still execute from the implementation under test.
  const archive = execFileSync(
    'git',
    ['-C', root, 'archive', '--format=tar', FROZEN_INPUT.commit],
    { maxBuffer: 256 * 1024 * 1024 },
  );
  execFileSync('tar', ['-xf', '-', '-C', generationRoot], { input: archive });
  fs.writeFileSync(source, candidate.sourceBytes);
  const run = (id, mutate, mutateDocuments) => {
    const value = JSON.parse(candidate.recipeBytes);
    mutate?.(value);
    fs.writeFileSync(recipe, JSON.stringify(value, null, 2) + '\n');
    for (const document of candidate.documents)
      fs.writeFileSync(path.join(generationRoot, document.path), document.bytes);
    mutateDocuments?.(generationRoot);
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'scripts/public-contract/generate.mjs'),
        '--source',
        source,
        '--root',
        generationRoot,
        '--dependency-root',
        root,
        '--out-dir',
        path.join(base, id + '-output'),
        '--scratch-dir',
        path.join(base, id + '-scratch'),
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, KDNA_NATIVE_RECIPE: recipe },
        maxBuffer: 4 * 1024 * 1024,
      },
    );
    assert.equal(result.signal, null, result.stderr);
    return result;
  };
  const flip = (value) => value.slice(0, -1) + (value.endsWith('0') ? '1' : '0');
  try {
    const positive = run('positive');
    assert.equal(positive.status, 0, positive.stdout + positive.stderr);
    assert.equal(JSON.parse(positive.stdout).status, 'GENERATED');
    for (const [id, code, mutate] of [
      [
        'registered',
        'REGISTERED_PREIMAGE',
        (r) => {
          r.registered_preimages[0].digest = flip(r.registered_preimages[0].digest);
        },
      ],
      [
        'module',
        'MODULE_PREIMAGE',
        (r) => {
          r.module_projections[0].input_digest = flip(r.module_projections[0].input_digest);
        },
      ],
      [
        'operation',
        'PROJECTION_GUARD',
        (r) => {
          const op = r.module_projections[0].operations[0];
          op.expected_before_sha256 = flip(op.expected_before_sha256);
        },
      ],
      [
        'base-operation',
        'PROJECTION_GUARD',
        (r) => {
          const op = r.base_json_projections[1].operations[0];
          op.expected_before_sha256 = flip(op.expected_before_sha256);
        },
      ],
      [
        'delete-registered',
        'RECIPE_PROTECTION_STRUCTURE',
        (r) => {
          r.registered_preimages.pop();
        },
      ],
      [
        'delete-module',
        'RECIPE_PROTECTION_STRUCTURE',
        (r) => {
          r.module_projections.pop();
        },
      ],
      [
        'delete-operation',
        'RECIPE_PROTECTION_STRUCTURE',
        (r) => {
          r.module_projections[0].operations.pop();
        },
      ],
      [
        'delete-base-operation',
        'RECIPE_PROTECTION_STRUCTURE',
        (r) => {
          r.base_json_projections[1].operations.pop();
        },
      ],
      [
        'delete-owner-and-module',
        'RECIPE_PROTECTION_STRUCTURE',
        (r) => {
          r.owners.pop();
          r.module_projections.pop();
        },
      ],
    ]) {
      const result = run(id, mutate);
      assert.equal(result.status, 1, id + ': ' + result.stdout + result.stderr);
      assert.equal(JSON.parse(result.stderr).code, code, id);
      assert.equal(fs.existsSync(path.join(base, id + '-output')), false, id + ' wrote outputs');
    }
    for (const [index, document] of candidate.documents.entries()) {
      const id = 'changed-derived-document-' + index;
      const result = run(id, undefined, (directory) =>
        fs.appendFileSync(path.join(directory, document.path), '\n'),
      );
      assert.equal(result.status, 1, result.stderr);
      assert.equal(
        JSON.parse(result.stderr).code,
        document.path === 'specs/protection-admission.md'
          ? 'PROTECTION_LEGACY_DRIFT'
          : 'DESIGN_DRIFT',
      );
      assert.equal(fs.existsSync(path.join(base, id + '-output')), false);
    }
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});
