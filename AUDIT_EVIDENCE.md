# KDNA Phase 1–2 Audit Evidence

> For external auditors, investors, and contributors.
> This file maps every Phase 1–2 deliverable to its public GitHub evidence.

## 1. Repository Inventory

| Repo | Role | Public | Evidence |
|------|------|:---:|---------|
| [aikdna/kdna](https://github.com/aikdna/kdna) | Protocol, SPEC, governance, benchmarks | ✅ | [README](https://github.com/aikdna/kdna) |
| [aikdna/kdna-cli](https://github.com/aikdna/kdna-cli) | CLI: install, verify, pack, route, load, trace | ✅ | [README](https://github.com/aikdna/kdna-cli) |
| [aikdna/kdna-studio-core](https://github.com/aikdna/kdna-studio-core) | Authoring kernel: cards, lock, compile, export | ✅ | [README](https://github.com/aikdna/kdna-studio-core) |
| [aikdna/kdna-core-swift](https://github.com/aikdna/kdna-core-swift) | Swift runtime: load, route, compose, trust | ✅ | [README](https://github.com/aikdna/kdna-core-swift) |
| [aikdna/kdna-studio-swift](https://github.com/aikdna/kdna-studio-swift) | Swift authoring: cards, lock, compile, export | ✅ | [README](https://github.com/aikdna/kdna-studio-swift) |
| [aikdna/kdna-registry](https://github.com/aikdna/kdna-registry) | Domain catalog, CI validation | ✅ | [README](https://github.com/aikdna/kdna-registry) |
| [aikdna/kdna-skills](https://github.com/aikdna/kdna-skills) | Agent loader skill | ✅ | [README](https://github.com/aikdna/kdna-skills) |
| [aikdna/kdna-vscode](https://github.com/aikdna/kdna-vscode) | VS Code extension | ✅ | [README](https://github.com/aikdna/kdna-vscode) |

**8 official domain repos**: writing, agent_safety, code_review, decision_state, content_strategy, prompt_diagnosis, knowledge_management, open_source_project — each at `aikdna/kdna-{name}`.

## 2. Security Evidence

| Item | Evidence |
|------|----------|
| CSP unsafe-eval removed | [kdna-website/src/index.js](https://github.com/aikdna/kdna-website/blob/main/src/index.js) — zero `unsafe-eval` |
| Date.now() → crypto.randomUUID() (5 files) | [studio-core/src/cards/index.js](https://github.com/aikdna/kdna-studio/blob/main/packages/studio-core/src/cards/index.js) — zero `Date.now` |
| install-cli.sh sudo removal | [kdna-skills/install-cli.sh](https://github.com/aikdna/kdna-skills/blob/main/install-cli.sh) — zero `sudo` |
| Security regression tests | [tests/security/security-regression.mjs](https://github.com/aikdna/KDNA/blob/main/tests/security/security-regression.mjs) — 24/24 |
| Runtime R1–R15 | kdna-runtime (private repo) — 15 items verified via integration test |

## 3. Human Lock Evidence

| Enforcement | File | Test | Behavior |
|-------------|------|------|----------|
| Studio Gate | [project/index.js](https://github.com/aikdna/kdna-studio/blob/main/packages/studio-core/src/project/index.js) | [human-lock-gate.test.js](https://github.com/aikdna/kdna-studio/blob/main/packages/studio-core/tests/human-lock-gate.test.js) (16/16) | exportProject() throws on un-locked cards |
| CLI Gate (pack) | [cmds/domain.js](https://github.com/aikdna/kdna-cli/blob/main/src/cmds/domain.js) | cmdPack() | Blocks with exit code 8 |
| CLI Gate (publish) | [publish.js](https://github.com/aikdna/kdna-cli/blob/main/src/publish.js) | cmdPublish() / cmdPublishCheck() | Blocks with exit code 8; --force override |
| Fingerprint Detection | [judgment-fields.js](https://github.com/aikdna/kdna-studio/blob/main/packages/studio-core/src/judgment-fields.js) | Test: "detects judgment content changed after lock" | SHA256 comparison |

## 4. Benchmark Evidence

| Item | Evidence |
|------|----------|
| Summary report | [BENCHMARK_SUMMARY.md](https://github.com/aikdna/KDNA/blob/main/benchmarks/BENCHMARK_SUMMARY.md) |
| Benchmark dataset (10 cases) | [agent_safety-mini-benchmark.json](https://github.com/aikdna/KDNA/blob/main/benchmarks/agent_safety-mini-benchmark.json) |
| Runner (3-way comparison) | [eval-agent-safety.mjs](https://github.com/aikdna/KDNA/blob/main/benchmarks/eval-agent-safety.mjs) |
| 5 per-model reports | [benchmarks/](https://github.com/aikdna/KDNA/tree/main/benchmarks) |
| Raw outputs (150 files) | [raw/agent_safety/](https://github.com/aikdna/KDNA/tree/main/benchmarks/raw/agent_safety) |

**Caveats**: 10 cases, one run per model, automated keyword scoring. Not statistical proof. Early directional evidence.

## 5. Domain Package Evidence

| Domain | ROUTING.md | known-limitations | evals |
|--------|:---:|:---:|:---:|
| writing | ✅ | ✅ | ✅ |
| agent_safety | ✅ | ✅ | ✅ |
| code_review | ✅ | ✅ | ✅ |
| decision_state | ✅ | ✅ | ✅ |
| content_strategy | ✅ | ✅ | ✅ |
| prompt_diagnosis | ✅ | ✅ | ✅ |
| knowledge_management | ✅ | ✅ | ✅ |
| open_source_project | ✅ | ✅ | ✅ |

Each at `https://github.com/aikdna/kdna-{name}`.

## 6. Governance Evidence

| Document | Evidence |
|----------|----------|
| TRADEMARK.md | [Code is open. Identity is not.](https://github.com/aikdna/kdna/blob/main/TRADEMARK.md) |
| COMPATIBILITY.md | [3 categories, 4 levels](https://github.com/aikdna/kdna/blob/main/COMPATIBILITY.md) |
| FORK_POLICY.md | [Constructive vs protocol forks](https://github.com/aikdna/kdna/blob/main/FORK_POLICY.md) |
| Judgment Systems | [EN](https://github.com/aikdna/kdna/blob/main/docs/judgment-systems.md) · [ZH](https://github.com/aikdna/kdna/blob/main/docs/judgment-systems.zh.md) |
| KDNA and the AI Stack | [EN](https://github.com/aikdna/kdna/blob/main/docs/kdna-and-ai-stack.md) · [ZH](https://github.com/aikdna/kdna/blob/main/docs/kdna-and-ai-stack.zh.md) |
| Runtime Routing | [EN](https://github.com/aikdna/kdna/blob/main/docs/runtime-routing.md) · [ZH](https://github.com/aikdna/kdna/blob/main/docs/runtime-routing.zh.md) |
| White Paper | [EN](https://github.com/aikdna/kdna/blob/main/docs/kdna-whitepaper.md) · [ZH](https://github.com/aikdna/kdna/blob/main/docs/kdna-whitepaper.zh.md) |

## 7. Spec & Design Evidence

| Document | Evidence |
|----------|----------|
| SPEC v1.0-rc | [SPEC.md](https://github.com/aikdna/kdna/blob/main/SPEC.md) |
| Asset Card | [kdna-asset-card.md](https://github.com/aikdna/kdna/blob/main/specs/kdna-asset-card.md) |
| Human Lock Gate Design | [human-lock-gate-design.md](https://github.com/aikdna/kdna/blob/main/specs/human-lock-gate-design.md) |
| Route Result Schema | [route-result.schema.json](https://github.com/aikdna/kdna/blob/main/specs/route-result.schema.json) |
| Package Profiles | [package-profiles.md](https://github.com/aikdna/kdna/blob/main/specs/package-profiles.md) |
| KCL-1.0 | [LICENSE-KCL-1.0.md](https://github.com/aikdna/kdna/blob/main/specs/LICENSE-KCL-1.0.md) |

## 8. Compliance Evidence

All public repos verified to have: LICENSE, SECURITY.md, .gitignore, README.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md.

Zero `aikdna` old brand references in public-facing files (Swift source comments fixed 2026-05-25, kdna-cli keywords fixed 2026-05-25).

## 9. Known Limitations

- **Runtime R1–R15**: Implemented in private `kdna-runtime` repo. Full public audit not possible.
- **CI status**: Verified at time of writing via GitHub Actions badges. Real-time status may differ.
- **Benchmark**: 10 cases, one run per model. Not statistical stability. Needs repeated runs, human review, larger sample.
- **CLI/VS Code deep integration**: Phase 3 scope. Not claimed as Phase 1–2 completed.
- **Creator marketplace / KDNA Store**: Phase 7 scope. Not claimed as completed.

---

*This evidence file is maintained in the repository root. Each claim can be independently verified via the linked GitHub URLs.*
