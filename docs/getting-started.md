# Getting Started with KDNA

> Commands on this page use published Runtime CLI **0.36.1** and Studio CLI **0.11.0**.
> Earlier assets, LoadPlan/Runtime Capsule and project/card APIs belong to those versions.
> For current source, start with [Core/Read](./core-read-current-status.md) and [Studio](https://github.com/aikdna/kdna-studio-cli#readme); the current implementation rejects these older inputs and does not support this loading or project/card workflow. Its `inspect` and `validate` commands have a different contract.

> [中文版](./getting-started.zh.md)

In this published-line walkthrough, create a scoped `.kdna` asset through
Studio CLI, validate it with the runtime CLI, plan authorization and readiness,
and then load a Runtime Capsule for the Agent.

---

## Install the toolchain

```bash
npm install -g @aikdna/kdna-cli@0.36.1 @aikdna/kdna-studio-cli@0.11.0
```

Two commands are now available:
- `kdna` — runtime CLI: inspect, validate, pack, unpack, load
- `kdna-studio` — authoring CLI: create projects, add cards, export assets

---

## Create a .kdna asset

```bash
kdna-studio create my-domain --name @yourscope/my-domain
```

This creates a Studio project (`studio.project.json`) — the canonical authoring workspace.

### Add judgment material

```bash
kdna-studio card add my-domain axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when='["teaching KDNA to a new user"]' \
  --field does_not_apply_when='["only demonstrating CLI syntax"]' \
  --field failure_risk="Users may copy the format without preserving judgment." \
  --field confidence="high" \
  --field evidence_type="practice"
```

### Approve and export

```bash
kdna-studio card approve my-domain --all --by your-id --statement "I confirm this judgment for export."
kdna-studio export my-domain --out ./my-domain.kdna
```

---

## Validate

```bash
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

Expected result:

```json
{
  "format_valid": true,
  "schema_valid": true,
  "payload_valid": true,
  "checksums_valid": true,
  "load_contract_valid": true,
  "overall_valid": true,
  "problems": []
}
```

---

## Load into agent context

```bash
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

This emits agent-readable judgment context under the runtime contract. Loading
does not guarantee a better answer or prove that the model followed every
projected judgment.

---

## Try without authoring

If you just want to see the toolchain work without creating your own domain:

```bash
kdna demo minimal ./minimal
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
kdna plan-load ./minimal.kdna
kdna load ./minimal.kdna --profile=compact --as=prompt
```

---

## Advanced workflows

The basic pre-release path is intentionally small: create or generate a
packaged `.kdna` file, validate it, plan loading, and load it. Advanced creator,
adapter, and legacy compatibility commands are tracked in
[status.md](./status.md).

---

## What KDNA Does and Does Not Replace

Prompt, Skill, Policy, Memory, knowledge, retrieval, and workflow systems can all
carry judgment. A `.kdna` payload may also contain factual premises, examples,
references, and method descriptions needed to express its judgment.

KDNA does not replace those systems. It adds a standard asset identity,
integrity, authorization, loading, and projection contract. It does not search
external data, grant tool permissions, execute a workflow, certify factual
premises, or guarantee behavior improvement.
