# Minimal Domain Template

This is an expanded authoring project-view template. It is useful for learning,
experimentation, and tooling tests. The public runtime asset is the packaged
`.kdna` file exported from a compatible toolchain, not this folder.

The smallest authoring project view contains `KDNA_Core.json`,
`KDNA_Patterns.json`, and `kdna.json`.

## Purpose

This template demonstrates the minimum viable KDNA domain structure. Use it as a starting point for new domains.

## Files

- `KDNA_Core.json` — Axioms and ontology
- `KDNA_Patterns.json` — Misunderstandings and self-checks
- `kdna.json` — Domain manifest
- `evals/` — Evaluation cases

## Four Questions

### 1. What does this domain judge?

[TODO: describe the core judgment this domain improves]

### 2. Where does it apply?

[TODO: list specific situations where this domain should be loaded]

### 3. Where does it NOT apply?

[TODO: list situations where this domain should NOT be loaded]

### 4. How do I use it?

```bash
# Copy this template and customize
cp -r templates/minimal-domain domains/my-domain
# Edit the project-view JSON files and kdna.json
# Add evaluation cases to evals/
kdna validate .
kdna pack . ./my-domain.kdna
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

## License

CC-BY-4.0
