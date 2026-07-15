const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const SPECS = path.join(ROOT, 'specs');
const PACKAGED_SCHEMAS = path.join(__dirname, '..', 'schema');
const RUNTIME_CONTRACT_FIXTURES = path.join(ROOT, 'conformance', 'runtime-contract-v1');
const schemaFiles = [
  'digest-evidence.schema.json',
  'runtime-capsule-2.schema.json',
  'consumption-plan-1.schema.json',
  'agent-host-capabilities-1.schema.json',
  'agent-host-2-request.schema.json',
  'agent-host-2-receipt.schema.json',
  'judgment-trace-1.schema.json',
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

test('ConsumptionPlan 1.0, Host 2, and JudgmentTrace 1.0 conformance vectors pass', () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT, 'conformance', 'runtime-contract-v1', 'run.mjs')],
    { cwd: ROOT, encoding: 'utf8' },
  );

  assert.match(output, /Runtime contract v1 valid/);
});

test('runtime-contract fixtures reproduce from the authoritative Capsule bytes', () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT, 'scripts', 'generate-runtime-contract-fixtures.mjs')],
    { cwd: ROOT, encoding: 'utf8' },
  );

  assert.match(output, /fixtures match authoritative Capsule bytes/);
});

test('published runtime-contract schemas are byte-for-byte canonical copies', () => {
  for (const file of schemaFiles) {
    assert.equal(
      fs.readFileSync(path.join(PACKAGED_SCHEMAS, file), 'utf8'),
      fs.readFileSync(path.join(SPECS, file), 'utf8'),
      file,
    );
  }
});

test('published runtime-contract schemas resolve and validate without network or repo refs', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false, loadSchema: undefined });
  addFormats(ajv);
  const packaged = new Map();
  for (const file of schemaFiles) {
    const schema = readJson(path.join(PACKAGED_SCHEMAS, file));
    packaged.set(file, schema);
    ajv.addSchema(schema);
  }

  const golden = readJson(path.join(RUNTIME_CONTRACT_FIXTURES, 'golden.json'));
  const documents = [
    ['consumption-plan-1.schema.json', golden.plan],
    ['agent-host-capabilities-1.schema.json', golden.capabilities],
    ['agent-host-2-request.schema.json', golden.request],
    ['agent-host-2-receipt.schema.json', golden.receipt],
    ['judgment-trace-1.schema.json', golden.trace],
  ];
  for (const [file, value] of documents) {
    const validate = ajv.getSchema(packaged.get(file).$id);
    assert.equal(validate(value), true, `${file}: ${JSON.stringify(validate.errors)}`);
  }
});
