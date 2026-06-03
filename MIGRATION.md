# Migration Guide

Status: v1.0-rc

This guide covers migrations required for v1.0-rc compatibility.

## Manifest Fields

Replace legacy fields:

| Old | New |
| --- | --- |
| `kdna_spec` | `spec_version` |
| `language` | `languages` and `default_language` |
| `application/x-kdna` | `application/vnd.aikdna.kdna+zip` |

Required v1.0-rc manifest identity:

```json
{
  "format": "kdna",
  "format_version": "1.0",
  "spec_version": "1.0-rc",
  "languages": ["en"],
  "default_language": "en"
}
```

## Runtime Object

Use `.kdna` assets for install, verify, load, trust, signing, licensing, and registry distribution.

Do not treat a dev source directory as a trusted runtime object. Dev directories remain useful for authoring, review, and debugging.

## CLI Integration

Use JSON mode for integrations:

```bash
kdna available --json
kdna load @aikdna/writing --as=json
kdna verify @aikdna/writing --json
kdna doctor --agents --json
kdna trace --json
```

See [docs/cli-json-contract.md](docs/cli-json-contract.md).

## Registry Entries

Installable registry entries must include:

- `media_type`
- `asset_url`
- `asset_digest`
- trust/signature metadata for verified scopes
- `quality_badge`
- `risk_level`
- `review_status`

Entries that point to source directories should be treated as legacy and non-installable.

