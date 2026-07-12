# KDNA Bundle Conflict Resolution Specification

**Status:** Active design note for the current CLI conflict analyzer
**Related:** RFC #148 §3, `composition.policy.json`
**Used by:** `kdna validate --bundle` and explicit multi-asset tooling

---

## Scope

This document defines how card-level conflicts are detected and resolved when
two or more KDNA components are composed into a Bundle. It is the design
contract for:

- `kdna validate --bundle` static analysis warnings
- The Bundle manifest `priority` field semantics
- Runtime consumers that load a Bundle and encounter conflicting guidance

**Out of scope:**

- Single-asset validation — see `kdna validate <file.kdna>`
- Cluster-level governance — see `SPEC.md §13.5` and `composition.policy.json`
- Conflict resolution at inference time — that is the runtime consumer's
  responsibility once the Bundle is loaded

---

## Definitions

- **Bundle**: A composition of two or more `.kdna` components loaded together
  as a single judgment context. The top-level container is `kdna.bundle.json`.
  See RFC #148.
- **Component**: A single `.kdna` asset within a Bundle, identified by
  `{scope}/{name}@{version}`.
- **Bundle manifest**: The `kdna.bundle.json` file that declares `components[]`,
  optional `priority[]`, and an optional `conflict_policy`.
- **Card**: A single typed judgment unit within a component (axiom, boundary,
  term, etc.).
- **ID clash**: Two components that declare cards with the same `id` string
  (before namespace scoping).
- **Semantic conflict**: Two cards with different IDs but contradictory
  judgment content — for example, a `banned_term` card in component A and
  another in component B that ban the same term but prescribe different
  `replace_with` values.
- **Priority**: A component-level integer in the bundle manifest (`priority: 1`
  = highest precedence; `priority: 99` = lowest). Components at the same
  priority level are unordered — any card conflict at the same priority level
  is a WARNING rather than being auto-resolved silently.

---

## Card ID Scoping in a Bundle

Card IDs are unique within a single component but MAY clash across components.
A Bundle consumer MUST scope card IDs using the format:

```
{component_id}:{original_card_id}
```

For example, `@aikdna/writing@1.0.0:ax_001` and `@aikdna/sales@2.0.0:ax_001`
are two distinct cards in the Bundle — the scoped IDs do not clash.

ID scoping prevents false positives on ID clash. It does NOT prevent semantic
conflicts between cards with different IDs but contradictory content. Per-type
conflict triggers below define when semantic conflicts apply.

---

## Priority Rules

1. Lower priority number wins (1 > 2 > 99).
2. Components at the same priority level MUST NOT be auto-resolved — the
   validator emits a WARNING and surfaces both values.
3. `risk_wins` overrides the priority order for `boundary`, `risk`, and
   `banned_term` card types — the more restrictive interpretation always wins
   regardless of declared priority.
4. If no priority is declared in the bundle manifest, all components are
   treated as equal priority (WARNING on any conflict).

---

## Per-Card-Type Merge and Conflict Rules

The table below defines, for each card type:

- **Merge strategy** — how to combine cards from multiple components into a
  single Bundle context
- **Conflict trigger** — what the validator checks
- **Severity** — how a detected conflict is classified
- **Default resolution** — how the conflict is resolved when it exists

| Card type | Merge strategy | Conflict trigger | Severity | Default resolution |
|-----------|---------------|------------------|----------|--------------------|
| `axiom` | union (all cards in scope) | Same scoped `id` in two components; OR contradictory `failure_risk` on the same situation | WARNING | `priority_wins`; equal priority → surface |
| `boundary` | `risk_wins` | Overlapping `scope` with contradictory `out_of_scope` content | WARNING | more restrictive `out_of_scope` wins |
| `misunderstanding` | union | Same `wrong` text across components with different `correct` text | WARNING | `priority_wins` |
| `risk` | `risk_wins` (union; higher severity wins) | Same `id` after descoping, OR same `name` with different `mitigation` | WARNING | more restrictive mitigation wins |
| `aesthetic` | union | Same `name` with different `description` or `one_sentence` | INFO | `priority_wins` |
| `scenario` | union | Same scoped `id` in two components | WARNING | `priority_wins` |
| `case` | union | Same scoped `id` in two components | INFO | `priority_wins` |
| `stance` | union | Same `statement` text across components | WARNING | surface |
| `framework` | union | Same `name` with different `steps` array | WARNING | `priority_wins` |
| `term` | `priority_wins` | Same `term` string with different `definition` | **ERROR** | `priority_wins` required; equal priority → no auto-resolution |
| `banned_term` | `risk_wins` (union — all bans apply) | Same `term` with different `replace_with` | WARNING | emit both `replace_with` suggestions; neither suppressed |
| `reasoning` | union | Same scoped `id` in two components | INFO | `priority_wins` |
| `self_check` | union | Same `question` text across components | WARNING | surface |
| `ontology` | surface | Two components declare overlapping concept names with contradictory `essence` | WARNING | surface — no auto-resolution |
| `evolution_stage` | union | Same `name` across components | INFO | `priority_wins` |
| `pattern` | union | Same scoped `id` in two components | INFO | `priority_wins` |

