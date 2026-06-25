# Phase 2 Filing Note — RFC-0014 / RFC-0015 Drafts

**RFC-0013 phase:** Phase 2 (companion RFC drafting)
**Status:** Both RFC-0014 and RFC-0015 filed as Draft
**Re-run (manual):**
- `git show origin/main:specs/RFC-0014-kdna-card-v2.md | head -1`  → `# RFC-0014: KDNA Card Spec v2.0`
- `git show origin/main:specs/RFC-0015-runtime-trace-v2.md | head -1` → `# RFC-0015: Runtime Trace Spec v2`
- `git show origin/main:docs/rfc-status.md | grep -E "RFC-001[45]"`   → both rows present

## Scope

This PR files **two Draft RFCs** in the `aikdna/kdna` meta repo:

- `specs/RFC-0014-kdna-card-v2.md` — KDNA Card Spec v2
- `specs/RFC-0015-runtime-trace-v2.md` — Runtime Trace Spec v2

These companion RFCs were declared in RFC-0013 §7:

> Two companion detail specs are required for implementation. They
> are NOT this RFC and will be filed separately: RFC-0014 — KDNA
> Card Spec v2.0, RFC-0015 — Runtime Trace Spec v2.

This PR **only files the drafts**. It does not implement Card v2 or
Trace v2 in code. Per the RFC-0013 Phase 2 scope, RFC-0014 and
RFC-0015 are scope-limited to **detail-schema only**.

## Why these RFCs can be filed now

The RFC-0013 PR-4 boundary states:

> PR-4 must verify the lifecycle. PR-4b must close §9 #7. RFC-0014
> and RFC-0015 are filed separately and must wait for PR-1~4b
> implementation feedback per the RFC-0013 Phase 2 scope.

