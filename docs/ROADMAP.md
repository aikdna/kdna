# KDNA Roadmap

> **This file is a historical snapshot** (pre-v1 ecosystem plan, dated 2026-05).
> The current active roadmap is **[docs/public-roadmap.md](./public-roadmap.md)**.
>
> The sections below record the four-layer protocol stack approach, including registry /
> marketplace / quality-badge layers that are **out of scope for KDNA Core**.
> Preserved for traceability. Not active guidance.

## Phase 1: Protocol and Runtime Foundation ✅

- ✅ SPEC v1.0-rc — six standard files, JSON Schemas, validation rules
- ✅ `@aikdna/kdna-core` — pure JS runtime library (load, validate, lint, render, compose)
- ✅ `@aikdna/kdna-cli` — CLI toolchain (verify, install, load, match, route, compare, diff, publish existing assets, identity, trace)
- ✅ `kdna-registry` — domain catalog with signatures, quality badges, risk levels, CI validation
- ✅ `kdna-skills` — agent loader skill with 7-state routing
- ✅ `kdna-vscode` — VS Code extension (validate, preview, dev-source diagnostics)
- ✅ Benchmark infrastructure: 5-model mini benchmark with Best Prompt control, 150 raw outputs
- ✅ Human Judgment Lock: protocol specification + Studio Gate + CLI Gate (4 rules, fingerprint detection)
- ✅ Runtime routing: `kdna route`, 5-Gate 7-State router, route-result schema
- ✅ Governance: TRADEMARK, COMPATIBILITY, FORK_POLICY, GOVERNANCE

## Phase 2: Authoring Infrastructure ✅

- ✅ `@aikdna/kdna-studio-core` (npm) — JS authoring kernel
- ✅ `@aikdna/kdna-studio-cli` (npm) — `kdna-studio` command-line authoring entry
- ✅ `kdna-studio-swift` (SPM) — Swift authoring kernel for Apple platforms
- ✅ Judgment Cards (9 types, 6-state machine)
- ✅ Human Lock Gate enforcement (Studio + CLI)
- ✅ Quality Gates (readiness check, contradiction detection, anti-vagueness)
- ✅ Compiler (locked cards → KDNA_Core.json + KDNA_Patterns.json)

## Phase 3: Native App Integration ✅

- ✅ `kdna-core-swift` — native Swift runtime (load, route, compose, trust verify)
- ✅ `kdna-studio-swift` — native Swift authoring kernel
- ✅ Reference consumption client — macOS
- ✅ Reference authoring client — macOS
- ✅ Agent integrations emerging (Claude Code, OpenCode, Codex)

## Phase 4: Trust and Distribution (Current)

- ⬜ v1.0 standardization freeze: manifest, media type, mimetype, canonicalization, trust boundary
- ✅ .kdna open package profile
- ✅ Ed25519 signing pipeline
- ✅ SHA256 hash verification
- ✅ Risk levels (R0–R3)
- ✅ Yanked/deprecated mechanism
- ✅ Registry attestation + CI validation
- ✅ Judgment Guard (Runtime R1–R15)
- ✅ `kdna route` Trust Gate
- ✅ Proof asset signing
- ✅ Install-time signature verification in CLI
- ⬜ RFC-0006 provenance/signing/transparency accepted

## Phase 4.5: Open Protocol Standardization (Next)

- ⬜ Vendor-tree media type registration for `application/vnd.kdna.asset`
- ⬜ Third-party conformance reports for asset loaders and registries
- ⬜ Personal KDNA and privacy-level fields promoted from proposal to schema
- ⬜ Registry federation model for official, community, private, and local registries
- ⬜ OCI artifact distribution experiment

## Phase 5: Encrypted and Licensed KDNA (Next)

- ⬜ Licensed `.kdna` encrypted-entry profile
- ✅ License verification MVP (runtime)
- ✅ KCL-1.0 canonical commercial license
- ⬜ Entitlement model
- ⬜ Organization access control
- ⬜ Offline license lease

## Phase 6: KDNA Store and Judgment System Asset Market (Future)

- ⬜ Creator profiles and verified creators
- ⬜ Package pages with quality evidence
- ⬜ Reviews and certifications
- ⬜ Paid domains and subscriptions
- ⬜ Enterprise private registry
- ⬜ Revenue sharing for multi-creator domains

## Long-Term Vision

KDNA's long-term goal is to become the standard infrastructure for judgment system assets — the layer that turns human-led domain judgment into AI-usable, verifiable, composable, and licensable assets. This is not just a better prompt format or knowledge base. It is a new asset class for the AI era.

> **Phase 1–3: Foundation → Phase 4: Trust → Phase 5: Licensing → Phase 6: Market**
