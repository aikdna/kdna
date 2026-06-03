# KDNA v1.0-rc Public Confidence Release

> **Milestone:** v1.0-rc  
> **Target:** External developers can integrate, verify, publish, and contribute to KDNA — without reading internal docs or asking the maintainer.  
> **Status:** Execution board active. Documentation gates and local protocol gates are in place; external smoke, validated domain evidence, and non-maintainer contributor trial remain release blockers.

## Operating Rule

v1.0-rc is a Public Confidence Release. The goal is not more features. The goal is that a stranger can install, verify, load, create, publish, test, integrate, and benchmark a `.kdna` judgment asset from public materials.

## Epic Overview

| # | Epic | Owner | Status | Key Issues |
|---|------|-------|--------|------------|
| 1 | Protocol Freeze | Protocol release captain | 🟨 | Non-negotiable rules are covered by conformance and release gate docs; full MUST/SHOULD audit still needs traceability table. |
| 2 | Core/CLI Compatibility | Runtime lead | 🟨 | [CLI JSON contract](./cli-json-contract.md) published; verify JSON snapshot still needs CLI-side hardening. |
| 3 | Registry Trust Verification | Registry lead | 🟨 | Failure tests pass locally and `kdna-registry` release preflight passes; revoked signature and expired license vectors still need coverage. |
| 4 | Reference Domain Evidence | Domain evidence lead | 🟨 | writing/prompt_diagnosis/agent_safety source repos now have 30 eval cases and rubric/report coverage; [benchmark evidence contract](./reference-domain-benchmark-runbook.md) is published; signed release assets, raw outputs, and automated scoring artifacts remain before `validated`. |
| 5 | Agent Integration Kit | Integration lead | 🟨 | [Agent integration kit](./agent-integration-kit.md) exists; live Codex/Claude/OpenCode/Cursor/MCP sign-offs required. |
| 6 | External Contributor Path | Maintainer | 🟨 | Issue templates and CONTRIBUTING exist; non-maintainer trial and conformance badge remain. |

Current cross-repo audit: [Public Confidence Audit 2026-06-03](./PUBLIC_CONFIDENCE_AUDIT_2026-06-03.md).

---

## Epic 1: Protocol Freeze

**Goal:** SPEC is unambiguous and implementable by third parties. All v1.0 non-negotiable rules are CI-enforced.

### Issues

#### 1.1 — SPEC MUST/SHOULD Terminology Audit
- [ ] Review `SPEC.md` for all uses of MUST, SHOULD, MUST NOT, SHOULD NOT
- [ ] Verify every MUST is a real implementability requirement (not aspirational)
- [ ] Verify every SHOULD has a documented exception path
- [x] Start traceability map for non-negotiable rules
- [ ] Complete cross-reference with conformance suite: every MUST should have a corresponding conformance test or documented exception

#### 1.2 — Non-Negotiable Rules CI Enforcement
- [x] `format` (not `kdna_spec`) — CI rejects manifests with `kdna_spec`
- [x] `languages` (not singular `language`) — CI rejects singular field
- [x] `mimetype: application/vnd.aikdna.kdna+zip` — CI rejects `application/x-kdna`
- [x] `spec_version: "1.0-rc"` — CI warns on unknown spec_version
- [ ] Signatures use v1.0 canonical content-tree payload only

#### 1.3 — RFC Process Documentation
- [ ] Document RFC process: proposal format, discussion period, acceptance criteria
- [ ] Template for RFC submissions
- [ ] Archive of resolved RFCs

---

## Epic 2: Core/CLI Compatibility

**Goal:** External tools that consume `kdna-cli` output or `@aikdna/kdna-core` APIs get stable, documented behavior.

### Issues

