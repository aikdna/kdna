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
| Evaluation toolkit | `aikdna/kdna` / `packages/kdna-eval` | `@aikdna/kdna-eval` | none | Experimental issuer-scoped replay, budget, and consumption evaluation |
| Compatibility bridge | `aikdna/kdna` / `packages/kdna` | `@aikdna/kdna` | `kdna`, `kdna-validate` | Maintained Legacy migration path; not the recommended new integration |
| Runtime CLI | `aikdna/kdna-cli` | `@aikdna/kdna-cli` | `kdna` | Inspect, validate, pack, unpack, load `.kdna` assets |
| Studio core | `aikdna/kdna-studio-core` | `@aikdna/kdna-studio-core` | none | Authoring SDK kernel |
| Studio CLI | `aikdna/kdna-studio-cli` | `@aikdna/kdna-studio-cli` | `kdna-studio` | Command-line authoring: create, card, export |
| Skills | `aikdna/kdna-skills` | skill repo | none | Agent loader adapters for discovering local `.kdna` assets |

## Experimental / Integration Path

These are not part of the current verified path:

| Layer | Repository | Package | Status |
| --- | --- | --- | --- |
| MCP server | `aikdna/kdna-skills/tree/main/mcp-server` | `@aikdna/kdna-mcp-server` | experimental |
| Core Swift | `aikdna/kdna-core-swift` | SwiftPM | macOS integration |
| Studio Swift | `aikdna/kdna-studio-swift` | SwiftPM | macOS integration |
| VS Code | `aikdna/kdna-vscode` | VS Code extension | editor integration |

## CLI Boundary

The verified path:

```bash
npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli
kdna-studio create my_domain --name @yourscope/my_domain
kdna-studio card add my_domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
kdna-studio card approve my_domain --all --by your-id --statement "I confirm this judgment for export."
kdna-studio export my_domain --out ./my_domain.kdna
kdna validate ./my_domain.kdna
kdna plan-load ./my_domain.kdna
kdna load ./my_domain.kdna --profile=compact --as=prompt
```

`kdna` is the runtime and developer CLI for local `.kdna` files. `kdna-studio`
is the command-line authoring entry for Studio-compatible projects and optional
review/provenance evidence. Trust, Human Lock, signatures, and quality claims
are separate metadata layers; they are not KDNA Core format-validity
requirements.

## Domain Repository Names

Official domain repositories should use hyphenated GitHub names.

The internal `domain_id` MAY remain snake_case when it is part of the domain's
judgment identity. Public repository names, release assets, and documentation
URLs should use hyphenated names.
