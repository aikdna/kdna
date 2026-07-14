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
const externalKeyGrant = require('./external-key-grant');
const publicApi = require('./public-api');
const workpackPure = require('./workpack-pure');
const v1 = require('./v1');
const runtimeApi = require('./runtime-api');
const capsuleV2 = require('./capsule-v2');

module.exports = {
  ...publicApi,
  ...loader,
  ...lint,
  ...validate,
  ...render,
  ...compose,
  ...assetReader,
  ...cryptoProfile,
  ...externalKeyGrant,
  ...workpackPure,
  ...v1,
  ...runtimeApi,
  ...capsuleV2,
};
