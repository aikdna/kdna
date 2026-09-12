# Public version policy — component semantics revision

Status: **UNPUBLISHED_CANDIDATE**. The unique semantic source and its generated closure define the proposed public component revision. Implementation, independent acceptance, exact consumer rebinding and publication remain separate. Historical source and acceptance retain their original scope.

## Chosen version axes

The new runtime accepts exactly the complete tuple below. Wire/profile/API coordinates and package versions are separate axes; sharing a number does not equate their meanings.

| Axis / tuple key | Chosen design coordinate |
|---|---|
| Container / container | `0.2.0` |
| Payload profile / payload_profile | `kdna.payload.judgment` |
| Payload version / payload_version | `0.2.0` |
| Core public API / core | `kdna.core/0.3.0` |
| Canonical IR / ir | `kdna.canonical-ir/0.2.0` |
| Runtime Capsule / runtime | `kdna.runtime-capsule/0.2.0` |
| Consumption Plan / plan | `kdna.consumption-plan/0.2.0` |
| Agent Host / host | `kdna.agent-host/0.2.0` |
| Judgment Trace / trace | `kdna.judgment-trace/0.2.0` |
| Read API / read | `kdna.read/0.2.0` |

The local candidate packages are `@aikdna/kdna-core@0.24.0-rc.component-semantics.2` and `@aikdna/kdna-read@0.3.0-rc.component-semantics.2`. Read declares the exact Core peer. Package exports and installed resolution must be independently checked against their exact artifacts. Registry availability and publication are unverified; no published artifact is overwritten.

All four digest profiles have profile_version `0.2.0`: A `kdna.digest-basis.container-bytes`, C `kdna.digest-basis.content-tree`, E `kdna.digest-basis.runtime-entry-set`, and P `kdna.canonicalization.runtime-capsule-jcs`. Their closed byte-domain rules are in [public-contract-decisions.json](public-contract-decisions.json), not inherited from an implementation's similarly named function. The package-set handoff design record uses `kdna.package-set-handoff/0.1.0` and binds the complete new tuple; it is not another Read mode or a cross-asset semantic-merge API.

## Acceptance and rejection

A successful request and its admitted snapshot must both have the exact ten-field tuple. Missing tuple object, unknown object properties or non-string version scalars are READ_INPUT_INVALID. Before enum validation obscures the reason, compare string-valued coordinates: any new version-valued coordinate together with a missing or different version coordinate yields READ_MIXED_VERSION_TUPLE. The invariant payload_profile name is excluded from detecting a new version family. A complete old or unrelated tuple yields READ_UNSUPPORTED_VERSION. A wrong payload_profile on an otherwise new tuple is a mixed tuple and is never reinterpreted. Request/snapshot mismatch is likewise mixed when either belongs to the new family. No legacy decoder, conversion, dual read or fallback follows a rejection. Historical labels in negative vectors are synthetic unsupported inputs, not a claim that old releases exported those API coordinates.

This revision keeps Container/Payload 0.2 and the existing A/C/E/P domains. It changes Core results and the method IR/Read value, adds fixed typed finite component interpretation, and makes explicit presence and interpretation failure observable. The Core/IR/Read coordinates therefore change together. D_public binds the complete public component definition; it is separate from C and from the frozen reference definition digest. Consumers bind the complete tuple and exact generated closure. They must not infer compatibility from unchanged wire bytes or package minor versions.

## Existing 0.1 lifecycle remains intact

All existing entries above the new design appendix in SPEC-INDEX remain Active at their original coordinates. Their Active → Deprecated → Removed policy and minimum 12-month deprecation window remain unchanged. This design issues no deprecation notice and starts no clock. Any future notice must identify the old coordinate, scope, issuer, date and earliest removal date under separate authority. New implementation acceptance requires one new semantic path with explicit old-input rejection. Maintaining the old normative line and publishing a separate new implementation are distinct responsibilities; neither creates a promise that one runtime reads both.

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
