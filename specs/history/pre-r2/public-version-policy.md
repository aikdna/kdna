# Public version policy — grammar.3

Grammar.3 closes lifecycle identity, native 0.2 execution formats, admission precedence, body-free catalog fallback, information retention and package declarations. This is an explicit new-coordinate change. The existing component and static-policy definitions retain their exact meaning. Protocol implementation and independent acceptance are separate from downstream toolchain, asset, Reader and publication acceptance.

Status: **UNPUBLISHED_CANDIDATE**. The unique semantic source and its generated closure define the proposed public component revision. Implementation, independent acceptance, exact consumer rebinding and publication remain separate. Historical source and acceptance retain their original scope.

## Chosen version axes

The new runtime accepts exactly the complete tuple below. Wire/profile/API coordinates and package versions are separate axes; sharing a number does not equate their meanings.

| Axis / tuple key | Chosen design coordinate |
|---|---|
| Container / container | `0.5.0` |
| Payload profile / payload_profile | `kdna.payload.judgment` |
| Payload version / payload_version | `0.4.0` |
| Core public API / core | `kdna.core/0.7.0` |
| Canonical IR / ir | `kdna.canonical-ir/0.5.0` |
| Runtime Capsule / runtime | `kdna.runtime-capsule/0.2.0` |
| Consumption Plan / plan | `kdna.consumption-plan/0.2.0` |
| Agent Host / host | `kdna.agent-host/0.2.0` |
| Judgment Trace / trace | `kdna.judgment-trace/0.2.0` |
| Read API / read | `kdna.read/0.5.0` |

The actual local package candidates are `@aikdna/kdna-core@0.30.0-rc.protection.1` and `@aikdna/kdna-read@0.7.0-rc.protection.1`; Read declares that exact Core peer. Their package manifests use these labels. Exports, type closure, archive membership and clean installed consumption must be checked against the actual bytes. Registry availability and publication are not claimed; no published artifact is overwritten.

## Target lines and the restricted additive window

This document describes **`grammar.3`**. Historical unpublished `authoring.4`, `grammar.1` and `grammar.2` tuples, proposed package labels and accepted design digests remain under their `target_lines` records. Grammar.2's actual on-disk authoring.4 labels are separately recorded. The new line does not rewrite any historical identity, issue a published deprecation notice, or start a clock for Active 0.1.

**Restricted additive window.** A same-coordinate semantic change is permitted only when all three conditions hold together:

1. its structural category is an optional member, a new reachable type, a new non-schema rule, additional prose, or additional engineering registry data; and
2. every previously valid asset that omits the addition retains its meaning and validity; absence remains `unprovided`, without a default or new obligation; and
3. no existing member's interpretation, constraints, type or closed value set changes.

Condition 1 is only a candidate classification. It does not establish conditions 2 or 3. In particular, an optional field or new rule can still change every existing asset's meaning. Adding a rule that rejects all old assets is outside the window even though no old row changes. Neither prose claiming compatibility nor a caller-supplied `review: true`/`PASS` is proof.

Structural changes outside the allowed categories **require a new coordinate**. Adding, removing or changing an existing `required` list, changing an existing `enum` set, type, bound or `additionalProperties`, removing or renaming an existing member or type, modifying another existing semantic leaf, and any change to `versionTuple` remain outside the window. Their result cannot be waived with review metadata. A coordinate change identifies a new line; it does not prove that line is correct or ready for consumers.

The mechanical classifier is [`scripts/public-contract/window-check.mjs`](../scripts/public-contract/window-check.mjs). It preserves `--old <source> --new <source>` and `--cases <cases>` and reports each leaf's structural category, reason, required review and proof scope. It uses the following verdicts:

| Verdict | Meaning and required action |
|---|---|
| `IN_WINDOW` | The supported-format source trees, nonempty tuple and types compare identically. This proves that this comparison contains no source change; it does not accept the source or runtime. |
| `NEEDS_SEMANTIC_REVIEW` | An additive shape or an unclassified engineering/prose addition is present. Independent, bounded evidence must establish conditions 2 and 3 before anyone may conclude the change fits the window. |
| `EVIDENCE_UPDATE_REVIEW_REQUIRED` | Existing accepted-design byte/hash pins at the same path changed, accepted-design inputs were added, or observational engineering claims were added. Inspect the actual referenced content, its authority and observed results. This alone establishes neither a mandatory new wire coordinate nor semantic compatibility. |
| `REQUIRES_NEW_COORDINATE` | At least one existing semantic leaf, constraint, removal or coordinate is outside the structural window. Other rows needing review remain listed separately. |
| `INDETERMINATE` | Basic input identity/preconditions failed. No compatibility conclusion is available. |

A pair invocation exits zero only for `IN_WINDOW`; all other pair verdicts exit nonzero. Case mode exits zero when expected verdicts match, including expected rejections and review requirements. `CASES_MATCH` is a classifier test result, never source compatibility approval. Precondition checks do not replace full semantic-source validation or generation checks. Object-key ordering and JSON serialization whitespace do not affect this structural comparison; arrays remain ordered.

