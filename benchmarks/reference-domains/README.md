# Reference Domain Benchmark Standard

Reference domains are the first assets external developers use to judge whether
KDNA is real. Each reference domain should publish the same evidence shape.

## Required Files Per Domain

```text
docs/known-limitations.md
evals/
benchmarks/report.md
```

## Report Sections

- Scope
- Out of scope
- Baselines compared
- Evaluation cases
- Scoring rubric
- Results
- Failure cases
- Next benchmark improvement

## Baselines

Reference benchmarks should compare KDNA against:

- No KDNA
- Best prompt
- Skill only
- RAG context when relevant
- Human expert rubric when available

## Current Reference Domains

- `@aikdna/agent_safety`
- `@aikdna/writing`
- `@aikdna/open_source_project`
