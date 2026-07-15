# Naming Style

Status: 1.0-rc public naming canon

## Canonical Names

| Concept | Public name |
| --- | --- |
| Protocol | KDNA Protocol |
| File format | `.kdna` |
| Asset | KDNA Domain Asset |
| Organization / ecosystem brand | AIKDNA |
| Runtime CLI command | `kdna` |
| Studio CLI command | `kdna-studio` |
| Runtime core package | `@aikdna/kdna-core` |
| Runtime CLI package | `@aikdna/kdna-cli` |
| Studio core package | `@aikdna/kdna-studio-core` |
| Studio CLI package | `@aikdna/kdna-studio-cli` |
| Reference app | a KDNA-compatible client |
| Authoring app | An authoring environment |

## Scope And Domain Names

Use scoped names in public protocol surfaces:

```text
@scope/domain_name
```

The public display name may use spaces or hyphens. The protocol identity should keep the exact `name` value in `kdna.json` and registry metadata.

Rules:

- Prefer snake_case for `domain_id` and scoped package names.
- Prefer hyphenated GitHub repository names, for example `kdna-agent-safety`.
- Do not mix `KDNAStudio`, `KDNaStudio`, and `Authoring environment` in public copy. Use `KDNA Studio Compatible` when referring to the authoring standard.
- Treat `KDA` as a misspelling, not an alias.

## Boundary Statement

KDNA remains the protocol and compatibility name. AIKDNA is the official ecosystem and product brand.

Use:

- "Powered by KDNA"
- "Compatible with KDNA"
- "Built by AIKDNA"

Avoid:

- "KDA"
- "KDNA asset operating system" as the first public definition
- "single .kdna file" when the correct concept is a scoped KDNA Domain Asset

