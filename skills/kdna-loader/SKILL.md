# KDNA Loader Skill

Use this skill to load KDNA domain cognition before responding to domain-specific tasks.

KDNA shapes judgment — framing, diagnosis, terminology, and self-checks — before output generation.

## File Locations

**KDNA search paths (checked in order):**

1. `./kdna/`, `./Kdna/` — project-level (preferred)
2. `~/.kdna/domains/` — CLI install location (`kdna install` puts domains here)
3. `~/.kdna/` — legacy root (domain folders directly under root)

Domain folders use `snake_case` (e.g., `business_growth/`).

If your Agent uses a different root, create a symlink:

```
ln -s ~/.kdna ~/.claude/Kdna   # Claude Code
ln -s ~/.kdna ~/.codex/Kdna    # Codex
ln -s ~/.kdna ~/.agents/Kdna   # OpenCode
```

Prefer project-level over global.

## When to Use

**Use KDNA:** user asks for expert judgment, diagnosis, review, critique, reasoning, strategy, or transformation in a domain that has KDNA files.

**Skip KDNA:** purely mechanical tasks (format, extract, translate), or when domain judgment would not change the output. See [meta-cognition rules](https://github.com/aikdna/KDNA/blob/main/docs/meta-cognition.md) for detailed guidance.

## Domain Auto-Matching

When the user's request does not name a domain but implies one, **dynamically scan ALL installed domains** to find the best match. Do NOT use a hardcoded list — new domains are added continuously.

### Scanning procedure

1. List all folders in the KDNA root paths.
2. For each folder, check for ONE of these self-describing files (in priority order):
   - `SKILL.md` — domain's own skill file with trigger keywords
   - `kdna.json` — manifest with `keywords` and `description`
   - `AGENTS.md` — agent instructions with loading guidance
3. Score each domain by keyword overlap between the user's request and the domain's self-description. Extract keywords from:
   - `SKILL.md`: the "When to load" section
   - `kdna.json`: the `keywords` array
   - `AGENTS.md`: the first paragraph describing the domain

### Match algorithm

1. Score each installed domain by keyword hits in user input (case-insensitive).
2. If no domain scores above threshold, do not load KDNA.
3. If one domain clearly leads, load it. Prefer `stable` over `experimental` when scores tie.
4. If multiple domains score high and conflict is possible, load one as leader and flag the conflict.
5. For KDNA clusters: read the cluster's `KDNA_Cluster.json` or `SKILL.md` to determine which sub-domains to load based on the specific task (see "Task-based loading" in the cluster's SKILL.md).

### Self-bootstrapping domains

A domain with a `SKILL.md` at its root is **self-bootstrapping** — it can be loaded even without the kdna-loader meta-skill. When any agent scans its skills directory and finds a domain folder with `SKILL.md`, it can load that domain directly by following the instructions in the SKILL.md file.

This is the primary loading path. The kdna-loader meta-skill adds auto-matching and multi-domain conflict arbitration, but individual domains should work without it.

## Domain Selection (Manual)

1. Search the KDNA root for folders matching the user's task.
2. Check `kdna.json` manifest for `keywords` and `description`.
3. Prefer `stable` > `basic` > `experimental`.
4. One leading domain is usually sufficient. Load secondary domains only as constraints.

## Loading Rules

**Always load:** `KDNA_Core.json` + `KDNA_Patterns.json`

**Conditionally load:**

| File | Trigger |
|---|---|
| `KDNA_Scenarios.json` | Concrete situation, conflict, case, objection, decision context |
| `KDNA_Cases.json` | Examples, demonstrations, before/after comparison requested |
| `KDNA_Reasoning.json` | "Why", principles, logic behind a judgment requested |
| `KDNA_Evolution.json` | Practice, improvement, progress, capability level requested |

## Loading Log

Before responding, record internally (not in user-facing output):

```
[KDNA] loaded: <domain>@<version> | modules: core, patterns [+ scenarios, cases, reasoning, evolution] | mode: <minimum|auto|all>
```

For debug mode, expose this to the user:

```
Loaded KDNA: sales@0.1.0
Applied modules: core, patterns, scenarios
Mode: judgment shaping
```

## Applying KDNA

1. Internalize axioms and stances as the domain frame.
2. Use preferred terminology; avoid banned terms even if the user uses them.
3. Detect likely misunderstandings in the user's framing.
4. Apply frameworks and scenario signals to classify the situation.
5. Use reasoning chains when explaining rationale.
6. Run self-check items before final output.
7. Produce a domain-shaped answer — not a KDNA summary.

## Response Protocol

**Normal tasks:** Do not announce loading. Don't quote KDNA. Don't say "According to KDNA…" Answer directly with judgment shaped silently by the domain.

**Debugging:** State which domain was loaded, report missing/ invalid files, flag terminology conflicts, suggest file-level fixes.

## Multi-Domain

1. Load Core + Patterns for each candidate.
2. Compare axioms and terminology. Choose one leading domain.
3. Use secondary domains as constraints only.
4. **Surface conflicts — never silently blend contradictory guidance.** Tell the user: "Domain A interprets this as X. Domain B sees it as Y. Which perspective fits better?"

## Conflict Arbitration

When domains conflict: user intent > specific domain > general domain > evidence > boundary declaration. If a domain says "do NOT cover X" and the task is about X, that domain disqualifies itself. See [meta-cognition: conflict arbitration](https://github.com/aikdna/KDNA/blob/main/docs/meta-cognition.md#3-conflict-arbitration).

## Failure Handling

| Situation | Action |
|---|---|
| No KDNA root | Continue without KDNA. If user requested KDNA, report expected path. |
| Domain folder missing | Report not found. Do not fabricate. |
| Required files missing | Report which files. Minimum: `KDNA_Core.json` + `KDNA_Patterns.json`. |
| JSON invalid | Report the file. Continue with valid files if possible. |
| Optional files missing | Not fatal. Continue with Core + Patterns. |

## Quality Boundary

KDNA does not replace tools, APIs, RAG, workflows, execution skills, or source verification. KDNA shapes judgment — evidence and user intent take priority when they conflict with domain axioms.

## KDNA Clusters

When multiple KDNA packages are organized into a cluster (see `docs/kdna-clusters.md`), the loader must assign roles:

### Primary
One package leads. It defines the main judgment lens for the current task. All other packages operate relative to this lens.

### Advisor
Supplements the primary from another angle. Maximum 3 advisors per task. Advisors enrich — they do not override.

### Constraint
Hard boundaries that override unsafe suggestions. If a constraint package flags a risk (e.g., unresolved blockers in a timeline), it takes priority over all other guidance.

### Cluster Routing
When a cluster is available, the loader should:
1. Identify the cluster from available packages
2. Select the primary based on task signal matching
3. Activate advisors based on `use_when` conditions
4. Always load constraints when risk signals are detected
5. Surface role assignments in the loading log
