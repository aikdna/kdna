/**
 * @aikdna/kdna-core — CJS entry point
 */
const loader = require('./loader');
const lint = require('./lint-pure');
const validate = require('./validate-pure');
const render = require('./render');
const compose = require('./compose');
const assetReader = require('./asset-reader');
const cryptoProfile = require('./crypto-profile');

module.exports = {
  ...loader,
  ...lint,
  ...validate,
  ...render,
  ...compose,
  ...assetReader,
  ...cryptoProfile,
};
