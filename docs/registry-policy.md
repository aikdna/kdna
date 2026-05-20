# Registry Policy

> [中文版](./registry-policy.zh.md)

This document defines the criteria a domain KDNA repository must meet to be listed in the canonical [kdna-registry](https://github.com/knowledge-dna/kdna-registry).

KDNA is a **protocol**, not a content library. The main repository ([KDNA](https://github.com/knowledge-dna/KDNA)) defines the standard. Domain repositories encode domain cognition. The registry is the link between them — it is a curated index, not an automatic listing.

The `KDNA/examples/` and `KDNA/registry/` directories are protocol fixtures. They are not the official domain catalog.

## Inclusion Criteria

A domain repository must meet all of the following:

1. **Spec compatibility.** Each KDNA file must declare the spec version in `meta.version`, and the registry entry must declare `spec_version` compatible with a published KDNA spec version.

2. **Validator compliance.** Must pass `kdna-validate` (structural validation) without errors.

3. **Minimum file set.** Must include at least `KDNA_Core.json` and `KDNA_Patterns.json` as defined by the spec.

4. **README required.** Must include a README that explains the domain scope, core insight, and file inventory.

5. **Boundary declaration.** Must state what the domain covers and what it explicitly does not cover.

6. **License.** Must include a license. Content files (KDNA JSON) should use CC BY 4.0 or compatible.

7. **No private data.** Must not contain personal information, proprietary trade secrets, or unlicensed third-party material.

8. **Self-checks.** `KDNA_Patterns.json` must include self-check items answerable with yes or no.

## Domain Status

Each entry in the registry carries a status:

| Status | Meaning |
|---|---|
| `draft` | Initial structure, not yet ready for use. Signals intent only. |
| `experimental` | Usable, but structure may change significantly. Use with awareness. |
| `stable` | Fields and core judgments are stable. Safe for production agents. |
| `deprecated` | No longer recommended. Kept in the index for reference. |

## Adding a Domain

1. Create a public GitHub repository under `knowledge-dna/` with the naming convention `kdna-<domain>`.
2. Ensure it meets all inclusion criteria above.
3. Open a pull request to the `kdna-registry` repository that adds an entry to `domains.json`.
4. The PR description must include a brief summary of the domain, its boundary, and a statement confirming compliance with the criteria.

The PR will be reviewed against the inclusion criteria. Acceptance does not imply endorsement of the domain content — only that it meets the structural and governance requirements for the index.
