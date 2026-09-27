'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const F = require('../../../conformance/public-contract/test/r2-fixtures.cjs');
const {req, coreDir, readDir} = F.runtime(process.env.KDNA_PUBLIC_RUNTIME ?? path.resolve(__dirname, '../../..'));

function loadPrivate(name, processValue) {
  const filename = path.join(readDir, 'src', name);
  const context = {module: {exports: {}}, require: createRequire(filename)};
  if (processValue !== undefined) context.process = processValue;
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), context, {filename});
  return context.module.exports;
}

for (const [name, processValue] of [['absent', undefined], ['null', null], ['no env', {}], ['null env', {env: null}], ['empty env', {env: {}}]]) {
  test('optional Node environment ' + name + ' preserves folding and fail-closed defaults', () => {
    const omissions = loadPrivate('omissions.js', processValue);
    assert.equal(omissions.foldingEnabled(), true);
    const row = {state: 'explicitly_omitted', target: 'a', field: 'material', reason: 'not_in_mode', expandable: false, handle_id: null};
    const folded = omissions.foldOmissions([row, {...row, target: 'b'}]);
    assert.equal(folded.length, 1);
    assert.equal(folded[0].count, 2);
    assert.equal(folded[0].reason, row.reason);
    assert.equal(loadPrivate('blocked-catalog.js', processValue).exemptionMode(), 'fail_closed');
  });
}

for (const value of ['0', 'off', 'false', 'no', ' OFF ']) {
  test('Node folding switch preserves disabled value ' + value, () => {
    const omissions = loadPrivate('omissions.js', {env: {KDNA_READ_OMISSION_FOLD: value}});
    const rows = [{state: 'explicitly_omitted', target: 'a', field: 'material', reason: 'not_in_mode', expandable: false, handle_id: null}];
    assert.equal(omissions.foldingEnabled(), false);
    assert.equal(omissions.foldOmissions(rows), rows);
  });
}

test('optional environment switches retain all original enabled choices without activating any entry path', () => {
  for (const value of ['', 'on', '1', 'true', 'yes', 'unrecognized']) assert.equal(loadPrivate('omissions.js', {env: {KDNA_READ_OMISSION_FOLD: value}}).foldingEnabled(), true);
  for (const value of ['on', 'catalog_only', 'exempt', '1', 'true', 'yes']) assert.equal(loadPrivate('blocked-catalog.js', {env: {KDNA_READ_CATALOG_EXEMPTION: value}}).exemptionMode(), 'catalog_only');
  for (const value of ['', 'off', 'unknown']) assert.equal(loadPrivate('blocked-catalog.js', {env: {KDNA_READ_CATALOG_EXEMPTION: value}}).exemptionMode(), 'fail_closed');
});

test('current package README identities match actual metadata, peer and compiled tuple', () => {
  const core = req('@aikdna/kdna-core/package.json'), read = req('@aikdna/kdna-read/package.json');
  const tuple = req(path.join(coreDir, 'src/public-contract/generated-contract.json')).versionTuple;
  assert.equal(read.peerDependencies['@aikdna/kdna-core'], core.version);
  const coreOpening = fs.readFileSync(path.join(coreDir, 'README.md'), 'utf8').split('\n').slice(0, 12).join('\n');
  const readOpening = fs.readFileSync(path.join(readDir, 'README.md'), 'utf8').split('\n').slice(0, 12).join('\n');
  assert.ok(coreOpening.includes('`' + core.version + '`'));
  assert.ok(coreOpening.includes('`' + read.version + '`'));
  assert.ok(coreOpening.includes(tuple.core));
  assert.ok(readOpening.includes('`' + read.version + '`'));
  assert.ok(readOpening.includes('@aikdna/kdna-core@' + core.version));
  assert.ok(readOpening.includes(tuple.core));
  assert.ok(readOpening.includes(tuple.read));
});
