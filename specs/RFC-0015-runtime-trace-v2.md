# RFC-0015: Runtime Trace Spec v2

**Status:** Draft
**Proposed:** 2026-06-16
**Authors:** KDNA Maintainers
**Supersedes:** (none — extends `docs/kdna-trace.md` v1)
**Related:**
- RFC-0013 (`specs/RFC-0013-judgment-asset-lifecycle.md`) — the
  lifecycle that introduces SAG, TC, IMM
- RFC-0014 (`specs/RFC-0014-kdna-card-v2.md`) — Card v2 (companion
  RFC; the Card and Trace v2 proposals are designed together)
- `docs/kdna-trace.md` — kdna trace command (Implemented; **not
  replaced** by this RFC)
- `specs/judgment-trace-schema.json` (existing)
- `specs/evidence-trace.schema.json` (existing)
- the E2E test the E2E test the E2E test the E2E test lab (private) PR (PR-4 lifecycle smoke)
- the E2E test the E2E test the E2E test the E2E test lab (private) PR (PR-4b default synthesis migration)

---

## Abstract

RFC-0013's lifecycle emits trace events at every stage from
S1_source_intake through S11_eval. PR-4 and PR-4b together
demonstrated that 11 (PR-4) and 6 (PR-4b) trace events are
sufficient to audit a domain's lifecycle end-to-end, and that
each event must carry `sag_version` and `tc_status` so a consumer
can read any single event and know which SAG/TC was governing
the domain at the time.

RFC-0015 formalizes the runtime trace event shape that PR-4 and
PR-4b proved, **without** changing the on-disk format of the
existing `docs/kdna-trace.md` command or the existing
`specs/judgment-trace-schema.json`. The existing trace command and
its reader remain valid; v2 adds **lifecycle** trace events on top
of the existing **judgment-call** trace events.

This RFC is **detail-schema only**. It does not re-litigate the
lifecycle architecture, the WorkPack boundary, or the
anti-monolithic principle.

---

## 1. Motivation

PR-4 and PR-4b together produced two real-world trace event
streams:

- **PR-4 (explicit SAG/TC smoke)** — 11 lifecycle trace events
  covering S1..S11 for a hand-written fixture, each enriched with
  `sag_version: "sag_code_review_2026_06_16"` and
  `tc_status: "locked"`.
- **PR-4b (default synthesis migration smoke)** — 6 lifecycle
  trace events covering S1..S6 (synthesize, lock, strict-compile,
  payload-check, eval), each enriched with
  `sag_version: "sag_synth_<domain>_<hash>"` and
  `tc_status: "synthesized"` or `"locked"` depending on the
  stage.

Both streams agreed on a minimum set of fields per event:
`trace_id`, `timestamp`, `stage`, `domain_id`, `kdna_version`,
`sag_version`, `tc_status`, `payload`. PR-4b additionally required
migration-specific fields (`migration_mode`, `synthesis_status`,
`lock_status`, `runtime_payload_leaked`).

These two streams are the basis for the v2 spec. The v1 trace
command (`docs/kdna-trace.md`) is **not** replaced; it remains the
read-side API for the judgment-call trace, and v2 lifecycle
events are a separate stream that lives next to it.

---

## 2. Boundary: what Runtime Trace v2 MUST NOT carry

The following authoring-time objects are **never** embedded in
any v2 trace event, in any form:

- The full `source_authority.json` (SAG) object. Only the SAG
  identity (`sag_id`, stored as `sag_version`) is carried.
- The full `truth_charter.json` (TC) object. Only the TC's
  `tc_status` value is carried.
- The full `module_manifest.json` (IMM) object. Not present on the
  trace at all.

These objects **may** appear in the provenance report (already
produced by kdna-studio-core) and in audit sidecar logs, but NOT on
runtime trace events. The trace is the highest-volume, lowest-
latency channel; a v2 trace that embedded the full SAG/TC would
defeat PR-3's compile-time boundary and would let any consumer
recover authoring-time details from runtime telemetry.

**Test for the boundary:** if removing a field from a v2 trace
event would force a consumer to lose the ability to detect a
governance change, the field belongs on the Card (RFC-0014), not
on the trace.

---

## 3. v2 trace event shape (additive over v1)

v1 trace events continue to be produced and consumed by
`docs/kdna-trace.md` and `specs/judgment-trace-schema.json`. RFC-0015
adds a parallel `lifecycle_trace.jsonl` stream with the shape
below:

