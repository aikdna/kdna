# KDNA Asset Container

**Status:** Current

## 1. Purpose

A `.kdna` file is the portable unit of identity, distribution, verification,
authorization, and loading for one KDNA asset. It is transported as a ZIP
container, but its judgment is a CBOR payload and is not an ordinary set of
JSON files.

Generic ZIP tools may reveal public metadata. Agents and applications MUST NOT
consume judgment by unpacking the file. They request a LoadPlan from KDNA Core
and, when `can_load_now` is true, consume the Runtime Capsule returned by Core.

This container contract is content-neutral. It does not decide whether an
asset's judgment, taste, values, standards, or personality are good or true.

## 2. One Authoring-to-Consumption Path

```text
Studio project / dev source
        ↓ compile and export
KDNA Asset Container (.kdna)
        ↓ Core plan-load and load
Runtime Capsule
        ↓
Agent or application
```

- Authoring source files are editable development inputs, never distribution
  entries.
- The `.kdna` file is the canonical installed asset.
- The Runtime Capsule is the only Agent-facing judgment representation.

## 3. Container Entries

### 3.1 Required

| Entry | Encoding | Meaning |
|---|---|---|
| `mimetype` | ASCII | Exactly `application/vnd.kdna.asset`, without a trailing newline |
| `kdna.json` | UTF-8 JSON | Public identity, compatibility, access, and payload metadata |
| `payload.kdnab` | CBOR | Judgment payload, or a CBOR encrypted envelope when declared encrypted |

### 3.2 Optional

| Entry | Encoding | Meaning |
|---|---|---|
| `checksums.json` | UTF-8 JSON | Digests over the distributed bytes; official writers emit it |
| `signatures/` | implementation-defined signed records | Optional provenance and integrity signatures |
| `attachments/` | binary | Optional assets governed by the manifest and loader policy |

No optional entry may become an alternate judgment payload.

### 3.3 Forbidden top-level source entries

`KDNA_Core.json`, `KDNA_Patterns.json`, `KDNA_Scenarios.json`,
`KDNA_Cases.json`, `KDNA_Reasoning.json`, and `KDNA_Evolution.json` belong to
authoring source only. A distribution container containing any of them at the
top level MUST be rejected.

## 4. Runtime Manifest

The authoritative schema is [`../schema/manifest.schema.json`](../schema/manifest.schema.json).
A minimal public manifest has this shape:

```json
{
  "format_version": "0.1.0",
  "asset_id": "kdna:example:editorial_judgment",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "asset_type": "domain",
  "title": "Editorial Judgment",
  "version": "1.0.0",
  "judgment_version": "1.0.0",
  "created_at": "2026-07-13T00:00:00Z",
  "updated_at": "2026-07-13T00:00:00Z",
  "compatibility": {
    "min_loader_version": "0.20.0",
    "profile": "kdna.payload.judgment",
    "profile_version": "0.1.0"
  },
  "payload": {
    "path": "payload.kdnab",
    "encoding": "cbor",
    "encrypted": false,
    "digest": "sha256:..."
  },
  "access": "public",
  "summary": "Judgment for reviewing editorial decisions.",
  "language": "en",
  "license": "Apache-2.0",
  "keywords": ["editorial", "review"],
  "lineage": { "type": "original" },
  "load_contract": {
    "default_profile": "compact",
    "profiles": {
      "index": { "requires_decryption": false },
      "compact": { "requires_decryption": false },
      "scenario": { "requires_decryption": false },
      "full": { "requires_decryption": false }
    }
  }
}
```

`creator` is optional Runtime provenance, not an authorship requirement or a
trust claim. If present, it MUST contain a non-empty `name`. If provenance is
not available, producers omit the block; they MUST NOT invent placeholder
identities such as `"Anonymous"` or `"Unknown"`. Authoring-source identity
requirements are defined separately and do not change this container rule.

`format_version` is the sole container compatibility coordinate. Its current
accepted value is `"0.1.0"`; it is not a product-generation or marketing
label. Removed container discriminators do not select alternate formats and
MUST NOT be emitted.

The manifest MUST NOT contain judgment content such as axioms, patterns,
boundaries, cases, or self-checks.

## 5. CBOR Payload

For an unencrypted judgment asset, `payload.kdnab` is a CBOR map matching
[`../schema/payload-profile.schema.json`](../schema/payload-profile.schema.json):

```text
{
  profile: "kdna.payload.judgment",
  profile_version: "0.1.0",
  core: {
    highest_question: string,
    axioms: array,
    boundaries?: array,
    risk_model?: object
  },
  patterns?: array,
  scenarios?: array,
  cases?: array,
  reasoning?: object,
  evolution?: object
}
```

Writers MUST encode this map as CBOR. Readers MUST NOT guess JSON when CBOR
decoding fails.

## 6. Encryption and Authorization

When `payload.encrypted` is true, `payload.kdnab` contains a CBOR encrypted
envelope declared by `encryption.profile`; it does not contain plaintext
judgment. Core evaluates the manifest and external entitlement state, returns a
LoadPlan, decrypts only after authorization, and keeps plaintext in memory.

Applications and Agents MUST NOT implement authorization by inspecting the
manifest themselves. They MUST NOT persist decrypted payloads, include them in
logs, or bypass Core with generic ZIP/CBOR code.

## 7. Loading Sequence

1. Open the `.kdna` container through KDNA Core.
2. Verify the required entries and exact media type.
3. Reject forbidden source-tree entries.
4. Validate `kdna.json` and its access vocabulary.
5. Verify `checksums.json` when present.
6. Produce a LoadPlan and stop if `can_load_now` is false.
7. Decode or authorize and decrypt `payload.kdnab` in memory.
8. Validate the decoded payload profile.
9. Select `index`, `compact`, `scenario`, or `full` context.
10. Emit a Runtime Capsule with honest validation and signature state.

Raw payload inspection is a developer-only operation:

```bash
kdna dev decode asset.kdna --reveal
```

It is not an Agent consumption path.

## 8. Rejection Rules

A conforming loader rejects at least:

- wrong or missing `mimetype`;
- missing `kdna.json` or `payload.kdnab`;
- a legacy top-level source-tree entry;
- a manifest that does not match the current schema;
- non-CBOR payload or encrypted-envelope bytes;
- unsupported access, entitlement, payload, or crypto profiles;
- declared digest mismatch;
- invalid signatures when signature verification is requested or required;
- failure to authorize or decrypt an encrypted asset.

KDNA has one current distribution format. Historical formats may be handled by
explicit migration tools, never by silently treating them as equivalent
runtime assets.