**Judgment card types** (`axiom`, `boundary`, `risk`, `aesthetic`) are Human
Lock protected. A conforming validator MUST include their conflict entries in
the output report even when a `priority` is declared — the intent is
auditability, not blocking. The presence of a priority does not suppress the
conflict entry; it only sets the `resolution` and `winning_component` fields.

---

## Domain-Level Fields (Not Typed Cards)

The following fields live in `KDNA_Core.json`, not in the typed card catalog.
They follow special rules in a Bundle:

### `worldview`

One `worldview` object per component. In a Bundle, each component's
`worldview` is preserved independently with source attribution (per SPEC
§13.8). The validator SHOULD emit a WARNING if two components declare
`worldview.default_assumption` values that appear contradictory (heuristic:
opposite polarity on the same topic). No auto-resolution. Always surface.

### `value_order`

One ordered list per component. The validator SHOULD emit a WARNING if two
components declare `value_order` arrays that rank the same value at
contradictory positions (e.g., component A ranks "speed" first, component B
ranks "care" first). No auto-resolution. Always surface.

### `judgment_role`

One `judgment_role` string per component. The validator SHOULD emit a WARNING
if two components declare `judgment_role` strings with overlapping authority
(heuristic: string similarity ≥ 0.8 on the role description). Always surface.

### `composition.policy.json`

If the Bundle root includes a `composition.policy.json`, its `conflict` rules
override the defaults in the Per-Card-Type table above. The policy file is
authoritative for enterprise and governance clusters.

---

## Severity Definitions

| Severity | Meaning | `kdna validate --bundle` behavior |
|----------|---------|------------------------------------|
| ERROR | Irreconcilable conflict; the Bundle cannot be safely loaded | exits 1; conflict listed in `errors[]` |
| WARNING | Resolvable conflict; priority applies; author should review | exits 0; conflict listed in `warnings[]` |
| INFO | Informational; no action required | exits 0; conflict listed in `info[]` (omitted unless `--verbose`) |

A Bundle with zero ERRORs and one or more WARNINGs is considered valid for
loading. The loader MAY surface WARNINGs to the user at load time.

---

## Conflict Report Format

Each conflict entry in the `kdna validate --bundle` JSON output MUST follow
this shape:

```jsonc
{
  "conflict_type": "term_conflict",   // one of the five types from SPEC §13.5
  "severity": "ERROR",                // ERROR | WARNING | INFO
  "component_a": "@aikdna/writing@1.0.0",
  "component_b": "@aikdna/sales@2.0.0",
  "card_type": "term",
  "card_id_a": "@aikdna/writing@1.0.0:term_clarity",
  "card_id_b": "@aikdna/sales@2.0.0:term_clarity",
  "conflicting_field": "definition",
  "resolution": "priority_wins",      // priority_wins | risk_wins | surface | none
  "winning_component": null,          // null = unresolvable; string = winning component id
  "note": "Same term 'clarity' defined differently. Manual review required."
}
```

`conflict_type` MUST be one of the five types defined in `SPEC.md §13.5`:

| `conflict_type` | Applies to |
|-----------------|------------|
| `value_conflict` | `axiom`, `worldview`, `value_order`, `stance` |
| `term_conflict` | `term`, `banned_term`, `ontology` |
| `risk_conflict` | `risk`, `boundary`, `axiom` (when `failure_risk` conflicts) |
| `stance_conflict` | `stance`, `judgment_role` |
| `framework_conflict` | `framework`, `scenario`, `reasoning` |

---

## Conflict Counts in the Summary

The top-level `kdna validate --bundle` output MUST include a `conflicts`
summary object alongside the per-conflict `errors[]`, `warnings[]`, and
`info[]` arrays:

```jsonc
{
  "overall_valid": true,
  "conflicts": {
    "error_count": 0,
    "warning_count": 3,
    "info_count": 1
  },
  "errors": [],
  "warnings": [ /* ... */ ],
  "info": [ /* ... */ ]
}
```

---

## Implementation Note

Implementors MUST:

1. Parse the bundle manifest's `components[]` and load each component's card
   catalog through the current CBOR payload reader.
2. For each card type in the Per-Card-Type table, apply the Conflict Trigger
   check across all component pairs.
3. Apply the domain-level field checks (`worldview`, `value_order`,
   `judgment_role`).
4. Emit a conflict entry for each detected conflict using the Conflict Report
   Format defined above.
5. Exit with the appropriate code per the Severity Definitions table.

`kdna validate --bundle` accepts the supported bundle shape, validates
component resolution, and applies the conflict analysis defined here.

---

## Changelog

- 2026-06-28: Initial RFC #148 §3 design contract.
- 2026-07: Removed internal delivery references and aligned the note with the
  current CLI surface.
