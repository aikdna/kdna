# Current Release Support & Distribution History

Updated: `2026-11-18`. The machine-readable source of truth for all published npm versions, SHA-256 digests, and preserved preview tags is [`release-coordinates.json`](./release-coordinates.json).

## Active Stable Line (Container `0.6.0`)

Use these exact coordinates for all new `.kdna` works, CLI workflows, and SDK integrations:

| Package | Version | npm tag | Runtime | Role |
| --- | --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | `latest` | Node `>=20` | Container `0.6.0` & `0.5.0` admission, Canonical IR, packing, local encryption |
| `@aikdna/kdna-read` | `0.13.5` | `latest` | Node `>=20` | Selective Read protocol (`catalog`, `exact_selection`, `expand`, unlock) |
| `@aikdna/kdna-cli` | `0.44.0` | `latest` | Node `>=22` | Official CLI (`init`, `create`, `protect`, `validate`, `read`, `diff`, `source-open`, `source-pack`, `convert`) |
| `@aikdna/kdna-mcp-server` | `0.8.0` | `latest` | Node `>=22` | Optional local stdio MCP adapter in [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) |

## Preserved Legacy Packages (Container `0.5.0` & Compatibility)

| Package | Version | npm tag | Status |
| --- | --- | --- | --- |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | Archived Container `0.5.0` Studio session SDK (not used for `0.6.0`) |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | Archived Container `0.5.0` Studio CLI (use `@aikdna/kdna-cli@0.44.0` instead) |
| `@aikdna/kdna-conformance` | `0.2.0` | `latest` | Conformance vector package |
| `@aikdna/kdna` | `0.14.0` | `latest` | Legacy compatibility alias (`0.36.1` line) |

## Published channel history

Earlier published versions and preview tags remain immutable on npm with their original integrity digests and dependency graphs:

| Package | Preserved Preview Tag | Preview Version | Earlier `latest` Observed (2026-10-11) |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `browser-preview` | `0.37.1-rc.browser.1` | `0.37.0` |
| `@aikdna/kdna-read` | `browser-preview` | `0.11.2-rc.browser.1` | `0.11.1` |
| `@aikdna/kdna-cli` | `native-preview` | `0.39.0-rc.native-sections.3` | `0.36.1` |
| `@aikdna/kdna-studio-core` | `components-preview` | `4.0.0-rc.components.2` | `3.0.0` |
| `@aikdna/kdna-studio-cli` | `components-preview` | `0.13.0-rc.components.2` | `0.11.0` |

Intermediate `latest` releases (`Core 0.37.6–0.37.10`, `Read 0.13.0–0.13.4`, `CLI 0.42.0–0.43.5`, `Studio Core 4.0.0`, `Studio CLI 0.13.0`) remain available on npm under their exact published version numbers and are never overwritten. Full provenance, source commits, and release digests are recorded in [`release-coordinates.json`](./release-coordinates.json) and GitHub Releases.
