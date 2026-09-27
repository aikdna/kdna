# Public execution contracts 0.3 — R2 candidate

This is the native public contract for the Runtime Capsule, Consumption Plan, Agent Host request/receipt and Judgment Trace coordinates in the exact `VersionTuple` generated from `public-semantic-source.json`. It does not convert these objects into the historical 0.1 formats. The generated five `*-0.3.1.schema.json` files, their complete `$defs`, and the semantic rules below jointly define admission. A schema pass alone establishes no source admission, permission, execution, delivery or identity. The protocol remains unpublished; implementation and independent acceptance are separate facts.

This 0.3 candidate binds the R2 payload/Core/IR/Read tuple. Historical 0.2 files retain their original bytes and meanings. The complete tuple and R2 closure semantics are required; these changes do not introduce model execution, remote submission, asynchronous providers, or action authority. Version issuance, independent implementation acceptance and live landing are separate records.

## 1. Boundaries and values

All wire objects are closed: additional fields, including an `authorized`, `executed`, `matched`, script, hook or alternate contract field, reject. Strict JSON admission precedes schema admission: duplicate member names, malformed Unicode, nonfinite numbers, getters, prototypes other than plain JSON objects, cycles, sparse arrays and promises reject. Identifiers use the existing maximum of 256 UTF-8 bytes, not 256 arbitrary Unicode characters. `UInt` is a nonnegative safe integer; zero is a lawful budget. No text normalization or interpretation of punctuation occurs.

Each object carries the full generated `VersionTuple`; each `contract` equals its respective generated runtime, plan, host or trace coordinate. An old or mixed tuple rejects without migration, aliases or fallback. `AssetIdentity`, `Selection`, `AssetDigests`, `IRReadNode`, references and relationships retain the public Core/IR meanings. R2 node target/owner references and the full required closure are preserved, including contracts, mechanism roles, conditions, scoped declarations, applicable boundaries and required relation endpoints. Static Plan/Policy declarations remain authored semantics, never proof of execution. Exact selection includes asset identity/version and judgment ID; source identity also retains judgment version. Source and evidence are never obtained from an input assertion that it is valid or trusted.

All detached object digests are `sha256:` plus lowercase SHA-256 of the complete strict RFC8785 JCS UTF-8 object. No fields are removed. Capsule P uses the existing `kdna.canonicalization.runtime-capsule-jcs` 0.2 profile; Plan, Request and Receipt digests bind their complete respective objects. Closure digest binds the complete ordered selected-context node array, matching actual Read delivery. The construction projection below is deterministic; digest comparison removes no fields and accepts no alternative digest. P is outside Capsule. Output digest hashes the exact UTF-8 output text bytes, without JSON quotes. A/C/E retain their existing distinct input profiles; none substitutes for another.

## 2. Runtime Capsule

`PublicRuntimeCapsule` is exactly:

```
{ contract, tuple, kind: "static_judgment_supply",
  source: { asset: AssetIdentity, digests: AssetDigests, ir_digest: Digest },
  selection: Selection, closure: IRReadNode[], catalog: CatalogItem[],
  references: IRReference[], relationships: IRRelationship[], omissions: Omission[] }
```

The producer starts with a Core-admitted immutable snapshot. The selected mandatory closure must resolve exactly once. `closure` retains every mandatory node in exact `mandatory_closures.node_ids` order. The single selected-context projection changes only asset_declaration organization: it removes `reading_order` and keeps `kernel.foundation_refs` whose exact normalized target is supplied, retaining their original order and representation. Current-asset qualified references compare as local identities; external identities remain qualified. Applicable global and selected-topic foundations must already belong to the necessary closure and remain complete bodies. All other nodes, values and interpretations remain unchanged. The raw full IR and whole_asset remain unchanged; source asset, complete A/C/E evidence and source.ir_digest still bind that original snapshot.

`catalog` retains the original full CatalogItem values and original IR catalog order for supplied judgment nodes and participants of supplied relationship nodes. A metadata-only counterpart is represented by its full question and node_ref without inventing a body node. `references` preserves the original sequence whose two endpoints are supplied. `relationships` preserves the original IR order of relations identified by supplied relationship nodes, including complement or reverse-direction metadata counterparts whose whole bodies are not required.

