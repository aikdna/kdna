#!/usr/bin/env node

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  collectCandidates,
  parseAllowlist,
  scanRecords,
  validateAllowlist,
} from './check-post-cutover-naming.mjs';

const prefix = String.fromCharCode(118);
const ownedGeneration = ['KDNA Core ', prefix, '7'].join('');
const actionToken = ['actions/checkout@', prefix, '7'].join('');

function authority(path = '.github/workflows/ci.yml', token = actionToken) {
  return [
    {
      path,
      token,
      owner: 'GitHub Actions',
      reason: 'Third-party release reference controlled by the action owner.',
    },
  ];
}

test('stable coordinates and RFC identifiers are not generation candidates', () => {
  const legal = 'format_version 0.1.0; package 18.2.1; RFC-0018';
  assert.deepEqual(collectCandidates(legal), []);
});

test('KDNA-owned generation prose, identifiers, paths, and tags fail', () => {
  const identifier = ['buildRuntimeCapsule', 'V', '2'].join('');
  const ownedTag = ['kdna-core-', prefix, '${version}'].join('');
  const records = [
    {
      path: ['docs/release-', prefix, '7.md'].join(''),
      surface: 'tracked',
      text: `${ownedGeneration}\n${identifier}\n${ownedTag}`,
    },
  ];
  assert.ok(scanRecords(records, []).length >= 4);
});

test('an exact third-party exception covers only its path and token span', () => {
  const records = [
    {
      path: '.github/workflows/ci.yml',
      surface: 'tracked',
      text: `uses: ${actionToken}`,
    },
  ];
  assert.deepEqual(scanRecords(records, authority()), []);

  const driftedPath = [{ ...records[0], path: '.github/workflows/other.yml' }];
  assert.notDeepEqual(scanRecords(driftedPath, authority()), []);

  const masquerade = [{ ...records[0], text: `uses: ${actionToken}\n${ownedGeneration}` }];
  assert.notDeepEqual(scanRecords(masquerade, authority()), []);
});

test('allowlist rejects field drift, weak reasons, stale paths, and stale tokens', () => {
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], note: 'extra' }],
        }),
      ),
    /fields are not exact/u,
  );
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], reason: 'weak' }],
        }),
      ),
    /not specific enough/u,
  );
  const tracked = [
    {
      path: '.github/workflows/ci.yml',
      surface: 'tracked',
      text: `uses: ${actionToken}`,
    },
  ];
  assert.throws(
    () => validateAllowlist(authority('.github/workflows/moved.yml'), tracked),
    /must name one tracked file/u,
  );
  assert.throws(
    () =>
      validateAllowlist(authority(undefined, ['actions/checkout@', prefix, '8'].join('')), tracked),
    /stale/u,
  );
});

test('a generation token injected only into a packed tarball surface fails', () => {
  const records = [
    {
      path: 'packages/kdna-core/README.md',
      surface: 'packed-tarball',
      text: ownedGeneration,
    },
  ];
  const violations = scanRecords(records, []);
  assert.equal(violations.length, 1);
  assert.ok(violations.every((violation) => violation.surface === 'packed-tarball'));
});