#### 2.1 — Command Output Stability Contract
- [x] `kdna verify --json` — document all fields, guarantee version compatibility
- [ ] `kdna verify --json` — CLI-side snapshot coverage for success and failure outputs
- [x] `kdna load` — document the prompt-mode output format (sections, headers, field order)
- [x] `kdna list --json` — document v2.1 fields (applies_when, does_not_apply_when, etc.)
- [x] Exit codes 0-8 are documented and stable

#### 2.2 — SDK API Stability
- [ ] Document `loadKDNA`, `validateKDNA`, `renderForAgent`, `inspectKDNA`, `verifyDigest` signatures
- [ ] Breaking change policy: what's a major, minor, patch
- [ ] Deprecation path for removed APIs

#### 2.3 — Cross-Platform Smoke Test
- [ ] macOS (arm64)
- [ ] macOS (x86_64)
- [ ] Linux (x86_64)
- [ ] Node.js 18, 20, 22

---

## Epic 3: Registry Trust Verification

**Goal:** The registry trust model has test coverage for all failure modes. External registry operators know exactly how to implement trust.

### Issues

#### 3.1 — Trust Failure Test Cases
- [x] **Digest mismatch** — `asset_digest` in registry doesn't match downloaded `.kdna`
- [x] **Yanked domain** — blocked from new installation, existing installs preserved
- [ ] **Revoked signature** — `revoked_pubkeys` blocks installation
- [x] **Expired snapshot** — registry `updated` timestamp beyond tolerance
- [x] **Missing trust_pubkey** — scope declared but no trust anchor
- [ ] **Signature invalid** — Ed25519 signature doesn't verify against pubkey
- [ ] **Expired license** — licensed asset with expired entitlement

#### 3.2 — Registry Publishing Workflow
- [x] `PUBLISHING_EXAMPLE.md` — step-by-step from Studio export to PR merged
- [ ] Dry-run: `kdna publish --check` with actionable error messages
- [ ] Trust gate automation: `scripts/check-domain-trust-gate.js` in CI

#### 3.3 — Private Registry Demo
- [x] Static `domains.json` with scoped `@mycorp` entries
- [ ] Self-signed `.kdna` with organization Ed25519 key
- [x] `KDNA_REGISTRY_URL` override verification

---

## Epic 4: Reference Domain Evidence

**Goal:** 3 reference domains at `validated` quality level (30+ eval cases each, automated scoring, public benchmark reports).

### Issues

#### 4.1 — @aikdna/writing → validated
- [x] Expand evals from 15 to 30+ cases
- [x] Publish benchmark evidence contract
- [ ] Repack, sign, and release `.kdna` asset with 30 eval specs
- [ ] Automated scoring script (`npm run eval`)
- [ ] Save raw model outputs in `evals/raw/`
- [ ] Publish benchmark report: models, inputs, scoring criteria, limitations
- [ ] Regression test: compare v_current vs v_previous eval scores

#### 4.2 — @aikdna/prompt_diagnosis → validated
- [x] Expand evals from 10 to 30+ cases
- [x] Scoring rubric
- [x] Benchmark report skeleton
- [x] Publish benchmark evidence contract
- [ ] Repack, sign, and release `.kdna` asset with 30 eval specs
- [ ] Automated scoring script
- [ ] Raw outputs + benchmark report with completed model results

#### 4.3 — @aikdna/agent_safety → validated
- [x] Expand evals from 10 to 30+ cases
- [x] Scoring rubric
- [x] Publish benchmark evidence contract
- [ ] Repack, sign, and release `.kdna` asset with 30 eval specs
- [ ] Automated scoring script
- [ ] Raw outputs + benchmark report

#### 4.4 — Quality Badge Upgrade Checklist (per domain)
- [ ] `quality_badge: "validated"` in `kdna.json`
- [ ] `evals_url` pointing to public eval directory
- [ ] `benchmark_report_url` pointing to public report
- [ ] `known_limitations_url` pointing to `docs/known-limitations.md`
- [ ] `test_count` updated in registry entry after signed asset republish
- [ ] Trust gate passes: `scripts/check-domain-trust-gate.js`

