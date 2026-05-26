# First Domain Walkthrough — Writing Judgment

This walkthrough takes you through a complete KDNA workflow. You'll see a domain judgment package go from a file on disk to a visible change in how an AI agent reasons.

**Goal**: Understand what a KDNA domain is, not by reading about it, but by seeing it work.

---

## 1. This is a weak prompt

Suppose you ask an AI agent:

> "Help me improve this product launch post."

Without KDNA, a typical AI response:

> "Try shorter sentences. Make the headline catchier. Add more enthusiasm. Here's a rewritten version..."

The agent defaults to **language-level fixes** — stronger verbs, better transitions, punchier phrases. It treats all writing problems as prose problems.

But most writing problems aren't prose problems. They're structural: no real argument, no cognitive hook, no evidence density, no stakes for the reader.

**The agent polished the surface because it had no judgment reference telling it to look deeper.**

---

## 2. This is a KDNA domain package

The `@aikdna/writing` domain encodes editorial judgment as a structured asset. Here's what's inside:

### KDNA_Core.json — Axioms (what to believe)

```
"Axiom: Most writing problems are structural and argument-level, not language-level."
  → Applies when: user asks for content feedback or review
  → Does NOT apply when: user explicitly asks only for grammar/line-level polish
  → Failure risk: Refusing to fix sentences when the user genuinely just wants smoother prose
```

### KDNA_Patterns.json — Boundaries (what to avoid)

```
Banned term: "polish the language"
  → Why: Defaults diagnosis to surface fixes. Signals the agent missed the root cause.
  → Replace with: "identify the structural problem first"

Banned term: "make it more engaging"
  → Why: Non-diagnosis. Must name specifically what prevents engagement.
```

### Self-checks (what to verify before answering)

```
After writing feedback, verify:
1. Did I classify this as a structural or language-level problem?
2. Did I avoid banned terms?
3. Did I provide a specific diagnosis (not generic advice)?
4. Is the reasoning traceable back to an axiom?
5. Did I check for failure risks (e.g., over-applying to reference docs)?
```

---

## 3. Install the domain

```bash
npm install -g @aikdna/kdna-cli
kdna setup
kdna install @aikdna/writing
```

This downloads and stores the `.kdna` asset under `~/.kdna/packages/@aikdna/writing/<version>/writing.kdna`, then records it in `~/.kdna/index.db`. The CLI verifies its SHA-256 hash and Ed25519 signature before accepting it.

---

## 4. Verify the domain

```bash
kdna verify @aikdna/writing --judgment
```

What this checks:
- **Structure**: All required files present, JSON valid, schema compliant
- **Trust**: Cryptographic signature matches, provenance chain intact
- **Judgment**: Governance fields present (risk_level, human_lock, applies_when)

Expected output:

```
✓ structure   KDNA_Core.json
✓ structure   KDNA_Patterns.json
✓ structure   KDNA_Scenarios.json
✓ trust       Ed25519 signature verified
✓ judgment    governance fields complete
✓ judgment    risk level: medium
✓ judgment    human lock: ALL judgment fields locked

Result: PASSED (3/3 layers)
```

---

## 5. Compare judgment — with vs. without KDNA

```bash
kdna compare @aikdna/writing --input "help me improve this product launch post"
```

This sends the same input to an LLM twice — once without KDNA, once with KDNA loaded — and diffs the reasoning paths.

**Sample comparison output:**

```
┌─ Without KDNA ────────────────────────────────────────────────────┐
│ Diagnosis: Language-level polishing needed                        │
│ Suggestions:                                                      │
│   • "Shorten paragraphs for better readability"                   │
│   • "Use more energetic language"                                 │
│   • "Add power words to the headline"                             │
│ Banned terms used: "more engaging" ✓ (flagged)                    │
│ Self-checks: 1/5 passed                                           │
└────────────────────────────────────────────────────────────────────┘

┌─ With KDNA (@aikdna/writing) ─────────────────────────────────────┐
│ Diagnosis: Structural writing problem                             │
│ Classification: Structural void — no central argument             │
│ Axioms applied:                                                   │
│   • axiom_problem_not_prose: problem is structural, not language  │
│   • axiom_judgment_pressure: content exerts zero judgment pressure│
│   • axiom_hook_before_structure: no cognitive hook present        │
│ Suggestions:                                                      │
│   • "What is the one claim you want readers to disagree with?"    │
│   • "The opening paragraph defines the product but doesn't create │
│      a gap between reader's current knowledge and the revelation"  │
│   • "Add a specificity anchor — a concrete user scenario with     │
│      real numbers before listing features"                        │
│ Banned terms avoided: ✓                                           │
│ Self-checks: 5/5 passed                                           │
└────────────────────────────────────────────────────────────────────┘
```

**The agent didn't get better at writing. It got better at judging what kind of problem this is.**

---

## 7. See the judgment trace

```bash
kdna trace --since 7d --domain @aikdna/writing
```

Every time an agent loads a KDNA domain, the loader records:
- Which domain was loaded
- What task was being performed
- Which axioms were activated
- What self-checks were run (passed/failed)
- Whether banned terms were flagged

This is the audit trail — proof that judgment was applied, not just assumed.

---

## 8. Submit feedback (closing the loop)

If the agent's judgment was wrong:

```bash
kdna compare @aikdna/writing --report-md > report.md
# Review the report, file an issue on the domain repo:
# https://github.com/aikdna/kdna-writing/issues/new
```

Domain authors review feedback, update axioms or patterns, bump the version, and re-publish. The domain evolves through real use — not through speculation.

---

## 9. Update the domain

```bash
kdna update @aikdna/writing        # Get the latest version
kdna diff @aikdna/writing@1.0-rc @aikdna/writing@1.1.0  # See what changed
```

The judgment-level diff shows exactly which axioms, boundaries, or self-checks were modified — so you always know what your agent is now judging differently.

---

## Summary

| Step | Command | What happened |
|------|---------|---------------|
| Install | `kdna install @aikdna/writing` | Domain loaded from registry with cryptographic verification |
| Verify | `kdna verify @aikdna/writing --judgment` | Structure, trust, and judgment layers checked |
| Compare | `kdna compare @aikdna/writing --input "..."` | Same input, two judgment paths — the delta is visible |
| Trace | `kdna trace` | Audit trail of what axioms were applied |
| Feedback | file an issue | Domain improves through real use |
| Update | `kdna update` + `kdna diff` | See exactly what judgment changed |

**A KDNA domain is not a prompt. It's not a knowledge base. It's a portable, verifiable, traceable judgment asset that tells an AI agent how to reason about a specific domain — and proves that it did.**
