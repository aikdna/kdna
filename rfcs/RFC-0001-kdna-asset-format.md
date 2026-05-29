# RFC-0001: KDNA Asset Format

Status: active

## Summary

A KDNA domain is represented, distributed, installed, verified, and loaded as a
`.kdna` asset. Internal JSON entries are implementation details of the asset
container.

## Normative Rules

- A published KDNA domain MUST be a `.kdna` asset.
- `kdna.json`, `KDNA_Core.json`, and `KDNA_Patterns.json` are required entries.
- Persistent extraction MUST NOT be required for runtime loading.
- Dev source directories MAY exist for authoring only and are non-canonical.
- Asset identity is the whole-file `asset_digest`.
- A conforming `.kdna` asset MAY NOT be created by directly packaging arbitrary
  source directories and presenting the result as trusted.
- A trusted `.kdna` asset MUST be compiled by a KDNA-compatible authoring
  pipeline that records provenance, Human Lock evidence, compiler metadata, and
  asset digest.
- Dev source directories MUST NOT be treated as installable, publishable, or
  registry-trusted assets unless compiled by a Studio-compatible compiler.

## Conformance

Implementations MUST pass the conformance fixtures for required entries,
manifest inspection, digest verification, and profile loading.
