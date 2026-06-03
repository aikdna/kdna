# State of KDNA

Date: 2026-06-03

KDNA is the open judgment asset protocol for AI agents. It is not another prompt format. A `.kdna` asset is a verifiable, signed, inspectable domain judgment asset that an agent can load before it acts.

## Stable For v1.0-rc

- `.kdna` is the canonical installed, verified, loaded, and distributed asset.
- Dev source directories are authoring workspaces, not trusted runtime objects.
- v1.0-rc manifests use `format`, `format_version`, `spec_version`, `languages`, and root `mimetype: application/vnd.aikdna.kdna+zip`.
- `kdna_spec`, singular `language`, and `application/x-kdna` are rejected by the conformance and trust test paths.
- The JS core can inspect, validate, load, render, digest-check, and decrypt open, licensed, and protected fixture assets.
- Runtime traces and app reports have shared example schemas under `specs/` and `examples/app-runtime-contract/`.
- Registry trust is asset-first: installable registry entries must declare `media_type`, `asset_url`, `asset_digest`, and trust metadata.

## Release-Candidate, Not Final

- CLI JSON outputs are now documented in [docs/cli-json-contract.md](docs/cli-json-contract.md). v1.0-rc requires additive-only field changes unless a new contract version is declared.
- Conformance is strong enough for asset-loader compatibility claims, but the golden corpus still needs more third-party implementation runs.
- Registry trust failure tests exist under `tests/registry-trust/` and pass locally with hermetic `HOME/KDNA_HOME`.
- The public registry release preflight passes, including remote asset digest checks for installable assets.
- The website dry-run deploy passes from generated protocol docs and registry data.
- Agent integration docs exist, but live Codex, Claude Code, OpenCode, Cursor, and MCP smoke results must be recorded before public launch claims.

## Evidence-Gated

- `validated` quality badges require at least 30 eval cases, automated scoring, raw outputs, rubric, benchmark report, and limitations.
- The first validated candidates are `@aikdna/writing`, `@aikdna/prompt_diagnosis`, and `@aikdna/agent_safety`; all three source repos now have 30 eval cases, but signed release assets still need to be republished before registry `test_count` can claim 30. They also need raw model outputs and completed automated scoring artifacts. The evidence contract is in [docs/reference-domain-benchmark-runbook.md](docs/reference-domain-benchmark-runbook.md).
- Existing early benchmark evidence should be described as early evidence until those gates pass.
- External contributor readiness is not complete until a non-maintainer completes fork, install, conformance, registry-entry draft, and PR.

### KDNALAB Pipeline Status (2026-06-03 update)

Five pipeline blockers identified by external audit have been resolved:

1. **Per-domain Best Prompt baselines** — Domain-specific strong baselines now exist for writing (editorial diagnosis), prompt_diagnosis (prompt-debugging root-cause), and agent_safety (irreversible-action safety gate). The previous generic KDNA communicator template is retained as fallback only.
2. **Scored artifact metadata inheritance** — Scored `benchmark-run-v1.scored.json` now inherits provider, model, domain_version, asset_digest, content_digest, and input_hash from the raw artifact instead of using `unknown`/`null`.
3. **Public artifact path portability** — `output_path` fields in benchmark-run JSON now use repo-relative paths instead of local absolute paths.
4. **L2 provider-error handling** — L2 judge now skips cases with provider errors (timeout, empty output), recording `status: not_run` instead of incorrectly scoring unreceived outputs as passed.
5. **Regression test coverage** — 12 new tests cover all four fixes above. KDNALAB test suite: 45 passed.

Important: these are pipeline correctness fixes, not quality evidence. The writing and prompt_diagnosis 30×3 benchmark runs must be **re-executed** before any results can be treated as quality evidence. The earlier 90-output runs remain classified as pipeline readiness evidence only.

## Labs And Future

These should not be presented as v1.0-rc launch requirements:

- Marketplace or store.
- Paid domains and advanced entitlement flows beyond documented licensed/protected fixtures.
- Enterprise governance console.
- OCI distribution.
- Registry federation.
- More official domains.
- Native app feature expansion.

## Current Release Rule

Do not expand the universe before v1.0-rc. Freeze, prove, and make the public path reproducible.

Current audit: [Public Confidence Audit 2026-06-03](docs/PUBLIC_CONFIDENCE_AUDIT_2026-06-03.md).
