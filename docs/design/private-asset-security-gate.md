# Private Asset Security Gate — Design

> **Status:** Gate design (pre-implementation). No code is defined in this document.
> **Audience:** Owner + downstream implementation agents (Core / CLI / Studio).
> **Scope boundary:** This document covers the **entry gate** for adding signature and encryption handling to `.kdna` private assets. It does **not** redesign the existing `kdna-licensed-entry-v1` profile (see [kdna-encryption-authorization.md](../kdna-encryption-authorization.md)) and it does **not** introduce any authorization, entitlement, billing, registry scoring, or content-quality concepts.

---

## 0. Why this gate exists

Three failure modes have surfaced in adjacent work:

1. **Conflation** — digest (content integrity), signature (author binding), encryption (payload confidentiality), and trust (content quality / recommendation) have been discussed as if they were the same problem.
2. **Scope creep** — "encrypted" has been allowed to imply "licensed", and "signed" has been allowed to imply "approved".
3. **Premature implementation** — multiple teams have begun partial encryption/signature work without an agreed conceptual boundary, leading to duplicate envelopes, conflicting key handling, and ambiguous error language.

This document freezes the conceptual boundary, proposes (but does not implement) a v1 file shape, names future CLI/Studio/Loader behavior, and lists the **gate conditions** that must be true before any implementation work begins.

---

## 1. Concept boundaries

These four terms are deliberately non-overlapping. Any future PR that mixes them is a gate violation.

### 1.1 Digest

| Property | Value |
|---|---|
| What it proves | The bytes you received match the bytes that were hashed. |
| What it does **not** prove | Who produced the bytes; whether the bytes are correct; whether the bytes are safe. |
| Where it lives today | Core 0.11.0 — entry-level content digests, exposed via `kdna verify` and Studio export contract. |
| Strength | Collision resistance of the chosen hash (BLAKE3 / SHA-256 family). |
| Failure mode | Mismatch ⇒ "the asset was modified or corrupted in transit/storage." |
| Trust implication | **None.** A digest says nothing about author or quality. |

### 1.2 Signature

| Property | Value |
|---|---|
| What it proves | The manifest (or a specific block) was signed by the holder of a particular private key. |
| What it does **not** prove | That the content is correct, complete, safe, current, or endorsed by anyone. |
| What it binds | **Provenance / author binding.** "This key signed this version of this block." |
| Where keys live | Out of scope for this gate. Key distribution is a separate concern (see §8 owner decision). |
| Failure mode | Invalid signature ⇒ "this block is not what the claimed signer signed." |
| Trust implication | **None by itself.** A signature is a cryptographic fact, not a recommendation. The presence of a valid signature does **not** mean the asset is "official" or "recommended" or "high quality". |
| Forbidden phrasings | ❌ "trusted asset", ❌ "verified author", ❌ "approved by …", ❌ "official" |

### 1.3 Encryption

| Property | Value |
|---|---|
| What it provides | Confidentiality of the encrypted payload against readers who lack the key. |
| What it does **not** provide | Authorization to use, license to consume, entitlement to charge for, proof of quality, proof of authorship. |
| What it does **not** equal | A license system, a paywall, a DRM scheme, an entitlement check, a content-trust signal. |
| Where keys live | The key belongs to the asset owner. KDNA Core/CLI/Studio must never escrow keys. |
| Failure mode | Cannot decrypt ⇒ "this reader does not have the right key for this block." |
| Trust implication | **None.** Encryption is access control, not endorsement. An encrypted asset is not "more private-asset-quality" than an open one. |
| Forbidden phrasings | ❌ "protected asset", ❌ "authorized to load", ❌ "entitled reader" |

### 1.4 Trust

| Property | Value |
|---|---|
| Belongs to KDNA Core? | **No.** |
| Who decides | The consumer: the user, the organization, the product runtime, the human reviewer. |
| Forms trust may take | A user pinning a version, a team requiring human-lock evidence, a runtime rejecting a domain below its quality threshold, a marketplace curating a list. |
| Relationship to the other three | Trust may *use* digest/signature/encryption as **evidence inputs**, but it is not produced by any of them. A valid signature is **one signal** a consumer can choose to weight; it is not trust itself. |
| Forbidden phrasings | ❌ "KDNA trusted", ❌ "KDNA recommended", ❌ "KDNA approved", ❌ "KDNA quality badge" |

### 1.5 The single sentence rule

> **Digest says *unmodified*. Signature says *signed by this key*. Encryption says *locked to this reader*. Trust says *I will use it*. The four never collapse into one another.**

---

## 2. Proposed v1 file structure (not implemented)

