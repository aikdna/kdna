'use strict';
// R09 — the `catalog` exemption from a whole-envelope READ_INTERPRETATION_INCOMPLETE
// rejection.
//
// Precondition actually enforced here: Core reported a rejection whose reason is
// exactly READ_INTERPRETATION_INCOMPLETE and the admitted request's mode is
// `catalog`. Every other mode, reason and stage keeps the ordinary fail-closed
// rejection.
//
// This arm is carrier-limited. This line's Core issues no snapshot on that path and
// its rejection carries no asset identity, digest or descriptor list, so nothing
// about the asset's catalog can be truthfully asserted. What is reported is exactly
// what Core said: the admitted request's verified tuple, the Core-observed states,
// one READ_INTERPRETATION_INCOMPLETE diagnostic, and empty body-free content. No
// descriptor, count, identity, digest or capability class is fabricated, and no
// Host gate can run because there is no snapshot to authorize.
const {tuple,diagnostic,assessment}=require('./util.js');

// Two semantics are selectable for measurement and audit:
//   fail_closed (default)  — the pre-R09 behaviour: an ordinary rejection. This
//                            is the default because the carrier Core can supply
//                            while interpretation is blocked does not satisfy the
//                            nine required field families of ReadEnvelopeCatalogOnly,
//                            so emitting it by default would mean shipping output
//                            that violates this line's own Read schema.
//   catalog_only           — emit the carrier-limited envelope described above.
//                            Opt in only once Core issues a catalog carrier for a
//                            blocked asset (see W8 report, T1).
function exemptionMode() {
  const raw = typeof process === 'object' && process !== null ? process.env?.KDNA_READ_CATALOG_EXEMPTION : undefined;
  const value = raw === undefined ? '' : String(raw).trim().toLowerCase();
  return ['on', 'catalog_only', 'exempt', '1', 'true', 'yes'].includes(value) ? 'catalog_only' : 'fail_closed';
}

function blockedCatalogEnvelope(record, observed) {
  return {
    contract: tuple.read,
    request_id: record.request_id,
    status: 'catalog_only',
    // The verified request tuple is the only coordinate available: Core rejected the
    // bytes before issuing any snapshot, so no Core-parsed asset coordinate exists.
    tuple,
    asset: null,
    snapshot_id: null,
    digests: null,
    content: {
      declarations: [], catalog: [], selected: null, closure: [], references: [], relationships: [], missing: [],
      provenance: {declarations: [], confirmation: 'not_evaluated', verifier_id: null, evidence_ref: null},
      // The declared class has no carrier on this path and is not derivable from a
      // partial reading, so it is reported as absent rather than guessed.
      asset_capability: null,
      expansion_handles: [],
    },
    states: observed,
    diagnostics: [diagnostic('READ_INTERPRETATION_INCOMPLETE')],
    // No identity is disclosed or known, so nothing may be counted as omitted.
    omissions: [],
    assessment: assessment(),
    receipt: {receipt_id: 'receipt:' + record.request_id, request_id: record.request_id, snapshot_id: null, host_id: null, host_epoch: null, decision_id: null, disclosed_at: null, delivery: 'not_delivered'},
    budget: {limit_bytes: record.budget_bytes, required_bytes: '0000000000000000', actual_bytes: '0000000000000000'},
  };
}

module.exports = { exemptionMode, blockedCatalogEnvelope };
