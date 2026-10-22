# RFC-0023: Source Attribution Labels, Judgment State, and Diagnostic Payload for the 0.6 Coordinate Family

**Status:** draft — not implemented. Internal identifier
`kdna-rfc/source-and-state-0.6`. This RFC proposes one coordinated coordinate
move for the 0.6 family; it changes no published coordinate, package, or
schema by itself. The slug uses `state` (not `pending`) to match the
normative field value `open`.

**Intended audience:** consumers of the public kdna repositories — asset
authors, tool implementers reading the container/payload/IR contracts, and
maintainers of kdna-core / kdna-cli / kdna-read / conformance.

**Relationship to existing RFCs:** implements and partially supersedes the
unimplemented draft [RFC-0022](./RFC-0022-source-attribution-labels.md)
(one effective-set rule is replaced, see §3.1). Fixes RFC-0022's dangling
reference to the withdrawn `specs/RFC-0013` (see §3.2). Changes no published
coordinate by itself; everything rides one coordinated version move (§3.4).

**Scope trigger:** the 0.6 family — the candidate container `0.6.0` creation
route (`kdna.creation-sections/0.1.0-candidate`, output tuple container
`0.6.0` / payload `0.5.1` / IR `0.6.1` / read `0.7.0-candidate` on main today)
and the `kdna.canonical-ir/0.6.x` and `kdna.read/0.6.x` axes. None of these
fields land as silent additions to already-closed structures; they land with
the 0.6 design finalization as one named, revertible move.

---

## 1. Problem

The creation surface can today record a judgment's content, method and
lifecycle, but three things a faithful capture needs are missing. All three
were observed as concrete failure shapes (not hypothetical) during authoring
trials with real material.

### 1.1 No structural place for "who said this, on what basis" (A)

A KDNA asset can carry judgment a person stated, judgment an Agent derived
from material, and judgment an Agent merely proposed. The container records
the judgment without a declared provenance class, so a reader cannot tell
which entries belong to the author's own thinking (RFC-0022 Motivation). The
failure mode observed in practice: Agent inferences and unconfirmed
suggestions become indistinguishable from the author's stated positions once
the asset is closed, and no later review can separate them, because the
distinction was never captured. Existing actor structures (`subject.actor_ids`,
revision `actor_refs`, `SourceUse`) answer different questions — who a judgment
is about, who revised it, which material it cites — and none of them states
the producer class of the judgment content itself. Adding "another actor" does
not solve this (see §3.1 rules).

### 1.2 No structural place for "not yet decided / refused / materials conflict" (B)

Four states of a question are distinguishable in real authoring and each means
something different:

| State | Meaning |
| --- | --- |
| Undecided (pending) | Not yet discussed with the author; no determination exists yet. |
| Declined | The author was asked and explicitly refused to answer. |
| Not applicable | The question is out of scope for this author/asset (a scope judgment). |
| Materials conflict | The source materials contradict each other; the conflict itself is the finding. |

Today the structure cannot express the first, second or fourth. The observed
failure: "author did not provide an answer" gets silently filled in as
`out_of_domain` (or a fabricated confirmation), producing an apparently
complete asset that states a scope position the author never took. A missing
answer is a knowledge state; `out_of_domain` is a scope judgment — different
axes, not interchangeable. The third state already has expressions
(`BoundaryEffect: out_of_domain`, declaration `not_applicable`) and needs no
new synonym.

### 1.3 Diagnostics carry coordinates but no cause (C)

When creation or admission fails, the rejection envelope's `diagnostics[]`
items are a closed five-field shape `{code, stage, severity, subject, field}`
(`ReadDiagnostic` in `specs/public-semantic-source.json`, verified on main:
`additionalProperties:false`). A diagnostic can say *where* (`field`) but not
*why in machine-readable form* — no short reason code, no list of missing
items, no expected value. The CLI today compensates for one failure class
(`…/method/components`) with a sibling `guidance` key whose data comes from the
delivered read-only method-role table (`getMethodRoleTable()` in
`kdna-core/public-contract/components.js`, reasons `method_component_roles` /
`method_missing`). That is CLI-side, one class only, and not part of the core
envelope. The gap is cause-level detail inside the core diagnostic itself.

