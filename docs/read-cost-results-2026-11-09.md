# Read Cost Measurement Results — 2026-11-09

**Status:** first measured run. This is measurement evidence, not a release gate.
**Scope:** published CLI, Core and Read packages; no Reader, account, Native,
payment, protocol or deployment changes.

## Coordinates

- CLI: `@aikdna/kdna-cli@0.43.2`
- Core: `0.37.9`
- Read: `0.13.3`
- Node: `v22.22.3` on `darwin arm64`
- Tokenizer: `gpt-tokenizer@4.1.0 / GPT-4o / o200k_base`
- Run: `20261109130956309-465c23`

The CLI version is the current published `latest`. The `read` help-text
clarification merged to the CLI source repository after this version is not part
of the installed package; it does not change the read payloads measured here.

The samples were pinned by digest:

| Sample | Source | SHA-256 | Bytes |
| --- | --- | --- | ---: |
| `team-update-1.0.0` | `examples/native-team-update/team-update-1.0.0.kdna` | `sha256:1482397a3b27ebd6164b3568f2dd2de445ca399c4695771e12177b49affde47b` | 37,594 |
| `semantic-decisions-5` | `scripts/read-cost-complex-sample.mjs` | `sha256:023c4e2acccc158757d5a7a363804d55f9fcd4f5c4e3130cbf60ecf793eb2835` | 91,567 |

## Reproduction

Use an isolated install so the published tuple is unambiguous:

```sh
npm install --prefix <host-dir> @aikdna/kdna-cli@0.43.2
node scripts/read-cost-measure.mjs \
  --cli <host-dir>/node_modules/.bin/kdna \
  --out <run-parent> \
  --tokenizer-module <tokenizer-adapter.mjs>
```

The optional tokenizer module must export `countTokens(text)`. This run used
`encode` from `gpt-tokenizer/model/gpt-4o`. The script records the adapter hash,
every raw response, every latency sample, the generated complex asset and all
resolved versions under the run directory.

`Projected stdout bytes` below is the sum of the exact JSON response lines,
excluding separators and the final capture newline. `Captured stdout` includes
those separators. A row with more than one response is a cumulative cost across
tool calls, not one model request.

Every token value below is a **computed tokenizer count** over the projected
response text. It is not a Host-observed model input. Host model input remains
`NOT_MEASURED`.

## Cost table

### Teaching sample: `team-update-1.0.0`

| Operation | View | Responses | Projected stdout B | Captured stdout B | Envelope required B | Computed tokens | Semantic |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `catalog` | body | 1 | 1,270 | 1,271 | 12,203 | 458 | n/a |
| `exact-single` | body | 1 | 10,596 | 10,597 | 22,552 | 3,068 | complete |
| `exact-2-separate` | body | 2 | 20,253 | 20,255 | 41,529 | 5,771 | complete |
| `exact-2-combined` | body | 1 | 16,180 | 16,181 | 29,388 | 4,622 | complete |
| `exact-all-separate` | body | 3 | 30,030 | 30,033 | 60,623 | 8,490 | complete |
| `exact-all-combined` | body | 1 | 21,402 | 21,403 | 35,354 | 6,065 | complete |
| `whole-asset` | body | 1 | 4,667 | 4,668 | 36,735 | 1,301 | deferred |
| `whole-expand-all` | full | 4 | 95,189 | 95,193 | 94,765 | 32,357 | complete |

### Complex sample: `semantic-decisions-5`

| Operation | View | Responses | Projected stdout B | Captured stdout B | Envelope required B | Computed tokens | Semantic |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `catalog` | body | 1 | 1,562 | 1,563 | 17,761 | 545 | n/a |
| `exact-single` | body | 1 | 17,113 | 17,114 | 39,699 | 5,024 | complete |
| `exact-2-separate` | body | 2 | 34,781 | 34,783 | 69,739 | 10,183 | complete |
| `exact-2-combined` | body | 1 | 24,119 | 24,120 | 37,298 | 7,114 | complete |
| `exact-all-separate` | body | 5 | 88,452 | 88,457 | 191,331 | 25,997 | complete |
| `exact-all-combined` | body | 1 | 50,091 | 50,092 | 68,096 | 15,044 | complete |
| `whole-asset` | body | 1 | 9,265 | 9,266 | 72,190 | 2,544 | deferred |
| `whole-expand-all` | full | 6 | 253,990 | 253,996 | 253,354 | 83,619 | complete |

