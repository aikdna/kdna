# KDNA Runtime Routing

Version: 0.1  
Status: Draft  
Canonical: `docs/runtime-routing.md`

## 1. Purpose

KDNA Runtime Routing is the mechanism that determines **whether, which, and how** a KDNA domain should be loaded for a given task. It is not a search engine — it is a **gate**. Its primary responsibility is to prevent wrong-domain loading (Judgment Contamination) while enabling correct-domain loading.

**Core principle: No KDNA is better than wrong KDNA.**

## 2. Router Architecture

```
User Task
    ↓
kdna route "<task>" --json
    ↓
┌─────────────────────────────────────────┐
│              KDNA Domain Router           │
│                                           │
│  1. Intent Gate        → needs_kdna?     │
│  2. Negative Match     → any rejection?  │
│  3. Domain Fit         → any match?      │
│  4. Trust Gate         → can load?       │
│  5. Ambiguity Gate     → which one?      │
│  6. Output State       → 7-state result   │
└─────────────────────────────────────────┘
    ↓
Agent executes route result exactly
```

## 3. Seven Route States

### SKIP_NO_JUDGMENT_NEEDED
**Condition**: Task is mechanical, factual, or procedural — no domain judgment required.  
**Examples**: format conversion, syntax fixes, file lookups, arithmetic, code execution, simple translation.  
**Action**: Answer normally. Do not mention KDNA.  
**Trace**: record decision, no domain loaded.

### SKIP_NO_LOCAL_DOMAIN
**Condition**: Task may benefit from domain judgment, but no installed domain covers it.  
**Examples**: "design a website" with only team_management installed.  
**Action**: Answer normally using model capability. If user explicitly asks about KDNA, mention available domains that could be installed.  
**Trace**: record gap for potential discovery.

### SKIP_WEAK_FIT
**Condition**: A domain has partial relevance but confidence is below threshold.  
**Examples**: writing domain for a task that is 30% editing, 70% creative ideation.  
**Action**: Answer normally. Record in trace that a weak match was considered and skipped.  
**Trace**: record candidate domain and skip reason.

### REJECT_NEGATIVE_MATCH
**Condition**: A domain's `does_not_apply_when` explicitly excludes this task type.  
**Examples**: visual_design domain with "does_not_apply_when: user asks for frontend implementation only."  
**Action**: **Block loading.** The domain author explicitly excluded this case.  
**Trace**: record rejection with specific does_not_apply_when entry.

### ASK_AMBIGUOUS_DOMAIN
**Condition**: Two or more domains could apply, but each would produce a different judgment frame.  
**Examples**: writing domain (structural diagnosis) vs copy_polish domain (line-level editing) for "review this article."  
**Action**: Present the choice to the user. Do NOT silently blend.  
**Trace**: record ambiguity and user choice.

### LOAD_STRONG_FIT
**Condition**: One domain has high-confidence match, and trust gate passes.  
**Action**: `kdna load <domain>`. Apply domain to task judgment.  
**Trace**: record loaded domain, triggered axioms, excluded domains.

### BLOCK_TRUST_FAILED
**Condition**: Domain matches semantically, but trust verification fails.  
**Reasons**: signature invalid, domain yanked, license expired, risk level blocked by policy, compatibility level insufficient.  
**Action**: Block loading. Notify user if appropriate for the Agent mode.  
**Trace**: record trust failure with specific reason.

## 4. Negative Match First

Traditional search asks: "Does this match?"

KDNA routing asks first: **"Does this explicitly say it should NOT be used here?"**

A domain that states `"does_not_apply_when": ["user asks for frontend implementation only"]` must be excluded before any positive matching is considered. The domain author's boundary must be respected at the protocol level — not left to LLM interpretation.

## 5. Trust Gate

Before loading, verify:

1. **Signature valid**: `kdna verify <domain>` passes
2. **Not yanked**: domain is not in yanked state in registry
3. **License valid**: for `licensed` or `runtime` domains, license is active
4. **Risk level acceptable**: domain's risk_level does not exceed organizational policy
5. **Compatibility**: domain declares supported SPEC version compatible with loader

## 6. Agent Integration Modes

### Mode A: Silent Runtime (Claude Code, Codex, OpenCode)
- Auto-evaluate route
- Strong fit → load silently
- Skip/weak/reject → no user interruption
- Trace everything for audit

### Mode B: Interactive Choice (a KDNA-compatible client, authoring tools)
- Auto-evaluate route
- Ambiguous → show user the choice
- No local domain → suggest discovery (but don't auto-install)
- Skip → user can manually load if they disagree

### Mode C: Policy-Locked (Enterprise)
- Admin configures allowed domains, risk levels, and auto-load policies
- Route respects organizational policy gates
- All decisions logged for compliance audit

## 7. Discovery Without Installation

When `SKIP_NO_LOCAL_DOMAIN` is the result, the system may **suggest** domains from the registry — but must NOT auto-install or auto-load them.

```
$ kdna route "design a landing page for my SaaS" --discover --json
{
  "action": "skip",
  "status": "SKIP_NO_LOCAL_DOMAIN",
  "registry_suggestions": [
    {
      "name": "@aikdna/website_design",
      "reason": "matches website structure and conversion evaluation",
      "trust": "official",
      "install_command": "kdna install @aikdna/website_design"
    }
  ],
  "auto_install": false
}
```

## 8. CLI Integration

The `kdna route` command is the single entry point for KDNA runtime:

```bash
kdna route "<user task>" --json
```

It composes existing CLI capabilities:
- `kdna available --json` → local domain inventory
- `kdna match "<task>" --json` → mechanical negative match
- `kdna verify <domain>` → trust verification

The output conforms to [`specs/route-result.schema.json`](../specs/route-result.schema.json).

The Agent then executes exactly the route result:
- `action: load` → `kdna load <domain>`
- `action: skip` → answer normally
- `action: ask` → present choice
- `action: block` → stop loading

### Action / Status Mapping

| Status | Action | Behavior |
|--------|--------|----------|
| SKIP_NO_JUDGMENT_NEEDED | skip | Answer normally. Don't mention KDNA. |
| SKIP_NO_LOCAL_DOMAIN | skip | Answer normally. Only mention KDNA if asked. |
| SKIP_WEAK_FIT | skip | Answer normally. Trace the weak match. |
| REJECT_NEGATIVE_MATCH | skip | Answer normally. The rejected domain's boundary excludes this task. |
| ASK_AMBIGUOUS_DOMAIN | ask | Present choice to user. Don't blend. |
| LOAD_STRONG_FIT | load | `kdna load <domain>` |
| BLOCK_TRUST_FAILED | block | Stop. Trust/policy/lice verify failed. |

**Note on REJECT_NEGATIVE_MATCH**: A candidate domain is rejected — but if no other domain matches, the route's action is `skip` (not `block`). The Agent answers normally. `block` is reserved for trust/policy failures where loading would violate governance.

## 9. Trace

Every route decision must be traceable:

```json
{
  "task_summary": "design a website homepage",
  "route_result": "SKIP_NO_LOCAL_DOMAIN",
  "candidates_evaluated": [
    {
      "domain": "@aikdna/team_management",
      "result": "rejected",
      "reason": "domain is about organizational diagnosis, not website design",
      "matched_does_not_apply_when": null,
      "confidence": 0.08
    }
  ],
  "selected": null,
  "registry_suggestions": [],
  "timestamp": "2026-05-24T18:00:00Z"
}
```

---

*This specification defines the runtime routing behavior for KDNA. It is referenced by kdna-loader/SKILL.md and implemented by kdna-cli.*
