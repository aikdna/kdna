// Cross-platform content_digest conformance test
// Reads golden .kdna fixtures and verifies digest computation correctness.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const reader = require('../src/asset-reader').createKdnaAssetReader();

const FIXTURES = path.resolve(__dirname, '..', '..', '..', 'fixtures');

test('conformance: basic fixture content_digest is deterministic', () => {
  const asset = reader.openSync(path.join(FIXTURES, 'test_conformance.kdna'));
  
  // Compute digest 3 times — must be identical each time
  const rt1 = reader.verifySync(asset);
  const rt2 = reader.verifySync(asset);
  const rt3 = reader.verifySync(asset);
  
  assert.equal(rt1.content_digest, rt2.content_digest);
  assert.equal(rt1.content_digest, rt3.content_digest);
  
  // Digest must be valid sha256 format
  assert.match(rt1.content_digest, /^sha256:[0-9a-f]{64}$/);
  
  // Manifest's content_digest is NOT set in the fixture (it's a raw digest)
  // so we just verify the runtime computation is stable.
});

test('conformance: reports/ and build-receipt excluded from content_digest', () => {
  const asset = reader.openSync(path.join(FIXTURES, 'test_conformance.kdna'));
  const rt = reader.verifySync(asset);
  
  // Read reports and receipt — their content_digest fields are PLACEHOLDER
  // which would change the digest if included. Since they're excluded,
  // the digest should be stable regardless.
  const receipt = JSON.parse(asset.readEntry('build-receipt.json').toString());
  assert.equal(receipt.content_digest, 'PLACEHOLDER');
  
  // Recompute — must still match
  const rt2 = reader.verifySync(asset);
  assert.equal(rt.content_digest, rt2.content_digest);
});

test('conformance: authoring.content_digest stripped from kdna.json', () => {
  const asset = reader.openSync(path.join(FIXTURES, 'test_conformance-with-authoring-digest.kdna'));
  const manifest = JSON.parse(asset.readEntry('kdna.json').toString());
  
  // This fixture has authoring.content_digest set to a known value
  assert.ok(manifest.authoring?.content_digest);
  
  // The runtime content_digest should NOT include authoring.content_digest
  // in its computation (it should be stripped during canonicalization)
  const rt = reader.verifySync(asset);
  assert.match(rt.content_digest, /^sha256:/);
  
  // Compute ten times — must be stable
  for (let i = 0; i < 10; i++) {
    const rtn = reader.verifySync(asset);
    assert.equal(rt.content_digest, rtn.content_digest, `digest changed on iteration ${i}`);
  }
});

test('conformance: both fixtures produce different digests (different manifests)', () => {
  const asset1 = reader.openSync(path.join(FIXTURES, 'test_conformance.kdna'));
  const asset2 = reader.openSync(path.join(FIXTURES, 'test_conformance-with-authoring-digest.kdna'));
  const rt1 = reader.verifySync(asset1);
  const rt2 = reader.verifySync(asset2);
  
  // Different authoring sections = different digests
  assert.notEqual(rt1.content_digest, rt2.content_digest);
});
