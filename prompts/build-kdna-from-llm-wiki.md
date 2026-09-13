# Build KDNA from LLM Wiki

You are extracting domain cognition from a knowledge base. Do NOT summarize the Wiki. Do NOT copy its structure. You are distilling judgment.

## Input

A collection of Markdown files from an LLM Wiki. These files describe a domain: principles, concepts, workflows, mistakes, terminology, examples.

## Attribution

The Wiki is a source, not an author. Every entry you emit must say where it came
from and who is responsible for it. Tag each entry with exactly one attribution
state:

| State | Meaning | What you must record |
|---|---|---|
| `source_statement` | The Wiki states this; you only compressed the wording | The source file and the section you read it from |
| `model_extraction` | You selected and compressed a judgment the Wiki already carries | The source, plus that the wording is your distillation |
| `model_inference` | You supplied a judgment, boundary, or causal link the Wiki does not state — including an implied boundary and language the Wiki only warns about | The inference, the source it is derived from, and, when two sources conflict, both readings with the conflict left unresolved |
| `awaiting_author_confirmation` | A candidate no author has yet accepted or rejected | The candidate, unchanged, with its source |

Only a recorded, named author reply moves an entry to `author_confirmed`. Until
then, do not describe any entry as "the author's judgment", "what the author
believes", or a commitment the author has adopted. A first-person stance (§7) is
a form the author has to adopt: a stance taken from the Wiki is
`model_extraction`, and a stance you constructed is `model_inference`.

Attribute the actor accurately in both directions:

- "The author confirmed X" requires a named author and the specific reply that
  confirmed it. Never infer a human endorsement from material alone.
- An Agent may author a judgment asset, and Agent-authored KDNA is a first-class
  creation path. Report it as Agent-authored and never fabricate a human
  signature to make it look endorsed.
- Every entry needs accurate attribution and a preserved source record. Not
  every asset needs a human signature.

## Output

Two JSON files following the KDNA 0.1 specification:

- `KDNA_Core.json` — axioms, ontology, frameworks, core causal structure, stances
- `KDNA_Patterns.json` — terminology, banned terms, misunderstandings, self-checks

Plus one attribution record, `KDNA_Attribution.md`, listing every emitted entry
id with its attribution state, source, and (when present) the named actor and
reply that confirmed it. The KDNA JSON files carry only the entries; do not add
attribution fields to them, because the asset format is fixed. The attribution
record is what makes each entry's origin readable.

## Extraction Rules

### 1. Extract Axioms, Not Summaries

An axiom is an irreducible starting assumption that carries a meaningful
choice within a declared scope. It is not a fact from the Wiki.

Bad (summary): "Code review catches bugs before they reach production."
Good (axiom): "Correctness and security are blocking concerns. Style preferences are not."

Test each axiom: can an author identify a concrete case where it selects,
rejects, prioritizes, or qualifies one direction over another, and a boundary
case where it does not apply? If not, delete it.

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

Write the stance in first person, but keep the attribution honest: a stance the
Wiki states is `model_extraction`, a stance you constructed is
`model_inference`, and only an adopted stance is `author_confirmed`. Do not
relabel the first two as the author's own commitment.

### 8. Prefer Fewer, Stronger Entries

Prefer 3 sharp axioms to 15 vague ones. Every entry must earn its place by
carrying a bounded distinction or choice.

## Final Check

Before outputting, verify:

- [ ] Every axiom carries a meaningful choice in at least one named case
- [ ] Every ontology entry has a boundary
- [ ] Every banned term has `why` and `replace_with`
- [ ] Every misunderstanding has `key_distinction`
- [ ] Every self-check is yes/no answerable
- [ ] Stances are first-person commitments
- [ ] Every entry has an attribution state and a source
- [ ] No entry is described as an author's own judgment without a recorded author confirmation
- [ ] Nothing in the KDNA is just a restatement of a Wiki sentence
- [ ] All IDs are unique within the domain
- [ ] Required meta fields are present in both files

## Worked Example

Material:

> Reviewer A: "A comment about style should never block a merge."
> Reviewer B: "Style discussion is fine as long as it does not gate the PR."

How the three outputs differ, and who is speaking in each:

| Output | Attribution state | Who is speaking |
|---|---|---|
| axiom: "Correctness and security are blocking concerns. Style preferences are not." | `model_extraction` | The Wiki, compressed — both statements already carry it |
| boundary: "A blocking issue is not a style preference, not a design opinion that could go either way, and not a curiosity masquerading as a requirement." | `model_inference` | The model — the Wiki never states this boundary |
| stance: "My role is to help the author ship safe, maintainable code, not to prove I'm a better coder." | `awaiting_author_confirmation` | A model proposal — no author has adopted it yet |

If Reviewer A later replies "yes, that is how I work", the stance entry becomes
`author_confirmed` with `confirmed_by: Reviewer A` and the reply recorded. Until
that reply exists, the attribution record keeps it as a proposal.

## Output Format

```json
{
  "KDNA_Core.json": { ... },
  "KDNA_Patterns.json": { ... }
}
```

`KDNA_Attribution.md` records the same entries a second time, in this shape:

```markdown
| entry_id | file | attribution_state | source | confirmed_by |
|---|---|---|---|---|
| axiom_blocking_vs_style | KDNA_Core.json | model_extraction | wiki/04-reviews.md §"What blocks a merge" | null |
| boundary_blocking_issue | KDNA_Core.json | model_inference | derived from wiki/04-reviews.md §"What blocks a merge" | null |
| stance_ship_safe_code | KDNA_Core.json | awaiting_author_confirmation | wiki/02-role.md §"How I work" | null |
```

Do not include commentary, explanations, or analysis alongside the JSON. The
two JSON files contain only the KDNA objects; the attribution record carries the
provenance.
