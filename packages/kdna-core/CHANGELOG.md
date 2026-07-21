# Changelog

## Unreleased

- Fail closed on hostile Argon2id parameters in untrusted password envelopes:
  `memory_kib`, `iterations`, and `parallelism` must be integers within
  defensive bounds (256 MiB / 16 / 8), removing a remote denial-of-service
  path when loading third-party protected assets.

## 0.21.0 (2026-07-20)

### Changed

- Keep `planLoad` fail-closed for password-protected assets until the supplied
  credential is actually verified by `load`; a mere password-present signal
  no longer reports `ready` or `can_load_now: true`.
- Require at least one non-empty, author-neutral judgment unit and explicit
  scope or boundary semantics while keeping optional creator provenance
  separate from format validity.
- Preserve every declared pattern in compact projection instead of silently
  applying a prefix budget.
- Report every non-empty payload path intentionally omitted by compact
  projection, including deterministic counts, in Runtime Capsule trace and
  prompt output; preserve complete axiom applicability lists and stop trimming
  a full-statement fallback.
- Make `checksums.json` optional under one container authority and verify it
  whenever it is present.
- Withdraw asset-signature containers from the Development Preview contract;
  malformed or legacy signature declarations now fail closed. External grants
  and Human Lock provenance remain separate responsibilities.
- Close licensed entitlement validation around the declared `password`,
  `local_receipt`, `account`, and `org` profiles.
- Load external-grant Schemas through static package imports so bundler-based
  ecosystem adapters retain the exact Core validators instead of failing at
  activation time.

## 0.20.0 (2026-07-17)

### Changed

- Keep Core authority limited to technical facts: Runtime manifests reject
  intrinsic quality, risk, trust, recommendation, certification, and
  production-readiness fields; Runtime Capsules and generic Judgment Reports
  no longer project `risk_level` or `quality_badge`. External assessment and
  caller adoption policy remain outside Core conformance.

## 0.19.0 (2026-07-16)

### Added

- Add the separate `@aikdna/kdna-core/remote-runtime` package subpath for a
  deployer-controlled, single packaged remote asset. It validates and loads one
  immutable byte snapshot into a fixed full JSON Runtime Capsule while the
  package-root consumer loaders continue to return
  `KDNA_AUTH_REMOTE_RUNTIME_REQUIRED`.

### Fixed

- Enforce `compatibility.min_loader_version` as a strict `x.y.z` loader package
  coordinate across inspect, validate, default verification, LoadPlan, and
  load. Requirements above Core `0.19.0` now fail closed with
  `KDNA_LOADER_VERSION_UNSUPPORTED` before projection; malformed coordinates
  remain schema failures, and arbitrary-size components compare without
  numeric overflow.

- Require the manifest encryption profile and compatibility coordinate to
  identify a supported contract, and reject a missing, unknown, or
  envelope-mismatched `profile_version` before decryption.
- Bind encrypted payloads to a required manifest encryption declaration and
  the sole supported `payload.kdnab` entry instead of accepting a missing or
  unrelated encrypted-entry list.
- Keep the canonical JudgmentTrace schema's blocked Runtime negotiation codes
  identical to the Runtime implementation, TypeScript declarations, and
  conformance fixtures.
- Accept only `reasoning.self_check` in judgment payloads and fail closed on
  the deprecated plural field or malformed entries.
- Preserve each validated self-check string or structured question exactly in
  compact Runtime Capsule projection instead of silently dropping or changing
  its shape.
- Keep the canonical and packaged payload schemas byte-for-byte identical, and
  regenerate the committed CBOR and authorization conformance fixtures with
  matching checksums and digest evidence.

## 0.18.0 (2026-07-15)

### Added

- Introduce experimental Runtime Capsule and Host-contract candidates. These
  candidates and their one-way adapter were superseded by the sole stable,
  responsibility-named contracts; they are not supported aliases.
