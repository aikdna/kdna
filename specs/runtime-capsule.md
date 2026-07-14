# KDNA Runtime Capsule

**Status:** Capsule 1 implemented; Capsule 2 available as an explicit Core
opt-in contract
**Depends on:** [KDNA Asset Container](./container.md) and [KDNA Authorization Contract](./kdna-authorization-contract.md)

Formal schemas:

- [Runtime Capsule 1](./runtime-capsule-1.schema.json)
- [Runtime Capsule 2](./runtime-capsule-2.schema.json)
- [Digest Evidence](./digest-evidence.schema.json)

## 1. Purpose

The Runtime Capsule is the only KDNA judgment representation intended for
Agents. An Agent MUST NOT read ZIP entries, decode `payload.kdnab`, or interpret
authorization metadata directly. Core performs validation, authorization,
optional in-memory decryption, and profile selection before it emits a Capsule.

A Capsule does not say that an asset is true, good, recommended, or officially
approved. It reports which asset context was loaded and what technical checks
were actually completed.

## 2. Capsule 1 frozen structure

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
    "worldview": ["Observed task facts remain authoritative."],
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

Capsule 1 `asset_digest` is permanently the runtime entry-set digest E
(`kdna-runtime-entry-set-v1`). It is not the SHA-256 of the final `.kdna`
file. This historical name is frozen for compatibility. Runtime Core computes
E directly from the raw `kdna.json` and `payload.kdnab` bytes even when the
optional `checksums.json` entry is absent; checksum declarations only determine
whether the observation is `matched` or `not_compared`.

### Signature state

`signature.state` and `trace.signature_state` use honest facts:

- `verified`: a conforming verifier actually checked the signature;
- `not_checked`: signature metadata exists, but this load did not verify it;
- `absent`: the asset has no signature metadata.

Field presence alone MUST NOT produce `verified`.

## 3. Capsule 2 opt-in structure

Capsule 2 removes the ambiguous top-level digest and carries three explicitly
named observations:

| Member                      | Basis                       | Meaning                                       |
| --------------------------- | --------------------------- | --------------------------------------------- |
| `digests.asset`             | `kdna-container-bytes-v1`   | A: SHA-256 of exact final `.kdna` bytes       |
| `digests.content`           | `kdna-content-tree-v1`      | C: canonical distributed content tree         |
| `digests.runtime_entry_set` | `kdna-runtime-entry-set-v1` | E: raw Runtime manifest and payload entry set |

Each member records its observed value and a factual comparison. A successful
Capsule 2 contains only `matched` or `not_compared`; a mismatch is evidence for
a blocked load and MUST NOT produce a Capsule. Legacy declaration sources are
named honestly as `checksums.json.asset_digest` or
`kdna.json.authoring.content_digest` rather than relabeled as current fields.
Independent expected A/C/E values use `external_expected`; mismatches block
with `KDNA_ASSET_DIGEST_MISMATCH`, `KDNA_CONTENT_DIGEST_MISMATCH`, or
`KDNA_RUNTIME_ENTRY_SET_DIGEST_MISMATCH`, respectively.
Internal C and E declarations are checked before any independent expectation.
An external match cannot hide a mismatched manifest declaration, checksum
declaration, or conflicting canonical/legacy aliases.

Capsule 2 identity is `asset.asset_id`. A distinct historical Capsule 1
`domain` may appear only as `compatibility.capsule_1_domain`; that member exists
solely for the deterministic v2-to-v1 adapter and has no Capsule 2 identity or
routing authority.

Capsule 2 access is always one of `public`, `licensed`, or `remote`. The frozen
Capsule 1 aliases `open`, `protected`, and `runtime` may appear only as
`compatibility.capsule_1_access`, so the adapter can reproduce the exact
Capsule 1 value. The only valid pairs are `open` with `public`, `protected`
with `licensed`, and `runtime` with `remote`; a mismatched pair is an invalid
Capsule 2. Other access values are never stored there.

Capsule 1 may also carry the frozen extension fields `extends_chain`,
`inheritance_applied`, `resolved_dependencies`, and `rag_isolation_policy`.
Capsule 2 carries those values unchanged under
`compatibility.capsule_1_extensions` solely so the one-way adapter can
reproduce the exact Capsule 1 value. They have no Capsule 2 identity, routing,
digest, or trust authority.

P (`kdna-capsule-jcs-v1`) is SHA-256 over RFC 8785 JCS bytes of the exact
delivered Capsule. P is never embedded in the Capsule it hashes. Host request,
receipt, and Trace integration are later protocol phases.

Core exposes Capsule 2 only through the explicit `loadCapsuleV2()` API. The
existing `loadAuthorized()` route continues to emit the frozen Capsule 1.
Source directories cannot emit Capsule 2 because they have no final byte-stream
identity A. The public Capsule 2 builder fails closed unless its Capsule 1
input agrees with the supplied Runtime manifest on domain, judgment version,
and access, and with digest evidence on E.

## 4. Load Profiles

| Profile    | Context                                                                                                                                                          | Intended use                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `index`    | Public identity and discovery metadata; no judgment                                                                                                              | discovery and routing                                              |
| `compact`  | Highest question, scoped worldview, ordered values, judgment role, applicability-aware axioms, boundaries, self-checks, failure modes, and a bounded pattern set | default Agent judgment loading                                     |
| `scenario` | Scenario cards                                                                                                                                                   | situation-specific loading                                         |
| `full`     | Authorized manifest and decoded payload                                                                                                                          | audit, migration, and deep inspection through trusted applications |

The requested profile MUST control the emitted context shape. Implementations
MUST NOT label one context shape as another profile.

## 5. Consumer Rules

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

## 6. Capsule vs Developer Decode

|                       | Runtime Capsule                     | Developer decode                                 |
| --------------------- | ----------------------------------- | ------------------------------------------------ |
| Entry point           | `kdna load`                         | `kdna dev decode --reveal`                       |
| Intended caller       | Agent or application                | developer/debugger                               |
| Authorization         | LoadPlan-gated                      | explicit developer operation, still policy-gated |
| Output                | profile-selected context plus trace | decoded payload for inspection                   |
| Normal production use | yes                                 | no                                               |

## 7. CLI Examples

```bash
# Agent-facing Capsule
kdna load asset.kdna
kdna load asset.kdna --profile scenario

# Discovery without judgment
kdna load asset.kdna --profile index

# Explicit developer inspection; never an Agent shortcut
kdna dev decode asset.kdna --reveal
```
