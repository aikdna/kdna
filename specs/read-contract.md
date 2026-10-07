# Public Read contract — R2 / kdna.read/0.6.4

Status: unpublished implementation candidate. The only public machine source is `public-semantic-source.json`; generated [read-contract-0.6.4.schema.json](read-contract-0.6.4.schema.json) and the full [R2 projection contract](r2/PUBLIC-PROJECTION.md) govern the new Read combination. The historical contract is retained separately in `history/pre-r2/read-contract.md`. This document does not issue acceptance or release.

## Authored content and stable identity

A catalog entry's only authored question is `focus`, shared with the Judgment. There is no label, title-based matching, ID fallback, paragraph extraction or runtime summary. Three classifications, authored core expression, full result or complete formation rule, all required mechanism roles and their explicit references are supplied without reinterpreting them as a live result. Native basic methods and typed component profile interpretation remain distinct.

Every public IR target has one `{kind,id,asset?}` identity and one stable node mapping. `target`, `owner` and `role` preserve ownership; kind namespaces are independent. Subject, scope, method and rule belong to their asset/judgment body and do not become invented reference kinds. Local typed string references normalize without changing source meaning. Required semantics are resolved to a fixed point with stable full identity; directories never create scope inheritance.

## Four modes

| Mode | Selection | Handle | Complete supply |
|---|---|---|---|
| whole_asset | null | null | Authored asset declarations, full question catalog, required global limits/conditions and organization, complete asset target index with authorized deferred handles. Judgment bodies may remain deferred. |
| catalog | null | null | Authorized basic identity and full question catalog only. Asset index is empty with an explicit not-in-mode omission, not an authored absence. |
| exact_selection | one exact local Selection | null | Selected judgment and fixed-point required closure, applicable common semantics, directional relationship counterparts and required dependencies, with semantically relevant deferred entries; a related question required only as catalog has no automatic full-body descriptor/handle. |
| expand | null for asset anchor; original Selection for judgment anchor | one registered handle | Exact target and required closure under the preserved anchor and current Host authorization. |

The asset anchor discovers all asset targets, including unreferenced definitions, examples adopting only an external old version, and history records. A judgment anchor discovers its required closure and direct explicit optional references, excluding unrelated targets that merely share asset ownership. Expand supplies the requested target and its semantically required closure; its index lists the targets actually supplied, without automatically issuing new body handles for optional neighbors. Authored references remain intact. It does not repeat the complete asset index. They do not require borrowing an arbitrary judgment selection. `asset_index` descriptors contain `target`, `owner`, authored `display_name` and `body_delivery`. Deferred entries always carry a real issued `handle_id`; inline entries correspond to supplied nodes. Index completeness is budgeted, never obtained by silent truncation.

The asset declaration supplies names, summary, purpose, global scope, highest question, language/time/identity, history coverage and attribution at their correct responsibilities.

Its typed history overview contains only coverage and statement; each entry body is a revision target. Its boundary declaration overview contains only the authored state; applicable boundary targets and their required exception/condition/replacement closures are still supplied. Every declaration, closure and provenance copy follows these same body boundaries.

In exact_selection and expand, the contextual asset node omits whole-asset reading_order and retains only foundation_refs whose targets are supplied in this mode, with explicit field omissions when organization or references are withheld. Applicable common foundations remain mandatory full nodes. This derived subset does not rewrite the authored source or claim its complete list. Whole_asset retains full organization and the complete asset target index.

Full example/history bodies are separately discoverable. A shared declaration applies only within its explicit scope and retains adopt/discuss/oppose use. A replacement boundary is tagged with exception activation and is not an always-active second limit. External adopted example references remain fixed to their original version; inspecting that record does not prove replay. Observed examples can omit public sources without becoming illustrative or independently verified.

A related question required only as catalog by R08 retains its full question and relationship with an explicit judgment body omission, reason outside_selection, expandable false and handle_id null. This role is the same under broad or narrow Host grants. Required support/qualify endpoints, conflicts and required dependency producers remain complete bodies; denying any necessary body or catalog permission rejects the request. Explicit expand likewise cannot demote its requested target or necessary references. No index is filtered merely because Host permission is missing.

## Handles and Host scope

