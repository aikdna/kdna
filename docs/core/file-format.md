# KDNA File Format

The runtime format is one immutable `.kdna` ZIP container. It is identified by
an uncompressed first entry named `mimetype` whose exact content is
`application/vnd.kdna.asset`.

## Required entries

```text
mimetype
kdna.json
payload.kdnab
checksums.json
```

`kdna.json` is the public manifest. `payload.kdnab` is the CBOR judgment
payload or a declared encrypted envelope. `checksums.json` records canonical
runtime entry-set evidence.

Authoring JSON, reports, receipts, credentials, and plaintext do not belong in
the container. The packer rejects unknown top-level source entries, unsafe
paths, duplicate entries, and the wrong mimetype.

## Deterministic packaging

The reference packer writes entries in canonical order with stable ZIP
metadata. With one pinned packer toolchain and compressor, the same source is
byte-reproducible. DEFLATE output is not portable across compressor or zlib
versions, so equivalent logical entries may have different transport bytes and
therefore different A/package digests.

Logical entry identity is represented by `checksums.json.entry_set_digest` and
the LoadPlan `source_fingerprint`. A still binds the exact immutable package
bytes that were authorized or delivered; it must never be substituted with a
logical-entry digest.

## Runtime rule

Runtimes load only packaged files or immutable packaged bytes. A source
directory may be compiled by an authoring tool, but it is not a runtime asset
and cannot be used as Runtime Capsule evidence.

See [SPEC.md](../../SPEC.md) and
[`schema/manifest.schema.json`](../../schema/manifest.schema.json).
