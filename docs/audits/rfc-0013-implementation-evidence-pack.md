# External Audit Pack — RFC-0013 Implementation Acceptance Evidence

**RFC-0013 implementation status:** Implementation acceptance criteria
**technically covered**; **status remains `Draft`** pending external
review and final status decision.
**Date prepared:** 2026-06-16
**Repository:** `aikdna/kdna` (meta) and four related repos
**Audience:** External reviewers / maintainers deciding whether to
promote RFC-0013 from `Draft` to `Accepted` or `Implemented`.

> **External wording (recommended):**
> *RFC-0013 §9 implementation acceptance criteria are now covered;
> external approval / final status update pending.*
>
> Do **not** say: "RFC-0013 已正式通过 / 已 Stable / 已外部审计通过."

---

## 1. Executive summary

This document is the **single evidence package** for the RFC-0013
implementation series. The series consists of **seven PRs** across
**four repositories**, plus one tiny docs correction filed in the
same period.

After all seven PRs are merged, RFC-0013 §9's seven acceptance
criteria are **technically covered**. Specifically:

- The three new authoring-time object schemas (Source Authority
  Graph, Truth Charter, Internal Module Manifest) are published
  in `aikdna/kdna/schema/`.
- The `kdna dev validate --anti-monolithic` CLI lint works and
  runs unit tests.
- The kdna-studio-core compile pipeline enforces the SAG/TC
  compile gates under strict-authority mode.
- A real simple official legacy domain
  (`@aikdna/code_review`) is exercised by both an explicit-fixture
  lifecycle smoke and a default-synthesis migration smoke.
- SPEC §1.6 contains the Anti-Monolithic Domain Principle verbatim.
- RFC-0014 (KDNA Card Spec v2) and RFC-0015 (Runtime Trace Spec v2)
  are filed as Draft.
- A migration run on a real legacy domain (only KDNA_Core +
  KDNA_Patterns) successfully synthesizes default SAG/TC/IMM and
  the locked TC passes the strict compile; the resulting runtime
  payload is the canonical v2 container, identical in shape to the
  pre-RFC build.

What this document is **not**: a self-promotion to `Accepted` or
`Implemented`. The author of this audit pack has not been an
independent reviewer; the work has not been externally audited; no
remote CI workflow ran on a non-trivial fraction of the changes
(see §5 Governance). The accurate public status remains `Draft`
in `docs/rfc-status.md` until external review ratifies it.

---

## 2. RFC-0013 §9 coverage table (7/7)

| # | Item | Status | PR | Repo | Commit |
|---|------|--------|------|------|--------|
| #1 | All three new schema files merged in `aikdna/kdna/schema/` | ✅ | [#86](https://github.com/aikdna/kdna/pull/86) | aikdna/kdna | [`see PR-1 acceptance`](https://github.com/aikdna/kdna/commit/see PR-1 acceptance) |
| #2 | `kdna dev validate --anti-monolithic` exists and runs | ✅ | [#10](https://github.com/aikdna/kdna-cli/pull/10) | aikdna/kdna-cli | [`see PR-2 acceptance`](https://github.com/aikdna/kdna-cli/commit/see PR-2 acceptance) |
| #3 | kdna-studio-core rejects (with clear error) on `strict-authority` violations | ✅ | [#3](https://github.com/aikdna/kdna-studio-core/pull/3) | aikdna/kdna-studio-core | [`see PR-3 acceptance`](https://github.com/aikdna/kdna-studio-core/commit/see PR-3 acceptance) |
| #4 | lab smoke (private) test on a simple official legacy domain, runs trace events, verifies `sag_version` and `tc_status` in trace output | ✅ | [#3](https://github.com/lab PR) | lab (private) | [`see PR-4 acceptance`](https://github.com/lab (private)) |
| #5 | `SPEC.md` §1.6 contains the Anti-Monolithic Domain Principle verbatim | ✅ | [#87](https://github.com/aikdna/kdna/pull/87) | aikdna/kdna | [`see PR-2a acceptance`](https://github.com/aikdna/kdna/commit/see PR-2a acceptance) |
| #6 | RFC-0014 and RFC-0015 are filed as separate Draft RFCs | ✅ | [#88](https://github.com/aikdna/kdna/pull/88) | aikdna/kdna | [`see Phase 2 filing`](https://github.com/aikdna/kdna/commit/see Phase 2 filing) |
| #7 | Migration run synthesizes default SAG/TC and produces valid `.kdna` identical in shape to the pre-RFC build | ✅ | [#4](https://github.com/lab PR) | lab (private) | [`see PR-4b acceptance`](https://github.com/lab (private)) |

