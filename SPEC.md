# KDNA Core Specification

KDNA (`.kdna`) is an open, portable file format for expressible human thinking, judgment, trade-offs, boundaries, and taste. This document summarizes the active **Container `0.6.0`** and **R2** semantic line.

Normative machine-readable definitions live in [`specs/public-semantic-source.json`](specs/public-semantic-source.json), JSON Schemas live in [`specs/`](specs/) and [`schema/`](schema/), and the full specification map is indexed in [`SPEC-INDEX.md`](SPEC-INDEX.md#kdna-public-specification-index). Reference implementations live in [`@aikdna/kdna-core`](packages/kdna-core/) and [`@aikdna/kdna-read`](packages/kdna-read/).

---

## 1. Architecture Overview (Container `0.6.0` & R2)

| Layer | Current Coordinate | Role |
| --- | --- | --- |
| **Distribution Container** | `format_version: "0.6.0"` (public section packs) / `ProtectedManifest06Candidate` (encrypted `payload.kdnab`) | Immutable `.kdna` ZIP archive (`mimetype` stored uncompressed at offset `0`, `kdna.json`, stored `sections/pack-N.kdnab` CBOR frames or encrypted `payload.kdnab`, `checksums.json`, optional `signature.kdsig` & `attachments/`) |
| **Judgment Payload** | `kdna.payload.judgment` `0.5.1` (`kdna.r2-semantics/1`) | Scoped judgments (`focus`, `core_expression`, `method` with language-neutral ASCII `method_roles`, `boundaries`, `exceptions`, `misuse`, `reasons`, `materials`, `shared_declarations`, `sources`, `relationships`) |
| **Canonical IR** | `kdna.canonical-ir/0.6.1` | Deterministic typed node graph (`asset_index`, `catalog`, `mandatory_closures`, `expansion_targets`, RFC 8785 JCS SHA-256 `ir_digest`) |
| **Selective Read Protocol** | `kdna.read/0.7.0-candidate` (native sections) / `kdna.read/0.6.4` (base) | Progressive disclosure (`catalog` → `exact_selection` with mandatory `support`/`qualify`/`conflict` closure → `expand` handles) under explicit Host permission and byte budgets |
| **Local Password Encryption** | `kdna.encryption.password` / `kdna.envelope.aead` ([`RFC-0018`](rfcs/RFC-0018-envelope-aead.md)) | Account-free offline protection: `scrypt-sha256` or `argon2id` KDF → `AES-256-KW` CEK wrapping → `AES-256-GCM` AEAD payload encryption bound to manifest AAD |
| **Optional Offline Signature** | `kdsig.ed25519` ([`RFC-0021`](rfcs/RFC-0021-signature-track.md)) | Optional Ed25519 signature bundle (`signature.kdsig`), verified offline and fail-closed when present |

```mermaid
flowchart LR
  subgraph Container["Immutable .kdna Container (0.6.0)"]
    M["mimetype (stored)"]
    J["kdna.json (Manifest + Section Table)"]
    S["sections/pack-N.kdnab (CBOR Frames)"]
    E["payload.kdnab (RFC-0018 AEAD Envelope)"]
    C["checksums.json / signature.kdsig"]
  end
  subgraph Core["@aikdna/kdna-core"]
    A["Container & Digest Admission (A / C / E)"]
    K["RFC-0018 Unlock (scrypt/argon2id + AES-256-KW + AES-256-GCM)"]
    IR["Canonical IR 0.6.1 + R2 Closure"]
  end
  subgraph Read["@aikdna/kdna-read + Host Gate"]
    CAT["catalog (question index)"]
    SEL["exact_selection (Selected + Mandatory Closure)"]
    EXP["expand (Deferred Handle Resolution)"]
  end
  M & J & S & C --> A --> IR
  E --> K --> A
  IR --> CAT --> SEL --> EXP
```

---

## 2. Distribution Container (`0.6.0`)

A `.kdna` work is one immutable ZIP archive whose first entry MUST be `mimetype`, stored without compression (method `0`) at offset `0`, containing the exact UTF-8 bytes:

```text
application/vnd.kdna.asset
```

### Standard Entries

| Entry | Role |
| --- | --- |
| `mimetype` | Unambiguous format identification (`application/vnd.kdna.asset`) |
| `kdna.json` | Manifest: asset identity, versions, creator/license metadata, compatibility tuple, section layout/tables (public `0.6.0`) or protection envelope metadata (encrypted `0.6.0`) |
| `sections/pack-N.kdnab` | CBOR-framed section packs storing structured judgments, materials, declarations, relationships, and precomputed indices (unencrypted `0.6.0`) |
| `payload.kdnab` | Encrypted AEAD envelope (`RFC-0018`) for password-protected or licensed works |
| `checksums.json` | Per-entry SHA-256 integrity manifest and canonical runtime entry-set digest (**E**) |
| `signature.kdsig` | Optional Ed25519 signature bundle; if present, verification failure MUST reject the asset |
| `attachments/` | Optional supplementary files governed by manifest and loader policy |

Authoring drafts, build logs, credentials, and temporary plaintext MUST NOT appear in a distributed `.kdna` archive. Runtimes MUST reject path traversal and unrecognized top-level authoring files.

---

## 3. Judgment Payload (`kdna.payload.judgment/0.5.1`)

The payload encodes one bounded judgment system with explicit authorship, scope, and relationships:

- **Asset-level declarations**: `highest_question`, `scope`, `kernel` (`purpose`, `foundation_refs`), `shared_declarations` (`worldview`, `value_order`), asset-level `boundaries` (`limit`, `exclude`, `out_of_domain`), `attributions`, `sources`, and `history`.
- **Judgments**: Each judgment unit carries a stable `id`, `focus` (the concrete question it addresses), `scope`, `core_expression`, structured `method` (`components` with language-neutral ASCII `method_roles`), `reasons` (`support` / `calibration`), `materials` (premises, cases, source citations), `boundaries`, `exceptions`, `misuse` warnings, and `result`.
- **Typed relationships**: Explicit links between judgments using four core relationship kinds:
  - `support` (upstream premise supporting a claim)
  - `qualify` (upstream qualifier limiting interpretation)
  - `conflict` (explicit tension between two competing judgments)
  - `complement` (related peer perspective kept in the catalog without bloating context)

Loaders MUST preserve every selected field verbatim without silently trimming, reordering, or rewriting the author's claims, boundaries, or exceptions.

---

## 4. Integrity Digests & Verification

The specification distinguishes three separate SHA-256 digests:

| Symbol | Scope |
| --- | --- |
| **A** | SHA-256 of the immutable `.kdna` archive bytes |
| **C** | SHA-256 of the decoded canonical judgment payload / IR bytes |
| **E** | Canonical runtime entry-set digest recorded in `checksums.json` |

Validation verifies container layout, manifest schema, payload/section structure, checksums (when present), optional signatures (when present), and compatibility coordinates. Passing format validation confirms byte integrity and schema conformance; evaluating whether a judgment fits a real-world situation always belongs to human reviewers and callers.

---

## 5. Selective Read Protocol (`catalog` → `exact_selection` → `expand`)

Compatible runtimes disclose judgment content progressively under explicit Host consent (`--allow-read`) and declared byte budgets:

1. **`catalog`**: Returns asset metadata and the list of judgment IDs and `focus` questions without dumping full judgment bodies.
2. **`exact_selection`**: Given one or more `judgment_ids`, returns the requested judgment bodies together with their deterministic **mandatory closure**:
   - asset-level shared declarations, foundations, and global boundaries;
   - every upstream `support` and `qualify` judgment;
   - both sides of any `conflict` relationship involving a selected judgment;
   - peer `complement` judgments surfaced as catalog pointers (`outside_selection`) without bloating context.
3. **`expand`**: Resolves optional deferred handles within the same retained session.

Reading a `.kdna` file delivers structured judgment text only. It never grants permission to write files, access networks, or trigger external actions.

---

## 6. Local Password Encryption (`RFC-0018`) & External Grants (`RFC-0019`)

Private `.kdna` works can be encrypted locally with a passphrase (`kdna protect`) without any online account or server:

- **KDF**: `scrypt-sha256` or `argon2id`
- **Key Wrapping**: `AES-256-KW`
- **Payload AEAD**: `AES-256-GCM` bound to manifest Additional Authenticated Data (AAD)
- **Memory discipline**: Decrypted plaintext and content-encryption keys stay in volatile memory and MUST NOT be written to logs, caches, or temporary files.

Unknown crypto profiles, algorithms, AAD fields, or failed authentication tags MUST fail closed. See [`RFC-0018`](rfcs/RFC-0018-envelope-aead.md) and [`RFC-0019`](rfcs/RFC-0019-account-device-external-key-grant.md).

---

## 7. Conformance Suites

A conforming implementation MUST pass the repository's executable test and conformance suites without modifying committed vectors:

```bash
npm test
npm run conformance
npm run conformance:canonical
npm run conformance:envelope-aead
npm run conformance:runtime-contract
npm run audit:post-cutover
```

---

## 8. Historical Note (`0.1.0` & `0.5.0`)

Earlier `0.1.0` (`LoadPlan` / `Runtime Capsule` / CLI `0.36.1`) and `0.5.0` (Studio session) container contracts are preserved in Git history, [`SPEC-INDEX.md`](SPEC-INDEX.md#kdna-public-specification-index), and [`docs/current-release-support.md`](docs/current-release-support.md). All new `.kdna` works use Container `0.6.0`.
