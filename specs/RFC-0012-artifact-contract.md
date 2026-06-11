# RFC-0012: KDNA Artifact Contract

**Status:** Draft  
**Proposed:** 2026-06-08  
**Authors:** KDNA Maintainers  
**Related:** KDNA SPEC v1.0-rc, kdna-workpack v0.1.0, KDNA Cluster SPEC §13

---

## Abstract

KDNA v1.0-rc defines how domain judgment is encoded as loadable, verifiable assets. The WorkPack standard defines how KDNA, skills, gates, and risk policies are bundled into reusable atomic work capabilities. However, neither defines what comes out: the artifacts produced by KDNA-governed generation lack a standard envelope, identity, quality summary, trace linkage, and review lifecycle.

This RFC proposes an **Artifact Contract** — a minimal standard envelope for any output produced through KDNA-governed generation. It also defines a **Stage Definition** contract for declaring multi-stage pipelines that compose sequential, parallel, and conditional artifact generation steps.

The Artifact Contract is an **extension layer**, not a modification to KDNA Core. It builds on existing infrastructure: WorkPack's Session/Run/Trace/Report object model, Cluster's staged composition strategy, and the KDNA trace system.

---

## 1. Motivation

### 1.1 What exists today

KDNA's current output surface is unstructured:

- `kdna load` emits formatted text/JSON for agent injection — no structured output
- `kdna compare` emits a diff report — not a versioned artifact
- WorkPack's `run_workpack_dry` emits `output` as a raw string and `output_path` as a file path — no artifact identity or integrity
- The Judgment Trace records *what was loaded* but not *what was produced*

When an agent or engine generates a course, a daily letter, or an assessment report, the output is a blob with no standard wrapper. Downstream consumers — fidelity measurement, human review, artifact storage, registry indexing, product delivery — cannot reliably identify, validate, or trace these outputs.

### 1.2 What happens in practice

In the xplan course-engine pipeline (13 stages, 12 artifact types), every stage produces structured outputs. But without a standard envelope:

- Each artifact type invents its own identity and metadata format
- Quality results are stored inconsistently
- Upstream artifact lineage is implicit (encoded in file names or directory structure)
- Human review status is ad-hoc
- Fidelity measurement cannot link its report back to the artifact it measured

### 1.3 What should exist

A minimal, universal envelope that wraps any KDNA-governed artifact, carrying:

| Concern | Field |
|---------|-------|
| Identity | `artifact_id`, `artifact_type`, `schema_version` |
| Provenance | `created_at`, `generator` (engine + version + run_id) |
| KDNA lineage | `source_kdna` (which judgment assets governed generation) |
| Artifact lineage | `source_artifacts` (which upstream artifacts fed this one) |
| Pipeline position | `stage` (optional, for multi-stage pipelines) |
| Content integrity | `content` + `content_digest` |
| Quality summary | `quality` (gate results + fidelity score) |
| Trace linkage | `trace_refs` |
| Review lifecycle | `review` (human review status) |

---

## 2. Design Principles

### 2.1 Extension, not modification

This RFC does not modify KDNA Core Spec, kdna-cli, kdna-core, or the .kdna container format. It defines a new layer that sits between KDNA loading and artifact consumption. Tools may adopt it incrementally.

### 2.2 Envelope, not content

The Artifact Contract standardizes the wrapper, not the payload. `artifact_type` and `content` are business-specific. The envelope ensures every business artifact carries the same identity, provenance, quality, trace, and review metadata — regardless of what the artifact *is*.

### 2.3 Compatible with WorkPack

The envelope's `quality`, `trace_refs`, and `stage` fields align with WorkPack's existing `review_gate_results`, `judgment_trace`, and `session` concepts. An Artifact can be the output of a WorkPack run or the output of a stage in a pipeline that orchestrates multiple WorkPacks.

### 2.4 Traceable to KDNA judgment

Every artifact declares exactly which KDNA domains governed its generation (`source_kdna`) and which trace records document the judgment process (`trace_refs`). This enables fidelity measurement: "did judgment X actually reach artifact Y?"

