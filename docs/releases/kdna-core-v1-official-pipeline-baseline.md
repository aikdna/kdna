# KDNA Core v1 Official Pipeline Baseline — June 2026

## Current official toolchain

KDNA Core v1 is the **official KDNA judgment-asset format and runtime loading
contract**. The following pipeline is the current official path:

```
Studio create
  → kdna-studio migrate <project> --format v1 --out <file.kdna>
    (calls @aikdna/kdna-core@0.11.0 for deterministic pack + checksums)

  → .kdna v1 container (application/vnd.kdna.asset)
    (kdna.json manifest, payload.kdnab JSON, checksums.json SHA-256 verified)

  → kdna validate <file.kdna>
    (format_valid + schema_valid + payload_valid + checksums_valid + load_contract_valid)

  → kdna load <file.kdna> --profile=compact --as=prompt
    (agent-readable judgment text: axioms, boundaries, self-checks)
```

Alternatively, the CLI-first creation path:

```
kdna demo minimal ./minimal
kdna pack ./minimal ./asset.kdna
kdna validate ./asset.kdna
kdna load ./asset.kdna --profile=compact --as=prompt
```

## Current version matrix

| Package | Version | Role |
|---|---|---|
| @aikdna/kdna-core | 0.11.0 | Official shared core: inspect, validate, pack, unpack, loadV1, digest matching |
| @aikdna/kdna-cli | 0.25.0 | Official CLI: demo, inspect, validate, pack, unpack, load |
| @aikdna/kdna-studio-cli | 0.5.0 | Official authoring CLI: create, migrate --format v1 |

## Completed capabilities

- KDNA Core v1 format baseline (examples/minimal, manifest schema, payload profile)
- Official CLI v1 route (inspect, validate, pack, unpack, demo minimal)
- Official shared core (@aikdna/kdna-core, single v1 implementation)
- v1 runtime loading (loadV1 with index/compact/scenario/full profiles)
- Load profile contract (normative docs/core/load-profiles.md)
- Digest matching (manifest_digest + payload_digest verified via SHA-256)
- Deterministic pack (same source → same SHA-256)
- Content-neutral output (no trusted/recommended/high_quality/officially_approved/quality_badge)
- Legacy v2 fallback boundary (v1 route never captures legacy input)
- Studio v1 export (migrate --format v1 → core.pack + core.validate)
- 54 cli-v1 tests, 23 kdna-cli tests (all pass)
- Cross-repo narrative audit (14 repos, 88 findings)

## Not yet available (gated)

These are **not** part of the current KDNA Core v1 pipeline:

- **Encryption envelope** — encrypted payload.kdnab entries (Phase 3)
- **Signature verification** — Ed25519 signatures over canonical payload (Phase 3)
- **Private asset loading** — decrypt + load via license key (Phase 3)
- **Enterprise entitlement** — license activation, revocation, KMS (post-Phase 3)
- **Registry / marketplace / trust scoring** — not KDNA Core v1 scope

## Entering Phase 3 (encryption/signature) gate

Phase 3 will be entered when:

1. At least one real flagship domain asset has been successfully migrated to v1,
   validated, and loaded through the official pipeline.
2. All open issues from the Core Extraction / Public Surface cleanup tracked in
   issue #101 are reconciled (closed or documented).
3. Clean-install smoke passes: `npm install -g @aikdna/kdna-cli@latest` →
   `kdna demo minimal` → `kdna pack` → `kdna validate` → `kdna load`.
4. Studio v1 export E2E continues to pass on clean install.
5. A gating decision document is created at `docs/audits/phase-3-encryption-gate.md`
   defining what encryption protects, what signature proves, and how they relate
   to digest matching (which already exists).

## Known limitations

- JSON-schema validation requires `ajv` in the consumer environment.
  When unavailable, schema_valid degrades gracefully.
- `kdna load --profile=scenario` currently falls back to compact since
  no scenario trigger matching is implemented (Phase 2+ feature).
- `kdna compare` requires a provider API key; not part of the default
  first-run path.
- Studio authoring requires a working Studio project with locked cards;
  the `--format v1` export path produces v1 containers from locked axioms.
- Legacy kdna-registry is marked as a legacy experiment and not part of
  the KDNA Core v1 active path.
