# @aikdna/kdna-eval

KDNA axiom evaluation engine — generic condition matching, dimension scoring,
and multi-domain weighted judgment.

## What it does

`kdna-eval` fills the gap that `@aikdna/kdna-core` intentionally leaves open:
**axiom evaluation**. Where kdna-core loads, validates, and renders domains as
prompt text, kdna-eval **executes** axiom rules against input data and produces
numeric scores.

## Quick Start

```js
const { evaluateCandidates } = require("@aikdna/kdna-eval");

const candidates = [
  {
    id: "seg-1",
    text: "A substantive transcript segment about technology",
    signals: { fromTranscript: true }
  },
  {
    id: "seg-2",
    text: "short",
    signals: {}
  }
];

const domains = [
  // domain with axioms — can be loaded from file, data, or built-in defaults
  { id: "segment_selection.kdna", data: segmentSelectionDomain }
];

const results = evaluateCandidates(candidates, domains);
// results[0].score > results[1].score
```

## API

### Evaluate (main entry)

| Export | Description |
|---|---|
| `evaluateCondition(candidate, condition, context?)` | Match a single condition against a candidate |
| `evaluateAxioms(candidate, axioms, context?)` | Score a candidate against one domain's axioms |
| `evaluateCandidates(candidates, domains, options?)` | Score multiple candidates across multiple domains |
| `computeComposite(dimensions, weights?)` | Weighted 6-dimension composite score |
| `getPath(obj, pathStr)` | Dot-separated path navigation utility |
| `RULE_OF_SIX_DEFAULTS` | Default dimension weights |

### Loader (`@aikdna/kdna-eval/loader`)

| Export | Description |
|---|---|
| `loadDomainFromFile(fileName, kdnaDir?, defaults?)` | Load a domain JSON file from `~/.kdna/` |
| `loadDomainFromData(data, fileName?)` | Parse domain from a JS object or JSON string |
| `loadDomains(domainNames, options?)` | Batch load domains with fallback |
| `listDomains(kdnaDir?)` | List available `.kdna` files |
| `loadPersona(personaId, options?)` | Load a director persona with fallback |
| `listPersonas(kdnaDir?, defaults?)` | List available personas |
| `STORYCUT_DEFAULTS` | Built-in default domains (plexport from `./defaults/domains`) |
| `DEFAULT_PERSONAS` | Built-in default personas (export from `./defaults/personas`) |

### Route (`@aikdna/kdna-eval/route`)

| Export | Description |
|---|---|
| `getRoutePolicy(operation, policies?)` | Get policy for a named operation |
| `resolveDomains(operation, options?)` | Resolve domains with overrides |
| `DEFAULT_POLICIES` | Built-in operation→domain mappings |
| `OPERATIONS` | List of known operation names |

## Axiom Format

```json
{
  "id": "transcript-bonus",
  "dimensions": ["story", "emotion"],
  "condition": {
    "path": "signals.fromTranscript",
    "op": "eq",
    "value": true
  },
  "effect": {
    "value": 8,
    "multiplyBy": "optional.field.path",
    "cap": 0
  }
}
```

Supported condition operators: `eq`, `gt`, `gte`, `lt`, `lte`, `between`.

Built-in path shortcuts: `duration`, `index`, `text.length`, `riskFlags.length`,
`candidateRoles.length`.

## Integration with @aikdna/kdna-core

kdna-core loads/validates `.kdna` containers. kdna-eval evaluates the loaded
domains:

```js
const { openKDNA } = require("@aikdna/kdna-core");
const { evaluateCandidates } = require("@aikdna/kdna-eval");

const domain = await openKDNA("my_domain.kdna");
const results = evaluateCandidates(candidates, [
  { id: domain.manifest.name, data: domain.data }
]);
```

Or use the loader directly to read JSON files from `~/.kdna/` without the
ZIP container overhead.

## License

Apache-2.0