### 2.5 Review-ready

Human review is first-class: `review.status` tracks pending → approved → rejected → changes_requested. Combined with KDNA's Human Judgment Lock, this creates a complete governance chain: KDNA locked by human → artifact reviewed by human → fidelity verified by protocol.

---

## 3. Artifact Envelope

### 3.1 Schema

See `specs/artifact-envelope.schema.json`.

**Required fields:** `artifact_id`, `artifact_type`, `schema_version`, `created_at`, `generator`, `source_kdna`, `content_digest`

### 3.2 Minimal valid artifact

```json
{
  "artifact_id": "d4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f7a",
  "artifact_type": "pilot_lesson_package",
  "schema_version": "1.0.0",
  "created_at": "2026-06-08T10:30:00Z",
  "generator": {
    "engine": "course-engine",
    "version": "0.3.0",
    "run_id": "run_20260608_001"
  },
  "source_kdna": [
    {
      "name": "@aikdna/writing",
      "version": "0.7.2",
      "judgment_version": "2026.05",
      "digest": "sha256:a1b2c3...",
      "role": "primary"
    }
  ],
  "content": {
    "title": "Pilot Lesson: Introduction to Editorial Judgment",
    "sections": ["..."]
  },
  "content_digest": "sha256:d4e5f6...",
  "trace_refs": [
    { "trace_id": "trace_abc123", "trace_type": "route" },
    { "trace_id": "trace_def456", "trace_type": "generation" }
  ]
}
```

### 3.3 Full artifact with quality and review

```json
{
  "artifact_id": "d4e5f6a7-b8c9-4d0e-8f1a-2b3c4d5e6f7a",
  "artifact_type": "pilot_lesson_package",
  "schema_version": "1.0.0",
  "content_schema_version": "0.3.0",
  "created_at": "2026-06-08T10:30:00Z",
  "generator": {
    "engine": "course-engine",
    "version": "0.3.0",
    "run_id": "run_20260608_001"
  },
  "source_kdna": [
    {
      "name": "@aikdna/writing",
      "version": "0.7.2",
      "judgment_version": "2026.05",
      "digest": "sha256:a1b2c3...",
      "role": "primary"
    },
    {
      "name": "@aikdna/content_strategy",
      "version": "0.5.0",
      "judgment_version": "2026.04",
      "digest": "sha256:d4e5f6...",
      "role": "advisor"
    }
  ],
  "source_artifacts": [
    {
      "artifact_id": "abc123-def456",
      "artifact_type": "course_outline",
      "content_digest": "sha256:789abc...",
      "relationship": "input"
    },
    {
      "artifact_id": "ghi789-jkl012",
      "artifact_type": "course_experience_plan",
      "content_digest": "sha256:def012...",
      "relationship": "input"
    }
  ],
  "stage": {
    "stage_id": "build-pilot",
    "stage_name": "Build Pilot Lesson Package",
    "stage_order": 7,
    "stage_attempt": 1,
    "stage_status": "completed"
  },
  "content": { "title": "...", "sections": ["..."] },
  "content_digest": "sha256:d4e5f6...",
  "quality": {
    "gate_results": [
      { "gate_id": "schema_valid", "gate_type": "schema_validation", "result": "pass" },
      { "gate_id": "axioms_applied", "gate_type": "kdna_compliance", "result": "pass", "score": 0.9 },
      { "gate_id": "fidelity_check", "gate_type": "fidelity_check", "result": "pass", "score": 0.85 }
    ],
    "overall_result": "pass",
    "fidelity": {
      "score": 0.85,
      "protocol_version": "1.0.0",
      "report_artifact_id": "fidelity_report_001"
    }
  },
  "trace_refs": [
    { "trace_id": "trace_route_001", "trace_type": "route" },
    { "trace_id": "trace_gen_001", "trace_type": "generation" },
    { "trace_id": "trace_post_001", "trace_type": "postvalidate" },
    { "trace_id": "trace_fidelity_001", "trace_type": "fidelity" }
  ],
  "review": {
    "status": "pending"
  },
  "metadata": {
    "tags": ["pilot", "writing-v0.7"],
    "environment": "dev"
  }
}
```