- Add digest-evidence schemas, RFC 8785 JCS delivery hashing, independent
  expected A/C/E comparisons, digest-specific mismatch codes, and committed
  A/C/E/P conformance goldens.
- Add committed negotiation, Plan/P recomputation, terminal Trace,
  exact-budget, source-directory block, required-null, and cross-document
  tamper vectors for ConsumptionPlan, Agent Host, and JudgmentTrace.
- Bind Trace elapsed evidence to the correlated Host receipt, make
  unobserved finite limits propagate to an honest `not_observed` overall
  comparison, and record Host-side P mismatch as a correlated pre-execution
  rejection instead of an impossible terminal state.
- Expose ConsumptionPlan, Agent Host, budget-evidence, and JudgmentTrace
  builders and validators from CJS, ESM, and TypeScript.
- Add a dedicated pre-Host budget-blocked Trace builder and validator. They
  preserve projected A/C/E/P, profile, and exact character evidence without
  exposing an over-budget Host request; calls within budget fail closed.
- Add a bounded runtime-contract JSON parser that rejects duplicate
  decoded keys, invalid UTF-8 and Unicode, BOMs, hostile-key prototype
  mutation, non-finite numbers, and trailing or non-RFC JSON input before
  Agent Host object validation.

### Changed

- Converge the compatibility names `inspectKDNA`, `validateKDNA`, and
  `loadKDNA` on the current unversioned Runtime implementation. Validation now
  returns the current five format/schema/payload/checksum/load-contract gates,
  and loading returns a Runtime Capsule; the old source-tree validation and
  `{domain, context}` result shapes are no longer synthesized for current
  assets.
- Make CJS, ESM, and TypeScript declarations expose the same compatibility
  names and current return contracts.
- Accept `.kdna` bytes in memory across current inspect, validate, LoadPlan,
  and load paths. Buffer verification does not extract or materialize the
  asset on disk.
- Read packaged file paths once at load entry so LoadPlan authorization and
  Runtime Capsule projection use the same immutable bytes. The default load
  result is a Runtime Capsule, matching explicit `as: "json"`.
- Make `composeKDNA` fail closed with
  `KDNA_COMPOSE_PROTOCOL_UNAVAILABLE` until current Cluster/Capsule
  composition semantics are defined; it no longer returns a misleading empty
  composition.
- Identify `schema/manifest.schema.json` as the sole Runtime manifest schema.
  The older `schema/kdna-manifest.json` remains only for explicit legacy-source
  migration. Runtime `language` remains valid and `creator` provenance remains
  optional, while an explicitly declared creator still requires a non-empty
  name.

### Fixed

- Restrict Core publication to canonical `core/<package-version>` published-release
  events, require the exact version tag to identify the workflow commit, and
  make already-published versions idempotent only when registry `gitHead` and
  artifact integrity and SHA-1 shasum match the current release evidence. Only
  npm's structured, exact-version `No match found` response is treated as an
  unpublished version; missing packages, authorization/registry errors,
  missing identity, malformed digests, or a different artifact fail closed
  instead of being treated as a successful duplicate.
- Report an unavailable GitHub Release lookup as an explicit non-gating
  `SKIP`, rather than wrapping the skipped observation in a misleading
  readiness `PASS`. Remove unused downstream repository checkouts from the
  Core publish job.
- Make the ESM root and TypeScript declarations expose every existing CJS
  public value, including the crypto, external-grant, Work Pack, composition,
  container, and semver helpers. Permanent source and packed-install checks now
  block entrypoint drift.
- Model the complete Argon2id password-KDF descriptor and require a machine
  fingerprint when the unified decrypt API receives a legacy or profile-unknown
  envelope. Package tests now isolate every npm operation from the user cache
  and keep pack caches separate from a provably empty offline-install cache.
  Third-party dependency fixtures are packed from script-free temporary copies,
  so package-manager lifecycle behavior cannot introduce network or build-tool
  dependencies into the offline release gate.
