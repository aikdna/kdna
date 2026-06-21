# From KDNA to Trusted Artifact in 60 Minutes

> Historical Phase 2 walkthrough. It covers artifact/fidelity/trust ideas that
> are outside the current Core v1 public beta first-run path. Start with
> `docs/try-kdna.md` for current local `.kdna` usage.

> **Audience:** Developers who want to understand and integrate KDNA Phase 2.
> **Prerequisites:** Node.js 22+, `npm install -g @aikdna/kdna-cli`
> **Goal:** Run the full protocol chain — load, generate, validate, measure — and understand where to hook in your own code.

This walkthrough is **hands-on**. It does not explain philosophy. It shows you the chain.

---

## The Chain in One Picture

```
You write a domain  →  KDNA loads it  →  Pipeline generates  →  ArtifactEnvelope wraps it
                                                                            │
                                                            FidelityResult measures it
                                                                            │
                                                        Registry gate trusts it (or rejects)
```

Every step produces **schema-valid JSON** that you can inspect, validate, and build tooling around.

---

## Minute 0–5: Install and Verify

```bash
npm install -g @aikdna/kdna-cli
git clone https://github.com/aikdna/kdna-lab
cd kdna-lab/examples/e2e-coaching
node demo.mjs
```

You should see:

```
✓ Stage 1: KDNA domain loaded — @aikdna/writing 0.7.2
  Axioms: 3
  Misunderstandings: 1
  Self-checks: 3

✓ Stage 2: Pipeline completed — 3 stages
  Artifact: art_20260608_001 (daily_letter)
  Quality gates: 3/3 passed
  Review: approved

✓ Stage 3: Fidelity measured
  Overall score: 0.8167 (PASS)
  Blind delta (vs best prompt): 0.1967
  Verdict: strong_transfer
```

Two files were written: `outputs/artifact-envelope.json` and `outputs/fidelity-result.json`.

---

## Minute 5–10: Validate the Outputs

KDNA CLI can validate any Phase 2 artifact against its schema:

```bash
kdna protocol validate outputs/artifact-envelope.json --schema artifact-envelope
# → ✓ Valid against artifact-envelope schema

kdna protocol validate outputs/fidelity-result.json --schema fidelity-result
# → ✓ Valid against fidelity-result schema
```

You can also inspect them:

```bash
kdna protocol inspect outputs/artifact-envelope.json --schema artifact-envelope
# → artifact_id, artifact_type, generator, source_kdna count, quality gates...

kdna protocol inspect outputs/fidelity-result.json --schema fidelity-result
# → overall_score, dimensions, blind_delta, calibration status...
```

---

## Minute 10–20: Understand the ArtifactEnvelope

Open `outputs/artifact-envelope.json`. It is the **universal wrapper** for any KDNA-governed output. Every field has a specific purpose:

| Field | Why it exists |
|-------|---------------|
| `artifact_id` | Stable identity — same logical artifact keeps the same ID across reprocessing |
| `source_kdna` | Which judgment domains governed this generation (with name, version, role, digest) |
| `generator` | Which engine produced this (with run_id for pipeline traceability) |
| `stage` | Which pipeline stage and attempt produced this |
| `quality.gate_results` | Which gates passed/failed (schema, compliance, human review, fidelity) |
| `content_digest` | SHA-256 of the business content — integrity verification without reading content |
| `trace_refs` | Links back to KDNA trace records from route, generation, and post-validation |
| `review` | Human review status — pending, approved, rejected, or changes_requested |

The `content` field is **intentionally free-form**. It carries your business-specific data (daily letter, course package, assessment report) under its own schema. The envelope wraps it — the content is yours.

### The six required fields

These must always be present:

```json
{
  "artifact_id":       "string — unique, stable",
  "artifact_type":     "string — business type (daily_letter, course_package, ...)",
  "schema_version":    "string — semver of envelope schema",
  "created_at":        "string — ISO 8601 UTC",
  "generator":         "{ engine, version, run_id? }",
  "source_kdna":       "[{ name, version, role }] — min 1 item",
  "content_digest":    "string — sha256:hex"
}
```

### What happens if something is wrong?

Try validating the conformance invalid fixtures:

