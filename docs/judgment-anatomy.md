# Judgment Anatomy

How to decompose your domain expertise into the 13 elements that make up a KDNA domain.

If you know your field deeply but don't know how to start writing a KDNA domain, this document is for you. It turns "I know how to judge in my field" into structured, machine-loadable cognition.

---

## The 13 Elements

Judgment in any domain can be decomposed into these elements. Each has a place in the KDNA file structure.

### 1. Worldview — What you assume about how the world works

**Location:** KDNA_Core.json · `worldview[]`

- What does a newcomer to this field most often misunderstand about how things actually work?
- What is obviously true in this domain, but would be false or irrelevant in another?
- If you had to explain the fundamental premise of your field in one sentence, what would it be?

### 2. Values — What matters more than what

**Location:** KDNA_Core.json · `value_order[]`

- What do novices in this field pursue that they should not?
- What looks good but is actually wrong?
- When A and B conflict, which do you consistently choose and why?

### 3. Purpose — What this judgment serves

**Location:** KDNA_Core.json · `highest_question`

- What is the single highest question this domain answers?
- If the agent gets everything else right but misses this, has the judgment failed?
- What is the output of this judgment — a classification? A decision? A risk assessment?

### 4. Role — Who is judging and what they are responsible for

**Location:** KDNA_Core.json · `judgment_role`

- What role does the agent take when applying this domain?
- What roles must the agent explicitly NOT take?
- What is the agent responsible for — and what remains the user's responsibility?

Example for writing domain:
```json
{
  "acts_as": "structural writing diagnostician",
  "does_not_act_as": ["language polisher", "motivational coach", "growth hacker"],
  "responsibility": "diagnose the underlying problem before suggesting improvements"
}
```

### 5. Knowledge Assumptions — Background knowledge that shapes judgment

**Location:** KDNA_Core.json · axioms · `full_statement` + KDNA_Cases.json

- What background knowledge does a competent practitioner in this field have that an outsider lacks?
- What would an agent get wrong if it lacked this knowledge?
- What is the most common false assumption that leads to bad judgment?

### 6. Ontology — How you carve up the conceptual space

**Location:** KDNA_Core.json · `ontology[]`

- What are the 3-5 key concepts the agent must distinguish?
- What is each concept really about (operational meaning, not dictionary definition)?
- What is each concept often confused with?
- What words or situations signal that this concept is relevant?

### 7. Classification — How you determine what kind of situation this is

**Location:** KDNA_Scenarios.json · `trigger_signals[]` + `classification_rule`

- What signals tell you this is situation type A, not type B?
- What signals tell you this is NOT your domain's concern?
- What's the most common misclassification?

### 8. Taste / Aesthetics — What good looks like vs. what bad looks like

**Location:** KDNA_Patterns.json · `aesthetic_preferences[]`

- What makes something feel right in your field?
- What immediately tells you something is wrong, even if you can't articulate why at first?
- What's an example of something that is technically correct but aesthetically wrong?

### 9. Boundaries — Where the domain stops

**Location:** KDNA_Patterns.json · `boundaries[]`

- What must the agent never do when applying this domain?
- Under what circumstances should the agent refuse to apply this domain?
- What exceptions exist to these boundaries?

### 10. Risk Model — What errors cost the most

**Location:** KDNA_Patterns.json · `risk_model`

- What is the most dangerous misjudgment in this domain?
- Which errors, once made, are hardest to recover from?
- When should the agent be conservative rather than confident?
- What can the agent get wrong without serious consequences?

### 11. Context Signals — What triggers which part of the judgment

**Location:** KDNA_Scenarios.json · `trigger_signals[]` + `negative_signals[]`

- What in the user's input should trigger this domain?
- What in the user's input should suppress this domain?
- What false triggers are common?

### 12. Experience — Cases and counterexamples

**Location:** KDNA_Cases.json · cases[] + KDNA_Patterns.json · `counterexamples[]`

- What's the most common failure pattern you've seen?
- What's a case where the declared judgment produces a recognizably different, in-scope choice?
- What's a case where applying domain principles would have been wrong?

### 13. Verification — How to check semantic fidelity

**Location:** evals/ directory + KDNA_Evolution.json · `eval_results[]`

- How would you test whether the exported asset preserves the selected judgment and boundaries?
- What's a task where two legitimate judgment assets should lead to different choices?
- What would count as evidence that loading, scope, authorization, and rollback work as declared?

---

## From interview to domain

The questions above are designed for live interviews. A KDNA Creator tool (like a KDNA-compatible client Studio) would walk a domain expert through 10-15 questions, building the domain incrementally. The finished domain can then be immediately tested in Compare Mode.

Until a Creator tool exists, use this document as your interview guide. Answer each question. Then fill in the corresponding KDNA file.
