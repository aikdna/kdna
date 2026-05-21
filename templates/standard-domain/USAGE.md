# standard-domain template

This is the v2.1 reference template for a new KDNA domain. Copy this folder, fill in the bracketed placeholders, and publish.

## What this template includes

```
standard-domain/
├── README.md                   # Four Questions + Failure Risks + Files
├── kdna.json                   # Manifest with judgment_version (v2.1)
├── KDNA_Core.json              # Axioms with applies_when / does_not_apply_when / failure_risk
├── KDNA_Patterns.json          # Misunderstandings with same governance fields
└── evals/
    ├── 3_core_cases.json       # Domain MUST handle correctly
    ├── 3_boundary_cases.json   # Edge of scope
    ├── 3_failure_cases.json    # Known failure modes (cite failure_risk)
    ├── 1_excluded_case.json    # Wrong domain entirely
    └── scoring.json            # D1-D8 dimensions
```

## How to use

```bash
# 1. Copy to your new domain folder
cp -r templates/standard-domain ./my_domain
cd my_domain

# 2. Generate your scope identity (once per scope)
kdna identity init

# 3. Edit kdna.json:
#    - name: "@yourscope/your_domain_id"
#    - judgment_version: "YYYY.MM"
#    - description, core_insight, keywords, author

# 4. Edit KDNA_Core.json and KDNA_Patterns.json:
#    - Replace placeholder axioms with your own
#    - Every axiom MUST have applies_when, does_not_apply_when, failure_risk
#    - Every misunderstanding MUST have applies_when, failure_risk

# 5. Fill out evals/ — 10 real cases

# 6. Verify quality
kdna verify ./.

# 7. Publish
KDNA_IDENTITY_DIR=~/.kdna/identity-official \
  kdna publish ./. \
    --release-tag v0.1.0 \
    --repo yourname/kdna-<your_domain_id>

# 8. Open PR to kdna-registry with the patch JSON the command printed
```

## Standard vs minimal-domain

`minimal-domain/` is the **bare-minimum** template — 2 files, no v2.1 fields, no evals. Use it only for fast experimentation or learning.

`standard-domain/` is the **registry-ready** template. Any domain meant to be published to the registry should start here and aim for `kdna verify --judgment` ≥ 80% before publishing.
