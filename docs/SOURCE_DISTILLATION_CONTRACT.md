# KDNA Source Distillation Contract

> Version: 0.2  
> Status: Updated — added Distillation Target (Layer 0) and Scope Gate  
> Audience: KDNA Studio, kdna-studio-cli, kdna-studio-core, Mac Apps, agent adapters  
> Relationship: Companion to [`app-runtime-contract.md`](./app-runtime-contract.md)

## Purpose

This contract defines the five-layer object model for distillation-first KDNA authoring: declaring a target domain, turning a user's existing content into loadable .kdna judgment assets through AI-assisted pattern extraction, and enforcing mandatory human confirmation — all within a declared scope.

The critical addition in 0.2: **Domain-First Distillation.** Before any content analysis begins, the user MUST declare what domain, scope, and granularity this KDNA targets. Without this declaration, distillation produces unfiltered personality dumps rather than domain-specific judgment assets.

## Non-goals

This contract does not define:

- UI layout or product flows for desktop authoring application
- File import format support list (which formats to support is a product decision)
- Pricing, licensing, or marketplace behavior
- Interview-first authoring (covered by the existing Studio Export Contract)

## Five-Layer Model

```
Layer 0: Distillation Target  →  Declaration of domain / scope / granularity
Layer 1: Source Layer           →  Evidence
Layer 2: Distillation Layer     →  Candidates
Layer 3: Judgment Asset Layer   →  Locked Cards
Layer 4: Consumption Layer      →  .kdna loading
```

### Layer 0: Distillation Target

Before any evidence is analyzed, the user MUST declare a Distillation Target. This is not optional — distillation without a target produces mixed-personality artifacts that violate KDNA's core value proposition (domain-specific, loadable judgment).

```json
{
  "target_id": "tgt_20260531_001",
  "domain_name": "writing_style",
  "domain_category": "expression_writing",
  "owner_scope": "personal",
  "granularity": "core_principles",
  "task_scope": "longform article diagnosis and revision",
  "include_areas": [
    "argument structure",
    "tone preference",
    "headline boundaries",
    "revision standards"
  ],
  "exclude_areas": [
    "life habits",
    "food/travel preference",
    "general personality traits",
    "unrelated professional knowledge"
  ],
  "load_condition": "Load when reviewing or drafting longform writing. Do not load for visual design or decision-making tasks.",
  "declared_at": "2026-05-31T10:00:00Z",
  "declared_by": "kdna-studio-cli 2.1.0"
}
```

**Domain Categories:**

| Category | ID | Examples |
|----------|-----|---------|
| Expression & Writing | `expression_writing` | Writing style, article structure, blog voice, social media tone |
| Aesthetic & Creation | `aesthetic_creation` | Visual design, video rhythm, cover art, brand aesthetics |
| Professional Field | `professional_field` | Industry-specific judgment (medical, legal, education, real estate) |
| Decision Preference | `decision_preference` | Product decisions, investment criteria, prioritization methods |
| Communication Style | `communication_style` | Client communication, team management, conflict handling |
| Workflow & Process | `workflow_process` | Project reviews, meeting standards, sales follow-ups |
| Life Preference | `life_preference` | Schedule preferences, learning habits, consumption choices |
| Team & Organization | `team_organization` | Team brand standards, hiring criteria, service standards |

**Owner Scopes:**

| Scope | Description | Distillation extracts |
|-------|-------------|----------------------|
| `personal` | One person's individual standards | Personal preferences, boundaries, taste |
| `team` | Shared team conventions | Team-wide standards, agreed practices |
| `organization` | Company/organization policies | Organizational values, compliance boundaries |
| `field` | Industry/profession-wide | Domain expertise beyond any single practitioner |

**Granularity Levels:**

| Level | Description | Extracts |
|-------|-------------|----------|
| `core_principles` | High-level axioms and boundaries | Foundational beliefs, what the person consistently prioritizes and rejects |
| `concrete_patterns` | Recurring decision patterns | Specific rules and detectable habits |
| `specific_scenarios` | Scenario-level triggers | Context-specific judgment triggers and responses |

**Rules:**

1. Distillation Target MUST be declared before any evidence analysis begins
2. Domain category MUST be explicitly selected — no default or auto-detection
3. include_areas and exclude_areas define the extraction boundary
4. load_condition defines when this KDNA should and should not be loaded
5. Evidence outside the declared scope is classified as out-of-scope and excluded from AI extraction
6. Distillation Target is persisted with the project and referenced during Human Lock scope confirmation

**Evidence Relevance Classification:**

