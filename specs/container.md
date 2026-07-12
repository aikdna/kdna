# KDNA Asset Container

**Status:** Current (GA)

## 1. Design Principle

The `.kdna` file is a ZIP container for transport compatibility, but judgment content is encoded in a single CBOR binary payload (`payload.kdnab`) that requires a KDNA-compatible decoder. Generic tools can inspect the manifest (`kdna.json`) but cannot consume judgment content without going through the `plan-load` → `load` path.

**The KDNA Asset Container does not:**
- Provide DRM or copy protection
- Require encryption keys for `public` access
- Prevent third-party compatible implementations
- Hide the format specification

**The KDNA Container does:**
- Establish format sovereignty — `.kdna` is a dedicated asset format, not a renamed ZIP
- Require KDNA-compatible tooling for consumption
- Separate metadata (readable by anyone) from judgment payload (requires decoder)
- Enable signature verification and schema validation as mandatory loading steps

## 2. Three-Layer Architecture

```
Source Tree (authoring)     →    Asset Container (distribution)    →    Runtime Capsule (consumption)
─────────────────────            ────────────────────────              ──────────────────────────
KDNA_Core.json                  domain.kdna                          kdna.context.capsule
KDNA_Patterns.json              ├── mimetype                         Agent never sees raw internals
KDNA_Scenarios.json             ├── kdna.json          ← metadata
KDNA_Cases.json                 ├── kdna.index.json    ← index
KDNA_Reasoning.json             ├── payload.kdnab      ← judgment (CBOR)
KDNA_Evolution.json             ├── signature.kdsig
kdna.json                       └── build-receipt.json
```

- **Source Tree**: JSON files for human authoring, Git diff, and review. Never distributed as an asset.
- **Asset Container**: `.kdna` file for distribution, local receipt, transfer, verification, and runtime loading. Judgment is CBOR-encoded in `payload.kdnab`.
- **Runtime Capsule**: Structured output from `kdna load` for agent consumption. Agents MUST NOT read raw asset internals.

## 3. Container Structure

### 3.1 Required Entries

| Entry | Encoding | Description | Status |
|-------|----------|-------------|--------|
| `mimetype` | ASCII text | `application/vnd.kdna.asset` (no trailing newline) | REQUIRED |
| `kdna.json` | UTF-8 JSON | Public manifest and metadata. MUST NOT contain judgment content (axioms, ontology, patterns, etc.) | REQUIRED |
| `payload.kdnab` | CBOR (RFC 8949) | Encoded judgment payload. Contains all domain judgment data. | REQUIRED |
| `signature.kdsig` | UTF-8 JSON | Ed25519 signature over canonical payload digest | OPTIONAL until 2027-Q1; REQUIRED after |
| `build-receipt.json` | UTF-8 JSON | Build provenance, compiler metadata, content digest | REQUIRED |

> **Signature status note (2026-06-27):** `signature.kdsig` is reserved by the container layout but OPTIONAL in current implementations. The hard cutover date for making it REQUIRED is 2027-Q1. See SPEC §3.2.

### 3.2 Optional Entries

| Entry | Encoding | Description |
|-------|----------|-------------|
| `kdna.index.json` | UTF-8 JSON | Pre-computed routing index. Never contains full judgment. |
| `README.md` | UTF-8 text | Human-readable domain description |

### 3.3 Forbidden Entries

The following entries MUST NOT exist in a KDNA Asset Container:

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- `KDNA_Scenarios.json`
- `KDNA_Cases.json`
- `KDNA_Reasoning.json`
- `KDNA_Evolution.json`

Their presence indicates a legacy plaintext ZIP container and the asset MUST be rejected.

## 4. kdna.json Manifest

The manifest remains plaintext JSON inside the container. It MUST NOT contain any judgment content.

```json
{
  "format": "kdna",
  "kdna_version": "1.0",
  "name": "@scope/domain",
  "version": "1.0.0",
  "judgment_version": "2026.07",
  "asset_id": "@scope/domain",
  "description": "What judgment this domain improves",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "CC-BY-4.0" },
  "status": "stable",
  "access": "public",
  "languages": ["zh-CN"],
  "default_language": "zh-CN",
  "source_mode": "blank",
  "risk_level": "R1",
  "keywords": ["communication", "judgment"],
  "container": {
    "type": "kdna-container",
    "payload": "payload.kdnab",
    "payload_encoding": "cbor",
    "payload_digest": "sha256:abc123..."
  },
  "signature": "ed25519:...",
  "authoring": {
    "created_by": "kdna-studio-cli",
    "compiler": "@aikdna/kdna-studio-core",
    "compiler_version": "1.4.2",
    "human_confirmed": true,
    "human_lock_count": 14,
    "compiled_at": "2026-06-11T10:00:00Z"
  },
  "runtime": {
    "min_runtime_version": "0.3.0",
    "load_contract": "context-capsule-v1"
  }
}
```

