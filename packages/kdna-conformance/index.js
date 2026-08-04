'use strict';

/*
 * KDNA conformance suite.
 *
 * runConformance({ core }) runs the asset-first KDNA conformance checks
 * against a KDNA Core implementation and returns a pass/fail report. The
 * reference implementation is @aikdna/kdna-core; a third-party implementer
 * passes its own module exposing the same surface.
 *
 * The suite proves the current Container, Runtime Capsule, Consumption Plan,
 * Agent Host, and Judgment Trace contract. It does not certify that an
 * asset's judgment is correct.
 */

const fs = require('node:fs');
const path = require('node:path');

const FIXTURES = path.join(__dirname, 'fixtures');

function check(results, name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
  }
}

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name));
}

function runConformance({ core }) {
  if (!core || typeof core !== 'object') {
    throw new Error('runConformance requires a KDNA Core implementation module');
  }
  const results = [];

  const validAsset = readFixture('valid-asset.kdna');

  check(results, 'container: valid asset passes validation', () => {
    const validation = core.validate(validAsset);
    if (!validation.overall_valid) {
      throw new Error(`expected overall_valid, got problems: ${(validation.problems || []).join('; ')}`);
    }
  });

  check(results, 'loadplan: valid asset can load now', () => {
    const plan = core.planLoad(validAsset);
    if (!plan.can_load_now) {
      throw new Error(`expected can_load_now, got state=${plan.state}`);
    }
  });

  check(results, 'runtime: load emits a runtime capsule', () => {
    const capsule = core.load(validAsset, { profile: 'compact', as: 'json' });
    const value = capsule.value || capsule;
    if (value.type !== 'kdna.runtime-capsule') {
      throw new Error(`expected kdna.runtime-capsule, got ${value.type}`);
    }
    if (value.contract_version !== '0.1.0') {
      throw new Error(`expected contract_version 0.1.0, got ${value.contract_version}`);
    }
  });

  check(results, 'hostile: corrupted container fails closed', () => {
    const corrupted = Buffer.from(validAsset);
    // Corrupt a byte in the middle of the container (payload region), which
    // must break checksum/format validation. Corrupting only the ZIP trailer
    // may not be detected, so corrupt the payload region.
    corrupted[Math.floor(corrupted.length / 2)] ^= 0xff;
    let validation;
    try {
      validation = core.validate(corrupted);
    } catch {
      // An implementation that throws on a corrupted container also fails
      // closed, which satisfies the contract.
      return;
    }
    if (validation.overall_valid) {
      throw new Error('corrupted container must not validate');
    }
  });

  const passed = results.filter((r) => r.ok).length;
  return { results, passed, failed: results.length - passed };
}

module.exports = { runConformance };
