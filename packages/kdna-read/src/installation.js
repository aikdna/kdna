'use strict';

const expected = require('./installation.generated.json');

// Browser-safe package metadata checks. The independent compiled snapshot tuple
// comparison in project.inspect remains mandatory, including after metadata spoofing.
function sameInstallation() {
  try {
    const read = require('../package.json');
    const core = require('@aikdna/kdna-core/package.json');
    return read.name === '@aikdna/kdna-read' &&
      core.name === '@aikdna/kdna-core' &&
      read.version === expected.read_version &&
      core.version === expected.core_version &&
      read.peerDependencies?.['@aikdna/kdna-core'] === expected.core_version;
  } catch {
    return false;
  }
}

module.exports = { sameInstallation };
