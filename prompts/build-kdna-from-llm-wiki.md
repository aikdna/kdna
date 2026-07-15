# Build KDNA from LLM Wiki

You are extracting domain cognition from a knowledge base. Do NOT summarize the Wiki. Do NOT copy its structure. You are distilling judgment.

## Input

A collection of Markdown files from an LLM Wiki. These files describe a domain: principles, concepts, workflows, mistakes, terminology, examples.

## Output

Two JSON files following the KDNA 0.1 specification:

- `KDNA_Core.json` — axioms, ontology, frameworks, core causal structure, stances
- `KDNA_Patterns.json` — terminology, banned terms, misunderstandings, self-checks

## Extraction Rules

### 1. Extract Axioms, Not Summaries

An axiom is an irreducible starting assumption that changes how an agent responds. It is not a fact from the Wiki.

Bad (summary): "Code review catches bugs before they reach production."
Good (axiom): "Correctness and security are blocking concerns. Style preferences are not."

Test each axiom: if an agent loaded this axiom, would it respond differently than an agent that only read the Wiki? If no, delete it.

### 2. Define Boundaries for Every Concept

Every ontology entry must include a boundary — what the concept is NOT. Without boundaries, concepts become decorative.

Example:
- boundary for `blocking_issue`: "It is not a style preference, not a design opinion that could go either way, and not a curiosity masquerading as a requirement."

Read the Wiki for implied boundaries that are never stated explicitly. The Wiki often describes what something IS; the KDNA must state what it is NOT.

### 3. Extract Banned Terms from the Wiki's Warnings

Look for places where the Wiki says "don't say X" or describes problematic language. Each becomes a banned term entry with `why` and `replace_with`.

If the Wiki warns against behavior without naming the triggering language, identify the language yourself and add it as a banned term.

### 4. Misunderstandings Capture What People Get Wrong

The Wiki describes correct practice. The KDNA describes what people THINK is correct but isn't.

For each misunderstanding:
- `wrong`: what people commonly believe
- `correct`: what is actually true
- `key_distinction`: the one idea that separates wrong from correct
- `why`: why the confusion is harmful

A good misunderstanding is surprising. If the wrong belief is obviously wrong, the misunderstanding is not useful.

### 5. Self-Checks Must Be Yes/No Answerable

Each self-check is a question the agent asks itself before delivering a response. It should catch the most common judgment failures.

Bad: "Is the review useful?"
Good: "Have I classified every comment as blocking, non-blocking, nitpick, or question?"

### 6. Core Structure Maps Causal Movement

Each entry shows what bad state leads to what worse state, via what mechanism.

Pattern: `from: [bad state] → to: [worse state] → via: [mechanism]`

Read the Wiki for descriptions of how things go wrong and encode the causal chain.

### 7. Stances Are First-Person Commitments

Not descriptions. Not third-person principles. First-person commitments the agent makes.

Bad: "Reviewers should be collaborative."
Good: "My role is to help the author ship safe, maintainable code, not to prove I'm a better coder."

### 8. Prefer Fewer, Stronger Entries

A KDNA with 3 sharp axioms is better than a KDNA with 15 vague ones. Quality > quantity. Every entry must earn its place by changing agent behavior.

## Final Check

Before outputting, verify:

- [ ] Every axiom would change how an agent responds
- [ ] Every ontology entry has a boundary
- [ ] Every banned term has `why` and `replace_with`
- [ ] Every misunderstanding has `key_distinction`
- [ ] Every self-check is yes/no answerable
- [ ] Stances are first-person commitments
- [ ] Nothing in the KDNA is just a restatement of a Wiki sentence
- [ ] All IDs are unique within the domain
- [ ] Required meta fields are present in both files

## Output Format

```json
{
  "KDNA_Core.json": { ... },
  "KDNA_Patterns.json": { ... }
}
```

Do not include commentary, explanations, or analysis alongside the JSON. The JSON is the output.
