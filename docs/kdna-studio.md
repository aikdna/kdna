# KDNA Studio — Design Specification

> **Status:** Design specification. Implementation pending in KDNAChat / VS Code.

## Overview

KDNA Studio is the guided authoring experience for creating high-quality KDNA domains. It replaces the current "write JSON by hand" approach with a structured, interview-first workflow.

## Three Creation Paths

| Path | User | Tool | Output |
|------|------|------|--------|
| **Developer** | CLI-savvy users | `kdna init` + VS Code extension | Domain directory |
| **Guided** | Domain experts | KDNAChat / Mac App Studio | `.kdna` container |
| **Expert Team** | Professional teams | KDNA Studio + Human Lock + CI | Signed, validated `.kdna` |

## The Studio Workflow (5 Stages)

```
Stage 1: Evidence Room    →  Gather raw material
Stage 2: Interview Room   →  Extract expert judgment
Stage 3: Judgment Cards   →  Structure into KDNA elements
Stage 4: Test Lab         →  Validate against real cases
Stage 5: Export           →  Package as .kdna
```

### Stage 1: Evidence Room

**Purpose:** Collect raw material about the domain.

- Upload documents, transcripts, notes, examples
- The agent reads everything and builds an internal understanding
- Output: A "domain brief" summarizing what was learned

### Stage 2: Interview Room

**Purpose:** Extract explicit judgment from implicit expertise.

The agent asks structured questions:

| Interview Question | Maps to KDNA Element |
|-------------------|---------------------|
| "What principles do you always start from?" | Axioms |
| "What concepts do you define differently from most people?" | Ontology |
| "What words or phrases mislead people in this domain?" | Banned terms |
| "What do beginners consistently get wrong?" | Misunderstandings |
| "What questions do you ask yourself before deciding?" | Self-checks |
| "How do you know when to walk away?" | Boundaries |
| "What's a decision you made that colleagues disagreed with, but you were right?" | Stances |
| "Walk me through a recent judgment call, step by step." | Frameworks |
| "What signals change your approach entirely?" | Scenarios |
| "What did you believe 5 years ago that you've changed your mind about?" | Evolution |

### Stage 3: Judgment Cards

**Purpose:** Structure interview output into KDNA elements.

Each KDNA element becomes a "card":
- **Axiom Card:** one_sentence, full_statement, why, applies_when, does_not_apply_when
- **Misunderstanding Card:** wrong, correct, key_distinction, applies_when
- **Self-Check Card:** yes/no question
- **Boundary Card:** what it covers, what it explicitly does NOT cover

Cards are:
- Draggable (reorder priority)
- Taggable (confidence level)
- Lockable (Human Judgment Lock — cannot be changed without review)
- Commentable (reviewer notes)

### Stage 4: Test Lab

**Purpose:** Validate the domain against real cases.

- Paste a real scenario (or load from evals/)
- See agent response WITHOUT KDNA
- See agent response WITH KDNA loaded
- Compare side-by-side
- Flag discrepancies
- Iterate on specific cards that underperformed

Metrics displayed:
- Self-check pass rate
- Axiom trigger rate (which axioms actually fired)
- Misunderstanding detection rate
- Boundary violation count

### Stage 5: Export

**Purpose:** Package the domain for distribution.

- Auto-generates all 2-6 KDNA JSON files
- Runs `kdna validate`
- Generates README from card metadata
- Runs evals suite
- Creates `.kdna` container
- Signs with scope key
- Options: publish to registry, export to file, share via link

## Human Judgment Lock

The Human Judgment Lock is a governance mechanism:

1. Author creates cards in Studio
2. Author "locks" cards — marking them as intentionally chosen judgment
3. Locked cards can only be changed with explicit unlock + justification
4. Lock history is recorded in `KDNA_Evolution.json`
5. Before any version release, all locked cards must pass evals

```json
{
  "judgment_locks": [
    {
      "card": "AX-001",
      "locked_by": "author_id",
      "locked_at": "2026-05-23",
      "justification": "Core axiom derived from 15 years of practice. Reviewed by 2 peers."
    }
  ]
}
```

## VS Code Integration

The VS Code extension provides:
- Card visualizer (graphical view of axioms, misunderstandings, etc.)
- Inline validation (real-time schema checking)
- Preview (webview showing the domain structure)
- Pack/Unpack (.kdna files)
- Diff view (compare domain versions)

## Future: KDNA Studio Web

Long-term vision for a web-based Studio:
- Multi-user collaboration on domain authoring
- Review workflow (propose → discuss → approve → lock)
- Eval dashboard (track quality over time)
- Registry integration (publish with one click)
- Template marketplace (start from community templates)

## Implementation Priority

| Phase | Features |
|-------|----------|
| **P0** | Stage 2 (Interview Room) in KDNAChat — agent-guided extraction |
| **P1** | Stage 3 (Judgment Cards) with locking |
| **P2** | Stage 4 (Test Lab) with A/B comparison |
| **P3** | Stage 1 (Evidence Room) and Stage 5 (Export) |
| **P4** | Web Studio with collaboration features |
