# Public version policy — R2

Status: UNPUBLISHED_CANDIDATE. This policy specifies the issued coordinates for the isolated R2 implementation. Generated identity, implementation tests, independent acceptance, installed consumers, live landing and publication are separate evidence. No package label implies these later outcomes.

## Exact supported combination

| Tuple key | Coordinate |
|---|---|
| container | `0.5.0` |
| payload_profile | `kdna.payload.judgment` |
| payload_version | `0.5.1` |
| core | `kdna.core/0.8.2` |
| ir | `kdna.canonical-ir/0.6.1` |
| runtime | `kdna.runtime-capsule/0.3.1` |
| plan | `kdna.consumption-plan/0.3.1` |
| host | `kdna.agent-host/0.3.1` |
| trace | `kdna.judgment-trace/0.3.1` |
| read | `kdna.read/0.6.4` |

The local package candidates are `@aikdna/kdna-core@0.37.1-rc.browser.1` and `@aikdna/kdna-read@0.11.2-rc.browser.1`. This browser package candidate is unpublished. Read requires that exact Core. The complete source, actual packed artifact and independently installed consumer must be bound together. A directory package.json is not proof of the package actually loaded.

The published Core `0.37.0` / Read `0.11.1` releases retain their original artifacts and release evidence. The browser candidate above is unpublished and requires its own artifact and installed-consumer acceptance. Its protocol tuple remains the base combination in the table; the added browser adapter does not select the Node native-section tuple.

The container framing remains 0.5.0. The Manifest contract is selected by the existing fields `(format_version, compatibility.profile, compatibility.profile_version)`: `(0.5.0, kdna.payload.judgment, 0.5.1)`. It maps to `urn:kdna:schema:manifest:container:0.5.0:profile:kdna.payload.judgment:0.5.1`, generated as `schema/manifest-container-0.5.0-judgment-0.5.1.schema.json` and mirrored in Core. No schema URI, package version, loader-minimum field, body appearance or caller assertion selects a different schema.

Historical Manifest, payload, IR, Read, execution and transport schemas keep their original bytes/IDs. `public-semantic-source.json.historical_artifacts` inventories them; the active generation graph excludes them. In particular, the former `manifest-0.2.schema.json` path is neither overwritten with new required fields nor turned into a forwarding alias. Same framing version does not imply identical Manifest obligations.

The five runtime/plan/host/trace 0.3 schemas replace the active 0.2 combination because they embed the complete tuple and, for Capsules, IR nodes. Runtime behavior still supplies static authored judgment and requires an independent Host for real action; no new asynchronous or remote-submission API is implied.

Read transport admission uses `kdna.read-transport-admission/0.2.1`, `urn:kdna:schema:read-transport-admission:0.2.1`, and `specs/read-transport-admission-0.2.1.schema.json`. Package-set handoff uses `kdna.package-set-handoff/0.2.1`. These are direct tuple/Read bindings, not extra VersionTuple axes. A/C/E/P canonicalization profiles and unchanged encryption, signing and authorization algorithm identities retain their existing meanings.

## Rejection before interpretation

The new consumer admits only the exact new complete tuple. Exact historical tuples are classified as `READ_UNSUPPORTED_VERSION` before testing whether any shared version axis is current, so the shared container 0.5.0 cannot turn a valid old tuple into a mixed tuple. Truly mixed coordinates use `READ_MIXED_VERSION_TUPLE`; malformed required structures or scalar types use the relevant input/structure diagnostic. Unknown complete unrelated versions are unsupported. No rejection triggers a historical decoder or automatic rewrite. Old packages retain responsibility for their own original coordinates.

Unknown critical semantics block all four new Read modes. The old line's catalog-only behavior remains historical, with its original proof limits. It does not authorize the new runtime to replace questions with IDs or disclose an incomplete catalog.

## Explicit content migration

