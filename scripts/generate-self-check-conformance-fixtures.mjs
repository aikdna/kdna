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
const capsuleRoot = path.join(repoRoot, 'conformance', 'runtime-capsule');
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
  payload.profile = 'kdna.payload.judgment';
  payload.profile_version = '0.1.0';
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
const rebuiltMinimalChecksums = core.buildChecksums(minimalRoot);
fs.writeFileSync(path.join(minimalRoot, 'checksums.json'), json(rebuiltMinimalChecksums));

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
  const runtimeCapsule = core.loadRuntimeCapsule(assetBytes, {
    loadedAt: previous.loaded_at,
    profile: 'compact',
  });
  const next = {
    profile_ids: previous.profile_ids,
    fixture: previous.fixture,
    loaded_at: previous.loaded_at,
    expected: {
      asset: evidence.asset.value,
      content: evidence.content.value,
      runtime_entry_set: evidence.runtime_entry_set.value,
      capsule_delivery: core.computeCapsuleDeliveryDigest(runtimeCapsule),
    },
    runtime_capsule: runtimeCapsule,
    jcs_vectors: previous.jcs_vectors,
  };
  fs.writeFileSync(path.join(capsuleRoot, previous.fixture), `${assetBytes.toString('base64')}\n`);
  fs.writeFileSync(goldenPath, json(next));
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

console.log('self-check conformance fixtures regenerated');
