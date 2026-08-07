# RFC-0020: Minimal projection profile

- Status: Draft
- Profile: `minimal`
- Applies to: `payload-profile.schema.json` judgment assets with a `load_contract` block
- Supersedes: none (additive)

## 1. Problem and non-goals

The runtime loading contract defines four load profiles (`index`, `compact`,
`scenario`, `full`) in `schema/load-contract.schema.json`. `compact` is the
default Agent-invocation profile and is the only judgment-bearing profile
suitable as a prompt.

Measured against the reference assets (`laozi-wuwei-0.1.1`,
`epictetus-control-and-character-0.1.1`), `compact` projects roughly
5.4k-5.7k tokens:

- `patterns`: ~42% of the projection
- `failure_modes`: ~22%
- `axioms` (full form with `applies_when` / `does_not_apply_when` /
  `failure_risk`): ~22%
- `boundaries`: ~9%
- `self_checks`: ~4%

For small local models (2-4B parameter, the kdnawork local cold-start tier:
qwen3.5:4b, llama3.2:3b) this is too large.
`compact` at 5.4k tokens exceeds the entire context window of a 4K-context
model and consumes most of an 8K window. Consumers currently work around this
by hand-trimming or hard-capping the CLI output (a measured 12k-char cap in
the kdnawork consumer truncates a `compact` projection that is ~21k chars),
which fragments the judgment semantics without any protocol-level contract.

This RFC adds a fifth profile, `minimal`, that projects only the core
judgment surface a small model needs to apply the domain's reasoning frame:
the highest question, a boundary-friendly axioms projection, and the full
boundaries set.

Non-goals:

- `minimal` is not a replacement for `compact`; `compact` remains the default
  Agent-invocation profile and the recommended entry point when context budget
  allows.
- `minimal` does not change the semantics of any existing profile.
- `minimal` is not a content-quality or effectiveness claim: projecting less
  does not assert the asset's judgments are true or that a model will follow
  them.
- `minimal` does not cover `scenario`-routed or `full`-audit needs.

## 2. Profile definition

`minimal` projects exactly:

1. `highest_question` — from `payload.core.highest_question`, if present.
2. `axioms` — every declared axiom, reduced deterministically to the
   boundary-friendly fields (section 2.1).
3. `boundaries` — the full `payload.core.boundaries` array, preserving every
   declared string or structured boundary without trimming or reordering.

`minimal` MUST NOT include `worldview`, `value_order`, `judgment_role`,
`core_structure`, `self_checks`, `failure_modes`, `patterns`, `scenarios`, or
the full `manifest`/`payload`.

### 2.1 Axiom reduction

Each axiom is reduced to four fields, deterministically:

- `id` — the declared `id`, if present.
- `one_sentence` — the declared `one_sentence` when present and not a
  `<TBD...>` placeholder; otherwise the `full_statement` when present;
  otherwise the `statement`; otherwise a string axiom's own text.
- `does_not_apply_when` — the declared array, preserved in order.
- `failure_risk` — the declared string, if present.

A string axiom (`payload.core.axioms` item of `type: string`) is projected as
`{ id: null, one_sentence: <the string>, does_not_apply_when: [], failure_risk: null }`.

`applies_when` is intentionally omitted from `minimal`. It is the largest
axiom field and, at the boundary layer, `does_not_apply_when` carries the
higher-signal "do not do this" contract. A consumer that needs `applies_when`
must load `compact` (a strict superset of `minimal`).

The projection MUST be deterministic: same asset, same profile, same output,
regardless of caller. Order of axioms and boundaries is the declared payload
order. No deduplication, no reordering, no inference.

### 2.2 Relation to `compact`

`minimal` is a strict subset of `compact` for every asset that carries the
core judgment fields:

- every `minimal.highest_question` equals `compact.highest_question`;
- every `minimal.axioms[i].one_sentence` / `does_not_apply_when` /
  `failure_risk` equals the corresponding `compact.axioms[i]` fields;
- `minimal.boundaries` equals `compact.boundaries`.

A consumer that loaded `minimal` and needs more signal MAY re-load with
`compact` and lose nothing: upgrading from `minimal` to `compact` is lossless
for the fields `minimal` exposes. The reverse is not required.

`trace.projection_report` for `minimal` reports `complete` or `partial` with
every non-empty omitted payload path, following the same disclosure rule as
`compact` (see `buildCompactProjectionReport`).

## 3. Load contract and compatibility

### 3.1 Schema

`schema/load-contract.schema.json`:

