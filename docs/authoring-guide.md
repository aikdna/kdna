# Authoring a `.kdna` Judgment Work

English | [简体中文](./authoring-guide.zh.md)

This guide covers both halves of creating a great `.kdna` file: **what makes a judgment worth preserving**, and **how to build, verify, protect, and evolve it with `@aikdna/kdna-cli@0.45.2`** (Container `0.6.0`, Node.js `>=22`, permanently account-free).

---

## 1. Start from a Real, Focused Angle

Do not try to squeeze an entire profession or life philosophy into one file. Start with a concrete angle where your taste, trade-offs, or experience clearly differ from generic default answers:

- **Too broad:** `writing` or `management`
- **Focused and sharp:** `nonfiction-essay-craft`, `minimal-ui-taste`, `pragmatic-code-review`, or `underdog-negotiation`

A `.kdna` work can hold six focused judgments on a single craft or forty-five connected judgments across a full topic. What makes it a real judgment work is clarity—not length.

## 2. What Makes a Good Judgment Entry

Every judgment in a `.kdna` work works best when it answers four concrete questions:

1. **Concrete question (`focus`)**: What real dilemma or decision does this judgment answer?
2. **Clear stance & trade-off (`core_expression` + `reasons`)**: When two good goals collide (fast vs. careful, concise vs. exhaustive, bold vs. restrained), what do you protect first, what do you willingly give up, and why?
3. **Working method & examples (`method` + `materials`)**: How do you actually evaluate a real draft, design, or situation? Include concrete positive/negative examples or source grounding.
4. **Stop line & anti-misuse (`boundaries`, `exceptions`, `misuse`)**: Where does this judgment apply, what specific exceptions suspend it, and how do people (or AI models) commonly misapply it?

### Slogan vs. Real Judgment

| Weak (slogan) | Strong (real judgment) |
| --- | --- |
| “Good writing should be clear.” | “Put the real contradiction in paragraph one; cut decorative transitions; leave an open question honest rather than forcing a neat moral.” |
| “Users come first.” | “When a user asks for feature X, identify the job they want finished before scoping X. Never ship a workaround that breaks core simplicity.” |
| “Review code carefully.” | “Hunt data corruption, race conditions, and silent failures first. Cap each review at the 3 highest-risk issues rather than burying them under 15 style nits.” |

---

## 3. Co-Create with an AI Agent (Recommended)

You do not need to hand-write JSON from scratch. The easiest path is to let your AI Agent (Claude Code, Cursor, Codex, OpenCode, or Antigravity) interview you, draft the judgments, show you a human-readable review list so you can approve or revise every entry, and compile the `.kdna` file using `@aikdna/kdna-cli@0.45.2` (or the `kdna-creator` skill in [`aikdna/kdna-skills`](https://github.com/aikdna/kdna-skills)).

---

## 4. Build, Validate, Protect, and Revise with the CLI

### Option A: Quickstart via `kdna init` (`kdna.draft/1`)

```bash
# 1. Generate a starter draft (modes: minimal | interview | works | research)
npx -y @aikdna/kdna-cli@0.45.2 init --example --mode interview --output draft.json

# 2. Edit draft.json with your judgments, reasons, boundaries, method, and example, then check it
#    (Note: kdna.draft/1 accepts core judgment fields only; to add exceptions, misuse, or
#    relationships, run `kdna compile draft.json --output author-input.json` first — see Option B.)
npx -y @aikdna/kdna-cli@0.45.2 validate-input draft.json --format human

# 3. Compile into a Container 0.6.0 .kdna file
npx -y @aikdna/kdna-cli@0.45.2 create --draft draft.json --output my-work.kdna --allow-create

# 4. Verify integrity and inspect what Agents will see
npx -y @aikdna/kdna-cli@0.45.2 validate my-work.kdna
npx -y @aikdna/kdna-cli@0.45.2 read my-work.kdna --mode catalog --format human --allow-read
```

### Option B: Full Authored JSON (`{ manifest, payload, members }`)

For full control over `shared_declarations`, typed `relationships` (`support`, `qualify`, `conflict`, `complement`), `sources`, `materials`, and `history`, see the minimal runnable template at [`docs/examples/author-input-minimal.json`](./examples/author-input-minimal.json) and pass it directly to `kdna create`:

```bash
npx -y @aikdna/kdna-cli@0.45.2 create author-input.json --output my-work.kdna --allow-create
```

### Local Password Encryption (`RFC-0018`, Offline & Account-Free)

```bash
printf '%s' 'your strong passphrase' > password.txt
npx -y @aikdna/kdna-cli@0.45.2 protect my-work.kdna --output my-work.locked.kdna --password-file password.txt
```

### Revising and Comparing Versions (`1.0.0` → `1.1.0`)

When real practice surfaces a counterexample, update your work into a new version and inspect every change in plain text before sharing or adopting it:

```bash
npx -y @aikdna/kdna-cli@0.45.2 diff my-work-1.0.0.kdna my-work-1.1.0.kdna --format human
```

---

## 5. Pre-Release Checklist

- [ ] Every judgment answers a concrete, recognizable question (`focus`) with an explicit trade-off.
- [ ] Asset-level `scope`, `boundaries`, and judgment-level `misuse` / `exceptions` clearly state where the work stops.
- [ ] Related judgments are linked honestly (`support`, `qualify`, `conflict`, `complement`) so selective reading keeps essential premises together.
- [ ] Authorship, version, and license metadata accurately reflect who created and approved the work.
- [ ] `npx -y @aikdna/kdna-cli@0.45.2 validate <file.kdna>` reports `accepted`, and opening the file in **KDNA Reader** reads cleanly to a human eye.
