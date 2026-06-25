# RFC-0014: KDNA Card Spec v2.0

**Status:** Draft
**Proposed:** 2026-06-16
**Authors:** KDNA Maintainers
**Supersedes:** (none — extends `docs/KDNA_CARD_SPEC.md` v1)
**Related:**
- RFC-0013 (`specs/RFC-0013-judgment-asset-lifecycle.md`) — the lifecycle that introduces SAG, TC, IMM
- `docs/KDNA_CARD_SPEC.md` — KDNA Card Spec v1 (shipped, **not replaced** by this RFC)
- `schema/source_authority.schema.json` (PR-1, aikdna/kdna #86)
- `schema/truth_charter.schema.json` (PR-1)
- `schema/module_manifest.schema.json` (PR-1)
- the E2E test the E2E test the E2E test the E2E test lab (private) PR (PR-4 lifecycle smoke)
- the E2E test the E2E test the E2E test the E2E test lab (private) PR (PR-4b default synthesis migration)

---

## Abstract

RFC-0013 introduced three authoring-time object types — Source
Authority Graph (SAG), Truth Charter (TC), and Internal Module
Manifest (IMM) — and explicitly forbade them from leaking into the
runtime `.kdna` payload (RFC-0013 §3 + SPEC §3.3.2). The KDNA
Card v1 (`docs/KDNA_CARD_SPEC.md`) was designed before the
lifecycle existed and therefore exposes a fixed metadata shape
without any field that records which SAG/TC/IMM version a domain
was governed by.

RFC-0014 extends the Card with a v2 layout that surfaces **summary
fields** derived from SAG/TC/IMM but does **not** carry the
authoring-time objects themselves. The boundary is: a Card v2 can
tell a consumer "this domain is locked, sag v1.2.3, tc v1.2.3, last
synthesized 2026-06-14, source disclosure level = summary" — it cannot
tell the consumer the full SAG structure, the full TC content, or
the full IMM module list.

This RFC is **detail-schema only**. It does not re-litigate the
lifecycle architecture, the WorkPack boundary, or the
anti-monolithic principle.

---

## 1. Motivation

The lifecycle implementation series (PR-1 → PR-4b) made the
following real-world trade-offs visible to the authoring-time vs
runtime boundary:

- **PR-1** introduced the three schemas (`source_authority.json`,
  `truth_charter.json`, `module_manifest.json`) and documented them
  as authoring-time only. v1 Card has no field that records which
  of those schemas the domain was governed by.
- **PR-3** (kdna-studio-core compile gates) introduced strict
  vs default mode. A consumer who receives a `.kdna` has no way to
  know whether the domain was compiled under strict-authority or
  default mode.
- **PR-4b** (default synthesis migration) introduced a new
  `tc_status: "synthesized"` value. A consumer cannot distinguish a
  domain whose TC was authored-and-locked by a human from one whose
  TC was auto-synthesized and promoted by a real human lock step.
  Both have `tc_status: "locked"`; only the migration_status
  field on the Card can carry the provenance.

These three observations drive the v2 fields below. They are
**summary** fields, not the full SAG/TC/IMM objects.

---

## 2. Boundary: what Card v2 MUST NOT carry

The following authoring-time objects are **never** embedded in
Card v2, in any form:

- The full `source_authority.json` (SAG) object, including its
  `sources[]` array, `precedence_order`, `conflict_policies`,
  `sensitivity`, and any author-locked or synthesized source
  details.
- The full `truth_charter.json` (TC) object, including its
  `highest_question`, `core_insight`, `in_scope` / `out_of_scope`,
  `highest_axiom_protected`, `forbidden_simplifications`,
  `renamed_terms`, `anti_drift_rules`, and `judgment_authority_holder`.
- The full `module_manifest.json` (IMM) object, including its
  `modules[]` array, per-module `module_id` / `module_type` /
  `maps_to` / `loadable_via` / `decomposition_rationale`.

These objects **may** appear in the provenance report (the
`reports/provenance-report.json` already produced by the compile
pipeline) and in audit sidecar logs, but NOT on the Card.

**Test for the boundary:** if removing a field from Card v2 would
force the consumer to lose the ability to audit the domain, the
field belongs in the provenance report, not on the Card.

---

## 3. Card v2 field layout (additive over v1)

The v1 Card fields (`name`, `version`, `risk_level`,
`intended_use`, `out_of_scope`, `known_limitations`,
`author_responsibility`, `risk_warnings`, `human_lock_summary`,
`quality_badge`, `review_status`, `provenance`, `license`)
**remain unchanged**. RFC-0014 only adds new fields; it does not
deprecate, rename, or move any v1 field.

```json
{
  "name": "@aikdna/code_review",
  "version": "0.8.0-draft.1",
  "risk_level": "R1",
  "intended_use": [...],
  "out_of_scope": [...],
  "human_lock_summary": { ... },
  "quality_badge": "validated",
  "review_status": "verified",
  "provenance": { ... },
  "license": "CC-BY-4.0",

  // ── v2 additions (this RFC) ──────────────────────────────────
  "sag_summary": { ... },
  "tc_summary": { ... },
  "module_summary": { ... },
  "authority_status": "locked",
  "truth_charter_status": "locked",
  "migration_status": "human_locked",
  "source_disclosure_level": "summary"
}
```

### 3.1 `sag_summary` (object, **required** if a SAG exists, else **absent**)

```json
"sag_summary": {
  "sag_id": "sag_<domain>_<yyyy_mm_dd>",
  "version_intent": "0.8.0-draft.1",
  "source_count": 3,
  "current_highest_count": 2,
  "has_conflict_policies": true,
  "sensitivity": {
    "pii": false,
    "author_consent_on_file": true
  }
}
```

The summary carries the SAG identity and counts, never the
individual source entries. `current_highest_count > 0` is the
gating property: if it is 0, the domain cannot have been compiled
under PR-3 strict-authority (and the Card MUST surface that the
compile was not strict-authority via `authority_status`).

### 3.2 `tc_summary` (object, **required** if a TC exists, else **absent**)

```json
"tc_summary": {
  "tc_id": "tc_<domain>_<version>_<yyyy_mm_dd>",
  "highest_question": "Code review judgment: diagnose the layer of a PR before responding.",
  "in_scope_count": 4,
  "out_of_scope_count": 4,
  "renamed_terms_count": 2,
  "highest_axiom_protected_chars": 92
}
```

The summary carries TC identity plus a few non-sensitive aggregates.
It does **not** carry the full `forbidden_simplifications` /
`anti_drift_rules` lists (those can contain author-only
directives). It does **not** carry the full `core_insight` (which
is often longer than 30 characters and contains the most
discriminating author-only language).

### 3.3 `module_summary` (object, **required** if an IMM exists, else **absent**)

```json
"module_summary": {
  "module_count": 4,
  "internal_module_count": 3,
  "sub_domain_count": 0,
  "reference_count": 1,
  "decomposition_rationale_present": true
}
```

The summary carries counts only, never the per-module `maps_to`
paths (those are author-only and would let a consumer reconstruct
internal naming).

### 3.4 `authority_status` (enum, **required**)

A flat string that summarises the compile authority:

| Value | Meaning |
|-------|---------|
| `"none"` | No SAG was supplied; compile used default mode. |
| `"declared_only"` | SAG was supplied but had no `current_highest` source; compile did not run under strict-authority. |
| `"human_locked"` | SAG had a `current_highest` source of `type: "human_locked_charter"`. |
| `"synthesized_then_human_locked"` | PR-4b migration path: the SAG was synthesized by the default helper, then a real human lock was recorded. The Card distinguishes this from `"human_locked"` because the SAG content was not originally authored. |
| `"author_confirmation_only"` | SAG's only `current_highest` source is `type: "author_confirmation"`. Domain is not formally locked in the human-locked sense. |

### 3.5 `truth_charter_status` (enum, **required** if a TC exists, else **absent**)

A flat string mirroring TC's `tc_status` but redacted for the
runtime surface:

| Value | Meaning |
|-------|---------|
| `"draft"` | TC exists and has `tc_status: "draft"`. Not safe to ship. |
| `"synthesized"` | TC exists and has `tc_status: "synthesized"`. PR-3 strict compile would reject this. |
| `"locked"` | TC exists and has `tc_status: "locked"`. Default: safe. |
| `"deprecated"` | TC exists and has `tc_status: "deprecated"`. |

This field carries the **status value** but not the locked_by /
locked_at fields. Those are audit-only; surfacing them on the
Card would leak the identity of the human who locked the domain.

### 3.6 `migration_status` (enum, **required**)

A flat string describing how the SAG/TC came into existence:

| Value | Meaning |
|-------|---------|
| `"human_authored"` | All three objects (SAG/TC/IMM, or any subset) were authored by a human lock. |
| `"synthesized"` | At least one of SAG/TC/IMM was produced by `kdna_lab.rfc0013_migration.default_synthesize` and has NOT yet been promoted to a real human lock. |
| `"synthesized_then_human_locked"` | The synthesis helper produced the objects, then a real human lock was recorded (PR-4b's full pipeline). |
| `"mixed"` | A hybrid: some fields are human-locked, others are still in `synthesized` state. |

`"synthesized"` MUST be a hard warning on the Card: a consumer
should know that the domain's TC may not reflect authorial intent.
`"synthesized_then_human_locked"` is the legitimate migration
path documented in PR-4b and is safe to ship.

### 3.7 `source_disclosure_level` (enum, **required**)

A flat string declaring how much authoring-time detail the Card
reveals:

| Value | Meaning |
|-------|---------|
| `"summary"` | The Card carries only `*_summary` aggregates. The full SAG/TC/IMM are not present anywhere on the Card. This is the only acceptable default for `public` registries. |
| `"audit_only"` | The full SAG/TC/IMM are available in a sidecar `audit.json` next to the `.kdna`, intended for enterprise-audit consumers. The Card itself still carries only `*_summary` fields. |
| `"none"` | No SAG/TC/IMM were supplied; the Card carries only v1 fields plus the v2 status fields. |

The default MUST be `"summary"`. A consumer that wants the
authoring-time objects MUST follow the `audit_only` sidecar path
described in the Migration section, not the Card.

---

## 4. Required vs optional vs future fields

| Field | When present | Required? |
|-------|--------------|-----------|
| `sag_summary` | Only if a SAG was supplied during compile. | **Required if a SAG exists**, else the field is **absent** (not present at all). |
| `tc_summary` | Only if a TC was supplied during compile. | **Required if a TC exists**, else **absent**. |
| `module_summary` | Only if an IMM was supplied during compile. | **Required if an IMM exists**, else **absent**. |
| `authority_status` | Always emitted (it is the most basic compile-time signal). | **Required**. |
| `truth_charter_status` | Always emitted if a TC exists, else the field is **absent**. | **Required if a TC exists**, else **absent**. |
| `migration_status` | Always emitted. | **Required**. |
| `source_disclosure_level` | Always emitted; defaults to `"summary"`. | **Required**. |

**Future (not in this RFC):**

- `sag_history` — an array of past SAG ids for domains that have
  evolved. Deferred because v1 of the lifecycle has no
  established migration path between SAGs.
- `author_team` — list of contributor handles. Deferred because the
  KDNA Core does not yet model multi-author collaboration.

---

## 5. Migration: how existing v1 Cards become v2

The migration is **additive only**. v1 Cards are still valid; the
v2 fields are filled in at compile time when a SAG/TC/IMM exists.

- A domain compiled with no SAG/TC/IMM (pre-RFC-0013 domains): the
  Card carries only the v1 fields plus `authority_status: "none"`,
  `truth_charter_status` **absent**, `migration_status:
  "human_authored"` (the original v1 Card's `human_lock_summary` is
  the migration_status source), and `source_disclosure_level:
  "none"`.
- A domain compiled with a SAG but no TC: the Card carries
  `sag_summary`, `authority_status`, `migration_status`, and
  `source_disclosure_level`. The `tc_summary` and
  `truth_charter_status` fields are **absent**.
- A domain compiled via the PR-4b migration path:
  `migration_status: "synthesized_then_human_locked"`. The
  `truth_charter_status` is `"locked"` (because the lock step
  produces a `tc_status: "locked"` TC).

The migration is **not** a JSON-Schema version bump. The Card
schema's `additionalProperties` setting from v1 carries forward.
The new fields are added under the same `required` / `optional`
contract as v1: nothing in v1 becomes required in v2; the v2
fields are required when their authoring-time objects exist.

---

## 6. Relationship to PR-4b

PR-4b (`see the corresponding acceptance note (private)`) is the closing piece of
RFC-0013 §9 #7. RFC-0014 builds on PR-4b's findings:

- The `migration_status: "synthesized_then_human_locked"` value is
  the result of running `kdna_lab.rfc0013_migration.default_synthesize`
  followed by `lock_tc_with_rationale`. PR-4b proves that this
  pipeline produces a TC that passes PR-3 strict compile; RFC-0014
  defines the Card field that surfaces this fact.
- The `sag_summary` and `tc_summary` field shapes are derived from
  the PR-1 schemas and the PR-4b helper's output. They contain
  counts and ids, never the underlying objects.

A domain that comes out of the PR-4b migration pipeline MUST have
its Card v2 stamped with `migration_status:
"synthesized_then_human_locked"`, not `"human_authored"`. The
synthesized / human-locked distinction is a key part of the v2
Card's audit value.

---

## 7. Non-Goals (Restated for Clarity)

This RFC explicitly does **not**:

- ❌ Define new marketplace display fields. The marketplace is
  Application track; its Card layout is a separate concern.
- ❌ Define enterprise owner-scope fields. Enterprise governance
  is Governance track; v2 only adds flat status fields.
- ❌ Define WorkPack-specific fields. WorkPack is Application
  track.
- ❌ Define atomspeak-specific fields. Atomspeak PR-5 is a
  follow-up; v2 should not be atomspeak-specific.
- ❌ Define a new schema version of the Card. v2 is additive; v1
  Cards remain valid.
- ❌ Embed full SAG/TC/IMM in the Card. See §2. The full objects
  belong in the provenance report, never on the Card.
- ❌ Implement Card v2 in code. This RFC is a detail-schema
  proposal; implementation is a follow-up RFC or a kdna-studio-core
  release.

---

## 8. Acceptance Criteria

This RFC is considered **Accepted → Implemented** when:

1. A kdna-studio-core release emits the v2 fields on the Card.
2. The v2 fields are documented in `docs/KDNA_CARD_SPEC.md` (or its
   successor).
3. The `migration_status: "synthesized_then_human_locked"` value
   is exercised by a lab smoke (PR-4b already produces it).
4. The Card schema validates against a JSON Schema Draft 2020-12
   document.
5. A consumer reading only the v2 fields can answer the questions
   "is this domain locked?" and "was this domain's TC synthesized
   or human-authored?" without consulting the full SAG/TC/IMM.

---

## 9. References

- RFC-0013: `https://github.com/aikdna/kdna/blob/main/specs/RFC-0013-judgment-asset-lifecycle.md`
- v1 Card Spec: `docs/KDNA_CARD_SPEC.md`
- PR-1 (schemas): aikdna/kdna #86
- PR-3 (gates): aikdna/kdna-studio-core #3
- PR-4 (lifecycle smoke): the E2E test the E2E test the E2E test the E2E test lab (private) PR
- PR-4b (default synthesis): the E2E test the E2E test the E2E test the E2E test lab (private) PR
- the E2E test the E2E test the E2E test the E2E test lab (private) PR-4 audit note: `see the corresponding acceptance note (private)`
- the E2E test the E2E test the E2E test the E2E test lab (private) PR-4b audit note: `see the corresponding acceptance note (private)`
