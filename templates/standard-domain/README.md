> 🧬 [aikdna.com](https://aikdna.com) — Official website

# [Your domain name]

[![KDNA Spec](https://img.shields.io/badge/KDNA-open_protocol-4c1)](https://github.com/aikdna/kdna)

> This README is for an expanded authoring project view. The public runtime
> asset is the packaged `.kdna` file exported from this project, not the source
> folder itself.

**[Domain Title]** — [one-sentence description, same as kdna.json.description]

## Core Insight

[one-sentence core insight, same as kdna.json.core_insight]

## Export and load

```bash
mkdir -p dist
kdna-studio create ../your-domain-studio --from-folder . --name @yourscope/your-domain
kdna-studio export ../your-domain-studio --out ./dist/your-domain.kdna
kdna validate ./dist/your-domain.kdna
kdna plan-load ./dist/your-domain.kdna
kdna load ./dist/your-domain.kdna --profile=compact --as=prompt
```

## Optional evidence questions

These questions can document authorship, scope, evidence, and limitations.
They do not determine whether the asset may be created or loaded.

### 1. Where does it come from?

- **Authored by**: [Your name / team]
- **Evidence type**: [practice patterns / case observations / research findings — be specific]
- **Signed by**: `@yourscope` trust key (fingerprint `[your-fingerprint]`)

### 2. Where does it apply?

This KDNA helps agents [specific judgment] in:

- [situation 1]
- [situation 2]
- [situation 3]

### 3. How is it verified?

- `evals/` contains optional author-declared cases: 3 core + 3 boundary + 3 failure + 1 excluded
- [Describe any evidence or review process you actually performed]
- Format validity is checked separately with `kdna validate` after Studio export

### 4. When does it NOT apply?

Loading this domain on the wrong task is itself a risk. **Do not load** when:

- [explicit case 1 from your axioms' does_not_apply_when]
- [explicit case 2]
- [explicit case 3]

If any of the above is true, the agent should decline to load this domain.

## Known Failure Risks

| Risk | When it shows up |
|------|---|
| [risk 1 from axiom_one.failure_risk] | [trigger] |
| [risk 2 from axiom_two.failure_risk] | [trigger] |
| [risk 3 from misread_one.failure_risk] | [trigger] |

## Files

| File | Purpose |
|------|---------|
| `KDNA_Core.json` | Axioms (with optional boundaries), ontology, frameworks, causal structure, stances |
| `KDNA_Patterns.json` | Terminology, banned terms, misunderstandings (with v2.1 boundaries), self-checks |
| `evals/` | Test cases for `kdna compare` and quality scoring |
| `kdna.json` | Domain manifest (name, version, judgment_version, signature) |

## License

[Your license — CC-BY-4.0 / MIT / etc.]
