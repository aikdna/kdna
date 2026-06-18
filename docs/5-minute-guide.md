# KDNA 5-Minute Developer Guide

> Current Core v1 path. No registry, no marketplace, no signature requirement,
> no quality badge.

## Step 1: Install the CLI

```bash
npm install -g @aikdna/kdna-cli
```

## Step 2: Create a local v1 asset

```bash
kdna demo minimal ./minimal
kdna inspect ./minimal
kdna validate ./minimal
```

## Step 3: Pack and validate the container

```bash
kdna pack ./minimal ./minimal.kdna
kdna validate ./minimal.kdna
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

## Step 4: Load for an agent

```bash
kdna load ./minimal.kdna --profile=compact --as=prompt
```

This prints agent-readable judgment context.

## Step 5: Install the loader skill

```bash
kdna setup
kdna doctor --agents
```

The `kdna-loader` skill teaches supported agents how to discover and load
local `.kdna` assets. Assets are files; they are not installed as separate
skills.

## Author your own asset

Use Studio CLI for the producer path:

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my_expertise --name @yourscope/my_expertise
kdna-studio card add my_expertise axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
kdna-studio card approve my_expertise <card-id> --by your-id --statement "I confirm this judgment for v1 export."
kdna-studio export my_expertise --format v1 --out ./my_expertise.kdna
kdna validate ./my_expertise.kdna
kdna load ./my_expertise.kdna --profile=compact --as=prompt
```

For the broader walkthrough, see:

- [Try KDNA Core v1 in 5 Minutes](./try-kdna.md)
- [Load KDNA into your AI agent in 15 minutes](./15-minute-agent-guide.md)
- [Create your first KDNA judgment asset in 30 minutes](./30-minute-authoring-guide.md)
