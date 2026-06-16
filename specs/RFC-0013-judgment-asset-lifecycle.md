# RFC-0013: KDNA Judgment Asset Lifecycle

**Status:** Draft
**Proposed:** 2026-06-16
**Authors:** KDNA Maintainers
**Supersedes:** (none)
**Related:**
- KDNA SPEC v1.0-rc §1.6 (Judgment Model), §1.7 (Update Governance), §3 (Asset)
- `docs/SOURCE_DISTILLATION_CONTRACT.md` v0.2 (Five-Layer Object Model)
- `docs/KDNA_CARD_SPEC.md` (Card metadata, already shipped)
- `specs/human-lock.md` (Three Classes of Updates)
- `specs/human-lock-gate-design.md` (Lock gate)
- `specs/conflict-resolution.md` v1.0 (Cross-Domain Conflict)
- `specs/load-profiles.md` (L1–L4 Load Profiles)
- `docs/kdna-trace.md` (Runtime trace, Implemented)
- `docs/authoring-pipeline-principles.md` (Authoring principles)
- `docs/kdna-clusters.md` (Cluster composition)
- `SPEC.md` §1.5 (Boundaries and Extension)

---

## Abstract

KDNA v1.0-rc defines **what** a judgment asset is (six-file source tree, `.kdna` container, signature, registry). It does not yet define **how** a judgment asset is produced, locked, loaded, traced, evaluated, and evolved as a coherent lifecycle. The current protocol pieces — Source Distillation Contract, Human Lock, Conflict Resolution, KDNA Card, kdna trace, Load Profiles, Clusters — exist as independent documents with overlapping vocabulary and no shared object model.

This RFC proposes the **Judgment Asset Lifecycle**: a single end-to-end object model that connects authoring and runtime, and an explicit statement that the lifecycle is **narrow** (production, locking, loading, verification) and **not** the wider KDNA ecosystem (marketplace, enterprise governance, privacy modes, workpack orchestration).

It introduces three new object types — `Source Authority Graph`, `Truth Charter`, `Internal Module Manifest` — and one new top-level principle (`Anti-Monolithic Domain`). It does **not** introduce marketplace, enterprise, owner-scope, privacy-mode, or judgment-contamination schema; those remain out of scope for KDNA Core and are tracked separately as application-layer concerns.

**WorkPack is positioned as an application protocol family, not a KDNA Core concern.** This RFC deliberately does not extend WorkPack; the current `kdna-workpack` repository continues to evolve independently under its own RFC track.

---

## 1. Motivation

### 1.1 What the current protocol already covers

The following documents are already shipped or drafted and form the substrate this RFC integrates:

| Document | Status | Role |
|----------|--------|------|
| `SOURCE_DISTILLATION_CONTRACT.md` | v0.2 | Five-Layer Object Model: Distillation Target → Source → Distillation → Judgment Asset → Consumption |
| `specs/human-lock.md` | Implemented | Three classes of updates (Operational / Evidence / Judgment); Judgment updates require Human Lock |
| `specs/human-lock-gate-design.md` | Draft | Lock gate as a CI-side check |
| `docs/KDNA_CARD_SPEC.md` | Implemented | Per-domain metadata card (model-card equivalent) |
| `specs/conflict-resolution.md` v1.0 | Draft | Four conflict categories + resolution policies |
| `specs/load-profiles.md` | Implemented | L1–L4 token-budget-aware loading |
| `docs/kdna-trace.md` | Implemented | Runtime trace command; agent × domain × result logging |
| `docs/kdna-clusters.md` | Implemented | Cluster composition over multiple `.kdna` assets |
| `docs/authoring-pipeline-principles.md` | Implemented | "Studio is not a generator" — human owns judgment |
| `RFC-0010` (Fidelity Protocol) | Implemented | Three-axis judgment-transfer measurement |
| `RFC-0011` (Product Runtime) | Accepted | Six-phase long-running coaching loop |
| `RFC-0012` (Artifact Contract) | Draft | Output artifact envelope |

This is substantial infrastructure. The problem is not absence of pieces but absence of a **shared object model that names how these pieces relate**.

### 1.2 What the current protocol still exposes

Three concrete gaps, surfaced by the `atomspeak-kdna-v4.0` book-derived distillation pressure test (see `KDNA协议反审计_从极简沟通书稿到KDNA实践_v0.1.md`):

