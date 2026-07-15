#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cbor = require('cbor-x');
const core = require('../packages/kdna-core/src');

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const minimalRoot = path.join(repoRoot, 'examples', 'minimal');
const capsuleRoot = path.join(repoRoot, 'conformance', 'capsule-v2');
const goldenPayloadSource = path.join(
  repoRoot,
  'packages',
  'kdna-core',
  'test',
  'fixtures',
  'golden-single-asset.json',
);
const goldenPayloadOutput = path.join(
  repoRoot,
  'packages',
  'kdna-core',
  'test',
  'fixtures',
  'golden-single-asset-payload.kdnab',
);

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function migratePayload(payload, source) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error(`${source}: payload must decode to an object`);
  }
  const reasoning = payload.reasoning;
  if (!reasoning || typeof reasoning !== 'object' || Array.isArray(reasoning)) {
    throw new Error(`${source}: reasoning must be an object`);
  }
  if (Object.hasOwn(reasoning, 'self_checks')) {
    if (Object.hasOwn(reasoning, 'self_check')) {
      throw new Error(`${source}: both canonical and deprecated self-check fields are present`);
    }
    reasoning.self_check = reasoning.self_checks;
    delete reasoning.self_checks;
  }
  if (!Array.isArray(reasoning.self_check)) {
    throw new Error(`${source}: canonical self-check field must be an array`);
  }
  return payload;
}

const minimalPayloadPath = path.join(minimalRoot, 'payload.kdnab');
const minimalPayload = migratePayload(
  cbor.decode(fs.readFileSync(minimalPayloadPath)),
  'examples/minimal/payload.kdnab',
);
fs.writeFileSync(minimalPayloadPath, cbor.encode(minimalPayload));
const previousMinimalChecksums = JSON.parse(
  fs.readFileSync(path.join(minimalRoot, 'checksums.json'), 'utf8'),
);
const rebuiltMinimalChecksums = core.buildChecksums(minimalRoot);
// This fixture intentionally retains the older checksum alias shape so the
// committed Capsule vector continues to exercise that compatibility path.
const minimalChecksums = Object.hasOwn(previousMinimalChecksums, 'digest_profile')
  ? rebuiltMinimalChecksums
  : {
      algorithm: rebuiltMinimalChecksums.algorithm,
      manifest_digest: rebuiltMinimalChecksums.manifest_digest,
      payload_digest: rebuiltMinimalChecksums.payload_digest,
      asset_digest: rebuiltMinimalChecksums.asset_digest,
      entries: rebuiltMinimalChecksums.entries,
    };
fs.writeFileSync(path.join(minimalRoot, 'checksums.json'), json(minimalChecksums));

const goldenSource = JSON.parse(fs.readFileSync(goldenPayloadSource, 'utf8'));
migratePayload(goldenSource.payload, 'golden-single-asset.json');
fs.writeFileSync(goldenPayloadOutput, cbor.encode(goldenSource.payload));

await import('./generate-authorization-conformance.mjs');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-capsule-golden-'));
try {
  const assetPath = path.join(tempRoot, 'minimal.kdna');
  core.pack(minimalRoot, assetPath);
  const assetBytes = fs.readFileSync(assetPath);
  const goldenPath = path.join(capsuleRoot, 'golden.json');
  const previous = JSON.parse(fs.readFileSync(goldenPath, 'utf8'));
  const evidence = core.computeDigestEvidence(assetBytes);
  const capsule2 = core.loadCapsuleV2(assetBytes, {
    loadedAt: previous.loaded_at,
    profile: 'compact',
  });
  const capsule1 = core.adaptCapsuleV2ToV1(capsule2);
  const next = {
    profile_ids: previous.profile_ids,
    fixture: previous.fixture,
    loaded_at: previous.loaded_at,
    expected: {
      asset: evidence.asset.value,
      content: evidence.content.value,
      runtime_entry_set: evidence.runtime_entry_set.value,
      capsule_delivery: core.computeCapsuleDeliveryDigest(capsule2),
    },
    capsule_2: capsule2,
    capsule_1: capsule1,
    jcs_vectors: previous.jcs_vectors,
  };
  fs.writeFileSync(path.join(capsuleRoot, previous.fixture), `${assetBytes.toString('base64')}\n`);
  fs.writeFileSync(goldenPath, json(next));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('self-check conformance fixtures regenerated');
