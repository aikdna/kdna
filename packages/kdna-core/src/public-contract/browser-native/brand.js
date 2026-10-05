'use strict';

// CAPACITY FIX - admission no longer depends on a full deep copy.
//
// Before: issueSnapshot(data) was freeze(copyJson(data)) - a COMPLETE recursive deep copy
// of the whole admitted graph. copyJson's cost guard (MAX_VALUES = 100,000 JSON value
// visits) was therefore the real ceiling on how much knowledge one asset could carry, even
// though the declared author-input bound for one entry is 8 MiB, explicitly raised so that
// "one authored entry (the judgment payload) can carry a 100-200 issue system". The ledger
// measured a copy budget, not capacity.
//
// Now: the strictness the copy provided is provided by a non-materialising walk
// (assertStrictJson - same depth / plain-prototype / data-only-property / symbol / finite
// number / string-cap / canonical-array-shape / path-cycle predicates), and immutability by
// freezing the graph in place.
//
// How immutability still holds (named argument):
//   1. freeze is recursive and idempotent. After issueSnapshot every object reachable from
//      the view, and the view itself, is non-extensible and frozen, exactly as before. A
//      later write through any retained reference fails (throws in strict mode, no-ops in
//      sloppy mode) instead of changing the snapshot.
//   2. The graph handed to issueSnapshot is one this library built in the same call: the
//      payload is a fresh CBOR decode (cbor.js) and the Canonical IR is freshly built
//      (canonical-ir.js). No caller-side mutable reference to that graph exists, so
//      freezing in place is a library-internal ownership transfer, not a mutation of
//      caller data.
//   3. snapshots.set(snapshot, view) - the brand attestation WeakMap - is unchanged, as is
//      inspectSnapshot. The only public path to a view is still an issued snapshot.
//   4. Structural sharing is deliberate: finishAdmission attaches ONE expansion index array
//      to both contract-required positions (snapshot.expansion_targets and
//      ir.expansion_targets). Both still carry the complete index; only the redundant second
//      STORAGE is gone, so no reader-visible capability changes (whole-asset expansion
//      handles are still produced from this index).
const { assertStrictJson, freeze } = require('./strict-input.js');
const snapshots = new WeakMap();
const protectedSnapshots = new WeakMap();
function markProtectedSnapshot(snapshot, current) { protectedSnapshots.set(snapshot, current); }
function isProtectedSnapshot(snapshot) { return !!snapshot && typeof snapshot === "object" && protectedSnapshots.has(snapshot); }
function issueSnapshot(data) {
  const view = freeze(assertStrictJson(data));
  const snapshot = freeze({ ...view, admission: Object.freeze({}) });
  snapshots.set(snapshot, view);
  return snapshot;
}
function inspectSnapshot(snapshot) {
  if (isProtectedSnapshot(snapshot) && !protectedSnapshots.get(snapshot)()) return null;
  return snapshot && typeof snapshot === 'object' ? snapshots.get(snapshot) ?? null : null;
}
module.exports = { issueSnapshot, inspectSnapshot, markProtectedSnapshot, isProtectedSnapshot };
