# KDNA Read Contract 0.2.0

Status: **UNPUBLISHED_CANDIDATE**; runtime and independent acceptance are recorded separately.
This design belongs to Open. It is not a published package, a claim about registry availability, or a change to the active 0.1 protocol. The complete new supported tuple is in `public-contract-decisions.json#/version_policy/supported_tuple`. Field spellings below are chosen for this design; unknown object fields are rejected. The unique `public-semantic-source.json` and its generated closed types are the current machine authority. This document explains that contract without creating a second parser, validator, resolver or IR.

<a id="r01"></a>

## R01 — Package and trust boundary

Local candidate: `@aikdna/kdna-read@0.3.0-rc.component-semantics.2` at `packages/kdna-read`, with exact Core peer `0.24.0-rc.component-semantics.2`. Publication is not claimed.

| Planned export | Chosen responsibility | Explicit rejection |
|---|---|---|
| `.` | `admitReadRequest(candidate, controlProvider): ReadAdmissionResult`; `project(admittedRequest, snapshot): ReadProjection`; pure request admission followed by deterministic pure projection of an already admitted Core snapshot, with no I/O, clock read, credential prompt or action execution | Raw bytes/path, unbranded/deserialized snapshot, unsupported tuple; never returns a read permission grant |
| `./node` | `readNode(input, candidate, controlProvider, host): Promise<ReadCallResult>`; path, Buffer or Uint8Array to the sole Core Node admission adapter, then Host disclosure gate and pure projection | DOM/File objects, caller self-attestation, direct container parsing/decryption in Read |
| `./browser` | `readBrowser(input, candidate, controlProvider, host): Promise<ReadCallResult>`; ArrayBuffer/Uint8Array or Core-branded snapshot through an explicitly browser-capable Core adapter, then the same Host disclosure gate | Path/string, Node Buffer-specific API, DOM dependency, unsupported Core capability or silent server fallback |
| `./types` | Type declarations only | Runtime parser or adapter behavior |
| `./package.json` | Package metadata only | Authority or permission |

Only Core/Canonical IR are runtime dependencies of Read. Node I/O and browser byte admission are Core adapter capabilities; the adapters do not clone Core logic. Root must not import Node built-ins, Reader, DOM, React or Tauri. The browser Core adapter synchronously admits stored/deflated bytes using the shared interpreter. Unsupported capabilities still reject; actual browser-engine execution is a separate acceptance obligation. Node path resolution reads one immutable byte snapshot through Core; every later digest/selection/projection binds those bytes, never a re-opened path. No filesystem path is echoed in public results.

Pure `project` is a trusted in-memory transformation, not a disclosure endpoint: it returns `ReadProjection` without a permission/receipt claiming delivery. Possession of a Core snapshot or obtaining a pure projection grants neither disclosure nor execution. Every content disclosure, including cached content and expansion, MUST pass the Host gate in R05 and be delivered in the read_envelope channel. Admission rejections disclose no asset content and perform zero Core/Host calls. Control results initiate no further Core/Host action; a control result reached after an admitted request may retain prior pipeline observations. This separation avoids pretending that a pure function can observe current clock/revocation. Custom consumers using the root function MUST implement the same R05 gate before disclosure; a root projection is not a substitute for it.

<a id="r02"></a>

## R02 — Closed types and scalar rules

All public result objects below are exact-key objects: required properties are always present; nullable fields use explicit null; no undeclared properties or coercion. Arrays preserve specified order. `Identifier` is a nonempty Unicode-scalar string of at most 256 UTF-8 bytes with no control characters (U+0000–U+001F and U+007F–U+009F); it is opaque, not a filesystem path. Digests are lowercase `sha256:` plus 64 hex digits. `UInt` is a safe integer in 0..9007199254740991. Millisecond times are UInt UTC Unix timestamps. Equality is exact, never locale/normalization based. `readonly` means the implementation must copy or freeze its public result graph so caller mutations cannot change admitted snapshots.

The four imported types below belong to `kdna.canonical-ir/0.2.0` at the Core boundary. Read does not redefine their value graph. Their closed definitions and public-field allowlist are generated from the single semantic source. No `unknown`/arbitrary JSON escape can stand in for their values.

