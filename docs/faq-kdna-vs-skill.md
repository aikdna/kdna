# FAQ: KDNA vs Skill, Prompt, and AI Ecosystem

## What is KDNA?

KDNA is a **judgment asset format**. A `.kdna` file encodes how to judge the quality
of work in a specific domain — when something is good enough, when to stop, what
not to say, what misunderstandings to avoid.

It is NOT a prompt, a skill, a workflow, a knowledge base, or a rules file.

---

## Is KDNA a Skill?

No. **Skill is execution, KDNA is judgment.**

| | Skill | KDNA |
|---|-------|------|
| What it does | Executes a procedure | Judges quality |
| Answers | "How do I do this?" | "Is this good enough?" |
| Example | "Write a PR review" | "Is this review rubber-stamp or behavior-first?" |
| Format | Code / tool calls / steps | Structured judgment axioms, stances, banned terms |

---

## Can KDNA and Skill be used together?

Yes. This is the recommended pattern:

1. **Skill** executes the task (e.g., review a PR, write a blog post)
2. **KDNA** loads alongside it and injects judgment guidance into the agent's context
3. The agent uses KDNA to judge its own output before delivering it

Example: a PR review Skill + a code-review KDNA → the agent catches architectural
issues that a rule-based Skill would miss.

---

## Can a .kdna file contain a Skill?

No. `.kdna` files contain structured judgment data (axioms, stances, banned terms,
misunderstandings, self-checks). They do not contain executable code, tool calls,
or workflow steps.

---

## What is a Work Pack?

A Work Pack is a **future concept** (design phase). It would define a multi-step
agent task with role bindings, review gates, and KDNA domain dependencies.

**Is Work Pack available now?** Treat Work Pack as an evolving application-layer concept, not part of KDNA format validity.
Do not use it in production. See [tool-status-matrix.md](tool-status-matrix.md).

---

## What is a Cluster?

A Cluster is the **explicit advanced multi-asset path**. It coordinates
multiple scoped KDNA assets under roles, routing, conflict, budget, and trace
controls.

**Is Cluster available now?** The CLI Cluster runtime is beta. Use a single
asset by default; choose Cluster only when the task truly needs multiple assets.

---

## When should I write a Skill?

Write a Skill when:
- You need the agent to follow a specific procedure
- The task has clear steps (validate → review → report)
- The value is in the execution, not the judgment

---

## When should I write a KDNA?

Write a KDNA when:
- The task requires judgment, not just execution
- You want the agent to catch its own mistakes
- You have domain expertise to encode (banned terms, failure modes, misunderstandings)
- You want consistent quality standards across different agents/models

---

## Can one Skill use multiple KDNA assets?

Yes. A Skill can load multiple KDNA assets if the task spans multiple judgment domains.
For example, a "publish blog post" Skill might load:
- `writing.kdna` (primary — judge the content)
- `brand-voice.kdna` (constraint — enforce brand boundaries)

---

## Can one KDNA guide multiple Skills?

Yes. A single KDNA asset is domain-specific, not task-specific. A `code-review.kdna`
asset can guide any Skill that does code review, regardless of the specific tool
or workflow.

---

## KDNA vs Prompt — what's the difference?

| | Prompt | KDNA |
|---|--------|------|
| Format | Free text | Structured (axioms, stances, banned terms) |
| Verification | None | `kdna validate` + schema gate |
| Reuse | Copy-paste | Installable `.kdna` file |
| Judgment depth | Surface-level | Encodes failure modes, misunderstandings |
| Versioning | Ad-hoc | `judgment_version` + lineage |

---

## KDNA vs Memory (RAG) — what's the difference?

Memory/RAG retrieves **facts**. KDNA encodes **judgment**.

RAG says "this document contains X." KDNA says "when you see X, consider Y; Z is
a common misunderstanding; don't say W."

They are complementary. You can use RAG for facts and KDNA for judgment.

---

## KDNA vs MCP — what's the difference?

MCP (Model Context Protocol) connects agents to **tools**. KDNA connects agents to
**judgment standards**.

MCP says "here's a function to search the database." KDNA says "before you search,
check if the query is safe; if the user asks for PII, refuse."

---

## Current GA capabilities

| Command | Status |
|---------|--------|
| `kdna inspect` | GA |
| `kdna validate` | GA |
| `kdna plan-load` | GA |
| `kdna load --profile=compact --as=prompt` | GA |
| `kdna pack` | GA |
| `kdna unpack` | GA |
| `kdna demo minimal` | GA |
| `kdna lint` | GA |
| `kdna workpack` | GA |

Commands to **not** use: `kdna available`, `kdna match`, `--as=json`, `--as=raw`,
`kdna load @scope/name`. These are legacy or removed.

---

## Where should I start?

1. `npm install -g @aikdna/kdna-cli`
2. `kdna demo minimal /tmp/hello`
3. `kdna pack /tmp/hello /tmp/hello.kdna`
4. `kdna validate /tmp/hello.kdna`
5. `kdna plan-load /tmp/hello.kdna`
6. `kdna load /tmp/hello.kdna --profile=compact --as=prompt`

For creating your own: see [first-domain-walkthrough.md](first-domain-walkthrough.md).
