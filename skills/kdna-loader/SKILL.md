# KDNA Loader Skill

Use this skill to load KDNA domain cognition before responding to domain-specific tasks.

KDNA shapes judgment — framing, diagnosis, terminology, and self-checks — before output generation.

## File Locations (v0.7+ layout)

**Project-level (highest priority):**

Before doing anything else, search upward from the current working directory for:
1. `./.kdna/config.json`
2. `./kdna.config.json`

If found, parse it as:

```json
{
  "kdna": {
    "domains": ["@aikdna/writing", "@aikdna/agent_safety"],
    "mode": "auto" | "manual",
    "conflict_policy": "surface" | "first_wins"
  }
}
```

- `domains[]` — list of pinned `@scope/name` to consider for THIS repository
- `mode: "manual"` — only load pinned domains, never auto-match
- `mode: "auto"` (default) — pinned domains get priority, but auto-matching still runs
- `conflict_policy: "surface"` — when two domains disagree, tell the user, never blend silently
- `conflict_policy: "first_wins"` — first in `domains[]` is leader, others advise only

**Global install root:**

`~/.kdna/domains/@<scope>/<name>/` (v0.7 scoped layout)

Examples:
- `~/.kdna/domains/@aikdna/writing/`
- `~/.kdna/domains/@aikdna/code_review/`
- `~/.kdna/domains/@zhangling/internal_writing/`

**Legacy paths (deprecated, only read if `@scope` paths absent):**

- `./kdna/`, `./Kdna/` — old project-level
- `~/.kdna/domains/<bare_name>/` — pre-v0.7 unscoped layout (warn user to reinstall)

If your agent uses a different root, create a symlink:

```bash
ln -s ~/.kdna ~/.claude/Kdna   # Claude Code
ln -s ~/.kdna ~/.codex/Kdna    # Codex
ln -s ~/.kdna ~/.agents/Kdna   # OpenCode
```

## When to Use

**Use KDNA:** user asks for expert judgment, diagnosis, review, critique, reasoning, strategy, or transformation in a domain that has KDNA files.

