# .kdna File Format Specification

Version: 0.4
Status: Draft

## 1. Purpose

`.kdna` is the portable container format for a valid KDNA domain. It wraps a
standard KDNA domain folder into a single distributable file, preserving the
original 6-file structure inside the container.

A `.kdna` file is **not** a merged single JSON or YAML document. It is a
**ZIP archive** whose contents are a standard KDNA domain folder.

## 2. Design Philosophy

```
Development      →  Standard domain folder (6 JSON files, editable, diffable)
Distribution     →  .kdna container (ZIP archive, portable, signable)
Reading          →  Unpack internally, load per SPEC loading rules
Editing          →  Unpack back to folder, edit, re-pack
```

This is the same model as `.docx`, `.pptx`, `.epub`, `.vsix` — container files
that preserve internal structure rather than flattening it into one document.

## 3. File Extension

```
.kdna
```

Example: `writing.kdna`, `sketchnote-style.kdna`

MIME type (provisional): `application/x-kdna+zip`

## 4. Container Format

A `.kdna` file is a **ZIP archive** (DEFLATE compression, standard ZIP format).

Encoding of all files within the archive MUST be UTF-8.

## 5. Container Contents

A valid `.kdna` container MUST contain:

| File | Required | Purpose |
|------|:---:|---------|
| `KDNA_Core.json` | ✅ | Axioms, ontology, frameworks, causal structure, stances |
| `KDNA_Patterns.json` | ✅ | Terminology, banned terms, misunderstandings, self-checks |
| `kdna.json` | ✅ | Domain manifest (name, version, author, license, keywords) |

A valid `.kdna` container MAY contain:

| File | Purpose |
|------|---------|
| `KDNA_Scenarios.json` | Scenario triggers and action orientation |
| `KDNA_Cases.json` | Concrete cases showing reasoning structure |
| `KDNA_Reasoning.json` | Reasoning chains: conclusion → logic → so_what |
| `KDNA_Evolution.json` | Capability stages, measurable indicators |
| `README.md` | Human-readable domain description |
| `LICENSE` | License file |

The container MUST NOT contain more than 6 KDNA JSON files (excluding `kdna.json`).

All files MUST be at the root of the archive (no nested directories).

## 6. Container Metadata

Metadata is read from `kdna.json` within the container. The container itself
does not have a separate metadata header — it is transparent ZIP.

```json
{
  "kdna_spec": "1.0-rc",
  "name": "sketchnote-style",
  "version": "0.1.0",
  "status": "experimental",
  "access": "open",
  "language": "en",
  "author": { "name": "...", "id": "..." },
  "license": { "type": "CC-BY-4.0" },
  "keywords": ["sketchnote", "visual", "design"],
  "description": "Domain cognition for sketchnote visual style judgment.",
  "core_insight": "Visual clarity communicates before words do.",
  "file_count": 6,
  "created": "2026-05-20",
  "updated": "2026-05-20"
}
```

## 7. Lifecycle Commands

```
create    →  kdna init <name>           Scaffold standard domain folder
validate  →  kdna validate <folder>     Check 6 JSON files against SPEC
pack      →  kdna pack <folder>         Folder → .kdna container (ZIP)
inspect   →  kdna inspect <file.kdna>   Read container metadata + stats
unpack    →  kdna unpack <file.kdna>    .kdna → folder (for editing)
install   →  kdna install <file.kdna>   Install container to local registry
```

### 7.1 `kdna pack`

Creates a `.kdna` container from a valid domain folder. The command:

1. Validates the folder has required files (`KDNA_Core.json` + `KDNA_Patterns.json`)
2. Ensures `kdna.json` manifest exists (generates one if missing)
3. Creates a ZIP archive containing all KDNA JSON files + `kdna.json` + `README.md` (if present) + `LICENSE` (if present)
4. Outputs `<name>.kdna` in the current directory

```bash
kdna pack ./sketchnote-style
# → sketchnote-style.kdna
```

### 7.2 `kdna unpack`

Extracts a `.kdna` container back to a standard domain folder.

```bash
kdna unpack sketchnote-style.kdna
# → sketchnote-style/
#     KDNA_Core.json
#     KDNA_Patterns.json
#     ...
```

If the target directory already exists, the command SHALL error unless `--force` is passed.

### 7.3 `kdna inspect`

Reads a `.kdna` container and displays its metadata and content summary.

```bash
kdna inspect sketchnote-style.kdna
# → Domain: sketchnote-style
# → Version: 0.1.0
# → Axioms: 4
# → Files: 6/6
# → ...
```

The command SHALL unpack the container to a temporary directory, read all files,
display the summary, and clean up.

## 8. Reading by Agents

Agents SHOULD NOT read the entire container at once. They SHOULD follow the
standard KDNA loading rules:

| Always load | `KDNA_Core.json` + `KDNA_Patterns.json` |
| On scenario detection | `KDNA_Scenarios.json` |
| On case/example request | `KDNA_Cases.json` |
| On "why" / rationale request | `KDNA_Reasoning.json` |
| On practice / measurement request | `KDNA_Evolution.json` |

## 9. Container Integrity

A `.kdna` container MAY include a checksum file (`checksum.sha256`) at the root.
Implementations MAY verify this checksum before loading.

A `.kdna` container MAY be digitally signed. Signature metadata (if present)
SHALL be stored in `kdna.json` under a `signature` field, not as a separate file.

## 10. Comparison with Merged Single-File (deprecated)

KDNA v0.1–v0.3 used a merged JSON/YAML single-file format where all 6 files
were concatenated into one document. This approach was **deprecated in v0.4**
for the following reasons:

- Complex domains produce files over 500 lines — unreadable for humans
- Merged files cannot be incrementally edited or diffed per-section
- Merged files lose the standard 6-file structure that validators expect
- ZIP containers preserve the standard structure, enable per-file loading,
  and are the same model used by `.docx`, `.pptx`, `.epub`

The `kdna export` command from v0.1–v0.3 (which produced merged single-files)
is superseded by `kdna pack`.

## 11. Version Compatibility

- `.kdna` containers created by `kdna pack` v0.4 are ZIP archives containing
  spec v0.4 JSON files.
- Older merged single-file `.kdna` files created by `kdna export` v0.1–v0.3
  are still accepted by `kdna inspect` for backward compatibility, but
  `kdna pack` SHALL NOT produce this format.
