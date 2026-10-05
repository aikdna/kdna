'use strict';
const { createRequire } = require('node:module');
const coreRequire = createRequire(require.resolve('@aikdna/kdna-core/package.json'));
const state = coreRequire('./src/public-contract/protected-payload-state.js');
const own = require('./sections/contract.json');
if (state.C.contract.source.sha256 !== own.source.sha256)
    throw new TypeError('PROTECTED_SOURCE_INSTALLATION_MISMATCH');
module.exports = state;
