# Getting Started with KDNA

> [中文版](./getting-started.zh.md)

KDNA Core v1 has one verified path: create scoped `.kdna` assets locally through Studio CLI, validate them with the runtime CLI, and load them into agent context. No registry, no marketplace, no quality badges.

---

## Install the toolchain

```bash
npm install -g @aikdna/kdna-cli @aikdna/kdna-studio-cli
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
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
```

### Approve and export

```bash
kdna-studio card approve my-domain <card-id> --by <your-id> --statement "I confirm this judgment for v1 export."
kdna-studio export my-domain --format v1 --out dist/my-domain.kdna
```

---

## Validate

```bash
kdna validate dist/my-domain.kdna
kdna plan-load dist/my-domain.kdna
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
kdna load dist/my-domain.kdna --profile=compact --as=prompt
```

This emits agent-readable judgment context. The agent references the judgment structure silently — users see better answers, not KDNA internals.

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

## What is NOT the current official path

- `kdna dev scaffold` — Experimental creator utility; not the public consumption path
- `kdna dev pack` — Experimental creator utility; not the official Studio v1 export path
- Manual JSON editing — Valid for early prototyping but does not produce official v1 Studio exports
- `kdna setup` — Legacy agent auto-detection; not part of the current v1 verify/load path
- Registry-based install (`kdna install <domain>`) — Legacy path; Core v1 does not define a public registry

---

## What KDNA Does Not Do

KDNA is a judgment layer, not:
- A prompt library (it doesn't store wording templates)
- A knowledge base (it doesn't store facts or documents)
- A tool API (it doesn't execute actions)
- A retrieval system (it doesn't search external data)
- An operating manual (it doesn't describe procedures)

It sits between your agent and its task, shaping how the agent thinks before it acts.
