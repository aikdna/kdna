'use strict';
// Same-instance private request and whole-snapshot stores; no public mint operation.
module.exports = { requests: new WeakMap(), snapshots: new WeakMap(), byteOrigins: new WeakSet() };