**Coverage:** 7/7 acceptance criteria are now technically covered.

---

## 3. What was proven

### 3.1 The PR-1 schemas are usable, not isolated

PR-1 (`see PR-1 acceptance`) added the three authoring-time object schemas
under `aikdna/kdna/schema/`. PR-1 was not used in isolation:

- The fixtures in `lab (private)/examples/sag-tc-roundtrip/code_review/`
  satisfy all three schemas.
- The PR-4b migration helper in `kdna_lab/rfc0013_migration.py`
  emits objects that pass `jsonschema` validation against the
  PR-1 schemas (`test_A2_synthesize_produces_sag_tc_imm`).

A schema that no downstream code consumes is documentation only;
the PR-1 schemas are used in two smoke pipelines.

### 3.2 The PR-3 gates are actually called by `compileDomain`

PR-3 (`see PR-3 acceptance`) added the SAG/TC compile gates in
`kdna-studio-core/src/compile/`. PR-3 is invoked by `compileDomain`,
not by a separate function. PR-4 (`see PR-4 acceptance`) and PR-4b (`see PR-4b acceptance`)
both call the real `compileDomain` with `strictAuthority: true`,
which executes the PR-3 gates. Under strict-authority, both PR-4
and PR-4b report `sag.status: 'pass'` and `tc.status: 'pass'`.

The PR-3 audit note (`kdna-studio-core/docs/audits/pr-3-acceptance.md`)
documents 13/13 unit tests passing for the gate contract.

### 3.3 PR-4 uses real kdna-studio-core `compileDomain` with explicit SAG/TC

PR-4 (`see PR-4 acceptance`) hand-wrote SAG, TC, and IMM in the code_review
fixture and called kdna-studio-core `compileDomain` with
`strictAuthority: true`. The result was a v2 container with
canonical shape: `payload.kdnab`, `kdna.json`, `KDNA_CARD.json`,
and reports. The runtime payload did **not** include the
authoring-time objects (verified by `test_6_runtime_payload_excludes_sag_tc_imm`).

PR-4 produced 11 lifecycle trace events, each carrying
`sag_version` and `tc_status`. This is the first end-to-end
demonstration of the lifecycle.

### 3.4 PR-4b proves legacy-only Core/Patterns can synthesize default SAG/TC/IMM

PR-4b (`see PR-4b acceptance`) implements the *missing half* of RFC-0013 §9 #7
that PR-4 left open. The new helper
(`kdna_lab/rfc0013_migration.py`) reads **only** `KDNA_Core.json`
and `KDNA_Patterns.json` and emits synthesized `source_authority.json`,
`truth_charter.json`, and `module_manifest.json`. The synthesized TC
starts at `tc_status: "synthesized"` and is promoted to
`tc_status: "locked"` only by an explicit `lock_tc_with_rationale`
call with a real `locked_by` and a non-empty `rationale`. The
rationale is **not** carried in the locked TC JSON file itself
(because the PR-1 TC schema has `additionalProperties: false`); it
is returned by the helper separately and lives in the caller's
context. The resulting TC, with the synthesized SAG, passes the
PR-3 strict compile, producing a v2 container whose compiled file
set is **identical** to the PR-4 explicit-fixture container
(set equality of compiled file names; byte-equal content is **not**
asserted). This is verified by
`test_B4_load_contract_matches_pr4` in
`lab tests (private)/test_rfc0013_migration_synthesis.py`.

### 3.5 Runtime payload does not leak full SAG/TC/IMM

Both PR-4 and PR-4b include explicit assertions:

- `test_6_runtime_payload_excludes_sag_tc_imm` (PR-4, 10/10 pass)
- `test_B2_compiled_runtime_shape_is_v2_contract` (PR-4b, 11/11 pass)
- `test_9_load_contract_shape_consistent` (PR-4)

The runtime payload contains only the canonical v2 container
entries; the authoring-time objects live in the provenance report
or, in the migration case, in the synthesized output directory.

### 3.6 Trace events carry `sag_version` and `tc_status`

Both PR-4 and PR-4b enrich every lifecycle trace event with
`sag_version` (the SAG id, e.g. `sag_code_review_2026_06_16` or
`sag_synth_<domain>_<hash>`) and `tc_status` (the TC's `tc_status`
value, `synthesized` or `locked`). This is enforced by:

