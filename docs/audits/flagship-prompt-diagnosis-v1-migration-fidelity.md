# Flagship Asset v1 Migration Fidelity — prompt_diagnosis

**Date:** 2026-06-18

**Current verdict:** PASS for official v1 pipeline closure evidence.

This report supersedes the pre-hardening failure report that recorded a
one-line-axiom-only export. Current registry proof preserves the prompt
diagnosis boundaries, self-checks, failure modes, and patterns needed for
runtime use.

## Asset

- Source repo: `kdna-prompt_diagnosis`
- Source package name: `@aikdna/prompt_diagnosis`
- v1 asset ID: `kdna:aikdna:prompt_diagnosis`
- Output container: `/private/tmp/kdna-registry-proof/out/prompt_diagnosis.kdna`

## Toolchain

```bash
./node_modules/.bin/kdna-studio migrate <workdir>/kdna-prompt_diagnosis \
  --format v1 \
  --out /private/tmp/kdna-registry-proof/out/prompt_diagnosis.kdna \
  --name @aikdna/prompt_diagnosis \
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

`kdna validate /private/tmp/kdna-registry-proof/out/prompt_diagnosis.kdna`
returned:

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
| `payload.source_cards` | 30 |
| `payload.core.axioms` | 3 |
| `payload.core.boundaries` | 8 |
| `payload.patterns` | 15 |
| `payload.scenarios` | 2 |
| `payload.cases` | 1 |
| `payload.reasoning.self_checks` | 5 |
| `payload.reasoning.failure_modes` | 2 |
| `payload.evolution.stages` | 3 |

## Runtime Check

`kdna load --profile=compact --as=prompt` renders:

- 3 prompt-diagnosis axioms
- task-mixing / goal-ambiguity boundaries
- 5 self-checks
- 2 failure modes
- readable diagnostic patterns

The compact prompt now supports diagnosis rather than only formatting advice.

## Forbidden Current-Path Terms

The v1 output does not carry forward source `quality_badge` or active registry
metadata as v1 manifest claims. Signature/encryption are not claimed.

## Remaining Notes

- source `domain_judgment` is preserved as `source_asset_type`; v1 `asset_type`
  remains schema-valid `domain`.
- final README/release artifact wording must describe the asset as a prompt
  diagnosis judgment structure, not a generic prompt-optimization checklist.
