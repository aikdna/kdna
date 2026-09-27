'use strict';
// Independent protected-source module. Exactly six callables; it composes the
// opening, transport and revision units and adds no second crypto or parser.
const opening = require('./protected-source-opening.js');
const revision = require('./protected-source-revision.js');
module.exports = {
  getProtectedSourceContract: opening.getProtectedSourceContract,
  createTrustedProtectedSourceHost: opening.createTrustedProtectedSourceHost,
  withProtectedSourceNode: opening.withProtectedSourceNode,
  commitProtectedSourceTransport: opening.commitProtectedSourceTransport,
  previewProtectedSourceRevision: revision.previewProtectedSourceRevision,
  produceProtectedSourceRevision: revision.produceProtectedSourceRevision,
};
