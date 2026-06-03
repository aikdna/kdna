# Public Confidence Audit

Date: 2026-06-03

Scope:

- `aikdna/kdna`
- `aikdna/kdna-cli`
- `aikdna/kdna-registry`
- `aikdna/kdna-skills`
- Reference domain repos: `kdna-writing`, `kdna-prompt_diagnosis`, `kdna-agent_safety`

Important status boundary: these findings are local workspace findings until
the corresponding changes are pushed to a public PR or merged default branch.
See [Public Sync Status 2026-06-03](./PUBLIC_SYNC_STATUS_2026-06-03.md).

## Verified Today

| Area | Result | Evidence |
| --- | --- | --- |
| Protocol conformance | Pass | `npm run conformance` in `OPEN_SOURCE/kdna` |
| Runtime app contract | Pass | `npm run validate:runtime-contract` in `OPEN_SOURCE/kdna` |
| Registry trust vectors | Pass | `npm run test:registry-trust` in `OPEN_SOURCE/kdna` |
| Core unit tests | Pass | `npm test` in `OPEN_SOURCE/kdna` (16/16, Node 18/22/24 compat) |
| Format check | Pass | `npm run format:check` in `OPEN_SOURCE/kdna` |
| Release preflight | Pass | `npm run release:preflight` in `OPEN_SOURCE/kdna` |
| CLI command tests | Pass | `npm test` in `OPEN_SOURCE/kdna-cli` |
| KDNALAB test suite | Pass | 45 passed, `pytest -q` in KDNALAB/kdna-lab |
| Registry release preflight | Pass | `npm run release:preflight` in `OPEN_SOURCE/kdna-registry` |
| Website dry-run deploy | Not publicly verifiable (repo is private) | Deploy check passes locally |
| Website protocol drift | Fixed | `create` now emits `spec_version`, not `kdna_spec`; `.kdna` download uses `application/vnd.aikdna.kdna+zip`. |
| Public naming drift | Fixed | Public website/docs/CLI/skills references use `KDNA Studio`, not `KDNAStudio` or `KDNaStudio`. |

## Fixed Today

- Added public start paths: Use, Create, Integrate, Publish, Conform.
- Added CLI JSON contract and exit-code contract.
- Added conformance expected behavior matrix.
- Added registry publishing example.
- Added private registry demo.
- Made registry trust tests hermetic with temporary `HOME` and `KDNA_HOME`.
- Restored `kdna-registry` release preflight by adding missing authoring `domain_id` metadata and downgrading unreachable `@aikdna/requirement_alignment` asset metadata to `pending_v0.7_republish`.
- Updated website trust copy so `tested` and `validated` match registry evidence gates.
- Expanded `writing`, `prompt_diagnosis`, and `agent_safety` to 30 standard `eval-*.json` cases each.
- Added scoring rubrics for `prompt_diagnosis` and `agent_safety`.
- Added a benchmark report skeleton for `prompt_diagnosis`.
- Rechecked release assets and kept registry `test_count` tied to installable asset evidence: writing=10, prompt_diagnosis=10, agent_safety=14.
- Added `npm run audit:public-confidence` to block over-claiming reference-domain evidence.
- Added the reference-domain benchmark runbook and raw-output directory contracts.
- Recorded a Codex CLI precheck: `kdna available` and `kdna load` pass, while `kdna verify @aikdna/writing --json` exposes installable-asset judgment quality blockers.

### KDNALAB Pipeline Fixes (2026-06-03, second pass)

Five external-audit-identified blockers resolved in `aikdna/kdna-lab` PR branch:

1. **Per-domain Best Prompt baselines** — Replaced generic KDNA communicator template with domain-specific strong baselines: writing (editorial structural diagnosis), prompt_diagnosis (prompt-debugging root-cause), agent_safety (irreversible-action safety gate).
2. **Scored artifact metadata inheritance** — `benchmark-run-v1.scored.json` now inherits provider, model, base_url, domain_version, asset_digest, content_digest, and input_hash from the raw benchmark artifact.
3. **Public artifact path portability** — `output_path` fields now use repo-relative paths instead of local absolute paths.
4. **L2 provider-error handling** — Cases with provider errors (timeout, empty output) receive `status: not_run` in L2 scoring. Judge is not called for these cases.
5. **Regression tests** — 12 new tests verify all four fixes. KDNALAB test suite: 45 passed.

Main repo CI fix: format check, release preflight, and Node 18 compatibility resolved. All tests pass locally.

### Remaining Blockers

These pipeline fixes are correctness improvements, not quality evidence. The writing and prompt_diagnosis 30×3 benchmark runs must be re-executed with the corrected baselines before any results can be used as quality evidence. The earlier 90-output runs are pipeline readiness evidence only.

## Not Yet Complete

These are release blockers, not polish items:

| Blocker | Current state | Required state |
| --- | --- | --- |
| Reference domains validated | `writing`, `prompt_diagnosis`, and `agent_safety` now each have 30 standard source `eval-*.json` cases, public rubric/report coverage, and limitations docs. Published release assets still expose older eval counts, so registry `test_count` remains tied to the installable assets. All remain `tested`. | Each domain needs a republished signed asset, raw outputs, automated scoring run artifacts, and regression comparison before `validated`. |
| Installable asset sync | Source repos have newer eval specs than the current release assets: writing source=30 / asset=10, prompt_diagnosis source=30 / asset=10, agent_safety source=30 / asset=14. | Repack, sign, release, update registry digest, then rerun registry remote validation and public-confidence audit. |
| Live agent smoke matrix | Documentation exists; live Codex, Claude Code, OpenCode, Cursor, and MCP sign-offs are not complete. | Each row needs tester, date, KDNA_HOME, loaded domain marker, before/after output, and trace/debug proof. |
| External contributor trial | CONTRIBUTING and issue templates exist; no non-maintainer trial evidence yet. | A non-maintainer must complete fork, install, conformance, registry-entry draft, and PR. |
| SPEC MUST traceability | Non-negotiable rules are tested; full MUST/SHOULD table is not complete. | Every normative MUST maps to schema, conformance fixture, CLI behavior, registry validation, or a documented exception. |
| Registry republish gap | `@aikdna/requirement_alignment` is honest `pending_v0.7_republish`. | Republish signed asset or keep it non-installable. |

## Public Messaging Rules

- Say: "KDNA is the open judgment asset protocol for AI agents."
- Say: "Same model, same input, different judgment path."
- Say: "The current official domains are tested; validated promotion is evidence-gated."
- Do not say the three reference domains are validated until the registry evidence gates pass.
- Do not present source eval expansion as installed asset evidence until signed
  release assets are republished.
- Do not imply all agent integrations have live smoke proof until sign-off records exist.
- Do not present marketplace, store, enterprise console, OCI distribution, or paid domains as v1.0-rc deliverables.
