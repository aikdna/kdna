'use strict';

const strict = require('./strict-input.js');
const { digestCanonical } = require('./digests.js');
const validators = require('./browserwhole06/validators.cjs');
const contract = require('./browserwhole06/descriptor.json');
const { requests } = require('./section-native-state.js');
const { authorities } = require('./section-browser-state.js');
const { need } = require('./section-browser-common.js');

function parsedJson(text) {
  need(typeof text === 'string');
  // Only a trusted parser processing a primitive string is inside this catch.
  // No fields on its thrown value are read or promoted to trusted diagnostics.
  try { return strict.parseJson(text); }
  catch { need(false); }
}

function getNativeBrowserSectionContract() {
  return strict.freeze(contract);
}

function admitBrowserSectionRequestJson(text) {
  const data = parsedJson(text);
  need(validators.Request06_whole_asset(data));
  need(strict.identifier(data.request_id));
  strict.freeze(data);
  const token = Object.freeze({});
  requests.set(token, { data, digest: digestCanonical(data) });
  return token;
}

function inspectBrowserSectionRequest(token) {
  const data = requests.get(token)?.data;
  return data?.mode === 'whole_asset' ? data : null;
}

function createNativeBrowserSectionReadAuthority(callback, policyJson) {
  need(typeof callback === 'function');
  const policy = policyJson === undefined
    ? { requireSignature: false, expectedPublicKeyHex: null }
    : parsedJson(policyJson);
  need(validators.SectionSignaturePolicy06(policy));
  strict.freeze(policy);
  const token = Object.freeze({});
  authorities.set(token, Object.freeze({
    authorize: callback, policy, policyDigest: digestCanonical(policy),
  }));
  return token;
}

module.exports = {
  getNativeBrowserSectionContract,
  admitBrowserSectionRequestJson,
  inspectBrowserSectionRequest,
  createNativeBrowserSectionReadAuthority,
};
