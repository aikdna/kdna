# KDNA Tool Status Matrix

> Last updated: 2026-09-13. Matches `@aikdna/kdna-cli@0.36.1`.
> `Released` means the command is present in the published package; it is not a
> claim that the overall pre-release protocol/toolchain has reached GA.
> The unreleased corrective source candidate withdraws asset-level
> sign/verify/revoke commands rather than selecting among incompatible
> signature contracts, and narrows the runtime surface further. This table
> records the exact published 0.36.1 fact and does not claim that the candidate
> has already been published.
>
> **The published command set is a strict allowlist.** Any command not listed
> below exits 2 with `command is not in the approved allowlist`. Read that
> message as "this command is not in *this* published version", not as a
> statement that the capability never existed.

## Runtime CLI (`@aikdna/kdna-cli@0.36.1`)

| Command | Purpose | Status |
|---|---|---|
| `kdna inspect <file.kdna\|source-dir>` | Inspect manifest metadata; technical only | Released |
| `kdna validate <file.kdna\|source-dir>` | Format / schema / payload / checksums / load-contract | Released |
| `kdna plan-load <file.kdna>` | LoadPlan with entitlement diagnostics | Released |
| `kdna load <file.kdna>` | Load only when Core authorizes it | Released |
| `kdna pack <source-dir> <out.kdna>` | Canonical-order ZIP pack; transport bytes are compressor-bound | Released |
| `kdna unpack <file.kdna> <empty-dir>` | Unpack a container into an empty directory | Released |
| `kdna demo <minimal\|judgment> <dir>` | Create one of the two maintained local source fixtures | Released |
| `kdna attach <file.kdna> --cwd <workspace> …` | Approve one exact asset and routing scope for one workspace | Released |
| `kdna attachments [--cwd <start>]` | List the nearest attachment record inside the workspace boundary | Released |
| `kdna resolve --cwd <start> …` | Resolve one task inside the explicit workspace boundary | Released |
| `kdna disable / enable / switch / rollback / remove <attachment-id>` | Manage one approved workspace attachment | Released |
| `kdna cleanup [--plan-digest … --yes]` | Preview or confirm one exact snapshot-cleanup plan | Released |
| `kdna host-consent [--json\|--status\|--revoke]` | Manage the Host-owned processing-consent document | Released |

The following coordinates were present in earlier published versions and are
**not** in the 0.36.1 allowlist. They now exit 2: `install`, `list`,
`identity init|show`, `sign`, `verify`, `revoke`, `revocation status`,
`doctor`, `setup`, `route`, `compose`, `project`, `eval*`,
`compose-review-workbook`, `workpack`, `validate-compose-decisions`,
`apply-reviewed-compose-decisions`, and `load --remote-server`.

The local-store and signing commands above are historical published facts, not
the canonical product model. New use starts from an explicit `.kdna` file or an
exact user-approved Host attachment. Installing a version, marking an active
version, or finding a Skill does not authorize or apply judgment.

## Unreleased Core/Read Candidate (`@aikdna/kdna-cli@0.38.0-rc.component-semantics.1`)

The source candidate in this repository is **not published**. Its command set is
smaller than the published line and delegates admission and disclosure to the
pinned public Core and Read packages:

| Command | Purpose |
|---|---|
| `kdna inspect <asset.kdna>` | Technical metadata and digests, no disclosure content |
| `kdna validate <asset.kdna>` | Admission status and public diagnostics |
| `kdna read <asset.kdna> --mode catalog\|whole_asset\|exact_selection --budget <bytes> [--allow-read]` | Authorized public Read disclosure |
| `kdna read <asset.kdna> --session [--allow-read]` | One public ReadRequest JSON object per input line |

`plan` and `load` return an explicit unavailable result until public Plan
admission and execution exist. Do not mix the two command sets in one
walkthrough.

## Studio (`@aikdna/kdna-studio-cli@0.11.0`)

| Command | Purpose | Status |
|---|---|---|
| `kdna-studio create <dir> --name <name>` | Create Studio project | Released |
| `kdna-studio create <dir> --from-folder <source-dir> --name <name>` | Import an expanded authoring project view | Released |
| `kdna-studio card add <project> <type> --field k=v` | Add judgment card | Released |
| `kdna-studio card approve <project> --all --by <id> --statement <text>` | Record optional author-review provenance | Released |
| `kdna-studio card list <project>` | List cards | Released |
| `kdna-studio card update / remove` | Edit cards | Released |
| `kdna-studio migrate <source-dir\|project> --out <file.kdna> --name <name> --by <id> --statement <text>` | Migrate a dev source or Studio project to one `.kdna` | Released |
| `kdna-studio migrate <source-dir> --check --name <name>` | Pre-flight: report blocking fields without writing | Released |
| `kdna-studio export <project> --out <file.kdna> [--allow-incomplete]` | Export a Studio project | Released |
| `kdna-studio llm config` | Configure LLM provider | Released |
| `kdna-studio distill / interview / feynman` | AI-assisted authoring | Experimental |

`kdna-studio create --from-folder` and `kdna-studio migrate` do not accept the
same template. The checked-in `templates/minimal-domain` view exports through
`migrate` only after its placeholders are replaced; see
[the authoring guide](./authoring-guide.md) for the field checks that
`migrate --check` reports.

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
| `@aikdna/kdna@0.14.0` | Released, maintained Legacy compatibility bridge for CLI 0.36.1; new integrations use CLI and Core directly |

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
| Legacy `kdna install <url>` | Removed in 0.27.0 and not reintroduced in 0.36.1: `install` is not in the allowlist above, so `kdna install <url>`, `kdna install ./file.kdna`, `kdna install <bare>` and `kdna install @scope/name` all exit 2 with `command is not in the approved allowlist`. To bring in a local asset, approve the exact `.kdna` file with `kdna attach` instead. |
| `kdna registry` | Registry resolution requires an explicit `KDNA_REGISTRY_URL`; there is no default public registry, and registry distribution is out of scope for KDNA Core. |
