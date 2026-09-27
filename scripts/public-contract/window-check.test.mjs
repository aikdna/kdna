import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {applyPatch, classifySources, diffLeaves} from './window-check.mjs';

const script = fileURLToPath(new URL('./window-check.mjs', import.meta.url));
const base = () => ({
  format: 'kdna.public-semantic-source/1',
  versionTuple: {core: 'kdna.core/0.6.0', read: 'kdna.read/0.4.0'},
  types: {
    Judgment: {type: 'object', properties: {id: {type: 'string'}, kind: {$ref: '#/$defs/Kind'}},
      required: ['id'], additionalProperties: false},
    Kind: {type: 'string', enum: ['a', 'b']},
  },
  accepted_designs: [{path: 'specs/example.md', bytes: 123, sha256: 'a'.repeat(64)}],
  non_schema_rules: [], engineering: {resource_limits: {entry_bytes: 1000}},
});

function changed(change) {
  const oldSource = base();
  const next = structuredClone(oldSource);
  change(next);
  return classifySources(oldSource, next);
}

test('identical valid source identity is the only automatically passing case', () => {
  const source = base();
  const reordered = Object.fromEntries(Object.entries(source).reverse());
  const result = classifySources(source, reordered);
  assert.equal(result.verdict, 'IN_WINDOW');
  assert.equal(result.compatibility, 'IDENTICAL_SOURCE');
  assert.equal(result.review_required, false);
  assert.deepEqual(result.changes, []);
  assert.match(result.proof_scope, /correctness.*not established/);
});

test('a legitimate optional field has additive shape but no automatic semantic compatibility', () => {
  const result = changed(source => {source.types.Judgment.properties.note = {type: 'string'};});
  assert.equal(result.verdict, 'NEEDS_SEMANTIC_REVIEW');
  assert.equal(result.compatibility, 'NOT_PROVEN');
  assert.equal(result.changes[0].structural_classification, 'ADDITIVE_CANDIDATE');
  assert.match(result.changes[0].review_scope, /absence remains unprovided/);
});

test('reachable new types do not prove old assets keep their meaning', () => {
  const result = changed(source => {
    source.types.Note = {type: 'string'};
    source.types.Judgment.properties.note = {$ref: '#/$defs/Note'};
  });
  assert.equal(result.verdict, 'NEEDS_SEMANTIC_REVIEW');
  assert.equal(result.changes.length, 2);
  assert(result.changes.every(change => change.structural_classification === 'ADDITIVE_CANDIDATE'));
});

test('the audit reject-every-old-asset rule is blocked from automatic window approval', () => {
  const result = changed(source => source.non_schema_rules.push({
    id: 'REJECT-ALL', applies_to: ['Judgment'],
    requirement: 'Reject every payload with one or more judgments, including all previously valid assets. No optional opt-in.',
    enforcement: 'NOT_IMPLEMENTED_NON_SCHEMA', future_owner: 'Core', future_boundary: 'admission',
  }));
  assert.equal(result.verdict, 'NEEDS_SEMANTIC_REVIEW');
  assert.equal(result.review_required, true);
});

test('forged review booleans, annotations and engineering registries cannot supply a waiver', () => {
  const result = changed(source => {
    source.non_schema_rules.push({id: 'REJECT-ALL', requirement: 'Reject all old assets.',
      compatible: true, review: {status: 'PASS', all_old_assets_preserved: true}});
    source.engineering.compatibility_receipt = {status: 'PASS', reviewer: 'claimed-independent', sha256: 'a'.repeat(64)};
    source.types.Judgment.description = 'This change has been reviewed and is compatible.';
  });
  assert.equal(result.verdict, 'NEEDS_SEMANTIC_REVIEW');
  assert(result.changes.every(change => change.classification !== 'IN_WINDOW'));
});

test('only accepted-design bytes and hashes at the unchanged path are evidence updates', () => {
  const pins = changed(source => {
    source.accepted_designs[0].bytes++;
    source.accepted_designs[0].sha256 = 'b'.repeat(64);
  });
  assert.equal(pins.verdict, 'EVIDENCE_UPDATE_REVIEW_REQUIRED');
  assert(pins.changes.every(change => change.review_required));
  assert.equal(changed(source => {source.accepted_designs[0].path = 'specs/other.md';}).verdict, 'REQUIRES_NEW_COORDINATE');
  assert.equal(changed(source => {delete source.accepted_designs[0].sha256;}).verdict, 'REQUIRES_NEW_COORDINATE');
});

test('observational engineering additions require evidence and cannot prove runtime execution', () => {
  for (const key of ['rule_coverage', 'runtime_enforcement_claims', 'runtime_not_implemented']) {
    const result = changed(source => {source.engineering[key] = {status: 'PASS', observed: true};});
    assert.equal(result.verdict, 'EVIDENCE_UPDATE_REVIEW_REQUIRED');
    assert.match(result.changes[0].review_scope, /actual test execution/);
  }
  assert.equal(changed(source => {source.engineering.resource_limits.entry_bytes++;}).verdict, 'REQUIRES_NEW_COORDINATE');
  assert.equal(changed(source => {source.engineering.arbitrary_registry = {reject_old: true};}).verdict, 'NEEDS_SEMANTIC_REVIEW');
});

test('added comment-like prose does not count as inert data or source validation', () => {
  for (const key of ['title', 'description', '$comment']) {
    const result = changed(source => {source.types.Judgment[key] = 'All old judgments are forbidden.';});
    assert.equal(result.verdict, 'NEEDS_SEMANTIC_REVIEW');
    assert.equal(result.changes[0].structural_classification, 'ANNOTATION_ADDITION');
  }
});

