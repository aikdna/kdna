# KDNA Source Distillation Contract

> Version: 0.1  
> Status: Draft  
> Audience: KDNA Studio, kdna-studio-cli, kdna-studio-core, Mac Apps, agent adapters  
> Relationship: Companion to [`app-runtime-contract.md`](./app-runtime-contract.md)

## Purpose

This contract defines the four-layer object model for distillation-first KDNA authoring: turning a user's existing content (notes, documents, works, feedback, recordings) into loadable .kdna judgment assets through AI-assisted pattern extraction and mandatory human confirmation.

It establishes the minimum data structures, state transitions, and trust boundaries that all KDNA authoring tools must respect.

## Non-goals

This contract does not define:

- UI layout or product flows for KDNA Studio Mac App
- File import format support list (which formats to support is a product decision)
- Pricing, licensing, or marketplace behavior
- Interview-first authoring (covered by the existing Studio Export Contract)

## Four-Layer Model

```
Source Layer       →  Distillation Layer  →  Judgment Asset Layer  →  Consumption Layer
(Evidence)            (Candidates)           (Locked Cards)           (.kdna loading)
```

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
  "registered_by": "kdna-studio-cli v2.0.0"
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
    "tool": "kdna-studio-cli v2.0.0",
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
  "receipt_id": "pr_20260531_writing_style_v0.1.0",
  "kdna_asset": "@alice/writing_style v0.1.0",
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
Source Content Imported
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
        Behavioral Verification ──→ loaded in KDNAChat, compared with/without
```

## Integration Points

### With kdna-studio-cli

The Studio CLI is the authoring tool. Commands for distillation-first belong in `kdna-studio`, not in the runtime `kdna` CLI:

```bash
kdna-studio source import ./my-notes          # Register source evidence
kdna-studio source classify                   # Cluster content into domain categories
kdna-studio distill candidates                # Extract judgment candidates
kdna-studio card promote <candidate_id>       # Accept candidate → Judgment Card
kdna-studio card reject <candidate_id>        # Reject candidate
kdna-studio card modify <candidate_id>        # Edit and re-present candidate
kdna-studio lock                              # Apply Human Judgment Lock to all draft cards
kdna-studio export --sign                     # Compile locked cards → .kdna + provenance receipt
kdna-studio verify --load-in-chat            # Export and test-load in KDNAChat
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
- Chat verification → load exported .kdna in KDNAChat for behavioral comparison

## Trust Boundaries

1. **AI proposes, human confirms.** This boundary is absolute. No candidate enters .kdna without human confirmation.

2. **Content stays local, judgment becomes portable.** Source evidence remains on the user's device. Only confirmed judgment structures enter .kdna.

3. **Sensitive inferences are blocked by default.** The system actively prevents sensitive personal attributes from becoming candidates.

4. **Provenance is traceable, not embedded.** Source content hashes and distillation metadata go in the receipt, not the .kdna.

5. **The .kdna format is unchanged.** Distillation-first authoring produces standard KDNA domain files. Downstream consumers (Chat, Work, CLI, MCP, Skills) see no difference between interview-first and distillation-first .kdna assets.
