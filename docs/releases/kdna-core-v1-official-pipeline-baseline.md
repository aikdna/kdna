# KDNA Core v1 Pipeline Closure Status — June 2026

## Status: CLOSURE CANDIDATE (Studio producer npm-registry proof passed)

The CLI consumer path is complete. The Studio producer path now passes all v1
validation gates on the legacy three-source proof set from public npm packages,
including `schema_valid`, `payload_valid`, `checksums_valid`, and
`load_contract_valid`.

This is still a closure candidate, not the final public-launch declaration,
because website/docs, MCP package evidence, issue reconciliation, public example
planning, and final proof artifacts still need cross-repo closure.

## What passes (CLI consumer path)

```
kdna demo minimal ./minimal
kdna pack ./minimal ./a.kdna
kdna validate ./a.kdna
  → overall_valid: true (all 5 gates pass)
kdna load ./a.kdna --profile=compact --as=prompt
  → agent-readable judgment text
```

## Studio producer path status

Pre-hardening blockers were:

- `schema_valid=false` from missing `ajv` / `ajv-formats` in clean install
- scoped package names failing v1 `asset_id` regex
- missing `checksums.json`
- real-asset fidelity failure, retaining only about 10-11% of authored cards

Current hardening proof shows:

- `@aikdna/writing` -> `kdna:aikdna:writing`
- `@aikdna/prompt_diagnosis` -> `kdna:aikdna:prompt_diagnosis`
- `@aikdna/agent_safety` -> `kdna:aikdna:agent_safety`
- all three validate with `overall_valid: true`
- all three include `checksums.json`
- all three preserve source cards in full profile
- compact prompt output renders object patterns as readable judgment text
- local Studio test suites are green:
  - `kdna-studio-cli npm test`: 18/18 pass
  - `kdna-studio-core npm test`: 128/128 pass
  - `kdna npm test`: pass
- local tarball clean-install proof passes with:
  - `@aikdna/kdna-core@0.11.1`
  - `@aikdna/kdna-studio-core@1.5.3`
  - `@aikdna/kdna-studio-cli@0.5.3`
  - `@aikdna/kdna-cli@0.25.1`
- npm registry clean-install proof passes in `/tmp/kdna-registry-proof`
  with:
  - `@aikdna/kdna-core@0.11.1`
  - `@aikdna/kdna-cli@0.25.1`
  - `@aikdna/kdna-studio-core@1.5.3`
  - `@aikdna/kdna-studio-cli@0.5.3`
  - `@aikdna/kdna@0.9.0`
- registry proof full-profile counts:
  - `writing`: 35 source cards, 4 axioms, 10 boundaries, 17 patterns, 2 scenarios, 2 cases, 5 self-checks, 3 failure modes, 3 evolution stages
  - `agent_safety`: 29 source cards, 3 axioms, 8 boundaries, 14 patterns, 2 scenarios, 1 case, 5 self-checks, 2 failure modes, 3 evolution stages
  - `prompt_diagnosis`: 30 source cards, 3 axioms, 8 boundaries, 15 patterns, 2 scenarios, 1 case, 5 self-checks, 2 failure modes, 3 evolution stages

See the historical proof-set audit files under `docs/audits/` for the detailed
migration evidence.

Remaining before launch:

- website and public README reconciliation
- proof-set README/release artifact acceptance
- issue reconciliation

### Historical pre-hardening blocker details

These blockers explain why earlier audits failed. They are not the current
Studio producer-path verdict.

**Historical blocker 1: schema_valid=false (ajv missing)**

The consumer environment does not include `ajv` / `ajv-formats` as
transitive dependencies. JSON-Schema validation of the v1 manifest
and payload profiles fails, producing `schema_valid: false` and
`overall_valid: false`. Format, payload, and checksums gates pass.

Current status: resolved for Studio CLI by shipping `ajv` / `ajv-formats` as
runtime dependencies.

**Historical blocker 2: asset_id pattern mismatch**

Scoped names like `@test/audit2` fail the v1 manifest schema regex
`^[a-zA-Z][a-zA-Z0-9_-]*(:[a-zA-Z0-9_.-]+)+$` because `@` is not
in the allowed character set. The v1 export maps the Studio project
name directly to `asset_id`.

Current status: resolved by mapping scoped names such as `@aikdna/writing` to
v1 asset IDs such as `kdna:aikdna:writing`.

**Historical blocker 3: no checksums.json in Studio export**

The `core.pack()` function packs whatever files are present in the
source directory. The v1 export path creates `mimetype`, `kdna.json`,
and `payload.kdnab` but does NOT generate `checksums.json`. The
container is valid without it (checksums.json is recommended, not
required), but the documentation overclaimed its presence.

Current status: resolved. Studio v1 export writes `checksums.json` using the
Core checksum helper.

**Blocker 4: real-asset fidelity failure (pre-hardening)**

The legacy three-source proof set could be forced through the old Studio v1 export
path, but the resulting payloads retain only about 10-11% of authored card
content and lose manifest metadata.

Current status: resolved in the hardening and registry-proof reports:

- historical proof-set hardening verification
- historical proof-set blocker summary
- historical writing migration fidelity report
- historical agent-safety migration fidelity report
- historical prompt-diagnosis migration fidelity report

## Current version matrix

| Package | Version | Role |
|---|---|---|
| @aikdna/kdna-core | 0.11.1 | Official shared core |
| @aikdna/kdna-cli | 0.25.1 | Official CLI |
| @aikdna/kdna-studio-core | 1.5.3 | Studio authoring core |
| @aikdna/kdna-studio-cli | 0.5.3 | Official authoring CLI |
| @aikdna/kdna | 0.9.0 | Compatibility package |

## Completed capabilities

- KDNA Core v1 format baseline
- Official CLI v1 route (inspect, validate, pack, unpack, demo, load)
- Official shared core (single v1 implementation)
- Load profiles contract (index/compact/scenario/full)
- Digest matching (manifest_digest + payload_digest)
- Deterministic pack
- Content-neutral output enforcement
- Legacy v2 fallback boundary
- Shared Core extraction for the canonical global CLI
- Compatibility package extraction completed locally:
  - `packages/kdna/src/v1-cli.js` removed
  - `packages/kdna/bin/kdna.js` routes v1 through shared `@aikdna/kdna-core/v1`
  - `packages/kdna/package.json` depends on `@aikdna/kdna-cli@^0.25.1` and `@aikdna/kdna-core@^0.11.1`
- 55 cli-v1 tests (all pass)
- Clean install CLI smoke (overall_valid=true)

## Not yet available (gated)

- Encryption envelope
- Signature verification
- Private asset loading
- Enterprise entitlement
- Updated Studio real-asset fidelity reports
- Registry / marketplace / trust scoring (not KDNA Core v1 scope)