test('required, enum, existing types, bounds, closed-object changes and removals are never waived', () => {
  const mutations = [
    source => source.types.Judgment.required.push('kind'),
    source => {source.types.Judgment.required = [];},
    source => source.types.Kind.enum.push('c'),
    source => {source.types.Kind.enum = ['a'];},
    source => {source.types.Judgment.properties.id.type = 'integer';},
    source => {source.types.Judgment.additionalProperties = true;},
    source => {delete source.types.Judgment.properties.id;},
    source => {source.versionTuple.core = 'kdna.core/0.7.0';},
    source => {source.versionTuple.new_axis = 'kdna.new/0.1.0';},
    source => {delete source.versionTuple.core;},
  ];
  for (const mutation of mutations) assert.equal(changed(mutation).verdict, 'REQUIRES_NEW_COORDINATE');
});

test('new-coordinate verdict preserves separate evidence and semantic review rows', () => {
  const result = changed(source => {
    source.versionTuple.core = 'kdna.core/0.7.0';
    source.types.Judgment.properties.note = {type: 'string'};
    source.accepted_designs[0].bytes++;
  });
  assert.equal(result.verdict, 'REQUIRES_NEW_COORDINATE');
  assert.equal(result.review_required, true);
  assert.deepEqual(new Set(result.changes.map(change => change.classification)),
    new Set(['REQUIRES_NEW_COORDINATE', 'NEEDS_SEMANTIC_REVIEW', 'EVIDENCE_UPDATE_REVIEW_REQUIRED']));
});

test('unknown or missing source identity is indeterminate even for identical malformed inputs', () => {
  for (const input of [null, [], {}, {format: 'other'}, {...base(), versionTuple: {}}, {...base(), types: {}},
    {...base(), versionTuple: {core: 7}}]) {
    const result = classifySources(input, structuredClone(input));
    assert.equal(result.verdict, 'INDETERMINATE');
    assert.equal(result.compatibility, 'NOT_PROVEN');
    assert(result.source_problems.length > 0);
  }
});

test('escaped property names cannot impersonate an accepted-design pin path', () => {
  const source = base();
  source['accepted_designs/0/sha256'] = 'a';
  const next = structuredClone(source);
  next['accepted_designs/0/sha256'] = 'b';
  const result = classifySources(source, next);
  assert.equal(result.verdict, 'REQUIRES_NEW_COORDINATE');
  assert.equal(result.changes[0].pointer, '/accepted_designs~10~1sha256');
  assert.deepEqual(diffLeaves({'x/y~z': 1}, {'x/y~z': 2}), [{pointer: '/x~1y~0z', kind: 'changed'}]);
});

test('case patches reject wrong array indices and preserve literal object keys', () => {
  for (const index of ['-1', '99', '01', 'NaN', '1.5']) {
    assert.throws(() => applyPatch({rows: [1]}, [{op: 'remove', path: `/rows/${index}`}]), /index out of bounds/);
  }
  assert.throws(() => applyPatch({}, [{op: 'add', path: '/x~3', value: 1}]), /invalid JSON pointer/);
  assert.deepEqual(applyPatch({}, [{op: 'add', path: '/__proto__', value: {x: 1}}]), JSON.parse('{"__proto__":{"x":1}}'));
  assert.deepEqual(applyPatch({}, [{op: 'replace', path: '', value: {x: 1}}, {op: 'replace', path: '/x', value: 2}]), {x: 2});
});

test('CLI preserves usage and exits nonzero for every review or indeterminate pair verdict', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-window-check-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const oldFile = path.join(root, 'old.json');
  const newFile = path.join(root, 'new.json');
  const source = base();
  fs.writeFileSync(oldFile, JSON.stringify(source));
  for (const [next, expected, exit] of [
    [source, 'IN_WINDOW', 0],
    [{...source, non_schema_rules: [{id: 'reject-all', requirement: 'Reject every old asset.'}]}, 'NEEDS_SEMANTIC_REVIEW', 1],
    [{...source, accepted_designs: [{...source.accepted_designs[0], bytes: 124}]}, 'EVIDENCE_UPDATE_REVIEW_REQUIRED', 1],
    [{...source, versionTuple: {...source.versionTuple, core: 'kdna.core/0.7.0'}}, 'REQUIRES_NEW_COORDINATE', 1],
    [{}, 'INDETERMINATE', 1],
  ]) {
    fs.writeFileSync(newFile, JSON.stringify(next));
    const result = spawnSync(process.execPath, [script, '--old', oldFile, '--new', newFile], {encoding: 'utf8'});
    assert.equal(result.status, exit, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.verdict, expected);
    assert(output.proof_scope);
  }
  assert.equal(spawnSync(process.execPath, [script, '--old', oldFile, '--old', newFile, '--new', newFile]).status, 2);
});

test('case mode checks expected non-passing results without presenting compatibility approval', () => {
  const result = spawnSync(process.execPath, [script, '--cases', fileURLToPath(new URL('./window-cases.json', import.meta.url))], {encoding: 'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.status, 'CASES_MATCH');
  assert.equal(output.total, output.matched);
  assert.match(output.proof_scope, /not a compatibility verdict/);
  assert(output.results.some(row => row.observed === 'NEEDS_SEMANTIC_REVIEW' && row.ok));
});