- Require a non-null independently trusted Plan digest throughout the strict
  ConsumptionPlan / Agent Host chain, snapshot hostile validation contexts without invoking
  accessors, and keep pre-Host budget enforcement unavailable as a public
  bypass option.
- Require matched Host receipts to correlate sender, Host-recomputed, echoed,
  and actual Capsule delivery digests. Trace construction now requires an
  explicit trusted delivery observation when no receipt exists, distinguishing
  `not_delivered` from `not_observed` without inferring either from a request.
- Check internal C/E declarations and canonical/legacy alias agreement before
  independent expected values, so external matches cannot hide conflicting
  asset declarations.
- Validate Runtime Capsule builder inputs and outputs against packaged schemas
  and cross-field success invariants.
- Fail closed when access metadata is unknown or internally inconsistent.
- Compute E directly from Runtime manifest and payload bytes when checksums are
  absent, share the same pure E implementation across checksum build and
  verification, and reject builder inputs that disagree with their manifest
  or digest evidence.
- Sort canonical content-tree and signing entry paths by UTF-8 bytes while
  retaining the existing UTF-16 JSON object-key order. U+E000/U+10000 vectors
  freeze the distinction.

- Make stable verification fail closed on malformed CBOR, invalid current
  manifests, checksum mismatches, and forbidden legacy plaintext containers,
  while preserving whole-file `asset_digest`, canonical `content_digest`, and
  existing expected-digest/signature hooks.
- Make direct `createKdnaAssetReader().loadProfile*` return the current Runtime
  Capsule instead of silently returning `domain: null`; legacy `readDataMap*`
  now fails explicitly rather than pretending current payloads are old source
  files.

## 0.17.0 (2026-07-14)

### Added

- Structurally validate optional payload `worldview`, ordered `value_order`,
  and `judgment_role`, then preserve their declared values in the compact
  Runtime Capsule instead of silently dropping them. Compact prompt projection
  renders worldview, value order, and the standard role fields `acts_as`,
  `does_not_act_as`, and `responsibility`; role extension fields remain
  available in the JSON Capsule without an unsupported prompt claim.
- Add a synthetic Golden Single-Asset Core fixture. It proves schema,
  validation, content-neutral inspect, and exact compact projection only; it
  does not claim author quality, task applicability, model consumption, or
  conformance.

### Changed

- Make Runtime `creator` provenance optional. When it is declared,
  `creator.name` remains required and non-empty; when provenance is unavailable,
  producers omit the block instead of inventing an anonymous or `Unknown`
  identity. This does not weaken authoring-source identity rules or turn
  provenance into a trust claim.
- Keep canonical and packaged Runtime manifest/payload schemas aligned with the
  creator and scoped-judgment contracts.

### Fixed

- Make ecosystem truth validation fail closed when a live component has
  neither package/artifact evidence nor a verifiable repository checkout,
  instead of silently accepting missing external evidence.
- Derive web-package readiness expectations from the declared current Core
  version rather than a stale hard-coded release number.

## 0.16.0 (2026-07-13)

### Added

- RFC-0019 external account/device key grants, schemas, deterministic golden
  and negative fixtures, and JS/Swift parity vectors.
- JS Core helpers for external envelope encryption, per-device grant issuance,
  signature/binding verification, in-memory decryption, and explicit zeroization.
- LoadPlan accepts only a runtime-verified external entitlement for account/org
  assets; structurally similar status objects no longer authorize loading.
- Reject authoring source directories at the public runtime API boundary;
  `planLoad`, `load`, `loadAsset`, and `loadAuthorized` now require a packaged
  `.kdna` file, including resolver-provided dependencies.
- Regenerate authorization conformance fixtures from packaged assets and keep
  source directories available only to authoring operations such as inspect,
  validate, pack, and unpack.
- Remove stale public format-generation wording and local coordination-path
  assumptions from protocol documentation and public audit scripts.
- Make release readiness fail for dirty inputs or when the selected version
  tag does not point to the current commit.

### Security