A handle binds the exact asset/version, A/C digests, snapshot, Core/IR/Read versions, target Ref, scope, issuance/expiry and Host identity/epoch. Its `anchor` is `{kind:"asset"}` or `{kind:"judgment",selection}`. The Host registers handles only after successful delivery. Caller-created JSON cannot mint authority. Changing the target/anchor/scope, using another Host, stale snapshot or epoch, or expiry fails closed; authorization is checked again during expansion. Protected transport additionally retains its current-operation/commit checks.

Pure `project` is a permission-free structural API and cannot mint Host handles. When a requested projection requires deferred descriptors or expansion authorization it rejects with `READ_HOST_CONTEXT_UNTRUSTED`; use the actual Host-facing Read operation. It never supplies fake or missing handle credentials as complete content.

Host scope covers all content disclosed by the requested mode. If any catalog or asset-index target is denied, that mode rejects in full without returning hidden identities, names, counts or a misleading empty catalog. A necessary closure object denied likewise rejects. Permission to read an asset is not authority to execute its Plan or external side effects.

## Completeness and failure

Missing necessary external content produces `READ_UNRESOLVED_EXTERNAL`; the reader does not fetch it automatically or claim complete adoption. Optional unrequested source bodies remain deferred. Budget excess uses `READ_BUDGET_INSUFFICIENT` and no partial semantic closure. Whole-envelope UTF-8 canonical bytes, including descriptors and handles, are counted before delivery; control budgets remain separate. Prior error causes are not replaced merely because the error envelope also cannot fit.

Unknown critical meanings produce `READ_UNSUPPORTED_CRITICAL` in all four modes, including catalog. Old catalog-only behavior belongs to its historical tuple and protected evidence scope; it is not an R2 fallback. Strict request shape admission, malformed scalar/Unicode rejection, exact tuple checks, genuine Core snapshot brands, delivery correlation, revocation and Host time checks remain mandatory. Old/mixed tuples are rejected according to the version policy before body processing.

Transport admission 0.2 validates the generated current Read shape plus observable HTTP/body/tuple/digest/request/anchor bindings. It is data validation, not a forged Core snapshot or Host authorization. Package-set handoff 0.2 binds the same tuple and exact delivered closure. No caller PASS, manifest-only version declaration or arbitrary JSON body substitutes for these actual bindings.

Execution Plan/Capsule use this same generated selected-context closure while preserving the full original snapshot source.ir_digest. Capsule also preserves the corresponding original-order catalog, relations and deterministic unfolded omissions; its complete object is reconstructed at admission and budgeted without truncation. Field omission order is asset closure order (reading_order, then excluded kernel.foundation_refs), followed by catalog-only judgment bodies in original catalog order. Actual delivered Read closure and Plan closure_digest must agree exactly; display folding of Read omissions does not change closure bytes.


## Evidence limits

Schema and structural validation establish representability and consistent declared relationships. Whether an answer answers the full question, whether a core sentence preserves a decisive qualification, whether a mechanism matches the author's reasoning, whether an observed record exists, and whether every necessary topic fulfills the asset's purpose require content/process review. Read supplies declarations; it does not certify truth, infer real adoption, authorize action or prove task quality.

## Current installation boundary (S12-D011 revision2, D012, D013 and D016)

The current exact pair is Core `0.37.0` and Read `0.11.1`, with an exact Core peer. Both compile the complete current tuple, including Core `kdna.core/0.8.2` and Read `kdna.read/0.6.4`. RC1–RC5 are frozen unaccepted historical candidates. A complete old request tuple is `READ_UNSUPPORTED_VERSION`; an actual mixed tuple is `READ_MIXED_VERSION_TUPLE`.

The ordinary pipeline checks independent generated package-version expectations after request/version admission and before Core input admission or Host observation. Public `project` performs the same check before content. A mismatch returns `READ_CORE_CAPABILITY_UNAVAILABLE` without content, new handles or Host observation, using existing refusal and control-budget rules. The genuine Core snapshot full-tuple comparison remains mandatory: changing package metadata alone cannot make an old implementation a current Core. The old Read pipeline also refuses the new Core snapshot through its existing tuple comparison.

No public callable, signature, diagnostic or payload selector is added. `inspectSnapshot(snapshot)` and Core-internal branding keep their existing roles. Protected/PackageSet descriptor and authorization checks remain required. The browser graph uses package metadata and generated data only, not Node-only inspection. Data-only analysis remains a schema-only helper. This boundary does not repair old-old combinations or authenticate malicious replacement of all runtime code. Fixed protection/source/issuer wrappers use binding:r2:7; binding1–5 bytes remain immutable unaccepted history.
