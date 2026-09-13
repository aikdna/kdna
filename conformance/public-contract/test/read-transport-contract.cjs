'use strict';
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const { createRequire } = require('node:module'),
  { pathToFileURL } = require('node:url');
async function main() {
  const [runtime, matrixPath, out] = process.argv.slice(2);
  for (const p of [runtime, matrixPath, out]) assert.ok(path.isAbsolute(p));
  const req = createRequire(path.join(runtime, 'package.json')),
    pkg = req('@aikdna/kdna-read/package.json'),
    readDir = path.dirname(req.resolve('@aikdna/kdna-read/package.json'));
  const schema = JSON.parse(
      fs.readFileSync(path.join(readDir, 'schema/read-transport-admission-0.1.schema.json')),
    ),
    Ajv = req('ajv/dist/2020.js'),
    ajv = new Ajv({
      strict: true,
      strictTypes: false,
      strictRequired: false,
      allErrors: true,
      validateFormats: false,
    });
  const validate = ajv.compile(schema);
  const matrix = JSON.parse(fs.readFileSync(matrixPath));
  let count = 0,
    sample,
    rejected;
  const errors = [];
  function visit(v) {
    if (!v || typeof v !== 'object') return;
    if (v.contract === 'kdna.read-transport-admission/0.1.0') {
      count++;
      if (!validate(v))
        errors.push({ contract: v.contract, errors: JSON.parse(JSON.stringify(validate.errors)) });
      if (v.status === 'accepted') sample = v;
      else rejected = v;
    }
    for (const child of Object.values(v)) visit(child);
  }
  visit(matrix.node);
  for (const browser of matrix.browsers) visit(browser.rows);
  assert.equal(errors.length, 0);
  assert.equal(matrix.status, 'MATCH');
  assert.equal(matrix.browsers.length, 2);
  assert.ok(count > 0 && sample && rejected);
  const probes = [];
  function reject(id, mutate, base = sample) {
    const value = JSON.parse(JSON.stringify(base));
    mutate(value);
    const valid = validate(value);
    probes.push({ id, matched: !valid, errors: validate.errors });
    assert.equal(valid, false, id);
  }
  reject('local-origin-forgery', (v) => {
    v.origin = 'local';
  });
  reject('capability-forgery', (v) => {
    v.capabilities.authorization = true;
  });
  reject('snapshot-capability-forgery', (v) => {
    v.capabilities.core_snapshot = true;
  });
  reject('host-capability-forgery', (v) => {
    v.capabilities.host_witness = true;
  });
  reject('proof-overclaim', (v) => {
    v.proof_limits.remote_identity = 'PROVEN';
  });
  reject('raw-framing-overclaim', (v) => {
    v.proof_limits.raw_http_framing = 'PROVEN';
  });
  reject('accepted-null-response', (v) => {
    v.response = null;
  });
  reject('accepted-null-association', (v) => {
    v.association = null;
  });
  reject('unknown-result-field', (v) => {
    v.authorized = true;
  });
  reject(
    'unknown-rejection-code',
    (v) => {
      v.rejection.code = 'INVENTED';
    },
    rejected,
  );
  assert.equal(pkg.version, '0.2.0');
  assert.equal(pkg.dependencies.ajv, '8.20.0');
  const cjs = req('@aikdna/kdna-read/transport'),
    esm = await import(pathToFileURL(path.join(readDir, pkg.exports['./transport'].import)));
  assert.deepEqual(Object.keys(cjs), ['admitReadTransportResponse']);
  assert.deepEqual(Object.keys(esm), ['admitReadTransportResponse']);
  assert.equal(cjs.admitReadTransportResponse, esm.admitReadTransportResponse);
  const unsafe = ['@aikdna/kdna-read/src/transport.js', '@aikdna/kdna-read/src/brands.js'];
  for (const spec of unsafe)
    assert.throws(() => req(spec), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' });
  const result = {
    status: 'MATCH',
    matrix: matrixPath,
    validated_result_count: count,
    closed_result_probes: probes,
    transport_surface: {
      package_version: pkg.version,
      require_and_import: ['admitReadTransportResponse'],
      same_function: true,
      private_exports_blocked: unsafe,
    },
    validator_version: req('ajv/package.json').version,
  };
  fs.writeFileSync(out, JSON.stringify(result, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: result.status,
      validated_result_count: count,
      closed_result_probes: probes.length,
      output: out,
    }),
  );
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
