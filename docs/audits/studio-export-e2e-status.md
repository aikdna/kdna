# Studio Export → v1 Container E2E Status — June 2026

## Verdict: PASS (beta)

`kdna-studio migrate --format v1` produces KDNA Core v1 containers that pass
`kdna validate` and `kdna load --profile=compact --as=prompt`.

## E2E chain verified

```
kdna-studio create project
  → Add judgment cards (axioms)
kdna-studio migrate project --format v1 --out asset.kdna
  → @aikdna/kdna-core@0.11.0 pack + validate passes
kdna validate asset.kdna
  → format_valid: true, payload_valid: true, checksums_valid: true
kdna load asset.kdna --profile=compact --as=prompt
  → Agent-readable judgment text
```

## Implementation

- `kdna-studio-cli/bin/kdna-studio.js` — v1 path added to `cmdMigrate`
- v1 export skips v2 compile gate and calls `@aikdna/kdna-core` directly
- Manifest: v2 project metadata → v1 manifest.schema.json fields
- Payload: locked axiom cards → JSON (not CBOR)
- Packaging: official `core.pack` (deterministic ZIP + checksums.json)
- Validation: official `core.validate` (format + schema + payload + checksums + load-contract)

## What's NOT included in v1 export

- quality_badge, Human Lock status, risk levels (not part of v1 manifest)
- legacy reports (KDNA_CARD, quality-gate-report, provenance-report, etc.)
- CBOR-encoded payload (v1 uses JSON)
- v2 mimetype (v1 uses `application/vnd.kdna.asset`)

## Limitation

- JSON-schema validation requires `ajv` in the consumer environment.
  When unavailable, schema_valid degrades gracefully (false with a clear message).
  Format, payload, checksums, and load-contract validation are independent.
