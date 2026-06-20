# Migration Guide: v2.0 → v1.0-rc

> **Audience:** Domain authors migrating from pre-v1.0 KDNA formats to the v1.0-rc specification.
>
> **Breaking changes summary (v1.0-rc):**
> - `evidence_type` changed from `string` to `array` — wrap existing values
> - Quality badge thresholds raised: tested ≥10 (was ≥3), validated ≥30 (was ≥10)
> - `source_mode` is strongly recommended (defaults to `"blank"` if absent)
> - Merged single-file JSON format is rejected
> - `kdna_spec` and singular `language` are rejected

---

## Field Renames

| v2.0 / Legacy | v1.0-rc | Notes |
|---------------|---------|-------|
| `solved_problem` (axiom) | `why` | Renamed for clarity. Content is the same: why this axiom matters. |
| `kdna_spec` (manifest) | `spec_version` | v1.0-rc uses `spec_version`. `kdna_spec` is rejected. |
| `language` (singular) | `languages` (array) | Now accepts multiple language codes. `default_language` is separate. |

## Type Changes

| Field | v2.0 / Legacy | v1.0-rc | Impact |
|-------|---------------|---------|--------|
| `evidence_type` | `"string"` (single value) | `["array", "of", "strings"]` | Wrap your value: `"practice_patterns"` → `["practice_patterns"]` |
| `languages` | `"string"` | `["array", "of", "strings"]` | Wrap your value: `"en"` → `["en"]` |

## New Required Fields

### Manifest (`kdna.json`)

| Field | Type | Description |
|-------|------|-------------|
| `source_mode` | `"blank"` \| `"kdna_asset"` \| `"source_folder"` | How this domain was originally created. `"blank"` = Studio from scratch; `"kdna_asset"` = forked; `"source_folder"` = legacy migration. |

### Axiom (`KDNA_Core.json`)

The strict schema requires these fields per axiom — previously optional in v2.0:
- `applies_when`
- `does_not_apply_when`
- `failure_risk`
- `confidence`

## ID Namespace Rules

All `id` fields across all KDNA JSON files MUST be globally unique within a domain:

- `AX-001` in `KDNA_Core.json` → cannot be reused as `M-001` in `KDNA_Patterns.json`
- Use consistent prefixes: `AX-` for axioms, `ON-` for ontology, `FW-` for frameworks, `M-` for misunderstandings, etc.
- The v1.0-rc strict validator checks cross-file uniqueness; pre-v1.0 validators did not.

## Quality Badge Thresholds

| Badge | v2.0 Threshold | v1.0-rc Threshold |
|-------|---------------|-------------------|
| `tested` | >= 3 evals | >= 10 evals |
| `validated` | >= 10 evals | >= 30 evals |

All badges require `signature`, `authoring` provenance, and `human_confirmed: true` in the manifest.

## Format Migration

| From | To |
|------|-----|
| Merged single-file JSON (`.kdna` v0.x) | ZIP container with internal domain tree |
| Dev source directory | Compile via `kdna-studio` into trusted `.kdna` asset |
| Manual JSON files | Studio project → compile → export |

The merged single-file JSON format is rejected in v1.0-rc. Conforming tools MUST reject it.

## Tooling Migration

| Old Command | Replacement |
|-------------|-------------|
| `kdna init <name>` | `kdna-studio create <name>` (trusted) or `kdna dev scaffold <name>` (dev-only) |
| `kdna export` | `kdna-studio export` |
| `kdna eval` | `kdna verify --judgment` |
| `kdna project` | `kdna-studio` CLI |
| `kdna create` skill | Removed. Use `kdna-studio` CLI directly. |

## Quick Migration Checklist

1. [ ] Rename `solved_problem` → `why` in all axioms
2. [ ] Rename `kdna_spec` → `spec_version` in manifest
3. [ ] Rename `language` → `languages` (array) + add `default_language`
4. [ ] Change `evidence_type` from string to array
5. [ ] Add `source_mode` to manifest
6. [ ] Add `applies_when`, `does_not_apply_when`, `failure_risk`, `confidence` to all axioms
7. [ ] Ensure all `id` values are globally unique across files
8. [ ] Add `signature` and `authoring` fields if badge >= tested
9. [ ] Run `kdna dev validate .` to catch structural issues
10. [ ] Compile via `kdna-studio compile` for release-reviewed assets
