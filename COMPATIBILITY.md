# KDNA Compatibility Policy

This document defines what it means to be KDNA-compatible. It exists to prevent fragmentation — where multiple similar-but-incompatible "DNA" formats confuse users and undermine the standard.

## KDNA-Compatible: Definition

A tool, library, platform, or domain asset is **KDNA-compatible** if it satisfies the requirements below for its category.

### Category 1: Domain Package

A domain asset is KDNA-compatible if:

1. It contains at minimum `KDNA_Core.json` and `KDNA_Patterns.json`
2. Each file contains `meta.version`, `meta.domain`, `meta.created`, `meta.purpose`, and `meta.load_condition`
3. Axioms follow the structure defined in [SPEC.md](./SPEC.md) §5.2
4. Misunderstandings follow the structure defined in [SPEC.md](./SPEC.md) §6.3
5. Self-checks are answerable as yes/no questions
6. The package declares a `kdna.json` manifest with `name`, `version`, `spec_version`, and `access`
7. The package does not rename core KDNA concepts (e.g., axioms → principles) and still claim KDNA compatibility

### Category 2: Tool / Platform

A tool or platform is KDNA-compatible if:

1. It can load and apply at minimum `KDNA_Core.json` and `KDNA_Patterns.json`
2. It respects the `access` field (`open`, `licensed`, `runtime`) declared in `kdna.json`
3. It does not silently ignore required fields (e.g., `does_not_apply_when`, `failure_risk`)
4. If it modifies domain content, it must preserve Human Lock requirements for judgment-class fields (see [human-lock.md](./specs/human-lock.md))
5. It declares which SPEC version(s) it supports

### Category 3: Agent Integration

An agent integration is KDNA-compatible if:

1. It can load KDNA domains from installed packages or registry
2. It applies domain context to agent judgment (not just appends as raw text)
3. It respects the `load_condition` field — does not load irrelevant domains for every task
4. Trace output (if supported) follows the [judgment-trace-schema](./specs/judgment-trace-schema.json)

## Compatibility Levels

| Level | Description | Requirements |
|-------|-------------|-------------|
| **KDNA-Core** | Supports minimum domain structure | Category 1 above |
| **KDNA-Full** | Supports all 6 KDNA files | Category 1 + Scenarios, Cases, Reasoning, Evolution |
| **KDNA-Tool** | Tool that processes KDNA domains | Category 2 above |
| **KDNA-Agent** | Agent that loads and applies KDNA | Category 3 above |

## What Is NOT KDNA-Compatible

The following do NOT qualify as KDNA-compatible:

1. **Renamed formats**: Taking the KDNA file structure, renaming files (e.g., `MyCore.json`), and claiming it is a distinct standard while benefiting from KDNA's ecosystem
2. **Partial implementations that mislead**: Supporting only axioms but claiming full KDNA compatibility without disclosing limitations
3. **Silent field dropping**: Ignoring `does_not_apply_when`, `failure_risk`, or `self_check` fields without warning users
4. **Registry bypass**: Creating a separate registry that uses the KDNA name to imply official status without authorization

## Self-Declaration

Compatible projects may self-declare compatibility:

```markdown
## KDNA Compatibility
This project is **KDNA-Core compatible** (SPEC v1.0-rc).
It supports loading and validating KDNA_Core.json and KDNA_Patterns.json.
```

Official certification is managed through the registry governance process (see [GOVERNANCE.md](./docs/GOVERNANCE.md)).

## Rationale

Standards survive when compatibility is clear. KDNA's value to the ecosystem depends on users knowing that a "KDNA domain" means the same thing everywhere — not a different interpretation per tool or platform.

---

*This policy is maintained by the KDNA project. Changes follow the governance process in [GOVERNANCE.md](./docs/GOVERNANCE.md).*
