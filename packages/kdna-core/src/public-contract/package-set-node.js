'use strict';
// Public Node PackageSet subpath.
//
// Seven callables, all of which either capture purely, call the accepted
// internal implementation with observations this module obtained itself, or
// correlate a past delivery with an independently admitted Plan. None of them
// grants execution permission or disclosure authority, and the internal decider
// and handoff checker stay private to this package.
const crypto = require('node:crypto');
const { copyJson, freeze } = require('./strict-input.js');
const admission = require('./package-set-admission.js');
const validators = require('./package-set-validators.generated.js');

const R07_SHAPE = freeze({ status: 'rejected', diagnostic: 'READ_INPUT_INVALID', merged_ir: false, action_authorized: false });

const ordered = value =>
  Array.isArray(value)
    ? value.map(ordered)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]))
      : value;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

let contractChecked = false;
function assertContractIdentity() {
  if (contractChecked) return;
  const { definition_digest: recorded, ...definition } = admission.descriptor;
  const computed = 'sha256:' + sha(JSON.stringify(ordered(definition)));
  if (computed !== recorded) throw Object.assign(new Error('PACKAGE_SET_NODE_DEFINITION_DIGEST_MISMATCH'), { code: 'PACKAGE_SET_NODE_DEFINITION_DIGEST_MISMATCH' });
  contractChecked = true;
}

function getPackageSetContract() {
  assertContractIdentity();
  return freeze(copyJson(admission.descriptor));
}

// A pure structural read of a caller-shaped PackageSet. It contacts no callback,
// reads no file and runs no crypto; a malformed set is an independent R07
// rejection with the accepted diagnostic and no local code.
function validatePackageSetStructure(input) {
  let value;
  try {
    value = admission.capturePackageSet(input);
  } catch (error) {
    if (error && (error.packageSetLocal || error.packageSetR07)) return R07_SHAPE;
    return R07_SHAPE;
  }
  if (!validators.PackageSet(value)) return R07_SHAPE;
  return freeze({ status: 'valid', value: freeze(copyJson(value)), proof: 'claims_not_authenticated' });
}

function createTrustedPackageSetMemberProvider(config) {
  assertContractIdentity();
  return admission.createTrustedPackageSetMemberProvider(config);
}

function admitPackageSetNode(input, provider) {
  assertContractIdentity();
  return admission.admit(input, provider);
}

function recheckPackageSet(brandedAdmission, phase) {
  return admission.recheck(brandedAdmission, phase);
}

function inspectAdmittedPackageSet(brandedAdmission) {
  return admission.inspectAdmission(brandedAdmission);
}

function verifyPackageSetHandoff(handoff, brandedAdmission, plan, deliveredRead) {
  return admission.verifyHandoff(handoff, brandedAdmission, plan, deliveredRead);
}

module.exports = {
  getPackageSetContract,
  validatePackageSetStructure,
  createTrustedPackageSetMemberProvider,
  admitPackageSetNode,
  recheckPackageSet,
  inspectAdmittedPackageSet,
  verifyPackageSetHandoff,
};
