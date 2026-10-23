# RFC-0023: Source Attribution Labels, Unresolved-Question State, and Read Diagnostic Cause for the 0.6 Coordinate Family

**Status:** draft - not implemented. Internal identifier
`kdna-rfc/source-and-state-0.6`. This RFC changes no published coordinate,
package, or schema by itself. It does not claim that the stable, creation,
Native execution, and Read routes move together. The slug uses `state`
(not `pending`) to match the proposed unresolved-question value `open`.

## Summary

This draft makes three separable proposals. A labels captured judgments as
`author_stated`, `agent_inferred`, or `agent_suggested`, with separate
author-stance and derived-reviewable sets. B introduces an independent
`unresolved_questions` / `JudgmentQuestion` carrier candidate instead of
putting `judgment_state` on a complete `Judgment`. C adds optional
`cause` / `missing` / `expected` fields to a new Read rejection diagnostic.
Exact wire shapes, coordinates, and release windows remain deferred. No
schema, package, or published contract changes until a track is accepted.

**Intended audience:** consumers of the public kdna repositories - asset
authors, tool implementers reading the container/payload/IR contracts, and
maintainers of kdna-core / kdna-cli / kdna-read / conformance.

**Relationship to existing RFCs:** continues the unimplemented draft
[RFC-0022](./RFC-0022-source-attribution-labels.md) and replaces its
effective-set rules 1 and 3 (see section 3.1): reviewable inference is not
author stance, and a confirmation record is the only promotion channel. It
also fixes RFC-0022's dangling reference to the withdrawn `specs/RFC-0013`
by pointing to the current `judgment.lifecycle` contract. This RFC is a
design proposal only; RFC-0022 and RFC-0023 remain drafts.

**Scope trigger:** this proposal has three separable design tracks:

1. source labels on captured judgment;
2. an independent carrier for questions whose answer is not yet a complete
   judgment;
3. optional cause fields on the Read rejection diagnostic.

Each track may land in a different versioned contract. No combined coordinate
move is assumed.

---

## 1. Motivation

The creation surface can record a judgment's content, method, and lifecycle,
but it cannot express the following three distinctions without overloading an
existing structure.

The failure shapes below were exercised in design review and synthetic
fixtures. No real-author trial, real-author material, or independent author
acceptance is claimed by this RFC.

### 1.1 No structural place for "who said this, on what basis" (A)

A KDNA asset can carry judgment a person stated, judgment an Agent derived
from material, and judgment an Agent merely proposed. The container records
the judgment without a declared provenance class, so a reader cannot tell
which entries belong to the author's own thinking (RFC-0022 Motivation).

Existing actor structures answer different questions:

* `subject.actor_ids` says who a judgment is about;
* revision `actor_refs` says who revised an entry;
* `SourceUse` says which material a target cites;
* `AttributionDeclaration` is an asset-level provided/unprovided role
  declaration; its attributions use only `creator`, `rights_holder`, and
  `representative`.

None of these states the producer class of the judgment content itself, and
none is a per-judgment delegation record. In particular, `attributions` must
not be described as evidence of a per-entry delegation. This RFC does not
add such a delegation structure.

### 1.2 No structural place for an unresolved question (B)

Four states are distinguishable in authoring:

| State | Meaning |
| --- | --- |
| Undecided (`open`) | No determination exists yet. |
| Declined (`declined`) | The author was asked and explicitly declined to answer. |
| Not applicable | The question is outside this author/asset scope. |
| Materials conflict (`conflicted`) | The source materials contradict each other; the conflict itself is the finding. |

The existing `Judgment` shape cannot carry the first, second, or fourth state
without changing what a judgment means:

* `Judgment.required` has 15 fields, including `form`, `answer_kind`,
  `core_expression`, `result_contract`, `method`, `material_refs`,
  `reason_refs`, `parent_ref`, `ports`, `inputs`, and `content_uses`.
* `Judgment.form` is only `conclusion` or `rule`.
* `Judgment.oneOf` requires either `result` or `formation_rule`.
* `Payload.judgments` is required and has `minItems: 1`.
* `capabilityFor()` returns `null` when there are no judgments, and
  `PUBLIC-ASSET-CAPABILITY` rejects a capability that cannot be derived.

