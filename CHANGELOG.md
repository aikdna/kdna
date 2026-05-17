# Changelog

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
