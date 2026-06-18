# Skill + KDNA Demo

This demo shows the separation between execution flow and judgment.

- A **skill** decides the workflow: read input, identify task, produce review.
- **KDNA** supplies judgment: what to notice, what to avoid, where boundaries are.

The point is not that KDNA replaces skills. The point is that a skill without
KDNA can execute the right steps while judging the situation too generically.

## Run

Install the CLI and prepare a local v1 asset:

```bash
npm i -g @aikdna/kdna-cli
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
```

Then load the compact prompt context:

```bash
kdna load ./minimal.kdna --profile=compact --as=prompt
```

For a real writing demo, use `writing-v1.kdna` from the v1 flagship artifact
once that artifact is accepted in the `kdna-writing` repository.

## Files

- `sample-input.md` — task given to the agent.
- `skill-only-output.md` — what a workflow-only review tends to do.
- `skill-plus-kdna-output.md` — what changes when writing judgment is loaded.
- `diff-report.md` — expected judgment-level difference.

## Takeaway

Skill-only output usually improves wording and organization. Skill + KDNA first
diagnoses whether the piece has a real argument, cognitive hook, and evidence
density. That difference is the KDNA layer.
