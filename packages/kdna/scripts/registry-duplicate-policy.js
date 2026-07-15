'use strict';

const { validateReleaseEvidence } = require('./release-evidence');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseExactJson(text, label) {
  assert(typeof text === 'string' && text.trim(), `${label} must contain JSON`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} must be one complete JSON document`);
  }
}

function exactKeys(value, expected, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} fields are not exact`);
}

function expectedE404(evidence) {
  const spec = `${evidence.package.name}@${evidence.package.version}`;
  return {
    summary: `No match found for version ${evidence.package.version}`,
    detail:
      `The requested resource '${spec}' could not be found or you do not have permission to access it.` +
      '\n\nNote that you can also install from a\ntarball, folder, http url, or git url.',
  };
}

function evaluateRegistryResult(result, rawEvidence) {
  const evidence = validateReleaseEvidence(rawEvidence);
  assert(
    result && !result.error,
    `registry lookup failed: ${result?.error?.message || 'unknown error'}`,
  );
  assert(Number.isInteger(result.status), 'registry lookup did not return an integer exit status');
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  assert(typeof stdout === 'string' && typeof stderr === 'string', 'registry output must be text');

  if (result.status === 1) {
    assert(stderr === '', 'registry E404 wrote contradictory or injected stderr');
    const document = parseExactJson(stdout, 'registry E404 stdout');
    exactKeys(document, ['error'], 'registry E404 document');
    exactKeys(document.error, ['code', 'summary', 'detail'], 'registry E404 error');
    const expected = expectedE404(evidence);
    assert(document.error.code === 'E404', 'registry absence requires E404');
    assert(document.error.summary === expected.summary, 'registry E404 version mismatch');
    assert(document.error.detail === expected.detail, 'registry E404 target mismatch');
    return Object.freeze({ decision: 'publish', shouldPublish: true });
  }

  assert(result.status === 0, `registry lookup exited ${result.status}; refusing to publish`);
  assert(stderr === '', 'successful registry lookup wrote unexpected stderr');
  const metadata = parseExactJson(stdout, 'registry metadata stdout');
  exactKeys(metadata, ['name', 'version', 'dist.integrity', 'dist.shasum'], 'registry metadata');
  assert(metadata.name === evidence.package.name, 'published package name mismatch');
  assert(metadata.version === evidence.package.version, 'published package version mismatch');
  assert(
    metadata['dist.integrity'] === evidence.artifact.integrity,
    'published integrity collides with this release',
  );
  assert(
    metadata['dist.shasum'] === evidence.artifact.shasum,
    'published shasum collides with this release',
  );
  return Object.freeze({ decision: 'skip-identical', shouldPublish: false });
}

module.exports = { evaluateRegistryResult, expectedE404 };
