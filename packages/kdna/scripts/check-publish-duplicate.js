#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { readCurrentReleaseBinding } = require('./current-release-binding');
const { OFFICIAL_REGISTRY, REGISTRY_TIMEOUT_MS, verifyAuditedNpm } = require('./npm-tooling');
const { evaluateRegistryResult } = require('./registry-duplicate-policy');
const { assertCandidateAfterLatest } = require('./registry-latest-policy');
const { validateEvidenceArtifact } = require('./release-evidence');

function fail(message) {
  throw new Error(message);
}

function guardCandidate({ evidence, tarball, bindCurrent, lookup, lookupLatest }) {
  bindCurrent(evidence);
  validateEvidenceArtifact(evidence, tarball);
  const spec = `${evidence.package.name}@${evidence.package.version}`;
  const decision = evaluateRegistryResult(lookup(spec), evidence);
  if (decision.shouldPublish) {
    assertCandidateAfterLatest(lookupLatest(`${evidence.package.name}@latest`), evidence);
  }
  return decision;
}

function parseArguments(argv) {
  const evidenceIndex = argv.indexOf('--evidence');
  const artifactIndex = argv.indexOf('--artifact');
  if (
    evidenceIndex < 0 ||
    artifactIndex < 0 ||
    !argv[evidenceIndex + 1] ||
    !argv[artifactIndex + 1] ||
    argv.length !== 4
  ) {
    fail('usage: check-publish-duplicate.js --evidence <evidence.json> --artifact <verified.tgz>');
  }
  return {
    evidencePath: path.resolve(argv[evidenceIndex + 1]),
    artifactPath: path.resolve(argv[artifactIndex + 1]),
  };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  verifyAuditedNpm();
  const evidence = JSON.parse(fs.readFileSync(options.evidencePath, 'utf8'));
  const decision = guardCandidate({
    evidence,
    tarball: fs.readFileSync(options.artifactPath),
    bindCurrent: (candidate) =>
      readCurrentReleaseBinding({
        root: path.resolve(__dirname, '..', '..', '..'),
        evidence: candidate,
      }),
    lookup: (spec) =>
      spawnSync(
        'npm',
        [
          'view',
          spec,
          'name',
          'version',
          'dist.integrity',
          'dist.shasum',
          '--json',
          '--loglevel=silent',
          `--registry=${OFFICIAL_REGISTRY}`,
        ],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          shell: false,
          timeout: REGISTRY_TIMEOUT_MS,
        },
      ),
    lookupLatest: (spec) =>
      spawnSync(
        'npm',
        [
          'view',
          spec,
          'version',
          '--json',
          '--loglevel=silent',
          `--registry=${OFFICIAL_REGISTRY}`,
        ],
        {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024,
          shell: false,
          timeout: REGISTRY_TIMEOUT_MS,
        },
      ),
  });
  if (process.env.GITHUB_ACTIONS === 'true' && !process.env.GITHUB_OUTPUT) {
    fail('GITHUB_OUTPUT is required in GitHub Actions');
  }
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `should_publish=${decision.shouldPublish ? 'true' : 'false'}\ndecision=${decision.decision}\n`,
    );
  }
  console.log(`Registry duplicate policy: ${decision.decision}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility registry policy rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { guardCandidate, parseArguments };
