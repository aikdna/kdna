# KDNA Creation Output Boundary

**Status:** Current responsibility boundary

## 1. Purpose

This document separates KDNA Core format validity from the stricter output
contract used by an official KDNA Creation Writer. It does not define an
interview method, content score, author ranking, or KDNA endorsement.

Three independent Creation results exist: `FORMAT_VALID`,
`JUDGMENT_ACCEPTED`, and `APPLICATION_VERIFIED`.

- **Format Valid (`FORMAT_VALID`)** means Core accepted the container, manifest, payload,
  applicable integrity evidence, compatibility, authorization, and projection
  contracts.
- **Judgment Accepted (`JUDGMENT_ACCEPTED`)** means a Creation Engine found sufficient, honest source,
  authority and risk-adaptive semantic-test evidence for its declared creation
  mode and scope.
- **Application Verified (`APPLICATION_VERIFIED`)** means an independent Consumer loaded the exact
  Format Valid asset through the Runtime contract and produced accepted,
  task-scoped semantic-adoption evidence under a frozen plan.

No result implies another. Core owns only Format Valid and MUST NOT report
Judgment Accepted or Application Verified. A Creation Engine MUST NOT treat
successful Core validation as evidence that a person or organization authored,
confirmed, or is represented by an asset. `CREATION_COMPLETE` is a private
Creation aggregate only when all three results bind the same semantic and asset
digests; it is not a Core field.

## 2. Core minimum

A minimum unencrypted judgment asset contains exactly the three required
protocol entries:

```text
mimetype
kdna.json
payload.kdnab
```

`checksums.json` is optional at the protocol layer. Its absence means that the
container carries no declared runtime entry-set digest evidence; it is not a
format error.

`core.highest_question` is also optional for Core format validity. The payload
still contains at least one non-empty judgment axiom and identifies scope
through a highest question, judgment role, boundary, or axiom applicability
condition. Core remains neutral about who created or confirmed that judgment.

## 3. Official Creation Writer output

An exporter that presents itself as an official KDNA Creation Writer emits the
canonical four-entry baseline:

```text
mimetype
kdna.json
payload.kdnab
checksums.json
```

It also emits explicit, non-placeholder authoring semantics sufficient for the
asset's declared task and risk:

- at least one complete judgment axiom.

`core.highest_question`, `core.worldview`, `core.value_order`,
`core.judgment_role`, global boundaries and relations are emitted only when the
authored judgment actually declares them. A Writer MUST NOT invent filler to
make an asset appear structurally richer.

The Writer MUST NOT derive `highest_question` from the first axiom. It MUST NOT
place source material, private evidence, confirmation receipts, semantic-test
reports, build reports, credentials, decrypted plaintext, or passwords into
Runtime entries.

Compilation reports may exist in the Creation Engine workspace. They are not
Runtime entries and cannot become Runtime judgment content.

## 4. Provenance and confirmation

Creator, editor, compiler, signer, confirmer, publisher, and represented
subject are separate roles. Runtime creator provenance remains optional. When
it is unavailable, a writer omits it rather than inventing a placeholder
identity.

No Creation mode synthesizes Human Lock or public human-confirmation evidence.
A human- or organization-confirmed Creation claim requires a private receipt
bound to the exact semantic revision and subject. That receipt constrains the
private Creation acceptance decision; it does not authenticate the actor and
does not become Runtime creator identity, Human Lock, or a public
human-confirmed flag. Core may validate the technical shape of an independently
supplied optional provenance declaration, but it does not decide whether the
real-world confirmation occurred.

## 5. Version and export boundary

- `version` changes for any distributed file or public-metadata release.
- `judgment_version` changes when judgment semantics, relations, scope,
  boundaries, priority, loading condition, or represented subject changes.
- A metadata-only rebuild changes `version` while preserving
  `judgment_version`.

Every successful official Creation Writer export is independently checked
through validate, inspect, LoadPlan, compact load, and full load. Re-import and
semantic round-trip comparison belong to the Creation Engine acceptance
workflow, not to Core format validity.

## 6. Conformance fixtures

The executable Core tests dynamically package two public fixture descriptions:

- `packages/kdna-core/test/fixtures/core-format-minimal.json` proves that a
  three-entry asset without `highest_question` can be Format Valid.
- `packages/kdna-core/test/fixtures/official-creation-output.json` proves the
  four-entry Writer baseline and explicit scoped semantic fields.

The second fixture demonstrates Writer output shape only. It does not claim
Creation Accepted or human confirmation.
