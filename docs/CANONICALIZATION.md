# KDNA Canonicalization

This document defines the canonical byte model used for `content_digest` and
Ed25519 signatures.

## Entry Set

The canonical content tree includes every non-directory ZIP entry except:

- `signature.json`
- `.DS_Store`
- local installation metadata

The root `mimetype` entry is included. `README.md`, `LICENSE`, `evals/`,
examples, reports, and other published evidence files are included when present.

## Entry Ordering

Entries are sorted by UTF-8 path bytes in ascending lexicographic order before
hashing. ZIP central-directory order and compression method do not affect
`content_digest` or signature payloads.

## JSON Canonicalization

JSON entries are parsed and serialized with:

- object keys sorted lexicographically at every level
- array order preserved
- no insignificant whitespace
- normal JSON string escaping as produced by `JSON.stringify`

For `kdna.json`, the following fields are removed before hashing:

- `signature`
- `asset_digest`
- `container_sha256`
- `content_digest`
- local `_source`

## Content Digest

For each included entry:

```text
<path>:<sha256-of-canonical-entry-bytes>
```

The final `content_digest` is:

```text
sha256:<sha256-of-joined-entry-lines>
```

Entry lines are joined with `\n`.

## Signing Payload

The Ed25519 signing payload is the same joined entry-line string used as the
input to `content_digest`. Self-referential digest fields are stripped before
signing and verification. Conforming verifiers MUST reject signatures that do
not verify against this payload.

## Non-Goals

Canonicalization does not prove judgment quality. It proves that all verifiers
are hashing and signing the same bytes.
