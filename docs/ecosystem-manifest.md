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

Repository mission, component lifecycle, release-wave membership, and
compatibility promises are separate facts. `Pre-release` and `Experimental`
describe current component maturity; they do not remove an integration's
mission or require every repository to ship in the same wave. `Unassessed`
retains the repository mission while making no maturity or compatibility claim;
it is excluded from a release wave until a fact card is owner-reviewed.
`Legacy` and `Removed` may be used only for explicitly identified historical
coordinates or repositories, not inferred from missing a release milestone.

Package paths are relative to their repository root. Package records use these
release statuses:

| Status | Meaning |
| --- | --- |
| `active` | A current npm package and managed dependency coordinate. |
| `candidate` | Versioned, publishable source that has not yet passed registry publication acceptance. `published_version` stays a strict `x.y.z` registry incumbent; `version` is the source coordinate, may carry a SemVer prerelease (for example `0.24.0-rc.component-semantics.2`), and must be newer than `published_version` under SemVer precedence. The candidate remains outside current-published projections until promoted, while the incumbent registry release (`version` in `release-health-policy.json`) and the candidate source (`candidate_version` there) remain separate release-health checks. |
| `compatibility` | A maintained migration bridge. Its own dependencies remain current, but new integrations should use its declared replacement. |
| `deprecated` | A historical npm coordinate with frozen, non-publishable source and an explicit replacement. |
| `source-only` | A public source package or application that is not an npm publication. |

Artifacts record their repository-relative path, exact version, SHA-256,
GitHub Release tag and commit, and the Core conformance commit used to verify
them. The `aikdna/kdna-assets` artifact set must be an exact two-way projection
of its accepted `index/current.json`; a new asset or Cluster cannot appear on
only one side. `source_commit` identifies an accepted repository checkout —
it is a verified acceptance coordinate, not a live mirror of that repository's
main branch, so a component may legitimately advance on its own main until the
next acceptance. The exception is a locked consumer: when another
manifest-listed component merges a change that consumes the producer at a
newer coordinate than the manifest records (for example a SwiftPM pin that
tracks the producer's main), the producer's `source_commit` must be advanced
to that consumed coordinate in the same acceptance window, so the manifest
never contradicts what a locked consumer actually resolves.
`conformance_commit` identifies a separate fixture or contract anchor and must
not be interpreted as that repository's release commit. A live package-less
component records `component_version`, `release_tag`, and `release_commit`
separately, because its accepted source checkout may be newer than its current
public release. For an active published Core line, the ecosystem conformance
anchor is fixed to the exact Git commit behind its declared release tag. While
Core is explicitly recorded as a newer `candidate`, an unregistered anchor
must descend from the published tag and contain the exact candidate package
version, including its SemVer prerelease. The separately registered historical
fixture anchor in `scripts/conformance-anchors.json` retains its original
commit and exact tree, with an explicit `historical-contract-fixture` scope
and the Core package identity actually present in that tree. The validator
checks that closed identity against the fixed historical Git bytes; it does
not substitute the current candidate version. Reachability, the published-tag
ancestor requirement, and the exact-tree check still apply. This exception is
limited to that registered historical identity and does not alter the active
published Core rule. Component and artifact anchors cannot select a different
Core commit.

The registered historical fixture does not certify the current candidate or
renew any repository, artifact, or workflow acceptance. Current `candidate`
coordinates still match their source package manifests, while
`scripts/ecosystem-source-inventory.json` and its source gate separately bind
current source trees, package contents, and actual CI observations. Advancing
the candidate source does not rewrite the historical anchor or claim that all
17 repositories have been revalidated against it.

## Consumer Rules

- Select npm packages by the unique `npm_package` value, never by repository
  alone.
- Select repositories by their unique `repository` value.
- Do not infer package maturity from repository maturity; co-located packages
  can have different lifecycles.
- Do not infer repository lifecycle from release-wave membership or dependency
  policy. Lifecycle changes require an explicit owner decision.
- Do not treat `candidate`, `compatibility`, or `deprecated` packages as recommended new
  dependencies.
- Verify the schema before consuming helper projections. A missing or malformed
  array is an error, not an empty inventory.

Schema 2 is a hard cutover. There is no schema-1 alias or dual reader in the
official gates.
