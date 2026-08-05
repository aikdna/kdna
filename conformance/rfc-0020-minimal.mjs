/**
 * rfc-0020-minimal.mjs — RFC-0020 minimal projection profile conformance.
 *
 * These integration tests exercise the minimal projection profile added by
 * RFC-0020 (rfcs/RFC-0020-minimal-projection-profile.md). They are staged
 * OUTSIDE the frozen canonical conformance surface (canonical-conformance.mjs)
 * because the ecosystem gate's frozen Swift pin does not yet know the minimal
 * contract. After the C2 conformance-anchor promotion, merge these tests back
 * into canonical-conformance.mjs (see the C2 execution checklist).
 *
 * Run: node --test conformance/rfc-0020-minimal.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { createRequire } from 'node:module';
const _require = createRequire(import.meta.url);
const core = _require('../packages/kdna-core/src/index.js');
const cbor = _require('cbor-x');

let WORKDIR;

test.before(() => {
  WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-rfc0020-conformance-'));
});

test.after(() => {
  if (WORKDIR) fs.rmSync(WORKDIR, { recursive: true, force: true });
});

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}
function fixtureDir(name) {
  const d = path.join(WORKDIR, name);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function buildFixture(name, manifestOverrides = {}, payloadOverrides = {}) {
  const dir = fixtureDir(name);
  const manifest = {
    format_version: '0.1.0',
    asset_id: `kdna:c:${name}`,
    asset_uid: `urn:uuid:0000-0000-4000-8000-${sha256(name).slice(0, 12)}`,
    asset_type: 'domain',
    title: `Conformance ${name}`,
    version: '1.0.0',
    judgment_version: '1.0.0',
    created_at: '2026-06-25T00:00:00Z',
    updated_at: '2026-06-25T00:00:00Z',
    creator: { name: 'C', id: 'c' },
    compatibility: {
      min_loader_version: '0.20.0',
      profile: 'kdna.payload.judgment',
      profile_version: '0.1.0',
    },
    payload: { path: 'payload.kdnab', encoding: 'cbor', encrypted: false },
    access: 'public',
    ...manifestOverrides,
  };
  const payload = {
    profile: 'kdna.payload.judgment',
    profile_version: '0.1.0',
    core: {
      highest_question: 'Conformance test.',
      axioms: [
        {
          id: 'c-001',
          one_sentence: 'Test axiom.',
          full_statement: 'For conformance.',
          applies_when: ['testing'],
          does_not_apply_when: [],
          failure_risk: 'None.',
        },
      ],
      boundaries: [{ type: 'scope', text: 'Testing only.' }],
    },
    patterns: [
      { type: 'term', term: 'conformance', definition: 'Protocol compliance verification.' },
    ],
    ...payloadOverrides,
  };
  fs.writeFileSync(path.join(dir, 'mimetype'), 'application/vnd.kdna.asset');
  fs.writeFileSync(path.join(dir, 'kdna.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(dir, 'payload.kdnab'), cbor.encode(payload));
  const cs = core.buildChecksums(dir);
  fs.writeFileSync(path.join(dir, 'checksums.json'), JSON.stringify(cs, null, 2));
  const kdna = path.join(WORKDIR, `${name}.kdna`);
  core.pack(dir, kdna);
  return { dir, kdna, manifest, payload };
}

test('integration: minimal projection is boundary-friendly and declared-only', () => {
  const f = buildFixture('minimal', {
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
  });
  assert.equal(core.validate(f.kdna).overall_valid, true);
  const minimal = core.loadAuthorized(f.kdna, { profile: 'minimal', as: 'json' });
  assert.equal(minimal.profile, 'minimal');
  assert.equal(minimal.context.highest_question, 'Conformance test.');
  assert.equal(minimal.context.axioms.length, 1);
  assert.equal(minimal.context.axioms[0].one_sentence, 'Test axiom.');
  assert.deepEqual(minimal.context.axioms[0].does_not_apply_when, []);
  assert.equal(minimal.context.axioms[0].failure_risk, 'None.');
  assert.equal(minimal.context.boundaries.length, 1);
  // minimal must not leak compact-only content (patterns)
  assert.equal(minimal.context.patterns, undefined);

  // compact remains a strict superset
  const compact = core.loadAuthorized(f.kdna, { profile: 'compact', as: 'json' });
  assert.ok(Array.isArray(compact.context.patterns) && compact.context.patterns.length > 0);
});

test('integration: minimal fails closed when not declared in load_contract', () => {
  const f = buildFixture('minimal-undec', {}); // no load_contract, no minimal
  const denied = core.loadAuthorized(f.kdna, { profile: 'minimal', as: 'json' });
  assert.equal(denied.profile, 'minimal');
  assert.deepEqual(denied.context, {});
});
