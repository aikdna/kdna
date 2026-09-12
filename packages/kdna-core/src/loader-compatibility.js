'use strict';

const { version: KDNA_LOADER_VERSION } = require('../package.json');

// `compatibility.min_loader_version` is a strict `x.y.z` decimal triple:
// leading zeros, prefixes, prerelease suffixes, build metadata, missing
// components and whitespace are all invalid.
const STRICT_LOADER_VERSION = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/u;

// The loader's OWN package coordinate additionally allows a SemVer prerelease
// or build suffix (for example `0.24.0-rc.component-semantics.2`). Its three
// numeric components are parsed with the same strictness as the requirement.
const LOADER_PACKAGE_COORDINATE =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

function parseLoaderVersion(value) {
  if (typeof value !== 'string') return null;
  const match = STRICT_LOADER_VERSION.exec(value);
  return match ? Object.freeze(match.slice(1)) : null;
}

function parseLoaderCoordinate(value) {
  if (typeof value !== 'string') return null;
  const match = LOADER_PACKAGE_COORDINATE.exec(value);
  return match ? Object.freeze(match.slice(1, 4)) : null;
}

function compareNumericIdentifier(left, right) {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function compareLoaderVersions(leftVersion, rightVersion) {
  const left = parseLoaderCoordinate(leftVersion);
  const right = parseLoaderCoordinate(rightVersion);
  if (!left || !right) {
    throw new TypeError(
      'loader versions must use strict x.y.z SemVer without leading zeros; only the loader package coordinate may carry a prerelease or build suffix',
    );
  }
  for (let index = 0; index < 3; index += 1) {
    const comparison = compareNumericIdentifier(left[index], right[index]);
    if (comparison !== 0) return comparison;
  }
  return 0;
}

if (!parseLoaderCoordinate(KDNA_LOADER_VERSION)) {
  throw new Error(`@aikdna/kdna-core package version is not a loader package coordinate: ${KDNA_LOADER_VERSION}`);
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
  LOADER_PACKAGE_COORDINATE,
  parseLoaderVersion,
  parseLoaderCoordinate,
  compareLoaderVersions,
  assessLoaderCompatibility,
  loaderVersionUnsupportedMessage,
};
