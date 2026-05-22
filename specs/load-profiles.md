# KDNA Load Profiles

Load profiles define how much of a domain's content is injected into an agent's context, depending on relevance and token budget constraints. This is critical for clusters with 10+ domains.

## Profile Levels

| Level | Profile | Includes | Use Case |
|-------|---------|----------|----------|
| L1 | **index** | manifest (name, description, keywords, trigger_signals) | Domain selection — which domains match this task? |
| L2 | **compact** | highest_question, axioms (one_sentence only), risk_model, self_checks | Lightweight judgment — domain participates but doesn't dominate context |
| L3 | **scenario** | relevant scenarios, recommended frameworks, risk_model for current task | Task-specific — domain activates only for a specific situation type |
| L4 | **full** | All 6 files (Core + Patterns + Scenarios + Cases + Reasoning + Evolution) | Full participation — domain is highly relevant or task is high-risk |

## Cluster Integration

When a cluster loads, the runtime MUST apply load profiles as follows:

1. **Candidate selection** (L1): Scan all cluster domains at `index` level. Filter by `trigger_signals` and `does_not_apply_when`. Order by priority.

2. **Budget allocation**: From the remaining token budget (after system prompt and user context), allocate tokens to domains in priority order. High-priority domains receive higher profile levels.

3. **Profile assignment**: Assign each selected domain a profile based on:
   - Relevance score (from signal matching)
   - Priority (from cluster composition policy)
   - Risk level (from domain's `risk_model`)
   - Remaining token budget

4. **Source-preserving injection**: All content injected MUST carry source attribution: `[domain_id:field_type.field_id]`.

## Example

A product launch cluster with 6 domains and a 12,000 token budget:

```
Priority  Domain          Relevance  Profile   Tokens
────────  ────            ─────────  ───────   ──────
100       security_review RISK       full      1,800
90        legal_risk      HIGH       scenario  800
70        brand_voice     req        compact   600
60        product_strat   HIGH       compact   600
40        pricing         MED        compact   600
30        launch_comm     req        compact   600
                                        ─────
                                        5,000
```

Remaining 7,000 tokens for system prompt, conversation history, and user input.

## Profile Override

Individual domains within a cluster MAY override the default profile assignment by declaring a minimum profile. For example, a `risk_guard` domain may require `full` profile regardless of token budget, which would trigger a budget reallocation warning.

## Compression

When even `compact` profiles would exceed the token budget, the runtime MAY apply compression:
- **Axiom deduplication**: Remove axioms that are semantically similar across domains (keep highest-priority version)
- **Self-check collapse**: Merge similar self-checks from different domains
- **Stance conflict flag**: Instead of including conflicting stances in full, flag the conflict type and let the agent request details

Compression MUST NOT be applied silently. The judgment trace MUST record what was compressed.
