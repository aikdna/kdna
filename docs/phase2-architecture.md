# KDNA Phase 2 — Architecture Overview

**Status:** Draft  
**Date:** 2026-06-08

---

## Seven Components, Four Layers

KDNA Phase 1 established the judgment asset protocol: `.kdna` container format, validation, loading, routing, tracing, and governance.

Phase 2 extends KDNA from "how to encode judgment" to "how judgment flows into products." Seven components across four layers:

```
┌─────────────────────────────────────────────────────────┐
│                    PROTOCOL LAYER                        │
│                                                          │
│  RFC-0009 Artifact Contract    RFC-0010 Fidelity Protocol│
│  ┌──────────────────────┐    ┌───────────────────────┐  │
│  │ ArtifactEnvelope     │    │ FidelityResult         │  │
│  │ StageDefinition      │    │ Blind A/B/C comparison │  │
│  │ QualityGate          │    │ Calibration anchors    │  │
│  │ Run → Stage → Trace  │    │ Per-axiom transfer     │  │
│  └────────┬─────────────┘    └───────────┬───────────┘  │
│           │                              │               │
├───────────┼──────────────────────────────┼───────────────┤
│           │         SDK LAYER             │               │
│           │                               │               │
│  ┌────────┴──────────────────┐ ┌─────────┴───────────┐  │
│  │ @aikdna/kdna-artifact-engine │ │ @aikdna/kdna-fidelity-core │  │
│  │ • Run/Stage/Artifact types│ │ • classifyVerdict    │  │
│  │ • ArtifactEnvelope (Zod)  │ │ • computeStats (CI95)│  │
│  │ • StorageAdapter          │ │ • normalizeGap        │  │
│  │ • StageContext/Definition │ │ • classifyTransfer    │  │
│  │ • HumanReviewGate         │ │ • GAP_THRESHOLDS     │  │
│  └───────────────────────────┘ └──────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE LAYER                     │
│                                                          │
│  Evidence Trace              WorkPack Pipeline (future)   │
│  ┌──────────────────────┐   ┌────────────────────────┐  │
│  │ Unified trace chain  │   │ Pipeline manifest       │  │
│  │ artifact_refs        │   │ Staged composition      │  │
│  │ quality_report_refs  │   │ DAG dependencies        │  │
│  │ human_review_ref     │   │ Parallel execution      │  │
│  │ parent_trace_id      │   │ Artifact flow (RFC-0009)│  │
│  │ session_id           │   │ Evidence Trace linkage  │  │
│  └──────────────────────┘   └────────────────────────┘  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                   PRODUCT LAYER                           │
│                                                          │
│  RFC-0011 Product Runtime                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Schedule → Select → Generate → Deliver            │   │
│  │        ↑                          ↓               │   │
│  │      Adapt ←────────────────── Observe            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Protocol (RFCs)

Two protocol extensions that define WHAT, not HOW:

### RFC-0009: Artifact Contract

Defines the standard shape for any KDNA-governed output:
- **ArtifactEnvelope** — identity, provenance, KDNA lineage, quality, trace, review
- **StageDefinition** — pipeline stage declaration (inputs, outputs, KDNA, gates, dependencies)
- Aligned with WorkPack Session/Run/Trace/Report model
- Implements KDNA Cluster SPEC §13 staged composition

### RFC-0010: Fidelity Protocol

Defines how to measure whether judgment actually transferred:
- Three axes: Triggered? Changed? Reached artifact?
- Blind A/B/C comparison with calibration anchors
- Five per-axiom transfer levels
- Evaluator model independence requirement

---

## Layer 2: SDK (Reference Implementations)

Two TypeScript packages implementing the RFC contracts as concrete code:

### @aikdna/kdna-artifact-engine

Core abstractions for pipeline-based generation:
- `Run`, `Stage`, `Artifact`, `Review`, `EngineDefinition` — type system
- `ArtifactEnvelopeSchema` (Zod) — RFC-0009 validation
- `StorageAdapter` — swappable persistence interface
- `StageDefinition`, `StageContext` — stage contract
- `HumanReviewGate` — governance boundary
- `trace-bridge` — Evidence Trace creation utilities

### @aikdna/kdna-fidelity-core

Deterministic fidelity measurement — zero LLM dependencies:
- `classifyVerdict()` — six-level transfer classification
- `computeStats()` — mean, stdDev, CI95
- `normalizeGap()` — calibration-normalized scoring
- `classifyTransferLevel()` — per-axiom level mapping
- `GAP_THRESHOLDS` — constants

---

## Layer 3: Infrastructure (Runtime)

Two infrastructure components that connect the protocol to real systems:

### Evidence Trace

Unified trace schema linking all four App Runtime Contract objects:
```
KDNA Asset → Route Result → Judgment Trace → Artifact Refs → Quality Report → Human Review
```
Supports trace chains (`parent_trace_id`) and session grouping for pipeline runs.

### WorkPack Pipeline

Orchestrates multiple Work Packs in staged sequence:
- References Work Packs by name+version (never embeds)
- DAG dependencies + parallel execution
- Artifact flow between stages (RFC-0009)
- Per-stage KDNA overrides
- Evidence Trace integration

---

## Layer 4: Product (Delivery)

### RFC-0011: Product Runtime

Defines the pattern contract for long-running human-AI product relationships:
- Six-phase cycle: Schedule → Select → Generate → Deliver → Observe → Adapt
- Four selection strategies (fixed, rotating, context_aware, user_choice)
- Five delivery channels (push, email, in-app, SMS, webhook)
- Human Judgment Lock boundary preserved (adaptation ≠ judgment change)

---

## Data Flow: End to End

```
User task
    │
    ▼
