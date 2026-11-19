# KDNA

English | [简体中文](./README.zh.md) · [Website](https://aikdna.com) · [KDNA Reader (macOS)](https://aikdna.com/en/downloads) · [Discussions](https://github.com/aikdna/kdna/discussions) · [Documentation](./docs/start-here.md) · [Status](./docs/status.md)

**An open file format for human thinking, judgment, and taste.**

Prose has documents (`.md`, `.pdf`). Numbers have spreadsheets. Talks have slide decks. Linked pages have HTML, and deterministic logic has code. Yet the way a person or team **thinks, weighs trade-offs, exercises taste, and knows where to stop** has never had an independent file format of its own—dissolving instead into chat logs, scattered notes, and one-off outputs.

As AI makes finished text, interfaces, and code easy to generate, the upstream thinking, judgment, and taste behind them become a **“work” in their own right**. KDNA (`.kdna`) gives that work its own open, portable, versioned file—whether it holds six focused judgments on a single craft or forty-five connected judgments across a full domain. People can open and review it directly in [KDNA Reader](https://aikdna.com/en/downloads), and any compatible AI Agent can read the relevant judgments together with their premises and stop boundaries.

### What a `.kdna` Work Carries

- **Structured judgment, not flat prose** — Each judgment names the concrete question it answers, the core claim, the reasoning and method behind it, real trade-offs, where it applies, where it stops, and common misuses.
- **Selective reading with intact context** — Agents browse the `catalog` first, then load only the relevant judgments via `exact_selection`, with supporting premises, qualifying limits, and conflicting tensions delivered intact.
- **Human-readable and Agent-portable** — One local file opens cleanly in KDNA Reader for human review and runs across Claude Code, Cursor, Codex, OpenCode, Antigravity, or any compatible tool without vendor lock-in.
- **Explicit versions and offline privacy** — Revisions advance cleanly (`1.0.0` → `1.1.0`) and compare in plain text via `kdna diff --format human`. Private works can be password-encrypted offline (`kdna protect`, `RFC-0018`)—**permanently account-free**.

---

## Experience a Real `.kdna` Work

Our first official public judgment work—**KDNA Whitepaper `v1.0.2`** (*《KDNA白皮书》*, authored by Zhang Ling / 张零 · `CC BY 4.0` · `45` connected judgments)—is available in both Chinese and equivalent English `.kdna` editions (open `.kdna` files and `@aikdna/kdna-cli` remain permanently account-free):

- **Chinese `.kdna` (`zh-CN`):** [`kdna-whitepaper-1.0.2.zh-CN.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.zh-CN.kdna) (`2,725,359` bytes · SHA-256 `e344944a53f8d4bb2ca40a8d42bcd3c104e3067bfa92dce99e327cbc5aed40aa`, creator `张零`)
- **English `.kdna` (`en`):** [`kdna-whitepaper-1.0.2.en.kdna`](https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna) (`2,843,386` bytes · SHA-256 `6da515820eed210508d72a4ddbf68f7052cb180afe592c64e85e9a3fbb60c49e`, creator `Zhang Ling`)
- **macOS Desktop App (Apple Silicon, Developer ID Signed & Apple Notarized):** [aikdna.com/en/downloads](https://aikdna.com/en/downloads) (permanently free without usage limits; read local `.kdna` files offline anytime, or sign in with a free `KDNA ID` for the bundled bilingual Whitepaper and synced Judgment Asset Library)
- **Public Reference Repository:** [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) (bilingual `v1.0.2` editions with `v1.0.1` archive, SHA-256 digests, and verification checks)

> **Copy & paste to your Agent (Claude Code / Cursor / Codex / Antigravity; requires Node.js `>=22`):**
> `Download kdna-whitepaper-1.0.2.en.kdna from https://aikdna.com/downloads/whitepaper/v1.0.2/kdna-whitepaper-1.0.2.en.kdna, run npx -y @aikdna/kdna-cli@0.44.0 read kdna-whitepaper-1.0.2.en.kdna --mode catalog --format human --allow-read to browse the 45-question catalog, and then read the relevant judgments for my question via --mode exact_selection --judgment-id <id1,id2> --format human --allow-read (always pass --format human or --compact; do not use whole_asset).`

---

## 30-Second Quickstart

Requires **Node.js `>=22`**. Creation, local password encryption (container `0.6.0`), validation, selective reading, and diffing are **permanently account-free** and work offline once installed:

```sh
# 1. Create a starter draft and pack a 0.6.0 .kdna work
npx -y @aikdna/kdna-cli@0.44.0 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.44.0 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.44.0 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. Validate and read selectively (catalog first, then exact_selection with intact premises)
npx -y @aikdna/kdna-cli@0.44.0 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.44.0 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.44.0 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. Protect locally with a password (offline AEAD encryption; no online account)
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.44.0 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.44.0 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
```

- **Start here:** [Start Here](./docs/start-here.md) · [Why KDNA](./docs/why-kdna.md) · [Authoring Guide](./docs/authoring-guide.md) · [Agent Entry](./docs/agent-entry.md)
- **Protocol & roadmap:** [Core Specification](./SPEC.md) · [Judgment Systems](./docs/judgment-systems.md) · [Core Narrative & Boundaries](./docs/core-narrative-and-boundaries.md) · [Public Roadmap](./docs/public-roadmap.md)

---

## Design Principles

1. **Clear scope of validation.** `kdna validate` verifies file integrity and format structure; whether a judgment fits your real-world situation is always decided by people with evidence and context.
2. **Reading is not action permission.** Reading a `.kdna` file delivers structured judgment text; system permissions (editing files, calling APIs, executing actions) always remain with the user and Host.
3. **Visible evolution.** Updating a work creates an explicit new version (`1.0.0` → `1.1.0`) whose changes can be reviewed directly via `kdna diff --format human`.

---

## Repository Structure & Ecosystem

This repository maintains the open KDNA specifications (Container `0.6.0`, R2 semantic line), conformance test vectors, and reference packages under `packages/`:

| Package / Directory | Role |
| --- | --- |
| [`packages/kdna-core`](./packages/kdna-core) (`@aikdna/kdna-core`) | Container `0.6.0` & `0.5.0` admission, canonical IR, integrity digests, packing, and local password encryption |
| [`packages/kdna-read`](./packages/kdna-read) (`@aikdna/kdna-read`) | Selective Read protocol (`catalog`, `exact_selection` with mandatory context closure, expansion handles, and protected unlock) |
| [`packages/kdna-conformance`](./packages/kdna-conformance) (`@aikdna/kdna-conformance`) | Deterministic conformance test suites and cross-implementation checks |
| [`conformance/`](./conformance) & [`fixtures/`](./fixtures) | Versioned positive and negative `.kdna` test vectors |
| [`specs/`](./specs) & [`rfcs/`](./rfcs) | Normative schemas ([`SPEC-INDEX.md`](./SPEC-INDEX.md#kdna-public-specification-index)) and design RFCs |
| [`examples/native-team-update`](./examples/native-team-update/README.md) | Minimal synthetic `1.0.0` / `1.1.0` fixture pair for testing CLI reading and `kdna diff` |

Companion public repositories and apps:

- [`aikdna/kdna-cli`](https://github.com/aikdna/kdna-cli) — Official CLI (`@aikdna/kdna-cli`) for creating, password-protecting, validating, selectively reading, diffing, and revising Container `0.6.0` works
- [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills) — Agent Skills (`kdna-creator`, `kdna-loader`) and optional local stdio MCP adapter
- [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) — Official public `.kdna` works (including bilingual *KDNA Whitepaper* `v1.0.2`)
- [KDNA Reader](https://aikdna.com/en/downloads) — Free, Apple-notarized macOS desktop app for reading, reviewing, and exploring `.kdna` works

---

## Published Package Coordinates

<!-- release-coordinates:begin source=docs/release-coordinates.json -->
**Current publication state (2026-11-18).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.11` | `latest` | `affd3db862a02daaacd9ada91ec365ff93d9f6c2592e62df9e01888d36bb2e4a` |
| `@aikdna/kdna-read` | `0.13.5` | `latest` | `a7eb0064ad028a73394a4cc9d189dd22f52f046e30a31c6e50bea1490915fc89` |
| `@aikdna/kdna-cli` | `0.44.0` | `latest` | `382cb0fc07935333a2671e28d0ce2af6cd723896dd14ea6e3e2fec79d7608636` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

Agent Skills (`aikdna/kdna-skills`) are delivered from Git, alongside the optional local stdio MCP adapter coordinate recorded in the matrix.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
<!-- release-coordinates:end -->

> **Note:** For all current Container `0.6.0` authoring, local encryption, reading, and diffing, use **`@aikdna/kdna-cli@0.44.0`**. `@aikdna/kdna-studio-cli` and `@aikdna/kdna-studio-core` remain archived legacy Container `0.5.0` packages; see [Current Release Support](./docs/current-release-support.md) and [0.5 → 0.6 Migration Checklist](./docs/migration-checklist.md) for details.

---

## Local Verification & Contributing

```sh
npm ci
npm test
node scripts/render-release-coordinates.mjs --check
node scripts/check-packaged-readme.mjs
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) to contribute, and [`SECURITY.md`](./SECURITY.md) for security reporting.

## License

Code is licensed under [Apache-2.0](./LICENSE). Documentation and example licenses are stated in [`LICENSE-DOCS`](./LICENSE-DOCS) and [`NOTICE`](./NOTICE).
