# Public KDNA Examples

This document defines how KDNA examples may be published without turning KDNA Core into a content ranking system.

## Core Principle

**KDNA Core is a format protocol and toolchain. The public asset is a packaged `.kdna` file. KDNA Core does not define which domains are important, primary, ranked, certified, or officially superior.**

Any `.kdna` file that passes `kdna validate` is valid at the format layer. Trust, quality, evaluation, authorship, and distribution status are separate layers.

## What Public Examples Are

Public examples are packaged `.kdna` files published to demonstrate:

1. **Format usage** — how a real `.kdna` file is structured and loaded.
2. **Toolchain usage** — how to run `validate`, `plan-load`, and `load`.
3. **Judgment effect** — how an agent's classification, boundaries, or self-checks change after loading.
4. **Interoperability** — how the same `.kdna` works across the supported official toolchain.

## What Public Examples Are Not

- **Ranked primary domains** — the protocol does not rank domains by importance.
- **Canonical authorities** — others may create alternative `.kdna` files for the same area.
- **Endorsed standards** — examples do not certify a domain as universally correct.
- **A registry or marketplace** — the examples surface is static demonstration, not discovery infrastructure.
- **A trust authority** — consumers decide what they trust and why.

## Public Distribution Unit

The public distribution unit is:

```text
asset-name.kdna
+ SHA256
+ version
+ created_by / authoring_path
+ human_confirmed: true | false
+ signature_status: signed | unsigned | absent | unknown
+ quality_label: draft | tested | evaluated
+ validate / plan-load / load commands
+ before/after example
+ applies_when / does_not_apply_when
+ known limitations
```

The primary object is the `.kdna` file. Source JSON directories are internal structure, tool-expanded views, or authoring inputs. They are not the default public distribution form.

## Expanded Views Are Not Separate Assets

A `.kdna` file may be inspected, previewed, unpacked, forked, or adapted through official tooling. The expanded JSON view is an inspection or editing view of the `.kdna` file. It is not a separate official public asset unless explicitly packaged and released as a KDNA project package.

When a `.kdna` file is forked or adapted, the derivative output must become a new `.kdna` file with its own version, creator metadata, lineage, and trust metadata. Human Lock, signatures, quality labels, and official-example status are not inherited automatically.

## Examples Page Boundary

An examples page may show release cards for public `.kdna` examples. It must remain a static demonstration surface. It must not become a registry, marketplace, ranking system, certification system, or trust authority.

"Official example" means the file is published by the KDNA team to demonstrate the format and toolchain. It does not mean the content is universally recommended, certified, superior, or safe for all use cases.

First-stage public examples should normally use `draft` or `tested`. Do not use `evaluated` unless there is a published evaluation report and reproducible test evidence.

## Approval Boundary

Owner approval is required at two levels:

1. **Publishing model approval** — how `.kdna` files are hosted, displayed, downloaded, and described.
2. **Per-asset release approval** — each public `.kdna` file must be approved with its release card, metadata, evidence, boundaries, and download location.

Approval of the publishing model does not authorize unlimited asset publication.