---

## Epic 5: Agent Integration Kit

**Goal:** Every supported agent (Codex, Claude Code, OpenCode, Cursor, MCP) has a verified smoke test proving KDNA loads and applies judgment.

### Issues

#### 5.1 — Agent Smoke Test Matrix
| Agent | Smoke Test | Status |
|-------|-----------|--------|
| Codex | Load @aikdna/writing, ask review question, verify judgment path changed | 🟨 CLI precheck recorded; live sign-off still pending |
| Claude Code | Load @aikdna/writing, ask review question, verify judgment path changed | ⬜ sign-off template ready |
| OpenCode | Load @aikdna/writing, ask review question, verify judgment path changed | ⬜ sign-off template ready |
| Cursor | Load @aikdna/writing, ask review question, verify judgment path changed | ⬜ sign-off template ready |
| MCP Server | Start server, call all 5 tools, verify responses | ⬜ sign-off template ready |

#### 5.2 — MCP Conformance
- [ ] Run MCP server against conformance suite (asset + loader profiles)
- [ ] Document MCP client setup for each supported runtime
- [ ] Verify `kdna.available`, `kdna.inspect`, `kdna.verify`, `kdna.load`, `kdna.match`

#### 5.3 — Integration Troubleshooting Guide
- [x] Common failure modes per agent
- [x] Debug mode: how to extract which KDNA loaded and why
- [ ] CLI-less integration path (SDK only, no CLI dependency)

---

## Epic 6: External Contributor Path

**Goal:** A new contributor can go from fork to merged PR without reading internal docs, asking on Discord, or guessing.

### Issues

#### 6.1 — Issue Templates
- [ ] `bug_report.md` — reproduction steps, environment, expected vs actual
- [ ] `domain_submission.md` — domain name, scope, evals, limitations, quality evidence
- [ ] `adapter_submission.md` — agent name, integration approach, test results
- [ ] `good_first_issue.md` — tagged issues suitable for new contributors

#### 6.2 — Contributor Workflow
- [ ] Fork → clone → `npm install` → `npm test` → make changes → `npm run conformance` → PR
- [ ] Document in CONTRIBUTING.md
- [ ] CI runs on PR from fork automatically

#### 6.3 — Conformance Badge
- [ ] CI badge generation: "KDNA Loader Compatible" 
- [ ] Third-party guide for displaying conformance status
- [ ] Registry field for third-party tool conformance claims

---

## Release Checklist

Before tagging `v1.0-rc`:

- [ ] All 6 epics have at minimum the P0 issues completed
- [ ] `npm run release:preflight` passes in kdna, kdna-cli, kdna-registry
- [ ] `npm run conformance` passes with `--profile loader`
- [ ] `npm run validate:remote` passes in kdna-registry
- [ ] 3 reference domains upgraded to validated
- [ ] 5-agent smoke test matrix completed
- [ ] External contributor path verified (a non-maintainer follows the guide and opens a PR)
- [ ] Version matrix published (SPEC + core + CLI + registry + studio-core + domain assets)
- [ ] `CHANGELOG.md` updated with breaking changes and migration guide

---

## Version Matrix (Current)

| Component | Version | v1.0-rc Target |
|-----------|---------|----------------|
| KDNA SPEC | v1.0-rc | ✅ Current |
| `@aikdna/kdna-core` | 0.7.2 | 1.0.0-rc.0 |
| `@aikdna/kdna-cli` | 0.19.3 | 1.0.0-rc.0 |
| `@aikdna/kdna-studio-core` | 1.4.2 | 1.4.x (compatible) |
| `@aikdna/kdna-studio-cli` | 0.2.0 | 0.2.x (compatible) |
| `kdna-core-swift` | main | 0.3.0 |
| Registry schema | 3.0 | ✅ Current |

---

*Board created: 2026-06-01 | Last updated: 2026-06-01*
