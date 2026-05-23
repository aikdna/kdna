# .kdnapack Package Format Specification

Version: 0.2
Status: Draft

## 1. Purpose

`.kdnapack` is the multi-file KDNA domain package format. It is the canonical
container for a complete KDNA domain, suitable for distribution, installation,
version management, and future commercial packaging.

A `.kdnapack` can be:
- A **directory** on disk (for development and local use)
- A **tarball** (`.kdnapack.tar.gz`) for distribution
- An **encrypted archive** (`.kdna.pkg`) for commercial use (future)

## 2. Directory Structure

```
<domain-name>/
├── kdna.json                  # Package manifest (required)
├── KDNA_Core.json             # Core cognition (required)
├── KDNA_Patterns.json         # Language patterns (required)
├── KDNA_Scenarios.json        # Scenarios (optional)
├── KDNA_Cases.json            # Cases (optional)
├── KDNA_Reasoning.json        # Reasoning chains (optional)
├── KDNA_Evolution.json        # Evolution stages (optional)
├── README.md                  # Human-readable introduction
├── README.zh.md               # Chinese version (optional)
├── CHANGELOG.md               # Version history (recommended)
├── tests/                     # Quality tests (recommended)
│   ├── before-after.json
│   ├── expected-diagnosis.json
│   └── loader-cases.json
└── i18n/                      # Localized versions (optional)
    ├── zh-CN/
    │   ├── KDNA_Core.json
    │   └── KDNA_Patterns.json
    └── ja/
        ├── KDNA_Core.json
        └── KDNA_Patterns.json
```

## 3. Package Manifest: kdna.json

Every `.kdnapack` MUST contain a `kdna.json` at the root. This is the machine-readable
identity card of the domain.

```json
{
  "kdna_spec": "1.0-rc",
  "name": "sales",
  "version": "0.1.0",
  "language": "en",
  "languages": ["en", "zh-CN"],
  "created": "2026-05-13",
  "updated": "2026-05-17",
  "description": "Domain cognition for high-trust sales judgment.",
  "keywords": ["sales", "trust", "negotiation", "b2b"],
  "access": "open",
  "author": {
    "name": "Zhang Ling",
    "id": "zhangling",
    "url": "https://aikdna.com"
  },
  "license": {
    "type": "CC-BY-4.0",
    "url": "https://creativecommons.org/licenses/by/4.0/",
    "allow_agent_use": true,
    "allow_redistribution": true,
    "allow_training": false
  },
  "status": "experimental",
  "registry": {
    "id": "writing",
    "repo": "https://github.com/knowledge-dna/kdna-writing"
  }
}
```

### Manifest Fields

| Field | Required | Description |
|-------|----------|-------------|
| `kdna_spec` | Yes | Package format spec version. MUST be `"1.0-rc"`. |
| `name` | Yes | Domain identifier. Lowercase snake_case: `^[a-z][a-z0-9_]*$`. |
| `version` | Yes | Semantic version (`MAJOR.MINOR.PATCH`). |
| `language` | Yes | Primary language code (ISO 639-1 + optional region). |
| `languages` | No | All supported language codes. |
| `created` | Yes | Creation date (ISO 8601: `YYYY-MM-DD`). |
| `updated` | No | Last update date (ISO 8601). |
| `description` | Yes | One-sentence domain description. |
| `keywords` | No | Array of search keywords. |
| `access` | Yes | Access mode: `"open"`, `"licensed"`, `"runtime"`. |
| `author` | Yes | Creator identity object. |
| `license` | Yes | License declaration object. |
| `status` | No | Maturity: `"experimental"`, `"basic"`, `"stable"`, `"pro"`. |
| `registry` | No | Registry metadata for discovery. |
| `compatibility` | No | Agent compatibility info. |
| `dependencies` | No | Array of KDNA domain dependencies. |

### Status Values

| Value | Meaning |
|-------|---------|
| `experimental` | Work in progress. May change significantly. |
| `basic` | Complete minimal domain. Core + Patterns validated. |
| `stable` | Full domain with cases, tests, and documentation. |
| `pro` | Commercial-grade domain with premium features. |

## 4. File Requirements

### Required Files (always)

- `KDNA_Core.json` — Valid against `KDNA_Core.schema.json`
- `KDNA_Patterns.json` — Valid against `KDNA_Patterns.schema.json`
- `kdna.json` — Valid package manifest

### Optional Files

- `KDNA_Scenarios.json` — Valid against `KDNA_Scenarios.schema.json`
- `KDNA_Cases.json` — Valid against `KDNA_Cases.schema.json`
- `KDNA_Reasoning.json` — Valid against `KDNA_Reasoning.schema.json`
- `KDNA_Evolution.json` — Valid against `KDNA_Evolution.schema.json`

### Recommended Files

- `README.md` — Human-readable domain introduction
- `CHANGELOG.md` — Version history following Keep a Changelog
- `tests/before-after.json` — Quality comparison cases

## 5. Distribution Formats

### Development: Directory

For development, a `.kdnapack` is simply a directory following the structure above.
The directory name should match the `name` field in `kdna.json`.

```
sales/
├── kdna.json
├── KDNA_Core.json
├── KDNA_Patterns.json
├── ...
```

### Distribution: Tarball

For distribution via registry, the directory is archived:

```
sales-0.1.0.kdnapack.tar.gz
  └── sales/
      ├── kdna.json
      ├── KDNA_Core.json
      └── ...
```

The tarball filename convention is: `<name>-<version>.kdnapack.tar.gz`

### Future: Encrypted Package

For commercial KDNA, the directory is encrypted:

```
sales-pro-2.0.0.kdna.pkg
```

Encrypted packages can only be accessed via KDNA Runtime. See `kdna-access-modes.md`.

## 6. Validation Requirements

A valid `.kdnapack` MUST pass:

1. **Manifest exists:** `kdna.json` at package root
2. **Required files:** `KDNA_Core.json` + `KDNA_Patterns.json`
3. **Schema validation:** Each JSON file validates against its schema
4. **Structural lint:** Meta fields, unique IDs, cross-file references
5. **Manifest consistency:** `name` in manifest matches domain names in KDNA files
6. **Version consistency:** All KDNA file meta versions match
7. **Addressable:** No more than 6 JSON files in root (excluding kdna.json)

## 7. CLI Commands

```bash
# Validate a package directory
kdna validate ./sales

# Pack a directory into a distributable tarball
kdna pack ./sales

# Unpack a tarball back into a directory
kdna unpack sales-0.1.0.kdnapack.tar.gz

# Install from registry
kdna install sales

# Inspect package metadata
kdna inspect ./sales
kdna inspect sales-0.1.0.kdnapack.tar.gz
```

## 8. Conversion

### .kdnapack → .kdna

A `.kdnapack` directory can be converted to a single `.kdna` file:

```bash
kdna pack ./sales --single -o sales.kdna
```

This merges all JSON files into the YAML structure defined in `kdna-file-format.md`.

### .kdna → .kdnapack

A `.kdna` file can be expanded into a `.kdnapack` directory:

```bash
kdna unpack sales.kdna -o ./sales
```

## 9. Schema Compatibility

The KDNA JSON files within a `.kdnapack` use the same schema as the existing
KDNA specification (SPEC.md v0.4). The `kdna.json` manifest is new in v0.2.

When a `.kdnapack` directory follows both the existing SPEC.md and this spec,
it is considered a **v0.2-compatible KDNA domain package**.
