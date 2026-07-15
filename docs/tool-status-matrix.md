# KDNA Tool Status Matrix

> Last updated: 2026-07-14. Matches `@aikdna/kdna-cli@0.31.1`.
> `Released` means the command is present in the published package; it is not a
> claim that the overall Beta protocol/toolchain has reached GA.

## Runtime CLI (`@aikdna/kdna-cli@0.31.1`)

| Command | Purpose | Status |
|---|---|---|
| `kdna validate <path>` | Format / schema / payload / checksums / load-contract | Released |
| `kdna inspect <path>` | Inspect manifest metadata | Released |
| `kdna plan-load <path>` | LoadPlan with entitlement diagnostics | Released |
| `kdna load <path> --profile=... --as=...` | Render judgment context | Released |
| `kdna pack <dir> <out.kdna>` | Canonical-order ZIP pack; transport bytes are compressor-bound | Released |
| `kdna unpack <file.kdna> <dir>` | Unpack container | Released |
| `kdna demo judgment <dir>` | Create a current-format judgment demonstration | Released |
| `kdna install <file.kdna>` | Install to local asset store | Released |
| `kdna list` | List installed assets | Released |
| `kdna remove <name>` | Remove installed asset | Released |
| `kdna identity init` | Create Ed25519 signing key | Released |
| `kdna identity show` | Show public key | Released |
| `kdna sign <file.kdna>` | Sign with identity key | Released |
| `kdna verify <file.kdna>` | Verify signature | Released |
| `kdna revoke <sig.kdsig>` | Issue signed revocation | Released |
| `kdna revocation-status <sig.kdsig>` | Check revocation status | Released |
| `kdna load --remote-server <url>` | Load `access:remote` assets via server | Released |
| `kdna route <asset-path>` | Select a primary framework and emit a trace | Beta |
| `kdna compose <asset-path>` | Compose a primary with bounded advisors | Beta |
| `kdna project <asset-path>` | Render a packaged asset as a task-safe projection | Beta |
| `kdna eval-consumption <asset-path>` | Evaluate a consumption policy with replay and gates | Beta |
| `kdna compose-review-workbook` | Generate a review workbook from diagnostics | Beta |
| `kdna validate-compose-decisions` | Validate a decision ledger against fixture evidence | Beta |
| `kdna apply-reviewed-compose-decisions` | Create disabled candidate sidecar entries | Beta |
| `kdna workpack <init\|validate\|plan\|run\|report>` | WorkPack pipeline | Experimental |
| `kdna doctor [--agents]` | Installation health check | Released |
| `kdna setup` | First-time setup wizard | Released |

## Studio (`@aikdna/kdna-studio-cli@0.9.1`)

| Command | Purpose | Status |
|---|---|---|
| `kdna-studio create <dir> --name <name>` | Create Studio project | Released |
| `kdna-studio card add <project> <type> --field k=v` | Add judgment card | Released |
| `kdna-studio card approve <project> --all --by <id> --statement <text>` | Record optional author-review provenance | Released |
| `kdna-studio card list <project>` | List cards | Released |
| `kdna-studio card update / remove` | Edit cards | Released |
| `kdna-studio export <project> --out <file.kdna>` | Export to `.kdna` | Released |
| `kdna-studio migrate <dir> --out <file.kdna>` | Migrate existing source | Released |
| `kdna-studio llm config` | Configure LLM provider | Released |
| `kdna-studio distill / interview / feynman` | AI-assisted authoring | Experimental |

## Agent Adapter (`kdna-skills`)

| Component | Status |
|---|---|
| `kdna-loader` skill | **Stable** — supports OpenCode, Codex, Claude Code, Cursor, Gemini. Auto-install via `kdna setup`. |
| MCP server adapter | Stable |

## Native Apps

Application products have independent release and maturity lifecycles. Their
private development status is not part of the open protocol's tool matrix.

## Archived / Removed

| Component | Notes |
|---|---|
| `kdna-vscode` | Archived 2026-06-25. Use `kdna-cli` for validate/plan-load/pack/unpack. |
| Legacy `kdna install <url>` | Was registry-based install, removed in 0.27.0. Current `kdna install` installs local files. |
| `kdna registry` | Registry distribution is not part of the current local-file path. |