### 4.1 Manifest Constraints

- `kdna_version` MUST be present (current value: `"1.0"`)
- `container.type` MUST be `"kdna-container"`
- `container.payload` MUST be `"payload.kdnab"`
- `container.payload_digest` MUST be the SHA-256 of the encoded CBOR payload bytes
- The manifest MUST NOT contain `axioms`, `ontology`, `frameworks`, `core_structure`, `stances`, `terminology`, `misunderstandings`, `self_check`, `scenes`, `cases`, `reasoning_chains`, `stages`, or any other judgment content fields

## 5. payload.kdnab Format

### 5.1 Envelope

The payload is a single CBOR map:

```
CBOR Map {
  "kind": "kdna.payload" (string)
  "payload_version": "1.0" (string)
  "domain": {
    "name": "@scope/name" (string)
    "version": "1.0.0" (string)
  }
  "judgment": {
    "core": { ... }            // KDNA_Core.json content
    "patterns": { ... }        // KDNA_Patterns.json content
    "scenarios": { ... }       // KDNA_Scenarios.json content (optional)
    "cases": { ... }           // KDNA_Cases.json content (optional)
    "reasoning": { ... }       // KDNA_Reasoning.json content (optional)
    "evolution": { ... }       // KDNA_Evolution.json content (optional)
  }
  "profiles": {
    "compact": { ... }         // Pre-rendered compact context
    "full": { ... }            // Pre-rendered full context
  }
  "integrity": {
    "source_tree_digest": "sha256:..." (string)
  }
}
```

### 5.2 Encoding Rules

- MUST use CBOR (RFC 8949) encoding
- JSON field names are preserved as-is (no binary key shortening)
- String values use UTF-8
- The `profiles` section MAY contain pre-rendered context for performance, but the canonical source is `judgment`

### 5.3 CBOR Libraries

| Language | Library |
|----------|---------|
| JavaScript/Node.js | `cbor-x` |
| Python | `cbor2` |
| Swift | `SwiftCBOR` |
| Rust | `ciborium` |
| Go | `fxamacker/cbor` |

## 6. Loading Behavior

### 6.1 kdna load

```
1. Open .kdna ZIP container
2. Read kdna.json manifest
3. Verify mimetype = "application/vnd.kdna.asset"
4. REJECT if KDNA_Core.json or any source-tree judgment entry is present
5. Decode payload.kdnab via CBOR
6. Verify payload_digest matches manifest
7. Verify Ed25519 signature (if present)
8. Run schema validation against judgment content
9. Select load profile (compact/full)
10. Emit Context Capsule
```

### 6.2 Context Capsule

`kdna load` emits a structured capsule, not raw JSON. The default output format:

```json
{
  "type": "kdna.context.capsule",
  "version": "1.0",
  "domain": "@scope/name",
  "asset_digest": "sha256:...",
  "signature": {
    "verified": true,
    "issuer": "ed25519:..."
  },
  "profile": "compact",
  "context": "...",
  "trace": {
    "format": "kdna-container",
    "payload_encoding": "cbor",
    "loaded_by": "kdna-cli",
    "loaded_at": "2026-06-11T10:00:00Z"
  }
}
```

Agents MUST consume capsules. Raw payload decode is only available via:

```bash
kdna dev decode domain.kdna --reveal
```

## 7. Rejection Rules

A conforming loader MUST reject:

1. **Legacy ZIP container**: If `KDNA_Core.json` or any source-tree judgment entry exists in the ZIP
2. **Missing payload**: If `payload.kdnab` is absent
3. **Digest mismatch**: If `container.payload_digest` does not match SHA-256 of decoded payload
4. **Schema violation**: If decoded judgment fails schema validation
5. **Signature invalid**: If Ed25519 signature verification fails
6. **Yanked**: If manifest `yanked` is true

## 8. Reference Implementation Requirements

All KDNA-compatible implementations MUST:

- Reject legacy plaintext ZIP containers (those containing source-tree JSON entries)
- Decode `payload.kdnab` via CBOR
- Emit context capsules (not raw JSON) from the default load path
- Verify signatures and digests before serving content
- Expose raw payload decode only through dev/debug APIs

## 9. Version History

| Date | Changes |
|------|---------|
| 2026-07 | Single-format specification. CBOR payload via `application/vnd.kdna.asset`. |
| 2026-06 | Initial specification. |
