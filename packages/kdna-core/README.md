# @aikdna/kdna-core

Core library for loading, validating, linting, rendering, composing, and directly reading KDNA `.kdna` cognition assets. It has zero npm runtime dependencies.

## Installation

```bash
npm install @aikdna/kdna-core
```

## Preferred public API

Third-party adapters should start with the stable asset-first API. These
functions accept a `.kdna` file path, bytes, or an already opened asset and do
not require persistent extraction.

```js
const {
  inspectKDNA,
  validateKDNA,
  loadKDNA,
  renderForAgent,
  verifyAsset,
  verifyDigest,
  verifySignature,
  matchDomain,
  composeKDNA
} = require('@aikdna/kdna-core');

const info = await inspectKDNA('./writing.kdna');
const validation = await validateKDNA('./writing.kdna');
const loaded = await loadKDNA('./writing.kdna', { profile: 'compact' });
const promptContext = await renderForAgent('./writing.kdna');

await verifyAsset('./writing.kdna', {
  asset_digest: info.asset_digest,
  requireSignature: true
});
await verifyDigest('./writing.kdna', info.asset_digest);
await verifySignature('./writing.kdna');

const matches = await matchDomain('Review this writing draft', ['./writing.kdna']);
const composed = await composeKDNA(['./writing.kdna', './agent_safety.kdna'], {
  input: 'Review this public release note for safety and writing quality'
});
```

Stable entry points:

| Function | Purpose |
| --- | --- |
| `openKDNA()` | Open a `.kdna` file or bytes as an immutable asset. |
| `inspectKDNA()` | Return manifest, entries, access, quality, risk, and digests. |
| `validateKDNA()` | Run asset, lint, schema, and cross-file validation. |
| `loadKDNA()` | Load index/compact/scenario/full profiles directly from `.kdna`. |
| `renderForAgent()` | Render a loaded asset into agent prompt context. |
| `verifyAsset()` | Run full asset verification: digest, content digest, signature, and trust metadata. |
| `verifyDigest()` | Check whole-file `asset_digest`. |
| `verifySignature()` | Require Ed25519 signature verification. |
| `matchDomain()` | Rank candidate assets for a task string. |
| `composeKDNA()` | Compose multiple assets with attribution and conflict reporting. |

## Lower-level usage

```js
const {
  createKdnaAssetReader,
  lintDomain,
  validateDomainSchema,
  validateCrossFile
} = require('@aikdna/kdna-core');

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

### `createKdnaAssetReader()`

Direct `.kdna` container reader. The reader opens ZIP-backed `.kdna` assets without persistent extraction and exposes:

- `open(pathOrBytes)`
- `listEntries(asset)`
- `readEntry(asset, entryName)`
- `readJson(asset, entryName)`
- `readManifest(asset)`
- `readDataMap(asset)`
- `contentDigest(asset)`
- `verify(asset, { asset_digest?, content_digest?, requireSignature? })`
- `loadProfile(asset, "index" | "compact" | "scenario" | "full", options?)`

Example:

```js
const { createKdnaAssetReader } = require('@aikdna/kdna-core');

const reader = createKdnaAssetReader();
const asset = await reader.open('./writing.kdna');
const manifest = await reader.readManifest(asset);
const trust = await reader.verify(asset, { requireSignature: true });
const loaded = await reader.loadProfile(asset, 'compact');
```

The asset reader treats extraction caches as implementation details. The `.kdna` file remains the identity, install, verification, and loading object.

Licensed assets can list encrypted JSON entries in `kdna.json`:

```json
{
  "access": "licensed",
  "encryption": {
    "profile": "kdna-licensed-entry-v1",
    "encrypted_entries": ["KDNA_Core.json", "KDNA_Patterns.json"]
  }
}
```

The reader never writes decrypted entries to disk. Callers provide an in-memory
`decryptEntry` hook when they have already validated license activation:

```js
const { createLicensedDecryptEntry } = require('@aikdna/kdna-core');

const decryptEntry = createLicensedDecryptEntry({
  licenseKey: activation.license_key,
  machineFingerprint: activation.machine_fingerprint
});

const loaded = await reader.loadProfile(asset, 'compact', { decryptEntry });
```

The profile uses AES-256-GCM over each protected entry and derives the entry key
from the license key plus machine fingerprint using `scrypt-sha256`. This is a
runtime primitive, not a license activation system; callers must validate license
status before passing a decrypt hook to the reader.

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