`omissions` is required, with [] when empty. The shared projection emits asset-field omissions in closure-node order: reading_order first when present, then kernel.foundation_refs only when at least one reference is excluded, each reason not_in_mode. It then emits catalog-only judgment body omissions in original catalog order, reason outside_selection. Each is an existing Omission with expandable=false and handle_id=null. These deterministic records contain no Host-private state or credential. They never remove necessary content or silently claim that a projected foundation list is the author's complete list. Read may apply its existing equivalent display folding; Capsule retains this unfolded sequence. Neither Host permission nor budget changes this projection.

If any source target in the actual necessary closure has an unresolved mandatory external reference, sourceSelection returns EXECUTION_UNRESOLVED_EXTERNAL in the existing body-free rejection format and issues no Plan/Capsule success token. This examines the full fixed-point closure, not only the selected judgment. Optional external declarations and references belonging only to an unsupplied other topic do not cause this failure. Core may still structurally admit the source and preserve its exact unresolved references. The supply API does not fetch, merge, create placeholders, or claim the missing body was read.

The Capsule is static judgment supply. A conclusion remains an authored conclusion. A formation rule, condition, external evaluator declaration, policy candidate, method or unknown future capability does not become an executed result, tool permission or callable script. Attachments are identified by their admitted declarations, not executed or automatically fetched. This contract does not add an evaluator, cross-asset merge or replacement Core authority.

Anyone possessing the actual source bytes may admit them using the public Core API, then call `admitRuntimeCapsule(wire, snapshot, admittedPlan)`. That operation independently reconstructs and compares the entire Capsule, including catalog and omissions, not just a supplied hash. The Capsule must fit the admitted Plan's `capsule_bytes` limit as a complete UTF-8 JCS object. An oversized Capsule rejects without truncation. The reference token is private to the admission instance and cannot be made by serializing an earlier token; transport requires independent re-admission.

## 3. Consumption Plan

`PublicConsumptionPlan` is exactly:

```
{ contract, tuple, plan_id,
  intent: { task: NonEmptyText, use: "reasoning_support" },
  source: { asset, digests, ir_digest }, selection, closure_digest,
  budget: { capsule_bytes, output_bytes, response_bytes, trace_events } }
```

Intent is the consumer's requested use and task text. It is not an instruction embedded in the asset, a permission grant, evidence of execution or an authored result. This supported Host operation supplies one exact mandatory judgment closure for externally governed agent reasoning. Any external side effect, model invocation, tool call, account access, additional asset or persistent run needs that Host's independent authority and implementation. Nothing in this Plan grants it.

Public `admitConsumptionPlan(wire, snapshot)` checks strict value/shape/tuple admission, exact selected source identity and A/C/E/IR digests, and the actual mandatory closure digest. It requires an actual Core snapshot, not a JSON approximation or a caller boolean. It is available to ordinary external consumers without a private fixture issuer. `createConsumptionPlan(snapshot, options)` constructs the same native object and passes that same admission. `inspectAdmittedPlan(token)` returns its immutable wire value, or null for any unadmitted value. The admitted token grants no execution authority.

Budget axes are independent. `capsule_bytes` measures the complete supplied Capsule; `output_bytes` measures the actual observed output UTF-8 bytes; `response_bytes` measures the complete final Host response **body**, including receipt, trace and output; `trace_events` limits the complete ordered event list. They are not character counts, token counts or estimates. The reference successful path requires six trace events; a lower lawful limit rejects before any external observation or body disclosure. No budget-driven shortening of static judgment or trace is allowed. Capsule/response equality is permitted; one byte over rejects.

For Read R07 handoff, `observeAdmittedPlan()` supplies the actual independently admitted token. `verifyHandoffBindings` obtains its wire value only through `inspectAdmittedPlan` and hashes that complete Plan. Plan tuple, selection and closure digest must exactly equal that handoff's tuple, selection and delivered Read closure digest. Its complete source asset identity, A/C/E evidence and IR digest must exactly match the independently admitted snapshot selected by that Read, which must resolve uniquely among the handoff members. A genuine admitted Plan for another asset or another judgment still rejects. A callback returning arbitrary Plan JSON, even with correct-looking hashes, is insufficient. Read receipt delivery, package-member authority and current execution authorization remain separate requirements.

