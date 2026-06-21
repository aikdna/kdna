# KDNA Demos

- [`skill-plus-kdna-demo`](./skill-plus-kdna-demo) — shows how a workflow skill
  changes when KDNA supplies domain judgment.

Real agent loading records showing before/after judgment changes.

## Structure

```
demos/
├── opencode/     # OpenCode agent demo
│   └── README.md  # Sales domain: price objection case
├── codex/        # Codex agent demo
│   └── README.md  # Management domain: missed deadlines case
└── README.md     # This file
```

## What each demo shows

| Demo | Domain | Scenario | Key change |
|------|--------|----------|------------|
| opencode | sales | Client says price is too high | From "offer discount" to "diagnose certainty deficit" |
| codex | management | Team missing deadlines | From "motivate harder" to "diagnose upstream system cause" |

## Key evidence

Each demo demonstrates:

1. **Input** — Same user request in both cases
2. **Without KDNA** — Generic, knowledge-level response with common mistakes
3. **With KDNA** — Domain-specific judgment shaped by axioms, terminology, and self-checks
4. **What changed** — Specific axiom applications, banned term avoidance, concept usage
5. **Loading log** — Reproducible: shows exactly which modules were loaded

## Reproducibility

These demos are behavior transcripts that show the judgment difference before
and after loading KDNA. The current public beta runtime path starts from a local
packaged `.kdna` file:

```bash
npm i -g @aikdna/kdna-cli
kdna validate <asset>.kdna
kdna plan-load <asset>.kdna
kdna load <asset>.kdna --profile=compact --as=prompt
bash scripts/demo-agent-integration.sh
```
