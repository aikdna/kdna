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
- `evals/` — Optional owner-scoped review cases

## Four Questions

### 1. What does this domain judge?

[TODO: describe the bounded choice or distinction this domain governs]

### 2. Where does it apply?

[TODO: list specific situations where this domain should be loaded]

### 3. Where does it NOT apply?

[TODO: list situations where this domain should NOT be loaded]

### 4. How do I use it?

```bash
# Copy this expanded project view and customize
cp -r templates/minimal-domain domains/my-domain
# Edit the project-view JSON files and kdna.json
# Add evaluation cases to evals/

# Import the expanded project view into Studio, then export one .kdna asset
kdna-studio create ../my-domain-studio --from-folder . --name @yourscope/my-domain
kdna-studio export ../my-domain-studio --out ./my-domain.kdna

kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

## License

CC-BY-4.0
