# Why KDNA?

AI agents are becoming better at using tools, retrieving documents, and following workflows. But many failures still come from weak judgment rather than missing information.

A model may know many facts about a domain and still make poor decisions because it lacks:

- the domain's starting assumptions
- the difference between central and peripheral ideas
- the terms that should not be used and why
- the predictable traps that distort judgment in this domain
- the scenario signals that change what matters
- the reasoning path from principle to action

KDNA packages these elements into a structured, inspectable, and reusable `.kdna` file.

## The Judgment Layer

KDNA does not retrieve documents. It does not execute tools. It does not replace memory. It does not replace skills.

Instead, it shapes **how the agent interprets and uses all of the above.**

Consider the difference:

| Without KDNA | With KDNA loaded |
|---|---|
| Agent applies generic writing heuristics to every piece of content | Agent applies the specific judgment principles for *this content type* |
| Agent marks a task "done" when it has produced output | Agent checks the four explicit completion criteria before claiming done |
| Agent adds lines to AGENTS.md when asked | Agent runs the CARRY/RELOCATE/DROP/CONVERT classification before adding any line |

## The Minimum Useful Difference

A KDNA asset is useful only if the loaded agent **behaves differently** from an unloaded agent in judgment quality.

If the only difference is that the agent repeats special vocabulary, the KDNA is not working.

The test: take a task that sits squarely inside the domain. Would a domain expert answer it differently from a generalist? If no — the KDNA is not capturing real domain judgment. If yes — the KDNA should produce the domain-expert pattern, not the generalist pattern.

## What KDNA is not

KDNA is not:
- a system prompt template — it is a portable format that any compliant loader can read
- a fine-tuned model — the judgment is explicit and inspectable, not baked into weights
- a knowledge base — it does not store facts; it encodes judgment standards
- a skill or tool — it does not perform actions; it shapes the standards applied to actions

For the full comparison across all AI stack components, see
[KDNA and the AI Stack](./kdna-and-ai-stack.md).

## Try it in 5 minutes

```bash
npm install -g @aikdna/kdna-cli
curl -LO https://github.com/aikdna/kdna-assets/releases/download/agent-project-context-v0.1.2/agent-project-context-v0.1.2.kdna
kdna validate agent-project-context-v0.1.2.kdna
kdna load    agent-project-context-v0.1.2.kdna --profile=compact --as=prompt
```

→ [Start Here](./start-here.md) · [Public Roadmap](./public-roadmap.md) · [kdna-assets](https://github.com/aikdna/kdna-assets)
