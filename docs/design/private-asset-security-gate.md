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
| Where it lives today | Core 0.11.0 — entry-level content digests, validated through Core's `validate` / `loadV1` pipeline. The `kdna verify` CLI command is a **proposed future command** (see §3); it is not a description of current CLI behavior. |
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

## 2. File structure

### 2.0 Current v1 baseline (frozen — must not be redefined)

The shipped KDNA v1 container shape is **fixed** and out of scope for this gate. The gate design may propose additions on top of it; it may not move, rename, repackage, or reformat any baseline file.

| File | Role | Visibility | Encrypted option today |
|---|---|---|---|
| `mimetype` | Container type marker. | Public. | No. |
| `kdna.json` | Public manifest (identity, version, authors, license_ref, entry list, declared digests). | **Always public / always plaintext.** Must never be encrypted. | **No — never, under any profile.** |
| `payload.kdnab` | Domain content payload (the KDNA JSON entries, packed). | Public by default. | Optional, under `kdna-licensed-entry-v1` only. |
| `checksums.json` | Per-entry content digests. | Public. | No. |

Any change to these four files (rename, merge, repackage, change of role, or the addition of a fifth mandatory file) is a **baseline change**, not a Phase S proposal, and must go through a separate version-bump process.

### 2.1 Phase S future proposal (not implemented)

The shape below is a **future** proposal for Phase S1–S4. It does not change §2.0. It co-exists with the existing `kdna-licensed-entry-v1` profile; the two are layered, not competing. Nothing in this section is implemented, and nothing in this section may be interpreted as a commitment to migrate the v1 baseline.

```
example.kdna
├── mimetype                     (baseline — §2.0, frozen)
├── kdna.json                    (baseline — §2.0, frozen; always plaintext)
├── payload.kdnab                (baseline — §2.0, frozen; may be plaintext or
│                                 kdna-licensed-entry-v1 encrypted)
├── checksums.json               (baseline — §2.0, frozen)
│
│   ── Phase S additions (proposed, not shipped) ──
│
├── signatures/                  (Phase S, optional)
│   └── kdna.json.sig            (signature over canonicalized manifest)
└── encryption/                  (Phase S, optional)
    ├── envelope.json            (encryption metadata; see §2.4)
    └── (no keys stored here)
```

### 2.2 Public manifest — `kdna.json` (always plaintext, never encrypted)

`kdna.json` is the v1 baseline manifest (§2.0). It is **always public and always plaintext.** It is **never** encrypted, under any profile, in any phase, for any reason. Any future envelope, profile, or extension that requires hiding the manifest is out of scope for the `.kdna` format — opaque data is not a `.kdna` asset.

The baseline fields (`id`, `version`, `type`, `authors`, `license_ref`, etc.) are already defined in `KDNA_CARD_SPEC.md` and are not redefined here.

The fields below are **proposed Phase S additions** to `kdna.json`. They are optional, additive, and absent in v1 baseline assets. A reader that does not understand them must ignore them and treat the asset as a v1 baseline asset.

- `signatures_ref` (Phase S) — where signature(s) live, and which algorithm/key-id is used. Absent in v1 baseline.
- `encryption_ref` (Phase S) — pointer to `envelope.json` if any entry is encrypted; absent / `null` in v1 baseline and in any non-encrypted Phase S asset.
- `key_hint` (Phase S) — opaque identifier telling a reader *which* key in its own keychain to use (e.g. `key_hint: "scope://@example/writing-pro#2026-Q3"`). Absent in v1 baseline.
- `entry_modes` (Phase S) — per-entry `mode: plaintext | encrypted` annotation, only meaningful when paired with `encryption_ref`. Absent in v1 baseline.

**`kdna.json` must never carry** secret material, key bytes, license files, machine fingerprints, or any value that lets a reader unlock the asset without its own out-of-band credentials. This is true in v1 baseline and remains true in all Phase S proposals.

### 2.3 Which fields are public, which may be encrypted

| File / block | Visibility (v1 baseline) | Visibility (Phase S additions) | Encrypted option? |
|---|---|---|---|
| `mimetype` | Public | n/a (baseline) | **No — never.** |
| `kdna.json` | **Always public, always plaintext** | Same. The proposed `signatures_ref` / `encryption_ref` / `key_hint` / `entry_modes` fields are plaintext additions. | **No — never. kdna.json is never encrypted.** |
| `payload.kdnab` | Public by default. | n/a (baseline). | Optional, only under `kdna-licensed-entry-v1`. |
| `signatures/kdna.json.sig` | n/a (baseline) | Public. | No. A signature is meaningless if hidden. |
| `encryption/envelope.json` | n/a (baseline) | Public metadata only. | Never contains keys, never contains plaintext. |
| Key material | n/a (baseline) | **Never in the asset.** | n/a — keys live in the consumer's keychain. |

### 2.4 Encryption envelope — `encryption/envelope.json` (Phase S)

The envelope is a Phase S addition; it does not exist in v1 baseline assets. When at least one entry in `payload.kdnab` is encrypted under a Phase S profile, this file describes *how* to ask for decryption:

