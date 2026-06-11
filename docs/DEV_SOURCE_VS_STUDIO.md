# Dev Source vs Studio Project: Current State

> **Status:** v1.0-rc transparency note  
> **Updated:** 2026-06-11

## The Gap

KDNA defines two authoring formats:

| Format | SPEC Status | Actual Usage | Trust Level |
|--------|------------|-------------|-------------|
| **Dev Source Directory** | Non-canonical (SPEC §1 line 19) | **12+ open-source domain repos** use this as their sole format | Dev-only, non-trusted |
| **Studio Project** (`studio.project.json`) | Canonical authoring workspace (SPEC §15) | **0 instances** in the open-source ecosystem | Required for trusted assets |

## Why This Gap Exists

The Studio project format was introduced in v1.0-rc as the canonical authoring workspace. At the time of writing:

1. **`kdna-studio-cli` (v0.2.0)** is the only tool that creates Studio projects
2. **All 12+ open-source domain repos** were authored before Studio existed and use dev source directories
3. **No migration tool** exists to convert dev source → Studio project while preserving all content (only axioms are currently imported via `--from-folder`)

## What This Means for Contributors

### Contributing to existing domains
The primary authoring format for open-source domains is still the dev source directory. Contributors should:
- Edit `KDNA_Core.json`, `KDNA_Patterns.json`, etc. directly
- Validate with `kdna dev validate .`
- The maintainer handles Studio compilation for trusted releases

### Creating new domains
- **Prototype/experiment**: `kdna dev scaffold <name>` → edit JSON files
- **Trusted release**: `kdna-studio create <name>` → card add → lock → compile → export

## Migration (one command)

```bash
kdna-studio migrate ./my-domain --out ./my-domain.kdna --name @scope/my-domain --by "your-id" --statement "reviewed all axioms" --sign
```

This single command:
1. Imports ALL content from the dev source directory (axioms, ontology, stances, frameworks, terminology, misunderstandings, self-checks, scenarios, cases, reasoning, evolution)
2. Preserves manifest metadata (version, languages, description, judgment_version)
3. Auto-approves and Human Locks all cards
4. Compiles a trusted `.kdna` asset
5. Exports it to the specified output file

No separate create/approve/lock/compile/export steps needed.

## Honesty Note

We acknowledge that the canonical authoring path (Studio) currently has zero adoption in the open-source domain ecosystem. This document exists to prevent the confusion that arises when users read the SPEC saying "use Studio" but find no Studio projects anywhere in the ecosystem.

The dev source directory format remains the practical authoring format for open-source domain contributors until the Studio migration path is seamless.
