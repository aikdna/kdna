#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const EVIDENCE_ROOT = path.join(REPO_ROOT, 'release-evidence');

function hashArtifact(buffer) {
  return {
    integrity: `sha512-${crypto.createHash('sha512').update(buffer).digest('base64')}`,
    shasum: crypto.createHash('sha1').update(buffer).digest('hex'),
  };
}

function assertExactArtifact({ packEvidence, actualPack, artifactBuffer }) {
  if (!packEvidence || !actualPack) throw new Error('pack metadata is missing');
  for (const field of ['name', 'version', 'filename', 'integrity', 'shasum']) {
    const evidenceField = field === 'name' ? 'package_name' : field;
    if (packEvidence[evidenceField] !== actualPack[field]) {
      throw new Error(
        `actual pack ${field} ${actualPack[field] || '<missing>'} does not match release evidence ${packEvidence[evidenceField] || '<missing>'}`,
      );
    }
  }
  const hashes = hashArtifact(artifactBuffer);
  if (hashes.integrity !== actualPack.integrity || hashes.shasum !== actualPack.shasum) {
    throw new Error('exact tarball bytes do not match npm pack integrity and shasum');
  }
  return hashes;
}

function main() {
  const evidencePath = path.join(EVIDENCE_ROOT, 'compat.npm-pack.json');
  if (!fs.existsSync(evidencePath)) {
    throw new Error('compat release evidence is missing; run release:evidence first');
  }
  const packEvidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  const stdout = execFileSync(
    'npm',
    ['pack', '--json', '--pack-destination', EVIDENCE_ROOT],
    {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache:
          process.env.npm_config_cache || path.join(REPO_ROOT, '.npm-cache', 'release-evidence'),
      },
    },
  );
  const parsed = JSON.parse(stdout);
  if (!Array.isArray(parsed) || parsed.length !== 1) {
    throw new Error(`npm pack returned ${Array.isArray(parsed) ? parsed.length : 'invalid'} artifacts`);
  }
  const actualPack = parsed[0];
  const artifactPath = path.join(EVIDENCE_ROOT, actualPack.filename);
  if (path.basename(actualPack.filename) !== actualPack.filename || !fs.existsSync(artifactPath)) {
    throw new Error(`npm pack did not create the expected exact tarball ${actualPack.filename}`);
  }
  assertExactArtifact({
    packEvidence,
    actualPack,
    artifactBuffer: fs.readFileSync(artifactPath),
  });
  console.log(`exact compatibility artifact prepared: ${artifactPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Compatibility release artifact failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { assertExactArtifact, hashArtifact };
