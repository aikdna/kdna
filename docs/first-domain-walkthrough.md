# First Domain Walkthrough — Writing Judgment

> This walkthrough uses the current KDNA Core v1 path: download a `.kdna` file,
> validate it, plan-load it, and load it into an agent.

## Goal

See how a real KDNA judgment asset changes what an agent notices.

The example asset is `writing-v1.kdna`, which teaches an agent to diagnose
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

## 3. Download and validate a `.kdna` asset

Download `writing-v1.kdna` from the official examples page, then:

```bash
kdna validate ./writing-v1.kdna
kdna plan-load ./writing-v1.kdna
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

Start from the packaged `.kdna` file. Use source folders only when you are
authoring, auditing, or intentionally unpacking the file for editing.

---

## 4. Load compact judgment context

```bash
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

The compact profile emits the agent-readable judgment context. It should
include the writing domain's core axioms and boundary checks:

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

This is the proof that the v1 asset carries real domain judgment — not a
minimal fixture.

---

## 6. Use it with an agent

Provide the compact profile to the agent runtime:

```bash
kdna load ./writing-v1.kdna --profile=compact --as=prompt
```

For supported agents, the `kdna-loader` skill in [kdna-skills](https://github.com/aikdna/kdna-skills)
provides automatic discovery of local `.kdna` assets.

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
| Download | Get `writing-v1.kdna` from examples page | Public asset is a `.kdna` file, not a repo |
| Validate | `kdna validate writing-v1.kdna` | Format, schema, payload, checksums, and load contract pass |
| Plan-load | `kdna plan-load writing-v1.kdna` | Asset is ready for agent loading |
| Compact load | `kdna load --profile=compact --as=prompt` | Agent-readable judgment context exists |
| Full load | `kdna load --profile=full --as=json` | Rich payload structure is preserved |

A KDNA domain is not a prompt, a knowledge base, or a GitHub repository. It is a
portable `.kdna` judgment asset that an agent can download, validate, and load.
