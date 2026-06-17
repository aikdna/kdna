# Create your first KDNA judgment asset in 30 minutes

## What this guide covers

This guide shows how to use the official KDNA Studio toolchain to create
your own `.kdna` judgment asset — starting from scratch and ending with a
validated, packable asset.

## What is stable today

- KDNA Core v1 file format (`.kdna` container, `mimetype`, `kdna.json`,
  `payload.kdnab`, `checksums.json`)
- `kdna inspect` / `kdna validate` / `kdna pack` / `kdna unpack`
- Deterministic pack (same source → same SHA-256)
- Content-neutral validation (no trust or quality-badge claims)

## What is beta

- **Studio authoring CLI** — the `kdna-studio` command is part of the
  official KDNA toolchain but the authoring path is still beta. Commands
  may change between releases.
- **Agent loading** — `kdna load` and agent integration are beta.
- **Human Lock** — the pre-v1 authoring model (Human Lock / judgment cards /
  Studio-compatible compiler) is legacy and not part of KDNA Core v1.
  Formal `.kdna` assets are created through the official KDNA Studio
  toolchain.

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

Open the project and add your domain judgment: axioms, terminology, common
misunderstandings, and self-checks. The Studio CLI guides you through
structured interviews and evidence import.

A minimal valid `.kdna` payload contains:
- A `highest_question` — what single question does this judgment answer?
- One or more `axioms` — the core principles
- Optional: `patterns`, `scenarios`, `cases`, `reasoning`, `evolution`

## Step 4: Lock your judgment

```bash
kdna-studio lock my_expertise
```

Review and confirm the judgment cards you as the human author are taking
responsibility for.

## Step 5: Compile and export

```bash
kdna-studio export my_expertise --out dist/my_expertise.kdna
```

This produces a `.kdna` container with `mimetype`, `kdna.json`,
`payload.kdnab`, and optional `checksums.json`.

## Step 6: Validate with the official CLI

```bash
kdna inspect dist/my_expertise.kdna
kdna validate dist/my_expertise.kdna
kdna pack dist/ dist/my_expertise.kdna
```

If you authored from a source directory, you can also validate the source
directly before export:

```bash
kdna validate my_expertise/
kdna pack my_expertise/ my_expertise.kdna
```

## Current limitations

- **Authoring path is beta.** The `kdna-studio` CLI is part of the official
  KDNA toolchain but the authoring surface is still evolving.
- **Formal .kdna assets** are created through the official KDNA Studio
  toolchain. Third-party authoring tools integrate through the official
  Studio SDK or CLI — not through independent reimplementation of the `.kdna`
  format.
- **No quality badges or registry.** KDNA Core v1 does not define a
  quality-badge system, content ranking, or public registry. A validated
  `.kdna` file is structurally correct; it does not carry a trust or quality
  endorsement.

## Next

- Return to the [5-minute path](./try-kdna.md) to validate your asset.
- See [15-minute agent guide](./15-minute-agent-guide.md) to load the
  authoring output into your AI agent.
- See [docs/status.md](./status.md) for the current KDNA Core v1 status.
