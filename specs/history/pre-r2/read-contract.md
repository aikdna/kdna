# KDNA Read Contract 0.5.0

## Static policy revision

This `grammar.3` line carries the typed owned `static_policy` IR node inherited unchanged from the superseded `static-policy.3` candidate. Exact selection supplies its complete authored rule and normalized rule, local candidate values, interpreted condition-to-candidate references, explicit priority direction and explicit fallback/no-match. Core alone validates and interprets the critical extension; Read projects the same node under existing Host permission and full-envelope budgets. Neither Core nor Read evaluates a condition, selects a winning candidate or manufactures a Result/IssueResult. See [static-policy.md](static-policy.md) and [public-version-policy.md](public-version-policy.md). CS1's prior definition remains unchanged. Existing consumers are not automatically accepted against the new Core/IR/Read tuple.

Status: **UNPUBLISHED_CANDIDATE** on the **`grammar.3`** target line; runtime and independent acceptance are recorded separately.
This design belongs to Open. It is not a published package, a claim about registry availability, or a change to the active 0.1 protocol. The complete new supported tuple is in `public-contract-decisions.json#/version_policy/supported_tuple`. Field spellings below are chosen for this design; unknown object fields are rejected. The unique `public-semantic-source.json` and its generated closed types are the current machine authority. This document explains that contract without creating a second parser, validator, resolver or IR.

**Historical (superseded, not current, not a supported coordinate).** The `static-policy.3` candidate line — `container` 0.2.0, `payload_version` 0.2.0, `kdna.core/0.4.0`, `kdna.canonical-ir/0.3.0`, `kdna.read/0.3.0`, packages `0.25.0-rc.static-policy.3` and `0.4.0-rc.static-policy.3` — and the `authoring.4` line before it are retained only as history and as the negative control for this replacement. `public-semantic-source.json#/target_lines` is the machine record of that supersession. No coordinate in this document's normative text belongs to either superseded line; the paragraph above is the only place where their literals appear.

<a id="r01"></a>

## R01 — Package and trust boundary

Local candidate: `@aikdna/kdna-read@0.6.0-rc.grammar.3` at `packages/kdna-read`, with exact Core peer `0.28.0-rc.grammar.3`. Publication is not claimed.

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

The four imported types below belong to `kdna.canonical-ir/0.5.0` at the Core boundary. Read does not redefine their value graph. Their closed definitions and public-field allowlist are generated from the single semantic source. No `unknown`/arbitrary JSON escape can stand in for their values.

```ts
// Public generated Core types for this candidate coordinate.
import type { CanonicalIR, IRReadNode, IRReference, IRRelationship } from "@aikdna/kdna-core";
type Identifier = string;
type Digest = string;
type UInt = number;
type Ms = UInt;
type VersionTuple = {
  container: "0.5.0"; payload_profile: "kdna.payload.judgment"; payload_version: "0.4.0";
  core: "kdna.core/0.7.0"; ir: "kdna.canonical-ir/0.5.0";
  runtime: "kdna.runtime-capsule/0.2.0"; plan: "kdna.consumption-plan/0.2.0";
  host: "kdna.agent-host/0.2.0"; trace: "kdna.judgment-trace/0.2.0";
  read: "kdna.read/0.5.0";
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
type OmissionReason = "not_requested" | "not_in_mode" | "outside_selection";
// R11: the asset-level capability declared by the admitted Payload, projected verbatim. Read never derives it.
type AssetCapability = "asserted_answers" | "result_forming_rules" | "mixed";
// R10: a folded count record. target_kind is a registered public target kind, never a specific identity.
type Omission = {
  state: "explicitly_omitted"; target: Identifier; field: string;
  reason: OmissionReason;
  expandable: boolean; handle_id: Identifier | null;
};
type OmissionBatch = {
  state: "explicitly_omitted_batch"; target_kind: Identifier; field: string;
  reason: OmissionReason; count: UInt;
  expandable: boolean; handle_id: Identifier | null;
};
type OmissionRecord = Omission | OmissionBatch;
// R11: parent_ref is projected from the Core-validated Judgment.parent_ref; null means top-level.
type CatalogItem = { judgment_id: Identifier; label: string; node_ref: Identifier; parent_ref: Identifier | null };
type Provenance = {
  declarations: readonly IRReadNode[];
  confirmation: "not_evaluated" | "claimed_unverified" | "verified" | "rejected";
  verifier_id: Identifier | null; evidence_ref: Identifier | null;
};
type ReadContent = {
  declarations: readonly IRReadNode[]; asset_capability: AssetCapability; catalog: readonly CatalogItem[];
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
  diagnostics: readonly ReadDiagnostic[]; omissions: readonly OmissionRecord[];
  assessment: Assessment;
};
type ReadProjection =
  | { status: "projected"; body: ProjectionBody; diagnostics: readonly [] }
  | { status: "catalog_only"; body: ProjectionBody; diagnostics: readonly [ReadDiagnostic] }
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
  contract: "kdna.read/0.5.0"; request_id: Identifier; status: "ready" | "catalog_only" | "rejected";
  tuple: VersionTuple | null; asset: AssetIdentity | null; snapshot_id: Identifier | null;
  digests: AssetDigests | null; content: ReadContent | null;
  states: ResponsibilityStates; diagnostics: readonly ReadDiagnostic[];
  omissions: readonly OmissionRecord[]; assessment: Assessment;
  receipt: ReadReceipt; budget: ReadBudget;
};
```

`opaque` above is specification notation for an unforgeable object identity issued by the named authority; it is not a TypeScript library declaration and must become a private brand in implementation. Serializing any witness loses authority. A transported IR/snapshot must be admitted and re-issued by the sole Core; Read never reconstructs a witness from booleans, digest strings, class names, JSON or a caller signature claim. No public envelope returns `ir`, witnesses, payload bytes, raw source paths, credentials, Prompt, DOM state or authoring evidence bodies.

