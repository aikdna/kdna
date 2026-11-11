# KDNA product map

> Last verified: 2026-11-11. Every row states what is live and verifiable today;
> public, local, and password-protected (`0.6.0`) `.kdna` creation and reading
> are permanently account-free.

Several entry points carry similar names and serve distinct roles. This page
summarizes who each one is for, what it does, which container format it supports,
and where to obtain it right now.

| Entry | For whom | What it does | Container format supported | Available now |
| --- | --- | --- | --- | --- |
| **KDNA protocol and specification** (`aikdna/kdna`) | Implementers, authors, reviewers | Defines the container, manifest, payload, Read contract, protection envelope, and conformance suites (`@aikdna/kdna-core`, `@aikdna/kdna-read`) | Container `0.6.0` & `0.5.0` (plus preserved `0.1.0` specifications) | Yes, in this repository and on npm |
| **KDNA CLI** (`@aikdna/kdna-cli`) | Developers and AI agents creating, protecting, and reading `.kdna` works | Official terminal toolchain: `init`, `validate-input`, `compile`, `create`, `protect`, `inspect`, `validate`, `read`, `diff`, `source-open`, `source-pack`, `convert` | Container `0.6.0` (historical `0.36.1` line retains `0.1.0` `pack`/`plan-load`/`load`) | Yes, on npm (`@aikdna/kdna-cli`) and [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) |
| **Agent Skills & Local MCP** (`aikdna/kdna-skills`) | Claude Code, Codex, Cursor, OpenCode, Copilot, Antigravity users | `kdna-creator` (guided interviews, distillation, revisions) and `kdna-loader` (catalog-first selective reading) plus optional local stdio MCP server | Container `0.6.0` via `@aikdna/kdna-cli` | Yes, in [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) |
| **KDNA Reader** (Web + macOS Desktop) | Anyone reading or reviewing a `.kdna` judgment work without developer tooling | Free, permanently account-free human reader with *KDNA Whitepaper* `v1.0.0` (`45` judgments, `CC BY 4.0`) built in, local password unlock (`0.6.0`), EN/ZH UI switch, and read-only original `.kdna` export | Container `0.6.0` (public, local, and password-protected) | **Delivered**: [Web Reader](https://aikdna.com/reader/?sample=kdna-whitepaper) and Apple-notarized Apple silicon macOS desktop app at [aikdna.com/en/downloads](https://aikdna.com/en/downloads) |
| **Static Inspector** (`docs/inspector/index.html`) | Developers needing a low-level container header/digest check | Dependency-free static page inspecting manifest, tuple, catalog, and table digests offline (encrypted payloads are reported as locked; use KDNA Reader or `kdna read --password-file` to unlock) | Container `0.6.0` and older `payload.kdnab` layout | Yes, in this repository |

## Boundaries to keep in mind

- **Permanently account-free:** Creating, password-protecting (`kdna protect`), validating, and reading `.kdna` works in the CLI or KDNA Reader never requires an online account.
- **Read-only inspection:** Both KDNA Reader and Static Inspector leave source `.kdna` bytes untouched; technical validation confirms container structure and digests, not substantive truth or task suitability.
- **Platform scope:** Desktop KDNA Reader is currently signed and notarized for Apple silicon macOS (`arm64`); any modern desktop or mobile browser can open the Web Reader directly.

## Closest entry for a first evaluation

- **Zero-install human reading (10 seconds):** Open [*KDNA Whitepaper* `v1.0.0` in KDNA Reader](https://aikdna.com/reader/?sample=kdna-whitepaper).
- **Developer & Agent CLI quickstart (30 seconds):** Start at [`../README.md`](../README.md#30-second-developer--agent-quickstart) or [`./start-here.md`](./start-here.md).
- **Exact package versions & SHA-256 matrix:** See [`./current-release-support.md`](./current-release-support.md) and [`./release-coordinates.json`](./release-coordinates.json).