**Skip KDNA:** purely mechanical tasks (format, extract, translate), or when domain judgment would not change the output. See [meta-cognition rules](https://github.com/aikdna/KDNA/blob/main/docs/meta-cognition.md) for detailed guidance.

## Domain Selection — v2.1 (governance-aware)

Use this order when deciding which domain to load:

### Step 1 — Project config takes priority

If a project-level `.kdna/config.json` was found and `mode: "manual"`, ONLY consider domains in `config.domains`. Skip auto-matching entirely.

If `mode: "auto"` (or no config), pinned domains get a +5 score bonus in the matching below.

### Step 2 — Score candidate domains by signal

For each installed domain at `~/.kdna/domains/@<scope>/<name>/`:

1. **Keyword hits** in user input against the domain's `keywords` field (`kdna.json`) and `core_insight`.
2. **applies_when match** — read `KDNA_Core.json > axioms[].applies_when` and `ontology[].applies_when`. If the user's task description matches one of these conditions, add +3 per match.
3. **does_not_apply_when CHECK** — read the same axioms' `does_not_apply_when`. If the user's task matches one of these, **subtract** the domain's total score by 10 (it disqualifies itself).

A domain whose `does_not_apply_when` clearly matches the task should NOT be loaded even if keywords match.

### Step 3 — Project config conflict policy

If multiple domains tie, use `conflict_policy`:
- `surface` — pick the highest score as leader, list the others as "advisors", surface conflict to user
- `first_wins` — first in `config.domains` wins, others are advisors only

### Step 4 — Status preference

When all else is equal: `stable` > `reference` > `experimental` > `deprecated`. Never load `yanked` domains.

### Fallback keyword table (when no manifest keywords are clear)

| Signal | Domain |
|---|---|
| "review writing", "edit", "is this good", "feedback on", "argument", "hook", "content diagnosis", "写作诊断", "文章问题" | `@aikdna/writing` |
| "notes", "knowledge base", "pkm", "obsidian", "notion", "second brain", "saved", "知识管理", "笔记" | `@aikdna/knowledge_management` |
| "prompt not working", "fix prompt", "why did this prompt", "prompt diagnosis", "task mixing", "prompt优化", "提示词问题" | `@aikdna/prompt_diagnosis` |
| "delete file", "organize files", "clean up", "remove", "safety", "irreversible", "before deleting", "安全", "删除文件" | `@aikdna/agent_safety` |
| "open source", "github repo", "adoption", "stars", "why no users", "开源", "项目采用" | `@aikdna/open_source_project` |
| "content idea", "what to write", "topic", "content strategy", "选题", "内容策略", "写什么" | `@aikdna/content_strategy` |
| "meeting", "decision", "discussion", "action items", "会议", "决策" | `@aikdna/decision_state` |
| "review pr", "review code", "pull request", "code review", "代码评审" | `@aikdna/code_review` |
| "animation", "motion", "gsap", "scroll", "transition", "动效", "动画" | `@aikdna/animation` (cluster) |

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
[KDNA] loaded: @aikdna/<name>@<version> | judgment_version: 2026.05
       modules: core, patterns [+ scenarios, cases, reasoning, evolution]
       source: project-config / auto-match / user-explicit
       mode: <minimum|auto|all>
```

For debug mode, expose this to the user:

```
Loaded KDNA: @aikdna/writing v0.7.2 (judgment_version 2026.05)
Source: matched on axiom.applies_when "user asked for content feedback"
Applied modules: core, patterns, scenarios
```

## Applying KDNA — v2.1 (boundary-aware)

1. **Internalize** axioms and stances as the domain frame.
2. **Boundary check** — for each axiom you'd apply, verify the task is in its `applies_when` AND not in its `does_not_apply_when`. If `does_not_apply_when` matches, DO NOT apply that axiom; surface this to the user if it changes the answer materially.
3. **Failure risk pre-check** — read each axiom's `failure_risk`. Before producing output, ask yourself: "Am I about to commit the failure this domain explicitly warns about?" If yes, step back.
4. **Use** preferred terminology; avoid banned terms even if the user uses them.
5. **Detect** likely misunderstandings in the user's framing.
6. **Apply** frameworks and scenario signals to classify the situation.
7. **Self-check** items from `KDNA_Patterns.json > self_check` before final output.
8. **Produce** a domain-shaped answer — not a KDNA summary.

## Response Protocol

**Normal tasks:** Do not announce loading. Don't quote KDNA. Don't say "According to KDNA…" Answer directly with judgment shaped silently by the domain.

**Debugging:** State which domain was loaded, report missing/invalid files, flag terminology conflicts, suggest file-level fixes.

## Multi-Domain (with conflict_policy)

When `.kdna/config.json` pins multiple domains:

1. Load Core + Patterns for each.
2. Compare axioms and terminology.
3. **If `conflict_policy: surface`** — pick leader by score; list others as advisors. When their stances disagree on the current task, tell the user: "Domain A sees this as X. Domain B sees it as Y. Which fits?"
4. **If `conflict_policy: first_wins`** — first pinned domain is leader. Others can add constraints but cannot override leader's stance.
5. **Never silently blend** contradictory guidance — that is the definition of judgment pollution.

## Conflict Arbitration

When domains conflict: user intent > specific domain > general domain > evidence > boundary declaration.

If a domain's `does_not_apply_when` matches the task, that domain disqualifies itself — do not "weigh it in".

See [meta-cognition: conflict arbitration](https://github.com/aikdna/KDNA/blob/main/docs/meta-cognition.md#3-conflict-arbitration).

## Failure Handling

| Situation | Action |
|---|---|
| No KDNA root | Continue without KDNA. If user requested KDNA, report expected path `~/.kdna/domains/@scope/name/`. |
| Domain folder missing | Report not found. Do not fabricate. Suggest `kdna search <keyword>`. |
| `.kdna/config.json` invalid JSON | Report the path + error. Continue with auto-matching. |
| `.kdna/config.json` references uninstalled domain | Suggest `kdna install <name>`. Continue with the rest. |
| Required files missing | Report which files. Minimum: `KDNA_Core.json` + `KDNA_Patterns.json`. |
| JSON invalid | Report the file. Continue with valid files if possible. |
| Legacy unscoped path detected | Suggest `kdna remove <name> && kdna install @aikdna/<name>` (v0.7 breaking change). |
| Domain has `yanked: true` (in registry) | Do not load. Suggest `replaced_by` if present. |

## Quality Boundary

KDNA does not replace tools, APIs, RAG, workflows, execution skills, or source verification. KDNA shapes judgment — evidence and user intent take priority when they conflict with domain axioms.

**KDNA humility:** if a domain has `failure_risk` declared and your draft answer hits that risk, the domain has self-disqualified for this task. Respect that and adjust.
