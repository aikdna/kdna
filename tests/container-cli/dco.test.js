'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  commitHasMatchingSignOff,
  verifyCommitRecords,
} = require('../../scripts/check-dco.cjs');

const valid = {
  sha: 'a'.repeat(40),
  authorName: 'KDNA Contributor',
  authorEmail: 'contributor@example.com',
  message: 'feat: add an integration\n\nSigned-off-by: KDNA Contributor <contributor@example.com>',
};

test('DCO accepts an author-matching trailer', () => {
  assert.equal(commitHasMatchingSignOff(valid), true);
  assert.doesNotThrow(() => verifyCommitRecords([valid]));
});

test('DCO compares email case-insensitively', () => {
  assert.equal(commitHasMatchingSignOff({
    ...valid,
    message: 'fix: preserve identity\n\nSigned-off-by: KDNA Contributor <CONTRIBUTOR@example.com>',
  }), true);
});

for (const hostile of [
  { name: 'a missing trailer', message: 'feat: unsigned change' },
  { name: 'a different author name', message: 'feat: wrong name\n\nSigned-off-by: Another Person <contributor@example.com>' },
  { name: 'a different author email', message: 'feat: wrong email\n\nSigned-off-by: KDNA Contributor <other@example.com>' },
  { name: 'a malformed trailer', message: 'feat: malformed\n\nSigned-off-by KDNA Contributor <contributor@example.com>' },
]) {
  test(`DCO rejects ${hostile.name}`, () => {
    const record = { ...valid, message: hostile.message };
    assert.equal(commitHasMatchingSignOff(record), false);
    assert.throws(() => verifyCommitRecords([record]), /missing an author-matching Signed-off-by/u);
  });
}
