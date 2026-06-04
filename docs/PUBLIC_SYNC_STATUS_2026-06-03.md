# Public Sync Status

Date: 2026-06-03 (updated 2026-06-03 23:59)

This file separates local implementation state from public release evidence.
Only `Merged default` plus `Release-verifiable` items can be counted in the
public launch checklist. Public branches are reviewable evidence, but they are
not default-branch evidence.

## Evidence Status Table

| Work item | Local done | Public branch / PR | Merged default | Release-verifiable |
| --- | --- | --- | --- | --- |
| `START_HERE.md` and `STATE_OF_KDNA.md` | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| CLI JSON contract docs | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Public confidence audit script | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Private registry demo | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Reference benchmark runbook | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| Main repo CI (format + test + release:preflight) | Yes | https://github.com/aikdna/kdna/pull/66 | No | No |
| KDNALAB benchmark-run-v1 artifact support | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB condition-isolated output filenames | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB per-domain Best Prompt baselines | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB scored artifact metadata inheritance | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB public artifact path portability | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB L2 provider-error skip | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| KDNALAB regression test coverage (45 passed) | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| `@aikdna/writing` raw/scored benchmark evidence snapshot | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| `@aikdna/prompt_diagnosis` raw/scored benchmark evidence snapshot | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| `@aikdna/agent_safety` raw/scored benchmark evidence snapshot | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| L2 semantic scoring (3 domains, 270 outputs) | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| L3 human review sheets (3 CSVs) | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| L3 human review verdicts | No (0/270) | No | No | No |
| Cross-model benchmark (writing on Qwen) | Yes | https://github.com/aikdna/kdna-lab/pull/1 | No | No |
| Reference source eval specs to 30 | Yes | https://github.com/aikdna/kdna-writing/pull/2, https://github.com/aikdna/kdna-prompt_diagnosis/pull/1, https://github.com/aikdna/kdna-agent_safety/pull/1 | No | No |
| Signed `.kdna` assets republished with 30 eval specs | No | No | No | No |
| Registry `test_count` raised to 30 | No | No | No | No |
| `quality_badge: validated` for 3 domains | No | No | No | No |
| Codex/Claude/OpenCode/Cursor/MCP smoke matrix | Partial: smoke script exists, no live sign-offs | https://github.com/aikdna/kdna/pull/66 | No | No |

## PR Status

| PR | State | Draft | CI | Mergeable | Notes |
| --- | --- | --- | --- | --- | --- |
| kdna#66 | OPEN | **false** (ready for review) | **Green** (Validate + Eval) | Yes | Head: `399730c` |
| kdna-lab#1 | OPEN | **false** (ready for review) | **Green** (Python 3.10/11/12) | Yes | 425 files, contains benchmark artifacts |
| kdna-registry#3 | OPEN | true | — | Yes | Evidence metadata aligned |
| kdna-writing#2 | OPEN | true | — | Yes | 30 eval specs |
| kdna-prompt_diagnosis#1 | OPEN | true | — | Yes | 30 eval specs |
| kdna-agent_safety#1 | OPEN | true | — | Yes | 30 eval specs |
| kdna-cli#1 | OPEN | true | — | Yes | Naming consistency |
| kdna-skills#1 | OPEN | true | — | Yes | Naming consistency |
| kdna-website#5 | OPEN | true | — | Unknown | **Repo is private** — not public evidence |

## Current Rule

Do not describe a local file or local passing command as public evidence unless
there is a pushed public branch, PR link, default-branch commit, or release
artifact. Do not describe a public branch as merged/default evidence.

Only `Merged default` plus `Release-verifiable` items can be counted in the
public launch checklist.

## Combined Scores Path Note

The L2 combined_scores artifacts currently committed to KDNALAB PR #1 were
generated before the `_repo_rel()` path fix (commit `d06432f`). They contain
absolute paths in `case_file` and `output_file` fields. A regeneration pass
will produce repo-relative paths. These artifacts are reviewable but should be
regenerated before being treated as final public evidence.

## Next Public Sync Step

1. L3 human review: complete verdicts on 3 CSV sheets (90 rows each)
2. Regenerate L2 combined_scores with path fix applied
3. After L3: republish signed .kdna assets, update registry digests and test_count
4. Move rows to Merged default and Release-verifiable after merge
