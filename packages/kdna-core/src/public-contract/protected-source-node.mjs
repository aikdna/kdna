import api from './protected-source-node.js';
export const {
  getProtectedSourceContract,
  createTrustedProtectedSourceHost,
  withProtectedSourceNode,
  commitProtectedSourceTransport,
  previewProtectedSourceRevision,
  produceProtectedSourceRevision,
} = api;
