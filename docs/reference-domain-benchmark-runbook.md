# Reference Domain Benchmark Runbook

This runbook defines the evidence required before an official reference domain
can move from `tested` to `validated`.

## Scope

Current v1.0-rc validated candidates:

- `@aikdna/writing`
- `@aikdna/prompt_diagnosis`
- `@aikdna/agent_safety`

## Evidence Contract

Each candidate domain MUST publish:

- At least 30 `eval-*.json` cases in `evals/`.
- A scoring rubric at `evals/scoring.json`.
- A benchmark report at `benchmarks/report.md` or `evals/BENCHMARK_REPORT.md`.
- Known limitations at `docs/known-limitations.md`.
- Raw run artifacts under `benchmarks/raw/` or `evals/raw/`.
- A regression comparison showing No KDNA, Best Prompt, and KDNA Loaded where
  applicable.

The public-confidence audit only accepts raw artifacts as `.json` or `.jsonl`
files with valid run metadata and per-case outputs. README files, empty
directories, placeholder JSON, and files without scores do not satisfy the
evidence gate.

## Raw Artifact Shape

Use one file per provider/model/run:

```json
{
  "schema": "https://aikdna.com/schemas/benchmark-run-v1.json",
  "run_id": "writing-20260603-deepseek-v4-pro",
  "created_at": "2026-06-03T00:00:00Z",
  "domain": "@aikdna/writing",
  "domain_version": "0.7.3",
  "provider": "openrouter",
  "model": "deepseek-ai/DeepSeek-V4-Pro",
  "conditions": ["no_kdna", "best_prompt", "kdna_loaded"],
  "case_count": 30,
  "cases": [
    {
      "case_id": "wr-eval-001",
      "condition": "kdna_loaded",
      "input_hash": "sha256:...",
      "output": "...",
      "scores": {
        "diagnostic_depth": 0,
        "terminology_alignment": 0,
        "boundary_awareness": 0
      },
      "pass": null,
      "notes": ""
    }
  ]
}
```

Minimum machine-checked fields:

- `domain` must match the registry domain name.
- `run_id`, `provider`, and `model` must be non-empty strings.
- `case_count` must be at least the number of public `eval-*.json` cases.
- `cases` must contain at least that many rows.
- Every row must include `case_id`, non-empty `output`, and a `scores` object.

Do not include private prompts, API keys, customer data, internal chain of
thought, or proprietary provider logs. Hash sensitive inputs when needed, but
keep enough public context in the eval spec for reviewers to reproduce the run.

## Validation

From `OPEN_SOURCE/kdna`:

```bash
npm run audit:public-confidence
```

The command MUST pass without `--allow-blockers` before any registry entry or
domain manifest claims `quality_badge: "validated"`.
