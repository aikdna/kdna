# Read Cost Measurement Work Package

**Status:** M2-R1 remeasurement complete; audit review pending. Not a release gate.
**Date:** 2026-11-10.
**Scope:** public CLI and Read model-input cost. This package does not change
Reader app code, Native Reader, accounts, payment or protocol semantics.
**Results:** [`read-cost-results-2026-11-10.md`](read-cost-results-2026-11-10.md).
The earlier [`read-cost-results-2026-11-09.md`](read-cost-results-2026-11-09.md)
remains as historical evidence; its cross-view whole-asset comparison and mixed
startup/request latency description are superseded by the M2-R1 run.

## Why this package exists

The 2026-11-09 independent audit found that three different budgets are easy to
confuse:

1. `--budget` limits the complete final JCS read envelope, including metadata,
   receipt, content and the budget fields themselves.
2. `--view body` is a projection of the author body. It is smaller than the
   envelope and omits the asset index and expansion handles.
3. Model input bytes and tokenizer-specific tokens are what actually reach a
   model. They are not the envelope, the printed body or the stdout bytes.

A single number cannot answer all three questions. The next step is to measure
them separately before changing any projection or wire behavior.

## Observed starting point

These are observations from one teaching asset on one machine, not a universal
benchmark. Request and snapshot identifiers and the width of budget numbers
change the exact bytes.

| Operation | stdout bytes | Result |
| --- | ---: | --- |
| `catalog` | 1,271 | `catalog_only`, 3 items |
| `exact_selection` `update:order`, body | 10,597 | `ready` |
| `exact_selection` `update:order`, full/raw | 22,659 | `ready`; envelope `required_bytes` 22,552 |
| `exact_selection` body with budget 10,697 | 1,218 | rejected; `required_bytes` 22,550 |
| `whole_asset`, body | 4,668 | `ready`; 3 catalog items, 0 judgment bodies |
| Two selections in separate session calls | 20,231 | both `ready` |
| The same two selections in one session request | 16,164 | both delivered; about 20% fewer stdout bytes |

The combined session request already exists through `selection.judgment_ids`.
This package measures it; it does not propose a new multi-select capability.

## Fixed sample set

The first run uses one public teaching asset and one generated synthetic asset:

| Sample | Judgments | Coverage |
| --- | ---: | --- |
| `team-update-1.0.0` | 3 | Published teaching baseline; optional rationale dependency |
| `semantic-decisions-5` | 5 | Ordered value priority, condition, exception, conflict and mandatory dependency |

The complex sample is generated deterministically from
`scripts/read-cost-complex-sample.mjs`. It is benchmark material, not a claim
about a real team or the correctness of its recommendations. The harness pins
the asset digest after creation and records every sample in its output.

Every task declares the judgments it needs before the run. For each expected
judgment, the manifest names the required statements or qualifications and any
mandatory dependency that must also be delivered. A response is complete only
after all deferred material needed by that task has been expanded. A
`whole_asset` body that lists the catalog without judgment bodies is recorded
as `deferred`, never as complete.

## Questions to answer

1. How much of the 22,659-byte full answer is fixed envelope machinery, repeated
   asset declarations, catalog/closure duplication, or actual judgment content?
2. How much does one session request with multiple judgment ids save across
   two, five and all judgments, after subtracting the fixed request overhead?
3. Which projected bytes actually reach the model under the documented
   one-line pointer and a named tokenizer?
4. Which repeated fields can be removed without losing conditions, exceptions,
   conflicts, value ordering or necessary dependencies?
5. Does `whole_asset` plus one expansion cost less or more than `catalog` then
   `exact_selection` for a task that needs every judgment body?

## Work items

### 1. Build the measurement harness

Run the public CLI against a named asset set and record, per operation:

