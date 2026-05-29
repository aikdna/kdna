# KDNA Ecosystem Naming

KDNA public names follow this order:

```text
kdna-<function>-<form>
```

- `kdna` is the ecosystem prefix.
- `<function>` names the product or capability area.
- `<form>` names the artifact shape when needed: `cli`, `core`, `swift`, `vscode`, `skills`, `registry`.

Do not shorten public npm package names to `@aikdna/cli`, `@aikdna/core`, or
`@aikdna/studio-core`. Those names hide the KDNA context in npm pages,
lockfiles, logs, and security reports.

## Tooling Names

| Layer | Repository | Package | Command | Role |
| --- | --- | --- | --- | --- |
| Protocol | `aikdna/kdna` | private monorepo | none | SPEC, schemas, docs, JS runtime core workspace |
| Runtime core | `aikdna/kdna` / `packages/kdna-core` | `@aikdna/kdna-core` | none | Load, validate, inspect, render, compose `.kdna` assets |
| Runtime CLI | `aikdna/kdna-cli` | `@aikdna/kdna-cli` | `kdna` | Agent/runtime control plane for existing `.kdna` assets |
| Studio core | `aikdna/kdna-studio-core` | `@aikdna/kdna-studio-core` | none | Authoring SDK and Studio-compatible compiler kernel |
| Studio CLI | `aikdna/kdna-studio-cli` | `@aikdna/kdna-studio-cli` | `kdna-studio` | Command-line authoring entry: create, lock, compile, export |
| Swift runtime core | `aikdna/kdna-core-swift` | SwiftPM `kdna-core-swift` | none | Native Apple runtime core |
| Swift Studio core | `aikdna/kdna-studio-swift` | SwiftPM `kdna-studio-swift` | none | Native Apple authoring core |
| Registry | `aikdna/kdna-registry` | private service/tooling | internal scripts | Trust catalog and distribution metadata |
| VS Code | `aikdna/kdna-vscode` | VS Code extension `kdna-vscode` | extension commands | Dev-source editing and diagnostics only |
| Skills | `aikdna/kdna-skills` | skill repo | none | Agent loader adapters; does not create trusted `.kdna` |
| MCP server | `@aikdna/kdna-mcp-server` | `@aikdna/kdna-mcp-server` | `kdna-mcp` | Agent-facing MCP bridge for runtime loading |

## CLI Boundary

Agents use the runtime CLI:

```bash
npm install -g @aikdna/kdna-cli
kdna install @aikdna/writing
kdna load @aikdna/writing --as=prompt
kdna compare @aikdna/writing --input "..."
```

Creators use the Studio CLI:

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my_domain --name @yourscope/my_domain
kdna-studio export my_domain --out dist/my_domain.kdna --sign
```

`kdna` MUST NOT create trusted KDNA assets. `kdna-studio` is the command-line
authoring entry for trusted creation.

## Domain Repository Names

Official domain repositories should use hyphenated GitHub names:

| Current | Target |
| --- | --- |
| `kdna-agent_safety` | `kdna-agent-safety` |
| `kdna-code_review` | `kdna-code-review` |
| `kdna-content_strategy` | `kdna-content-strategy` |
| `kdna-decision_state` | `kdna-decision-state` |
| `kdna-knowledge_management` | `kdna-knowledge-management` |
| `kdna-open_source_project` | `kdna-open-source-project` |
| `kdna-prompt_diagnosis` | `kdna-prompt-diagnosis` |
| `sketchnote-style` | `kdna-sketchnote-style` |

The internal `domain_id` MAY remain snake_case when it is part of the domain's
judgment identity. Public repository names, release assets, and documentation
URLs should use hyphenated names.

`kdna-authoring` is a domain package, not an authoring tool. Prefer a future
rename such as `kdna-authoring-guidance` if the repository name continues to
create confusion.

## Archived Names

The archived `aikdna/kdna-studio` monorepo is not an active package boundary.
It should remain a redirect to:

- `aikdna/kdna-studio-core`
- `aikdna/kdna-studio-cli`
- `aikdna/kdna-studio-swift`

If the archived repository cannot be updated, treat it as a public audit
exception rather than an active tool.
