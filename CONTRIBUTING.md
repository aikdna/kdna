# Contributing to KDNA

This repository is the KDNA protocol specification. You can contribute at multiple levels.

## Contribution Types

### 1. Protocol Contribution
Improve the KDNA specification, schema, validators, CLI, loader, skills, or documentation.

**Scope:** SPEC.md, schema/*, validators/*, src/*, docs/*, tests/*

### 2. Judgment Pattern Contribution
Submit a reusable judgment pattern — the smallest unit of KDNA.

**Template:**
```
Pattern ID: (e.g., discussion-vs-decision)
Surface Signal: (what the user says or what data shows)
Common Misread: (how ordinary AI gets this wrong)
Expert Frame: (how an expert re-interprets the signal)
Diagnostic Questions: (what to ask before acting)
Decision Boundary: (when to classify as unresolved)
Action Implication: (what follows from the judgment)
Positive Cases: (at least 2 examples where the pattern works)
Negative Cases: (at least 1 example where the pattern should NOT trigger)
```

**Submit to:** `benchmarks/judgment-benchmark.json` via PR

### 3. Domain Package Contribution
Submit a complete KDNA domain package.

1. Create a repository under `kdna-<domain>` naming convention
2. Include at least `KDNA_Core.json` and `KDNA_Patterns.json`
3. Ensure the domain passes `kdna validate`
4. Include `kdna.json` manifest and `README.md`
5. Add tests in `tests/before-after.json` (minimum 3 cases)
6. Open a PR adding an entry to `registry/domains.json`

### 4. Case Contribution
Submit test cases that prove KDNA changes judgment.

Add entries to existing domain `tests/before-after.json` or submit new test files following the format:
```json
{
  "input": "...",
  "without_kdna": { "expected_approach": "...", "common_mistake": "..." },
  "with_kdna": { "expected_approach": "...", "signal_reading": "...", "diagnosis_path": "..." },
  "domain": "...",
  "trigger": "..."
}
```

### 5. Cluster Contribution
Submit a KDNA Cluster — a composable group of packages.

1. Create `KDNA_Cluster.json` following the schema
2. Ensure all referenced packages exist in the registry
3. Include composition rules and routing questions
4. Submit to `examples/clusters/`

### 6. Evaluation Report Contribution
Submit a report comparing agent judgment with and without KDNA.

Include: domain name, model used, test cases, baseline scores, KDNA-loaded scores, specific improvements observed.

## Quality Requirements

All contributions must:
- Pass `kdna validate` (for packages) or JSON schema validation (for clusters)
- Have unique IDs across the submission
- Include reasons for every banned term and key distinctions for every misunderstanding
- Not contain proprietary or private data
- Use clear domain boundaries

## License

- Code contributions: Apache 2.0
- Documentation and examples: CC BY 4.0
- Domain packages: Contributor's choice (CC BY 4.0 recommended for open domains)
