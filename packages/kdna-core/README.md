# @aikdna/kdna-core

Pure logic library (zero dependencies) for loading, validating, linting, rendering, and composing KDNA domain cognition packages.

## Installation

```bash
npm install @aikdna/kdna-core
```

## Usage

```js
const { lintDomain, validateDomainSchema, validateCrossFile, renderDomain } = require('@aikdna/kdna-core');

// Validate a domain
const dataMap = {
  'KDNA_Core.json': { meta: { domain: 'my_domain' }, axioms: [...] },
  'KDNA_Patterns.json': { meta: { domain: 'my_domain' }, self_check: [...] }
};

const lintResult = lintDomain(dataMap);
const schemaResult = validateDomainSchema(dataMap, schemas);
const crossResult = validateCrossFile(dataMap);
```

## API

### `lintDomain(dataMap)`
Structural linting — checks required files, field presence, unique IDs, yes/no answerable self-checks, cross-file references, and flags potentially vague axioms.

Returns `{ errors: string[], warnings: string[] }`.

### `validateDomainSchema(dataMap, schemaMap)`
JSON Schema validation against published schemas (KDNA_Core, KDNA_Patterns, KDNA_Scenarios, KDNA_Cases, KDNA_Reasoning, KDNA_Evolution).

Returns `{ errors: string[], warnings: string[] }`.

### `validateCrossFile(dataMap)`
Cross-file consistency checks — ensures references between domain files are valid.

Returns `{ errors: string[], warnings: string[] }`.

### `renderDomain(dataMap, options?)`
Renders domain files into a structured context block using a standard template. The rendered context preserves the domain's structure as distinct, named sections suitable for agent system prompts.

## Compose API (9 functions)

Multi-domain composition — load multiple KDNA domains, classify which should activate for a given input, detect conflicts, and merge their judgment into a single agent context.

### Context Composition

- **`composeContext(domains, options?)`** — Merge multiple loaded domains into a single context string. Conflicting axioms or banned terms from different domains are both included; the agent must report the conflict rather than silently resolve it.

- **`composeContextWithAttribution(domains, options?)`** — Same as `composeContext`, but every axiom, misunderstanding, banned term, and self-check is prefixed with its origin domain (e.g., `[writing:axiom.axiom_problem_not_prose]`). Returns `{ context, attributionMap }`.

- **`loadAndCompose(dataMaps, options?)`** — Convenience function: loads each domain from file data maps, classifies signals against input, then composes the active domains. Returns `{ domains, context, activeIndices }`.

### Signal Classification

- **`classifySignals(input, domains)`** — Match user input against each domain's `trigger_signals`. Returns indices of matching domains. Domains with no signals defined are treated as primary (always active).

- **`classifySignalsAcrossDomains(input, domainEntries)`** — Full diagnostic version of signal classification. Returns `{ selected, excluded }` with reasons (`signal_match`, `required`, `blocked by does_not_apply_when`, `no signal match`).

### Cluster Operations

- **`loadCluster(clusterManifestPath, domainLoader)`** — Load a cluster manifest (`kdna.cluster.json`) and resolve each domain via the provided loader function. Returns `{ manifest, domains, errors }`.

- **`detectDomainConflicts(domains)`** — Detect conflicts between loaded domains in a cluster. Currently checks for: (1) banned term collisions across domains, (2) contradictory stances (simple negation heuristic). Returns array of conflict objects with `type`, `domains`, and `description`.

- **`generateClusterTrace({ input, loadedDomains, activeDomains, conflicts })`** — Generate a judgment trace record for a cluster operation. Returns `{ input, timestamp, loaded_domains, active_domains, active_count, domains_excluded, conflicts }`.

### Utilities

- **`composeChecks(domains)`** — Merge self-check items from multiple domains into a single checklist. Each item is prefixed with its domain name so overlaps are visible.

## License

Apache-2.0
