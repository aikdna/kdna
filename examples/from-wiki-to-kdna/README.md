# From Wiki to KDNA

This directory demonstrates the recommended pipeline from LLM Wiki to KDNA:

```
wiki/     →   raw materials (Markdown knowledge pages)
kdna/     →   extracted cognition (KDNA_Core.json + KDNA_Patterns.json)
```

## The Wiki (Upstream)

The `wiki/` directory contains three short Markdown pages covering code review fundamentals. Think of these as the output of an LLM Wiki — organized, linked knowledge about code review practice.

These pages describe what code review is, how to classify feedback, and what mindset produces good reviews. They are human-readable reference material.

## The KDNA (Downstream)

The `kdna/` directory contains the extracted judgment layer:

- `KDNA_Core.json` — Axioms, ontology, frameworks, core causal structure, and stances
- `KDNA_Patterns.json` — Standard terms, banned terms, common misunderstandings, and self-checks

These files encode how a code review expert thinks, not what the team knows about code review.

## What Changed During Extraction

The KDNA is not a summary of the Wiki. It is a transformation:

| Wiki (referenced) | KDNA (internalized) |
|---|---|
| "Code review should catch defects" | `axiom_safety_over_style` — a non-negotiable starting assumption |
| "Use blocking and non-blocking labels" | `blocking_issue` ontology entry with boundary and trigger signal |
| "Don't be a gatekeeper" | Banned term: `"just fix it"` with why and replace_with |
| "Praise good work too" | Stance: "I praise good decisions as explicitly as I flag problems" |
| "Reviews should be quick" | Misunderstanding: `thorough_over_timely` with wrong/correct/key_distinction/why |

## The Extraction Logic

1. **Read the Wiki for patterns, not facts.** Look for recurring principles (→ axioms), repeated conceptual distinctions (→ ontology), language that distorts thinking (→ banned terms), and common mistakes described (→ misunderstandings).

2. **Every KDNA entry needs a boundary.** A concept is only useful if you can say what it is NOT. If the Wiki says "blocking issues are important" but doesn't define what is not blocking, that boundary must be articulated in the KDNA.

3. **Banned terms come from signals in the Wiki.** When the Wiki describes problematic reviewer behaviors ("don't just say 'this is bad'"), extract the banned term and formalize the replacement.

4. **Misunderstandings capture what people get wrong even with the Wiki in front of them.** The Wiki says "classify your feedback." The misunderstanding captures that people often skip this or misclassify style as blocking.

5. **Self-checks operationalize the judgment.** Each self-check question should be answerable with yes/no and should catch the most common judgment failures described in the Wiki.

## Validation

```bash
node ../../validators/kdna-lint.js kdna
```
