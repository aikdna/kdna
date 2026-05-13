# KDNA Loader Skill

Use this skill when a user asks for help in a domain that has a KDNA folder.

## Purpose

KDNA files provide domain cognition. They should shape judgment before the response is generated.

Do not treat KDNA as a script. Do not quote it mechanically. Internalize it as the domain frame.

## Loading Rules

1. Identify the relevant domain folder.
2. Always load:
   - `KDNA_Core.json`
   - `KDNA_Patterns.json`
3. Load optional files by condition:
   - Load `KDNA_Scenarios.json` when the user describes a concrete situation, scene, conflict, or case.
   - Load `KDNA_Cases.json` when the user asks for examples, demonstrations, or complete cases.
   - Load `KDNA_Reasoning.json` when the user asks why, asks for principles, or needs rationale.
   - Load `KDNA_Evolution.json` when the user asks how to practice, improve, measure progress, or identify current level.

## Response Posture

After loading Core + Patterns:

1. Check the domain stances.
2. Use standard terminology.
3. Avoid banned terminology, even if the user uses it.
4. Detect likely misunderstandings.
5. Apply self-check before final response.

## Multi-Domain Requests

When multiple domains are relevant:

1. Load Core + Patterns for each relevant domain.
2. Check for terminology conflicts.
3. Check for axiom conflicts.
4. Use optional files from the domain most directly related to the user's immediate task.
5. Surface conflicts instead of silently blending them.

## Critical Boundary

KDNA tells the agent how to think. It does not replace task-specific tools, scripts, or execution skills.
