'use strict';

const { spawnSync } = require('node:child_process');

const AUDITED_NPM_VERSION = '11.17.0';
const OFFICIAL_REGISTRY = 'https://registry.npmjs.org/';
const REGISTRY_TIMEOUT_MS = 30_000;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertAuditedNpmResult(result) {
  assert(result && !result.error, `npm version check failed: ${result?.error?.message || 'unknown'}`);
  assert(Number.isInteger(result.status), 'npm version check did not return an integer exit status');
  assert(result.status === 0, `npm version check exited ${String(result.status)}`);
  assert(result.stderr === '', 'npm version check wrote unexpected stderr');
  assert(
    result.stdout.trim() === AUDITED_NPM_VERSION,
    `npm must be exactly ${AUDITED_NPM_VERSION}`,
  );
  return AUDITED_NPM_VERSION;
}

function verifyAuditedNpm() {
  return assertAuditedNpmResult(
    spawnSync('npm', ['--version'], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      shell: false,
      timeout: REGISTRY_TIMEOUT_MS,
    }),
  );
}

module.exports = {
  AUDITED_NPM_VERSION,
  OFFICIAL_REGISTRY,
  REGISTRY_TIMEOUT_MS,
  assertAuditedNpmResult,
  verifyAuditedNpm,
};
