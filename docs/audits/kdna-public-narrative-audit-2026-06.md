# KDNA Public Narrative Cross-Repo Audit — June 2026

> **Audit type:** Cross-repo narrative survey. Documents the current
> residue from the older "open protocol / registry / marketplace /
> trust / quality-badge" direction across the KDNA ecosystem.
> **Output of:** PR-98b. **Pairs with:** PR-97 (English top-level
> + docs/core) and PR-98a (Chinese top-level + historical docs).
>
> This document is **read-only**. It does not change any file in any
> repo. It produces a per-file severity table and a recommended
> remediation plan. The actual fixes belong to PR-98c / 98d / 98e
> and must be split by repo group.

Date: 2026-06-17
Author: PR-98b audit pass

## 1. Current positioning (target state)

KDNA Core is the **official KDNA judgment-asset format and runtime
loading contract**.

- `.kdna` assets are created, inspected, protected, loaded, and consumed
  through the **official KDNA toolchain**.
- Third-party products integrate KDNA through the official SDK, CLI,
  Loader, or API.
- KDNA Core is content-neutral. It does not define content quality,
  official recommendation, transaction, rating, or trust endorsement.

The target narrative forbids (in active / endorsement contexts):

- "open protocol" / "open standard" (use "official KDNA toolchain")
- "reference implementation" / "third-party implementation" (use
  "official KDNA toolchain implementation" / "third-party product
  integrates through the official SDK / CLI / Loader / API")
- "registry" / "marketplace" / "store" / "ranking" as active surfaces
- "trusted asset" / "verified" / "certified" / "quality badge" / "best
  practice" as endorsement claims
- "player" / "reader" / "viewer" / "KDNA Viewer"
- Media analogies (MP4 / PDF / DOC / HTTP / JPEG)
- "anyone can implement KDNA" / "any tool conforming to the spec can
  create / load"

The audit classifies each hit as:

- **P0** — README first-screen error. Will be read by every new user
  and will set their mental model wrong.
- **P1** — Core docs error. Affects contributors and agents that read
  secondary docs.
- **P2** — Historical doc or spec that should be archived / marked
  historical. Pollutes context if left as active.
- **P3** — Code comments, test names, package metadata, JSON field
  comments. Low risk, but should be cleaned.

A "negation" hit (e.g. "no registry", "not certified", "no marketplace")
is **not** a finding. The audit only flags active / endorsement usage.

## 2. Methodology

For each repo, a structured search ran across:

```
EN:  reference implementation, third-party implementation, third-party
     can implement, anyone can implement, compatible client,
     compatible authoring tool, open protocol, open standard, official
     registry, publish to registry, install from registry, quality
     badge, quality_badge, high_quality, officially_approved,
     certified judgment, certification, best practice, marketplace,
     App Store, App-Store, trusted asset, trusted domain,
     trusted authors
ZH:  参考实现, 第三方实现, 兼容客户端, 兼容作者工具, 开放协议,
     开放标准, 注册表, 市场, 商店, 可信, 验证, 推荐, 质量徽章,
     认证, 播放器, 阅读器, 像 MP4, 像 PDF, 像 DOC, 发布到 registry,
     安装到 registry
```

Search corpus excluded: `node_modules/`, `.venv/`, `build/`, `dist/`,
`.git/`, `__pycache__/`, `.next/`, `target/`, `.gradle/`, `Pods/`,
`vendor/`. File types: `*.md`, `*.json`, `*.mjs`, `*.js`, `*.ts`,
`*.swift`, `*.py`, `*.toml`, `*.yml`.

Severity was assigned by reading the file context around each hit
and judging whether the term is in an active / endorsement context
(P0/P1/P2/P3) or a negation / disclaimer context (skipped).

## 3. Per-repo findings

### 3.1 aikdna/kdna (the main monorepo)

PR-97 and PR-98a have already cleaned the highest-visibility surfaces:
`README.md`, `docs/core/principles.md`, `docs/core/definition.md`,
`docs/core/terminology.md`, `docs/core/file-format.md`,
`docs/core/load-contract.md`, `docs/core/manifest.md`, `README.zh.md`,
`STATE_OF_KDNA.md` (banner added), and `docs/registry-policy.md`
(moved to `docs/archive/`).

The remaining residue is in deeper docs, RFCs, and specs.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | Already cleaned in PR-97. No active residue. | — | — |
| `docs/GOVERNANCE.md` | "Trust boundary" + "Registry Moderation" + "Official Quality Badges" + risk-level ladder. Whole document is built around the old framework. | P1 | Re-author under the v1 Core positioning. Move to `docs/archive/` if too big to rewrite. |
| `docs/SECURITY.md` | Mentions "registry" as part of the KDNA tooling family. | P3 | Update line: replace "kdna-registry" with the legacy-archive link. |
| `docs/ecosystem-map.md` | "Four-Layer Protocol Stack" / registry-as-layer / kdna-registry as canonical static catalog. | P1 | Re-author under the v1 Core positioning. |
| `docs/judgment-systems.md` | "human-locked" framing / "AI may propose, human judgment must confirm it" / registry framing. | P1 | Re-author or archive. |
| `docs/why-the-name.md` | "open standard" framing + DNA analogy. | P2 | Mark as historical snapshot or rewrite. |
| `docs/kdna-whitepaper.md` | "open standard" framing. | P1 | Mark historical / re-author. |
| `docs/kdna-compatible-certification.md` | "KDNA-Compatible Certification" is the very thing the v1 positioning rejects (certified judgment is out of scope). | P1 | Delete or move to `docs/archive/`. |
| `docs/tools/viewer.md` | "KDNA Viewer" / "Phase 1 reference `inspect` command is a minimal viewer" — both are forbidden. | P1 | Delete. The inspect command is the official inspection surface, not a "viewer". |
| `docs/product-runtime.md` | "reference implementation". | P1 | Replace "reference implementation" with "official KDNA toolchain implementation". |
| `docs/tools/cli.md` | "reference implementation". | P1 | Same fix. |
| `docs/why-the-name.md`, `docs/judgment-systems.md`, `docs/ecosystem-map.md` | "open protocol" / "open standard" framing. | P1 | Rewrite or archive. |
| `docs/audits/rfc-0013-implementation-evidence-pack.md` | "reference implementation" in audit log. | P3 | Leave as historical audit evidence. RFC-0013 is closed. |
| `docs/rfc-status.md` | "reference implementation" in RFC tracking. | P3 | Same. |
| `rfcs/RFC-0009-password-protected-kdna-assets.md`, `rfcs/RFC-0006-provenance-signing-transparency.md` | "compatible client" / "official registry" in RFC body. RFCs are accepted proposals. | P2 | Mark as "RFC, accepted pre-v1; v1 Core positioning supersedes". |
| `rfcs/README.md` | "open protocol" in RFCs index. | P2 | Same. |
| `specs/quality-badge-evidence-gate.md`, `specs/fidelity-protocol.md`, `specs/kdna-asset-card.md`, `specs/kdna-package-format.md`, `specs/container.md`, `specs/enum-tables.md`, `specs/judgment-report-schema.json`, `specs/authorization-subscription-metadata.md`, `specs/kdna-entitlement-api.md`, `specs/cli-license-identity-skeleton.md`, `specs/RFC-0013-judgment-asset-lifecycle.md`, `specs/RFC-0014-kdna-card-v2.md`, `specs/README.md` | Heavy residue: "quality_badge" (25 hits), "marketplace" (14), "trusted asset" (15), "registry" framing throughout. | P1 | Re-author under v1 Core positioning, or mark as "spec, accepted pre-v1; not active v1 spec". |
| `specs/kdna-registry.md` | Entire spec is the registry spec. Out of scope for v1 Core. | P1 | Move to `specs/archive/` or delete. |
| `specs/kdna-registry-ci.md` | "KDNA Registry CI Verification" — the entire purpose is out of scope. | P1 | Move to `specs/archive/`. |
| `tests/registry-trust/run.mjs`, `tests/registry-trust/README.md` | "Registry Trust Model" tests. Test code referencing out-of-scope concepts. | P1 | Move to `tests/archive/` or delete. |
| `docs/local-kdna-home-spec.md`, `docs/SOURCE_DISTILLATION_CONTRACT.md`, `docs/ARCHITECTURE.md`, `docs/authoring-pipeline-principles.md` and `.zh.md`, `docs/getting-started.zh.md`, `docs/V1RC_RELEASE_GATE.md`, `docs/kdna-v1rc-standard-kit.md`, `docs/audits/2026-06-16-repo-compliance.md`, `docs/audits/2026-06-16-rfc-0013-audit-note.md`, `docs/audits/phase-2-rfc-0014-0015-filing.md` | Various residue: "compatible client", "open protocol", "best practice", "quality badge", "registry" (some negated, some active). | P2–P3 | Per-file judgment. Most should be marked historical; some are still load-bearing. |
| `CHANGELOG.md`, `CONFORMANCE.md`, `RELEASE_CHECKLIST_0.9.0.md`, `RELEASE_CHECKLIST_0.9.0.md`, `STATE_OF_KDNA.md` (body, not banner), `CONTRIBUTING.md` | "trusted" / "verified" / "quality badge" / "registry" in historical release records. | P3 | These are historical; the CHANGELOG should not be rewritten. Leave as-is. |
| `python-sdk/kdna/loader.py`, `packages/kdna-core/src/lint-pure.js` | "quality_badge" / "best practice" in code comments. | P3 | Low-priority; clean during PR-99 (Core extraction). |
| `benchmarks/raw/agent_safety/.../*.json` | "best prompt" in benchmark filenames. This is a benchmark term, not a KDNA endorsement. | — | Skip — not the same word. |
| `TRADEMARK.md` (line 102) | "registry governance process". PR-98a repointed the link to the archive. The "registry governance process" wording itself remains. | P3 | Rewrite that line to refer to the archived legacy governance. |
| `FORK_POLICY.md` | "open standard". | P2 | Mark historical or rewrite. |

### 3.2 aikdna/kdna-website

The website is the public face. README and RELEASE_STATUS both
make active claims that conflict with v1 positioning.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | Minimal, OK. | — | — |
| `RELEASE_STATUS.md` | "presents KDNA as an asset-first open protocol with KDNAChat for consuming `.kdna` assets and KDNAStudio for creating them" — old framing. Lists "Viewer, validator, and Studio tools" — viewer is forbidden. Lists "Registry" as a release entry. | P0 | Rewrite under v1 Core positioning. Drop the KDNAChat / KDNAStudio / Registry / Viewer narrative. |
| `src/docs-content.js` | "quality_badge" / "marketplace" / "best practice" / "certification" / "trusted asset" — these are in actual rendered page content. | P0 | Re-author the rendered content. This is the actual public content. |
| `src/pages/domains.js` | "Domains" page (the registry browse UI) is the old registry surface. | P0 | Drop or mark historical. The v1 Core has no registry surface. |
| `src/pages/trust.js` | "Trust" page. | P0 | Drop or mark historical. The v1 Core has no trust endorsement. |
| `src/pages/kdna-file.js` | "trusted" in page name. | P1 | Re-author. |
| `docs/网站页面文案改版建议.md` | "certification" / "marketplace" — old planning notes. | P3 | Leave as internal planning notes. |
| `src/docs-content.js` content keys `GOVERNANCE`, `CANONICAL_AUTHORING_BOUNDARY`, `KDNA_I18N_SPEC`, `KDNA_PRODUCT_CONTRACT`, `KDNA_TRUST_BOUNDARY`, `MEDIA_TYPE`, `PERSONAL_KDNA`, `RISK_POLICY`, `ROADMAP`, `ROUTING`, `SAFETY`, `SECURITY` | Many of these are P0/P1 docs that need re-authoring: "Trust Boundary" (P0), "Quality Badge Binding" (P0), "Registry Moderation" (P0), "Best Practice" (P2). | P0 | Re-author under v1 Core positioning. The `GOVERNANCE` key especially. |

### 3.3 aikdna/kdna-cli

The CLI is the official runtime toolchain. Its README is the
public-facing first impression of the runtime.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | First screen calls it "the official reference implementation". Mentions "Registry" and "KDNAChat / KDNAStudio" as ecosystem products. "trusted KDNA" appears in body. | P0 | Rewrite. Drop "reference implementation", drop Registry, drop KDNAChat / KDNAStudio mentions. Frame as "official KDNA runtime toolchain CLI". |
| `src/publish.js` | "publish" command code path. Active "trusted KDNA" framing in code. | P1 | Re-author. The `kdna publish` semantics need to be re-examined against v1 Core. The publish path was about pushing to a registry. |
| `src/cli.js`, `src/install.js`, `src/registry.js`, `src/package-store.js` | Old registry / install / publish code paths. | P1 | Re-author under v1 Core positioning. The `install` command was a registry-driven install. In v1 Core, assets are loaded by path / `--input <file.kdna>`, not by registry name. |
| `src/dev-pack-v2.js`, `src/cmds/domain.js` | Legacy v2 container (`application/vnd.aikdna.kdna+zip`) handler. | P2 | The CLI v0.20.x line still ships v2 support. This is the "legacy fallback" for the v1 route. Document as legacy. |
| `src/cmds/license.js`, `src/cmds/protect.js`, `src/cmds/quality.js`, `src/cmds/governance.js`, `src/cmds/studio.js`, `src/cmds/workpack.js`, `src/cmds/changelog.js`, `src/cmds/badge.js`, `src/cmds/registry.js` | Old command surfaces. Many of these are out of v1 Core scope. | P1 | Audit per-command. Most should be marked legacy / hidden by default. |
| `src/identity.js`, `src/signature.js`, `src/capsule-verify.js` | Old signing / identity code. | P2 | The CLI identity is for legacy v2 sign / verify. v1 Core signing is owned by `@aikdna/kdna-core`. Mark legacy. |
| `tests/asset-store.test.js` | Tests for out-of-scope surfaces. | P1 | Move to `tests/archive/` or delete. |

### 3.4 aikdna/kdna-registry

The registry repo's entire purpose is the registry. It is the
strongest case of "the active path this PR is moving away from."

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | Whole README describes the registry as the canonical asset index. "trusted catalog" / "NFT marketplace" disclaimers / "domains.json" / "Registry Moderation" / "quality_badge" / "review_status". | P0 | Mark entire repo as `archived / not KDNA Core active path` (per `ECOSYSTEM_NAMING.md`). Add a banner: "This repository is the legacy kdna-registry. KDNA Core v1 does not define a registry, marketplace, or quality-badge system." |
| `TRUST_MODEL.md`, `SCHEMA.md`, `domains.json` (if checked in), `signing-*.md` | Active trust / schema / quality-badge content. | P0 | Same: mark repo as legacy. |
| `actions/workflows/validate.yml` | CI validates the legacy registry schema. | P3 | Mark as legacy CI; the active v1 Core CI is in `aikdna/kdna`. |
| `packages/*` (if any) | Code that emits the legacy registry schema. | P1 | Mark as legacy. |

### 3.5 aikdna/kdna-studio-core

The studio is the official authoring toolchain component. Its README
is the public-facing first impression of the authoring surface.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | "KDNA Studio Core is the judgment asset refinery." — "trust" / "Human Lock" / "quality gate" / "trusted" all over. | P0 | Rewrite. Frame as "the official KDNA authoring kernel" (per the ECOSYSTEM_NAMING.md table). Drop "trusted .kdna" / "Human Lock" / "quality badge" framing where it functions as an endorsement claim. |
| `src/governance/index.js` | "quality_badge" / "Human Lock" in active code. | P1 | The governance module is the legacy `quality_badge` ladder implementation. Re-author under v1 Core, or mark legacy. |
| `src/lock/*` | "Human Lock" code. | P2 | Mark as legacy (v1 Core does not have Human Lock — the format and runtime loading contract are content-neutral; "trust" is a caller concern, not a format property). |
| `src/cards/*` | Judgment Card types (axiom, ontology, stance, framework, misunderstanding, self_check, banned_term, terminology). These are the legacy v2 authoring model. | P2 | The v1 Core does not have Judgment Cards. The format is one `payload.kdnab` per asset. Mark legacy. |
| `tests/*` | Tests for the legacy governance / lock model. | P3 | Move to `tests/archive/` or delete. |

### 3.6 aikdna/kdna-studio-cli

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | Likely has "trusted" / "Human Lock" framing. | P1 | Audit and rewrite. |
| `bin/*` | Active CLI commands. | P2 | Audit per-command. Most are out of v1 Core scope. |

### 3.7 aikdna/kdna-vscode

The VS Code extension is the official developer toolchain component
for editing v1 source directories.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | "KDNA Protocol Tools for VS Code" / "open judgment protocol" / "trusted `.kdna` assets" / "Studio-compatible compiler". | P0 | Rewrite. Frame as "the official KDNA VS Code extension" (per ECOSYSTEM_NAMING.md). Drop "trusted", drop "Studio-compatible compiler" (the official compiler is the Studio toolchain). |
| `src/features/commands/commandRegistry.ts` | Old registry-style commands. | P1 | Audit. |
| `package.json` | "trust" / "registry" in description / keywords. | P1 | Update. |
| Other `src/*` | 45 total active hits across the extension source. | P1 | Re-author. |

### 3.8 aikdna/kdna-skills

The skills repo is the agent loader adapter. It is the closest to v1
Core of the secondary repos.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | "Unsigned, yanked, or high-risk domains are not silently trusted" — old framing. "open-source" / "KDNA Ecosystem" labels. | P1 | Rewrite. Frame as "the official KDNA Loader skill adapter". Drop "trusted" / "open-source" / "yanked" framing where it functions as trust endorsement. v1 Core trace vocabulary (`version_incompatible`, `failed_to_parse`, etc.) replaces these. |
| `mcp-server/bin/kdna-mcp.mjs` | "trusted" in MCP server code. | P2 | Re-author. |
| `skills/*` | Skill adapters themselves. | P2 | Audit per-skill. |

### 3.9 aikdna/kdna-workpack

Work Pack is a packaging standard built on top of KDNA. It is
heavily tied to the registry / marketplace framing.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | "open packaging standard" / `KDNA Work Pack combines KDNA judgment assets, skills, templates, review gates, risk policies, and traces`. | P1 | Rewrite. Frame as "the official KDNA Work Pack format" (per ECOSYSTEM_NAMING.md). |
| `docs/work-pack-advanced-capabilities.md` | "advanced capabilities" / "best practice" / "certification" / "registry". | P1 | Re-author or archive. |
| `rfcs/RFC-0001-work-pack-specification.md` | Old RFC body. | P2 | Mark as "RFC, accepted pre-v1; v1 Core positioning supersedes". |
| `package.json` | "trust" / "registry" in description. | P1 | Update. |

### 3.10 lab (private)

The lab is the experimental / pressure-test infrastructure. It is
allowed to use "evidence" framing because that's what a test lab does,
but the registry / marketplace framing is still out of scope.

| File | Problem | Severity | Proposed Action |
|---|---|---|---|
| `README.md` | Mentions "Registry" / "registry" as part of the tested ecosystem. "best practice" / "trust" framing. | P1 | Rewrite. |
| `docs/public-vs-internal.md` | "open-core strategy" / "registry" / "best practice". | P2 | Mark historical. |

### 3.11 Domain repos (P2 batch)

Each domain repo is a KDNA domain asset. They have `kdna.json` /
`KDNA_Core.json` files that still use the legacy v2 schema. The
audit did not deep-dive these — they are domain data, not narrative.
The PR-100 (fixture / conformance recovery) work will cover them.

| Repo | Files of interest | Severity | Action |
|---|---|---|---|
| `kdna-writing` | `kdna.json`, `KDNA_Core.json` | P2 | PR-100 |
| `kdna-agent_safety` | `kdna.json` | P2 | PR-100 |
| `kdna-prompt_diagnosis` | `kdna.json` | P2 | PR-100 |
| `kdna-content_strategy` | `KDNA_Core.json` | P2 | PR-100 |
| `kdna-decision_state` | `kdna.json` | P2 | PR-100 |
| `kdna-knowledge_management` | `KDNA_Core.json` | P2 | PR-100 |
| `kdna-open_source_project` | `kdna.json` | P2 | PR-100 |
| `kdna-requirement_alignment` | `quality-gate-report.json` | P2 | PR-100 |
| `kdna-app-shared` | (not audited) | P3 | PR-98c |
| `kdna-code_review` | (not audited) | P3 | PR-98c |
| `kdna-animations` | (not audited) | P3 | PR-98c |
| `kdna-authoring` | (not audited) | P3 | PR-98c |
| `kdna-for-agent-skills` | (not audited) | P3 | PR-98c |
| `kdna-releases` | (not audited) | P3 | PR-98c |
| `kdna-core-swift` | `Sources/KDNACore/KDNADomainValidator.swift` | P2 | "trust" / "registry" framing. Re-author or mark legacy. |
| `kdna-studio-swift` | `.build/checkouts/kdna-core-swift/...` (vendored; shouldn't be edited directly) | P3 | Re-vendor after kdna-core-swift is fixed. |

## 4. Summary table

| Repo | P0 | P1 | P2 | P3 | Total | Action |
|---|---|---|---|---|---|---|
| aikdna/kdna (main) | 0 | 7 | 5 | 12 | 24 | PR-98c, PR-99, PR-100 |
| aikdna/kdna-website | 6 | 1 | 0 | 1 | 8 | PR-98c (highest) |
| aikdna/kdna-cli | 1 | 5 | 3 | 1 | 10 | PR-98d |
| aikdna/kdna-registry | 4 | 1 | 0 | 1 | 6 | PR-98c — mark entire repo as legacy |
| aikdna/kdna-studio-core | 1 | 2 | 2 | 1 | 6 | PR-98d |
| aikdna/kdna-studio-cli | 0 | 2 | 1 | 0 | 3 | PR-98d |
| aikdna/kdna-vscode | 1 | 1 | 0 | 0 | 2 | PR-98d |
| aikdna/kdna-skills | 0 | 1 | 1 | 0 | 2 | PR-98d |
| aikdna/kdna-workpack | 0 | 2 | 1 | 0 | 3 | PR-98d |
| lab (private) | 0 | 1 | 1 | 0 | 2 | PR-98c |
| aikdna/kdna-core-swift | 0 | 0 | 1 | 0 | 1 | PR-98d |
| aikdna/kdna-studio-swift | 0 | 0 | 0 | 1 | 1 | after kdna-core-swift fix |
| Domain repos (~12) | 0 | 0 | 12 | 3 | 15 | PR-100 |

**Total: 18 P0, 23 P1, 27 P2, 20 P3 across 14 repos.**

## 5. Recommended PR sequence

PR-98b is the audit (this document). The fixes are split into
follow-up PRs by repo group, **not** into a single big PR.

| PR | Scope | Repos | Estimated effort |
|---|---|---|---|
| PR-98c | website + registry + main-repo deep docs | `kdna-website`, `kdna-registry`, `kdna` (deep docs), `lab (private)`, `kdna` (CHANGELOG / RELEASE_CHECKLIST / rfcs/ marked historical) | Large. Mark `kdna-registry` repo as legacy / archived. Re-author website content. |
| PR-98d | CLI / Core / Studio / VSCode / Skills / Workpack | `kdna-cli`, `kdna-studio-core`, `kdna-studio-cli`, `kdna-vscode`, `kdna-skills`, `kdna-workpack`, `kdna-core-swift` | Large. Re-author READMEs. Audit code surfaces. |
| PR-98e | domain repos + remaining ecosystem repos | `kdna-writing`, `kdna-agent_safety`, `kdna-prompt_diagnosis`, `kdna-content_strategy`, `kdna-decision_state`, `kdna-knowledge_management`, `kdna-open_source_project`, `kdna-requirement_alignment`, `kdna-animations`, `kdna-authoring`, `kdna-code_review`, `kdna-app-shared`, `kdna-for-agent-skills`, `kdna-releases` | Medium. Mostly archival / light rewording. Heavy data-shape changes belong in PR-100, not here. |

**Recommended merge order after the audit lands:**

1. #95 → merge (CI trust chain)
2. #96 → merge (v1 CLI route)
3. #97 → rebase to main, merge (English public wording)
4. #98 → rebase to main, merge (Chinese + historical docs)
5. #98b → rebase to main, open as **audit-only** PR (this document, no code)
6. #98c / #98d / #98e → batch
7. #99 (Core v1 implementation extraction)
8. #100 (fixture / conformance recovery)
9. #101+ (encryption / signature — gated on the above)

## 6. What this PR does not do

- It does not modify any file in any repo. The audit lives in
  `docs/audits/kdna-public-narrative-audit-2026-06.md`.
- It does not propose to delete `kdna-registry` or any other repo.
  Marking-as-legacy is a separate decision that the user / repo
  maintainers must make.
- It does not touch the v1 Core format. PR-94 / PR-97 / PR-98a
  own that. The audit covers **public narrative only**, not
  format / schema / runtime behaviour.
- It does not propose new schema fields. The `evidence_claims`
  field already exists in the v1 manifest schema as a placeholder.
  Whether to expand it is a separate question for the encryption /
  signature phase (PR-101+).

## 7. Severity definitions (recap)

- **P0** — README first-screen error. Will be read by every new user
  and set their mental model wrong. **Fix first.**
- **P1** — Core docs error. Affects contributors and agents that
  read secondary docs. **Fix in same PR cycle.**
- **P2** — Historical doc or spec. Pollutes context if left as
  active. Mark as historical or move to `archive/`.
- **P3** — Code comments, test names, package metadata, JSON field
  comments. Low risk. **Clean opportunistically.**

## 8. Out of scope (intentionally not surveyed)

- `aikdna/kdna-website` source / build system (only docs
  content surveyed). PR-98c should also re-author the build / design.
- Domain data (the actual `.kdna.json` / `KDNA_Core.json` content
  of domain repos). PR-100 covers fixture / conformance.
- Schema / format changes. Owned by the encryption / signature
  phase (PR-101+) once the public narrative is consistent.
- Cross-repo CI workflows. The existing CI is mostly green; CI
  trust chain was the subject of PR-95.
- Code in `node_modules/` / vendored third-party content. Not the
  project's own narrative.

---

End of audit. See PR-97, PR-98a, and the per-repo cleanup PRs
(PR-98c, PR-98d, PR-98e) for the remediation.
