# ADR-006: Naming Convention for "Core" / "v1" / "GA" References

- **Status**: superseded by `docs/version-taxonomy.md`
- **Date**: 2026-06-26
- **Deciders**: KDNA Core team

> **Historical decision record.** The product-generation naming below is no
> longer current guidance. Public documentation now says `KDNA Core` and `KDNA
> Asset Container`, without presenting user-facing V1/V2/V3 generations. Wire
> fields and npm package versions remain independently versioned.

## Context

KDNA documentation, READMEs, CHANGELOGs, and spec files currently mix five different terms for what is essentially the same thing — the current released Core implementation:

| Term used | Example location |
|---|---|
| `KDNA Core` | SPEC.md header |
| `KDNA Core v1` | README.md, RFC-0013 |
| `Core v1` | kdna-cli/README.md |
| `Core GA` | SPEC.md, ecosystem-map.md |
| `v1.0-rc` | RFC headers |
| `v1` (bare) | various CHANGELOGs |

The terms `Core v1`, `KDNA Core v1`, and `v1` are used interchangeably; the term
`Core GA` is used without ever being defined; `v1.0-rc` and `Core v1` are
sometimes used to mean the same release, sometimes different ones.

This is not just cosmetic. The ambiguity makes it impossible to write a single
sentence like "is this version part of Core GA?" without first deciding which
taxonomy to follow. New contributors land in a state of confusion; ADRs cross-
reference each other using different names for the same thing.

This decision was filed but never written: 17 号文档 §11.6 / §13 多次提到
"Core GA 在 9 个仓库中从未定义" / "需要 ADR 写入命名公约"。本 ADR 是
对此的填补。

## Decision

KDNA uses exactly two core-implementation terms, each with a precise meaning.
All other terms are forbidden in new documentation and SHOULD be replaced on
touch.

### Term 1: `KDNA Core`

Generic name for the cross-implementation reference Core. Used in package names
(`@aikdna/kdna-core`), repository names (`aikdna/kdna-core-swift`),
sentence-level references ("KDNA Core is the reference implementation of the
container format"). **By itself, it does not imply a version.**

### Term 2: `KDNA Core v1`

The currently-released Core implementation. A specific API/version. **Always
include the `v1` suffix** when the meaning is "this release". When used in
isolation, `v1` is acceptable as shorthand but a sentence should always use
`KDNA Core v1` at first mention.

### Forbidden terms (replacement required)

| Forbidden | Replace with | Reason |
|---|---|---|
| `Core v1` (without `KDNA` prefix) | `KDNA Core v1` | Ambiguous — could be any project. |
| `Core GA` (without definition) | `KDNA Core v1` (current release) | "GA" was never defined. The "current release" *is* the GA. |
| `v1.0-rc` (referring to a released version) | `KDNA Core v1` or `KDNA Core v1.0-rc-1` (specific) | `v1.0-rc` only refers to pre-GA releases. |
| `v1` (bare, in user-facing docs) | `KDNA Core v1` (first mention) or `KDNA Core` (later) | Bare `v1` is ambiguous about which component. |
| `Core` (bare, in a sentence about KDNA) | `KDNA Core` | Avoid the "the Core" trap. |

### Package / repo / file name exception

The strings `kdna-core`, `kdna-core-swift`, `@aikdna/kdna-core` are
unchanged — they are identifiers, not prose. Likewise `kdna-cli@0.28.x`
remains a version specifier. The ADR applies to **prose**, not to **identifiers**.

### Migration

Existing docs, READMEs, CHANGELOGs, and spec files are not rewritten
retroactively. Changes are made on touch:

- Any new doc, ADR, or CHANGELOG entry MUST follow this ADR.
- Any doc that's touched for an unrelated reason SHOULD replace forbidden
  terms in the same pass.
- Bulk migrations are tracked separately if/when they happen.

## Consequences

Positive:

- A single sentence like "this is part of KDNA Core v1" has an unambiguous
  referent.
- New contributors can use one term and be right.
- ADR cross-references stop being ambiguous.

Negative:

- Internal docs may have inconsistent vocabulary until the migration touches
  them. This is acceptable because the ADR applies to *new* content; legacy
  content is grandfathered.
- Some legacy identifiers still say `v1` (e.g., `KDNA_Core_v1` schema field
  name) — these are wire-format and cannot change without a breaking
  release. They are exempt from this ADR.

## References

- ADR-001: Canonical Access Vocabulary
- ADR-002: LoadPlan Schema Authority
- ADR-003: Canonical Distribution Container
- ADR-004: Unified Loading Pipeline
- ADR-005: Crypto Profile Freeze
- 17-kdns-single-source-of-truth.md §11.6: "Core GA 在 9 个仓库中从未定义"
