#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  allowlistAuthorityDigest,
  assertAllowlistAuthority,
  collectCandidates,
  discoverPackageRoots,
  parseAllowlist,
  scanRecords,
  validateAllowlist,
} from './check-post-cutover-naming.mjs';

const prefix = String.fromCharCode(118);
const ownedGeneration = ['KDNA Core ', prefix, '7'].join('');
const authorityPath = 'scripts/post-cutover-naming-allowlist.json';

function authority(path = 'docs/forged-exception.md', token = ownedGeneration) {
  return [
    {
      path,
      token,
      owner: 'GitHub Actions',
      reason: 'Third-party release reference controlled by the action owner.',
    },
  ];
}

test('stable coordinates and domain or third-party versions are not generation candidates', () => {
  const legal =
    'format_version 0.1.0; package 18.2.1; RFC-0018; API v2; Node v22; model v3; actions/checkout@v7; riscv64';
  assert.deepEqual(collectCandidates(legal), []);
});

test('KDNA-owned generation prose, identifiers, paths, and tags fail', () => {
  const identifiers = [
    ['buildRuntimeCapsule', 'V', '2'].join(''),
    ...['Capsule', 'Runtime', 'Host', 'KDNA', 'kdna'].map((name) => [name, 'V', '2'].join('')),
    ['finalize', 'V', '1', 'Layout'].join(''),
    ['read', 'V', '1', 'Layout'].join(''),
    ['cardsFrom', 'V', '1', 'Payload'].join(''),
  ];
  const ownedTag = ['kdna-core-', prefix, '${version}'].join('');
  const records = [
    {
      path: ['docs/core-', prefix, '7.md'].join(''),
      surface: 'tracked',
      text: `${ownedGeneration}\n${identifiers.join('\n')}\n${ownedTag}`,
    },
  ];
  const tokens = scanRecords(records, []).map((violation) => violation.token);
  for (const identifier of identifiers) assert.ok(tokens.includes(identifier));
  assert.ok(tokens.includes(ownedGeneration));
});

test('release-candidate suffixes without a separator remain generation candidates', () => {
  const candidates = [
    ['Runtime ', prefix, '7', 'rc1'].join(''),
    ['KDNA Core ', prefix.toUpperCase(), '7', 'RC_RELEASE'].join(''),
  ];
  for (const candidate of candidates) {
    assert.equal(collectCandidates(candidate)[0].token, candidate);
  }
});

test('allowlist rejects field drift, weak reasons, stale paths, and stale tokens', () => {
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [],
          trusted: true,
        }),
      ),
    /manifest fields are not exact/u,
  );
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
  assert.throws(
    () =>
      parseAllowlist(
        JSON.stringify({
          schema: 'kdna.post-cutover-naming-allowlist',
          schema_version: '0.1.0',
          exceptions: [{ ...authority()[0], owner: 'AIKDNA maintainers' }],
        }),
      ),
    /cannot be owned by KDNA/u,
  );
  const tracked = [
    {
      path: 'docs/forged-exception.md',
      surface: 'tracked',
      text: ownedGeneration,
    },
  ];
  assert.throws(
    () => validateAllowlist(authority('docs/moved-exception.md'), tracked),
    /must name one tracked file/u,
  );
  assert.throws(
    () => validateAllowlist(authority(undefined, ['KDNA Core ', prefix, '8'].join('')), tracked),
    /stale/u,
  );
});

test('allowlist rejects self exceptions', () => {
  const self = authority(authorityPath)[0];
  const tracked = [{ path: authorityPath, surface: 'tracked', text: self.token }];
  assert.throws(() => validateAllowlist([self], tracked), /self exception/u);
});

test('allowlist full-tuple authority rejects additions, removals, and modifications', () => {
  const manifest = JSON.parse(
    fs.readFileSync(new URL('./post-cutover-naming-allowlist.json', import.meta.url), 'utf8'),
  );
  assert.doesNotThrow(() => parseAllowlist(JSON.stringify(manifest)));

  const forged = authority()[0];
  const candidate = structuredClone(manifest);
  candidate.exceptions.push(forged);
  assert.throws(() => parseAllowlist(JSON.stringify(candidate)), /authority digest mismatch/u);

  const fixture = [forged];
  const fixtureDigest = allowlistAuthorityDigest(fixture);
  for (const mutation of [
    [],
    [{ ...forged, owner: 'Modified Third Party' }],
    [...fixture, { ...forged, path: 'docs/second-forged-exception.md' }],
  ]) {
    assert.throws(
      () => assertAllowlistAuthority(mutation, fixtureDigest),
      /authority digest mismatch/u,
    );
  }
});

test('a generation token injected only into any publishable tarball surface fails', () => {
  const roots = discoverPackageRoots();
  assert.deepEqual(roots, [
    'examples/typescript-agent',
    'packages/artifact-engine',
    'packages/fidelity-core',
    'packages/kdna',
    'packages/kdna-core',
    'packages/kdna-eval',
  ]);
  const records = roots.map((root) => ({
    path: `${root}/README.md`,
    surface: 'packed-tarball',
    text: ownedGeneration,
  }));
  const violations = scanRecords(records, []);
  assert.equal(violations.length, roots.length);
  assert.ok(violations.every((violation) => violation.surface === 'packed-tarball'));
});
