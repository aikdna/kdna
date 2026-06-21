# KDNA Demo: OpenCode Agent

## Actual Agent Context

When the agent loads the sales KDNA domain, it receives this structured judgment context (6,302 chars):

[View full context →](./sales-context.txt)

Key elements injected into the agent's reasoning frame:
- **5 stances** — Default postures (e.g., "I ask more than I tell")
- **4 axioms** — Core judgment principles with why explanations
- **4 ontology concepts** — With boundaries and trigger signals
- **6 banned terms** — With reasons and replacements
- **4 misunderstandings** — Wrong vs. correct interpretations
- **6 self-checks** — Yes/no questions the agent asks itself

## Reproduce

```bash
# 1. Install KDNA CLI
npm i -g @aikdna/kdna-cli

# 2. Prepare a local .kdna asset
kdna pack ../../examples/sales ./sales.kdna
kdna validate ./sales.kdna
kdna plan-load ./sales.kdna

# 3. Install skills for OpenCode
curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash

# 4. Start OpenCode and try:
#    "Use kdna-loader. The client says our price is too high. How should I respond?"
```

## Before KDNA (no domain loaded)

**Input:** "The client says our price is too high. How should I respond?"

**Agent response:**

> Price objections are common. Here are some approaches:
> 1. Emphasize the value and ROI your product delivers
> 2. Compare your pricing to competitors to show you're competitive
> 3. Offer a discount or flexible payment terms
> 4. Highlight unique features that justify the price
> 5. Share customer success stories as social proof
>
> The key is to help the client see that the value outweighs the cost.

**Problems with this response:**
- Treats objection as a price problem, not a diagnostic signal
- Suggests discounting before understanding the real issue
- No attempt to identify which dimension of certainty is missing
- Uses generic sales advice, not domain-specific judgment

---

## After KDNA (sales domain loaded)

**Input:** "The client says our price is too high. How should I respond?"

**Agent response:**

> A price objection is usually a certainty deficit, not a literal price problem.
> Before responding, let me diagnose which dimension is missing.
>
> First, ask: "I want to make sure I understand. When you say the price is too high, is it that you're not yet convinced the value matches the investment, or is it more about internal budget constraints?"
>
> Based on their answer:
> - If value uncertainty: ask what they expected to see that they haven't seen yet
> - If risk uncertainty: ask what a successful outcome would need to look like for this to feel like a safe decision
> - If budget uncertainty: explore what trade-offs they're weighing
>
> Whatever you do, don't offer a discount before diagnosing. Discounting without resolving the underlying uncertainty just lowers the price of an uncertain decision — the client still won't buy, and you've trained them to negotiate on price.

**What changed:**
- ✓ Applied axiom: "People buy certainty, not products"
- ✓ Applied concept: price_objection = certainty deficit signal
- ✓ Used diagnostic approach before any suggestion
- ✓ Avoided banned term: "discount" (used only to warn against it)
- ✓ Applied self-check: "Did I diagnose before I responded?"

---

## Agent loading log

```
[KDNA] loaded: sales@0.1.0 | modules: core, patterns | mode: auto
Applied: axioms, stances, ontology, banned_terms, self_check
```
