# KDNA Public Roadmap

## One Definition

KDNA (`.kdna`) is an open file format and selective reading protocol for expressible human thinking, judgment, trade-offs, boundaries, and taste. It gives a person's or team's judgment an independent file with clear authorship, explicit version lineage, byte integrity, optional local password encryption, and a selective reading contract—so people can read and review it directly in [KDNA Reader](https://aikdna.com/en/downloads), and compatible Agents can read the relevant judgments with their premises and stop boundaries intact.

## Permanently Account-Free Foundation

Public, local, and password-protected (`0.6.0`) `.kdna` creation, local encryption (`kdna protect`), validation, CLI/SDK reading, and Agent consumption are **permanently account-free** and run offline. Desktop **KDNA Reader** (macOS Apple Silicon) remains permanently free—opening the built-in bilingual *KDNA Whitepaper* and local public or password-protected `.kdna` files offline without signing in, with optional free `KDNA ID` sign-in for multi-tab comparison; additional public bilingual exemplar `.kdna` works are distributed account-free via [`aikdna.com/en/explore`](https://aikdna.com/en/explore) and [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets/releases). KDNA does not operate a hosted Web Reader; non-Mac users can use the CLI, local stdio MCP adapter, or static `/explore` web pages.

## Public Ecosystem Responsibilities

| Area | Public Repository / App | Mission |
| --- | --- | --- |
| Protocol & Core | `kdna` (`@aikdna/kdna-core`, `@aikdna/kdna-read`) | Container `0.6.0` schemas, digests, local password protection, selective Read closure, and conformance suites |
| Official CLI | `kdna-cli` (`@aikdna/kdna-cli@0.45.2`) | Author (`init`, `validate-input`, `create`), protect (`protect`), validate, selectively read (`read`), compare (`diff`), and revise (`source-open` / `source-pack`) `.kdna` works |
| Agent Integration | `kdna-skills` | Agent Skills (`kdna-creator`, `kdna-loader`) and optional local stdio MCP adapter |
| Public Works | `kdna-assets` | Openly licensed `.kdna` judgment works (starting with bilingual *KDNA Whitepaper* `v1.0.2`, `CC BY 4.0`) |
| Human Reading | [KDNA Reader for macOS](https://aikdna.com/en/downloads) ([`aikdna/kdna-reader-releases`](https://github.com/aikdna/kdna-reader-releases)) | Free macOS desktop app for reading, reviewing, and exploring `.kdna` works (binary releases & SHA-256 mirror) |
| Archived Legacy Lines | `kdna-studio-*`, `kdna-core-swift`, etc. | Preserved historical `pre-0.6.0` packages; not used for new `0.6.0` works |

Internal web application workspaces, cloud sync infrastructure, and unpublished experiments remain in private repositories outside the public API commitment.

## Current Priorities

1. **Grow high-craft public `.kdna` exemplar works** across real domains (writing craft, visual taste, engineering review, classical single-angle decision frameworks, and everyday standards) that anyone can open in KDNA Reader and test directly with their own AI Agent.
2. **Keep the `0.6.0` authoring, protection, reading, and diffing loop effortless** across CLI, Agent Skills, and KDNA Reader.
3. **Maintain explicit, user-consented Agent workflows** (`kdna-loader` and `kdna-creator`) with transparent asset visibility and zero silent background activation.
4. **Keep every published npm coordinate immutable and byte-verified**, advancing versions only after passing full conformance checks without overwriting existing coordinates.

## Contributing

Contributions should strengthen how judgment works are authored, verified, locally protected, read by humans, or selectively consumed by compatible Agents. See [`CONTRIBUTING.md`](../CONTRIBUTING.md) and [GitHub Discussions](https://github.com/aikdna/kdna/discussions).
