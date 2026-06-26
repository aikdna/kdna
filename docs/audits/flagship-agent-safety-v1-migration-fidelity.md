# Flagship Asset v1 Migration Fidelity — agent_safety

**Date:** 2026-06-18

**Current verdict:** PASS for official v1 pipeline closure evidence.

This report supersedes the pre-hardening failure report. This asset is the
strictest flagship case because degraded safety boundaries would be worse than
no flagship release. Current registry proof preserves the safety self-checks,
failure modes, and derived boundaries.

## Asset

- Source repo: `kdna-agent_safety`
- Source package name: `@aikdna/agent_safety`
- v1 asset ID: `kdna:aikdna:agent_safety`
- Output container: `/tmp/kdna-registry-proof/out/agent_safety.kdna`

## Toolchain

```bash
./node_modules/.bin/kdna-studio migrate <workdir>/kdna-agent_safety \
  --format v1 \
  --out /tmp/kdna-registry-proof/out/agent_safety.kdna \
  --name @aikdna/agent_safety \
  --by aikdna-maintainers \
  --statement registry-clean-install-proof
```

Public npm packages used:

- `@aikdna/kdna-core@0.11.1`
- `@aikdna/kdna-cli@0.25.0`
- `@aikdna/kdna-studio-core@1.5.3`
- `@aikdna/kdna-studio-cli@0.5.2`
- `@aikdna/kdna@0.9.0`

## Validation

`kdna validate /tmp/kdna-registry-proof/out/agent_safety.kdna` returned:

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
| `payload.source_cards` | 29 |
| `payload.core.axioms` | 3 |
| `payload.core.boundaries` | 8 |
| `payload.patterns` | 14 |
| `payload.scenarios` | 2 |
| `payload.cases` | 1 |
| `payload.reasoning.self_checks` | 5 |
| `payload.reasoning.failure_modes` | 2 |
| `payload.evolution.stages` | 3 |

## Runtime Check

`kdna load --profile=compact --as=prompt` renders:

- 3 safety axioms
- irreversible-action / authorization / halt boundaries
- 5 operational self-checks
- 2 failure modes
- readable safety patterns

The compact prompt keeps the safety asset usable as a pre-action judgment gate.

## Forbidden Current-Path Terms

The v1 output does not carry forward source `quality_badge` or active registry
metadata as v1 manifest claims. Signature/encryption are not claimed.

## Remaining Notes

- source `risk_guard` is preserved as `source_asset_type`; v1 `asset_type`
  remains schema-valid `domain`.
- final README/release artifact wording must avoid implying the asset is safe
  or approved by default. It is a loaded judgment structure, not content trust.