1. **No Source Authority Graph.** A book-derived domain has multiple sources (2.0 published, 3.0 draft, 4.0 truth charter, author oral confirmation, prior KDNA) with non-equal authority. The Source Distillation Contract records evidence but does not declare which source wins a conflict.

2. **No Truth Charter.** When a thought system evolves across versions, the "current highest source" must be locked before any distillation begins. Without it, AI averages all versions and produces a smoothed, semantically drifted asset.

3. **No Internal Module boundary.** A complex domain may contain internal tools (e.g., atomspeak's "core principles / state quadrant / goal model") that are not independently loadable but are not internal to a single JSON file either. The current protocol forces an unsatisfying choice: full sub-`KDNA_*` files (which inflate the six-file structure), or fold everything into `frameworks[]` (which loses navigability).

In addition, the **Anti-Monolithic Domain** principle is implied in `kdna-clusters.md` ("narrow and well-defined vs broad with interacting sub-domains") but is not promoted to a top-level SPEC principle. As a result, the first failure mode of new authors is producing a single 800-line KDNA_Core.json that tries to encode an entire professional field.

### 1.3 Why now

Two factors converge in June 2026:

- **V2 container is stable.** The June 11 registry v4.0.0 release rebuilt all domains as KDNA Container v2, and v1 compatibility was removed from kdna-cli 0.21.x. The format is no longer the bottleneck.
- **Local authoring tooling capacity.** The kdna-studio-core / kdna-studio-cli line is shipping packaging fixes (June 11) and the 60-second demo for the 30-case eval extension. The authoring surface can absorb new schema without blocking the runtime surface.

This is the correct window to consolidate the authoring side of the protocol, **before** the next container revision forces a second breaking migration.

### 1.4 What this RFC deliberately does NOT do

To prevent scope inflation, the following are explicitly **out of scope** for KDNA Core and tracked elsewhere:

- **WorkPack protocol** — Application protocol family. Lives in `kdna-workpack` repository, evolves under its own RFC track. This RFC does not extend, replace, or compete with it.
- **Marketplace / Registry commercial layer** — Tracked under `RFC-0002` (Registry Trust Model) and `specs/kdna-registry.md` extensions.
- **Enterprise judgment system** — Governance layers, organization override policies. Not KDNA Core.
- **Privacy mode** — Source evidence portability, training-use opt-in. Not KDNA Core.
- **Owner scope classification** (personal / team / organization / field) — Registry concern.
- **Judgment contamination detection** — Runtime concern dependent on trace and conflict-resolution infrastructure; should be specified only after RFC-0013 and trace v2 are implemented.
- **Domain-specific eval profiles** — Tracked under fidelity / evaluation sub-track.

This narrowness is a feature, not a limitation. KDNA Core must remain loadable in any agent runtime, including open agents and personal tooling, without dragging in commercial, enterprise, or workpack dependencies.

---

## 2. The Lifecycle: 11 Stages, 4 Layers, 1 Boundary

The Judgment Asset Lifecycle has 11 stages grouped into 4 layers. Every stage has an existing or new object. Every transition has a gate.

```
LAYER A — SOURCE              (authoring-time, external)
  S1  Source Intake             →  source_evidence_registry.json
  S2  Source Authority Graph    →  source_authority.json        [NEW]

LAYER B — JUDGMENT AUTHORING   (authoring-time, internal to domain)
  S3  Truth Charter             →  truth_charter.json           [NEW]
  S4  Candidate Generation      →  candidate_cards.jsonl
  S5  Human Judgment Lock       →  locked_cards.jsonl + lock manifest
  S6  Compile Domain KDNA       →  KDNA_Core.json + KDNA_Patterns.json + ...

LAYER C — ASSET & DISTRIBUTION (build-time, distributable)
  S7  Pack .kdna                →  kdna.json + payload.kdnab + signature.kdsig
  S8  Publish to Registry       →  registry entry + KDNA_CARD.json

LAYER D — RUNTIME & EVOLUTION  (consumer-time, per-task)
  S9  Match & Load              →  route_result + loaded profile (L1–L4)
  S10 Trace                      →  trace_event.jsonl
  S11 Eval & Evolve             →  fidelity_result + improvement_proposal
```

The **single boundary** is the LAYER B / LAYER C transition at S6 → S7. Before this transition, everything is author-readable source; after, everything is consumer-readable signed asset. This boundary is already enforced by the current `kdna build` pipeline (RFC-0007) and by the canonical authoring boundary (`docs/CANONICAL_AUTHORING_BOUNDARY.md`).

**WorkPack, marketplace, enterprise governance, and privacy mode all sit outside this lifecycle.** They consume `.kdna` assets at LAYER C; they do not extend LAYER A or B. This is a hard architectural rule.

---

## 3. New Object Types

This RFC introduces three new object types. All three live in **authoring-time source workspace**, not in the runtime `.kdna` container. They may be summarized into the provenance report of the compiled asset but are not required for runtime loading.

### 3.1 `source_authority.json` — Source Authority Graph (SAG)

**Purpose:** declare, per source, its type, authority level, scope, and conflict-resolution precedence. Resolve "when sources disagree, which one wins" **before** distillation begins.

**Required fields:**

```json
{
  "sag_id": "sag_atomspeak_2026_06_16",
  "domain_id": "@atomspeak/atomspeak",
  "version_intent": "4.0.0-draft.1",
  "sources": [
    {
      "id": "book_2_0",
      "type": "published_work",
      "authority": "historical_baseline",
      "status": "stable_but_superseded",
      "can_override": false,
      "scope": "full_book"
    },
    {
      "id": "draft_3_0",
      "type": "unpublished_draft",
      "authority": "thought_mine",
      "status": "active",
      "can_override": false,
      "scope": "full_book"
    },
    {
      "id": "charter_4_0",
      "type": "human_locked_charter",
      "authority": "current_highest",
      "status": "active",
      "can_override": true,
      "scope": "axioms_and_ontology"
    },
    {
      "id": "author_oral_2026_06_14",
      "type": "author_confirmation",
      "authority": "current_highest",
      "status": "active",
      "can_override": true,
      "scope": "open_questions"
    }
  ],
  "precedence_order": [
    "author_oral_2026_06_14",
    "charter_4_0",
    "draft_3_0",
    "book_2_0"
  ],
  "conflict_policies": [
    {
      "when": "published_work_conflicts_with_human_locked_charter",
      "resolution": "charter_overrides",
      "record_required": true,
      "record_target": "candidate_cards.jsonl.conflict_resolution"
    },
    {
      "when": "draft_3_0_term_diverges_from_charter_4_0",
      "resolution": "charter_overrides_and_record_rename",
      "record_target": "evolution.term_renames"
    }
  ],
  "sensitivity": {
    "sources_contain_pii": false,
    "author_consent_on_file": true
  }
}
```

**Authority levels (fixed enum):**
- `historical_baseline` — past versioned artifact, not to be overridden
- `thought_mine` — earlier draft with valuable discarded material
- `current_highest` — author-locked, override-capable
- `exemplar_case` — single case study, not a judgment source
- `deprecated` — explicitly retired, must not be used as positive evidence

**Storage location:** source workspace only. May be summarized into `KDNA_ProvenanceReport.json` at S7.

**New SAG in source authority → MUST be a breaking change for the domain.** This is a deliberate strong gate: changing which source is "highest" is a Judgment Update under `specs/human-lock.md` and must trigger Human Lock + version bump.

### 3.2 `truth_charter.json` — Truth Charter (TC)

**Purpose:** lock, in authoring-time, **what this judgment system is and is not** before any candidate judgment is generated. Acts as a drift-prevention floor.

**Required fields:**

```json
{
  "tc_id": "tc_atomspeak_4_0_2026_06_14",
  "domain_id": "@atomspeak/atomspeak",
  "tc_status": "locked",
  "locked_at": "2026-06-14T00:00:00Z",
  "locked_by": "atomspeak_author",
  "highest_question": "在关键沟通中,如何判断人是否被旧反应接管,并如何帮助其从自动反应回到主动选择?",
  "core_insight": "沟通失败时,真正缺失的不是表达技巧,而是主动选择。",
  "in_scope": [
    "识别自动反应接管的信号",
    "区分事实 / 解释 / 需求",
    "在高压场景中保护关系承载力"
  ],
  "out_of_scope": [
    "提供话术模板",
    "替代专业心理咨询",
    "对个人性格做长期评价"
  ],
  "highest_axiom_protected": "从自动反应回到主动选择,保护生命里真正重要的东西。",
  "forbidden_simplifications": [
    "把判断问题改写为话术问题",
    "用术语清单代替判断动作",
    "把'主动选择'解释为'技巧选择'"
  ],
  "renamed_terms": [
    { "old": "沟通高手", "new": "主动选择者", "effective_from": "4.0.0" },
    { "old": "工具系统", "new": "恢复主动选择的工具", "effective_from": "4.0.0" }
  ],
  "anti_drift_rules": [
    "禁止把核心判断改写为成功学表达",
    "禁止把'主动选择'等同于'技巧选择'",
    "禁止为追求简洁而删除风险边界"
  ],
  "judgment_authority_holder": "atomspeak_author"
}
```

**Why this is a JSON and not a free-form `Truth_Charter.md`:** the locked JSON form lets the Human Lock gate (S5) verify that the TC is current and matches the SAG's `current_highest` source. A free-form markdown is acceptable as author-readable working draft, but a `truth_charter.json` with `tc_status: "locked"` is required for S6 to compile.

**Compiling into `.kdna`:** the TC's `highest_question`, `core_insight`, `in_scope`, `out_of_scope`, and `renamed_terms` are summarized into the domain's `KDNA_Core.json` `frameworks[*]` / `ontology[*]` and into `KDNA_Patterns.json` `misunderstandings[*]`. The full TC is not required at runtime; runtime agents see the compiled judgment, not the charter.

### 3.3 `module_manifest.json` — Internal Module Manifest (IMM)

**Purpose:** declare, within a single domain package, which parts are independently loadable (`sub-domain`), which are internal tools (`internal_module`), and which are pure data (`reference`). This is the missing fourth layer between "domain file" and "cluster".

**Required fields:**

```json
{
  "domain_id": "@atomspeak/atomspeak",
  "modules": [
    {
      "module_id": "core_principles",
      "module_type": "internal_module",
      "independent_asset": false,
      "maps_to": "KDNA_Core.json.frameworks[core_principles]",
      "loadable_via": "full_profile_only"
    },
    {
      "module_id": "state_quadrant",
      "module_type": "internal_module",
      "independent_asset": false,
      "maps_to": "KDNA_Core.json.frameworks[state_quadrant]",
      "loadable_via": "scenario_profile"
    },
    {
      "module_id": "goal_model",
      "module_type": "internal_module",
      "independent_asset": false,
      "maps_to": "KDNA_Core.json.frameworks[goal_model]",
      "loadable_via": "scenario_profile"
    }
  ]
}
```

**Three module types (fixed enum):**
- `internal_module` — lives in the parent domain's files, not independently publishable, not independently loadable, must not appear in registry
- `sub_domain` — independently publishable as its own `.kdna`, independently loadable, gets its own registry entry; the parent domain references it as a cluster dependency
- `reference` — pure data (term dictionary, case index), not judgment, never loaded into agent context as judgment

**Boundary rule:**
- if a part cannot work without the parent domain → `internal_module`
- if a part can be loaded, evaluated, and evolved on its own → `sub_domain` (and the parent domain may reference it via cluster)
- if a part is non-judgmental data (e.g., a term dictionary) → `reference` and SHOULD NOT carry axioms

This rule is the answer to the反审计 file's 缺口三 ("Internal Module / Sub-domain / Cluster boundary"). It makes the four-layer model explicit:

```
internal_module  <  sub_domain  <  cluster  <  workpack
   (in-domain)     (own .kdna)   (multi .kdna)   (multi .kdna + skills + gates)
```

WorkPack is a strict superset that adds skills, templates, gates, and risk policies. It is **not** a fourth type in this schema; it lives in a different protocol family.

---

## 4. New Top-Level Principle: Anti-Monolithic Domain

Promote the implied rule in `kdna-clusters.md` to a top-level SPEC principle, codified in `SPEC.md` §1.6 (Judgment Model):

> **Anti-Monolithic Domain Principle.** A single KDNA domain SHOULD encode one bounded, testable, comparable judgment question. If a domain requires multiple unrelated judgment questions, the author MUST split it into multiple domains and compose them via cluster. A KDNA is not a knowledge base, encyclopedia, or comprehensive reference for a professional field. It is a judgment asset.

**Companion rule (Authoring-time gate, enforced by `kdna dev validate`):**

> If a domain's `KDNA_Core.json` exceeds 6 primary axioms **and** contains 3+ `frameworks` **and** spans >2 distinct user-facing judgment questions, the author MUST either (a) split into sub-domains and reference via cluster, or (b) justify monolithic structure in a `module_manifest.json` and obtain a maintainer sign-off recorded in the TC.

**Example (good vs bad):**

| Bad | Good |
|-----|------|
| `@aikdna/business` (covers strategy, ops, finance, sales, HR, legal) | `@aikdna/price_objection_diagnosis` + `@aikdna/landing_page_trust` + `@aikdna/meeting_decision_quality` |
| `@aikdna/writing` (covers blog, academic, marketing, technical, fiction) | `@aikdna/blog_intro_hook` + `@aikdna/academic_methodology_passive_voice` + `@aikdna/landing_copy_above_fold` |
| `atomspeak` as a single 800-line `KDNA_Core.json` | `atomspeak` (single question) + sub-domain `state_quadrant` only if independently loadable; otherwise internal_module |

**The principle is enforced by lint, not by prose.** A new `kdna dev validate --anti-monolithic` check is added (see §8.3).

---

## 5. Updated Object Model: How Existing Pieces Relate

This RFC does not introduce new runtime objects. It clarifies which authoring-time object feeds which runtime-time object.

```
                S1 Source Intake
                    │
                    ▼
   source_evidence_registry.json  (existing — KDNA_Domain_Source_Evidence)
                    │
                    ▼
                S2 SAG  ◄────  source_authority.json          [NEW]
                    │
                    ▼
                S3 TC   ◄────  truth_charter.json             [NEW]
                    │
                    ▼
                S4 Candidate Generation
                    │
              candidate_cards.jsonl
                    │
                    ▼
                S5 Human Lock  ◄────  human-lock-gate-design.md
                    │                human-lock.md (3 classes)
                    ▼
              locked_cards.jsonl + lock_manifest
                    │
                    ▼
                S6 Compile   ◄────  KDNA_Core.json
                    │                KDNA_Patterns.json
                    │                KDNA_Scenarios.json (opt)
                    │                KDNA_Cases.json (opt)
                    │                KDNA_Reasoning.json (opt)
                    │                KDNA_Evolution.json (opt)
                    │                module_manifest.json          [NEW]
                    ▼
                S7 Pack      ◄────  kdna.json
                    │                payload.kdnab (CBOR v2)
                    │                signature.kdsig
                    │                KDNA_CARD.json (KDNA_CARD_SPEC)
                    │                KDNA_ProvenanceReport.json (sag + tc summary)
                    ▼
                S8 Publish   ─►  registry (RFC-0002)
                    │
                    ▼
                S9 Match     ◄────  route_result.schema.json
                    │                load-profiles.md (L1–L4)
                    ▼
                S10 Load + Trace
                    │                kdna-trace.md (Implemented)
                    │                judgment-trace-schema.json
                    │                evidence-trace.schema.json
                    ▼
                S11 Eval + Evolve
                                 fidelity-result.schema.json (RFC-0010)
                                 improvement-proposal-schema.json
```

**Observations:**

1. **`source_authority.json` and `truth_charter.json` are authoring-time only.** They never enter the runtime `.kdna` container. They appear only in the provenance report (S7).
2. **`module_manifest.json` is also authoring-time only**, except that its **declarations** (e.g., `sub_domain: true` for a particular module) drive the **package layout** in S7 — sub-domains become independent `.kdna` files in a cluster folder, internal_modules stay inside the parent domain's source files.
3. **Existing pieces are not modified** by this RFC. The new objects are additive at the authoring surface and summarized into the provenance report at packaging time.
4. **The lock gate (S5) does not change.** Human Lock, three classes of updates, and the lock gate all keep their current definitions. The new SAG and TC must be locked before S5 can verify a candidate; the lock gate verifies that an `authoritative_source` is `current_highest` before accepting a judgment update.

---

## 6. Migration Path: Existing Domains

Existing domains do not break. They simply do not benefit from SAG/TC/IMM until updated.

**For all 12 existing `@aikdna/*` domains in registry v4.0.0:**

| Stage | Migration |
|-------|-----------|
| No `source_authority.json` | Default SAG generated at S7 with one source: `kdna-core@<version>`, `authority: derived`, `precedence: [kdna-core@<version>]`. This is the floor and is **non-breaking**. |
| No `truth_charter.json` | TC is generated at S7 by extracting `highest_question` from `KDNA_Core.json` and synthesizing `in_scope` / `out_of_scope` from `KDNA_Patterns.json.misunderstandings[].key_distinction` and `boundaries[].rule`. TC's `renamed_terms` are mirrored into `KDNA_Patterns.json.terminology.banned_terms` and `terminology.standard_terms`. Marked `tc_status: "synthesized"`, not `"locked"`. |
| No `module_manifest.json` | Default IMM: all content mapped to `internal_module`, `loadable_via: "full_profile_only"`. |

**For the atomspeak-kdna-v4.0 book-derived distillation (the test case):**

- Author writes `source_authority.json` and `truth_charter.json` explicitly.
- SAG declares `book_2_0` (historical baseline), `draft_3_0` (thought mine), `charter_4_0` (current highest), `author_oral_*` (current highest for open questions).
- TC locks `highest_question`, `core_insight`, `renamed_terms`, `anti_drift_rules`.
- Existing v4 source tree is re-compiled against SAG and TC. Renamed terms propagate from TC into `KDNA_Patterns.json.misunderstandings[*]` and `KDNA_Evolution.json.term_renames`.
- The compiled `.kdna` is identical in shape to any other domain; the difference is that the provenance report is rich and the lock gate can verify authority.

**Backwards compatibility:**

- Old `.kdna` files compiled before this RFC remain valid.
- `kdna load` does not need to know about SAG/TC. They are authoring-time only.
- `kdna inspect` and `kdna verify` MAY surface SAG/TC summaries from the provenance report but do not require them.

---

## 7. Sub-RFCs Detail Specs (companions, not part of this RFC)

This RFC is the **总纲**. Two companion detail specs are required for implementation. They are NOT this RFC and will be filed separately:

- **RFC-0014 — KDNA Card Spec v2.0.** Extends `docs/KDNA_CARD_SPEC.md` (already shipped) to include SAG and TC summaries, plus the new `axiom_tier` field (primary / supporting / boundary / training / ethical) per the反审计 file's 缺口四.
- **RFC-0015 — Runtime Trace Spec v2.** Extends `docs/kdna-trace.md` (Implemented) to record SAG/TC/IMM version of the loaded asset and the lock status of any judgment that triggered a boundary or self-check. Adds `apply` event separate from `load` (F17 from 升级建议, but scoped narrowly to trace schema, not a separate concept).

These companion RFCs are scoped to **detail schema only**. They do not re-litigate the lifecycle architecture, the WorkPack boundary, or the anti-monolithic principle.

---

## 8. Implementation Plan

### 8.1 Layer / Repository Assignment

| Concern | Repository | Existing Path | This RFC Adds |
|---------|-----------|---------------|---------------|
| SAG schema & gate | `aikdna/kdna` (meta) | `specs/conflict-resolution.md` | `specs/source-authority-graph.md` (doc) + `schema/source_authority.schema.json` |
| TC schema & gate | `aikdna/kdna` (meta) | — | `specs/truth-charter.md` (doc) + `schema/truth_charter.schema.json` |
| IMM schema | `aikdna/kdna` (meta) | — | `specs/internal-module-manifest.md` (doc) + `schema/module_manifest.schema.json` |
| Anti-Monolithic lint | `aikdna/kdna-cli` | `kdna dev validate` | `kdna dev validate --anti-monolithic` (new flag, no breaking change) |
| SAG/TC gate at lock | `aikdna/kdna-studio-core` | compile() | Verify TC locked + SAG has `current_highest` source before accepting judgment update |
| SAG/TC migration | `aikdna/kdna-cli` | `kdna build` | Auto-synthesize default SAG/TC for legacy domains at build time |
| Provenance report | `aikdna/kdna` (meta) | `specs/evidence-trace.schema.json` | Extend with optional `sag_summary` and `tc_summary` blocks |
| Registry | `aikdna/kdna-registry` | RFC-0002 / `specs/kdna-registry.md` | **No change.** Registry continues to accept `.kdna` files; provenance summaries are advisory |
| Trace v2 | `aikdna/kdna-cli` | `docs/kdna-trace.md` | `kdna trace` v2 emits `sag_version` and `tc_status` per loaded asset (companion RFC-0015) |
| Lab | `aikdna/kdna-lab` | E2E demo, benchmark runner | Add `kdna-lab` smoke test: "compile a domain with explicit SAG/TC; verify lint passes; load and trace records TC version" |
| WorkPack | `aikdna/kdna-workpack` | (separate) | **No change.** Application protocol family. |

**The boundary at LAYER C is enforceable in CI.** A new `kdna ci` check (in kdna-cli) verifies, for any `.kdna` produced by `kdna build`:
- A provenance report exists
- For domains with a TC explicitly authored: `tc_status: locked` and SAG has a `current_highest` source matching TC's `judgment_authority_holder`
- The domain does not trigger the anti-monolithic lint

### 8.2 Schema Files to Add (in `aikdna/kdna`)

```
specs/source-authority-graph.md        # ~150 lines
specs/truth-charter.md                # ~150 lines
specs/internal-module-manifest.md     # ~100 lines
schema/source_authority.schema.json
schema/truth_charter.schema.json
schema/module_manifest.schema.json
```

### 8.3 CLI / Studio / Lab Changes

| Change | Repository | Breaking? | Effort |
|--------|-----------|-----------|--------|
| `kdna dev validate --anti-monolithic` | kdna-cli | No (new flag) | M |
| `kdna build --strict-authority` (refuse to build domain whose SAG is empty) | kdna-cli | No (default off) | S |
| `kdna build --auto-migrate` (synthesize SAG/TC for legacy domains) | kdna-cli | No (default off) | S |
| `kdna inspect <file>` surfaces SAG/TC summary from provenance | kdna-cli | No | S |
| `kdna-studio-core` compile() verifies TC locked + SAG `current_highest` | kdna-studio-core | No (gates existing compile) | M |
| `kdna-lab` smoke test for SAG/TC round-trip | kdna-lab | No | S |
| `kdna-trace` v2 records `sag_version` + `tc_status` (companion RFC-0015) | kdna-cli | No (additive) | M |

**S = 1 day, M = 1 week.** Total estimated effort for this RFC and its companions: 1 maintainer-week of focused work, distributed over kdna-cli, kdna-studio-core, kdna-lab, and the meta repo. Schema and docs are the bulk.

### 8.4 Spec Updates to Existing Documents

| Document | Change |
|----------|--------|
| `SPEC.md` §1.6 | Add Anti-Monolithic Domain Principle (text from §4 of this RFC) |
| `SPEC.md` §1.7 | Add: "Judgment updates that change SAG's `current_highest` source or TC's `highest_question` are MAJOR version bumps." |
| `docs/authoring-pipeline-principles.md` | Add: "Authoring begins with SAG and TC. Distillation without a SAG and a locked TC produces drifted judgment assets." |
| `docs/SOURCE_DISTILLATION_CONTRACT.md` v0.2 | Bump to v0.3: insert SAG between Layer 0 (Distillation Target) and Layer 1 (Source); insert TC between Layer 1 and Layer 2 (Distillation) |
| `docs/kdna-clusters.md` | Reference `module_manifest.json` as the boundary between internal_module / sub_domain / cluster / workpack |
| `docs/authoring-guide.md` | New "SAG and TC authoring walkthrough" section |
| `docs/kdna-trace.md` | Reference companion RFC-0015 for v2 trace schema |

### 8.5 Repository File Manifest

**`aikdna/kdna` (meta repository):**

```
NEW FILES
  specs/source-authority-graph.md
  specs/truth-charter.md
  specs/internal-module-manifest.md
  schema/source_authority.schema.json
  schema/truth_charter.schema.json
  schema/module_manifest.schema.json
  schemas/provenance-report-v2.schema.json     (extends existing evidence-trace)

MODIFIED FILES
  SPEC.md                                       §1.6 + §1.7
  docs/SOURCE_DISTILLATION_CONTRACT.md          v0.2 → v0.3
  docs/authoring-pipeline-principles.md         add SAG/TC prerequisite
  docs/kdna-clusters.md                         reference module_manifest
  docs/authoring-guide.md                       add SAG/TC walkthrough
  docs/kdna-trace.md                            link to RFC-0015
  CHANGELOG.md                                  RFC-0013 entry
  docs/rfc-status.md                            add RFC-0013/0014/0015 rows
```

**`aikdna/kdna-cli`:**

```
NEW FILES
  src/commands/dev/validate-anti-monolithic.ts
  src/commands/build/strict-authority.ts
  src/commands/build/auto-migrate.ts
  src/commands/inspect/source-authority.ts
  tests/source-authority.test.ts
  tests/truth-charter.test.ts
  tests/anti-monolithic.test.ts
  tests/auto-migrate.test.ts

MODIFIED FILES
  src/commands/build/index.ts                   wire new flags
  src/commands/dev/validate.ts                  add --anti-monolithic
  src/commands/inspect/index.ts                 surface SAG/TC summary
  CHANGELOG.md
```

**`aikdna/kdna-studio-core`:**

```
NEW FILES
  src/compile/source-authority-gate.ts
  src/compile/truth-charter-gate.ts
  tests/source-authority-gate.test.ts
  tests/truth-charter-gate.test.ts

MODIFIED FILES
  src/compile/index.ts                          wire gates before compile
  CHANGELOG.md
```

**`aikdna/kdna-lab`:**

```
NEW FILES
  examples/sag-tc-roundtrip/atomspeak/
    source_authority.json
    truth_charter.json
    KDNA_Core.json
    KDNA_Patterns.json
  tests/sag-tc-roundtrip.test.ts
```

**`aikdna/kdna-registry`:**

```
NO CHANGES (registry continues to accept .kdna; SAG/TC summaries are provenance-side)
```

**`aikdna/kdna-workpack`:**

```
NO CHANGES (application protocol family, out of scope for this RFC)
```

---

## 9. Acceptance Criteria

This RFC is considered **Accepted → Implemented** when all of the following are true:

1. All three new schema files (`source_authority`, `truth_charter`, `module_manifest`) are merged in `aikdna/kdna/schema/`.
2. `kdna dev validate --anti-monolithic` exists and passes CI on the meta repo's own example domains.
3. `kdna-studio-core` rejects (with a clear error) any `compile()` call where the source workspace has a TC with `tc_status: "synthesized"` and a SAG with no `current_highest` source **and** the caller passes `--strict-authority`.
4. `kdna-lab` smoke test compiles the atomspeak example with explicit SAG/TC, runs 5 trace events, and verifies `sag_version` and `tc_status` appear in the trace output.
5. `SPEC.md` §1.6 contains the Anti-Monolithic Domain Principle verbatim.
6. RFC-0014 and RFC-0015 are filed as separate Draft RFCs.
7. A migration run on a real legacy domain (e.g., `@aikdna/code_review`) successfully synthesizes default SAG/TC and produces a valid `.kdna` identical in shape to the pre-RFC build.

---

## 10. Non-Goals (Restated for Clarity)

The following are explicitly **not** introduced by this RFC and remain tracked outside KDNA Core:

| Out of scope | Where it lives |
|--------------|----------------|
| WorkPack protocol extensions | `kdna-workpack` repository, separate RFC track |
| Marketplace / commercial licensing | RFC-0002 (Registry Trust Model), `specs/kdna-registry.md` |
| Enterprise judgment system (governance layers, org override) | Future RFC, separate from KDNA Core |
| Privacy mode (source portability, training opt-in) | Future RFC, separate from KDNA Core |
| Owner scope (personal / team / organization / field) | Registry-level concern, not Core |
| Judgment contamination detection | Runtime concern; requires RFC-0013 + RFC-0015 first |
| Domain-specific eval profiles | Fidelity / evaluation sub-track |
| Cluster Runtime Contract extensions (routing, merge policy) | Future RFC after RFC-0013 / RFC-0014 / RFC-0015 |
| Cross-domain conflict resolution schema | Already exists in `specs/conflict-resolution.md` v1.0; this RFC references it, does not modify it |

If any of these are later required, they will be filed as **separate RFCs** with their own scope statements, and they will **not modify** the lifecycle defined here.

---

## 11. Why This Is The Correct Next Step

The June 11 registry v4.0.0 release proved the V2 container is stable. The June 12 meta-repo docs upgrade proved the public expression of v2 is converged. The authoring side is now the open gap.

The反审计 file (500 lines, 2026-06-14) demonstrates that the *current* protocol can compile a complex book-derived domain, but only with manual workarounds for SAG, TC, and the internal-module boundary. The 18-finding 升级建议 (1778 lines, 2026-06-14) lists 18 possible next steps but does not prioritize them against existing infrastructure.

This RFC is the **最小可实施 subset** of those 18 findings: the 5 that have no working alternative in the current protocol (SAG, TC, IMM, Anti-Monolithic, integration into existing trace/lock/conflict) and the 1 boundary statement (WorkPack is application, not Core) that prevents scope inflation.

It does not attempt marketplace, enterprise, privacy, owner-scope, or contamination-detection. It does not re-spec trace, card, lock, conflict, or load profiles — it builds on them. It does not modify the runtime container shape.

If this RFC is accepted and implemented, the next 30 days produce:
- A book-derived KDNA can declare its sources' authority explicitly and have a CI gate verify it.
- A new author cannot accidentally produce a 12-file monolithic "communication KDNA" that tries to cover everything.
- A complex thought system has a `truth_charter.json` that an agent can read at authoring time to prevent drift.
- The WorkPack team has a clean architectural rule (Core vs Application) and can keep moving without re-architecting.

If the next 30 days do not include this RFC, the same gaps remain, and the 614 升级建议 keeps growing.
