/**
 * @aikdna/kdna-core — CJS entry point
 */
const loader = require('./loader');
const validate = require('./validate-pure');
const render = require('./render');
const compose = require('./compose');
const assetReader = require('./asset-reader');
const cryptoProfile = require('./crypto-profile');
const externalKeyGrant = require('./external-key-grant');
const publicApi = require('./public-api');
const workpackPure = require('./workpack-pure');
const container = require('./container');
const runtimeApi = require('./runtime-api');
const runtimeCapsule = require('./runtime-capsule');
const runtimeContract = require('./runtime-contract');

module.exports = {
  ...publicApi,
  ...loader,
  ...validate,
  ...render,
  ...compose,
  ...assetReader,
  ...cryptoProfile,
  ...externalKeyGrant,
  ...workpackPure,
  ...container,
  ...runtimeApi,
  ...runtimeCapsule,
  ...runtimeContract,
};
