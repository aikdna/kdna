'use strict';

const { copyJson, freeze } = require('./strict-input.js');
const snapshots = new WeakMap();
function issueSnapshot(data) {
  const view = freeze(copyJson(data));
  const snapshot = freeze({ ...view, admission: Object.freeze({}) });
  snapshots.set(snapshot, view);
  return snapshot;
}
function inspectSnapshot(snapshot) {
  return snapshot && typeof snapshot === 'object' ? snapshots.get(snapshot) ?? null : null;
}
module.exports = { issueSnapshot, inspectSnapshot };