`status` is a closed three-way discriminant in the machine source (Ready, CatalogOnly, Rejected), not a weakening of any existing arm. `status:"ready"` keeps every R04 condition unchanged, including `interpretation:"complete"`; `status:"catalog_only"` is the single added arm and exists only for the R09 exemption. `OmissionRecord`, `CatalogItem.parent_ref` and `ReadContent.asset_capability` are additions on this `grammar.3` line; the per-entry `Omission` arm is unchanged and remains the only form on earlier lines.

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
- `exact_selection`: exact asset_id + asset_version + judgment_id, all required, no keyword/rank/order fallback. No match rejects. More than one match rejects as ambiguous. Return the selected judgment, complete mandatory closure, its references/relationships and necessary asset declarations. Catalog contains the selected descriptor only. Adjacent judgment bodies outside the mandatory closure remain `outside_selection` omissions; an authored dependency, relationship or lifecycle replacement included in that closure is supplied support and MUST NOT also be reported omitted. Adjacency alone adds no context.
- `expand`: same exact selection; return the target's public IR nodes plus any mandatory semantic support for that target, under the original selection binding, the Core expansion whitelist and current Host scope. It never turns an optional expansion into unscoped full-payload delivery.

Mandatory closure contains selected identity/subject/effective scope, authored boundary/exception/misuse declarations and their states, result contract and actual result or formation rule, critical-unknown diagnostics, provenance/authority facts, required relation/dependency/source-use and upstream reference closure. Core supplies the closed mandatory-node set under Canonical IR. Read cannot replace a missing required node with an empty list or remove a mandatory node for budget or policy. If Host scope excludes a mandatory member, reject the entire disclosure with `READ_SCOPE_DENIED`; do not return a partial result.

All catalog descriptors, provenance declarations, omission targets/counts and expansion handles are limited to current Host-authorized public identities. Unauthorized adjacent identities are not disclosed even as omission records. Mandatory selected support outside scope still rejects the complete selection. IR public labels are authored content, not navigation authority. Catalog descriptors additionally carry `parent_ref` and `content` carries `asset_capability`; both are projected, never inferred (R11). `provided` always has a correctly typed value; other declared states have null. Absent observed optional facts appear as Missing; required absence makes Core/interpretation invalid instead of being converted to an author state. Omission is a projection decision recorded separately from both authored unknown and observed missing. Empty arrays cannot substitute for any of those distinctions. A homogeneous omission set MAY be recorded as one folded count record (R10); folding never merges those distinctions. Assessment never changes content, Core validity, writer sufficiency, confirmation or permission; a `reported` assessment requires non-null kind/assessor/evidence_ref, while `not_evaluated` requires all three null.

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
| READ_INTERPRETATION_INCOMPLETE | core | Core static interpretation degraded or blocked, including unknown critical semantics; for `mode:"catalog"` only, delivered as the R09 `catalog_only` envelope instead of a rejection |
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

For a read_envelope rejection of an admitted request, content/digests/asset/snapshot_id are null, omissions=[], receipt.delivery=not_delivered and disclosed_at=null. Responsibility states preserve only independently observed stages: pre-Core error means core=not_evaluated; a Core failure means core=invalid and read_permission=not_evaluated; Host denial after valid admission means core=valid, interpretation=complete and read_permission=denied. Writer/confirmation remain their independent observed states or not_evaluated. `action_authorization` is always not_evaluated for Read; it never becomes granted/allowed or a false assertion of an actual Host denial. Accepted Read status=ready requires core=valid, interpretation=complete, read_permission=allowed, content and asset/digests/snapshot populated, empty error diagnostics, delivery=delivered and disclosed_at set by Host. Writer insufficient or confirmation claimed_unverified does not alone invalidate an otherwise legal read. This revision does not relax those conditions: R09 adds a separate `catalog_only` arm for one mode and one failure class, and R10 changes only how a homogeneous omission set is recorded.

<a id="r05"></a>

## R05 — Host reauthorization, handles and restart

Host provider is injected by the trusted embedding runtime; it is not chosen by asset content, a serialized request or Reader layout. It authenticates its own context/witness, owns current identity and task facts, and observes current UTC time and revocation at **every externally visible disclosure**. It is called before admitted asset content is returned, including cached/whole/catalog/selected/expansion results. Admission rejection/control handling is separate and does not request Host authorization. Only that provider can produce allow/deny; a request-level `authorized:true` is an unknown field and rejected.

A provider context correlates host_id/host_epoch/request_id/snapshot_id/A/C exactly. Malformed request-handle fields/intervals fail request admission; a malformed provider context is READ_HOST_CONTEXT_UNTRUSTED before its fields are trusted. Shape-valid but currently expired intervals retain their expiry diagnostics. Its scope is an ordered duplicate-free list of Core IR identities; validity requires issued_at < expires_at, expires_at-issued_at <= 3600000 ms, and issued_at <= current Host time < expires_at. Scope is checked against the actual mandatory set, not just requested judgment ID. No caller clock override exists. Pure projection preserves source confirmation as claimed_unverified or not_evaluated and never upgrades it. The Host-facing envelope can report independently evaluated confirmation. External confirmation may be marked verified only after the provider identifies a verifier and trusted evidence bound to the same asset/judgment revision; otherwise preserve claimed_unverified or not_evaluated.

Core supplies expansion_targets and their mandatory support scope in the admitted snapshot; Read does not resolve a second graph. Host-facing adapters prepare handles from that whitelist while forming an envelope, and commit their issuance records only when the final successful envelope is delivered; pure projection cannot mint an authoritative issued handle. Therefore pure ReadProjection.content.expansion_handles is always []; issuance is the adapter's envelope step before budgeting. Each final handle carries all R02 fields, with a nonempty scope and issued_at < expires_at. Its expiry is min(context expiry, issue time + 3600000 ms). A serialized handle is a locator, not a capability: provider lookup of handle_id must recover an exact matching record; unknown ID or field change is untrusted. A legitimately recorded handle for an older version/snapshot reaches the corresponding version/stale diagnostic. New Core admission issues a new snapshot_id; identical bytes do not revive handles from a discarded snapshot.