---

## 4. Stage Definition

### 4.1 Schema

See `specs/stage-definition.schema.json`.

### 4.2 Example: Course Engine Pipeline

A 13-stage course generation pipeline defined using Stage Definitions:

```json
[
  {
    "stage_id": "load-domain",
    "stage_name": "Load KDNA Domain",
    "stage_order": 1,
    "produces_artifacts": [{ "artifact_type": "judgment_assets" }],
    "loaded_kdna": [
      { "name": "@aikdna/writing", "version": "^0.7.0", "role": "primary", "load_profile": "full" }
    ]
  },
  {
    "stage_id": "extract-judgments",
    "stage_name": "Extract Judgment Assets",
    "stage_order": 2,
    "requires_inputs": [{ "ref_type": "artifact_type", "artifact_type": "judgment_assets" }],
    "produces_artifacts": [{ "artifact_type": "extracted_judgments" }],
    "depends_on": ["load-domain"]
  },
  {
    "stage_id": "model-audience",
    "stage_name": "Model Target Audience",
    "stage_order": 3,
    "requires_inputs": [
      { "ref_type": "artifact_type", "artifact_type": "extracted_judgments" },
      { "ref_type": "run_input" }
    ],
    "produces_artifacts": [{ "artifact_type": "audience_model" }],
    "depends_on": ["extract-judgments"]
  },
  {
    "stage_id": "model-product",
    "stage_name": "Model Product Specification",
    "stage_order": 4,
    "requires_inputs": [
      { "ref_type": "artifact_type", "artifact_type": "audience_model" }
    ],
    "produces_artifacts": [{ "artifact_type": "product_spec" }],
    "depends_on": ["model-audience"]
  },
  {
    "stage_id": "build-outline",
    "stage_name": "Build Course Outline",
    "stage_order": 5,
    "produces_artifacts": [{ "artifact_type": "course_outline" }],
    "quality_gates": [
      { "gate_id": "outline_structure", "gate_type": "schema_validation", "blocking": true }
    ],
    "depends_on": ["model-product"]
  },
  {
    "stage_id": "build-experience-plan",
    "stage_name": "Build Course Experience Plan",
    "stage_order": 6,
    "produces_artifacts": [{ "artifact_type": "course_experience_plan" }],
    "depends_on": ["model-product"]
  },
  {
    "stage_id": "build-pilot",
    "stage_name": "Build Pilot Lesson Package",
    "stage_order": 7,
    "produces_artifacts": [{ "artifact_type": "pilot_lesson_package", "is_final": true }],
    "quality_gates": [
      { "gate_id": "pilot_schema", "gate_type": "schema_validation", "blocking": true },
      {
        "gate_id": "pilot_fidelity",
        "gate_type": "fidelity_check",
        "blocking": false,
        "config": { "protocol_version": "1.0.0", "min_score": 0.7 }
      }
    ],
    "depends_on": ["build-outline", "build-experience-plan"]
  },
  {
    "stage_id": "build-sales",
    "stage_name": "Build Sales Page Brief",
    "stage_order": 7,
    "produces_artifacts": [{ "artifact_type": "sales_page_brief", "is_final": true }],
    "depends_on": ["build-outline"],
    "parallel_with": ["build-pilot"]
  },
  {
    "stage_id": "assemble",
    "stage_name": "Assemble Course Package",
    "stage_order": 8,
    "requires_inputs": [
      { "ref_type": "artifact_type", "artifact_type": "pilot_lesson_package" },
      { "ref_type": "artifact_type", "artifact_type": "sales_page_brief", "required": false }
    ],
    "produces_artifacts": [{ "artifact_type": "course_package", "is_final": true }],
    "depends_on": ["build-pilot", "build-sales"],
    "human_review_required": true
  },
  {
    "stage_id": "evaluate-quality",
    "stage_name": "Evaluate Quality (LLM Critique)",
    "stage_order": 9,
    "produces_artifacts": [{ "artifact_type": "quality_report" }],
    "depends_on": ["assemble"]
  },
  {
    "stage_id": "evaluate-fidelity",
    "stage_name": "Evaluate Fidelity (Assay Audit)",
    "stage_order": 10,
    "produces_artifacts": [{ "artifact_type": "fidelity_report" }],
    "depends_on": ["assemble"],
    "parallel_with": ["evaluate-quality"]
  },
  {
    "stage_id": "finalize",
    "stage_name": "Finalize Course Package",
    "stage_order": 11,
    "produces_artifacts": [{ "artifact_type": "course_package_final", "is_final": true }],
    "quality_gates": [
      { "gate_id": "human_approved", "gate_type": "human_review", "blocking": true }
    ],
    "depends_on": ["evaluate-quality", "evaluate-fidelity"]
  },
  {
    "stage_id": "generate-report",
    "stage_name": "Generate Run Report",
    "stage_order": 12,
    "produces_artifacts": [{ "artifact_type": "run_report" }],
    "depends_on": ["finalize"]
  }
]
```

