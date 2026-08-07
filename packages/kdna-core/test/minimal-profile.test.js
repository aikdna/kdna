'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cbor = require('cbor-x');

const { loadAuthorized } = require('../src/runtime-api.js');

function u16(value) {
  const out = Buffer.alloc(2);
  out.writeUInt16LE(value);
  return out;
}

function u32(value) {
  const out = Buffer.alloc(4);
  out.writeUInt32LE(value);
  return out;
}

function makeZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, value] of Object.entries(entries)) {
    const nameBytes = Buffer.from(name);
    const data = Buffer.from(value);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      nameBytes, data,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));
    offset += local.length;
  }
  const local = Buffer.concat(localParts);
  const central = Buffer.concat(centralParts);
  return Buffer.concat([
    local,
    central,
    u32(0x06054b50), u16(0), u16(0), u16(centralParts.length),
    u16(centralParts.length), u32(central.length), u32(local.length), u16(0),
  ]);
}

function minimalManifest() {
  return {
    format_version: '0.1.0',
    asset_id: 'kdna:test:minimal-profile',
    asset_uid: 'urn:uuid:00000000-0000-4000-8000-000000000010',
    asset_type: 'fixture',
    title: 'Minimal profile fixture',
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-08-04T00:00:00Z',
    updated_at: '2026-08-04T00:00:00Z',
    compatibility: {
      min_loader_version: '0.21.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
    load_contract: {
      default_profile: 'compact',
      profiles: {
        index: {},
        compact: { max_tokens_hint: 5000 },
        minimal: { max_tokens_hint: 900 },
        scenario: {},
        full: {},
      },
    },
  };
}

function minimalPayload() {
  return {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'Should this change be merged?',
      axioms: [
        {
          type: 'axiom_applicability',
          id: 'ax_green_ci',
          statement: 'CI must be green before merge.',
          one_sentence: 'CI must be green before merge.',
          applies_when: ['a PR is open'],
          does_not_apply_when: ['emergency hotfix'],
          failure_risk: 'Merging broken code.',
        },
        'Keep the diff reviewable.',
        {
          type: 'axiom_applicability',
          id: 'ax_no_arch',
          full_statement: 'Do not make architecture decisions in review.',
        },
      ],
      boundaries: [
        {
          id: 'bd_scope',
          scope: 'Review code changes only.',
          out_of_scope: 'Do not rewrite the architecture.',
        },
      ],
    },
    reasoning: {
      failure_modes: [{ type: 'text', text: 'Over-engineering' }],
    },
    patterns: [{ text: 'A long pattern that must not leak into minimal.' }],
  };
}

function buildAsset(t, manifest = minimalManifest(), payload = minimalPayload()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-minimal-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const asset = path.join(dir, 'fixture.kdna');
  fs.writeFileSync(asset, makeZip({
    mimetype: 'application/vnd.kdna.asset',
    'kdna.json': JSON.stringify(manifest),
    'payload.kdnab': cbor.encode(payload),
  }));
  return asset;
}

test('minimal projection exposes the boundary-friendly core surface', (t) => {
  const asset = buildAsset(t);
  const capsule = loadAuthorized(fs.readFileSync(asset), { profile: 'minimal', as: 'json' });
  assert.equal(capsule.profile, 'minimal');
  const ctx = capsule.context;
  assert.equal(ctx.highest_question, 'Should this change be merged?');
  assert.equal(ctx.axioms.length, 3);
  // object axiom: boundary-friendly fields only
  assert.equal(ctx.axioms[0].one_sentence, 'CI must be green before merge.');
  assert.deepEqual(ctx.axioms[0].does_not_apply_when, ['emergency hotfix']);
  assert.equal(ctx.axioms[0].failure_risk, 'Merging broken code.');
  // string axiom projected as one_sentence text
  assert.equal(ctx.axioms[1].one_sentence, 'Keep the diff reviewable.');
  assert.deepEqual(ctx.axioms[1].does_not_apply_when, []);
  // object axiom without one_sentence falls back to full_statement
  assert.equal(ctx.axioms[2].one_sentence, 'Do not make architecture decisions in review.');
  // boundaries preserved fully
  assert.equal(ctx.boundaries[0].scope, 'Review code changes only.');
  assert.equal(ctx.boundaries[0].out_of_scope, 'Do not rewrite the architecture.');
  // minimal must NOT leak compact-only fields
  assert.equal(ctx.patterns, undefined);
  assert.equal(ctx.failure_modes, undefined);
  assert.equal(ctx.worldview, undefined);
  assert.equal(ctx.max_tokens_hint, undefined);
});

test('minimal is a strict subset of compact', (t) => {
  const asset = buildAsset(t);
  const bytes = fs.readFileSync(asset);
  const minimal = loadAuthorized(bytes, { profile: 'minimal', as: 'json' });
  const compact = loadAuthorized(bytes, { profile: 'compact', as: 'json' });
  assert.equal(minimal.context.highest_question, compact.context.highest_question);
  for (let i = 0; i < minimal.context.axioms.length; i += 1) {
    const m = minimal.context.axioms[i];
    const c = compact.context.axioms[i];
    assert.equal(m.one_sentence, c.one_sentence);
    assert.deepEqual(m.does_not_apply_when, c.does_not_apply_when);
    assert.equal(m.failure_risk, c.failure_risk);
  }
  assert.deepEqual(minimal.context.boundaries, compact.context.boundaries);
});

test('minimal max_tokens_hint comes from the load_contract minimal profile', (t) => {
  const asset = buildAsset(t);
  const capsule = loadAuthorized(fs.readFileSync(asset), { profile: 'minimal', as: 'prompt' });
  assert.match(capsule.text, /Max tokens hint: 900/);
});

test('minimal prompt render includes the boundary-friendly axiom fields', (t) => {
  const asset = buildAsset(t);
  const capsule = loadAuthorized(fs.readFileSync(asset), { profile: 'minimal', as: 'prompt' });
  assert.match(capsule.text, /Should this change be merged\?/);
  assert.match(capsule.text, /CI must be green before merge/);
  assert.match(capsule.text, /does not apply when: emergency hotfix/);
  assert.match(capsule.text, /failure risk: Merging broken code/);
  assert.match(capsule.text, /Do not rewrite the architecture/);
  assert.doesNotMatch(capsule.text, /A long pattern that must not leak/);
});

test('minimal is advertised when declared and fails closed when not declared', (t) => {
  const withMinimal = buildAsset(t);
  const available = loadAuthorized(fs.readFileSync(withMinimal), { profile: 'index', as: 'json' });
  assert.ok(available.context.profiles_available.includes('minimal'));

  // Asset without minimal in load_contract
  const manifest = minimalManifest();
  delete manifest.load_contract.profiles.minimal;
  const without = buildAsset(t, manifest);
  const idx = loadAuthorized(fs.readFileSync(without), { profile: 'index', as: 'json' });
  assert.ok(!idx.context.profiles_available.includes('minimal'));
  const denied = loadAuthorized(fs.readFileSync(without), { profile: 'minimal', as: 'json' });
  assert.equal(denied.profile, 'minimal');
  // RFC-0020 fail-closed: an asset that does not declare minimal serves an
  // empty projection instead of a silently projected judgment surface.
  assert.deepEqual(denied.context, {});
});
