# Asset Identity and Digest Responsibilities

KDNA separates human-readable asset identity, globally unique identity,
release versions, and byte-level integrity. These values must not collapse into
one generic `name`, `version`, or `digest` field.

## Manifest identity

Every current manifest contains:

```json
{
  "format_version": "0.1.0",
  "asset_id": "kdna:example:asset",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "version": "1.0.0",
  "judgment_version": "1.0.0"
}
```

| Field | Stability | Meaning |
| --- | --- | --- |
| `asset_id` | stable while the asset's public identity is stable | human-readable namespaced identity |
| `asset_uid` | stable for one asset lineage | globally unique identity |
| `version` | changes for a packaged release | SemVer release coordinate |
| `judgment_version` | changes when encoded judgment semantics change | SemVer judgment coordinate |

Creator provenance is optional and is never a loading prerequisite or a trust
claim.

## Digest responsibilities

| Name | Basis | Location and owner |
| --- | --- | --- |
| A | final packaged `.kdna` bytes | external expected value, registry, receipt, or lockfile |
| C | canonical content tree | manifest declaration or external evidence |
| E | raw `kdna.json` + `payload.kdnab` entry set | `checksums.json.entry_set_digest` |
| P | canonical Runtime Capsule delivered to a Host | Host request, receipt, and Judgment Trace |

A cannot be stored inside the container it hashes without circularity. A grant,
registry, or install receipt that binds the final asset therefore carries A as
external evidence. `checksums.json` carries E and per-entry digests; it must not
claim to be the final container digest.

The Runtime Capsule exposes A, C, and E under distinct members with explicit
basis and comparison evidence. P is detached from the Capsule it hashes.

## Why the identities stay separate

Two packaged assets may contain the same judgment but differ in encryption,
signatures, or attachments. A metadata-only release may change `version`
without changing `judgment_version`. Repacking identical logical content may
preserve C while changing A. Keeping these coordinates separate makes
authorization, revocation, audit, and reproducibility unambiguous.