---

## 2. Non-goals

* No authorship authentication. Labels are producer declarations; proving who
  a person is stays with the signature track (RFC-0021) and account work.
* No automatic promotion of Agent output to author material, whatever a
  model's confidence.
* No change to `answer_kind` (17 values), `judgment.lifecycle`
  (active/deprecated/superseded/withdrawn), `BoundaryEffect`,
  `AuthoredUnprovidedState`, `PolicyDisposition`, or `SharedTextDeclaration`.
* No default body-view change: the default `--view body` projection carries no
  labels (a separate successor item with its own before/after comparison and
  model-surface retest).
* No backfill of any existing asset, and no migration tool that generates
  labels or states.
* No relaxation of any existing rejection gate.

---

## 3. Proposal

### 3.1 A — Source attribution labels (continues RFC-0022, one rule replaced)

**Labels.** Adopt RFC-0022's three labels unchanged, at judgment granularity:

| Label | Meaning | Required companion material |
| --- | --- | --- |
| `author_stated` | The named author asserted this. | Locator plus the original snippet the judgment was taken from. |
| `agent_inferred` | An Agent derived this from material, within an explicitly delegated scope or from cited material. | Rationale, producer identity, inputs derived from. |
| `agent_suggested` | An Agent proposed this and no author has confirmed it. | The proposal and producer identity. |

Labels are additive, carry no default, and are producer declarations, not
authentication.

