# Public PackageSet node surface

Status: **UNPUBLISHED_CANDIDATE / REFERENCE_IMPLEMENTATION**. This document
describes the two public Node subpaths `@aikdna/kdna-core/package-set-node` and
`@aikdna/kdna-read/package-set-node`. It is generated-adjacent documentation, not
an acceptance record: the machine-readable parts live in
[`specs/package-set-node-0.2.schema.json`](package-set-node-0.2.schema.json),
[`specs/package-set-node.d.ts`](package-set-node.d.ts) and the two generated
module contracts, and every identity below is derived from
[the single semantic source](public-semantic-source.json).

Current module: `kdna.package-set-node/0.2.0`, module version `0.2.0`, with
Schema `urn:kdna:schema:package-set-node:0.2.0` and handoff
`kdna.package-set-handoff/0.2.0`. The complete R2 tuple and exact Core/Read package
combination are fixed by the single source. Old module/handoff/digest combinations
are rejected; version rewriting is not migration. The old
[Schema](package-set-node.schema.json) and [document](history/pre-r2/package-set-node.md)
retain their historical identity. Existing public subpaths and seven Core/five Read
call names remain. This does not merge IRs, authenticate claims, confer action
authority, or prove protected PackageSet or cross-language support.

## Where this sits in the trust boundary

The surface adds no new judgment channel. It runs inside the existing two-stage
boundary — Core static admission, then the installer's own Read delivery:

```
real complete members (one Uint8Array each)
      |  Core: pure capture, per-member real admission, R07 order
      v
admitPackageSetNode -> R07 decision + genuine snapshots (Core-private brand)
      |  Read: own Host, per-observation Host/epoch pinning, one real sink
      v
DeliveredPackageRead (opaque; not restorable from JSON)
      |  correlation only
      v
seal / admit handoff + an independently admitted Plan -> claims_not_authenticated
```

The accepted internal decider and handoff checker are **called**, never exported:
a caller that could supply its own observations would make authorization a
function of JSON. The two modules that hold the private state are
`packages/kdna-core/src/public-contract/package-set-admission.js` and
`packages/kdna-read/src/package-set-host.js`.

## Core: `@aikdna/kdna-core/package-set-node`

| Callable | Meaning |
|---|---|
| `getPackageSetContract()` | The generated module descriptor, including the definition digest that binds this module to the single source. |
| `validatePackageSetStructure(input)` | A pure structural read of a caller-shaped PackageSet. No callback, no file, no crypto. |
| `createTrustedPackageSetMemberProvider({host_id,host_epoch,observe})` | The installer's member policy. Returns a Core-private brand. |
| `admitPackageSetNode({set,tuple,members,operation,limits}, provider)` | Real member admission plus the accepted R07 decision and genuine snapshots. |
| `recheckPackageSet(admission, phase)` | A fresh member observation at a defined boundary. `phase` is `read` or `handoff`. |
| `inspectAdmittedPackageSet(admission)` | The branded admission view, or `null`. |
| `verifyPackageSetHandoff(handoff, admission, plan, deliveredRead)` | Static correlation of a past delivery with an independently admitted Plan. |

`members` is a `ReadonlyArray<{member_id, bytes}>`; bytes are owner-exclusive
copies taken before the first `await`, and each member's real admission goes
through the accepted `./node` bytes entry. `PackageSet` keeps its accepted three
fields; the tuple is a separate argument and is joined with the set only for the
R07 call.

### Observer contract

The member observer receives exactly
`{set_id, members, selection, operation, phase}` — the set's own member array in
its original order, with duplicates preserved — and returns
`{decisions: [{member_id, asset_id, asset_version, A, decision, decision_id, host_id, host_epoch, issued_at, expires_at, current_ms}]}`.
The pairing unit is the de-duplicated full identity
`(member_id, asset_id, asset_version, A)`, never a position and never the
`member_id` alone. A row for an identity the set does not declare, a second row
for the same identity, a contradictory allow/deny pair and a non-monotonic clock
are all local `provider_observation_invalid`; a missing row or a single valid
`deny` is an authorization failure. No first cause is invented when no
observation happened.

