# Changelog

## 0.3.0 - 2026-05-18

### Added
- **kdna eval** — 5-dimension quality evaluation (banned terms, concept usage, axiom alignment, distinctness, self-check coverage)
- **Agent demos** (`demos/`) — OpenCode + Codex running records with before/after comparison
- **CI/CD**: `eval.yml` (auto eval on PR), `registry-validate.yml` (auto registry checks)
- **SPEC v0.2**: RFC 2119 rewrite (MUST/SHOULD/MAY), conformance levels, security considerations
- **Docs upgrade**: role-based index, 10-minute tutorial, Agent Loader Behavior specification
- **Registry v0.2** with quality metadata, author attribution, core_insight per domain

### Changed
- SPEC.md: Full RFC-style rewrite with normative language
- Website: Three-column before/after proof section, role-based docs index
- Validator: Excludes `kdna.json` from domain file count
- `kdna install`: 3-strategy fallback (HTTPS clone → SSH → tarball download)
- `validate-ecosystem.sh`: Rewritten for v0.2 registry format with `--local-only` flag
- Package renamed to `@aikdna/kdna` as primary; `@knowledge-dna/kdna` as mirror

### Fixed
- Registry format: Object with `registry_version` and `domains` array (was flat array)
- ESLint and Prettier compliance for CI
- Missing LICENSE files across 10 public repos
- Self-check format consistency (strings, not objects)
- Silver-age domain removed from public registry and website

## 0.2.0 - 2026-05-17

### Added
- **Unified `kdna` CLI** with commands: `validate`, `pack`, `install`, `inspect`, `list`
- **Specs directory** (`specs/`):
  - `kdna-file-format.md` — `.kdna` single-file format specification (YAML/JSON)
  - `kdna-package-format.md` — `.kdnapack` multi-file package format specification
  - `kdna-access-modes.md` — `open` / `licensed` / `runtime` access modes
  - `kdna-license.md` — KDNA Commercial License (KCL) v1.0 draft
  - `kdna-registry.md` — KDNA Registry specification
- **`kdna.json` manifests** for all 6 example domains
- **Registry v0.2** format with versioning, author, license, and keywords

### Changed
- `package.json`: Added `kdna` binary entry, `specs/` and `registry/` to distribution
- `registry/domains.json`: Updated to v0.2 format with richer metadata

### Retained
- `kdna-lint` and `kdna-validate` still available as standalone commands
- All existing v0.1 schemas, validators, and loader remain backward-compatible

## 0.1.0 - 2026-04-24

Initial public package with KDNA v0.1 specification, JSON Schema drafts, communication example, loader Skill, and JavaScript linter.