```ts
// Public generated Core types for this candidate coordinate.
import type { CanonicalIR, IRReadNode, IRReference, IRRelationship } from "@aikdna/kdna-core";
type Identifier = string;
type Digest = string;
type UInt = number;
type Ms = UInt;
type VersionTuple = {
  container: "0.2.0"; payload_profile: "kdna.payload.judgment"; payload_version: "0.2.0";
  core: "kdna.core/0.3.0"; ir: "kdna.canonical-ir/0.2.0";
  runtime: "kdna.runtime-capsule/0.2.0"; plan: "kdna.consumption-plan/0.2.0";
  host: "kdna.agent-host/0.2.0"; trace: "kdna.judgment-trace/0.2.0";
  read: "kdna.read/0.2.0";
};
type AssetIdentity = { asset_id: Identifier; asset_version: string; judgment_version: string };
type Selection = { asset_id: Identifier; asset_version: string; judgment_id: Identifier };
type CommonRequest = { request_id: Identifier; tuple: VersionTuple; budget_bytes: UInt };
type ReadRequest = CommonRequest & (
  | { mode: "whole_asset"; selection: null; handle: null }
  | { mode: "catalog"; selection: null; handle: null }
  | { mode: "exact_selection"; selection: Selection; handle: null }
  | { mode: "expand"; selection: Selection; handle: ExpansionHandle }
);
type Comparison =
  | { state: "not_compared"; expected: null; expected_source: null }
  | { state: "matched" | "mismatched"; expected: Digest; expected_source: ExpectedSource };
type ExpectedSource = {
  kind: "caller" | "manifest_declaration" | "checksums_declaration" | "trusted_receipt" | "host_observation";
  source_id: Identifier;
};
type DigestEvidence = {
  basis: "container_bytes" | "content_tree" | "runtime_entry_set" | "runtime_capsule_jcs";
  profile: string; profile_version: "0.2.0"; algorithm: "SHA-256";
  observed: Digest; comparison: Comparison;
};
type AssetDigests = { A: DigestEvidence; C: DigestEvidence; E: DigestEvidence };
// Core owns the unforgeable in-process witness. It is NOT a serializable data field.
type CoreAdmissionWitness = opaque;
type CanonicalReadSnapshot = {
  snapshot_id: Identifier; tuple: VersionTuple; asset: AssetIdentity; digests: AssetDigests;
  ir: CanonicalIR; ir_digest: Digest; runtime_entry_names: readonly string[];
  expansion_targets: readonly { target: Identifier; selection: Selection; scope: readonly Identifier[] }[];
  admission: CoreAdmissionWitness;
};
type Declared<T> =
  | { state: "provided"; value: T }
  | { state: "unknown" | "none" | "not_applicable"; value: null };
type Missing = { state: "observed_missing"; field: string };
type Omission = {
  state: "explicitly_omitted"; target: Identifier; field: string;
  reason: "not_requested" | "not_in_mode" | "outside_selection";
  expandable: boolean; handle_id: Identifier | null;
};
type CatalogItem = { judgment_id: Identifier; label: string; node_ref: Identifier };
type Provenance = {
  declarations: readonly IRReadNode[];
  confirmation: "not_evaluated" | "claimed_unverified" | "verified" | "rejected";
  verifier_id: Identifier | null; evidence_ref: Identifier | null;
};
type ReadContent = {
  declarations: readonly IRReadNode[]; catalog: readonly CatalogItem[];
  selected: Selection | null; closure: readonly IRReadNode[];
  references: readonly IRReference[]; relationships: readonly IRRelationship[];
  missing: readonly Missing[]; provenance: Provenance;
  expansion_handles: readonly ExpansionHandle[];
};
type ExpansionHandle = {
  handle_id: Identifier; asset_id: Identifier; asset_version: string;
  A: Digest; C: Digest; snapshot_id: Identifier;
  core_version: Identifier; ir_version: Identifier; read_version: Identifier; // shape-safe labels; equality checked after record lookup
  selection: Selection; target: Identifier; scope: readonly Identifier[];
  issued_at: Ms; expires_at: Ms; host_id: Identifier; host_epoch: Identifier;
};
type Stage = "input" | "version" | "core" | "selection" | "handle" | "host" | "projection" | "budget";
type ReadDiagnostic = {
  code: DiagnosticCode; stage: Stage; severity: "error" | "warning";
  subject: Identifier | null; field: string | null;
};
type TechnicalState = "not_evaluated" | "valid" | "invalid";
type InterpretationState = "not_evaluated" | "complete" | "degraded" | "blocked";
type ResponsibilityStates = {
  core: TechnicalState; interpretation: InterpretationState;
  writer: "not_evaluated" | "sufficient" | "insufficient";
  confirmation: "not_evaluated" | "claimed_unverified" | "verified" | "rejected";
  read_permission: "not_evaluated" | "allowed" | "denied";
  action_authorization: "not_evaluated";
};
type Assessment = {
  state: "not_evaluated" | "reported"; kind: "semantic_understanding" | "external_evaluation" | null;
  assessor_id: Identifier | null; evidence_ref: Identifier | null;
};
type HostReadContext = {
  host_id: Identifier; host_epoch: Identifier; decision_id: Identifier; request_id: Identifier;
  snapshot_id: Identifier; A: Digest; C: Digest;
  scope: readonly Identifier[]; issued_at: Ms; expires_at: Ms;
  decision: "allow" | "deny"; policy_id: Identifier;
  witness: opaque; // Host-provider-owned, never a serialized authorized:true.
};
type ProjectionBody = {
  asset: AssetIdentity; tuple: VersionTuple; digests: AssetDigests;
  snapshot_id: Identifier; content: ReadContent;
  diagnostics: readonly ReadDiagnostic[]; omissions: readonly Omission[];
  assessment: Assessment;
};
type ReadProjection =
  | { status: "projected"; body: ProjectionBody; diagnostics: readonly [] }
  | { status: "rejected"; body: null; diagnostics: readonly [ReadDiagnostic] };
type ReadReceipt = {
  receipt_id: Identifier; request_id: Identifier; snapshot_id: Identifier | null; host_id: Identifier | null;
  host_epoch: Identifier | null; decision_id: Identifier | null;
  disclosed_at: Ms | null; delivery: "delivered" | "not_delivered";
};
type ReadBudget = {
  limit_bytes: UInt;
  required_bytes: string; // exactly 16 decimal digits, leading zeros allowed only here
  actual_bytes: string;   // exactly 16 decimal digits; included in its own byte count
};
type ReadEnvelope = {
  contract: "kdna.read/0.2.0"; request_id: Identifier; status: "ready" | "rejected";
  tuple: VersionTuple | null; asset: AssetIdentity | null; snapshot_id: Identifier | null;
  digests: AssetDigests | null; content: ReadContent | null;
  states: ResponsibilityStates; diagnostics: readonly ReadDiagnostic[];
  omissions: readonly Omission[]; assessment: Assessment;
  receipt: ReadReceipt; budget: ReadBudget;
};
```

`opaque` above is specification notation for an unforgeable object identity issued by the named authority; it is not a TypeScript library declaration and must become a private brand in implementation. Serializing any witness loses authority. A transported IR/snapshot must be admitted and re-issued by the sole Core; Read never reconstructs a witness from booleans, digest strings, class names, JSON or a caller signature claim. No public envelope returns `ir`, witnesses, payload bytes, raw source paths, credentials, Prompt, DOM state or authoring evidence bodies.

