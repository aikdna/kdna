'use strict';

const { copyJson, freeze } = require('./strict-input.js');
const snapshots = new WeakMap();
const protectedSnapshots = new WeakMap();
function markProtectedSnapshot(snapshot, current) { protectedSnapshots.set(snapshot, current); }
function isProtectedSnapshot(snapshot) { return !!snapshot && typeof snapshot === "object" && protectedSnapshots.has(snapshot); }
function issueSnapshot(data) {
  const view = freeze(copyJson(data));
  const snapshot = freeze({ ...view, admission: Object.freeze({}) });
  snapshots.set(snapshot, view);
  return snapshot;
}
function inspectSnapshot(snapshot) {
  if (isProtectedSnapshot(snapshot) && !protectedSnapshots.get(snapshot)()) return null;
  return snapshot && typeof snapshot === 'object' ? snapshots.get(snapshot) ?? null : null;
}
module.exports = { issueSnapshot, inspectSnapshot, markProtectedSnapshot, isProtectedSnapshot };
