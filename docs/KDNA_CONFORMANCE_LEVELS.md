# KDNA Conformance Levels

This document defines the independent conformance dimensions for `.kdna` assets. Each dimension is an additive status — none implies or requires another.

## Dimensions (Independent and Additive)

| Level | Meaning | Determined By |
|-------|---------|---------------|
| **Valid KDNA** | Passes `kdna validate` — structurally correct format | Official validator |
| **Toolchain-created KDNA** | Created through official Studio / CLI / SDK | `authoring.created_by` metadata |
| **Agent-authored KDNA** | Created by an AI agent | `authoring.created_by: "agent"` |
| **Human-confirmed KDNA** | Judgment content reviewed and confirmed by a human | `authoring.human_confirmed: true` |
| **Signed KDNA** | Carries an Ed25519 signature over the content tree | `signature` in `kdna.json` |
| **Encrypted KDNA** | Payload entries are encrypted | Encryption envelope metadata |
| **Licensed KDNA** | Carries license/entitlement metadata | License metadata in `kdna.json` |
| **Registry-listed KDNA** | Listed in a domain registry | Registry entry |
| **Externally evaluated KDNA** | A named evaluator published a scoped report | Issuer, exact subject, rubric, method, coordinates, time, and evidence |
| **Reference example KDNA** | Published by a named issuer as a demonstration asset | Issuer publication record; not a Core endorsement |

## Key Rules

1. **Valid KDNA is the only required level.** A `.kdna` file is valid if it passes `kdna validate`.
2. **All other levels are optional enhancements.** They can be combined independently.
3. **No level implies another.** A Valid KDNA may be unsigned, unencrypted, agent-authored, and not registry-listed — and that is fine.
4. **Adoption is a consumer decision.** External assessments remain
   issuer-scoped and do not become Core quality, risk, trust, recommendation,
   certification, or production-readiness fields.

## Example Combinations

```
Valid KDNA (minimum)
Valid + Agent-authored + Toolchain-created
Valid + Human-confirmed + Signed + Evaluated
Valid + Signed + Encrypted + Licensed + Registry-listed + Evaluated
Valid + Agent-authored + Reference example
```

## What "Valid" Means

A `.kdna` file is **valid** when:

- Container structure is correct (mimetype, kdna.json, payload.kdnab)
- `kdna.json` manifest schema passes
- Content tree is structurally complete
- Cross-file references are consistent
- No prohibited fields or structures

## What "Valid" Does NOT Mean

- The judgment is correct or high-quality
- The author is trustworthy
- The asset is recommended for production use
- The asset has been reviewed by anyone
- The asset is "official" or "approved"