Every source material is classified against the declared Target:

| Classification | Meaning | Action |
|----------------|---------|--------|
| `relevant` | Content matches declared domain and include areas | Sent to AI extraction |
| `weakly_relevant` | Content has tangential connection to domain | Sent to AI extraction with lower weight |
| `out_of_scope` | Content explicitly matches exclude areas or unrelated domains | Excluded from AI extraction |
| `split_domain` | Content suggests a different domain category | Flagged for suggested separate KDNA |

**Scope Gate on Candidates:**

Every distillation candidate carries scope metadata:

```json
{
  "scope_fit": true,
  "domain_relevance_score": 80,
  "relevance_evidence": null,
  "suggested_split_domain": null
}
```

- `scope_fit`: AI-assessed fit within declared domain. `false` = candidate appears outside declared scope.
- `domain_relevance_score`: 0–100. 0-30 = likely out of scope. 70+ = strong domain match.
- `relevance_evidence`: Explanation of why candidate failed scope check.
- `suggested_split_domain`: If scope_fit is false and the candidate clearly belongs to a different domain, this field suggests which domain.

**Scope Gate Rules:**

1. scope_fit = false candidates are VISIBLE in review UI but NOT promoted to cards by default
2. User may EXPLICITLY override scope gate via override action (records reason)
3. Overridden candidates get scope_fit = true and relevance_evidence = "User explicitly overrode scope gate"
4. Promote operation requires `status == accepted AND scope_fit == true`
5. Human Lock MUST include scope confirmation when Distillation Target is declared:
   - "I confirm this judgment belongs to the declared KDNA domain scope and does not introduce content from outside this domain."

### Layer 1: Source Layer — Source Evidence

Source Evidence registers content provided by the user for analysis. Evidence is the input to distillation, never part of the output .kdna.

```json
{
  "evidence_id": "ev_20260531_001",
  "source_type": "local_folder",
  "source_path": "/Users/alice/writing-samples/",
  "file_count": 47,
  "content_hash": "sha256:abc123...",
  "privacy_level": "private",
  "import_scope": "local_only",
  "registered_at": "2026-05-31T10:00:00Z",
  "registered_by": "kdna-studio-cli 0.2.0"
}
```

**Rules:**

1. Source content must not be uploaded to any server without explicit user confirmation
2. Source content must not be embedded in .kdna domain files
3. Privacy level must be recorded at registration
4. Source content hash must be computed for provenance traceability
5. Evidence remains local to the user's device unless they choose to share it

**Privacy levels:**

| Level | Description |
|-------|-------------|
| `private` | Personal, never shared. Distillation runs locally. |
| `team` | Shared within a team. Distillation may use team-accessible compute. |
| `public` | Published content. No privacy restrictions on processing. |

### Layer 2: Distillation Layer — Distillation Candidate

Distillation Candidates are AI-proposed judgment elements extracted from Source Evidence. They are hypotheses, not KDNA. They require human confirmation.

```json
{
  "candidate_id": "cand_writing_style_001",
  "candidate_type": "axiom",
  "domain_cluster": "writing_style",
  "one_sentence": "User consistently rejects urgency-based framing and prefers education-led persuasion",
  "full_statement": "Across 47 analyzed articles and revisions, the user systematically replaces urgency language ('act now', 'limited time', 'don't miss out') with educational framing ('here's what you need to know', 'how to think about this', 'the research shows'). This pattern is stable across 3+ years of content.",
  "supporting_evidence": ["ev_20260531_001:articles/article_12.md", "ev_20260531_001:articles/article_28.md", "ev_20260531_001:revisions/rejected_03.md"],
  "confidence": "high",
  "candidate_status": "proposed",
  "sensitive_inference_check": "passed",
  "proposed_at": "2026-05-31T10:05:00Z",
  "proposed_by": {
    "tool": "kdna-studio-cli 0.2.0",
    "model": "claude-sonnet-4-20250514"
  }
}
```

**Candidate types:**

| Type | Maps to |
|------|---------|
| `axiom` | KDNA_Core.json axioms |
| `boundary` | KDNA_Core.json frameworks or stances |
| `standard` | KDNA_Patterns.json self_check items |
| `misunderstanding` | KDNA_Patterns.json misunderstandings |
| `preference` | KDNA_Patterns.json terminology |
| `risk` | KDNA_Core.json risk boundaries |
| `scenario` | KDNA_Scenarios.json |
| `case` | KDNA_Cases.json |

**Candidate statuses:**