Host restart MUST rotate host_epoch and discard or invalidate in-process contexts/handle grants. An old-epoch record is never revived just because its serialized fields look valid. For a recognized old-epoch handle, report READ_HOST_EPOCH_MISMATCH; absent record yields READ_HANDLE_UNTRUSTED earlier. This Read contract makes no durable cross-process or cross-Host global revocation promise. Such storage/PKI/policy infrastructures remain outside this design. A host/asset denial remains effective within its Host epoch across fresh contexts and asset versions until a separate explicit Host decision lifts it; reading, recompiling or reattaching cannot implicitly lift denial.

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

`public-contract-decision-vectors.json` defines concrete expected results; `conformance/public-contract/vectors.generated.json` is its generated copy. These vectors and R09–R11 have executable reference implementations and tests. Their source presence is not proof of execution: an acceptance receipt must record the commands, outcomes and exact tested bytes. Tests of projection and configured Host providers do not establish real identity, model effect, production service, native platform, cross-language implementation or publication. The native 0.2 Capsule/Plan/Host/Trace shapes, independent Plan admission and their correlation rules are defined in [execution-contract-0.2.md](execution-contract-0.2.md).

<a id="r09"></a>

## R09 — Catalog descriptors under blocked interpretation

`catalog` is the only mode exempted from a whole-envelope `READ_INTERPRETATION_INCOMPLETE` rejection. This section is implemented on this line — Core in `packages/kdna-core/src/public-contract/admit.js`, Read in `packages/kdna-read/src/carrier.js` and `packages/kdna-read/src/pipeline.js` — with independent acceptance recorded in a separate receipt bound to exact source and generated bytes.

**Precondition.** Core technical admission is `valid`: container, bytes, manifest and Payload structure passed, every coordinate matches the supported tuple, every cross-entry obligation holds, and the sole blocker is a semantic unit Core cannot interpret — an unknown `critical:true` extension — so `interpretation` is `blocked`. The exemption never covers a technical failure (`core:"invalid"`), a component-semantics or static-policy failure, a version mismatch, a request-admission failure, a Host denial or a budget failure.

**The Core carrier.** When that one reason (`READ_INTERPRETATION_INCOMPLETE`) is the sole blocker, Core answers with a carrier instead of a bare rejection. It is assembled only from what Core already validated; no body, IR, snapshot or permission is invented:

| Carrier field | Content |
|---|---|
| `status` | `"catalog_only"` |
| `carrier_id` | `"catalog:"` plus SHA-256 over the canonical (JCS) encoding of every other carrier field. The prefix is deliberately not `snapshot:`: this is a carrier, not an admitted snapshot, and `inspectSnapshot` rejects it |
| `tuple` / `asset` | the admitted tuple, and `payload.asset` |
| `digests` | the same A/C/E evidence an accepted read of these bytes would publish, never recomputed |
| `catalog` | one descriptor per `payload.judgments` entry: `{judgment_id,label,node_ref,parent_ref}` |
| `asset_capability` | `payload.asset_capability`, projected verbatim |
| `states` | `{core:"valid",interpretation:"blocked"}` |
| `diagnostics` | exactly one `READ_INTERPRETATION_INCOMPLETE`, stage `core`, severity `error` |

`node_ref` is the Canonical IR judgment node id — role plus the first 20 bytes of SHA-256 over the canonical `[asset, judgment_id]` pair — so one judgment carries one coordinate on this arm and on a `ready` read of the same asset. It names a coordinate and never a body position: this arm has no IR, no snapshot and no closure in which it could resolve.

**Required outcome.** Under that precondition and `mode:"catalog"`, Read MUST return `status:"catalog_only"` instead of a rejection, with:

| Field | Required value |
|---|---|
| `tuple`, `asset`, `digests` | projected from the carrier |
| `snapshot_id` | the carrier identity (`catalog:…`), never a `snapshot:` value; no Core snapshot exists on this arm |
| `content.catalog` | every descriptor in current Host scope, body-free |
| `content.declarations`, `content.closure`, `content.references`, `content.relationships`, `content.missing`, `content.expansion_handles` | `[]` |
| `content.selected` | `null` |
| `content.asset_capability` | the declared value, projected verbatim (R11) |
| `states.core` / `states.read_permission` | `"valid"` / `"allowed"` |
| `states.interpretation` | `"blocked"` — the only value Core issues on this arm; a readable `"degraded"` stays legal in the enum, `"complete"` never is |
| `diagnostics` | exactly one `READ_INTERPRETATION_INCOMPLETE` at stage `core`, severity `error` |
| `omissions` | one `not_in_mode` record per disclosed judgment, written per entry or as one folded count record (R10); identities the Host did not authorize are not counted at all |
| `receipt` | the Host's observation of this one disclosure: `delivery:"delivered"`, `disclosed_at`, `host_id`, `host_epoch`, `decision_id` |

`states.read_permission:"allowed"` records the Host's decision for this one disclosure. It is not a property of the carrier: the carrier itself grants nothing, authorizes nothing and never carries a snapshot identity.

**Verification before disclosure.** Read never projects a carrier it cannot verify. In order, Read refuses when the carrier's field set or a nested shape is not exactly the generated `CoreAdmissionCatalogOnly`/`CatalogItem` shape (`READ_PROJECTION_INVALID`); the carrier's tuple is not this line's tuple (`READ_MIXED_VERSION_TUPLE`, or `READ_UNSUPPORTED_VERSION` when no coordinate matches); the carrier identity is not the digest of its own remaining fields (`READ_PROJECTION_INVALID`); the carrier's A evidence is not the digest of the bytes Read was actually handed (`READ_SNAPSHOT_UNATTESTED`); a descriptor `node_ref` is not the coordinate re-derived from `asset` and `judgment_id`, a `judgment_id` repeats, or a `parent_ref` names a judgment the carrier does not list (`READ_PROJECTION_INVALID`); or the runtime offers no SHA-256 facility at all (`READ_CORE_CAPABILITY_UNAVAILABLE`). The identity re-derivation binds every descriptor to the identity Read was handed and the A binding ties that identity to the exact input, so a carrier minted for another asset, or edited after issue, is not projectable.

