# KDNA Evidence Trace — Upgrade from Runtime Trace

**Status:** Draft  
**Proposed:** 2026-06-08  
**Related:** SPEC v1.0-rc, RFC-0009 (Artifact Contract), RFC-0010 (Fidelity Protocol), kdna-cli trace system

---

## 1. Problem

KDNA's trace system has a gap between specification and implementation:

| Layer | What exists | What it records |
|-------|------------|-----------------|
| **Spec** (`judgment-trace-schema.json` v0.1.0) | 331-line schema defining 20+ fields | Axioms triggered, misunderstandings, self-checks, scenarios, frameworks, confidence, agent info, conflicts |
| **Runtime** (`recordTrace()` in kdna-cli) | 7 call sites recording JSONL entries | Domain name, version, format, asset digest — essentially an **asset loading log** |
| **Examples** (`examples/app-runtime-contract/*.json`) | Hand-crafted rich traces | Complete judgment data as envisioned by the spec |

The runtime trace answers: *"Which domain was loaded, when, and did postvalidate pass?"*

It does NOT answer: *"Which axioms influenced this output? Did self-checks pass? What artifacts were produced? Was quality measured? Was this reviewed?"*

---

## 2. Design

### 2.1 Evidence Trace supersedes Judgment Trace

The Evidence Trace is a **superset** of the existing judgment trace. It adds three new link categories while preserving all existing judgment fields:

```
Evidence Trace
├── Judgment Trace (existing fields)
│   ├── loaded_kdna, triggered_axioms, triggered_frameworks
│   ├── triggered_misunderstandings, self_checks, banned_terms_avoided
│   ├── generated_judgment, violations, conflicts
│   └── agent_info, input_hash, output_hash
│
├── Artifact Links (new)
│   └── artifact_refs[] → RFC-0009 ArtifactEnvelope
│
├── Quality Links (new)
│   └── quality_report_refs[] → Quality Report / Fidelity Report
│
├── Review Links (new)
│   └── human_review_ref → Human Review Decision
│
└── Pipeline Context (new)
    ├── session_id — groups traces across a multi-stage Run
    ├── parent_trace_id — enables trace-chain traversal
    └── metadata.pipeline_run_id, metadata.stage_id
```

### 2.2 Trace Chain: Linking pipeline stages

In a multi-stage pipeline (per RFC-0009), each stage produces its own trace. Traces are linked via `parent_trace_id`:

```
Route Trace (trace_type: route)
    │ trace_id: trace_001
    │
    ▼
Stage Load Trace (trace_type: load)
    │ trace_id: trace_002, parent_trace_id: trace_001
    │
    ▼
Stage Generation Trace (trace_type: generation)
    │ trace_id: trace_003, parent_trace_id: trace_002
    │ artifact_refs: [{ artifact_id: "pilot_lesson_001" }]
    │
    ▼
Stage Postvalidate Trace (trace_type: postvalidate)
    │ trace_id: trace_004, parent_trace_id: trace_003
    │
    ▼
Fidelity Trace (trace_type: fidelity)
    │ trace_id: trace_005, parent_trace_id: trace_004
    │ quality_report_refs: [{ report_id: "fidelity_001" }]
    │
    ▼
Human Review Trace (trace_type: human_review)
      trace_id: trace_006, parent_trace_id: trace_005
      human_review_ref: { decision: "approved" }
```

### 2.3 Four Contract Objects Linked

The App Runtime Contract defines: `KDNA Asset → Route Result → Judgment Trace → Judgment Report`. The Evidence Trace makes all four linkable:

| Object | Trace field | Purpose |
|--------|------------|---------|
| KDNA Asset | `loaded_kdna[]` | Which domains governed this generation |
| Route Result | `route_result` | Why these domains were selected |
| Judgment Trace | `triggered_axioms[]`, `self_checks[]`, `generated_judgment`, etc. | What judgment occurred |
| Judgment Report | `quality_report_refs[]`, `violations[]` | What quality outcome resulted |
| Artifact | `artifact_refs[]` | What was produced |
| Human Review | `human_review_ref` | Was it approved |

---

## 3. Upgrade Path

### 3.1 Schema (this change)

