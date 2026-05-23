# Your First Domain

Build a working KDNA domain in 10 minutes and see how it changes agent judgment.

## Step 1: Install

```bash
npm i -g @aikdna/kdna-cli
```

## Step 2: Create from Template

```bash
kdna init my-domain
```

This scaffolds a minimal domain with placeholder axioms, concepts, stances, and self-checks. It passes validation immediately.

## Step 3: Inspect

```bash
kdna inspect ./my-domain
```

You'll see: 1 axiom, 1 ontology concept, 1 framework, 2 stances, 2 banned terms, 2 self-checks.

## Step 4: Understand the Judgment Structure

Open `KDNA_Core.json`. Notice:

- **Axioms** are not vague advice. They are specific, testable principles. Example: "Clarity is the writer's only obligation."
- **Ontology** defines what concepts mean and their boundaries. Example: "Cognitive load is mental effort, not dumbing down."
- **Stances** declare the domain's default posture. Example: "Writing serves understanding, not intellectual display."

Open `KDNA_Patterns.json`. Notice:

- **Banned terms** include words like `"obviously"` — each with an explanation of why it misleads and what to use instead.
- **Misunderstandings** capture wrong assumptions. Example: "Good writing needs complex vocabulary" — this is false.
- **Self-checks** are yes/no questions the agent asks itself before responding.

## Step 5: See the Difference

**Without KDNA** — if you ask an agent to "review this blog post," it gives generic editing advice.

**With writing KDNA loaded** — the same agent:

1. Checks whether each paragraph serves a single clear idea
2. Flags sentences that use banned terms like "obviously" or "clearly"
3. Asks: "Can every sentence be understood by the target reader on first reading?"
4. Suggests deletion more than rewriting — because the domain's stance is "every sentence must earn its place"

This is the core shift: **KDNA changes what the agent notices, not just what words it uses.**

## Step 6: Create Your Own Domain

```bash
kdna init my-domain
```

Edit `KDNA_Core.json` — write 2-3 axioms for your domain. Then:

```bash
kdna publish --check ./my-domain
kdna validate ./my-domain
kdna verify ./my-domain
```

**Next step:** [Loader Behavior](/en/docs/loader-behavior) — understand how agents should use KDNA.
