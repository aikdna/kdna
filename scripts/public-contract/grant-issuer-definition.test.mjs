import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url),
  Ajv = require('ajv/dist/2020.js');
const source = JSON.parse(
    fs.readFileSync(new URL('../../specs/public-semantic-source.json', import.meta.url)),
  ),
  p = source.external_grant_issuer;
test('issuer definitions keep exact result arms and two callables', () => {
  assert.deepEqual(p.runtime_exports, [
    'getExternalGrantIssuerContract',
    'issueExternalKeyGrantForAsset',
  ]);
  assert.equal(p.id, 'kdna.external-grant-issuer/1');
  assert.equal(p.version, '1.0.0');
  assert.equal(p.types.IssuerFailedObservation.oneOf.length, 6);
  assert.deepEqual(
    p.types.IssuerAdmissionObservation.oneOf.map((x) => [
      x.properties.status.const,
      x.properties.interpretation.const,
    ]),
    [
      ['accepted', 'complete'],
      ['catalog_only', 'blocked'],
    ],
  );
  assert.equal(p.types.IssuerIssuedObservation.additionalProperties, false);
  assert.equal(p.schema_path, 'specs/external-grant-issuer-r2-binding-8.schema.json');
  assert.equal(p.schema_id, 'urn:kdna:schema:external-grant-issuer:1.0.0:binding:r2:8');
  const schema = JSON.parse(fs.readFileSync(new URL('../../' + p.schema_path, import.meta.url))),
    valid = new Ajv({ strict: false, validateFormats: false }).compile(schema);
  for (const arm of p.types.IssuerFailedObservation.oneOf) {
    const value = {
      status: 'issuer_failed',
      code: arm.properties.code.const,
      stage: arm.properties.stage.enum[0],
    };
    assert.equal(valid(value), true);
    for (const key of ['plaintext', 'IR', 'grantBytes', 'catalog', 'A'])
      assert.equal(valid({ ...value, [key]: 'leak' }), false);
  }
  assert.equal(
    valid({
      status: 'core_rejected',
      stage: 'asset',
      core: { status: 'rejected', reason: 'READ_CORE_INVALID' },
    }),
    true,
  );
  assert.equal(
    valid({
      status: 'core_rejected',
      stage: 'asset',
      core: { status: 'rejected', reason: 'READ_CORE_INVALID', diagnostics: [] },
    }),
    false,
  );
  assert.ok(!source.diagnostic_registry.some((x) => x.startsWith('ISSUER_')));
});
test('issuer registration rejects cross-scope duplicates coverage gaps and false runtime claims', async () => {
  const { spawnSync } = await import('node:child_process'),
    crypto = await import('node:crypto'),
    os = await import('node:os'),
    path = await import('node:path');
  const root = new URL('../../', import.meta.url).pathname,
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'issuer-scope-'));
  const recipeBytes = fs.readFileSync(
    path.join(root, 'scripts/public-contract/native-output-recipe.json'),
  );
  // The entry composes the native builder for the cumulative source. The unmodified
  // source runs against the committed recipe; each mutated source is paired with a
  // recipe copy whose identity pin matches it, exactly as the navigation tests do
  // through KDNA_NATIVE_RECIPE. The copy lives only in this test's temp dir and
  // stores no absolute path; a mutation must fail on its own rule before any
  // generated output could be compared.
  const runGenerator = (sourceFile, pairRecipe) => {
    let env = process.env;
    if (pairRecipe) {
      const recipe = JSON.parse(recipeBytes);
      recipe.input_sha256 = crypto
        .createHash('sha256')
        .update(fs.readFileSync(sourceFile))
        .digest('hex');
      const recipeFile = path.join(dir, 'recipe.json');
      fs.writeFileSync(recipeFile, JSON.stringify(recipe));
      env = { ...process.env, KDNA_NATIVE_RECIPE: recipeFile };
    }
    return spawnSync(
      process.execPath,
      [
        'scripts/public-contract/generate.mjs',
        '--source',
        sourceFile,
        '--root',
        root,
        '--out-dir',
        root,
        '--dependency-root',
        root,
        '--check',
      ],
      { cwd: root, encoding: 'utf8', env },
    );
  };
  try {
    const clean = runGenerator(path.join(root, 'specs/public-semantic-source.json'), false);
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    assert.equal(
      JSON.parse(clean.stdout).status,
      'CHECK_MATCH',
      'The unchanged current source passes before negative mutations',
    );
    const changes = [
      [
        'scope collision',
        (s) => (s.external_grant_issuer.non_schema_rules[0].id = s.non_schema_rules[0].id),
        /^duplicate non-schema rule across contract scopes:/,
      ],
      [
        'coverage gap',
        (s) => delete s.external_grant_issuer.rule_coverage['ISSUER-RESULT'],
        /^rule_coverage must cover exactly/,
      ],
      [
        'false runtime claim',
        (s) =>
          (s.external_grant_issuer.runtime_enforcement_claims['ISSUER-GRANT'].runtime_enforcement =
            'none'),
        /^runtime_enforcement_claims disagree/,
      ],
      [
        'inconsistent unimplemented claim',
        (s) => s.external_grant_issuer.runtime_not_implemented.push('ISSUER-GRANT'),
        /^rule_coverage runtime_units must be empty for a runtime_not_implemented rule: ISSUER-GRANT$/,
      ],
      [
        'type collision',
        (s) => (s.external_grant_issuer.types.Manifest = s.types.Manifest),
        /^issuer type collision$/,
      ],
      [
        'undeclared export',
        (s) => s.external_grant_issuer.runtime_exports.push('unsafeSign'),
        /^issuer surface drift$/,
      ],
    ];
    let index = 0;
    for (const [name, change, reason] of changes) {
      const bad = structuredClone(source);
      change(bad);
      const file = path.join(dir, String(index++) + '.json');
      fs.writeFileSync(file, JSON.stringify(bad));
      const result = runGenerator(file, true);
      assert.equal(result.status, 1, name + ': ' + result.stdout + result.stderr);
      const failure = JSON.parse(result.stderr);
      assert.equal(failure.code, 'SOURCE', name);
      assert.ok(
        reason.test(failure.message),
        name + ' must reach its own rule, not pin/navigation or unrelated validation',
      );
    }
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
});

// IssuerAdmissionObservation retains a catalog-only observation shape for history.
// Schema representability cannot claim that the current Core can issue that state.
test('current Core refuses unknown critical content before an issuer catalog-only result can exist', () => {
  const F = require('../../conformance/public-contract/test/bytes-fixtures.cjs');
  const core = require('@aikdna/kdna-core');
  const asset = F.blank(source.versionTuple);
  assert.equal(core.admitBytes(F.encode(asset, require)).status, 'accepted');
  asset.payload.extensions = [
    {
      id: 'urn:definition-test:unknown',
      critical: true,
      definition: 'Future meaning is intentionally not implemented.',
      value: { kind: 'text', value: 'opaque' },
    },
  ];
  const rejected = core.admitBytes(F.encode(asset, require));
  assert.equal(rejected.status, 'rejected');
  assert.equal(rejected.reason, 'READ_UNSUPPORTED_CRITICAL');
  assert.deepEqual(rejected.states, { core: 'valid', interpretation: 'blocked' });
  assert.ok(rejected.diagnostics.some((x) => x.code === 'READ_UNSUPPORTED_CRITICAL'));
  for (const key of ['snapshot', 'catalog', 'operation', 'grantBytes', 'IR'])
    assert.equal(Object.hasOwn(rejected, key), false, key + ' must not leak authority or content');
});
