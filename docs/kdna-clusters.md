# KDNA Clusters

> **Status: Design / Experimental** — Not part of KDNA Core v1 GA.
> For current stable usage, use single `.kdna` assets with `kdna validate` / `kdna plan-load` / `kdna load`.
> See [tool-status-matrix.md](tool-status-matrix.md) for GA capabilities.

A KDNA Cluster is a composable judgment system: multiple scoped KDNA domain assets working together under defined roles and route policy to handle complex tasks.

A cluster is not a broader merged `.kdna`. Each domain asset keeps its own scope, version, provenance, and evaluation boundary. The cluster defines which assets participate, when they load, how conflicts surface, and how the combined system is reviewed.

## Why Not One Large KDNA?

A single monolithic KDNA for a broad domain has four problems:

| Problem | Example |
|---------|---------|
| **Too vague** | A "Business Growth KDNA" with 20 principles becomes a collection of truisms |
| **Context bloat** | Loading all judgment patterns when only 2 are relevant wastes agent context |
| **Frame conflict** | "Speed over quality" and "trust over speed" clash silently inside the same asset |
| **Untestable** | You cannot prove which specific judgment improved when everything is bundled together |

## Domain KDNA vs Cluster vs Work Pack

| Layer | Purpose | Answers |
|---|---|---|
| **Domain KDNA** | One scoped judgment asset packaged as `.kdna` | In this domain and task, what standards should guide judgment? |
| **KDNA Cluster** | A composition layer over multiple domain assets | Which KDNA assets should participate, in what role, and under what route policy? |
| **Work Pack** | A reusable work capability built from judgment + execution material | How should a class of work be executed, reviewed, and improved? |

Work Packs may include a KDNA Cluster, skills, task templates, output templates, review gates, risk policy, recommended tools, and trace/feedback contracts. KDNA remains the judgment layer inside that package.

## Cluster Roles

Every domain asset in a cluster has one of four roles:

| Role | Responsibility | Rule |
|------|---------------|------|
| **Primary** | The main judgment lens for this task | Exactly one per task |
| **Advisor** | Supplementary judgment from another angle | Maximum 3 per task |
| **Constraint** | Hard boundaries that override unsafe suggestions | Loaded when risk is detected |
| **Critic** | Reverse-audit: checks the primary's output | Loaded in review mode |

## Composition Rules

1. **Must have a primary.** Every task has exactly one Primary KDNA. No exceptions.
2. **Cannot average.** If two assets disagree, surface the conflict — do not blend them into a "balanced" nothing.
3. **Conflicts must be visible.** Tell the user: "Domain A sees this as X. Domain B sees it as Y. Which lens fits better?"
4. **Load by task phase.** Diagnosis → Design → Expression → Review each loads different assets. Do not load everything upfront.
5. **Trace attribution.** When multiple domains influence output, traces must preserve which domain supplied which judgment.
6. **Cluster has its own benchmark.** Test not just individual assets, but whether the cluster as a system selects the right primary, avoids irrelevant assets, detects conflicts, and produces layered judgments.

## Cluster Manifest

A cluster is defined by `kdna.cluster.json`:

```json
{
  "name": "meeting-decision-intelligence",
  "version": "0.4.0",
  "purpose": "Judge whether meetings produce actionable decisions.",
  "domains": [
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

## When to Use a Cluster vs a Single Domain Asset

| Use a single domain asset when | Use a cluster when |
|---|---|
| The task has one clear judgment fork | The task spans multiple judgment dimensions |
| One expert lens is sufficient | Different phases need different lenses |
| The domain is narrow and well-defined | The domain is broad with interacting sub-domains |
| You are building your first KDNA | You have multiple validated domain assets |

## Relationship to Existing Concepts

- **Judgment Pattern**: the smallest unit — a specific signal/misread/frame/boundary.
- **KDNA Asset**: a domain asset containing 2-6 standard KDNA judgment files (defined in `SPEC.md`).
- **KDNA Cluster**: a composable system of domain assets with defined roles and route policy (this document).
- **Work Pack**: a reusable work capability that can bundle KDNA or a KDNA Cluster with skills, templates, review gates, and trace/feedback contracts.

These layers are complementary: patterns live inside domain assets, domain assets are organized into clusters, and clusters can be used inside Work Packs.
