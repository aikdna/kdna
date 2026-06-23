# KDNA Asset Container
**Status:** Current (GA) — supersedes legacy plaintext ZIP

## 1. Design Principle

The legacy plaintext ZIP format placed `KDNA_Core.json`, `KDNA_Patterns.json`, and other source-tree files directly in the ZIP archive. This meant any generic `unzip` + JSON parser could fully consume KDNA judgment without going through the LoadPlan authorization layer.

The KDNA Asset Container fixes this. The `.kdna` file remains a ZIP container for transport compatibility, but all judgment content is encoded in a single CBOR binary payload (`payload.kdnab`) that requires a KDNA-compatible decoder. Generic tools can inspect the manifest (`kdna.json`) but cannot consume judgment content without going through the `plan-load` → `load` path.

**The KDNA Asset Container does not:**
- Provide DRM or copy protection
- Require encryption keys for open access
- Prevent third-party compatible implementations
- Hide the format specification

**KDNA Container does:**
- Establish format sovereignty — `.kdna` is a dedicated asset format, not a renamed ZIP
- Require KDNA-compatible tooling for consumption
- Separate metadata (readable by anyone) from judgment payload (requires decoder)
- Enable signature verification and schema validation as mandatory loading steps

## 2. Three-Layer Architecture

```
Source Tree (authoring)     →    Asset Container (distribution)    →    Runtime Capsule (consumption)
─────────────────────            ────────────────────────              ──────────────────────────
KDNA_Core.json                  domain.kdna                          kdna.context.capsule
KDNA_Patterns.json              ├── mimetype                         Agent never sees raw JSON
KDNA_Scenarios.json             ├── kdna.json          ← metadata    
KDNA_Cases.json                 ├── kdna.index.json    ← index       
KDNA_Reasoning.json             ├── payload.kdnab      ← judgment    
KDNA_Evolution.json             ├── signature.kdsig                  
kdna.json                       └── build-receipt.json               
```

- **Source Tree**: JSON files for human authoring, Git diff, and review. Never distributed as an asset.
- **Asset Container**: `.kdna` file for registry distribution, installation, and verification. Judgment is encoded in `payload.kdnab`.
- **Runtime Capsule**: Structured output from `kdna load` for agent consumption. Agents MUST NOT read raw asset internals.

## 3. Container Structure

### 3.1 Required Entries

| Entry | Encoding | Description |
|-------|----------|-------------|
| `mimetype` | ASCII text | `application/vnd.aikdna.kdna+zip` |
| `kdna.json` | UTF-8 JSON | Public manifest and metadata. MUST NOT contain judgment content (axioms, ontology, patterns, etc.) |
| `payload.kdnab` | CBOR (RFC 8949) | Encoded judgment payload. Contains all domain judgment data. |
| `signature.kdsig` | UTF-8 JSON | Ed25519 signature over canonical payload digest |
| `build-receipt.json` | UTF-8 JSON | Build provenance, compiler metadata, content digest |

### 3.2 Optional Entries

| Entry | Encoding | Description |
|-------|----------|-------------|
| `kdna.index.json` | UTF-8 JSON | Pre-computed routing index for `kdna available` / `kdna match`. Never contains full judgment. |
| `README.md` | UTF-8 text | Human-readable domain description |

### 3.3 Forbidden Entries

The following entries MUST NOT exist in a v2 `.kdna` asset. Their presence indicates a V1 plaintext (removed) container and the asset MUST be rejected.

- `KDNA_Core.json`
- `KDNA_Patterns.json`
- `KDNA_Scenarios.json`
- `KDNA_Cases.json`
- `KDNA_Reasoning.json`
- `KDNA_Evolution.json`

## 4. kdna.json Manifest (v2)

The manifest remains plaintext JSON inside the container. It MUST NOT contain any judgment content.

