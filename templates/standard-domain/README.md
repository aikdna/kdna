> 🧬 [aikdna.com](https://aikdna.com) — Official website

# [Your domain name]

[![KDNA Spec](https://img.shields.io/badge/KDNA-v1.0-4c1)](https://github.com/aikdna/KDNA)

**[Domain Title]** — [one-sentence description, same as kdna.json.description]

## Core Insight

[one-sentence core insight, same as kdna.json.core_insight]

## Install

```bash
kdna install @yourscope/your_domain_id
kdna verify @yourscope/your_domain_id      # structure + trust + judgment
```

## The Four Questions (v2.1 governance)

Every KDNA must answer four questions. Here are this domain's answers.

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

- `kdna verify @yourscope/your_domain_id --judgment` — checks v2.1 governance fields
- `kdna compare @yourscope/your_domain_id --input "<task>"` — runs with/without KDNA on a real LLM and shows the reasoning-trajectory diff
- `evals/` directory contains 10 cases: 3 core + 3 boundary + 3 failure + 1 excluded
- `demo/` directory holds rendered before/after comparisons. Regenerate with `ANTHROPIC_API_KEY=... node scripts/build-demo.js`

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
| `KDNA_Core.json` | Axioms (with v2.1 boundaries), ontology, frameworks, causal structure, stances |
| `KDNA_Patterns.json` | Terminology, banned terms, misunderstandings (with v2.1 boundaries), self-checks |
| `evals/` | Test cases for `kdna compare` and quality scoring |
| `kdna.json` | Domain manifest (name, version, judgment_version, signature) |

## License

[Your license — CC-BY-4.0 / MIT / etc.]
