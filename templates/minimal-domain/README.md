# Minimal Domain Template

The smallest valid KDNA domain: `KDNA_Core.json` + `KDNA_Patterns.json` + `kdna.json`.

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
# Edit KDNA_Core.json, KDNA_Patterns.json, and kdna.json
# Add evaluation cases to evals/
kdna dev validate .
```

## License

CC-BY-4.0
