# KDNA Tool Status Matrix

> Last updated: 2026-07-19. Matches `@aikdna/kdna-cli@0.35.1`.
> `Released` means the command is present in the published package; it is not a
> claim that the overall Beta protocol/toolchain has reached GA.

## Runtime CLI (`@aikdna/kdna-cli@0.35.1`)

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
| `kdna revoke <asset>` | Issue signed revocation | Released |
| `kdna revocation status <asset>` | Check revocation status | Released |
| `kdna load --remote-server <url>` | Load `access:remote` assets via server | Released |
| `kdna route <asset-path>` | Select a primary framework and emit a trace | Beta |
| `kdna compose <asset-path>` | Compose a primary with bounded advisors | Beta |
| `kdna project <asset-path>` | Render a packaged asset as a task-safe projection | Beta |
| `kdna eval-consumption <asset-path>` | Evaluate a consumption policy with replay and gates | Beta |
| `kdna eval asset <asset-path>` | Emit an Asset Assay observation matrix; CLI inputs do not create provenance claims | Experimental |
| `kdna eval cluster <plan>` | Emit fail-closed Cluster diagnostics; trust/economics promotion remains inside a trusted Eval API producer | Experimental |
| `kdna compose-review-workbook` | Generate a review workbook from diagnostics | Beta |
| `kdna validate-compose-decisions` | Validate a decision ledger against fixture evidence | Beta |
| `kdna apply-reviewed-compose-decisions` | Create disabled candidate sidecar entries | Beta |
| `kdna workpack <init\|validate\|plan\|run\|report>` | WorkPack pipeline | Experimental |
| `kdna doctor [--agents]` | Installation health check | Released |
| `kdna setup` | First-time setup wizard | Released |

## Studio (`@aikdna/kdna-studio-cli@0.10.2`)

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
| `kdna-loader` skill | **Beta** — supports OpenCode, Codex, Claude Code, Cursor, Gemini. Auto-install via `kdna setup`. |
| MCP server adapter | Experimental |

## Package Boundaries

| Package | Status |
|---|---|
| `@aikdna/kdna-core@0.20.0` | Beta runtime SDK |
| `@aikdna/kdna-eval@0.3.2` | Released Experimental evaluation toolkit; issuer-scoped evidence is not KDNA Core authority |
| `@aikdna/kdna@0.13.2` candidate | Prepared Legacy compatibility update for CLI 0.35.1; 0.13.1 remains published until registry acceptance |

## Native Apps

Application products have independent release and maturity lifecycles. Their
private development status is not part of the open protocol's tool matrix.

## Swift Package Boundaries

| Package | Public release | Status |
|---|---|---|
| `kdna-core-swift` | `0.20.0` | Beta runtime; conformance is pinned to the current Core fixture commit. |
| `kdna-studio-swift` | `0.4.0` | Beta authoring kernel; the published release predates current Swift Core integration and awaits recertification. |
| `kdna-app-shared` | `0.5.0` | Beta presentation infrastructure; the published release predates Swift Core 0.20.0 and awaits recertification. |

## Archived / Removed

| Component | Notes |
|---|---|
| `kdna-vscode` | Archived 2026-06-25. Use `kdna-cli` for validate/plan-load/pack/unpack. |
| `@aikdna/agent` | Deprecated legacy npm coordinate. Use the `kdna-loader` integration. |
| `@aikdna/kdna-artifact-engine` | Deprecated historical implementation of a withdrawn draft contract. |
| `@aikdna/kdna-fidelity-core` | Deprecated historical implementation of a withdrawn draft contract. |
| Legacy `kdna install <url>` | Was registry-based install, removed in 0.27.0. Current `kdna install` installs local files. |
| `kdna registry` | Registry distribution is not part of the current local-file path. |
