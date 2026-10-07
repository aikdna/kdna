'use strict';
const S = require('./browser-protected/state.js'), R = require('./browser-protected/request.js');
function bindProtectedPayloadRequest(operation, requestJson) {
  const record = S.operation(operation);
  if (!record) return R.failure(null);
  const admitted = R.admit(requestJson);
  if (admitted.channel !== 'admitted_request') return admitted;
  try {
    const token = S.normalized(S.request(admitted.request), record.view);
    S.pairRequest(token, operation);
    return Object.freeze({ channel: 'admitted_request', request: token });
  } catch { return R.failure(S.inspectRequest(admitted.request)); }
}
module.exports = {
  admitProtectedPayloadRequestJson: R.admit,
  inspectProtectedPayloadRequest: S.inspectRequest,
  createProtectedPayloadReadAuthorityJson: S.createAuthority,
  admitProtectedSectionBrowser: S.admit,
  inspectProtectedPayloadSnapshot: S.inspectSnapshot,
  bindProtectedPayloadRequest,
  disposeProtectedSectionOperation: S.dispose
};