| Status | Meaning |
|--------|---------|
| `proposed` | AI has extracted and presented the candidate, awaiting human review |
| `accepted` | User confirmed the candidate as accurate |
| `rejected` | User explicitly rejected the candidate |
| `modified` | User modified the candidate before accepting |
| `withdrawn` | Candidate removed (e.g., flagged by sensitive inference filter) |

**Rules:**

1. Candidates must never be written into KDNA_Core.json, KDNA_Patterns.json, or any formal domain file until confirmed
2. Each candidate must reference supporting evidence (source content items that support the pattern)
3. confidence must be declared (high/medium/low) based on pattern recurrence and consistency
4. sensitive_inference_check must pass before candidate is presented to the user
5. The proposing tool and model version must be recorded for audit

### Sensitive Inference Filter

Before presenting a candidate to the user, the system must check that the candidate does not encode sensitive personal attributes. The following domains are blocked from automatic candidate generation:

- **Identity**: gender identity, sexual orientation, ethnic/racial classification
- **Health**: medical conditions, mental health status, disability status
- **Political**: political affiliation, voting behavior, activist involvement
- **Religious**: religious beliefs, practices, affiliation
- **Financial**: income level, net worth, debt status, account balances
- **Intimate**: relationship status, family structure details, personal history

**A rejected candidate should NOT be silently discarded.** It should be flagged to the user with an explanation: "We detected a candidate that may involve [sensitive domain]. This area requires explicit and deliberate confirmation before entering KDNA. Would you like to review this candidate?"

### Layer 3: Judgment Asset Layer — Judgment Card

Judgment Cards are confirmed and Human-Locked judgment elements ready for compilation into formal KDNA domain files.

```json
{
  "card_id": "card_writing_style_001",
  "source_candidate": "cand_writing_style_001",
  "card_type": "axiom",
  "domain": "writing_style",
  "content": {
    "id": "axiom_rejects_urgency_framing",
    "one_sentence": "User consistently rejects urgency-based framing and prefers education-led persuasion",
    "full_statement": "When writing content, prioritize reader education over conversion pressure. Replace urgency language with explanatory framing. The reader's trust is more valuable than immediate action.",
    "applies_when": ["Writing marketing content", "Product announcements", "Email campaigns"],
    "does_not_apply_when": ["Time-critical safety notices", "Legal compliance deadlines"],
    "failure_risk": "In genuinely urgent situations, educational framing may reduce appropriate urgency, causing readers to miss critical deadlines",
    "confidence": "high"
  },
  "card_status": "locked",
  "locked_by": "alice@example.com",
  "locked_at": "2026-05-31T10:15:00Z",
  "lock_statement": "I confirm this accurately represents my stable judgment and authorize its entry into .kdna"
}
```

**Card statuses:**

| Status | Meaning |
|--------|---------|
| `draft` | Candidate accepted but not yet locked |
| `locked` | Human Judgment Lock applied — ready for compilation |
| `revised` | Locked card was later modified and re-locked |

**Rules:**

1. Only `locked` cards may be compiled into formal KDNA domain files
2. Human Judgment Lock requires explicit confirmation — a single "approve all" should require secondary confirmation
3. Each locked card records who locked it and when
4. Cards can be revised, but revision requires re-locking
5. Cards are the unit of compilation — KDNA_Core.json axioms come from locked axiom/boundary/risk cards

### Layer 4: Consumption Layer — KDNA Asset

The compiled .kdna asset follows the standard KDNA format defined in [SPEC.md](../SPEC.md). No modifications to the domain file structure are required for distillation-first authoring — the .kdna output is identical regardless of creation path.

### Provenance Receipt

Each distillation-produced .kdna MUST be accompanied by a provenance receipt. This receipt is separate from the .kdna — it is not embedded in domain files.

```json
{
  "receipt_id": "pr_20260531_writing_style_0.1.0",
  "kdna_asset": "@alice/writing_style 0.1.0",
  "asset_digest": "sha256:def456...",
  "authoring_path": "distillation_first",
  "source_evidence": [
    {
      "evidence_id": "ev_20260531_001",
      "source_type": "local_folder",
      "content_hash": "sha256:abc123...",
      "file_count": 47
    }
  ],
  "distillation": {
    "tool": "kdna-studio-cli",
    "tool_version": "2.0.0",
    "model": "claude-sonnet-4-20250514",
    "candidates_proposed": 34,
    "candidates_accepted": 18,
    "candidates_rejected": 12,
    "candidates_modified": 4,
    "locked_cards": 18,
    "distilled_at": "2026-05-31T10:20:00Z"
  },
  "privacy": {
    "privacy_level": "private",
    "sensitive_candidates_blocked": 2,
    "encrypted": true,
    "encryption_key_fingerprint": "age1..."
  }
}
```

