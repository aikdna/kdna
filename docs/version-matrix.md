# KDNA Version Matrix

KDNA has one current distribution format. Package versions, asset versions,
judgment versions, and wire fields describe different things and MUST NOT be
presented as competing KDNA formats.

## Version Axes

| Axis | Where it appears | Meaning |
|---|---|---|
| Container compatibility coordinate | `kdna.json` → `format_version: "0.1.0"` | The sole accepted container contract coordinate. It is not a product generation. |
| Payload profile coordinate | `kdna.json` → `compatibility.profile_version: "0.1.0"` | The contract coordinate for the selected payload profile. |
| Tool package version | npm or Swift package release | The release of a specific Core, CLI, Studio, or adapter implementation. |
| Minimum loader coordinate | `kdna.json` → `compatibility.min_loader_version` | The lowest loader package release that may load this asset. It is not a container format or capability name. |
| Asset version | `kdna.json` → `version` | Packaging and metadata release of one asset. |
| Judgment version | `kdna.json` → `judgment_version` | Release of that asset's judgment content. |
| Artifact contract coordinate | Namespaced plan, trace, evidence, or Cluster schema | Compatibility coordinate for that artifact, not for the `.kdna` container. |

Removed container discriminators are not alternate format selectors and MUST
NOT be emitted. See [`version-taxonomy.md`](./version-taxonomy.md) for naming
rules.

## Compatibility

- A distribution asset must carry `format_version: "0.1.0"`, declare
  `compatibility.profile_version: "0.1.0"`, and conform to the current
  manifest and payload schemas.
- Loaders parse `compatibility.min_loader_version` as a strict `x.y.z`
  coordinate with no leading zeros, prerelease suffix, or build metadata. A
  requirement at or below the current loader package coordinate is compatible;
  a higher requirement is blocked before projection or load with
  `KDNA_LOADER_VERSION_UNSUPPORTED`.
- Structural validity and loader compatibility are independent evidence. A
  well-formed asset can be structurally valid while requiring a newer loader.
- Package releases can change without creating another KDNA asset format.
- An asset version can change without changing its judgment version when only
  packaging or metadata changes.
- A judgment version must change when judgment-relevant content changes.

## Status Is Not Quality

These statements remain separate:

- format-valid;
- loadable now according to LoadPlan;
- signed or unsigned;
- public, licensed, or remote;
- supported by optional behavioral evidence;
- described by an author or publisher maturity claim.

None of them gives KDNA Core authority to declare the asset's judgment true,
good, recommended, or officially approved.
