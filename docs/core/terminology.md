# KDNA Core Terminology

Phase 1 baseline vocabulary. Each term is defined in 1–3 sentences. Some terms refer to spec-level concepts; others refer to implementation patterns. Where a term is used elsewhere in this repository with multiple meanings, the meaning below is authoritative.

## Format concepts

**KDNA Core** — the official KDNA judgment-asset format and runtime loading contract defined in this repository. Includes the manifest schema, payload profile schemas, checksums schema, and load contract.

**Official KDNA toolchain** — the SDK, CLI, Loader, and API through which `.kdna` assets are created, inspected, protected, loaded, and consumed. Third-party products integrate KDNA through the official SDK, CLI, Loader, or API. (See principle 9 in `principles.md`.)

**.kdna** — the standardized container file. A single `.kdna` file holds a manifest, a payload, optional signatures, optional attachments, and an optional checksums file, all in a ZIP-compatible container with a `mimetype` entry.

**Manifest** — the public metadata layer of a `.kdna` file. Stored as `kdna.json` at the root of the container. Always plaintext so that the official toolchain can identify and route the file even if the payload is encrypted.

**Payload** — the actual judgment data. Stored as `payload.kdnab` at the root of the container. May be plaintext or selectively encrypted. The structure of the payload is defined by a **payload profile** (e.g. `kdna.payload.judgment`).

**Envelope** — the set of metadata entries that describe the container itself: encryption metadata, signature references, digests. Distinct from the payload, which is the judgment content.

**Asset ID** — a human-readable identifier for an asset, e.g. `kdna:example:writing-core`. The `kdna:` prefix is the asset identifier namespace; it is unrelated to the manifest's `format_version` compatibility coordinate. The rest of the identifier is the producer's choice. Asset IDs are NOT globally unique by themselves; they are namespaced.

**Asset UID** — a globally unique identifier, e.g. `urn:uuid:00000000-0000-4000-8000-000000000001`. Required in current manifests to disambiguate assets that share a name.

**Judgment Version** — a semantic version for the **encoded judgment**, separate from the **asset release version**. An asset's `version` is its release tag; its `judgment_version` describes the version of the underlying judgment system it represents. Two assets with the same `judgment_version` are semantically equivalent for matching purposes.

**Lineage** — the chain of parent assets that this asset descends from. Recorded as an object in the manifest. Lineage does not imply trust, endorsement, or licensing; it is a fact about provenance.

**Digest** — a cryptographic hash of an entry, used for integrity checks. The default algorithm in Phase 1 is SHA-256. Digests may be recorded in the checksums file or in the manifest's `digests` block.

**Signature** — a cryptographic signature over a payload or manifest entry, recorded as a separate file in the `signatures/` directory. A signature has a key reference, an algorithm, and a digest of the signed bytes. The signature is verifiable; whether it is meaningful is a caller decision.

## Runtime concepts

**Load Contract** — the manifest block that describes how the official KDNA loader may read the asset. Includes the default profile, a set of named profiles (`index`, `compact`, `scenario`, `full`), per-profile flags (`requires_decryption`, `max_tokens_hint`, `selection`), and an `intended_for` list.

**Load Profile** — a named reading strategy. `index` reads only metadata; `compact` reads the default judgment summary; `scenario` reads only triggered sections for a given input; `full` reads the entire payload for audit, editing, or deep reasoning.

**Runtime Status** — a value from the trace vocabulary that records the outcome of a loader operation. Values include `not_applicable`, `candidate`, `requires_decryption`, `loaded`, `skipped`, `blocked_by_runtime_policy`, `failed_to_parse`, `failed_to_decrypt`, `signature_invalid`, `version_incompatible`. Statuses describe **runtime processing**, not asset value.

**Scope Metadata** — the manifest block that describes what the asset is about and where it applies. Includes `summary`, `language`, `keywords`, `domain_field`. Scope metadata is descriptive; it is not an endorsement.

**Evidence Claims** — claims about the evidence behind an asset, as declared by the author or publisher. In Phase 1 these are descriptive metadata only; the spec does not validate their truth. The terminology replaces the older "quality badge" concept, which conflated evidence with evaluation.

**Runtime Policy** — a set of rules owned by the **caller** (not by KDNA Core) that decide which assets a given loader will accept, reject, warn about, or require decryption for. KDNA Core supplies the verifiable primitives; the policy lives outside the format.

## Out-of-scope terms

The following are **not** KDNA Core concepts and are explicitly out of scope:

- **Registry / Marketplace / Store** — distribution concerns, not format concerns
- **Trust / Verified / Recommended** — runtime policy decisions
- **Quality Badge / Ranking** — evaluative claims, not format properties
- **Official / Certified / Approved** — endorsement claims, not format properties
- **Reference implementation** — KDNA Core has one official toolchain
- **Third-party implementation** — third parties integrate through the official SDK, CLI, Loader, or API
