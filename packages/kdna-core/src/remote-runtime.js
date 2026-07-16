'use strict';

const container = require('./container');

/**
 * Load one deployer-controlled `access: "remote"` packaged asset for a
 * server-side projection Runtime.
 *
 * This API intentionally accepts no caller policy options. Physical control
 * of the packaged remote asset is the deployment authorization boundary; the
 * embedding server remains responsible for request authentication,
 * entitlement checks, projection minimization, and audit policy.
 */
function loadRemoteRuntimeAsset(input) {
  if (arguments.length !== 1) {
    const error = new Error(
      'loadRemoteRuntimeAsset accepts exactly one packaged asset input and no caller policy options.',
    );
    error.code = 'KDNA_REMOTE_RUNTIME_OPTIONS_FORBIDDEN';
    throw error;
  }
  return container.loadRemoteRuntimeAssetForServer(input);
}

module.exports = {
  loadRemoteRuntimeAsset,
};
