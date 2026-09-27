'use strict';
// R10 — folded homogeneous omission records.
//
// The per-entry `Omission` form stays the primitive the projection produces. A
// homogeneous set of per-entry records MAY be replaced by one `OmissionBatch`
// count record; folding is a representation choice over the same ledger, never a
// change to what was omitted, why, or whether it is expandable.
//
// The two closed vocabularies used here are taken from this package's generated
// read contract, never invented: a kind Read cannot find in the contract is not
// foldable, and a reason outside the batch enum stays per-entry.
const schema = require('../schema/read-contract-0.6.4.schema.json');
const BATCH_REASONS = schema.$defs.OmissionBatchReason.enum;
const TARGET_KINDS = schema.$defs.OmissionTargetKind.enum;

// Measurement and conformance switch. Both forms are legal under R10 (`MAY`), so
// this selects between two conforming encodings; it is not a protocol coordinate.
function foldingEnabled() {
  const raw = typeof process === 'object' && process !== null ? process.env?.KDNA_READ_OMISSION_FOLD : undefined;
  if (raw === undefined || raw === '') return true;
  return !['0', 'off', 'false', 'no'].includes(String(raw).trim().toLowerCase());
}

// A record may be folded only when its registered field names a registered target
// kind, its reason is a legal batch reason, and `expandable`/`handle_id` are
// a legal batch pair. A specific identity is never used as a kind and Read never invents
// a kind to make a mixed set foldable.
function targetKindOf(record) {
  if (!record || typeof record.field !== 'string') return null;
  return TARGET_KINDS.includes(record.field) ? record.field : null;
}

function foldable(record) {
  if (!record || record.state !== 'explicitly_omitted') return false;
  if (typeof record.target !== 'string' || record.target.length === 0) return false;
  if (targetKindOf(record) === null) return false;
  if (!BATCH_REASONS.includes(record.reason)) return false;
  if (typeof record.expandable !== 'boolean') return false;
  if (record.expandable ? typeof record.handle_id !== 'string' || record.handle_id.length === 0 : record.handle_id !== null) return false;
  return true;
}

// The fold key is exactly `(target_kind, field, reason, expandable, handle_id)`.
// Different reasons, fields, expandable flags or handles can never share a batch,
// and a `Missing` record or an authored state is a different array entirely.
function foldKey(record) {
  return JSON.stringify([targetKindOf(record), record.field, record.reason, record.expandable, record.handle_id]);
}

function foldOmissions(records, enabled = foldingEnabled()) {
  if (!enabled || !Array.isArray(records) || records.length < 2) return records;
  const groups = new Map();
  records.forEach((record, index) => {
    if (!foldable(record)) return;
    const key = foldKey(record);
    const group = groups.get(key);
    if (group) group.indices.push(index);
    else groups.set(key, { indices: [index], record });
  });
  const folded = new Map();
  const first = new Map();
  for (const [key, group] of groups) {
    // A single-item set is written per-entry; `count` must be >= 2.
    if (group.indices.length < 2) continue;
    folded.set(key, group);
    first.set(key, group.indices[0]);
  }
  if (folded.size === 0) return records;
  const out = [];
  records.forEach((record, index) => {
    const key = foldable(record) ? foldKey(record) : null;
    const group = key === null ? null : folded.get(key);
    if (!group) {
      out.push(record);
      return;
    }
    // The batch replaces the first record it stands for and is inserted there.
    if (first.get(key) !== index) return;
    out.push({
      state: 'explicitly_omitted_batch',
      target_kind: targetKindOf(group.record),
      field: group.record.field,
      reason: group.record.reason,
      count: group.indices.length,
      expandable: group.record.expandable,
      handle_id: group.record.handle_id,
    });
  });
  return out;
}

module.exports = { foldOmissions, foldingEnabled, targetKindOf, BATCH_REASONS, TARGET_KINDS };