An `open` question has no conclusion or formation rule. Putting it into a
`Judgment` would therefore force a fabricated `result` or
`formation_rule`. Making `judgment_state` an optional field on the existing
`Judgment` would only label a complete judgment; it would not create a place
for a question that has no complete judgment yet.

The nearest existing fields are also different structures:

* `AuthoredDeclarations.highest_question` is a required
  `TextDeclarationProvided`, not a question lifecycle container.
* `Relationship.participants` has exactly two `judgment_ref` entries.
* `SourceTargetKind` does not include `question`.
* `AuthoredUnprovidedState` is a declaration-level
  `unknown` / `none` / `not_applicable` state, not an unresolved-question
  lifecycle.

### 1.3 Read diagnostics carry coordinates but no cause (C)

`ReadDiagnostic` in the Read envelope is a closed five-field object:
`{code, stage, severity, subject, field}` with
`additionalProperties: false`. It can say where a failure occurred but does
not provide a machine-readable cause, a list of missing items, or an expected
value.

This problem is specific to the Read rejection envelope. Creation and source
routes use separate diagnostic shapes:

* `AdmissionDiagnostic` has its own `AdmissionReason` vocabulary;
* `SourceRouteDiagnostic06` has its own code and stage vocabulary;
* `SourceMigrationDiagnostic06` has another code and stage vocabulary;
* `BrowserProtectedDiagnostic` is a separate browser-facing shape.

The CLI's existing `guidance` key is a sibling of `diagnostics[]`, not a
field of `ReadDiagnostic`, and is not a ready-made vocabulary for this
proposal. This RFC therefore does not claim that a creation or admission
failure automatically produces a Read diagnostic.

---

## 2. Non-goals

* No authorship authentication. Labels are producer declarations; proving
  who a person is remains with the signature track (RFC-0021) and account
  work.
* No automatic promotion of Agent output to author material, regardless of
  model confidence.
* No change to `answer_kind`, `judgment.lifecycle`, `BoundaryEffect`,
  `AuthoredUnprovidedState`, `PolicyDisposition`, or
  `SharedTextDeclaration`.
* No default body-view change. The default `--view body` projection carries
  no labels; a later opt-in surface needs its own before/after comparison and
  model-surface retest.
* No backfill of an existing asset and no migration tool that generates
  labels, unresolved questions, or diagnostic causes.
* No relaxation of an existing rejection gate.
* No claim that all diagnostic routes share one vocabulary or one envelope.
* No claim that a candidate route's coordinates are stable or final.

---

## 3. Normative rules

### 3.1 A - Source attribution labels

Adopt RFC-0022's three labels unchanged, at judgment granularity:

| Label | Meaning | Required companion material |
| --- | --- | --- |
| `author_stated` | The named author asserted this. | A locator plus the original snippet from which the judgment was taken. |
| `agent_inferred` | An Agent derived this from material. | Rationale, producer identity, and the inputs it used. |
| `agent_suggested` | An Agent proposed this and no author has confirmed it. | The proposal and producer identity. |

Labels are additive, carry no default, and are producer declarations, not
authentication.

**Two sets, not one.** RFC-0022's rule that `author_stated` plus rationalized
`agent_inferred` entries form the effective set is not adopted. A reviewable
inference is not an adopted author position. This RFC uses:

1. **Author stance set:** exactly `author_stated` entries plus entries
   promoted by a confirmation record.
2. **Derived reviewable set:** `agent_inferred` entries. They may be reviewed
   against their inputs and derivation, but must not answer stance questions
   as if the author had stated them.
3. `agent_suggested` remains a candidate outside both sets.
4. A confirmation record from an author-side principal is the only promotion
   channel. The producing Agent cannot confirm its own output.

The confirmation record is a semantic requirement, not a settled wire shape.
A non-binding sketch is:

```
{
  "entry_digest": "<digest of the entry being confirmed>",
  "from_label": "author_stated" | "agent_inferred" | "agent_suggested",
  "to_label": "author_stated" | null,
  "confirmed_by": "<declared author or author-side principal>",
  "confirmed_at": "<timestamp>",
  "method": "author_review" | "author_edit" | "author_rejection" | "author_withdrawal"
}
```

