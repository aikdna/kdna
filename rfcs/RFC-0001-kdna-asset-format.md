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

## Conformance

Implementations MUST pass the conformance fixtures for required entries,
manifest inspection, digest verification, and profile loading.
