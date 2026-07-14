# KDNA Runtime Capsule

**Status:** Implemented contract
**Depends on:** [KDNA Asset Container](./container.md) and [KDNA Authorization Contract](./kdna-authorization-contract.md)

## 1. Purpose

The Runtime Capsule is the only KDNA judgment representation intended for
Agents. An Agent MUST NOT read ZIP entries, decode `payload.kdnab`, or interpret
authorization metadata directly. Core performs validation, authorization,
optional in-memory decryption, and profile selection before it emits a Capsule.

A Capsule does not say that an asset is true, good, recommended, or officially
approved. It reports which asset context was loaded and what technical checks
were actually completed.

## 2. Structure

```json
{
  "type": "kdna.context.capsule",
  "version": "1.0",
  "domain": "kdna:example:editorial_judgment",
  "judgment_version": "1.0.0",
  "asset_digest": "sha256:...",
  "signature": {
    "state": "absent"
  },
  "access": "public",
  "risk_level": null,
  "profile": "compact",
  "context": {
    "highest_question": "What editorial decision should be made?",
    "worldview": [
      "Observed task facts remain authoritative."
    ],
    "value_order": ["prevent irreversible harm", "preserve reversibility"],
    "judgment_role": {
      "acts_as": "a scoped editorial authority",
      "does_not_act_as": ["a fact source", "a policy engine"],
      "responsibility": "Resolve qualitative editorial tradeoffs."
    },
    "axioms": [
      {
        "type": "axiom_applicability",
        "id": "a1",
        "statement": "Prefer clarity over ornament.",
        "one_sentence": "Prefer clarity over ornament.",
        "applies_when": [],
        "does_not_apply_when": [],
        "failure_risk": null
      }
    ],
    "boundaries": [],
    "self_checks": [],
    "failure_modes": [],
    "patterns": []
  },
  "trace": {
    "payload_encoding": "cbor",
    "loaded_by": "kdna-core",
    "loaded_at": "2026-07-13T00:00:00Z",
    "schema_valid": true,
    "signature_state": "absent",
    "profile": "compact"
  }
}
```

### Signature state

`signature.state` and `trace.signature_state` use honest facts:

- `verified`: a conforming verifier actually checked the signature;
- `not_checked`: signature metadata exists, but this load did not verify it;
- `absent`: the asset has no signature metadata.

Field presence alone MUST NOT produce `verified`.

## 3. Load Profiles

| Profile | Context | Intended use |
|---|---|---|
| `index` | Public identity and discovery metadata; no judgment | discovery and routing |
| `compact` | Highest question, scoped worldview, ordered values, judgment role, applicability-aware axioms, boundaries, self-checks, failure modes, and a bounded pattern set | default Agent judgment loading |
| `scenario` | Scenario cards | situation-specific loading |
| `full` | Authorized manifest and decoded payload | audit, migration, and deep inspection through trusted applications |

The requested profile MUST control the emitted context shape. Implementations
MUST NOT label one context shape as another profile.

## 4. Consumer Rules

A consuming Agent or application must:

1. obtain the Capsule from Core or an official toolchain adapter;
2. respect the asset's applicability and boundary fields;
3. use the loaded axioms and patterns as judgment context, not as truth claims;
4. treat `worldview`, `value_order`, and `judgment_role` as scoped judgment
   context, not as general facts, hard policy, or a replacement for model capability;
5. run relevant self-checks and account for declared failure risks;
6. keep technical validity, signature state, evidence, maturity, and content
   quality as separate concepts;
7. avoid logging or persisting decrypted full context from licensed assets.

Single-asset loading is the default foundation. Cluster execution composes
multiple authorized asset Capsules through the explicit Cluster runtime; it
does not replace or weaken the single-asset contract.

## 5. Capsule vs Developer Decode

| | Runtime Capsule | Developer decode |
|---|---|---|
| Entry point | `kdna load` | `kdna dev decode --reveal` |
| Intended caller | Agent or application | developer/debugger |
| Authorization | LoadPlan-gated | explicit developer operation, still policy-gated |
| Output | profile-selected context plus trace | decoded payload for inspection |
| Normal production use | yes | no |

## 6. CLI Examples

```bash
# Agent-facing Capsule
kdna load asset.kdna
kdna load asset.kdna --profile scenario

# Discovery without judgment
kdna load asset.kdna --profile index

# Explicit developer inspection; never an Agent shortcut
kdna dev decode asset.kdna --reveal
```
