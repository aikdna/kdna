# Registry Is Optional

> **Status: Historical.** Registry is not part of the current KDNA Core protocol.
> See [decisions/0003](../decisions/0003-no-registry-in-v1-core-ga.md).
> The current distribution path is direct `.kdna` file sharing via GitHub Releases (see `OPEN/kdna-assets/` for the public distribution model).

This document defines the relationship between KDNA format validity and domain registries.

## Core Principle

**A `.kdna` file is valid if it passes `kdna validate`. Registry listing is an optional distribution and discovery channel — it does not affect format validity.**

## Registry Role

A KDNA registry is a machine-readable index of available `.kdna` assets. Its purpose is:

- Discovery — helping users find relevant domains
- Distribution — providing download/install URLs
- Optional metadata — surfacing quality badges, eval reports, publisher info

## What Registry Does NOT Do

- ❌ Determine format validity — `kdna validate` does that
- ❌ Authorize creation — any entity can create valid `.kdna` files
- ❌ Grant trust — trust is a consumer decision, not a registry function
- ❌ Define canonical domains — no domain is "more official" because it is listed

## Distribution Channels

All distribution channels are equal peers:

| Channel | Example |
|---------|---------|
| **Local file** | `kdna load ./my-domain.kdna` |
| **URL** | `kdna install https://example.com/domain.kdna` |
| **Custom registry** | `kdna install --registry https://my-registry.com/domains.json my-domain` |
| **Team-maintained source** | `kdna install --source team my-domain` |
| **Private repository** | Direct file distribution within an organization |

## Historical Note

The `kdna/registry/` directory in the main KDNA repository is a **deprecated historical artifact**. It was used for early CLI/validator development and does not represent the current v1 architecture. Current KDNA Core uses local-first asset loading without a required registry.

## Registry Conformance (For Registry Implementers)

If you implement a KDNA registry:

1. List only `.kdna` assets that pass `kdna validate`
2. Record `asset_digest` for every listed asset
3. Do not present registry listing as an endorsement
4. Allow consumers to add custom registry URLs
5. Do not block loading of unlisted `.kdna` files

Registry listing is additive metadata, not a validity gate.
