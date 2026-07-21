# `kdna doctor` — Diagnostic Boundary

`@aikdna/kdna-cli` includes `kdna doctor` surfaces for local implementation
diagnostics. Their results must be interpreted narrowly.

```bash
kdna doctor
kdna doctor --agents
kdna doctor --domains
kdna doctor --json
```

## What a check may establish

- a CLI binary or known directory exists;
- a Skill file exists at a known path;
- a legacy package-store entry can be enumerated;
- a selected local object passes the checks implemented by that CLI version.

## What it does not establish

- that a Skill is current, safe, or semantically correct;
- that an Agent invoked the Skill or adopted a judgment;
- that an installed asset is authorized or applicable to the current task;
- that a global package store is the required KDNA user model;
- that an answer improved.

For current file-first use, validate and plan the exact file:

```bash
kdna validate ./my-judgment.kdna
kdna plan-load ./my-judgment.kdna --json
```

Agent adapter health requires an end-to-end Host test with an exact asset,
adapter coordinate, visible attachment state, and user controls. File presence
alone must never be reported as successful integration.
