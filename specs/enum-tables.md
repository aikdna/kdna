# KDNA Runtime Manifest Enum Reference

This document is an explanatory index of the current runtime manifest
vocabulary. The canonical machine-readable authority is
[`../schema/manifest.schema.json`](../schema/manifest.schema.json). If prose
and Schema disagree, the Schema controls and this document must be corrected.

## Container and Payload Coordinates

| Field | Current value |
|---|---|
| `format_version` | `0.1.0` |
| `compatibility.profile_version` | `0.1.0` |

## Asset Type

`asset_type` declares how callers interpret the asset payload.

| Value | Meaning |
|---|---|
| `domain` | A judgment domain asset. |
| `cluster` | A composed cluster asset. |
| `tool` | A tool-oriented asset. |
| `sample` | A public example asset. |
| `fixture` | A conformance or test fixture. |
| `bundle` | A bundle-profile asset. |

## Payload Profile

| Value | Meaning |
|---|---|
| `kdna.payload.judgment` | Judgment payload profile. |
| `kdna.payload.bundle` | Bundle payload profile. |

The distributed payload path is `payload.kdnab`. Its only accepted encoding is
`cbor`.

## Access

| Value | Meaning |
|---|---|
| `public` | The asset can be loaded without entitlement input. |
| `licensed` | Loading requires the declared local entitlement flow. |
| `remote` | Loading is mediated by a remote authorization flow. |

Omission defaults to `public`. Explicit empty, null, boolean, numeric, or
unknown values are invalid and MUST NOT be normalized to `public`.

## Creator Type

When optional creator provenance is present, `creator.creator_type` may be one
of:

- `human`;
- `agent`;
- `tool`;
- `organization`.

Creator provenance is not a trust or authorship gate.

## Lineage Type

| Value | Meaning |
|---|---|
| `original` | No declared parent asset. |
| `fork` | Fork of another asset. |
| `adaptation` | Adaptation of earlier material. |
| `translation` | Translation of another asset. |
| `private_variant` | Private variant. |
| `organization_variant` | Organization-specific variant. |
| `course_variant` | Course-specific variant. |

## Validity Is Not Quality

Format validity, loadability, access mode, signature state, behavioral
evidence, and author or publisher maturity claims remain separate facts. KDNA
Core does not convert any of them into a declaration that the asset's judgment
is true, good, recommended, or officially approved.
