# Changelog

## 0.4.0 - 2026-05-19

### Added
- **kdna-runtime loader bridge** (`loader.js`) — enables runtime tests to resolve KDNA loader from monorepo sibling
- **core_structure** added to management-pro and silver-age-pro (schema compliance)
- **steps** added to all frameworks in management-pro and silver-age-pro (schema compliance)
- **id, key_distinction, why** added to all misunderstandings in management-pro and silver-age-pro (schema compliance)
- **one_sentence, logic, so_what** added to reasoning_chains in silver-age-pro (schema compliance)
- **README.md** added to decision_state example domain

### Changed
- **Security**: Removed exposed GitHub PAT from all 15 repo remotes (replaced with clean HTTPS URLs)
- **kdna-runtime tests**: Fixed broken require paths (`../src/runtime/*` → `../src/*`, `../src/loader` → `../loader`)
- **Registry synced**: All domain versions bumped to 0.4.0, spec_version to 0.3, quality_badge added (basic/experimental)
- **All example kdna.json**: Versions unified to 0.4.0, spec_version to 0.3
- **Pro kdna.json**: management-pro and silver-age-pro versions corrected to 0.4.0

### Fixed
- **kdna-runtime tests**: All 16 tests passing (was failing due to missing loader and incorrect paths)
- **management-pro schema**: 23 lint errors resolved (missing core_structure, framework steps, misunderstanding fields)
- **silver-age-pro schema**: 30 lint errors resolved (missing core_structure, framework steps, misunderstanding fields, reasoning chain fields)

### Added (Phase 1: Discussion vs Decision Benchmark)
- **decision_state domain** — 4-state classification system: UNRESOLVED, CONDITIONAL, INTENTIONAL_DEFERRAL, EXECUTABLE_DECISION
- **30-scenario benchmark** (`benchmarks/decision-state-benchmark.json`) — outcome-ready schema with predicted_judgment, recommended_action, actual_outcome fields
- **Eval runner** (`benchmarks/eval-decision-state.js`) — one-command reproducible no-KDNA / with-KDNA comparison
- **Benchmark report** (`benchmarks/decision-state-comparison-report.md`) — 96.7% state accuracy with KDNA (vs 90.0% without), zero false actionization errors
- **Eval runner script** (`benchmarks/eval-runner.sh`) — fully reproducible with raw output preservation
- **Website /benchmark page** — displays decision-state v2 results with state accuracy and false actionization cards

### Added (Phase 2: SDK and Framework Integration)
- **Python SDK MVP** (`python-sdk/`) — `pip install kdna` with `load_domain`, `format_context`, `classify_input`
- **Python custom agent example** (`python-sdk/examples/custom_agent.py`) — framework-agnostic KDNAAgent class
- **TypeScript SDK example** (`examples/typescript-agent/`) — type-safe custom agent with full KDNA integration
- **LangGraph example** (`examples/langgraph/`) — KDNA as judgment layer in state graphs (first-priority framework)
- **LangChain example** (`examples/langchain/`) — KDNA in prompt chains with before/after comparison
- **CrewAI example** (`examples/crewai/`) — KDNA shared across multi-agent crew
- **AutoGen example** (`examples/autogen/`) — KDNA in multi-agent conversation system
- **MCP Resource example** (`examples/mcp-resource/`) — KDNA served as MCP Resource (not tool)
- **`kdna demo` CLI command** — 60-second no-KDNA / with-KDNA offline demo with judgment trace output
- **Architecture article** (`docs/agents-lack-judgment.md`) — "AI Agents Do Not Lack Tools. They Lack Judgment."
- **Case study** (`docs/case-study-meeting-decisions.md`) — "$40,000 meeting that wasn't a decision"

### Changed
- **README** — added benchmark link, SDK examples, architecture article, and case study references
- **TypeScript types** (`src/types.d.ts`) — re-exported loader functions (`loadDomain`, `formatContext`, `classifyInput`, `loadCorePatterns`) for clean SDK imports

### Added (Phase 4: Judgment Trace and Outcome Data Infrastructure)
- **Judgment Trace schema** (`specs/judgment-trace-schema.json`) — formal JSON schema for transparent judgment traces
- **Outcome Record schema** (`specs/outcome-record-schema.json`) — schema for long-term judgment-outcome tracking
- **CLI trace output** — `kdna demo --trace` outputs structured JSON trace conforming to schema
- **Runtime API trace** — `/v1/project` and `/v1/judge` responses now include `trace` field with triggered axioms/frameworks/self-checks
- **Registry evaluation history** — `domains.json` v0.4.1 with `evaluation_history` array per domain
- **Registry spec update** — documented `eval_score`, `test_count`, `quality_badge`, and `evaluation_history` fields
- **decision_state in registry** — added to registry with benchmark results (96.7% state accuracy, 30 scenarios)

## 0.4.0 - 2026-05-18

### Added
- **speaking-pro**: KDNA_Core.json and KDNA_Patterns.json — the two mandatory files were missing; now complete (4 axioms, 6 banned terms, 6 misunderstandings, 8 self-checks)
- **business-growth**: KDNA_Scenarios.json, KDNA_Cases.json, KDNA_Reasoning.json, KDNA_Evolution.json — domain upgraded from basic (2/6 files) to complete (6/6)
- **kdna.json manifests** added to 5 public domains (communication, sales, management, product-decision, business-growth)
- **.gitignore** added to 8 domain repos
- **LICENSE (KCL-1.0)** added to writing-pro

### Changed
- **Version unified to v0.4** across all repos: SPEC, package.json, kdna_spec, meta.version, registry, specs, docs, README badges
- **business-growth KDNA_Core.json**: `stances` converted from dict to array, `core_structure` from dict to array (standard schema compliance)
- **business-growth KDNA_Patterns.json**: `self_check` converted from object array to string array (standard schema compliance)
- **writing-pro kdna.json**: `access` corrected from "open" to "runtime", `license` corrected to KCL-1.0, `status` corrected to "pro"
- **management-pro kdna.json**: `license` converted from string to object format, `file_count` added
- **registry/domains.json**: business-growth version bumped to 0.4.0, core_insight updated, keywords expanded
- **README.md / README.zh.md**: spec reference updated from v0.1 to v0.4
- **All domain README badges**: KDNA Spec badge updated from v0.1 to v0.4

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