The final placement and field names are an implementation-review decision.
Any confirmation record must remain linkable to the exact entry it confirms;
whether that record lives in the asset or in a host-side record is still open.
`confirmed_by` must identify an author-side principal, not the Agent that
produced or inferred the entry. A claim of authorization remains a declaration;
authentication stays with the signature and account tracks.
`to_label: null` records removal from the stance set rather than a promotion:
a rejection does not relabel an Agent proposal as author material, and a
withdrawal keeps the old entry in history while removing it from the current
stance set. The sketch is non-binding, but it must not be read as making every
confirmation record a promotion to `author_stated`.

An Agent must never relabel `agent_suggested` or `agent_inferred` as
`author_stated`. A withdrawal is recorded like an addition: the old entry
remains in history and the confirmation record removes it from the stance set.

**Delegation boundary.** An explicitly delegated research or editing scope
may justify an `agent_inferred` label, but the delegation basis must not be
inferred from `AttributionDeclaration`. The current attribution roles are
asset-level roles, not per-judgment authorization. If a future design needs a
per-judgment delegation record, it must define that record separately.

**Granularity.** Start at judgment level. `reason` and `material` content is
covered through references. Finer-grained labels are a later extension and
are not a launch requirement.

**Unlabeled assets.** No label means unknown, not `author_stated`. No tool
backfills a label. A consumer that does not understand a label must not
present the entry as author material. Whether an unknown label is rejected at
container admission or at a later presentation gate remains an implementation
decision; the fail-closed direction is mandatory.

**Snippet handling.** Preserve the original wording as received. Normalization
is a separate referenced layer and never overwrites the original. The storage
encoding remains open; preservation of the original is fixed. For a directly
authored judgment, the exact authoring input or an immutable locator to it may
serve as the original snippet. If neither can be retained, the entry remains
unknown rather than claiming `author_stated`.

### 3.2 B - Unresolved-question carrier

This RFC does not add `judgment_state` to `Judgment`. A complete `Judgment`
continues to require a conclusion or formation rule. Instead, the candidate
design adds an independent payload-level collection whose working name is
`unresolved_questions`. `JudgmentQuestion` is a candidate type name, not an
existing public type.

The collection is for questions that do not yet have a complete judgment.
Its minimum semantic shape is:

| Element | Meaning |
| --- | --- |
| Stable question identity | A referenceable identifier. |
| Question text | The question being left unresolved. |
| State | `open`, `declined`, or `conflicted`. |
| Basis | The available source, author interaction, or conflict evidence, when the state requires it. |

Exact field names, cardinalities, and whether the carrier is an array, a map,
or a versioned alternate form are not settled here. The following rules are
normative for any eventual shape:

1. An unresolved question must not be encoded as an empty `Judgment` or as a
   synthetic `result` / `formation_rule`.
2. `open` means no determination exists. It is never rewritten to
   `out_of_domain`, `none`, or deletion.
3. `declined` means the author was asked and explicitly declined. Absence of
   an answer is not `declined`.
4. `conflicted` means the materials behind this question conflict. It is not
   automatically an asserted `conflict` relationship between judgments and is
   not the existing `PolicyDisposition` code `conflict`.
5. `not_applicable` is not a fourth value. Existing `BoundaryEffect` and
   declaration expressions remain the place for explicit scope decisions.
6. A state outside the three values is rejected, not coerced.
7. An unresolved question is not a `Relationship` participant and is not a
   `SourceTargetKind` target unless a later version explicitly extends those
   structures.
8. `highest_question` remains a provided declaration text and is not a
   container for unresolved questions.
9. `AuthoredUnprovidedState` and unresolved-question state are different
   structures. Neither is a coercion or fallback for the other.
10. An unresolved question does not itself create `asset_capability`. The
    capability must still be derivable from complete judgments under the
    current capability rules.

**Empty judgments are not decided by this draft.** The current
`Payload.judgments` `minItems: 1` and `capabilityFor()` behavior remain in
force until a separate accepted design changes them. This means the first
version of `unresolved_questions` can coexist with at least one complete
judgment; a question-only asset is not claimed to be valid.

The lifecycle is versioned, not rewritten in place. If an unresolved question
is later answered, the old asset version keeps its `open` or `declined`
history and the new version records the resolution under the separately
settled resolution design.

