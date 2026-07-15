'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const { checks, runChecks } = require('../../scripts/release-preflight');
const {
  MANIFEST_SCHEMA,
  PACKAGED_MANIFEST_SCHEMA,
  validateProtocolFixtures,
} = require('../../scripts/validate-protocol-fixtures');
const { validateRuntimeContract } = require('../../scripts/validate-runtime-contract');

const repoRoot = path.resolve(__dirname, '..', '..');
const quietLogger = { error() {}, log() {} };

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-validator-'));
  t.after(() => fs.rmSync(directory, { force: true, recursive: true }));
  return directory;
}

function copyRuntimeExamples(t) {
  const directory = temporaryDirectory(t);
  const examples = path.join(directory, 'app-runtime-contract');
  fs.cpSync(path.join(repoRoot, 'examples', 'app-runtime-contract'), examples, {
    recursive: true,
  });
  return examples;
}

function copyProtocolFixtures(t) {
  const root = temporaryDirectory(t);
  for (const relativePath of [MANIFEST_SCHEMA, PACKAGED_MANIFEST_SCHEMA, 'registry/domains.json']) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, relativePath), target);
  }
  return root;
}

test('runtime contract validator accepts all three current trace/report/feedback triples', () => {
  assert.deepEqual(validateRuntimeContract({ logger: quietLogger }), []);
});

test('runtime contract validator rejects a legacy trace shape', (t) => {
  const exampleDir = copyRuntimeExamples(t);
  const tracePath = path.join(exampleDir, 'generic-authoring-trace.json');
  fs.writeFileSync(
    tracePath,
    JSON.stringify({
      trace_version: '1.0',
      trace_id: 'legacy-authoring-trace',
      timestamp: '2026-07-15T00:00:00Z',
      loaded_package: { domain: '@aikdna/example', version: '1.0.0' },
      generated_judgment: { classification: 'safe' },
      route_result: {
        status: 'LOAD_STRONG_FIT',
        action: 'load',
        selected_domain: '@aikdna/example',
      },
    }),
  );

  const failures = validateRuntimeContract({ exampleDir, logger: quietLogger });
  assert.ok(failures.some((failure) => failure.includes("must have required property 'type'")));
  assert.ok(failures.some((failure) => failure.includes('must NOT have additional properties')));
});

test('runtime contract validator rejects a schema-valid but cross-linked wrong route', (t) => {
  const exampleDir = copyRuntimeExamples(t);
  const reportPath = path.join(exampleDir, 'generic-client-report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  report.route_decision.selected_domain = 'kdna:example:different-asset';
  fs.writeFileSync(reportPath, JSON.stringify(report));

  const failures = validateRuntimeContract({ exampleDir, logger: quietLogger });
  assert.ok(
    failures.some((failure) =>
      failure.includes('selected_domain kdna:example:different-asset does not match trace asset'),
    ),
  );
});

test('protocol fixture validator accepts authoritative Runtime manifest parity', () => {
  assert.deepEqual(validateProtocolFixtures({ logger: quietLogger }), []);
});

test('protocol fixture validator rejects the removed kdna_version contract', (t) => {
  const root = copyProtocolFixtures(t);
  const schemaPath = path.join(root, MANIFEST_SCHEMA);
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  schema.required = schema.required.filter((field) => field !== 'format_version');
  schema.required.push('kdna_version');
  schema.properties.kdna_version = { const: '1.0' };
  delete schema.properties.format_version;
  const staleSchema = `${JSON.stringify(schema, null, 2)}\n`;
  fs.writeFileSync(schemaPath, staleSchema);
  fs.writeFileSync(path.join(root, PACKAGED_MANIFEST_SCHEMA), staleSchema);

  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes('kdna_version must not be part')));
  assert.ok(errors.some((error) => error.includes('format_version const must be 0.1.0')));
  assert.ok(errors.some((error) => error.includes('format_version must be required')));
});

test('protocol fixture validator rejects packaged manifest schema drift', (t) => {
  const root = copyProtocolFixtures(t);
  const packagedPath = path.join(root, PACKAGED_MANIFEST_SCHEMA);
  fs.appendFileSync(packagedPath, '\n');

  const errors = validateProtocolFixtures({ root, logger: quietLogger });
  assert.ok(errors.some((error) => error.includes('must be byte-for-byte identical')));
});

test('release preflight retains both current protocol validators', () => {
  const validationChecks = checks.filter(
    ([command, args]) => command === 'npm' && args[0] === 'run' && args[1].startsWith('validate:'),
  );
  assert.deepEqual(validationChecks, [
    ['npm', ['run', 'validate:protocol-fixtures']],
    ['npm', ['run', 'validate:runtime-contract']],
  ]);

  const calls = [];
  runChecks(validationChecks, {
    execute(command, args, options) {
      calls.push({ command, args, options });
    },
    logger: quietLogger,
  });
  assert.deepEqual(
    calls.map(({ command, args }) => [command, args]),
    validationChecks,
  );
  assert.ok(calls.every(({ options }) => options.stdio === 'inherit'));
});