`DigestEvidence.profile` is not arbitrary: exact allowed pairs are A→`kdna.digest-basis.container-bytes`, C→`kdna.digest-basis.content-tree`, E→`kdna.digest-basis.runtime-entry-set`, P→`kdna.canonicalization.runtime-capsule-jcs`. All are `/0.2.0`; basis and profile must correspond. P is a detached runtime-delivery value, not an AssetDigests field and not inserted into a Runtime Capsule.

### Request admission and the closed result algebra

E-W1-01 is corrected here without changing the selected version family. Raw `candidate` exists only at `admitReadRequest` (its language-level argument may be unknown). Its data fields are inspected without coercion or executing values as instructions. Inspection/representation failures that prevent completion become the fixed transport failure and never echo exception text; this contract does not claim to authenticate arbitrary language object prototypes. Ordinary JSON-compatible non-array objects follow the explicit first-error rules below. No raw candidate or arbitrary JSON is stored in a result. Both adapters invoke this same admission operation before input loading or any Core/Host action. A Core witness and an AdmittedReadRequest brand are separate authorities.

```ts
type AdmissionReason = "representation_not_object" | "unknown_field" | "missing_required"
  | "wrong_type" | "invalid_identifier" | "unsafe_integer" | "out_of_range" | "mode_shape_invalid";
type AdmissionField = "$candidate" | "$unknown" | "request_id" | "tuple" | "budget_bytes"
  | "mode" | "selection" | "handle" | "tuple.container" | "tuple.payload_profile"
  | "tuple.payload_version" | "tuple.core" | "tuple.ir" | "tuple.runtime" | "tuple.plan"
  | "tuple.host" | "tuple.trace" | "tuple.read" | "selection.asset_id"
  | "selection.asset_version" | "selection.judgment_id" | "handle.handle_id"
  | "handle.asset_id" | "handle.asset_version" | "handle.A" | "handle.C"
  | "handle.snapshot_id" | "handle.core_version" | "handle.ir_version" | "handle.read_version"
  | "handle.selection" | "handle.target" | "handle.scope" | "handle.issued_at"
  | "handle.expires_at" | "handle.host_id" | "handle.host_epoch";
type ReadCorrelation =
  | { state: "validated"; request_id: Identifier }
  | { state: "unavailable"; request_id: null };
type AdmissionDiagnostic = {
  stage: "admission"; severity: "error"; reason: AdmissionReason; field: AdmissionField;
};
type TrustedReadControlProvider = {
  observeControl(): TrustedControlObservation; brand: opaque;
}; // embedding-injected synchronous service, never caller-selected or serializable
// Provider's authenticated observation; this is not a request or Host permission field.
type TrustedControlObservation = { admission_response_limit_bytes: UInt; witness: opaque };
type ReadAdmissionRejection = {
  contract: "kdna.read-admission/0.1.0"; code: "READ_INPUT_INVALID";
  diagnostic: AdmissionDiagnostic; correlation: ReadCorrelation;
  control_budget: { limit_bytes: UInt; actual_bytes: string }; // exactly 16 decimal digits
};
type ReadSemanticCode = DiagnosticCode; // Read diagnostics only, excluding control/transport signals
// semantic_cause is the first known semantic failure, never a claim of delivery.
type ReadNoBodyControl = {
  code: "READ_ADMISSION_RESPONSE_TOO_SMALL" | "READ_RESPONSE_BUDGET_TOO_SMALL";
  semantic_cause: ReadSemanticCode | null; correlation: ReadCorrelation; body_bytes: 0;
};
type ReadTransportFailure = {
  code: "READ_TRANSPORT_FAILURE"; semantic_cause: ReadSemanticCode | null;
  correlation: ReadCorrelation; delivery: "not_confirmed";
};
type AdmittedReadRequest = opaque; // private immutable brand issued only by admitReadRequest
// Brand payload is private. It has one of these two closed, safe forms:
type AdmittedRequestRecord =
  | { request_id: Identifier; budget_bytes: UInt; request: ReadRequest; version_rejection: null }
  | { request_id: Identifier; budget_bytes: UInt; request: null;
      version_rejection: "READ_UNSUPPORTED_VERSION" | "READ_MIXED_VERSION_TUPLE" };
type ReadAdmissionResult =
  | { channel: "admitted_request"; admitted_request: AdmittedReadRequest;
      admission_rejection: null; control: null; transport_failure: null }
  | { channel: "admission_rejection"; admitted_request: null;
      admission_rejection: ReadAdmissionRejection; control: null; transport_failure: null }
  | { channel: "no_body_control"; admitted_request: null;
      admission_rejection: null; control: ReadNoBodyControl; transport_failure: null }
  | { channel: "transport_failure"; admitted_request: null;
      admission_rejection: null; control: null; transport_failure: ReadTransportFailure };
type ReadCallResult =
  | { channel: "read_envelope"; envelope: ReadEnvelope;
      admission_rejection: null; control: null; transport_failure: null }
  | { channel: "admission_rejection"; envelope: null;
      admission_rejection: ReadAdmissionRejection; control: null; transport_failure: null }
  | { channel: "no_body_control"; envelope: null;
      admission_rejection: null; control: ReadNoBodyControl; transport_failure: null }
  | { channel: "transport_failure"; envelope: null;
      admission_rejection: null; control: null; transport_failure: ReadTransportFailure };
```

An AdmittedReadRequest means the request ID and budget are safe and a deterministic next step exists, not that its version or asset is supported. Version rejection uses the second record: discard all later unvalidated mode/selection/handle material. `project` returns that version diagnostic before accessing Core; an adapter constructs the corresponding budgeted rejection Envelope with tuple=null and no Core/Host observations. This makes version-before-mode precedence implementable without storing unsafe later fields. Version and asset-version labels are nonempty Unicode-scalar strings with the Identifier byte/control bounds. Malformed tuple labels give invalid_identifier before family comparison. For an exact supported tuple, complete mode shape must pass before issuing the first record. `project` accepts only this brand plus a Core snapshot; a forged/deserialized request brand yields a fixed ReadProjection rejection READ_INPUT_INVALID, subject/field=null. It never creates an Envelope or a new admission rejection from unchecked request fields.

