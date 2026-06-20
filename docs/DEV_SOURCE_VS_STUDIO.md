# Dev Source vs Studio Project: Historical State

> **Status:** Historical transparency note, not current public launch guidance.
> Current guidance: the public asset is a packaged `.kdna` file. Dev source
> directories and Studio project workspaces are authoring/editing views, not the
> default public consumption unit.
> **Updated:** 2026-06-20

## The Gap

KDNA defines two authoring formats:

| Format | Current Role | Public Consumption Role |
|--------|--------------|-------------------------|
| **Dev Source Directory** | Creator/debug workspace | Not a public `.kdna` asset |
| **Studio Project** (`studio.project.json`) | Studio-compatible authoring workspace | Not a public `.kdna` asset |
| **Packaged `.kdna` file** | Runtime distribution container | Public asset and loading unit |

## Why This Gap Exists

The Studio project format was introduced in v1.0-rc as a canonical
Studio-compatible authoring workspace. At the time of the original note:

1. **`kdna-studio-cli` (v0.2.0)** was the only tool that created Studio projects
2. Several early domain repos were authored before Studio existed and used dev source directories
3. **No migration tool** exists to convert dev source → Studio project while preserving all content (only axioms are currently imported via `--from-folder`)

## What This Means for Contributors

### Contributing to existing examples
For creator/debug workspaces, contributors may:
- Edit `KDNA_Core.json`, `KDNA_Patterns.json`, etc. directly
- Validate with `kdna dev validate .`
- Export a packaged `.kdna` file before public consumption

### Creating new domains
- **Prototype/experiment**: `kdna dev scaffold <name>` → edit JSON files
- **Studio export**: `kdna-studio create <name>` → card add → approve/review → export

## Migration (one command)

```bash
kdna-studio migrate ./my-domain --out ./my-domain.kdna --name @scope/my-domain --by "your-id" --statement "reviewed scope and boundaries"
kdna validate ./my-domain.kdna
kdna plan-load ./my-domain.kdna
```

This flow:
1. Imports ALL content from the dev source directory (axioms, ontology, stances, frameworks, terminology, misunderstandings, self-checks, scenarios, cases, reasoning, evolution)
2. Preserves manifest metadata (version, languages, description, judgment_version)
3. Records Studio review/provenance metadata when supplied
4. Exports a packaged `.kdna` file
5. Validates and plans the output through the Core v1 runtime path

No separate source-directory distribution step is needed.

## Honesty Note

The original version of this note documented a temporary v1.0-rc mismatch
between early source workspaces and Studio-compatible projects. Current public
guidance is simpler: users consume packaged `.kdna` files; creators may use dev
source directories, Studio projects, or compatible tools to produce them.

Both dev source workspaces and Studio projects are valid authoring/editing
views. Neither is the default public asset; the packaged `.kdna` file is.
