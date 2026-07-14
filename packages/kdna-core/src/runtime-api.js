'use strict';

const fs = require('node:fs');
const path = require('node:path');
const v1 = require('./v1');

function invalidDirectoryPlan(inputPath) {
  const resolved = path.resolve(inputPath);
  return {
    kdna_version: null,
    asset: { asset_id: null, asset_uid: null, title: null, version: null, judgment_version: null },
    access: null,
    access_alias: null,
    entitlement_profile: null,
    state: 'invalid',
    required_action: 'block',
    can_load_now: false,
    projection_policy: 'none',
    input_fingerprint: null,
    checks: {
      format_valid: false,
      schema_valid: false,
      payload_valid: false,
      checksums_valid: false,
      load_contract_valid: false,
      overall_valid: false,
    },
    issues: [{
      code: 'KDNA_ASSET_FILE_REQUIRED',
      severity: 'blocking',
      message: 'Runtime loading requires a packaged .kdna asset file. Source directories are authoring inputs only.',
    }],
    source: { kind: 'dir', path: resolved },
  };
}

function isDirectory(inputPath) {
  if (typeof inputPath !== 'string') return false;
  try {
    return fs.statSync(path.resolve(inputPath)).isDirectory();
  } catch {
    return false;
  }
}

function guardResolver(options = {}) {
  if (typeof options.resolveAsset !== 'function') return options;
  const resolveAsset = options.resolveAsset;
  return {
    ...options,
    resolveAsset(name) {
      const resolved = resolveAsset(name);
      if (resolved?.path && isDirectory(resolved.path)) {
        const error = new Error(
          `Resolved asset "${name}" is a source directory. Runtime dependencies must be packaged .kdna files.`,
        );
        error.code = 'KDNA_ASSET_FILE_REQUIRED';
        throw error;
      }
      return resolved;
    },
  };
}

function planLoad(inputPath, options = {}) {
  if (isDirectory(inputPath)) return invalidDirectoryPlan(inputPath);
  return v1.planLoad(inputPath, guardResolver(options));
}

function loadAuthorized(inputPath, options = {}) {
  if (isDirectory(inputPath)) {
    const plan = invalidDirectoryPlan(inputPath);
    const error = new Error(
      `LoadPlan denied loading: state=${plan.state || 'invalid'} required_action=${plan.required_action || 'block'}`,
    );
    error.code = 'KDNA_ASSET_FILE_REQUIRED';
    error.plan = plan;
    throw error;
  }
  // v1.loadAuthorized snapshots packaged paths once and uses that same Buffer
  // for its LoadPlan, authorization decision, and Runtime Capsule projection.
  return v1.loadAuthorized(inputPath, guardResolver(options));
}

module.exports = {
  planLoad,
  loadAuthorized,
  load: loadAuthorized,
  loadAsset: loadAuthorized,
};
