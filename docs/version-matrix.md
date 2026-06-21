# KDNA Version Matrix

This document explains the version numbers you will encounter in the current
KDNA public beta ecosystem.

## Version Axes

| Axis | Location | Example | What it means |
|------|----------|---------|---------------|
| **SPEC version** | `SPEC.md` title | `Core v1` | The version of the KDNA protocol specification. Determines file format, required fields, and validation rules. |
| **CLI version** | `npm @aikdna/kdna-cli` | `v0.26.10` | The version of the runtime command-line tool. Independent of SPEC version. |
| **Core library version** | `npm @aikdna/kdna-core` | `v0.12.3` | The version of the Core validation, LoadPlan, and loading library. |
| **Studio Core version** | `npm @aikdna/kdna-studio-core` | `v1.5.8` | The version of the authoring kernel library. |
| **Studio CLI version** | `npm @aikdna/kdna-studio-cli` | `v0.5.9` | The version of the command-line authoring entry. Independent of runtime CLI version. |
| **MCP server version** | `npm @aikdna/kdna-mcp-server` | `v0.2.4` | The version of the MCP adapter package. Source lives in `aikdna/kdna-skills/mcp-server`. |
| **Asset version** | Each `.kdna` manifest | `v0.1.0` | The version of an individual judgment asset's content. Follows SemVer. |

## Compatibility Rules

- A `.kdna` asset with `spec_version: "1.0-rc"` in its manifest uses the
  current Core v1 compatibility identifier and MUST conform to `SPEC.md`.
- CLI and Core versions are package versions; they do not change the asset
  content version.
- Asset version increments reflect judgment-content changes, not package
  releases:
  - **PATCH** (`0.7.1` → `0.7.2`): Content refinement without structural change.
  - **MINOR** (`0.7.x` → `0.8.0`): New judgment structures added; no breaking changes.
  - **MAJOR** (`0.x.0` → `1.0.0`): Breaking changes to existing judgment logic.

## Public Beta Status Layers

| Layer | Meaning |
|---|---|
| **Format-valid** | The packaged `.kdna` file passes `kdna validate`. This says the structure, schema, payload, checksums, and load contract are valid. |
| **Loadable now** | `kdna plan-load` returns `can_load_now: true`; only then should `kdna load` emit judgment context. |
| **Release-card described** | The public asset has filename, version, digest, use commands, applies/does-not-apply boundaries, known limitations, and trust metadata. |
| **Human-confirmed** | Optional provenance: a human reviewed or approved the asset. This is not required for format validity. |
| **Signed / encrypted / licensed / hosted-listed** | Future or optional trust/distribution layers. They are not part of the current public beta baseline. |

`kdna validate` does not mean the asset is high quality, officially
recommended, safe for every use case, or certified by KDNA. Trust, quality,
authorship, and distribution status are separate layers.

## Public Examples

New public examples should use packaged `.kdna` files plus release cards. A
release card can describe evidence, provenance, limits, and publisher-managed
quality claims without making Core validation a content endorsement.
