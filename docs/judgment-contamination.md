# Judgment Contamination

## Definition

**Judgment Contamination** occurs when an AI agent loads a KDNA domain that does not match the current task, causing the agent to misclassify the problem, apply wrong priorities, use incorrect risk models, or offer misaligned recommendations — all with the false confidence of having applied "expert judgment."

## Distinction from Normal Errors

A normal error is when an agent makes a wrong call on its own, without external judgment framing. Judgment Contamination is different: the agent makes a wrong call **because an external judgment framework steered it in the wrong direction.** The presence of the domain made the output worse than baseline.

## Why It Matters

KDNA's value proposition is that structured domain judgment improves agent decisions. But this only holds when the domain matches the task. When it doesn't:

- A team management domain applied to a website design task causes the agent to diagnose visual hierarchy problems as organizational communication failures.
- A writing-editing domain applied to a legal document causes the agent to prioritize readability over legal precision.
- A sales domain applied to a medical consultation causes the agent to treat patient concerns as objections to overcome.

Each case produces output that is **worse than if no KDNA had been loaded at all.**

## The Primacy of Skip

Because of Judgment Contamination, KDNA's runtime routing must treat "skip" as the default, not the exception. Loading a domain requires positive evidence of fit. The absence of a clear match is sufficient reason to skip.

This is not a limitation of KDNA. It is a feature. A mature judgment layer must know when to abstain.

## Prevention

Judgment Contamination is prevented through the KDNA Runtime Router (see [runtime-routing.md](./runtime-routing.md)):

1. **Intent Gate**: skip tasks that don't need domain judgment at all
2. **Negative Match First**: check `does_not_apply_when` before `applies_when`
3. **Weak Fit → Skip**: when confidence is below threshold, default to skip
4. **Trust Gate**: block domains with failed trust verification
5. **No Auto-Install**: never silently download and load a domain
6. **Trace Everything**: log every routing decision for audit

## Detection

Signs that Judgment Contamination may have occurred:

1. The agent uses domain-specific terminology that doesn't fit the task
2. The agent applies frameworks from one field to an unrelated problem
3. The agent's recommendations are coherent within the wrong domain but nonsensical for the actual task
4. The agent misses obvious solutions because they don't fit the loaded domain's framework
5. The user feels the agent "misunderstood the entire situation"

## Reporting

If you encounter Judgment Contamination:

1. Document the task, the loaded domain, and the contaminated output
2. Check whether the domain's `does_not_apply_when` should have excluded this case
3. If `does_not_apply_when` was absent or insufficient, propose an addition to the domain author
4. If the routing logic failed, report as a routing bug

---

*This concept is foundational to KDNA's runtime safety model. It is referenced in kdna-loader/SKILL.md and enforced by the runtime routing specification.*
