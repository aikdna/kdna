# RFC-0011: KDNA Product Runtime — Long-running Coaching & Delivery Pattern

**Status:** Draft  
**Proposed:** 2026-06-08  
**Authors:** KDNA Maintainers  
**Related:** RFC-0012 (Artifact Contract), RFC-0010 (Fidelity Protocol), KDNA SPEC v1.0-rc, KDNA App Runtime Contract

---

## Abstract

KDNA's existing runtime patterns address three modes: **Chat Runtime** (single conversation, request-response via kdna-load), **Pipeline Runtime** (multi-stage batch generation via WorkPack Pipeline, RFC-0012), and **Agent Runtime** (tool-using agent loop via kdna-loader skill). None address the fourth mode: a **Product Runtime** — a long-running cycle where KDNA-governed artifacts are generated, delivered, observed, and adapted over weeks or months in a sustained human-AI relationship.

This RFC defines the **Product Runtime Pattern**: a protocol contract for schedule-driven, observation-adaptive, relationship-sustaining KDNA artifact delivery. It does not define a runtime engine — only the contract that any product runtime (coaching app, learning platform, wellness tracker) can implement.

---

## 1. Motivation

### 1.1 The Fourth Runtime Mode

| Runtime Mode | Cycle | Example | KDNA Contract |
|-------------|-------|---------|---------------|
| **Chat** | Request → Load KDNA → Response | KDNAChat, agent conversation | `kdna route` + `kdna load` |
| **Pipeline** | Stage 1 → Stage 2 → ... → Stage N → Finalize | Course generation | WorkPack Pipeline + RFC-0012 |
| **Agent** | Observe → Decide → Act → Observe → ... | Codex, Claude Code | kdna-loader skill |
| **Product** | Schedule → Select → Generate → Deliver → **Observe → Adapt** → Schedule → ... | CoachLettersAI, daily coaching | **This RFC** |

### 1.2 What makes Product Runtime different

- **Temporal:** Cycles span days or weeks, not seconds
- **Relational:** Each cycle builds on the user's history — the artifact is personalized by observation
- **Proactive:** The system initiates delivery (schedule-driven), not the user
- **Adaptive:** User response to artifact N informs artifact N+1
- **Governed:** KDNA judgment governs WHAT to select, HOW to generate, and WHEN to adapt

### 1.3 Real example: CoachLettersAI

A daily coaching app: every morning, the system selects a coaching KDNA domain (conflict, EQ, expression, intimacy), generates a personalized daily letter and micro-practice, delivers it via notification, observes the user's reply, extracts observations, and uses them to improve tomorrow's letter.

This is not a chatbot. It is a product loop governed by KDNA judgment.

---

## 2. The Product Runtime Contract

### 2.1 The Six-Phase Cycle

