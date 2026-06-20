# Reference Assets, Not Flagship Domains

This document clarifies the role of KDNA assets published by the KDNA team.

## Core Principle

**KDNA Core is a format protocol and toolchain. It does not define which domains are important, primary, or "flagship." Any `.kdna` file that passes `kdna validate` is an equal peer in the ecosystem.**

## What Official Reference Assets Are

Reference assets are `.kdna` files published by the KDNA team for:

1. **Teaching** — demonstrating how to create high-quality KDNA domains
2. **Propagation** — showing users what KDNA can do with real examples
3. **Interoperability testing** — ensuring the toolchain works with real judgment content
4. **Community seeding** — providing starting points for community creators

## What Official Reference Assets Are NOT

- ❌ **Flagship domains** — the protocol does not rank domains by importance
- ❌ **Canonical authorities** — community members can create competing domains in the same area
- ❌ **Endorsed standards** — no domain receives official endorsement over alternatives
- ❌ **Exclusive scopes** — `@aikdna/code_review` does not prevent `@community/code_review`

## Domain Scope Is a Namespace, Not Authority

The `@aikdna/` scope prefix indicates the publisher, not domain authority:

| Scope | Meaning |
|-------|---------|
| `@aikdna/` | Published by the KDNA team |
| `@community/` | Published by community members |
| `@yourname/` | Published by you |
| `@company/` | Published by an organization |

All scopes are equal peers. No scope confers special validity or authority.

## Community and Agent Creation

- Community members can create `.kdna` files in any domain area
- Agents can create `.kdna` files through the official SDK
- Third-party tools can produce `.kdna` files validated by the official CLI
- Alternative domains in the same area (e.g., multiple `code_review` domains) are encouraged

## High-Frequency Reference Assets

The official team SHOULD publish many reference assets across high-frequency AI usage scenarios:

- Writing and expression
- Content creation and social media
- Workplace productivity
- Learning and research
- Code and product development
- Design and visual expression
- Life decisions and personal assistance
- Agent execution and safety boundaries

A large, diverse set of reference assets demonstrates the format's versatility and gives users immediate value. The official team should not limit itself to a small number of "flagship" domains.