```json
{
  "trace_id": "trace_<stage>_<yyyy_mm_dd>_<rand>",
  "timestamp": "ISO-8601",
  "stage": "S<n>_<name>",
  "domain_id": "@aikdna/code_review",
  "kdna_version": "0.8.0-draft.1",
  "sag_version": "sag_<domain>_<yyyy_mm_dd>",
  "tc_status": "synthesized" | "draft" | "locked" | "deprecated",
  "payload": { ... }
}
```

### 3.1 Required fields (v2 minimum)

| Field | Type | Required | Source of value |
|-------|------|----------|-----------------|
| `trace_id` | string | yes | `crypto.randomUUID()` or equivalent |
| `timestamp` | string (ISO-8601) | yes | event emission time, UTC |
| `stage` | enum (see §3.3) | yes | lifecycle stage the event represents |
| `domain_id` | string | yes | the domain this event describes |
| `kdna_version` | string | yes | the domain version being compiled/loaded |
| `sag_version` | string \| null | yes (or null if no SAG) | `sag_id` of the SAG governing this event, or `null` when no SAG was supplied |
| `tc_status` | string \| null | yes (or null if no TC) | `"synthesized"` / `"draft"` / `"locked"` / `"deprecated"` / `null` |
| `payload` | object | yes | stage-specific structured data; see §3.4 |

`payload` is **not** free-form. Each stage has a documented
payload schema (see §3.4). v1 free-form payloads are still
accepted by the existing v1 reader; v2 readers are encouraged to
validate the payload against the per-stage schema.

### 3.2 Migration-specific fields (added in v2)

For events that involve a migration (PR-4b path), the following
fields MUST be present alongside the v2 minimum:

| Field | Type | When |
|-------|------|------|
| `migration_mode` | enum (`"none"` / `"explicit"` / `"synthesized"`) | always |
| `synthesis_status` | enum (`"not_synthesized"` / `"synthesized"` / `"locked"`) | when migration_mode != "none" |
| `lock_status` | enum (`"not_locked"` / `"locked"` / `"synthesized_then_human_locked"`) | when a TC exists |
| `runtime_payload_leaked` | array of strings | always (empty array when clean) |

The `runtime_payload_leaked` field is a defensive assertion: the
trace event itself asserts that the SAG/TC/IMM were NOT included
in the runtime payload. A non-empty value is a smoke-failure
signal.

### 3.3 Lifecycle stage enum

The `stage` field is one of the following fixed values. The
ordering is the canonical 11-stage lifecycle (RFC-0013 §2):

```
S1_source_intake
S2_sag_load
S3_tc_load
S4_imm_load
S5_human_lock
S6_compile
S7_pack
S8_publish
S9_match
S10_load
S11_eval
```

A migration smoke emits a subset of these stages. The minimum
emission set per compile is `S6_compile` (always emitted), and
the migration-mode determines whether `S1..S5` are emitted by the
synthesizer (PR-4b) or by the explicit-authoring pipeline (PR-4).

### 3.4 Per-stage payload schema (informative)

| Stage | Required payload fields |
|-------|--------------------------|
| `S1_source_intake` | `source` (string): path or pointer to the source workspace |
| `S2_sag_load` | `sag_id` (string), `source_count` (int), `current_highest_count` (int) |
| `S3_tc_load` | `tc_id` (string), `tc_status` (string), `locked_by` (string or null) |
| `S4_imm_load` | `module_count` (int), `internal_module_count` (int), `reference_count` (int) |
| `S5_human_lock` | `total_cards` (int), `locked_cards` (int), `by` (string) |
| `S6_compile` | `strict_authority` (bool), `sag_status` (enum), `tc_status` (enum), `sag_errors` (int), `tc_errors` (int) |
| `S7_pack` | `file_count` (int), `payload_kdnab_digest` (string or null), `kdna_json_digest` (string or null) |
| `S8_publish` | `domain_id` (string), `version` (string), `registry_action` (string or null) |
| `S9_match` | `axioms_loaded` (int), `frameworks_loaded` (int), `terminology_loaded` (int), `trigger_signals` (array of strings) |
| `S10_load` | `contract` (string), `emit_kind` (string), `axioms_emitted` (int) |
| `S11_eval` | `trace_event_count` (int), `gate_status_combined` (string) |

The per-stage payload schemas are **informative** in this RFC.
A future implementation RFC may choose to formalize them as
JSON Schemas (analogous to `specs/judgment-trace-schema.json`).

---

## 4. v2 trace reader contract

A consumer that wants to read the v2 lifecycle stream should be
able to:

1. Identify the trace events for a specific `domain_id` and
   `kdna_version`.
2. Order them by `timestamp`.
3. Inspect `sag_version` and `tc_status` on any single event
   without reading the full SAG/TC object.
4. Detect a governance change between two events by watching for
   `sag_version` flips.