**Proof limit.** Read never parses the Payload, so it cannot independently confirm that a *self-consistent* carrier lists exactly `payload.judgments`. That binding is Core's: the descriptor set is built from `payload.judgments` and its shape is checked against the generated contract before issue. A fully self-consistent carrier injected by a hostile embedding is indistinguishable to Read — which is why the carrier carries no authority of its own, grants no read permission, and is rejected by every snapshot boundary.

**Body-free by construction.** A descriptor carries `judgment_id`, `label`, `node_ref` and `parent_ref` only. `label` is navigation text already disclosed by `whole_asset` and `catalog` in the complete case; `parent_ref` is a hierarchy edge between already-scoped identities; `asset_capability` is a class word, not a judgment body. No judgment `focus`/`subject`/`scope`/`boundaries`/`exceptions`/`misuse`/`result`/`formation_rule`/`method` body, no `material`/`reason`/`source` body, no asset-level declaration body and no part of the uninterpreted critical unit is disclosed. That is why the exemption cannot leak the semantics Core refused to interpret.

**Non-exempt modes.** `whole_asset`, `exact_selection` and `expand` stay fail-closed under the same precondition: a `read_envelope` rejection carrying `READ_INTERPRETATION_INCOMPLETE`, content/digests/asset/snapshot_id null and omissions `[]`, exactly as R04 requires. Core answers an uninterpretable asset with the same carrier whatever the request mode is; Read alone narrows the exemption to `catalog`, so no other mode can reach the carrier's descriptors. Selecting one judgment whose mandatory closure contains the uninterpreted unit is still impossible, because that closure cannot be completed.

**Relation to `ready`.** The `ready` condition `interpretation:"complete"` is neither removed nor weakened. `catalog_only` is a distinct enumerated arm with its own states, its own single diagnostic and its own body limits. A consumer that handles only `ready` and `rejected` sees a new discriminant value; it never sees `ready` carrying an incomplete interpretation.

**Host, budgets and precedence.** R05's Host gate still runs before any descriptor is disclosed, because catalog identities are content. On this arm the Host observes `{request, snapshot: <the Core carrier>}` — the carrier itself, never a snapshot — and the context it returns is checked against the carrier's coordinate, digests and asset exactly as on the `ready` arm; a denial is `READ_HOST_DENIED` and neither identity nor digests are disclosed. Read's projection then keeps only Host-authorized descriptors and drops the omissions of denied identities rather than counting them. R06 budgeting still applies to the complete `catalog_only` envelope, with no truncation, no partial catalog and no budget-driven omission. Precedence is unchanged: any earlier failure class keeps its own code, and the exemption applies only after Core reported a technically valid but semantically blocked asset. Read re-enforces the body limits of the table above immediately before disclosure, so a future change that started filling one of those families fails closed instead of leaking a body through this arm.

**Catalog metadata is unauthenticated.** This arm is tamper-evident, not authenticated. `carrier_id` binds a carrier's own fields to one another and each `node_ref` binds its descriptor to the identity Read was handed, so an edited carrier is detectable and a carrier minted for another asset is refused; nothing here establishes *who* issued a self-consistent carrier, and a self-consistent carrier injected at the admission seam is indistinguishable to Read from one Core issued (see **Proof limit**). The carrier and its metadata — every descriptor `judgment_id`, `label`, `node_ref`, `parent_ref`, the hierarchy those edges form, and the projected `asset_capability` — are therefore **unauthenticated (unauthenticated metadata)**: not evidence, not a statement by Core about the asset's content, and not authority of any kind.

**No decision may rest on catalog metadata alone.** A consumer MUST NOT derive a judgment, a suitability or applicability conclusion, a ranking, an authorization or permission decision, an action, an omission count, or any claim about what an asset asserts from catalog metadata. Metadata describes where a body would be, never what that body says. Any consumer that needs to judge MUST obtain the admitted body: a `ready` envelope whose `exact_selection` closure carries the judgment — or an equivalent admitted read of that identity — and judge only from that body. The legal purpose of this arm is **discovery and navigation**: using the descriptor set to learn which identities an asset exposes and to choose which `judgment_id` to read next is exactly what the exemption exists for, and is permitted.

**Carriers stay serializable.** The carrier is deliberately cacheable and forwardable. An embedding MAY retain, persist or forward it, because the carrier grants nothing by itself, and Read mints it without any process-bound credentials. A receiver of a forwarded carrier inherits no authority: it must re-derive the carrier identity and each descriptor's `node_ref`, and it must still treat every field as unauthenticated metadata under the rule above. Serializable carriers are a retained capability of this line, not an oversight.

**Registered future item — in-process carrier witness (甲-1).** Authentication of this arm is deliberately *not* implemented on this line: no carrier credential field is added, no "authenticated carrier" branch is introduced, and no coordinate, generated closure or required field changes. The registered option is an in-process witness: Core mints a non-serializable witness for each carrier it issues — the same mechanism `CoreAdmissionWitness` and `HostReadWitness` already use — and Read accepts a carrier only when the same Core instance issued it in this process, so a serialized, re-parsed or foreign carrier is `READ_SNAPSHOT_UNATTESTED`. **Trigger:** a real scenario in which a carrier is forwarded across a trust domain and the receiver must distinguish a Core-issued carrier from an injected self-consistent one. **Cost when triggered:** a new coordinate (a carrier credential field or an authenticated-carrier branch), regeneration of the accepted closure, carriers that can no longer be serialized and forwarded, and independent acceptance at this line's grade. A witness would still not stop a mutated same-process embedding, and it would prove issuance — never the truth of the uninterpreted Payload. Until that trigger fires, this section's rule is the whole guarantee: unauthenticated metadata, usable for discovery and navigation only.