```json
{
  "format": "kdna",
  "format_version": "2.0",
  "spec_version": "2.0",
  "name": "@scope/domain",
  "version": "1.0.0",
  "judgment_version": "2026.06",
  "domain_id": "domain_name",
  "asset_uid": "uuidv7",
  "project_uid": "uuidv7",
  "build_id": "build_xxx",
  "description": "What judgment this domain improves",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "CC-BY-4.0" },
  "status": "stable",
  "quality_badge": "tested",
  "access": "public",
  "languages": ["zh-CN"],
  "default_language": "zh-CN",
  "source_mode": "blank",
  "risk_level": "R1",
  "keywords": ["communication", "judgment"],
  "container": {
    "type": "kdna-container-v2",
    "payload": "payload.kdnab",
    "payload_encoding": "cbor",
    "payload_schema": "kdna-payload-v2",
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

- `format_version` MUST be `"2.0"` for v2 containers
- `container.type` MUST be `"kdna-container-v2"`
- `container.payload` MUST be `"payload.kdnab"`
- `container.payload_digest` MUST be the SHA-256 of the encoded payload bytes
- The manifest MUST NOT contain `axioms`, `ontology`, `frameworks`, `core_structure`, `stances`, `terminology`, `misunderstandings`, `self_check`, `scenes`, `cases`, `reasoning_chains`, `stages`, or any other judgment content fields

## 5. payload.kdnab Format

### 5.1 Envelope

The payload is a single CBOR map with the following structure:

```
CBOR Map {
  "kind": "kdna.payload" (string)
  "payload_version": "2.0" (string)
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
- MUST use canonical CBOR (RFC 8949 §3.9) for deterministic encoding
- JSON field names are preserved as-is (no binary key shortening)
- String values use UTF-8
- The `profiles` section MAY contain pre-rendered context for performance, but the canonical source is `judgment`

### 5.3 CBOR Library Recommendations

| Language | Library |
|----------|---------|
| JavaScript/Node.js | `cbor` (npm) or `cbor-x` |
| Python | `cbor2` |
| Swift | `SwiftCBOR` or `CBORCoding` |
| Rust | `ciborium` |
| Go | `fxamacker/cbor` |

## 6. kdna.index.json (Optional)

Pre-computed index for fast domain discovery without decoding the full payload.

```json
{
  "name": "@scope/domain",
  "version": "1.0.0",
  "description": "...",
  "core_insight": "...",
  "keywords": ["communication"],
  "applies_when": ["user asks about communication", "..."],
  "does_not_apply_when": ["pure grammar check"],
  "failure_risks": ["misclassifying structural issues as word choice"],
  "risk_level": "R1",
  "signature_valid": true,
  "asset_digest": "sha256:..."
}
```

The index MUST NOT contain full axiom text, ontology definitions, framework steps, or any other judgment content. It contains only routing/discovery metadata.

## 7. Loading Behavior

### 7.1 kdna load

```
1. Open .kdna ZIP container
2. Read kdna.json manifest
3. Verify format_version = "2.0"
4. REJECT if KDNA_Core.json or any v1 entry is present → ERR_LEGACY_PLAINTEXT_CONTAINER
5. Decode payload.kdnab via CBOR
6. Verify payload_digest matches manifest
7. Verify Ed25519 signature (if present)
8. Run schema validation against judgment content
9. Select load profile (compact/full)
10. Emit Context Capsule
```

### 7.2 Context Capsule

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
    "format": "container-v2",
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

## 8. Rejection Rules

A conforming loader MUST reject:

1. **V1 plaintext (removed) container**: If `KDNA_Core.json` or any v1 judgment entry exists in the ZIP → `ERR_LEGACY_PLAINTEXT_CONTAINER`
2. **Missing payload**: If `payload.kdnab` is absent → `ERR_MISSING_PAYLOAD`
3. **Digest mismatch**: If `container.payload_digest` does not match SHA-256 of decoded payload → `ERR_PAYLOAD_DIGEST_MISMATCH`
4. **Schema violation**: If decoded judgment fails schema validation → `ERR_SCHEMA_VALIDATION_FAILED`
5. **Signature invalid**: If Ed25519 signature verification fails → `ERR_SIGNATURE_INVALID` (for quality_badge >= tested)
6. **Yanked**: If manifest `yanked` is true → `ERR_DOMAIN_YANKED`
7. **Judgment in manifest**: If `kdna.json` contains judgment fields (axioms, ontology, etc.) → `ERR_JUDGMENT_IN_MANIFEST`

## 9. Migration from v1

V1 plaintext (removed) `.kdna` files are not valid assets. To migrate:

```bash
# From source tree (recommended):
kdna-studio migrate ./source-dir --out domain.kdna

# From v1 .kdna (recovery):
kdna dev unpack old-domain.kdna            # extract to source tree
kdna-studio migrate ./extracted --out domain.kdna  # rebuild as v2
```

## 10. Reference Implementation Requirements

All KDNA-compatible implementations MUST:

- Reject V1 plaintext (removed) containers
- Decode `payload.kdnab` via CBOR
- Emit context capsules (not raw JSON) from the default load path
- Verify signatures and digests before serving content
- Expose raw payload decode only through dev/debug APIs

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-06-11 | Initial v2 specification. Removes V1 plaintext (removed) JSON entries. Introduces CBOR-encoded payload. Mandates capsule output. |
