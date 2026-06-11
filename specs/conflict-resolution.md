# KDNA Cross-Domain Conflict Resolution

**Status:** Draft  
**Version:** 1.0

## 1. Problem

When multiple KDNA domains are loaded simultaneously (via Cluster or Work Pack), they may produce conflicting judgment. Example:

- `@aikdna/writing` says "prefer active voice"
- `@aikdna/academic_writing` says "prefer passive voice for methodology sections"

The current `expose_all` strategy dumps both axioms into the agent context and lets the agent decide. This produces non-deterministic results and undermines trust in KDNA as a judgment layer.

## 2. Conflict Categories

| Type | Example | Resolution |
|------|---------|------------|
| **Direct contradiction** | Domain A: "do X", Domain B: "do not X" | ❌ Block — must be resolved before loading |
| **Scope overlap** | Both domains claim authority on the same task | ⚠️ Warn — agent must select primary |
| **Priority mismatch** | Domain A: "always X", Domain B: "sometimes not X" | ✅ Accept — B is more specific, takes precedence |
| **Harmless difference** | Different recommended tools, same judgment | ✅ Accept — no conflict |

## 3. Detection

When loading a Cluster:

1. For each axiom pair across domains, check semantic similarity (via embedding or keyword overlap)
2. If two axioms have similar `applies_when` but opposite conclusions, flag as conflict
3. Classify conflict type based on overlap of scope and specificity

## 4. Resolution Strategies

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| `expose_all` | Show all axioms, mark conflicts | Development, debugging |
| `select_primary` | User selects which domain takes precedence | Interactive use |
| `block_conflicts` | Refuse to load if conflicts detected | Production, safety-critical |
| `resolve_by_scope` | More specific domain wins (narrower scope = higher priority) | Automated pipelines |

## 5. CLI Interface

```bash
# Check for conflicts
kdna cluster conflicts <cluster.json> --input "<task>"

# Load with conflict resolution
kdna cluster load <cluster.json> --input "<task>" --strategy block_conflicts

# List potential conflicts
kdna cluster lint <cluster.json>
```

## 6. Implementation Notes

Conflict detection requires semantic comparison of axioms. Initial implementation:
- L0: Keyword overlap check (fast, approximate)
- L1: Embedding-based similarity (more accurate, requires external model)
- L2: LLM-based conflict classification (most accurate, requires API call)

Default is L0 with flag to upgrade to L1/L2.