- Account/device envelopes never fall back to the password profile.
- Revoked, expired, tampered, digest/version/account/device mismatches fail
  closed before Runtime Capsule projection.

## 0.15.12 (2026-07-12)

**Single-format refactor + CBOR wire contract + Runtime Capsule.**

### Breaking changes

- Remove generation-qualified mimetype constants and source-directory helpers
  from the public API. Use `MIMETYPE`, `isKdnaSourceDir`, and
  `detectContainerFormat`.
- `detectContainerFormat` returns only `"kdna"` or `null`.
- Remove the parallel legacy container discriminator. The current contract is
  now represented solely by `format_version`.
- `payload.encoding` accepts only `"cbor"`. JSON payload bytes are rejected;
  there is no production JSON fallback.
- Version-qualified public APIs and the generation-qualified subpath export
  are removed. Use the stable APIs below.
- `kdna load --as=json` returns a Runtime Capsule instead of raw
  `{status, content}`.

### Added

- `REQUIRED_DIR_ENTRIES`, `readLayout`, `buildChecksums`, `load`, and
  `loadAsset` are the sole public container/loading APIs.
- `buildCapsule(loadResult, pre-cutover, profile, opts)` — wraps load output as
  `kdna.context.capsule` per `specs/runtime-capsule.md`.
- `parsePayloadEntry` — strict CBOR decoding for `payload.kdnab`.

### Fixes

- Producer/consumer encoding alignment: `dev-pack.js`, `studio.js` write CBOR;
  validation and loading decode CBOR, including encrypted envelopes.
- `loadAssetUnsafe` extends/deps processing occurs before Capsule wrapping (Story 12 fix).
- All test fixtures converted to CBOR; golden files regenerated.

## 0.15.11 (2026-07-03)

**Fix**: repair Core container dispatcher module resolution in the
published package layout.

- Corrects internal `src/container-dispatcher.js` imports so the dispatcher can
  load sibling `asset-reader` and container modules after npm packaging.
- Load Runtime schemas through package-relative static imports before falling
  back to disk discovery, so bundled server environments do not look for
  KDNA schemas in the host application directory.
- Add regression coverage for loading a source asset through the dispatcher
  from the package `src/` layout and for validating from a non-repository cwd.
- Fix webpack bundler warning: use `eval('require')` for ajv meta-schema import
  so webpack does not try to statically resolve the JSON file at build time.

No public API changes.

## 0.15.10 (2026-06-30)

**API**: export `parseSemver`, `compareSemver`, `satisfies` from public module.

These semver utilities were already used internally by kdna-core (Story 6 dependency
resolution) but were not part of the public API. Exporting them allows consumers
(e.g. `@aikdna/kdna-cli`) to use the canonical implementation rather than maintaining
a parallel copy.

- **`parseSemver(v)`** — parse a semver string into `{major, minor, patch}` or `null`
- **`compareSemver(a, b)`** — compare two version strings, returns `< 0 | 0 | > 0`
- **`satisfies(version, range)`** — test a version against a range (`^`, `~`, `>=`, etc.)

No breaking changes. Purely additive.

## 0.15.9 (2026-06-28)

