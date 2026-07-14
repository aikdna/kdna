# Asset Identity Model

KDNA asset identity separates semantic domain identity, Studio project identity,
build identity, and byte-level integrity.

Studio-compatible exporters generate these fields. Users and agents should not
hand-fill them for release-reviewed assets.

## Required Fields

```json
{
  "asset_uid": "uuidv7",
  "project_uid": "uuidv7",
  "build_id": "build_xxx",
  "domain_id": "macapp_development_debugging",
  "registry_name": "@scope/macapp_development_debugging",
  "version": "0.3.0",
  "judgment_version": "0.3.0",
  "content_digest": "sha256:<64-hex>",
  "asset_digest": "sha256:<64-hex>"
}
```

## Stability Rules

| Field              | Stability                                       | Owner                   | Meaning                                              |
| ------------------ | ----------------------------------------------- | ----------------------- | ---------------------------------------------------- |
| `domain_id`        | Stable while the domain meaning is stable       | Studio project          | Human-readable semantic domain slug.                 |
| `registry_name`    | Stable across published versions                | Registry / publisher    | Scoped distribution name, such as `@scope/name`.     |
| `project_uid`      | Stable for one Studio project                   | Studio                  | Links exported assets back to the authoring project. |
| `asset_uid`        | New for each exported `.kdna` asset instance    | Studio exporter         | Identifies a concrete asset artifact.                |
| `build_id`         | New for each compile/export run                 | Studio compiler         | Identifies the build event and report set.           |
| `version`          | Changes for packaging or metadata releases      | Publisher               | Semver package version.                              |
| `judgment_version` | Changes when judgment content changes           | Human reviewer / Studio | Version of the locked judgment itself.               |
| `content_digest`   | Changes when canonical internal content changes | Studio exporter         | Canonical internal content-tree hash.                |
| `asset_digest`     | Changes when final `.kdna` bytes change         | Exporter / registry     | Whole-file byte hash used for install trust.         |

## Placement

`domain_id`, `registry_name`, `project_uid`, `asset_uid`, `build_id`,
`judgment_version`, and `content_digest` SHOULD appear in `kdna.json`.

`asset_digest` MUST be recorded outside the immutable container, such as in:

- registry entry;
- local install receipt;
- detached build receipt;
- release lockfile.

Runtime Capsule 1 has a frozen historical exception: its top-level field named
`asset_digest` contains the runtime entry-set digest E, not this whole-file A.
Runtime Capsule 2 removes that ambiguity by using `digests.asset`,
`digests.content`, and `digests.runtime_entry_set` with explicit basis strings.

## Why These IDs Are Separate

One domain can have multiple Studio projects during review. One project can
produce many builds. One build can produce an encrypted and an open asset. Two
assets may share judgment content but have different signatures, encryption
metadata, or packaging bytes.

Collapsing these identities into only `name` and `version` makes provenance,
revocation, audit, and reproducibility ambiguous.
