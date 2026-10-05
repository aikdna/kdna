'use strict';
// Private same-instance Read bridge. No public subpath exposes registration.
const records = new WeakMap();
function register(admission, result) {
  const state = require('./native-package-set-admission.js').admissionState(admission);
  const envelope = result?.envelope;
  if (!state || result.channel !== 'read_envelope' || envelope?.status !== 'ready' || envelope.receipt.delivery !== 'delivered') throw Error('NATIVE_PACKAGESET_DELIVERY');
  const view = require('./section-native-state.js').snapshots.get(state.selected_member.snapshot);
  if (envelope.snapshot_id !== view.snapshot_id || envelope.receipt.host_id !== state.host_id || envelope.receipt.host_epoch !== state.host_epoch) throw Error('NATIVE_PACKAGESET_DELIVERY');
  const token = Object.freeze({}); records.set(token, {admission, result}); return token;
}
function inspect(token) { return token && typeof token === 'object' ? records.get(token) ?? null : null; }
module.exports = {register, inspect};