`Envelope required` is the sum of each response's reported `required_bytes`. For
multi-response rows it is not the size of a single model request, and it is not a
model-context limit.

## Findings

### Existing multi-select reduces repeated output

The published `selection.judgment_ids` path is already useful. Combining the
same judgments in one session request reduced projected stdout bytes:

| Sample | Selection | Separate B | Combined B | Saved | Saved % |
| --- | --- | ---: | ---: | ---: | ---: |
| `team-update-1.0.0` | first two | 20,253 | 16,180 | 4,073 | 20.11% |
| `team-update-1.0.0` | all three | 30,030 | 21,402 | 8,628 | 28.73% |
| `semantic-decisions-5` | first two | 34,781 | 24,119 | 10,662 | 30.65% |
| `semantic-decisions-5` | all five | 88,452 | 50,091 | 38,361 | 43.37% |

The savings come from sharing the fixed envelope, statements, references and
catalog work across the selected judgments. This is a byte comparison, not a
Host model-input comparison.

### `whole_asset` is a discovery operation

`whole_asset` returned `ready`, but only three or five catalog entries and no
judgment bodies in the measured samples. Its semantic state is `deferred`, not
complete. Delivering every judgment requires one expansion request per handle.

| Sample | Whole + expand-all | Combined exact selection | Extra cost of whole path | Calls |
| --- | ---: | ---: | ---: | --- |
| `team-update-1.0.0` | 95,189 B | 21,402 B | +73,787 B | 4 vs 1 |
| `semantic-decisions-5` | 253,990 B | 50,091 B | +203,899 B | 6 vs 1 |

If the caller must discover the asset first, add the catalog response
(1,270 B / 454 tokens for the teaching sample; 1,562 B / 548 tokens for the
complex sample). The combined exact selection remains substantially smaller
than expanding every handle.

### Body is not full or raw

| Sample | Operation | body B | full B | raw B |
| --- | --- | ---: | ---: | ---: |
| `team-update-1.0.0` | catalog | 1,270 | 12,309 | 12,309 |
| `team-update-1.0.0` | exact-single | 10,596 | 22,658 | 22,658 |
| `team-update-1.0.0` | whole-asset | 4,667 | 36,841 | 36,841 |
| `semantic-decisions-5` | catalog | 1,562 | 17,867 | 17,867 |
| `semantic-decisions-5` | exact-single | 17,113 | 37,351 | 39,805 |
| `semantic-decisions-5` | whole-asset | 9,265 | 72,296 | 72,296 |

`body` removes the envelope, verification, index and expansion-handle material.
`full` is not a synonym for `raw`: the complex exact selection differs by
2,454 bytes. A task that needs expansion handles or the complete transport
surface must use `raw` or retained-session routing.

### Latency

- Fresh CLI process median across operations: about 1.25–1.52 seconds.
- Teaching sample, two separate in-session requests: 647.26 ms median.
- Teaching sample, one combined two-judgment request: 1,291.99 ms median.
- Complex sample, two separate in-session requests: 705.68 ms median.
- Complex sample, one combined two-judgment request: 1,380.73 ms median.
- Later requests in an all-separate retained session were about 19–24 ms,
  reflecting process-local caching rather than service throughput.

These are single-machine observations. No operating-system cache purge was
attempted, and no Host service-level objective is claimed.

## Decision

1. **Keep** the current `--view body` projection and existing
   `selection.judgment_ids` multi-select route.
2. **Prefer** one combined exact selection when a task needs several judgment
   bodies and the IDs are known.
3. **Keep** `whole_asset` as a discovery/index operation. Do not describe its
   `ready` status as delivery of all judgment bodies.
4. **Keep** `--budget` as the complete JCS envelope budget. Do not treat it as a
   model-context or token budget.
5. **Defer** a projection or wire change. The run found repeated closure,
   reference and declaration material, but it did not prove that any field can
   be removed without losing conditions, exceptions, conflicts, value ordering
   or dependencies.

## Limits

- Host model input, prompt framing, retries, catalog lookup and tool-response
  wrappers are `NOT_MEASURED`.
- The semantic check is mechanical: required terms, mandatory dependencies and
  deferred expansion. It is not human acceptance of meaning.
- No real-user adoption loop, Markdown/Skill A/B, Reader app run, account
  journey, Native build or payment path was executed.
