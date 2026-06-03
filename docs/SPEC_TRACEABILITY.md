# SPEC Traceability

Status: v1.0-rc working traceability map

This file maps normative v1.0-rc requirements to their enforcement point. A
MUST is not considered release-ready until it is covered by at least one of:

- schema validation
- conformance fixture
- CLI behavior
- registry validation
- documented exception path

## Non-Negotiable Rules

| Requirement | Source | Enforcement | Evidence |
| --- | --- | --- | --- |
| Manifest uses `format`, `format_version`, and `spec_version`. | `SPEC.md`, `schema/kdna-manifest-v1rc.json` | Manifest schema, conformance, CLI verify | `conformance/run.mjs`, `packages/kdna-core/src/asset-reader.js`, `src/verify.js` in CLI |
| `kdna_spec` is invalid in v1.0-rc manifests. | `SPEC.md`, `docs/V1RC_RELEASE_GATE.md` | Conformance fixture, CLI verify, asset-reader test | `invalid-disallowed-kdna-spec.kdna`, `asset-reader.test.js` |
| Singular `language` is invalid; use `languages` and `default_language`. | `SPEC.md`, `specs/enum-tables.md` | Conformance fixture, manifest schema | `invalid-disallowed-language.kdna` |
| Root `mimetype` is required. | `SPEC.md`, `docs/MEDIA_TYPE.md` | Conformance fixture, asset verification | `invalid-missing-mimetype.kdna`, `asset-reader.test.js` |
| Root `mimetype` must be `application/vnd.aikdna.kdna+zip`. | `SPEC.md`, `docs/MEDIA_TYPE.md` | Registry validation, registry trust tests, CLI verify | `tests/registry-trust/run.mjs` |
| `application/x-kdna` is invalid. | `docs/MEDIA_TYPE.md`, `docs/V1RC_RELEASE_GATE.md` | Registry trust test, CLI verify | `tests/registry-trust/run.mjs` |
| `.kdna` is the canonical installed, verified, loaded, and distributed object. | `SPEC.md`, `docs/ASSET_IDENTITY_MODEL.md` | Core asset reader, CLI install/load tests, registry `asset_url` contract | `packages/kdna-core/test/asset-reader.test.js`, `kdna-cli/tests/asset-store.test.js` |
| Dev source directories are authoring/debug workspaces, not trusted runtime objects. | `SPEC.md`, `docs/CANONICAL_AUTHORING_BOUNDARY.md` | CLI publish boundary, docs | `kdna-cli` publish tests |
| Registry installable entries must use `asset_url`, `asset_digest`, and media type. | `registry/README.md`, registry schema v3.0 | Registry validator and remote digest check | `kdna-registry/scripts/validate-registry.js` |
| Yanked assets are blocked from new installs. | `docs/registry-policy.md` | Registry trust test, CLI install behavior | `tests/registry-trust/run.mjs` |
| Expired registry snapshots fail closed. | Registry trust model | Registry trust test, CLI install behavior | `tests/registry-trust/run.mjs` |
| Scoped registry entries require a trust anchor. | Registry trust model | Registry trust test, CLI install behavior | `tests/registry-trust/run.mjs` |
| Licensed/protected entries decrypt only through explicit in-memory hooks. | RFC-0008/RFC-0009 docs | Core tests and conformance | `asset-reader.test.js`, `conformance/run.mjs` |

## Open Traceability Work

The full `SPEC.md` MUST/SHOULD audit is still not complete. Before tagging
`v1.0-rc`, run a line-by-line pass over every RFC 2119 term and add it here.

Known open items:

- Signature payload v1.0 canonical content-tree mapping.
- Human Judgment Lock enforcement points outside reference docs.
- Cluster conflict attribution coverage.
- I18N overlay semantic drift fixture coverage.
- Third-party conformance claim badge generation.