### 3.3 C - Read diagnostic cause

In a new Read envelope version, `ReadDiagnostic` may gain three optional
fields:

| Field | Candidate type | Meaning |
| --- | --- | --- |
| `cause` | code-shaped text | Machine-readable cause for this diagnostic. |
| `missing` | array of strings, bounded | The specific items whose absence caused the failure. |
| `expected` | string or bounded array | What the structure expected instead of what it received. |

The name `cause` is intentional. `AdmissionDiagnostic.reason` already uses a
separate vocabulary; reusing `reason` here would invite a false unification.
The five existing `ReadDiagnostic` fields remain verbatim, `required` is
unchanged, and `additionalProperties: false` remains in force in the new
version.

`ReadEnvelopeRejected.diagnostics` currently has `minItems: 1` and
`maxItems: 1`. This proposal does not change that cardinality. If a later
design needs multiple diagnostics, it requires its own versioned decision.

The `cause` vocabulary is a separate Read cause axis. It does not merge with:

* `ReadDiagnosticCode`;
* `AdmissionReason`;
* `SourceRouteDiagnostic06`;
* `SourceMigrationDiagnostic06`;
* `BrowserProtectedDiagnostic`;
* the CLI's `method_component_roles` / `method_missing` guidance keys.

The exact `cause` values and bounds are settled in implementation review. The
candidate design names must not be presented as current public vocabulary.

The CLI's existing guidance remains a CLI-side sibling key unless a separate
change explicitly moves it. This RFC does not claim a create-output
passthrough, and it does not claim that a source or admission failure is
represented by a Read diagnostic.

### 3.4 Coordinate routes are separate

The current source contains distinct route coordinates. They are evidence for
separate version decisions, not for one coordinated move:

| Route | Container | Payload | Core | IR | Execution four axes | Read | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| stable/browser | `0.5.0` | `0.5.1` | `kdna.core/0.8.2` | `kdna.canonical-ir/0.6.1` | `0.3.1` | `kdna.read/0.6.4` | `versionTuple` |
| creation candidate | `0.6.0` | `0.5.1` | `kdna.core/0.8.2` | `kdna.canonical-ir/0.6.1` | `0.3.1` | `kdna.read/0.7.0-candidate` | `representation_candidate.a18_native_creation.version.output_tuple` |
| Native execution candidate | `0.6.0` | `0.5.1` | `kdna.core/0.8.2` | `kdna.canonical-ir/0.6.1` | `0.4.0-candidate` | `kdna.read/0.7.0-candidate` | `representation_candidate.a17_native_execution.version.wire_tuple` |

The migration route is an explicit stable `0.5.0` to creation `0.6.0`
migration. It does not prove that every axis moves together, and it does not
make the execution candidate's four axes equal to the creation candidate's
four axes.

A/B/C may therefore require different changes:

* A changes the payload/creation contract only if a later accepted design
  places labels there.
* B changes the payload contract only if the unresolved-question carrier is
  accepted there.
* C changes the Read envelope and its generated consumers only if the Read
  route is selected.

Exact target coordinates, package versions, and release windows are deferred
to implementation review. No pre-landing is authorized by this RFC: no
source, generator, recipe, schema, or documentation change is to be made
before the relevant design is accepted.

### 3.5 Loader gate

An asset that carries a newly required field must be gated by
`compatibility.min_loader_version`. The requirement is a strict `x.y.z`
loader package coordinate:

* the loader's own package coordinate may carry a prerelease or build suffix;
* a malformed requirement is a schema failure;
* an older loader rejects a compatible asset with
  `KDNA_LOADER_VERSION_UNSUPPORTED`, not `READ_UNSUPPORTED_VERSION`;
* the comparison uses the three numeric components and does not treat a
  prerelease suffix as a different threshold.

Before relying on this gate, implementation review must also resolve the
current source/schema mismatch: `specs/public-semantic-source.json` describes
`Compatibility.min_loader_version` with the broad `VersionLabel` reference,
while the runtime loader and `packages/kdna-core/schema/manifest.schema.json`
require a strict three-component coordinate. This RFC records that mismatch;
it does not claim it is already fixed.

---

