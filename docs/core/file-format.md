# KDNA File Format

> **Container format**: KDNA Asset Container with `kdna.json` + `payload.kdnab`.
> See [version-taxonomy.md](../version-taxonomy.md) for the canonical naming scheme.
> The legacy plaintext ZIP (source-tree files directly in container) is rejected by the current validator.

A `.kdna` file is a **ZIP-compatible container** with a fixed entry layout. The format is normative; the official KDNA toolchain produces and consumes KDNA assets following this layout.

## Container layout

```
example.kdna
├── mimetype              (required, plaintext, must be the first entry)
├── kdna.json             (required, plaintext manifest)
├── payload.kdnab         (required, judgment payload; may be plaintext or encrypted)
├── signatures/           (optional, signature files keyed by signer role)
│   ├── author.sig
│   └── publisher.sig
├── attachments/          (optional, supplementary files referenced from the payload)
│   └── ...
└── checksums.json        (recommended, per-entry digests)
```

## Required entries

| Entry | Required | Encoding | Notes |
| --- | --- | --- | --- |
| `mimetype` | yes | UTF-8 plaintext | MUST be the literal string `application/vnd.kdna.asset` (no trailing newline). MUST be the first entry in the ZIP central directory so it can be read without parsing the full manifest. |
| `kdna.json` | yes | UTF-8 JSON | The manifest. See `manifest.md`. |
| `payload.kdnab` | yes | binary (CBOR or JSON) | The judgment payload. See `payload-profile.md`. May be plaintext or encrypted as a unit. Phase 1 only requires the plaintext case. |

## Optional entries

| Entry | Required | Notes |
| --- | --- | --- |
| `checksums.json` | recommended | Per-entry digests. `validate` and `load` verify declared SHA-256 digests against actual entry content. A mismatch fails validation and blocks loading. See `docs/core/load-profiles.md` for the load contract. |
| `signatures/` | optional | One or more signature files. Each file is named `<role>.sig` (e.g. `author.sig`, `publisher.sig`, `auditor.sig`). The signature is over a specific subset of entries; the manifest's `signatures` block records which subset. |
| `attachments/` | optional | Supplementary files referenced from the payload. Each attachment has a path under `attachments/`. |
| `locales/<lang>/` | optional | Localized strings. Phase 1 does not define a schema for these; localization metadata in the manifest's `scope.language` is sufficient for routing. |

## Container requirements

1. The container MUST be a valid ZIP archive.
2. `mimetype` MUST be the first entry and MUST be stored uncompressed.
3. `kdna.json` MUST be UTF-8 JSON without BOM.
4. `payload.kdnab` MUST be either UTF-8 JSON (`.json` content) or CBOR. The manifest's `payload.encoding` field declares which.
5. The container MUST be deterministic given the same input entries: a producer and a verifier that independently pack the same logical asset MUST produce byte-identical containers when the same digest algorithm is used. The official KDNA toolchain guarantees this for v1; assets that depend on non-deterministic packing are non-conformant.
6. Encryption is per-entry, not whole-container. In Phase 1, only the plaintext case is exercised. The schema for encrypted entries is reserved for Phase 3.

## Anti-patterns

- ❌ Wrapping the whole `.kdna` in another container (`.tar.gz.kdna`, `.zip.kdna`). The `.kdna` file IS the container.
- ❌ Storing the manifest as a non-root path (`/manifests/v1/kdna.json`). The manifest is always at the root of the container.
- ❌ Embedding the payload as multiple separate files (`KDNA_Core.json`, `KDNA_Patterns.json`, ...). Phase 1 collapses the payload into a single `payload.kdnab`. The multi-file layout is a v1-rc legacy shape and is not part of v1.
- ❌ Storing executable code (`.js`, `.py`, `.wasm`) inside the container that the loader is expected to execute. KDNA Core is data-only; any execution semantics belong to runtime extensions defined outside this spec.

## Versioning

The container format version is recorded in the manifest as `kdna_version`. Phase 1 targets `kdna_version: "1.0"`. A loader encountering an unknown `kdna_version` SHOULD treat the asset as `version_incompatible` per the trace vocabulary and refuse to load it.
