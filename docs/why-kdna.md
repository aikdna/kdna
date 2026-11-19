# Why KDNA

Prose has documents (`.md`, `.pdf`). Numbers and models have spreadsheets. Talks have slide decks. Linked pages have HTML, and deterministic logic has code. Every enduring form of human work eventually earned a file format shaped around what it actually carries.

Human **thinking, judgment, trade-offs, boundaries, and taste** have lacked that independent form. People already work with AI every day to write, design, plan, code, and decide—yet the real judgment behind good outcomes stays scattered across chat transcripts, one-off instructions, and half-remembered habits. Open a new session and the reasoning disappears. Switch tools and you start explaining your taste from scratch. Share a conclusion with a teammate and the conditions that made it safe get left behind.

As AI makes finished prose, layouts, and code effortless to produce, what remains rare—and truly defines the quality of the outcome—is the upstream thinking, judgment, and taste behind them. KDNA (`.kdna`) gives that judgment its own open file format so it can be kept, read by humans, shared, carried across AI tools, and evolved over time as a **“work”** in its own right.

## Smooth answers can quietly erase real judgment

Modern AI models are trained to sound polished and broadly agreeable. That strength comes with a quiet side effect: asked to “improve” a draft or “help decide,” a model often keeps the surface polish while flattening the author's actual stance, trade-off priority, or stopping line.

Consider a concrete example recorded in *KDNA Whitepaper* `v1.0.2` (`judgment:origins`). A diagnostic method defines a four-cell matrix whose strict purpose is to examine the **other party's** real constraints and risk exposure before taking action. During an AI-assisted rewrite, the model preserved the exact matrix and vocabulary—yet quietly flipped the subject to evaluate the **proposer's own** internal readiness instead. The text looked cleaner than ever, while the core object of judgment had vanished.

A real judgment work prevents that drift by keeping four things explicit and inseparable:

| Question | What a `.kdna` work preserves |
| --- | --- |
| **What are you actually watching?** | The core question, focal object, and signals that must not be silently swapped |
| **When good goals collide, what wins?** | Explicit trade-off priorities and what you deliberately give up |
| **Where must it stop?** | Applicable conditions, exceptions, misuse warnings, and the line where a human takes over |
| **How does it grow?** | Named revisions (`1.0.0` → `1.1.0`) when real counterexamples sharpen your thinking |

These four elements work together. A rule without boundaries gets over-applied. A taste without reasons can't be taught or questioned. A conclusion without version history silently drifts over time.

## A format for judgment—from six focused choices to a full system

A `.kdna` work does not try to clone a person's entire mind. One person can keep separate, focused `.kdna` files for essay editing, UI taste, code review, or business negotiation. Whether a work captures six sharp judgments on a single craft or forty-five connected judgments across a broad topic, storing it as a `.kdna` file makes it:

- **Readable by humans first** in [KDNA Reader](https://aikdna.com/en/downloads), so you, your team, or your students can inspect the claims, reasoning, and boundaries directly.
- **Selectively readable by AI Agents** (`catalog` → `exact_selection`), bringing along supporting premises and limits whenever a judgment is used.
- **Yours to keep and protect locally**, with built-in offline password encryption (`kdna protect`) and zero account lock-in.

→ [Start Here](./start-here.md) · [Judgment Systems](./judgment-systems.md) · [Authoring Guide](./authoring-guide.md) · [Why the Name KDNA](./why-the-name.md)