- `profile` — name of the envelope profile (e.g. `kdna-private-entry-v1`); distinct from `kdna-licensed-entry-v1` to avoid scope overlap.
- `algorithm` — declared AEAD (e.g. AES-256-GCM, ChaCha20-Poly1305).
- `key_hint` — same value as the manifest's `key_hint`; envelope and manifest must agree.
- `entry_refs` — list of `(entry_id, content_address, nonce, aad)` tuples, where `entry_id` identifies a sub-region of `payload.kdnab` (the baseline payload container is unchanged).
- `kid` — key identifier; lets a reader find the right key in its keychain.

**Forbidden contents:** the decryption key, the license key, machine fingerprints, license file contents, audience identifiers, expiry timestamps tied to a license. The envelope is metadata, not entitlement.

### 2.5 Checksums — `checksums.json` (baseline)

`checksums.json` is part of the v1 baseline (§2.0) and is not redefined by this gate.

- Per-entry digest, e.g. `blake3:<hex>`.
- One entry per line; ordering is canonical (sorted by entry path).
- In v1 baseline, the checksums file is **not** cryptographically bound to anything else; it stands alone. In Phase S, when a signature is present, the checksums file may additionally be covered by the manifest signature — but this is conditional on `signature_status == "valid"`, never assumed.

### 2.6 Verification & decryption order on load

The order is **non-negotiable**. Any other order leaks information or produces false-positive "ok" states. The loader must perform the steps in the sequence below; readers may stop at any step they care about.

1. **Format** — is this a parseable `.kdna` archive? (Sets `format_valid`.)
2. **Manifest digest** — does `kdna.json`'s bytes match its own declared digest (if a wrapping digest is present)?
3. **Signature** — if a `signatures/kdna.json.sig` exists, attempt verification. The result populates `signature_status` with one of: `valid`, `unknown_key`, `invalid`. If no signature block is present, `signature_status` is `absent`. (A reader that has no matching key stops here with `signature_status: "unknown_key"`, **not** `"invalid"`.)
4. **Checksums** — does each entry's digest in `payload.kdnab` match `checksums.json`? (Sets `checksums_valid`.)
5. **Encryption discovery** — does the manifest's `encryption_ref` (Phase S) point to an envelope? If yes, locate the matching key via `kid`/`key_hint`.
6. **Decryption** — decrypt only the entries the reader actually needs to load. (Sets `decryptable`.)
7. **Load** — pass the in-memory entries to the loader. (Sets `loadable`.)

Encryption is **never** required to verify digest or signature. A reader that cannot decrypt still gets `signature_status: "valid"` (or `"absent"`) and `checksums_valid: true` for the parts it can read. This is the property that makes the gate safe to enter incrementally.

---

## 3. Proposed CLI behavior (not implemented — all commands are future)

**Every command in this section is a proposed future CLI command.** None of them exist in the current CLI. The current CLI exposes digest matching through Core v1's `validate` / `loadV1` pipeline, not through a `kdna verify` command. The verbs below are **proposed names**; actual command grammar can vary, but the verbs must remain distinct and the boundaries below must hold.

### 3.1 Proposed verbs

| Command | What it does | Banned nearby phrases |
|---|---|---|
| `kdna sign <asset>` | Produce `signatures/kdna.json.sig` over the canonicalized manifest. Requires a signing key supplied by the operator. | ❌ "approve", ❌ "bless", ❌ "certify" |
| `kdna verify <asset>` | Run steps 1–5 of §2.6. Reports the status object (see §5). Does **not** decrypt. | ❌ "trust this", ❌ "this is safe" |
| `kdna encrypt <asset>` | Take a plaintext asset and produce an encrypted variant: add `encryption/envelope.json` and the Phase S manifest fields. **Never embeds the key.** | ❌ "license", ❌ "activate" |
| `kdna decrypt <asset>` | Reverse of encrypt. Requires the operator to supply the key (or have it in their keychain). | ❌ "consume license", ❌ "unlock rights" |
| `kdna load <asset>` | Run the full §2.6 pipeline. Emits the same status object as `verify`, with `decryptable` and `loadable` populated. | ❌ "you are authorized" |

### 3.2 Error & status language rules

The CLI must not output strings that imply content trust. The following table is normative.

| Acceptable output | Forbidden equivalent |
|---|---|
| `signature_status: "valid"` | "asset is trusted" / "asset is official" |
| `signature_status: "unknown_key"` | "asset is untrusted" |
| `signature_status: "invalid"` | "asset has been tampered with by a bad actor" (over-claim; just say the signature did not verify) |
| `signature_status: "absent"` | "asset is unverified" / "asset is unsigned, be careful" (treat absence as a normal state, not a warning) |
| `checksums_valid: true` | "asset integrity verified — safe to use" |
| `decryptable: true` | "asset is licensed" / "you are entitled" |
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
| Verify v1 | Run the proposed `kdna verify` (post-gate) and surface the status object. | Studio may color the status, but must not use the words "trusted", "recommended", "official", "approved". |
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

A load operation returns a status object with **four booleans and one four-valued enum**. Each field is independent. A consumer reads them and decides what to do; the loader never decides for the consumer.

