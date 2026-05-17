# KDNA Loader Skill

Use this skill to load KDNA domain cognition before responding to domain-specific tasks.

KDNA shapes judgment — framing, diagnosis, terminology, and self-checks — before output generation.

## File Locations

**Default KDNA root:** `~/.agents/Kdna/`

**Agent-specific roots:** Codex → `~/.codex/Kdna/`, Claude Code → `~/.claude/Kdna/`, OpenCode → `~/.agents/Kdna/`

**Project-level roots (checked in order):** `./kdna/`, `./Kdna/`

Prefer project-level over local. Folder names use `snake_case` (e.g., `business_growth/`).

## When to Use

**Use KDNA:** user asks for expert judgment, diagnosis, review, critique, reasoning, strategy, or transformation in a domain that has KDNA files.

**Skip KDNA:** purely mechanical tasks (format, extract, translate), or when domain judgment would not change the output. See [meta-cognition rules](https://github.com/aikdna/KDNA/blob/main/docs/meta-cognition.md) for detailed guidance.

## Domain Selection

1. Search the KDNA root for folders matching the user's task.
2. If `registry.json` exists, use its `triggers` for matching; prefer `stable` > `experimental` > `draft`.
3. One leading domain is usually sufficient. Load secondary domains only as constraints.
4. If no domain matches, proceed without KDNA.

## Loading Rules

**Always load:** `KDNA_Core.json` + `KDNA_Patterns.json`

**Conditionally load:**

| File | Trigger |
|---|---|
| `KDNA_Scenarios.json` | Concrete situation, conflict, case, objection, decision context |
| `KDNA_Cases.json` | Examples, demonstrations, before/after comparison requested |
| `KDNA_Reasoning.json` | "Why", principles, logic behind a judgment requested |
| `KDNA_Evolution.json` | Practice, improvement, progress, capability level requested |

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
