'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { runConformance } = require('../index.js');
const core = require('@aikdna/kdna-core');

test('conformance suite passes all four checks against the reference core', () => {
  const report = runConformance({ core });
  assert.deepEqual(
    report.results.map((entry) => [entry.name, entry.ok]),
    [
      ['container: valid asset passes validation', true],
      ['loadplan: valid asset can load now', true],
      ['runtime: load emits a runtime capsule', true],
      ['hostile: corrupted container fails closed', true],
    ],
  );
  assert.equal(report.failed, 0);
});

test('runConformance rejects a missing core implementation', () => {
  assert.throws(() => runConformance({}), /requires a KDNA Core implementation/u);
});