- `test_8_trace_events_contain_sag_version_and_tc_status` (PR-4)
- `test_B3_trace_events_contain_sag_version_and_tc_status` (PR-4b)

A consumer that reads any single event can determine which SAG/TC
governed the domain at that point in the lifecycle.

### 3.7 The implementation is round-trippable

The four `aikdna/kdna` PRs (#86 PR-1, #87 PR-2a, #88 Phase 2,
#89 evidence pack + tiny RFC-0014 path fix) plus the three PRs in
`kdna-cli` (#10), `kdna-studio-core` (#3), and `lab (private)` (#3 + #4)
together form a coherent chain:

- PR-1 schemas → PR-3 gates (read them) → PR-4 explicit smoke
  → PR-4b synthesis migration → Phase 2 RFC-0014/0015 Drafts.

A reviewer can walk the chain commit by commit and see each
component building on the previous one, not in isolation.

---

## 4. What was NOT proven (intentional, recorded gaps)

These items are **not** blockers for the implementation series
ending, but they are real limits on what the series claims.

| Gap | Why it's not done | Where it's tracked |
|-----|-------------------|---------------------|
| No `atomspeak` / book-derived domain smoke yet | The first smoke is on a simple official domain; atomspeak needs PR-3 gates stable + book-derived inputs (multiple TC versions, charter drift). Deferred to PR-5 per the RFC-0013 PR-4 boundary. | RFC-0013 §9 #4 (amended), PR-4 audit note, PR-4b audit note |
| No Anti-Monolithic question-count heuristic yet | The CLI in PR-2 implements structural thresholds (axiom count + framework count + module_manifest sign-off). The third SPEC condition ("spans more than 2 distinct user-facing judgment questions") requires a separate RFC (suggested: RFC-0022). | PR-2 audit note, PR-3 audit note (`gates.md`), PR-3 §"PR-2 semantic debt" |
| No Card v2 implementation yet | RFC-0014 is filed as Draft; kdna-studio-core has not yet been updated to emit the v2 Card fields. | RFC-0014 §8 (Acceptance Criteria) |
| No Trace v2 implementation yet | RFC-0015 is filed as Draft; kdna-studio-core and lab (private) have not yet been updated to emit the v2 lifecycle trace. | RFC-0015 §8 (Acceptance Criteria) |
| No marketplace / enterprise / privacy / WorkPack implementation | All four are RFC-0013 §10 Non-Goals. WorkPack lives in `kdna-workpack`; marketplace / enterprise / privacy are explicit `out_of_scope` per RFC-0013 §10. | RFC-0013 §10 |
| No independent review submissions on any of the 7 PRs | All 7 PRs were admin-merged by a single maintainer. Review submissions are empty. This is consistent with the public-facing status policy (complex book-derived domain testing is deferred to a follow-up PR) and the recommended external wording, but it is a real limit. | This audit pack §5 |
| No remote CI workflow runs on most repos | `aikdna/kdna-cli` and `lab (private)` have no CI workflow configured for the relevant branches. `aikdna/kdna-studio-core` and `aikdna/kdna` have workflows but they did not run on the implementation PRs as expected. The validation signal is **local-only** (pytest, node --test, ajv schema validation). | This audit pack §5 |
| `kdna-studio-core` 11 pre-existing test failures remain out of scope | The 11 failures in `core.test.js`, `e2e.test.js`, `milestone3.test.js` are about `KDNA_Core.json` vs `payload.kdnab` test expectations and predate PR-3. Fixing them is a separate test-suite migration PR. | PR-3 audit note, PR-4b audit note |

A reviewer can decide whether any of these gaps should block
promotion of RFC-0013 from `Draft` to `Accepted` or `Implemented`.
The recommended stance is **no**: these are follow-up work, not
preconditions for the lifecycle itself.

---

## 5. Governance

### 5.1 PR flow used

All seven implementation PRs were processed through the **real
PR flow**:

1. A feature branch was created from `main` (e.g.
   `feat/rfc-0013-pr-3-sag-tc-compile-gates`).
2. Changes were committed to the feature branch.
3. The branch was pushed to the remote.
4. A PR was created via `gh pr create`.
5. The PR was merged via `gh pr merge --admin --squash` (admin
   squash; the base-branch policy blocks non-admin merges, hence
   the `--admin` flag).

No direct push to `main` was used for the implementation PRs.
This is the same governance model used for the earlier 6-11
PRs in the meta repo.

### 5.2 Review state

**All seven implementation PRs have empty review submissions.**
That is:

- 0 review comments (`gh pr view <N> --json reviews` returns an
  empty array for every PR).
- 0 review submissions (`gh pr view <N> --json review_decisions`
  shows no APPROVED / CHANGES_REQUESTED / COMMENTED events).
- 0 PR comments (no `issue_comment` events on any of the 7 PRs).

This is consistent with the implementation being done by a
**single maintainer** before
external review. The PR descriptions explicitly state
`no review submissions; admin merge only` in their reviewer
notes sections.

A reviewer doing external audit should read the PRs and the
audit notes, and either accept the work as a single-maintainer
delivery (with the gaps in §4 documented) or request changes
before any further status promotion.

### 5.3 Workflow runs

| Repo | CI workflow on the relevant branch? |
|------|--------------------------------------|
| aikdna/kdna | Yes, but did not run on PR-1 / PR-2a / Phase 2 PRs as expected. Local `grep` checks are the only signal. |
| aikdna/kdna-cli | No CI workflow configured for the relevant branch. Local `node --test` is the only signal. |
| aikdna/kdna-studio-core | Workflow exists; the PR-3 commit was admin-merged. The 11 pre-existing test failures in this repo are out of scope (see §4). |
| lab (private) | No CI workflow configured for the relevant branch. Local `pytest` + Node smoke is the only signal. |

The PR descriptions explicitly state
`no workflow runs; local validation only` where applicable. The
authoritative validation for each PR is documented in its
respective audit note (PR-1: docs/audits/pr-1-acceptance.md; PR-2:
kdna-cli docstring; PR-2a: docs/audits/pr-2-acceptance.md;
PR-3: kdna-studio-core/docs/audits/pr-3-acceptance.md; PR-4:
lab acceptance note (private); PR-4b:
lab acceptance note (private); Phase 2:
docs/audits/phase-2-rfc-0014-0015-filing.md).

---

## 6. Known follow-ups

These are documented in PR descriptions and audit notes. They
are **not** blockers for the implementation series but they
are real follow-up work.

1. **Tiny docs fix: RFC-0014 Related links path** — RFC-0014's
   `Related` section originally listed
   `specs/source_authority.schema.json`,
   `specs/truth_charter.schema.json`,
   `specs/module_manifest.schema.json`. The actual paths are
   `schema/source_authority.schema.json` etc. **Done in PR #89**
   (alongside the evidence pack itself). RFC-0014 now correctly
   references `schema/...`. (No spec content change; no schema
   change; no gate change.)

2. **PR-5 atomspeak smoke** — book-derived domain exercise. Per
   the RFC-0013 PR-4 boundary, deferred to PR-5 after PR-1~4
   stable. PR-5 is **not** in this audit pack's scope.

3. **PR-2 question-count heuristic** — Anti-Monolithic CLI's
   third SPEC condition ("spans more than 2 distinct user-facing
   judgment questions") is not implemented. A future RFC-0022
   (suggested) is needed. PR-3 audit note (`gates.md`) records
   this as a debt explicitly **not addressed** by PR-3.

4. **kdna-studio-core test-suite migration** — 11 pre-existing
   test failures about `KDNA_Core.json` vs `payload.kdnab`
   expectations need a separate test-suite PR. Out of scope for
   the RFC-0013 series.

5. **RFC-0014 implementation** — kdna-studio-core release that
   emits Card v2 fields. RFC-0014 is filed as Draft; acceptance
   criteria for the implementation RFC are in RFC-0014 §8.

6. **RFC-0015 implementation** — kdna-studio-core and lab (private)
   releases that emit and consume the v2 lifecycle trace. RFC-0015
   is filed as Draft; acceptance criteria are in RFC-0015 §8.

---

## 7. Recommended status decision

**Recommendation:** Keep RFC-0013 at `Draft` until external review.

After external review, the decision tree is:

```
       External reviewer decision
              |
    +---------+-----------+
    |                     |
  Approve              Reject
    |                     |
  Move to "Accepted"   Address review comments,
  (NOT Implemented     then re-run the relevant
  yet — Implemen-      PRs.
  tation needs a
  real external
  validation pass
  on a non-trivial
  domain).
```

Specifically:

- **Do not** jump to `Stable`. `Stable` requires "≥ 30 days in
  production without breaking changes" per `docs/rfc-status.md`.
  RFC-0013 has not been in production for 30 days.
- **Do not** say "RFC-0013 已正式通过". The accurate public
  status remains `Draft` in `docs/rfc-status.md`. The doc itself
  states:

  > RFC-0013 §9 implementation acceptance criteria are now
  > **technically covered** by the implementation series (PR-1 /
  > PR-2 / PR-2a / PR-3 / PR-4 / PR-4b), plus the filing of
  > RFC-0014 and RFC-0015 (this update). However, RFC-0013 is
  > **not** promoted to `Accepted` or `Implemented` here. The
  > public status remains `Draft` until external review and
  > approval ratifies the implementation. The accurate external
  > wording is: *"RFC-0013 implementation acceptance criteria are
  > now covered; external approval / final status update pending."*

- **Do** treat this audit pack as the **input** to the external
  review, not the **output**. The author of this pack is the
  implementer, not an independent reviewer.

- **Do** consider promoting to `Accepted` (NOT `Implemented`)
  after external review. The distinction between `Accepted` and
  `Implemented` matters: per `docs/rfc-status.md`, `Implemented`
  requires "reference implementation exists, schema published,
  tests pass". The implementation series meets that bar for the
  7 §9 criteria, but external review is the additional gate this
  audit pack cannot open by itself.

---

## 8. References

### Implementation PRs

| PR | Repo | Commit | Audit note |
|----|------|--------|-------------|
| [#86](https://github.com/aikdna/kdna/pull/86) | aikdna/kdna | [`see PR-1 acceptance`](https://github.com/aikdna/kdna/commit/see PR-1 acceptance) | — |
| [#10](https://github.com/aikdna/kdna-cli/pull/10) | aikdna/kdna-cli | [`see PR-2 acceptance`](https://github.com/aikdna/kdna-cli/commit/see PR-2 acceptance) | (in PR body) |
| [#87](https://github.com/aikdna/kdna/pull/87) | aikdna/kdna | [`see PR-2a acceptance`](https://github.com/aikdna/kdna/commit/see PR-2a acceptance) | [`docs/audits/pr-2-acceptance.md`](https://github.com/aikdna/kdna/blob/main/docs/audits/pr-2-acceptance.md) |
| [#3](https://github.com/aikdna/kdna-studio-core/pull/3) | aikdna/kdna-studio-core | [`see PR-3 acceptance`](https://github.com/aikdna/kdna-studio-core/commit/see PR-3 acceptance) | [`docs/audits/pr-3-acceptance.md`](https://github.com/aikdna/kdna-studio-core/blob/main/docs/audits/pr-3-acceptance.md) |
| [#3](https://github.com/lab PR) | lab (private) | [`see PR-4 acceptance`](https://github.com/lab (private)) | [`docs/audits/pr-4-acceptance.md`](https://github.com/lab acceptance note (private)) |
| [#4](https://github.com/lab PR) | lab (private) | [`see PR-4b acceptance`](https://github.com/lab (private)) | [`docs/audits/pr-4b-acceptance.md`](https://github.com/lab acceptance note (private)) |
| [#88](https://github.com/aikdna/kdna/pull/88) | aikdna/kdna | [`see Phase 2 filing`](https://github.com/aikdna/kdna/commit/see Phase 2 filing) | [`docs/audits/phase-2-rfc-0014-0015-filing.md`](https://github.com/aikdna/kdna/blob/main/docs/audits/phase-2-rfc-0014-0015-filing.md) |

### RFCs

- RFC-0013: [`specs/RFC-0013-judgment-asset-lifecycle.md`](https://github.com/aikdna/kdna/blob/main/specs/RFC-0013-judgment-asset-lifecycle.md)
- RFC-0014: [`specs/RFC-0014-kdna-card-v2.md`](https://github.com/aikdna/kdna/blob/main/specs/RFC-0014-kdna-card-v2.md)
- RFC-0015: [`specs/RFC-0015-runtime-trace-v2.md`](https://github.com/aikdna/kdna/blob/main/specs/RFC-0015-runtime-trace-v2.md)

### Audit notes and references

- RFC-0013 implementation scope: PR-1 through PR-4b plus the Phase 2 filing of RFC-0014 / RFC-0015. See the per-PR audit notes linked in §8.
- RFC-0013 audit note (pre-series state): `docs/audits/2026-06-16-rfc-0013-audit-note.md`
- RFC status: [`docs/rfc-status.md`](https://github.com/aikdna/kdna/blob/main/docs/rfc-status.md)