Migration is a reviewed authored revision, never field invention. Full questions, the three single classifications, mechanism roles and their content, core expressions, scopes, conditions, qualified references, typed ports/instances, results, examples and history must be supplied and checked against the actual intended content. Old label/mode/nature content is explicitly mapped or retained as history; it is not silently discarded or copied into a new semantic role. A missing question is not fixed by appending a question mark; a core answer is not a first paragraph. Incomplete necessary topics prevent a complete-asset claim. A complete formation rule does not require a fabricated present input or execution result.

The component binding uses `kdna.component-semantics/2` version 2.0.0 with component/adoption extension IDs `/2`. Component.method always names an R2 basic method; typed taxonomy/candidate/discriminator profile identity lives in its explicit carrier. Profile contents retain their semantics. Changed native declarations and definitions require new digests; unchanged typed content may retain its content digest. Old `/1` carriers are never implicitly upgraded under the new tuple. Ordinary R2 components need no typed carrier.

The full mapping is in [R2 definitions](r2/README.md), particularly FIELD-DICTIONARY, COMPOSITION, REFERENCE-REGISTRY and PUBLIC-PROJECTION. Natural-language fidelity, actual observed records, real author adoption, formal business assets, Reader experience and release remain separately reviewed. This policy issues no deprecation notice or change to historical support commitments.

R2 dependent Schema bindings use new identities while retaining their base algorithms:

| Module | Current Schema |
|---|---|
| Protection admission /1 | `urn:kdna:schema:protection-admission:1.0.0:binding:r2:8` |
| External grant issuer /1 | `urn:kdna:schema:external-grant-issuer:1.0.0:binding:r2:8` |
| Protected source /1 | `urn:kdna:schema:protected-source:1.0.0:binding:r2:8` |
| PackageSet Node 0.2 | `urn:kdna:schema:package-set-node:0.2.1` |

Each binding is explicit in the unique source and participates in its normal definition
digest. Fixed tuple/package constants and reachable diagnostics are part of its identity.
Old same-purpose Schema files retain their exact bytes; a retained /1 algorithm name
alone does not establish compatibility with the R2 combination.

The three binding7 schemas remain frozen for the published pair. Binding8 names the new package binding; it changes no base encryption, signing or authorization algorithm.

The optional static policy carrier is now `kdna.static-policy/2`, version `2.0.0`.
Its complete new definition includes empty native `condition_refs`, exclusion of a
competing native policy, and the exact derived IR node field
`IRNode_judgment.static_policy_interpretation`. The original `/1` definition and digest
remain historical; old carriers and mixed definitions reject in the new tuple.

Current Read schema: [read-contract-0.6.4.schema.json](read-contract-0.6.4.schema.json), `urn:kdna:schema:read:0.6.4`.

## Current native binding successor (S12-REPAIR-NATIVE-01)

The RC7 repair uses a strict disjoint MethodBinding: an opt-in CS2 component uses
its existing own-judgment target_ref and complete all-role digest; a component
without that opt-in uses local typed target {kind,id}. The native target kinds
are actor, judgment, reason, source, source_use, resource, material, relationship,
dependency, contract, component, boundary, exception and misuse. No asset field
or newly registered plan/policy/revision kind is admitted. component_ref remains
owned by the declaring judgment. Duplicate component/role/target bindings reject;
different roles retain their authored meaning. Component-to-target mandatory
edges participate in the existing fixed-point Read and Plan/Capsule closures.
No legacy target ID is guessed or automatically migrated.

Runtime/plan/host/trace now use 0.3.1 artifacts because their exact embedded tuple
changed. The framing and static execution algorithms are unchanged. All previous
schemas, including the historical RC6 execution schemas and fixed wrappers, keep their original
bytes and IDs. The complete RC6 tuple is unsupported by the current consumer.
The RC7 semantic combination remains the base tuple. Current source-map and
target_lines navigation identify the browser package candidate and its sole public
semantic source. These candidate coordinates do not establish publication.

## Candidate history (not current)

### RC2 candidate correction

