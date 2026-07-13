# KDNA Tool Status Matrix

> Last updated: 2026-07-13. Matches `@aikdna/kdna-cli@0.30.3`.

## Runtime CLI (`@aikdna/kdna-cli@0.30.3`)

| Command | Purpose | Status |
|---|---|---|
| `kdna validate <path>` | Format / schema / payload / checksums / load-contract | GA |
| `kdna inspect <path>` | Inspect manifest metadata | GA |
| `kdna plan-load <path>` | LoadPlan with entitlement diagnostics | GA |
| `kdna load <path> --profile=... --as=...` | Render judgment context | GA |
| `kdna pack <dir> <out.kdna>` | Deterministic ZIP pack | GA |
| `kdna unpack <file.kdna> <dir>` | Unpack container | GA |
| `kdna demo judgment <dir>` | Create a current-format judgment demonstration | GA |
| `kdna install <file.kdna>` | Install to local asset store | GA |
| `kdna list` | List installed assets | GA |
| `kdna remove <name>` | Remove installed asset | GA |
| `kdna identity init` | Create Ed25519 signing key | GA |
| `kdna identity show` | Show public key | GA |
| `kdna sign <file.kdna>` | Sign with identity key | GA |
| `kdna verify <file.kdna>` | Verify signature | GA |
| `kdna revoke <sig.kdsig>` | Issue signed revocation | GA |
| `kdna revocation-status <sig.kdsig>` | Check revocation status | GA |
| `kdna load --remote-server <url>` | Load `access:remote` assets via server | GA |
| `kdna route <asset-path>` | Select a primary framework and emit a trace | Beta |
| `kdna compose <asset-path>` | Compose a primary with bounded advisors | Beta |
| `kdna project <asset-path>` | Render a packaged asset as a task-safe projection | Beta |
| `kdna eval-consumption <asset-path>` | Evaluate a consumption policy with replay and gates | Beta |
| `kdna compose-review-workbook` | Generate a review workbook from diagnostics | Beta |
| `kdna validate-compose-decisions` | Validate a decision ledger against fixture evidence | Beta |
| `kdna apply-reviewed-compose-decisions` | Create disabled candidate sidecar entries | Beta |
| `kdna workpack <init\|validate\|plan\|run\|report>` | WorkPack pipeline | Experimental |
| `kdna doctor [--agents]` | Installation health check | GA |
| `kdna setup` | First-time setup wizard | GA |

## Studio (`@aikdna/kdna-studio-cli@0.8.16`)

| Command | Purpose | Status |
|---|---|---|
| `kdna-studio create <dir> --name <name>` | Create Studio project | GA |
| `kdna-studio card add <project> <type> --field k=v` | Add judgment card | GA |
| `kdna-studio card approve <project> --all --by <id> --statement <text>` | Record optional author-review provenance | GA |
| `kdna-studio card list <project>` | List cards | GA |
| `kdna-studio card update / remove` | Edit cards | GA |
| `kdna-studio export <project> --out <file.kdna>` | Export to `.kdna` | GA |
| `kdna-studio migrate <dir> --out <file.kdna>` | Migrate existing source | GA |
| `kdna-studio llm config` | Configure LLM provider | GA |
| `kdna-studio distill / interview / feynman` | AI-assisted authoring | Experimental |

## Agent Adapter (`kdna-skills`)

| Component | Status |
|---|---|
| `kdna-loader` skill | **Stable** — supports OpenCode, Codex, Claude Code, Cursor, Gemini. Auto-install via `kdna setup`. |
| MCP server adapter | Stable |

## Native Apps

| App | Status |
|---|---|
| KDNAChat (macOS) | In development |
| KDNaStudio (macOS) | In development |
| KDNAChat iOS / KDNaStudio iOS | Early development |

## Archived / Removed

| Component | Notes |
|---|---|
| `kdna-vscode` | Archived 2026-06-25. Use `kdna-cli` for validate/plan-load/pack/unpack. |
| Legacy `kdna install <url>` | Was registry-based install, removed in 0.27.0. Current `kdna install` installs local files. |
| `kdna registry` | Registry distribution is not part of the current local-file path. |
