# Your First Domain

> Short guide. For a detailed end-to-end walkthrough, see [First Domain Walkthrough](./first-domain-walkthrough.md).

Build a working KDNA judgment asset in 10 minutes and see how it can be
validated and loaded.

## Step 1: Install

```bash
npm i -g @aikdna/kdna-cli
```

## Step 2: Create a Dev Source Workspace

```bash
kdna demo minimal ./my-domain
```

This creates a minimal v1 source directory with `mimetype`, `kdna.json`,
`payload.kdnab`, and `checksums.json`. For real authoring, use the Studio CLI
producer path in [30-minute-authoring-guide.md](./30-minute-authoring-guide.md).

## Step 3: Inspect

```bash
kdna inspect ./my-domain
```

You'll see the asset ID, title, version, payload path, and load profiles.

## Step 4: Pack and Validate

```bash
kdna pack ./my-domain ./my-domain.kdna
kdna validate ./my-domain.kdna
```

Validation should return `overall_valid: true`.

## Step 5: Load the Judgment Context

```bash
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

This emits agent-readable context. For real domains such as writing, this
context changes what the agent notices: argument structure, boundaries,
failure modes, and self-checks.

## Step 6: Create Your Own Formal Domain

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio create my-domain --name @yourscope/my-domain
```

After adding and locking your judgment material, export to v1:

```bash
kdna-studio migrate ./my-domain --out ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna load ./my-domain.kdna --profile=compact --as=prompt
```

**Next step:** [Loader Behavior](/en/docs/loader-behavior) — understand how agents should use KDNA.
