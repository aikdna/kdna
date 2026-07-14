# Payload Profile v1 (`judgment-profile-v1`)

The payload is the actual judgment data. Its **shape** is defined by a payload profile. Phase 1 defines exactly one profile, **`judgment-profile-v1`**, which is the minimum structure that an agent can load and reason over.

The authoritative schema is [`schema/payload-profile-v1.schema.json`](../../schema/payload-profile-v1.schema.json).

## Top-level shape

A `judgment-profile-v1` payload is a single JSON object with the following sections:

| Section | Type | Phase 1 requirement |
| --- | --- | --- |
| `profile` | string constant | Required. MUST be the literal string `"judgment-profile-v1"`. |
| `core` | object | Required. Holds the central axioms and boundaries. |
| `patterns` | array | Optional. Phase 1 allows an empty array. |
| `scenarios` | array | Optional. Phase 1 allows an empty array. |
| `cases` | array | Optional. Phase 1 allows an empty array. |
| `reasoning` | object | Optional. Holds self-checks and failure modes. |
| `evolution` | object | Optional. Holds changelog and version notes. |

## `core` section

```json
{
  "highest_question": "",
  "worldview": [],
  "value_order": [],
  "judgment_role": {},
  "axioms": [],
  "boundaries": [],
  "risk_model": {}
}
```

- `highest_question` (string, required): the single most important question this judgment system answers. Producers SHOULD populate it. Phase 1 does not enforce non-empty.
- `worldview` (array of strings, optional): scoped assumptions used for qualitative tradeoffs; these are not general facts.
- `value_order` (ordered array of strings, optional): qualitative priorities in descending order. This is not a deterministic policy table.
- `judgment_role` (object, optional): what authority the asset acts as, what it does not act as, and its responsibility.
- `axioms` (array, required): the list of axioms. Phase 1 accepts an empty array.
- `boundaries` (array, optional): explicit out-of-scope statements.
- `risk_model` (object, optional): structural risk metadata.

The minimum valid `core` object is `{ "highest_question": "", "axioms": [] }`. The keys MUST be present; the values MAY be empty.

## `reasoning` section (optional)

```json
{
  "self_checks": [],
  "failure_modes": []
}
```

Both arrays are optional within the section.

## `evolution` section (optional)

```json
{
  "changelog": [],
  "version_notes": []
}
```

Both arrays are optional within the section.

## Minimal valid payload

```json
{
  "profile": "judgment-profile-v1",
  "core": {
    "highest_question": "",
    "axioms": []
  }
}
```

This is the **smallest** payload that conforms to the schema. The conformance suite in Phase 1 only requires this shape. Anything more elaborate is allowed but not required.

## Full template

```json
{
  "profile": "judgment-profile-v1",
  "core": {
    "highest_question": "What is the central question this judgment system answers?",
    "worldview": ["A scoped assumption used for this domain's tradeoffs."],
    "value_order": ["first priority", "second priority"],
    "judgment_role": {
      "acts_as": "a scoped judgment authority",
      "does_not_act_as": ["a fact source", "a policy engine"],
      "responsibility": "Resolve qualitative tradeoffs inside the declared scope."
    },
    "axioms": [
      {
        "id": "a1",
        "one_sentence": "Axiom statement in one sentence."
      }
    ],
    "boundaries": [
      {
        "id": "b1",
        "scope": "Where this judgment applies",
        "out_of_scope": "Where it does not"
      }
    ],
    "risk_model": {
      "default_risk": "R0"
    }
  },
  "patterns": [
    {
      "id": "p1",
      "name": "Pattern name",
      "description": "What the pattern recognizes"
    }
  ],
  "scenarios": [
    {
      "id": "s1",
      "title": "Scenario title",
      "trigger": "When this scenario applies"
    }
  ],
  "cases": [
    {
      "id": "c1",
      "title": "Case title",
      "input": "Input that produced the case",
      "expected_judgment": "What the system should conclude"
    }
  ],
  "reasoning": {
    "self_checks": ["Did I check X?"],
    "failure_modes": [
      {
        "id": "f1",
        "description": "What can go wrong",
        "mitigation": "How to recover"
      }
    ]
  },
  "evolution": {
    "changelog": [
      {
        "version": "1.0.0",
        "date": "2026-06-16",
        "changes": "Initial release"
      }
    ],
    "version_notes": []
  }
}
```

## Why `judgment-profile-v1` is explicit

A previous design allowed the payload to be any JSON object. That forced every loader to learn a custom schema for every asset, and made the "what is a valid judgment asset?" question impossible to answer statically. By pinning a single profile, the format gains a **conformance target**: a tool can claim to be a conforming KDNA loader and validate against this profile. The `profile` field is a wire-level schema discriminator, not a user-facing container generation.

## What this profile does NOT define

- It does not define a domain ontology or a category system. A `judgment-profile-v1` asset about safety and an asset about cooking use the same shape; the meaning comes from the prose in `axioms`, `scenarios`, and `cases`.
- It does not define evaluation, scoring, or grading. The payload is the **thing to be judged**, not the judgment of the thing.
- It does not require encryption. Encryption is a per-entry property in the container; the profile is content-shape-agnostic.
