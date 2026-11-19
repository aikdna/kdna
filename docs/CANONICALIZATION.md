# KDNA Canonicalization

This document defines the canonical byte model used for `content_digest`.

## Entry Set

The canonical content tree includes every non-directory ZIP entry except:

- `.DS_Store`
- `build-receipt.json`
- any entry under `reports/`
- local installation metadata
- `signature.kdsig` (a signature can never be part of the content it signs)

The root `mimetype` entry is included. `README.md`, `LICENSE`, `evals/`,
examples, and other published evidence files are included when present.

## Entry Ordering

Entries are sorted by UTF-8 path bytes in ascending lexicographic order before
hashing. This is a byte comparison, not JavaScript's default UTF-16 string
ordering. For example, a path beginning with U+E000 sorts before a path
beginning with U+10000. ZIP central-directory order and compression method do
not affect `content_digest`.

## JSON Canonicalization

JSON entries are parsed and serialized with:

- object keys sorted by UTF-16 code units at every level (the existing
  ECMAScript-compatible JSON key order; distinct from entry-path ordering)
- array order preserved
- no insignificant whitespace
- normal JSON string escaping as produced by `JSON.stringify`

For `kdna.json`, the following fields are removed before hashing:

- `asset_digest`
- `container_sha256`
- `content_digest`
- `authoring.content_digest` (recursive strip)
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

## Asset Signature Boundary

RFC-0021 M1 (`kdsig.ed25519`) signs the canonical content tree defined here:
the Ed25519 signing payload is the UTF-8 encoding of
`kdsig.ed25519:0.1.0:<content_digest>`, where `<content_digest>` is the
content digest above computed with `signature.kdsig` excluded from the entry
set. The signature bundle lives in the optional top-level `signature.kdsig`
entry and is verified offline and fail-closed. See
[rfcs/RFC-0021-signature-track.md](../rfcs/RFC-0021-signature-track.md) and
[conformance/signature/](../conformance/signature/README.md).

Canonicalization itself still makes no authenticity claim; it only provides
the deterministic digest material that signatures (and digests) bind.

## Non-Goals

Canonicalization does not prove authorship, authorization, authenticity, or
judgment quality. It proves that all conforming implementations hash the same
bytes.

Runtime Capsule delivery uses a separate RFC 8785 JCS profile named
`kdna.canonicalization.runtime-capsule-jcs`. Its digest is P and is not the asset content digest C.
