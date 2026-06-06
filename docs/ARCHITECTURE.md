# KDNA Architecture

## Protocol Model

The KDNA Protocol defines how human domain expertise is encoded as machine-readable judgment assets that AI agents can load, verify, and evolve.

## System Layers

### Layer 1: Protocol
- **KDNA Schema** — JSON-based format for encoding domain judgment
- **Six canonical files**: Core, Patterns, Scenarios, Cases, Reasoning, Evolution
- **Three scope tiers**: L1 (terms), L2 (concepts), L3 (full judgment)
- **Human Judgment Lock** — critical fields must be locked by a human author before publication

### Layer 2: Authoring
- **kdna-studio** — guided authoring environment with card-level Human Lock, Feynman restatement, quality gates, Studio-compatible compiler, and `.kdna` export
- **CLI** (`kdna dev scaffold`, `kdna dev validate`, `kdna dev pack`) — dev source utilities for non-canonical workspaces and debugging bundles; not a trusted authoring authority

### Layer 3: Registry
- **Central domain index** (`domains.json`) — the canonical listing of all published KDNA domains
- **Quality badges**, risk levels (`R0`–`R3`), i18n metadata
- **Review status ladder**: `unlisted` → `community` → `verified` → `reviewed` → `trusted` (+ `restricted`, `deprecated`, `yanked`)
- **Provenance**: Every asset carries author identity, `asset_digest`, scope signature, and build metadata

### Layer 4: Distribution
- **npm packages** (`@aikdna/*`) — installable via `kdna install`
- **.kdna assets** — signed, installable, directly loadable containers with full verification chain
- **Private registry** support for enterprise deployments

### Layer 5: Loading
- **kdna-loader skill** — teaches agents to discover installed `.kdna` assets through the CLI
- **Agent adapters**: Codex, Claude Code, OpenCode
- **Runtime projection** — agents receive task-relevant judgment fragments, never the full domain
- **App runtime contract** — shared KDNA Asset → Route Result → Judgment Trace → Judgment Report boundary for a KDNA-compatible client, authoring tools, and agent runtimes

## Data Flow

```
Expert → Studio/CLI → .kdna Asset → Registry → Install → Agent Loader → AI Agent
```

1. A domain expert authors judgment content via Studio or CLI
2. The domain is validated, tested, and packaged as a signed `.kdna` file
3. The domain is published to the registry with metadata
4. Users install domains via `kdna install`
5. Agent loaders (kdna-skills) discover installed domains at runtime
6. Agents receive projected judgment fragments relevant to the current task

## Security Model

- **Human Lock** — critical fields must be signed by a human expert; AI-generated draft cards never enter compile output
- **Signature verification** — Ed25519 public key in `kdna.json`, verified against scope trust pubkeys in the registry
- **Asset digest** — whole-file `.kdna` digest, verified on install
- **Task projection** — agents receive minimum context needed for the task, never the full domain
- **Risk levels** — `R0` (low) through `R3` (restricted); agents must respect risk warnings

## I18N Architecture

Domains declare supported languages via `languages` and `default_language` fields. Localization levels range from `L0` (monolingual) to `L4` (locale-specific evaluations). Official domains must be at least L1 in both English and Chinese (zh-CN).

See [KDNA_I18N_SPEC.md](./KDNA_I18N_SPEC.md) for the full specification.

## Governance

See [GOVERNANCE.md](./GOVERNANCE.md) for the review model, roles (maintainers, authors, integrators, registry moderators), and decision process. Key principles:

- Human accountability — AI proposes, humans lock
- No one-click domain generation
- Risk-based review (R0–R3)
- Provenance and signature requirements
- Runtime transparency and logging
