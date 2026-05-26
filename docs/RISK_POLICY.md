# KDNA Risk Policy

## Risk Levels

Every KDNA domain MUST declare a risk level. This determines what review, testing, and warnings are required before the domain can enter the public registry.

### R0 — Low Risk

**Domains whose misapplication causes inconvenience, not harm.**

Examples:
- Writing style and structure judgment
- Note-taking organization
- Content formatting
- Personal productivity patterns

Requirements:
- Human Lock on all cards
- Pass kdna dev validate

### R1 — Medium Risk

**Domains whose misapplication could lead to suboptimal outcomes or missed opportunities.**

Examples:
- Career development advice
- Management and leadership judgment
- Education and learning strategy
- Business communication
- Sales methodology
- Open-source project assessment

Requirements:
- All R0 requirements
- Feynman Restatement on core axioms
- Test Lab with ≥5 eval cases
- Known limitations declared
- Intended use and out-of-scope declared

### R2 — High Risk

**Domains whose misapplication could cause significant harm, financial loss, or personal distress.**

Examples:
- Relationship or interpersonal advice
- Mental well-being guidance
- Enterprise compliance judgment
- Financial decision support
- Hiring or performance evaluation

Requirements:
- All R1 requirements
- Expert review by a qualified domain expert
- Stronger, prominent warnings in domain README
- Evidence coverage for all core axioms
- At least 3 with_kdna_better results in Test Lab
- Review by registry maintainers before listing

### R3 — Restricted

**Domains where misapplication risks serious harm, legal liability, or public safety impact.**

Examples:
- Medical diagnosis or treatment recommendation
- Legal advice or interpretation
- Investment or insurance advice
- Child safety decisions
- Surveillance or monitoring systems
- Weapons-related applications
- Political manipulation or disinformation
- Emergency response or public safety

Requirements:
- Default: NOT permitted in public registry
- Special review required by KDNA maintainers
- May require institutional accountability (organization, not individual)
- Mandatory prominent warning labels
- Legal review recommended

## Domain Risk Detection

Studio Core SHOULD inspect domain content for high-risk keywords and flag domains that may be misclassified:

**Medical**: diagnosis, treatment, symptom, patient, clinical, therapy, medication, disease
**Legal**: lawsuit, liability, plaintiff, defendant, jurisdiction, statute, legal advice, attorney
**Financial**: investment, portfolio, stock, bond, retirement, insurance, mortgage, loan, tax advice
**Safety**: weapon, surveillance, monitoring, tracking, child safety, emergency response

If these keywords appear in axioms or domain descriptions, the risk level SHOULD be raised and a manual review triggered.

## Risk Reclassification

Authors may request reclassification by providing evidence that their domain does not fall into the detected category. Requests are reviewed by registry maintainers.

## Registry Enforcement

The registry maintainers reserve the right to:
- Reclassify a domain's risk level based on content review
- Require additional review for domains near risk boundaries
- Yank domains that misrepresent their risk level
- Remove domains that violate the risk policy
