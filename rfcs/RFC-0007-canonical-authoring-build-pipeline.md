# RFC-0007: Canonical Authoring and Asset Build Pipeline

Status: active

## Summary

A trusted `.kdna` asset is not created by writing JSON files or packaging an
arbitrary source directory. It is compiled by a Studio-compatible authoring
pipeline that performs human confirmation, validation, canonicalization,
identity generation, digest computation, signing, optional encryption, and
provenance recording.

## Motivation

KDNA's value is not a folder of JSON files. It is a governed judgment asset:
human-reviewed judgment cards are transformed into a verifiable, immutable,
installable `.kdna` file. If runtime tools or agents can produce trusted
assets by zipping arbitrary files, the ecosystem loses Human Lock semantics,
quality evidence, registry trust, and asset identity.

This RFC makes the asset build pipeline a protocol requirement for trusted
assets.

## Normative Rules

1. A trusted `.kdna` asset MUST be produced by a Studio-compatible compiler.
2. A Studio-compatible compiler MUST validate Studio project state before
   export.
3. All judgment-class cards that enter compiled KDNA content MUST have Human
   Lock evidence.
4. The compiler MUST generate or preserve stable asset identity fields:
   `domain_id`, `registry_name`, `project_uid`, `asset_uid`, `build_id`,
   `version`, and `judgment_version`.
5. The compiler MUST compile locked cards into canonical KDNA internal entries,
   including at minimum `KDNA_Core.json` and `KDNA_Patterns.json`.
6. The compiler MUST run schema validation, cross-file validation, ID
   uniqueness checks, and language/version consistency checks.
7. The compiler MUST generate `KDNA_CARD.json` when governance metadata exists.
8. The compiler MUST generate build provenance and expose it in `kdna.json`
   under `authoring`.
9. The exporter MUST include the root `mimetype` entry with the exact content
   `application/vnd.aikdna.kdna+zip`.
10. The exporter MUST canonicalize internal content before computing
    `content_digest`.
11. The exporter MUST compute `asset_digest` over the complete `.kdna` file
    bytes and record it outside the container, such as in a registry entry,
    receipt, or lockfile.
12. The exporter MUST sign the canonical payload for assets that claim trusted
    quality, registry promotion, licensed access, or runtime access.
13. The exporter MAY encrypt protected internal entries for licensed assets,
    but encryption MUST follow RFC-0008.
14. The exporter MUST emit an immutable `.kdna` asset and a local build receipt.
15. Runtime CLI tools MUST NOT promote dev source bundles as trusted assets.

## Required Build Artifacts

Studio export SHOULD produce the following local files:

- `dist/<domain>.kdna`
- `build-receipt.json`
- `provenance-report.json`
- `quality-gate-report.json`
- `human-lock-report.json`
- `eval-report.json`

The `.kdna` container SHOULD include:

- `mimetype`
- `kdna.json`
- `KDNA_Core.json`
- `KDNA_Patterns.json`
- optional `KDNA_*.json` entries
- `KDNA_CARD.json`
- `README.md`
- `LICENSE`
- `evals/`
- `reports/`
- `signature.json` or manifest signature metadata

## Role Boundaries

Studio creates and compiles KDNA. CLI verifies, installs, loads, compares, and
publishes existing `.kdna` assets. Registry distributes trusted assets and
enforces trust gates. Agents load and use KDNA; they do not create final
trusted assets.

## Compatibility Impact

Existing manually authored source directories may remain useful as dev source
workspaces. They MAY be schema-valid and MAY be bundled for diagnostics, but
they MUST NOT be treated as registry-trusted assets unless compiled by a
Studio-compatible compiler.

## Conformance Requirements

A conforming Studio-compatible compiler MUST provide:

- Human Lock gate enforcement.
- Deterministic internal content generation.
- Asset identity generation.
- Canonicalization and digest computation.
- Build provenance.
- Standard report artifacts.
- Signature support for trusted publication.
- RFC-0008 encryption support when it emits licensed assets.

## Security Considerations

Human Lock fields, provenance metadata, digest fields, and signature payloads
are part of the trust boundary. Tools MUST treat direct source-directory
packaging as non-canonical because a structurally valid JSON tree does not prove
judgment quality, authoring origin, or human confirmation.

## Open Questions

- Whether `uuidv7` should become the only accepted form for `asset_uid` and
  `project_uid`, or whether other collision-resistant stable identifiers are
  acceptable for third-party Studio-compatible tools.
- Whether `build-receipt.json` should be standardized as a detached JSON schema
  in v1.1.
