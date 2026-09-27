// Generator-side consistency for the PackageSet node module.
//
// The module descriptor is derived, not asserted: this test recomputes every
// identity it publishes from the generated artifacts themselves, so a hand-edit
// of a generated file cannot survive, and a single-source change that forgets an
// output is caught before an install.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCE = JSON.parse(fs.readFileSync(path.join(ROOT, 'specs/public-semantic-source.json'), 'utf8'));
const CORE_CONTRACT = path.join(ROOT, 'packages/kdna-core/src/public-contract/package-set-contract.generated.json');
const READ_CONTRACT = path.join(ROOT, 'packages/kdna-read/src/package-set-contract.generated.json');
const SCHEMA = path.join(ROOT, SOURCE.package_set_node.schema_path);
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ordered = value =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
      : value;

test('the module descriptor is consistent across both packages and binds its own definition', () => {
  const core = JSON.parse(fs.readFileSync(CORE_CONTRACT, 'utf8'));
  const read = JSON.parse(fs.readFileSync(READ_CONTRACT, 'utf8'));
  assert.deepEqual(core.descriptor, read.descriptor);
  const { definition_digest: recorded, ...definition } = core.descriptor;
  assert.equal('sha256:' + sha(JSON.stringify(ordered(definition))), recorded);
  assert.equal(read.core_contract_digest, 'sha256:' + sha(fs.readFileSync(CORE_CONTRACT)));
  assert.equal(core.descriptor.contract, SOURCE.package_set_node.contract);
  assert.equal(core.descriptor.module_version, SOURCE.package_set_node.module_version);
  assert.equal(core.descriptor.core_version, SOURCE.engineering.package_versions.core);
  assert.equal(core.descriptor.read_version, SOURCE.engineering.package_versions.read);
  assert.deepEqual(core.descriptor.core_callables, SOURCE.engineering.core_surface['package-set-node']);
  assert.deepEqual(core.descriptor.read_callables, SOURCE.engineering.read_surface['package-set-node']);
  assert.deepEqual(core.descriptor.local_failures, SOURCE.package_set_node.local_failures);
  assert.equal('SET_MEMBER_UNAUTHORIZED' === core.descriptor.local_failures[0], false, 'a wire code is never a local code');
});

test('the generated schema closes every exported record and no local code reaches the wire', () => {
  const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));
  const declared = SOURCE.package_set_node;
  assert.equal(declared.schema_path, 'specs/package-set-node-0.2.1.schema.json');
  assert.equal(schema.$id, 'urn:kdna:schema:package-set-node:0.2.1');
  assert.equal(schema.$id, declared.schema_id);
  assert.equal(schema.$ref, '#/$defs/' + declared.root);
  for (const name of declared.exports) assert.equal(Object.hasOwn(schema.$defs, name), true, name);
  for (const [name, node] of Object.entries(declared.types)) {
    if (node.type === 'object') {
      assert.equal(schema.$defs[name].additionalProperties, false, name);
      assert.deepEqual([...schema.$defs[name].required].sort(), [...node.required].sort(), name);
    }
  }
  const diagnostics = JSON.parse(fs.readFileSync(path.join(ROOT, 'specs/public-diagnostics.json'), 'utf8'));
  const wire = new Set(diagnostics.entries.map(entry => entry.code));
  for (const code of declared.local_failures) assert.equal(wire.has(code), false, code);
});

test('every module record the runtime captures has a generated closed key set', () => {
  const core = JSON.parse(fs.readFileSync(CORE_CONTRACT, 'utf8'));
  const read = JSON.parse(fs.readFileSync(READ_CONTRACT, 'utf8'));
  assert.deepEqual(core.key_sets, read.key_sets);
  const required = [
    'HostReadContextData',
    'PackageMember',
    'PackageSet',
    'PackageSetAdmissionInput',
    'PackageSetHandoff',
    'PackageSetLimits',
    'PackageSetMemberObservation',
    'PackageSetMemberObservationRequest',
    'PackageSetMemberObservationRow',
    'PackageSetMemberProviderConfig',
    'PackageSetMemberSource',
    'PackageSetNodeDescriptor',
    'PackageSetReadHostObservation',
    'PackageSetReadInput',
    'PackageSetReadProviderConfig',
    'Selection',
    'VersionTuple',
  ];
  for (const name of required) assert.equal(Object.hasOwn(core.key_sets, name), true, name);
  for (const [name, entry] of Object.entries(core.key_sets)) {
    assert.deepEqual(entry.keys, [...entry.keys].sort(), name + ' keys are sorted');
    assert.equal(new Set(entry.keys).size, entry.keys.length, name + ' keys are unique');
    for (const key of entry.required) assert.equal(entry.keys.includes(key), true, name + '.' + key);
  }
});

test('the declared module outputs are exactly the files the generator emitted', () => {
  const declared = SOURCE.package_set_node;
  for (const key of [
    'schema_path',
    'typescript_path',
    'core_declarations_path',
    'read_declarations_path',
    'core_contract_path',
    'read_contract_path',
    'validator_path',
  ]) {
    assert.equal(fs.existsSync(path.join(ROOT, declared[key])), true, key + ' -> ' + declared[key]);
  }
  const validator = require(path.join(ROOT, declared.validator_path));
  const schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8'));
  for (const name of declared.exports) assert.equal(typeof validator[name] === 'function' || typeof validator[name] === 'object', true, name);
  assert.deepEqual(
    schema.$defs[declared.root].anyOf.map(branch => branch.$ref),
    ['PackageSet', 'PackageSetHandoff', 'PackageSetMemberObservationRequest', 'PackageSetMemberObservation', 'PackageSetReadObservation', 'PackageSetNodeDescriptor'].map(name => '#/$defs/' + name)
  );
});