**Booleans:**

| Field | Meaning | True means | False means |
|---|---|---|---|
| `format_valid` | The archive parses and the manifest is well-formed JSON against the schema. | n/a | "this is not a `.kdna` I can read" |
| `checksums_valid` | Every entry's bytes match its declared digest. | n/a | "an entry was modified or corrupted" |
| `decryptable` | All `mode: encrypted` entries that the caller asked for can be decrypted with a key the caller has. | n/a | "the caller is missing a key" |
| `loadable` | All entries the caller asked for are decrypted and schema-valid. | n/a | "decryption succeeded but content does not parse" |

**Four-valued enum (replaces any `signature_valid` boolean):**

| Field | Allowed values | Meaning of each value |
|---|---|---|
| `signature_status` | `"valid"` | A signature block was present and verified under the key referenced by `kid`. |
| `signature_status` | `"unknown_key"` | A signature block was present, but the loader has no key matching `kid`. The loader did not attempt verification. **Not** an error. |
| `signature_status` | `"invalid"` | A signature block was present, a key was found, verification ran, and the result was a mismatch. **This is** an error. |
| `signature_status` | `"absent"` | No signature block exists on the asset. This is a normal state for v1 baseline assets and for any Phase S asset where the author chose not to sign. The loader must not emit a warning, log entry, or non-zero exit code for `"absent"`. |

### 5.2 Why the signature field is an enum, not a boolean

Collapsing `"unknown_key"` and `"absent"` and `"invalid"` into a single "untrusted" boolean is the exact conflation this gate exists to prevent. The four states are distinguished because they have different meanings and different downstream consequences:

- `"absent"` is a v1-baseline-compatible state and must be treated as ordinary.
- `"unknown_key"` is informational; the loader simply has nothing to verify against.
- `"invalid"` is the only state that indicates a real cryptographic failure.
- `"valid"` is the only state that produces a positive cryptographic claim.

A consumer that wants to **require** signatures must compose its own policy on top of these four values (e.g. "reject if status is neither `valid` nor `absent`"). The loader never enforces such a policy.

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
- ❌ `signature_valid` (any boolean form) — only `signature_status` is permitted.

A consumer that wants any of the above signals must compute them locally from `format_valid`, `checksums_valid`, `signature_status`, `decryptable`, `loadable`, and its own policies.

### 5.4 What the loader must not do

- Refuse to return a status object when `signature_status` is `"invalid"` or `"unknown_key"`. The caller needs the full enum to make its own decision.
- Refuse to load an asset because `signature_status == "absent"`. Unsigned is a valid state; the caller decides.
- Emit a warning, log line, or non-zero exit code solely because `signature_status == "absent"`. Absence is not a problem to report.
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
| G4 | Digest matching is shipped and announced (not just implemented). | Core lead | Release notes for the digest feature exist and a Core v1 `validate` / `loadV1` walkthrough is published. The future `kdna verify` command is **not** part of this gate condition. |
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
- **Exit criteria:** `kdna sign` and `kdna verify` work on a public flagship; loader returns the full status object (four booleans + `signature_status`); CLI output obeys §3.2.

### Phase S2 — Encrypted payload envelope

- **Scope:** Add `kdna-private-entry-v1` envelope. Encrypt one or more entries. Decrypt in memory only.
- **Goal:** Prove the encryption layer co-exists cleanly with the S1 signature layer; manifest signing is independent of payload encryption.
- **Out of scope:** Studio UI, key distribution, loader's interactive key-prompt UX.
- **Exit criteria:** A `.kdna` with a mix of `plaintext` and `encrypted` entries loads correctly on a reader with the key, and reports `decryptable: false` on a reader without it — *without* downgrading `signature_status` from `"valid"` to anything else, and *without* downgrading `checksums_valid` to `false`.

### Phase S3 — Studio sign / encrypt

- **Scope:** Add Studio capabilities listed in §4.1. No distribution, no registry, no marketplace.
- **Goal:** Authors can produce both public v1 and encrypted v1 exports from Studio, with a verify step shown.
- **Out of scope:** Marketplace badges, registry CI checks on signature presence, public trust indicators.
- **Exit criteria:** An author can produce an encrypted v1 in Studio, verify it via CLI on another machine, and decrypt it back into Studio for editing — without any private key ever leaving the author's keychain.

### Phase S4 — Loader decrypt / verify

- **Scope:** Promote the S1+S2 status object to the canonical loader contract (§5). All loaders (Core Swift, CLI Node, Studio) emit identical status fields for the same input.
- **Goal:** A single consumer-side truth source for "what state is this asset in."
- **Out of scope:** Any consumer-side decision based on the status object. That is the consumer's policy, not the loader's.
- **Exit criteria:** Cross-implementation parity test passes: the same `.kdna` produces the same four booleans + `signature_status` across Core, CLI, and Studio loaders.

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
| D5 | **Status-object durability.** Is the four-booleans-plus-`signature_status` contract a v1 promise, or advisory? | If advisory, downstream consumers will fork; if a promise, the loader's API is stable. | (a) SemVer-stable, (b) experimental until S4 exit. |
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