- `default_profile` enum adds `minimal`.
- `profiles` required set and `properties` add `minimal` with the same
  `$ref: #/$defs/profile`.
- `minimal` uses the existing `max_tokens_hint` / `selection` /
  `intended_for` hooks already declared on the profile definition.

### 3.2 `profiles_available`

The loader advertises `minimal` in `profiles_available` and the
`index.profiles_available` field whenever the asset declares it in
`load_contract.profiles`. Availability follows the manifest declaration, not
payload inference.

### 3.3 Old loader / fail-closed

A loader built before this RFC that does not know `minimal` MUST fail closed
when asked to load `minimal`: it MUST NOT silently fall back to `compact`,
`index`, or any other profile, and MUST NOT partially project. The current
`loadAssetUnsafe` unknown-profile path (`throw new Error('unknown load
profile: ...')`) is the required behavior for a pre-`minimal` loader. Newer
loaders reject `minimal` only when the asset does not declare it.

### 3.4 Default

`minimal` is NOT a default profile. `default_profile` remains `compact`
unless an asset explicitly declares otherwise. `minimal` is opt-in at load
time (`--profile minimal`) or via an asset-declared default.

## 4. Reference implementations

### 4.1 JS Core

`packages/kdna-core/src/container/index.js` `loadAssetUnsafe` gains a
`minimal` branch between `compact` and `scenario`. It reuses the axiom
normalization machinery but projects only the four boundary-friendly axiom
fields plus `highest_question` and `boundaries`. Prompt rendering
(`--as=prompt`) follows the same disclosure and content-neutrality rules as
`compact`.

### 4.2 Python SDK

`python-sdk/kdna/core/load.py` `_project_content` mirrors the JS branch with
byte-level semantic parity (same field selection, same deterministic order,
same fail-closed rules), following the PR #253 mirror discipline.

### 4.3 CLI

`kdna-cli/src/cmds/asset-io.js` `LOAD_PROFILES` adds `minimal` so
`kdna load --profile minimal` is accepted. An asset that does not declare
`minimal` fails closed with the existing invalid-profile error.

### 4.4 Conformance

New positive and negative fixtures:

- positive: an asset whose `load_contract` declares `minimal` loads and
  projects the boundary-friendly fields;
- negative: an asset that does not declare `minimal` must fail closed when
  `minimal` is requested; an unknown profile must still be rejected.

## 5. Token budget

The default `max_tokens_hint` for `minimal` is **1200 tokens**.

Two measurements back this anchor:

1. **Projection size (measured on the reference assets).** The
   boundary-friendly projection (one_sentence axioms + does_not_apply_when +
   failure_risk + boundaries) measures ~800-1,100 tokens on
   `laozi-wuwei-0.1.1` and `epictetus-control-and-character-0.1.1`, versus
   ~5.4k tokens for `compact` on the same assets. `minimal` is therefore a
   context/cost/latency reduction, not a content addition.

2. **Small-model injection sweep (kdnawork, 2-4B local models, 2026-08-04).**
   A full-factor A/B sweep on a discriminating private-rule suite (runs=3,
   0 INVALID) compared full-payload injection against the reduced injection
   on two recommended local models. Injection size made no significant
   quality difference: qwen3.5:4b scored 12/12 (full) vs 11/12 (reduced);
   llama3.2:3b scored 11/12 at both sizes. The reduced injection costs
   ~540 characters versus ~6,000 for the full payload.

**Value positioning.** `minimal` is justified by cost, context-window, and
latency savings for context-constrained models. This RFC makes **no
quality-improvement claim**: the sweep found the reduced injection does not
measureably outperform the larger one, and `minimal` is a strict subset of
`compact`. A consumer that needs the fuller surface loads `compact`.

## 6. Content neutrality

`minimal` MUST satisfy the same content-neutrality rules as every profile:
no `trusted`, `recommended`, `high_quality`, `officially_approved`, or
`quality_badge` claims; no content-quality assessment; no author endorsement;
no ranking. The official implementation enforces this via the existing
`FORBIDDEN_OUTPUT_TERMS` guard.

## 7. Naming

The profile name is `minimal`. It is not a generation label and carries no
`v`+integer or `-vN` suffix. It is a capability coordinate, not a product
generation. The name is final for this RFC.

## 8. Backward compatibility

- Existing assets with a `load_contract` that does not declare `minimal`
  continue to load all four existing profiles unchanged.
- New assets may declare `minimal`; consumers that never request it are
  unaffected.
- `index.profiles_available` for a pre-`minimal` asset is unchanged.
- No existing profile semantics change.
