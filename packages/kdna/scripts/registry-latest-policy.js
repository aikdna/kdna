'use strict';

const STABLE_SEMVER_RE = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;

function fail(message) {
  throw new Error(message);
}

function compareStableVersions(left, right) {
  const leftMatch = STABLE_SEMVER_RE.exec(left || '');
  const rightMatch = STABLE_SEMVER_RE.exec(right || '');
  if (!leftMatch || !rightMatch) fail('registry version ordering requires stable SemVer');
  for (let index = 1; index <= 3; index += 1) {
    const leftPart = BigInt(leftMatch[index]);
    const rightPart = BigInt(rightMatch[index]);
    if (leftPart > rightPart) return 1;
    if (leftPart < rightPart) return -1;
  }
  return 0;
}

function assertCandidateAfterLatest(result, evidence) {
  if (!result || result.error) {
    fail(`registry latest lookup failed: ${result?.error?.message || 'unknown'}`);
  }
  if (!Number.isInteger(result.status)) fail('registry latest lookup returned no integer status');
  if (result.status !== 0) fail(`registry latest lookup exited ${String(result.status)}`);
  if (result.stderr !== '') fail('registry latest lookup wrote unexpected stderr');

  let latest;
  try {
    latest = JSON.parse(result.stdout);
  } catch {
    fail('registry latest lookup returned malformed JSON');
  }
  if (
    typeof latest !== 'string' ||
    !STABLE_SEMVER_RE.test(latest) ||
    result.stdout.trim() !== JSON.stringify(latest)
  ) {
    fail('registry latest lookup returned an invalid stable version');
  }
  if (compareStableVersions(evidence?.package?.version, latest) <= 0) {
    fail(`candidate ${evidence?.package?.version || '<missing>'} must be newer than npm latest ${latest}`);
  }
  return latest;
}

module.exports = { assertCandidateAfterLatest, compareStableVersions };