## 4. Affected surfaces

**Single source of truth and generated fan-out** (`kdna` repository):
`specs/public-semantic-source.json` and its generated canonical-IR schemas,
execution validators, contract types, `.d.ts`, test vectors, vocabulary,
Read schema and documentation, `native-output-recipe.json`, and
`public-generation-manifest.json`.

**kdna-core:** schema validation, semantic admission, browser-native mirrors,
producer self-validation, and conformance vectors. Any source/schema
correction is a separate reviewed change.

**kdna-cli:** no diagnostic passthrough is asserted by this draft. A later
change may render a Read cause only if the installed Read envelope actually
contains it and the change has its own tests and surface inventory.

**kdna-read:** no logic change is implied by A or B. A C change would belong
to a new Read envelope version and require its own exact-peer and consumer
review.

**MCP adapter:** presentation behavior is not changed by this draft. No
field-shape involvement is claimed until the relevant envelope is accepted.

**Browser entries:** sections-family failure shapes currently contain no
`diagnostics[]`. Payload-family browser entries must be inventoried before any
claim about their diagnostic surface.

**Conformance and evaluation:** new cases are required for each accepted
track. Existing vectors remain regression controls; they do not prove a new
track until the new track's own vectors pass.

**Documentation:** coordinate statements and support matrices are re-pinned
only in the release change that actually moves the relevant coordinate.

---

## 5. Compatibility impact

1. **Closed stays closed.** Every touched type keeps
   `additionalProperties: false` in its new version. New fields are
   versioned additions; there is no unversioned field and no silent
   tolerance.
2. **Existing meanings do not move.** The five `ReadDiagnostic` fields,
   `answer_kind`, `judgment.lifecycle`, `BoundaryEffect`,
   `AuthoredUnprovidedState`, `PolicyDisposition`, and
   `SharedTextDeclaration` retain their current meanings.
3. **Old assets stay unknown.** No default label, no default unresolved
   state, and no backfill. A missing field keeps today's behavior.
4. **No capability by implication.** An unresolved question does not create
   an asset capability. The current `Payload.judgments` minimum and
   `capabilityFor()` behavior remain until separately changed.
5. **No coercion.** An unresolved question is not a judgment, a relationship,
   a source target, or an `AuthoredUnprovidedState`. A Read cause is not an
   `AdmissionReason`, a source route code, or a migration code.
6. **Separate revertibility.** Each track can be stopped independently by
   ceasing to write its versioned field. No byte-level migration obligation
   is created by this draft.
7. **Consumers that do not understand a new semantic** must fail closed for
   that semantic: they must not present an unknown label as author material,
   must not rewrite `open`, must not silently omit an unresolved question,
   and must not treat one as a complete judgment.

---

## 6. Conformance requirements

The following are required once a track is implemented; they are not evidence
that it is implemented now.

**A - labels**

1. An old unlabeled asset reads as unknown and is never backfilled.
2. `agent_inferred` is absent from the author stance set regardless of
   rationale presence.
3. `agent_suggested` is absent from the stance set until a confirmation
   record with `to_label: author_stated` exists, and present after that
   positive confirmation.
4. No automatic promotion occurs, including when suggestion text is
   byte-identical to an author statement.
5. An unknown label is not presented as author material and is rejected or
   refused at the implementation-selected gate.
6. A delegated Agent decision labeled `agent_inferred` remains usable without
   being disguised as `author_stated`.
7. An asset with only unconfirmed suggestions produces an explicit empty
   stance-set result with a reason, not a silently empty view.
8. A rejection or withdrawal uses an explicit confirmation outcome
   (`to_label: null` in the non-binding sketch), removes the entry from the
   current stance set, preserves its history, and never promotes the proposal
   to `author_stated`.
9. The producing Agent cannot create a confirmation record for its own output;
   a claimed authorization without author-side evidence remains unverified.
10. A directly authored `author_stated` entry links an exact authoring input or
    immutable locator; without one, the entry remains unknown.

**B - unresolved questions**

1. An `open` question is not encoded as an empty or fabricated `Judgment`.
2. `open` is never rewritten to `out_of_domain`, `none`, or deletion across
   create, migrate, or convert.
3. `declined` is not inferred from silence and is not rewritten to `open` or
   not-applicable.
