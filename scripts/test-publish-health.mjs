#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { createRequire } from 'node:module';

import {
  candidateTags,
  canonicalTag,
  fetchHeaders,
  legacyTagDigest,
  validatePolicy,
} from './publish-health.mjs';

const require = createRequire(import.meta.url);
const { candidateIncumbentPackages, currentPublishedPackages } = require('./ecosystem-manifest.js');

const policy = JSON.parse(
  fs.readFileSync(new URL('../release-health-policy.json', import.meta.url), 'utf8'),
);
const ecosystemManifest = JSON.parse(
  fs.readFileSync(new URL('../ecosystem-manifest.json', import.meta.url), 'utf8'),
);

test('release-health policy is complete, unique, and structurally valid', () => {
  assert.equal(validatePolicy(policy), policy);
  assert.equal(policy.packages.length, 13);
  assert.deepEqual(
    new Set(policy.packages.map((entry) => entry.npm_package)),
    new Set([
      '@aikdna/kdna-cli',
      '@aikdna/kdna-mcp-server',
      '@aikdna/kdna-studio-cli',
      '@aikdna/kdna-studio-core',
      '@aikdna/kdna-activation-server',
      '@aikdna/kdna-remote-server',
      '@aikdna/kdna-web-server',
      '@aikdna/kdna-web-client',
      '@aikdna/kdna-react',
      'create-kdna-web-app',
      '@aikdna/kdna-core',
      '@aikdna/kdna-eval',
      '@aikdna/kdna',
    ]),
  );
  assert.throws(
    () => validatePolicy({ ...policy, packages: [{ ...policy.packages[0], version: 'latest' }] }),
    /invalid expected version/u,
  );
});

test('release-health policy is an exact projection of current public package records', () => {
  const manifestRecords = [
    ...currentPublishedPackages(ecosystemManifest),
    ...candidateIncumbentPackages(ecosystemManifest),
  ];
  const expected = new Map(
    manifestRecords.map(({ component, packageRecord }) => [
      packageRecord.npm_package,
      {
        repository: component.repository,
        package_json: packageRecord.package_json,
        version: packageRecord.version,
      },
    ]),
  );
  assert.deepEqual(
    new Set(policy.packages.map((entry) => entry.npm_package)),
    new Set(expected.keys()),
  );
  for (const entry of policy.packages) {
    assert.deepEqual(
      {
        repository: entry.repository,
        package_json: entry.package_json,
        version: entry.version,
      },
      expected.get(entry.npm_package),
    );
  }
});

test('natural and prefixed canonical tags are exact', () => {
  assert.equal(canonicalTag({ type: 'natural' }, '1.2.3'), '1.2.3');
  assert.equal(canonicalTag({ type: 'prefix', value: 'eval/' }, '1.2.3'), 'eval/1.2.3');
  assert.throws(() => canonicalTag({ type: 'natural' }, 'v1.2.3'));
  assert.throws(() => canonicalTag({ type: 'prefix', value: '' }, '1.2.3'));
});

test('Eval accepts one exact historical coordinate without perpetuating it', () => {
  const evalPolicy = policy.packages.find((entry) => entry.npm_package === '@aikdna/kdna-eval');
  assert.deepEqual(candidateTags(evalPolicy, '0.3.1'), ['eval/0.3.1']);
  assert.deepEqual(candidateTags(evalPolicy, '0.3.2'), ['eval/0.3.2']);
  assert.equal(
    legacyTagDigest(evalPolicy, '0.3.1'),
    '711abd8fd04f2b1466e8c0f331a1139cbe67361fec6c8c3c2957adc7b786c4b4',
  );
  assert.equal(legacyTagDigest(evalPolicy, '0.3.2'), null);
});

test('all other packages use only their canonical coordinate', () => {
  for (const entry of policy.packages.filter(
    (candidate) => candidate.npm_package !== '@aikdna/kdna-eval',
  )) {
    assert.deepEqual(candidateTags(entry, '9.8.7'), [canonicalTag(entry.canonical_tag, '9.8.7')]);
  }
});

test('GitHub credentials are never sent to registry or source hosts', () => {
  const previous = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = 'test-only-placeholder';
  try {
    assert.equal(fetchHeaders('https://registry.npmjs.org/a/latest').Authorization, undefined);
    assert.equal(
      fetchHeaders('https://raw.githubusercontent.com/a/b/main/package.json').Authorization,
      undefined,
    );
    assert.equal(
      fetchHeaders('https://api.github.com/repos/a/b/releases/tags/1.0.0').Authorization,
      'Bearer test-only-placeholder',
    );
  } finally {
    if (previous === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = previous;
  }
});
