# Public Sync Status

Date: 2026-06-03

This file separates local implementation state from public release evidence.
Only `Merged default` plus `Release-verifiable` items can be counted in the
public launch checklist. Public branches are reviewable evidence, but they are
not default-branch evidence.

| Work item | Local done | Public branch / PR | Merged default | Release-verifiable |
| --- | --- | --- | --- | --- |
| `START_HERE.md` and `STATE_OF_KDNA.md` | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| CLI JSON contract docs | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Public confidence audit script | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Private registry demo | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Reference benchmark runbook | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| KDNALAB benchmark-run-v1 artifact support | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB condition-isolated output filenames | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB L2 judge assignment fix | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB agent_safety executable cases to 30 | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB process-isolated provider timeout and failure artifacts | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| `@aikdna/writing` raw/scored benchmark evidence snapshot | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| `@aikdna/prompt_diagnosis` raw/scored benchmark evidence snapshot | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| Reference source eval specs to 30 | Yes | https://github.com/aikdna/kdna-writing/pull/2, https://github.com/aikdna/kdna-prompt_diagnosis/pull/1, https://github.com/aikdna/kdna-agent_safety/pull/1 | No | No |
| Signed `.kdna` assets republished with 30 eval specs | No | No | No | No |
| Raw benchmark outputs for 3 domains | Partial: writing + prompt_diagnosis 2/3 | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| Registry `test_count` raised to 30 | No | No | No | No |
| `quality_badge: validated` for 3 domains | No | No | No | No |
| Codex/Claude/OpenCode/Cursor/MCP smoke matrix | No | No | No | No |

## Current Rule

Do not describe a local file or local passing command as public evidence unless
there is a pushed public branch, PR link, default-branch commit, or release
artifact. Do not describe a public branch as merged/default evidence.

## Pushed Branches

- `https://github.com/aikdna/kdna/tree/codex/public-confidence-gates`
- `https://github.com/aikdna/kdna-lab/tree/codex/evidence-artifact-pipeline`
- `https://github.com/aikdna/kdna-website/tree/codex/public-docs-drift-fixes`
- `https://github.com/aikdna/kdna-registry/tree/codex/registry-evidence-truth`
- `https://github.com/aikdna/kdna-writing/tree/codex/source-eval-evidence`
- `https://github.com/aikdna/kdna-prompt_diagnosis/tree/codex/source-eval-evidence`
- `https://github.com/aikdna/kdna-agent_safety/tree/codex/source-eval-evidence`
- `https://github.com/aikdna/kdna-cli/tree/codex/naming-consistency`
- `https://github.com/aikdna/kdna-skills/tree/codex/naming-consistency`

## Draft PRs

- `https://github.com/aikdna/kdna/pull/66`
- `https://github.com/aikdna/kdna-lab/pull/1`
- `https://github.com/aikdna/kdna-website/pull/5`
- `https://github.com/aikdna/kdna-registry/pull/3`
- `https://github.com/aikdna/kdna-writing/pull/2`
- `https://github.com/aikdna/kdna-prompt_diagnosis/pull/1`
- `https://github.com/aikdna/kdna-agent_safety/pull/1`
- `https://github.com/aikdna/kdna-cli/pull/1`
- `https://github.com/aikdna/kdna-skills/pull/1`

## Next Public Sync Step

Monitor CI and review for these draft PRs. Move rows only when CI and
default-branch merge evidence exist.