`phase` is strictly `initial | read`. `admitPackageSetNode`'s first observation
is `initial`; `recheckPackageSet(admission,'read')` and
`recheckPackageSet(admission,'handoff')` both map onto one fresh `read`
observation, so no third phase exists and no generated type carries two
inconsistent enums.

### Order and resources

The order is fixed and observable: cancel -> closed input, limits, both counts
against the running allowance, overflow-safe total bytes -> PackageSet shape ->
member source identity -> provider brand and initial observation -> R07
`unauthorized -> missing -> extra -> duplicate -> tuple -> Core -> merge ->
selection`.

`limits` is exactly `{maxMembers, maxTotalSourceBytes}`, a positive safe integer
in each case and without a default. The library's own hard caps are 10000 members
and 104857600 total source bytes; exceeding them is a local configuration
refusal (`invalid_limits`), never an R07 decision. Actual counts and actual bytes
have their own codes (`member_limit_exceeded`, `source_bytes_limit_exceeded`) and
are compared against the remaining allowance instead of being summed first.

## Read: `@aikdna/kdna-read/package-set-node`

| Callable | Meaning |
|---|---|
| `getPackageReadContract()` | The Read-side module contract; fails closed when the installed Core does not match. |
| `createTrustedPackageReadProvider({host_id,host_epoch,members,observeRead,sink})` | The installer's own Host. Returns a Read-private brand. |
| `readPackageSetNode({set,tuple,members,operation,limits,request,signal?}, control, provider)` | The real read and the real synchronous delivery. |
| `sealPackageSetHandoff(deliveredToken, admittedPlan)` | Builds and verifies the handoff from this Read instance's own token. |
| `admitPackageSetHandoff(wire, deliveredToken, admittedPlan)` | The same complete checks for an externally supplied wire. |

The Read side never re-parses an asset and never rebuilds a Core judgment: the
selected member is consumed as the genuine snapshot the Core admission produced,
through the accepted internal pipeline. The request must be `exact_selection`
with `handle: null` and a selection exactly equal to `set.selection`. The pure
pre-check uses the same-package `inspectCandidate`, because `admitReadRequest`
consults the trusted control observer even for a malformed candidate and could
therefore never honestly claim zero control calls.

The constructor captures the Core member provider **by reference**. It does not
import, probe or copy Core's private brand, and it does not claim that the brand
was verified at construction. Core confirms the brand when the member admission
actually runs; the genuine admission view's `host_id`/`host_epoch` are then
required to equal the Read provider's fixed labels, and a mismatch is
`provider_invalid` with no observation, no sink and no token.

### Delivery

The own Host pins `host_id` and `host_epoch` on **every** observation, including
the first and the post-sink one, because the accepted generic gate compares Host
identity only when a handle is present and this line always fixes `handle: null`.
A pair of consistent foreign labels is not a new binding.

Only a synchronous strict `true` from the sink confirms delivery. A `false`, a
throw and a returned Promise are all `delivery_unconfirmed`; a Promise is neither
awaited nor able to upgrade later, and there is exactly one physical sink attempt
with no retry. After a real sink the `sink_invoked` and `sink_confirmed` facts
and the physical file are kept even when a later check fails: a past disclosure
is never retroactively withdrawn, and the token is withheld.

## Local failures

`invalid_limits`, `member_limit_exceeded`, `source_bytes_limit_exceeded`,
`invalid_member_source`, `invalid_read_request`, `provider_invalid`,
`provider_failed`, `provider_observation_invalid`, `cancelled`,
`core_unavailable`, `delivery_unconfirmed`, `handoff_invalid`.

These twelve are local. They are **not** on the wire: none of them appears in
`specs/public-diagnostics.json`, and a malformed PackageSet is still the accepted
R07 `READ_INPUT_INVALID` rather than a local code.

## Limits of this contract

`claims_not_authenticated` is the strongest statement any of these operations
makes about a handoff. Static correlation is not execution permission, a member
observation is not disclosure authority, and a delivered token proves only a
past delivery. This surface does **not** provide a protected PackageSet, does not
prove cross-language equivalence, and is not an installed-consumer receipt.
