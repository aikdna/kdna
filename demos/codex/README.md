# KDNA Demo: Codex Agent

## Actual Agent Context

When the agent loads the management KDNA domain, it receives this structured judgment context (7,248 chars):

[View full context →](./management-context.txt)

Key elements injected into the agent's reasoning frame:
- **5 stances** — Default postures (e.g., "Every execution failure is a system output until proven otherwise")
- **4 axioms** — With full statements and why explanations
- **4 ontology concepts** — upstream_cause, clarity_gap, feedback_loop, execution_system
- **5 banned terms** — "lazy/unmotivated" → describe the gap; "do better/step up" → give specific standards
- **4 misunderstandings** — Wrong interpretations corrected with key distinctions
- **5 self-checks** — Diagnostic questions the agent asks before responding

## Reproduce

```bash
npm i -g @aikdna/kdna
kdna install sales
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash -- --codex
```

## Before KDNA (no domain)

**Input:** "My team keeps missing deadlines. I've told them repeatedly. What should I do?"

**Agent response:**

> Missing deadlines is frustrating. Here are some steps:
> 1. Set clearer deadlines with specific times
> 2. Use project management software to track progress
> 3. Hold people accountable in team meetings
> 4. Consider performance incentives for on-time delivery
> 5. Have one-on-one conversations about time management
>
> Sometimes it's a motivation issue, so make sure the team understands the importance of deadlines.

**Problems:**
- Immediately jumps to individual accountability
- Uses banned term: "motivation issue" (labels the person, not the system)
- No upstream diagnosis before suggesting solutions

---

## After KDNA (management domain loaded)

**Agent response:**

> Before addressing the individuals, let's diagnose upstream.
>
> First: expectations. When you assigned the last deadline, did each person restate what "done" looked like in their own words? The most common cause of missed deadlines is a clarity_gap — what the manager thinks they communicated vs. what the team member understood.
>
> Second: resources and authority. Do they have everything they need to execute? Are there conflicting priorities pulling them in different directions?
>
> Third: feedback_loop. Did they know they were off track early enough to correct? Or did you discover the miss at the deadline?
>
> Execution failure is a system output, not a motivation failure. Fix the system first — clarity, resources, feedback — then see if individual issues remain.

**What changed:**
- ✓ Applied upstream diagnosis framework before addressing individuals
- ✓ Used preferred terms: clarity_gap, feedback_loop, system output
- ✓ Avoided banned term: "motivation" (reframed as system issue)
- ✓ Applied stance: "manage through standards, not personality"

---

## Agent loading log

```
[KDNA] loaded: management@0.1.0 | modules: core, patterns | mode: auto
Applied: Upstream Diagnosis framework, clarity_gap concept, feedback_loop concept
```