## 4. Agent Host request and external authority

`PublicAgentHostRequest` is exactly:

```
{ contract, tuple, request_id, run_id, host_id, host_epoch,
  operation: "consume_judgment", plan_digest, capsule_digest }
```

`admitAgentHostRequest(wire, admittedPlan, admittedCapsule)` checks both genuine admissions, their shared Plan binding and both complete detached digests. `createAgentHostRequest` constructs and admits this same value. Admission does not authorize the operation. Changing a run ID, Host epoch, Plan or Capsule requires a new request admission and independent authorization.

`createExecutionHost` is the explicit application trust boundary. Its configuration supplies `host_id`, `host_epoch`, `clock`, `authorize`, `observeDelivery` and `observeOutcome`. These functions come from the installing application, never wire input. Missing, invalid, throwing or asynchronous providers fail closed. This synchronous reference does not authenticate an identity service, run a model, make a network call or persist an authorization database. A malicious or misconfigured installing application can lie in its own observations; importing the library does not make that application trustworthy.

The Host consumes an admitted request for its exact host/epoch. It reserves both request ID and run ID before external callbacks, rejecting duplicates, including failed attempts and reentrant calls. The bounded reference table holds at most 65536 attempts per Host instance. Restart/persistent replay prevention is the embedding Host's responsibility; creating a new in-memory Host is not durable replay protection. Time must be a nondecreasing `UInt` observation from the configured clock.

The following calls occur in order:

1. `observeDelivery({request, request_digest})` obtains independent incoming Capsule delivery evidence `{delivery_id, request_digest, producer_digest, delivery_digest}` from the configured delivery authority. Producer P, delivery P, request P and the Host's independently recomputed received Capsule P must all match. A wire field supplied by the request owner is not this trusted observation. No provider means no matched observation and no completed result.
2. `authorize({request, request_digest, phase:"execution"})` obtains `{decision, authorization_id, request_digest, host_id, host_epoch, issued_at, expires_at}`. All fields must match the actual request/configuration; `issued_at <= current_time < expires_at`, and decision must be `allow`. A plain true value rejects. The two providers up to this point receive only the request and digests, never task text or judgment body.
3. Only after that grant, `observeOutcome({request, plan, capsule})` receives the immutable source supply and obtains `{observation_id, status, output}` from the configured outcome source. Completed requires actual strict text; failed requires null. Reference code measures and hashes actual text itself. A provider's asserted length/digest, a promised future value, or an asset's authored conclusion is not substituted for this observation.
4. Before exposing that output, the Host calls `authorize` again with `phase:"output"`, with the same exact bindings and current time checks. Denial, expiry or changed epoch clears output. Final receipt issuance checks expiry again, computes all bytes and refuses any budget overrun.

The outcome source is an explicit external observation boundary, not proof that a model faithfully applied the judgment. The reference does not convert supplied rules into a chosen candidate or runtime result inside the Capsule. It does not infer tool authority from an allow decision for `consume_judgment`.

## 5. Receipt, response and delivery

`PublicAgentHostReceipt` is a closed record containing contract/tuple; receipt/request/run/host/epoch IDs; complete request/Plan/Capsule digests; status; nullable failure; nullable final authorization `{authorization_id, expires_at, verified_at}`; nullable incoming delivery `{delivery_id, producer_digest, delivery_digest, observed_digest}`; observed output `{bytes, digest}`; `issued_at`; and `output_delivery:"not_confirmed"`.

Completed requires a current final authorization, fully matching incoming delivery observations, non-null output digest, no failure, and output within budget. Empty output is distinguishable from absent output: a completed empty string has zero bytes and its actual SHA-256; failure has zero bytes and null digest. Denied/failed records require a failure code, null authorization/delivery and no output. Denied means Host denial/expiry; other failures use failed. Unknown failure codes reject.

