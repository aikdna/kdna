# Human Judgment Lock

> Current boundary: Human Judgment Lock is optional governance provenance for
> reviewed or human-confirmed workflows. It is not a KDNA Core format-validity
> requirement for every `.kdna` file. Plain `.kdna` files may be valid without
> Human Lock; trust, authorship, review status, and distribution status are
> separate layers.

Human Judgment Lock is a provenance mechanism for workflows that claim
human-reviewed governance. It records that judgment updates were explicitly
approved by a human before those updates were treated as reviewed content.

It is the operational guarantee behind the principle:

> Agent can learn from work. But judgment updates require governance.

---

## Three Classes of Updates

When an agent or system proposes a change inside a Human-Locked workflow, the
change falls into one of three classes:

| Class | Can Agent Auto-Apply? | Examples | Governance Requirement |
|-------|----------------------|----------|------------------------|
| **Operational** | Yes | Tool call parameters, API formats, preferred output formatting, project-specific commands, user preference memory | None. May be logged for audit. |
| **Evidence** | Record automatically; do not auto-apply | New outcome records, eval failures, trace anomalies, user feedback | Recorded as evidence. Becomes input to proposals. |
| **Judgment** | **No, if the workflow claims Human Lock or human-reviewed governance** | Axioms, value order, judgment role, boundaries, risk model, does_not_apply_when, failure_risk, composition policy | **Must receive Human Judgment Lock before retaining that claim.** |

Only Judgment-class updates require Human Judgment Lock inside workflows that
claim Human Lock or human-reviewed governance. Plain agent-authored, tool-authored,
or experimental `.kdna` files remain format-valid when they pass `kdna validate`;
they simply must not claim inherited Human Lock, human confirmation, signature,
or reviewed-trust status without the matching evidence.

---

## Fields Requiring Human Judgment Lock

For assets or projects that claim Human Lock, the following fields in a KDNA
domain MUST NOT be modified without a recorded Human Judgment Lock.

> **Core fields for Human-Locked workflows** are marked with ★. Extended fields
> (recommended but not mandated for all assets) are marked with ○. Tools that
> validate Human-Lock claims MUST enforce ★ fields for that claim; general
> `kdna validate` checks format validity and does not require every valid asset
> to contain Human Lock records.

### KDNA_Core.json
- ★ `axioms` — any add, remove, or revise
- ★ `value_order` — any reorder, add, or remove
- ★ `judgment_role` — any change to acts_as, does_not_act_as, or responsibility
- ○ `ontology` — any change to concept boundaries or trigger signals that affects judgment
- ○ `frameworks` — any change to steps or when_to_use that affects judgment outcomes
- ○ `stances` — any change to stance declarations or their applicability conditions

### KDNA_Patterns.json
- ★ `boundaries` — any change to what must not be done
- ★ `risk_model` — any change to which errors cost the most
- ○ `banned_terms` — any add or remove (changes output constraints)
- ○ `aesthetic_preferences` — any change to taste-based judgment

### KDNA_Scenarios.json
- ○ `scenes` — any change to trigger signals that affects scenario classification
- ○ `negative_signals` — any change

### KDNA_Evolution.json
- ○ `stages` — any change to maturity or capability stages
- ○ `evolution_layers` — any change to capability transitions

### composition.policy.json (if present)
- ★ Any change to selection, priority, conflict, merge, or output rules

### Governance cluster priority rules
- ○ Any change to organizational policy overlays

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

There are two lock formats in use. The protocol-level format records locks in `KDNA_Evolution.json`. The inline format is used in `kdna.json` for dev-pack and compile-time validation.

### Protocol Format (KDNA_Evolution.json)

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

### Inline Format (kdna.json, pack-compatible)

The `kdna pack` CLI and Studio-compatible compilers use a simpler inline format embedded in `kdna.json` under the `human_lock` key (singular, not plural). This is the format users encounter when hand-editing domain metadata:

```json
{
  "human_lock": {
    "status": "locked",
    "by": "human-identifier",
    "statement": "Human-readable confirmation of what was reviewed and approved.",
    "checked": {
      "applies_when": true,
      "does_not_apply_when": true,
      "failure_risk": true
    }
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `status` | Yes | Must be `"locked"`. |
| `by` | Yes | Identity of the human who applied the lock. |
| `statement` | Yes | Human-readable confirmation of what was reviewed. |
| `checked.applies_when` | Yes | Boolean — confirmed all `applies_when` conditions correct. |
| `checked.does_not_apply_when` | Yes | Boolean — confirmed all `does_not_apply_when` conditions correct. |
| `checked.failure_risk` | Yes | Boolean — confirmed all `failure_risk` entries correct. |

This inline format is what the `kdna pack` command checks for before accepting a domain. The protocol-level format in `KDNA_Evolution.json` is the long-term record; the inline format is the build-time gate.

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

For workflows that claim Human Lock, the Human Judgment Lock is the final step
in the improvement proposal lifecycle:

```
Proposal Created
    → Under Review
    → Human Reviewer Examines Evidence
    → Human Judgment Lock Applied (accept / reject / defer)
    → If accepted: domain updated, version bumped, regression tested
    → If rejected: proposal recorded in rejected_proposals
    → If deferred: proposal remains open pending more evidence
```

A proposal without a lock is not governed under the Human-Locked workflow. A
lock without a proposal is an emergency or direct edit.

---

## Summary

Human Judgment Lock is the keystone of KDNA workflows that claim human-reviewed
governance. It ensures that:

- Agents can learn operationally without restriction
- Evidence is recorded automatically without blocking
- Judgment updates that retain the Human-Locked claim are human-approved,
  versioned, and auditable
- Organizations retain control over what "better" means

Without this provenance layer, a workflow must not claim human-reviewed
governance. With it, self-improvement can remain auditable.
