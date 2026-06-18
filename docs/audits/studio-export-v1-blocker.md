# Studio Export v1 Container Blocker — June 2026

## Current Studio export capability

`kdna-studio migrate <source-dir> --out <file.kdna>` produces a **v2-format**
.kdna container:

- mimetype = `application/vnd.aikdna.kdna+zip` (v2, not v1)
- `payload.kdnab` is CBOR-encoded (v2), not JSON-encoded (v1)
- `kdna.json` uses v2 manifest fields (`name`, `format`, `format_version`,
  `quality_badge`, `status`, `access`) instead of v1 manifest fields
  (`kdna_version`, `asset_id`, `asset_uid`, `asset_type`, `compatibility`)
- Includes legacy v2 entries: `KDNA_CARD.json`, `reports/quality-gate-report.json`,
  `reports/provenance-report.json`, `reports/human-lock-report.json`,
  `reports/build-report.json`, `reports/eval-report.json`, `build-receipt.json`

## What's needed for v1 compatibility

1. **mimetype**: change to `application/vnd.kdna.asset`
2. **payload encoding**: JSON (per v1 paylod-profile-v1.schema.json), not CBOR
3. **manifest schema**: v1 manifest.schema.json fields, not v2 kdna.json fields
4. **container entries**: drop legacy v2 reports; add `checksums.json` (computed via @aikdna/kdna-core)

## Minimal workaround (available today)

The v1 CLI path can create v1 containers from source directories:

```bash
# Author judgment in Studio (or any editor)
# Create a v1 source directory with correct format
# Then pack with official CLI:
kdna pack <source-dir> <output.kdna>
kdna validate <output.kdna>
kdna load <output.kdna> --profile=compact --as=prompt
```

The Studio authoring CLI is **beta** and produces v2 containers.
The v1 pack/validate/load path is **current** and available globally.

## Recommended next step

Add a `--format v1` flag to `kdna-studio migrate` that:
1. Uses @aikdna/kdna-core@0.11.0 for pack/checksum
2. Encodes payload as JSON (not CBOR)
3. Uses v1 manifest schema
4. Sets mimetype to v1
5. Drops legacy reports / quality gates

Or: document the current v2 export as legacy and mark Studio v1 export
as a planned feature.