ReadAdmissionResult makes no transport-delivery claim. Node/browser map its three failure channels directly to ReadCallResult (replacing admitted_request with envelope:null); on admitted_request they continue through version rejection or Core/Host/projection and Envelope budgeting. Encoding/provider/transport failures are caught and mapped to transport_failure; throw, undefined, raw Error or arbitrary JSON are not public fifth exits. A trusted control provider is required even for an otherwise valid candidate; unavailable/invalid witness, non-UInt limit or provider failure yields READ_TRANSPORT_FAILURE. The pure candidate inspection determines any semantic first error independently; provider failure preserves that code as semantic_cause, or null when none was established, and never changes the semantic ordering. The embedding authenticates the provider brand and its observation witness; caller-created objects with the same methods/fields are invalid. observeControl is synchronous, fixed for one admission call and performs no I/O/clock/Host work; failures are transport_failure. This provider supplies only response limits and is not a Host, policy, identity or disclosure authority.

<a id="r03"></a>

## R03 — Modes and semantic projection

Core supplies Canonical IR ordering and stable identity once. Read preserves it without sorting judgments by label, reinterpreting rules, scoring, executing a condition or inventing defaults.

- `whole_asset`: public asset-level declarations and provenance plus every catalog descriptor in the Host-authorized scope. `selected=null`, `closure=[]`. It does not disclose all judgment bodies; every unselected judgment body has one `not_in_mode` omission. It does not mean permission for the complete file.
- `catalog`: catalog descriptors only; `declarations=[]`, `selected=null`, `closure=[]`. Asset identity/digests and minimal scoped provenance states remain in the envelope. Whole-asset declarations are one `not_in_mode` omission when present. Judgment bodies each have a `not_in_mode` omission.
- `exact_selection`: exact asset_id + asset_version + judgment_id, all required, no keyword/rank/order fallback. No match rejects. More than one match rejects as ambiguous. Return the selected judgment, complete mandatory closure, its references/relationships and necessary asset declarations. Catalog contains the selected descriptor only. Adjacent judgment bodies remain `outside_selection` omissions, not automatic context.
- `expand`: same exact selection; return the target's public IR nodes plus any mandatory semantic support for that target, under the original selection binding, the Core expansion whitelist and current Host scope. It never turns an optional expansion into unscoped full-payload delivery.

Mandatory closure contains selected identity/subject/effective scope, authored boundary/exception/misuse declarations and their states, result contract and actual result or formation rule, critical-unknown diagnostics, provenance/authority facts, required relation/dependency/source-use and upstream reference closure. Core supplies the closed mandatory-node set under Canonical IR. Read cannot replace a missing required node with an empty list or remove a mandatory node for budget or policy. If Host scope excludes a mandatory member, reject the entire disclosure with `READ_SCOPE_DENIED`; do not return a partial result.

All catalog descriptors, provenance declarations, omission targets/counts and expansion handles are limited to current Host-authorized public identities. Unauthorized adjacent identities are not disclosed even as omission records. Mandatory selected support outside scope still rejects the complete selection. IR public labels are authored content, not navigation authority. `provided` always has a correctly typed value; other declared states have null. Absent observed optional facts appear as Missing; required absence makes Core/interpretation invalid instead of being converted to an author state. Omission is a projection decision recorded separately from both authored unknown and observed missing. Empty arrays cannot substitute for any of those distinctions. Assessment never changes content, Core validity, writer sufficiency, confirmation or permission; a `reported` assessment requires non-null kind/assessor/evidence_ref, while `not_evaluated` requires all three null.

<a id="r04"></a>

## R04 — Deterministic failures and diagnostics

DiagnosticCode is exactly this closed Read diagnostic registry (READ_INPUT_INVALID is also the admission semantic cause; admission reasons have their separate type). READ_ADMISSION_RESPONSE_TOO_SMALL and READ_RESPONSE_BUDGET_TOO_SMALL are control signals, and READ_TRANSPORT_FAILURE is transport-only; none is a ReadDiagnostic. The Read diagnostic registry below is the design input for the future machine derivative `public-diagnostics.json`:

| Code | Stage | Condition |
|---|---|---|
| READ_INPUT_INVALID | input | Wrong type, unknown/missing object field, invalid scalar, unsupported input representation |
| READ_SNAPSHOT_UNATTESTED | input | Missing/forged/deserialized Core witness |
| READ_CORE_CAPABILITY_UNAVAILABLE | input | Requested Node/browser Core admission capability not implemented/available |
| READ_UNSUPPORTED_VERSION | version | Entire old tuple or unknown complete version family |
| READ_MIXED_VERSION_TUPLE | version | At least one new coordinate and at least one missing, different or old coordinate |
| READ_CORE_INVALID | core | Core technical admission invalid; include no invented Host decision |
| READ_INTERPRETATION_INCOMPLETE | core | Core static interpretation degraded or blocked, including unknown critical semantics |
| READ_ASSET_MISMATCH | selection | Selector asset_id differs from admitted asset |
| READ_ASSET_VERSION_MISMATCH | selection | Selector asset_version differs from admitted asset |
| READ_SELECTION_NOT_FOUND | selection | No judgment ID match |
| READ_SELECTION_AMBIGUOUS | selection | More than one exact match within the named package-set; never choose first |
| READ_HANDLE_UNTRUSTED | handle | Handle not in the provider's issued-handle record or any serialized field altered |
| READ_HANDLE_VERSION_MISMATCH | handle | Handle Core/IR/Read tuple differs |
| READ_HANDLE_STALE | handle | Snapshot_id or A/C differs |
| READ_HANDLE_ASSET_MISMATCH | handle | Asset or exact selection differs |
| READ_HANDLE_SCOPE_MISMATCH | handle | Target or mandatory support is outside bound handle scope |
| READ_HOST_CONTEXT_UNTRUSTED | host | Provider witness absent/forged or request/snapshot/A/C correlation mismatch |
| READ_HOST_EPOCH_MISMATCH | host | Handle or Host context belongs to another Host/restart epoch |
| READ_HOST_TIME_INVALID | host | Host clock unavailable, non-safe, or current time precedes context/handle issue time |
| READ_HANDLE_EXPIRED | host | Current Host time >= handle expires_at |
| READ_HOST_CONTEXT_EXPIRED | host | Current Host time >= context expires_at |
| READ_HOST_DENIED | host | Current independent Host decision denies or revocation tombstone applies |
| READ_SCOPE_DENIED | host | Current authorized scope cannot include all mandatory disclosure nodes |
| READ_PROJECTION_INVALID | projection | Core-provided mandatory/public reference graph cannot be projected without loss |
| READ_BUDGET_INSUFFICIENT | budget | Complete successful envelope exceeds requested byte limit |