PR-1 through PR-4b are now merged:
- **PR-1** (aikdna/kdna #86) — three authoring-time schemas
- **PR-2** (aikdna/kdna-cli #10) — Anti-Monolithic CLI lint
- **PR-2a** (aikdna/kdna #87) — SPEC §1.6.3 Anti-Monolithic
  principle
- **PR-3** (aikdna/kdna-studio-core #3) — SAG/TC compile gates
- **PR-4** (lab PR) — lifecycle smoke on a simple
  official legacy domain
- **PR-4b** (lab PR) — default SAG/TC synthesis
  migration smoke

PR-4 and PR-4b together produced the implementation feedback
that RFC-0014 and RFC-0015 build on:

- **PR-4** produced 11 lifecycle trace events with
  `sag_version` and `tc_status` on every event.
- **PR-4b** produced 6 lifecycle trace events plus migration-
  specific fields (`migration_mode`, `synthesis_status`,
  `lock_status`, `runtime_payload_leaked`).
- **PR-3** proved that the runtime payload does not leak
  authoring-time objects. RFC-0014 / RFC-0015 codify this
  boundary in the Card / Trace field shapes.

## RFC-0013 §9 acceptance criteria coverage (after this PR)

| # | Item | Status | Where |
|---|------|--------|-------|
| #1 | All three new schema files merged in `aikdna/kdna/schema/` | ✅ | PR-1 (#86) |
| #2 | `kdna dev validate --anti-monolithic` exists | ✅ | PR-2 (#10) |
| #3 | kdna-studio-core rejects (with clear error) on `strict-authority` violations | ✅ | PR-3 (#3) |
| #4 | lab smoke (private) test on a simple official legacy domain | ✅ | PR-4 (#3) |
| #5 | SPEC §1.6 contains the Anti-Monolithic Domain Principle verbatim | ✅ | PR-2a (#87) |
| #6 | RFC-0014 and RFC-0015 are filed as separate Draft RFCs | ✅ | **this PR** |
| #7 | Migration run synthesizes default SAG/TC and produces valid `.kdna` | ✅ | PR-4b (#4) |

After this PR, **§9 acceptance criteria are now covered**. The
implementation series is technically complete.

## What this PR does NOT do (intentional)

Per the RFC-0013 Phase 2 scope, this PR only files drafts:

- ❌ **No implementation of Card v2.** RFC-0014 is a detail-schema
  proposal; the kdna-studio-core release that emits the v2 fields
  is a follow-up.
- ❌ **No implementation of Trace v2.** RFC-0015 is a detail-schema
  proposal; the kdna-studio-core and lab (private) releases that emit
  and consume the v2 lifecycle events are follow-ups.
- ❌ **No runtime payload changes.**
- ❌ **No schema changes** (the existing PR-1 schemas are unchanged).
- ❌ **No changes to kdna-cli / kdna-studio-core / lab (private).**
- ❌ **No atomspeak / book-derived domain smoke** (deferred to PR-5).
- ❌ **No fix of kdna-studio-core's 11 pre-existing test failures**
  (out of scope for the RFC-0013 series; see PR-3 audit note).
- ❌ **No marketplace / enterprise / privacy / WorkPack work.**
- ❌ **No changes to existing v1 trace command** (`docs/kdna-trace.md`)
  or v1 judgment-trace schema (`specs/judgment-trace-schema.json`).
  v2 is additive; v1 remains valid.

## Files

| File | Change | Lines |
|------|--------|-------|
| `specs/RFC-0014-kdna-card-v2.md` | new | ~270 |
| `specs/RFC-0015-runtime-trace-v2.md` | new | ~250 |
| `docs/rfc-status.md` | modified (added RFC-0014 / RFC-0015 rows; current-state progress bars; status note) | +12 / -2 |

## Dependency evidence

| PR | Repo | Commit | Role |
|----|------|--------|------|
| #86 | aikdna/kdna | `see PR-1 acceptance` | PR-1: SAG / TC / IMM schemas. RFC-0014 / RFC-0015 reference these schemas in their field shapes. |
| #10 | aikdna/kdna-cli | `see PR-2 acceptance` | PR-2: Anti-Monolithic CLI lint. PR-2 debt (question-count heuristic) is referenced in RFC-0014 §6. |
| #87 | aikdna/kdna | `see PR-2a acceptance` | PR-2a: SPEC §1.6.3 Anti-Monolithic principle. RFC-0014 §6 references the principle. |
| #3 | aikdna/kdna-studio-core | `see PR-3 acceptance` | PR-3: SAG/TC compile gates. RFC-0014 / RFC-0015 §2 boundary is derived from the PR-3 compile-time separation. |
| #3 | lab (private) | `see PR-4 acceptance` | PR-4: lifecycle smoke. RFC-0015 §1 motivation is derived from the 11 PR-4 events. |
| #4 | lab (private) | `see PR-4b acceptance` | PR-4b: default synthesis migration. RFC-0014 §6 + RFC-0015 §3.2 migration fields are derived from PR-4b's outputs. |

## On the public RFC-0013 status

The `docs/rfc-status.md` change includes a note:

> RFC-0013 §9 acceptance criteria are now **technically covered** by
> the implementation series (PR-1 / PR-2 / PR-2a / PR-3 / PR-4 /
> PR-4b), plus the filing of RFC-0014 and RFC-0015 (this update).
> However, RFC-0013 is **not** promoted to `Accepted` or
> `Implemented` here. The public status remains `Draft` until
> external review and approval ratifies the implementation.

Per the public status policy:

> The public-facing status remains conservative: RFC-0013
> implementation acceptance criteria are technically covered;
> final status promotion requires external review.

The status note in `docs/rfc-status.md` matches this wording.

## What happens next (NOT in this PR)

A future Phase 3 may file implementation RFCs for
Card v2 and Trace v2 in kdna-studio-core, and may file a Phase 2/3
RFC for the at-home / production-policy RFCs (k-dna registry trust,
marketplace, etc.). PR-5 (atomspeak) is also a separate workstream.
None of these are in this PR.

## Governance

- This PR follows the real PR flow (feature branch, push, PR,
  admin merge). No direct push to `main`.
- PR title and description clearly limit scope to "Phase 2: file
  RFC-0014 / RFC-0015 Drafts".
- The PR description will explicitly state:
  - "no review submissions; admin merge only" (if no reviews).
  - "no workflow runs; local validation only" (the aikdna/kdna meta
    repo's CI does not run on Draft filings; local grep checks only).

## References

- RFC-0013 §7: declares RFC-0014 / RFC-0015 as companion Drafts
- RFC-0013 §9: acceptance criteria, now all covered after this PR
- PR-1 to PR-4b: implementation evidence (see §"Dependency evidence")
- RFC-0013 implementation scope: Phase 2 RFC-0014 / RFC-0015 filing
- lab (private) PR-4 audit note: `docs/audits/pr-4-acceptance.md`
- lab (private) PR-4b audit note: `docs/audits/pr-4b-acceptance.md`
- aikdna/kdna-studio-core PR-3 audit note: `docs/audits/pr-3-acceptance.md` (PR-2 debt)
- aikdna/kdna PR-2a audit note: `docs/audits/pr-2-acceptance.md`
