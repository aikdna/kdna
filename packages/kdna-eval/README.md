# @aikdna/kdna-eval

KDNA runtime scoring primitives — configurable condition matching, dimension
scoring, and multi-domain weighted evaluation. Complements
`@aikdna/kdna-core` (loads and renders domains as prompt text) by executing
scoring rules at runtime.

This package is **generic infrastructure** — it contains no built-in domains,
personas, or product-specific defaults. Those belong in the consuming
application.

## Quick Start

```js
const { createEvaluator } = require("@aikdna/kdna-eval");

const evaluator = createEvaluator({
  dimensions: ["clarity", "impact"],
  defaults: { clarity: 50, impact: 50 }
});

const rules = [
  { id: "length-bonus", dimensions: ["clarity"], condition: { path: "text.length", op: "gt", value: 20 }, effect: { value: 10 } }
];
const domain = { id: "my-domain", schemaVersion: 1, x_eval: { rules } };

const results = evaluator.score(
  [{ text: "A substantive segment about technology" }, { text: "short" }],
  [{ id: "my-domain", data: domain }]
);
```

## API

### Main entry (`@aikdna/kdna-eval`)

| Export | Description |
|---|---|
| `createEvaluator(options)` | Factory returning a configured evaluator with `score()` method |
| `evaluateCandidates(candidates, domains, options?)` | Score multiple candidates across multiple domains |
| `evaluateAxioms(candidate, rules, context?)` | Score a single candidate against one set of rules |
| `evaluateCondition(candidate, condition, context?)` | Match a single condition |
| `computeComposite(dimensions, weights?, dimNames?)` | Weighted dimension composite |
| `getPath(obj, pathStr)` | Dot-separated path navigation |
| `extractRules(domainData)` | Read `x_eval.rules` from domain (fallback to `axioms`) |

### Loader (`@aikdna/kdna-eval/loader`)

Flat JSON file loading from `~/.kdna/` directories. For standard `.kdna`
ZIP container loading, use `@aikdna/kdna-core`'s `loadKDNA()`.

| Export | Description |
|---|---|
| `loadFlatDomainFromFile(fileName, kdnaDir?, defaults?)` | Load a flat JSON domain file |
| `loadFlatDomainFromData(data, fileName?)` | Parse domain from object or JSON string |
| `loadFlatDomains(names, options?)` | Batch load, preserves input order |
| `listDomains(kdnaDir?)` | List `.kdna` / `.json` files |
| `loadPersona(personaId, options?)` | Load a director persona |
| `listPersonas(kdnaDir?, defaults?)` | List available personas |

### Route (`@aikdna/kdna-eval/route`)

| Export | Description |
|---|---|
| `resolveDomains(operation, options?)` | Resolve domains for an operation with overrides |
| `getRoutePolicy(operation, policies?)` | Get policy for a named operation |

## Scoring Rule Format

Rules live under `x_eval.rules` in domain data. `axioms` array at root is
accepted as a backward-compatible fallback.

```json
{
  "id": "my-domain",
  "schemaVersion": 1,
  "x_eval": {
    "rules": [{
      "id": "my-rule",
      "dimensions": ["clarity"],
      "condition": { "path": "text.length", "op": "gt", "value": 20 },
      "effect": { "value": 10 }
    }]
  }
}
```

**Condition operators:** `eq`, `gt`, `gte`, `lt`, `lte`, `between`

**Effect fields:** `value`, `multiplyBy`, `clamp.min`, `clamp.max`

## Integration with @aikdna/kdna-core

kdna-core loads/validates `.kdna` containers; kdna-eval scores:

```js
const { loadKDNA } = require("@aikdna/kdna-core");
const { createEvaluator } = require("@aikdna/kdna-eval");

const profile = await loadKDNA("my_domain.kdna", { profile: "full" });
const evaluator = createEvaluator({ dimensions: ["story", "rhythm"] });
const results = evaluator.score(candidates, [
  { id: profile.manifest.name, data: profile.domain }
]);
```

## License

Apache-2.0
