# KDNA Read — R2 candidate

UNPUBLISHED `R2` source package `0.11.1` for `kdna.read/0.6.4`, with exact peer `@aikdna/kdna-core@0.37.0` (`kdna.core/0.8.2`) and Canonical IR `0.6.0`. It consumes the private Core snapshot, preserving full authored focus, form, answer kind, method, core expression, typed Plan/policy and reference closures. It does not parse containers or recreate an IR. Local implementation and tests do not claim publication or content quality.

This 2026-09-23 source identity comes from [`package.json`](package.json).
Runtime CLI 0.40 and MCP 0.8.1 retain their separate Core 0.34 / Read 0.9
archives; see the [matching-delivery guide](../../docs/core-read-current-status.md#choose-and-obtain-one-matching-delivery).
A source README edit does not replace a fixed archive or renew its acceptance.
Use the manifest and member inventory delivered with the exact installed graph.

| Entry | Value exports |
| --- | --- |
| root | `admitReadRequest`, `project` |
| `/node` | `readNode` |
| `/browser` | `readBrowser` |
| `/embedding` | `createTrustedReadControlProvider`, `createTrustedHostReadProvider` |
| `/transport` | `admitReadTransportResponse` |
| `/package-set-node` | `getPackageReadContract`, `createTrustedPackageReadProvider`, `readPackageSetNode`, `sealPackageSetHandoff`, `admitPackageSetHandoff` |
| `/analysis` | `summarizeRead`, `compareReadSelections` |
| `/types` | Type declarations only |
| `/protection-node` | `createTrustedProtectedHostReadProvider`, `readProtectedNode`, `commitProtectedTransport` |

Request admission validates the candidate and trusted control provider before Core or Host work. Pure `project` requires the private admitted request and Core snapshot. It reads no file, clock, Host or DOM, grants no permission and issues no handles. Projections requiring deferred asset-index bodies or handles must use the trusted Host-facing adapters.

The Host-facing adapters produce exactly four channels: `read_envelope`, `admission_rejection`, `no_body_control` or `transport_failure`, with the other fields explicitly null. Errors preserve the independently known semantic cause. Admission rejection uses only the trusted control limit. A valid request's UInt budget, including zero, applies to the complete final JCS Envelope. Both byte counts are fixed-width decimal strings; exact equality fits. Content is never truncated to fit.

The embedding factory wraps an independently trusted Host callback. Its observation binds request, snapshot, A/C, Host identity/epoch, current time, decision, scope and policy. Read checks that observation before disclosure and again when finalizing the result. A provider may also supply `deliver(result)`, returning true only on confirmed delivery; false or an exception produces a sanitized transport failure. Handles are committed only after delivery succeeds. Omitting `deliver` uses the successful in-process return as the delivery boundary.

`whole_asset`, `catalog`, `exact_selection` and `expand` consume Core-provided ordering and mandatory support. Host scope cannot remove a mandatory selected node or return a success-shaped partial catalog/asset index. Any denied required entry rejects the complete mode without hidden identifiers or counts. Asset-level risk and extensions remain typed declarations in the modes that disclose the necessary asset declaration; catalog can omit it.

Each Node call accepts a path or bytes through Core Node admission and therefore creates a new snapshot. New admission invalidates an old snapshot-bound handle. A custom trusted embedding that retains a snapshot can use pure projection under the same current Host gate; pure projection alone is never a disclosure endpoint. The internal reference pipeline tests this lifecycle without adding a production injection or mint API.

Browser Core admits stored and deflated bytes synchronously through the shared implementation. Browser Read also accepts a retained Core snapshot for expansion. Node execution of a browser entry is not proof of a browser engine; native browser acceptance, platform coverage and external identity/confirmation services are recorded separately.

The declarations and schema mirror come from the single public semantic source.
The packages do not ship the conformance test issuer. See
[`conformance/README.md`](../../conformance/README.md) for the public suite
routes and
[`docs/core-read-current-status.md`](../../docs/core-read-current-status.md)
for the dated implementation status and the remaining external proof limits.
Independent acceptance records are internal evidence and are not part of this
package or this repository.

For an exact judgment selection, Read preserves the entire Core method value: native declaration, declared/undeclared field presence, original content and every supported interpretation body. It does not parse extension content or infer mechanisms from prose. An invalid explicit component prevents disclosure before Host evaluation. Profile absence remains explicit; a declared component must still satisfy its R2 role and native method requirements. Full-envelope budgeting includes all repeated raw and interpreted bytes, with no criteria truncation or partial semantics.

Read also supplies the complete Core-owned `IRNode_judgment.static_policy_interpretation` from the explicit `/2` carrier and its new definition digest as mandatory selected content. `priority` means a single first matching candidate in the explicit direction: a true entry requires every earlier condition to be explicitly false, an unknown prior condition blocks later candidates, and fallback requires every condition to be explicitly false. Read communicates these common static semantics; it neither evaluates conditions nor asserts that any candidate was actually selected. It never rewrites the rule from prose or changes an asset to fit this finite strategy. Publication, Studio creation, Reader presentation and other consumer support remain separately verified responsibilities.

## Supplied-content analysis

The optional `/analysis` entry is data-only. `summarizeRead(envelope)` and `compareReadSelections(before, after)` clone and check current Read-envelope schema shape; they do not admit transport, mint a Core witness, disclose additional content or increase authority. See [`src/analysis.d.ts`](src/analysis.d.ts) for inputs, result fields and explicit proof limits.

`summarizeRead` distinguishes a supplied producer definition, a supplied formation rule and an authored static result. Every current-run result remains `not_evaluated`. Its dependency inventory is disclosed-only, not a statement that missing/omitted upstream results exist or that a complete asset inventory was supplied. Declarations and authorship claims keep their declared provenance; they do not verify identity or authorization.

`compareReadSelections` requires ready selected closures for the same asset, protocol tuple and source judgment; versions may differ. Unselected catalogs, absent closures and ambiguous source identities reject. Comparison uses role, ownership and source identity plus complete nested values, normalizing only known wrapper references. A fresh request/snapshot or version-wrapped node ID alone does not become a domain-content change. Exact input asset/tuple, request, snapshot, digests, receipt and budget remain in `input_bindings` for review.

Domain content, shared declarations and metadata changes are reported separately. An ownership or attribution change is not automatically harmless; metadata explicitly requires review and is not certified equivalent. Opaque omitted target identities can leave `supply_scope.changed:null` even when observed supply shape matches. Neither unchanged supplied domain values nor equal supply shape proves behavioral equivalence, whole-asset equality, current-task results, improved quality or authority. Consumers must inspect these limits before inheriting a prior conclusion.


## Explicit Protection Node surface

Read `0.7.0-rc.protection.2` with Core `0.30.0-rc.protection.1` records the historical introduction of this surface. The current source package and exact Core peer are stated above. The explicit `/protection-node` entry follows [protection admission](../../specs/protection-admission.md). Closed generated declarations define credentials, trusted providers, opaque operations and disclosure results. Ordinary root/browser APIs retain capability refusal; they do not gain implicit secret handling or I/O. Its current artifact requires its own package/runtime evidence; this source description makes no account-service, product-adoption or publication claim.

Remote transport admission first validates the current Read schema. For schema-accepted ready and rejected responses, it then compares every observable non-null asset, A/C/E digest and body/receipt snapshot binding. Rejected envelopes retain their null information; a non-null receipt snapshot still binds to a non-null caller expectation. The catalog reading mode remains supported. The historical ReadEnvelope status `catalog_only` is outside the current schema and is rejected before these binding comparisons; retained defensive code does not make that status admissible. Transport validation does not add snapshot, authorization or action capability.

## Explicit key-grant issuer boundary

Core `0.31.1-rc.grant.2` / Read `0.7.2-rc.grant.2` are historical introduction coordinates, not the current package identity. The current bound Core includes the Node-only `@aikdna/kdna-core/key-grant-issuer-node` subpath with `getExternalGrantIssuerContract()` and `issueExternalKeyGrantForAsset(bytesOrAbsolutePath, options, secrets)`. All signed fields and `timeout_ms` are explicit. The issuer authenticates actual encrypted bytes before wrapping a device grant. Its R2 admission observation preserves complete admission or body-free rejection; unsupported critical meaning cannot enter a catalog fallback. It discloses existing grant metadata, never Payload/IR/CEK, and does not authorize account membership, Read scope or actions. Caller pins issuer identity independently. See `specs/external-grant-issuer.md` in the source distribution.

Four in-flight slots remain owned until I/O and handle closure settle. The unchanged synchronous grant primitive cannot be preempted; deadline checks before/after it and before publication prevent a late grant result, not internal computation already in progress. Account service final transaction/deadline/revocation is separate. Ordinary APIs, protection profiles, tuple and byte domains are unchanged; Read retains protected delivery expiry/history and transport observable-binding checks.

`/package-set-node` delivers an ordinary PackageSet read through the installer's own Host. It consumes the selected member as the genuine Core snapshot the `@aikdna/kdna-core/package-set-node` admission already produced, so it never re-parses a container or rebuilds a judgment, and it never creates a second control observation: the pure `inspectCandidate` pre-check is used because `admitReadRequest` consults the trusted control observer even for a malformed candidate. The own Host pins `host_id` and `host_epoch` on every observation, including the first and the post-sink one, because the shared gate compares Host identity only when `handle` is non-null and this line always fixes `handle: null`. Exactly one synchronous `sink` call is made and only a strict `true` confirms delivery; a `false`, a throw or a returned Promise is `delivery_unconfirmed`. A delivered token is opaque, is minted only after the last await and a final synchronous member recheck, and proves only that a past delivery happened. `sealPackageSetHandoff` and `admitPackageSetHandoff` correlate that past delivery with an independently admitted Plan and return `claims_not_authenticated`: they grant no Read scope, no execution permission and no handle. A protected PackageSet is **NOT SUPPORTED** by this surface and is not implied by it; a catalog-only or otherwise snapshotless member follows the existing `READ_CORE_INVALID` path instead.
