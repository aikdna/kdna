# Human Judgment Lock

The Human Judgment Lock is the protocol mechanism that ensures judgment updates in KDNA domains are explicitly approved by a human before they take effect.

It is the operational guarantee behind the principle:

> Agent can learn from work. But judgment updates require governance.

---

## Three Classes of Updates

When an agent or system proposes a change to a KDNA-loaded environment, the change falls into one of three classes:

| Class | Can Agent Auto-Apply? | Examples | Governance Requirement |
|-------|----------------------|----------|------------------------|
| **Operational** | Yes | Tool call parameters, API formats, preferred output formatting, project-specific commands, user preference memory | None. May be logged for audit. |
| **Evidence** | Record automatically; do not auto-apply | New outcome records, eval failures, trace anomalies, user feedback | Recorded as evidence. Becomes input to proposals. |
| **Judgment** | **No** | Axioms, value order, judgment role, boundaries, risk model, does_not_apply_when, failure_risk, composition policy | **Must receive Human Judgment Lock.** |

Only Judgment-class updates require Human Judgment Lock. This distinction is what prevents agents from drifting while still allowing them to learn operationally.

---

## Fields Requiring Human Judgment Lock

The following fields in a KDNA domain MUST NOT be modified without a recorded Human Judgment Lock:

### KDNA_Core.json
- `axioms` — any add, remove, or revise
- `value_order` — any reorder, add, or remove
- `judgment_role` — any change to acts_as, does_not_act_as, or responsibility
- `ontology` — any change to concept boundaries or trigger signals that affects judgment
- `frameworks` — any change to steps or when_to_use that affects judgment outcomes
- `stances` — any change to stance declarations or their applicability conditions

### KDNA_Patterns.json
- `boundaries` — any change to what must not be done
- `risk_model` — any change to which errors cost the most
- `banned_terms` — any add or remove (changes output constraints)
- `aesthetic_preferences` — any change to taste-based judgment

### KDNA_Scenarios.json
- `scenes` — any change to trigger signals that affects scenario classification
- `negative_signals` — any change

### KDNA_Evolution.json
- `stages` — any change to maturity or capability stages
- `evolution_layers` — any change to capability transitions

### composition.policy.json (if present)
- Any change to selection, priority, conflict, merge, or output rules

### Governance cluster priority rules
- Any change to organizational policy overlays

---

## Fields NOT Requiring Human Judgment Lock

The following may be updated automatically or with minimal review:

- `meta.created` — auto-generated timestamp
- `meta.version` — auto-bumped by tooling
- Tool call parameters and API endpoint configurations
- Output formatting preferences (Markdown vs. JSON vs. plain text)
- User-specific aliases and shortcuts
- Session-level caching and performance optimizations

The following should be recorded automatically but treated as evidence, not approved judgment:

- New entries in `KDNA_Cases.json` — cases are evidence, not judgment standards
- New outcome records in external systems
- Eval failure logs
- Trace archives

---

## Human Judgment Lock Record Format

A Human Judgment Lock is recorded in `KDNA_Evolution.json` under the `human_locks` array:

```json
{
  "lock_id": "lock_{domain}_{date}_{sequence}",
  "proposal_id": "prop_{domain}_{date}_{sequence}",
  "locked_at": "2026-05-23T14:00:00Z",
  "locked_by": "human-identifier",
  "lock_type": "accept",
  "reason": "Human-readable rationale for the decision.",
  "affected_files": [
    "KDNA_Core.json",
    "KDNA_Patterns.json"
  ]
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `lock_id` | Yes | Unique identifier for this lock. |
| `proposal_id` | No | Reference to the improvement proposal that triggered this lock. Required when the lock follows a formal proposal. |
| `locked_at` | Yes | ISO 8601 timestamp when the lock was applied. |
| `locked_by` | Yes | Identity of the human who applied the lock. Must be resolvable to an identity in the organizational trust model. |
| `lock_type` | Yes | `accept`, `reject`, or `defer`. |
| `reason` | Yes | Human-readable rationale. Must be non-empty. |
| `affected_files` | No | Array of KDNA files affected by the locked change. |

---

## Validation Rules

A conforming validator MUST enforce:

1. **If judgment-class fields changed, lock must exist.**
   If `axioms`, `value_order`, `boundaries`, `risk_model`, or `composition.policy.json` differ from the previous published version, at least one `human_locks` entry with `lock_type: "accept"` MUST exist in `KDNA_Evolution.json`.

2. **Lock must reference a proposal or have explicit reason.**
   Every `accept` lock SHOULD reference an `improvement_proposal` via `proposal_id`. If no proposal exists (e.g., emergency fix), the `reason` field MUST explain why.

3. **Lock identity must be present.**
   Anonymous locks are not permitted. `locked_by` MUST be a non-empty string.

4. **Lock timestamp must be after proposal creation.**
   If `proposal_id` is present, `locked_at` MUST be equal to or later than the proposal's `created_at`.

5. **Rejected proposals must be recorded.**
   If a proposal was reviewed and rejected, a `human_locks` entry with `lock_type: "reject"` MUST exist, or the proposal MUST appear in `rejected_proposals`.

---

## Emergency Overrides

In exceptional circumstances (critical security flaw, imminent harm), an organization MAY apply an emergency judgment update without the full proposal-review-lock cycle.

Requirements for emergency override:
1. The emergency nature MUST be documented in the lock's `reason` field.
2. The override MUST be reviewed and formally ratified within 72 hours.
3. A retroactive improvement proposal MUST be created documenting the emergency and the permanent fix.
4. The emergency override MUST be flagged in `improvement_history` with `event_type: "emergency_override"`.

Emergency overrides are audit events. They should be rare.

---

## Relation to Improvement Proposals

The Human Judgment Lock is the final step in the improvement proposal lifecycle:

```
Proposal Created
    → Under Review
    → Human Reviewer Examines Evidence
    → Human Judgment Lock Applied (accept / reject / defer)
    → If accepted: domain updated, version bumped, regression tested
    → If rejected: proposal recorded in rejected_proposals
    → If deferred: proposal remains open pending more evidence
```

A proposal without a lock is not governed. A lock without a proposal is an emergency or direct edit.

---

## Summary

The Human Judgment Lock is the keystone of KDNA's governance model. It ensures that:

- Agents can learn operationally without restriction
- Evidence is recorded automatically without blocking
- Judgment updates are always human-approved, versioned, and auditable
- Organizations retain control over what "better" means

Without the lock, self-improvement becomes drift. With the lock, self-improvement becomes evolution.