There is deliberately no automated semantic-review waiver or caller-configurable inert-path list. This costs an independent review for otherwise legitimate optional additions, because structural shape and natural-language claims cannot prove unchanged meaning. Added annotations, including `description`, do not automatically count as harmless comments. Unsupported source keywords still require source validation. No change under `engineering` is assumed inert merely from its location: it also contains runtime resource limits, generated bindings and typed semantics. The explicitly observational additions `rule_coverage`, `runtime_enforcement_claims` and `runtime_not_implemented` are classified as evidence claims requiring review; their presence never proves that tests actually ran. Changes or deletions of their existing leaves retain the conservative new-coordinate classification.

An independent compatibility receipt, when issued outside this command, must identify exact old and new sources and referenced document bytes, list the affected rules and implementations, distinguish structural facts from reviewed semantics, show absence/presence and hostile regression observations within a stated scope, and record unresolved cases. A hash alone proves identity; passing finite tests alone does not prove all natural-language semantics. If compatibility cannot be justified within that scope, open a new coordinate. Publication and consumer rebinding still require their own receipts even after a valid in-window decision.

Worked pairs in [`window-cases.json`](../scripts/public-contract/window-cases.json) include optional fields and reachable types that require semantic review; a newly appended rule rejecting all old assets; forged compatibility claims; pin-only evidence updates; observational engineering claims; unchanged sources; annotations; and required/enum/type/coordinate/deletion changes. Earlier examples describing `Judgment.lifecycle`, `Material.term` or `engineering.core_terms` as automatically in-window were structural examples only and are superseded by this distinction. In particular, supplying previously undefined lifecycle semantics needs explicit review or a new line; optional presence cannot retroactively establish them.

The `grammar.1` line was itself a new-coordinate change, not an in-window addition: it added the required `Judgment.form` and `Payload.asset_capability` members, replaced the required-set of `Judgment`, closed `TermRef` vocabulary and replaced singular `language` with `languages`. The superseded `grammar.2` line was likewise a new-coordinate change: it moves the container coordinate `0.3.0` to `0.4.0` and Core `kdna.core/0.5.0` to `kdna.core/0.6.0`, and raises the `engineering.resource_limits.entry_bytes` ceiling from 5 MiB to 8 MiB. Later additive changes are candidates for independent window review under the conditions above; their structural category alone does not authorize reusing this line.

All four digest profiles have profile_version `0.2.0`: A `kdna.digest-basis.container-bytes`, C `kdna.digest-basis.content-tree`, E `kdna.digest-basis.runtime-entry-set`, and P `kdna.canonicalization.runtime-capsule-jcs`. Their closed byte-domain rules are in [public-contract-decisions.json](public-contract-decisions.json), not inherited from an implementation's similarly named function. The package-set handoff design record uses `kdna.package-set-handoff/0.1.0` and binds the complete new tuple; it is not another Read mode or a cross-asset semantic-merge API.

## Acceptance and rejection

A successful request and its admitted snapshot must both have the exact ten-field tuple. Missing tuple object, unknown object properties or non-string version scalars are READ_INPUT_INVALID. Before enum validation obscures the reason, compare string-valued coordinates: any new version-valued coordinate together with a missing or different version coordinate yields READ_MIXED_VERSION_TUPLE. The invariant payload_profile name is excluded from detecting a new version family. An exact complete superseded tuple recorded in target_lines yields READ_UNSUPPORTED_VERSION before shared-coordinate family detection: the unchanged 0.2 execution axes must not make a complete grammar.2 tuple mixed. A complete unrelated tuple with no current version-valued coordinate also yields READ_UNSUPPORTED_VERSION. A wrong payload_profile on an otherwise new tuple is a mixed tuple and is never reinterpreted. Request/snapshot mismatch is likewise mixed when either belongs to the new family. No legacy decoder, conversion, dual read or fallback follows a rejection. Historical labels in negative vectors are synthetic unsupported inputs, not a claim that old releases exported those API coordinates.

Grammar.3 changes the complete supported static tuple and the lifecycle replacement shape/closure. Container/Payload move to 0.5/0.4 and Core/IR/Read to 0.7/0.5/0.5; even an old asset without lifecycle is not silently accepted under the new tuple. This deliberate migration boundary prevents one version label from gaining hidden constraints. Native execution remains at its previously declared but incomplete 0.2 coordinates; these unpublished formats are now fully defined in the [execution contract](execution-contract-0.2.md) and generated schemas. A/C/E/P keep their 0.2 byte-domain definitions. Local protocol fixtures may be explicitly re-encoded for tests, but formal asset migration and each consumer's rebinding belong to subsequent phase receipts.

## Existing 0.1 lifecycle remains intact

