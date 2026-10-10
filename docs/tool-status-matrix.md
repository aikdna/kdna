# KDNA Tool Status Matrix

Current source entry: 2026-10-09. Use the [support matrix](current-release-support.md)
for exact channel availability and the [actual Agent task](../examples/native-team-update/README.md)
for selected Read, revision and reopened use.

| Current entry | Commands and boundary |
| --- | --- |
| Native CLI `0.39.0-rc.native-sections.3`, exact Core `0.37.1-rc.browser.1` / Read `0.11.2-rc.browser.1` | `create`, `inspect`, `validate`, `read`, `source-open`, `source-pack`; explicit local permissions, container0.6, Read0.7-candidate; no Plan/load. |
| MCP `0.8.0-rc.native-sections.1` with the same native graph | Operator-bound catalog/read/expand/cancel; named Host delivery NOT_RUN; no decryption. |
| StudioCLI `0.13.0-rc.components.2` / StudioCore `4.0.0-rc.components.2` | Separate container0.5/Read0.6.4 session creation/revision/export; ordinary static read/verify. Protected saved-file Read/Source revision uses the [separate trusted Host](https://github.com/aikdna/kdna-skills/blob/main/kdna-creator/references/studio-protected-host.md). |

The following dated descriptions preserve the older source and published
observations. They do not describe the current entries above. In particular,
the historical protection CLI and material-edit Studio combinations below
are not an installation recipe for these source candidates.


> CLI, Studio and MCP local source descriptions reviewed: 2026-09-23. The published command inventory
> remains the 2026-09-13 observation of `@aikdna/kdna-cli@0.36.1`.
> `Released` means the command is present in the published package; it is not a
> claim that the overall pre-release protocol/toolchain has reached GA.
> Current local candidates have their own exact bindings and command forms.
> This table preserves the published 0.36.1 observation and does not claim
> that current candidate bytes have been published or are on remote `main`.
>
> **The published command set is a strict allowlist.** Any command not listed
> below exits 2 with `command is not in the approved allowlist`. Read that
> message as "this command is not in *this* published version", not as a
> statement that the capability never existed.

## Preserved Runtime CLI source observation, 2026-09-23 (`@aikdna/kdna-cli@0.40.0-rc.protection.1`)

The [CLI source candidate](https://github.com/aikdna/kdna-cli#readme) is **not an
npm release**. Its [binding](https://github.com/aikdna/kdna-cli/blob/main/public-contract-binding.json)
pins Core `0.34.0-rc.combination.1` / Read `0.9.0-rc.combination.1`, not the
protocol repository's Core `0.35.0-rc.source.1` / Read `0.10.0-rc.source.1`.
Use Node >=22 and the complete locked delivery described by the CLI README.
The [source entry](./core-read-current-status.md#choose-and-obtain-one-matching-delivery)
separates local candidates, remote source and published history.

| Command | Purpose |
|---|---|
| `kdna inspect <asset.kdna>` | Technical metadata and digests, no disclosure content |
| `kdna validate <asset.kdna>` | Admission status and public diagnostics |
| `kdna read <asset.kdna> --mode catalog\|whole_asset\|exact_selection --budget <bytes> [--allow-read]` | Authorized public Read disclosure; exact selection also requires asset ID/version and judgment ID |
| `kdna read <asset.kdna> --session [--allow-read]` | One public ReadRequest JSON object per input line; expand uses the same session |
| `kdna plan <asset.kdna> --asset-id <id> --asset-version <version> --judgment-id <id> --task <text> --allow-read` | Supply a static consumption Plan; save the successful response's `plan` member for load |
| `kdna load <asset.kdna> --plan <plan.json> --allow-read` | Admit the Plan and supply the bound Runtime Capsule; optional `--capsule` verifies a supplied Capsule |

`plan` and `load` are available static supply operations. Their result keeps
`proof: static_supply_not_execution` and `action_authorized: false`.
Retired authoring, packing, conversion and execution commands are unsupported.
Read defaults to denial; explicit local read permission is not action authority.
For protected/credential command forms and their additional owned secret-FD
boundary, use the CLI README. Their presence does not prove production native
credential storage. Never mix these forms with `plan-load` or the published
`load --profile=compact --as=json` syntax below.

## Preserved Studio source observation, 2026-09-23 (`@aikdna/kdna-studio-cli@0.17.0-rc.material-edit.1`)

The [Studio CLI source](https://github.com/aikdna/kdna-studio-cli#readme) binds
Studio Core `4.5.0-rc.material-edit.1`, Core `0.35.0-rc.source.1` and Read
`0.10.0-rc.source.1` in its
[archive/member declarations](https://github.com/aikdna/kdna-studio-cli/blob/main/src/public-bindings.json).
Use Node >=22 and the [fixed complete source delivery](./core-read-current-status.md#choose-and-obtain-one-matching-delivery), including its lock and vendor archives; the standalone npm archive is not that delivery. This local unpublished update does not update official remote source or npm releases.
Its source commands include `session`, `draft`, `revision`, `verify --bundle` and
`read --bundle`. Bounded `revision` requires an externally named predecessor
and expected digest, a later version/timestamp, a new output directory and
fresh live selection and confirmation; use the [terminal revision guide](https://github.com/aikdna/kdna-studio-cli/blob/main/docs/TERMINAL_AGENT_CREATION.md#saved-source-revision) in the matching source delivery. Draft persistence does not restore a live adoption session:
selection, current preview and fresh confirmation are still required.
Live adoption, saved-byte verification and static reopening are distinct
results; a test callback or serialized evidence is not human acceptance.
The published project/card commands below retain their own versions.
Source availability does not establish publication or native Host support.

## Published command inventory

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
| MCP server adapter | **Stale marker (2026-10-10):** the combination named in this row is a superseded local observation, not the current entry. The current source channel is MCP `0.8.0-rc.native-sections.1` over the same native graph as the row at the top of this page; the [canonical entry](https://github.com/aikdna/kdna-skills#readme) is unchanged. Named Host delivery, semantic adoption and real human acceptance remain `not_run`. |

## Package Boundaries

| Package | Status |
|---|---|
| `@aikdna/kdna-core@0.22.0` | Published pre-release runtime SDK; 2026-09-13 registry observation in the version matrix |
| `@aikdna/kdna-eval@0.3.2` | Released Experimental evaluation toolkit; issuer-scoped evidence is not KDNA Core authority |
| `@aikdna/kdna@0.14.0` | Released, maintained Legacy compatibility bridge for CLI 0.36.1; new integrations use CLI and Core directly |

## Native Apps

Application products have independent release and maturity lifecycles. Their
private development status is not part of the open protocol's tool matrix.

## Swift Package Boundaries

| Package | Public release | Status |
|---|---|---|

## Editor and Legacy Coordinates

| Component | Notes |
|---|---|
| `@aikdna/agent` | Deprecated legacy npm coordinate. Use the explicit-file runtime path; Agent adapters require recertification. |
| `@aikdna/kdna-artifact-engine` | Deprecated historical implementation of a withdrawn draft contract. |
| `@aikdna/kdna-fidelity-core` | Deprecated historical implementation of a withdrawn draft contract. |
| Legacy `kdna install <url>` | Removed in 0.27.0 and not reintroduced in 0.36.1: `install` is not in the allowlist above, so `kdna install <url>`, `kdna install ./file.kdna`, `kdna install <bare>` and `kdna install @scope/name` all exit 2 with `command is not in the approved allowlist`. To bring in a local asset, approve the exact `.kdna` file with `kdna attach` instead. |
| `kdna registry` | Registry resolution requires an explicit `KDNA_REGISTRY_URL`; there is no default public registry, and registry distribution is out of scope for KDNA Core. |