```bash
# Missing required fields → should FAIL
kdna protocol validate ../../kdna/conformance/artifact-envelope/invalid-missing-required.json --schema artifact-envelope
# → ✗ Invalid: must have required property 'artifact_id'

# Bad enum value in source_kdna[].role → should FAIL
kdna protocol validate ../../kdna/conformance/artifact-envelope/invalid-bad-enum.json --schema artifact-envelope
# → ✗ Invalid: must be equal to one of the allowed values
```

This is how you know your artifact is structurally correct — before you check whether the content is good.

---

## Minute 20–35: Understand the FidelityResult

Open `outputs/fidelity-result.json`. This answers a specific question:

> **Did the KDNA domain's judgment actually transfer into the generated artifact?**

Not "is the output good?" — that's evaluation. Fidelity asks: did the domain's axioms, boundaries, and self-checks survive the generation process?

### The three dimensions

Every fidelity measurement has exactly three dimensions:

| Dimension | What it measures |
|-----------|-----------------|
| `judgment_activation` | Were the domain axioms triggered? Did the generator even consult them? |
| `judgment_differentiation` | Is the KDNA output different from a best-prompt-only output? In a blind comparison, can an evaluator tell them apart? |
| `judgment_artifact_presence` | Are the domain's constraints visible in the final artifact? Are banned terms avoided? Are self-checks reflected? |

### The comparison block

The `comparison` field is the key evidence:

```json
{
  "conditions": [
    { "condition_id": "A", "condition_type": "no_kdna",       "score": 0.35 },
    { "condition_id": "B", "condition_type": "best_prompt",   "score": 0.62 },
    { "condition_id": "C", "condition_type": "kdna_loaded",   "score": 0.82 }
  ],
  "blind_delta": 0.20,
  "blind_design": "a_b_c_shuffled",
  "evaluator_model": "gpt-4o"
}
```

**Same model. Same task. Same evaluator.** The only difference is whether KDNA was loaded. Condition A has no judgment guidance (0.35). Condition B uses an optimized prompt without KDNA structure (0.62). Condition C loads KDNA (0.82).

`blind_delta = 0.20` means **KDNA provides measurable value beyond the best prompt-only approach**. A blind evaluator (different model from the generator) confirmed this.

### The calibration block

Fidelity measurement itself must be trustworthy:

```json
{
  "calibration": {
    "positive_anchor": { "expected_score_min": 0.80, "actual_score": 0.88, "passed": true },
    "negative_anchor": { "expected_score_max": 0.30, "actual_score": 0.15, "passed": true },
    "calibration_valid": true
  }
}
```

- **Positive anchor**: a known-good case. If fidelity can't score this high, the measurement is broken.
- **Negative anchor**: a known-bad case. If fidelity scores this high, the measurement is lenient.
- **calibration_valid**: both must pass. If false, **the fidelity result should not be trusted**.

### Per-axiom transfer

Each domain axiom gets its own transfer measurement:

```json
{
  "axiom_id": "diagnose_before_polish",
  "score": 0.92,
  "transfer_level": "operationalized",
  "evidence": "Artifact opens with diagnosis section before any prescriptive content"
}
```

Five transfer levels: `operationalized` → `referenced` → `mentioned` → `absent` → `contradicted`. "Operationalized" means the axiom shaped the actual decisions in the artifact. "Mentioned" means it was quoted but didn't change anything.

---

## Minute 35–45: Understand the Registry Trust Gate

The registry is KDNA's trust hub. Getting a `validated+` quality badge requires fidelity evidence. The gate enforces:

| Requirement | Threshold |
|-------------|-----------|
| `fidelity_score` | >= 0.70 |
| `fidelity_report_url` | Must be present and reachable |
| `fidelity_calibration_valid` | Must be true |
| `fidelity_blind_delta` | Must be > 0 (KDNA beats best prompt) |
| `fidelity_protocol_version` | Must be present |

This means a domain can't get a high quality badge just by looking good on paper. It needs measured, calibrated, blind evidence that its judgment actually transfers.

The trust gate script is at `kdna-registry/scripts/check-domain-trust-gate.js`. It runs in CI and blocks any domain from being promoted to `validated` that doesn't meet all five requirements.

---

## Minute 45–55: Understand the Product Runtime

The Product Runtime (RFC-0011) defines the pattern for long-running KDNA-governed products. It has a six-phase cycle:

```
Schedule → Select → Generate → Deliver → Observe → Adapt
    ↑                                                   │
    └───────────────────────────────────────────────────┘
```

