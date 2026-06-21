# Demo 1: Writing Judgment — No KDNA vs Best Prompt vs KDNA

**Domain:** @aikdna/writing v0.7.3  
**What changes:** Not "better words." Different judgment path — diagnose structure before language.  
**Status:** Legacy behavior transcript. Current public beta usage starts from a local packaged `.kdna` file.

## Current Public Beta Path

```bash
kdna pack ../examples/writing_basic ./writing-basic.kdna
kdna validate ./writing-basic.kdna
kdna plan-load ./writing-basic.kdna
kdna load ./writing-basic.kdna --profile=compact --as=prompt
```

## What KDNA Injects Into the Agent

```bash
kdna load @aikdna/writing
```

Output (verbatim, generated 2026-06-01):

```
# KDNA loaded: @aikdna/writing
# judgment_version: 2026.05
# core insight: Most writing problems are structural and argument-level, not language-level.

## JUDGMENT GUIDANCE
### Axioms (reason from these)
- Most writing problems are structural and argument-level, not language-level.
  APPLIES WHEN: the user asks for content feedback, review, or 'why isn't this working'
  DOES NOT APPLY WHEN: the task is copy editing for grammar, spelling, or compliance
  RISK IF MISAPPLIED: Refusing to fix sentences when the user genuinely just wants smoother prose.

- Every piece of content must exert judgment pressure on the reader.
  APPLIES WHEN: the piece's purpose is to change a reader's belief, action, or framing
  DOES NOT APPLY WHEN: the piece is reference material the reader scans to look up an answer

- A piece fails at the hook before it fails at the structure.
  APPLIES WHEN: the reader has a choice whether to keep reading
  DOES NOT APPLY WHEN: the reader has already committed (paid book, mandatory document)

- An assertion without specific evidence is indistinguishable from opinion.
  APPLIES WHEN: the piece makes claims the reader is being asked to accept or act on
  DOES NOT APPLY WHEN: the piece is a brief opinion column where the author's voice IS the evidence

### Stances
- Do not polish sentences when the piece lacks a real argument. First find the argument, then polish.
- Assume the reader is busy and skeptical. Content must earn attention before it earns agreement.

## MUST NOT SAY
- "polish the language" -> diagnose the structural problem first
- "make it more engaging" -> diagnose the specific engagement failure
- "improve the flow" -> identify what the reader needs to understand at each transition point

### Misunderstandings to detect and avoid
- WRONG: If a piece reads smoothly, the thinking behind it is sound.
  CORRECT: Smooth prose can hide empty thinking.
- WRONG: Adding more explanation strengthens an argument.
  CORRECT: One concrete example > three paragraphs of abstract reasoning.

## SELF-CHECK
- Did I diagnose a structural problem before suggesting any language-level changes?
- Would the opening 150 words make a busy reader want to continue?
- Is every abstract claim accompanied by at least one concrete example?
```

## Before/After Comparison

**Input:** *"help me improve this product launch post: 'AI is transforming our industry. Our product uses AI to help you work faster. Get it now.'"*

### No KDNA
```
I'd suggest making the language more specific and compelling:
- "AI is transforming our industry" → add a specific statistic
- "help you work faster" → explain how much faster
- "Get it now" → create more urgency
- Add a customer testimonial
- Use more active voice
```

**Problem:** Treats this as a language polish problem. The piece's failure is structural — no argument, no cognitive hook, no evidence — not that the words aren't "compelling" enough.

### Best Prompt ("Review this content as an experienced writing editor...")
```
Focus on the following:
- The opening is generic. Start with a specific claim about AI impact.
- Add concrete evidence: a customer case study or adoption metric.
- Structure: problem → solution → evidence → call to action.
- Consider the reader's skepticism — why should they believe this?
```

**Problem:** Better than No KDNA (mentions evidence and structure) but still defaults to suggesting content additions without distinguishing structural failure from language weakness.

### With @aikdna/writing
```
Step 1 — Classify: This is a structural writing diagnosis, not language polishing.
  Reason: The piece has no identifiable argument, no cognitive hook, and zero evidence density.

Step 2 — Diagnose:
  ❌ Argument: There is no specific, falsifiable claim. "AI is transforming" is universally acceptable.
  ❌ Hook: "AI is transforming our industry" creates no cognitive tension. It's context-setting, not hooking.
  ❌ Evidence: "help you work faster" is an unsubstantiated claim. No metric, case, or named situation.

Step 3 — Recommend (in this order):
  1. Articulate a specific, falsifiable claim. Example: "Teams using AI-assisted review ship 3x faster — but only if the AI understands their specific standards."
  2. Build a hook from the tension in that claim: "Why ship speed" vs "why judgment matters."
  3. Provide one concrete evidence point before asking the reader to act.
  4. Only then polish language.

Self-checks: 5/5 passed. Risk flags: none.
```

**Why it's different:** Not "add more details." Diagnoses the type of failure (structural vs language), identifies what's missing (argument, hook, evidence), and prescribes the order of fixes. The agent didn't get better at writing — it got better at judging what kind of problem this is.

## Benchmark Evidence

From the [KDNA benchmark](../benchmarks/BENCHMARK_SUMMARY.md) (5 models, agent_safety domain):

| Configuration | MiniMax | Claude Opus | Qwen | Gemini | GPT-5.5 | Avg |
|:---|---:|---:|---:|---:|---:|---:|
| No KDNA | 79 | 79 | 80 | 64 | 92 | 78.8 |
| Best Prompt | 104 | 104 | 101 | 94 | 99 | 100.4 |
| **KDNA** | **108** | **111** | **107** | **103** | **110** | **107.8** |
| vs Best | +4 | +7 | +6 | +9 | +11 | **+7.4** |

## Try It Yourself

```bash
kdna pack ../examples/writing_basic ./writing-basic.kdna
kdna validate ./writing-basic.kdna
kdna plan-load ./writing-basic.kdna
kdna load ./writing-basic.kdna --profile=compact --as=prompt
```