**Two sets, not one (this replaces RFC-0022's effective-set rule 1).**
RFC-0022 currently reads: effective set = `author_stated` plus
`agent_inferred` entries that carry their rationale. **That rule is not
adopted.** A reviewable inference is not an adopted position: rationale makes
an inference inspectable, not authorial. This RFC replaces it with:

1. **Author stance set** — answers "what did the author actually say/think" —
   is exactly `author_stated` entries plus entries promoted by a confirmation
   record.
2. **Derived reviewable set** — `agent_inferred` entries. They can and should
   be reviewed against their inputs and derivation, but presentation and
   composition must not answer stance questions from this set as if the author
   had stated it.
3. `agent_suggested` stays a candidate outside both sets, with no automatic
   promotion path.
4. **Confirmation record is the only promotion channel.** Sketch fields per
   RFC-0022 (non-binding there, settled here at implementation review):
   `entry_digest`, `from_label`, `to_label`, `confirmed_by`, `confirmed_at`,
   `method` (`author_review` / `author_edit` / `author_rejection`). Placement
   leans **in-asset** (adoption facts should not be locked in a private
   service); host-side records only reference it. Final placement and field
   names: Open question 1.
5. An Agent must never relabel `agent_suggested`/`agent_inferred` as
   `author_stated`. A withdrawal is recorded like an addition: the entry keeps
   its history and gains a confirmation record that removes it from the stance
   set.

**Delegation boundary.** Within an explicitly delegated scope, an Agent's
research/editing decisions are legitimately labeled `agent_inferred` (the
authorization basis is expressed via `attributions`/process records): they are
neither disguised as `author_stated` nor rendered unusable by the absence of
per-item human signature.

**Granularity.** Judgment-level first: `reason`/`material` content is covered
by the label through references. Finer granularity is an open extension
(Open question 3), not a launch requirement.

**Unlabeled assets.** No label = unknown, forever. No tool backfills a label
onto an existing entry. Consumers that do not understand labels treat a
carrying asset at least as strictly as today (RFC-0022 Compatibility): they may
refuse to present entries they cannot classify and must not present
`agent_suggested` entries as author material.

**Snippet handling.** Original wording is preserved as received; normalization
happens as a separate, referenced layer, never as an overwrite. Byte-exact vs
normalized-with-locator storage: Open question 2.

### 3.2 B — Judgment state (undecided / declined / conflicted)

**Field.** New **optional** judgment-level field `judgment_state`:

| Value | Meaning |
| --- | --- |
| `open` | Not yet discussed / not yet decided (the pending state). |
| `declined` | The author was explicitly asked and refused to answer. |
| `conflicted` | The materials behind this judgment conflict with each other. |

"Explicitly not applicable" is **not** a fourth value: it keeps its existing
expressions (`BoundaryEffect: out_of_domain`, declaration `not_applicable`).
No new synonym is created.

**The four states are not interchangeable (anti-fill-in rules).**

* `open` is never rewritten to `out_of_domain`, `none`, or deleted — at
  creation, migration, or conversion. An undetermined question stays visibly
  undetermined.
* Absence of an answer is never recorded as `declined`, and a refusal is never
  recorded as `open` or as not-applicable; each state asserts a different fact
  about what actually happened.
* `conflicted` is a property of the materials behind **this** judgment. It is
  not automatically an asserted `conflict` relation between two judgments, and
  it is not the same structure as the existing `PolicyDisposition` code
  `conflict` (a policy outcome disposition) — different axes, no coercion in
  either direction. Likewise, juxtaposing a `conflict` disposition and a
  `value_order` shared declaration proves nothing about a bound adjudication
  basis; binding requires the actual confirmation record.
* `judgment_state` is orthogonal to `judgment.lifecycle`
  (active/deprecated/superseded/withdrawn): when an `open` judgment is later
  decided, the old version keeps its `open` history and the new version states
  normally. (This answers RFC-0022 Open question 3; the reference there to
  `specs/RFC-0013` is dangling — that RFC is Withdrawn — and this RFC's
  landing PR fixes the link to point at the current `judgment.lifecycle`
  contract.)
* `judgment_state` never becomes an 18th `answer_kind`.

**Shape preservation.** A judgment carrying any state keeps the complete
judgment shape (conclusion body + original wording). Marking never yields an
empty result: old consumers that ignore the field read byte-identical behavior
to today; new consumers can filter or flag.

**Admission.** Values outside the three-value enum are **rejected**, not
silently tolerated. Absent field = existing behavior. (If `conflicted` later
turns out to need per-actor split semantics, it is split out as its own later
versioned change; the field is never distorted to carry both meanings. Open
question 4.)

### 3.3 C — Diagnostic payload: `reason` / `missing` / `expected`

In the next envelope version, `ReadDiagnostic` gains three **optional** fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `reason` | short code (Text, code-shaped) | Machine-readable cause for this diagnostic. |
| `missing` | array of strings, ≤ 64 items | The specific items whose absence caused the failure (e.g. required role names). |
| `expected` | string or array (≤ 64 items) | What the field/structure expected instead of what it got. |

The five existing fields are preserved verbatim; `required` unchanged;
`additionalProperties:false` retained — the new fields are additions inside a
new version, never silent tolerance. Old consumers reading only the five
fields are unaffected; producers and validators upgrade on the pinned
coordinate.

Diagnostics are **output objects**, not asset input: this changes no asset
compatibility, but touches every validation/passthrough consumer (§4).

**Vocabulary.** `reason` values share one vocabulary with the existing
source-input admission stage — one vocabulary, implemented in both places.
The exact final list is not fixed by this draft (Open question 6): the
candidate names circulating in design (`missing_required_key`,
`unexpected_key`, `wrong_type`, `wrong_value`, `missing_roles`,
`role_not_allowed`, `role_duplicate`, `component_method_mismatch`) do not all
match names on current main, and the already-delivered CLI guidance sibling
keys use `method_component_roles` / `method_missing`. The unified list passes
the naming gate and is settled in this RFC's implementation review.

**Producer work named by this RFC** (for the implementer): schema-keyword →
reason mapping plus enum-derived `expected` in `validate.js`; method-role
threading (`missing`/`expected` from the role table) in `r2-semantics.js`;
sanitization and threading in `admit.js` (reason code-shaped, arrays ≤ 64);
byte-identical synchronization of the browser-native mirrors, guarded by the
existing node↔browser deep-equality regression suite.

### 3.4 One coordinated version move (the named list)

A and B add payload/IR fields; C moves the IR axis. All three ride **one**
coordinate move so consumers switch once. Verified against main at drafting
(2026-10-22; numbers re-confirmed at implementation):

| Axis | From | To | Why it moves |
| --- | --- | --- | --- |
| `kdna.canonical-ir` | `0.6.1` | `0.6.2` | `ReadDiagnostic` lives on the IR axis (`specs/public-semantic-source.json` `types.ReadDiagnostic` + `versionTuple.ir`). |
| `kdna.read` | `0.6.4` | `0.6.5` | `specs/read-contract-0.6.4.schema.json` embeds its own `ReadDiagnostic` and the const `contract: kdna.canonical-ir/0.6.1`. |
| `kdna.runtime-capsule` / `kdna.consumption-plan` / `kdna.agent-host` (request + receipt) / `kdna.judgment-trace` | `0.3.1` | `0.3.2` | `VersionTuple` is embedded as a const in the five execution schemas. |
| `read-transport-admission` | `0.2.1` | `0.2.2` | Embeds the tuple. |
| `package-set-node` | `0.2.1` | `0.2.2` | Embeds the tuple. |
| `protection-admission-r2`, `external-grant-issuer-r2`, `protected-source-r2` bindings | `8` | `9` (evaluated) | Embed the tuple; binding-7 and older stay frozen and untouched. |
| payload profile | `0.5.1` | next (number at implementation) | A/B fields are additions to the closed judgment structure. |
| container (candidate 0.6 route) | `0.6.0` candidate | stays candidate until this design settles | The creation route's output tuple re-pins to the new axes. |

Old coordinates are frozen; active graphs exclude them. Generation-source
bookkeeping (`native-output-recipe.json` `input_sha256`, preimage metadata,
`public-generation-manifest.json`) re-pins in the same commit.

**No pre-landing.** None of C's three fields, and none of the embedded
consumers above, change before this RFC's 0.6 design is final — including
"small" preparatory edits to sources, generators, recipes or docs.

**Loader gate for A/B.** Assets carrying the new fields are gated by
`compatibility.min_loader_version`: an older core rejects such an asset with
an explicit unsupported-version rejection whose message a user can understand
(`READ_UNSUPPORTED_VERSION` with a plain-language explanation) — never a
silent misread. The closed schemas already make misread structurally
impossible; the gate makes the refusal legible. Final wording: Open
question 11.

---

## 4. Affected surfaces

**Single source of truth and its generated fan-out** (kdna repo):
`specs/public-semantic-source.json` → `generate-native.mjs` outputs —
canonical-IR schemas (under `specs/` and `packages/kdna-core/schema/`),
execution validators, generated contract, `.d.ts`, test vectors;
`specs/public-vocabulary.json`; `specs/read-contract-0.6.x.schema.json` +
`specs/read-contract.md`; `native-output-recipe.json`;
`public-generation-manifest.json`.

**kdna-core:** `validate.js`, `r2-semantics.js`, `admit.js`, browser-native
mirrors; producer self-validation; conformance vectors. Package release rides
the repo's existing release rules (exact number at implementation).

**kdna-cli:** create-output passthrough of the new diagnostic fields; §8 field
reference gains `reason`/`missing`/`expected` (+ existing `guidance` note);
read output unchanged (default body view carries no labels — §2); surface and
inventory counts re-pinned in the same commit.

**kdna-read:** no logic change; coordinate statements (README, manifests,
exact-peer pins) re-pin to the new read/IR axes.

**MCP adapter:** presentation passthrough; no field-shape involvement.

**Browser entries:** sections-family failure shapes contain no `diagnostics[]`
(unchanged); payload-family browser entries are inventoried at implementation
(Open question 10).

**Conformance / eval:** new vector cases (below).

**Docs matrix / READMEs:** re-pin with the release.

**New test categories:**

* *A — labels:* (1) an old unlabeled asset reads as unknown and is never
  backfilled; (2) `agent_inferred` is absent from the author stance set
  regardless of rationale presence; (3) `agent_suggested` is absent from the
  stance set until a confirmation record exists, and present after; (4) no
  automatic promotion, including when suggestion text is byte-identical to an
  author statement; (5) an unknown label is refused rather than read as author
  material; (6) a delegated Agent decision labeled `agent_inferred` remains
  usable (not dead-weight, not disguised); (7) an asset carrying only
  unconfirmed suggestions yields an explicit empty-stance-set result with a
  reason, not a silently empty view.
* *B — state:* (1) absent field → byte-identical today-parity; (2) the three
  values accepted; (3) an illegal value rejected (not coerced); (4) `open`
  never rewritten to `out_of_domain`/`none`/deletion across create, migrate,
  convert; (5) lifecycle orthogonality — a later decision leaves the old
  version's `open` history intact; (6) `conflicted` not auto-derived as an
  inter-judgment conflict relation.
* *C — diagnostics:* (1) `reason`/`missing`/`expected` present where the
  cause is known; (2) the five legacy fields verbatim unchanged; (3) illegal
  `reason` type and over-64 `missing` rejected; (4) node↔browser mirror
  deep-equality; (5) old `0.6.1`-era vectors do not regress.
* *Cross — gate:* a new-field asset on an old core produces the explicit
  unsupported-version rejection, not a silent misread.

---

## 5. Compatibility

1. **Closed stays closed.** Every touched type keeps `additionalProperties:
   false` in its new version. New fields are optional additions inside a
   versioned change; there is no silent tolerance and no unversioned field
   anywhere.
2. **What absolutely does not move:** the five `ReadDiagnostic` fields
   (verbatim); `answer_kind` (17 values); `judgment.lifecycle`;
   `BoundaryEffect`; `AuthoredUnprovidedState`; `PolicyDisposition`;
   `SharedTextDeclaration`; binding-7 and older (frozen); the default
   `body`/`raw`/`full` read projections; every existing rejection gate.
3. **Old assets stay unknown.** No default label, no default state, no
   backfill. Missing field = old behavior, exactly.
4. **Labels only from creation/confirmation.** Conversion and migration tools
   (including the public converter) never generate labels or states;
   regression tests pin this.
5. **Each field is separately revertible.** Stop writing it; readers tolerate
   absence natively. No byte-level migration obligation is created.
6. **Consumers that do not understand the new semantics** follow the declared
   scope (RFC-0022 Compatibility section, extended by the same rules): refuse
   to present what cannot be classified; never present `agent_suggested` as
   author material; never rewrite `open`.

---

## 6. Open questions

1. **Confirmation record placement and field names** — in-asset (leaning) vs
   host-side reference; final field names. (Inherited from RFC-0022 OQ1.)
2. **Snippet storage** — byte-exact vs normalized with locator (RFC-0022 OQ2).
   Original-wording preservation is fixed; the storage encoding is not.
3. **Label granularity** — is judgment-level sufficient, or do `reason`/
   `material`-level labels become necessary? Extension stays open; not a
   launch blocker.
4. **`conflicted` actor-split** — if real material shows the conflicted state
   needs per-actor columns (two authors' materials conflicting vs one
   author's materials self-conflicting), split it out as a later versioned
   change. Design does not cover this yet.
5. **Exact new coordinates** — payload profile number, package versions, and
   the final pairing of A/B/C changes across the candidate 0.6 route; main has
   moved since the plan was written (core `0.37.3` → `0.37.9`, read `0.13.3`
   peer `0.37.9`) and numbers are confirmed at implementation, not here.
6. **`reason` vocabulary** — final unified list and names. The candidate names
   in design notes do not all exist verbatim on main; delivered CLI guidance
   uses `method_component_roles` / `method_missing`. One vocabulary, naming
   gate, full list settled in implementation review.
7. **Enforcement point for labels** — unknown label: hard rejection at
   container admission vs bounded warning at presentation (RFC-0022 OQ4).
   `judgment_state` admission is specified (reject illegal values); label
   admission is not.
8. **Where labels surface to readers** — default body view excluded by
   decision; the opt-in surface (CLI read output / model-view / API) is a
   separate successor with its own before/after comparison and model-surface
   retest. This RFC does not define it.
9. **`judgment_state` vs declaration-level unprovided states** — both
   `judgment_state` and `AuthoredUnprovidedState`
   (`unknown`/`none`/`not_applicable`) can apply to nearby content; the design
   does not map their interaction. A precedence rule or an explicit
   "different structures, no coercion" statement is needed.
10. **Browser payload-family failure shapes** — which payload-family browser
    entries can surface `diagnostics[]`; inventoried at implementation.
11. **`min_loader_version` rejection wording** — the user-facing message for
    "this asset needs a newer loader" (explicit refusal, user-comprehensible,
    names the needed coordinate).


---