The structure below is **proposed**, not shipped. It is intended to co-exist with the existing `kdna-licensed-entry-v1` profile; the two are layered, not competing.

### 2.1 Top-level shape

```
example.kdna
├── kdna.json                    (public manifest — see §2.2)
├── entries/
│   ├── KDNA_Core.json           (plaintext or encrypted; declared in manifest)
│   ├── KDNA_Patterns.json
│   ├── KDNA_Scenarios.json
│   └── ...
├── signatures/
│   └── kdna.json.sig            (signature over canonicalized manifest)
├── checksums/
│   └── checksums.json           (per-entry digests; see §2.5)
└── encryption/
    ├── envelope.json            (encryption metadata; see §2.4)
    └── (no keys stored here)
```

### 2.2 Public manifest — `kdna.json` (always plaintext)

Always readable without keys. Contains:

- `id`, `version`, `type` — identity (already defined in `KDNA_CARD_SPEC.md`).
- `authors` — author references; author identity ≠ signature identity.
- `license_ref` — pointer to license text/URL, **not a license check** (the check is the consumer's job).
- `entry_manifest` — list of entry files with per-entry `mode: plaintext | encrypted` and `digest`.
- `signatures_ref` — where signature(s) live, and which algorithm/key-id is used.
- `encryption_ref` — pointer to `envelope.json` if any entry is encrypted; `null` otherwise.
- `key_hint` — opaque identifier telling a reader *which* key in its own keychain to use (e.g. `key_hint: "scope://@example/writing-pro#2026-Q3"`). **The manifest must never carry secret material, key bytes, license files, or any value that lets a reader unlock the asset without its own out-of-band credentials.**

### 2.3 Which fields are public, which may be encrypted

| Field / block | Default visibility | Encrypted option? |
|---|---|---|
| `kdna.json` (manifest) | **Always public** | No. If you need to hide it, the asset is not a `.kdna` asset — it is opaque data. |
| `entries/*.json` (domain content) | Public by default | Optional. Encrypted entries are declared in `entry_manifest[i].mode = "encrypted"`. |
| `signatures/kdna.json.sig` | Public | No. A signature is meaningless if hidden. |
| `checksums/checksums.json` | Public | No. |
| `encryption/envelope.json` | Public metadata only | Never contains keys, never contains plaintext. |
| Key material | **Never in the asset** | n/a — keys live in the consumer's keychain. |

### 2.4 Encryption envelope — `encryption/envelope.json`

When at least one entry is encrypted, this file describes *how* to ask for decryption:

- `profile` — name of the envelope profile (e.g. `kdna-private-entry-v1`); distinct from `kdna-licensed-entry-v1` to avoid scope overlap.
- `algorithm` — declared AEAD (e.g. AES-256-GCM, ChaCha20-Poly1305).
- `key_hint` — same value as the manifest's `key_hint`; envelope and manifest must agree.
- `entry_refs` — list of `(entry_path, content_address, nonce, aad)` tuples.
- `kid` — key identifier; lets a reader find the right key in its keychain.

**Forbidden contents:** the decryption key, the license key, machine fingerprints, license file contents, audience identifiers, expiry timestamps tied to a license. The envelope is metadata, not entitlement.

### 2.5 Checksums — `checksums/checksums.json`

- Per-entry digest, e.g. `blake3:<hex>`.
- One entry per line; ordering is canonical (sorted by entry path).
- The checksums file is itself covered by the manifest signature, so a checksums file is meaningful only when its parent manifest is signed and verified.

### 2.6 Verification & decryption order on load

The order is **non-negotiable**. Any other order leaks information or produces false-positive "ok" states.

1. **Format** — is this a parseable `.kdna` archive?
2. **Manifest digest** — does the manifest match the declared `kdna.json` digest (if a wrapping digest exists)?
3. **Signature** — does `signatures/kdna.json.sig` verify against the manifest using the key referenced by `kid`? (A reader that has no matching key stops here with `signature_unknown_key`, **not** `signature_invalid`.)
4. **Checksums** — does each entry's digest match `checksums/checksums.json`?
5. **Encryption discovery** — does `entry_manifest` contain any `mode: encrypted` entries? If yes, locate the matching key via `kid`/`key_hint`.
6. **Decryption** — decrypt only the entries the reader actually needs to load.
7. **Load** — pass the in-memory entries to the loader.

Encryption is **never** required to verify digest or signature. A reader that cannot decrypt still gets a valid `signature_valid` + `checksums_valid` state for the parts it can read. This is the property that makes the gate safe to enter incrementally.

---

## 3. Proposed CLI behavior (not implemented)

The verbs below are **proposed names**. The order listed is the conceptual pipeline; actual command grammar can vary, but the verbs must remain distinct.

### 3.1 Proposed verbs

| Command | What it does | Banned nearby phrases |
|---|---|---|
| `kdna sign <asset>` | Produce `signatures/kdna.json.sig` over the canonicalized manifest. Requires a signing key supplied by the operator. | ❌ "approve", ❌ "bless", ❌ "certify" |
| `kdna verify <asset>` | Run steps 1–5 of §2.6. Reports a status object (see §5). Does **not** decrypt. | ❌ "trust this", ❌ "this is safe" |
| `kdna encrypt <asset>` | Take a plaintext asset and produce an encrypted variant: rewrite `entry_manifest` modes, add `encryption/envelope.json`. **Never embeds the key.** | ❌ "license", ❌ "activate" |
| `kdna decrypt <asset>` | Reverse of encrypt. Requires the operator to supply the key (or have it in their keychain). | ❌ "consume license", ❌ "unlock rights" |
| `kdna load encrypted.kdna` | Run the full §2.6 pipeline. Emits the same status object as `verify`, plus `decryptable: true|false` and `loadable: true|false`. | ❌ "you are authorized" |

### 3.2 Error & status language rules

The CLI must not output strings that imply content trust. The following table is normative.

| Acceptable output | Forbidden equivalent |
|---|---|
| `signature_valid: true` | "asset is trusted" / "asset is official" |
| `checksums_valid: true` | "asset integrity verified — safe to use" |
| `decryptable: true` | "asset is licensed" / "you are entitled" |
| `signature_unknown_key` | "asset is untrusted" |
| `signature_invalid` | "asset has been tampered with by a bad actor" (over-claim; just say the signature did not verify) |
| `key_missing` | "you do not have a license" |

The verb **load** must be the only command allowed to silently combine status flags. Even then, the status object must be available to callers (e.g. `--status json`).

### 3.3 What the CLI must not do in this phase

- Must not read, write, or transmit a `license` block.
- Must not call any entitlement / activation / revocation endpoint.
- Must not refuse to load an asset based on signature absence. (A reader may choose to refuse; the CLI itself does not.)
- Must not introduce a `--trusted` / `--recommended` / `--official` flag.
- Must not write plaintext keys to disk, even temporarily.

---

## 4. Proposed Studio behavior (not implemented)

Studio is the authoring surface. It must give authors the four operations a CLI gives, plus a way to *load an encrypted asset back into the editor for editing*. UI specifics are out of scope for this gate; the capability list is in scope.

### 4.1 Capabilities

| Capability | Description | Boundary |
|---|---|---|
| Export public v1 | Produce a plaintext `.kdna` with `entry_manifest` modes all `plaintext`. | Optional signature at author discretion. |
| Export encrypted v1 | Produce a `.kdna` with selected entries in `encrypted` mode and a populated `envelope.json`. | Studio never holds the long-term key after the operation; the operator supplies it per-export. |
| Sign v1 | Run `kdna sign` against the canonicalized manifest. | Studio shows which key-id is being used; never shows the private key. |
| Verify v1 | Run `kdna verify` and surface the status object. | Studio may color the status, but must not use the words "trusted", "recommended", "official", "approved". |
| Decrypt for editing | Load an encrypted asset, decrypt only the entries the author is editing, hold them in memory. | Studio must not write decrypted entries to disk unless the user explicitly chooses a plaintext export. Decrypted scratch files must be excluded from any "open recent" / "auto-restore" list. |

### 4.2 Studio must not

- Display any "quality badge" or "official approval" indicator tied to signature/encryption state.
- Refuse to export a public v1 because it is unsigned. (The author may be prototyping.)
- Add a UI affordance that conflates "signed" with "good".
- Auto-publish encrypted exports to any registry or marketplace. (Distribution is a separate gate.)

---

## 5. Proposed Loader behavior (not implemented)

The loader is the on-the-wire consumer. Its return contract is the most important gate artifact, because every tool that reads `.kdna` will eventually depend on it.

### 5.1 Status object

A load operation returns a status object with **five booleans**. Each is independent. A consumer reads them and decides what to do; the loader never decides for the consumer.

| Field | Meaning | True means | False means |
|---|---|---|---|
| `format_valid` | The archive parses and the manifest is well-formed JSON against the schema. | n/a | "this is not a `.kdna` I can read" |
| `checksums_valid` | Every entry's bytes match its declared digest. | n/a | "an entry was modified or corrupted" |
| `signature_valid` | The manifest's signature verifies under the key referenced by `kid`. | n/a | "this manifest is not what the claimed signer signed" |
| `decryptable` | All `mode: encrypted` entries that the caller asked for can be decrypted with a key the caller has. | n/a | "the caller is missing a key" |
| `loadable` | All entries the caller asked for are decrypted and schema-valid. | n/a | "decryption succeeded but content does not parse" |

### 5.2 Distinguishing "unknown key" from "invalid signature"

The loader must distinguish three signature states, not two:

- `signature_valid: true` — verified.
- `signature_unknown_key` — no key matched `kid`; the loader did not attempt verification. **Not** an error.
- `signature_invalid` — a key was found, verification ran, the result was a mismatch. **This is** an error.

Collapsing the first two into "untrusted" is the exact conflation this gate exists to prevent.

### 5.3 Forbidden status fields

The following must never appear in the loader's status object, in logs, in CLI output, in Studio UI, or in any derived artifact:

- ❌ `trusted`
- ❌ `high_quality`
- ❌ `recommended`
- ❌ `official_approved`
- ❌ `blessed`
- ❌ `certified`
- ❌ `safe`
- ❌ `endorsed`
- ❌ `star_rating`
- ❌ `badge`

A consumer that wants any of those signals must compute them locally from `format_valid`, `checksums_valid`, `signature_valid`, `decryptable`, `loadable`, and its own policies.

### 5.4 What the loader must not do

- Refuse to return a status object when `signature_valid: false` and `signature_unknown_key` is the cause. The caller needs the booleans to make its own decision.
- Refuse to load an asset because it is unsigned. Unsigned is a valid state; the caller decides.
- Treat encryption presence as a sign of higher value. An encrypted asset is not better than an open one; it is only less publicly visible.
- Write decrypted content to disk. Decryption is in-memory only.

---

## 6. Gate to enter implementation

Implementation of the S1–S5 phases (§7) may begin **only when every condition below is true**. Each condition has a single owner and a single verification artifact.

| # | Condition | Owner | Verification artifact |
|---|---|---|---|
| G1 | Studio v1 export end-to-end passes (public v1, round-trip through Core loader). | Studio lead | CI green; one recorded terminal session of `kdna load` on a Studio-exported v1. |
| G2 | At least one real flagship asset (e.g. a `@aikdna/*` domain) is migrated to the v1 manifest shape. | Domain owner | The flagship asset loads via `kdna load` and produces an identical L2/L3 score to its pre-migration version. |
| G3 | Core / CLI / Studio versions are aligned to a single release line. | Release lead | A published version matrix entry where all three components carry the same minor version. |
| G4 | Digest matching is shipped and announced (not just implemented). | Core lead | Release notes for the digest feature exist and a `kdna verify` walkthrough is published. |
| G5 | All open issues from the previous reconciliation pass are closed or explicitly deferred with a recorded reason. | Owner | Issue board snapshot. |
| G6 | Clean-install CI is green on at least one each of macOS, Linux, and Windows. | CI lead | Latest CI run artifacts. |
| G7 | This gate design is **approved** by the owner, in writing, with all open questions in §8 resolved. | Owner | Approval comment / signed-off PR. |

**Hard rule:** until G7 is signed, no agent in this repo may write encryption code, signature code, key-handling code, or modify any schema to add signature/encryption fields. The design must be approved *before* the code is written.

---

## 7. Proposed phase breakdown

Phases are sequential. Each phase produces a verifiable artifact and a status object that subsequent phases can rely on.

### Phase S1 — Signature-only prototype

- **Scope:** Sign and verify `kdna.json` only. No entry-level encryption.
- **Goal:** Prove the digest → signature → checksums pipeline (§2.6 steps 1–5) end-to-end on a public asset.
- **Out of scope:** Encryption, key distribution, Studio UI for signing, registry policy on signatures.
- **Exit criteria:** `kdna sign` and `kdna verify` work on a public flagship; loader returns the full five-boolean status object; CLI output obeys §3.2.

### Phase S2 — Encrypted payload envelope

- **Scope:** Add `kdna-private-entry-v1` envelope. Encrypt one or more entries. Decrypt in memory only.
- **Goal:** Prove the encryption layer co-exists cleanly with the S1 signature layer; manifest signing is independent of payload encryption.
- **Out of scope:** Studio UI, key distribution, loader's interactive key-prompt UX.
- **Exit criteria:** A `.kdna` with a mix of `plaintext` and `encrypted` entries loads correctly on a reader with the key, and reports `decryptable: false` on a reader without it — *without* downgrading `signature_valid` or `checksums_valid`.

### Phase S3 — Studio sign / encrypt

- **Scope:** Add Studio capabilities listed in §4.1. No distribution, no registry, no marketplace.
- **Goal:** Authors can produce both public v1 and encrypted v1 exports from Studio, with a verify step shown.
- **Out of scope:** Marketplace badges, registry CI checks on signature presence, public trust indicators.
- **Exit criteria:** An author can produce an encrypted v1 in Studio, verify it via CLI on another machine, and decrypt it back into Studio for editing — without any private key ever leaving the author's keychain.

### Phase S4 — Loader decrypt / verify

- **Scope:** Promote the S1+S2 status object to the canonical loader contract (§5). All loaders (Core Swift, CLI Node, Studio) emit identical status fields for the same input.
- **Goal:** A single consumer-side truth source for "what state is this asset in."
- **Out of scope:** Any consumer-side decision based on the status object. That is the consumer's policy, not the loader's.
- **Exit criteria:** Cross-implementation parity test passes: the same `.kdna` produces the same five-boolean status across Core, CLI, and Studio loaders.

### Phase S5 — Enterprise key / entitlement integration

- **Scope:** Out of this gate's authority. Defined and gated separately in [kdna-encryption-authorization.md](../kdna-encryption-authorization.md) and `specs/kdna-entitlement-api.md`.
- **Why it lives outside this gate:** It requires a license model, an activation endpoint, a revocation channel, and a billing/audit story — all of which are authorization concerns, not cryptographic-asset concerns.
- **Re-entry condition:** S5 may only consume the S4 loader contract; it may not redefine it.

---

## 8. Owner decisions required

The following questions block the gate approval (G7) and cannot be answered by implementation agents. They are listed in the order they unblock the design.

| # | Question | Why the design needs the answer | Options to consider |
|---|---|---|---|
| D1 | **Key distribution.** How does a reader obtain the decryption key? | Determines whether `key_hint` in §2.2 is a scope URI, a key-server query, or an out-of-band ID. Without this, the envelope can't be specified. | (a) Operator-side keychain only, (b) scope-published public key + encrypted payload, (c) external KMS integration deferred to S5. |
| D2 | **Signature algorithm and key lifecycle.** Ed25519 only, or also post-quantum? Rotation policy? | Affects `signatures_ref` and `kid` shape. | (a) Ed25519 only for v1, (b) Ed25519 + hybrid PQ draft, (c) pluggable. |
| D3 | **Encrypted-entry format compatibility with `kdna-licensed-entry-v1`.** | The existing licensed profile encrypts entries too. The new envelope must not collide with it. | (a) New profile name (`kdna-private-entry-v1`), distinct from licensed; (b) shared profile with a different `mode` field. |
| D4 | **Author identity vs. signature identity.** A signature proves "key X signed this", not "Alice signed this". | Determines whether `authors[]` in the manifest is for humans, for orgs, or just an opaque key reference. | (a) Keep human authors list separate from `kid`; (b) introduce an `author_keys[]` block. |
| D5 | **Status-object durability.** Is the five-boolean contract a v1 promise, or advisory? | If advisory, downstream consumers will fork; if a promise, the loader's API is stable. | (a) SemVer-stable, (b) experimental until S4 exit. |
| D6 | **Backwards compatibility for existing public assets.** | Many existing assets have no signature block. The loader must accept them — but should it warn? | (a) Silent; (b) warn once per asset, never per load; (c) warn per load. |

---

## 9. Non-goals (explicit)

To prevent scope creep, the following are **out of scope** for this gate and the S1–S4 phases:

- License activation, deactivation, sync, revocation.
- Entitlement API changes.
- Registry signature-policy enforcement.
- Marketplace curation, ranking, scoring, badges, stars.
- KDNA-team endorsement of any asset.
- Domain quality scoring of any kind.
- Any consumer-side decision based on signature/encryption state.
- Any user-visible string containing the words "trusted", "recommended", "official", "approved", "blessed", "certified", "endorsed", "safe", or "high quality" with respect to an asset's cryptographic state.

---

## 10. What ships with this document

- A frozen conceptual boundary for digest, signature, encryption, and trust.
- A proposed v1 file shape and verification order.
- A proposed CLI / Studio / Loader capability boundary.
- A seven-condition gate that must be met before implementation begins.
- A five-phase plan with explicit exit criteria.
- A list of six owner decisions that block approval.

What does **not** ship with this document, by design:

- Any code change in Core, CLI, Studio.
- Any schema change.
- Any new package or release.
- Any registry or marketplace behavior.
- Any authorization or entitlement logic.
