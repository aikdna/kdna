# Create your first KDNA judgment asset in 30 minutes

## What this guide covers

This guide shows how to use the official KDNA Studio toolchain to create
your own `.kdna` judgment asset — starting from scratch and ending with a
validated, packable asset.

## Current status

| Layer | Status | What it means |
|---|---|---|
| KDNA Asset Container | stable | `.kdna` container, `mimetype`, `kdna.json`, `payload.kdnab`, and `checksums.json` are the current local asset baseline. |
| Runtime CLI | beta-ready | `kdna inspect`, `kdna validate`, `kdna plan-load`, `kdna load`, `kdna pack`, and `kdna unpack` work for local assets. |
| Studio authoring CLI | beta | `kdna-studio` is the official authoring path, but commands and UX may still change between beta releases. |
| Agent / MCP loading | preview | Loader and MCP paths use the same LoadPlan-first contract, but agent-specific integration quality varies by runtime. |
| Evidence and provenance layers | optional / independently versioned | Human Lock, signatures, release evidence, authorization, and evaluation reports do not decide KDNA format validity. |

## Step 1: Install the Studio CLI

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio --help
```

## Step 2: Create a project

```bash
kdna-studio create my_expertise --name @yourscope/my_expertise
```

This creates a Studio project directory with the files needed to author a
KDNA judgment asset.

## Step 3: Add judgment material

Add at least one judgment card. This minimal example creates one axiom
with applicability boundaries:

```bash
kdna-studio card add my_expertise axiom \
  --field one_sentence="KDNA assets preserve judgment before style." \
  --field full_statement="A KDNA asset must preserve boundaries, self-checks, and failure modes before presentation polish." \
  --field why="Without boundaries, a KDNA asset becomes a prompt template instead of reusable judgment." \
  --field applies_when="teaching KDNA to a new user" \
  --field does_not_apply_when="only demonstrating CLI syntax" \
  --field failure_risk="Users may copy the format without preserving judgment."
```

A minimal valid `.kdna` payload contains:
- A `highest_question` — what single question does this judgment answer?
- One or more `axioms` — the core principles
- Optional: `patterns`, `scenarios`, `cases`, `reasoning`, `evolution`

## Step 4: Review and approve for Studio export

```bash
kdna-studio card list my_expertise
kdna-studio card approve my_expertise --all \
  --by your-id \
  --statement "I confirm this judgment for v1 export."
```

The current Studio CLI export workflow requires approved cards so the exported
file carries explicit release evidence. That approval is Studio provenance; it
does not make Human Lock a KDNA Core format-validity requirement.

## Step 5: Compile and export

```bash
kdna-studio export my_expertise --format v1 --out ./my_expertise.kdna
```

This produces a `.kdna` container with `mimetype`, `kdna.json`,
`payload.kdnab`, and `checksums.json`.

## Step 6: Validate with the official CLI

```bash
kdna inspect ./my_expertise.kdna
kdna validate ./my_expertise.kdna
kdna plan-load ./my_expertise.kdna
kdna load ./my_expertise.kdna --profile=compact --as=prompt
```

If you are migrating an existing KDNA source folder or a Studio project, use
the migration command:

```bash
kdna-studio migrate my_expertise --format v1 --out ./my_expertise.kdna \
  --by your-id \
  --statement "I confirm this migration for v1 export."
```

## Current limitations

- **Authoring path is beta.** The `kdna-studio` CLI is part of the official
  KDNA toolchain but the authoring surface is still evolving.
- **Official authoring path.** Public beta examples should be exported through
  the official KDNA Studio toolchain. Third-party authoring tools should
  integrate through the official Studio SDK or CLI so the output remains a
  standard packaged `.kdna` file.
- **Validation is structural.** A validated `.kdna` file is structurally
  correct; it does not automatically carry a trust, quality, or distribution
  endorsement.

## Next

- Return to the [5-minute path](./try-kdna.md) to validate your asset.
- See [15-minute agent guide](./15-minute-agent-guide.md) to load the
  authoring output into your AI agent.
- See [docs/status.md](./status.md) for current product-layer maturity.