Existing Active 0.1 features and predecessor-profile support commitments remain in force at their original coordinates. Inclusion in SPEC-INDEX does not promote an RFC draft to Active or to a stable publication: RFC-0018 and RFC-0019 retain their declared Draft / pre-release status. RFC state, feature lifecycle and support in a particular runtime are separate claims; see [Protection adoption boundary](protection-adoption.md). The existing Active → Deprecated → Removed policy and minimum 12-month deprecation window remain unchanged. This design issues no deprecation notice and starts no clock. Any future notice must identify the old coordinate, scope, issuer, date and earliest removal date under separate authority. New implementation acceptance requires one new semantic path with explicit old-input rejection. Maintaining the old normative line and publishing a separate new implementation are distinct responsibilities; neither creates a promise that one runtime reads both.

## Evidence required for consumer rebinding

Each consumer receipt must keep these fields separate; absent observation is explicitly UNVERIFIED, never copied from a neighboring field:

| Evidence field | What it can establish |
|---|---|
| README assertion and captured bytes | What a document states; not the current release |
| Manifest package name/version/dependency range and exact bytes | Declared metadata; not installed resolution |
| Source repository, exact HEAD, dirty state and file SHA map | Local source identity; not registry bytes |
| Accepted contract tuple plus exact normative aggregate | Which semantics and generated closure were accepted |
| Lock/resolution environment, direct and transitive graph | Which dependency resolution was actually observed |
| Resolved artifact locator, byte count and SHA-256 | Identity of the actual artifact consumed |
| Registry/tag observation with time and provenance | Observed publication metadata; not a substitute for artifact bytes |
| Remote artifact bytes, hash, retrieval source and time | What was remotely received at that observation |
| Consumer test/acceptance receipt | Which actual implementation behavior was verified against those inputs |

A frozen local baseline is not registry evidence. No latest or published assertion follows from local artifacts. A source, schema, digest domain, resolution or artifact change invalidates the affected consumer receipt and its dependents; rebinding requires a new exact receipt without silently retargeting an accepted hash.

## Single source and consumer order

`specs/public-semantic-source.json` is the sole machine semantics. `scripts/public-contract/generate.mjs` derives schemas, vocabulary, diagnostics, Core/Read TypeScript surfaces, the component definition document and test seed mirrors. `specs/public-generation-manifest.json` binds exact inputs and outputs. Public prose explains those definitions; consumer mirrors cannot add their own rules.

Core alone interprets finite taxonomy, candidate-set and discriminator-set content. Read projects the resulting typed method value and applies the current Host gate and full final-envelope budget. `/components` exposes only a fixed read-only contract descriptor. Static adoption records do not authenticate an actor or confer execution permission.

Independent acceptance of the direct public Core/Read artifacts precedes Reader and language consumers. Formal creation separately binds actual alternatives, an actual selected actor response, the complete candidate and one-use execution context, then verifies freshly saved bytes through public Core. Language SDKs, Studio, CLI/Agent and affected application consumers must rebind their actual direct dependencies. They do not wait for all consumers to finish and do not redefine public semantics.

Real browser execution, Swift/Python parity, actual revised official assets, Reader design, real Agent tasks and publication each need their own evidence. Synthetic fixture hashes or a successful generator do not establish these results. Existing accepted unaffected behavior is retained at its original exact dependency graph.

## Separate authoring workflow /2 module

WP-AUTHORING-02 opens `kdna.authoring-workflow/2` version `2.0.0` as an independent new authoring module coordinate. It removes the prior descriptor's exact implementation scope and replaces it with explicit contract adoption plus independently verified implementation identity. That is a changed contract shape and meaning, not an in-window prose correction. The mechanical old/new classifier must retain its nonzero `REQUIRES_NEW_COORDINATE` result; the new coordinate is supplied by this module. The grammar.3 ten-field runtime tuple, judgment types, admission and execution semantics, digest domains and CS1/static-policy definitions do not change.

The separate /2 module first used Core `0.29.0-rc.authoring.2` and Read `0.6.1-rc.authoring.2`; that Read changed its exact Core peer. These remain the authoring adoption records; the later protection candidate coordinates are stated below. Historical `target_lines` rows and original grammar.3 Core `0.28.0-rc.grammar.3` / Read `0.6.0-rc.grammar.3` archives remain frozen records. Current package metadata is under engineering.package_versions, separate from those recorded target-line baselines. Old /1 workflow evidence remains with its exact original producer and cannot be relabeled /2. See [authoring workflow](authoring-workflow.md) for the explicit adoption and rejection requirements.

## Protection /1 implementation candidate, compatibility review pending

B0 introduces optional Manifest.entitlement and a new reachable closed type,
plus independent kdna.protection-admission/1 version1.0.0 and
kdna.checksums.document/1 version1.0.0 definitions. Existing tuple, fields,
judgment/CS1/static-policy, A/C/E/P0.2 and old encryption/signature/checksum
identities are unchanged. This is only a restricted additive review candidate;
all classifier verdicts and independent absence/presence review remain required.
Current implementation candidate metadata is Core0.30.0-rc.protection.1 and
Read0.7.0-rc.protection.1 with an exact peer. The B1 Node entrypoints implement the
new protection contract; actual pack, behavior, and absence/presence evidence are
required for the independent bounded review. The historical B0 candidate was
definition-only. This capability change does not turn any classifier verdict
into IN_WINDOW. See [protection admission](protection-admission.md).
