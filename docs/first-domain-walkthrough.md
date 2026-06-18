# First Domain Walkthrough — Writing Judgment

> This walkthrough uses the current KDNA Core v1 path: local `.kdna` files,
> `kdna validate`, and `kdna load`. It does not depend on a public registry,
> marketplace, signature system, or quality badge.

## Goal

See how a real KDNA judgment asset changes what an agent notices.

The example domain is `@aikdna/writing`, which teaches an agent to diagnose
writing at the argument and structure level before it reaches for surface
editing.

---

## 1. The problem without KDNA

Ask an AI agent:

```text
Help me improve this product launch post.
```

Without a judgment asset, many agents default to language-level advice:

- make the headline catchier
- shorten sentences
- add more energy
- improve transitions

That may be useful, but it often misses the deeper issue: weak argument,
unclear stakes, missing evidence, or no reason for the reader to care.

KDNA gives the agent a portable judgment structure for deciding what kind of
problem it is looking at.

---

## 2. Install the CLI

```bash
npm install -g @aikdna/kdna-cli
```

---

## 3. Get a v1 writing asset

If you are working from the `kdna-writing` repository after the v1 flagship
artifact has been accepted, use the checked-in v1 container:

```bash
cd kdna-writing
kdna validate ./dist/writing-v1.kdna
```

If you are testing the toolchain from source, export the current source through
Studio CLI:

```bash
npm install -g @aikdna/kdna-studio-cli
kdna-studio migrate ./kdna-writing --format v1 --out ./writing-v1.kdna
kdna validate ./writing-v1.kdna
```

Expected validation result:

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

## 4. Load compact judgment context

```bash
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

The compact profile emits the agent-readable judgment context. It should
include the writing domain's core axioms and boundary checks, for example:

- writing problems are often structural, not merely language-level
- identify the argument gap before polishing prose
- avoid generic feedback that cannot be traced to a diagnosis
- run self-checks before returning a final review

The output is not meant to be quoted back to the user. It is context the agent
uses while producing its answer.

---

## 5. Load full JSON for inspection

```bash
kdna load ./writing-v1.kdna --profile=full --as=json
```

The full profile is for inspection, testing, and tool integration. It should
retain the richer payload structure:

- `core.axioms`
- `core.boundaries`
- `patterns`
- `scenarios`
- `cases`
- `reasoning.self_checks`
- `reasoning.failure_modes`
- `evolution`

This is the proof that the v1 asset is not only a minimal fixture. It carries
real domain judgment.

---

## 6. Use it with an agent

Install the loader skill for your local agent:

```bash
kdna setup
kdna doctor --agents
```

Then provide the compact profile to the agent runtime or use the loader skill
where supported:

```bash
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

Ask the same review task again:

```text
Review this launch post for structural quality.
```

With the writing judgment loaded, the agent should focus on:

- whether the post has a real claim
- whether the opening creates a cognitive gap
- whether evidence supports the claim
- whether the advice is structural or only stylistic
- whether the response passes the domain self-checks

---

## Summary

| Step | Command | What it proves |
|---|---|---|
| Export or locate asset | `kdna-studio migrate ... --format v1` or `dist/writing-v1.kdna` | A real source asset can become a v1 container |
| Validate | `kdna validate writing-v1.kdna` | Format, schema, payload, checksums, and load contract pass |
| Compact load | `kdna load --profile=compact --as=prompt` | Agent-readable judgment context exists |
| Full load | `kdna load --profile=full --as=json` | Rich payload structure is preserved |
| Agent setup | `kdna setup` | The loader skill can connect local assets to supported agents |

A KDNA domain is not a prompt or a knowledge base. It is a portable judgment
asset that an agent can validate, load, and apply when the task calls for that
domain's judgment.