### 4.3 Key concepts

**Stage dependencies** (`depends_on`, `parallel_with`): Explicit stage ordering. `parallel_with` declares stages that can run concurrently. The pipeline runner computes the execution DAG from these declarations.

**Artifact lineage** (`requires_inputs`, `produces_artifacts`): Each stage declares what artifact types it consumes and produces. The runner passes artifacts between stages automatically — a stage that requires `artifact_type: course_outline` receives the latest artifact of that type from any upstream stage.

**Quality gates per stage** (`quality_gates`): Each stage declares its own quality requirements. Gates can be `blocking` (fail blocks the pipeline) or advisory. Gate types include `schema_validation`, `kdna_compliance`, `fidelity_check`, `human_review`, `llm_critique`, and `eval_benchmark`.

**KDNA per stage** (`loaded_kdna`): Each stage can load specific KDNA domains with specific roles and load profiles. A stage that doesn't declare KDNA inherits from the pipeline-level configuration.

**Retry policy** (`retry_policy`): Configurable retry behavior per stage: max attempts, backoff strategy, and what happens on final failure.

**Human review gates** (`human_review_required`): A stage can require human approval before its output flows to downstream stages.

---

## 5. Relationship to Existing KDNA Infrastructure

### 5.1 WorkPack (kdna-workpack)

WorkPack defines atomic work capabilities: `KDNA + Skills + Gates + Risk + Trace → Output`. A single WorkPack invocation produces a WorkPackSession, RunResult, WorkPackTrace, and WorkPackReport.

The Artifact Contract extends this model:

| WorkPack Concept | Artifact Contract Equivalent |
|-----------------|------------------------------|
| `workpack.json` manifest | Pipeline manifest (stage definitions + KDNA config) |
| `WorkPackSession` | Pipeline Run (a sequence of stages) |
| `WorkPackRun.review_gate_results` | `artifact.quality.gate_results` |
| `WorkPackRun.output` (string) | `artifact.content` (typed, schema-validated) |
| `WorkPackRun.output_path` (string) | `artifact.content_digest` (content-addressed) |
| WorkPackTrace | `artifact.trace_refs` |
| WorkPackReport | Run Report (aggregates all stage artifacts + quality summaries) |

The Artifact Contract does not replace WorkPack. It wraps WorkPack outputs (and any other KDNA-governed output) in a standard envelope.

### 5.2 KDNA Cluster — Staged Composition

KDNA Cluster SPEC §13.2 defines `staged` composition: "Domains load in ordered phases (e.g., analysis → risk review → expression)." The Stage Definition makes this concrete: each stage in a pipeline declares which KDNA domains it loads, with what roles, and what artifacts it produces.

The existing `classifySignalsAcrossDomains` (signal-based, the only implemented strategy) handles per-stage domain selection. The Stage Definition adds ordering, dependency, quality gate, and artifact flow semantics on top.

### 5.3 KDNA Trace System

