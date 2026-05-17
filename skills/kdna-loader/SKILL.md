# KDNA Loader Skill

Use this skill when an agent needs to answer or act in a domain that has an available KDNA package.

KDNA files provide domain cognition. They should shape how the agent frames the problem, diagnoses the situation, uses terminology, detects misunderstandings, reasons from principles, and checks output quality — before generating any response.

## Default Local Paths

Recommended local installation:

```text
~/.agents/
  Skills/
    kdna-loader/
      SKILL.md
  Kdna/
    registry.json
    <domain_name>/
      KDNA_Core.json
      KDNA_Patterns.json
      KDNA_Scenarios.json
      KDNA_Cases.json
      KDNA_Reasoning.json
      KDNA_Evolution.json
```

**Default KDNA root:** `~/.agents/Kdna/`

**Project-level roots** (checked in order):
- `./kdna/`
- `./Kdna/`

If both local and project-level KDNA exist, prefer project-level KDNA for the current project.

## Domain Folder Convention

Each domain lives in one folder. Use lowercase snake_case:

```
communication_expert/
business_growth/
product_decision/
```

## Activation Rules

**Use KDNA when:**
- The user explicitly asks to use KDNA.
- The user asks for expert judgment in a domain.
- The user names a domain that exists in the KDNA library.
- The task requires diagnosis, review, critique, reasoning, transformation, or strategy.
- Another execution skill would benefit from domain judgment.

**Skip KDNA for:**
- Purely mechanical tasks (format JSON, extract emails, translate text).
- Tasks where domain judgment would not change the output.

## Domain Selection

Before answering:

1. Read the user's task.
2. Identify the primary domain.
3. Search the KDNA root for matching folders.
4. If `registry.json` exists in the KDNA root, use its `triggers` field for domain matching.
5. If one domain clearly matches, load it.
6. If multiple domains match, load Core + Patterns for each candidate, then choose one leading domain based on the user's immediate goal.
7. Use secondary domains only as constraints or supporting lenses.
8. If no matching domain exists, proceed normally. Mention missing KDNA only when it materially affects the result.

## Loading Rules

**Always load:**
- `KDNA_Core.json`
- `KDNA_Patterns.json`

**Load optional files by condition:**

| File | Load when |
|---|---|
| `KDNA_Scenarios.json` | User describes a concrete situation, scene, conflict, symptom, case, failure, behavior, objection, or decision context. |
| `KDNA_Cases.json` | User asks for examples, demonstrations, before/after comparison, case analysis, or complete sample output. |
| `KDNA_Reasoning.json` | User asks why, asks for principles, asks for the logic behind a judgment, or needs the reasoning path explained. |
| `KDNA_Evolution.json` | User asks how to improve, practice, measure progress, assess level, or build capability over time. |

Multiple optional files may be loaded when multiple conditions are true.

## Registry Support

If `registry.json` exists in the KDNA root, use it for domain discovery:

```json
{
  "version": "0.1",
  "root": "~/.agents/Kdna",
  "domains": [
    {
      "id": "communication_expert",
      "name": "Communication Expert",
      "path": "communication_expert",
      "description": "Domain cognition for communication diagnosis and trust.",
      "triggers": ["communication", "conflict", "trust", "沟通", "关系", "信任"]
    }
  ]
}
```

If registry and folder names disagree, trust the registry for discovery but verify the folder exists.

## How to Apply KDNA

After loading relevant files:

1. Extract the domain axioms.
2. Identify the central concepts and ontology.
3. Apply the domain's frameworks and causal structure.
4. Use the domain's preferred terminology.
5. Avoid banned or misleading terminology — even if the user uses it.
6. Detect likely misunderstandings in the user's framing.
7. Use scenario signals to classify the situation.
8. Use reasoning chains when explaining why.
9. Run self-check items before final output.
10. Produce an answer shaped by the KDNA, not a summary of the KDNA.

## Response Protocol

**For normal tasks:**
- Do not announce internal loading unless it helps the user.
- Do not quote KDNA mechanically.
- Do not say "According to the KDNA…" unless the user asks how KDNA was used.
- Answer the user's task directly. Let KDNA influence judgment, structure, terminology, and quality silently.

**For debugging or KDNA development tasks:**
- State which KDNA domain was loaded.
- Report missing required files.
- Report schema or structural problems.
- Report terminology conflicts.
- Suggest concrete file-level changes.

## Multi-Domain Handling

When multiple domains are relevant:

1. Load Core + Patterns for each candidate domain.
2. Compare axioms, terminology, banned terms, and self-checks.
3. Choose the leading domain based on the user's immediate goal.
4. Load optional files from the leading domain first.
5. Use secondary domains as constraints.
6. If two domains conflict, surface the conflict instead of silently blending them.

## Failure Handling

| Situation | Action |
|---|---|
| No KDNA root exists | Continue without KDNA. If user explicitly requested KDNA, report expected path. |
| Domain folder missing | Report the folder is not found. Do not fabricate KDNA. |
| Required files missing | Do not pretend the KDNA is valid. Report which files are missing. Minimum valid domain requires `KDNA_Core.json` and `KDNA_Patterns.json`. |
| JSON is invalid | Report the invalid file. Ask for repair only if the task cannot continue. Otherwise proceed with valid files only. |
| Optional files missing | Continue with Core + Patterns. Not fatal. |

## Quality Standard

A KDNA-shaped answer should be:
- More diagnostic than generic.
- More judgment-based than information-based.
- More domain-specific than prompt-shaped.
- More aware of hidden misunderstandings.
- More consistent in terminology.
- More explicit about what NOT to do.

## Critical Boundary

KDNA does not replace tools, APIs, RAG, workflow engines, execution skills, domain data, or source verification.

**KDNA shapes judgment before and during execution.**
