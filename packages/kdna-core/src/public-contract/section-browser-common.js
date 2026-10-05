'use strict';

// Only locally minted failures are trusted. Do not inspect arbitrary exceptions.
const failures = new WeakMap();
function need(ok, code = 'READ_INPUT_INVALID') {
  if (!ok) {
    const error = new Error(code);
    failures.set(error, code);
    throw error;
  }
}
function failureCode(error) {
  return failures.get(error) ?? null;
}
module.exports = { need, failureCode };
