# KDNA Manifest (`kdna.json`)

The manifest is the **public metadata layer** of a `.kdna` file. It is always plaintext so that tools can identify, route, and version-check an asset even when the payload is encrypted.

The manifest is a single JSON object at the root of the container, stored as `kdna.json`. The authoritative schema is [`schema/manifest.schema.json`](../../schema/manifest.schema.json).

## Required fields

| Field | Type | Description |
| --- | --- | --- |
| `kdna_version` | string | The KDNA Core version this manifest conforms to. Phase 1 uses `"1.0"`. |
| `asset_id` | string | A human-readable identifier with a `kdna_version` prefix (e.g. `kdna:example:atomspeak-core`). Not globally unique by itself. |
| `asset_uid` | string (URI) | A globally unique identifier, conventionally a `urn:uuid:...`. Required in v1 to disambiguate assets that share a name. |
| `asset_type` | enum | One of `domain`, `cluster`, `tool`, `sample`, `fixture`. The container format is the same; the value tells callers how to interpret the payload. |
| `title` | string | A short, human-readable title. |
| `version` | semver | The release version of this `.kdna` file. Distinct from `judgment_version`. |
| `judgment_version` | semver | The semantic version of the **encoded judgment system**. Two assets with the same `judgment_version` are semantically equivalent for matching. |
| `created_at` | ISO 8601 | When the asset was first created. |
| `updated_at` | ISO 8601 | When this release of the asset was produced. |
| `creator` | object | Who produced the asset. See below. |
| `compatibility` | object | Loader-version requirements and payload profile identifier. |
| `payload` | object | Path, encoding, and encryption status of the payload entry. |

## `creator` object

```json
{
  "name": "Example Author",
  "id": "optional-author-id"
}
```

`creator.name` is the only required field. `creator.id` is optional. The `creator` block does NOT include a trust claim, an endorsement, or a verification status. The presence of a `creator` block is a fact about provenance, not a statement about reliability.

## `compatibility` object

```json
{
  "min_loader_version": "1.0.0",
  "profile": "judgment-profile-v1"
}
```

`min_loader_version` is the minimum version of the KDNA Core loader required to read this asset. `profile` is the payload profile identifier (see `payload-profile.md`).

## `payload` object

```json
{
  "path": "payload.kdnab",
  "encoding": "json",
  "encrypted": false
}
```

- `path` is the entry name within the container (always `payload.kdnab` in v1).
- `encoding` is `json` or `cbor`.
- `encrypted` is a boolean. In Phase 1, only `false` is exercised; the encrypted case is defined in a later phase.

## Optional fields

| Field | Type | Description |
| --- | --- | --- |
| `summary` | string | One-paragraph description. |
| `description` | string | Longer description. |
| `language` | string | BCP-47 primary language code. |
| `languages` | array | Supported languages. |
| `license` | string or object | SPDX identifier (e.g. `Apache-2.0`) or `{type, url}`. |
| `keywords` | array | Free-form keywords. |
| `domain_field` | array | Domain categories. |
| `lineage` | array | List of `{asset_uid, version, relationship}` records describing parent assets. |
| `digests` | object | Per-entry digests. Alternative to a separate `checksums.json`. |
| `signatures` | array | Signature references (each entry has `role`, `path`, `algorithm`, `key_id`). |
| `encryption` | object | Encryption envelope metadata (reserved for later phases). |
| `load_contract` | object | The runtime load contract. See `load-contract.md`. |
| `scope` | object | Scope metadata: `summary`, `keywords`, `domain_field`, etc. |
| `evidence_claims` | object | Author-declared evidence claims. **Descriptive only in Phase 1.** Not validated by the format. |

## Minimal example

```json
{
  "kdna_version": "1.0",
  "asset_id": "kdna:example:atomspeak-core",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Atomspeak Core",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "created_at": "2026-06-16T00:00:00Z",
  "updated_at": "2026-06-16T00:00:00Z",
  "creator": {
    "name": "Example Author",
    "id": "optional-author-id"
  },
  "compatibility": {
    "min_loader_version": "1.0.0",
    "profile": "judgment-profile-v1"
  },
  "payload": {
    "path": "payload.kdnab",
    "encoding": "json",
    "encrypted": false
  }
}
```

## Why `asset_uid` is required

A previous design used `asset_id` alone. That made the identifier namespace central: every producer had to coordinate with everyone else to avoid collisions. The v1 manifest requires `asset_uid` (a URN) so that the unique identity is **intrinsic** to the asset, not delegated to a global naming authority. `asset_id` is retained for human readability, but `asset_uid` is the only field the runtime uses for identity.