The reference returns `{status, body:{receipt,trace,output}, body_bytes, output_delivery:"not_confirmed"}`. Only `body` is the serialized wire body; `body_bytes` is its complete UTF-8 JCS byte count. Receipt and trace are finalized before counting. A rejection before body construction, or a body that cannot fit, returns the fixed API control `{status:"rejected", code, body:null, body_bytes:0}`. An already observed semantic failure or Host denial keeps its first code if its body cannot fit; only an oversized otherwise successful response uses `EXECUTION_BUDGET_EXCEEDED`. This is a no-body control channel, not an error body recursively fitted inside another body. Every refusal returns no task, Capsule closure, output text or raw provider exception. A failure body may contain fixed codes, request correlation, source identity/digests and chronology; it contains no asset body or intent text.

`completed` records the configured outcome observation and successful reference checks. It is not a transport delivery acknowledgement. Both receipt and returned control metadata explicitly say output delivery is **not confirmed**. Returning an output string, or returning from `observeOutcome`, never changes that claim. A surrounding transport must maintain its own independently evidenced delivery state. This reference does not manufacture or upgrade a delivered receipt.

## 6. Judgment Trace and independent validation

`PublicJudgmentTrace` contains contract/tuple; trace/run/host/epoch IDs; request/Plan/Capsule/Receipt digests; exact Plan source and selection; status; and ordered events. Each event is exactly `{sequence, at, kind, source, evidence_id}`. Sequence is consecutive from zero. Times are nondecreasing and no later than receipt issuance; the terminal event time equals issuance. The trace's receipt digest binds the **complete** receipt including failure and delivery limits.

The successful event sequence is exactly `request_admitted`, `delivery_verified`, `execution_authorized`, `outcome_observed`, `output_authorized`, `completed`. Failed/denied traces contain a prefix of the first five events, followed by exactly their terminal status. Event sources are fixed: request/terminal are `reference_host`; delivery is `delivery_provider`; both grants are `authorization_provider`; outcome is `outcome_provider`. Provider events have non-null evidence IDs; reference events have null IDs. On success, delivery and final grant IDs/times must match the receipt. Arbitrary extra steps, selected-policy claims, rewritten timestamps or source substitutions reject.

`validateAgentHostReceipt`, `validateJudgmentTrace` and `validateExecutionResponse` can be invoked by external consumers after independent source/Plan/Capsule/request re-admission. They verify closed formats, exact correlations, chronology, trace budget and complete receipt digest. Response validation additionally hashes/measures actual output text and the complete response body, rejecting false byte counts or changed output. **All wire validation returns `proof:"claims_not_authenticated"`**. Receipt JSON is a Host's claim; a byte-for-byte consistent forgery does not become authenticated execution evidence. Authentication or proof of real behavior requires evidence from a separately trusted channel outside these wire formats.

## 7. Public API and proof limits

The package subpath `@aikdna/kdna-core/execution` exports strict parsing, structure checking, complete-object digesting, the three construction/admission pairs, their three immutable inspectors, receipt/trace/response correlation validation and `createExecutionHost`. Generated TypeScript declarations expose the exact types and private admission brands. Generated schemas are separately consumable for other languages; the prose above supplies the non-schema rules. No private fixture functions, testing booleans or historical 0.1 runtime entry point are needed.

The intended standalone sequence is Core `admitBytes` → `createConsumptionPlan` or `admitConsumptionPlan` → `createRuntimeCapsule` or `admitRuntimeCapsule` → `createAgentHostRequest` or `admitAgentHostRequest` → configured Host `consume` → independent receipt/trace/response validation. A receiver that gets wire values admits the source bytes itself before re-admitting the three values; tokens do not travel over JSON. Core admission and Plan admission remain permission-free validation operations, not a Host disclosure endpoint.

These contracts establish exact static supply, request intent, admission, external observation boundaries, failure behavior and verifiable byte correlations. They do not establish model quality, semantic truth, human identity, production identity/permission services, cryptographic authenticity of arbitrary receipts, native user interaction, completed output delivery, autonomous action authority or support for every future execution capability. These are explicit limits of what the supplied evidence proves, not a reassignment of the five public wire formats to a later phase.
