# When to Use KDNA

Not every task needs KDNA. Use it when judgment matters more than procedure.

## The Trigger Condition

Use KDNA when the **same surface input could mean multiple different things — and getting it wrong leads to wrong action.**

If the task has a clear procedure (steps, template, output format), use Skills.
If the task requires deciding *what kind of situation this is*, use KDNA.

## Use KDNA

| Scenario | Why |
|----------|-----|
| User says "your price is too high" | Could be value uncertainty, budget constraint, or risk fear. Wrong diagnosis → wrong response. |
| Team meeting transcript | Could be a real decision or just discussion. Confusing discussion for decision → fake progress. |
| User requests a feature | Could be a real need or a guessed solution. Building the wrong thing → wasted effort. |
| Metric drops 30% | Could be a real signal or normal variance. Acting on noise → wasted resources. |
| Someone asks for a learning plan | Could need structure or need feedback. Plan without feedback → guaranteed failure. |

## Skip KDNA

| Scenario | Why | Use Instead |
|----------|-----|-------------|
| Format this text as a table | Pure formatting task | Skills |
| What is the capital of France? | Fact lookup | Search / RAG |
| Write this in a friendlier tone | Style adjustment | Prompt / Skills |
| Convert Markdown to HTML | Mechanical transformation | Skills / Tools |
| Generate a weekly report from this data | Template-based output | Skills |

## The Boundary Rule

When in doubt, ask: **"Could an expert and a novice interpret this input differently, and would that difference change the action taken?"**

If yes → KDNA. If no → Skills, RAG, or Prompt.