Historical S12-D006 kept the initial R2 Core0.8.0 target tuple while issuing Core 0.36.0-rc.r2.2 and Read 0.11.0-rc.r2.2. The three fixed protection-admission, protected-source and issuer wrappers advance to binding:r2:2 and retain binding1 schemas as unaccepted rc1 history. Other unaccepted R2 schema targets are corrected to the accepted R2 definitions, with explicit rc1-to-rc2 content/digest differences. These drafts are neither identical nor claimed mutually compatible. Pre-R2 historical public schema bytes remain unchanged.

### R2 RC3 installation boundary (S12-D011 revision2)

The historical RC3 candidate pair was Core `0.36.0-rc.r2.3` and Read `0.11.0-rc.r2.3` with an exact peer. Its Core semantic coordinate is `kdna.core/0.8.1`; other R2 tuple axes are unchanged. Frozen RC1/RC2 Core `0.8.0` combinations are unaccepted historical candidates, not supported alternatives. A complete old request tuple is `READ_UNSUPPORTED_VERSION`; an actual mixed tuple is `READ_MIXED_VERSION_TUPLE`.

The ordinary pipeline checks independent generated package-version expectations after request/version admission and before Core input admission or Host observation. Public `project` performs the same check before content. A mismatch returns `READ_CORE_CAPABILITY_UNAVAILABLE` without content, new handles or Host observation, using existing refusal and control-budget rules. The genuine Core snapshot full-tuple comparison remains mandatory: changing package metadata alone cannot make an old implementation a current Core. The old Read pipeline also refuses the new Core snapshot through its existing tuple comparison.

No public callable, signature, diagnostic or payload selector is added. `inspectSnapshot(snapshot)` and Core-internal branding keep their existing roles. Protected/PackageSet descriptor and authorization checks remain required. The browser graph uses package metadata and generated data only, not Node-only inspection. Data-only analysis remains a schema-only helper. This boundary does not repair old-old combinations or authenticate malicious replacement of all runtime code. Fixed protection/source/issuer wrappers used binding:r2:3; binding1/2 bytes remain immutable unaccepted history.


### R2 RC4 Browser correction (S12-D012)

The historical RC4 exact pair was Core `0.36.0-rc.r2.4` / Read `0.11.0-rc.r2.4`, with Core `kdna.core/0.8.1` and Read `kdna.read/0.6.1`. Only the Read tuple axis changes from RC3. Both packages compile the entire new tuple; ordinary installation checks and genuine snapshot comparisons remain separate. Metadata-only changes cannot make RC3 and RC4 compatible. The complete old RC3 tuple is unsupported; no old decoder is selected.

Its Read schema was `read-contract-0.6.1.schema.json`, id `urn:kdna:schema:read:0.6.1`. The former 0.6 source and package mirror retain fixed RC3 bytes as unaccepted history. Protection/source/issuer wrappers use binding:r2:4; binding1-3 remain unchanged. Other unaccepted R2 draft schemas regenerate their complete reachable types with an explicit difference ledger.

Read treats an unavailable Node environment as absence of its optional measurement switches, preserving existing defaults and Node switch meanings. It does not inject a process shim, activate the historical catalog-only path, change omission semantics or reduce full-envelope budgeting. Browser bundle checks in a Web API VM are distinct from native browser and OS acceptance. Current package README identities must match actual package metadata, exact peer and compiled tuple.

### R2 RC5 current-navigation candidate (S12-D013)

The frozen RC5 exact pair was Core `0.36.0-rc.r2.5` / Read `0.11.0-rc.r2.5`, Core `kdna.core/0.8.1`, Read `kdna.read/0.6.2`, with Read Schema `read-contract-0.6.2.schema.json`, id `urn:kdna:schema:read:0.6.2`, and binding:r2:5 wrappers. These fixed historical schema and package coordinates are superseded; their original bytes and identifiers remain unchanged. A complete RC5 tuple is unsupported by the current combination.

## Current packed-documentation and installation combination (S12-D016)

Historical observation from S12-D016; superseded by RC7, with original record preserved:

Prior Read0.6, Read0.6.1 and Read0.6.2 source/mirror bytes and binding1–5 wrappers are fixed history.
