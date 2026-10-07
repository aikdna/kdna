'use strict';
// The one peer Core package owns these private brands in Node and browser bundles.
const state = require('../../kdna-core/src/public-contract/browser-protected/state.js');
const { digestCanonical } = require('../../kdna-core/src/public-contract/digests.js');
const expected = require('./protected-browser-contract.json');
const { sameInstallation } = require('./installation.js');
module.exports = { ...state, compatible: () => sameInstallation() && digestCanonical(state.C.contract.module) === expected.definition_digest };
