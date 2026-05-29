# Canonical Authoring Boundary

KDNA assets are not ordinary JSON packages.

A `.kdna` asset is not created by writing JSON files. It is compiled by a
Studio-compatible authoring pipeline that performs human confirmation,
validation, canonicalization, identity generation, digest computation, signing,
optional encryption, and provenance recording.

A conforming `.kdna` asset MAY NOT be created by directly packaging arbitrary
source directories and presenting the result as trusted. A trusted `.kdna` asset
MUST be compiled by a KDNA-compatible authoring pipeline that records
provenance, Human Lock evidence, compiler metadata, and an asset digest.

Dev source directories are non-canonical workspaces for authoring tools, Git
review, diagnostics, and debugging. They MUST NOT be treated as installable,
publishable, or registry-trusted assets unless they have been compiled by an
authorized Studio-compatible compiler.

## Ecosystem Roles

Studio creates and compiles KDNA.

CLI verifies and runs KDNA.

Registry distributes trusted KDNA.

Agents load and use KDNA.

## Trusted Creation Flow

The trusted path for a `.kdna` asset is:

1. Import materials.
2. Extract judgment candidates.
3. Generate judgment cards.
4. Human review and confirmation.
5. Human Lock.
6. Studio-compatible compiler output.
7. `.kdna` asset export with identity, canonicalization, digests, signing,
   optional encryption, and authoring provenance.
8. CLI verification.
9. Signature and registry publication.
10. Agent loading and post-validation.

AI may propose judgment content. Human judgment must confirm it. Studio must
compile it. The CLI must verify and run it. The registry must distribute trusted
assets with auditable provenance.

## Authoring Provenance

`kdna.json` SHOULD include an `authoring` object. Assets that claim `tested` or
higher quality MUST include Studio-compatible authoring provenance:

```json
{
  "authoring": {
    "created_by": "kdna-studio",
    "authoring_tool": "KDNA Studio",
    "authoring_tool_version": "0.3.0",
    "compiler": "@aikdna/kdna-studio",
    "compiler_version": "0.3.0",
    "project_uid": "018f8f1c-...",
    "asset_uid": "018f8f2d-...",
    "build_id": "build_...",
    "domain_id": "writing",
    "registry_name": "@aikdna/writing",
    "content_digest": "sha256:...",
    "studio_project_digest": "sha256-...",
    "human_lock_required": true,
    "human_lock_count": 8,
    "ai_assisted": true,
    "human_confirmed": true,
    "compiled_at": "2026-05-29T00:00:00Z"
  }
}
```

Allowed `created_by` values:

- `kdna-studio`
- `kdna-studio-cli`
- `kdna-studio-sdk`
- `third-party-studio-compatible`
- `manual-dev-source`

`manual-dev-source` may exist for experimentation, but it cannot receive a
trusted registry badge. Schema validation proves structure only. It does not
prove judgment quality.

## Quality Badge Binding

| Source evidence | Highest allowed quality |
| --- | --- |
| Manual JSON or `manual-dev-source` | `untested` |
| Structure passes, no Human Lock | `untested` |
| Human Lock exists, no eval evidence | below `tested` |
| Studio provenance + Human Lock + eval cases | `tested` |
| Studio provenance + automated eval + quality report | `validated` |
| External expert review | `expert_reviewed` |
| Real deployment data + continuous eval | `production_ready` |
