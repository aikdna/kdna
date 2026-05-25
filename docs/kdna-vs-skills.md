> ⚠️ **This document has been superseded by [KDNA and the AI Stack](./kdna-and-ai-stack.md)**, which covers all AI stack component relationships in one place. This page is kept for reference.
>
# KDNA vs Skills

Skills make agents execute reliably. KDNA makes agents judge correctly. They solve different problems, and they get stronger together.

## The core distinction

| | Skill | KDNA |
|---|---|---|
| Problem | **How to do it** | **What counts as done well** |
| Domain | Procedural (deterministic pipelines) | Judgment (ambiguous decisions) |
| Success criteria | Objective (pass/fail) | Subjective (professional judgment required) |
| Example | Extract audio → transcribe → export SRT | Is this subtitle tone right for this audience? |
| Update model | Edit SKILL.md, redeploy | Propose → review → human lock → compile → regression test |
| Reusability | Bound to one agent/tool | Loadable by any agent via `kdna load` |
| Audit trail | Git history | Evolution record + judgment diffs + human lock records |

## When a Skill is enough

A Skill excels when the task has:
- A clear goal
- A stable pipeline
- Deterministic tool calls
- Objective verification
- High repeatability

Your video subtitle Skill is a perfect example. Extract audio, run ASR, check timing, split long lines, export SRT. Every step has a correct answer. If the timing matches, it matches. If a word is misrecognized, it's objectively wrong.

A Skill alone can produce subtitles that are **technically correct**.

## When you need KDNA

KDNA matters when the task enters judgment territory — questions where two experts might disagree:

- What tone fits this account's brand?
- What reading speed suits this audience?
- When does "simplifying" become "dumbing down"?
- When should we preserve the speaker's exact phrasing vs. paraphrasing?
- What counts as fear-mongering language that should be avoided?
- Where is the boundary between "clear" and "cold"?

A Skill cannot answer these. It can only execute what it was told. KDNA provides the judgment framework that guides the Skill's execution decisions.

## Skill + KDNA: The complete pipeline

```
Skill executes the workflow          KDNA governs the judgment

1. Extract audio                     Load domain judgment
2. Run ASR                     →     Does this account avoid fear language?
3. Check timing                →     Is the reading speed right for seniors?
4. Split long lines            →     Does this break interrupt the emotional flow?
5. Export SRT                  →     Postvalidate: any banned terms used?
```

The Skill produces the output. KDNA validates that the output meets domain standards.

Technically, a Skill calls `kdna postvalidate` at its final step:

```bash
kdna postvalidate @aikdna/silver_age_short_video --output subtitles.srt --json
```

This checks for banned terms, boundary violations, misunderstanding drift, and missing self-checks — all defined in the KDNA domain file.

## The real risk: KDNA content degradation

The biggest threat to KDNA is not that Skills will replace it. It's that KDNA files will degenerate into pseudo-SOPs — reading like step-by-step instructions rather than judgment principles.

| ❌ Looks like a SOP | ✓ Looks like judgment |
|---|---|
| "Step 1: identify the topic. Step 2: find the thesis." | "Most writing problems are structural, not language-level." |
| "Always use active voice. Avoid passive voice." | "Passive voice is acceptable when the actor is unknown or irrelevant to the claim." |
| "Generate three options and pick the best." | "When the user's intent is unclear, surface the ambiguity rather than guessing." |
| "Check for spelling, grammar, and punctuation." | "Surface-level polish does not fix a weak argument. Flag structural issues before line edits." |

The CLI's `publish --check` anti-vagueness detectors catch generic phrases like "is important" and "be helpful." If a KDNA author writes axioms that sound like they came from a wikiHow article, that's the signal that the content has degraded into procedural instructions.

## Positioning for developers

If you're building an AI agent:

1. **Start with a Skill.** Most tasks begin as workflows. Package the steps, the tool calls, and the verification logic.
2. **When you notice if-else sprouting** — "if the audience is X, do Y; if they're Z, do W" — you've hit judgment territory. Extract those decisions into KDNA.
3. **When you share with a team** — your judgment rules now need governance. KDNA provides proposal, review, lock, and regression testing.
4. **When you hit edge cases** — the Skill can't decide whether to flag something as risky. Load KDNA's risk model.

Skills package execution. KDNA packages judgment. Together they give agents both the hands and the head.