```
┌─────────────────────────────────────────────────────────┐
│                    Product Runtime Cycle                 │
│                                                          │
│  1. SCHEDULE     2. SELECT       3. GENERATE             │
│  ┌──────────┐   ┌──────────┐   ┌──────────────┐        │
│  │ When to   │──▶│ Which     │──▶│ Generate     │        │
│  │ trigger?  │   │ KDNA?     │   │ artifact     │        │
│  └──────────┘   └──────────┘   └──────┬───────┘        │
│                                        │                 │
│  6. ADAPT        5. OBSERVE        4. DELIVER           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│  │ Improve   │◀──│ Extract   │◀──│ Push to   │            │
│  │ next cycle│   │ signals   │   │ user      │            │
│  └──────────┘   └──────────┘   └──────────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Phase 1: Schedule

**Contract:** When does the cycle trigger?

```typescript
interface Schedule {
  type: 'cron' | 'interval' | 'event_driven' | 'manual';
  cron?: string;           // e.g. "0 8 * * *" (daily at 8am)
  interval_seconds?: number;
  event_trigger?: string;  // e.g. "user.signup", "user.milestone_reached"
  timezone?: string;
  skip_policy: 'skip' | 'delay' | 'generate_immediately';
  max_backlog: number;     // max queued cycles before forcing delivery
}
```

A schedule defines **when**, not what happens — that's phase 2.

### 2.3 Phase 2: Select

**Contract:** Which KDNA domain governs this cycle? What artifact type to produce?

```typescript
interface SelectionStrategy {
  type: 'fixed' | 'rotating' | 'context_aware' | 'user_choice';
  domain_pool: Array<{ name: string; role: string }>;  // KDNA domains to choose from
  rotation?: 'sequential' | 'weighted' | 'adaptive';   // for rotating strategy
  context_signals?: string[];     // signals to observe for context_aware selection
  artifact_type: string;          // what to generate (daily_letter, micro_practice, etc.)
  user_state_path?: string;       // where user history/profile is stored
}
```

**Selection strategies:**
| Strategy | Logic | Example |
|----------|-------|---------|
| `fixed` | Always the same domain | Daily writing tip from `@aikdna/writing` |
| `rotating` | Cycle through domain pool | Mon: conflict, Tue: EQ, Wed: expression |
| `context_aware` | Match domain to user's current state | User reported conflict → select conflict domain |
| `user_choice` | User picks domain | "Which topic today?" prompt |

### 2.4 Phase 3: Generate

**Contract:** Generate the artifact using selected KDNA + user context.

```typescript
interface GenerationConfig {
  engine: string;                // e.g. 'daily-letter-engine'
  engine_version: string;
  artifact_type: string;
  template?: string;             // optional template path
  quality_gates: Array<{
    gate_type: 'schema_validation' | 'kdna_compliance' | 'fidelity_check' | 'human_review';
    blocking: boolean;
  }>;
  kdna_load_profile: 'index' | 'compact' | 'scenario' | 'full';
  max_generation_attempts: number;
}
```

Generation produces an RFC-0012 ArtifactEnvelope containing the deliverable. Per RFC-0010, fidelity measurement may run inline.

### 2.5 Phase 4: Deliver

**Contract:** How the artifact reaches the user.

```typescript
interface DeliveryChannel {
  type: 'push_notification' | 'email' | 'in_app' | 'sms' | 'api_webhook';
  template?: string;            // delivery message template
  metadata?: Record<string, unknown>;
}
```

Delivery records a delivery event in the trace system. If delivery fails, the retry policy from the schedule applies.

### 2.6 Phase 5: Observe

**Contract:** What to observe from user interaction and how to extract structured signals.

```typescript
interface ObservationConfig {
  sources: Array<'user_reply' | 'user_action' | 'completion_rate' | 'explicit_feedback'>;
  signal_mapping: Array<{
    source: string;
    extract: string;           // what to look for in the source
    maps_to: string;           // what observation field it populates
  }>;
  kdna_for_observation?: string;  // optional KDNA domain for interpreting user signals
}
```

Observation produces a structured **Observation Record**:

```typescript
interface Observation {
  observation_id: string;
  cycle_id: string;
  timestamp: string;
  user_id: string;
  source: string;
  signals: Array<{
    type: 'emotion' | 'progress' | 'blocker' | 'preference' | 'question' | 'feedback';
    value: string;
    confidence: number;
  }>;
  summary: string;              // one-line summary for the adaptation engine
  linked_artifact_id: string;   // the artifact this observation responds to
}
```

### 2.7 Phase 6: Adapt

**Contract:** How observations from cycle N influence cycle N+1.

```typescript
interface AdaptationConfig {
  enabled: boolean;
  max_adaptation_depth: number;   // how many cycles back to consider
  adaptation_rules: Array<{
    signal_type: string;
    condition: string;            // e.g. "value == 'frustrated'" or "confidence > 0.8"
    action: 'adjust_tone' | 'change_domain' | 'increase_detail' | 'simplify' | 'skip_next' | 'escalate' | 'repeat_domain';
    params?: Record<string, unknown>;
  }>;
  human_lock_required: boolean;   // KDNA governance: must human approve adaptations?
}
```

**Key principle:** Adaptation rules are **not** KDNA judgment updates. They are operational adjustments (tone, detail level, pacing). Judgment changes (axioms, boundaries, risk models) still require Human Judgment Lock per KDNA SPEC §1.7.

The adaptation phase produces an **Adaptation Record**:

```typescript
interface Adaptation {
  adaptation_id: string;
  cycle_id: string;
  previous_cycle_id: string;
  triggered_rules: string[];
  changes_applied: Array<{
    field: string;
    from: unknown;
    to: unknown;
    reason: string;
  }>;
  human_approved?: boolean;
  human_approver_id?: string;
}
```

---

## 3. Full Product Runtime Manifest

A `product-runtime.json` manifest bundles all six phases into one deployable contract:

```json
{
  "format": "kdna-product-runtime",
  "format_version": "0.1",
  "name": "daily-coaching",
  "version": "0.1.0",
  "description": "Daily KDNA-governed coaching letter with micro-practice and adaptive improvement",
  "schedule": {
    "type": "cron",
    "cron": "0 8 * * *",
    "timezone": "Asia/Shanghai",
    "skip_policy": "generate_immediately",
    "max_backlog": 3
  },
  "selection": {
    "type": "context_aware",
    "domain_pool": [
      { "name": "@aikdna/conflict", "role": "primary" },
      { "name": "@aikdna/eq", "role": "primary" },
      { "name": "@aikdna/expression", "role": "primary" },
      { "name": "@aikdna/intimacy", "role": "primary" }
    ],
    "context_signals": ["user.last_reply_emotion", "user.current_challenge"],
    "artifact_type": "daily_letter",
    "user_state_path": "~/.kdna/users/{user_id}/state.json"
  },
  "generation": {
    "engine": "daily-letter-engine",
    "engine_version": "0.1.0",
    "artifact_type": "daily_letter",
    "quality_gates": [
      { "gate_type": "schema_validation", "blocking": true },
      { "gate_type": "kdna_compliance", "blocking": true },
      { "gate_type": "fidelity_check", "blocking": false }
    ],
    "kdna_load_profile": "full",
    "max_generation_attempts": 2
  },
  "delivery": {
    "type": "push_notification",
    "template": "Your daily letter is ready: {artifact.title}"
  },
  "observation": {
    "sources": ["user_reply", "explicit_feedback"],
    "signal_mapping": [
      { "source": "user_reply", "extract": "emotional_tone", "maps_to": "emotion" },
      { "source": "user_reply", "extract": "stated_challenge", "maps_to": "blocker" },
      { "source": "explicit_feedback", "extract": "rating", "maps_to": "feedback" }
    ]
  },
  "adaptation": {
    "enabled": true,
    "max_adaptation_depth": 5,
    "adaptation_rules": [
      { "signal_type": "emotion", "condition": "value == 'frustrated'", "action": "simplify" },
      { "signal_type": "progress", "condition": "value == 'stuck'", "action": "repeat_domain" },
      { "signal_type": "feedback", "condition": "rating < 3", "action": "change_domain" }
    ],
    "human_lock_required": false
  }
}
```

---

## 4. Integration with KDNA Governance

### 4.1 Human Judgment Lock boundary

The Product Runtime observes user behavior and adjusts **operational** parameters (tone, detail level, domain selection, pacing). It MUST NOT adjust **judgment** parameters (axioms, boundaries, risk models, value order). Judgment changes still flow through Human Judgment Lock per KDNA SPEC §1.7.

| Class | Auto-apply in Product Runtime? | Example |
|-------|-------------------------------|---------|
| **Operational** | Yes | Tone adjustment, domain rotation, delivery time |
| **Evidence** | Record only | User emotion signals, feedback scores, completion rates |
| **Judgment** | **No** — requires Human Lock | Axiom revision, boundary change, risk threshold update |

### 4.2 Trace integration

Every cycle produces an Evidence Trace with:
- `trace_type: product_delivery`
- `artifact_refs` linking to the generated artifact
- `observation_refs` linking to the observation record
- `adaptation_refs` linking to any adaptations applied

Traces form a chain across cycles via `session_id` (user identity) and `parent_trace_id` (previous cycle).

### 4.3 Fidelity Protocol integration

Long-running products are the strongest test of fidelity: does judgment consistently transfer across cycles, or does it degrade? A product runtime MAY run periodic fidelity measurements (every 10th cycle, or on domain change) to detect drift.

---

## 5. Relationship to Existing Runtimes

| Runtime | Cycle | KDNA Loading | This RFC adds |
|---------|-------|-------------|---------------|
| Chat | Request→Response | `kdna route` + `kdna load` | — |
| Pipeline | Stage→Stage | Per-stage via Pipeline manifest | — |
| Agent | Observe→Act→Observe | kdna-loader MCP tools | — |
| **Product** | **Schedule→Deliver→Observe→Adapt** | Per-cycle via Selection strategy | Schedule contract, Observation→Adaptation loop, delivery channels |

---

## 6. Non-Goals

- **Not a runtime engine.** This RFC defines the contract pattern. Implementation (CronJobRunner, NotificationService, UserStateStore) is product-specific.
- **Not a replacement for Chat or Pipeline runtime.** Product Runtime is an additional mode, not a replacement.
- **Not automatic judgment evolution.** Adaptation adjusts operations, not judgment. Human Lock remains the gate for judgment changes.
- **Not a user management system.** User identity, authentication, and profile storage are product concerns.

---

## 7. Implementation Notes

A reference implementation (e.g. CoachLettersAI / gvjl) would implement:

1. **Scheduler** — reads `schedule` from manifest, triggers cycles
2. **Selector** — reads `selection` from manifest, runs `kdna route` for domain matching
3. **Generator** — reads `generation` from manifest, calls artifact engine
4. **Deliverer** — reads `delivery` from manifest, pushes to user
5. **Observer** — reads `observation` from manifest, extracts signals from user response
6. **Adapter** — reads `adaptation` from manifest, applies operational adjustments

All six components consume the same `product-runtime.json` manifest. The manifest is the contract; the components are the implementation.

---

## 8. Schema File

- `specs/product-runtime.schema.json` — Product Runtime manifest schema