Request admission uses this exact order, before any Core/Host action:

1. Candidate must be a non-null non-array object; primitive values and arrays give representation_not_object.
2. Reject a top-level unknown key; choose the smallest raw key by unsigned UTF-8 bytes. The public diagnostic field is always `$unknown`, never that raw key or its value.
3. Missing required keys: request_id → tuple → budget_bytes → mode → selection → handle. Stop at the first missing key, regardless of other invalid values.
4. Validate request_id: string type, nonempty Unicode scalars, no controls, at most 256 UTF-8 bytes. Wrong type (including null) is wrong_type; other failures are invalid_identifier.
5. Validate budget_bytes: number type (null/string/bool are wrong_type); nonfinite, fractional or outside JavaScript safe-integer magnitude is unsafe_integer; a safe negative integer is out_of_range. Zero is valid. Never coerce, default or copy an illegal value into a control limit.
6. Validate tuple object/known fields and string scalar types, then version family. Unknown nested keys use `$unknown`; fixed tuple key order is container → payload_profile → payload_version → core → ir → runtime → plan → host → trace → read. Missing version coordinates are version-family inputs, not missing_required admission errors. Shared payload_profile does not count as a new version marker. Any new version-valued coordinate plus a missing/different tuple coordinate yields READ_MIXED_VERSION_TUPLE; an otherwise complete old/unrelated family yields READ_UNSUPPORTED_VERSION. A wrong profile on a new family is mixed; a wholly incomplete non-new family is unsupported. Family errors use the safe version-rejection brand record and stop before mode inspection. No legacy fallback follows.
7. Validate mode and mode-specific selection/handle shape. Unknown/missing nested keys precede scalar validation, using each type's declaration order; nested unknown key selection is unsigned UTF-8 minimum. Selection fields validate in asset_id, asset_version, judgment_id order. Handle fields follow ExpansionHandle declaration order. Invalid discriminator/null arrangement gives mode_shape_invalid; other field errors use wrong_type, invalid_identifier, unsafe_integer or out_of_range. Nested diagnostics use only fixed AdmissionField tokens; deeper handle.selection fields map to handle.selection and scope elements map to handle.scope. Unknown fields at any nesting map to `$unknown`. Tuple/selection/handle nonobjects are wrong_type when that mode requires an object; an invalid required-null arrangement is mode_shape_invalid. Null is never an object. All scalar strings follow their declared bounds; handle.scope must be a nonempty duplicate-free Identifier array and issued_at < expires_at, with invalid interval/duplicate arrangement reported as mode_shape_invalid at handle. Version strings in a shape-valid handle are retained for the later handle-version diagnostic, not coerced into current literals.

Admission returns one sanitized diagnostic only. Correlation is computed independently by the same pure request_id scalar check: a present safe request_id may be returned even if an earlier unknown/missing field won; otherwise `{state:"unavailable",request_id:null}`. This check never changes first-error ordering and never invokes Core/Host. Diagnostic fields contain only schema tokens; no unknown key, offending value, path, exception text or body is reflected.

After successful shape/version admission: adapter input representation/capability → Core witness authenticity → Core technical/static interpretation → asset ID → asset version → selection cardinality → handle record authenticity → handle version → A/C/snapshot → asset/selection → handle scope → Host witness correlation → Host epoch → Host time → handle expiry → context expiry → denial/revocation → Host scope → projection → budget. Request/snapshot tuple disagreement is mixed when either is new. The pure project operation omits adapter/registry/Host/time/receipt/budget operations and checks only its private request brand, pending version rejection, Core witness/static fields, exact selection, snapshot-bound handle fields and semantic projection. Exactly the first semantic failure is retained. Transport failure can prevent delivery but cannot relabel that failure.

For a read_envelope rejection of an admitted request, content/digests/asset/snapshot_id are null, omissions=[], receipt.delivery=not_delivered and disclosed_at=null. Responsibility states preserve only independently observed stages: pre-Core error means core=not_evaluated; a Core failure means core=invalid and read_permission=not_evaluated; Host denial after valid admission means core=valid, interpretation=complete and read_permission=denied. Writer/confirmation remain their independent observed states or not_evaluated. `action_authorization` is always not_evaluated for Read; it never becomes granted/allowed or a false assertion of an actual Host denial. Accepted Read status=ready requires core=valid, interpretation=complete, read_permission=allowed, content and asset/digests/snapshot populated, empty error diagnostics, delivery=delivered and disclosed_at set by Host. Writer insufficient or confirmation claimed_unverified does not alone invalidate an otherwise legal read.

<a id="r05"></a>

## R05 — Host reauthorization, handles and restart

Host provider is injected by the trusted embedding runtime; it is not chosen by asset content, a serialized request or Reader layout. It authenticates its own context/witness, owns current identity and task facts, and observes current UTC time and revocation at **every externally visible disclosure**. It is called before admitted asset content is returned, including cached/whole/catalog/selected/expansion results. Admission rejection/control handling is separate and does not request Host authorization. Only that provider can produce allow/deny; a request-level `authorized:true` is an unknown field and rejected.

