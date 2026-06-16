# KDNA Runtime Capsule

**Version:** 1.0  
**Status:** Draft  
**Depends on:** [KDNA Container v2](./container-v2.md)

## 1. Purpose

The Runtime Capsule is the ONLY format agents should consume KDNA judgment in. Agents MUST NOT read raw asset internals (JSON files, CBOR payloads, or ZIP entries). The capsule is a verified, validated, profile-selected context object emitted by `kdna load`.

## 2. Capsule Structure

```json
{
  "type": "kdna.context.capsule",
  "version": "1.0",
  "domain": "@scope/name",
  "judgment_version": "2026.06",
  "asset_digest": "sha256:abc123...",
  "signature": {
    "verified": true,
    "issuer": "ed25519:abc123..."
  },
  "access": "open",
  "risk_level": "R1",
  "profile": "compact",
  "context": {
    "system_preamble": "You are applying judgment from @scope/name. ...",
    "axioms": [
      "one_sentence statement 1",
      "one_sentence statement 2"
    ],
    "value_order": ["value1", "value2"],
    "ontology": ["concept: definition"],
    "terminology": {
      "preferred": ["term → definition"],
      "banned": ["term → replacement (reason)"]
    },
    "misunderstandings": ["wrong belief → correct understanding"],
    "self_check": ["question 1?", "question 2?"],
    "boundaries": ["domain applies when ...", "domain does NOT apply when ..."]
  },
  "trace": {
    "format": "container-v2",
    "payload_encoding": "cbor",
    "loaded_by": "kdna-cli v0.20.0",
    "loaded_at": "2026-06-11T10:00:00Z",
    "schema_valid": true,
    "signature_valid": true
  }
}
```

## 3. Load Profiles

| Profile | Description | Use Case |
|---------|-------------|----------|
| `compact` | One-line axioms, key terms, core boundaries, critical self-checks. ~500-1500 tokens. | Default agent loading. |
| `full` | Full axiom statements, complete ontology, all terminology, all misunderstandings, all self-checks. | Deep domain analysis. |
| `index` | Metadata only: name, version, description, keywords, applies_when, does_not_apply_when. Zero judgment content. | Domain discovery (`kdna available`, `kdna match`). |

## 4. Agent Contract

Agents loading KDNA via this capsule agree to:

1. **Adopt axioms as reasoning frame** — reason from them, not around them
2. **Honor boundaries** — apply axioms only when `applies_when` matches and `does_not_apply_when` does not
3. **Pre-check failure risks** — before output, verify the response does not commit warned failures
4. **Use preferred terminology** — substitute banned terms with preferred ones
5. **Run self-checks** — before final output, answer all self-check questions
6. **Never cite KDNA to user** — the user sees better judgment, not KDNA internals

## 5. Capsule vs Raw Payload

| | Context Capsule | Raw Payload |
|---|----------------|-------------|
| **Access** | `kdna load` | `kdna dev decode --reveal` |
| **Intended for** | Agents | Developers, debuggers |
| **Format** | Structured JSON with context fields | CBOR-decoded judgment map |
| **Signature verified** | Yes | Optional |
| **Schema validated** | Yes | Optional |
| **Profile selected** | Yes | No (full content) |

## 6. CLI Commands

```bash
# Agent consumption (capsule):
kdna load @scope/name                    # compact profile
kdna load @scope/name --profile full     # full profile

# Dev/debug (raw payload):
kdna dev decode domain.kdna --reveal     # full decoded payload

# Discovery (index only, no judgment):
kdna available --json                    # index-level metadata
kdna match "user's task description"     # routing from index
```
