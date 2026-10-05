"use strict";
// Read-layer shim: everything from strict-input, with canonicalJson taken from the memo wrapper.
// Preserve strict-input checks and replace only canonicalJson with the memoized wrapper.
const base = require("./strict-input.js");
const { canonicalJson } = require("./canonical-json-memo.js");
module.exports = Object.assign({}, base, { canonicalJson });