**Text-level criteria.** These judge wording, not runtime cases (the case table below judges runtime cases). A consumer or reviewer holds this section satisfied when T3/T4 hold and violated when T1/T2 hold, whatever the runtime does.

| # | Text-level statement | Verdict under this section |
|---|---|---|
| T1 | "The catalog `label` says the issue is X, so the asset judges X" — a conclusion drawn from a carrier field | forbidden: a judgment requires the admitted body of an `exact_selection` closure |
| T2 | "`asset_capability`, the `parent_ref` hierarchy or a descriptor's mere presence proves scope, support or permission" — metadata used as evidence or authority | forbidden: unauthenticated metadata is neither evidence nor permission |
| T3 | "List the issues in this asset, then read `j:7` next" — a descriptor set used to discover identities and pick the next read | permitted: discovery and navigation are this arm's purpose |
| T4 | "Cache the carrier, forward it to another process, or keep it for later navigation" — a carrier retained or forwarded as a navigation aid | permitted and deliberately retained; the receiver re-derives identity and still judges only from admitted bodies |

**Accept / reject examples.**

| # | Case | Expected |
|---|---|---|
| A1 | Technically valid asset with one unknown `critical:true` extension; `mode:"catalog"`; all judgments in Host scope | `status:"catalog_only"`, descriptors only, exactly one `READ_INTERPRETATION_INCOMPLETE` error diagnostic |
| A2 | Same asset; `mode:"catalog"`; Host scope authorizes a proper subset of the judgments | `catalog_only` carrying exactly the authorized descriptors; denied identities absent and not counted in any omission |
| R1 | Same asset; `mode:"whole_asset"`, `"exact_selection"` or `"expand"` | `read_envelope` rejection `READ_INTERPRETATION_INCOMPLETE`; content null |
| R2 | A carrier carrying any judgment body field (`focus`, `subject`, `result`, `formation_rule`, boundary text …), an asset-level declaration body, or any body-bearing content family | reject: `READ_PROJECTION_INVALID`; a truncated or partially interpreted body is never substituted |
| R3 | Same asset; `mode:"catalog"`; Core technical admission `invalid` | ordinary `READ_CORE_INVALID` rejection; the exemption never repairs a technical failure |
| R4 | `catalog_only` assembled while the Host decision denies disclosure | `READ_HOST_DENIED`; identity and digests are not disclosed without a Host allow |
| R5 | A carrier edited after issue (a foreign `judgment_id`, its identity unchanged) | reject: `READ_PROJECTION_INVALID`; Read re-derives the carrier identity rather than trusting the list |
| R6 | A genuine carrier minted for another asset, presented with these bytes | reject: `READ_SNAPSHOT_UNATTESTED`; the A evidence must attest the bytes Read was handed |
| R7 | A `catalog_only` envelope missing any one required field family | refused structurally; the generated `ReadEnvelopeCatalogOnly` requires all fourteen |

The D2 case set (`conformance/public-contract/test/catalog-only-runtime.cjs`) measures these expectations against the real Core and Read runtimes; that is implementation evidence for this line, not independent acceptance.

<a id="r10"></a>

## R10 — Folded homogeneous omission records

R03 requires a projection decision to be recorded for everything not returned. This section permits one bounded compression of that ledger. It changes no omission, no reason and no distinction between an omission, `Missing` and an authored state.

**Two legal forms.** `Omission` (per-entry and unchanged: `target` names one identity) and `OmissionBatch` (folded: `target_kind` names a registered kind and `count` names how many entries it replaces). The folded form MAY be used and never MUST; for the same content the per-entry form stays valid, and a rule may require per-entry records where an individual identity matters.

**Fold key.** One `OmissionBatch` may replace a set of per-entry records only when every replaced record shares `field`, `reason`, `expandable`, `handle_id` and the registered target kind of its `target`. `count` must equal exactly the number of replaced records and must be ≥ 2; a single-item set is written per-entry.

