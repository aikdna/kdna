# KDNA Clusters

A KDNA Cluster is a composable judgment system — multiple small KDNA packages working together under defined roles to handle complex domain tasks.

## Why Not One Large KDNA?

A single monolithic KDNA for a broad domain has four problems:

| Problem | Example |
|---------|---------|
| **Too vague** | A "Business Growth KDNA" with 20 principles becomes a collection of truisms |
| **Context bloat** | Loading all judgment patterns when only 2 are relevant wastes agent context |
| **Frame conflict** | "Speed over quality" and "trust over speed" clash silently inside the same package |
| **Untestable** | You cannot prove which specific judgment improved when everything is bundled together |

## Package vs Cluster

| | KDNA Package | KDNA Cluster |
|---|---|---|
| **Scope** | One judgment fork | A complex domain |
| **Files** | 2-6 JSON files | Manifest + multiple packages |
| **Loading** | Load the package | Route to the right packages |
| **Validation** | kdna validate | kdna validate |
| **Example** | price-objection KDNA | Sales Judgment Cluster (5 packages) |

## Cluster Roles

Every package in a cluster has one of four roles:

| Role | Responsibility | Rule |
|------|---------------|------|
| **Primary** | The main judgment lens for this task | Exactly one per task |
| **Advisor** | Supplementary judgment from another angle | Maximum 3 per task |
| **Constraint** | Hard boundaries that override unsafe suggestions | Loaded when risk is detected |
| **Critic** | Reverse-audit: checks the primary's output | Loaded in review mode |

## Composition Rules

1. **Must have a primary.** Every task has exactly one Primary KDNA. No exceptions.
2. **Cannot average.** If two packages disagree, surface the conflict — do not blend them into a "balanced" nothing.
3. **Conflicts must be visible.** Tell the user: "Package A sees this as X. Package B sees it as Y. Which lens fits better?"
4. **Load by task phase.** Diagnosis → Design → Expression → Review each loads different packages. Do not load everything upfront.
5. **Cluster has its own benchmark.** Test not just individual packages, but whether the cluster as a system selects the right primary, avoids irrelevant packages, detects conflicts, and produces layered judgments.

## Cluster Manifest

A cluster is defined by `KDNA_Cluster.json`:

```json
{
  "name": "meeting-decision-intelligence",
  "version": "0.4.0",
  "purpose": "Judge whether meetings produce actionable decisions.",
  "packages": [
    {
      "id": "discussion-vs-decision",
      "role": "primary",
      "use_when": ["meeting summary", "discussion transcript"]
    },
    {
      "id": "owner-accountability",
      "role": "advisor",
      "use_when": ["tasks without owners", "unclear responsibility"]
    },
    {
      "id": "risk-escalation",
      "role": "constraint",
      "use_when": ["unresolved blockers", "timeline conflicts"]
    }
  ],
  "composition_rules": [
    "select exactly one primary",
    "load at most 3 advisors",
    "constraints may override unsafe actions",
    "surface conflicts rather than blending"
  ]
}
```

## When to Use a Cluster vs a Single Package

| Use a single package when | Use a cluster when |
|---|---|
| The task has one clear judgment fork | The task spans multiple judgment dimensions |
| One expert lens is sufficient | Different phases need different lenses |
| The domain is narrow and well-defined | The domain is broad with interacting sub-domains |
| You are building your first KDNA | You have multiple validated packages |

## Relationship to Existing Concepts

- **Judgment Pattern**: the smallest unit — a specific signal/misread/frame/boundary (defined in `benchmarks/`)
- **KDNA Package**: a domain package containing 2-6 JSON files (defined in `SPEC.md`)
- **KDNA Cluster**: a composable system of packages with defined roles (this document)

These three layers are complementary: patterns live inside packages, packages are organized into clusters.
