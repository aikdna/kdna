# KDNA Manifest

`kdna.json` is the content-neutral public manifest for a `.kdna` asset. The
normative schema is
[`schema/manifest.schema.json`](../../schema/manifest.schema.json).

## Required fields

| Field | Contract |
|---|---|
| `format_version` | Exact compatibility coordinate `0.1.0` |
| `asset_id` | Namespaced human-readable identifier |
| `asset_uid` | Globally unique URI, normally a UUID URN |
| `asset_type` | Declared asset interpretation |
| `title` | Human-readable title |
| `version` | Package release SemVer |
| `judgment_version` | Judgment-content SemVer |
| `created_at`, `updated_at` | ISO 8601 timestamps |
| `compatibility` | Loader, payload profile, and profile-version requirements |
| `payload` | Fixed `payload.kdnab`, `cbor`, and encryption declaration |

`access` is `public`, `licensed`, or `remote`. Unknown values and removed
aliases fail closed.

`creator` is optional provenance and never a trust gate. When supplied, its
`name` is non-empty. Core validates declared facts; it does not infer a creator,
quality rank, review state, or official approval.

The Runtime manifest explicitly rejects `quality_badge`, `risk_level`,
`trusted`, `recommended`, `high_quality`, `expert_reviewed`,
`production_ready`, and `officially_approved`. Those names would turn an
external assessment or caller policy into an intrinsic Core fact. An asset's
judgment payload may still express its own scoped standards, warnings, and
risk judgments; Core does not adopt them as protocol verdicts.

The manifest does not contain judgment content. Runtime inspection can expose
identity and compatibility metadata without projecting the payload.