**Rules:**

1. Provenance receipt is separate from .kdna — never inside domain files
2. Must record source content hashes for traceability without embedding content
3. Must record distillation tool version and AI model version
4. Must record candidate acceptance/rejection/modification counts
5. Must record sensitive inference filter activations
6. The receipt should be stored alongside the .kdna as a companion file or in local metadata

## State Machine

```
Distillation Target Declared ←── Layer 0: MUST happen first
        │
        ▼
Source Content Imported
        │
        ▼
Evidence Classified ──→ relevant / weaklyRelevant / outOfScope / splitDomain
        │
        ▼
Relevant Evidence → AI Extraction (domain-constrained prompt)
        │
        ▼
Evidence Registered ──→ privacy_level recorded, hash computed
        │
        ▼
Content Clustered ──→ domain groupings identified
        │
        ▼
Candidates Extracted ──→ candidates generated, sensitive_inference_check run
        │
        ▼
Candidates Presented ──→ user reviews each candidate
        │
        ├── rejected ──→ candidate discarded
        ├── modified ──→ edited version presented for re-review
        └── accepted ──→ candidate becomes Judgment Card (draft)
                │
                ▼
        Human Judgment Lock ──→ card status: locked
                │
                ▼
        KDNA Compilation ──→ locked cards compiled to standard domain files
                │
                ▼
        .kdna Export ──→ asset exported with provenance receipt
                │
                ▼
        Behavioral Verification ──→ loaded in a KDNA-compatible client, compared with/without
```

## Integration Points

### With kdna-studio-cli

The Studio CLI is the authoring tool. Commands for distillation-first belong in `kdna-studio`, not in the runtime `kdna` CLI:

```bash
kdna-studio target declare my_domain \              # Declare Distillation Target
  --category expression_writing \
  --scope personal \
  --granularity core_principles \
  --task "longform article review" \
  --include "argument structure,tone,revision" \
  --exclude "life habits,food preference"

kdna-studio import my_domain ./my-notes.md          # Register source evidence
kdna-studio source classify my_domain               # Classify evidence against declared target
kdna-studio distill my_domain --candidates candidates.json
                                                     # Load domain-constrained AI candidates
kdna-studio candidate list my_domain                # List candidates with scope_fit status
kdna-studio candidate accept my_domain <id>          # Accept candidate
kdna-studio candidate reject my_domain <id>          # Reject candidate
kdna-studio candidate override my_domain <id>        # Override scope_fit=false gate
kdna-studio candidate promote my_domain             # Promote accepted+scope_fit candidates
kdna-studio card approve my_domain --all --by your-id --statement "I confirm this judgment for export."
                                                     # Attach Studio release evidence
kdna-studio export my_domain --out ./my_domain.kdna
                                                     # Compile → packaged .kdna
```

### With kdna-studio-core (JS/npm)

The core library provides:
- `EvidenceRegistry`: register source files, compute hashes, manage privacy levels
- `DistillationEngine`: content clustering, pattern extraction, candidate generation
- `SensitiveInferenceFilter`: block sensitive attribute extraction
- `CardManager`: candidate → card promotion, Human Lock workflow
- `Compiler`: locked cards → standard KDNA domain files
- `ProvenanceReceipt`: generate and verify provenance receipts

### With Mac Studio App

The Mac Studio app implements the UI for:
- Drag-and-drop file import → evidence registration
- Cluster visualization → domain groupings
- Candidate review cards → accept/reject/modify UI
- Human Lock ceremony → explicit confirmation flow
- Export flow → .kdna + receipt generation
- Chat verification → load exported .kdna in a KDNA-compatible client for behavioral comparison

## Trust Boundaries

1. **AI proposes, human confirms.** This boundary is absolute. No candidate enters .kdna without human confirmation.

2. **Content stays local, judgment becomes portable.** Source evidence remains on the user's device. Only confirmed judgment structures enter .kdna.

3. **Sensitive inferences are blocked by default.** The system actively prevents sensitive personal attributes from becoming candidates.

4. **Provenance is traceable, not embedded.** Source content hashes and distillation metadata go in the receipt, not the .kdna.

5. **The .kdna format is unchanged.** Distillation-first authoring produces standard KDNA domain files. Downstream consumers (Chat, Work, CLI, MCP, Skills) see no difference between interview-first and distillation-first .kdna assets.