**`target_kind`.** The registered public target kind of the folded identities — in the current reference implementation, `judgment` and `declaration` (the machine source's closed `OmissionTargetKind` value; `asset_declaration` is the IR node role that kind corresponds to, never a legal `target_kind`). The closed kind list belongs to the machine source, not to Read. A specific identity must never appear in `target_kind`, and Read must not invent a kind to make a mixed set foldable.

**Forbidden merges.** None of these may share one batch, and each is a reject:

1. different `reason` — `outside_selection`, `not_in_mode` and `not_requested` are never merged;
2. different `field`;
3. different `expandable`, or different `handle_id` (including "some expandable, some not");
4. an omission folded together with a `Missing` record, with an authored `unknown`/`none`/`not_applicable` state, or with an empty array standing in for one of them;
5. counting identities outside the current Host-authorized public scope, counting an identity this projection did not omit, or asserting a `count` larger than the asset holds at that kind.

**Conservation.** For every `(target_kind, field, reason)` group, the number of per-entry records plus the `count` of every batch record in that group must equal exactly the number of omitted items in that group. This is a cross-entry property of the finished envelope; it belongs to the machine cross-entry rule set, not to a second parser inside Read.

**Order.** The folded array keeps the relative order of surviving per-entry records and inserts each batch record at the position of the first record it replaced.

**Budget effect and proof limit.** Folding turns a homogeneous ledger from O(N) to O(1), which at the required scale is the dominant term in the envelope. Pre-change measurements on the Python reference runtime at `core/0.3.0 · ir/0.2.0 · read/0.2.0` with synthetic assets, `exact_selection`: n=20 → 9,596 B envelope with 3,345 B over 19 omission records; n=100 → 23,676 B with 17,425 B over 99; n=200 → **41,277 B with 35,025 B (84.9%) over 199**. Those numbers measure another line and the old record form. This line has a reference implementation and executable folding tests. The historical measurements above are not measurements of this contract; current size claims require observations bound to the current input, runtime and output bytes.

**Reading basis for those byte counts (independent verification, 2026-09-19).** These envelope sizes are *not* an invariant of the record algebra: the reference runtime's receipt identifier is derived from a process-local read counter and its snapshot identifier from a random UUID, so the same selection read repeatedly inside one process yields envelope sizes that differ by one byte as the counter crosses a decimal digit boundary (41,276 for early reads, 41,277 once the counter reaches two digits), and a fresh process yields a different size again. The stable quantities are the omission ledger — 3,345 / 17,425 / 35,025 B over 19 / 99 / 199 records — and the 84.9% share at n=200. Any future quotation of a single total must state its reading ordinal and process, or quote the omission ledger instead. Those historical numbers make no size claim about grammar.3; its reference implementation requires its own measured inputs and receipt.

**Accept / reject examples.**

| # | Case | Expected |
|---|---|---|
| A1 | 199 unselected judgments, all `field:"judgment"`, `reason:"outside_selection"`, `expandable:false`, `handle_id:null` | one `OmissionBatch` with `target_kind:"judgment"`, `field:"judgment"`, `reason:"outside_selection"`, `count:199`, `expandable:false`, `handle_id:null` |
| A2 | The same envelope keeps the asset-level declaration omission per-entry while folding the 199 judgment bodies | mixed array; per-entry and batch records coexist |
| R1 | One batch merging 150 `outside_selection` records with 49 `not_in_mode` records | reject — different `reason` |
| R2 | One batch merging judgment bodies with the asset-level declaration omission, or one batch whose `target_kind` is a specific `judgment:…` identity | reject — different kind, or identity used as kind |
| R3 | `count:199` while only 120 identities are in Host scope, or a `count` unequal to the number of records it replaces | reject — conservation |
| R4 | A folded record emitted in place of a required `Missing` entry, or an empty `omissions` array presented as "nothing was omitted" | reject — omission is not absence |

<a id="r11"></a>

## R11 — Hierarchy and asset-capability projection

**Hierarchy.** `CatalogItem.parent_ref` carries the Core-validated `Judgment.parent_ref` of that judgment: the `Identifier` of the judgment one level up in the same question set, or `null` for a top-level judgment. It is a single half-edge. `Payload.judgments` stays flat, and Core remains the only authority that validates that the reference resolves, does not self-reference and contains no cycle.

Read must not infer hierarchy from `label` or `focus` text, from `node_ref` shape or numbering, from array order, from authoring indentation, or from any `Relationship`/`Dependency` edge. Hierarchy and dependency stay separate carriers: a `Dependency` or `Relationship` edge is never projected as `parent_ref`, and `parent_ref` never implies a dependency or a mandatory-closure member.

**No inheritance.** Reading a child judgment — descriptor, `exact_selection` or `expand` — never pulls its ancestors, and no ancestor `scope`, `boundary`, `exception` or `misuse` is inherited, merged or recomputed. The child's own declarations are the only effective ones; a child that must be constrained by a parent states that constraint itself. The consequence is that a selection's mandatory closure stays local and does not grow with hierarchy depth.

**Asset capability.** `ReadContent.asset_capability` carries the admitted Payload's declared capability class — `asserted_answers`, `result_forming_rules` or `mixed` — so a consumer learns an asset's answer shape from `catalog` or `catalog_only` without loading judgment bodies. Read projects the declared value verbatim. It must not recompute the class from the judgments it happens to see, must not narrow `mixed` to one class, and must not silently repair a declaration that disagrees with the contained forms: that disagreement is an authoring/Core validity failure for the cross-entry `PUBLIC-ASSET-CAPABILITY` rule, and Read's only obligations are to project it or to fail before disclosure.

**Cost.** `parent_ref` adds one identifier-width field per descriptor. With the 49-character identifiers the reference line produces (`judgment:` plus a 40-hex digest), `,"parent_ref":"…"` is 65 bytes for a nested judgment and `,"parent_ref":null` is 18 bytes for a top-level one; at n=200 that is +13,000 B (all nested) or +3,600 B (all top-level) against a measured 58,213 B catalog, i.e. +6.2% to +22.3%. `asset_capability` is one field per content object.

**Evidence class.** These are projections of Core-validated fields. The reference Core and Read implement these fields. Field names, nullability and enum values remain normative requirements; observed behavior is established by executed cases and a separate exact-byte receipt, not by this prose.

**Accept / reject examples.**

| # | Case | Expected |
|---|---|---|
| A1 | Judgment B declares `parent_ref:"judgment:A"` and A is in the same asset | B's descriptor carries `parent_ref:"judgment:A"`; A's carries `null` unless A declares a parent of its own |
| A2 | Payload declares `asset_capability:"result_forming_rules"`; `mode:"catalog"` | `content.asset_capability` is `"result_forming_rules"` with no judgment bodies present |
| R1 | Descriptor whose `parent_ref` was taken from a `Dependency.producer.judgment_ref` edge | reject — dependency is not hierarchy |
| R2 | Descriptor whose `parent_ref` was guessed from `label` text, file order or `node_ref` numbering | reject — inference from navigation text or layout |
| R3 | Read recomputes `asset_capability` from the judgments this call returns, or reports `asserted_answers` for an asset declared `mixed` | reject — the declaration is projected, not derived or narrowed |
| R4 | `exact_selection` on a child returns ancestor declarations inside the child's mandatory closure with no declared reference | reject — no inheritance |

## Typed asset declaration retention

The existing `PublicAssetDeclaration` carried by `asset_declaration` additionally retains optional `content_risk: RiskState` and `extensions: Extension[]` from the same Core-validated Payload, only when its own key is present. No default is inserted: absent risk differs from an explicit risk, and absent extensions differ from `[]`. Noncritical extensions retain their typed opaque SemanticValue and original array order; retention never executes or interprets them. Unsupported critical semantics still fail closed with incomplete interpretation. Risk remains an authored declaration, never quality verification or permission.

The necessary asset declaration is preserved in whole_asset, exact_selection and related expand disclosure under the existing Host and mandatory-support rules. Catalog can omit it as `not_in_mode`. Retained changes must alter Canonical IR and its digest and alter disclosed declaration content; the complete final Envelope is recounted without changing error precedence or Host authority.


## Read Transport Admission

`@aikdna/kdna-read@0.6.0-rc.grammar.3/transport` supplies `admitReadTransportResponse(response, context)`. The transport protocol remains `kdna.read-transport-admission/0.1.0`; its nested Read tuple and envelope are `kdna.read/0.5.0` and it binds the exact Core peer `0.28.0-rc.grammar.3`. The authoritative closed fields, union, limits and diagnostics are `transport_admission` in `specs/public-semantic-source.json`; Schema and declarations are generated from it. Transport admission is unaffected by R09–R11: it admits remote response bytes under the same tuple and adds no catalog, hierarchy or capability surface.

The context belongs to the caller and fixes the endpoint, session, association lifetime, exact outbound request JSON, correlation, expected tuple/asset/digests/snapshot binding and byte/time limits. It is not supplied by the response and establishes no network identity or authorization. A bounded process-local association registry prevents reuse of a live association ID, including reuse under a different claimed session. A new association cannot prove network freshness.

Admission consumes a real WHATWG Response through a bounded stream. It verifies response URL, HTTP channel/status/headers, declared and actual size, UTF-8, duplicate keys, exact JCS encoding, generated Schema and observable request/selection/handle/asset/digest/receipt bindings. Header-only 413/502 channels retain their observed headers and null body; missing remote correlation is never reconstructed as if received.

An accepted result is explicitly remote response data. Its proof limits deny independent Core semantic revalidation, remote identity, permission, current revocation, confirmed delivery and network replay protection. Its literal capability fields are false; it cannot be supplied as a Core snapshot, admitted local request, Host witness or action capability. A remote receipt and digest remain claims even when structurally valid and consistent with caller bindings.

Existing local Node/browser Read paths and their private brands remain unchanged. This revision does not prove PKI, Registry, third-party Host interoperability or WKWebView/Tauri integration. Landing and publication require the separately recorded independent acceptance; this isolated revision is not a live product release.

**Three byte ceilings, three different subjects.** The transport declares one contract-wide ceiling and the retained Host profile declares two per-call ceilings. They are not the same limit stated three times, and none of them subsumes another in what it constrains:

| Ceiling | Normative source | What it bounds | Where it applies |
|---|---|---|---|
| 8 MiB — `response_bytes` | `transport_admission.limits` | the caller's declared `max_response_bytes`, i.e. the generated context schema's maximum; it is a declaration and decoder ceiling, not a statement about what a Host may serve | context admission, every response this admission consumes |
| 1 MiB — `response_bytes_per_call_maximum` | `engineering.host_retained_session_profile.limits` | the bytes of **one Host Read response**, i.e. one `read_envelope` body | the `read_envelope` channel |
| 4 KiB — `control_response_bytes_per_call_maximum` | `engineering.host_retained_session_profile.limits` | the bytes of **one Host control response**, i.e. one `admission_rejection` body | the `admission_rejection` channel; the header-only `no_body_control` and `transport_failure` channels carry no body |

Both per-call ceilings are enforced at this seam, not left as declaration: the admitted bytes of a JSON channel are bounded by that channel's ceiling, so a `read_envelope` body is admitted up to `min(declared max_response_bytes, 1 MiB)` and an `admission_rejection` body up to `min(declared max_response_bytes, declared admission_response_limit_bytes, 4 KiB)`. A body over that bound is rejected with `READ_TRANSPORT_LIMIT_EXCEEDED` ahead of every JSON, Schema and binding check, on the declared-`Content-Length` path and on the streamed path alike. A declaration above a per-call ceiling stays schema-legal — the transport ceiling is 8 MiB and the context schema still admits it — because the tighter per-call ceiling binds the bytes a Host actually serves, not the budget a caller states. Where the two disagree the per-call ceiling decides: a body above 1 MiB is rejected even under an 8 MiB declaration, so a Host response that a caller's budget would have allowed is still refused when it exceeds what the Host profile permits.

**A whole large asset is not read in one Host call.** Read is a local, partial view, not a database and not a bulk transfer. One Host call returns one bounded envelope, so an asset whose complete disclosure would exceed the per-call ceiling is reached through catalog discovery, `whole_asset`, `exact_selection` and `expand` reads — locally or in parts — never through one oversized response. The per-call ceilings constrain the Host response path only: the local `readNode`/`readBrowser` paths keep their own `budget_bytes` accounting and are not cut to 1 MiB, so a consumer that needs a large disclosure reads it locally or in parts rather than expecting one call to carry it.

The proof-scope field `fetch_visible_http` covers only the status, exposed headers, channel and decoded bytes provided by native Fetch. `raw_http_framing` is always `NOT_OBSERVABLE_THROUGH_FETCH`. In WebKit, a raw chunked response may be exposed as `Transfer-Encoding: Identity`; this normalized value is supported. A present Content-Length must equal the consumed decoded byte count, and simultaneously visible Content-Length and Transfer-Encoding reject, including Identity. Unsupported content encodings reject. A browser or Fetch implementation may reject invalid wire framing before this API receives a Response.

Header-only channels set `strict_json=false`; `schema` and `observable_bindings` apply only to actually received header fields. The result association is caller-held metadata and is never represented as remote correlation. Identical process association IDs reject across claimed sessions, including concurrent calls; stale/overlong lifetimes reject. Replacing a context with a fresh association cannot establish remote freshness, identity or authorization.

Association validity is checked before consumption and again before acceptance. Its remaining lifetime also bounds the body-read timer. A successful read never extends the caller association lifetime.


## Host retained Read session profile 0.1.0

`kdna.host-retained-read-session/0.1.0` is an optional, default-disabled Host profile. Its sole normative source is `engineering.host_retained_session_profile` in `specs/public-semantic-source.json`. This section explains that source; it introduces no second authority, new Read wire structure, Core/Read primitive, HTTP session route/header/form field or Web Client API. Freezing this profile establishes neither implementation acceptance nor public package release.

A session belongs to one long-lived Host, one fixed trusted embedding binding, one actual same-Core immutable snapshot, and the original trusted Host provider with the Read-owned private issuance registry. The first successful call admits bytes through existing `readNode`; later calls reuse the real snapshot through existing public `readBrowser(snapshot, ...)`. Inspected or serialized data cannot recreate its authority. Client `session_id` and transport association metadata do not establish Host authority. Current authorization, scope, mandatory support, denial latch and all formal Read gates still apply on every call.

A validated `request_id` is reserved atomically only after formal Read admission and the applicable Host gates. Repeated provider observations of the same call reserve once; concurrent or later reuse of that ID fails closed without inventing an asset denial. An existing valid issued handle may be read again using a fresh admitted request ID. The original provider and its Read-owned registry must remain in place. Restart, epoch change, expiry, trusted revocation and disposal invalidate retention; this is not persistent or global replay protection. A foreign unverified call cannot close another lawful bound session.

Node and Express require both the actual server response `finish` event and formal Read success for the same call before committing eligible ready content or activating pending retention. Close, error, abort, timeout and late callbacks cannot commit or reactivate state. Server finish is not a remote acknowledgement. Next retained sessions are explicitly unsupported because returning a generic Response does not prove that finish boundary.

The machine source fixes absolute TTL at 30 seconds by default and at most 300 seconds; one snapshot and one in-flight read; 10 MiB input and retained container; 16 MiB retained view charge; 16 read attempts and validated request IDs; 256 issued handle records charged at most 1 MiB; 1 MiB response and 4 KiB control response per call; and a 5-second default, 30-second maximum call timeout. Lower configured limits remain valid. View charge is the UTF-8 length of plain JSON of the Core inspection view, not a semantic digest or heap measurement. Absolute lifetime starts at first preparing and is never renewed by reads or failures. Cleanup releases available owned references, queued work, timers and listeners and forbids late commits. Unsettled external work remains charged until settlement; the original provider is released after its pending calls settle. Cleanup cannot force collection of references held by noncooperative external callbacks.

The two per-call ceilings are enforced, not merely declared: [Read Transport Admission](#read-transport-admission) bounds one Host `read_envelope` body to 1 MiB and one Host `admission_rejection` body to 4 KiB, rejecting an over-ceiling response with `READ_TRANSPORT_LIMIT_EXCEEDED` before any JSON or Schema work. A Host response is therefore bounded per call rather than truncated, and a large asset is reached through several bounded reads.

The generated manifest binds the profile through the source digest and this explanation through its accepted-design digest. Existing generated schemas, declarations, diagnostics, tuples and runtime contracts remain unchanged. Independent real HTTP, lifecycle, authorization, resource-bound and adapter acceptance required by the machine source remains outstanding; generation proves reproducibility only.

## Finite component supply (historical heading: "Canonical IR 0.2")

A method node value contains `declaration`, `declaration_presence` and `component_interpretations`. The native declaration and original authored content are preserved separately from normalized interpreted bodies. Supported taxonomy keeps every declared edge and permits multiple parents. Candidate collections can coexist and be explicitly empty. Discriminator content retains all prompts, criteria and its target candidate index; it supplies no evaluated outcome. Untagged components are `undeclared` with null bodies, and are never guessed from prose.

All declared method components, role bindings and required source references are mandatory in the selected judgment closure. Catalog and whole_asset keep their existing mode meanings; whole_asset does not silently expand all judgments. No partial component body is returned to fit a budget. A registered component failure follows Core structural checks, yields Core valid/interpretation blocked, and gives no snapshot or disclosed body. Unknown critical semantics remain blocked. See [the generated component definition](component-semantics.md) for exact carriers, limits, presence and static adoption rules.

## Grammar.3 question, navigation and lifecycle semantics

`focus` is the authored question or decision problem, whether expressed as a short question, a long contextual problem, or a declarative description of what needs deciding. It is not identified by punctuation. A conclusion's authored expression is `result`; a rule's authored expression is `formation_rule.statement`. Optional `label` is authored navigation metadata and must not equal `focus` byte-for-byte. Absence of `label` uses the exact judgment ID in both normal and catalog-only catalogs. Neither path synthesizes a label from `focus`, result, rule statement or any other body field. Full exact reading preserves all authored fields; catalog-only continues to disclose only its explicit metadata allowlist. An author is responsible for concise metadata and faithful content; Core cannot infer all natural-language paraphrases.

Examples: focus “Should this local observation change the decision?”; label “Reconsideration”; conclusion result “Keep the decision until corroborated.” Alternatively a rule may state “Reconsider when independent evidence contradicts the current basis.” Omitting the label yields the judgment ID, while each question/answer/rule remains in its own carrier.

`lifecycle` is an optional authored declaration. Absence asserts no lifecycle state. `active` means current use is asserted; `deprecated` means the author discourages further use while retaining it; `superseded` declares specified replacements; `withdrawn` declares the author has withdrawn the judgment without asserting a replacement. Every state remains historically readable and none grants authority, revokes another party's access or changes a current runtime result. `active` and `withdrawn` require an empty `superseded_by`; `superseded` requires at least one target; `deprecated` permits zero or more. Each target is `{asset:{asset_id,asset_version,judgment_version},judgment_id}`. Equal complete asset identity requires a local existing judgment, excludes self references and cycles, and includes its transitive mandatory reading closure with `lifecycle_replacement` references. Read keeps the explicit selection unchanged; it does not silently navigate to the replacement.

A different asset ID, asset version or judgment version is an external replacement assertion. It stays fully identifiable but unverified and unresolved in this snapshot; an equal local judgment ID never resolves it accidentally. No fetch, cross-asset merge, global cycle proof or external validity claim follows. A separate future consumer may obtain that exact asset through an authorized acquisition path. The earlier ambiguous `Identifier[]` shape is unsupported in grammar.3.
