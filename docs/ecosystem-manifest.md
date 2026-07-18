# Ecosystem Manifest

[`ecosystem-manifest.json`](../ecosystem-manifest.json) is the machine-readable
inventory of the public KDNA ecosystem. Schema 2 separates repository identity,
package identity, release artifacts, and conformance anchors so that one
repository can own multiple packages without duplicate component records or
consumer-specific exceptions.

The JSON contract is defined by
[`schema/ecosystem-manifest.schema.json`](../schema/ecosystem-manifest.schema.json).
Unknown fields and the former component-level `npm_package`, `package_json`,
`current_version`, and `artifact_path` fields are rejected, as is the former
empty top-level `repositories` placeholder.

## Records

Each repository appears exactly once in `components[]` and declares explicit
`packages[]` and `artifacts[]` arrays.

Package paths are relative to their repository root. Package records use these
release statuses:

| Status | Meaning |
| --- | --- |
| `active` | A current npm package and managed dependency coordinate. |
| `candidate` | Versioned, publishable source that has not yet passed registry publication acceptance. Both coordinates must be stable SemVer and the candidate must be newer than `published_version`. The candidate remains outside current-published projections until promoted, while the incumbent registry release and candidate main source remain separate release-health checks. |
| `compatibility` | A maintained migration bridge. Its own dependencies remain current, but new integrations should use its declared replacement. |
| `deprecated` | A historical npm coordinate with frozen, non-publishable source and an explicit replacement. |
| `source-only` | A public source package or application that is not an npm publication. |

Artifacts record their repository-relative path, exact version, SHA-256,
GitHub Release tag and commit, and the Core conformance commit used to verify
them. The `aikdna/kdna-assets` artifact set must be an exact two-way projection
of its accepted `index/current.json`; a new asset or Cluster cannot appear on
only one side. `source_commit` identifies an accepted repository checkout;
`conformance_commit` identifies a separate fixture or contract anchor and must
not be interpreted as that repository's release commit. A live package-less
component records `component_version`, `release_tag`, and `release_commit`
separately, because its accepted source checkout may be newer than its current
public release. The current ecosystem conformance anchor is fixed to the exact
Git commit behind the declared `@aikdna/kdna-core` release tag; component and
artifact anchors cannot select a different reachable Core ancestor.

## Consumer Rules

- Select npm packages by the unique `npm_package` value, never by repository
  alone.
- Select repositories by their unique `repository` value.
- Do not infer package maturity from repository maturity; co-located packages
  can have different lifecycles.
- Do not treat `candidate`, `compatibility`, or `deprecated` packages as recommended new
  dependencies.
- Verify the schema before consuming helper projections. A missing or malformed
  array is an error, not an empty inventory.

Schema 2 is a hard cutover. There is no schema-1 alias or dual reader in the
official gates.
