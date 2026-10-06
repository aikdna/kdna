'use strict';
// Browser protected admission core (case A: an independent browser entry).
//
// The host supplies the container bytes, the payload plaintext bytes and the
// unlock observation; nothing in this module decrypts, and the observation is
// never authority. Step-2 skeleton: the entry and its input gate exist; the
// five-step admission (container/envelope structure, digests and integrity,
// observation-to-container binding, plaintext semantics, product assembly)
// lands in step 3 and replaces the named stop below.
const { failure } = require('./protection-declaration.js');
function admitProtectedBrowser(input, provider) {
  if (!input || typeof input !== 'object' || !(input.bytes instanceof Uint8Array) || !(input.plaintextPayload instanceof Uint8Array) || !input.observation || typeof input.observation !== 'object') return failure(null);
  throw Object.assign(new Error('Browser protected admission is not implemented yet'), { code: 'PROTECTED_BROWSER_ADMISSION_NOT_IMPLEMENTED' });
}
module.exports = { admitProtectedBrowser };
