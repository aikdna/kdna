'use strict';
// R11 regression tests: compatibility.min_loader_version must be a strict x.y.z
// coordinate at every structural surface (semantic source, generated container
// schema, generated validator) and must agree with the standalone manifest
// schema and the runtime loader gate. Wide VersionLabel values that the old
// spec surface accepted are structural failures; a value a consumer cannot
// parse as x.y.z leaves loader compatibility unestablished (fail-closed).
const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path'),
  { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../../..');
const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(repoRoot, file), 'utf8'));
const spec = readJson('specs/public-semantic-source.json');
const standaloneSchema = readJson(
  'packages/kdna-core/schema/manifest.schema.json',
);
const generatedSchema = readJson(
  'packages/kdna-core/schema/manifest-container-0.5.0-judgment-0.5.1.schema.json',
);
const { Manifest } = require('../src/public-contract/validators.generated.js');

const strictDef = spec.types.StrictLoaderVersion;
const standalonePattern =
  standaloneSchema.properties.compatibility.properties.min_loader_version
    .pattern;

function manifestWith(minLoaderVersion) {
  return {
    format_version: '0.5.0',
    asset_id: 'example-asset',
    asset_uid: 'example-asset',
    asset_type: 'domain',
    title: 'Loader version gate fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    compatibility: {
      min_loader_version: minLoaderVersion,
      profile: 'kdna.payload.judgment',
      profile_version: '0.5.1',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    runtime: { mandatory_entries: [] },
    summary: 'Structural fixture for the loader version gate.',
    languages: ['en'],
    history: { coverage: 'complete', statement: 'fixture', entries: [] },
  };
}

function manifestErrorPaths(manifest) {
  const valid = Manifest(manifest);
  assert.notEqual(valid, true, 'expected schema failure');
  return (Manifest.errors || [])
    .map((error) => error.instancePath)
    .join('\n');
}

test('semantic source pins min_loader_version to StrictLoaderVersion', () => {
  assert.equal(
    spec.types.Compatibility.properties.min_loader_version.$ref,
    '#/$defs/StrictLoaderVersion',
  );
  assert.ok(strictDef);
  assert.equal(strictDef.type, 'string');
  // The spec def and the standalone manifest schema enforce the same pattern,
  // so no surface can accept what another rejects.
  assert.equal(strictDef.pattern, standalonePattern);
});

test('generated container schema uses the strict def', () => {
  assert.ok(generatedSchema.$defs.StrictLoaderVersion);
  assert.equal(
    generatedSchema.$defs.Compatibility.properties.min_loader_version.$ref,
    '#/$defs/StrictLoaderVersion',
  );
  assert.equal(
    generatedSchema.$defs.StrictLoaderVersion.pattern,
    standalonePattern,
  );
});

test('strict x.y.z requirement passes the generated validator', () => {
  assert.equal(Manifest(manifestWith('0.24.0')), true);
});

test('wide version labels fail the generated validator', () => {
  for (const value of [
    '0.24.0-rc.1',
    '0.24.0+build.5',
    'v0.24.0',
    '1.2',
    'not-a-version!',
  ]) {
    const paths = manifestErrorPaths(manifestWith(value));
    assert.match(
      paths,
      /\/compatibility\/min_loader_version/,
      `expected ${value} to be rejected at min_loader_version`,
    );
  }
});

// The base ownership gate must reject a recipe whose declared base_type_order
// omits a type the derivable base closure still needs. The generator fails
// before writing anything, so each probe is a fast exit-1 spawn.
test('base ownership gate rejects an undeclared closure member', () => {
  const recipe = readJson('scripts/public-contract/native-output-recipe.json');
  for (const omitted of ['StrictLoaderVersion', 'Timestamp']) {
    const base = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-base-ownership-')));
    const mutated = {
      ...recipe,
      base_type_order: recipe.base_type_order.filter((name) => name !== omitted),
    };
    const recipeFile = path.join(base, 'recipe.json');
    fs.writeFileSync(recipeFile, JSON.stringify(mutated, null, 2) + '\n');
    const outDir = path.join(base, 'out');
    fs.mkdirSync(outDir);
    try {
      const result = spawnSync(
        process.execPath,
        [
          path.join(repoRoot, 'scripts/public-contract/generate.mjs'),
          '--check',
          '--source',
          path.join(repoRoot, 'specs/public-semantic-source.json'),
          '--root',
          repoRoot,
          '--dependency-root',
          repoRoot,
          '--out-dir',
          outDir,
        ],
        {
          cwd: repoRoot,
          encoding: 'utf8',
          env: { ...process.env, KDNA_NATIVE_RECIPE: recipeFile },
        },
      );
      assert.notEqual(result.status, 0, `omitting ${omitted} must fail`);
      const output = (result.stdout || '') + (result.stderr || '');
      assert.match(output, /BASE_OWNERSHIP/, `omitting ${omitted} should fail the ownership gate`);
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  }
});