The KDNA trace system records route decisions, loaded domains, triggered axioms, and self-check results. The Artifact Contract links artifacts back to their traces via `trace_refs`. This enables:

- "Show me all traces that led to this artifact"
- "Show me all artifacts produced under this KDNA domain"
- "Did the fidelity report reference the correct generation trace?"

### 5.4 App Runtime Contract

The App Runtime Contract defines: `KDNA Asset → Route Result → Judgment Trace → Judgment Report`. The Artifact Contract adds: `Stage Definition → Artifact Envelope → Quality Summary → Fidelity Report → Human Review`.

---

## 6. Non-Goals

- **Not a workflow engine.** This RFC defines the contract (data shapes and semantics), not the runner. Implementations are free to build their own pipeline executors.
- **Not a KDNA Core modification.** No changes to SPEC.md, kdna.json manifest, or .kdna container format.
- **Not a WorkPack replacement.** WorkPack remains the atomic work capability standard. The Artifact Contract wraps its outputs.
- **Not a product-specific schema registry.** Business artifact schemas (course_package, daily_letter, etc.) are defined by their respective engines. Only the envelope is standardized here.

---

## 7. Implementation Path

### Phase 2a: Schema publication
- Merge `artifact-envelope.schema.json` and `stage-definition.schema.json` into kdna spec
- Add reference from kdna-workpack docs

### Phase 2b: xplan adoption
- Wrap all 12 course-engine artifact types in ArtifactEnvelope
- Convert course-engine 13-stage config to StageDefinition array
- Run a full pipeline with envelope-wrapped artifacts and verify trace linkage

### Phase 2c: WorkPack integration
- Extend `WorkPackRun` to optionally wrap output as ArtifactEnvelope
- Add `--wrap-artifact` flag to `kdna workpack run`

### Phase 2d: Fidelity Protocol integration (RFC-0010)
- Fidelity Report becomes an Artifact itself (`artifact_type: fidelity_report`)
- Links to measured artifact via `source_artifacts[].relationship: evaluation_target`

---

## 8. Questions for Review

1. Should `artifact_id` be a content-hash URN (deterministic from content) or a random UUID (stable across reprocessing)? Content-hash enables deduplication; UUID enables stable references across revisions. Recommendation: UUID with `content_digest` as the dedup key.

2. Should the Stage Definition include a `timeout` field? Currently only retry policy is defined. Timeout could be added as a stage-level constraint.

3. Should `source_kdna[].role` use the same 5-role enum as Cluster SPEC §13.3 (`primary`, `advisor`, `risk_guard`, `style_and_trust`, `evaluator`) or the simpler 3-role enum from WorkPack (`primary`, `constraint`, `fallback`)? Recommendation: use the 6-role Cluster enum for richer semantics.

4. Where should business-specific artifact schemas live? In their engine repositories (xplan, daily-letter-engine), in a shared artifact-schema registry, or linked from the Artifact Contract spec? Recommendation: engine repositories first, aggregated registry later.

---

## Appendix A: Artifact Types (Reference, Non-Normative)

These are examples of artifact types that engines may produce. The list is not exhaustive and not part of the standard.

| Artifact Type | Engine | Is Final |
|---------------|--------|----------|
| `judgment_assets` | course-engine | No |
| `audience_model` | course-engine | No |
| `product_spec` | course-engine | No |
| `course_outline` | course-engine | No |
| `course_experience_plan` | course-engine | No |
| `pilot_lesson_package` | course-engine | Yes |
| `sales_page_brief` | course-engine | Yes |
| `course_package` | course-engine | Yes |
| `quality_report` | course-engine | No |
| `fidelity_report` | fidelity-engine | Yes |
| `run_report` | any engine | Yes |
| `daily_letter` | daily-letter-engine | Yes |
| `micro_practice` | daily-letter-engine | Yes |
| `coaching_observation` | coaching-runtime | No |

---

## Appendix B: Schema Files

- `specs/artifact-envelope.schema.json` — Artifact Envelope schema
- `specs/stage-definition.schema.json` — Stage Definition schema