5. Detect a runtime payload leak by reading
   `runtime_payload_leaked`.

The existing `docs/kdna-trace.md` v1 reader does not need to
change to support v2. v2 readers are a separate concern (a
follow-up RFC will likely propose a `lab-trace` reader that
emits v2 lifecycle events).

---

## 5. Migration: coexistence with v1

v1 and v2 trace events are produced by **different parts** of the
toolchain:

- v1: `kdna trace` command (kdna-cli, line 47 of
  `docs/kdna-trace.md`). Records which KDNA domains were loaded by
  which agent for which task.
- v2: the compile / load / lifecycle pipeline (kdna-studio-core
  compile, lab smoke). Records which lifecycle stages
  occurred and which SAG/TC version was governing each.

The two streams are **independent**: a domain can have v1 events
without v2 events (a pre-RFC-0013 load), and vice versa. A
consumer that wants both must read both files.

The v2 stream is written to `lifecycle_trace.jsonl` next to
`trace.jsonl` (the v1 stream). Future tooling may consolidate the
two, but RFC-0015 does not require it.

---

## 6. Relationship to PR-4 and PR-4b

PR-4 and PR-4b are the source of truth for the v2 field shape.
The 11 events PR-4 emits, and the 6 events PR-4b emits, are the
v2 minimum field set plus per-stage payloads. The migration-
specific fields (`migration_mode`, `synthesis_status`,
`lock_status`, `runtime_payload_leaked`) are added in PR-4b and
formalized in this RFC.

A future kdna-studio-core release that adopts this RFC will emit
the same v2 fields. A future lab smoke that adopts this RFC
will assert the same v2 fields. Until those future releases
land, PR-4 and PR-4b remain the only producers and consumers of
v2 events.

---

## 7. Non-Goals (Restated for Clarity)

This RFC explicitly does **not**:

- ❌ Define a new implementation of the trace command. This RFC
  is **schema only**.
- ❌ Modify `docs/kdna-trace.md` (v1). v1 remains valid.
- ❌ Modify `specs/judgment-trace-schema.json`. v1 judgment-call
  trace schema remains valid.
- ❌ Modify the the E2E test lab (private) trace checker (`lab_trace_check.py (private)`).
  The checker is for v1 traces; v2 checker is a follow-up.
- ❌ Define an enterprise audit log. Enterprise audit is
  Governance track; v2 only adds per-event status fields.
- ❌ Define judgment-contamination detection. Contamination is
  Application track and depends on RFC-0015 + future Cluster
  Runtime RFC; out of scope here.
- ❌ Embed full SAG/TC/IMM in trace events. See §2.
- ❌ Define a new lifecycle stage enum entry. The 11 stages
  (S1..S11) are fixed in RFC-0013 §2; v2 does not add stages.

---

## 8. Acceptance Criteria

This RFC is considered **Accepted → Implemented** when:

1. A kdna-studio-core release emits the v2 lifecycle trace
   events.
2. A consumer (follow-up PR) can read the v2 events using only
   the v2 minimum field set.
3. The `migration_mode` / `synthesis_status` / `lock_status` /
   `runtime_payload_leaked` fields are exercised by a the E2E test lab (private)
   smoke (PR-4b already produces them).
4. v1 trace command (`docs/kdna-trace.md`) and v1 judgment-trace
   schema (`specs/judgment-trace-schema.json`) are **unchanged**
   and **still work** for existing consumers.
5. A consumer that wants the full SAG/TC/IMM cannot recover them
   from the v2 trace (the boundary in §2 holds).

---

## 9. References

- RFC-0013: `https://github.com/aikdna/kdna/blob/main/specs/RFC-0013-judgment-asset-lifecycle.md`
- RFC-0014: `https://github.com/aikdna/kdna/blob/main/specs/RFC-0014-kdna-card-v2.md`
- v1 trace command: `docs/kdna-trace.md`
- v1 judgment-trace schema: `specs/judgment-trace-schema.json`
- v1 evidence-trace schema: `specs/evidence-trace.schema.json`
- PR-1 (schemas): aikdna/kdna #86
- PR-3 (gates): aikdna/kdna-studio-core #3
- PR-4 (lifecycle smoke): the E2E test the E2E test the E2E test the E2E test lab (private) PR
- PR-4b (default synthesis): the E2E test the E2E test the E2E test the E2E test lab (private) PR
- the E2E test the E2E test the E2E test the E2E test lab (private) PR-4 audit note: `see the corresponding acceptance note (private)`
- the E2E test the E2E test the E2E test the E2E test lab (private) PR-4b audit note: `see the corresponding acceptance note (private)`
