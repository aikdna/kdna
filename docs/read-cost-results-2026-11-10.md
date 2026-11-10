# Read Cost Measurement Results — 2026-11-10

**Status:** M2-R1 remeasurement complete. This is measurement evidence, not a
release gate.
**Scope:** published CLI, Core and Read packages. No Reader, account, Native,
payment, protocol or deployment change is part of this run.

## Coordinates and reproduction

- CLI: `@aikdna/kdna-cli@0.43.2`
- Core: `0.37.9`
- Read: `0.13.3`
- Node: `v22.22.3` on `darwin arm64`
- Tokenizer: `gpt-tokenizer@4.1.0 / GPT-4o / o200k_base`
- Run: `20261110011428018-2ddcc3`
- Repeats: 3 for every body-path row and the handoff task; 1 for the
  whole-asset-plus-expansion row.

The read-help clarification merged to the CLI source repository is not in the
published `latest` package `0.43.2`; it changes help text, not the read payloads
measured here, and must ship in the next CLI version.

```sh
npm install --prefix <host-dir> @aikdna/kdna-cli@0.43.2
node scripts/read-cost-measure.mjs \
  --cli <host-dir>/node_modules/.bin/kdna \
  --out <run-parent> \
  --tokenizer-module <tokenizer-adapter.mjs> \
  --repeats 3
```

The exact input assets, raw stdout/stderr, semantic details, latency samples,
environment and generated complex asset remain under the run directory. The
sample digests are unchanged:

| Sample | Source | SHA-256 | Bytes |
| --- | --- | --- | ---: |
| `team-update-1.0.0` | `examples/native-team-update/team-update-1.0.0.kdna` | `sha256:1482397a3b27ebd6164b3568f2dd2de445ca399c4695771e12177b49affde47b` | 37,594 |
| `semantic-decisions-5` | `scripts/read-cost-complex-sample.mjs` | `sha256:023c4e2acccc158757d5a7a363804d55f9fcd4f5c4e3130cbf60ecf793eb2835` | 91,567 |

`Projected stdout bytes` is the sum of exact JSON response lines, excluding
separators and the final capture newline. A multi-response row is the cumulative
cost of all tool calls in that operation, not one model request. Every token
value is a computed tokenizer count; Host model input remains `NOT_MEASURED`.

## Cost table

### Teaching sample: `team-update-1.0.0`

| Operation | View | Responses | Projected B | Computed tokens | Semantic |
| --- | --- | ---: | ---: | ---: | --- |
| `catalog` | body | 1 | 1,270 | 454 | n/a |
| `exact-single` | body | 1 | 10,596 | 3,071 | complete |
| `exact-2-separate` | body | 2 | 20,253 | 5,769 | complete |
| `exact-2-combined` | body | 1 | 16,180 | 4,622 | complete |
| `exact-all-separate` | body | 3 | 30,030 | 8,487 | complete |
| `exact-all-combined` | body | 1 | 21,402 | 6,070 | complete |
| `whole-asset` | body | 1 | 4,667 | 1,290 | deferred |
| `whole-expand-all` | full | 4 | 95,189 | 32,556 | complete |

### Complex sample: `semantic-decisions-5`

| Operation | View | Responses | Projected B | Computed tokens | Semantic |
| --- | --- | ---: | ---: | ---: | --- |
| `catalog` | body | 1 | 1,562 | 552 | n/a |
| `exact-single` | body | 1 | 17,113 | 5,034 | complete |
| `exact-2-separate` | body | 2 | 34,781 | 10,174 | complete |
| `exact-2-combined` | body | 1 | 24,119 | 7,117 | complete |
| `exact-all-separate` | body | 5 | 88,452 | 25,974 | complete |
| `exact-all-combined` | body | 1 | 50,091 | 15,047 | complete |
| `whole-asset` | body | 1 | 9,265 | 2,539 | deferred |
| `whole-expand-all` | full | 6 | 253,990 | 83,881 | complete |
| `handoff-exact-then-expand` | body | 2 | 44,335 | 12,987 | deferred → complete |

The handoff task starts with a real handle for `decision:evidence`. Its initial
response is 18,254 projected bytes / 5,321 computed tokens and is `deferred`.
The same retained session expands that handle in 26,081 bytes / 7,666 tokens.
Only the second stage supplies the full evidence judgment and its qualifications;
all three repeats finish `complete`.

