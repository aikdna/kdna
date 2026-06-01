# Demo 3: Prompt Diagnosis — Finding Root Cause, Not Formatting

**Domain:** @aikdna/prompt_diagnosis v0.7.6  
**What changes:** Instead of "add a role, be more specific, use chain of thought," the agent diagnoses WHY the prompt failed — task mixing, goal ambiguity, or context gap.  
**Time to run:** 2 minutes.

## Quick Run

```bash
kdna install @aikdna/prompt_diagnosis
kdna verify @aikdna/prompt_diagnosis --judgment
kdna compare @aikdna/prompt_diagnosis --input "my prompt asking the model to plan a campaign, evaluate risks, pick the best option, and write the launch announcement is giving me generic answers"
```

## What KDNA Injects Into the Agent

```
# KDNA loaded: @aikdna/prompt_diagnosis
# core insight: Most prompt failures are task mixing and goal ambiguity,
# not missing format elements. Fix the cognitive conflict before the formatting.

### Core Axioms:

1. Most prompt failures are caused by task mixing, not missing format elements.
   APPLIES WHEN: A prompt asks to draft, critique, rewrite, and output JSON in one go.
   DOES NOT APPLY WHEN: Single-task prompt fails due to missing library versions.
   RISK: Adding XML tags, roles, or schemas to a cognitively overloaded prompt.

2. A perfectly formatted prompt with an ambiguous goal fails more reliably
   than a messy prompt with a clear goal.
   APPLIES WHEN: Structured prompts with detailed CoT steps but no target metric.
   DOES NOT APPLY WHEN: Clear-goal prompt failing only due to format constraints.

3. When a prompt fails, the missing element is more often context than instruction.
   APPLIES WHEN: Prompts asking for specific output without providing situation data.
   DOES NOT APPLY WHEN: The model genuinely needs step-by-step reasoning directives.

### Triage Framework (always in this order):
1. Identify task mixing — does the prompt ask for generation + evaluation + decision?
2. Identify goal ambiguity — can the user describe what success enables?
3. Identify context gap — what does the model need to know that it cannot infer?
4. Only then consider format improvements.

### MUST NOT SAY:
- "add a role" → first check for task mixing, goal ambiguity, context gaps
- "be more specific" → identify which type of specificity is missing
- "use chain of thought" → after fixing task mixing and goal ambiguity

### Self-Checks:
- Did I check for task mixing before suggesting any format changes?
- Can the user describe what a correct output would enable them to do next?
- Did I distinguish between missing instructions and missing context?
- Did I check: format-correct but substance-wrong — the most dangerous failure mode?
```

## Before/After Comparison

**Input:** *"My prompt asking the model to plan a marketing campaign, evaluate the risks, recommend the best option, and write the launch announcement in one response is giving me generic answers."*

### No KDNA
```
Try this improved prompt:

You are an experienced marketing director. Plan a campaign, evaluate risks, recommend the best option, and write the launch announcement. Use structured output with clear sections. Consider the target audience, budget constraints, and timeline. Be specific and actionable.
```

**Problem:** Added a role, asked for structure, added more instructions — but made the original problem worse. Still asking the model to plan + evaluate + decide + write in one pass. The format is better. The cognitive overload is identical.

### Best Prompt ("Please help me improve this prompt from a prompt engineering perspective...")
```
Your prompt asks for too many different cognitive tasks at once. Split it:
1. First ask the model to brainstorm campaign ideas
2. Then, based on the output, ask it to evaluate risks
3. Then choose the best option
4. Then write the announcement

Also, add a specific role and output format for each step.
```

**Problem:** Identifies task mixing but over-prescribes a sequential chain. Doesn't diagnose WHY the model defaults to generic output (each sub-task pulls the response in a different direction), and doesn't verify goal ambiguity.

### With @aikdna/prompt_diagnosis
```
Triaging the failure:

Step 1 — Task Mixing: YES, detected.
  This prompt asks for FOUR different cognitive operations:
  • Plan (generation: open-ended, creative)
  • Evaluate risks (judgment: classification, prioritization)
  • Recommend best (decision: comparison, trade-off)
  • Write launch announcement (generation: persuasive, audience-specific)
  The model defaults to generic because each sub-task pulls the output
  in a different direction. No single response can satisfy all four.

Step 2 — Goal Ambiguity: CHECK.
  "Plan a campaign" — for what outcome? Signups? Revenue? Awareness?
  Without a success metric, the model plans for all outcomes equally,
  producing a shallow plan that satisfies none.

Step 3 — Context Gap: CHECK.
  What does the model not know? Target audience. Budget. Timeline.
  Competitor positioning. These are context, not instructions.

Step 4 — Recommendation:
  SPLIT into separate prompts:
  1. "Here's our product, audience, and budget. Generate 3 campaign concepts."
     → User picks one.
  2. "Here's the chosen concept. Identify the top 3 risks and mitigations."
     → User reviews risks.
  3. "Here's the concept and risks. Write the launch announcement for [audience]."

  DO NOT add a role, do not add more instructions. Split the cognitive load.

Self-checks:
  ✓ Task mixing diagnosed before suggesting any format changes
  ✓ User can describe success: which campaign concept gets approved
  ✓ Context gap identified (audience, budget, competitors)
  ✓ Avoided "add a role" / "be more specific" / "use chain of thought"
```

**Why it's different:** Not "split into steps." Diagnoses the ROOT CAUSE of the failure (task mixing + goal ambiguity + context gap), then prescribes a fix that addresses each cause. The agent doesn't optimize the prompt's format — it restructures the problem into prompts the model can actually solve.

## Try It Yourself

```bash
# Install
kdna install @aikdna/prompt_diagnosis

# Inspect what KDNA injects
kdna load @aikdna/prompt_diagnosis

# Compare (requires API key)
kdna compare @aikdna/prompt_diagnosis --input "my multi-step prompt gives generic output"
kdna compare @aikdna/prompt_diagnosis --input "the model outputs perfect format but wrong substance"
kdna compare @aikdna/prompt_diagnosis --input "I keep adding instructions but the output doesn't improve"
```