A provider context correlates host_id/host_epoch/request_id/snapshot_id/A/C exactly. Malformed request-handle fields/intervals fail request admission; a malformed provider context is READ_HOST_CONTEXT_UNTRUSTED before its fields are trusted. Shape-valid but currently expired intervals retain their expiry diagnostics. Its scope is an ordered duplicate-free list of Core IR identities; validity requires issued_at < expires_at, expires_at-issued_at <= 3600000 ms, and issued_at <= current Host time < expires_at. Scope is checked against the actual mandatory set, not just requested judgment ID. No caller clock override exists. Pure projection preserves source confirmation as claimed_unverified or not_evaluated and never upgrades it. The Host-facing envelope can report independently evaluated confirmation. External confirmation may be marked verified only after the provider identifies a verifier and trusted evidence bound to the same asset/judgment revision; otherwise preserve claimed_unverified or not_evaluated.

Core supplies expansion_targets and their mandatory support scope in the admitted snapshot; Read does not resolve a second graph. Host-facing adapters prepare handles from that whitelist while forming an envelope, and commit their issuance records only when the final successful envelope is delivered; pure projection cannot mint an authoritative issued handle. Therefore pure ReadProjection.content.expansion_handles is always []; issuance is the adapter's envelope step before budgeting. Each final handle carries all R02 fields, with a nonempty scope and issued_at < expires_at. Its expiry is min(context expiry, issue time + 3600000 ms). A serialized handle is a locator, not a capability: provider lookup of handle_id must recover an exact matching record; unknown ID or field change is untrusted. A legitimately recorded handle for an older version/snapshot reaches the corresponding version/stale diagnostic. New Core admission issues a new snapshot_id; identical bytes do not revive handles from a discarded snapshot.

Host restart MUST rotate host_epoch and discard or invalidate in-process contexts/handle grants. An old-epoch record is never revived just because its serialized fields look valid. For a recognized old-epoch handle, report READ_HOST_EPOCH_MISMATCH; absent record yields READ_HANDLE_UNTRUSTED earlier. Public 0.1 Read makes no durable cross-process or cross-Host global revocation promise. Such storage/PKI/policy infrastructures remain outside this design. A host/asset denial remains effective within its Host epoch across fresh contexts and asset versions until a separate explicit Host decision lifts it; reading, recompiling or reattaching cannot implicitly lift denial.

After projection and before disclosure the adapter obtains one fresh provider check; if time/permission changes, discard the prepared body and return the first Host failure. The provider check supplies disclosed_at and context used for the receipt. Context creation alone is not sufficient. No Read call schedules an evaluator, calls a tool or writes action intent; Read success never produces Runtime execution or action authorization.

<a id="r06"></a>

## R06 — Complete-envelope budget

For an admission failure, only the trusted provider's admission_response_limit_bytes is used. Encode the complete ReadAdmissionRejection as UTF-8 RFC8785 JCS. Its control_budget.limit_bytes is that authenticated UInt, not candidate.budget_bytes. actual_bytes is exactly 16 ASCII decimal digits: fill zeros, encode/count, then replace with same-width digits. Equality to the trusted limit fits. The enclosing ReadCallResult discriminator and transport framing are control metadata outside this counted body; adapters must account for their own transport framing separately. No asset/tuple/digest/content/states/receipt fields are allowed in an admission rejection.

If this complete rejection exceeds the trusted limit, return channel=no_body_control with code=READ_ADMISSION_RESPONSE_TOO_SMALL, semantic_cause=READ_INPUT_INVALID, safe correlation and body_bytes=0. Do not use READ_RESPONSE_BUDGET_TOO_SMALL for an illegal request budget. A missing/invalid control provider is transport_failure, even if the candidate is malformed; preserve the independently known first semantic cause. No illegal budget is compared, normalized or included in the public result.

Only an AdmittedReadRequest reaches Envelope budgeting. Its UInt budget, including zero, is preserved exactly as ReadEnvelope.budget.limit_bytes. The complete Envelope is UTF-8 RFC8785 JCS, including content, diagnostics, omissions, provenance, handles, assessment, receipt and budget. Both required_bytes and actual_bytes are 16 ASCII decimal digits. Fill zeros, count the entire final body, then replace without altering length. A successful Envelope has required=actual=complete success size. Receipt/handles/disclosed_at must be finalized first; a changed final Host check requires recounting. Host-facing handles are committed only on confirmed delivery. Proposed delivery=delivered is not proof before the enclosing transport operation confirms it.

When the complete success body fits (including exact equality), read_envelope carries it. If it exceeds budget by even one byte, prepare the complete READ_BUDGET_INSUFFICIENT rejection: no content/digests/asset/snapshot/omissions or delivery, required_bytes=complete proposed success size, actual_bytes=complete rejection size. If that rejection fits, return it in read_envelope. For an earlier semantic failure, build its rejection directly; required_bytes=actual_bytes=its complete rejection size and retain its first code. Never replace a prior error with READ_BUDGET_INSUFFICIENT merely because that rejection is too large.

If the selected rejection body does not fit the lawful request budget, return no_body_control with code=READ_RESPONSE_BUDGET_TOO_SMALL, body_bytes=0, safe correlation, and semantic_cause equal to that first semantic code (READ_BUDGET_INSUFFICIENT for an oversized proposed success). A null cause is reserved for a transport control situation in which no semantic failure was established; normal over-budget success necessarily establishes READ_BUDGET_INSUFFICIENT first. Zero is thus an admitted lawful request that may produce this control result after the actual pipeline, not an admission error and not evidence that Core/Host were skipped.

