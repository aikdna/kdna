# KDNA Domain Quality Baseline

> ⚠️ **Historical document. Not active guidance.** For current KDNA Core positioning, see README, SPEC.md, docs/KDNA_CONFORMANCE_LEVELS.md, and docs/KDNA_X_PROPAGATION_SET.md. The "official domain" concept referenced below has been replaced by KDNA-X public entries and legacy proof assets — all `.kdna` assets that pass `kdna validate` are equal peers.

Every KDNA domain published as a public KDNA-X entry should meet a minimum quality standard. This historical document explains how earlier work used `kdna-writing` as a proof example.

## The Four Questions

Every domain README must answer these four questions:

1. **Where does it come from?** — What expertise, experience, or research produced this domain's judgment?
2. **Where does it apply?** — What tasks, contexts, and inputs does this domain handle?
3. **How is it verified?** — What tests, evals, or evidence supports the domain's quality claims?
4. **When does it NOT apply?** — What are the clear boundaries beyond which this domain should not be used?

## Minimum Requirements for Official Domains

| Requirement | Minimum | Reference (kdna-writing) |
|-------------|---------|---------------------------|
| **README** | Answers four questions | [kdna-writing README](https://github.com/aikdna/kdna-writing) |
| **Evals** | At least 10 test cases | `kdna-writing/evals/` — 10 cases |
| **Demo** | Before/after comparison | `kdna-writing/demo/` |
| **kdna.json** | Complete manifest with all metadata | `kdna-writing/kdna.json` |
| **Boundary declaration** | Explicit "does NOT apply" section | Readme: "Not copy editing. Not grammar checking." |
| **Verify pass** | `kdna verify --judgment` returns clean | `kdna verify @aikdna/writing --judgment` passes |
| **Structural validation** | `kdna-validate` 0 errors | Passes lint + validate |

## Quality Badge Progression

KDNA domains advance through quality levels based on evidence:

| Level | Badge | Evals Required | Additional |
|-------|-------|:-------------:|------------|
| 1 | `untested` | 0 | Structural validation only |
| 2 | `tested` | ≥ 10 | Evals directory with manually verified cases |
| 3 | `validated` | ≥ 30 | Public benchmark report, rubric, raw outputs |
| 4 | `expert_reviewed` | ≥ 30 | Validated evidence plus external domain expert review |
| 5 | `production_ready` | ≥ 30 | Expert-reviewed evidence plus 30+ days real-world usage |

## Domain Checklist

When publishing a new public KDNA entry, verify:

### Content Quality

- [ ] Axioms are specific and testable (not vague advice)
- [ ] Ontology concepts have clear boundaries
- [ ] Banned terms include `why` and `replace_with`
- [ ] Misunderstandings describe real, common errors
- [ ] Self-checks are yes/no answerable
- [ ] Stances declare default postures
- [ ] Reasoning chains have `so_what` conclusions

### Structural Quality

- [ ] KDNA_Core.json + KDNA_Patterns.json present (minimum)
- [ ] All JSON validates against schema
- [ ] File count ≤ 6
- [ ] kdna.json manifest complete
- [ ] `kdna dev validate` passes with 0 errors

### Trust & Governance

- [ ] License declared (recommended: CC-BY-4.0 for content)
- [ ] Author identified
- [ ] Signed with scope key
- [ ] Asset digest published in registry as `asset_digest`
- [ ] `status` and `quality_badge` match evidence level

### Distribution

- [ ] `.kdna` container published as GitHub Release
- [ ] Registry entry complete with `asset_url`, `asset_digest`, `signature`
- [ ] Version follows SemVer
- [ ] `judgment_version` declared

## kdna-writing as a Historical Proof Example

[kdna-writing](https://github.com/aikdna/kdna-writing) was the original proof example. New public KDNA-X entries should use its evidence expectations where useful, without treating it as a ranked standard:

| Aspect | kdna-writing |
|--------|-------------|
| Axioms | 4 (each with applies_when, does_not_apply_when, failure_risk, confidence, evidence_type) |
| Ontology | 3 concepts with boundaries |
| Frameworks | 1 with 4 clear steps |
| Stances | 3 (each with applies_when / does_not_apply_when) |
| Standard terms | 4 with definitions |
| Banned terms | 3 (each with why + replace_with) |
| Misunderstandings | 3 with full v2.1 governance fields |
| Self-checks | 5 yes/no questions |
| Scenes | 2 with sub-scenarios |
| Cases | Documented |
| Reasoning chains | 2 with so_what conclusions |
| Evals | 10 test cases |
| Demo | Before/after comparison available |

## Anti-Patterns to Avoid

- [ ] "Trust is important" — too vague, not testable
- [ ] Dictionary definitions in ontology — must be operational
- [ ] "Be helpful" as a stance — too generic, no bias
- [ ] Straw man misunderstandings no one believes
- [ ] Self-checks that can't be answered yes/no
- [ ] More than 6 KDNA JSON files
- [ ] Missing `does_not_apply_when` on axioms
- [ ] `status: stable` without external validation
- [ ] `quality_badge: tested` without eval files