kdna route ──→ selects KDNA domain
    │
    ▼
kdna load ──→ emits agent context
    │
    ▼
Pipeline ──→ Stage 1 → Stage 2 → ... → Stage N
    │             │          │              │
    │        ArtifactEnvelope (RFC-0009)    │
    │             │                         │
    │        Quality Gates                   │
    │             │                         │
    │        Fidelity Measure (RFC-0010)    │
    │             │                         │
    │        Human Review                    │
    │             │                         │
    ▼             ▼                         ▼
Evidence Trace ←── artifact_refs ←── quality_report_refs
    │
    ▼
Product Runtime ──→ Deliver ──→ Observe ──→ Adapt
    │                                            │
    └────────────────────────────────────────────┘
                  (next cycle)
```

---

## Integration Matrix

| Component | Consumes | Produces | Consumed By |
|-----------|----------|----------|-------------|
| Artifact Contract | KDNA SPEC | ArtifactEnvelope, StageDefinition | SDK, Pipeline, Product Runtime |
| Fidelity Protocol | Artifact Contract, KDNA Trace | FidelityResult | Registry, Product Runtime |
| artifact-engine SDK | Artifact Contract | Typed API, Zod schemas | Pipeline, downstream consumer runtimes |
| fidelity-core SDK | Fidelity Protocol | Pure functions | Pipeline, assay, CLI |
| Evidence Trace | KDNA Trace, Artifact Contract | Unified trace records | All components |
| WorkPack Pipeline | WorkPack, Artifact Contract | Staged execution | Product Runtime, downstream consumer runtimes |
| Product Runtime | Pipeline, Artifact Contract, Fidelity Protocol | Long-running delivery | Scheduled host application |

---

## Non-Goals (Repeated for Emphasis)

- KDNA Core Spec is NOT modified — all Phase 2 components are extensions
- Work Packs remain atomic — Pipeline orchestrates, never modifies
- Judgment/execution boundary (Layer 5/Layer 2) is preserved
- Product Runtime defines pattern, not engine — any product can implement
