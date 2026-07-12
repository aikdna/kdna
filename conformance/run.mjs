import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

import { runPhase2Conformance } from './phase2-protocol.mjs';

const require = createRequire(import.meta.url);
const core = require('../packages/kdna-core/src');
const cbor = require('cbor-x');

const args = process.argv.slice(2);

function argValue(name, fallback = null) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const profile = argValue('--profile', 'asset-loader');
const allowedProfiles = new Set(['asset', 'loader', 'runtime', 'asset-loader', 'phase2-protocol']);

if (!allowedProfiles.has(profile)) {
  console.error(`Unknown conformance profile: ${profile}`);
  console.error(`Allowed profiles: ${Array.from(allowedProfiles).join(', ')}`);
  process.exit(2);
}

if (profile === 'phase2-protocol') {
  runPhase2Conformance();
  process.exit(0);
}

const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-conformance-'));

function manifest(overrides = {}) {
  return {
    kdna_version: '1.0',
    asset_id: 'kdna:conformance:single-format',
    asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000001',
    asset_type: 'fixture',
    name: '@example/single-format',
    title: 'Single-format conformance fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    creator: { name: 'KDNA Conformance', id: 'conformance' },
    compatibility: { min_loader_version: '0.15.12', profile: 'judgment-profile-v1' },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
    ...overrides,
  };
}

function payload() {
  return {
    profile: 'judgment-profile-v1',
    core: {
      highest_question: 'Does this asset prove the single-format lifecycle?',
      axioms: [
        {
          id: 'ax_conformance',
          one_sentence: 'A conforming asset loads only through the authorized runtime.',
          full_statement:
            'The container, LoadPlan, and Runtime Capsule form one consumption contract.',
          applies_when: ['validating KDNA runtime conformance'],
          does_not_apply_when: ['evaluating whether encoded judgment is good'],
          failure_risk: 'Raw payload access can bypass authorization boundaries.',
        },
      ],
      boundaries: [{ type: 'scope', text: 'Protocol conformance only.' }],
    },
    patterns: [],
    scenarios: [],
    cases: [],
    reasoning: {},
    evolution: {},
  };
}

function writeSource(name, { manifestOverrides = {}, rawPayload = null } = {}) {
  const dir = path.join(workdir, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(
    path.join(dir, 'kdna.json'),
    `${JSON.stringify(manifest(manifestOverrides), null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dir, 'payload.kdnab'),
    rawPayload === null ? cbor.encode(payload()) : rawPayload,
  );
  fs.writeFileSync(
    path.join(dir, 'checksums.json'),
    `${JSON.stringify(core.buildChecksums(dir), null, 2)}\n`,
  );
  return dir;
}

try {
  const source = writeSource('valid');
  const asset = path.join(workdir, 'valid.kdna');
  core.pack(source, asset);

  const inspected = core.inspect(asset);
  assert.equal(inspected.asset_id, 'kdna:conformance:single-format');
  assert.equal(inspected.kdna_version, '1.0');

  const validation = core.validate(asset);
  assert.equal(validation.overall_valid, true, validation.problems.join('\n'));

  const plan = core.planLoad(asset);
  assert.equal(plan.access, 'public');
  assert.equal(plan.state, 'ready');
  assert.equal(plan.can_load_now, true);

  const capsule = core.loadAuthorized(asset, { profile: 'compact', as: 'json' });
  assert.equal(capsule.type, 'kdna.context.capsule');
  assert.equal(capsule.domain, '@example/single-format');

  const jsonPayloadSource = writeSource('json-payload', {
    rawPayload: Buffer.from(JSON.stringify(payload())),
  });
  const jsonPayloadAsset = path.join(workdir, 'json-payload.kdna');
  core.pack(jsonPayloadSource, jsonPayloadAsset);
  const jsonPayloadValidation = core.validate(jsonPayloadAsset);
  assert.equal(jsonPayloadValidation.payload_valid, false, 'JSON payload bytes must be rejected');

  const wrongVersionSource = writeSource('wrong-version', {
    manifestOverrides: { kdna_version: '2.0' },
  });
  const wrongVersionAsset = path.join(workdir, 'wrong-version.kdna');
  core.pack(wrongVersionSource, wrongVersionAsset);
  const wrongVersionValidation = core.validate(wrongVersionAsset);
  assert.equal(wrongVersionValidation.schema_valid, false, 'unknown kdna_version must fail');

  const forbiddenSource = writeSource('forbidden-source');
  fs.writeFileSync(path.join(forbiddenSource, 'KDNA_Core.json'), '{}');
  assert.throws(
    () => core.pack(forbiddenSource, path.join(workdir, 'forbidden.kdna')),
    /forbidden top-level source entry/,
  );

  fs.writeFileSync(
    path.join(os.tmpdir(), 'kdna-conformance-last-run.json'),
    `${JSON.stringify(
      {
        ok: true,
        profile,
        certification_level: {
          asset: 'KDNA Asset Compatible',
          loader: 'KDNA Loader Compatible',
          runtime: 'KDNA Runtime Compatible',
          'asset-loader': 'KDNA Asset + Loader Compatible',
        }[profile],
        contract: 'single-format-cbor-loadplan-capsule',
      },
      null,
      2,
    )}\n`,
  );

  console.log(`KDNA conformance suite passed (${profile})`);
} finally {
  fs.rmSync(workdir, { recursive: true, force: true });
}
