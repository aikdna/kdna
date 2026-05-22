# Registry Policy

> [中文版](./registry-policy.zh.md)

This document defines the criteria a domain KDNA repository must meet to be listed in the canonical [kdna-registry](https://github.com/aikdna/kdna-registry).

KDNA is a **protocol**, not a content library. The main repository ([KDNA](https://github.com/aikdna/KDNA)) defines the standard. Domain repositories encode domain cognition. The registry is the link between them — it is a curated index, not an automatic listing.

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

## Quality Governance

Beyond basic inclusion, the registry supports a four-tier quality governance system.

### Tier 1: Structural Inclusion

A domain that meets all the criteria above is eligible for registry listing with `quality_badge: untested`.

### Tier 2: Judgment Inclusion

To advance beyond `untested`, a domain must demonstrate that it encodes genuine judgment, not placeholder content. Required:
- Clear `core_insight` in kdna.json
- At least 2 axioms with non-trivial `one_sentence`, `full_statement`, and `why`
- At least 2 misunderstandings with `key_distinction`
- Explicit `boundaries`
- Yes/no answerable `self_check` items

### Tier 3: Evaluation Inclusion (quality_badge: tested)

A domain reaches `tested` status when it has measurable eval evidence. Required:
- `evals/` directory with at least 10 standardized eval cases
- All evals conform to `schema/eval.schema.json`
- Evals cover core cases, boundary cases, failure cases, and excluded cases

### Tier 4: Badge Promotion

| Badge | Requirement |
|-------|------------|
| `untested` | Meets structural inclusion (Tier 1) |
| `tested` | Has ≥10 evals (Tier 3) |
| `validated` | Has ≥30 evals + blind review + raw outputs + benchmark report |
| `expert_reviewed` | validated + at least one external domain expert review, reviewer identity public |
| `production_ready` | expert_reviewed + real-world usage data from at least one independent deployment + multi-model stability evidence |

quality_badge MUST NOT be self-declared. It MUST be verified by `kdna verify --judgment` based on eval coverage and governance completeness. Registry maintainers may override the automated suggestion.

## Domain Status

Each entry also carries a `status` field, independent of `quality_badge`:

| Status | Meaning |
|--------|---------|
| `draft` | Initial structure, not yet ready for use |
| `experimental` | Usable, but structure may change significantly |
| `stable` | Fields and core judgments are stable |
| `deprecated` | No longer recommended, kept for reference |

Access mode is a separate field:

| Access | Meaning |
|--------|---------|
| `open` | Free to use, modify, and redistribute |
| `licensed` | Requires a license for commercial use |
| `runtime` | Only accessible via runtime API, not downloadable |

## Adding a Domain

1. Create a public GitHub repository under `aikdna/` with the naming convention `kdna-<domain>`.
2. Ensure it meets all inclusion criteria above.
3. Open a pull request to the `kdna-registry` repository that adds an entry to `domains.json`.
4. The PR description must include a brief summary of the domain, its boundary, and a statement confirming compliance with the criteria.

The PR will be reviewed against the inclusion criteria. Acceptance does not imply endorsement of the domain content — only that it meets the structural and governance requirements for the index.