## Same-view comparisons

All rows below compare the same view on both sides.

| Sample | Comparison | View | Baseline B | Alternative B | Saved | Saved % |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `team-update` | 2 separate → 1 combined | body | 20,253 | 16,180 | 4,073 | 20.11% |
| `team-update` | all separate → 1 combined | body | 30,030 | 21,402 | 8,628 | 28.73% |
| `team-update` | whole + expand all → exact all combined | full | 95,189 | 35,460 | 59,729 | 62.75% |
| `semantic-decisions` | 2 separate → 1 combined | body | 34,781 | 24,119 | 10,662 | 30.65% |
| `semantic-decisions` | all separate → 1 combined | body | 88,452 | 50,091 | 38,361 | 43.37% |
| `semantic-decisions` | whole + expand all → exact all combined | full | 253,990 | 68,202 | 185,788 | 73.15% |

These comparisons still differ in call structure: the whole path first obtains
the index and then expands one handle per judgment, while the exact path requests
the known IDs in one call. The view is no longer a confounded difference.

## Semantic preservation

The fixed task oracle now checks more than node presence:

- each expected judgment's required terms;
- `shared:decision-value-order` and its exact value sequence;
- conditions, exceptions and boundaries, including owner, `when`, `applies_to`,
  `boundary_ref` and `exception_refs`;
- the conflict relationship's kind, statement terms and participant IDs;
- the mandatory dependency's producer, consumer, ports, `required` flag and
  producer result content;
- whether deferred content is still expandable and whether the expanded task is
  complete.

The full five-judgment output passes in all three body repeats. The whole-asset
response is explicitly `deferred`. Missing dependency text, removed structural
nodes, reversed value order and changed conflict participants all produce
`incomplete`; the controlled before/after records are retained with the run.

The check is mechanical. It can prove that declared terms and structure survived;
it cannot prove that a recommendation is correct, sufficient or suitable for a
real reader.

## Repeat and exit semantics

Every repeat keeps its own semantic status and details in `semantic_runs`.
`failed_repeats` lists any incomplete run. An aggregate is incomplete if any
required repeat is incomplete, and the measurement process exits non-zero after
writing the JSON and Markdown reports when a semantic failure remains.

## Latency

| Sample / path | Repeats | Task elapsed median ms | First response median ms | Later request median ms |
| --- | ---: | ---: | ---: | ---: |
| `team-update`, 2 separate | 3 | 1,270.71 | 1,242.57 | 17.79 |
| `team-update`, all separate | 3 | 1,295.77 | 1,254.47 | 15.54 |
| `team-update`, whole + expand all | 1 | 1,299.43 | 1,236.10 | 14.69 |
| `semantic-decisions`, 2 separate | 3 | 1,379.43 | 1,340.85 | 23.23 |
| `semantic-decisions`, all separate | 3 | 1,430.96 | 1,333.97 | 22.75 |
| `semantic-decisions`, whole + expand all | 1 | 1,464.25 | 1,328.81 | 21.12 |
| `semantic-decisions`, handoff + expand | 3 | 1,369.63 | 1,330.01 | 30.47 |

First response starts at process spawn. Later requests exclude process startup.
No OS cache purge was attempted, and these are not Host service-level
measurements.

## Decision

1. **Keep** the existing `--view body` and `selection.judgment_ids` combination
   path. It is already the smallest measured path when the task IDs are known.
2. **Keep** `whole_asset` as a discovery/index operation. Its `ready` status is
   not delivery of every judgment body.
3. **Optimize** the caller workflow before changing the projection: prefer one
   combined exact selection over repeated separate calls and over
   whole-plus-expand-all when the task set is known.
4. **Defer** projection or wire changes. This run measures removable repetition,
   but does not yet have a Host-observed model input or a real-user adoption trial
   proving that a smaller projection preserves task value.
5. **Keep** `--budget` as the envelope budget. It is not a token or model-context
   limit.

## Limits

- Host prompts, retries, catalog routing, expansion routing and tool-response
  wrappers remain `NOT_MEASURED`.
- Token values are computed with the named tokenizer, not observed in a Host.
- Semantic checks are mechanical and use a fixed synthetic benchmark asset.
- No Markdown/Skill A/B, real-user adoption loop, Reader run, account journey,
  Native build, payment path or Owner acceptance was performed.