Any actual provider, encoding or transport delivery failure produces transport_failure with code=READ_TRANSPORT_FAILURE, known semantic_cause or null, safe correlation and delivery=not_confirmed. It carries no Envelope/rejection body or raw exception, does not assert zero physical bytes (a transport may fail after partial transmission), and does not assert that the intended semantic result was delivered. Pure root admission reports only the same typed control outcome without transport delivery claims.

ReadNoBodyControl and ReadTransportFailure are fixed API/transport control results, not body bytes. They are never recursively wrapped in another budgeted error; no fifth throw/undefined channel and no automatic retry/fallback is permitted. Trusted admission-control limit, lawful request body budget and outer transport/session budget are distinct axes and grant no Core/Host authority. No mandatory truncation, budget-driven omission, fabricated closure or partial semantic success is allowed.

<a id="r07"></a>

## R07 — Package-set selection and runtime handoff

A package-set is an exact member_id-unique list of caller-authorized members `{member_id, asset_id, asset_version, A}` and matching admitted snapshots. Its Host authorization is external. Validate every named member (including members not selected) before selecting; missing/extra members reject. Selection is exact asset_id + asset_version + judgment_id; result is zero/one/multiple, never first-array match. Preserve per-asset snapshots, scopes, A/C and Read outputs. Cross-asset IR references, rule/priority/judgment merges and composeKDNA semantics are **UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE**, not deferred optional behavior.

Package-set errors have fixed precedence: SET_MEMBER_UNAUTHORIZED → SET_MEMBER_MISSING → SET_MEMBER_EXTRA → SET_MEMBER_DUPLICATE → READ_UNSUPPORTED_VERSION/READ_MIXED_VERSION_TUPLE → READ_CORE_INVALID → UNSUPPORTED_CROSS_ASSET_SEMANTIC_MERGE → exact selection errors. `SET_MEMBER_UNAUTHORIZED` also covers request members without an external grant; error reveals no member body. Duplicate means a repeated member_id. Distinct independently authorized members may declare the same asset ID/version and judgment ID; that ambiguity rejects selection rather than silently replacing a member. Set-level shape failures use READ_INPUT_INVALID. Exact selection no match uses READ_SELECTION_NOT_FOUND; >1 uses READ_SELECTION_AMBIGUOUS. A standalone read of one admitted asset retains R04 asset-specific diagnostics.

A sealed runtime handoff is a distinct Host operation, not a Read mode or proof of execution. Chosen record is `{contract:"kdna.package-set-handoff/0.1.0", tuple, set_id, members:[{member_id,asset_id,asset_version,A,C,snapshot_id}], selection, closure_digest, read_receipt_id, plan_digest, host_id, host_epoch}`; all fields required, closed, ordered members by unsigned UTF-8 member_id. set_id/member IDs/read_receipt_id/host IDs are Identifier; A/C/closure_digest/plan_digest are Digest; selection is Selection and tuple is VersionTuple. closure_digest is detached SHA-256 over RFC8785 JCS of the exact ordered mandatory IRReadNode array returned for the selected read; plan_digest is detached SHA-256 over RFC8785 JCS of the complete admitted Consumption Plan, excluding nothing. snapshot.ir_digest is likewise detached SHA-256 over JCS of its entire admitted Canonical IR, excluding nothing. Strict JSON/Unicode admission precedes these encodings; no digest field is inserted into its own hashed object. read_receipt_id must name the exact delivered ReadReceipt.receipt_id for this selection and snapshots, with no rejected receipt accepted. Core verifies member/selection/digest correlations; Host supplies an independently admitted Consumption Plan and current run authorization. The handoff itself grants no action permission, performs no execution and creates no merged IR. Static-read handles or a read allow decision cannot substitute for execution admission.

<a id="r08"></a>

## R08 — Verification obligations and non-claims

`public-contract-decision-vectors.json` preserves the original 54 case IDs, synchronizes their observed channels and adds admission/correlation/control cases; all are **NOT_RUN**. E-W1-01 requires independent per-case rule derivation, including the old Host/tuple/handle/digest/package-set work that was not completed; earlier structure checks are not semantic acceptance. JSON parse/reference checks and independently computed SHA examples do not mean conformance PASS. Future acceptance must exercise the sole Core/IR boundary, pure Node-free projection, Node input snapshotting, browser capability/import graph, modes, diagnostics, mandatory closure, omissions, handles and reauthorization/budget against the same frozen decision inputs and then generated normative aggregate. Both Open-owned headless Agent and generic Reader reference consumers must preserve exact content/diagnostic/state distinctions. A Reader product, DOM layout, real identity, production Host, persistence infrastructure, SDK parity or package publication is not established here.

## Typed asset declaration retention

The existing `PublicAssetDeclaration` carried by `asset_declaration` additionally retains optional `content_risk: RiskState` and `extensions: Extension[]` from the same Core-validated Payload, only when its own key is present. No default is inserted: absent risk differs from an explicit risk, and absent extensions differ from `[]`. Noncritical extensions retain their typed opaque SemanticValue and original array order; retention never executes or interprets them. Unsupported critical semantics still fail closed with incomplete interpretation. Risk remains an authored declaration, never quality verification or permission.

The necessary asset declaration is preserved in whole_asset, exact_selection and related expand disclosure under the existing Host and mandatory-support rules. Catalog can omit it as `not_in_mode`. Retained changes must alter Canonical IR and its digest and alter disclosed declaration content; the complete final Envelope is recounted without changing error precedence or Host authority.


## Read Transport Admission

`@aikdna/kdna-read@0.3.0-rc.component-semantics.2/transport` supplies `admitReadTransportResponse(response, context)`. The transport protocol remains `kdna.read-transport-admission/0.1.0`; its nested Read tuple and envelope are `kdna.read/0.2.0` and it binds the exact new Core peer. The authoritative closed fields, union, limits and diagnostics are `transport_admission` in `specs/public-semantic-source.json`; Schema and declarations are generated from it.

