# A weekly update changed by an Agent's use of KDNA

This is one executed Agent task with [synthetic weekly facts](task-facts.md).
The Agent read two preferences from a native `.kdna`, wrote a concrete weekly
update, revised the ordering preference after task feedback, reopened the new
asset, and wrote the changed update.

Read the [first update](weekly-update-before.md) and the
[final update](weekly-update-after.md). The first leads with shipped work; the
final leads with Morgan's pending Thursday decision because the next migration
action depends on it. Both link the same synthetic changelog and test log and
say what each supports. Neither assumes that Morgan approved the change.

## What the disclosed content changed

| Official Read selection | Disclosed preference | Effect on the Agent's output |
| --- | --- | --- |
| `update:order`, asset `1.0.0` | Completed changes, current blockers, then next concrete action. | The first update puts the two completion claims before the pending decision and conditional next action. |
| `update:evidence`, asset `1.0.0` | Link an observable result, state what it proves, and disclose unavailable evidence. | Each completion links its evidence with a limited proof statement. The decision is marked pending, with no decision record yet. |
| `update:order`, asset `1.1.0` | When a time-sensitive teammate decision gates the next action, put its request and deadline first; otherwise keep the routine default. | The final update opens with the Thursday decision, keeps its pending status explicit, and states both possible next actions. |
| `update:evidence`, asset `1.1.0` | Unchanged. | The final update retains the same evidence links and limits. |

The feedback was a synthetic task instruction: put the urgent teammate decision
first. The Agent authored the conditional exception and its complete feedback
method. It did not claim that the fictional original author changed a preference
or that a real teammate confirmed the revision. The new history names
`actor:synthetic-task-agent` and `history:agent-team-update-1.1.0`.

## Actual execution and scope

The original [asset `1.0.0`](team-update-1.0.0.kdna) came from the unchanged,
installed CLI's public `examples/native-workflow.cjs` teaching recipe and
`examples/team-update/author.json`. That recipe also generated a scripted
`1.0.1` revision; that revision was **not used** here. The Agent's task outputs
and [revision `1.1.0`](team-update-1.1.0.kdna) are separate work.

Task consumption used the official Read catalog and exact selections of
`update:order` and `update:evidence` in one retained session per asset. It did
not substitute the authored JSON for Read disclosure. Every returned mandatory
reference had both endpoints in the disclosed closure; `missing` was empty.
The optional rationale was not expanded or used. The revised asset was read in
a fresh session; no old expansion handle was reused.

Official Source-open used the original file's exact expected SHA256. The Agent
edited the complete returned Manifest/Payload pair, increased both asset and
judgment versions to `1.1.0`, and added the actual authored revision history.
Source-pack saved a new file. The original remained byte-identical. Reopening
Source on the revision returned the new version and history.

The [execution summary](execution-summary.json) records the successful statuses,
closure counts, states and authoring retries. One client setup mistake and two
invalid authored method drafts were corrected before success; rejected drafts
saved no asset. Runtime checks were kept intact. Native Read reports writer
`not_evaluated`, confirmation `claimed_unverified`, explicit Read permission
`allowed`, and action authorization `not_evaluated`.

This case establishes actual use by this Agent on this task. Its facts and
supporting evidence are synthetic. It establishes no real-human confirmation,
multi-Host acceptance, production behavior or general quality result. It used
no network action, paid model tool or protected Reader route.

## Exact tool and asset coordinates

[artifacts.json](artifacts.json) records the SHA256 and byte count of the CLI,
Core, Read and both assets. The executed tool was CLI
`0.39.0-rc.native-sections.3`, with Core `0.37.1-rc.browser.1` and Read
`0.11.2-rc.browser.1`, under Node `22.22.3`. These are source-first candidate
coordinates; their appearance here is not a claim of npm availability.

[public-contract-binding.json](public-contract-binding.json) preserves the
installed CLI's exact binding, including the companion archive hashes and route
contract hashes. The native tuple is Container `0.6.0`, Payload
`kdna.payload.judgment/0.5.1`, Core `kdna.core/0.8.2`, IR
`kdna.canonical-ir/0.6.1`, Runtime `kdna.runtime-capsule/0.3.1`, Plan
`kdna.consumption-plan/0.3.1`, Host `kdna.agent-host/0.3.1`, Trace
`kdna.judgment-trace/0.3.1`, and Read `kdna.read/0.7.0-candidate`.
Package names containing `browser` do not make this native task a protected
browser/Reader acceptance case.

## Reproduce the file operations

Prepare the exact complete offline CLI host using the CLI's public
[delivery instructions](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md).
Verify the three KDNA archives against `artifacts.json` and retain the host's
complete pinned dependency closure. Use Node 22 or later. Set `KDNA_HOST` to
that prepared host directory, and run the following from this example directory.
Each JSONL file contains catalog, order and evidence requests; all three go to
one process. The recorded asset identities were obtained from the executed
catalog. No handle from another process is supplied.

```sh
node "$KDNA_HOST/node_modules/@aikdna/kdna-cli/src/cli.js" read team-update-1.0.0.kdna --session --allow-read < original.requests.jsonl
node "$KDNA_HOST/node_modules/@aikdna/kdna-cli/src/cli.js" source-open team-update-1.0.0.kdna --expected-a sha256:1482397a3b27ebd6164b3568f2dd2de445ca399c4695771e12177b49affde47b --allow-source
mkdir reproduced
node "$KDNA_HOST/node_modules/@aikdna/kdna-cli/src/cli.js" source-pack team-update-1.0.0.kdna --edits revision.edits.json --expected-a sha256:1482397a3b27ebd6164b3568f2dd2de445ca399c4695771e12177b49affde47b --output reproduced/team-update-1.1.0.kdna --allow-source
node "$KDNA_HOST/node_modules/@aikdna/kdna-cli/src/cli.js" read reproduced/team-update-1.1.0.kdna --session --allow-read < revised.requests.jsonl
```

Use a new `reproduced` directory. The expected revised SHA256 is
`5f72c09990a2b0dfd2a61c57faf24e82d00f2ba11245c0ab76ad94fae5dc72bf`.
The [full edits](revision.edits.json) preserve the exact authored timestamp,
history and input pair; Source performs the representation rebuild. To make a
new revision of your own, first open Source and author your changes with a new
version, history and output path. Replaying these saved edits reproduces this
case's file operation, not a new Agent judgment or human feedback event.

The original asset can also be regenerated by running the installed teaching
recipe from the exact host, with a new output directory:

```sh
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./teaching-output
```

Use only its `team-update-1.0.0.kdna` for this case. Producing the weekly update
requires an Agent to apply the disclosed preferences to the facts; the recipe
does not write either update in this directory.

## Attribution and license

The original teaching asset, recipe input, public contract binding and license
come from [KDNA CLI](https://github.com/aikdna/kdna-cli), copyright 2026 KDNA
contributors. This directory adapts that public teaching sample. Its changes
are the synthetic task facts/evidence, the two Agent-written updates, the
Agent-authored conditional preference and history, and the execution/reproduction
record. See [NOTICE](NOTICE).

This directory's documentation, task data and `.kdna` examples are licensed
under [CC BY 4.0](LICENSE-DOCS). The copied `public-contract-binding.json`
retains the upstream metadata license, [Apache-2.0](LICENSE). The upstream
CLI executable recipe is also Apache-2.0 code and is invoked from the
separately installed package; it is not copied into this directory.
