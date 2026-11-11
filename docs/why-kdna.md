# Why KDNA

Prose has documents (`.md`, `.pdf`). Numbers and models have spreadsheets. Talks have slide decks. Linked information has HTML, and deterministic logic has code. Every major form of human work eventually earned a file format shaped around what it actually carries.

Human **thinking, judgment, trade-offs, boundaries, and taste** have lacked that independent form. People already work with agents every day to write, plan, design, code, and decide—yet their most hard-won judgments remain scattered across chat transcripts, prompts, Markdown notes, and tool-specific habits. A fresh session loses the reasoning. Editing one note leaves another copy stale. A teammate inherits the conclusion without the conditions that keep it safe to apply.

As AI makes finished text, code, and drafts inexpensive to generate, what stays scarce—and what truly separates outcomes—is the upstream thinking, judgment, and taste behind them. KDNA (`.kdna`) gives that judgment an independent file format so it can be kept, read, questioned, delivered, adopted, and revised as a **“work”** in its own right.

## An answer can sound fluent while erasing the judgment

General-purpose models are trained to produce broadly acceptable prose. That strength has a hidden cost: asked to “make this clearer,” an agent can return a polished, conventional draft while quietly smoothing away a specific stance, trade-off, or boundary.

Consider a concrete example recorded by KDNA’s originator, Zhang Ling (张零), from his communication training work (*Minimalist Communication* / 《极简沟通》). In his method, a state quadrant is used to observe the **counterpart’s** present emotion and sense of value. In a later AI-assisted task, an agent kept the exact four-quadrant diagram—but applied it to the **speaker** instead. The framework looked intact; the subject of judgment had silently flipped.

This is not presented as a statistical benchmark. It illustrates a structural problem: **a method can survive in appearance while its core object disappears.** A real judgment system has to make that object—and the cost of altering it—explicit.

## Four questions keep a judgment system whole

| Question | What it makes explicit |
| --- | --- |
| What core variable are you watching? | The subject, signal, and focus that must never be silently swapped |
| What prevails when good goals conflict—and what is given up? | The explicit value ordering and deliberate trade-off |
| Where must automation stop and return the call to a human? | Applicable limits, unknowns, and failure signals that halt inference or action |
| How do counterexamples revise the system? | How new evidence, mistakes, and edge cases produce a named revision without erasing lineage |

These four parts belong together. A focal variable without boundaries overreaches. A value order closed to counterexamples hardens into dogma. Revision logs without a clear object record activity, not judgment.

## Try the current CLI workflow in 30 seconds

Every `.kdna` creation, local password encryption (`0.6.0`), validation, scoped reading, and diffing workflow runs locally on Node.js `>=22` and is **permanently account-free**:

```sh
npx -y @aikdna/kdna-cli@0.43.4 init --example --mode interview --output draft.json
npx -y @aikdna/kdna-cli@0.43.4 validate-input draft.json --format human
npx -y @aikdna/kdna-cli@0.43.4 create --draft draft.json --output my-judgments.kdna --allow-create
npx -y @aikdna/kdna-cli@0.43.4 read my-judgments.kdna --mode catalog --allow-read --format human
npx -y @aikdna/kdna-cli@0.43.4 read my-judgments.kdna --mode exact_selection --judgment-id decision:first-dilemma --allow-read --compact
```

To read a complete 45-judgment public work with zero installation, open **KDNA Whitepaper v1.0.0** (*《KDNA白皮书》*, `CC BY 4.0`) directly in [KDNA Reader](https://aikdna.com/reader/?sample=kdna-whitepaper).

## An independent file gives judgment a durable lifecycle

KDNA gives an expressible judgment—or system of judgments—clear identity, versions, relationships, required context, and a predictable reading contract. People can read and evaluate a work directly in [KDNA Reader](https://aikdna.com/en/reader) before relying on it. When a work enters a task, compatible tools start from its catalog, select only the judgments relevant to the job, and keep mandatory supporting or qualifying context attached. Authors can keep private working notes separate from shared works, or encrypt sensitive files locally with a password (`kdna protect`)—permanently without any online account.

The goal is never to bottle up an entire human life or clone a personality. One person may maintain separate, focused `.kdna` works for editorial taste, architecture reviews, or teaching. What matters is whether a judgment is expressed clearly enough to be read, challenged, chosen, and improved.

Technical validation is only one piece of trust: it confirms that exact bytes satisfy the container and reading contract, never that a judgment is true, wise, or right for your situation. That always requires reading the substance, weighing evidence, and exercising human judgment.

If a simple Markdown note, a short prompt, or an existing Git workflow already serves your need, keep it. Consider `.kdna` when clear authorship, intact boundaries, human review, versioned evolution, and cross-tool portability genuinely benefit from a shared file format.

→ [Start Here](./start-here.md) · [KDNA and the AI Stack](./kdna-and-ai-stack.md) · [When to Use KDNA](./when-to-use-kdna.md) · [Core Narrative and Boundaries](./core-narrative-and-boundaries.md)
