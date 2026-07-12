# KDNA Version Taxonomy

This document defines the canonical version naming for the KDNA ecosystem.
**Bare `v1`/`v2`/`V1`/`V2`/`v1-rc`/`v2.0` without a namespace prefix is forbidden**
in all active public documents, code comments, and specifications.

---

## Approved Names

| Layer | Canonical Name | Examples |
|-------|---------------|----------|
| Core release generation | `KDNA Core 2026.06` or `Core GA` | "KDNA Core 2026.06 Baseline is the current stable release" |
| Asset container format | `KDNA Asset Container` | "The KDNA Asset Container uses `kdna.json` + `payload.kdnab`" |
| Legacy plaintext ZIP | `legacy plaintext ZIP` | "Legacy plaintext ZIP containers placed `KDNA_Core.json` directly in the archive" |
| Legacy registry asset | `legacy registry asset` | "Legacy registry assets used `kdna_spec` and registry-based distribution" |
| Asset content version | `asset version` | "asset version 1.2.0" |
| npm package version | `package version` | "`@aikdna/kdna-core` package version 0.13.3" |
| Specification baseline | `specification baseline` | "The 2026.06 specification baseline" |
| Wire format field | `kdna_version` | "The manifest carries `kdna_version: \"1.0\"`" |
| Source tree | `source tree` / `dev source directory` | "The source tree contains `KDNA_Core.json` for authoring only" |
| Distribution asset | `.kdna` asset / `distribution asset` | "A `.kdna` distribution asset never contains source tree files" |

## Forbidden Names

| Forbidden | Reason | Use Instead |
|-----------|--------|-------------|
| `v1` | Ambiguous: could mean Core GA, legacy plaintext, or something else | `Core GA` or `legacy plaintext ZIP` |
| `v2` | Ambiguous: could mean asset container, legacy registry, or future spec | `KDNA Asset Container` or `legacy registry asset` |
| `v1.0-rc` | Historical label, conflicts with current Core GA | `Core GA` or `2026.06 Baseline` |
| `v2.0` | Chronologically inverted (legacy v2.0 predates Core v1) | `legacy registry asset` or `KDNA Asset Container` |
| `V1 format` | Identical string means both current Core and removed plaintext | `legacy plaintext ZIP` |
| `Container v2` | Suggests a release generation, not a container format | `KDNA Asset Container` |
| `Core v1` | Without "GA" qualifier, reads as a version number | `Core GA` |
| `v1 Core GA` | Superseded — pre-v0.7 label; v0.7 (2026-05-22) is the current stable line | `Core GA` or `v0.7` |

## Mapping: Old → New

| Old Term | Canonical Replacement |
|----------|----------------------|
| `V1 plaintext (removed)` | `legacy plaintext ZIP` |
| `v2.0 / Legacy` | `legacy registry asset` |
| `KDNA Core v1 GA` | `Core GA` or `KDNA Core 2026.06 Baseline` |
| `KDNA Specification v1.0-rc` | `KDNA Core Specification — 2026.06 Baseline` |
| `KDNA Container Version 2.0` | `KDNA Asset Container` |
| `v1 container` (current) | `KDNA Asset Container` |
| `v2 container` (future) | Future asset container (draft) |
| `kdna_version` | Current wire field — see Wire Fields below |
| top-level `format_version` | Removed legacy field; do not emit |
| top-level `spec_version` | Removed legacy field; do not emit |

## Wire Fields

`kdna.json` has one container wire discriminator. Historical top-level fields
are rejected rather than treated as parallel formats:

| Field | Purpose | Current Value | Public Meaning |
|-------|---------|---------------|----------------|
| `kdna_version` | KDNA Asset Container discriminator | `"1.0"` | Current and only accepted wire value. It is not a product marketing version. |
| top-level `format_version` | Removed legacy discriminator | none | MUST NOT be emitted; does not select another supported format. |
| top-level `spec_version` | Removed legacy discriminator | none | MUST NOT be emitted; evidence subobjects may separately version their own schemas. |

**Do not reference these wire field values in public documentation as product version labels.**

## Asset Filename Convention

Distribution assets should follow this pattern:

```
{domain-name}.kdna          # e.g., viral-topic-selection.kdna
```

Do NOT embed version numbers in filenames:
- ❌ `viral-topic-selection-v1.1.0.kdna`
- ✅ `viral-topic-selection.kdna`

The asset version is declared inside `kdna.json`, not in the filename.

## CI Gate

Active public docs must not contain naked `v1`/`v2`/`v1-rc`/`v1.0-rc`/`v2.0`
except under `docs/archive/` or within explicit historical context banners.