Story 12 — Asset inheritance (`extends` field, RFC #148 later pre-cutover.x Phase 3).

- **`extends` field in `manifest.schema.json`**: assets may declare
  `extends: "@scope/name@^1.0.0"` (string) or `extends: { name, version }`
  (object). Distinct from `dependencies` (peer composition): `extends`
  creates a single-inheritance hierarchy where the child specialises the parent.
- **`planLoad` extends resolution**: when a `resolveAsset` callback is provided
  and the manifest declares `extends`, `planLoad` resolves the base asset and
  records `extends_chain` in the plan output. Non-blocking — missing base
  emits a WARNING issue, not a blocking error.
- **`loadAuthorized` passes `extends_chain`** from the plan to `loadAssetUnsafe`
  so the inheritance merge is applied at load time.
- **`loadAssetUnsafe` inheritance merge**: when `extendsChain` is non-empty, the
  base asset's content is loaded and merged with the child's content. Merge
  rules: child axioms override parent axioms with the same `id`; parent axioms
  not in child are inherited; same for boundaries (by `scope` text);
  `highest_question` falls back to parent if child omits it. Non-blocking.
- **`result.extends_chain`** and **`result.inheritance_applied`** fields added
  to load output when inheritance is applied.
- Blocks Story 13 (trust levels) per Section 6 sequencing.

## 0.15.8 (2026-06-28)

Story 11 — RAG namespace isolation (RFC #148 later pre-cutover.x Phase 3).

- **`rag_namespace`** field added to each entry in `resolved_dependencies`.
  Format: `name@version` (or bare `name` when version is absent). Provides a
  stable scoped identifier for per-component namespace isolation.
- **`rag_isolation_policy`** object added to load output when
  `resolved_dependencies` is non-empty:
  `{ default: "fenced", cross_namespace_blocked: true, namespaces: [...] }`.
  Consumers MUST NOT mix content across namespaces without explicit permission.
- **`--as=prompt` namespace header**: each component section in multi-asset
  prompt output is now prefixed with `[NAMESPACE: name@version]` so RAG
  systems can attribute and isolate content per source component (per SPEC
  §13.8 source attribution).
- No breaking changes to existing single-asset load output or to
  `resolved_dependencies` shape (fields are additive only).

## 0.15.7 (2026-06-28)

Story 6 — dependencies runtime. Supports semver-matching local/registry dependency resolution and topological sort-based loading order.

- **Dependencies manifest schema support**: Explicitly declared `"dependencies"` as a first-class manifest property.
- **Topological Sorting Resolver**: Added a robust, pure post-order DFS topological sorter with circular cycle, missing dependency, and version range mismatch checks.
- **Topological Prompt Composition**: Enabled recursive, multi-domain prompt composition and flat topological JSON return inside `loadAuthorized`.

## 0.15.6 (2026-06-28)

Story 5 — Bundle payload type. This historical release introduced the bundle
payload profile while the project was still using removed generation-labelled
container vocabulary.

- **Bundle asset_type support:** added `"bundle"` to `asset_type` enum and `VALID_ASSET_TYPE` check.
- **Schema support:** added the then-current bundle manifest shape. The sole
  current Runtime schema has since replaced it.
- **Bundle profile support:** added `kdna.payload.bundle` payload profile and validator.

## 0.15.5 (2026-06-28)

Phase 12 audit follow-up. Closes 3 issues filed against this
repo (#145, #146, #147).

- **#145** The `compilePatterns` output for `misunderstanding`
  cards was already preserved (the container round-trip fix in 0.15.4
  carried `failure_risk` / `applies_when` / `does_not_apply_when`).
  The audit confirmed the fix is in place. No code change required;
  this entry documents the verification.
- **#146** The Studio CLI payload-card projection now
  infers a `type` for `payload.patterns` entries that omit it,
  by inspecting the field set. Misunderstandings (which have
  `wrong` + `correct`), terms (have `term` + `definition`),
  banned terms, patterns, and aesthetics are now all picked up.
  Truly unclassifiable entries are logged and skipped, never
  silently dropped. The fix lives in the consumer
  (`@aikdna/kdna-studio-cli` 0.8.6) rather than here.
- **#147** `buildSigningPayload` now excludes `build-receipt.json`
  and any entry under `reports/`, matching `buildContentDigest`.
  The prior omission meant a producer that signed with this code
  and a verifier that digested with `buildContentDigest` would
  compute two different byte strings and the signature would fail
  to verify. The exclusion set is now a single source of truth.
  `docs/CANONICALIZATION.md` updated to spell out the rule and
  warn producers/verifiers that any new exclusion MUST be added
  to both paths in the same change.

## 0.15.4 (2026-06-28)

Audit follow-ups (2026-06-28 round-trip verification). This release
keeps the canonicalisation paths in sync across producers (studio-cli
`manifestForSigning`, kdna-cli `publish.js#manifestForSigning`,
kdna-studio-core `buildPayload`, kdna-core's own verifier) so a
signature generated by one tool is accepted by every other.

- **manifestForSignature now recursively strips `authoring.content_digest`.**
  Prior version only stripped the top-level content_digest. The digest
  builder (`manifestForDigest`) has always stripped the nested field
  too, so a manifest that contained an `authoring` block with a
  `content_digest` would hash differently for signing vs. digest and
  report a false-positive verification failure.
- **asset-reader canonicalisation is now the single source of truth**
  for the list of fields the signing payload excludes. Documented
  in `docs/CANONICALIZATION.md`.

## 0.15.3 (2026-06-27)

- Fix (PC-2, real): `renderPromptItem` now actually ships the
  boundary card branch. The previous 0.15.2 release (ee20c5e)
  bumped package.json and added a CHANGELOG entry but did NOT
  include the source change to `src/container/index.js`. This release
  re-bundles the fix that landed in 46047fb (PC-1/PC-4 cleanup).
  Verified end-to-end: `kdna-studio card add boundary` with
  non-empty `scope` + `out_of_scope` → `kdna load` now prints
  `in scope: X; out of scope: Y` instead of the UUID `id`.

## 0.15.2 (2026-06-27)

- Fix (PC-2): `renderPromptItem` now renders boundary cards as
  `in scope: X; out of scope: Y; exceptions: ...` instead of
  falling through to the UUID `id`. The previous behavior made
  boundaries unreadable in `kdna load --as=prompt` output. Empty
  boundaries now surface as "(boundary card with empty scope)"
  rather than the UUID, so authors can spot missing content.
- Fix (safety): the last-resort fall-through when no field
  matches returns `(unrendered card: <type>)` instead of the
  UUID `id`, so any unrecognized card shape is visible.

## 0.15.1 (2026-06-27)

- Fix: package.json `files` array now includes `CHANGELOG.md`. The
  0.15.0 tarball was published without the changelog, leaving
  consumers with no way to read release notes from `npm install`.
  Adding it now is a no-op for code but resolves the docs gap.

## 0.15.0 (2026-06-27)

- B2: scrypt password profile `kdna.encryption.password.scrypt` (ADR-007)
  - encryptProtectedEntryScrypt / decryptProtectedEntryScrypt (zero new deps, Node crypto.scryptSync)
  - AES-256-GCM + AES-256-KW envelope encryption, same CEK model as RFC-0008
  - scrypt N=32768 r=8 p=1, 32B KEK, 16B random salt
  - planLoad inferEntitlementProfile detects scrypt profile
  - decrypt dispatch routes Argon2id vs scrypt by envelope profile field
  - recovery slot deferred to 0.2; 0.1: single password slot
- B5: conformance:canonical npm script (threshold #8)

## 0.14.0 (2026-06-25)

- B1: unified container dispatcher (readAsset — pre-cutover/later pre-cutover/ dir → CanonicalAssetModel)
- B4: loadAuthorized decryption orchestration (opts.password, opts.decryptEntry)
- B4: encrypted payload detection in runValidate (backward compatible)
- B8: cross-language golden vectors (test-vectors/golden-vectors.js — 8/8)
- Wave 4: canonical conformance (conformance/canonical-conformance.mjs — 13/13)
- Wave 2.5: clear deprecated registry/domains.json private entries
- Wave 3a: CQ-T2/T3 symmetric compact rendering, scenario null consistency
- Add: engines.node >=18.0.0

## 0.13.3 (2026-06-22)

- Fix: index profile includes max_tokens_hint
- Fix: compact profile falls back to full_statement for TBD placeholders

Packages: `@aikdna/kdna-core`

## 0.13.2 (2026-06-21)

### Fixed

- Compact boundary projection now correctly preserves `applies_when`, `does_not_apply_when`, and `failure_risk` fields across all load profiles. These axiom governance fields are required by `kdna-loader` for domain routing decisions and were being dropped in compact mode under certain manifest configurations.
- Cross-platform test stability: Node test glob patterns are now compatible with both macOS and Linux filesystem sort orders.
- Hash library compatibility: `@noble/hashes` replaces Node-only crypto for digest operations, maintaining Node 18 compatibility without native module binding requirements.

### Changed

- Public API boundary hardened: `loadKDNA`, `loadKDNASync`, `inspectKDNA`, and `inspectKDNASync` now enforce the asset-first contract — callers must pass `.kdna` files or asset handles, not raw directory paths.
- Examples in README and inline docs reference the packaged `.kdna` path rather than source directories.
- First-run contract tightened: exported symbols, error codes, and validation gate names are now part of the stable API surface.

---

## 0.13.1 (2026-06-21)

### Fixed

- **Compact boundary projection preserved.** The `planLoad` function and `loadAuthorized` shim now pass through the full axiom governance projection (applies_when, does_not_apply_when, failure_risk) even when the load contract is not present in the manifest. Prior versions could strip these fields under compact profile, breaking domain routing for `kdna-loader`.
- Digest matching now tolerates `sha256:` prefix in both `manifest_digest` and `payload_digest` checksums entries. Previously, a leading `sha256:` prefix was treated as part of the hex digest, causing false mismatches.

### Changed

- Public API provenance and profile split clarified: `loadKDNA` / `loadKDNASync` are the stable entry points for runtime consumers. Lower-level `generation-qualified layout reader`, `runValidate`, and `planLoad` are exported for advanced tooling but carry no backward-compatibility guarantee.
- Access enum values normalized everywhere: `public`, `licensed`, `remote`. Legacy aliases (`open` → `public`, `protected` → `licensed`, `runtime` → `remote`) are mapped transparently with an info-level issue in the LoadPlan.
- `verifyAsset` / `verifyAssetSync`, `verifyDigest` / `verifyDigestSync`, and `verifySignature` / `verifySignatureSync` are now documented as the stable verification API surface.

---

## 0.13.0 (2026-06-19)

### Added

- **Authorization LoadPlan contract.** The `planLoad(inputPath, opts)` function returns a structured LoadPlan before any judgment content is decrypted or emitted. The LoadPlan reports:
  - `asset_id`, `asset_uid`, `title`, `version`, `judgment_version`
  - `access` model (`public` | `licensed` | `remote`)
  - `entitlement_profile` (`password`, `local_receipt`, `account`, `org`, `purchase_receipt`, `device_bound`)
  - `state` (`ready` | `needs_password` | `needs_license` | `needs_account` | `needs_org_auth` | `expired_grace` | `offline_grace` | `denied` | `invalid` | `needs_runtime`)
  - `required_action` (`load` | `enter_password` | `install_receipt` | `sign_in_or_activate` | `renew_entitlement` | `sync` | `contact_issuer` | `connect_runtime` | `block`)
  - `can_load_now` boolean — the single decision point for product consumers
  - `projection_policy` (`none` | `minimal` | `remote`)
  - `checks` block with per-gate validation results
  - `issues` array with structured error codes (`KDNA_FORMAT_INVALID`, `KDNA_INTEGRITY_DIGEST_FAILED`, `KDNA_AUTH_PASSWORD_REQUIRED`, `KDNA_AUTH_ENTITLEMENT_REQUIRED`, `KDNA_ACCESS_MODE_UNKNOWN`, etc.)
  - `input_fingerprint` capturing the source digest, has-password signal, and entitlement status for cache keying
  - `source.kind` and `source.path` indicating whether the input was a source directory or `.kdna` container
- **`loadAuthorized(inputPath, opts)`** — a higher-level loader that calls `planLoad` first and blocks load when `can_load_now` is false. Throws `KDNA_LOAD_NOT_AUTHORIZED` with the first issue's code. This is the recommended entry point for agent runtimes.
- **`loadAsset(inputPath, opts)`** — renders judgment content into agent-ready prompt text. Supports profiles (`index`, `compact`, `scenario`, `full`) and output formats (`json`, `prompt`). The `prompt` format produces a flat text block suitable for agent context windows with proper axiom applicability rendering.
- **KDNA Core inspect module.** `inspect(inputPath)` returns a content-neutral manifest summary including `asset_id`, `asset_uid`, `kdna_version`, `payload_encrypted`, `profile`, `load_contract_default_profile`, and signature count. Output is always JSON. Banned terms (`trusted`, `recommended`, `high_quality`, `officially_approved`) are enforced by an automatic assertion.
- **KDNA Core validate module.** `validate(inputPath)` runs four independent gates:
  1. **Format gate:** required entries present (`mimetype`, `kdna.json`, `payload.kdnab`), mimetype content correct, lineage is an object not an array
  2. **Schema gate:** `kdna.json` against `manifest.schema.json` via AJV 2020-12
  3. **Payload gate:** `payload.kdnab` against `payload-profile.schema.json`
  4. **Checksums gate:** when `checksums.json` is present, computed digests are compared against declared values for `kdna.json`, `payload.kdnab`, and the combined asset digest
- **KDNA Core pack module.** `pack(sourceDir, outputPath)` produces a canonical-order `.kdna` container: fixed DOS epoch timestamps, alphabetical entry order, mimetype first (STORED, method 0). Package bytes are reproducible with one pinned packer toolchain and compressor; DEFLATE output may differ across compressors or zlib versions.
- **KDNA Core unpack module.** `unpack(inputPath, outputDir)` extracts a `.kdna` container to a directory with path-traversal protection.
- **Container security hardening.** ZIP reader enforces:
  - Maximum container size (25 MiB), max entries (128), max entry size (5 MiB), max total uncompressed (12 MiB)
  - Max compression ratio (100:1) to prevent zip bombs
  - Max JSON depth (64), max array length (10,000), max string length (1 MiB)
  - Entry name normalization (NFC Unicode, no backslash separators, no absolute paths, no `..` traversal)
  - Duplicate entry rejection
  - Symlink and device/special file rejection
- **Digest matching verification.** When `checksums.json` includes `manifest_digest`, `payload_digest`, or `asset_digest`, the validate module computes actual SHA-256 hashes and compares them. Mismatch produces a `KDNA_INTEGRITY_DIGEST_FAILED` issue.
- **Load contract validation.** When the manifest includes a `load_contract` block, it is validated against `load-contract.schema.json`. A missing load contract is not an error — it simply means no specialization.
- **Dual CJS/ESM exports.** `src/index.js` (CommonJS) and `src/index.mjs` (ES module) with matching `exports` map. The pre-cutover module is also available at `@aikdna/kdna-core/pre-cutover`.
- **TypeScript declarations.** `src/types.d.ts` exports type definitions for the stable public API surface.

### Changed

- **Pre-cutover is the only active format path.** The later pre-cutover reader (`readDataMapSync`, `readDataMap`) remains in the codebase for migration compatibility but is no longer the default path. All new integrations should use the pre-cutover API: `inspect`, `validate`, `planLoad`, `loadAuthorized`.
- `validate` and `planLoad` reject later pre-cutover containers (`application/vnd.aikdna.kdna+zip`) with a format error.
- Access model normalized to the three-tier `public` | `licensed` | `remote` enum. The LoadPlan maps legacy values transparently with an info-level issue.
- Container format detection (`detectContainerFormat`) reads only the first central-directory entry to determine pre-cutover vs later pre-cutover, preventing malicious later entries from causing format confusion.

### Removed

- Legacy pre-cutover compatibility shims removed. later pre-cutover is the only legacy format and is handled through the existing `asset-reader.js` module.
- `readDataMapSync` / `readDataMap` deprecated for new use. Use `planLoad` + `loadAsset` for runtime loading or `validate` + `inspect` for diagnostics.
