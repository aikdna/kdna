# KDNA Version Matrix

This document explains the relationship between the four version numbers you will encounter in the KDNA ecosystem.

## Four Version Axes

| Axis | Location | Example | What it means |
|------|----------|---------|---------------|
| **SPEC version** | `SPEC.md` title | `v1.0-rc` | The version of the KDNA protocol specification. Determines file format, required fields, and validation rules. |
| **CLI version** | `npm @aikdna/kdna-cli` | `v0.7.8` | The version of the command-line tool. Independent of SPEC version. |
| **Core library version** | `npm @aikdna/kdna-core` | `v0.2.3` | The version of the zero-dependency validation and formatting library. |
| **Domain version** | Each domain's `kdna.json` | `v0.7.5` | The version of an individual domain's content. Follows SemVer (MAJOR.MINOR.PATCH). |

## Compatibility Rules

- A domain with `kdna_spec: "1.0-rc"` in its manifest MUST conform to SPEC v1.0-rc.
- A CLI at v0.7.x can validate domains targeting SPEC v1.0-rc.
- The core library version is independent — v0.2.3 implements SPEC v1.0-rc validation.
- Domain version increments reflect content changes, not spec changes:
  - **PATCH** (`0.7.1` → `0.7.2`): Content refinement without structural change.
  - **MINOR** (`0.7.x` → `0.8.0`): New judgment structures added; no breaking changes.
  - **MAJOR** (`0.x.0` → `1.0.0`): Breaking changes to existing judgment logic.

## Three-Field System Versions

| `status` | Meaning | Who changes it |
|----------|---------|---------------|
| `draft` | Early work in progress. Structure may change dramatically. | Domain author |
| `experimental` | Complete structure, not yet tested in practice. | Domain author |
| `stable` | Structure frozen, content mature. | Domain author |
| `deprecated` | Superseded. `replaced_by` MUST be set. | Registry maintainer |

| `quality_badge` | Minimum Evidence | Who assigns it |
|-----------------|-----------------|----------------|
| `untested` | Passes `kdna validate` (schema + lint). No eval cases. | Self-declared |
| `tested` | >= 10 standardized eval cases conforming to `schema/eval.schema.json`. | Self-declared, machine-verified |
| `validated` | >= 30 eval cases + blind review + raw outputs + benchmark report. | Self-declared, machine-verified |
| `expert_reviewed` | `validated` + at least one external domain expert review, reviewer identity public. | External expert |
| `production_ready` | `expert_reviewed` + real-world usage data from at least one independent deployment + multi-model stability evidence. | Registry maintainer |

## Historical Migrations

| Old Value | New Mapping | Reason |
|-----------|-------------|--------|
| `status: basic` | `status: stable` + `quality_badge: tested` | "basic" conflated maturity and quality. |
| `status: pro` | `status: stable` + `quality_badge: tested` | "pro" was a marketing label, not a maturity level. |
| `status: reference` | `status: stable` + `quality_badge: validated` or `expert_reviewed` | "reference" mixed pedagogical intent with quality. |
| `quality_badge: experimental` | `quality_badge: untested` | More honest about evidence level. |
| `quality_badge: production` | `quality_badge: production_ready` | Explicit, unambiguous naming. |
