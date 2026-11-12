# KDNA

English | [简体中文](./README.zh.md) · [Website](https://aikdna.com) · [KDNA Reader](https://aikdna.com/reader/) · [Documentation](./docs/start-here.md) · [Maturity: Pre-release](./docs/maturity.md)

**Open file format and core reference implementation for expressible judgment and judgment systems.**

Prose has documents (`.md`, `.pdf`). Numbers and models have spreadsheets. Talks have slide decks. Linked pages have HTML, and deterministic logic has code. Yet the way a person or team **thinks, weighs trade-offs, sets boundaries, and exercises taste** has lacked an independent file of its own—dissolving instead into chat logs, scattered prompts, and one-off outputs.

As AI makes finished outputs inexpensive to generate, upstream thinking, judgment, and taste become a **“work” in their own right**. KDNA (`.kdna`) gives that work an open, inspectable, versioned file format that people can read in [KDNA Reader](https://aikdna.com/reader/) and compatible agents can create, password-protect locally, validate, and read with intact boundaries.

> **When simpler tools are enough:** If a plain Markdown note, a few prompt lines, or an existing Skill already solves your task, keep using it. Reach for `.kdna` when a body of judgment needs clear authorship, explicit stop conditions, human review, versioned revision, and portable consumption across tools.

| Dimension | `CLAUDE.md` / System Prompt / Plain Markdown | `.kdna` Judgment Work |
| --- | --- | --- |
| **Structure** | Flat prose; conclusions, stories, and caveats blur together | Explicit questions, claims, reasoning methods, applicable conditions, stop boundaries, and anti-misuse rules |
| **Task Reading** | Dumps the whole note into context or truncates arbitrarily | `catalog` first → `exact_selection` of only the judgments a task needs, keeping mandatory supporting/qualifying closure intact |
| **Evolution** | Silent in-place edits overwrite prior reasoning | Named versions (`1.0.0` → `1.1.0`) inspectable in plain text via `kdna diff --format human` before adoption |
| **Confidentiality** | Plaintext files on disk | Optional local offline password encryption (`kdna protect`, PBKDF2 + AES-256-GCM)—**permanently account-free** |

---

## Experience a Real `.kdna` Work in 10 Seconds (Zero Install)

Our first official public judgment work—**KDNA Whitepaper `v1.0.1`** (*《KDNA白皮书》*, authored by Zhang Ling / 张零 · `CC BY 4.0` · container `0.6.0` · `45` connected judgments)—is available in both Chinese and equivalent English `.kdna` editions:

- **Chinese `.kdna` (`zh-CN`):** `kdna-whitepaper-1.0.1.zh-CN.kdna` (`2,595,031` bytes · SHA-256 `9f01c10bc06771c6d28c0543cda9aa64118ae470d75a0178ea023b73b812a92b`, creator `张零`)
- **English `.kdna` (`en`):** `kdna-whitepaper-1.0.1.en.kdna` (`2,711,958` bytes · SHA-256 `9db199060f5d957b9aaeee38546dfed68b56d9a3a6f479eb2cc93181fba3580e`, creator `Zhang Ling`)
- **Read in Browser (No Account Required · Zero-Egress Sandbox):** [English `v1.0.1`](https://aikdna.com/reader/?sample=kdna-whitepaper-en) · [Chinese `v1.0.1`](https://aikdna.com/reader/?sample=kdna-whitepaper) (includes English/Chinese UI switch and unmodified `.kdna` export)
- **macOS Desktop App (Apple Silicon, Developer ID Signed & Apple Notarized):** [aikdna.com/en/downloads](https://aikdna.com/en/downloads) (supports local `.kdna` inspection plus optional local BYO-API-key AI reading translation)
- **Public Reference Repository:** [`aikdna/kdna-assets`](https://github.com/aikdna/kdna-assets) (`v1.0.0` historical archive retained alongside `v1.0.1` for `kdna diff` review)

> **Copy & paste to your Agent (Claude Code / Cursor / Codex / Antigravity; requires Node.js `>=22`):**
> `Download kdna-whitepaper-1.0.1.en.kdna from https://aikdna.com/reader/samples/kdna-whitepaper-en.kdna, run npx -y @aikdna/kdna-cli@0.43.4 read kdna-whitepaper-1.0.1.en.kdna --mode catalog --format human --allow-read to inspect the 45-question catalog, and then read the relevant judgments for my question via --mode exact_selection --judgment-id <id1,id2> --format human --allow-read (always pass --format human or --compact to keep context lean; do not use whole_asset).`

---

## 30-Second Developer & Agent Quickstart

Requires **Node.js `>=22`**. Every workflow below—creation, local password encryption (container `0.6.0`), validation, scoped reading, and version comparison—is **permanently account-free** and runs offline once installed:

```sh
# 1. Create: generate a runnable starter draft and pack a 0.6.0 .kdna work
npx -y @aikdna/kdna-cli@0.43.4 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.43.4 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.43.4 create --draft draft.json --output my-judgments.kdna --allow-create

# 2. Validate & Read: inspect container integrity, browse the catalog, then read selected judgments with full context
npx -y @aikdna/kdna-cli@0.43.4 validate my-judgments.kdna
npx -y @aikdna/kdna-cli@0.43.4 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.43.4 read my-judgments.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --compact

# 3. Protect locally with a password (offline AEAD encryption; no online account)
printf '%s' 'a long passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.43.4 protect my-judgments.kdna --output locked.kdna --password-file password.txt
npx -y @aikdna/kdna-cli@0.43.4 read locked.kdna \
  --mode exact_selection \
  --judgment-id decision:first-dilemma \
  --allow-read --password-file password.txt --format human
```

- **Agent Entry Point (Claude Code, Codex, Cursor, OpenCode, Antigravity):** Start at [`docs/agent-entry.md`](./docs/agent-entry.md) and [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills).
- **Guides & Architecture:** [Why KDNA](./docs/why-kdna.md) · [Start Here](./docs/start-here.md) · [Core Narrative & Boundaries](./docs/core-narrative-and-boundaries.md) · [Public Roadmap](./docs/public-roadmap.md)

---

## Repository Architecture

This monorepo maintains the open KDNA specifications (**R2** contract line, native execution 0.3.1), conformance vectors, and reference npm packages under `packages/`:

| Package / Directory | Responsibility |
| --- | --- |
| [`packages/kdna-core`](./packages/kdna-core) (`@aikdna/kdna-core`) | Container `0.6.0` & `0.5.0` admission, canonicalization, integrity digests, creation packing, and local password encryption |
| [`packages/kdna-read`](./packages/kdna-read) (`@aikdna/kdna-read`) | Scoped Read protocol (`catalog`, `exact_selection` with mandatory `supports`/`qualifies` context, retained expansion handles, and protected-container admission) |
| [`packages/kdna-conformance`](./packages/kdna-conformance) (`@aikdna/kdna-conformance`) | Deterministic conformance suites and cross-implementation rules |
| [`conformance/`](./conformance) & [`fixtures/`](./fixtures) | Versioned positive/negative `.kdna` fixtures and contract test vectors |
| [`specs/`](./specs) & [`rfcs/`](./rfcs) | Normative specifications ([`SPEC-INDEX.md`](./SPEC-INDEX.md#kdna-public-specification-index)) and design RFCs |
| [`examples/native-team-update`](./examples/native-team-update/README.md) | Minimal synthetic `1.0.0` / `1.1.0` teaching pair (`CC BY 4.0`) illustrating structure and explicit version diffing |

---

## Three Architectural Boundaries

1. **Container validity is not content truth.** Passing `kdna validate` confirms that exact bytes satisfy the container and Read specifications. Whether a judgment is accurate, ethical, or appropriate for your task requires human review and real evidence (see [Maturity & Evidence](./docs/maturity.md)).
2. **Reading content never grants system authority.** Admitting or reading a `.kdna` file delivers structured judgment text; it never authorizes file writes, network requests, payments, external actions, or silent carryover across unrelated tasks.
3. **Revisions never overwrite silently.** Updating a judgment work produces an explicit version (`1.0.0` → `1.1.0`, inspectable via `kdna diff --format human`) so readers and tools can review differences before adopting changes. See [`docs/migration-checklist.md`](./docs/migration-checklist.md) for explicit `0.5.0` → `0.6.0` conversion.

---

## Published Package Coordinates

<!-- release-coordinates:begin source=docs/release-coordinates.json -->
**Current publication state (2026-11-11).** All five stable coordinates are
published from their reviewed source commits, and each published tarball was
re-downloaded from the registry and matched byte for byte against the retained
artifact:

| Package | Version | npm tag | Published artifact SHA-256 |
| --- | --- | --- | --- |
| `@aikdna/kdna-core` | `0.37.10` | `latest` | `29a2500cabfc0cd18e346d6ccfe554944b32eb7d4ef1d07668f0daf7518e4006` |
| `@aikdna/kdna-read` | `0.13.4` | `latest` | `edc3a2eaa2d1a70289cf43bdfa75155f8f0c4913cc9b7f20ea7a681d8f08bde0` |
| `@aikdna/kdna-cli` | `0.43.4` | `latest` | `f5e3f5812f153fedb200c73c8031dc3bf0ae526f870ea1860871105a2b8df527` |
| `@aikdna/kdna-studio-core` | `4.1.0` | `latest` | `76a5e7dcca71b28259e5058d241304912713d72e9defba98ce8a03f7e4d1e22a` |
| `@aikdna/kdna-studio-cli` | `0.14.0` | `latest` | `542270c699eec5cbc468b134b2d7235c312be7551e32f4ce66821b3fb814dfc7` |

MCP remains a Git source channel and adds no npm coordinate in this wave.
Exact source commits, release runs, preserved preview
tags and per-package release identities are in [release-coordinates.json](./docs/release-coordinates.json);
earlier `latest` values stay in the
[distribution history](./docs/current-release-support.md#published-channel-history).
This wave keeps every already-published preview tag unchanged, and **R2** remains a live channel label rather than a relabeled generation.
<!-- release-coordinates:end -->

> **Generation guardrail (`0.6.0` vs. legacy `0.5.0`):** For current container `0.6.0` authoring (`kdna.draft/1` & full `0.6.0`), validation, local password encryption, diffing, and reading, use **`@aikdna/kdna-cli@0.43.4`**. `@aikdna/kdna-studio-cli` and `@aikdna/kdna-studio-core` target the separate **legacy container `0.5.0` session line** and are not used for container `0.6.0` works.

---

## Current source: choose the matching implementation

The [current support and distribution matrix](./docs/current-release-support.md)
and [Core/Read status](./docs/core-read-current-status.md) distinguish source,
package bytes, container contracts and actual public availability. The
published stable
Core `0.37.10` / Read `0.13.4` pair and companion coordinates in the matrix
above are verified against the official registry.

| Entry | Exact published package combination | Supported route |
| --- | --- | --- |
| Core/Read | Core `0.37.10` / Read `0.13.4` | Ordinary and Host-unlocked protected browser SDK; declared Node reference exports; Node >=20 |
| [Native CLI](https://github.com/aikdna/kdna-cli#readme) | CLI `0.43.4` with its own exact Core `0.37.9` / Read `0.13.3` pins | Container `0.6.0`, Read `0.7.0-candidate`: create, save, inspect, validate, retained read and Source revision; Node >=22 |
| [Loader/MCP](https://github.com/aikdna/kdna-skills#readme) | MCP `0.8.0-rc.native-sections.3` with its own native CLI `0.43.4` and Core `0.37.9` / Read `0.13.3` pins | Optional complete-source, operator-bound local stdio Read; named Host delivery/adoption `NOT_RUN` |
| [Studio session](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) | StudioCLI `0.14.0` / StudioCore `4.1.0` on their own pinned Core `0.37.2` / Read `0.11.3` line | Complete-source session creation, revision, save/read/verify and explicit protected export; container `0.5.0`, Read `0.6.4` |

The two container routes (`0.6.0` via `@aikdna/kdna-cli` and `0.5.0` via Studio) have separate reader and source APIs. Native CLI Plan/load remains unavailable; Core `/execution` supplies optional native execution 0.3.1 static Plan/Capsule and Host reference APIs, and full protocol specifications are indexed in [SPEC-INDEX.md](./SPEC-INDEX.md#kdna-public-specification-index). For offline twelve-archive host setup and reproducible scripts, see the [CLI delivery guide](https://github.com/aikdna/kdna-cli/blob/main/docs/native-delivery.md), [author example](https://github.com/aikdna/kdna-cli/blob/main/examples/team-update/README.md), [executable recipe](https://github.com/aikdna/kdna-cli/blob/main/examples/native-workflow.cjs), and [synthetic weekly-update case](./examples/native-team-update/README.md).

The exact published coordinate installs from an empty cache with:

```sh
mkdir kdna-native-example
cd kdna-native-example
npm init -y
npm install --save-exact --ignore-scripts --omit=optional --no-audit --no-fund --registry=https://registry.npmjs.org @aikdna/kdna-cli@0.43.4
node node_modules/@aikdna/kdna-cli/examples/native-workflow.cjs node_modules/@aikdna/kdna-cli/examples/team-update/author.json ./team-update-output
```

Published Core `0.37.0` / Read `0.11.1` retain their own contracts and artifacts.
Historical native CLI `0.39.0-rc.native-sections.2` binds Core
`0.36.0-rc.r2.7` / Read `0.11.0-rc.r2.7`; loading CLI `0.36.1` binds Core
`0.21.0` and `cbor-x` `1.6.4`. Do not inject a new SDK pair into either older
installation. CLI `.2` and `.3` remain published previews; the published stable
line is `0.43.4`, which must not overwrite either preview. The separate Studio ordinary/protected guide
supplies its own preparation, trusted Host/credential boundary and readback
instructions; named Host delivery and independent acceptance remain `NOT_RUN`.
Technical checks and
scripted examples do not establish human confirmation, editorial fitness or
actual task adoption.

---

## Ecosystem

| Repo / Package | Published Status | Purpose |
| --- | --- | --- |
| [kdna-cli](https://github.com/aikdna/kdna-cli) | Published CLI `0.43.4` on `latest`; native previews and the earlier `0.36.1` loading line retained | Native authoring, local password protection, explicit Read, diffing, and Source revision; its own exact Core `0.37.9` / Read `0.13.3` pins |
| [kdna-skills](https://github.com/aikdna/kdna-skills) | Loader/Creator source; MCP `0.8.0-rc.native-sections.3` npm-unpublished by policy, delivered through GitHub releases; historical npm MCP `0.5.0` | Matched published native `0.43.4` / Core `0.37.9` / Read `0.13.3` graph; optional operator-bound local stdio, named Host delivery/adoption `NOT_RUN` |
| [kdna-assets](https://github.com/aikdna/kdna-assets) | Official public `.kdna` reference works (`KDNA Whitepaper` `1.0.1` in Chinese & English, `CC BY 4.0`; `1.0.0` archive retained) | Openly licensed `.kdna` judgment works and container/Read verification suite |
| [kdna-studio-cli](https://www.npmjs.com/package/@aikdna/kdna-studio-cli) | Published StudioCLI `0.14.0` on `latest`; historical npm `0.11.0` and `0.13.0` retained | Legacy container `0.5.0` / Read `0.6.4` terminal session line (not for current `0.6.0` authoring — use `@aikdna/kdna-cli@0.43.4`) |
| [kdna-studio-core](https://www.npmjs.com/package/@aikdna/kdna-studio-core) | Published StudioCore `4.1.0` on `latest`; historical npm `3.0.0` and `4.0.0` retained | Legacy container `0.5.0` Studio session SDK and explicit protected export; its own Host/credential boundary |
| [kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Historical Swift release `v0.21.0`; current source has its own binding | Swift-native Core/Read implementation for Apple platforms |
| [KDNA Reader](https://aikdna.com/reader/) | Live Web Reader + Apple-notarized macOS desktop app (`0.1.0`) | Free, permanently account-free human reading app with *KDNA Whitepaper* `v1.0.1` (`zh-CN` & `en`) built in |

Machine consumers should consult [`ecosystem-manifest.json`](./ecosystem-manifest.json) and [`docs/release-coordinates.json`](./docs/release-coordinates.json). Newcomers can also browse [`docs/start-here.md`](./docs/start-here.md) by goal. Preserved walkthroughs for historical published lines (earlier native previews, `0.36.1`, `0.22.0`, `0.11.0`) live in [`docs/historical-published-lines.md`](./docs/historical-published-lines.md).

---

## Local Verification & Contributing

```sh
npm ci
npm test
node scripts/render-release-coordinates.mjs --check
node scripts/check-packaged-readme.mjs
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for governance and proposal guidelines, and [`SECURITY.md`](./SECURITY.md) for vulnerability reporting.

## License

Code is licensed under [Apache-2.0](./LICENSE). Documentation and example licenses are stated in [`LICENSE-DOCS`](./LICENSE-DOCS) and [`NOTICE`](./NOTICE).