- `specs/evidence-trace.schema.json` — the unified schema (superset of judgment-trace-schema.json v0.1.0)
- `specs/judgment-trace-schema.json` — preserved as-is (backward compatible)

### 3.2 Runtime enrichment (future kdna-cli change)

The existing `recordTrace()` function in `src/cmds/trace.js` records 7 call sites with limited fields. The upgrade enriches each call site:

| Call site | Current fields | Add |
|-----------|---------------|-----|
| `kdna load` | domain, version, format, asset digest | `trace_id`, `agent_info.model`, `loaded_kdna[].role`, `input_hash` |
| `kdna route` | NOT recorded | Record full `route_result` |
| `kdna postvalidate` | pass/fail, violation count | Per-check results (`self_checks[]`, `violations[]`) |
| `kdna compare` | model, input length | `triggered_axioms[]`, comparison scores |

No existing trace format is broken. The enrichment is additive — old trace entries remain readable, new entries carry more data.

### 3.3 SDK integration (future)

The `@kdna/artifact-engine` SDK's `WorkflowRunner` will emit Evidence Traces with:
- `trace_type: generation` per stage
- `artifact_refs` linked to produced artifacts
- `parent_trace_id` forming the stage chain
- `session_id` grouping all stages in a single Run

### 3.4 Fidelity Protocol integration

When a fidelity measurement runs (RFC-0010), it produces its own Evidence Trace:
- `trace_type: fidelity`
- `quality_report_refs[]` linking to the fidelity report artifact
- `parent_trace_id` linking to the generation trace of the artifact being measured

---

## 4. Backward Compatibility

The Evidence Trace extends — but does not replace — the existing judgment-trace-schema.json:

- `judgment-trace-schema.json` v0.1.0 remains the canonical domain-authoring trace schema
- `evidence-trace.schema.json` v1.0.0 is the product-grade extended schema
- Any valid v0.1.0 judgment trace can be embedded in an evidence trace by adding the missing required fields
- The runtime `recordTrace()` can continue emitting v0.1.0-shaped entries; consumers that support v1.0.0 can enrich them

---

## 5. Example: Minimal Evidence Trace

```json
{
  "trace_version": "1.0.0",
  "trace_id": "evt_20260608_001",
  "timestamp": "2026-06-08T10:30:00Z",
  "trace_type": "generation",
  "session_id": "run_20260608_001",
  "agent_info": {
    "agent_name": "course-engine",
    "agent_version": "0.3.0",
    "model": "claude-sonnet-4-5"
  },
  "loaded_kdna": [
    { "name": "@aikdna/writing", "version": "0.7.2", "role": "primary", "load_profile": "full" }
  ],
  "input_hash": "sha256:a3f5c8d9e0...",
  "output_hash": "sha256:b4e6d9f0a1...",
  "triggered_axioms": [
    {
      "id": "diagnose_before_polish",
      "domain": "@aikdna/writing",
      "statement": "Diagnose before polishing",
      "transfer_level": "operationalized",
      "evidence": "Output opens with structural diagnosis section"
    }
  ],
  "self_checks": [
    {
      "check_id": "structural_vs_cosmetic",
      "domain": "@aikdna/writing",
      "question": "Is the diagnosis structural or cosmetic?",
      "passed": true,
      "reason": "Diagnosis identifies argument gap, not language issues"
    }
  ],
  "artifact_refs": [
    {
      "artifact_id": "pilot_lesson_001",
      "artifact_type": "pilot_lesson_package",
      "content_digest": "sha256:d4e5f6...",
      "relationship": "produced"
    }
  ],
  "metadata": {
    "engine": "course-engine",
    "engine_version": "0.3.0",
    "pipeline_run_id": "run_20260608_001",
    "stage_id": "build-pilot"
  }
}
```

---

## 6. Non-Goals

- **Not a replacement for `judgment-trace-schema.json`.** The v0.1.0 schema remains valid for domain-authoring contexts.
- **Not a replacement for WorkPack's `work-pack-judgment-trace.schema.json`.** WorkPack traces serve a different purpose (auditing work pack execution).
- **Not a storage format mandate.** The Evidence Trace schema defines the shape; implementations choose their storage (JSONL, database, artifact registry).
- **Not a retroactive requirement.** Existing traces emitted by `kdna-cli` do not need to be re-emitted. The enrichment is forward-looking.