4. `conflicted` is not auto-derived as an inter-judgment conflict relation or
   a `PolicyDisposition` conflict.
5. An illegal state is rejected, not coerced.
6. A question-only payload is rejected while `Payload.judgments` retains its
   current minimum.
7. An unresolved question cannot become a `Relationship` participant or a
   `SourceTargetKind` target without a separately accepted extension.
8. `highest_question` and `AuthoredUnprovidedState` remain distinct from the
   new carrier.
9. A later version that resolves a question leaves the earlier version's
   `open` or `declined` state and bytes unchanged.
10. A consumer that does not understand the unresolved-question carrier does
    not silently omit it; it rejects or explicitly marks the projection
    incomplete.

**C - Read diagnostic cause**

1. The five legacy fields remain verbatim.
2. `cause`, `missing`, and `expected` appear only in the new Read version and
   only where the cause is known.
3. Illegal types, unbounded arrays, and over-limit values are rejected.
4. The rejected envelope keeps its current one-diagnostic cardinality.
5. Read, admission, source-route, migration, browser, and CLI vocabularies do
   not collapse into one enum.
6. Node and browser mirrors remain byte-identical where the contract requires
   mirror equality.

**Loader gate**

1. A valid strict `min_loader_version` below the loader coordinate is
   accepted.
2. A higher requirement produces `KDNA_LOADER_VERSION_UNSUPPORTED`.
3. A malformed requirement is a schema failure, not an unsupported-version
   diagnostic.
4. A loader package prerelease suffix does not change the numeric threshold.

---

## 7. Security considerations

A label is a producer claim, not authentication. It must not be treated as
proof that a named person authored, reviewed, or adopted anything. Only a
confirmation record, together with the signature track where required, can
evidence that a specific person acted.

Unresolved-question text and label companion material are captured content and
must be bounded like other material. They must not become a covert channel for
credentials, private control records, or unredacted personal data.

A Read cause must not expose secrets, full source material, or private host
context. Error fields are output surfaces and require the same redaction and
size discipline as the existing diagnostic fields.

## 8. Open questions and remaining decisions

The earlier draft left eleven open questions. Their dispositions are:

| ID | Topic | Disposition |
| --- | --- | --- |
| 1 | Confirmation-record placement and field names | Deferred to implementation review. This draft fixes only the unique promotion channel and the need for exact-entry evidence. |
| 2 | Snippet storage | Preserve original wording plus locator. Normalization is a separate referenced layer; the encoding remains open. |
| 3 | Label granularity | Judgment-level first. Reason/material-level labels remain a later extension. |
| 4 | `conflicted` actor split | Deferred to a later version. It must not be folded into the first carrier. |
| 5 | Exact coordinates | Split by route. Numeric targets and release windows are deferred. |
| 6 | Cause vocabulary | Use a separate Read cause axis; do not merge Read, admission, source-route, migration, browser, or CLI vocabularies. |
| 7 | Unknown label enforcement | Proposed direction is hard rejection at admission, but the exact gate must be confirmed by implementation review. |
| 8 | Reader/UI surface | Default body view remains unchanged. An opt-in surface is a separate successor with its own comparison and retest. |
| 9 | Unresolved carrier vs `AuthoredUnprovidedState` | Different structures; no coercion or fallback in either direction. |
| 10 | Browser payload diagnostics | Inventory at implementation. No current passthrough is claimed. |
| 11 | Loader wording | Use `KDNA_LOADER_VERSION_UNSUPPORTED` and strict `x.y.z`; malformed requirements are schema failures. |

The following decisions remain with the Owner or public maintainers:

1. Accept an independent `unresolved_questions` carrier, or choose a
   versioned alternate form.
2. Decide whether `Payload.judgments` may ever be empty and how
   `asset_capability` would then be derived.
3. Decide whether `Relationship` or `SourceTargetKind` may reference
   unresolved questions in a later version.
4. Confirm the admission gate for an unknown label.
5. Resolve the `min_loader_version` source/schema mismatch before relying on
   the loader gate.
6. Select final route coordinates and release windows.

None of these decisions is made by this draft. RFC-0023 remains a draft and
does not authorize an implementation, migration, publication, or release.
