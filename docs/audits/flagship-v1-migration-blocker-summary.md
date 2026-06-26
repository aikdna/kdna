# Flagship v1 Migration — Blocker Summary

**Date:** 2026-06-18

**Current verdict:** original Studio v1 export fidelity blockers are resolved in
the published npm-registry proof.

This file replaces the pre-hardening blocker summary that reported 10-11% card
retention and no `checksums.json`. Those findings were correct for the old
Studio v1 export path, but they are no longer the current launch verdict.

## Evidence Sources

- `docs/audits/studio-export-e2e-status.md`
- `docs/audits/flagship-v1-migration-hardening-verification.md`
- `docs/audits/flagship-writing-v1-migration-fidelity.md`
- `docs/audits/flagship-agent-safety-v1-migration-fidelity.md`
- `docs/audits/flagship-prompt-diagnosis-v1-migration-fidelity.md`

## Published Toolchain Used

- `@aikdna/kdna-core@0.11.1`
- `@aikdna/kdna-cli@0.25.0`
- `@aikdna/kdna-studio-core@1.5.3`
- `@aikdna/kdna-studio-cli@0.5.2`
- `@aikdna/kdna@0.9.0`

Proof directory: `/tmp/kdna-registry-proof`

## Current Flagship Results

| Asset | v1 asset ID | Validate | source_cards | axioms | boundaries | patterns | scenarios | cases | self_checks | failure_modes | evolution_stages |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| writing | `kdna:aikdna:writing` | `overall_valid: true` | 35 | 4 | 10 | 17 | 2 | 2 | 5 | 3 | 3 |
| agent_safety | `kdna:aikdna:agent_safety` | `overall_valid: true` | 29 | 3 | 8 | 14 | 2 | 1 | 5 | 2 | 3 |
| prompt_diagnosis | `kdna:aikdna:prompt_diagnosis` | `overall_valid: true` | 30 | 3 | 8 | 15 | 2 | 1 | 5 | 2 | 3 |

All three compact prompts are readable and include axioms, boundaries,
self-checks, failure modes, and patterns.

## Resolved Blockers

| Former blocker | Current status |
|---|---|
| v1 export only retained axiom one-liners | Resolved. Full profile preserves source cards and major runtime sections. |
| Studio Core card type mismatch | Resolved. `validateProject` uses shared `CARD_TYPES`; tests pass. |
| `@scope/name` failed v1 `asset_id` schema | Resolved. `@aikdna/writing` maps to `kdna:aikdna:writing`. |
| manifest metadata hand-rolled and incomplete | Materially improved. Source metadata is preserved in v1 manifest/source metadata; schema normalization is documented. |
| no `checksums.json` | Resolved. Studio v1 export writes checksums via Core helper. |
| `ajv` required `NODE_PATH` workaround | Resolved for Studio CLI; runtime deps include `ajv` / `ajv-formats`. |
| load profiles had no fidelity gradient | Resolved enough for launch evidence. Full profile exposes richer content than compact. |

## Still Not Done

These are launch-closure tasks, not fidelity blockers:

- create or accept final release artifacts for the three flagship assets
- update flagship README usage sections
- prove MCP package install once `@aikdna/kdna-mcp-server@0.1.0` is registry-visible
- finish issue reconciliation
- owner-review website generated docs, appcast/download artifacts, and launch screenshots
- do not enter encryption/signature implementation until launch gates are closed

## Current Recommendation

The flagship migration blocker is no longer a reason to block KDNA v1 Official
Pipeline Closure. The project should proceed to final release-artifact,
MCP/skills, website, and issue reconciliation work.
