# Studio Export Example

> Historical pre-v1 Studio export example. Current KDNA Core export uses
> `mimetype`, `kdna.json`, `payload.kdnab`, and `checksums.json`, validated by
> `kdna validate` and loaded by `kdna load`. Signature, encryption, quality
> badge, registry, and certification concepts in this example are not current
> KDNA Core launch requirements.

This directory shows a complete Studio Export output for an example domain `my_domain`, demonstrating what a Studio-compatible compiler produces.

## What You're Looking At

Studio Export is not a JSON save operation. It is an **asset build step** that turns a Human-Locked Studio project into an immutable `.kdna` asset. The compiler performs:

1. Human confirmation validation
2. Schema validation
3. Canonicalization
4. Identity generation
5. Digest computation
6. Checksum generation
7. Provenance recording where available

## Output Files

```
studio-export-example/
├── README.md                          ← You are here
├── my_domain.kdna                      ← The canonical .kdna asset (binary)
├── build-receipt.json                  ← Local receipt for this build event
├── provenance-report.json              ← Authoring provenance and identity chain
├── quality-gate-report.json            ← Quality gate checks passed
├── human-lock-report.json              ← Human Lock confirmation evidence
├── eval-report.json                    ← Evaluation results
```

## build-receipt.json

Records the build event. Contains: asset path, `asset_uid`, `project_uid`, `build_id`, `domain_id`, `registry_name`, `content_digest`, `asset_digest`, compiler metadata, signature status, encryption profile, build time.

```json
{
  "asset_uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "project_uid": "p9q8r7s6-t5u4-3210-vwxy-z0987654321",
  "build_id": "build-2026-05-27-001",
  "domain_id": "@example/my_domain",
  "registry_name": "@example/my_domain",
  "asset_path": "dist/my_domain.kdna",
  "content_digest": "sha256:a1b2c3d4e5f6...",
  "asset_digest": "sha256:f6e5d4c3b2a1...",
  "compiler": {
    "name": "@aikdna/kdna-studio-core",
    "version": "1.4.2",
    "spec_version": "1.0-rc"
  },
  "signature": {
    "signed": true,
    "algorithm": "future-gated",
    "key_fingerprint": "future-gated"
  },
  "encryption": {
    "encrypted": false,
    "profile": "open"
  },
  "build_time": "2026-05-27T14:30:00Z"
}
```

## provenance-report.json

Records the full authoring provenance chain: who authored, who reviewed, compiler identity, source evidence hash, and the complete build-to-sign chain.

```json
{
  "author": {
    "name": "Domain Expert",
    "id": "expert_001",
    "pubkey": "future-gated"
  },
  "source_evidence": {
    "materials_count": 12,
    "materials_digest": "sha256:c3d4e5f6...",
    "types": ["interview_transcript", "written_standards", "example_cases"]
  },
  "authoring_path": "distillation-first",
  "human_review": {
    "reviewer": "Reviewer Name",
    "reviewer_id": "reviewer_002",
    "review_date": "2026-05-26",
    "review_statement": "Verified all judgment cards reflect the author's intended judgment."
  },
  "compiler": {
    "name": "@aikdna/kdna-studio-core",
    "version": "1.4.2"
  },
  "signing": {
    "algorithm": "future-gated",
    "timestamp": "2026-05-27T14:30:00Z",
    "canonical_payload_digest": "sha256:b2c3d4e5..."
  }
}
```

## quality-gate-report.json

Records the quality gate checks that passed before export.

```json
{
  "project_valid": true,
  "gate_results": [
    { "gate": "human_lock", "passed": true, "locked_cards": 15, "total_cards": 15 },
    { "gate": "risk_classification", "passed": true, "risk_level": "R0" },
    { "gate": "schema_validation", "passed": true },
    { "gate": "cross_file_references", "passed": true },
    { "gate": "unique_ids", "passed": true, "total_ids": 42, "duplicates": 0 },
    { "gate": "language_consistency", "passed": true, "languages": ["en"] },
    { "gate": "version_present", "passed": true, "version": "0.1.0", "judgment_version": "2026.05" },
    { "gate": "mimetype_exact", "passed": true, "mimetype": "application/vnd.kdna.asset" },
    { "gate": "min_evals", "passed": true, "eval_count": 15, "required": 10 }
  ],
  "v1_validation_target": "overall_valid=true"
}
```

## human-lock-report.json

Records Human Lock confirmations for every judgment card. This is the evidence that a human — not an AI — confirmed the judgment.

```json
{
  "project": "@example/my_domain",
  "locked_cards": 15,
  "unlocked_cards": 0,
  "confirmations": [
    {
      "card_id": "axiom_structural_first",
      "card_type": "axiom",
      "locked_by": "expert_001",
      "locked_at": "2026-05-26T10:15:00Z",
      "statement": "I confirm this reflects my domain judgment.",
      "checked": { "applies_when": true, "does_not_apply_when": true, "failure_risk": true }
    },
    {
      "card_id": "axiom_evidence_density",
      "card_type": "axiom",
      "locked_by": "expert_001",
      "locked_at": "2026-05-26T10:18:00Z",
      "statement": "This is how I distinguish strong arguments from weak ones.",
      "checked": { "applies_when": true, "does_not_apply_when": true, "failure_risk": true }
    }
  ],
  "total_confirmations": 15,
  "feynman_restatements_verified": true
}
```

## eval-report.json

Records evaluation results: what was tested, what passed, what failed.

```json
{
  "domain": "@example/my_domain",
  "eval_cases": 15,
  "passed": 15,
  "failed": 0,
  "results": [
    {
      "case_id": "eval_001",
      "input": "Help me improve this argument.",
      "without_kdna_score": 3,
      "with_kdna_score": 8,
      "judgment_improvement": "+5",
      "notes": "Agent correctly diagnosed structural problem instead of suggesting language polish."
    }
  ],
  "benchmark_summary": {
    "without_kdna_avg": 3.2,
    "with_kdna_avg": 7.8,
    "improvement": "+4.6"
  }
}
```

## Key Principle

**The `.kdna` asset is the canonical artifact.** The reports in this directory are evidence that the asset was built correctly — they are not the asset itself. A third party should be able to:

1. Verify `my_domain.kdna` independently (format, schema, payload, checksums, load contract)
2. Cross-reference the reports to confirm the build pipeline was followed
3. Decide fitness for purpose using their own review process

## Project-View Authoring

A developer may experiment by expanding a `.kdna` file into an editable
project view. This is an authoring/debugging view of the asset, not the public
runtime artifact:

```bash
kdna unpack my_domain.kdna ./my_experiment
# Inspect or edit the expanded project view in ./my_experiment/
kdna validate ./my_experiment
```

However, expanded project views are not themselves the current v1 runtime
artifact. Export a `.kdna` container through Studio and verify it with
`kdna validate` before using it as an agent/runtime input.

## See Also

- [STUDIO_EXPORT_CONTRACT.md](../STUDIO_EXPORT_CONTRACT.md) — full contract specification
- [kdna-compatible-certification.md](../archive/kdna-compatible-certification.md) — certification levels
- [kdna-v1rc-standard-kit.md](../kdna-v1rc-standard-kit.md) — v1.0-rc implementer bundle
