# KDNA Ecosystem Naming

KDNA public names follow this order:

```text
kdna-<function>-<form>
```

- `kdna` is the ecosystem prefix.
- `<function>` names the product or capability area.
- `<form>` names the artifact shape when needed: `cli`, `core`.

Do not shorten public npm package names to `@aikdna/cli`, `@aikdna/core`, or
`@aikdna/studio-core`. Those names hide the KDNA context in npm pages,
lockfiles, logs, and security reports.

## Core Tooling Names

| Layer | Repository | Package | Command | Role |
| --- | --- | --- | --- | --- |
| Protocol | `aikdna/kdna` | monorepo | none | SPEC, schemas, docs, JS runtime core workspace |
| Runtime core | `aikdna/kdna` / `packages/kdna-core` | `@aikdna/kdna-core` | none | Load, validate, inspect, render `.kdna` assets |
| Runtime CLI | `aikdna/kdna-cli` | `@aikdna/kdna-cli` | `kdna` | Inspect, validate, pack, unpack, load `.kdna` assets |
| Studio core | `aikdna/kdna-studio-core` | `@aikdna/kdna-studio-core` | none | Authoring SDK kernel |
| Studio CLI | `aikdna/kdna-studio-cli` | `@aikdna/kdna-studio-cli` | `kdna-studio` | Command-line authoring: create, card, export |
| Skills | `aikdna/kdna-skills` | skill repo | none | Agent loader adapters for discovering local `.kdna` assets |

## Experimental / Integration Path

These are not part of the current v1 verified path:

| Layer | Repository | Package | Status |
| --- | --- | --- | --- |
| MCP server | `aikdna/kdna-skills/tree/main/mcp-server` | `@aikdna/kdna-mcp-server` | experimental |
| Core Swift | `aikdna/kdna-core-swift` | SwiftPM | macOS integration |
| Studio Swift | `aikdna/kdna-studio-swift` | SwiftPM | macOS integration |
| VS Code | `aikdna/kdna-vscode` | VS Code extension | editor integration |

## CLI Boundary

The v1 verified path:

```bash
npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli
kdna-studio create my_domain --name @yourscope/my_domain
kdna-studio export my_domain --format v1 --out dist/my_domain.kdna
kdna validate dist/my_domain.kdna
kdna load dist/my_domain.kdna --profile=compact --as=prompt
```

`kdna` MUST NOT create trusted KDNA assets. `kdna-studio` is the command-line
authoring entry for trusted creation.

## Domain Repository Names

Official domain repositories should use hyphenated GitHub names.

The internal `domain_id` MAY remain snake_case when it is part of the domain's
judgment identity. Public repository names, release assets, and documentation
URLs should use hyphenated names.
