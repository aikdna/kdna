# KDNA Authoring Guide

> **For distributable KDNA assets, use [kdna-studio-cli](https://github.com/aikdna/kdna-studio-cli).** The dev source workflow below is for experimentation and CI validation. Dev source directories are authoring views and do not by themselves constitute a shippable `.kdna` asset.

## Quick Start (Dev Source — for experimentation)

1. Copy `templates/minimal-domain/` to your working directory
2. Rename the folder to your domain ID (e.g., `my_domain`)
3. Edit each JSON file — fill in every placeholder in angle brackets
4. Validate: `kdna validate <your-domain-folder>`
5. Export a `.kdna` asset, then validate and load that exact asset through the
   Runtime contract.

> **To produce a `.kdna` asset:** create or migrate a Studio project, export it, then run `kdna validate`, `kdna plan-load`, and `kdna load`. See [getting-started.md](./getting-started.md).

---

## 0. Field Name Reference (REQUIRED — read before writing any JSON)

If you write KDNA JSON from scratch, you MUST use these exact field names. The loader reads by field name; the validator checks by field name; wrong field names silently produce zero agent judgment.

### KDNA_Core.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | `version`, `domain`, `created`, `purpose`, `load_condition` | Invariant — must be in every KDNA file |
| `axioms[]` | `id`, `one_sentence`, `full_statement`, `why` | Invariant — see SPEC §5.2 |
| `ontology[]` | `id`, `one_sentence`, `essence`, `boundary`, `trigger_signal` | Invariant — see SPEC §5.3 |
| `frameworks[]` | `id`, `name`, `when_to_use`, `steps` | Invariant — see SPEC §5.4 |
| `core_structure[]` | `from`, `to`, `via` | Invariant — see SPEC §5.5 |
| `stances` | `string[]` | Invariant — array of stance strings |

### KDNA_Patterns.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | (same as above) | Invariant |
| `terminology.standard_terms[]` | `term`, `definition` | Standard vocabulary |
| `terminology.banned_terms[]` | `term`, `why`, `replace_with` | Invariant — see SPEC §6.2 |
| `misunderstandings[]` | `id`, `wrong`, `correct`, `key_distinction`, `why` | Invariant — see SPEC §6.3 |
| `self_check` | `string[]` or `{ question: string }[]` | Invariant — yes/no questions |

### KDNA_Scenarios.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | (same as above) | Invariant |
| `scenes[]` | `id`, `name`, `trigger_signal`, `sub_scenarios[]` | |

### KDNA_Cases.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | (same as above) | Invariant |
| `cases[]` | `id`, `title`, `context`, `what_happened`, `what_was_learned`, `structural_pattern` | |

### KDNA_Reasoning.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | (same as above) | Invariant |
| `reasoning_chains[]` | `id`, `one_sentence`, `logic` (string[]), `so_what` | Invariant — see SPEC §7.3 |

### KDNA_Evolution.json

| Section | Required Fields | Notes |
|---------|----------------|-------|
| `meta` | (same as above) | Invariant |
| `stages[]` | `id`, `name`, `description`, `indicators` (string[]) | |
| `evolution_layers[]` | `id`, `name`, `capability`, `from_stage`, `to_stage` | |
| `measurement[]` | `id`, `what`, `how`, `threshold` | |

### Common mistakes (field names that do NOT exist)

| If you wrote... | Use instead... |
|-----------------|----------------|
| `statement` | `one_sentence` (short) or `full_statement` (long) |
| `description` / `summary` | `one_sentence` |
| `name` / `definition` (on ontology) | `id` / `one_sentence` + `essence` |
| `claim` / `misreading` (on misunderstanding) | `wrong` |
| `reality` (on misunderstanding) | `correct` |
| `input` / `judgment` / `output` (on core_structure) | `from` / `via` / `to` |
| `conclusion` (on reasoning) | `one_sentence` |
| `brief` / `bad_pattern` / `master_pattern` (on cases) | `title` / `what_happened` / `structural_pattern` |
| `capability_layers` (on evolution) | `stages` |

For dev source experiments, copy `templates/minimal-domain/` or start a Studio project with `kdna-studio create <name>` (from `@aikdna/kdna-studio-cli`), or use `kdna cluster init <name>` so field names stay consistent. This creates a non-canonical workspace only. A formal asset exists when it is exported to the KDNA Asset Container and passes `kdna validate`; the Studio toolchain is one authoring path, not a creation gate.

---

## 1. Start Narrow

Do not try to encode an entire profession at once.

**Bad:** `leadership`  
**Better:** `frontline_team_feedback`  
**Best:** `feedback-delivery-first-time-manager`

A narrow domain forces you to write axioms with a clear decision boundary. A
broad domain produces generic advice whose intended effect cannot be inspected.

---

## 2. Write the Domain Sentence

Before writing any JSON, answer this:

```text
This domain helps an AI agent judge ______ so that ______.
```

Example:

> This domain helps an AI agent judge whether a meeting produced an actionable decision — or just discussion — so that the agent does not generate action items for commitments that don't exist.

If you cannot fill both blanks concretely, your domain is too vague.

---

## 3. Write Good Axioms

Axioms are the domain's core judgment principles. They must state a meaningful
choice and the conditions under which that choice applies.

### What makes a good axiom:

- **Specific**: Two experts would agree when it applies
- **Falsifiable**: You can construct a scenario where it does NOT apply
- **Decision-bearing**: Applying the axiom would select, reject, prioritize, or
  qualify something in at least one concrete case

### Good vs Bad:

| Bad (slogan) | Good (operational) |
|---|---|
| "Communication is important." | "The speaker's intent and the listener's interpretation are different things. Judge the gap, not the words." |
| "Be user-centered." | "When a user requests feature X, first identify what outcome they are trying to achieve. Features are means; outcomes are ends." |
| "Trust matters in sales." | "Price objections are certainty deficits, not price problems. Lowering price addresses the symptom; building certainty addresses the cause." |

### Self-test for each axiom:

- If I remove this axiom, does the asset lose a meaningful choice in at least
  one scenario?
- Can I write a specific scenario where this axiom selects one direction over
  another?
- Can I write a scenario where this axiom does NOT apply (proving it has a boundary)?

---

## 4. Write Good Ontology Concepts

Every concept needs a real boundary, not a dictionary definition.

### What makes a good ontology entry:

- **Operational essence**: Not "what does this word mean" but "what does the agent need to check"
- **Real boundary**: Something the agent must NOT confuse this concept with
- **Observable trigger**: Words or patterns the agent can detect in user input

### Good vs Bad:

| Bad (decorative) | Good (operational) |
|---|---|
| Essence: "Trust is important in relationships." Boundary: "Not distrust." | Essence: "The buyer believes you will prioritize their outcome over your commission." Boundary: "Not rapport. Rapport is comfort; trust is confidence in your intent." Trigger: "Buyer asks for references, pauses before answering pricing questions, or says 'I need to think about it' without a specific concern." |
| Essence: "Quality means meeting standards." Boundary: "Not low quality." | Essence: "The product performs its core function without requiring workarounds." Boundary: "Not feature count. A product with 3 features that all work is higher quality than one with 20 features and 15 workarounds." |

---

## 5. Write Good Stances

Stances are the domain's default positions. Think of them as "when in doubt, lean this way."

### What makes a good stance:

- Prescriptive, not descriptive
- The stance selects a direction that differs from at least one plausible
  alternative
- Paired with its opposite (so the agent knows both positions exist)

### Good vs Bad:

| Bad (truism) | Good (prescriptive) |
|---|---|
| "Be honest." | "Transparency about uncertainty builds more trust than confident wrong answers." |
| "Listen to the customer." | "The customer describes symptoms; the professional diagnoses causes. Do not build what the customer asks for — build what solves the problem they described." |

---

## 6. Write Good Misunderstandings

Misunderstandings are usually more useful than definitions. For each:

- **wrong**: What an agent without domain judgment would assume
- **correct**: What the domain teaches instead
- **key_distinction**: The specific conceptual boundary
- **why**: What bad judgment results from the wrong interpretation

### Good vs Bad:

| Bad (straw man) | Good (real confusion) |
|---|---|
| Wrong: "Communication doesn't matter." | Wrong: "If the other person is upset, I should address their emotions first." |
| Correct: "Communication matters." | Correct: "If the other person is upset, I should identify the unmet need behind the emotion. Addressing the emotion without the need is temporary relief." |
| **(No real agent would hold this wrong belief)** | **(Many agents default to emotion-first because it feels empathetic)** |

---

## 7. Write Good Self-Checks

Self-checks are yes/no questions the agent asks itself after generating a response. They are the last line of defense.

### What makes a good self-check:

- Yes/no answerable
- Domain-specific (not generic "is this helpful?")
- Would catch a real mistake the agent might make

### Good vs Bad:

| Bad (generic) | Good (domain-specific) |
|---|---|
| "Is the response helpful?" | "Did I check whether the meeting actually produced a decision, or did I just summarize what was discussed?" |
| "Did I follow best practices?" | "Did I identify the buyer's specific certainty deficit before suggesting a response to their price objection?" |
| "Is this clear?" | "Would a domain expert reading this response say 'yes, that's how you think about this' — or did the agent default to common sense?" |

---

## 8. Prefer Observable Signals Over Abstract Labels

A trigger signal should be something the agent can actually detect in text.

**Bad:** `When the user is defensive.`  
**Better:** `When the user repeatedly justifies themselves, quotes the other person as unreasonable, or asks for a sentence that proves they are right.`

---

## 9. Pre-Publication Checklist

Before submitting a domain, verify:

- [ ] Each axiom carries a meaningful choice in at least one specific scenario
- [ ] Each ontology concept has a real boundary (something it is NOT)
- [ ] Each stance is prescriptive (would bias the agent toward a different answer)
- [ ] Each misunderstanding describes a belief a real agent might hold
- [ ] Each self-check is a yes/no question specific to this domain
- [ ] All trigger signals are observable in text
- [ ] `kdna-lint` passes with zero warnings
- [ ] `kdna-validate` passes
- [ ] Named review cases cover in-scope direction, out-of-scope restraint, and
      conflicts with facts, user intent, safety policy, or Host authority
- [ ] The exported projection preserves the critical judgment units and reports
      any omission or partial projection
- [ ] The `kdna.json` manifest is filled and accurate

---

## 10. Review the Asset and Its Projection

There is no universal output-improvement test for a judgment asset. Before
sharing one, the asset owner or a named reviewer should instead inspect a
bounded set of cases and declare what acceptance means for that asset:

- in-scope cases should express the declared preference or decision rule;
- out-of-scope cases should not inherit the asset's judgment;
- current facts, explicit user intent, law, safety policy, and Host authority
  take precedence when they conflict;
- the exported projection should preserve critical judgment units and make any
  omission visible;
- authorization, disabling, switching, and rollback should remain possible in
  the intended Host.

A caller may compare different carriers or unloaded outputs for its own
diagnosis, but that comparison is not a KDNA validity gate and does not prove
that KDNA improves model intelligence, is universally correct, or is superior
to Prompt, Skill, or ordinary documents.

```bash
# Validate the exported asset and inspect its LoadPlan
kdna validate ./dist/my-domain.kdna
kdna plan-load ./dist/my-domain.kdna

# Load an explicit projection for review
kdna load ./dist/my-domain.kdna --profile=compact --as=json
```

---

## 11. Cluster Authoring (multi-domain)

For clusters containing multiple domains, use `kdna cluster init <name>` and see `templates/cluster/`.

Each sub-domain in a cluster follows the same six-file structure. The cluster manifest (`KDNA_Cluster.json`) declares packages and composition rules.