A product-runtime manifest declares:

- **Schedule**: cron, interval, event_driven, or manual
- **Selection**: fixed, rotating, context_aware, or user_choice — which KDNA domain governs this cycle
- **Generation**: which engine, which quality gates, which KDNA load profile
- **Delivery**: push, email, in-app, SMS, or webhook
- **Observation**: what signals to extract from user interaction
- **Adaptation**: how to adjust the next cycle based on observations (with Human Lock boundary)

The key constraint: **adaptation changes operational parameters** (tone, detail level, domain selection), **never judgment** (axioms, boundaries, failure criteria). That's the Human Judgment Lock boundary preserved across product cycles.

Example manifest: `conformance/product-runtime/valid-full.json` — a wellness tracker that adapts tone based on mood signals while keeping the domain's axioms intact.

---

## Minute 55–60: Where to Plug In

Now you understand the chain. Here are the integration points:

### If you want to generate KDNA-governed artifacts

Wrap your generator output in an `ArtifactEnvelope`:

```javascript
import { ArtifactEnvelopeSchema } from '@aikdna/kdna-artifact-engine';

const envelope = {
  artifact_id: generateStableId(),
  artifact_type: "my_artifact_type",
  schema_version: "1.0.0",
  created_at: new Date().toISOString(),
  generator: { engine: "my-engine", version: "1.0.0", run_id: runId },
  source_kdna: [{ name: "@mydomain/my-judgment", version: "0.1.0", role: "primary" }],
  content: myBusinessContent,
  content_digest: sha256(canonicalJson(myBusinessContent)),
  quality: { gate_results: [...myGates], overall_result: "pass" },
  trace_refs: [...myTraces],
  review: { status: "pending" }
};

// Validate before storing
ArtifactEnvelopeSchema.parse(envelope);
```

### If you want to measure fidelity

Use `@aikdna/kdna-fidelity-core` pure functions:

```javascript
import { classifyVerdict, computeStats, normalizeGap } from '@aikdna/kdna-fidelity-core';

const stats = computeStats(taskResults);
const verdict = classifyVerdict({ transfer_gap: stats.mean, naive_drift: 0.1, gap_width: stats.mean * 1.5 });
const normalized = normalizeGap(stats.mean, calibrationBaseline);
```

### If you want to build a product runtime

Implement the six-phase cycle. Start with the conformance fixture as a template:

```bash
cp conformance/product-runtime/valid-minimal.json my-product/product-runtime.json
# Edit: name, schedule, domain_pool, artifact_type, delivery
```

### If you want to run the registry trust gate

```bash
git clone https://github.com/aikdna/kdna-registry
cd kdna-registry
node scripts/check-domain-trust-gate.js --domain @aikdna/writing
```

---

## Next Steps

| You want to | Go here |
|-------------|---------|
| Create your first KDNA domain | [First Domain Walkthrough](./first-domain-walkthrough.md) |
| Integrate KDNA into an agent | [kdna-skills](https://github.com/aikdna/kdna-skills) |
| Understand the full spec | [SPEC.md](../SPEC.md) |
| See all Phase 2 architecture | [Phase 2 Architecture](./phase2-architecture.md) |
| Run the conformance suite | [Conformance README](../conformance/README.md) |
| Check release readiness | [RELEASE_CHECKLIST_0.9.0.md](../RELEASE_CHECKLIST_0.9.0.md) |
| Explore available domains | [kdna-registry](https://github.com/aikdna/kdna-registry) |

---

## The Key Insight

**KDNA Phase 2 is not a new protocol. It is the measurement and delivery layer on top of the existing judgment protocol.**

Every component in Phase 2 is **schema-valid JSON**. You can read it, validate it, generate it, and build tooling around it. The protocol defines the shape. Your code fills it in.

The entire chain — from a `.kdna` file to a trusted, measured artifact — is:

1. **Load** a KDNA domain (axioms, boundaries, self-checks)
2. **Generate** an artifact governed by that domain
3. **Wrap** it in an ArtifactEnvelope (identity, provenance, quality, trace, review)
4. **Measure** whether judgment transferred (FidelityResult)
5. **Gate** it through the registry (trust requirements)
6. **Deliver** it through a product runtime (if long-running)

Each step is independently verifiable. Each step has a schema. Each step has conformance fixtures.

That's the chain. Now go build something with it.
