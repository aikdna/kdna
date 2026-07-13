# KDNA Version Matrix

KDNA has one current distribution format. Package versions, asset versions,
judgment versions, and wire fields describe different things and MUST NOT be
presented as competing KDNA formats.

## Version Axes

| Axis | Where it appears | Meaning |
|---|---|---|
| Container wire field | `kdna.json` → `kdna_version: "1.0"` | The sole accepted wire discriminator. It is not a product generation. |
| Tool package version | npm or Swift package release | The release of a specific Core, CLI, Studio, or adapter implementation. |
| Asset version | `kdna.json` → `version` | Packaging and metadata release of one asset. |
| Judgment version | `kdna.json` → `judgment_version` | Release of that asset's judgment content. |
| Candidate contract version | Namespaced plan, trace, evidence, or Cluster schema | Version of that one candidate artifact contract, not of the `.kdna` format. |

Removed top-level `format_version` and `spec_version` fields are not alternate
format selectors and MUST NOT be emitted. See
[`version-taxonomy.md`](./version-taxonomy.md) for naming rules.

## Compatibility

- A distribution asset must carry `kdna_version: "1.0"` and conform to the
  current manifest and payload schemas.
- Loaders use `compatibility.min_loader_version` and the namespaced payload
  profile to decide implementation compatibility.
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
