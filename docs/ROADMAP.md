# KDNA Roadmap

## Current: v0.7 — Ecosystem Foundation (Q2 2026)

### Protocol
- [x] Schema v2.2 — i18n, governance, risk_level fields
- [x] CLI install and domain management
- [x] Registry with 10 official domains
- [ ] Signature infrastructure (Ed25519 signing pipeline)
- [ ] Schema v2.3 — validator warnings for deprecated fields

### Tools
- [x] kdna-studio — guided authoring environment
- [x] kdna-vscode — extension with validation and preview
- [x] kdna-skills — agent loader for Codex, Claude Code, OpenCode

### Ecosystem
- [x] Community governance model (GOVERNANCE.md)
- [x] I18N architecture (en/zh-CN)
- [ ] GitHub Discussions enabled
- [ ] External expert review for 3 reference domains

## v0.8 — Trust and Verification (Q3 2026)
- [ ] Ed25519 signing for all official domains
- [ ] sha256 verification on install
- [ ] known_limitations_url populated for all domains
- [ ] Benchmark v2 with independent audit methodology
- [ ] CI validation gate for all domain repos
- [ ] **Adaptive Loading** — CLI/runtime supports multiple loading modes based on model capability:
  - `full-kdna` — complete structured judgment for strong models
  - `compressed-kdna` — reduced axiom set for medium models
  - `best-prompt-compatible` — free-text guidance for weaker models
  - `trace-only` / `guard-only` — governance layer without full judgment injection

## v0.9 — Ecosystem Growth (Q4 2026)
- [ ] Community domain submission pipeline
- [ ] Domain conflict resolution protocol
- [ ] Python SDK
- [ ] TypeScript SDK
- [ ] Enterprise pilot with private registry

## v1.0 — Stable Protocol (2027)
- [ ] Protocol frozen (v1.0 spec)
- [ ] Backward compatibility guarantee
- [ ] Third-party registry support
- [ ] Mainstream agent framework integrations