- exit status and channel;
- stdout bytes, body-view bytes and raw-envelope bytes;
- envelope `budget.limit_bytes`, `required_bytes` and `actual_bytes`;
- projected model-input bytes after the documented projection;
- tokenizer-specific token count for a named model and tokenizer;
- wall-clock latency and number of tool calls;
- whether any condition, exception, conflict, value-order entry or mandatory
  dependency was omitted.

The harness must keep its prompts, asset digests, CLI version, Core/Read tuple
and sample outputs so another run can reproduce the table.

Tokenizer output is computed over the exact projected text. It is not a Host
observation. Any catalog lookup, retry, expansion, tool-response wrapper or
model request framing outside the measured CLI output remains `NOT_MEASURED`
unless a Host trace supplies it.

### 2. Reuse session multi-select

Measure the existing `selection.judgment_ids` path at 2, 5 and all judgments.
Separate fixed per-request cost from shared declarations and from judgment
bodies. Do not count a single combined stdout as the model input until the
projection step has been measured.

### 3. Locate duplication in the model projection

Compare `--view body`, `--view full` and `--view raw` on the same selection.
Classify repeated bytes as:

- necessary provenance or authority fields;
- repeated asset-level declarations that could appear once;
- catalog/closure/index entries that the model does not need for the task;
- genuine judgment text.

Any compression must preserve the conditions, exceptions, conflicts, value
ordering and necessary dependencies of the selected judgments. A smaller answer
that loses one of those is a regression, not an optimization.

### 4. Keep budget reporting separate

Keep the existing envelope-budget contract. If the CLI reports cost, report
envelope bytes, projected model-input bytes and tokens as separate fields. Do
not reinterpret `--budget` as a model context limit and do not describe a body
that fits as a model input that fits.

### 5. Calibrate a task-level target

Use a named task set with an equivalent Markdown/Skill baseline that carries the
same conditions, exceptions, conflicts, value ordering and necessary evidence.
Record task outcome, omissions, tokenizer counts, latency and tool calls. A
ratio such as "not more than three times Markdown" is an experimental target for
that sample, not a universal constant.

### 6. Separate startup and session latency

Measure a fresh CLI process separately from requests handled inside one retained
session. Keep every latency sample and the repeat count; report minimum, median
and maximum rather than one unqualified average. The first process run is not a
claim of a purged operating-system or runtime cache unless that condition was
actually controlled. The result supports a keep, optimize or defer decision;
it does not by itself establish a production service-level objective.

## Acceptance criteria

- The harness reproduces the observed table on a clean install of the published
  CLI, Core and Read tuple.
- Every measured answer is checked for semantic preservation against the
  selected judgments, not only for byte size.
- The report distinguishes envelope bytes, body bytes, projected model-input
  bytes and tokens in every row.
- The sample manifest names every expected judgment, its required statements or
  qualifications and its mandatory dependencies; deferred content is checked
  again after expansion before completeness is recorded.
- A computed tokenizer count is labelled separately from Host-observed model
  input. Missing Host observations remain `NOT_MEASURED`.
- Fresh-process latency and in-session request latency are reported separately,
  with raw samples and repeat counts.
- Multi-select measurements include two, five and all judgments, with fixed
  overhead separated from shared declarations.
- No truncation, no silent omission and no change to `whole_asset` status or
  wire semantics is required to pass this package.
- The task-level target is stated only after the sample, model, tokenizer and
  baseline are named.

## Non-goals

- Adding multi-select; the published CLI and session route already accept
  multiple judgment ids.
- Changing `whole_asset` from `ready` or changing its envelope shape.
- Reader app, Native Reader, account, payment or deployment work.
- Claiming that KDNA answers are better than Markdown answers without a
  same-task, same-model comparison.

## Deliverables

1. A measurement script and its input manifest.
2. A results document with the table, raw command lines and failure cases.
3. A projection-change proposal, only if the measurements identify removable
   duplication that passes the semantic-preservation check.
4. A short decision record: keep the current projection, change it, or defer.
