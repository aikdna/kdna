'use strict';

const { version: KDNA_LOADER_VERSION } = require('../package.json');

const STRICT_LOADER_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;

function parseLoaderVersion(value) {
  if (typeof value !== 'string') return null;
  const match = STRICT_LOADER_VERSION.exec(value);
  return match ? Object.freeze(match.slice(1)) : null;
}

function compareNumericIdentifier(left, right) {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareLoaderVersions(leftVersion, rightVersion) {
  const left = parseLoaderVersion(leftVersion);
  const right = parseLoaderVersion(rightVersion);
  if (!left || !right) {
    throw new TypeError('loader versions must use strict x.y.z SemVer without leading zeros');
  }
  for (let index = 0; index < 3; index += 1) {
    const comparison = compareNumericIdentifier(left[index], right[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

if (!parseLoaderVersion(KDNA_LOADER_VERSION)) {
  throw new Error(`@aikdna/kdna-core package version is not a strict loader coordinate: ${KDNA_LOADER_VERSION}`);
}

function assessLoaderCompatibility(manifest) {
  const requiredValue = manifest?.compatibility?.min_loader_version;
  const required = parseLoaderVersion(requiredValue);
  return Object.freeze({
    loader_version: KDNA_LOADER_VERSION,
    min_loader_version: typeof requiredValue === 'string' ? requiredValue : null,
    loader_compatible: required
      ? compareLoaderVersions(requiredValue, KDNA_LOADER_VERSION) <= 0
      : null,
  });
}

function loaderVersionUnsupportedMessage(requiredVersion) {
  return `KDNA_LOADER_VERSION_UNSUPPORTED: asset requires loader ${requiredVersion}, current loader is ${KDNA_LOADER_VERSION}`;
}

module.exports = {
  KDNA_LOADER_VERSION,
  STRICT_LOADER_VERSION,
  parseLoaderVersion,
  compareLoaderVersions,
  assessLoaderCompatibility,
  loaderVersionUnsupportedMessage,
};
