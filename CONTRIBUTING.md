# Contributing to KDNA

KDNA is an open judgment protocol. Contributions can be:

- **Eval cases** — test whether a domain's judgment actually transfers
- **Domain proposals** — new judgment domains (start as experimental)
- **Bug reports** — CLI, loader, conformance, or schema issues
- **Docs / tutorials** — make the public path clearer
- **Agent integrations** — adapters for new agent runtimes

## Before You Start

1. Read [Start Here](./docs/start-here.md)
2. Read [State of KDNA](./STATE_OF_KDNA.md) — what's stable, what's not
3. Check [open issues](https://github.com/aikdna/kdna/issues) — especially `good-first-kdna`

## Quick Path

```bash
git clone https://github.com/aikdna/kdna.git
cd kdna
npm ci
npm test                 # 16 kdna-core tests + 31 kdna-eval tests
npm run conformance       # .kdna asset conformance
npm run conformance:phase2 # Phase 2 protocol conformance
```

All tests must pass before submitting a PR.

## What Goes Where

| If you're contributing... | Go to this repo |
|---------------------------|----------------|
| Protocol spec, schemas, conformance | `aikdna/kdna` (this repo) |
| CLI features or fixes | `aikdna/kdna-cli` |
| Agent loader adapters | `aikdna/kdna-skills` |
| Domain authoring tools | `aikdna/kdna-studio-cli` |
| Registry, trust gates | `aikdna/kdna-registry` |
| Eval cases, benchmark runner | `aikdna/kdna-lab` |
| Work Pack definitions | `aikdna/kdna-workpack` |
| New domain | `aikdna/kdna-<domain>` |

## PR Requirements

Every PR must include:

- [ ] **What changed** — one sentence summary
- [ ] **Which repo layer** — protocol / CLI / schema / docs / domain
- [ ] **Tests added** — for code changes
- [ ] **Docs updated** — if behavior, schema, or command output changes
- [ ] **Changelog-worthy** — if yes, note what to add
- [ ] **Breaking change** — if yes, migration path documented

For protocol/schema changes: conformance fixtures must be updated.
For CLI changes: help text, README, and JSON contract must be updated.
For domain changes: evals, limitations, and version must be updated.

## Issue Labels

| Label | Meaning |
|-------|---------|
| `area:protocol` | SPEC, schemas, conformance |
| `area:cli` | kdna-cli runtime commands |
| `area:skills` | Agent loader adapters |
| `area:studio` | Authoring tools |
| `area:registry` | Trust catalog, distribution |
| `area:lab` | Benchmarks, eval infrastructure |
| `area:domain` | Domain judgment assets |
| `area:docs` | Documentation, tutorials |
| `type:bug` | Something is broken |
| `type:feature` | New capability |
| `type:eval-case` | New or improved eval case |
| `type:docs` | Documentation improvement |
| `priority:p0` | Blocking release or user activation |
| `priority:p1` | Important, not blocking |
| `priority:p2` | Nice to have |
| `good-first-kdna` | Suitable for new contributors |

## Review Process

1. Open an issue first for anything larger than a typo fix
2. PRs are reviewed within one week
3. Protocol/schema PRs require 1 maintainer approval
4. Domain PRs require evidence (eval cases, before/after)

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

- Code: Apache-2.0
- Documentation and examples: CC-BY-4.0

By contributing, you agree that your contributions will be licensed under these terms.
