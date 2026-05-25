> ⚠️ **This document has been superseded by [Judgment Systems](./judgment-systems.md) and [KDNA and the AI Stack](./kdna-and-ai-stack.md)**. The concepts here are now better explained in the core documents.
>
# KDNA and LLM Wiki

KDNA and LLM Wiki are complementary layers. They solve different problems and work best together.

## The Layers

```
raw materials       (notes, transcripts, meeting logs, research)
        │
        ▼
LLM Wiki            (linked Markdown knowledge base, structured for agents)
        │
        ▼
KDNA                (domain judgment: axioms, patterns, judgment encoding)
        │
        ▼
Skills / Agents     (execution: tools, workflows, task completion)
```

## LLM Wiki: Knowledge Organization Layer

LLM Wiki turns raw materials into an organized, linkable Markdown knowledge base. It answers:

- What does this team know about X?
- How do these concepts relate to each other?
- Where can I find the standard definition of Y?

LLM Wiki works on **knowledge structures**. It organizes, links, and surfaces.

## KDNA: Cognition / Judgment Encoding Layer

KDNA turns organized knowledge into domain judgment. It answers:

- What assumptions should an agent start from in this domain?
- What terms should an agent avoid?
- What misunderstandings should an agent detect early?
- How should an agent reason from principles to action?

KDNA works on **judgment shapes**. It encodes how a domain expert thinks, not just what they know.

## Relationship

LLM Wiki is KDNA's natural upstream.

LLM Wiki provides the knowledge base from which KDNA is extracted. A well-organized LLM Wiki about code review, for example, might describe what blocking issues are, what common reviewer mistakes look like, and what principles guide good reviews.

KDNA reads this organized knowledge and distills it into:

- **Axioms** — the irreducible starting assumptions
- **Ontology** — what each concept really means and where its boundary is
- **Banned terms** — language that distorts judgment
- **Misunderstandings** — common wrong interpretations and their corrections
- **Scenarios** — concrete signals and response patterns
- **Reasoning chains** — principles to practical consequences

## What KDNA Does NOT Do

KDNA does not replace LLM Wiki. Specifically:

- KDNA does not store long-form reference material
- KDNA does not copy Wiki pages
- KDNA is not a personal knowledge management tool
- KDNA does not replicate document links or cross-references
- KDNA does not serve as a reading surface for humans

An LLM Wiki page might be 500–2000 words explaining a concept with examples and links. The corresponding KDNA entry would be 1–3 sentences capturing the judgment boundary — what the agent must internalize to avoid errors.

## Recommended Pipeline

For teams building agent systems:

1. **Write raw materials** — capture domain knowledge in notes, docs, transcripts
2. **Build LLM Wiki** — organize into linked, searchable Markdown knowledge
3. **Extract KDNA** — distill the judgment layer from the Wiki
4. **Load into agents** — agents load KDNA before executing skills

The result: agents that don't just access knowledge, but think with it.

## The Core Distinction

> LLM Wiki turns documents into knowledge.  
> KDNA turns expertise into judgment.
