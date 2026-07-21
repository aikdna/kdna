# KDNA Tool Status Matrix

> Last updated: 2026-07-19. Matches `@aikdna/kdna-cli@0.35.1`.
> `Released` means the command is present in the published package; it is not a
> claim that the overall pre-release protocol/toolchain has reached GA.
> The unreleased corrective source candidate withdraws asset-level
> sign/verify/revoke commands rather than selecting among incompatible
> signature contracts. This table preserves the exact 0.35.1 fact and does not
> claim that the candidate has already been published.

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
| `kdna sign <file.kdna>` | Legacy asset signing | Released in 0.35.1; withdrawn from Preview candidate |
| `kdna verify <file.kdna>` | Legacy asset-signature verification | Released in 0.35.1; withdrawn from Preview candidate |
| `kdna revoke <asset>` | Legacy signed asset revocation | Released in 0.35.1; withdrawn from Preview candidate |
| `kdna revocation status <asset>` | Legacy asset revocation status | Released in 0.35.1; withdrawn from Preview candidate |
| `kdna load --remote-server <url>` | Load `access:remote` assets via server | Released |
| `kdna route <asset-path>` | Historical advanced applicability implementation | Published or candidate surface under recertification; not default |
| `kdna compose <asset-path>` | Historical multi-asset composition implementation | Published or candidate surface under recertification; not default |
| `kdna project <asset-path>` | Historical task-projection implementation | Published or candidate surface under recertification; not default |
| `kdna eval-consumption <asset-path>` | Historical consumption-evaluation implementation | Experimental; not a project or release gate |
| `kdna eval asset <asset-path>` | Historical asset-evaluation implementation | Experimental; not current project evidence |
| `kdna eval cluster <plan>` | Historical Cluster-evaluation implementation | Experimental; not current project evidence |
| `kdna compose-review-workbook` | Historical review-workbook implementation | Under recertification; not default |
| `kdna validate-compose-decisions` | Historical decision-ledger implementation | Under recertification; not default |
| `kdna apply-reviewed-compose-decisions` | Historical candidate-sidecar implementation | Under recertification; not default |
| `kdna workpack <init\|validate\|plan\|run\|report>` | Historical WorkPack implementation | Experimental; not current product contract |
| `kdna doctor [--agents]` | Legacy store and file-presence diagnostics | Released; presence is not adapter correctness |
| `kdna setup` | Historical first-time setup wizard | Released; not the recommended file-first path |

The local-store commands above are published facts, not the canonical product
model. New use starts from an explicit `.kdna` file or an exact user-approved
Host attachment. Installing a version, marking an active version, or finding a
Skill does not authorize or apply judgment.

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
| `kdna-loader` skill | **Unassessed** — mission retained; the previous broad-discovery and silent-loading model is not the current Host contract. |
| MCP server adapter | Experimental |

## Package Boundaries

| Package | Status |
|---|---|
| `@aikdna/kdna-core@0.20.0` | Released pre-release runtime SDK |
| `@aikdna/kdna-eval@0.3.2` | Released Experimental evaluation toolkit; issuer-scoped evidence is not KDNA Core authority |
| `@aikdna/kdna@0.13.2` | Released, maintained Legacy compatibility bridge for CLI 0.35.1; new integrations use CLI and Core directly |

## Native Apps

Application products have independent release and maturity lifecycles. Their
private development status is not part of the open protocol's tool matrix.

## Swift Package Boundaries

| Package | Public release | Status |
|---|---|---|
| `kdna-core-swift` | `0.20.0` | Pre-release runtime; conformance is pinned to the current Core fixture commit. |
| `kdna-studio-swift` | `0.4.0` | Pre-release authoring kernel; the published release predates current Swift Core integration and awaits recertification. |
| `kdna-app-shared` | `0.5.0` | Pre-release application integration; the published release predates Swift Core 0.20.0 and awaits recertification. |

## Editor and Legacy Coordinates

| Component | Notes |
|---|---|
| `kdna-vscode` | Editor mission retained; current maturity and exact compatibility are unassessed pending owner-reviewed recertification. |
| `@aikdna/agent` | Deprecated legacy npm coordinate. Use the explicit-file runtime path; Agent adapters require recertification. |
| `@aikdna/kdna-artifact-engine` | Deprecated historical implementation of a withdrawn draft contract. |
| `@aikdna/kdna-fidelity-core` | Deprecated historical implementation of a withdrawn draft contract. |
| Legacy `kdna install <url>` | Removed in 0.27.0. Current `kdna install ./file.kdna` installs a local `.kdna` asset; `kdna install <bare>` or `@scope/name` resolves through a configured registry. |
| `kdna registry` | Registry resolution requires an explicit `KDNA_REGISTRY_URL`; there is no default public registry, and registry distribution is out of scope for KDNA Core. |
