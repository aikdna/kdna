# Minimal Domain Template

> **Legacy pre-`0.6.0` template (archived fixture only).** This `KDNA_Core.json` / `KDNA_Patterns.json` project-view layout belongs to the retired `0.1.0` line and is retained only for historical validator tests. For new Container `0.6.0` `.kdna` works, run `npx -y @aikdna/kdna-cli@0.46.0 init --example --output draft.json` (see [`docs/authoring-guide.md`](../../docs/authoring-guide.md)).

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
