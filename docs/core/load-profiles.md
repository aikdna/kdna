# KDNA Load Profiles

The **load profiles** (`index`, `compact`, `scenario`, `full`) are the
official KDNA **runtime loading contract**. They define exactly
what a loader returns when asked to read a `.kdna` asset at a given
profile level. Every official KDNA toolchain component — CLI, skills
loader, Studio, SDK — MUST follow this contract.

The profiles are named in the manifest's `load_contract` block:
`manifest.load_contract.profiles`. The default profile is
`manifest.load_contract.default_profile`, conventionally `compact`.

The official implementation is `@aikdna/kdna-core.loadAuthorized()`.
Third-party products integrate KDNA through the official SDK, CLI,
Loader, or API — they do not implement loading independently.

## 1. `index` — metadata only

**Purpose**: routing, listing, inspection, deduplication.

**NOT suitable as an Agent prompt.** The index profile contains no
judgment content — only identity and metadata.

**Output fields**:
- `asset_id`
- `asset_uid`
- `title`
- `version`
- `judgment_version`
- `asset_type`
- `summary` (if present)
- `language` (if present)
- `keywords` (if present)
- `profiles_available` — list of profile names declared in `load_contract`

**Example output** (`--as=json`):

```json
{
  "asset_id": "kdna:example:writing-core",
  "asset_uid": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "title": "Editorial Review",
  "version": "1.0.0",
  "profiles_available": ["index", "compact", "scenario", "full"]
}
```

## 2. `compact` — default Agent prompt

**Purpose**: the **default profile for Agent invocation**. Supplies the
minimum judgment surface that a loader needs to apply the domain's
reasoning frame: the highest question, axioms, boundaries, self-checks,
and failure modes.

**Suitable as an Agent prompt**: yes. This is the recommended default.

**Output fields**:
- `highest_question` — from `payload.core`
- `axioms` — from `payload.core.axioms` (one-sentence form if available)
- `boundaries` — from `payload.core.boundaries`
- `self_checks` — from `payload.reasoning.self_checks`
- `failure_modes` — from `payload.reasoning.failure_modes`
- `patterns` — from `payload.patterns` (first 3, truncated)
- Default max_tokens_hint from `load_contract.profiles.compact.max_tokens_hint`

**Example output** (`--as=prompt`):

```
KDNA Judgment Asset: Editorial Review
Asset ID: kdna:example:writing-core
Profile: compact
Max tokens hint: 500
Highest question: What does this minimal example demonstrate?
Axioms:
- The minimal payload is the smallest shape that passes the schema.
```

**Content-neutral**: the compact output MUST NOT include:
- `trusted`, `recommended`, `high_quality`, `officially_approved`, `quality_badge`
- Registry, marketplace, or ranking claims
- Content quality assessments

These words are guarded by `FORBIDDEN_OUTPUT_TERMS` in the official
implementation.

## 3. `scenario` — input-triggered sections

**Purpose**: select only the payload sections that match a given input
or trigger, so large payloads are read selectively rather than all at
once.

**Phase 1 behavior (current)**:
- If `payload.scenarios` is present and non-empty, return the scenario
  array.
- If `payload.scenarios` is absent or empty, **fall back to `compact`**
  and include a `note` indicating the fallback.

**Deterministic**: the scenario profile MUST NOT allow the loader to
guess which sections apply. The selection MUST be rule-based.
In Phase 1, the scenario profile accepts the full scenarios array
as-is; future phases will add trigger-matching rules.

**NOT suitable as a default Agent prompt** unless the caller explicitly
requests scenario-routed reading.

## 4. `full` — audit and editing

**Purpose**: return the complete manifest and payload for editing,
audit, debugging, and archival.

**NOT suitable as an Agent prompt.** The full profile includes every
field in the payload and manifest. Injecting the full profile into an
Agent context risks:
- Context overflow (large payloads)
- Boundary confusion (editing notes and archival fields are not
  judgment rules)
- Privacy leaks (fields that are intended for audit, not execution)

**Output fields**:
- `manifest` — the complete `kdna.json` manifest object
- `payload` — the complete `payload.kdnab` object

**The official loader SHOULD warn** if `full` is requested with
`--as=prompt`, because a raw JSON dump is ill-suited for agent
context injection.

## 5. Profile summary

| Profile | Agent prompt? | Payload included | Default? | Use case |
|---|---|---|---|---|
| `index` | no | no | no | routing, listing |
| `compact` | **yes** | partial (axioms, boundaries) | **yes** | agent invocation |
| `scenario` | only if explicitly requested | partial (matched sections) | no | input-routed reading |
| `full` | **no** | yes (complete) | no | editing, audit, archival |

## 6. Content-neutrality across all profiles

Every profile output MUST be content-neutral. The loader MUST NOT:
- Evaluate whether the content is "good", "correct", or "high-quality"
- Recommend the asset to a caller
- Rank the asset against other assets
- Endorse the author or the encoded judgment
- Emit `trusted`, `recommended`, `high_quality`, `officially_approved`,
  or `quality_badge` as positive claims

The official implementation (`@aikdna/kdna-core.loadAuthorized`) enforces this
via `FORBIDDEN_OUTPUT_TERMS`.

## 7. Extension

- **Future phases** may add more profiles. New profiles MUST be additive
  and MUST NOT change the semantics of existing profiles.
- **Encrypted profiles** use `requires_decryption: true`. The loader MUST
  obtain authorization, decrypt only in memory, and emit a Runtime Capsule;
  without the required credential it returns a non-loadable LoadPlan.
- **Custom profiles** are not part of the current runtime contract. If an asset
  declares a profile not in `{index, compact, scenario, full}`, the
  loader MUST reject it with a clear error.