The context belongs to the caller and fixes the endpoint, session, association lifetime, exact outbound request JSON, correlation, expected tuple/asset/digests/snapshot binding and byte/time limits. It is not supplied by the response and establishes no network identity or authorization. A bounded process-local association registry prevents reuse of a live association ID, including reuse under a different claimed session. A new association cannot prove network freshness.

Admission consumes a real WHATWG Response through a bounded stream. It verifies response URL, HTTP channel/status/headers, declared and actual size, UTF-8, duplicate keys, exact JCS encoding, generated Schema and observable request/selection/handle/asset/digest/receipt bindings. Header-only 413/502 channels retain their observed headers and null body; missing remote correlation is never reconstructed as if received.

An accepted result is explicitly remote response data. Its proof limits deny independent Core semantic revalidation, remote identity, permission, current revocation, confirmed delivery and network replay protection. Its literal capability fields are false; it cannot be supplied as a Core snapshot, admitted local request, Host witness or action capability. A remote receipt and digest remain claims even when structurally valid and consistent with caller bindings.

Existing local Node/browser Read paths and their private brands remain unchanged. This revision does not prove PKI, Registry, third-party Host interoperability or WKWebView/Tauri integration. Landing and publication require the separately recorded independent acceptance; this isolated revision is not a live product release.

The proof-scope field `fetch_visible_http` covers only the status, exposed headers, channel and decoded bytes provided by native Fetch. `raw_http_framing` is always `NOT_OBSERVABLE_THROUGH_FETCH`. In WebKit, a raw chunked response may be exposed as `Transfer-Encoding: Identity`; this normalized value is supported. A present Content-Length must equal the consumed decoded byte count, and simultaneously visible Content-Length and Transfer-Encoding reject, including Identity. Unsupported content encodings reject. A browser or Fetch implementation may reject invalid wire framing before this API receives a Response.

Header-only channels set `strict_json=false`; `schema` and `observable_bindings` apply only to actually received header fields. The result association is caller-held metadata and is never represented as remote correlation. Identical process association IDs reject across claimed sessions, including concurrent calls; stale/overlong lifetimes reject. Replacing a context with a fresh association cannot establish remote freshness, identity or authorization.

Association validity is checked before consumption and again before acceptance. Its remaining lifetime also bounds the body-read timer. A successful read never extends the caller association lifetime.


## Host retained Read session profile 0.1.0

`kdna.host-retained-read-session/0.1.0` is an optional, default-disabled Host profile. Its sole normative source is `engineering.host_retained_session_profile` in `specs/public-semantic-source.json`. This section explains that source; it introduces no second authority, new Read wire structure, Core/Read primitive, HTTP session route/header/form field or Web Client API. Freezing this profile establishes neither implementation acceptance nor public package release.

A session belongs to one long-lived Host, one fixed trusted embedding binding, one actual same-Core immutable snapshot, and the original trusted Host provider with the Read-owned private issuance registry. The first successful call admits bytes through existing `readNode`; later calls reuse the real snapshot through existing public `readBrowser(snapshot, ...)`. Inspected or serialized data cannot recreate its authority. Client `session_id` and transport association metadata do not establish Host authority. Current authorization, scope, mandatory support, denial latch and all formal Read gates still apply on every call.

A validated `request_id` is reserved atomically only after formal Read admission and the applicable Host gates. Repeated provider observations of the same call reserve once; concurrent or later reuse of that ID fails closed without inventing an asset denial. An existing valid issued handle may be read again using a fresh admitted request ID. The original provider and its Read-owned registry must remain in place. Restart, epoch change, expiry, trusted revocation and disposal invalidate retention; this is not persistent or global replay protection. A foreign unverified call cannot close another lawful bound session.

Node and Express require both the actual server response `finish` event and formal Read success for the same call before committing eligible ready content or activating pending retention. Close, error, abort, timeout and late callbacks cannot commit or reactivate state. Server finish is not a remote acknowledgement. Next retained sessions are explicitly unsupported because returning a generic Response does not prove that finish boundary.

The machine source fixes absolute TTL at 30 seconds by default and at most 300 seconds; one snapshot and one in-flight read; 10 MiB input and retained container; 16 MiB retained view charge; 16 read attempts and validated request IDs; 256 issued handle records charged at most 1 MiB; 1 MiB response and 4 KiB control response per call; and a 5-second default, 30-second maximum call timeout. Lower configured limits remain valid. View charge is the UTF-8 length of plain JSON of the Core inspection view, not a semantic digest or heap measurement. Absolute lifetime starts at first preparing and is never renewed by reads or failures. Cleanup releases available owned references, queued work, timers and listeners and forbids late commits. Unsettled external work remains charged until settlement; the original provider is released after its pending calls settle. Cleanup cannot force collection of references held by noncooperative external callbacks.

The generated manifest binds the profile through the source digest and this explanation through its accepted-design digest. Existing generated schemas, declarations, diagnostics, tuples and runtime contracts remain unchanged. Independent real HTTP, lifecycle, authorization, resource-bound and adapter acceptance required by the machine source remains outstanding; generation proves reproducibility only.

## Finite component supply in Canonical IR 0.2

A method node value contains `declaration`, `declaration_presence` and `component_interpretations`. The native declaration and original authored content are preserved separately from normalized interpreted bodies. Supported taxonomy keeps every declared edge and permits multiple parents. Candidate collections can coexist and be explicitly empty. Discriminator content retains all prompts, criteria and its target candidate index; it supplies no evaluated outcome. Untagged components are `undeclared` with null bodies, and are never guessed from prose.

All declared method components, role bindings and required source references are mandatory in the selected judgment closure. Catalog and whole_asset keep their existing mode meanings; whole_asset does not silently expand all judgments. No partial component body is returned to fit a budget. A registered component failure follows Core structural checks, yields Core valid/interpretation blocked, and gives no snapshot or disclosed body. Unknown critical semantics remain blocked. See [the generated component definition](component-semantics.md) for exact carriers, limits, presence and static adoption rules.
