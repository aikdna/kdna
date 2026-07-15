#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readCurrentReleaseBinding } = require('./current-release-binding');
const { OFFICIAL_REGISTRY, REGISTRY_TIMEOUT_MS, verifyAuditedNpm } = require('./npm-tooling');
const { validateEvidenceArtifact } = require('./release-evidence');

function fail(message) {
  throw new Error(message);
}

function publishArguments(artifact) {
  return [
    'publish',
    artifact,
    '--ignore-scripts',
    '--provenance',
    '--access',
    'public',
    `--registry=${OFFICIAL_REGISTRY}`,
  ];
}

function publishCandidate({ evidence, tarball, artifactPath, bindCurrent, publish }) {
  bindCurrent(evidence);
  validateEvidenceArtifact(evidence, tarball);
  const result = publish(publishArguments(artifactPath));
  if (result.error) fail(`npm publish failed: ${result.error.message}`);
  if (!Number.isInteger(result.status)) fail('npm publish did not return an integer exit status');
  if (result.status !== 0) fail(`npm publish exited ${String(result.status)}`);
  return result;
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
    fail(
      'usage: publish-verified-artifact.js --evidence <evidence.json> --artifact <verified.tgz>',
    );
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
  const tarball = fs.readFileSync(options.artifactPath);
  const verifiedEvidence = validateEvidenceArtifact(evidence, tarball);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'kdna-compat-verified-publish-'));
  try {
    const securedArtifact = path.join(temp, verifiedEvidence.artifact.filename);
    fs.writeFileSync(securedArtifact, tarball, { flag: 'wx', mode: 0o600 });
    publishCandidate({
      evidence: verifiedEvidence,
      tarball,
      artifactPath: securedArtifact,
      bindCurrent: (candidate) =>
        readCurrentReleaseBinding({
          root: path.resolve(__dirname, '..', '..', '..'),
          evidence: candidate,
        }),
      publish: (args) =>
        spawnSync('npm', args, {
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024,
          shell: false,
          stdio: 'inherit',
          timeout: REGISTRY_TIMEOUT_MS,
        }),
    });
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Verified compatibility publication rejected: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { parseArguments, publishArguments, publishCandidate };
