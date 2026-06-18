# Flagship Asset v1 Migration Fidelity — writing

**Date:** 2026-06-18

**Current verdict:** PASS for official v1 pipeline closure evidence.

This report supersedes the pre-hardening failure report that recorded the old
Studio v1 export retaining only axiom one-liners. Current evidence comes from
public npm packages installed in `/private/tmp/kdna-registry-proof`.

## Asset

- Source repo: `kdna-writing`
- Source package name: `@aikdna/writing`
- v1 asset ID: `kdna:aikdna:writing`
- Output container: `/private/tmp/kdna-registry-proof/out/writing.kdna`

## Toolchain

```bash
npm install \
  @aikdna/kdna-core@0.11.1 \
  @aikdna/kdna-cli@0.25.0 \
  @aikdna/kdna-studio-core@1.5.3 \
  @aikdna/kdna-studio-cli@0.5.2 \
  @aikdna/kdna@0.9.0

./node_modules/.bin/kdna-studio migrate /Users/AI/K/OPEN/kdna-writing \
  --format v1 \
  --out /private/tmp/kdna-registry-proof/out/writing.kdna \
  --name @aikdna/writing \
  --by aikdna-maintainers \
  --statement registry-clean-install-proof
```

## Validation

`kdna validate /private/tmp/kdna-registry-proof/out/writing.kdna` returned:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

## Fidelity Counts

| Field | Count |
|---|---:|
| `payload.source_cards` | 35 |
| `payload.core.axioms` | 4 |
| `payload.core.boundaries` | 10 |
| `payload.patterns` | 17 |
| `payload.scenarios` | 2 |
| `payload.cases` | 2 |
| `payload.reasoning.self_checks` | 5 |
| `payload.reasoning.failure_modes` | 3 |
| `payload.evolution.stages` | 3 |

## Runtime Check

`kdna load --profile=compact --as=prompt` renders:

- 4 writing axioms
- derived axiom applicability boundaries
- ontology and stance boundaries
- 5 self-checks
- 3 failure modes
- readable object patterns, not `[object Object]`

## Forbidden Current-Path Terms

The v1 output does not carry forward source `quality_badge` or active registry
metadata as v1 manifest claims. Signature/encryption are not claimed.

## Remaining Notes

- v1 `asset_type` is normalized to `domain`; source type is preserved as
  `source_asset_type`.
- source `judgment_version` is normalized to schema-valid semver-like form.
- `lineage.type` uses schema-valid `adaptation` with source migration metadata.

These are acceptable for v1 launch evidence.
