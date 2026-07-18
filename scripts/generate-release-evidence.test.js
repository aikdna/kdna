'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { validateKnownPackages } = require('./generate-release-evidence');

const repoRoot = path.resolve(__dirname, '..');

test('release evidence inventories candidate source without treating it as current-published', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'ecosystem-manifest.json'), 'utf8'),
  );
  assert.doesNotThrow(() => validateKnownPackages(manifest));

  const withoutCandidateSource = structuredClone(manifest);
  const compatibility = withoutCandidateSource.components
    .find((component) => component.repository === 'aikdna/kdna')
    .packages.find((packageRecord) => packageRecord.npm_package === '@aikdna/kdna');
  compatibility.release_status = 'deprecated';
  assert.throws(
    () => validateKnownPackages(withoutCandidateSource),
    /release evidence package inventory differs/u,
  );
});
